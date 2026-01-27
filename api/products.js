import { put, list } from '@vercel/blob';

// Helper para obtener la DB desde Blob Storage
async function getDbFromBlob() {
  // Buscamos el archivo db.json en el bucket
  const { blobs } = await list({ prefix: 'db.json', limit: 1 });
  
  if (blobs.length > 0) {
    // Si existe, descargamos su contenido
    const response = await fetch(blobs[0].url);
    return await response.json();
  }
  
  // Si no existe, retornamos objeto vacío
  return {};
}

// Helper para guardar en Blob Storage
async function saveDbToBlob(data) {
  // addRandomSuffix: false asegura que sobrescribimos el archivo "db.json" lógico
  // access: 'public' es necesario para poder leerlo luego vía fetch
  await put('db.json', JSON.stringify(data), { access: 'public', addRandomSuffix: false });
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. OBTENER DATOS (GET)
    if (req.method === 'GET') {
      const data = await getDbFromBlob();
      return res.status(200).json(data);
    } 
    
    // 2. ACTUALIZAR UN PRODUCTO (POST)
    else if (req.method === 'POST') {
      const { id, updates } = req.body;
      
      if (!id) return res.status(400).json({ error: 'Falta ID' });

      // Obtenemos estado actual
      const currentData = await getDbFromBlob();
      
      // Merge del producto especifico
      const updatedData = {
        ...currentData,
        [id]: { ...(currentData[id] || {}), ...updates }
      };

      // Guardamos en Blob
      await saveDbToBlob(updatedData);

      return res.status(200).json({ success: true, overrides: updatedData });
    } 
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Vercel Blob Error:", error);
    return res.status(500).json({ error: "Storage Error", details: error.message });
  }
}