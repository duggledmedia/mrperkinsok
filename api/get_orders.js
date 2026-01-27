import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!clientEmail || !privateKey || !calendarId) {
    return res.status(500).json({ error: "Configuración incompleta" });
  }

  try {
    const jwtClient = new google.auth.JWT(clientEmail, null, privateKey, ['https://www.googleapis.com/auth/calendar.readonly']);
    await jwtClient.authorize();
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    // Traer eventos de los últimos 30 días y los próximos 30 días
    const now = new Date();
    const minDate = new Date(); minDate.setDate(now.getDate() - 30);
    const maxDate = new Date(); maxDate.setDate(now.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: minDate.toISOString(),
      timeMax: maxDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    });

    const orders = response.data.items.map(event => {
       const desc = event.description || '';
       
       // Regex simple para extraer datos del formato estructurado en schedule_delivery.js
       const idMatch = desc.match(/🆔 ID: (.*)/);
       const clientMatch = desc.match(/👤 Cliente: (.*)/);
       const totalMatch = desc.match(/💰 Total: \$(.*)/);
       const paymentMatch = desc.match(/💳 Pago: (.*)/);
       const addressMatch = desc.match(/📍 Dirección: (.*)/);

       if (!idMatch) return null; // No es un pedido nuestro

       return {
         id: idMatch[1].trim(),
         customerName: clientMatch ? clientMatch[1].trim() : 'Desconocido',
         total: totalMatch ? Number(totalMatch[1].replace(/\./g,'').trim()) : 0,
         status: 'pending', // Asumimos pending al recuperar
         paymentMethod: paymentMatch && paymentMatch[1].includes('MercadoPago') ? 'mercadopago' : 'cash',
         address: addressMatch ? addressMatch[1].trim() : '',
         deliveryDate: event.start.dateTime ? event.start.dateTime.split('T')[0] : '',
         items: [], // No parseamos items en detalle para la lista rápida, pero podríamos
         type: 'retail',
         timestamp: new Date(event.created).getTime()
       };
    }).filter(o => o !== null);

    // Ordenar por fecha de creación descendente
    orders.sort((a, b) => b.timestamp - a.timestamp);

    return res.status(200).json(orders);

  } catch (error) {
    console.error("Error fetching calendar orders:", error);
    return res.status(500).json({ error: "Error al sincronizar calendario" });
  }
}