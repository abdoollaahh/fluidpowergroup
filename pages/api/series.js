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
      let categorySlug;
      
      if (req.method === 'POST') {
        // Get id from request body (as your current code uses POST)
        categorySlug = req.body.id;
      } else {
        // Get categoryId from query parameters
        categorySlug = req.query.categoryId || req.query.id;
      }
      
      if (!categorySlug) {
        return res.status(400).json({ error: 'Category slug is required' });
      }
  
      console.log('Fetching series for category slug:', categorySlug);
  
      // First, fetch all categories
      const categoriesResponse = await fetch('https://fluidpowergroup.com.au/api/getCategories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!categoriesResponse.ok) {
        throw new Error(`HTTP error! status: ${categoriesResponse.status}`);
      }
  
      const data = await categoriesResponse.json();
      
      // Find the category by slug
      const category = data.categories.find(cat => cat.slug === categorySlug);
      
      if (!category) {
        console.log('Category not found for slug:', categorySlug);
        return res.status(404).json({ 
          error: 'Category not found',
          series: [] 
        });
      }
  
      // The series data is actually in the subCategories array
      const series = category.subCategories || [];
      
      console.log(`Found ${series.length} series for category ${categorySlug}`);
      
      // Return data in the format your frontend expects
      res.status(200).json({ series: series });
    } catch (error) {
      console.error('Error fetching series:', error);
      res.status(500).json({ 
        error: 'Failed to fetch series',
        details: error.message,
        series: [] // Return empty array to prevent frontend errors
      });
    }
  }