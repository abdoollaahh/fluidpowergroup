import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const series = await swell.get('/categories/{id}', {
      id: req.body.data.id
    })

    if (series !== null) {
      const seriesDetails = {
        name: series.name,
        description: series.description !== null ? series.description.replaceAll("<br>", "") : "",
        images: series.images !== null ? series.images.map((image: any) => image.file.url) : ["https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"]
      }
      res.status(200).json({series: seriesDetails})
    } else {
      res.status(200).json({series: null})
    }
    

  } catch (err: any) {
    return res.status(400).json({message: err.message})
  }
}

export default handler