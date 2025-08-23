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
          setSubcategories(result.data.series);
          setItems([]); // Clear products
        } else if (result.data.products && result.data.products.length > 0) {
          console.log('📦 Found products, displaying table');
          
          const sortedProducts = result.data.products.sort((a: IItemCart, b: IItemCart) => {
            const nameA = a.name;
            const nameB = b.name;
            
            const partsA = nameA.split('-');
            const partsB = nameB.split('-');
            
            // Extract the primary numeric identifier and detect base vs extension
            const analyzePartNumber = (parts: string[]) => {
              // Look for the first numeric part after the main prefix
              // For FPG-1J09-060G -> primary: 06, isBase: true
              // For FPG-1J09-06-080G -> primary: 06, isBase: false
              
              let primaryNumeric = null;
              let isBase = false;
              
              for (let i = 2; i < parts.length; i++) { // Start after FPG-1J09
                const part = parts[i];
                const match = part.match(/^(\d+)/);
                if (match) {
                  primaryNumeric = parseInt(match[1]);
                  // It's a base if this is the last part and ends with letters
                  isBase = (i === parts.length - 1) && /\d+[A-Z]+$/.test(part);
                  break;
                }
              }
              
              return {
                primary: primaryNumeric || 0,
                isBase: isBase,
                segmentCount: parts.length
              };
            };
            
            const infoA = analyzePartNumber(partsA);
            const infoB = analyzePartNumber(partsB);
            
            // First, sort by primary numeric value (06 vs 08 vs 10)
            if (infoA.primary !== infoB.primary) {
              return infoA.primary - infoB.primary;
            }
            
            // If same primary number, base versions come first
            if (infoA.primary === infoB.primary) {
              // Base version (fewer segments, ends with letters) comes first
              if (infoA.isBase && !infoB.isBase) return -1;
              if (!infoA.isBase && infoB.isBase) return 1;
              
              // If both are same type (base or extension), sort by segment count
              return infoA.segmentCount - infoB.segmentCount;
            }
            
            // Fallback to alphabetical
            return nameA.localeCompare(nameB);
          });
          
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