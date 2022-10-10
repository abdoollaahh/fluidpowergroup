import swell from "./swellinit";

export const getAllCategories = async () => {
  const categories = await swell.get('/categories', { where: { parent_id: null } })
  let sortedCategories = categories.results.map((category) => ({ title: category.name, id: category.id, slug: category.slug, subCategories: [] }))
  
  sortedCategories.forEach(async category => {
    const subCategories = await swell.get('/categories', { where: { parent_id: category.id } })
    subCategories.results.forEach(sub => {
      category.subCategories.push({title: sub.name, slug: sub.slug, id: sub.id, category: category.slug })
    })
  })

  return sortedCategories 
}