import swell from "./swellinit";

export const getAllProducts = async (id) => {
  const products = await swell.get('/products')
  const selectedProducts = products.results.filter((product) => product.category_index.id[0] == id)
  let productList = []
  await selectedProducts.forEach(product => {
    productList.push({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock_level | 0,
      id_inch: product.attributes.id_inch ? product.attributes.id_inch : "-",
      id_mm: product.attributes.id_mm ? product.attributes.id_mm : "-",
      od_mm: product.attributes.od_mm ? product.attributes.od_mm : "-",
      working_pressure_mpa: product.attributes.working_pressure_mpa ? product.attributes.working_pressure_mpa : "-",
      working_pressure_psi: product.attributes.working_pressure_psi ? product.attributes.working_pressure_psi : "-",
      burst_pressure_mpa: product.attributes.burst_pressure_mpa ? product.attributes.burst_pressure_mpa : "-",
      burst_pressure_psi: product.attributes.burst_pressure_psi ? product.attributes.burst_pressure_psi : "-",
      min_bend_radius_mm: product.attributes.min_bend_radius_mm ? product.attributes.min_bend_radius_mm : "-",
      quantity: 0
    })
  });
  return productList;
}