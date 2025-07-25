import withLayout from "@/hoc/withLayout";
import { FilterProducts, GridProducts, HeaderProducts } from "@/views/Products";
import { useEffect, useState } from "react";
import Header from "@/modules/Header";
import { useRouter } from "next/router";
import axios from "axios";
import Loading from "@/modules/Loading";

const ProductsPage = () => {
  const router = useRouter();
  const { id, subcategory, category } = router.query;
  
  // Determine what we're looking for - prioritize id, then subcategory, then category
  const targetSlugOrId = id || subcategory || category;
  
  const [series, setSeries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('=== ProductsPage Debug ===');
        console.log('Router query:', router.query);
        console.log('Target slug/id:', targetSlugOrId);

        // Always fetch categories for navigation
        const categoriesResponse = await axios.get('/api/getCategories');
        console.log('Categories loaded:', categoriesResponse.data.categories?.length || 0);
        setCategories(categoriesResponse.data.categories || []);

        // If we have a target, try to fetch its data
        if (targetSlugOrId) {
          
          // Step 1: Try getAllSeries first (works with slugs)
          try {
            const seriesResponse = await axios.post('/api/getAllSeries', { 
              data: { slug: targetSlugOrId } 
            });
            console.log('getAllSeries response:', seriesResponse.data);
            
            if (seriesResponse.data.series && seriesResponse.data.series.length > 0) {
              console.log('✅ Found series navigation:', seriesResponse.data.series.length);
              setSeries(seriesResponse.data.series);
              setProducts([]); // Clear products when showing navigation
              return; // Found navigation, we're done
            }
          } catch (seriesError: any) {
            console.log('getAllSeries failed (normal for product pages):', seriesError.message);
          }

          // Step 2: Try getProducts (works with IDs)
          try {
            const productsResponse = await axios.post('/api/getProducts', { 
              data: { id: targetSlugOrId } 
            });
            console.log('getProducts response:', productsResponse.data);
            
            // FIXED: Check if getProducts returned series data
            if (productsResponse.data.series && productsResponse.data.series.length > 0) {
              console.log('✅ Found subcategory navigation from getProducts:', productsResponse.data.series.length);
              setSeries(productsResponse.data.series); // Set the series from getProducts response
              setProducts([]);
              return; // Found navigation, we're done
            }
            
            if (productsResponse.data.products && productsResponse.data.products.length > 0) {
              console.log('✅ Found products:', productsResponse.data.products.length);
              setProducts(productsResponse.data.products);
              setSeries([]); // Clear series when showing products
              return; // Found products, we're done
            }
          } catch (productError: any) {
            console.log('getProducts failed:', productError.message);
          }

          // Step 3: If nothing found, clear everything
          console.log('⚠️ No data found for:', targetSlugOrId);
          setSeries([]);
          setProducts([]);
        } else {
          // No target specified, show main categories
          console.log('📂 Showing main categories');
          setSeries([]);
          setProducts([]);
        }

      } catch (err: any) {
        console.error('❌ Fatal error:', err);
        
        if (axios.isAxiosError(err)) {
          if (err.response) {
            setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.message}`);
          } else if (err.request) {
            setError('No response from server. Please check your connection.');
          } else {
            setError(`Request error: ${err.message}`);
          }
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetSlugOrId, router.query]);

  // Show loading state
  if (loading) {
    return <Loading />;
  }

  // Show error state
  if (error) {
    return (
      <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no data and no categories
  if (categories.length === 0 && series.length === 0 && products.length === 0) {
    return (
      <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Found</h2>
          <p className="text-gray-600">Please check back later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center gap-12">
      <HeaderProducts categories={categories} slug={targetSlugOrId}/>

      <div className="grid grid-cols-12 w-full space-y-8 sm:space-y-0 sm:space-x-12">
        <FilterProducts categories={categories} />
        <GridProducts 
          seriesList={series.length > 0 ? series : products} 
          showDescription={true} 
        />
      </div>
    </div>
  );
};

export default withLayout(ProductsPage);