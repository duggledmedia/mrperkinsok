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
  console.error("❌ ERROR CRÍTICO: Faltan credenciales de Supabase en .env");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');
console.log("✅ Conectado a Supabase (Productos y Pedidos).");

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

// ==========================================
// RUTAS DE PRODUCTOS
// ==========================================

app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase.from('product_overrides').select('*');
    if (error) throw error;
    const overrides = {};
    if (data) data.forEach(item => overrides[item.id] = item);
    res.json(overrides);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post('/api/products', async (req, res) => {
  const { id, updates } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing Product ID' });
  try {
    const payload = { id, ...updates, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('product_overrides').upsert(payload);
    if (error) throw error;
    
    const { data: allData } = await supabase.from('product_overrides').select('*');
    const overrides = {};
    if (allData) allData.forEach(item => overrides[item.id] = item);
    res.json({ success: true, overrides });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post('/api/bulk-update', async (req, res) => {
  const { updatesArray } = req.body;
  if (!Array.isArray(updatesArray)) return res.status(400).json({ error: 'Invalid data' });
  try {
    const upsertData = updatesArray
      .filter(item => item.id && item.updates)
      .map(item => ({ id: item.id, ...item.updates, updated_at: new Date().toISOString() }));

    if (upsertData.length > 0) {
        const { error } = await supabase.from('product_overrides').upsert(upsertData);
        if (error) throw error;
    }
    const { data: allData } = await supabase.from('product_overrides').select('*');
    const overrides = {};
    if (allData) allData.forEach(item => overrides[item.id] = item);
    res.json({ success: true, overrides });
  } catch (error) {
    console.error("Error bulk updating:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ==========================================
// RUTAS DE PEDIDOS (SUPABASE + CALENDAR)
// ==========================================

// 1. CREAR PEDIDO
app.post('/api/schedule_delivery', async (req, res) => {
  const { orderId, customerName, address, city, deliveryDate, items, total, totalCost, phone, paymentMethod, shippingMethod } = req.body;

  let googleEventId = null;

  // 1. Intentar crear en Google Calendar (Visual)
  if (calendarClient) {
    try {
      const startDate = `${deliveryDate}T09:00:00-03:00`;
      const endDate = `${deliveryDate}T18:00:00-03:00`;
      const description = `🆔 ID: ${orderId}\n👤 Cliente: ${customerName}\n📞 Teléfono: ${phone || 'N/A'}\n📍 Dirección: ${address}, ${city}\n💰 Total: $${total}\n📦 Items:\n${items.map(i => `- ${i.quantity}x ${i.nombre}`).join('\n')}`;
      
      const event = {
        summary: `🛍️ Pedido Mr. Perkins: ${customerName}`,
        location: `${address}, ${city}`,
        description: description,
        start: { dateTime: startDate, timeZone: 'America/Argentina/Buenos_Aires' },
        end: { dateTime: endDate, timeZone: 'America/Argentina/Buenos_Aires' },
        colorId: paymentMethod === 'mercadopago' ? '10' : '5',
      };

      const response = await calendarClient.events.insert({ calendarId, resource: event });
      googleEventId = response.data.id;
      console.log(`📅 Evento creado en Calendar: ${googleEventId}`);
    } catch (error) {
      console.error("⚠️ Falló Calendar (pero seguiremos con Supabase):", error.message);
    }
  }

  // 2. Guardar en Supabase (Fuente de Verdad)
  try {
    const { error } = await supabase.from('orders').insert({
      id: orderId,
      customer_name: customerName,
      phone,
      address,
      city,
      total,
      cost: totalCost,
      status: 'pending', // Default status
      payment_method: paymentMethod,
      shipping_method: shippingMethod,
      delivery_date: deliveryDate,
      items: items, // JSONB
      google_event_id: googleEventId
    });

    if (error) throw error;
    console.log(`💾 Pedido guardado en Supabase: ${orderId}`);
    res.json({ success: true, googleEventId });

  } catch (error) {
    console.error("❌ Error guardando orden en Supabase:", error);
    res.status(500).json({ error: "Error de Base de Datos" });
  }
});

// 2. OBTENER PEDIDOS
app.get('/api/get_orders', async (req, res) => {
  try {
    // Leemos directo de Supabase, ordenado por fecha
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Mapeamos snake_case (DB) a camelCase (Frontend)
    const orders = data.map(o => ({
      id: o.id,
      customerName: o.customer_name,
      phone: o.phone,
      address: o.address,
      city: o.city,
      total: o.total,
      cost: o.cost,
      status: o.status,
      paymentMethod: o.payment_method,
      shippingMethod: o.shipping_method,
      deliveryDate: o.delivery_date,
      items: o.items,
      googleEventId: o.google_event_id,
      timestamp: new Date(o.created_at).getTime()
    }));

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// 3. ACTUALIZAR ESTADO
app.post('/api/update_order_status', async (req, res) => {
    const { googleEventId, status } = req.body; // En local usamos googleEventId para buscar, o podríamos pasar el Order ID

    try {
        // 1. Actualizar Supabase (Buscamos por googleEventId o ID si lo tuvieramos, el front manda googleEventId a veces)
        // El front en updateOrderStatus pasa googleEventId. Lo ideal sería pasar orderId.
        // Asumiremos que tenemos el googleEventId para vincular. 
        // *MEJORA*: El front debería pasar el Order ID para DB update.
        // Pero para mantener compatibilidad con el código actual del front:
        
        if (googleEventId) {
             const { error } = await supabase
                .from('orders')
                .update({ status: status })
                .eq('google_event_id', googleEventId);
             
             if(error) console.error("Error updating Supabase status:", error);
        }

        // 2. Actualizar Calendar (Visual)
        if (calendarClient && googleEventId) {
            const colorMap = { 'pending': '5', 'shipped': '9', 'delivered': '10', 'cancelled': '11' };
            const colorId = colorMap[status] || '8';
            
            await calendarClient.events.patch({
                calendarId: calendarId,
                eventId: googleEventId,
                resource: { colorId: colorId }
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error updating status:", error);
        res.status(500).json({ error: "Update failed" });
    }
});

// --- MP PREFERENCE ---
app.post('/api/create_preference', async (req, res) => {
  try {
    const { items, shippingCost, external_reference } = req.body;
    const mpItems = items.map(item => ({
      title: item.title,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      currency_id: 'ARS'
    }));
    if (shippingCost > 0) mpItems.push({ title: "Costo de Envío", unit_price: Number(shippingCost), quantity: 1, currency_id: 'ARS' });

    const body = {
      items: mpItems,
      back_urls: { success: "http://localhost:5173", failure: "http://localhost:5173", pending: "http://localhost:5173" },
      auto_return: "approved",
      external_reference: external_reference,
      statement_descriptor: "MR PERKINS",
      payment_methods: { excluded_payment_types: [{ id: "ticket" }], installments: 6 }
    };
    const preference = new Preference(client);
    const result = await preference.create({ body });
    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    res.status(500).json({ error: "Error MercadoPago" });
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Servidor Local Mr. Perkins corriendo en: http://localhost:${port}`);
  console.log(`   Modo: SUPABASE TOTAL (Productos y Pedidos)`);
});