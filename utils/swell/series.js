
import swell from "./swellinit";

export const getAllSeries = async (slug) => {
  const category = await swell.get('/categories', { where: { slug } })
  const id = category.results[0].id;
  const data = await swell.get('/categories', { where: { parent_id: id } })
  let seriesData = [];
  //Checking whether it is a List of series or subcategories
  if (data.results.length !== 0) {
    if (data.results[0].top_id !== data.results[0].parent_id) {
      seriesData = fillSeries(data)
    } else {
      data.results.forEach(async sub => {
        const series = await swell.get('/categories', { where: { parent_id: sub.id } })
        console.log(series)
        series.length !== 0 && seriesData.push(...fillSeries(series))
      })
    }
  }
 
  return seriesData;
}

export const getSeriesDetails = async (id) => {
  const series = await swell.get('/categories/{id}', {
    id
  })
  
  const seriesDetails = {
    name: series.name,
    description: series.description !== null ? series.description.replaceAll("<br>", "") : "",
    images: series.images !== null ? series.images.map(image => image.file.url) : ["https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"]
  }

  return seriesDetails
}

const fillSeries = (seriesList) => {
  let seriesData = [];
  seriesList.results.forEach(series => {
    seriesData.push({
      name: series.name,
      id: series.id,
      slug: series.slug,
      image: series.images !== null ? series.images[0].file.url : "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
    })
  });

  return seriesData
}
