import { put, list } from '@vercel/blob';

// Helper para obtener la DB desde Blob Storage
async function getDbFromBlob() {
  const { blobs } = await list({ prefix: 'db.json', limit: 1 });
  
  if (blobs.length > 0) {
    // timestamp evita el cache de la URL del blob
    const response = await fetch(`${blobs[0].url}?t=${Date.now()}`);
    return await response.json();
  }
  return {};
}

// Helper para guardar en Blob Storage
async function saveDbToBlob(data) {
  await put('db.json', JSON.stringify(data), { access: 'public', addRandomSuffix: false });
}

export default async function handler(req, res) {
  // CRITICO: Desactivar caché para ver cambios inmediatos
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
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
    if (req.method === 'GET') {
      const data = await getDbFromBlob();
      return res.status(200).json(data);
    } 
    
    else if (req.method === 'POST') {
      const { id, updates } = req.body;
      
      if (!id) return res.status(400).json({ error: 'Falta ID' });

      const currentData = await getDbFromBlob();
      
      const updatedData = {
        ...currentData,
        [id]: { ...(currentData[id] || {}), ...updates }
      };

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