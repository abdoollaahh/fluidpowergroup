import db from "db";
import { useRouter } from "next/router";
import AccordionFilter from "./AccordionFilter";
import { useEffect, useMemo, useState } from "react";
import { LayoutGroup } from "framer-motion";
const FilterProducts = ({categories} : any) => {
  const {
    query: { category, subcategory },
    pathname,
  }: any = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    category as string
  );

  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  useEffect(() => {
    subcategory &&
      setSelectedCategory(
        categories.find((category: any) =>
          category.subCategories.find((item: any) => item.slug === subcategory)
        )?.slug || null
      );
  }, [subcategory, categories]);

  return (
    <div className="col-span-12 sm:col-span-3 xl:col-span-2 flex flex-col gap-4 ">
      <h3 className="text-xl font-normal">Filter By Category</h3>

      <LayoutGroup>
        <div className="flex flex-col">
          {categories.map((item: any) => (
            <AccordionFilter
              key={item.id}
              category={item}
              open={selectedCategory === item.slug}
              selectedSubCategory={subcategory}
              selected={item.slug === category}
              handleClick={() => {
                setSelectedCategory(
                  (!(selectedCategory === item.slug) && item.slug) || null
                );
              }}
            />
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
};

export default FilterProducts;
