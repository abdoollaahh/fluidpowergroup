import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const category = await swell.get('/categories', { where: { slug: req.body.data.slug }, limit: 100 })
    const id = category.results[0].id;
    const data = await swell.get('/categories', { where: { parent_id: id }, limit: 100 })
    let seriesData = [];
    //Checking whether it is a List of series or subcategories
    if (data.results.length !== 0) {
      if (data.results[0].top_id !== data.results[0].parent_id) {
        seriesData = fillSeries(data)
      } else {
        data.results.forEach(async (sub : any) => {
          const series = await swell.get('/categories', { where: { parent_id: sub.id } })
          series.length !== 0 && seriesData.push(...fillSeries(series))
        })
      }
    }

    res.status(200).json({series: seriesData})
  } catch (err: any) {
    return res.status(400).json({message: err.message})
  }
}

const fillSeries = (seriesList: any) => {
  let seriesData: any[] = [];
  seriesList.results.forEach((series: any) => {
    seriesData.push({
      name: series.name,
      id: series.id,
      slug: series.slug,
      image: series.images !== null ? series.images[0].file.url : "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
    })
  });

  return seriesData
}


export default handler