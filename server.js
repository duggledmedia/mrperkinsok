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
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// --- CONFIGURACIÓN MERCADOPAGO ---
const accessToken = process.env.MP_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken: accessToken || 'dummy_token' });

// --- CONFIGURACIÓN GOOGLE CALENDAR ---
const calendarId = process.env.GOOGLE_CALENDAR_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let calendarClient = null;
if (clientEmail && privateKey && calendarId) {
  try {
    const jwtClient = new google.auth.JWT(clientEmail, null, privateKey, ['https://www.googleapis.com/auth/calendar']);
    calendarClient = google.calendar({ version: 'v3', auth: jwtClient });
  } catch (e) { console.error("Calendar Error", e); }
}

// RUTAS DE PRODUCTOS
app.get('/api/products', async (req, res) => {
  const { data } = await supabase.from('product_overrides').select('*');
  const overrides = {};
  if (data) data.forEach(item => overrides[item.id] = item);
  res.json(overrides);
});

app.post('/api/products', async (req, res) => {
  const { id, updates } = req.body;
  const payload = { id, ...updates, updated_at: new Date().toISOString() };
  await supabase.from('product_overrides').upsert(payload);
  res.json({ success: true });
});

app.post('/api/bulk-update', async (req, res) => {
  const { updatesArray } = req.body;
  const upsertData = updatesArray.map(item => ({ id: item.id, ...item.updates, updated_at: new Date().toISOString() }));
  await supabase.from('product_overrides').upsert(upsertData);
  res.json({ success: true });
});

// RUTAS DE PEDIDOS (AJUSTADAS AL ESQUEMA SQL)
app.post('/api/schedule_delivery', async (req, res) => {
  const { 
      orderId, customerName, phone, address, city, 
      deliveryDate, items, total, totalCost, 
      paymentMethod, shippingMethod, shippingCost, payShippingNow 
  } = req.body;

  let googleEventId = null;

  // Calendar
  if (calendarClient) {
    try {
       // ... lógica de calendar (omitida por brevedad, igual que handler) ...
       // Simplificado para local dev
    } catch (e) {}
  }

  // Supabase Insert - Estricto SQL
  const { error } = await supabase.from('orders').insert({
      id: orderId,
      customer_name: customerName,
      phone: phone || '',
      address: address || '',
      city: city || '',
      total: Number(total),
      cost: Number(totalCost),
      status: 'pending',
      payment_method: paymentMethod,
      shipping_method: shippingMethod,
      delivery_date: deliveryDate,
      items: items,
      google_event_id: googleEventId
  });

  if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
  }
  res.json({ success: true, googleEventId });
});

app.get('/api/get_orders', async (req, res) => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });

  const orders = data.map(o => ({
      id: o.id,
      customerName: o.customer_name,
      phone: o.phone,
      address: o.address,
      city: o.city,
      total: Number(o.total),
      cost: Number(o.cost),
      status: o.status,
      paymentMethod: o.payment_method,
      shippingMethod: o.shipping_method,
      deliveryDate: o.delivery_date,
      items: o.items,
      googleEventId: o.google_event_id,
      timestamp: new Date(o.created_at).getTime(),
      type: 'retail'
  }));
  res.json(orders);
});

app.post('/api/update_order_status', async (req, res) => {
    const { googleEventId, status } = req.body;
    if(googleEventId) {
        await supabase.from('orders').update({ status }).eq('google_event_id', googleEventId);
    }
    res.json({ success: true });
});

app.post('/api/create_preference', async (req, res) => {
    // ... lógica MP igual ...
    res.json({ id: 'mock', init_point: '#' });
});

app.listen(port, () => console.log(`Server running on port ${port}`));