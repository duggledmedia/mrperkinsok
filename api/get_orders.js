import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Database config missing" });
  }

  try {
    // Fetch orders from Supabase (last 100)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Map DB columns (snake_case) to Frontend Types (camelCase)
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
      items: o.items, // JSONB array
      googleEventId: o.google_event_id,
      timestamp: new Date(o.created_at).getTime(),
      type: 'retail' // Default type
    }));

    return res.status(200).json(orders);

  } catch (error) {
    console.error("Supabase Get Orders Error:", error);
    return res.status(500).json({ error: "Error fetching orders" });
  }
}