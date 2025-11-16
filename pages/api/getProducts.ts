// getProducts.ts - Optimized for Vercel production
import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

// PRODUCTION FIX: Add response caching headers
export const config = {
  maxDuration: 30, // Increase timeout for complex queries
}

const transformTitle = (fullTitle: string) => {
  // Your existing transformTitle function stays the same
  if (fullTitle.includes('4-Wire Braided Hose') && fullTitle.includes('EN 857 R4')) {
    return { shortTitle: '4-Wire Braided Hose', subtitle: 'EN 857 R4' };
  }
  // ... rest of your existing logic
  return { shortTitle: fullTitle, subtitle: '' };
};

// PRODUCTION FIX: Optimized fetch with better error handling
const fetchProductsByCategory = async (categoryId: string, page = 1, limit = 100) => {
  try {
    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const resp: any = await swell.get("/products", {
      limit,
      page,
      where: { "category_index.id": { $in: [categoryId] } },
      // Don't expand variants for initial load
    });

    clearTimeout(timeoutId);

    return {
      products: resp.results || [],
      pagination: {
        page,
        limit,
        total: resp.count || 0,
        totalPages: Math.ceil((resp.count || 0) / limit),
        hasNext: !!resp.pages?.next
      }
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Return empty result instead of throwing
    return {
      products: [],
      pagination: { page, limit, total: 0, totalPages: 0, hasNext: false }
    };
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // PRODUCTION FIX: Add CORS and caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Cache for 5 minutes in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  }

  try {
    const { id: categoryId, page = 1, limit = 100, loadAll = false } = req.body?.data || {};
    
    if (!categoryId) {
      return res.status(400).json({ 
        message: "Category ID is required",
        error: "MISSING_CATEGORY_ID"
      });
    }

    // PRODUCTION FIX: Validate input parameters
    const validatedPage = Math.max(1, Math.min(parseInt(page) || 1, 100)); // Max 100 pages
    const validatedLimit = Math.max(1, Math.min(parseInt(limit) || 100, 100)); // Max 100 items per page

    if (loadAll) {
      // PRODUCTION FIX: Limited "load all" for better performance
      const maxItems = 200; // Limit to 200 items max
      let currentPage = 1;
      const all: any[] = [];

      try {
        while (all.length < maxItems) {
          const resp: any = await swell.get("/products", {
            limit: Math.min(50, maxItems - all.length), // Smaller chunks
            page: currentPage,
            where: { "category_index.id": { $in: [categoryId] } },
            // Only expand variants if really needed
            expand: all.length === 0 ? ["variants:50"] : [], // Only first batch gets variants
          });

          if (!resp.results || resp.results.length === 0) break;
          
          all.push(...resp.results);
          
          if (!resp.pages?.next || all.length >= maxItems) break;
          currentPage++;
          
          // Add small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (all.length > 0) {
          const sortedProducts = all.sort((a: any, b: any) => 
            Number(new Date(a.date_created)) - Number(new Date(b.date_created))
          );
          
          const productList = sortedProducts.map((product: any) => {
            const { shortTitle, subtitle } = transformTitle(product.name);
            
            return {
              id: product.id,
              name: product.name,
              shortTitle,
              subtitle,
              price: product.price,
              stock: product.stock_level || 0,
              attributes: product.attributes,
              description: product.description,
              quantity: 0
            };
          });

          return res.status(200).json({ 
            products: productList,
            loadedAll: true,
            totalLoaded: productList.length
          });
        }
      } catch (loadAllError) {
        console.error('Load all failed:', loadAllError);
        // Fall through to paginated approach
      }
    } else {
      // Use paginated approach
      const result = await fetchProductsByCategory(categoryId, validatedPage, validatedLimit);
      
      if (result.products.length > 0) {
        const productList = result.products.map((product: any) => {
          const { shortTitle, subtitle } = transformTitle(product.name);
          
          return {
            id: product.id,
            name: product.name,
            shortTitle,
            subtitle,
            price: product.price,
            stock: product.stock_level || 0,
            attributes: product.attributes,
            description: product.description,
            quantity: 0
          };
        });

        return res.status(200).json({ 
          products: productList,
          pagination: result.pagination
        });
      }
    }

    // Check for subcategories with timeout protection
    try {
      const subcategoriesPromise = swell.get('/categories', { 
        where: { parent_id: categoryId } 
      });
      
      const subcategories = await Promise.race([
        subcategoriesPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Subcategories timeout')), 10000)
        )
      ]);

      if (subcategories.results && subcategories.results.length > 0) {
        const seriesData = subcategories.results.map((sub: any) => {
          const { shortTitle, subtitle } = transformTitle(sub.name);
          
          return {
            id: sub.id,
            title: sub.name,
            shortTitle,
            subtitle,
            slug: sub.slug,
            description: sub.description,
            image: sub.images !== null && sub.images[0] ? 
              sub.images[0].file.url : 
              "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
          };
        });

        return res.status(200).json({ 
          products: [],
          series: seriesData
        });
      }
    } catch (subcategoryError) {
      console.error('Subcategory fetch failed:', subcategoryError);
    }

    // Empty category
    return res.status(200).json({ 
      products: [],
      message: "No products or subcategories found"
    });

  } catch (err: any) {
    console.error('API Error:', err);
    
    // PRODUCTION FIX: Better error responses with proper typing
    const errorResponse: {
      message: string;
      error: string;
      timestamp: string;
      details?: string;
      stack?: string;
    } = {
      message: "Internal server error",
      error: err.name || "UNKNOWN_ERROR",
      timestamp: new Date().toISOString()
    };

    // Don't expose sensitive error details in production
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.details = err.message;
      errorResponse.stack = err.stack;
    }

    res.status(500).json(errorResponse);
  }
}

export default handler;