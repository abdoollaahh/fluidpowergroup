import withLayout from "@/hoc/withLayout";
import { FilterProducts, GridProducts, HeaderProducts } from "@/views/Products";
import { GetServerSideProps} from "next";
import { useEffect, useState } from "react";
import Header from "@/modules/Header";
import { getAllSeries } from "utils/swell/series";
import { getAllCategories } from "utils/swell/category";

interface Props {
  seriesList: any,
  categories: any
}

const ProductsPage = (props: Props) => {

  const [series, setSeries] = useState([])
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    setSeries(props.seriesList);
    if (props.categories !== undefined) {
      setCategories(props.categories);
    }
    
  }, [props])

  return (
    <div className="wrapper px-8 md:px-12   py-12 min-h-screen flex flex-col items-center gap-12  ">
      <HeaderProducts />

      <div className="grid grid-cols-12  w-full space-y-8 sm:space-y-0 sm:space-x-12 ">
        <FilterProducts categories = { categories} />
        <GridProducts seriesList={ series} />
      </div>
      </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  let slug;
  slug = query.subcategory !== undefined ? query.subcategory : query.category
  const categories = await getAllCategories();
  const seriesList = await getAllSeries(slug)
  return {
    props: {
      slug,
      seriesList,
      categories
    }
  }
}

export default (ProductsPage);
