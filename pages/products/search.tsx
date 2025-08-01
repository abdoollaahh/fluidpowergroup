import withLayout from "@/hoc/withLayout";
import { FilterProducts, GridProducts, HeaderProducts } from "@/views/Products";
import { useEffect, useState } from "react";
import Header from "@/modules/Header";
import { useRouter } from "next/router";
import axios from "axios";
import Loading from "@/modules/Loading";
import { AnimatePresence, motion } from "framer-motion";

type searchParams = {
  title: string | null;
  categories: string | null;
  subCategories: string | null;
  extraParams?: string | null;
};

const Search = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<searchParams>({
    title: null, 
    categories: null, 
    subCategories: null, 
    extraParams: null
  });
  const [data, setData] = useState<any>([]);
  const [filteredData, setFilteredData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string>("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching categories for search...');
        const response = await axios.get('/api/getAllProducts');
        console.log('Categories response:', response.data);
        
        if (response.data && response.data.categories) {
          setData(response.data.categories);
          console.log('Categories loaded successfully:', response.data.categories.length);
        } else {
          console.warn('No categories found in response');
          setData([]);
        }
        
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to load search data');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Extract values to avoid dependency warning
  const categoryTitle = selectedCategory.title;
  const categoryName = selectedCategory.categories;

  useEffect(() => {
    let newFilteredData: any[] = [];

    // Only filter if we have both title and categories selected
    if (categoryTitle && categoryName && data.length > 0) {
      console.log('Filtering data for:', { title: categoryTitle, category: categoryName });
      
      data.forEach((product: any) => {
        if (product.title === categoryTitle) {
          console.log('Found matching product:', product.title);
          console.log('Product subCategories:', product.subCategories);
          
          product.subCategories.forEach((cat: any) => {
            if (cat.title.toLowerCase().includes(categoryName.toLowerCase())) {
              console.log('Found matching category:', cat.title);
              if (cat.series && cat.series.length > 0) {
                // Show all series in the category - no subcategory filtering
                newFilteredData = [...newFilteredData, ...cat.series];
              }
            }
          });
        }
      });
      
      console.log('Filtered results:', newFilteredData.length);
    }
    
    setFilteredData(newFilteredData);
  }, [categoryTitle, categoryName, data]);

  const variants = {
    initial: { opacity: 0, x: -100 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, staggerChildren: 0.5 },
    },
    exit: { opacity: 0, y: -100, transition: { duration: 0.3 } },
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Search Error</h2>
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

  return (
    <div className="px-8 md:px-12 py-12 min-h-screen">
      <div className="text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-bold text-slate-200/50 md:mx-10 ">
        Search
      </div>
      <div className="wrapper flex flex-col gap-12 items-center px-10">
        <div className="w-full p-5 px-8 rounded-md shadow-lg hover:shadow-xl transition duration-200">
          <div>
            <div>
              {/* Dynamic categories from database */}
              {data.map((product: any, index: number) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row justify-start items-start my-2"
                >
                  <div
                    className="w-[30%] max-w-[200px]"
                    onClick={() => {
                      console.log('Selected product:', product.title);
                      setSelectedCategory({
                        title: product.title,
                        categories: null,
                        subCategories: null,
                        extraParams: null,
                      });
                      setOpen(product.title);
                    }}
                  >
                    <span
                      className={`text-lg font-bold ${
                        open === product.title
                          ? "text-primary"
                          : "text-slate-700"
                      } cursor-pointer`}
                    >
                      {product.title}
                    </span>
                  </div>
                  {open === product.title && (
                    <AnimatePresence>
                      <div>
                        <motion.div
                          variants={variants}
                          initial={"initial"}
                          animate={"animate"}
                          exit={"exit"}
                          transition={{ duration: 0.5, staggerChildren: 0.5 }}
                        >
                          <div>
                            <span className="text-md font-bold text-black">
                              Categories
                            </span>
                            <motion.div className="flex mt-2 flex-wrap">
                              {product.subCategories.map((category: any, catIndex: number) => (
                                <div
                                  className={`border-2 rounded-xl mr-4 px-4 py-1 flex justify-center items-center my-2 hover:cursor-pointer
                                  ${
                                    selectedCategory.categories === category.title
                                      ? "border-slate-700 text-slate-700 bg-primary"
                                      : "border-slate-700"
                                  }
                                  `}
                                  key={catIndex}
                                  onClick={() => {
                                    console.log('Selected category:', category.title);
                                    setSelectedCategory({
                                      ...selectedCategory,
                                      categories: category.title,
                                    });
                                  }}
                                >
                                  {category.title}
                                </div>
                              ))}
                            </motion.div>
                          </div>
                          
                          {/* Show series as sub-categories if a category is selected */}
                          {selectedCategory.categories && (
                            <div className="mt-2">
                              <span className="text-md font-bold text-black">
                                Sub-Categories
                              </span>
                              <div className="flex mt-2 flex-wrap mb-5">
                                {product.subCategories
                                  .find((cat: any) => cat.title === selectedCategory.categories)
                                  ?.series?.map((series: any, seriesIndex: number) => (
                                    <div
                                      className={`
                                    border-2 rounded-xl mr-4 mt-2 px-4 py-1 flex justify-center items-center hover:cursor-pointer hover:bg-blue-50 transition-colors
                                    border-slate-700
                                    `}
                                      key={seriesIndex}
                                      onClick={() => {
                                        console.log('Navigating to series:', series.title, 'with slug:', series.slug);
                                        
                                        // Check if this series has sub-items (making it a category) or if it's a final product
                                        // Try multiple navigation strategies based on the data structure
                                        
                                        if (series.slug) {
                                          // First try as subcategory
                                          router.push(`/products?subcategory=${series.slug}`);
                                        } else if (series.id) {
                                          // Try as category ID
                                          router.push(`/products?id=${series.id}`);
                                        } else if (series.subCategory && series.category) {
                                          // Try with category and subcategory structure
                                          router.push(`/products?category=${series.category}&subcategory=${series.subCategory}`);
                                        } else {
                                          // Fallback: try direct product navigation
                                          router.push(`/products/${series.id || series.slug || series.title}`);
                                        }
                                      }}
                                    >
                                      {series.title}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Show data availability info */}
        <div className="text-sm text-gray-500">
          Loaded {data.length} product categories
          {filteredData.length > 0 && ` • Found ${filteredData.length} results`}
        </div>
      </div>
      
      <motion.div className="p-10">
        <GridProducts
          seriesList={filteredData}
          showDescription={Boolean(false)}
        />
      </motion.div>
    </div>
  );
};

export default withLayout(Search);