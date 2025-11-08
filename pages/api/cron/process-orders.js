// pages/api/cron/process-orders.js
// Vercel Cron Job - Processes queued orders and sends emails
// Runs every 1 minute via vercel.json configuration

import { getNextBatch, markAsProcessing, isProcessing, clearProcessing, requeueOrder, getQueueStats } from '../../../lib/order-queue.js';
import fetch from 'node-fetch';

// ========================================
// TESTING MODE CONFIGURATION
// ========================================
const TESTING_MODE = process.env.TESTING_MODE === 'true';

// ========================================
// ENVIRONMENT VARIABLES
// ========================================
const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY;
const CRON_SECRET = process.env.CRON_SECRET; // Secret to secure the cron endpoint

// ========================================
// EMAIL SENDING FUNCTION
// ========================================
async function sendOrderEmail(orderData) {
    const { 
        orderNumber, 
        userDetails, 
        websiteProducts, 
        pwaOrders, 
        totals,
        paypalCaptureID,
        testingMode
    } = orderData;

    try {
        console.log(`📧 [CRON] Preparing emails for order #${orderNumber}`);

        // Import email template generator (reusing your existing logic)
        const emailTemplates = generateEmailTemplates(
            orderNumber,
            userDetails,
            websiteProducts,
            pwaOrders,
            totals,
            paypalCaptureID,
            testingMode || TESTING_MODE
        );

        // Prepare PDF attachments if any
        const pdfAttachments = pwaOrders
            .filter(order => order.pdfDataUrl)
            .map(order => {
                const base64Data = order.pdfDataUrl.split(',')[1];
                return {
                    name: `Custom-Hose-Assembly-${order.cartId || 'order'}.pdf`,
                    contentBytes: base64Data
                };
            });

        // Determine base URL
        let baseUrl;
        if (testingMode || TESTING_MODE) {
            baseUrl = process.env.VERCEL_URL 
                ? `https://${process.env.VERCEL_URL}` 
                : (process.env.API_BASE_URL_TEST || 'http://localhost:3001');
        } else {
            baseUrl = process.env.API_BASE_URL || 
                      process.env.NEXT_PUBLIC_API_BASE_URL ||
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');
        }
        
        baseUrl = baseUrl.replace(/\/$/, '');
        
        console.log(`🔍 [CRON] Resolved base URL: ${baseUrl}`);

        // Call your existing send-email API
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
                testingMode: testingMode || TESTING_MODE
            }),
            signal: AbortSignal.timeout(50000) // 50 seconds timeout (generous for cron)
        });

        const contentType = emailResponse.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
            throw new Error(`Email API returned non-JSON response. Content-Type: ${contentType}`);
        }

        if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            throw new Error(errorData.error || 'Email service returned error');
        }

        const emailResult = await emailResponse.json();
        console.log(`✅ [CRON] Emails sent successfully for order #${orderNumber}`);
        
        return { success: true, ...emailResult };

    } catch (error) {
        console.error(`❌ [CRON] Failed to send emails for order ${orderNumber}:`, error.message);
        return { success: false, error: error.message };
    }
}

// ========================================
// EMAIL TEMPLATE GENERATOR (Copy from capture-order.js)
// ========================================
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
// MAIN CRON HANDLER
// ========================================
export default async function handler(req, res) {
    // Security: Verify cron secret
    const authHeader = req.headers.authorization;
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
        console.error('❌ [CRON] Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only allow GET requests (Vercel cron uses GET)
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔄 [CRON] Starting order email processing job...');

        // Get queue stats
        const stats = await getQueueStats();
        console.log(`📊 [CRON] Queue stats: ${stats.pending} pending, ${stats.failed} failed`);

        if (stats.pending === 0) {
            console.log('✅ [CRON] No orders in queue, job complete');
            return res.status(200).json({
                success: true,
                message: 'No orders to process',
                stats
            });
        }

        // Process batch of orders (max 5 per cron run to stay within time limits)
        const orders = await getNextBatch(5);
        console.log(`📦 [CRON] Processing ${orders.length} order(s)`);

        const results = [];

        for (const order of orders) {
            try {
                // Skip if already being processed
                if (await isProcessing(order.id)) {
                    console.log(`⏭️ [CRON] Order ${order.orderNumber} already being processed, skipping`);
                    continue;
                }

                // Mark as processing
                await markAsProcessing(order.id);

                console.log(`📧 [CRON] Processing order: ${order.orderNumber} (attempt ${order.retries + 1})`);

                // Send emails
                const emailResult = await sendOrderEmail(order);

                if (emailResult.success) {
                    console.log(`✅ [CRON] Order ${order.orderNumber} processed successfully`);
                    results.push({
                        orderNumber: order.orderNumber,
                        success: true
                    });
                } else {
                    console.error(`❌ [CRON] Order ${order.orderNumber} failed:`, emailResult.error);
                    
                    // Re-queue for retry
                    await requeueOrder(order);
                    
                    results.push({
                        orderNumber: order.orderNumber,
                        success: false,
                        error: emailResult.error,
                        retries: order.retries + 1
                    });
                }

                // Clear processing lock
                await clearProcessing(order.id);

            } catch (orderError) {
                console.error(`❌ [CRON] Error processing order ${order.orderNumber}:`, orderError);
                
                // Re-queue for retry
                await requeueOrder(order);
                await clearProcessing(order.id);
                
                results.push({
                    orderNumber: order.orderNumber,
                    success: false,
                    error: orderError.message,
                    retries: order.retries + 1
                });
            }
        }

        // Final stats
        const finalStats = await getQueueStats();
        
        console.log(`✅ [CRON] Job complete. Processed ${results.length} orders`);
        console.log(`📊 [CRON] Remaining in queue: ${finalStats.pending}`);

        return res.status(200).json({
            success: true,
            message: 'Cron job completed',
            processed: results.length,
            results,
            stats: finalStats
        });

    } catch (error) {
        console.error('❌ [CRON] Fatal error in cron job:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}