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
  subSubCategories: string | null;  // NEW: Level 3 for 4-deep products
  finalProducts: string | null;     // NEW: Level 4 for 4-deep products
  extraParams?: string | null;
};

const Search = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<searchParams>({
    title: null, 
    categories: null, 
    subCategories: null, 
    subSubCategories: null,  // NEW
    finalProducts: null,     // NEW
    extraParams: null
  });
  const [data, setData] = useState<any>([]);
  const [filteredData, setFilteredData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string>("");
  const [level3Data, setLevel3Data] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState<'quick' | 'part'>('quick');
  const [partSearchQuery, setPartSearchQuery] = useState<string>('');
  const [partSearchResults, setPartSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);  // NEW: Store Level 3 data

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
          
          // DEBUG: Log the structure of the first category to understand data format
          if (response.data.categories.length > 0) {
            console.log('=== SEARCH DEBUG: First category structure ===');
            console.log('First category:', response.data.categories[0]);
            if (response.data.categories[0].subCategories?.length > 0) {
              console.log('First subcategory:', response.data.categories[0].subCategories[0]);
              if (response.data.categories[0].subCategories[0].series?.length > 0) {
                console.log('First series:', response.data.categories[0].subCategories[0].series[0]);
              }
            }
          }
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

  // Part Number Search Logic
  useEffect(() => {
    const searchPartNumbers = async () => {
      if (!partSearchQuery.trim() || searchMode !== 'part') {
        setPartSearchResults([]);
        return;
      }
  
      setIsSearching(true);
      try {
        console.log(`Searching for: FPG-${partSearchQuery}`);
        
        const response = await axios.post('/api/searchProducts', {
          query: `FPG-${partSearchQuery}`,
          searchType: 'partNumber'
        });
        
        console.log('Search response:', response.data);
        
        if (response.data.products && response.data.products.length > 0) {
          setPartSearchResults(response.data.products);
          console.log(`Found ${response.data.products.length} matching products`);
        } else {
          setPartSearchResults([]);
          console.log('No products found');
        }
        
      } catch (error: any) {
        console.error('Part search error:', error);
        setPartSearchResults([]);
        
        // Handle specific error cases
        if (error.response?.status === 400) {
          console.log('Search query too short or invalid');
        } else if (error.response?.status === 500) {
          console.log('Server error during search');
        } else {
          console.log('Network error during search');
        }
      } finally {
        setIsSearching(false);
      }
    };
  
    // Debounce search by 300ms
    const debounceTimer = setTimeout(searchPartNumbers, 300);
    return () => clearTimeout(debounceTimer);
  }, [partSearchQuery, searchMode]);

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
    <div className="px-4 sm:px-8 md:px-12 py-8 md:py-12 min-h-screen">
      <div className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-bold text-slate-200/50 px-2 sm:px-4 md:px-10">
        Search
      </div>
      
      {/* Header-Style Glass Morphism Tabs */}
      <div className="wrapper flex flex-col gap-8 md:gap-12 items-center px-2 sm:px-6 md:px-10">
        <div className="w-full flex justify-center mb-4">
          {/* Container with exact same styling as header actions */}
          <div 
            style={{
              background: "rgba(0, 0, 0, 0.15)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "50px",
              padding: "8px 12px 12px 12px",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div className="flex items-center gap-1">
              {/* Quick Search Tab */}
              <button
                onClick={() => setSearchMode('quick')}
                className="relative overflow-hidden"
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "inline-block",
                  padding: "12px 16px",
                  borderRadius: "40px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  whiteSpace: "nowrap",
                  minWidth: "max-content",
                  // Active/Inactive styling
                  ...(searchMode === 'quick' ? {
                    // Active tab - Yellow gradient like header hover
                    background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                    border: "1px solid rgba(255, 215, 0, 0.9)",
                    color: "#000",
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow: `
                      0 10px 30px rgba(250, 204, 21, 0.6),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 3px 10px rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                    `
                  } : {
                    // Inactive tab - Default glass
                    background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`,
                    backdropFilter: "blur(15px)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    color: "#333",
                    boxShadow: `
                      0 4px 15px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6),
                      inset 0 2px 8px rgba(255, 255, 255, 0.2),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                    `
                  })
                }}
                onMouseEnter={(e) => {
                  if (searchMode !== 'quick') {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.color = "#000";
                  }
                }}
                onMouseLeave={(e) => {
                  if (searchMode !== 'quick') {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.4)";
                    e.currentTarget.style.color = "#333";
                  }
                }}
              >
                {/* Glass shine effect */}
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "8px",
                    right: "8px",
                    height: "50%",
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    borderRadius: "40px 40px 20px 20px",
                    pointerEvents: "none",
                    transition: "all 0.4s ease"
                  }}
                />
                Quick Search
              </button>

              {/* Part Number Search Tab */}
              <button
                onClick={() => setSearchMode('part')}
                className="relative overflow-hidden"
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "inline-block",
                  padding: "12px 16px",
                  borderRadius: "40px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  whiteSpace: "nowrap",
                  minWidth: "max-content",
                  // Active/Inactive styling
                  ...(searchMode === 'part' ? {
                    // Active tab - Yellow gradient like header hover
                    background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                    border: "1px solid rgba(255, 215, 0, 0.9)",
                    color: "#000",
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow: `
                      0 10px 30px rgba(250, 204, 21, 0.6),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 3px 10px rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                    `
                  } : {
                    // Inactive tab - Default glass
                    background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`,
                    backdropFilter: "blur(15px)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    color: "#333",
                    boxShadow: `
                      0 4px 15px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6),
                      inset 0 2px 8px rgba(255, 255, 255, 0.2),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                    `
                  })
                }}
                onMouseEnter={(e) => {
                  if (searchMode !== 'part') {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.color = "#000";
                  }
                }}
                onMouseLeave={(e) => {
                  if (searchMode !== 'part') {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.4)";
                    e.currentTarget.style.color = "#333";
                  }
                }}
              >
                {/* Glass shine effect */}
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "8px",
                    right: "8px",
                    height: "50%",
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    borderRadius: "40px 40px 20px 20px",
                    pointerEvents: "none",
                    transition: "all 0.4s ease"
                  }}
                />
                Part Number Search
              </button>
            </div>
          </div>
        </div>
        
        {/* Conditional Search Interface */}
        {searchMode === 'quick' ? (
          // EXISTING QUICK SEARCH
          <div className="w-full p-4 sm:p-5 sm:px-8 rounded-md shadow-lg hover:shadow-xl transition duration-200">
            <div>
              <div>
                {/* Dynamic categories from database */}
                {data.map((product: any, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-start items-start my-2"
                  >
                    <div
                      className="w-full md:w-[30%] md:max-w-[200px] mb-3 md:mb-0"
                      onClick={() => {
                        console.log('Selected product:', product.title);
                        setSelectedCategory({
                          title: product.title,
                          categories: null,
                          subCategories: null,
                          subSubCategories: null,  // ADD: Reset all deeper levels
                          finalProducts: null,     // ADD: Reset all deeper levels
                          extraParams: null,
                        });
                        setOpen(product.title);
                      }}
                    >
                      <span
                        className={`text-base sm:text-lg font-bold ${
                          open === product.title
                            ? "text-primary"
                            : "text-slate-700"
                        } cursor-pointer block`}
                      >
                        {product.title}
                      </span>
                    </div>
                    {open === product.title && (
                      <AnimatePresence>
                        <motion.div
                          key={product.title} // Add key prop here
                          variants={variants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.5, staggerChildren: 0.5 }}
                          className="w-full md:flex-1"
                        >
                          <div>
                            <span className="text-sm sm:text-md font-bold text-black">
                              Categories
                            </span>
                            <motion.div className="flex mt-2 flex-wrap">
                              {product.subCategories.map((category: any, catIndex: number) => (
                                <div
                                  className={`border-2 rounded-xl mr-2 sm:mr-4 px-2 sm:px-4 py-1 flex justify-center items-center my-1 sm:my-2 hover:cursor-pointer text-xs sm:text-sm
                                  ${
                                    selectedCategory.categories === category.title
                                      ? "border-slate-700 text-slate-700 bg-primary"
                                      : "border-slate-700"
                                  }
                                  `}
                                  key={catIndex}
                                  onClick={() => {
                                    console.log('Selected category:', category.title);
                                    console.log('=== SEARCH DEBUG: Category object ===');
                                    console.log('Full category object:', category);
                                    setSelectedCategory({
                                      ...selectedCategory,
                                      categories: category.title,
                                      subCategories: null,     // Reset deeper levels
                                      subSubCategories: null,  // Reset deeper levels  
                                      finalProducts: null      // Reset deeper levels
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
                            <div className="mt-3 sm:mt-2">
                              <span className="text-sm sm:text-md font-bold text-black">
                                Sub-Categories
                              </span>
                              <div className="flex mt-2 flex-wrap mb-3 sm:mb-5">
                                {product.subCategories
                                  .find((cat: any) => cat.title === selectedCategory.categories)
                                  ?.series?.map((series: any, seriesIndex: number) => (
                                    <div
                                      className={`
                                        border-2 rounded-xl mr-2 sm:mr-4 mt-1 sm:mt-2 px-2 sm:px-4 py-1 flex justify-center items-center hover:cursor-pointer hover:bg-blue-50 transition-colors text-xs sm:text-sm
                                        ${selectedCategory.subCategories === series.title ? "border-blue-500 bg-blue-100" : "border-slate-700"}
                                      `}
                                      key={seriesIndex}
                                      onClick={async () => {
                                        console.log('=== SUB-CATEGORY SELECTION ===');
                                        console.log('Selected sub-category:', series.title);
                                        console.log('Series object:', series);
                                        
                                        // FIXED: Better detection for 4-level vs 3-level products
                                        // For Steel Tubes (3-level): FPG-SSTI should navigate directly
                                        // For Hydraulic Adaptors (4-level): Should show more tabs
                                        
                                        // Check if the parent category suggests 4-level structure
                                        const parentCategory = selectedCategory.title;
                                        const is4LevelCategory = parentCategory === 'Hydraulic Adaptors';
                                        
                                        console.log('Parent category:', parentCategory);
                                        console.log('Is 4-level category?', is4LevelCategory);
                                        
                                        if (is4LevelCategory) {
                                          // Show as another level in search for 4-level categories
                                          console.log('4-LEVEL: Showing more tabs');
                                          console.log('Fetching Level 3 data for series ID:', series.id);
                                          
                                          // Fetch Level 3 data using the series ID
                                          try {
                                            const response = await axios.post('/api/getAllSeries', {
                                              data: { slug: series.slug }
                                            });
                                            console.log('Level 3 data response:', response.data);
                                            
                                            if (response.data.series && response.data.series.length > 0) {
                                              setLevel3Data(response.data.series);
                                              console.log('Level 3 data loaded:', response.data.series.length, 'items');
                                            } else {
                                              // Fallback: try getProducts API
                                              const fallbackResponse = await axios.post('/api/getProducts', {
                                                data: { id: series.id }
                                              });
                                              console.log('Level 3 fallback response:', fallbackResponse.data);
                                              
                                              if (fallbackResponse.data.series && fallbackResponse.data.series.length > 0) {
                                                setLevel3Data(fallbackResponse.data.series);
                                                console.log('Level 3 fallback data loaded:', fallbackResponse.data.series.length, 'items');
                                              }
                                            }
                                          } catch (error) {
                                            console.error('Error fetching Level 3 data:', error);
                                            setLevel3Data([]);
                                          }
                                          
                                          setSelectedCategory({
                                            ...selectedCategory,
                                            subCategories: series.title,
                                            subSubCategories: null,
                                            finalProducts: null
                                          });
                                        } else {
                                          // 3-level: Navigate directly to final product
                                          console.log('3-LEVEL: Navigating to final product');
                                          
                                          if (series.id) {
                                            const targetUrl = `/products/${series.id}`;
                                            console.log('Target URL:', targetUrl);
                                            router.push(targetUrl);
                                          } else {
                                            console.error('No series ID for navigation');
                                          }
                                        }
                                      }}
                                    >
                                      {series.title}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                          
                          {/* NEW: Show sub-sub-categories for 4-level deep products */}
                          {selectedCategory.subCategories && level3Data.length > 0 && (
                            <div className="mt-3 sm:mt-2">
                              <span className="text-sm sm:text-md font-bold text-black">
                                Product Types
                              </span>
                              <div className="flex mt-2 flex-wrap mb-3 sm:mb-5">
                                {level3Data.map((level3Item: any, level3Index: number) => (
                                  <div
                                    className={`
                                      border-2 rounded-xl mr-2 sm:mr-4 mt-1 sm:mt-2 px-2 sm:px-4 py-1 flex justify-center items-center hover:cursor-pointer hover:bg-blue-50 transition-colors text-xs sm:text-sm
                                      ${selectedCategory.subSubCategories === level3Item.title ? "border-green-500 bg-green-100" : "border-slate-700"}
                                    `}
                                    key={level3Index}
                                    onClick={() => {
                                      console.log('=== LEVEL 3 NAVIGATION ===');
                                      console.log('Selected Level 3 item:', level3Item.title);
                                      console.log('Level 3 object:', level3Item);
                                      
                                      // Navigate to final product table
                                      if (level3Item.id) {
                                        const targetUrl = `/products/${level3Item.id}`;
                                        console.log('FINAL NAVIGATION: Direct to product table');
                                        console.log('Target URL:', targetUrl);
                                        router.push(targetUrl);
                                      } else {
                                        console.error('No ID found for Level 3 item');
                                      }
                                    }}
                                  >
                                    {level3Item.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Show loading state for Level 3 */}
                          {selectedCategory.subCategories && level3Data.length === 0 && (
                            <div className="mt-3 sm:mt-2">
                              <span className="text-sm sm:text-md font-bold text-black">
                                Product Types
                              </span>
                              <div className="flex mt-2 flex-wrap mb-3 sm:mb-5">
                                <div className="text-xs sm:text-sm text-gray-500">
                                  Loading product types...
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // IMPROVED PART NUMBER SEARCH - Mobile Optimized
          <div className="w-full p-4 sm:p-5 sm:px-8 rounded-md shadow-lg hover:shadow-xl transition duration-200">
            <div className="flex flex-col items-center gap-4 sm:gap-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center px-2">
                Search by Part Number
              </h2>
              
              {/* Enhanced Part Number Search Input - Mobile First */}
              <div className="w-full max-w-sm sm:max-w-lg md:max-w-2xl px-1 sm:px-2 md:px-0">
                <div className="relative">
                  <div className="flex items-stretch w-full border-2 border-yellow-400 rounded-xl bg-white shadow-md focus-within:shadow-lg transition-shadow duration-200 overflow-hidden">
                    <div className="px-3 sm:px-4 py-3 bg-yellow-100 text-gray-700 font-medium border-r border-yellow-300 text-sm sm:text-base flex items-center justify-center min-w-[60px] sm:min-w-[80px]">
                      FPG-
                    </div>
                    <input
                      type="text"
                      value={partSearchQuery}
                      onChange={(e) => setPartSearchQuery(e.target.value)}
                      placeholder="Enter part number (e.g., SSTI, AJJ6J)"
                      className="
                        flex-1 min-w-0 px-3 sm:px-4 py-3 focus:outline-none
                        text-gray-800 text-sm sm:text-base
                        placeholder:text-gray-400 placeholder:text-xs sm:placeholder:text-sm
                      "
                    />
                  </div>
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                    </div>
                  )}
                </div>
                
                {/* Enhanced Search Instructions */}
                <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center leading-relaxed px-2">
                  Type part number without <span className="font-medium">&quot;FPG-&quot;</span> prefix. 
                  <br className="sm:hidden" />
                  <span className="hidden sm:inline"> </span>Results will appear as you type.
                </p>
              </div>
              
              {/* Enhanced Part Search Results */}
              {partSearchQuery && (
                <div className="w-full text-center px-2">
                  {partSearchResults.length > 0 ? (
                    <div className="text-xs sm:text-sm text-gray-600 mb-4 bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
                      <span className="font-medium text-green-700">
                        Found {partSearchResults.length} product{partSearchResults.length !== 1 ? 's' : ''}
                      </span>
                      <br />
                      matching <span className="font-mono bg-green-100 px-1 py-0.5 rounded text-green-800">&quot;FPG-{partSearchQuery}&quot;</span>
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="text-xs sm:text-sm text-gray-500 mb-4 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
                        No products found matching <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">&quot;FPG-{partSearchQuery}&quot;</span>
                        <br />
                        <span className="text-blue-600 mt-1 inline-block">Try Quick Search instead.</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Enhanced data availability info */}
        <div className="text-xs sm:text-sm text-gray-500 text-center px-2">
          {searchMode === 'quick' ? (
            <>
              <span className="block sm:inline">Loaded {data.length} product categories</span>
              {filteredData.length > 0 && (
                <>
                  <span className="hidden sm:inline"> • </span>
                  <span className="block sm:inline">Found {filteredData.length} results</span>
                </>
              )}
            </>
          ) : (
            partSearchQuery && (
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                Searching for &quot;FPG-{partSearchQuery}&quot;
              </span>
            )
          )}
        </div>
      </div>
      
      <motion.div className="p-4 sm:p-6 md:p-10">
        <GridProducts
          seriesList={searchMode === 'quick' ? filteredData : partSearchResults}
          showDescription={Boolean(false)}
        />
      </motion.div>
    </div>
  );
};

export default Search;