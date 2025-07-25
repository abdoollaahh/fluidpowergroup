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
    
    // Use Promise.all to properly handle async operations
    const sortedCategories = await Promise.all(
      sortedCategoriesAsc.map(async (category: any) => {
        // Fetch level 2 subcategories for this category
        const subCategoriesResponse = await swell.get('/categories', { 
          where: { parent_id: category.id } 
        });
        
        // Map level 2 subcategories and fetch their series
        const subCategories = await Promise.all(
          subCategoriesResponse.results.map(async (sub: any) => {
            // Fetch level 3 categories (series) for this subcategory
            const seriesResponse = await swell.get('/categories', { 
              where: { parent_id: sub.id } 
            });
            
            // Map the series data
            const series = seriesResponse.results.map((serie: any) => ({
              id: serie.id,
              title: serie.name,
              slug: serie.slug,
              category: category.slug,
              subCategory: sub.slug,
              description: serie.description,
              image: serie.images !== null && serie.images[0] ? 
                serie.images[0].file.url : 
                "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
            }));
            
            return {
              title: sub.name,
              id: sub.id,
              slug: sub.slug,
              category: category.slug,
              series: series
            };
          })
        );
        
        return {
          title: category.name,
          slug: category.slug,
          subCategories: subCategories,
          id: category.id
        };
      })
    );

    res.status(200).json({ categories: sortedCategories });
    
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(400).json({ message: err.message });
  }
}

export default handler;