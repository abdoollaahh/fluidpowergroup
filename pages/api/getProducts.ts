// pages/api/getProducts.ts
import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

// Fetch products for a category in safe pages, with expanded variants
const fetchProductsByCategory = async (categoryId: string) => {
  const perPage = 100; // safe page size
  let page = 1;
  const all: any[] = [];

  while (true) {
    const resp: any = await swell.get("/products", {
      limit: perPage,
      page,
      // filter server-side instead of fetching everything
      where: { "category_index.id": { $in: [categoryId] } },
      // expand variants properly (request up to 200 per product)
      expand: ["variants:200"],
    });

    all.push(...resp.results);

    // stop when no more pages
    if (!resp.pages?.next || resp.results.length < perPage) break;
    page++;
  }

  return all;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categoryId = req.body?.data?.id;
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const products = await fetchProductsByCategory(categoryId);

    // Flatten into table items (same structure you had)
    const items = products.flatMap((product: any) => {
      const variants =
        product.variants?.length > 0
          ? product.variants
          : [
              {
                id: product.id,
                sku: product.sku,
                price: product.price,
                stock_level: product.stock_level,
              },
            ];

      return variants.map((variant: any) => ({
        id: variant.id,
        name: variant.sku || variant.name || product.name,
        price: variant.price ?? variant.sale_price ?? product.price,
        stock: variant.stock_level ?? 0,
        attributes: variant.options
          ? variant.options.reduce((acc: any, opt: any) => {
              acc[opt.name] = opt.value;
              return acc;
            }, {})
          : variant.attributes || {},
        description: product.description || "",
        quantity: 0,
      }));
    });

    return res.status(200).json({ products: items });
  } catch (error: any) {
    console.error("Error in getProducts:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to fetch products" });
  }
};

export default handler;
