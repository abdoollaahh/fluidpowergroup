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
        // Fetch level 2 subcategories
        const subCategoriesResponse = await swell.get('/categories', { 
          where: { parent_id: category.id } 
        });
        
        // Map level 2 subcategories and check for level 3
        const subCategories = await Promise.all(
          subCategoriesResponse.results.map(async (sub: any) => {
            // Fetch level 3 subcategories for this level 2 category
            const level3Response = await swell.get('/categories', { 
              where: { parent_id: sub.id } 
            });
            
            // Map level 3 subcategories and check for level 4
            const level3Categories = await Promise.all(
              level3Response.results.map(async (level3: any) => {
                // Fetch level 4 subcategories
                const level4Response = await swell.get('/categories', { 
                  where: { parent_id: level3.id } 
                });
                
                const level4Categories = level4Response.results.map((level4: any) => ({
                  title: level4.name,
                  slug: level4.slug,
                  id: level4.id,
                  category: category.slug,
                  image: level4.images !== null && level4.images[0] !== undefined ? level4.images[0].file.url : null,
                  description: level4.description
                }));
                
                return {
                  title: level3.name,
                  slug: level3.slug,
                  id: level3.id,
                  category: category.slug,
                  image: level3.images !== null && level3.images[0] !== undefined ? level3.images[0].file.url : null,
                  description: level3.description,
                  subCategories: level4Categories // Add level 4 if exists
                };
              })
            );
            
            return {
              title: sub.name,
              slug: sub.slug,
              id: sub.id,
              category: category.slug,
              image: sub.images !== null && sub.images[0] !== undefined ? sub.images[0].file.url : null,
              description: sub.description,
              subCategories: level3Categories // Add level 3 if exists
            };
          })
        );
        
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