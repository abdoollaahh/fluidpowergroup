import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { slug } = req.body.data;
    
    if (!slug) {
      return res.status(400).json({ message: "Slug is required" });
    }

    // Find the category by slug (search all categories, not just top level)
    const allCategories = await swell.get('/categories', { limit: 1000 });
    const targetCategory = allCategories.results.find((cat: any) => cat.slug === slug);
    
    if (!targetCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get IMMEDIATE children of this category (regardless of level)
    const childCategories = await swell.get('/categories', { 
      where: { parent_id: targetCategory.id } 
    });

    // Convert children to series format
    const seriesData = childCategories.results.map((child: any) => ({
      id: child.id,
      title: child.name,
      slug: child.slug,
      category: targetCategory.slug,
      subCategory: child.slug,
      description: child.description,
      image: child.images !== null && child.images[0] ? 
        child.images[0].file.url : 
        "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
    }));

    res.status(200).json({ series: seriesData });

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export default handler;