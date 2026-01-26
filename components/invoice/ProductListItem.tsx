// components/invoice/ProductListItem.tsx

import React from 'react';

interface ProductListItemProps {
  product: any;
  onAddProduct: (product: any) => void;
}

const ProductListItem: React.FC<ProductListItemProps> = ({ product, onAddProduct }) => {
  // Extract product details with fallbacks
  const productName = product.name || product.title || 'Unnamed Product';
  const productSku = product.sku || product.slug || '';
  const productPrice = product.price || 0;
  const isHidden = product.active === false || product.hidden === true;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-200 transition-colors duration-150">
      {/* Left: Product Info */}
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-gray-800 truncate">
            {productName}
          </p>
          {isHidden && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap">
              🔒 Hidden
            </span>
          )}
        </div>
        {productSku && (
          <p className="text-xs text-gray-500 mt-0.5">
            FPG-{productSku}
          </p>
        )}
      </div>
      
      {/* Right: Price + Add Button */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-800 min-w-[60px] text-right">
          ${productPrice.toFixed(2)}
        </span>
        <button 
          onClick={() => onAddProduct(product)}
          className="
            px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 
            rounded text-xs font-bold text-gray-900
            transition-colors duration-150 shadow-sm hover:shadow
            whitespace-nowrap
          "
        >
          + Add
        </button>
      </div>
    </div>
  );
};

export default ProductListItem;