import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, customerName, phone, address, city, deliveryDate, items, total, totalCost, paymentMethod, shippingMethod } = req.body;

  // --- 1. GOOGLE CALENDAR (VISUAL / AGENDA) ---
  let googleEventId = null;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && privateKey && calendarId) {
    try {
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
        privateKey = privateKey.replace(/\\n/g, '\n');

        const jwtClient = new google.auth.JWT(clientEmail, null, privateKey, ['https://www.googleapis.com/auth/calendar']);
        await jwtClient.authorize();
        const calendar = google.calendar({ version: 'v3', auth: jwtClient });

        const startDate = `${deliveryDate}T09:00:00-03:00`;
        const endDate = `${deliveryDate}T18:00:00-03:00`;
        const description = `🆔 ID: ${orderId}\n👤 Cliente: ${customerName}\n📞 Teléfono: ${phone || 'N/A'}\n📍 Dirección: ${address}, ${city || ''}\n🚚 Envío: ${shippingMethod}\n💳 Pago: ${paymentMethod}\n💰 Total: $${total}\n📦 Items:\n${items.map(i => `- ${i.quantity}x ${i.nombre}`).join('\n')}`;

        const event = {
            summary: `🛍️ Pedido Mr. Perkins: ${customerName}`,
            location: `${address}, ${city || ''}`,
            description: description,
            start: { dateTime: startDate, timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: endDate, timeZone: 'America/Argentina/Buenos_Aires' },
            colorId: paymentMethod === 'mercadopago' ? '10' : '5',
        };

        const response = await calendar.events.insert({ calendarId, resource: event });
        googleEventId = response.data.id;
    } catch (e) {
        console.error("Calendar sync failed (non-fatal):", e.message);
    }
  }

  // --- 2. SUPABASE (DATABASE SOURCE OF TRUTH) ---
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "DB Config missing" });

  try {
      const { error } = await supabase.from('orders').insert({
          id: orderId,
          customer_name: customerName,
          phone,
          address,
          city,
          total,
          cost: totalCost,
          status: 'pending',
          payment_method: paymentMethod,
          shipping_method: shippingMethod,
          delivery_date: deliveryDate,
          items: items,
          google_event_id: googleEventId
      });

      if (error) throw error;

      return res.status(200).json({ success: true, googleEventId });
  } catch (error) {
      console.error("Supabase Insert Error:", error);
      return res.status(500).json({ error: "Failed to save order to database" });
  }
}