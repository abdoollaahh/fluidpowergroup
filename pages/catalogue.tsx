import withLayout from "@/hoc/withLayout";
import { ProductSlider } from "@/views/Catalogue";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Category } from "types/products";
import Loading from "@/modules/Loading";

const CataloguePage = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const categories = async () => {
      const cat = await axios.get(
        `/api/getCategories`
      );
      return cat;
    };

    categories().then((result: any) => {
      setCategories(result.data.categories);
    });
  }, []);
  if (categories === null || categories === undefined) return <Loading />;

  return (
    <div className="wrapper px-8 md:px-12  flex flex-col gap-10 mb-32">
      <div className="text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-semibold text-slate-200/50 ">
        Products
      </div>
      <div className="flex flex-col gap-12">
        {categories.map((category: Category, i) => (
          <ProductSlider
            products={category.subCategories}
            title={category.title}
            btn={{
              title: "View All",
              href: `/products?category=${category.slug}`,
            }}
            key={i}
            description={category.description}
          />
        ))}
      </div>
    </div>
  );
};

export default CataloguePage;
