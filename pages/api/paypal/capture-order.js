// pages/api/paypal/capture-order.js - SYNCHRONOUS VERSION
// This version waits for emails to send BEFORE returning response to frontend
// ⚠️ WARNING: This will timeout on Vercel Hobby plan if emails take >10 seconds

import fetch from 'node-fetch';
import swell from 'swell-node';
import { setOrderStatus, getOrderStatus, updateOrderStatus } from './order-status.js';

// ========================================
// TESTING MODE CONFIGURATION
// ========================================
const TESTING_MODE = process.env.TESTING_MODE === 'true';

// ========================================
// IDEMPOTENCY TRACKING
// ========================================
// Tracks PayPal orderIDs that have been processed to prevent duplicate captures
const processedPayPalOrders = new Map();

// Check if PayPal order was already processed
function isPayPalOrderProcessed(paypalOrderId) {
    return processedPayPalOrders.has(paypalOrderId);
}

// Mark PayPal order as processed
function markPayPalOrderProcessed(paypalOrderId, internalOrderNumber) {
    processedPayPalOrders.set(paypalOrderId, {
        internalOrderNumber,
        timestamp: new Date().toISOString()
    });
    console.log(`🔒 Marked PayPal order ${paypalOrderId} as processed`);
}

// Cleanup old processed orders (older than 24 hours)
setInterval(() => {
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    for (const [orderId, data] of processedPayPalOrders.entries()) {
        const orderTime = new Date(data.timestamp).getTime();
        if (orderTime < dayAgo) {
            console.log(`🗑️ Cleaning up old processed order: ${orderId}`);
            processedPayPalOrders.delete(orderId);
        }
    }
}, 60 * 60 * 1000); // Run every hour

// ========================================
// HELPER FUNCTIONS
// ========================================

// --- Helper: Get PayPal Access Token ---
async function getPayPalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE) {
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
async function updateSwellInventory(websiteProducts, orderId) {
    if (!websiteProducts || websiteProducts.length === 0) {
        console.log('No website products to update inventory for.');
        return { success: true, message: 'No inventory to update' };
    }

    const results = [];

    for (const item of websiteProducts) {
        try {
            console.log(`\n📦 Processing: ${item.name} (${item.id})`);
            console.log(`   Quantity sold: ${item.quantity}`);

            const adjustment = await swell.post('/products:stock', {
                parent_id: item.id,
                quantity: -item.quantity,
                reason: 'sold',
                reason_message: `PayPal Order ${orderId}`
            });

            console.log(`✅ Stock updated successfully!`);
            console.log(`   Previous level: ${adjustment.level + item.quantity}`);
            console.log(`   New level: ${adjustment.level}`);

            results.push({
                productId: item.id,
                productName: item.name,
                success: true,
                newStockLevel: adjustment.level
            });

        } catch (error) {
            console.error(`❌ Failed to update stock for ${item.id}:`, error.message);
            results.push({
                productId: item.id,
                productName: item.name,
                success: false,
                error: error.message
            });
        }
    }

    console.log('\n✅ Inventory update complete!');
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    return {
        success: failCount === 0,
        totalProcessed: results.length,
        successCount,
        failCount,
        details: results
    };
}

// --- Helper: Send Order Confirmation Email ---
async function sendOrderEmail(orderData, VALID_SERVER_KEY, TESTING_MODE) {
    const { 
        orderNumber, 
        userDetails, 
        websiteProducts, 
        pwaOrders, 
        totals,
        paypalCaptureID 
    } = orderData;

    try {
        console.log(`📧 Preparing emails for order #${orderNumber}`);

        const emailTemplates = generateEmailTemplates(
            orderNumber,
            userDetails,
            websiteProducts,
            pwaOrders,
            totals,
            paypalCaptureID,
            TESTING_MODE
        );

        const pdfAttachments = pwaOrders
            .filter(order => order.pdfDataUrl)
            .map(order => {
                const base64Data = order.pdfDataUrl.split(',')[1];
                return {
                    name: `Custom-Hose-Assembly-${order.cartId || 'order'}.pdf`,
                    contentBytes: base64Data
                };
            });

        let baseUrl;

        // Detect the correct base URL
        if (typeof window !== 'undefined') {
            baseUrl = window.location.origin;
        } else {
            if (TESTING_MODE) {
                baseUrl = process.env.VERCEL_URL 
                    ? `https://${process.env.VERCEL_URL}` 
                    : (process.env.API_BASE_URL_TEST || 'http://localhost:3001');
            } else {
                baseUrl = process.env.API_BASE_URL || 
                          process.env.NEXT_PUBLIC_API_BASE_URL ||
                          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');
            }
        }
        
        baseUrl = baseUrl.replace(/\/$/, '');
        
        console.log('🔍 Resolved base URL:', baseUrl);
        console.log('🔍 Email endpoint will be:', `${baseUrl}/api/send-email`);
        console.log(`🔍 Server key exists: ${!!VALID_SERVER_KEY}`);

        const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
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
                testingMode: TESTING_MODE
            }),
            signal: AbortSignal.timeout(30000)
        });

        console.log(`📧 Email API response status: ${emailResponse.status}`);
        const contentType = emailResponse.headers.get('content-type') || '';
        console.log(`📧 Email API content-type: ${contentType}`);

        // Check if response is HTML (indicates 404 or server error)
        if (contentType.includes('text/html')) {
            const htmlResponse = await emailResponse.text();
            console.error('❌ Email API returned HTML instead of JSON (first 500 chars):');
            console.error(htmlResponse.substring(0, 500));
            throw new Error(`Email endpoint returned HTML (status ${emailResponse.status}) - endpoint may not exist or has server error`);
        }

        // Check if response is not JSON
        if (!contentType.includes('application/json')) {
            const responseText = await emailResponse.text();
            console.error(`❌ Email API returned unexpected content-type: ${contentType}`);
            console.error('Response preview:', responseText.substring(0, 500));
            throw new Error(`Email API returned non-JSON response. Content-Type: ${contentType}`);
        }

        // Check response status BEFORE parsing JSON
        if (!emailResponse.ok) {
            let errorMessage;
            try {
                const errorData = await emailResponse.json();
                errorMessage = errorData.error || errorData.message || 'Email service returned error';
                console.error('❌ Email API error response:', errorData);
            } catch (parseError) {
                const errorText = await emailResponse.text();
                errorMessage = `HTTP ${emailResponse.status}: ${errorText.substring(0, 200)}`;
                console.error('❌ Failed to parse error response:', errorText.substring(0, 200));
            }
            throw new Error(errorMessage);
        }

        // NOW it's safe to parse JSON
        const emailResult = await emailResponse.json();

        console.log(`✅ Emails sent successfully for order #${orderNumber}`);
        return { success: true, ...emailResult };

    } catch (error) {
        console.error('❌ Failed to send emails:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
        return { success: false, error: error.message };
    }
}

