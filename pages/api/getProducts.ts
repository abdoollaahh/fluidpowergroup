import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categoryId = req.body.data.id;
    
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    // Get all products and filter by category
    const products = await swell.get('/products', { limit: 1000 });
    const selectedProducts = products.results.filter((product: any) => {
      return product.category_index !== undefined && 
             product.category_index.id.includes(categoryId);
    });

    // If we found products, return them
    if (selectedProducts.length > 0) {
      const sortedProductsasc = selectedProducts.sort((a: any, b: any) => 
        Number(new Date(a.date_created)) - Number(new Date(b.date_created))
      );
      
      const productList = sortedProductsasc.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock_level || 0,
        attributes: product.attributes,
        description: product.description,
        quantity: 0
      }));

      return res.status(200).json({ products: productList });
    }

    // No products found - check if this category has subcategories
    const subcategories = await swell.get('/categories', { 
      where: { parent_id: categoryId } 
    });

    if (subcategories.results.length > 0) {
      // Has subcategories - return empty products with subcategory info
      return res.status(200).json({ 
        products: [],
        hasSubcategories: true,
        subcategories: subcategories.results.map((sub: any) => ({
          id: sub.id,
          title: sub.name,
          slug: sub.slug,
          description: sub.description,
          image: sub.images !== null && sub.images[0] ? 
            sub.images[0].file.url : null
        }))
      });
    }

    // No products AND no subcategories - truly empty category
    res.status(200).json({ 
      products: [],
      hasSubcategories: false 
    });

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export default handler;