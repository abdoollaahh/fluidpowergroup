// getProducts.ts - Updated with pagination
import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const transformTitle = (fullTitle: string) => {
  // ... your existing transformTitle function stays the same
  if (fullTitle.includes('4-Wire Braided Hose') && fullTitle.includes('EN 857 R4')) {
    return { shortTitle: '4-Wire Braided Hose', subtitle: 'EN 857 R4' };
  }
  // ... rest of your existing logic
  return { shortTitle: fullTitle, subtitle: '' };
};

// NEW: Optimized fetch with pagination
const fetchProductsByCategory = async (categoryId: string, page = 1, limit = 20) => {
  try {
    const resp: any = await swell.get("/products", {
      limit,
      page,
      where: { "category_index.id": { $in: [categoryId] } },
      // Remove variant expansion for initial load - load variants only when needed
    });

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
    return {
      products: [],
      pagination: { page, limit, total: 0, totalPages: 0, hasNext: false }
    };
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id: categoryId, page = 1, limit = 20, loadAll = false } = req.body?.data || {};
    
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    // If loadAll is true, use your existing logic for backward compatibility
    if (loadAll) {
      // Your existing fetchProductsByCategory logic here
      const perPage = 100;
      let currentPage = 1;
      const all: any[] = [];

      while (true) {
        const resp: any = await swell.get("/products", {
          limit: perPage,
          page: currentPage,
          where: { "category_index.id": { $in: [categoryId] } },
          expand: ["variants:200"],
        });

        all.push(...resp.results);
        if (!resp.pages?.next || resp.results.length < perPage) break;
        currentPage++;
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

        return res.status(200).json({ products: productList });
      }
    } else {
      // NEW: Use paginated approach
      const result = await fetchProductsByCategory(categoryId, parseInt(page), parseInt(limit));
      
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

    // Check for subcategories (your existing logic)
    const subcategories = await swell.get('/categories', { 
      where: { parent_id: categoryId } 
    });

    if (subcategories.results.length > 0) {
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

    // Your existing level-4 logic remains the same...
    return res.status(200).json({ products: [] });

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export default handler;