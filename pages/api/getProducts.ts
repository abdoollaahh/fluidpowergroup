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
    const categoryId = req.body?.data?.id;
    
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    // First, check for actual products in this category
    const products = await swell.get('/products', { limit: 500 });
    const selectedProducts = products.results.filter((product: any) => {
      return product.category_index !== undefined && 
             product.category_index.id.includes(categoryId);
    });

    // If products exist, this is a final category - return products
    if (selectedProducts.length > 0) {
      const sortedProducts = selectedProducts.sort((a: any, b: any) => 
        Number(new Date(a.date_created)) - Number(new Date(b.date_created))
      );
      
      const productList = sortedProducts.map((product: any) => {
        const { shortTitle, subtitle } = transformTitle(product.name); // NEW
        
        return {
          id: product.id,
          name: product.name,
          shortTitle,        // NEW
          subtitle,          // NEW
          price: product.price,
          stock: product.stock_level || 0,
          attributes: product.attributes,
          description: product.description,
          quantity: 0
        };
      });

      return res.status(200).json({ products: productList });
    }

    // No products found - check for subcategories
    const subcategories = await swell.get('/categories', { 
      where: { parent_id: categoryId } 
    });

    // If subcategories exist, return them as "series" for grid navigation
    if (subcategories.results.length > 0) {
      const seriesData = subcategories.results.map((sub: any) => {
        const { shortTitle, subtitle } = transformTitle(sub.name); // NEW
        
        return {
          id: sub.id,
          title: sub.name,
          shortTitle,        // NEW
          subtitle,          // NEW
          slug: sub.slug,
          description: sub.description,
          image: sub.images !== null && sub.images[0] ? 
            sub.images[0].file.url : 
            "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
        };
      });

      // Return subcategories as "series" so GridProducts renders them as navigation
      return res.status(200).json({ 
        products: [],
        series: seriesData  // This triggers grid display!
      });
    }

    // Empty category
    return res.status(200).json({ products: [] });

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export default handler;
