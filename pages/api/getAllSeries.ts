import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const category = await swell.get('/categories', { 
      where: { slug: req.body.data.slug }, 
      limit: 100 
    });
    
    const id = category.results[0].id;
    const data = await swell.get('/categories', { 
      where: { parent_id: id }, 
      limit: 100 
    });
    
    let seriesData: any[] = [];
    
    // Checking whether it is a List of series or subcategories
    if (data.results.length !== 0) {
      if (data.results[0].top_id !== data.results[0].parent_id) {
        seriesData = await fillSeries(data);
      } else {
        // Use Promise.all instead of forEach with async
        const seriesPromises = data.results.map(async (sub: any) => {
          const series = await swell.get('/categories', { 
            where: { parent_id: sub.id }, 
            limit: 25 
          });
          return series.results.length !== 0 ? await fillSeries(series) : [];
        });
        
        const allSeriesArrays = await Promise.all(seriesPromises);
        // Flatten the array of arrays
        seriesData = allSeriesArrays.flat();
      }
    }
    
    res.status(200).json({ series: seriesData });
  } catch (err: any) {
    console.error('Error in getAllSeries:', err);
    return res.status(400).json({ message: err.message });
  }
};

const fillSeries = async (seriesList: any) => {
  // No need for async forEach here since we're not doing async operations
  const seriesData = seriesList.results.map((series: any) => ({
    name: series.name,
    id: series.id,
    slug: series.slug,
    image: series.images !== null && series.images[0] !== undefined 
      ? series.images[0].file.url 
      : "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    description: series.description,
  }));
  
  return seriesData;
};

export default handler;