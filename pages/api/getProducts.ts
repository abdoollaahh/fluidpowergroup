import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categoryId = req.body?.data?.id;
    
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    console.log(`=== getProducts API Debug ===`);
    console.log(`Checking category: ${categoryId}`);

    // Check for actual products in this category
    const products = await swell.get('/products', { limit: 1000 });
    const selectedProducts = products.results.filter((product: any) => {
      return product.category_index !== undefined && 
             product.category_index.id.includes(categoryId);
    });

    // Check for subcategories
    const subcategories = await swell.get('/categories', { 
      where: { parent_id: categoryId } 
    });

    console.log(`Products found: ${selectedProducts.length}`);
    console.log(`Subcategories found: ${subcategories.results.length}`);

    // SMART LOGIC: If we have both products AND subcategories, prioritize subcategories
    // This handles Level 4 categories that should show navigation, not products
    if (subcategories.results.length > 0) {
      console.log(`✅ Returning ${subcategories.results.length} subcategories as navigation`);
      
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
      return res.status(200).json({ 
        products: [],
        series: seriesData  // This triggers grid display!
      });
    }

    // Only show products if there are NO subcategories (final level)
    if (selectedProducts.length > 0) {
      console.log(`✅ Returning ${selectedProducts.length} products (final level)`);
      
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