import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { 
      orderId, customerName, phone, address, city, 
      deliveryDate, items, total, totalCost, 
      paymentMethod, shippingMethod, shippingCost, payShippingNow 
  } = req.body;

  let googleEventId = null;

  // --- 1. GOOGLE CALENDAR (Opcional - Visual) ---
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && privateKey && calendarId) {
    try {
        let shippingDetails = '';
        if (shippingMethod === 'caba') {
            shippingDetails = `Moto CABA ($${shippingCost}). ${payShippingNow ? '✅ PAGADO' : '❗ COBRAR AL ENTREGAR'}`;
        } else if (shippingMethod === 'pickup') {
            shippingDetails = `Retiro por Local (Belgrano). Gratis.`;
        } else {
            shippingDetails = `Interior (Via Cargo). ❗ COBRAR ENVÍO EN DESTINO.`;
        }

        if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
        privateKey = privateKey.replace(/\\n/g, '\n');

        const jwtClient = new google.auth.JWT(clientEmail, null, privateKey, ['https://www.googleapis.com/auth/calendar']);
        await jwtClient.authorize();
        const calendar = google.calendar({ version: 'v3', auth: jwtClient });

        // Parsear fechas
        let startDateTime, endDateTime;
        if (deliveryDate.includes(' ')) {
            const [datePart, timePart] = deliveryDate.split(' ');
            startDateTime = `${datePart}T${timePart}:00-03:00`;
            const [hours, minutes] = timePart.split(':').map(Number);
            endDateTime = `${datePart}T${hours + 1}:${minutes}:00-03:00`;
        } else {
            startDateTime = `${deliveryDate}T09:00:00-03:00`;
            endDateTime = `${deliveryDate}T18:00:00-03:00`;
        }

        const description = `
🆔 ID: ${orderId}
👤 Cliente: ${customerName}
📞 Teléfono: ${phone || 'N/A'}
📍 Dirección: ${address}, ${city || ''}
🚚 Envío: ${shippingDetails}
💳 Pago: ${paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Efectivo'}
💰 Total: $${total}

📦 Items:
${items.map(i => `- ${i.quantity}x ${i.nombre}`).join('\n')}
        `;

        const event = {
            summary: `🛍️ ${customerName} ($${total})`,
            location: `${address}, ${city || ''}`,
            description: description,
            start: { dateTime: startDateTime, timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: endDateTime, timeZone: 'America/Argentina/Buenos_Aires' },
            colorId: paymentMethod === 'mercadopago' ? '10' : '5', 
        };

        const calendarRes = await calendar.events.insert({ calendarId, resource: event });
        googleEventId = calendarRes.data.id;
    } catch (calError) {
        console.error("Calendar Error (Non-blocking):", calError.message);
    }
  }

  // --- 2. SUPABASE (Estricto según SQL proporcionado) ---
  if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Faltan credenciales de base de datos." });
  }

  try {
      const { error } = await supabase.from('orders').insert({
          id: orderId,
          customer_name: customerName, // text
          phone: phone || '', // text
          address: address || '', // text
          city: city || '', // text
          total: Number(total), // numeric
          cost: Number(totalCost), // numeric
          status: 'pending', // text
          payment_method: paymentMethod, // text
          shipping_method: shippingMethod, // text
          delivery_date: deliveryDate, // text
          items: items, // jsonb (Supabase lo serializa automático)
          google_event_id: googleEventId // text
          // created_at es default now()
      });

      if (error) throw error;

      return res.status(200).json({ success: true, googleEventId });

  } catch (error) {
      console.error("Database Insert Error:", error);
      return res.status(500).json({ error: "Error al guardar el pedido en la base de datos." });
  }
}