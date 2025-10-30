// pages/api/paypal/capture-order.js
import fetch from 'node-fetch';
import swell from 'swell-node';

// ========================================
// TESTING MODE CONFIGURATION
// ========================================
const TESTING_MODE = process.env.TESTING_MODE === 'true';

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

            // Create stock adjustment using Swell's stock API
            const adjustment = await swell.post('/products:stock', {
                parent_id: item.id,
                quantity: -item.quantity,  // Negative to decrease
                reason: 'sold',
                reason_message: `PayPal Order ${orderId}`
            });

            console.log(`✅ Stock updated successfully!`);
            console.log(`   Previous level: ${adjustment.level + item.quantity}`);
            console.log(`   New level: ${adjustment.level}`);
            console.log(`   Adjustment ID: ${adjustment.id}`);

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
        console.log(`Preparing to send order confirmation emails for order #${orderNumber}`);

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

        // ⭐ NEW: Smart URL detection - respects TESTING_MODE
        let baseUrl;

        if (TESTING_MODE) {
            baseUrl = process.env.API_BASE_URL_TEST || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
            console.log('🧪 Using TEST API URL for emails');
        } else {
            baseUrl = process.env.API_BASE_URL || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
            console.log('🌐 Using LIVE API URL for emails');
        }

        console.log(`📧 Sending emails via: ${baseUrl}/api/send-email`);

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
                        Dear ${userDetails.firstName} ${userDetails.lastName},
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
                                        <br>
                                        
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

    // Business Email Template
    const businessEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Order Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="background-color: #2c3e50; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔔 New Order Received</h1>
                    ${TESTING_MODE ? '<p style="color: #ffc107; margin: 10px 0 0 0; font-size: 16px;">⚠️ TEST MODE</p>' : ''}
                </div>
                <div style="padding: 30px 20px;">
                    <div style="background-color: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
                        <p style="margin: 5px 0; color: #333333;"><strong>Order Number:</strong> #${orderNumber}</p>
                        <p style="margin: 5px 0; color: #333333;"><strong>Order Date:</strong> ${currentDate}</p>
                        <p style="margin: 5px 0; color: #333333;"><strong>PayPal Transaction ID:</strong> ${paypalCaptureID}</p>
                    </div>
                    <h2 style="color: #2c3e50; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        Customer Information
                    </h2>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <p style="margin: 5px 0; color: #333333;"><strong>Name:</strong> ${userDetails.firstName} ${userDetails.lastName}</p>
                        ${userDetails.companyName ? `<p style="margin: 5px 0; color: #333333;"><strong>Company:</strong> ${userDetails.companyName}</p>` : ''}
                        <p style="margin: 5px 0; color: #333333;"><strong>Email:</strong> ${userDetails.email}</p>
                        <p style="margin: 5px 0; color: #333333;"><strong>Phone:</strong> ${userDetails.phone}</p>
                        <p style="margin: 5px 0; color: #333333;"><strong>Address:</strong> ${userDetails.address}, ${userDetails.city}, ${userDetails.state} ${userDetails.postcode}, ${userDetails.country}</p>
                    </div>
                    ${websiteProducts.length > 0 ? `
                    <h2 style="color: #2c3e50; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        Website Products (${websiteProducts.length})
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #2c3e50; color: #ffffff;">
                                <th style="padding: 12px; text-align: left;">Product</th>
                                <th style="padding: 12px; text-align: center;">Qty</th>
                                <th style="padding: 12px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${websiteProducts.map(product => `
                                <tr style="border-bottom: 1px solid #dee2e6;">
                                    <td style="padding: 12px;">
                                        ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; vertical-align: middle; border-radius: 4px;">` : ''}
                                        <span style="vertical-align: middle;">${product.name}</span>
                                    </td>
                                    <td style="padding: 12px; text-align: center;">${product.quantity}</td>
                                    <td style="padding: 12px; text-align: right;">$${(product.price * product.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ` : ''}
                    ${pwaOrders.length > 0 ? `
                    <h2 style="color: #2c3e50; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        Custom Hose Assemblies (${pwaOrders.length})
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #2c3e50; color: #ffffff;">
                                <th style="padding: 12px; text-align: left;">Assembly Details</th>
                                <th style="padding: 12px; text-align: center;">Qty</th>
                                <th style="padding: 12px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pwaOrders.map(order => `
                                <tr style="border-bottom: 1px solid #dee2e6;">
                                    <td style="padding: 12px;">
                                        ${order.image ? `<img src="${order.image}" alt="${order.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; vertical-align: middle; border-radius: 4px;">` : ''}
                                        <div style="display: inline-block; vertical-align: middle;">
                                            <strong>${order.name}</strong><br>
                                            <small style="color: #666;">PWA Order ID: ${order.pwaOrderNumber || `PWA-${order.cartId}` || 'N/A'}</small>
                                        </div>
                                    </td>
                                    <td style="padding: 12px; text-align: center;">${order.quantity}</td>
                                    <td style="padding: 12px; text-align: right;">$${order.totalPrice.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0;">
                        <p style="margin: 0; color: #856404;">
                            📎 <strong>Detailed specifications attached as PDF(s)</strong><br>
                            Review the attached PDF files for complete assembly specifications.
                        </p>
                    </div>
                    ` : ''}
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Order Summary</h3>
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
                                <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #2c3e50;">Total:</td>
                                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #2c3e50;">$${totals.total.toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
                    <div style="margin-top: 30px; padding: 20px; background-color: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                        <h3 style="color: #155724; margin-top: 0;">📋 Action Items</h3>
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

// ========================================
// MAIN API HANDLER
// ========================================
export default async function handler(req, res) {
    // ENHANCED CORS HANDLING
// ========================================
    const origin = req.headers.origin;

    console.log('📍 Request origin:', origin);
    console.log('📍 Request method:', req.method);

    // Allowed origins
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://fluidpowergroup.com.au',
        'https://www.fluidpowergroup.com.au',
    ];

    // Add all Vercel preview URLs
    if (origin && origin.includes('.vercel.app')) {
        allowedOrigins.push(origin);
    }

    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes(origin);

    // Set CORS headers
    if (isAllowed && origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        console.log('✅ CORS: Allowed origin:', origin);
    } else if (!origin) {
        // No origin = same-origin or direct API call
        res.setHeader('Access-Control-Allow-Origin', '*');
        console.log('✅ CORS: No origin header (allowing all)');
    } else {
        // Fallback - allow it anyway for development
        res.setHeader('Access-Control-Allow-Origin', origin);
        console.warn('⚠️ CORS: Origin not in allowlist but allowing:', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-server-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        console.log('✅ CORS preflight handled successfully');
        return res.status(200).end();
    }

    // Only allow POST after preflight
    if (req.method !== 'POST') { 
        res.setHeader('Allow', ['POST', 'OPTIONS']); 
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` }); 
    }

    // Initialize Swell
    swell.init(process.env.SWELL_STORE_ID, process.env.SWELL_SECRET_KEY);

    // Environment determination
    const isVercelPreview = process.env.VERCEL_ENV === 'preview';

    // 🔧 DUAL CREDENTIAL SYSTEM
    // If TESTING_MODE=true, use separate _TEST credentials (your test PayPal account)
    // If TESTING_MODE=false, use regular credentials (live website's PayPal account)

    let PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE;

    if (TESTING_MODE) {
        // ========================================
        // TESTING MODE: Use separate test credentials
        // ========================================
        console.log('🧪 TESTING MODE: Using dedicated test credentials');
        
        // For testing, you can choose sandbox or production test account
        const useTestSandbox = process.env.TEST_USE_SANDBOX !== 'false'; // Default to sandbox for testing
        
        PAYPAL_CLIENT_ID = useTestSandbox 
            ? process.env.SANDBOX_CLIENT_ID_TEST 
            : process.env.PRODUCTION_CLIENT_ID_TEST;
            
        PAYPAL_CLIENT_SECRET = useTestSandbox 
            ? process.env.SANDBOX_SECRET_TEST 
            : process.env.PRODUCTION_SECRET_TEST;
            
        PAYPAL_API_BASE = useTestSandbox
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
            
        console.log(`   Using TEST ${useTestSandbox ? 'SANDBOX' : 'PRODUCTION'} credentials`);
        
    } else {
        // ========================================
        // LIVE MODE: Use regular website credentials
        // ========================================
        console.log('🌐 LIVE MODE: Using website credentials');
        
        const forceSandbox = process.env.PAYPAL_MODE === 'sandbox';
        const forceProduction = process.env.PAYPAL_MODE === 'production';
        const USE_SANDBOX = forceProduction ? false : (forceSandbox || isVercelPreview || process.env.NODE_ENV !== 'production');
        
        PAYPAL_CLIENT_ID = USE_SANDBOX 
            ? process.env.SANDBOX_CLIENT_ID 
            : process.env.PRODUCTION_CLIENT_ID;
            
        PAYPAL_CLIENT_SECRET = USE_SANDBOX 
            ? process.env.SANDBOX_SECRET 
            : process.env.PRODUCTION_SECRET;
            
        PAYPAL_API_BASE = USE_SANDBOX
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
            
        console.log(`   Using LIVE ${USE_SANDBOX ? 'SANDBOX' : 'PRODUCTION'} credentials`);
    }

    // 🔧 CREDENTIAL DEBUG (runs for BOTH testing and live mode)
    console.log('=== CREDENTIAL DEBUG ===');
    console.log('TESTING_MODE:', TESTING_MODE);
    console.log('CLIENT_ID value:', PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : 'UNDEFINED');
    console.log('CLIENT_SECRET value:', PAYPAL_CLIENT_SECRET ? `${PAYPAL_CLIENT_SECRET.substring(0, 5)}...` : 'UNDEFINED');
    console.log('API_BASE:', PAYPAL_API_BASE);
    console.log('========================');

    // Validation check (runs for BOTH modes)
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        const missingVar = TESTING_MODE 
            ? 'SANDBOX_CLIENT_ID_TEST or SANDBOX_SECRET_TEST'
            : 'SANDBOX_CLIENT_ID or SANDBOX_SECRET';
        
        console.error(`❌ CRITICAL: Missing PayPal credentials: ${missingVar}`);
        
        return res.status(500).json({ 
            success: false, 
            error: 'PayPal configuration error. Please contact support.',
            debug: TESTING_MODE ? 'Missing TEST credentials' : 'Missing LIVE credentials'
        });
    }

    console.log('✅ PayPal credentials loaded successfully');

    const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY;

    // Additional debug info
    console.log('SWELL init: storeId present?', !!process.env.SWELL_STORE_ID);
    console.log('SWELL init: secret present?', !!process.env.SWELL_SECRET_KEY);
    console.log("Received request to /api/paypal/capture-order");

    if (TESTING_MODE) {
        console.log('🧪 TESTING MODE ENABLED - Using test credentials');
    }

    console.log('SWELL init: storeId present?', !!process.env.SWELL_STORE_ID);
    console.log('SWELL init: secret present?', !!process.env.SWELL_SECRET_KEY);

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
        const accessToken = await getPayPalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE);
        console.log("Obtained PayPal Access Token for capture.");

        const captureUrl = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`;

        // Call PayPal Capture API
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

        // Handle Capture Response
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

        // STEP 2: Update Swell Inventory
        let inventoryResult = { success: true, message: 'No inventory to update' };
        
        if (websiteProducts.length > 0) {
            console.log(`Updating inventory for ${websiteProducts.length} website product(s)...`);
            try {
                inventoryResult = await updateSwellInventory(websiteProducts, captureId);
                
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

        // STEP 3: Send Order Confirmation Emails
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
            }, VALID_SERVER_KEY, TESTING_MODE);

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

        // Final Response
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

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};