import Footer from '@/modules/Footer';
import Header from '@/modules/Header';
import {
  DescriptionProduct,
  ImageProduct,
  OrderSummaryProduct,
  TableProduct,
} from '@/views/Product';
import { useEffect, useState } from 'react';
import { IItemCart } from 'types/cart';
import axios from 'axios';
import { useRouter } from 'next/router';
import Loading from '@/modules/Loading';

type ISeries = {
  name: string;
  description: string;
  images: string[];
};

const ProductPage = () => {
  const router = useRouter();
  const id = router.query.id;
  const [items, setItems] = useState<IItemCart[]>([]);
  const [series, setSeries] = useState<ISeries>();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const products = async () => {
      try {
        const prod = await axios.post(
          `/api/getProducts`,
          { data: { id } }
        );
        console.log('=== ProductPage API Response ===');
        console.log('Full response:', prod.data);
        console.log('Products found:', prod.data.products?.length || 0);
        console.log('Series found:', prod.data.series?.length || 0);
        console.log('=== End ProductPage Debug ===');
        return prod;
      } catch (error) {
        console.error('Error fetching products:', error);
        return undefined;
      }
    };

    const seriesDetails = async () => {
      try {
        const details = await axios.post(
          `/api/getSeriesDetails`,
          { data: { id } }
        );
        console.log('SeriesDetails response:', details.data);
        return details;
      } catch (error) {
        console.error('Error fetching series details:', error);
        return undefined;
      }
    };

    products().then((result: any) => {
      if (result?.data) {
        // Check if we got series data instead of products (Level 4 category)
        if (result.data.series && result.data.series.length > 0 && (!result.data.products || result.data.products.length === 0)) {
          console.log('🔄 Detected category with subcategories - need to get category slug for redirect');
          console.log('Series data:', result.data.series);
          
          // Get the current category's details to find its slug
          seriesDetails().then((seriesResult: any) => {
            if (seriesResult?.data?.series) {
              console.log('Current category details:', seriesResult.data.series);
              
              // Check if the series details contain a slug or name we can use
              // We need to construct the redirect URL using the current category's slug
              // For "Elbow - 90°" it should be "jic-joint-industry-council-elbow-90"
              
              setIsRedirecting(true);
              
              // TEMPORARY: Let's see what data we get first
              console.log('Would redirect with this data - checking structure first');
              // For now, redirect to main products to avoid infinite loops
              router.push(`/products`);
            }
          });
          
          return;
        }
        
        // Normal product display (Level 3 and final products)
        console.log('✅ Displaying products in table format');
        setItems(result.data.products || []);
      }
    });

    seriesDetails().then((result: any) => {
      setSeries(result.data.series);
    });
  }, [id, router]);

  // Show loading during redirect
  if (isRedirecting) {
    return <Loading />;
  }

  if (series == null) {
    return <Loading />;
  }

  return (
    <div className="pt-10 pb-12  lg:pt-14 lg:pb-20 flex flex-col gap-10 sm:gap-16">
      <div className="max-w-2xl lg:max-w-full w-full mx-auto mb-4">
        <div className="grid grid-cols-12 h-full space-y-6 lg:space-y-0 space-x-0 lg:space-x-6 mx-auto  wrapper   px-8 md:px-12 overflow-hidden">
          <ImageProduct images={series.images} />
          <DescriptionProduct items={items[0]} series={series} />
        </div>
      </div>
      {items.length !== 0 && <TableProduct items={items} setItems={setItems} />}
      <div className="max-w-2xl lg:max-w-full w-full mx-auto ">
        <OrderSummaryProduct
          items={items}
          series={series}
          handleClear={() =>
            setItems(items.map((item) => ({ ...item, quantity: 0 })))
          }
        />
      </div>
    </div>
  );
};

export default ProductPage;