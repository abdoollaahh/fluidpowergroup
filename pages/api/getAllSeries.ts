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
    const seriesData = childCategories.results.map((child: any) => {
      const { shortTitle, subtitle } = transformTitle(child.name); // NEW
      
      return {
        id: child.id,
        title: child.name,
        shortTitle,        // NEW
        subtitle,          // NEW
        slug: child.slug,
        category: targetCategory.slug,
        subCategory: child.slug,
        description: child.description,
        image: child.images !== null && child.images[0] ? 
          child.images[0].file.url : 
          "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
      };
    });

    res.status(200).json({ series: seriesData });

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export default handler;