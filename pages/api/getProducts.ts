import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const products = await swell.get('/products', { limit: 1000 })
    const selectedProducts = await products.results.filter((product: any) => { return product.category_index !== undefined && product.category_index.id[0] == req.body.data.id })
    const sortedProductsasc = await selectedProducts.sort((a: any, b: any) => Number(new Date(a.date_created)) - Number(new Date(b.date_created)))
    let productList: any[] = []
    await sortedProductsasc.forEach((product: any) => {
      productList.push({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock_level | 0,
        attributes: product.attributes,
        /*id_inch: product.attributes.id_inch ? product.attributes.id_inch : "-",
        id_mm: product.attributes.id_mm ? product.attributes.id_mm : "-",
        od_mm: product.attributes.od_mm ? product.attributes.od_mm : "-",
        working_pressure_mpa: product.attributes.working_pressure_mpa ? product.attributes.working_pressure_mpa : "-",
        working_pressure_psi: product.attributes.working_pressure_psi ? product.attributes.working_pressure_psi : "-",
        burst_pressure_mpa: product.attributes.burst_pressure_mpa ? product.attributes.burst_pressure_mpa : "-",
        burst_pressure_psi: product.attributes.burst_pressure_psi ? product.attributes.burst_pressure_psi : "-",
        min_bend_radius_mm: product.attributes.min_bend_radius_mm ? product.attributes.min_bend_radius_mm : "-",*/
        quantity: 0
      })
    })
    res.status(200).json({products: productList})
  } catch (err: any){
    res.status(400).json({message: err.message})
  }
}
 
export default handler;