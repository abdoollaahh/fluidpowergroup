import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { slug } = req.body.data;
    
    if (!slug) {
      return res.status(400).json({ message: "Slug is required" });
    }

    // Find the category by slug
    const allCategories = await swell.get('/categories', { limit: 1000 });
    const targetCategory = allCategories.results.find((cat: any) => cat.slug === slug);
    
    if (!targetCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get direct subcategories of this category
    const subCategories = await swell.get('/categories', { 
      where: { parent_id: targetCategory.id } 
    });

    // For each subcategory, get its series (children)
    const seriesData = await Promise.all(
      subCategories.results.map(async (sub: any) => {
        const series = await swell.get('/categories', { 
          where: { parent_id: sub.id } 
        });

        return series.results.map((serie: any) => ({
          id: serie.id,
          title: serie.name,
          slug: serie.slug,
          category: targetCategory.slug,
          subCategory: sub.slug,
          description: serie.description,
          image: serie.images !== null && serie.images[0] ? 
            serie.images[0].file.url : 
            "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
        }));
      })
    );

    // Flatten the array and return with 'series' property (not 'categories')
    const flatSeries = seriesData.flat();
    res.status(200).json({ series: flatSeries });

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
export default handler;