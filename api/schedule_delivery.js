import { google } from 'googleapis';

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, customerName, address, deliveryDate, items, total } = req.body;

  // 1. OBTENCIÓN DE CREDENCIALES
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // 2. LIMPIEZA Y FORMATEO DE LA CLAVE PRIVADA (CRÍTICO)
  if (privateKey) {
    // Si el usuario copió las comillas del JSON por error, las quitamos
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Vercel a veces guarda los saltos de línea como la cadena literal "\n".
    // Los reemplazamos por saltos de línea reales.
    // Si la clave ya tiene saltos de línea reales, esto no afectará.
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // 3. VALIDACIÓN
  if (!clientEmail || !privateKey || !calendarId) {
    const missing = [];
    if (!clientEmail) missing.push("GOOGLE_CLIENT_EMAIL");
    if (!privateKey) missing.push("GOOGLE_PRIVATE_KEY");
    if (!calendarId) missing.push("GOOGLE_CALENDAR_ID");
    
    console.error(`❌ Faltan credenciales de Google Calendar en Vercel: ${missing.join(', ')}`);
    return res.status(500).json({ error: "Error de configuración del servidor (Credenciales faltantes)" });
  }

  try {
    // 4. AUTENTICACIÓN
    const jwtClient = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar']
    );

    // Intentar autorizar para verificar que la clave es válida antes de llamar a la API
    await jwtClient.authorize();
    
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    // 5. PREPARACIÓN DEL EVENTO
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
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 }, // Notificación exacta a la hora de entrega (9 AM)
          { method: 'popup', minutes: 30 }, // Recordatorio 30 min antes
        ],
      },
    };

    // 6. INSERCIÓN EN CALENDARIO
    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    console.log(`✅ Evento creado exitosamente: ${response.data.htmlLink}`);
    return res.status(200).json({ success: true, link: response.data.htmlLink });

  } catch (error) {
    console.error("❌ Error en Google Calendar API:", error.message);
    
    // Diagnóstico específico para el usuario
    if (error.message.includes('PEM')) {
        console.error("💡 Pista: La GOOGLE_PRIVATE_KEY tiene un formato inválido. Asegúrate de copiar todo, incluyendo -----BEGIN... y -----END... y reemplazar los \\n correctamente.");
    }
    if (error.code === 404) {
        console.error(`💡 Pista: No se encontró el calendario con ID: ${calendarId}. Revisa la variable GOOGLE_CALENDAR_ID.`);
    }
    if (error.code === 403) {
        console.error(`💡 Pista: Permiso denegado. Asegúrate de que el calendario ${calendarId} esté compartido con ${clientEmail} con permisos de "Realizar cambios en eventos".`);
    }

    return res.status(500).json({ error: "No se pudo agendar el envío. Revise los logs del servidor." });
  }
}