// components/invoice/CategoryDrilldown.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductListItem from './ProductListItem';
import ProductTableView from './ProductTableView';

interface CategoryDrilldownProps {
  categories: any[];
  onAddProduct: (product: any) => void;
}

interface SelectedCategory {
  title: string | null;
  categories: string | null;
  subCategories: string | null;
  subSubCategories: string | null;
}

const CategoryDrilldown: React.FC<CategoryDrilldownProps> = ({ categories, onAddProduct }) => {
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategory>({
    title: null,
    categories: null,
    subCategories: null,
    subSubCategories: null,
  });
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [level3Data, setLevel3Data] = useState<any[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string>("");
  const [viewingTable, setViewingTable] = useState<boolean>(false);
  const [tableProducts, setTableProducts] = useState<any[]>([]);
  const [tableSeries, setTableSeries] = useState<string>("");
  const [loadingSeries, setLoadingSeries] = useState<boolean>(false);

  // Fetch Level 3 data when subcategory is selected (for 4-level products)
  useEffect(() => {
    const fetchLevel3Data = async () => {
      if (!selectedCategory.subCategories) {
        setLevel3Data([]);
        return;
      }

      try {
        console.log('[CategoryDrilldown] Fetching Level 3 data for:', selectedCategory.subCategories);
        
        const response = await axios.post('/api/getAllSeries', {
          seriesSlug: selectedCategory.subCategories
        });
        
        console.log('[CategoryDrilldown] Level 3 response:', response.data);
        
        if (response.data && response.data.products) {
          setLevel3Data(response.data.products);
          console.log('[CategoryDrilldown] Level 3 products loaded:', response.data.products.length);
        } else {
          setLevel3Data([]);
        }
        
      } catch (error) {
        console.error('[CategoryDrilldown] Error fetching Level 3 data:', error);
        setLevel3Data([]);
      }
    };

    fetchLevel3Data();
  }, [selectedCategory.subCategories]);

  // Filter products based on selected category
  useEffect(() => {
    let newFilteredProducts: any[] = [];

    if (selectedCategory.title && selectedCategory.categories && categories.length > 0) {
      console.log('[CategoryDrilldown] Filtering for:', selectedCategory);
      
      categories.forEach((product: any) => {
        if (product.title === selectedCategory.title) {
          product.subCategories?.forEach((cat: any) => {
            if (cat.title.toLowerCase().includes(selectedCategory.categories!.toLowerCase())) {
              if (cat.series && cat.series.length > 0) {
                newFilteredProducts = [...newFilteredProducts, ...cat.series];
              }
            }
          });
        }
      });
      
      console.log('[CategoryDrilldown] Filtered products:', newFilteredProducts.length);
    }
    
    setFilteredProducts(newFilteredProducts);
  }, [selectedCategory, categories]);

  // Handle category selection
  const handleCategorySelect = (title: string) => {
    if (expandedCategory === title) {
      setExpandedCategory("");
      setSelectedCategory({
        title: null,
        categories: null,
        subCategories: null,
        subSubCategories: null,
      });
    } else {
      setExpandedCategory(title);
      setSelectedCategory({
        title,
        categories: null,
        subCategories: null,
        subSubCategories: null,
      });
    }
  };

  // Handle subcategory selection
  const handleSubCategorySelect = (catTitle: string) => {
    setSelectedCategory({
      ...selectedCategory,
      categories: catTitle,
      subCategories: null,
      subSubCategories: null,
    });
  };

  // Handle series selection (3-level or 4-level check)
  const handleSeriesSelect = async (series: any) => {
    console.log('[CategoryDrilldown] Series selected:', series);
    
    setLoadingSeries(true);
    
    // CRITICAL: Fetch products for this series to check if it has table products
    try {
      console.log('[CategoryDrilldown] Fetching products for series:', series.slug || series.id);
      
      const response = await axios.post('/api/getProducts', {
        data: {
          id: series.id,
          loadAll: true
        }
      });
      
      console.log('[CategoryDrilldown] Products response:', response.data);
      
      if (response.data.products && response.data.products.length > 0) {
        // Has products - check if they're table products
        const products = response.data.products;
        const firstProduct = products[0];
        
        console.log('[CategoryDrilldown] First product:', firstProduct);
        console.log('[CategoryDrilldown] Has attributes?', !!firstProduct.attributes);
        
        const isTableProduct = firstProduct.attributes && Object.keys(firstProduct.attributes).length > 0;
        
        if (isTableProduct) {
          // TABLE PRODUCT: Show table view in sidebar
          console.log('[CategoryDrilldown] TABLE PRODUCT: Showing table view with', products.length, 'products');
          setTableProducts(products);
          setTableSeries(series.title || series.name);
          setViewingTable(true);
        } else {
          // CARD PRODUCT: Show as card list (Level 3 data)
          console.log('[CategoryDrilldown] CARD PRODUCT: Setting Level 3 data');
          setLevel3Data(products);
          setSelectedCategory({
            ...selectedCategory,
            subCategories: series.slug,
          });
        }
      } else if (response.data.series && response.data.series.length > 0) {
        // Has sub-series - navigate deeper
        console.log('[CategoryDrilldown] Has sub-series, setting Level 3 data');
        setLevel3Data(response.data.series);
        setSelectedCategory({
          ...selectedCategory,
          subCategories: series.slug,
        });
      } else {
        // No products found - might be a final product itself
        console.log('[CategoryDrilldown] No products found, checking if series is product');
        
        if (series.price && series.price > 0) {
          // Has price - is a product
          console.log('[CategoryDrilldown] Series has price, adding as product');
          onAddProduct(series);
        } else {
          console.warn('[CategoryDrilldown] Series has no products and no price');
          alert('This series has no products available.');
        }
      }
      
    } catch (error) {
      console.error('[CategoryDrilldown] Error fetching series products:', error);
      alert('Error loading products. Please try again.');
    } finally {
      setLoadingSeries(false);
    }
  };

  // Handle Level 3 product selection (final product in 4-level hierarchy)
  const handleLevel3Select = (product: any) => {
    console.log('[CategoryDrilldown] Level 3 product selected:', product);
    onAddProduct(product);
  };

  // Handle back from table view
  const handleBackFromTable = () => {
    setViewingTable(false);
    setTableProducts([]);
    setTableSeries("");
  };

  // If viewing table, show table view
  if (viewingTable) {
    return (
      <ProductTableView
        products={tableProducts}
        seriesName={tableSeries}
        onAddProduct={onAddProduct}
        onBack={handleBackFromTable}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Top-Level Categories */}
      <div>
        <span className="text-sm font-bold text-gray-700 block mb-2">Categories</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((product: any, index: number) => (
            <div
              key={index}
              className={`
                border-2 rounded-xl px-3 py-1.5 text-xs cursor-pointer 
                transition-all duration-200 hover:bg-blue-50
                ${expandedCategory === product.title 
                  ? "border-yellow-500 bg-yellow-50" 
                  : "border-gray-300 hover:border-gray-400"
                }
              `}
              onClick={() => handleCategorySelect(product.title)}
            >
              {product.title}
            </div>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      {expandedCategory && (
        <div>
          <span className="text-sm font-bold text-gray-700 block mb-2">Subcategories</span>
          <div className="flex flex-wrap gap-2">
            {categories
              .find((p: any) => p.title === expandedCategory)
              ?.subCategories?.map((cat: any, catIndex: number) => (
                <div
                  key={catIndex}
                  className={`
                    border-2 rounded-xl px-3 py-1.5 text-xs cursor-pointer 
                    transition-all duration-200 hover:bg-green-50
                    ${selectedCategory.categories === cat.title 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-300 hover:border-gray-400"
                    }
                  `}
                  onClick={() => handleSubCategorySelect(cat.title)}
                >
                  {cat.title}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Series (Level 2) */}
      {selectedCategory.categories && filteredProducts.length > 0 && (
        <div>
          <span className="text-sm font-bold text-gray-700 block mb-2">Series</span>
          <div className="flex flex-wrap gap-2">
            {filteredProducts.map((series: any, seriesIndex: number) => (
              <div
                key={seriesIndex}
                className={`
                  border-2 rounded-xl px-3 py-1.5 text-xs cursor-pointer 
                  transition-all duration-200 hover:bg-purple-50
                  ${selectedCategory.subCategories === series.slug 
                    ? "border-purple-500 bg-purple-50" 
                    : "border-gray-300 hover:border-gray-400"
                  }
                `}
                onClick={() => handleSeriesSelect(series)}
              >
                {series.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator when fetching series products */}
      {loadingSeries && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <span className="ml-3 text-sm text-gray-600">Loading products...</span>
        </div>
      )}

      {/* Level 3 Products (for 4-level hierarchy) */}
      {selectedCategory.subCategories && level3Data.length > 0 && (
        <div>
          <span className="text-sm font-bold text-gray-700 block mb-2">Product Types</span>
          <div className="space-y-2">
            {level3Data.map((product: any, index: number) => (
              <ProductListItem
                key={index}
                product={product}
                onAddProduct={handleLevel3Select}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading state for Level 3 */}
      {selectedCategory.subCategories && level3Data.length === 0 && (
        <div className="text-xs text-gray-500 text-center py-4">
          Loading product types...
        </div>
      )}
    </div>
  );
};

export default CategoryDrilldown;