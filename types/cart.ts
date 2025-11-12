export interface ICart {
  open: boolean;
  items: IItemCart[];
}

/**
 * Unified cart item interface supporting both website products and PWA custom orders
 * 
 * Item Type Detection:
 * - Website products: type is undefined or !== 'pwa_order'
 * - PWA orders: type === 'pwa_order'
 * 
 * Price Field Usage:
 * - Website products use: price (per unit) * quantity
 * - PWA orders use: totalPrice (final calculated price)
 */
export interface IItemCart {
  // ============================================================================
  // CORE FIELDS (Always present)
  // ============================================================================
  id: string;           // Product slug (website) or 'fpg-cha' (PWA)
  name: string;         // Display name
  
  // ============================================================================
  // TYPE IDENTIFIER
  // ============================================================================
  type?: 'pwa_order' | 'website_product';  // Distinguishes item source
  
  // ============================================================================
  // PRICE FIELDS (Use appropriate field based on type)
  // ============================================================================
  price?: number;       // Website products: price per unit
  totalPrice?: number;  // PWA orders: final calculated total price
  quantity: number;     // Website: user-selected quantity, PWA: always 1
  
  // ============================================================================
  // WEBSITE PRODUCT FIELDS
  // ============================================================================
  stock?: number;       // Available inventory (Swell managed)
  image?: string;       // Product image URL
  attributes?: any;     // Product attributes from Swell
  
  // ============================================================================
  // PWA ORDER FIELDS
  // ============================================================================
  cartId?: number;      // Unique cart instance ID (timestamp-based)
  pdfDataUrl?: string;  // Base64-encoded PDF: 'data:application/pdf;base64,...'
  
  orderConfig?: {
    // Hose specifications
    selectedHose?: any;
    selectedHosePrice?: any;
    
    // End 1 fitting
    end1Shape?: string;
    end1Size?: string;
    end1Price?: number;
    
    // End 2 fitting
    end2Shape?: string;
    end2Size?: string;
    end2Price?: number;
    
    // Configuration
    selectedAngle?: string;
    quantity?: number;              // Internal quantity for calculations
    cutLengths?: Array<{
      length: string;
      unit?: string;
    }>;
    
    // Additional services
    selectedProtection?: string;
    protectionCost?: number;
    selectedPressure?: string;
    pressureTestPrice?: number;
    
    // Pricing breakdown
    cutLengthPrice?: number;
    isOrderFittingMode?: boolean;
    selectedMethod?: string;
    selectedService?: string;
    basePrice?: number;
    hoseProtectionPrice?: number;
    shippingCost?: number;
    totalBeforeShipping?: number;
    totalPriceWithShipping?: number;
  };
}

/**
 * Helper type for normalized cart items (use in checkout logic)
 * Ensures consistent price field regardless of item type
 */
export interface INormalizedCartItem extends IItemCart {
  price: number;        // Normalized price field (from either price or totalPrice)
  quantity: number;     // Always present
  type: 'pwa_order' | 'website_product';  // Always present after normalization
}