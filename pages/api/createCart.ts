import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const cart = await swell.post('/carts', {
      items: req.body.items
    })
    res.status(200).json(cart)
  } catch (err: any) {
    return res.status(400).json({message: err.message})
  }

}

export default handler