// components/invoice/ProductTableView.tsx

import React from 'react';
import { IItemCart } from '../../types/cart';

interface ProductTableViewProps {
  products: IItemCart[];
  seriesName: string;
  onAddProduct: (product: any) => void;
  onBack: () => void;
}

const formathead = (title: string) => {
  const stringElements = title.split("_");
  if (stringElements.length === 1) {
    return `${title.charAt(0).toUpperCase()}${title.slice(1)}`;
  }
  let string = "";
  stringElements.forEach((word, i) => {
    if (i !== stringElements.length - 1) {
      if (word === "id" || word == "od") {
        string = string + word.split("")[0].toUpperCase() + "." + word.split("")[1].toUpperCase() + " ";
      } else {
        string = string + word.charAt(0).toUpperCase() + word.slice(1) + " ";
      }
    } else {
      if (word === "id" || word == "od") {
        string = string + word.split("")[0].toUpperCase() + "." + word.split("")[1].toUpperCase();
      } else if (word.length === 1) {
        string = string + '"' + word.toUpperCase() + '"';
      } else {
        string = string + "(" + word + ")";
      }
    }
  });
  return string;
};

const ProductTableView: React.FC<ProductTableViewProps> = ({ 
  products, 
  seriesName,
  onAddProduct, 
  onBack 
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No products found in this series</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          ← Back to Categories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Back Button + Title */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          ← Back
        </button>
        <span className="text-sm font-bold text-gray-700">{seriesName}</span>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-gray-200 rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-gray-800 text-yellow-400 sticky top-0">
            <tr>
              <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Part Number</th>
              {products[0]?.attributes && Object.keys(products[0].attributes).map((key) => (
                <th key={key} className="px-2 py-2 text-left font-semibold whitespace-nowrap">
                  {formathead(key)}
                </th>
              ))}
              <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Price</th>
              <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">Stock</th>
              <th className="px-2 py-2 text-center font-semibold sticky right-0 bg-gray-800">Add</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {products.map((product, index) => (
              <tr 
                key={product.id || index}
                className="border-b border-gray-100 hover:bg-yellow-50 transition-colors"
              >
                <td className="px-2 py-2 font-medium whitespace-nowrap">{product.name}</td>
                {product.attributes && Object.entries(product.attributes).map(([key, value]) => (
                  <td key={key} className="px-2 py-2 whitespace-nowrap">
                    {typeof value === "string" ? value : "-"}
                  </td>
                ))}
                <td className="px-2 py-2 font-bold whitespace-nowrap">${product.price || 0}</td>
                <td className="px-2 py-2 text-center whitespace-nowrap">
                  {product.stock || 0}
                </td>
                <td className="px-2 py-2 text-center sticky right-0 bg-white">
                  {(product.stock || 0) > 0 ? (
                    <button
                      onClick={() => onAddProduct(product)}
                      className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 rounded text-xs font-bold whitespace-nowrap"
                    >
                      + Add
                    </button>
                  ) : (
                    <span className="text-xs text-red-500">Out of Stock</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 text-center">
        {products.length} product{products.length !== 1 ? 's' : ''} available
      </p>
    </div>
  );
};

export default ProductTableView;