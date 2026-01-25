import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN MERCADOPAGO ---
const accessToken = process.env.MP_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ 
  accessToken: accessToken || 'dummy_token' 
});

if (!accessToken || accessToken.includes('000000')) {
  console.warn("⚠️  ALERTA MP: Token no configurado en .env");
} else {
  console.log("✅ MercadoPago activo.");
}

// --- CONFIGURACIÓN GOOGLE CALENDAR ---
const calendarId = process.env.GOOGLE_CALENDAR_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
// Manejo seguro de saltos de línea en la clave privada
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let calendarClient = null;

if (clientEmail && privateKey && calendarId) {
  try {
    const jwtClient = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar']
    );
    
    calendarClient = google.calendar({ version: 'v3', auth: jwtClient });
    console.log("✅ Google Calendar API activa para:", calendarId);
  } catch (error) {
    console.error("❌ Error configurando Google Calendar:", error.message);
  }
} else {
  console.warn("⚠️  ALERTA CALENDAR: Faltan credenciales en .env (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID)");
}

// --- RUTAS ---

// 1. Crear Preferencia de Pago (MercadoPago)
app.post('/create_preference', async (req, res) => {
  try {
    const { items, shippingCost, external_reference } = req.body;
    console.log(`🛒 Procesando pago para orden: ${external_reference}`);

    const mpItems = items.map(item => ({
      title: item.title,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      currency_id: 'ARS'
    }));

    if (shippingCost > 0) {
      mpItems.push({
        title: "Costo de Envío",
        unit_price: Number(shippingCost),
        quantity: 1,
        currency_id: 'ARS'
      });
    }

    const body = {
      items: mpItems,
      back_urls: {
        success: "http://localhost:5173",
        failure: "http://localhost:5173",
        pending: "http://localhost:5173"
      },
      auto_return: "approved",
      external_reference: external_reference,
      statement_descriptor: "MR PERKINS",
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }],
        installments: 6
      }
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error("❌ Error MP:", error);
    res.status(500).json({ error: "Error al conectar con MercadoPago" });
  }
});

// 2. Agendar Entrega (Google Calendar)
app.post('/schedule_delivery', async (req, res) => {
  const { orderId, customerName, address, deliveryDate, items, total } = req.body;

  if (!calendarClient) {
    return res.status(503).json({ error: "Servicio de calendario no configurado" });
  }

  try {
    console.log(`📅 Agendando entrega para ${customerName} el ${deliveryDate}`);

    // Parsear fecha (asumiendo YYYY-MM-DD) y establecer hora (ej: 9 AM a 6 PM)
    // Nota: deliveryDate viene del input type="date" (YYYY-MM-DD)
    const startDate = `${deliveryDate}T09:00:00-03:00`; // Hora Argentina
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
      colorId: '5', // 5 es Amarillo (Gold) en Google Calendar
    };

    const response = await calendarClient.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    console.log(`✅ Evento creado: ${response.data.htmlLink}`);
    res.json({ success: true, link: response.data.htmlLink });

  } catch (error) {
    console.error("❌ Error Calendar:", error);
    res.status(500).json({ error: "No se pudo agendar en el calendario" });
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Backend Mr. Perkins corriendo en: http://localhost:${port}\n`);
});