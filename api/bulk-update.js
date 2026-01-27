import { put, list } from '@vercel/blob';

async function getDbFromBlob() {
  const { blobs } = await list({ prefix: 'db.json', limit: 1 });
  if (blobs.length > 0) {
    const response = await fetch(`${blobs[0].url}?t=${Date.now()}`);
    return await response.json();
  }
  return {};
}

async function saveDbToBlob(data) {
  await put('db.json', JSON.stringify(data), { access: 'public', addRandomSuffix: false });
}

export default async function handler(req, res) {
  // CRITICO: Desactivar caché
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

  try {
    const { updatesArray } = req.body;
    
    if (!Array.isArray(updatesArray)) {
      return res.status(400).json({ error: 'updatesArray must be an array' });
    }

    const currentData = await getDbFromBlob();
    
    updatesArray.forEach(item => {
        if (item.id && item.updates) {
           currentData[item.id] = { ...(currentData[item.id] || {}), ...item.updates };
        }
    });

    await saveDbToBlob(currentData);

    return res.status(200).json({ success: true, overrides: currentData });

  } catch (error) {
    console.error("Vercel Blob Bulk Update Error:", error);
    return res.status(500).json({ error: "Error updating storage", details: error.message });
  }
}