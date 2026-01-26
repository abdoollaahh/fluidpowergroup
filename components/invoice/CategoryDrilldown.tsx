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
  const [level3IsFinalProducts, setLevel3IsFinalProducts] = useState<boolean>(false);

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
  const handleSubCategorySelect = async (catTitle: string) => {
    console.log('[CategoryDrilldown] Subcategory selected:', catTitle);
    
    // Find the subcategory data
    const category = categories.find((p: any) => p.title === expandedCategory);
    const subcategory = category?.subCategories?.find((cat: any) => cat.title === catTitle);
    
    if (subcategory?.series && subcategory.series.length > 0) {
      console.log('[CategoryDrilldown] Setting series from subcategory:', subcategory.series.length);
      setFilteredProducts(subcategory.series);
    } else {
      setFilteredProducts([]);
    }
    
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
    
    try {
      console.log('[CategoryDrilldown] Fetching data for series:', series.slug || series.id);
      
      // First try getAllSeries to check if this has more subcategories
      const seriesResponse = await axios.post('/api/getAllSeries', {
        data: { slug: series.slug }
      });
      
      console.log('[CategoryDrilldown] Series response:', seriesResponse.data);
      
      if (seriesResponse.data.series && seriesResponse.data.series.length > 0) {
        console.log('[CategoryDrilldown] Has sub-series, setting Level 3 data');
        setLevel3Data(seriesResponse.data.series);
        setLevel3IsFinalProducts(false);
        setSelectedCategory({
          ...selectedCategory,
          subCategories: series.slug,
        });
      } else {
        // No more series - check for products
        const productsResponse = await axios.post('/api/getProducts', {
          data: {
            id: series.id,
            loadAll: true
          }
        });
        
        console.log('[CategoryDrilldown] Products response:', productsResponse.data);
        
        if (productsResponse.data.products && productsResponse.data.products.length > 0) {
          const products = productsResponse.data.products;
          const firstProduct = products[0];
          
          console.log('[CategoryDrilldown] First product:', firstProduct);
          
          const isTableProduct = firstProduct.attributes && Object.keys(firstProduct.attributes).length > 0;
          
          if (isTableProduct) {
            console.log('[CategoryDrilldown] TABLE PRODUCT: Showing table view with', products.length, 'products');
            setTableProducts(products);
            setTableSeries(series.title || series.name);
            setViewingTable(true);
          } else {
            console.log('[CategoryDrilldown] CARD PRODUCT: Setting Level 3 data');
            setLevel3Data(products);
            setSelectedCategory({
              ...selectedCategory,
              subCategories: series.slug,
            });
          }
        } else {
          console.warn('[CategoryDrilldown] No products or series found');
          alert('This category has no products available.');
        }
      }
      
    } catch (error) {
      console.error('[CategoryDrilldown] Error fetching data:', error);
      alert('Error loading products. Please try again.');
    } finally {
      setLoadingSeries(false);
    }
  };

  // Handle Level 3 product selection (final product in 4-level hierarchy)
  const handleLevel3Select = async (product: any) => {
    console.log('[CategoryDrilldown] Level 3 product selected:', product);
    
    setLoadingSeries(true);
    
    try {
      const productsResponse = await axios.post('/api/getProducts', {
        data: {
          id: product.id,
          loadAll: true
        }
      });
      
      console.log('[CategoryDrilldown] Level 3 products response:', productsResponse.data);
      
      if (productsResponse.data.series && productsResponse.data.series.length > 0) {
        console.log('[CategoryDrilldown] Level 3 has MORE series, showing as cards');
        setLevel3Data(productsResponse.data.series);
        setLevel3IsFinalProducts(false);
        setSelectedCategory({
          ...selectedCategory,
          subCategories: product.slug,
        });
      } else if (productsResponse.data.products && productsResponse.data.products.length > 0) {
        const products = productsResponse.data.products;
        const firstProduct = products[0];
        
        const isTableProduct = firstProduct.attributes && Object.keys(firstProduct.attributes).length > 0;
        
        if (isTableProduct) {
          console.log('[CategoryDrilldown] TABLE PRODUCT: Showing table view');
          setTableProducts(products);
          setTableSeries(product.title || product.name);
          setViewingTable(true);
        } else {
          console.log('[CategoryDrilldown] CARD PRODUCTS: Showing as product list');
          setLevel3Data(products);
          setLevel3IsFinalProducts(true);
        }
      } else {
        console.warn('[CategoryDrilldown] No products or series found');
        alert('No products available.');
      }
    } catch (error) {
      console.error('[CategoryDrilldown] Error fetching Level 3 products:', error);
      alert('Error loading products.');
    } finally {
      setLoadingSeries(false);
    }
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
      {!loadingSeries && selectedCategory.subCategories && level3Data.length > 0 && (
        <div>
          <span className="text-sm font-bold text-gray-700 block mb-2">Product Types</span>
          <div className="space-y-2">
            {level3Data.map((product: any, index: number) => (
              <ProductListItem
                key={index}
                product={product}
                onAddProduct={level3IsFinalProducts ? onAddProduct : handleLevel3Select}
              />
            ))}
          </div>
        </div>
      )}

      {/* Only show loading when not viewing table and subcategory is selected but no data yet */}
      {!loadingSeries && selectedCategory.subCategories && level3Data.length === 0 && !viewingTable && (
        <div className="text-xs text-gray-500 text-center py-4">
          No products available in this category
        </div>
      )}
    </div>
  );
};

export default CategoryDrilldown;