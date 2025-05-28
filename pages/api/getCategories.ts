import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Get parent categories
    const categories = await swell.get('/categories', { where: { parent_id: null } });
    
    // Sort categories by creation date
    const sortedCategoriesAsc = categories.results.sort((a: any, b: any) => 
      Number(new Date(a.date_created)) - Number(new Date(b.date_created))
    );
    
    // Map categories and fetch subcategories using Promise.all
    const sortedCategories = await Promise.all(
      sortedCategoriesAsc.map(async (category: any) => {
        // Fetch subcategories for this category
        const subCategoriesResponse = await swell.get('/categories', { 
          where: { parent_id: category.id } 
        });
        
        // Map subcategories
        const subCategories = subCategoriesResponse.results.map((sub: any) => ({
          title: sub.name,
          slug: sub.slug,
          id: sub.id,
          category: category.slug,
          image: sub.images !== null && sub.images[0] !== undefined ? sub.images[0].file.url : null,
          description: sub.description
        }));
        
        // Return the category with its subcategories
        return {
          title: category.name,
          id: category.id,
          slug: category.slug,
          subCategories: subCategories,
          description: category.description
        };
      })
    );
    
    res.status(200).json({ categories: sortedCategories });
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    return res.status(400).json({ message: err.message });
  }
};

export default handler;