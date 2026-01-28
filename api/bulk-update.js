import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Database configuration missing" });
  }

  try {
    const { updatesArray } = req.body;
    
    if (!Array.isArray(updatesArray)) {
      return res.status(400).json({ error: 'updatesArray must be an array' });
    }

    // Preparar payload masivo para Supabase
    // Supabase permite pasar un array de objetos a .upsert()
    const upsertData = updatesArray
      .filter(item => item.id && item.updates)
      .map(item => ({
        id: item.id,
        ...item.updates,
        updated_at: new Date().toISOString()
      }));

    if (upsertData.length === 0) {
        return res.status(200).json({ success: true, message: "Nothing to update" });
    }

    const { error } = await supabase
      .from('product_overrides')
      .upsert(upsertData);

    if (error) throw error;

    // Obtener estado actualizado
    const { data: allData } = await supabase.from('product_overrides').select('*');
    const overrides = {};
    if (allData) {
        allData.forEach(item => {
          overrides[item.id] = item;
        });
    }

    return res.status(200).json({ success: true, overrides });

  } catch (error) {
    console.error("Supabase Bulk Update Error:", error);
    return res.status(500).json({ error: "Error updating storage", details: error.message });
  }
}