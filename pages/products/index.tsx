// index.tsx - Updated with pagination and performance optimizations
import withLayout from "@/hoc/withLayout";
import { FilterProducts, GridProducts, HeaderProducts } from "@/views/Products";
import { useEffect, useState, useCallback, useMemo } from "react";
import Header from "@/modules/Header";
import { useRouter } from "next/router";
import axios from "axios";
import Loading from "@/modules/Loading";
import { sortProductsAlphanumerically } from "../../utils/productSorting";

const ProductsPage = () => {
  const router = useRouter();
  const { id, subcategory, category } = router.query;
  
  const targetSlugOrId = id || subcategory || category;
  
  const [series, setSeries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // NEW: Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false
  });
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Memoize categories to prevent unnecessary re-renders
  const memoizedCategories = useMemo(() => categories, [categories]);

  // NEW: Load more products function
  const loadMoreProducts = useCallback(async () => {
    if (!targetSlugOrId || loadingMore || !pagination.hasNext) return;

    try {
      setLoadingMore(true);
      
      const response = await axios.post('/api/getProducts', { 
        data: { 
          id: targetSlugOrId,
          page: pagination.page + 1,
          limit: pagination.limit,
          loadAll: false
        } 
      });

      if (response.data.products && response.data.products.length > 0) {
        const sortedNewProducts = sortProductsAlphanumerically(response.data.products);
        setProducts(prev => [...prev, ...sortedNewProducts]);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [targetSlugOrId, loadingMore, pagination]);

  // NEW: Intersection observer for infinite scroll
  useEffect(() => {
    if (!hasInitialLoad || !pagination.hasNext) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('load-more-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [loadMoreProducts, hasInitialLoad, pagination.hasNext, loadingMore]);

  // Main data fetching effect
  useEffect(() => {
    if (!router.isReady) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setHasInitialLoad(false);
        
        // Reset pagination and products
        setPagination({ page: 1, limit: 20, total: 0, hasNext: false });
        setProducts([]);
        setSeries([]);
        
        console.log('=== ProductsPage Debug ===');
        console.log('Target slug/id:', targetSlugOrId);

        // Always fetch categories for navigation (cached on client)
        const categoriesResponse = await axios.get('/api/getCategories');
        setCategories(categoriesResponse.data.categories || []);

        if (targetSlugOrId) {
          // NEW: Try paginated approach first
          try {
            const productsResponse = await axios.post('/api/getProducts', { 
              data: { 
                id: targetSlugOrId,
                page: 1,
                limit: 20,
                loadAll: false // Use pagination
              } 
            });
            
            console.log('Paginated getProducts response:', productsResponse.data);
            
            // Check if we got series data (subcategories)
            if (productsResponse.data.series && productsResponse.data.series.length > 0) {
              console.log('✅ Found subcategory navigation:', productsResponse.data.series.length);
              const sortedSeries = sortProductsAlphanumerically(productsResponse.data.series);
              setSeries(sortedSeries);
              setProducts([]);
              setHasInitialLoad(true);
              return;
            }
            
            // Check if we got products with pagination
            if (productsResponse.data.products && productsResponse.data.products.length > 0) {
              console.log('✅ Found paginated products:', productsResponse.data.products.length);
              const sortedProducts = sortProductsAlphanumerically(productsResponse.data.products);
              setProducts(sortedProducts);
              setSeries([]);
              
              if (productsResponse.data.pagination) {
                setPagination(productsResponse.data.pagination);
              }
              
              setHasInitialLoad(true);
              return;
            }
          } catch (productError: any) {
            console.log('Paginated getProducts failed, trying fallback:', productError.message);
            
            // Fallback to load all (your existing approach)
            try {
              const fallbackResponse = await axios.post('/api/getProducts', { 
                data: { 
                  id: targetSlugOrId,
                  loadAll: true // Use your existing logic
                } 
              });
              
              if (fallbackResponse.data.products && fallbackResponse.data.products.length > 0) {
                console.log('✅ Found products via fallback:', fallbackResponse.data.products.length);
                const sortedProducts = sortProductsAlphanumerically(fallbackResponse.data.products);
                setProducts(sortedProducts);
                setSeries([]);
                setHasInitialLoad(true);
                return;
              }
            } catch (fallbackError: any) {
              console.log('Fallback also failed:', fallbackError.message);
            }
          }

          // Try getAllSeries as final fallback
          try {
            const seriesResponse = await axios.post('/api/getAllSeries', { 
              data: { slug: targetSlugOrId } 
            });
            
            if (seriesResponse.data.series && seriesResponse.data.series.length > 0) {
              console.log('✅ Found series from getAllSeries:', seriesResponse.data.series.length);
              const sortedSeries = sortProductsAlphanumerically(seriesResponse.data.series);
              setSeries(sortedSeries);
              setProducts([]);
              setHasInitialLoad(true);
              return;
            }
          } catch (seriesError: any) {
            console.log('getAllSeries also failed:', seriesError.message);
          }

          console.log('⚠️ No data found for:', targetSlugOrId);
          setSeries([]);
          setProducts([]);
        } else {
          console.log('📂 Showing main categories');
          setSeries([]);
          setProducts([]);
        }
        
        setHasInitialLoad(true);

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
  }, [router.isReady, targetSlugOrId]);

  // Show loading while router is not ready or while fetching
  if (!router.isReady || loading) {
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

  // Show empty state
  if (memoizedCategories.length === 0 && series.length === 0 && products.length === 0) {
    return (
      <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Found</h2>
          <p className="text-gray-600">Please check back later or contact support.</p>
        </div>
      </div>
    );
  }

  const dataToShow = series.length > 0 ? series : products;

  return (
    <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center gap-12">
      <HeaderProducts categories={memoizedCategories} slug={targetSlugOrId}/>

      <div className="grid grid-cols-12 w-full space-y-8 sm:space-y-0 sm:space-x-12">
        <FilterProducts categories={memoizedCategories} />
        <GridProducts 
          seriesList={dataToShow} 
          showDescription={true} 
        />
      </div>

      {/* NEW: Load More Section */}
      {products.length > 0 && pagination.hasNext && (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Intersection observer sentinel */}
          <div id="load-more-sentinel" className="h-4" />
          
          {loadingMore && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-600">Loading more products...</span>
            </div>
          )}
          
          {/* Manual load more button as backup */}
          {!loadingMore && (
            <button
              onClick={loadMoreProducts}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Load More ({pagination.total - products.length} remaining)
            </button>
          )}
        </div>
      )}

      {/* Show total count */}
      {products.length > 0 && (
        <div className="text-center text-gray-600">
          Showing {products.length} of {pagination.total} products
        </div>
      )}
    </div>
  );
};

export default ProductsPage;