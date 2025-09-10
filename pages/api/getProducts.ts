import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

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
  
  // Fitting categories
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
  
  // Generic pattern matching for parentheses
  const parenthesesMatch = fullTitle.match(/^([^(]+)\s*\((.+)\)$/);
  if (parenthesesMatch) {
    const beforeParens = parenthesesMatch[1].trim();
    const insideParens = parenthesesMatch[2].trim();
    
    if (beforeParens.length <= 10 && beforeParens.match(/^[A-Z0-9\s-&]+$/)) {
      return { shortTitle: beforeParens, subtitle: `(${insideParens})` };
    }
  }
  
  return { shortTitle: fullTitle, subtitle: '' };
};

// Fetch products for a category with variants expanded properly
const fetchProductsByCategory = async (categoryId: string) => {
  const perPage = 100;
  let page = 1;
  const all: any[] = [];

  while (true) {
    const resp: any = await swell.get("/products", {
      limit: perPage,
      page,
      where: { "category_index.id": { $in: [categoryId] } },
      expand: ["variants:200"],
    });

    all.push(...resp.results);

    if (!resp.pages?.next || resp.results.length < perPage) break;
    page++;
  }

  return all;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categoryId = req.body?.data?.id;
    
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    // First, check for actual products in this category using the fast method
    const products = await fetchProductsByCategory(categoryId);

    // If products exist, flatten into table items and return
    if (products.length > 0) {
      const items = products.flatMap((product: any) => {
        const variants = product.variants?.length > 0
          ? product.variants
          : [{
              id: product.id,
              sku: product.sku,
              price: product.price,
              stock_level: product.stock_level,
            }];

        return variants.map((variant: any) => ({
          id: variant.id,
          name: variant.sku || variant.name || product.name,
          price: variant.price ?? variant.sale_price ?? product.price,
          stock: variant.stock_level ?? 0,
          attributes: variant.options
            ? variant.options.reduce((acc: any, opt: any) => {
                acc[opt.name] = opt.value;
                return acc;
              }, {})
            : variant.attributes || {},
          description: product.description || "",
          quantity: 0,
        }));
      });

      return res.status(200).json({ products: items });
    }

    // No products found - check for subcategories (same as working version)
    const subcategories = await swell.get('/categories', { 
      where: { parent_id: categoryId } 
    });

    if (subcategories.results.length > 0) {
      const seriesData = subcategories.results.map((sub: any) => {
        const { shortTitle, subtitle } = transformTitle(sub.name);
        
        return {
          id: sub.id,
          title: sub.name,
          shortTitle,
          subtitle,
          slug: sub.slug,
          description: sub.description,
          image: sub.images !== null && sub.images[0] ? 
            sub.images[0].file.url : 
            "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
        };
      });

      return res.status(200).json({ 
        products: [],
        series: seriesData
      });
    }

    // NEW: Check if this might be a level-4 category (simple addition)
    // Try to get products one more time for potential level-4 categories
    const level4Products = await swell.get('/products', { 
      limit: 1000,
      where: { "category_index.id": { $in: [categoryId] } }
    });

    const level4Selected = level4Products.results.filter((product: any) => {
      return product.category_index !== undefined && 
             product.category_index.id.includes(categoryId);
    });

    if (level4Selected.length > 0) {
      const level4Items = level4Selected.map((product: any) => {
        const { shortTitle, subtitle } = transformTitle(product.name);
        
        return {
          id: product.id,
          name: product.name,
          shortTitle,
          subtitle,
          price: product.price,
          stock: product.stock_level || 0,
          attributes: product.attributes,
          description: product.description,
          quantity: 0
        };
      });

      return res.status(200).json({ products: level4Items });
    }

    // Check for level-4 subcategories (simple addition)
    const level4Subcategories = await swell.get('/categories', { 
      where: { parent_id: categoryId } 
    });

    if (level4Subcategories.results.length > 0) {
      const level4SeriesData = level4Subcategories.results.map((sub: any) => {
        const { shortTitle, subtitle } = transformTitle(sub.name);
        
        return {
          id: sub.id,
          title: sub.name,
          shortTitle,
          subtitle,
          slug: sub.slug,
          description: sub.description,
          image: sub.images !== null && sub.images[0] ? 
            sub.images[0].file.url : 
            "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
        };
      });

      return res.status(200).json({ 
        products: [],
        series: level4SeriesData
      });
    }

    // Empty category
    return res.status(200).json({ products: [] });

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export default handler;