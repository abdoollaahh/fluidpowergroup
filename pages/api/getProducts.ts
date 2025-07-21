import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categoryIdOrSlug = req.body?.data?.id;
    
    if (!categoryIdOrSlug) {
      return res.status(400).json({ message: "Category ID or slug is required" });
    }

    console.log(`=== getProducts API Debug ===`);
    console.log(`Received parameter: "${categoryIdOrSlug}"`);
    console.log(`Parameter type: ${typeof categoryIdOrSlug}`);
    console.log(`Contains hyphens: ${categoryIdOrSlug.includes && categoryIdOrSlug.includes('-')}`);

    let categoryId = categoryIdOrSlug;

    // Check if the parameter looks like a slug (contains hyphens) rather than an ID
    if (typeof categoryIdOrSlug === 'string' && categoryIdOrSlug.includes('-')) {
      console.log(`Treating as SLUG: "${categoryIdOrSlug}"`);
      // It's a slug, so we need to find the category by slug first
      const allCategories = await swell.get('/categories', { limit: 1000 });
      console.log(`Total categories found: ${allCategories.results.length}`);
      
      const targetCategory = allCategories.results.find((cat: any) => cat.slug === categoryIdOrSlug);
      console.log(`Target category found:`, targetCategory ? 'YES' : 'NO');
      
      if (!targetCategory) {
        // Debug: Show all matching slugs
        const matchingSlugs = allCategories.results.filter((cat: any) => 
          cat.slug && cat.slug.includes(categoryIdOrSlug.split('-')[0])
        ).map((cat: any) => cat.slug);
        console.log('Similar slugs found:', matchingSlugs.slice(0, 10));
        return res.status(404).json({ message: "Category not found by slug", searchedSlug: categoryIdOrSlug, similarSlugs: matchingSlugs.slice(0, 5) });
      }
      
      categoryId = targetCategory.id;
      console.log(`✅ Found category by slug "${categoryIdOrSlug}": ${categoryId}`);
    } else {
      console.log(`Treating as ID: "${categoryIdOrSlug}"`);
    }

    console.log(`Using categoryId: ${categoryId}`);

    // Now proceed with the original logic using the categoryId
    // First, check for actual products in this category
    console.log(`Searching for products with categoryId: ${categoryId}`);
    const products = await swell.get('/products', { limit: 1000 });
    console.log(`Total products in database: ${products.results.length}`);
    
    const selectedProducts = products.results.filter((product: any) => {
      const hasCategory = product.category_index !== undefined && 
                         product.category_index.id.includes(categoryId);
      if (hasCategory) {
        console.log(`✅ Found matching product: ${product.name} (${product.id})`);
      }
      return hasCategory;
    });

    console.log(`Products matching categoryId ${categoryId}: ${selectedProducts.length}`);

    // If products exist, this is a final category - return products
    if (selectedProducts.length > 0) {
      console.log(`✅ Returning ${selectedProducts.length} products`);
      const sortedProducts = selectedProducts.sort((a: any, b: any) => 
        Number(new Date(a.date_created)) - Number(new Date(b.date_created))
      );
      
      const productList = sortedProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock_level || 0,
        attributes: product.attributes,
        description: product.description,
        quantity: 0
      }));

      console.log(`=== End API Debug ===`);
      return res.status(200).json({ products: productList });
    }

    console.log(`No products found, checking for subcategories...`);
    // No products found - check for subcategories
    const subcategories = await swell.get('/categories', { 
      where: { parent_id: categoryId } 
    });

    console.log(`Subcategories found: ${subcategories.results.length}`);

    // If subcategories exist, return them as "series" for grid navigation
    if (subcategories.results.length > 0) {
      console.log(`✅ Returning ${subcategories.results.length} subcategories as series`);
      const seriesData = subcategories.results.map((sub: any) => ({
        id: sub.id,
        title: sub.name,
        slug: sub.slug,
        description: sub.description,
        image: sub.images !== null && sub.images[0] ? 
          sub.images[0].file.url : 
          "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
      }));

      console.log(`=== End API Debug ===`);
      // Return subcategories as "series" so GridProducts renders them as navigation
      return res.status(200).json({ 
        products: [],
        series: seriesData  // This triggers grid display!
      });
    }

    console.log(`No products or subcategories found - returning empty`);
    console.log(`=== End API Debug ===`);
    // Empty category
    return res.status(200).json({ products: [] });

  } catch (err: any) {
    console.error('getProducts API error:', err);
    res.status(400).json({ message: err.message });
  }
}

export default handler;