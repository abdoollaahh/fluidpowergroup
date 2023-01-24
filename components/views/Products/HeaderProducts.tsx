import { useEffect, useState } from "react";
import { Category } from "types/products";

const HeaderProducts = ({categories, slug} : {categories: Category[], slug: string | string[] |undefined}) => {
  const [description, setDescription] = useState(categories[0].description)

  useEffect(() => {
    console.log()
    categories.forEach((category) => {
      slug?.includes(category.slug) && setDescription(category.description)
    })
  }, [slug])

  return (
    <div className="flex flex-col items-center gap-3">
      <h1 className="text-4xl font-semibold">Products</h1>
      <h2 className="text-xl font-light text-center">
        {description}
      </h2>
    </div>
  );
};

export default HeaderProducts;
