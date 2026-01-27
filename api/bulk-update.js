// api/bulk-update.js
// Mock in-memory DB for Vercel/Serverless where persistent file writing isn't available.
// This prevents 404 errors in deployed environments.

let memoryDb = {}; 

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { updatesArray } = req.body;
    
    if (!Array.isArray(updatesArray)) {
      return res.status(400).json({ error: 'updatesArray must be an array' });
    }

    updatesArray.forEach(item => {
        if (item.id && item.updates) {
           memoryDb[item.id] = { ...(memoryDb[item.id] || {}), ...item.updates };
        }
    });

    return res.json({ success: true, overrides: memoryDb });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}