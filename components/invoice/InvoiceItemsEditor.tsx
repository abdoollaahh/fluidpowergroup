// components/invoice/InvoiceItemsEditor.tsx

import React, { useState } from 'react';
import { InvoiceLineItem } from '../../lib/invoice';

interface InvoiceItemsEditorProps {
  items: InvoiceLineItem[];
  onItemsChange: (items: InvoiceLineItem[]) => void;
}

export default function InvoiceItemsEditor({ items, onItemsChange }: InvoiceItemsEditorProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, quantity);
    updated[index].subtotal = updated[index].quantity * updated[index].unitPrice;
    onItemsChange(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, price);
    updated[index].subtotal = updated[index].quantity * updated[index].unitPrice;
    onItemsChange(updated);
  };

  const handleDescriptionChange = (index: number, description: string) => {
    const updated = [...items];
    updated[index].description = description;
    onItemsChange(updated);
  };

  const toggleDescription = (itemId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      alert('Cannot remove last item. Invoice must have at least one item.');
      return;
    }
    onItemsChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Invoice Items</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-yellow-100 border-b-2 border-yellow-500">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Product</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Quantity</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800">Unit Price</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800">Subtotal</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                {/* Main Row */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleDescription(item.id)}
                        className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                          expandedDescriptions[item.id] ? 'bg-yellow-100' : ''
                        }`}
                        title="Toggle description"
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform ${
                            expandedDescriptions[item.id] ? 'rotate-90' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">
                    ${item.subtotal.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 rounded-lg border border-red-600/30 bg-red-50/80 text-red-600 hover:bg-red-400/20 hover:border-red-600/50 transition-colors"
                      aria-label="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Description Row (Collapsible) */}
                {expandedDescriptions[item.id] && (
                  <tr className="bg-yellow-50/50">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-gray-600 mt-2">Description:</span>
                        <textarea
                          value={item.description || ''}
                          onChange={(e) => handleDescriptionChange(index, e.target.value)}
                          placeholder="Add product description (e.g., specifications, notes, technical details...)"
                          rows={3}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 <strong>Tip:</strong> Click the arrow button (►) next to any product to add a description that will appear in the invoice PDF.</p>
      </div>
    </div>
  );
}