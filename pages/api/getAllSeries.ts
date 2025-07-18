import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categories = await swell.get('/categories', { where: { parent_id: null } });
    const sortedCategoriesasc = categories.results.sort((a: any, b: any) => 
      Number(new Date(a.date_created)) - Number(new Date(b.date_created))
    );
    
    const sortedCategories = await Promise.all(
      sortedCategoriesasc.map(async (category: any) => {
        const subCategories = await swell.get('/categories', { 
          where: { parent_id: category.id } 
        });
        
        const subCategoriesWithSeries = await Promise.all(
          subCategories.results.map(async (sub: any) => {
            const series = await swell.get('/categories', { 
              where: { parent_id: sub.id } 
            });
            
            const seriesData = await Promise.all(
              series.results.map(async (serie: any) => {
                // Get level 4 categories for each series
                const level4 = await swell.get('/categories', { 
                  where: { parent_id: serie.id } 
                });
                
                return {
                  id: serie.id,
                  title: serie.name,
                  slug: serie.slug,
                  category: category.slug,
                  subCategory: sub.slug,
                  description: serie.description,
                  image: serie.images !== null && serie.images[0] ? 
                    serie.images[0].file.url : 
                    "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
                  subSeries: level4.results.map((l4: any) => ({
                    id: l4.id,
                    title: l4.name,
                    slug: l4.slug,
                    description: l4.description
                  }))
                };
              })
            );

            return {
              title: sub.name,
              id: sub.id,
              slug: sub.slug,
              category: category.slug,
              series: seriesData
            };
          })
        );

        return {
          title: category.name,
          slug: category.slug,
          subCategories: subCategoriesWithSeries,
          id: category.id
        };
      })
    );

    res.status(200).json({ categories: sortedCategories });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export default handler;