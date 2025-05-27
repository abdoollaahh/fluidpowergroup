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
  const [series, setSeries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories
        const categoriesResponse = await axios.get('/api/getCategories');
        console.log('Categories response:', categoriesResponse.data);
        
        if (categoriesResponse.data.categories) {
          setCategories(categoriesResponse.data.categories);
        } else if (Array.isArray(categoriesResponse.data)) {
          // Handle if API returns array directly
          setCategories(categoriesResponse.data);
        } else {
          console.error('Unexpected categories format:', categoriesResponse.data);
          setCategories([]);
        }

        // Fetch series if slug exists
        if (slug) {
          const seriesResponse = await axios.post('/api/getAllSeries', { data: { slug: slug } });
          console.log('Series response:', seriesResponse.data);
          
          if (seriesResponse.data.series) {
            setSeries(seriesResponse.data.series);
          } else if (Array.isArray(seriesResponse.data)) {
            // Handle if API returns array directly
            setSeries(seriesResponse.data);
          } else {
            console.error('Unexpected series format:', seriesResponse.data);
            setSeries([]);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        
        if (axios.isAxiosError(err)) {
          if (err.response) {
            // The request was made and the server responded with a status code
            setError(`Server error: ${err.response.status} - ${err.response.data?.error || err.message}`);
          } else if (err.request) {
            // The request was made but no response was received
            setError('No response from server. Please check your connection.');
          } else {
            // Something happened in setting up the request
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
  }, [slug]);

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

  // Show empty state if no data
  if (categories.length === 0) {
    return (
      <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Categories Found</h2>
          <p className="text-gray-600">Please check back later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center gap-12">
      <HeaderProducts categories={categories} slug={slug}/>

      <div className="grid grid-cols-12 w-full space-y-8 sm:space-y-0 sm:space-x-12">
        <FilterProducts categories={categories} />
        <GridProducts seriesList={series} showDescription={true} />
      </div>
    </div>
  );
};

export default ProductsPage;