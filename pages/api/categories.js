// pages/api/categories.js
export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    try {
      const response = await fetch('https://fluidpowergroup.com.au/api/getCategories');
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }