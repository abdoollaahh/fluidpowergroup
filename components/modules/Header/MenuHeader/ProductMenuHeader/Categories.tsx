import Anchor from "@/modules/Anchor";
import clsx from "clsx";
import React from "react";
import { Category } from "types/products";

type ICategoriesProps = {
  setSelectedCategory: (val: Category) => void;
  selectedCategory: Category;
  categories: Category[];
};

const Categories = ({
  setSelectedCategory,
  selectedCategory,
  categories,
}: ICategoriesProps) => {
  return (
    <div className="flex flex-col gap-6  w-1/5 border-r z-10 text-black">
      {categories.map((category: Category) => (
        <Anchor href={`/products?category=${category.slug}`} key={category.id}>
          <h2
            className={clsx(
              "text-xl flex font-light items-center gap-1 cursor-pointer",
              selectedCategory.title === category.title
                ? "font-medium"
                : "font-light"
            )}
            onMouseEnter={() => setSelectedCategory(category)}
          >
            {category.title}
          </h2>
        </Anchor>
      ))}
      <Anchor href="/products" className={clsx("text-xl flex font-medium ")}>
        View all
      </Anchor>
    </div>
  );
};

export default Categories;
