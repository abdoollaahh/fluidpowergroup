import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categories = await swell.get('/categories', { where: { parent_id: null } })
    const sortedCategoriesasc = await categories.results.sort((a: any, b: any) => Number(new Date(a.date_created)) - Number(new Date(b.date_created)))
    const sortedCategories = await sortedCategoriesasc.map((category: any) => ({ title: category.name, slug: category.slug, subCategories: [], id: category.id }))
    await sortedCategories.forEach(async (category: any) => {
      const subCategories = await swell.get('/categories', { where: { parent_id: category.id } })
      await subCategories.results.forEach(async (sub: any) => {
        await category.subCategories.push({ title: sub.name, id: sub.id, slug: sub.slug, category: category.slug, series: [] })
      })
    })

    await sortedCategories.forEach(async (category: any) => {
      await category.subCategories.forEach(async (sub: any) => {
        const series = await swell.get('/categories', { where: { parent_id: sub.id } })
        await series.results.forEach(async (serie: any) => {
          await sub.series.push({
            id: serie.id,
            title: serie.name,
            slug: serie.slug,
            category: category.slug,
            subCategory: sub.slug,
            description: serie.description,
            image: serie.images !== null ? serie.images[0].file.url : "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"})
        })
      })
    })

    res.status(200).json({ categories: sortedCategories })
  } catch (err: any){
    res.status(400).json({message: err.message})
  }
}
 
export default handler;