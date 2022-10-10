import withLayout from "@/hoc/withLayout";
import { ProductSlider } from "@/views/Catalogue";
import {getAllCategories} from "../utils/swell/category.js"
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from "next";
import React, { useEffect, useState } from "react";
import { Category } from "types/products";

interface Props {
  categories? : any
}

const CataloguePage: React.FC<Props> = (props: Props) => {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    setCategories(props.categories)
  }, [props])
  if (categories === null || categories === undefined) return null;

  return (
    <div className="wrapper px-8 md:px-12  flex flex-col gap-10 mb-32">
      <div className="text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-semibold text-slate-200/50 ">
        Catalogue
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
            description="uidem at officiis explicabo, fugit delectus, voluptate solut recusandae cumque. Praesentium non quidem nisi delectus!"
          />
        ))}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async() => {
  const categories = await getAllCategories();
  return {
    props: {categories}
  }
}

export default (CataloguePage);
