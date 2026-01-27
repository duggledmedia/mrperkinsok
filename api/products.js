// api/products.js
// Note: In Vercel serverless environment, this in-memory object resets on cold starts. 
// For production persistence, this should be connected to a database (e.g., Supabase, MongoDB, or Google Sheets).
// This serves as a functional mock for the requested "fix" within constraints.

let memoryDb = {}; 

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(memoryDb);
  } else if (req.method === 'POST') {
    const { id, updates } = req.body;
    if (id) {
        // Merge updates
        memoryDb[id] = { ...(memoryDb[id] || {}), ...updates };
    }
    return res.json({ success: true, overrides: memoryDb });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}