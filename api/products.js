import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default async function handler(req, res) {
  // Configuración de Headers y CORS
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Faltan credenciales de Supabase");
    return res.status(500).json({ error: "Database configuration missing" });
  }

  try {
    // --- GET: OBTENER TODOS LOS PRODUCTOS ---
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('product_overrides')
        .select('*');

      if (error) throw error;

      // Transformar array de Supabase a Objeto Key-Value para el frontend
      // Formato esperado: { "prod-id-1": { stock: 10, ... }, "prod-id-2": { ... } }
      const overrides = {};
      data.forEach(item => {
        overrides[item.id] = item;
      });

      return res.status(200).json(overrides);
    } 
    
    // --- POST: ACTUALIZAR UN PRODUCTO ---
    else if (req.method === 'POST') {
      const { id, updates } = req.body;
      
      if (!id) return res.status(400).json({ error: 'Falta ID' });

      // Preparar datos para Upsert (Insertar o Actualizar)
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

      // Devolver estado actual completo para que el frontend actualice su caché
      // (Reutilizamos lógica de GET para consistencia o devolvemos éxito simple)
      const { data: allData } = await supabase.from('product_overrides').select('*');
      const overrides = {};
      if (allData) {
          allData.forEach(item => {
            overrides[item.id] = item;
          });
      }

      return res.status(200).json({ success: true, overrides });
    } 
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Supabase Error:", error);
    return res.status(500).json({ error: "Database Error", details: error.message });
  }
}