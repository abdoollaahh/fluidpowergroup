// pages/order-confirmation.tsx

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { IItemCart } from '../types/cart';

// ========================================
// TYPE DEFINITIONS
// ========================================
interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  companyName?: string;
}

interface WebsiteProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface PWAOrder {
  id: string;
  name: string;
  totalPrice: number;
  quantity: number;
  image?: string;
  pdfDataUrl?: string;
  pwaOrderNumber?: string;
  cartId?: number;
}

interface OrderTotals {
  subtotal: number;
  shipping: number;
  gst: number;
  total: number;
}

interface OrderData {
  orderNumber: string;
  orderDate: string;
  paypalCaptureID: string;
  userDetails: UserDetails;
  websiteProducts: WebsiteProduct[];
  pwaOrders: PWAOrder[];
  totals: OrderTotals;
}

// ========================================
// MAIN COMPONENT
// ========================================
export default function OrderConfirmation() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testingMode, setTestingMode] = useState(false);
  
  // PDF Modal state
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [currentPDFUrl, setCurrentPDFUrl] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // CRITICAL: Prevent cart-based redirects on this page
  useEffect(() => {
    // Set a flag to tell other components not to redirect
    sessionStorage.setItem('viewingOrderConfirmation', 'true');
    console.log('Order confirmation page loaded - redirect protection enabled');
    
    return () => {
      // Clean up when leaving the page
      sessionStorage.removeItem('viewingOrderConfirmation');
      localStorage.removeItem('lastOrder'); // ✅ CRITICAL FIX: Clear old order to prevent redirect loops
      console.log('Leaving order confirmation page - cleared lastOrder');
    };
  }, []);

  // Load order data from localStorage
  // ============================================================================
// 🆕 FIXED: Load order data by merging metadata + PDFs from cart
// ============================================================================

