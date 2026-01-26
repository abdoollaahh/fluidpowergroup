// components/invoice/ProductSearchWidget.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CategoryDrilldown from './CategoryDrilldown';
import PartNumberSearch from './PartNumberSearch';

interface ProductSearchWidgetProps {
  onAddProduct: (product: any) => void;
}

const ProductSearchWidget: React.FC<ProductSearchWidgetProps> = ({ onAddProduct }) => {
  const [searchMode, setSearchMode] = useState<'quick' | 'part'>('quick');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories on mount (for Quick Search mode)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[ProductSearchWidget] Fetching categories with hidden products...');
        const response = await axios.get('/api/getAllProducts', {
          params: {
            includeHidden: true, // Show hidden products for supplier
            supplierMode: true
          }
        });
        
        console.log('[ProductSearchWidget] Categories loaded:', response.data);
        
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
          console.log('[ProductSearchWidget] Total categories:', response.data.categories.length);
        } else {
          console.warn('[ProductSearchWidget] No categories found');
          setCategories([]);
        }
        
      } catch (err: any) {
        console.error('[ProductSearchWidget] Error fetching categories:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Product Browser</h2>
        <p className="text-xs text-gray-600">Find products to add to invoice</p>
      </div>

      {/* Search Mode Tabs */}
      <div className="flex gap-2 p-2 bg-gray-100 rounded-lg mb-4">
        <button
          onClick={() => setSearchMode('quick')}
          className={`
            flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${searchMode === 'quick' 
              ? 'bg-yellow-400 text-gray-900 shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          Quick Search
        </button>
        
        <button
          onClick={() => setSearchMode('part')}
          className={`
            flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${searchMode === 'part' 
              ? 'bg-yellow-400 text-gray-900 shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          Part Number
        </button>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Conditional Rendering Based on Search Mode */}
      {!loading && !error && (
        <div className="flex-1 overflow-y-auto">
          {searchMode === 'quick' ? (
            <CategoryDrilldown 
              categories={categories} 
              onAddProduct={onAddProduct} 
            />
          ) : (
            <PartNumberSearch 
              onAddProduct={onAddProduct} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchWidget;