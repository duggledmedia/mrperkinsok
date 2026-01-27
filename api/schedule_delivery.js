import { google } from 'googleapis';

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, customerName, phone, address, city, deliveryDate, items, total, paymentMethod, shippingMethod } = req.body;

  // 1. OBTENCIÓN DE CREDENCIALES
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
    console.error("❌ Faltan credenciales de Google Calendar");
    return res.status(500).json({ error: "Configuración de calendario incompleta" });
  }

  try {
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

    // FORMATO DE DESCRIPCIÓN ESTRUCTURADO PARA PODER LEERLO LUEGO
    const description = `
🆔 ID: ${orderId}
👤 Cliente: ${customerName}
📞 Teléfono: ${phone || 'N/A'}
📍 Dirección: ${address}, ${city || ''}
🚚 Envío: ${shippingMethod === 'caba' ? 'Moto CABA' : 'Envío al Interior'}
💳 Pago: ${paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Efectivo Contra Entrega'}
💰 Total: $${total}

📦 Items:
${items.map(i => `- ${i.quantity}x ${i.nombre}`).join('\n')}
    `;

    const event = {
      summary: `🛍️ Pedido Mr. Perkins: ${customerName}`,
      location: `${address}, ${city || ''}`,
      description: description,
      start: { dateTime: startDate, timeZone: 'America/Argentina/Buenos_Aires' },
      end: { dateTime: endDate, timeZone: 'America/Argentina/Buenos_Aires' },
      colorId: paymentMethod === 'mercadopago' ? '10' : '5', // Verde (10) si pagó, Amarillo (5) si es efectivo
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    console.log(`✅ Evento creado: ${response.data.htmlLink}`);
    return res.status(200).json({ success: true, link: response.data.htmlLink });

  } catch (error) {
    console.error("❌ Error en Google Calendar API:", error.message);
    return res.status(500).json({ error: "No se pudo agendar el envío." });
  }
}