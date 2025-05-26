// pages/api/categories.js
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
      console.log('[Categories API] Starting fetch...');
      const startTime = Date.now();
      
      // Simple fetch without abort controller
      const response = await fetch('https://fluidpowergroup.com.au/api/getCategories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const fetchTime = Date.now() - startTime;
      console.log(`[Categories API] Fetch completed in ${fetchTime}ms`);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      const parseTime = Date.now() - startTime - fetchTime;
      console.log(`[Categories API] JSON parsed in ${parseTime}ms`);
      
      // Log data structure
      console.log(`[Categories API] Data structure:`, {
        categoriesCount: data.categories?.length || 0,
        firstCategoryName: data.categories?.[0]?.title || 'N/A',
        firstCategorySubCount: data.categories?.[0]?.subCategories?.length || 0,
        totalSize: JSON.stringify(data).length
      });
      
      // Send response
      res.status(200).json(data);
      
      const totalTime = Date.now() - startTime;
      console.log(`[Categories API] Total execution time: ${totalTime}ms`);
      
    } catch (error) {
      console.error('[Categories API] Error:', error.message);
      console.error('[Categories API] Stack:', error.stack);
      
      res.status(500).json({ 
        error: 'Failed to fetch categories',
        details: error.message,
        categories: []
      });
    }
  }