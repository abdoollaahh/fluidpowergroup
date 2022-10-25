import Footer from "@/modules/Footer";
import Header from "@/modules/Header";
import {
  DescriptionProduct,
  ImageProduct,
  OrderSummaryProduct,
  TableProduct,
} from "@/views/Product";
import { useEffect, useState } from "react";
import { IItemCart } from "types/cart";
import axios from "axios";
import { useRouter } from "next/router"
import Loading from "@/modules/Loading"

type ISeries = {
  name: string,
  description: string,
  images: string[]
}

const ProductPage = () => {
  const router = useRouter()
  const id = router.query.id
  const [items, setItems] = useState<IItemCart[]>([])
  const [series, setSeries] = useState <ISeries>()
  useEffect(() => {
    const products = async () => {
      const prod = await axios.post(`${process.env.NEXT_PUBLIC_BASEURL}/getProducts`, { data: { id } })
      console.log(prod)
      return prod
    }
    
    const seriesDetails = async () => {
      const details = await axios.post(`${process.env.NEXT_PUBLIC_BASEURL}/getSeriesDetails`, { data: { id } })
      return details
    }

    products().then((result: any) => {
      setItems(result.data.products)
    }
    )

    seriesDetails().then((result: any) => {
      setSeries(result.data.series)
    })
  }, [id])

  if (series == null ) {
    return <Loading />
  } 

  return (
      <div className="pt-10 pb-12  lg:pt-14 lg:pb-20 flex flex-col gap-10 sm:gap-16">
        <div className="max-w-2xl lg:max-w-full w-full mx-auto mb-4">
          <div className="grid grid-cols-12 h-full   space-y-6 lg:space-y-0 space-x-0 lg:space-x-6      mx-auto  wrapper   px-8 md:px-12 overflow-hidden">
            <ImageProduct images={ series.images} />
            <DescriptionProduct series={series}/>
          </div>
      </div>
      {items.length !==0 &&<TableProduct items={items} setItems={setItems} />}
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

export default ProductPage;
