import Footer from '@/modules/Footer';
import Header from '@/modules/Header';
import {
  DescriptionProduct,
  ImageProduct,
  OrderSummaryProduct,
  TableProduct,
} from '@/views/Product';
import { GridProducts } from '@/views/Products';
import { useEffect, useState } from 'react';
import { IItemCart } from 'types/cart';
import axios from 'axios';
import { useRouter } from 'next/router';
import Loading from '@/modules/Loading';
// Import the sorting utility
import { sortProductsAlphanumerically } from '../../utils/productSorting';

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
  const [subcategories, setSubcategories] = useState<any[]>([]);

  useEffect(() => {
    if (router.isReady && id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, router.isReady]);

  useEffect(() => {
    const products = async () => {
      try {
        const prod = await axios.post(
          `/api/getProducts`,
          { data: { id } }
        );
        console.log('API Response:', prod.data);
        return prod;
      } catch (error) {
        console.error('Error fetching products:', error);
        return undefined;
      }
    };

    const seriesDetails = async () => {
      const details = await axios.post(
        `/api/getSeriesDetails`,
        { data: { id } }
      );
      return details;
    };

    products().then((result: any) => {
      if (result?.data) {
        // Check if we got series data (subcategories)
        if (result.data.series && result.data.series.length > 0) {
          console.log('📂 Found subcategories, displaying grid');
          // Sort the subcategories using the new utility
          const sortedSubcategories = sortProductsAlphanumerically(result.data.series);
          setSubcategories(sortedSubcategories);
          setItems([]); // Clear products
        } else if (result.data.products && result.data.products.length > 0) {
          console.log('📦 Found products, displaying table');
          
          // Use the new general sorting utility instead of the complex custom logic
          const sortedProducts = sortProductsAlphanumerically(result.data.products);
          
          setItems(sortedProducts);
          setSubcategories([]);
        }
      }
    });

    seriesDetails().then((result: any) => {
      setSeries(result.data.series);
    });
  }, [id]);

  if (series == null) {
    return <Loading />;
  }

  // If we have subcategories, show them in a grid
  if (subcategories.length > 0) {
    return (
      <div className="pt-10 pb-12 lg:pt-14 lg:pb-20 flex flex-col gap-10 sm:gap-16">
        {/* Just show the category title and grid - no large product image */}
        <div className="wrapper px-8 md:px-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">{series?.name}</h1>
            {series?.description && (
              <p className="text-gray-600 mt-2">{series.description}</p>
            )}
          </div>
          <GridProducts 
            seriesList={subcategories} 
            showDescription={true} 
          />
        </div>
      </div>
    );
  }

  // Default: show products in table format
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