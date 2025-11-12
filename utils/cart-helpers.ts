import { IItemCart, INormalizedCartItem } from '../types/cart';

/**
 * Normalize cart item to ensure consistent price and type fields
 * Use this function at the beginning of checkout logic
 */
export const normalizeCartItem = (item: IItemCart): INormalizedCartItem => {
  return {
    ...item,
    price: item.price || item.totalPrice || 0,
    quantity: item.quantity || 1,
    type: item.type || 'website_product'
  } as INormalizedCartItem;
};

/**
 * Get the display price for a cart item (handles both formats)
 */
export const getItemPrice = (item: IItemCart): number => {
  return item.price || item.totalPrice || 0;
};

/**
 * Get the total price for a cart item (price * quantity)
 */
export const getItemTotal = (item: IItemCart): number => {
  const price = getItemPrice(item);
  const quantity = item.quantity || 1;
  return price * quantity;
};

/**
 * Check if an item is a PWA order
 */
export const isPWAOrder = (item: IItemCart): boolean => {
  return item.type === 'pwa_order';
};

/**
 * Check if an item is a website product
 */
export const isWebsiteProduct = (item: IItemCart): boolean => {
  return !item.type || item.type === 'website_product';
};

/**
 * Separate cart items by type
 */
export const separateCartItems = (items: IItemCart[]) => {
  const pwaItems = items.filter(isPWAOrder);
  const websiteItems = items.filter(isWebsiteProduct);
  
  return { pwaItems, websiteItems };
};

/**
 * Calculate cart totals
 */
export const calculateCartTotals = (items: IItemCart[]) => {
  const normalizedItems = items.map(normalizeCartItem);
  const { pwaItems, websiteItems } = separateCartItems(normalizedItems);
  
  // Use getItemPrice to safely handle undefined prices
  const pwaTotal = pwaItems.reduce((sum, item) => sum + getItemPrice(item), 0);
  const websiteTotal = websiteItems.reduce((sum, item) => 
    sum + getItemTotal(item), 0
  );
  
  const subtotal = pwaTotal + websiteTotal;
  const shipping = 12.85;
  const gst = (subtotal + shipping) * 0.10;
  const total = subtotal + shipping + gst;
  
  return {
    pwaTotal,
    websiteTotal,
    subtotal,
    shipping,
    gst,
    total,
    itemCount: items.length
  };
};