useEffect(() => {
  const loadOrderData = () => {
    try {
      // Clear the order completing flag
      sessionStorage.removeItem('orderCompleting');
      
      // ✅ STEP 1: Read lightweight order metadata
      const storedOrder = localStorage.getItem('lastOrder');
      if (!storedOrder) {
        console.warn('⚠️ No order metadata found');
        setIsLoading(false);
        return;
      }
      
      const parsedOrder: OrderData = JSON.parse(storedOrder);
      console.log('📋 Order metadata loaded:', parsedOrder.orderNumber);
      
      // ✅ STEP 2: Read shopping cart with PDFs
      const storedCart = localStorage.getItem('shopping-cart');
      
      if (storedCart && parsedOrder.pwaOrders && parsedOrder.pwaOrders.length > 0) {
        // 🔧 CRITICAL FIX: Parse the cart object first
        const cartObject = JSON.parse(storedCart);
        
        // 🔧 Extract items array from cart object
        const cartItems: IItemCart[] = cartObject.items || [];
        
        console.log('📦 Shopping cart loaded with', cartItems.length, 'items');
        
        // ✅ STEP 3: Merge PDFs from cart into order data
        parsedOrder.pwaOrders = parsedOrder.pwaOrders.map((order: PWAOrder) => {
          // Find matching cart item by cartId or id
          const cartItem = cartItems.find((item: IItemCart) => 
            item.cartId === order.cartId || item.id === order.id
          );
          
          if (cartItem && cartItem.pdfDataUrl) {
            console.log('✅ PDF found for:', order.name);
            return {
              ...order,
              pdfDataUrl: cartItem.pdfDataUrl // Get PDF from original cart
            };
          }
          
          console.warn('⚠️ No PDF found for:', order.name);
          return order;
        });
      }
      
      // ✅ STEP 4: Set the merged data
      setOrderData(parsedOrder);
      
      // ✅ Use CURRENT environment setting, not saved one
      const currentTestingMode = process.env.NEXT_PUBLIC_TESTING_MODE === 'true';
      setTestingMode(currentTestingMode);
      
      console.log('✅ Order data merged and ready for display');
      
    } catch (error) {
      console.error('❌ Error loading order data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadOrderData();
}, []);

  // ============================================================================
// 🆕 CLEANUP: Remove localStorage when leaving order-confirmation page
// ============================================================================

  useEffect(() => {
    // Cleanup function runs when component unmounts (user navigates away)
    return () => {
      console.log('🧹 Cleaning up: User leaving order-confirmation page');
      localStorage.removeItem('shopping-cart');
      localStorage.removeItem('lastOrder');
      localStorage.removeItem('cart-timestamp');
      console.log('✅ localStorage cleaned');
    };
  }, []);

  // ============================================================================
  // 🆕 CLEANUP: Also handle browser/tab close
  // ============================================================================

  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🧹 Cleaning up: Browser/tab closing');
      localStorage.removeItem('shopping-cart');
      localStorage.removeItem('lastOrder');
      localStorage.removeItem('cart-timestamp');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Handle PDF viewing - Updated to support modal on desktop and new window on mobile
  const handleViewPDF = (pdfDataUrl: string | undefined, orderNumber: string | undefined) => {
    if (!pdfDataUrl) {
      alert('PDF not available');
      return;
    }

    if (isMobile) {
      // Open in new window for mobile
      try {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Order ${orderNumber || 'PDF'}</title>
                <style>
                  body { margin: 0; padding: 0; }
                  iframe { width: 100vw; height: 100vh; border: none; }
                </style>
              </head>
              <body>
                <iframe src="${pdfDataUrl}"></iframe>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } catch (error) {
        console.error('Error opening PDF:', error);
        alert('Unable to open PDF. Please try again.');
      }
    } else {
      // Open modal for desktop
      setCurrentPDFUrl(pdfDataUrl);
      setShowPDFModal(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your order...</p>
        </div>
      </div>
    );
  }

  // No order data found
  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Head>
          <title>Order Not Found - FluidPower Group</title>
        </Head>
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find your order details. This may happen if you&apos;ve cleared your browser data.
          </p>
          <button
            onClick={() => router.push('/catalogue')}
            className="cursor-pointer transition-all duration-300 inline-block font-semibold"
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(255, 215, 0, 0.9)",
              color: "#000",
              boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 15px 40px rgba(250, 204, 21, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 4px 12px rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0px) scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
            }}
          >
            Return to Catalogue
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER ORDER CONFIRMATION
  // ========================================
  return (
    <>
      <Head>
        <title>Order Confirmed - FluidPower Group</title>
        <meta name="description" content="Your order has been confirmed" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        {/* Testing Mode Banner */}
        {testingMode && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🧪</span>
                <div>
                  <p className="font-bold">TEST ORDER</p>
                  <p className="text-sm">This is a test order and will not be processed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            
            {/* Header Section */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-8 sm:px-10 sm:py-12 text-center">
              <div className="mx-auto mb-6 flex justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <svg 
                    className="w-12 h-12 text-green-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
                Order Confirmed!
              </h1>
              <p className="text-black text-lg">
                Thank you for your order
              </p>
            </div>

            {/* Order Details Section */}
            <div className="px-6 py-8 sm:px-10 border-b border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Number</p>
                  <p className="text-lg font-bold text-gray-900">{orderData.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Date</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(orderData.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-lg font-bold text-gray-900">{orderData.userDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">PayPal Transaction ID</p>
                  <p className="text-sm font-mono text-gray-700 break-all">{orderData.paypalCaptureID}</p>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="px-6 py-8 sm:px-10 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
              
              {/* Website Products */}
              {orderData.websiteProducts && orderData.websiteProducts.length > 0 && (
                <div className="space-y-4 mb-6">
                  {orderData.websiteProducts.map((product, index) => (
                    <div key={`website-${index}`} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center space-x-4">
                        {product.image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="rounded object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">
                            Quantity: {product.quantity} × {formatCurrency(product.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(product.price * product.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PWA Orders - Updated with removed badges, removed order IDs, and new button styling */}
              {orderData.pwaOrders && orderData.pwaOrders.length > 0 && (
                <div className="space-y-4">
                  {orderData.pwaOrders.map((pwaOrder, index) => (
                    <div key={`pwa-${index}`} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center space-x-4">
                        {pwaOrder.image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={pwaOrder.image}
                              alt={pwaOrder.name}
                              width={80}
                              height={80}
                              className="rounded object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{pwaOrder.name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {pwaOrder.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 mb-2">
                            {formatCurrency(pwaOrder.totalPrice)}
                          </p>
                          {pwaOrder.pdfDataUrl ? (
                            <button
                              onClick={() => handleViewPDF(pwaOrder.pdfDataUrl, pwaOrder.pwaOrderNumber)}
                              className="text-xs cursor-pointer block mt-2 text-left transition-all duration-300"
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(15px)",
                                border: "1px solid rgba(200, 200, 200, 0.3)",
                                color: "#2563eb",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                fontWeight: "600"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                                e.currentTarget.style.background = "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)";
                                e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                                e.currentTarget.style.color = "#000";
                                e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0px) scale(1)";
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                                e.currentTarget.style.border = "1px solid rgba(200, 200, 200, 0.3)";
                                e.currentTarget.style.color = "#2563eb";
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                              }}
                            >
                              {isMobile ? 'View PDF' : 'Click to View PDF'}
                            </button>
                          ) : (
                            <p className="text-sm text-gray-600 italic mt-2">
                              📧 PDF attached in your confirmation email
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary Section */}
            <div className="px-6 py-8 sm:px-10 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(orderData.totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(orderData.totals.shipping)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-300">
                  <span className="text-gray-600">GST (10%)</span>
                  <span className="text-gray-900">{formatCurrency(orderData.totals.gst)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatCurrency(orderData.totals.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="px-6 py-8 sm:px-10 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">
                  {orderData.userDetails.firstName} {orderData.userDetails.lastName}
                </p>
                {orderData.userDetails.companyName && (
                  <p>{orderData.userDetails.companyName}</p>
                )}
                <p>{orderData.userDetails.address}</p>
                <p>
                  {orderData.userDetails.city}, {orderData.userDetails.state} {orderData.userDetails.postcode}
                </p>
                <p>{orderData.userDetails.country}</p>
                <p className="pt-2">Phone: {orderData.userDetails.phone}</p>
              </div>
            </div>

            {/* What's Next Section */}
            <div className="px-6 py-8 sm:px-10 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What&apos;s Next?</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="text-yellow-500 font-bold mr-3 text-lg">1.</span>
                  <p>We&apos;re preparing your order for shipment</p>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-500 font-bold mr-3 text-lg">2.</span>
                  <p>You&apos;ll receive tracking information via email once your order ships</p>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-500 font-bold mr-3 text-lg">3.</span>
                  <p>Questions? Contact us at{' '}
                    <a 
                      href={`mailto:${testingMode 
                        ? (process.env.NEXT_PUBLIC_BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au')
                        : (process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'info@agcomponents.com.au')
                      }`}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {testingMode 
                        ? (process.env.NEXT_PUBLIC_BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au')
                        : (process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'info@agcomponents.com.au')
                      }
                    </a>
                    {' '}or call{' '}
                    <a href="tel:+61409517333" className="text-blue-600 hover:underline font-semibold">
                      +61 409 517 333
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button - Updated with glass morphism design from ItemCart */}
            <div className="px-6 py-8 sm:px-10 text-center">
              <button
                onClick={() => router.push('/catalogue')}
                className="cursor-pointer transition-all duration-300 inline-block font-bold text-lg"
                style={{
                  padding: "16px 32px",
                  borderRadius: "12px",
                  background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255, 215, 0, 0.9)",
                  color: "#000",
                  boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(250, 204, 21, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 4px 12px rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px) scale(1)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                }}
              >
                PLACE A NEW ORDER
              </button>
            </div>

          </div>

          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-gray-600 pb-8">
            <div className="mb-4">
              <p className="font-semibold text-gray-900 mb-2">FluidPower Group</p>
              <p>
                <a 
                  href={`mailto:${testingMode 
                    ? (process.env.NEXT_PUBLIC_BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au')
                    : (process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'info@agcomponents.com.au')
                  }`}
                  className="text-blue-600 hover:underline"
                >
                  {testingMode 
                    ? (process.env.NEXT_PUBLIC_BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au')
                    : (process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'info@agcomponents.com.au')
                  }
                </a>
                {' | '}
                <a href="tel:+61409517333" className="text-blue-600 hover:underline">
                  +61 409 517 333
                </a>
              </p>
              <p>
                <a 
                  href="https://fluidpowergroup.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  fluidpowergroup.com.au
                </a>
              </p>
            </div>
            <p className="text-xs">
              © {new Date().getFullYear()} FluidPower Group. All rights reserved.
            </p>
          </footer>
        </div>
      </div>

      {/* PDF Modal - Only for desktop - Same close button properties as checkout */}
      {!isMobile && showPDFModal && currentPDFUrl && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setShowPDFModal(false)}
        >
          <div 
            className="relative w-11/12 h-5/6 bg-white rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button - Same properties as checkout code */}
            <button
              onClick={() => setShowPDFModal(false)}
              className="absolute top-4 right-4 z-10 transition-all duration-200 flex items-center justify-center"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                background: "rgba(254, 226, 226, 0.8)",
                color: "#dc2626",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(254, 226, 226, 0.8)";
                e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)";
              }}
            >
              <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiX style={{ width: "100%", height: "100%", minWidth: "20px", minHeight: "20px" }} />
              </div>
            </button>
            
            {/* PDF object for better mobile support */}
            <object
              data={currentPDFUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{ border: "none" }}
            >
              {/* Fallback for mobile - download link */}
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <p className="mb-4 text-gray-700">Unable to display PDF in browser.</p>
                <a
                  href={currentPDFUrl}
                  download="custom-hose-assembly.pdf"
                  className="px-6 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                    border: "1px solid rgba(255, 215, 0, 0.9)",
                    color: "#000"
                  }}
                >
                  Download PDF
                </a>
              </div>
            </object>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}