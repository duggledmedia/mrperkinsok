import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, customerName, phone, address, city, deliveryDate, items, total, totalCost, paymentMethod, shippingMethod, shippingCost, payShippingNow } = req.body;

  // Construir descripción detallada
  let shippingDetails = '';
  if (shippingMethod === 'caba') {
      shippingDetails = `Moto CABA ($${shippingCost}). ${payShippingNow ? '✅ PAGADO EN COMPRA' : '❗ COBRAR ENVÍO AL ENTREGAR'}`;
  } else if (shippingMethod === 'pickup') {
      shippingDetails = `Retiro por Local (Belgrano). Gratis.`;
  } else {
      shippingDetails = `Interior (Via Cargo). ❗ COBRAR ENVÍO EN DESTINO.`;
  }

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

        // Parse date for calendar (Assuming 'YYYY-MM-DD HH:MM')
        // deliveryDate comes as "YYYY-MM-DD HH:MM" or just "YYYY-MM-DD"
        let startDateTime, endDateTime;
        
        if (deliveryDate.includes(' ')) {
            // Specific time slot
            const [datePart, timePart] = deliveryDate.split(' ');
            startDateTime = `${datePart}T${timePart}:00-03:00`;
            // 1 hour slot for specific time
            const [hours, minutes] = timePart.split(':').map(Number);
            const endHours = hours + 1;
            endDateTime = `${datePart}T${endHours}:${minutes}:00-03:00`;
        } else {
            // All day / broad slot fallback
            startDateTime = `${deliveryDate}T09:00:00-03:00`;
            endDateTime = `${deliveryDate}T18:00:00-03:00`;
        }

        const description = `
🆔 ID: ${orderId}
👤 Cliente: ${customerName}
📞 Teléfono: ${phone || 'N/A'}
📍 Dirección: ${address}, ${city || ''}
🚚 Envío: ${shippingDetails}
💳 Pago: ${paymentMethod === 'mercadopago' ? 'MercadoPago (Online)' : 'Efectivo (Contra Entrega)'}
💰 Total Pedido: $${total}

📦 Items:
${items.map(i => `- ${i.quantity}x ${i.nombre}`).join('\n')}
        `;

        const event = {
            summary: `🛍️ Pedido Mr. Perkins: ${customerName}`,
            location: `${address}, ${city || ''}`,
            description: description,
            start: { dateTime: startDateTime, timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: endDateTime, timeZone: 'America/Argentina/Buenos_Aires' },
            colorId: paymentMethod === 'mercadopago' ? '10' : '5', // 10=Green (Paid), 5=Yellow (Pending Cash)
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