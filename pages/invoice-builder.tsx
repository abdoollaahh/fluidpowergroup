// pages/invoice-builder.tsx

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { IItemCart } from '../types/cart';
import { separateCartItems } from '../utils/cart-helpers';
import {
  InvoiceCustomer,
  InvoiceShippingAddress,
  InvoiceLineItem,
  SupplierInvoiceData,
  PaymentTerm,
  generateInvoicePDF,
  calculateDueDate,
  INVOICE_CONFIG
} from '../lib/invoice';
import CustomerDetailsForm from '../components/invoice/CustomerDetailsForm';
import InvoiceItemsEditor from '../components/invoice/InvoiceItemsEditor';
import InvoicePreview from '../components/invoice/InvoicePreview';
import InvoiceControls from '../components/invoice/InvoiceControls';
import ProductSearchWidget from '../components/invoice/ProductSearchWidget';

export default function InvoiceBuilder() {
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [customer, setCustomer] = useState<InvoiceCustomer>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    state: '',
    postcode: ''
  });
  const [shippingAddress, setShippingAddress] = useState<InvoiceShippingAddress | null>(null);
  const [poNumber, setPONumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm>('EOM 30');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<SupplierInvoiceData | null>(null);

  // Handle adding product from sidebar
  const handleAddProduct = (product: any) => {
    console.log('[InvoiceBuilder] Adding product:', product);
    
    // Create invoice line item from product
    const productPrice = product.price || 0;
    const productId = product.id || product.slug || `temp-${Date.now()}`;
    const productName = product.name || product.title || 'Unnamed Product';
    
    const newItem: InvoiceLineItem = {
      id: productId,
      name: productName,
      description: '', // Supplier can add later
      quantity: 1,
      unitPrice: productPrice,
      subtotal: productPrice
    };
    
    // Check if product already in invoice
    const existingIndex = items.findIndex(item => item.id === productId);
    
    if (existingIndex >= 0) {
      // Increment quantity if already added
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setItems(updated);
      
      // Show toast feedback
      showToast(`Quantity increased to ${updated[existingIndex].quantity}`);
      console.log('[InvoiceBuilder] Quantity incremented:', updated[existingIndex]);
    } else {
      // Add new item
      setItems([...items, newItem]);
      
      // Show toast feedback
      showToast(`${productName} added to invoice`);
      console.log('[InvoiceBuilder] New product added:', newItem);
    }
  };

  // Toast notification helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load cart items on mount
  useEffect(() => {
    const cartData = localStorage.getItem('shopping-cart');
    if (cartData) {
      try {
        const cartObject = JSON.parse(cartData);
        const cartItems: IItemCart[] = cartObject.items || [];
        const { pwaItems, websiteItems, trac360Items, function360Items } = separateCartItems(cartItems);

        const invoiceItems: InvoiceLineItem[] = [];

        // Add website items
        websiteItems.forEach(item => {
          invoiceItems.push({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price || 0,
            subtotal: (item.price || 0) * item.quantity
          });
        });

        // Add PWA items
        pwaItems.forEach(item => {
          invoiceItems.push({
            id: item.id,
            name: 'HOSE360 Custom Assembly',
            quantity: item.quantity,
            unitPrice: item.totalPrice || 0,
            subtotal: item.totalPrice || 0
          });
        });

        // Add TRAC360 items
        trac360Items.forEach(item => {
          invoiceItems.push({
            id: item.id,
            name: item.name || 'TRAC360 Custom Configuration',
            quantity: item.quantity,
            unitPrice: item.totalPrice || 0,
            subtotal: item.totalPrice || 0
          });
        });

        // Add FUNCTION360 items
        function360Items.forEach(item => {
          invoiceItems.push({
            id: item.id,
            name: 'FUNCTION360 Custom Kit',
            quantity: item.quantity,
            unitPrice: item.totalPrice || 0,
            subtotal: item.totalPrice || 0
          });
        });

        if (invoiceItems.length > 0) {
          setItems(invoiceItems);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = subtotal * (discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const gst = subtotalAfterDiscount * INVOICE_CONFIG.gstRate;
    const total = subtotalAfterDiscount + gst;

    return { subtotal, discountAmount, gst, total };
  };

  const totals = calculateTotals();

  // Validate form
  const canGenerate = 
    customer.name.trim() !== '' &&
    customer.email.trim() !== '' &&
    customer.phone.trim() !== '' &&
    customer.address.trim() !== '' &&
    customer.suburb.trim() !== '' &&
    customer.state.trim() !== '' &&
    customer.postcode.trim() !== '' &&
    items.length > 0;

  // Generate invoice
  const handleGenerate = () => {
    if (!canGenerate) return;

    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceDate = new Date().toISOString().split('T')[0];
    const dueDate = calculateDueDate(invoiceDate, paymentTerms);

    const invoiceData: SupplierInvoiceData = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      customer,
      shippingAddress,
      poNumber: poNumber.trim() || 'N/A',
      paymentTerms,
      discount,
      notes,
      items,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      gst: totals.gst,
      total: totals.total
    };

    try {
      const pdf = generateInvoicePDF(invoiceData);
      
      // Save to localStorage as backup
      localStorage.setItem('last-invoice', JSON.stringify(invoiceData));
      
      // Download PDF
      pdf.save(`${invoiceNumber}.pdf`);
      
      setHasGenerated(true);
      setLastGeneratedInvoice(invoiceData);  // Store full invoice data for emailing
      alert('Invoice generated successfully! PDF downloaded.');
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
  };

  // Generate another invoice
  const handleGenerateAnother = () => {
    setCustomer({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      suburb: '',
      state: '',
      postcode: ''
    });
    setShippingAddress(null);
    setPONumber('');
    setDiscount(0);
    setNotes('');
    setHasGenerated(false);
    setLastGeneratedInvoice(null);
  };

  // Create preview data
  const previewData: SupplierInvoiceData = {
    invoiceNumber: `INV-${Date.now()}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: calculateDueDate(new Date().toISOString().split('T')[0], paymentTerms),
    customer,
    shippingAddress,
    poNumber: poNumber.trim() || 'N/A',
    paymentTerms,
    discount,
    notes,
    items,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    gst: totals.gst,
    total: totals.total
  };

  return (
    <>
      <Head>
        <title>Invoice Builder - FluidPower Group</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Split Screen Layout */}
        <div className="flex gap-0 min-h-screen">
          {/* LEFT SIDEBAR: Product Browser - 35% width */}
          <div className="w-[35%] border-r border-gray-300 bg-white sticky top-0 h-screen overflow-y-auto">
            <div className="p-6">
              <ProductSearchWidget onAddProduct={handleAddProduct} />
            </div>
          </div>

          {/* RIGHT SECTION: Invoice Builder - 65% width */}
          <div className="w-[65%] overflow-y-auto">
            <div className="py-8 px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">FluidPower Group</h1>
                  <p className="text-2xl font-semibold text-gray-700 mt-1">Supplier Invoice Builder</p>
                  <p className="text-sm text-gray-600 mt-2">Create custom invoices for customers</p>
                </div>

                <CustomerDetailsForm
                  customer={customer}
                  shippingAddress={shippingAddress}
                  poNumber={poNumber}
                  paymentTerms={paymentTerms}
                  discount={discount}
                  notes={notes}
                  onCustomerChange={setCustomer}
                  onShippingAddressChange={setShippingAddress}
                  onPONumberChange={setPONumber}
                  onPaymentTermsChange={setPaymentTerms}
                  onDiscountChange={setDiscount}
                  onNotesChange={setNotes}
                />

                <InvoiceItemsEditor
                  items={items}
                  onItemsChange={setItems}
                />

                <InvoicePreview invoiceData={previewData} />

                <InvoiceControls
                  onGenerate={handleGenerate}
                  onGenerateAnother={handleGenerateAnother}
                  canGenerate={canGenerate}
                  hasGenerated={hasGenerated}
                  customerEmail={customer.email}
                  lastGeneratedInvoice={lastGeneratedInvoice}
                />

                {hasGenerated && (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-bold text-green-800 mb-2">Invoice Generated</h3>
                    <p className="text-green-700 mb-4">PDF has been downloaded. You can now email it to your customer.</p>
                    <p className="text-sm text-green-600">Ready to create another invoice?</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}