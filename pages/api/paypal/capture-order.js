// pages/api/paypal/capture-order.js
import fetch from 'node-fetch';
import swell from 'swell-node';

// ========================================
// TESTING MODE CONFIGURATION
// ========================================
// Set TESTING_MODE="true" in Vercel environment variables for testing branch
// Remove or set to "false" for production
const TESTING_MODE = process.env.TESTING_MODE === 'true';

// Initialize Swell
swell.init(process.env.NODE_PUBLIC_SWELL_STORE_ID, process.env.NODE_PUBLIC_SWELL_SECRET_KEY);

// More precise environment determination
const isVercelPreview = process.env.VERCEL_ENV === 'preview';
const forceSandbox = process.env.PAYPAL_MODE === 'sandbox';
const forceProduction = process.env.PAYPAL_MODE === 'production';

// If PAYPAL_MODE is explicitly set, use that, otherwise use environment detection
const USE_SANDBOX = forceProduction ? false : (forceSandbox || isVercelPreview || process.env.NODE_ENV !== 'production');

// PayPal credentials - Use TEST versions when TESTING_MODE is enabled
const PAYPAL_CLIENT_ID = TESTING_MODE 
    ? (USE_SANDBOX ? process.env.SANDBOX_CLIENT_ID_TEST : process.env.PRODUCTION_CLIENT_ID_TEST)
    : (USE_SANDBOX ? process.env.SANDBOX_CLIENT_ID : process.env.PRODUCTION_CLIENT_ID);
    
const PAYPAL_CLIENT_SECRET = TESTING_MODE
    ? (USE_SANDBOX ? process.env.SANDBOX_SECRET_TEST : process.env.PRODUCTION_SECRET_TEST)
    : (USE_SANDBOX ? process.env.SANDBOX_SECRET : process.env.PRODUCTION_SECRET);
    
const PAYPAL_API_BASE = USE_SANDBOX
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY;

// Log testing mode status (helpful for debugging)
if (TESTING_MODE) {
    console.log('🧪 TESTING MODE ENABLED - Using test credentials');
}

// --- Helper: Get PayPal Access Token ---
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const url = `${PAYPAL_API_BASE}/v1/oauth2/token`;
    try {
        const response = await fetch(url, { 
            method: 'POST', 
            headers: { 
                'Authorization': `Basic ${auth}`, 
                'Content-Type': 'application/x-www-form-urlencoded', 
            }, 
            body: 'grant_type=client_credentials', 
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Failed to get token, status: ${response.status}`}));
            throw new Error(errorData.message || `Failed to get PayPal access token. Status: ${response.status}`);
        }
        const data = await response.json();
        return data.access_token;
    } catch (error) { 
        console.error("Error fetching PayPal access token:", error); 
        throw new Error('Could not obtain PayPal access token.'); 
    }
}

// --- Helper: Update Swell Inventory ---
async function updateSwellInventory(websiteProducts) {
    if (!websiteProducts || websiteProducts.length === 0) {
        console.log('No website products to update inventory for.');
        return { success: true, message: 'No inventory to update' };
    }

    const results = [];
    
    for (const item of websiteProducts) {
        try {
            console.log(`Updating inventory for product: ${item.id} (${item.name})`);
            
            // Fetch current product data from Swell
            const product = await swell.get('/products', item.id);
            
            if (!product) {
                console.error(`Product not found in Swell: ${item.id}`);
                results.push({ 
                    id: item.id, 
                    success: false, 
                    error: 'Product not found' 
                });
                continue;
            }

            const currentStock = product.stock_level || 0;
            const newStock = currentStock - item.quantity;

            console.log(`Product ${item.id}: Current stock: ${currentStock}, Ordered: ${item.quantity}, New stock: ${newStock}`);

            // Update the product stock in Swell
            await swell.put(`/products/${item.id}`, {
                stock_level: Math.max(0, newStock) // Ensure stock doesn't go negative
            });

            console.log(`✓ Successfully updated inventory for ${item.id}`);
            results.push({ 
                id: item.id, 
                success: true, 
                oldStock: currentStock, 
                newStock: Math.max(0, newStock) 
            });

        } catch (error) {
            console.error(`Failed to update inventory for ${item.id}:`, error);
            results.push({ 
                id: item.id, 
                success: false, 
                error: error.message 
            });
        }
    }

    const allSuccessful = results.every(r => r.success);
    return { 
        success: allSuccessful, 
        results,
        message: allSuccessful ? 'All inventory updated' : 'Some inventory updates failed'
    };
}

// --- Helper: Send Order Confirmation Email ---
async function sendOrderEmail(orderData) {
    const { 
        orderNumber, 
        userDetails, 
        websiteProducts, 
        pwaOrders, 
        totals,
        paypalCaptureID 
    } = orderData;

    try {
        console.log(`Preparing to send order confirmation emails for order #${orderNumber}`);

        // Generate email templates
        const emailTemplates = generateEmailTemplates(
            orderNumber,
            userDetails,
            websiteProducts,
            pwaOrders,
            totals,
            paypalCaptureID
        );

        // Prepare PDF attachments array (base64 encoded)
        const pdfAttachments = pwaOrders
            .filter(order => order.pdfDataUrl)
            .map(order => {
                // Extract base64 from data URL (remove "data:application/pdf;base64," prefix)
                const base64Data = order.pdfDataUrl.split(',')[1];
                return {
                    name: `Custom-Hose-Assembly-${order.cartId || 'order'}.pdf`,
                    contentBytes: base64Data
                };
            });

        // Call the email API
        const emailResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-server-key': VALID_SERVER_KEY
            },
            body: JSON.stringify({
                orderNumber,
                userDetails,
                userEmail: userDetails.email,
                emailTemplates,
                pdfAttachments: pdfAttachments.length > 0 ? pdfAttachments : null,
                testingMode: TESTING_MODE // Pass testing mode flag to email API
            })
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
            throw new Error(emailResult.error || 'Email service returned error');
        }

        console.log(`✓ Order confirmation emails sent successfully for order #${orderNumber}`);
        return { success: true, ...emailResult };

    } catch (error) {
        console.error('Failed to send order confirmation email:', error);
        return { success: false, error: error.message };
    }
}

