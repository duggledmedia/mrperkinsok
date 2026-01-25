import { google } from 'googleapis';

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, customerName, address, deliveryDate, items, total } = req.body;

  // Obtener credenciales de variables de entorno
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey || !calendarId) {
    console.error("Faltan credenciales de Google Calendar en variables de entorno.");
    return res.status(500).json({ error: "Configuración del servidor incompleta" });
  }

  try {
    // Autenticación JWT
    const jwtClient = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar']
    );

    await jwtClient.authorize();
    
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    // Configurar fechas (9 AM a 6 PM hora Argentina)
    const startDate = `${deliveryDate}T09:00:00-03:00`;
    const endDate = `${deliveryDate}T18:00:00-03:00`;

    const description = `
🆔 Pedido: ${orderId}
👤 Cliente: ${customerName}
📍 Dirección: ${address}
💰 Total: ${total}

📦 Productos:
${items.map(i => `- ${i.quantity}x ${i.nombre}`).join('\n')}
    `;

    const event = {
      summary: `🚚 Entrega Mr. Perkins: ${customerName}`,
      location: address,
      description: description,
      start: { dateTime: startDate, timeZone: 'America/Argentina/Buenos_Aires' },
      end: { dateTime: endDate, timeZone: 'America/Argentina/Buenos_Aires' },
      colorId: '5', // Amarillo
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    return res.status(200).json({ success: true, link: response.data.htmlLink });

  } catch (error) {
    console.error("Error en Google Calendar API:", error);
    return res.status(500).json({ error: error.message || "Error al agendar evento" });
  }
}