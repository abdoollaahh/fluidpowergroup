// pages/checkout.tsx - FIXED VERSION
// Key changes:
// 1. Removed optimistic 500/502 handling
// 2. Added proper error states
// 3. Added order status tracking
// 4. Improved timeout handling

import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { CartContext } from '../context/CartWrapper';
import { separateCartItems, calculateCartTotals } from '../utils/cart-helpers';
import { IItemCart } from '../types/cart';

const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true';

const API_BASE_URL = (() => {
  // Priority 1: If on Vercel preview deployment, use preview API
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' && process.env.NEXT_PUBLIC_API_BASE_URL_PREVIEW) {
    console.log('🔍 Using Preview API:', process.env.NEXT_PUBLIC_API_BASE_URL_PREVIEW);
    return process.env.NEXT_PUBLIC_API_BASE_URL_PREVIEW;
  }
  
  // Priority 2: Use testing mode logic (for localhost development)
  if (TESTING_MODE) {
    console.log('🧪 Testing Mode - Using:', process.env.NEXT_PUBLIC_API_BASE_URL_TEST || 'fallback');
    return process.env.NEXT_PUBLIC_API_BASE_URL_TEST || 'http://localhost:3001';
  }
  
  // Priority 3: Production mode (live site)
  console.log('🚀 Production Mode - Using:', process.env.NEXT_PUBLIC_API_BASE_URL || 'fallback');
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fluidpowergroup.com.au';
})();

console.log('📍 Final API_BASE_URL:', API_BASE_URL);;

