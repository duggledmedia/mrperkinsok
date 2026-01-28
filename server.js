import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN SUPABASE ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR CRÍTICO: Faltan credenciales de Supabase en .env (SUPABASE_URL, SUPABASE_KEY)");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');
console.log("✅ Conectado a Supabase para gestión de productos.");

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
  console.warn("⚠️  ALERTA CALENDAR: Faltan credenciales en .env");
}

// --- RUTAS DE PRODUCTOS (SUPABASE) ---

// 1. OBTENER PRODUCTOS
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('product_overrides')
      .select('*');

    if (error) throw error;

    const overrides = {};
    if (data) {
        data.forEach(item => {
            overrides[item.id] = item;
        });
    }
    res.json(overrides);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// 2. ACTUALIZAR UN PRODUCTO
app.post('/api/products', async (req, res) => {
  const { id, updates } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing Product ID' });

  try {
    const payload = {
        id,
        ...updates,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('product_overrides')
        .upsert(payload)
        .select();

    if (error) throw error;

    // Devolver overrides actualizados
    const { data: allData } = await supabase.from('product_overrides').select('*');
    const overrides = {};
    if (allData) {
        allData.forEach(item => {
          overrides[item.id] = item;
        });
    }

    console.log(`📝 Producto actualizado en Supabase [${id}]:`, updates);
    res.json({ success: true, overrides });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// 3. ACTUALIZACIÓN MASIVA
app.post('/api/bulk-update', async (req, res) => {
  const { updatesArray } = req.body;
  if (!Array.isArray(updatesArray)) return res.status(400).json({ error: 'Invalid data' });

  try {
    const upsertData = updatesArray
      .filter(item => item.id && item.updates)
      .map(item => ({
        id: item.id,
        ...item.updates,
        updated_at: new Date().toISOString()
      }));

    if (upsertData.length > 0) {
        const { error } = await supabase
            .from('product_overrides')
            .upsert(upsertData);
        
        if (error) throw error;
    }

    const { data: allData } = await supabase.from('product_overrides').select('*');
    const overrides = {};
    if (allData) {
        allData.forEach(item => {
          overrides[item.id] = item;
        });
    }

    console.log(`📝 Actualización masiva en Supabase: ${upsertData.length} items.`);
    res.json({ success: true, overrides });
  } catch (error) {
    console.error("Error bulk updating:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// --- RUTAS DE CHECKOUT Y CALENDARIO ---

app.post('/api/create_preference', async (req, res) => {
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

app.post('/api/schedule_delivery', async (req, res) => {
  const { orderId, customerName, address, deliveryDate, items, total, totalCost, phone, paymentMethod, shippingMethod } = req.body;

  if (!calendarClient) {
    console.error("Intento de agendar sin configuración de calendario.");
    return res.status(503).json({ error: "Servicio de calendario no configurado" });
  }

  try {
    const startDate = `${deliveryDate}T09:00:00-03:00`;
    const endDate = `${deliveryDate}T18:00:00-03:00`;

    const description = `
🆔 ID: ${orderId}
👤 Cliente: ${customerName}
📞 Teléfono: ${phone || 'N/A'}
📍 Dirección: ${address}
🚚 Envío: ${shippingMethod === 'caba' ? 'Moto CABA' : 'Envío al Interior'}
💳 Pago: ${paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Efectivo Contra Entrega'}
💰 Total: $${total}
📉 Costo: $${totalCost || 0}

📦 Productos:
${items.map(i => `- ${i.quantity}x ${i.nombre}`).join('\n')}
    `;

    const event = {
      summary: `🚚 Entrega Mr. Perkins: ${customerName}`,
      location: address,
      description: description,
      start: { dateTime: startDate, timeZone: 'America/Argentina/Buenos_Aires' },
      end: { dateTime: endDate, timeZone: 'America/Argentina/Buenos_Aires' },
      colorId: '5',
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

app.post('/api/update_order_status', async (req, res) => {
    const { googleEventId, status } = req.body;

    if (!calendarClient) return res.status(503).json({ error: "Calendar not configured" });
    if (!googleEventId) return res.status(400).json({ error: "Missing Event ID" });

    const colorMap = { 'pending': '5', 'shipped': '9', 'delivered': '10', 'cancelled': '11' };
    const colorId = colorMap[status] || '8';

    try {
        await calendarClient.events.patch({
            calendarId: calendarId,
            eventId: googleEventId,
            resource: { colorId: colorId }
        });
        console.log(`🔄 Estado actualizado [${status}] para evento ${googleEventId}`);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error updating calendar status:", error);
        res.status(500).json({ error: "Failed to update calendar event" });
    }
});

app.listen(port, () => {
  console.log(`\n🚀 Servidor Local Mr. Perkins corriendo en: http://localhost:${port}`);
  console.log(`   Modo: SUPABASE (Sincronizado con Producción)`);
});