import withLayout from "@/hoc/withLayout";
import { FilterProducts, GridProducts, HeaderProducts } from "@/views/Products";
import { useEffect, useState } from "react";
import Header from "@/modules/Header";
import { useRouter } from "next/router";
import axios from "axios";
import Loading from "@/modules/Loading";

const ProductsPage = () => {
  const router = useRouter();
  const slug =
    router.query.subcategory !== undefined
      ? router.query.subcategory
      : router.query.category;
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const categories = async () => {
      const cat = await axios.get(
        `${process.env.NEXT_PUBLIC_BASEURL}/getCategories`
      );
      return cat;
    };

    const series = async () => {
      const series = await axios.post(
        `${process.env.NEXT_PUBLIC_BASEURL}/getAllSeries`,
        { data: { slug } }
      );
      return series;
    };

    categories().then((result: any) => {
      setCategories(result.data.categories);
    });

    series().then((result: any) => {
      setSeries(result.data.series);
    });
  }, [slug]);

  if (categories.length === 0 || series.length === 0) {
    return <Loading />;
  }

  return (
    <div className="wrapper px-8 md:px-12   py-12 min-h-screen flex flex-col items-center gap-12  ">
      <HeaderProducts categories={categories} slug={slug}/>

      <div className="grid grid-cols-12  w-full space-y-8 sm:space-y-0 sm:space-x-12 ">
        <FilterProducts categories={categories} />
        <GridProducts seriesList={series} />
      </div>
    </div>
  );
};

export default ProductsPage;
