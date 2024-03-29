import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categories = await swell.get('/categories', { where: { parent_id: null } })
    const sortedCategoriesasc = await categories.results.sort((a: any, b: any) => Number(new Date(a.date_created)) - Number(new Date(b.date_created)))
    const sortedCategories = await sortedCategoriesasc.map((category: any) => ({ title: category.name, id: category.id, slug: category.slug, subCategories: [], description: category.description }))
    await sortedCategories.forEach(async (category: any) => {
      const subCategories = await swell.get('/categories', { where: { parent_id: category.id } })
      await subCategories.results.forEach(async (sub: any) => {
        await category.subCategories.push({ title: sub.name, slug: sub.slug, id: sub.id, category: category.slug, image: sub.images !== null && sub.images[0] !== undefined && sub.images[0].file.url, description: sub.description })
      })
    })

    res.status(200).json({ categories: sortedCategories })
  } catch (err: any) {
    return res.status(400).json({message: err.message})
  }
}

export default handler