const STATES = ['Select State', 'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

// 🆕 NEW: Order status types
type OrderStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'timeout';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, deleteItem } = useContext(CartContext);
  
  // Existing state
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  
  // 🆕 NEW: Order processing state
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('idle');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Shipping form state
  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    companyName: '',
    address: '',
    suburb: '',
    state: 'Select State',
    postcode: '',
    email: '',
    contactNumber: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formSubmitAttempted, setFormSubmitAttempted] = useState(false);
  
  // PDF Modal state
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [currentPDFUrl, setCurrentPDFUrl] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Redirect if cart is empty
  useEffect(() => {
    const isCompletingOrderSession = sessionStorage.getItem('orderCompleting') === 'true';
    if (items.length === 0 && !isCompletingOrder && !isCompletingOrderSession) {
      console.log('Checkout: Cart is empty, redirecting to home');
      router.push('/');
    }
  }, [items.length, router, isCompletingOrder]);
  
  const { pwaItems, websiteItems } = separateCartItems(items);
  const totals = calculateCartTotals(items);
  
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    currency: 'AUD',
    intent: 'capture' as const
  };

  // ============================================================================
  // 🆕 NEW: Order Status Polling Function
  // ============================================================================
  
  const pollOrderStatus = async (orderId: string, maxAttempts: number = 20): Promise<boolean> => {
    console.log(`📊 Starting order status polling for ${orderId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📊 Poll attempt ${attempt}/${maxAttempts}`);
        
        const response = await fetch(`${API_BASE_URL}/api/paypal/order-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNumber: orderId })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`📊 Order status: ${result.status}`);
          
          if (result.status === 'completed') {
            console.log('✅ Order confirmed as completed');
            return true;
          } else if (result.status === 'failed') {
            console.error('❌ Order confirmed as failed');
            return false;
          }
          // Status is still 'processing', continue polling
        }
        
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Poll attempt ${attempt} failed:`, error);
      }
    }
    
    console.warn('⏰ Polling timed out - order status unknown');
    return false;
  };

  // ============================================================================
  // 🔧 FIXED: PayPal Approval Handler
  // ============================================================================

  const handlePayPalApprove = async (data: any, actions: any) => {
    console.log('💳 PayPal approved:', data);
    
    if (!data || !data.orderID) {
      console.error('❌ PayPal approval missing orderID');
      setPaymentError('Payment error: Missing order ID');
      return;
    }
    
    // Set processing states
    setIsProcessing(true);
    setIsCompletingOrder(true);
    setPaymentError('');
    setOrderStatus('processing');
    
    const internalOrderNumber = `FPG-${Date.now()}`;
    setOrderNumber(internalOrderNumber);
    
    try {
      console.log('🚀 Capturing payment for order:', internalOrderNumber);
      
      // Prepare payload
      const nameParts = shippingDetails.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const payload = {
        orderID: data.orderID,
        payerID: data.payerID,
        orderNumber: internalOrderNumber,
        isDeveloperMode: isDeveloperMode,
        userDetails: {
          firstName: firstName,
          lastName: lastName,
          email: shippingDetails.email,
          phone: shippingDetails.contactNumber,
          address: shippingDetails.address,
          city: shippingDetails.suburb,
          state: shippingDetails.state,
          postcode: shippingDetails.postcode,
          country: 'Australia',
          companyName: shippingDetails.companyName || ''
        },
        websiteProducts: websiteItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price || 0,
          stock: item.stock || 0,
          image: item.image || ''
        })),
        pwaOrders: pwaItems.map(item => ({
          id: item.id,
          name: item.name,
          totalPrice: item.totalPrice || 0,
          quantity: 1,
          image: item.image || '',
          pdfDataUrl: item.pdfDataUrl,
          orderConfig: item.orderConfig,
          cartId: item.cartId || Date.now(),
          pwaOrderNumber: `PWA-${item.cartId || Date.now()}`
        })),
        totals: {
          subtotal: totals.subtotal,
          shipping: totals.shipping,
          gst: totals.gst,
          total: totals.total
        }
      };
      
      console.log('📤 Calling capture-order API...');
      
      // ============================================================================
      // 🆕 FIXED: Proper timeout handling with AbortController
      // ============================================================================
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
      
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          // ============================================================================
          // 🆕 PROPER TIMEOUT HANDLING - No optimistic success!
          // ============================================================================
          console.warn('⏰ Request timed out after 45 seconds');
          setOrderStatus('timeout');
          
          // Start polling to check if order actually completed
          console.log('📊 Starting status polling due to timeout...');
          const orderCompleted = await pollOrderStatus(internalOrderNumber);
          
          if (orderCompleted) {
            console.log('✅ Order confirmed via polling despite timeout');
            await handleOrderSuccess(internalOrderNumber, data.orderID, payload);
          } else {
            console.error('❌ Order could not be confirmed after timeout');
            setOrderStatus('failed');
            setPaymentError(
              'Payment processing timed out. Please check your email for confirmation or contact support with order number: ' + 
              internalOrderNumber
            );
            setIsProcessing(false);
            setIsCompletingOrder(false);
          }
          return;
        }
        
        throw fetchError; // Re-throw other fetch errors
      }
      
      // ============================================================================
      // 🆕 FIXED: Proper error handling - NO optimistic success on 500/502
      // ============================================================================
      
      if (!response.ok) {
        console.error(`❌ Capture API returned status ${response.status}`);
        
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Server error' };
        }
        
        // 🔧 CRITICAL FIX: NO optimistic handling for server errors
        if (response.status >= 500) {
          console.error('❌ Server error occurred - order status unknown');
          setOrderStatus('timeout');
          
          // Poll to check actual order status
          console.log('📊 Starting status polling due to server error...');
          const orderCompleted = await pollOrderStatus(internalOrderNumber);
          
          if (orderCompleted) {
            console.log('✅ Order confirmed via polling despite server error');
            await handleOrderSuccess(internalOrderNumber, data.orderID, payload);
          } else {
            console.error('❌ Order could not be confirmed after server error');
            setOrderStatus('failed');
            setPaymentError(
              'Payment processing encountered an error. Please check your email for confirmation or contact support with order number: ' + 
              internalOrderNumber
            );
            setIsProcessing(false);
            setIsCompletingOrder(false);
          }
          return;
        }
        
        // For 4xx errors, show error immediately
        setOrderStatus('failed');
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      // ============================================================================
      // SUCCESS FLOW
      // ============================================================================
      
      const result = await response.json();
      console.log('✅ Capture result:', result);
      
      if (result.success) {
        await handleOrderSuccess(internalOrderNumber, result.paypalCaptureID, payload);
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
      
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      setOrderStatus('failed');
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
      setIsCompletingOrder(false);
    }
  };

  // ============================================================================
  // 🆕 NEW: Success Handler (extracted for reuse)
  // ============================================================================
  
  const handleOrderSuccess = async (
    orderNum: string, 
    captureId: string, 
    payload: any
  ) => {
    console.log('🎉 Processing successful order:', orderNum);
    setOrderStatus('completed');
    
    // Save order data
    const orderData = {
      orderNumber: orderNum,
      orderDate: new Date().toISOString(),
      paypalCaptureID: captureId,
      userDetails: payload.userDetails,
      websiteProducts: payload.websiteProducts,
      pwaOrders: payload.pwaOrders,
      totals: payload.totals,
      testingMode: TESTING_MODE
    };
    
    localStorage.setItem('lastOrder', JSON.stringify(orderData));
    console.log('💾 Order data saved to localStorage');
    
    // Set session flag
    sessionStorage.setItem('orderCompleting', 'true');
    
    // Clear cart
    clearCart();
    localStorage.removeItem('shopping-cart');
    localStorage.removeItem('cart-timestamp');
    
    // Redirect to confirmation
    console.log('🚀 Redirecting to order confirmation...');
    setTimeout(() => {
      router.push('/order-confirmation');
    }, 100);
  };

  // ============================================================================
  // PayPal Cancel/Error Handlers
  // ============================================================================

  const handlePayPalCancel = (data: any) => {
    console.log('🚫 Payment cancelled:', data);
    setOrderStatus('idle');
    setPaymentError('Payment was cancelled. Your cart is still saved.');
  };

  const handlePayPalError = (error: any) => {
    console.error('❌ PayPal error:', error);
    setOrderStatus('failed');
    setPaymentError('There was a problem with PayPal. Please try again.');
  };

  const handleRetryPayment = () => {
    setPaymentError('');
    setIsProcessing(false);
    setOrderStatus('idle');
    setRetryCount(0);
  };

  // ============================================================================
  // RENDER: Processing Overlay
  // ============================================================================
  
  const renderProcessingOverlay = () => {
    if (orderStatus === 'timeout') {
      return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-900">Verifying Payment...</h3>
            <p className="text-gray-700 mb-2">
              Payment processing is taking longer than usual.
            </p>
            <p className="text-sm text-gray-600">
              We&apos;re checking the status with PayPal. Please don&apos;t close this window.
            </p>
            {orderNumber && (
              <p className="text-xs text-gray-500 mt-4">
                Order #: {orderNumber}
              </p>
            )}
          </div>
        </div>
      );
    }
    
    if (isProcessing && orderStatus === 'processing') {
      return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Processing Payment...</h3>
            <p className="text-gray-600">Please wait while we confirm your payment.</p>
            <p className="text-sm text-gray-500 mt-2">Do not close this window.</p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // ============================================================================
  // PDF VIEWER HANDLER
  // ============================================================================
  
  const handleViewPDF = (pdfDataUrl: string | undefined) => {
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
                <title>Custom Hose Assembly PDF</title>
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

  // ============================================================================
  // FORM VALIDATION
  // ============================================================================
  
  const validateField = (name: string, value: string): string => {
    let error = '';
    
    switch (name) {
      case 'name':
      case 'address':
        if (value.trim() === '') {
          error = 'This field is required';
        }
        break;

      case 'suburb':
        if (value.trim() === '') {
          error = 'This field is required';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = 'Please enter letters only';
        }
        break;

      case 'state':
        if (value === 'Select State') {
          error = 'Please select a state';
        }
        break;

      case 'postcode':
        if (value.trim() === '') {
          error = 'This field is required';
        } else if (!/^\d{4}$/.test(value)) {
          error = 'Please enter 4 digits';
        }
        break;

      case 'email':
        if (value.trim() === '') {
          error = 'This field is required';
        } else {
          const emailRegex = /^[a-zA-Z0-9._]+@[a-zA-Z]{2,}\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})*$/;
          if (!emailRegex.test(value)) {
            error = 'Please enter a valid email address';
          }
        }
        break;

      case 'contactNumber':
        if (value.trim() === '') {
          error = 'This field is required';
        } else if (!/^\d{10}$/.test(value)) {
          error = 'Contact number must be 10 digits';
        }
        break;
    }
    
    return error;
  };

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;
    
    // Validate all fields except optional companyName
    Object.entries(shippingDetails).forEach(([fieldName, value]) => {
      if (fieldName !== 'companyName') {
        const error = validateField(fieldName, value);
        if (error) {
          newErrors[fieldName] = error;
          hasErrors = true;
        }
      }
    });
    
    setErrors(newErrors);
    return !hasErrors;
  };

  const handleFieldChange = (name: string, value: string) => {
    // Check for developer code in name field
    if (name === 'name' && value === '20162025') {
      setIsDeveloperMode(true);
      
      // Auto-fill demo data
      setShippingDetails({
        name: 'Developer Test',
        companyName: 'Test Company',
        address: '123 Test Street',
        suburb: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        email: 'absardexter@gmail.com',
        contactNumber: '0400000000'
      });
      
      // Show popup
      alert('🔧 Developer Mode Activated!\n\nPayment amount overridden to A$0.20\nDemo shipping details auto-filled');
      
      return;
    }
    
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));

    // Show validation errors only after first submit attempt
    if (formSubmitAttempted) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleFieldBlur = (name: string) => {
    if (formSubmitAttempted) {
      const error = validateField(name, shippingDetails[name as keyof typeof shippingDetails]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleContinueToPayment = () => {
    setFormSubmitAttempted(true);
    
    if (validateAllFields()) {
      console.log('Shipping form valid, proceeding to payment');
      setStep('payment');
      //window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log('Shipping form has errors:', errors);
      alert('Please fill in all required fields correctly.');
    }
  };

  // ============================================================================
  // RENDER: Progress Indicator
  // ============================================================================
  
  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-4">
        <div 
          className="px-6 py-3 rounded-full font-semibold transition-all flex flex-col items-center justify-center text-center"
          style={{
            minWidth: "140px",
            minHeight: "85px",
            ...(step === 'shipping' ? {
              background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
              border: "1px solid rgba(255, 215, 0, 0.9)",
              color: "#000",
              boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
            } : {
              background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              color: "#666",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.05)"
            })
          }}
        >
          <div>1.</div>
          <div>Shipping Details</div>
        </div>
        <div className="h-1 w-16 bg-gray-300 rounded" />
        <div 
          className="px-6 py-3 rounded-full font-semibold transition-all flex flex-col items-center justify-center text-center"
          style={{
            minWidth: "140px",
            minHeight: "85px",
            ...(step === 'payment' ? {
              background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
              border: "1px solid rgba(255, 215, 0, 0.9)",
              color: "#000",
              boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
            } : {
              background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              color: "#666",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.05)"
            })
          }}
        >
          <div>2.</div>
          <div>Payment</div>
        </div>
      </div>
    </div>
  );

  {/* Add this right after the progress indicator */}
  {isDeveloperMode && (
    <div className="mb-4 p-4 bg-orange-100 border-2 border-orange-500 rounded-lg">
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">🔧</span>
        <div className="text-center">
          <p className="font-bold text-orange-700">Developer Mode Active</p>
          <p className="text-sm text-orange-600">Payment amount: A$0.20 | Demo data loaded</p>
        </div>
      </div>
    </div>
  )}  

  // ============================================================================
  // RENDER: Order Summary
  // ============================================================================
  
  const renderOrderSummary = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Order Summary</h2>
      
      {/* Website Products */}
      {websiteItems.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">Products</h3>
          {websiteItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
              <div className="flex items-center gap-3 flex-1">
                {item.image && (
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    width={50} 
                    height={50}
                    className="rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-gray-800" style={{ minWidth: "80px", textAlign: "right", paddingRight: "8px" }}>
                  A${((item.price || 0) * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => deleteItem(item)}
                  className="p-1.5 rounded-lg border border-red-600/30 bg-red-50/80 text-red-600 hover:bg-red-400/20 hover:border-red-600/50 transition-colors"
                  aria-label="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* PWA Orders */}
      {pwaItems.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">Custom Hose Assemblies</h3>
          {pwaItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 bg-blue-50 px-2 rounded">
              <div className="flex items-center gap-3 flex-1">
                {item.image && (
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    width={50} 
                    height={50}
                    className="rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  {item.pdfDataUrl && (
                    <button
                      onClick={() => handleViewPDF(item.pdfDataUrl)}
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
                      Click to View PDF
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-gray-800" style={{ minWidth: "80px", textAlign: "right", paddingRight: "8px" }}>
                  A${(item.totalPrice || 0).toFixed(2)}
                </p>
                <button
                  onClick={() => deleteItem(item)}
                  className="p-1.5 rounded-lg border border-red-600/30 bg-red-50/80 text-red-600 hover:bg-red-400/20 hover:border-red-600/50 transition-colors"
                  aria-label="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Totals */}
      <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal:</span>
          <span style={{ minWidth: "80px", textAlign: "right", paddingRight: "48px" }}>A${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Shipping:</span>
          <span style={{ minWidth: "80px", textAlign: "right", paddingRight: "48px" }}>A${totals.shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>GST (10%):</span>
          <span style={{ minWidth: "80px", textAlign: "right", paddingRight: "48px" }}>A${totals.gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-yellow-500">
          <span>Total:</span>
          <span style={{ minWidth: "80px", textAlign: "right", paddingRight: "48px" }}>A${totals.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: Shipping Form
  // ============================================================================
  
  const renderShippingForm = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Shipping Details</h2>
      <p className="text-sm text-red-600 mb-4">Fields marked with * are required</p>
      
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={shippingDetails.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            onBlur={() => handleFieldBlur('name')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.name 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Company Name (Optional) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Company Name <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="text"
            value={shippingDetails.companyName}
            onChange={(e) => handleFieldChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Address <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={shippingDetails.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            onBlur={() => handleFieldBlur('address')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.address 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.address && (
            <p className="text-red-600 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        {/* Suburb */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Suburb <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={shippingDetails.suburb}
            onChange={(e) => handleFieldChange('suburb', e.target.value)}
            onBlur={() => handleFieldBlur('suburb')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.suburb 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.suburb && (
            <p className="text-red-600 text-sm mt-1">{errors.suburb}</p>
          )}
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            State <span className="text-red-600">*</span>
          </label>
          <select
            value={shippingDetails.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            onBlur={() => handleFieldBlur('state')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.state 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          >
            {STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {formSubmitAttempted && errors.state && (
            <p className="text-red-600 text-sm mt-1">{errors.state}</p>
          )}
        </div>

        {/* Postcode */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Postcode <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={shippingDetails.postcode}
            onChange={(e) => handleFieldChange('postcode', e.target.value)}
            onBlur={() => handleFieldBlur('postcode')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.postcode 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.postcode && (
            <p className="text-red-600 text-sm mt-1">{errors.postcode}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            inputMode="email"
            value={shippingDetails.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.email 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Contact Number <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={shippingDetails.contactNumber}
            onChange={(e) => handleFieldChange('contactNumber', e.target.value)}
            onBlur={() => handleFieldBlur('contactNumber')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.contactNumber 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.contactNumber && (
            <p className="text-red-600 text-sm mt-1">{errors.contactNumber}</p>
          )}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinueToPayment}
            className="mt-6 py-3 px-8 font-bold rounded-full transition-all duration-300"
            style={{
              background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
              border: "1px solid rgba(255, 215, 0, 0.9)",
              color: "#000",
              boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 15px 40px rgba(250, 204, 21, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 3px 10px rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0px) scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
            }}
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: Payment Section
  // ============================================================================
  
  const renderPaymentSection = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Payment</h2>
      
      {/* Shipping Details Review */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Shipping To:</h3>
        <p>{shippingDetails.name}</p>
        {shippingDetails.companyName && <p>{shippingDetails.companyName}</p>}
        <p>{shippingDetails.address}</p>
        <p>{shippingDetails.suburb}, {shippingDetails.state} {shippingDetails.postcode}</p>
        <p className="text-sm text-gray-600 mt-2">{shippingDetails.email}</p>
        <p className="text-sm text-gray-600">{shippingDetails.contactNumber}</p>
        <button
          onClick={() => setStep('shipping')}
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
          Edit Shipping Details
        </button>
      </div>
      
      {/* Order Total Reminder */}
      <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total Amount:</span>
          <span className="font-bold text-2xl text-yellow-600">
            A${totals.total.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Payment Error Display */}
      {paymentError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <p className="text-red-700 font-semibold">❌ {paymentError}</p>
          <button
            onClick={handleRetryPayment}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* PayPal Button */}
      {!isProcessing && paypalOptions.clientId && (
        <div className="mb-6 flex justify-center">
          <div style={{ width: "100%", maxWidth: "450px" }}>
            <PayPalScriptProvider options={paypalOptions}>
              <PayPalButtons
                style={{
                  layout: 'vertical',
                  color: 'gold',
                  shape: 'pill',
                  label: 'paypal',
                  height: 55
                }}
                className="paypal-buttons-custom"
                createOrder={(data, actions) => {
                  // Use developer override price if in developer mode
                  const orderAmount = isDeveloperMode ? '0.20' : totals.total.toFixed(2);
                  
                  console.log(isDeveloperMode ? '🔧 Developer Mode: Using test amount $0.20' : `Creating order for $${orderAmount}`);
                  
                  return actions.order.create({
                    intent: 'CAPTURE',
                    purchase_units: [{
                      description: isDeveloperMode 
                        ? `FluidPower Order - DEVELOPER TEST - A$${orderAmount}`
                        : `FluidPower Order - A$${orderAmount}`,
                      amount: {
                        currency_code: 'AUD',
                        value: orderAmount
                      }
                    }]
                  });
                }}
                onApprove={handlePayPalApprove}
                onCancel={handlePayPalCancel}
                onError={handlePayPalError}
              />
            </PayPalScriptProvider>
          </div>
        </div>
      )}
      
      {/* No Client ID Warning */}
      {!paypalOptions.clientId && !isProcessing && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <p className="text-red-700 font-semibold">⚠️ PayPal is not configured</p>
          <p className="text-sm text-red-600 mt-2">
            Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID to your .env.local file and restart the server.
          </p>
        </div>
      )}
      
      {/* Processing State */}
      {isProcessing && (
        <div className="mb-6 p-8 bg-blue-50 border-2 border-blue-500 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-700 font-semibold text-lg">Processing Payment...</p>
          <p className="text-blue-600 text-sm mt-2">Please wait, do not close this window.</p>
        </div>
      )}
      
      <p className="text-sm text-gray-600 text-center mb-4">
        Secure payment processed by PayPal. You dont need a PayPal account to pay.
      </p>
      
      {/* Back Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setStep('shipping')}
          disabled={isProcessing}
          className="relative overflow-hidden transition-all duration-300 ease-out"
          style={{
            cursor: isProcessing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 28px",
            borderRadius: "40px",
            fontSize: "1.125rem",
            fontWeight: "600",
            color: isProcessing ? "#9CA3AF" : "#fff",
            textDecoration: "none",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            whiteSpace: "nowrap",
            minWidth: "180px",
            width: "auto",
            background: isProcessing 
              ? "rgba(229, 231, 235, 0.5)"
              : `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`,
            backdropFilter: isProcessing ? "none" : "blur(15px)",
            border: isProcessing 
              ? "1px solid rgba(209, 213, 219, 0.5)"
              : "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: isProcessing
              ? "none"
              : `
                0 4px 15px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 2px 8px rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `,
            opacity: isProcessing ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 20%, rgba(255, 255, 255, 0.9) 70%, rgba(245, 245, 245, 0.95) 100%), rgba(255, 255, 255, 0.9)`;
              e.currentTarget.style.border = "1px solid rgba(200, 200, 200, 0.8)";
              e.currentTarget.style.color = "#000";
              e.currentTarget.style.boxShadow = `
                0 10px 30px rgba(0, 0, 0, 0.2),
                inset 0 2px 0 rgba(255, 255, 255, 1),
                inset 0 3px 10px rgba(255, 255, 255, 0.8),
                inset 0 -1px 0 rgba(200, 200, 200, 0.4)
              `;
            }
          }}
          onMouseLeave={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.transform = "translateY(0px) scale(1)";
              e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`;
              e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.boxShadow = `
                0 4px 15px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 2px 8px rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `;
            }
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "1px",
              left: "8px",
              right: "8px",
              height: "50%",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
              borderRadius: "40px 40px 20px 20px",
              pointerEvents: "none",
              transition: "all 0.4s ease"
            }}
          />
          ← Back to Shipping
        </button>
      </div>
</div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">FluidPower Group</h1>
          <p className="text-2xl font-semibold text-gray-700 mt-1">Checkout</p>
        </div>
        
        {/* Progress Indicator */}
        {renderProgressIndicator()}
        
        {/* Order Summary (Always Visible) */}
        {renderOrderSummary()}
        
        {/* Conditional Content Based on Step */}
        {step === 'shipping' ? renderShippingForm() : renderPaymentSection()}
      </div>
      
      {/* Global Processing Overlay */}
      {renderProcessingOverlay()}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Processing Payment...</h3>
            <p className="text-gray-600">Please wait while we confirm your payment.</p>
            <p className="text-sm text-gray-500 mt-2">Do not close this window.</p>
          </div>
        </div>
      )}

      {/* PDF Modal - Only for desktop */}
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
            {/* Close button */}
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
    </div>
  );
}