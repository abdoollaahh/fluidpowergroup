import Footer from "@/modules/Footer";
import Header from "@/modules/Header";
import {
  DescriptionProduct,
  ImageProduct,
  OrderSummaryProduct,
  TableProduct,
} from "@/views/Product";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useEffect, useState } from "react";
import { IItemCart } from "types/cart";
import { getAllProducts } from "utils/swell/products";
import {getSeriesDetails} from "utils/swell/series"

interface Props {
  products: any,
  query: string,
  series: any
}

const ProductPage = ({ products, query, series }: Props) => {
  const [items, setItems] = useState<IItemCart[]>([])
  useEffect(() => {
    setItems(products)
  }, [products, query])

  return (
      <div className="pt-10 pb-12  lg:pt-14 lg:pb-20 flex flex-col gap-10 sm:gap-16">
        <div className="max-w-2xl lg:max-w-full w-full mx-auto mb-4">
          <div className="grid grid-cols-12 h-full   space-y-6 lg:space-y-0 space-x-0 lg:space-x-6      mx-auto  wrapper   px-8 md:px-12 overflow-hidden">
            <ImageProduct images={ series.images} />
            <DescriptionProduct series={series}/>
          </div>
        </div>
        <TableProduct items={items} setItems={setItems} />
        <div className="max-w-2xl lg:max-w-full w-full mx-auto ">
          <OrderSummaryProduct
            items={items}
            handleClear={() =>
              setItems(items.map((item) => ({ ...item, quantity: 0})))
            }
          />
        </div>
      </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const products = await getAllProducts(context.query.id)
  const series = await getSeriesDetails(context.query.id)
  return {
    props: {
      query: context.query.id,
      products,
      series
    }
    
  }
}

export default ProductPage;
