// pages/api/series.js
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    try {
      // Handle both GET and POST methods
      let categoryId;
      
      if (req.method === 'POST') {
        // Get id from request body (as your current code uses POST)
        categoryId = req.body.id;
      } else {
        // Get categoryId from query parameters
        categoryId = req.query.categoryId || req.query.id;
      }
      
      if (!categoryId) {
        return res.status(400).json({ error: 'Category ID is required' });
      }
  
      console.log('Fetching series for category ID:', categoryId);
  
      // Fetch from the actual API
      const response = await fetch(`https://fluidpowergroup.com.au/api/getSeries?categoryId=${categoryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any required headers for the external API
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Return data in the format your frontend expects
      res.status(200).json({ series: data });
    } catch (error) {
      console.error('Error fetching series:', error);
      res.status(500).json({ 
        error: 'Failed to fetch series',
        details: error.message,
        series: [] // Return empty array to prevent frontend errors
      });
    }
  }