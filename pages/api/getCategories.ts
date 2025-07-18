import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Function to recursively fetch subcategories
    const fetchSubCategories = async (parentId: string): Promise<any[]> => {
      const subCategoriesResponse = await swell.get('/categories', { 
        where: { parent_id: parentId } 
      });
      
      // For each subcategory, fetch its children recursively
      const subCategories = await Promise.all(
        subCategoriesResponse.results.map(async (sub: any) => {
          const childCategories = await fetchSubCategories(sub.id);
          
          return {
            title: sub.name,
            slug: sub.slug,
            id: sub.id,
            image: sub.images !== null && sub.images[0] !== undefined ? sub.images[0].file.url : null,
            description: sub.description,
            subCategories: childCategories // Add children here
          };
        })
      );
      
      return subCategories;
    };

    // Get parent categories
    const categories = await swell.get('/categories', { where: { parent_id: null } });
    
    // Sort categories by creation date
    const sortedCategoriesAsc = categories.results.sort((a: any, b: any) => 
      Number(new Date(a.date_created)) - Number(new Date(b.date_created))
    );
    
    // Map categories and fetch ALL nested subcategories
    const sortedCategories = await Promise.all(
      sortedCategoriesAsc.map(async (category: any) => {
        const subCategories = await fetchSubCategories(category.id);
        
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