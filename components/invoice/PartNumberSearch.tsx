// components/invoice/PartNumberSearch.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductListItem from './ProductListItem';

interface PartNumberSearchProps {
  onAddProduct: (product: any) => void;
}

const PartNumberSearch: React.FC<PartNumberSearchProps> = ({ onAddProduct }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Debounced part number search
  useEffect(() => {
    const searchPartNumbers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
  
      setIsSearching(true);
      try {
        console.log(`[PartNumberSearch] Searching for: FPG-${searchQuery}`);
        
        const response = await axios.post('/api/searchProducts', {
          query: `FPG-${searchQuery}`,
          searchType: 'partNumber'
        });
        
        console.log('[PartNumberSearch] Search response:', response.data);
        
        if (response.data.products && response.data.products.length > 0) {
          setSearchResults(response.data.products);
          console.log(`[PartNumberSearch] Found ${response.data.products.length} products`);
        } else {
          setSearchResults([]);
          console.log('[PartNumberSearch] No products found');
        }
        
      } catch (error: any) {
        console.error('[PartNumberSearch] Search error:', error);
        setSearchResults([]);
        
        if (error.response?.status === 400) {
          console.log('[PartNumberSearch] Query too short or invalid');
        } else if (error.response?.status === 500) {
          console.log('[PartNumberSearch] Server error');
        }
      } finally {
        setIsSearching(false);
      }
    };
  
    // Debounce search by 300ms
    const debounceTimer = setTimeout(searchPartNumbers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Search by Part Number</h3>
        
        <div className="relative">
          <div className="flex items-stretch w-full border-2 border-yellow-400 rounded-lg bg-white shadow-sm focus-within:shadow-md transition-shadow overflow-hidden">
            <div className="px-3 py-2 bg-yellow-100 text-gray-700 font-medium border-r border-yellow-300 text-sm flex items-center justify-center min-w-[60px]">
              FPG-
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter part number (e.g., SSTI, 2J9)"
              className="
                flex-1 min-w-0 px-3 py-2 focus:outline-none
                text-gray-800 text-sm
                placeholder:text-gray-400 placeholder:text-xs
              "
            />
          </div>
          
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Type part number without &quot;FPG-&quot; prefix. Results appear as you type.
        </p>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div>
          {searchResults.length > 0 ? (
            <div>
              <div className="text-xs text-gray-600 mb-3 bg-green-50 p-2 rounded-lg border border-green-200">
                <span className="font-medium text-green-700">
                  Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
                </span>
                {' '}matching{' '}
                <span className="font-mono bg-green-100 px-1 py-0.5 rounded text-green-800">
                &quot;FPG-{searchQuery}&quot;
                </span>
              </div>
              
              <div className="space-y-2">
                {searchResults.map((product: any, index: number) => (
                  <ProductListItem
                    key={index}
                    product={product}
                    onAddProduct={onAddProduct}
                  />
                ))}
              </div>
            </div>
          ) : (
            !isSearching && (
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                No products found matching{' '}
                <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                &quot;FPG-{searchQuery}&quot;
                </span>
                <br />
                <span className="text-blue-600 mt-1 inline-block">
                  Try Quick Search instead.
                </span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PartNumberSearch;