// --- Helper: Generate Email Templates ---
function generateEmailTemplates(orderNumber, userDetails, websiteProducts, pwaOrders, totals, paypalCaptureID, TESTING_MODE) {
    const currentDate = new Date().toLocaleDateString('en-AU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const businessEmailDisplay = TESTING_MODE 
        ? process.env.BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au'
        : process.env.BUSINESS_EMAIL;

    // Customer Email Template
    const customerEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="background-color: #e74c3c; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Thank You for Your Order!</h1>
                </div>
                <div style="padding: 30px 20px;">
                    <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                        Hi ${userDetails.firstName} ${userDetails.lastName},
                    </p>
                    <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                        We've received your order and will begin processing it right away. Here are your order details:
                    </p>
                    <div style="background-color: #f8f9fa; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
                        <p style="margin: 5px 0; color: #333333;"><strong>Order Number:</strong> #${orderNumber}</p>
                        <p style="margin: 5px 0; color: #333333;"><strong>Order Date:</strong> ${currentDate}</p>
                        <p style="margin: 5px 0; color: #333333;"><strong>PayPal Transaction ID:</strong> ${paypalCaptureID}</p>
                    </div>
                    ${websiteProducts.length > 0 ? `
                    <h2 style="color: #e74c3c; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
                        Website Products
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${websiteProducts.map(product => `
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                        ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; vertical-align: middle; border-radius: 4px;">` : ''}
                                        <span style="vertical-align: middle;">${product.name}</span>
                                    </td>
                                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${product.quantity}</td>
                                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">$${(product.price * product.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ` : ''}
                    ${pwaOrders.length > 0 ? `
                    <h2 style="color: #e74c3c; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
                        Custom Hose Assemblies
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Assembly</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pwaOrders.map(order => `
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                        ${order.image ? `<img src="${order.image}" alt="${order.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; vertical-align: middle; border-radius: 4px;">` : ''}
                                        <span style="vertical-align: middle;">${order.name}</span>
                                    </td>
                                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${order.quantity}</td>
                                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">$${order.totalPrice.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">
                        📎 Detailed specifications for your custom hose assemblies are attached to this email as PDF files.
                    </p>
                    ` : ''}
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #333333;">Subtotal:</td>
                                <td style="padding: 8px 0; text-align: right; color: #333333;">$${totals.subtotal.toFixed(2)}</td>
                            </tr>
                            ${totals.discount > 0 ? `
                            <tr>
                                <td style="padding: 8px 0; color: #28a745;">Discount:</td>
                                <td style="padding: 8px 0; text-align: right; color: #28a745;">-$${totals.discount.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            ${totals.shipping > 0 ? `
                            <tr>
                                <td style="padding: 8px 0; color: #333333;">Shipping:</td>
                                <td style="padding: 8px 0; text-align: right; color: #333333;">$${totals.shipping.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 8px 0; color: #333333;">GST (10%):</td>
                                <td style="padding: 8px 0; text-align: right; color: #333333;">$${totals.gst.toFixed(2)}</td>
                            </tr>
                            <tr style="border-top: 2px solid #dee2e6;">
                                <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #e74c3c;">Total:</td>
                                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #e74c3c;">$${totals.total.toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
                    <div style="margin-top: 30px;">
                        <h3 style="color: #e74c3c; font-size: 18px; margin-bottom: 10px;">Shipping Address</h3>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <p style="margin: 5px 0; color: #333333;">${userDetails.firstName} ${userDetails.lastName}</p>
                            ${userDetails.companyName ? `<p style="margin: 5px 0; color: #333333;">${userDetails.companyName}</p>` : ''}
                            <p style="margin: 5px 0; color: #333333;">${userDetails.address}</p>
                            <p style="margin: 5px 0; color: #333333;">${userDetails.city}, ${userDetails.state} ${userDetails.postcode}</p>
                            <p style="margin: 5px 0; color: #333333;">${userDetails.country}</p>
                        </div>
                    </div>
                    <div style="margin-top: 30px; padding: 20px; background-color: #e8f4f8; border-radius: 8px;">
                        <h3 style="color: #e74c3c; font-size: 18px; margin-top: 0;">What's Next?</h3>
                        <ul style="color: #333333; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                            <li>We'll prepare your order for shipment</li>
                            <li>You'll receive a tracking number once shipped</li>
                            <li>Contact us if you have any questions</li>
                        </ul>
                    </div>
                    <div style="margin-top: 30px; text-align: center; color: #666666; font-size: 14px;">
                        <p>Questions about your order?</p>
                        <p style="color: #e74c3c; font-weight: bold;">${businessEmailDisplay}</p>
                    </div>
                </div>
                <div style="background-color: #333333; color: #ffffff; padding: 20px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} FluidPower Group. All rights reserved.</p>
                    ${TESTING_MODE ? '<p style="margin: 10px 0 0 0; color: #ffc107;">⚠️ TEST MODE - This is a test order</p>' : ''}
                </div>
            </div>
        </body>
        </html>
    `;

    // Business Email Template (simplified for brevity - keep your full version)
    const businessEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>New Order Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif;">
            <h1>New Order: #${orderNumber}</h1>
            <p>Customer: ${userDetails.firstName} ${userDetails.lastName}</p>
            <p>Email: ${userDetails.email}</p>
            <p>Total: $${totals.total.toFixed(2)}</p>
            ${TESTING_MODE ? '<p style="color: #ffc107;">⚠️ TEST MODE</p>' : ''}
        </body>
        </html>
    `;

    return {
        customerEmailContent,
        businessEmailContent
    };
}

// ========================================
// MAIN API HANDLER
// ========================================
export default async function handler(req, res) {
    const origin = req.headers.origin;

    console.log('📍 Request origin:', origin);
    console.log('📍 Request method:', req.method);

    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://fluidpowergroup.com.au',
        'https://www.fluidpowergroup.com.au',
    ];

    if (origin && origin.includes('.vercel.app')) {
        allowedOrigins.push(origin);
    }

    const isAllowed = allowedOrigins.includes(origin);

    if (isAllowed && origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-server-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') { 
        res.setHeader('Allow', ['POST', 'OPTIONS']); 
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` }); 
    }

    // Initialize Swell
    swell.init(process.env.SWELL_STORE_ID, process.env.SWELL_SECRET_KEY);

    // PayPal credentials configuration
    const isVercelPreview = process.env.VERCEL_ENV === 'preview';
    let PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE;

    if (TESTING_MODE) {
        const useTestSandbox = process.env.TEST_USE_SANDBOX !== 'false';
        PAYPAL_CLIENT_ID = useTestSandbox ? process.env.SANDBOX_CLIENT_ID_TEST : process.env.PRODUCTION_CLIENT_ID_TEST;
        PAYPAL_CLIENT_SECRET = useTestSandbox ? process.env.SANDBOX_SECRET_TEST : process.env.PRODUCTION_SECRET_TEST;
        PAYPAL_API_BASE = useTestSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    } else {
        const forceSandbox = process.env.PAYPAL_MODE === 'sandbox';
        const forceProduction = process.env.PAYPAL_MODE === 'production';
        const USE_SANDBOX = forceProduction ? false : (forceSandbox || isVercelPreview || process.env.NODE_ENV !== 'production');
        PAYPAL_CLIENT_ID = USE_SANDBOX ? process.env.SANDBOX_CLIENT_ID : process.env.PRODUCTION_CLIENT_ID;
        PAYPAL_CLIENT_SECRET = USE_SANDBOX ? process.env.SANDBOX_SECRET : process.env.PRODUCTION_SECRET;
        PAYPAL_API_BASE = USE_SANDBOX ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.error(`❌ Missing PayPal credentials`);
        return res.status(500).json({ 
            success: false, 
            error: 'PayPal configuration error'
        });
    }

    console.log('=== PAYPAL CREDENTIAL DEBUG ===');
    console.log('TESTING_MODE:', TESTING_MODE);
    console.log('PAYPAL_API_BASE:', PAYPAL_API_BASE);
    console.log('PAYPAL_CLIENT_ID (first 10 chars):', PAYPAL_CLIENT_ID?.substring(0, 10));
    console.log('Using SANDBOX?', PAYPAL_API_BASE.includes('sandbox'));
    console.log('================================');

    const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY;

    console.log("📥 Received capture-order request");
    if (TESTING_MODE) console.log("🧪 Running in TESTING MODE");

    // Extract order data
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
        console.error("❌ Missing PayPal orderID");
        return res.status(400).json({ success: false, error: 'Missing required PayPal orderID.' });
    }

    try {
        // ============================================================================
        // STEP 1: Check for duplicate processing (Idempotency)
        // ============================================================================
        
        if (isPayPalOrderProcessed(orderID)) {
            const existingOrder = processedPayPalOrders.get(orderID);
            console.warn(`⚠️ PayPal order ${orderID} already processed as ${existingOrder.internalOrderNumber}`);
            
            return res.status(200).json({
                success: true,
                message: 'Order already processed',
                duplicate: true,
                orderNumber: existingOrder.internalOrderNumber,
                paypalOrderID: orderID
            });
        }

        // ============================================================================
        // STEP 2: Initialize order status tracking
        // ============================================================================
        
        console.log(`📊 Initializing order status for ${orderNumber}`);
        setOrderStatus(orderNumber, 'pending', {
            paypalOrderID: orderID,
            payerID: payerID,
            createdAt: new Date().toISOString()
        });

        // ============================================================================
        // STEP 3: Capture payment from PayPal
        // ============================================================================
        
        console.log(`💳 Capturing PayPal order: ${orderID}`);
        const accessToken = await getPayPalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE);
        
        const captureUrl = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`;
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

        // Handle capture response
        if (!captureResponse.ok) {
            console.error(`❌ PayPal capture failed: ${captureResponse.status}`, captureData);
            
            const errorMessage = captureData?.details?.[0]?.description || 
                                captureData?.message || 
                                captureData?.error_text || 
                                'Payment capture failed.';
            
            // Handle already captured orders
            if (captureData.name === 'ORDER_ALREADY_CAPTURED' || 
                (captureData?.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED')) {
                console.warn(`⚠️ Order ${orderID} already captured`);
                
                markPayPalOrderProcessed(orderID, orderNumber);
                
                return res.status(200).json({ 
                    success: true, 
                    message: 'Order already captured', 
                    paypalStatus: 'COMPLETED', 
                    duplicate: true
                });
            }
            
            // Update order status to failed
            setOrderStatus(orderNumber, 'failed', {
                error: errorMessage,
                paypalStatus: captureResponse.status
            });
            
            return res.status(captureResponse.status >= 500 ? 502 : 400).json({ 
                success: false, 
                error: errorMessage 
            });
        }

        console.log(`✅ PayPal order captured: ${orderID}`);

        // Extract capture details
        let finalCaptureStatus = captureData.status;
        let captureId = null;

        if (captureData.purchase_units?.[0]?.payments?.captures?.[0]) {
            finalCaptureStatus = captureData.purchase_units[0].payments.captures[0].status;
            captureId = captureData.purchase_units[0].payments.captures[0].id;
            console.log(`📋 Capture ID: ${captureId}, Status: ${finalCaptureStatus}`);
        }

        // Verify capture status
        if (finalCaptureStatus !== 'COMPLETED' && finalCaptureStatus !== 'PENDING') {
            console.warn(`⚠️ Unexpected capture status: ${finalCaptureStatus}`);
            setOrderStatus(orderNumber, 'failed', {
                error: `Payment status is ${finalCaptureStatus}`,
                paypalCaptureStatus: finalCaptureStatus
            });
            
            return res.status(400).json({ 
                success: false, 
                error: `Payment status is ${finalCaptureStatus}` 
            });
        }

        // ============================================================================
        // STEP 4: Mark order as processed (prevent duplicates)
        // ============================================================================
        
        markPayPalOrderProcessed(orderID, orderNumber);

        // ============================================================================
        // STEP 5: Process order SYNCHRONOUSLY (before sending response)
        // ============================================================================
        console.log('⚡ PROCESSING ORDER SYNCHRONOUSLY (before response)');

        try {
            // Step 5a: Update inventory (if applicable)
            let inventoryResult = { success: true };
            if (websiteProducts && websiteProducts.length > 0) {
                console.log(`📦 Updating inventory for ${websiteProducts.length} products...`);
                inventoryResult = await updateSwellInventory(
                    websiteProducts, 
                    captureId
                );
                console.log(`✅ Inventory update result:`, inventoryResult.success);
                updateOrderStatus(orderNumber, { 
                    inventoryUpdated: inventoryResult.success 
                });
            }

            // Step 5b: Send emails SYNCHRONOUSLY (WAIT for them to complete)
            console.log(`📧 STARTING EMAIL SEND (synchronous)...`);
            console.log(`📧 Sending to customer: ${userDetails.email}`);
            console.log(`📧 Sending to business: ${TESTING_MODE ? process.env.BUSINESS_EMAIL_TEST : process.env.BUSINESS_EMAIL}`);
            
            const emailResult = await sendOrderEmail(
                {
                    orderNumber,
                    orderID,
                    paypalCaptureID: captureId,
                    userDetails,
                    websiteProducts,
                    pwaOrders,
                    totals
                },
                VALID_SERVER_KEY,
                TESTING_MODE
            );
            
            console.log(`📧 EMAIL SEND RESULT:`, emailResult.success ? '✅ SUCCESS' : '❌ FAILED');
            if (!emailResult.success) {
                console.error(`📧 EMAIL ERROR DETAILS:`, emailResult.error);
            }
            
            updateOrderStatus(orderNumber, { 
                emailsSent: emailResult.success 
            });

            // Step 5c: Mark as completed
            const allSuccessful = inventoryResult.success && emailResult.success;
            
            if (allSuccessful) {
                console.log(`✅ Order ${orderNumber} completed successfully (inventory + emails)`);
                setOrderStatus(orderNumber, 'completed', {
                    inventoryUpdated: true,
                    emailsSent: true,
                    completedAt: new Date().toISOString()
                });
            } else {
                console.warn(`⚠️ Order ${orderNumber} completed with warnings`);
                setOrderStatus(orderNumber, 'completed', {
                    inventoryUpdated: inventoryResult.success,
                    emailsSent: emailResult.success,
                    warnings: [
                        !inventoryResult.success && 'Inventory update failed',
                        !emailResult.success && 'Email sending failed'
                    ].filter(Boolean),
                    completedAt: new Date().toISOString()
                });
            }

        } catch (processingError) {
            console.error(`❌ CRITICAL ERROR processing order ${orderNumber}:`, processingError);
            console.error(`❌ Error stack:`, processingError.stack);
            setOrderStatus(orderNumber, 'failed', {
                error: processingError.message,
                failedAt: new Date().toISOString()
            });
            // Don't throw - still return success to customer since payment was captured
        }

        // ============================================================================
        // STEP 6: Return response (AFTER emails sent)
        // ============================================================================
        console.log(`✅ Returning success response for ${orderNumber}`);
        return res.status(200).json({
            success: true,
            message: 'Payment captured and order processed successfully.',
            paypalOrderStatus: captureData.status,
            paypalCaptureStatus: finalCaptureStatus,
            paypalCaptureID: captureId,
            orderNumber: orderNumber
        });

    } catch (error) {
        console.error(`❌ Unhandled error for order ${orderID}:`, error);
        
        // Update order status
        if (orderNumber) {
            setOrderStatus(orderNumber, 'failed', {
                error: error.message,
                failedAt: new Date().toISOString()
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};