import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

// Add the transformTitle function here (copy from above)

const transformTitle = (fullTitle: string) => {
  // Handle specific cases from your product catalog
  
  // Hose categories
  if (fullTitle.includes('4-Wire Braided Hose') && fullTitle.includes('EN 857 R4')) {
    return { shortTitle: '4-Wire Braided Hose', subtitle: 'EN 857 R4' };
  }
  if (fullTitle.includes('1-Wire Braided Hose') && fullTitle.includes('1SC EN 857')) {
    return { shortTitle: '1-Wire Braided Hose', subtitle: '1SC EN 857' };
  }
  if (fullTitle.includes('2-Wire Braided Hose') && (fullTitle.includes('2SC EN 857') || fullTitle.includes('EN 857'))) {
    return { shortTitle: '2-Wire Braided Hose', subtitle: '2SC EN 857' };
  }
  if (fullTitle.includes('Suction Hose') && !fullTitle.includes('(')) {
    return { shortTitle: 'Suction Hose', subtitle: '' };
  }
  
  // Valve categories
  if (fullTitle.includes('Balancing Valves')) {
    return { shortTitle: 'Balancing Valves', subtitle: '' };
  }
  if (fullTitle.includes('Flow Control Valves')) {
    return { shortTitle: 'Flow Control Valves', subtitle: '' };
  }
  if (fullTitle.includes('In-Line Valves')) {
    return { shortTitle: 'In-Line Valves', subtitle: '' };
  }
  if (fullTitle.includes('Solenoid Diverter Valves')) {
    return { shortTitle: 'Solenoid Diverter Valves', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic Accumulators')) {
    return { shortTitle: 'Hydraulic Accumulators', subtitle: '' };
  }
  if (fullTitle.includes('Directional Control Valves')) {
    return { shortTitle: 'Directional Control Valves', subtitle: '' };
  }
  if (fullTitle.includes('Ball Valves')) {
    return { shortTitle: 'Ball Valves', subtitle: '' };
  }
  
  // Function categories
  if (fullTitle.includes('Live Third Function')) {
    return { shortTitle: 'Live Third Function', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic Soft Ride Functions')) {
    return { shortTitle: 'Hydraulic Soft Ride Functions', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic 3rd & 4th Functions')) {
    return { shortTitle: 'Hydraulic 3rd & 4th Functions', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic 3rd Functions')) {
    return { shortTitle: 'Hydraulic 3rd Functions', subtitle: '' };
  }
  
  // Fitting categories (existing ones)
  if (fullTitle.includes('JIC') && fullTitle.includes('Joint Industrial Council')) {
    return { shortTitle: 'JIC', subtitle: '(Joint Industrial Council)' };
  }
  if (fullTitle.includes('BSP') && fullTitle.includes('British Standard Pipe')) {
    return { shortTitle: 'BSP', subtitle: '(British Standard Pipe)' };
  }
  if (fullTitle.includes('ORFS') && (fullTitle.includes('ORing Flat Seal') || fullTitle.includes('O-Ring Flat Seal'))) {
    return { shortTitle: 'ORFS', subtitle: '(O-Ring Flat Seal)' };
  }
  if (fullTitle.includes('Metric Light')) {
    return { shortTitle: 'Metric Light', subtitle: '' };
  }
  if (fullTitle.includes('Ferrules')) {
    return { shortTitle: 'Ferrules', subtitle: '' };
  }
  
  // Generic pattern matching for parentheses (for future titles)
  const parenthesesMatch = fullTitle.match(/^([^(]+)\s*\((.+)\)$/);
  if (parenthesesMatch) {
    const beforeParens = parenthesesMatch[1].trim();
    const insideParens = parenthesesMatch[2].trim();
    
    // If it's an acronym followed by full description
    if (beforeParens.length <= 10 && beforeParens.match(/^[A-Z0-9\s-&]+$/)) {
      return { shortTitle: beforeParens, subtitle: `(${insideParens})` };
    }
  }
  
  // Default: no transformation needed
  return { shortTitle: fullTitle, subtitle: '' };
};

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
        const { shortTitle: catShortTitle, subtitle: catSubtitle } = transformTitle(category.name); // NEW
        
        // Fetch level 2 subcategories
        const subCategoriesResponse = await swell.get('/categories', { 
          where: { parent_id: category.id } 
        });
        
        // Map level 2 subcategories and check for level 3
        const subCategories = await Promise.all(
          subCategoriesResponse.results.map(async (sub: any) => {
            const { shortTitle: subShortTitle, subtitle: subSubtitle } = transformTitle(sub.name); // NEW
            
            // Fetch level 3 subcategories for this level 2 category
            const level3Response = await swell.get('/categories', { 
              where: { parent_id: sub.id } 
            });
            
            // Map level 3 subcategories and check for level 4
            const level3Categories = await Promise.all(
              level3Response.results.map(async (level3: any) => {
                const { shortTitle: l3ShortTitle, subtitle: l3Subtitle } = transformTitle(level3.name); // NEW
                
                // Fetch level 4 subcategories
                const level4Response = await swell.get('/categories', { 
                  where: { parent_id: level3.id } 
                });
                
                const level4Categories = level4Response.results.map((level4: any) => {
                  const { shortTitle: l4ShortTitle, subtitle: l4Subtitle } = transformTitle(level4.name); // NEW
                  
                  return {
                    title: level4.name,
                    shortTitle: l4ShortTitle,    // NEW
                    subtitle: l4Subtitle,        // NEW
                    slug: level4.slug,
                    id: level4.id,
                    category: category.slug,
                    image: level4.images !== null && level4.images[0] !== undefined ? level4.images[0].file.url : null,
                    description: level4.description
                  };
                });
                
                return {
                  title: level3.name,
                  shortTitle: l3ShortTitle,      // NEW
                  subtitle: l3Subtitle,          // NEW
                  slug: level3.slug,
                  id: level3.id,
                  category: category.slug,
                  image: level3.images !== null && level3.images[0] !== undefined ? level3.images[0].file.url : null,
                  description: level3.description,
                  subCategories: level4Categories
                };
              })
            );
            
            return {
              title: sub.name,
              shortTitle: subShortTitle,         // NEW
              subtitle: subSubtitle,             // NEW
              slug: sub.slug,
              id: sub.id,
              category: category.slug,
              image: sub.images !== null && sub.images[0] !== undefined ? sub.images[0].file.url : null,
              description: sub.description,
              subCategories: level3Categories
            };
          })
        );
        
        // Return the category with its subcategories
        return {
          title: category.name,
          shortTitle: catShortTitle,             // NEW
          subtitle: catSubtitle,                 // NEW
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