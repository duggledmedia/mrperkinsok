import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { googleEventId, status } = req.body;

  try {
    // 1. UPDATE SUPABASE
    if (googleEventId && supabaseUrl) {
         await supabase
            .from('orders')
            .update({ status: status })
            .eq('google_event_id', googleEventId);
    }

    // 2. UPDATE CALENDAR COLOR
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (clientEmail && privateKey && calendarId && googleEventId) {
         if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
         privateKey = privateKey.replace(/\\n/g, '\n');

         const jwtClient = new google.auth.JWT(clientEmail, null, privateKey, ['https://www.googleapis.com/auth/calendar']);
         await jwtClient.authorize();
         const calendar = google.calendar({ version: 'v3', auth: jwtClient });

         const colorMap = { 'pending': '5', 'shipped': '9', 'delivered': '10', 'cancelled': '11' };
         const colorId = colorMap[status] || '8';

         await calendar.events.patch({
            calendarId,
            eventId: googleEventId,
            resource: { colorId }
         });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Update failed" });
  }
}