// --- Helper: Generate Email Templates ---
function generateEmailTemplates(orderNumber, userDetails, websiteProducts, pwaOrders, totals, paypalCaptureID) {
    const currentDate = new Date().toLocaleDateString('en-AU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Determine business email based on testing mode
    const businessEmailDisplay = TESTING_MODE 
        ? process.env.BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au'
        : process.env.BUSINESS_EMAIL;

    // Testing mode banner for emails (only shows in test mode)
    const testingBanner = TESTING_MODE ? `
        <div style="background-color: #ff6b6b; color: white; padding: 10px; text-align: center; font-weight: bold; margin-bottom: 20px;">
            🧪 TESTING MODE - This is a test email
        </div>
    ` : '';

    // Customer Email Template
    const customerEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { background-color: #FACC15; padding: 30px; text-align: center; }
                .header h1 { margin: 0; color: #000; font-size: 28px; }
                .content { padding: 30px; }
                .order-info { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .order-info h2 { margin-top: 0; color: #FACC15; }
                .product-item { display: flex; gap: 15px; padding: 15px; border-bottom: 1px solid #eee; align-items: center; }
                .product-item:last-child { border-bottom: none; }
                .product-image { width: 80px; height: 80px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; background: white; padding: 5px; }
                .product-details { flex: 1; }
                .product-name { font-weight: bold; margin-bottom: 5px; }
                .product-price { color: #666; }
                .custom-badge { display: inline-block; background-color: #FACC15; color: #000; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-top: 5px; }
                .totals { margin-top: 20px; padding-top: 20px; border-top: 2px solid #FACC15; }
                .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
                .total-row.final { font-size: 20px; font-weight: bold; color: #FACC15; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
                .shipping-info { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .footer { background-color: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
                .footer a { color: #FACC15; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                ${testingBanner}
                <div class="header">
                    <h1>Thank You For Your Order!</h1>
                </div>
                
                <div class="content">
                    <p>Hi ${userDetails.firstName || 'Customer'},</p>
                    <p>Thank you for your order! We've received your payment and your order is being processed.</p>
                    
                    <div class="order-info">
                        <h2>Order Details</h2>
                        <p><strong>Order Number:</strong> #${orderNumber}</p>
                        <p><strong>Order Date:</strong> ${currentDate}</p>
                        <p><strong>Payment ID:</strong> ${paypalCaptureID}</p>
                    </div>

                    <h3>Order Summary</h3>
                    
                    ${websiteProducts.length > 0 ? `
                        <div style="margin: 20px 0;">
                            ${websiteProducts.map(item => `
                                <div class="product-item">
                                    <img src="${item.image || 'https://fluidpowergroup.com.au/cartImage.jpeg'}" alt="${item.name}" class="product-image" />
                                    <div class="product-details">
                                        <div class="product-name">${item.name}</div>
                                        <div class="product-price">Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${pwaOrders.length > 0 ? `
                        <div style="margin: 20px 0;">
                            ${pwaOrders.map(order => `
                                <div class="product-item">
                                    <img src="${order.image || 'https://fluidpowergroup.com.au/cartImage.jpeg'}" alt="${order.name}" class="product-image" />
                                    <div class="product-details">
                                        <div class="product-name">${order.name}</div>
                                        <span class="custom-badge">Custom Order</span>
                                        <div class="product-price">Qty: ${order.quantity} × $${order.totalPrice.toFixed(2)}</div>
                                    </div>
                                </div>
                            `).join('')}
                            <p style="margin-top: 15px; padding: 10px; background-color: #fffbeb; border-left: 4px solid #FACC15; font-size: 14px;">
                                📎 Your custom hose assembly specifications are attached as PDF${pwaOrders.length > 1 ? 's' : ''} to this email.
                            </p>
                        </div>
                    ` : ''}

                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>$${totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                            <span>Shipping:</span>
                            <span>$${totals.shipping.toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                            <span>GST (10%):</span>
                            <span>$${totals.gst.toFixed(2)}</span>
                        </div>
                        <div class="total-row final">
                            <span>Total Paid:</span>
                            <span>$${totals.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="shipping-info">
                        <h3 style="margin-top: 0;">Shipping Address</h3>
                        <p style="margin: 5px 0;">${userDetails.firstName} ${userDetails.lastName}</p>
                        <p style="margin: 5px 0;">${userDetails.address}</p>
                        <p style="margin: 5px 0;">${userDetails.city}, ${userDetails.state} ${userDetails.postcode}</p>
                        <p style="margin: 5px 0;">${userDetails.country}</p>
                        ${userDetails.phone ? `<p style="margin: 5px 0;">Phone: ${userDetails.phone}</p>` : ''}
                    </div>

                    <p>We'll send you another email once your order has been shipped with tracking information.</p>
                    <p>If you have any questions about your order, please don't hesitate to contact us.</p>
                </div>

                <div class="footer">
                    <p><strong>FluidPower Group</strong></p>
                    <p>Email: <a href="mailto:${businessEmailDisplay}">${businessEmailDisplay}</a></p>
                    <p>Website: <a href="https://fluidpowergroup.com.au">fluidpowergroup.com.au</a></p>
                </div>
            </div>
        </body>
        </html>
    `;

    // Business Email Template
    const businessEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { background-color: #333; padding: 30px; text-align: center; }
                .header h1 { margin: 0; color: #FACC15; font-size: 28px; }
                .content { padding: 30px; }
                .alert-box { background-color: #FACC15; color: #000; padding: 15px; border-radius: 8px; margin: 20px 0; font-weight: bold; text-align: center; }
                .order-info { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .product-item { display: flex; gap: 15px; padding: 15px; border-bottom: 1px solid #eee; align-items: center; }
                .product-item:last-child { border-bottom: none; }
                .product-image { width: 80px; height: 80px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; background: white; padding: 5px; }
                .product-details { flex: 1; }
                .product-name { font-weight: bold; margin-bottom: 5px; }
                .custom-badge { display: inline-block; background-color: #FACC15; color: #000; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-top: 5px; }
                .totals { margin-top: 20px; padding-top: 20px; border-top: 2px solid #FACC15; }
                .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
                .total-row.final { font-size: 20px; font-weight: bold; color: #FACC15; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
                .customer-info { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                ${testingBanner}
                <div class="header">
                    <h1>🔔 New Order Received</h1>
                </div>
                
                <div class="content">
                    <div class="alert-box">
                        New Order #${orderNumber} - Action Required
                    </div>
                    
                    <div class="order-info">
                        <h2 style="margin-top: 0; color: #FACC15;">Order Information</h2>
                        <p><strong>Order Number:</strong> #${orderNumber}</p>
                        <p><strong>Order Date:</strong> ${currentDate}</p>
                        <p><strong>PayPal Capture ID:</strong> ${paypalCaptureID}</p>
                        <p><strong>Payment Status:</strong> ✅ COMPLETED</p>
                    </div>

                    <div class="customer-info">
                        <h3 style="margin-top: 0;">Customer Details</h3>
                        <p><strong>Name:</strong> ${userDetails.firstName} ${userDetails.lastName}</p>
                        <p><strong>Email:</strong> ${userDetails.email}</p>
                        ${userDetails.phone ? `<p><strong>Phone:</strong> ${userDetails.phone}</p>` : ''}
                        <p><strong>Shipping Address:</strong><br/>
                        ${userDetails.address}<br/>
                        ${userDetails.city}, ${userDetails.state} ${userDetails.postcode}<br/>
                        ${userDetails.country}</p>
                    </div>

                    <h3>Order Items</h3>
                    
                    ${websiteProducts.length > 0 ? `
                        <h4>Website Products (${websiteProducts.length})</h4>
                        <div style="margin: 20px 0;">
                            ${websiteProducts.map(item => `
                                <div class="product-item">
                                    <img src="${item.image || 'https://fluidpowergroup.com.au/cartImage.jpeg'}" alt="${item.name}" class="product-image" />
                                    <div class="product-details">
                                        <div class="product-name">${item.name}</div>
                                        <div>Product ID: ${item.id}</div>
                                        <div>Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>No website products in this order.</p>'}

                    ${pwaOrders.length > 0 ? `
                        <h4>Custom Hose Assemblies (${pwaOrders.length})</h4>
                        <div style="margin: 20px 0;">
                            ${pwaOrders.map(order => `
                                <div class="product-item">
                                    <img src="${order.image || 'https://fluidpowergroup.com.au/cartImage.jpeg'}" alt="${order.name}" class="product-image" />
                                    <div class="product-details">
                                        <div class="product-name">${order.name}</div>
                                        <span class="custom-badge">Custom Order</span>
                                        <div>Cart ID: ${order.cartId}</div>
                                        <div>Price: $${order.totalPrice.toFixed(2)}</div>
                                    </div>
                                </div>
                            `).join('')}
                            <p style="margin-top: 15px; padding: 10px; background-color: #fffbeb; border-left: 4px solid #FACC15;">
                                📎 Custom order specifications are attached as PDF${pwaOrders.length > 1 ? 's' : ''}.
                            </p>
                        </div>
                    ` : '<p>No custom orders in this order.</p>'}

                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>$${totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                            <span>Shipping:</span>
                            <span>$${totals.shipping.toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                            <span>GST (10%):</span>
                            <span>$${totals.gst.toFixed(2)}</span>
                        </div>
                        <div class="total-row final">
                            <span>Total Received:</span>
                            <span>$${totals.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style="margin-top: 30px; padding: 20px; background-color: #fffbeb; border-left: 4px solid #FACC15;">
                        <h3 style="margin-top: 0;">⚡ Next Steps</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            ${websiteProducts.length > 0 ? '<li>Check inventory levels (already updated automatically)</li>' : ''}
                            ${pwaOrders.length > 0 ? '<li>Review custom hose assembly specifications in attached PDF(s)</li>' : ''}
                            <li>Prepare items for shipping</li>
                            <li>Send tracking information to customer</li>
                        </ul>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    return {
        customerEmailContent,
        businessEmailContent
    };
}

// --- Main API Handler ---
export default async function handler(req, res) {
    // --- Keep Basic CORS ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { return res.status(204).end(); }
    if (req.method !== 'POST') { 
        res.setHeader('Allow', ['POST', 'OPTIONS']); 
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` }); 
    }

    console.log("Received request to /api/paypal/capture-order");
    if (TESTING_MODE) {
        console.log("🧪 Running in TESTING MODE");
    }

    // Extract order data from request
    const {
        orderID,
        payerID,
        orderNumber,
        userDetails,
        websiteProducts = [],
        pwaOrders = [],
        totals
    } = req.body;

    // Validation
    if (!orderID) {
        console.error("Missing PayPal orderID in request body for capture");
        return res.status(400).json({ success: false, error: 'Missing required PayPal orderID.' });
    }
    if (!orderNumber) console.warn(`Warning: Internal orderNumber not received for orderID: ${orderID}`);
    if (!userDetails) console.warn(`Warning: userDetails not received for orderID: ${orderID}`);

    try {
        console.log(`Attempting to capture PayPal order ID: ${orderID}, Payer ID: ${payerID}`);
        const accessToken = await getPayPalAccessToken();
        console.log("Obtained PayPal Access Token for capture.");

        const captureUrl = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`;

        // --- Call PayPal Capture API ---
        const captureResponse = await fetch(captureUrl, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/json', 
            }
        });
        const captureData = await captureResponse.json().catch(async () => ({ 
            error_text: await captureResponse.text() 
        }));

        // --- Handle Capture Response ---
        if (!captureResponse.ok) {
            console.error(`PayPal capture failed for order ${orderID}. Status: ${captureResponse.status}`, captureData);
            const errorMessage = captureData?.details?.[0]?.description || captureData?.message || captureData?.error_text || 'Payment capture failed.';
            
            if (captureData.name === 'ORDER_ALREADY_CAPTURED' || (captureData?.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED')) {
                console.warn(`Order ${orderID} was already captured.`);
                return res.status(200).json({ 
                    success: true, 
                    message: 'Order already captured.', 
                    paypalStatus: 'COMPLETED', 
                    code: 'ORDER_ALREADY_CAPTURED'
                });
            }
            return res.status(captureResponse.status >= 500 ? 502 : 400).json({ 
                success: false, 
                error: errorMessage 
            });
        }

        console.log(`Successfully captured PayPal order ${orderID}. Overall Capture Status: ${captureData.status}`);

        // Extract detailed capture status and ID
        let finalCaptureStatus = captureData.status;
        let captureId = null;

        if (captureData.purchase_units && captureData.purchase_units[0] &&
            captureData.purchase_units[0].payments && captureData.purchase_units[0].payments.captures &&
            captureData.purchase_units[0].payments.captures[0]) {
            finalCaptureStatus = captureData.purchase_units[0].payments.captures[0].status;
            captureId = captureData.purchase_units[0].payments.captures[0].id;
            console.log(`Detailed Capture Status: ${finalCaptureStatus}, Capture ID: ${captureId}`);
        } else {
            console.warn(`Could not find detailed capture info in purchase_units for orderID: ${orderID}. Using overall status.`);
        }

        // Check capture status
        if (finalCaptureStatus !== 'COMPLETED' && finalCaptureStatus !== 'PENDING') {
            console.warn(`PayPal order ${orderID} capture status is ${finalCaptureStatus}, not COMPLETED/PENDING.`);
            return res.status(400).json({ 
                success: false, 
                error: `Payment status is ${finalCaptureStatus}. Consider this as potentially failed or requiring review.` 
            });
        }

        console.log(`✓ Payment captured successfully for order ${orderID}`);

        // --- STEP 2: Update Swell Inventory (for website products only) ---
        let inventoryResult = { success: true, message: 'No inventory to update' };
        
        if (websiteProducts.length > 0) {
            console.log(`Updating inventory for ${websiteProducts.length} website product(s)...`);
            try {
                inventoryResult = await updateSwellInventory(websiteProducts);
                
                if (inventoryResult.success) {
                    console.log(`✓ Inventory updated successfully`);
                } else {
                    console.error(`⚠️ Some inventory updates failed:`, inventoryResult);
                }
            } catch (inventoryError) {
                console.error('⚠️ Inventory update failed (non-fatal):', inventoryError);
                inventoryResult = { 
                    success: false, 
                    error: inventoryError.message,
                    message: 'Inventory update failed but order captured successfully'
                };
            }
        }

        // --- STEP 3: Send Order Confirmation Emails ---
        console.log(`Sending order confirmation emails...`);
        let emailResult = { success: true, message: 'Emails sent' };
        
        try {
            emailResult = await sendOrderEmail({
                orderNumber,
                userDetails,
                websiteProducts,
                pwaOrders,
                totals,
                paypalCaptureID: captureId
            });

            if (emailResult.success) {
                console.log(`✓ Order confirmation emails sent successfully`);
            } else {
                console.error(`⚠️ Email sending failed:`, emailResult);
            }
        } catch (emailError) {
            console.error('⚠️ Email sending failed (non-fatal):', emailError);
            emailResult = { 
                success: false, 
                error: emailError.message,
                message: 'Email failed but order captured successfully'
            };
        }

        // --- Final Response ---
        const warnings = [];
        if (!inventoryResult.success) warnings.push('Inventory update incomplete');
        if (!emailResult.success) warnings.push('Email notification failed');

        res.status(200).json({
            success: true,
            message: 'Order captured successfully.',
            paypalOrderStatus: captureData.status,
            paypalCaptureStatus: finalCaptureStatus,
            paypalCaptureID: captureId,
            inventoryUpdated: inventoryResult.success,
            emailsSent: emailResult.success,
            testingMode: TESTING_MODE,
            warnings: warnings.length > 0 ? warnings : undefined
        });

    } catch (error) {
        console.error(`Unhandled error in /api/paypal/capture-order for orderID ${orderID}:`, error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error during payment capture.' 
        });
    }
}