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
  // Intento robusto de limpiar la clave privada
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (privateKey) {
      // Si la clave está entre comillas dobles literales, quitarlas
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
      }
      // Reemplazar saltos de línea literales (\n) por saltos reales
      privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!clientEmail || !privateKey || !calendarId) {
    const missing = [];
    if (!clientEmail) missing.push("GOOGLE_CLIENT_EMAIL");
    if (!privateKey) missing.push("GOOGLE_PRIVATE_KEY");
    if (!calendarId) missing.push("GOOGLE_CALENDAR_ID");
    
    console.error(`❌ Faltan credenciales de Google Calendar: ${missing.join(', ')}`);
    return res.status(500).json({ error: "Configuración del servidor incompleta (Variables de Entorno)" });
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

    console.log(`✅ Evento creado exitosamente: ${response.data.htmlLink}`);
    return res.status(200).json({ success: true, link: response.data.htmlLink });

  } catch (error) {
    console.error("❌ Error en Google Calendar API:", error);
    // Errores comunes de Google API para dar feedback
    if (error.code === 404) {
        console.error("💡 Pista: ¿El calendario ID es correcto?");
    }
    if (error.code === 403) {
        console.error("💡 Pista: ¿Compartiste el calendario con el client_email?");
    }
    return res.status(500).json({ error: error.message || "Error al agendar evento" });
  }
}