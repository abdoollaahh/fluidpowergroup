// pages/api/paypal/capture-order.js - QSTASH VERSION
// This version captures payment + updates inventory, then pushes to QStash for background email processing
// ✅ Works within Vercel Hobby plan 10-second timeout limit
// ✅ No cron jobs needed - QStash handles background processing

import fetch from 'node-fetch';
import swell from 'swell-node';
import { setOrderStatus, getOrderStatus, updateOrderStatus } from './order-status.js';
import { pushToQStash, prepareEmailData } from '../../../lib/qstash-helper.js';

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
        // STEP 5: Update inventory (SYNCHRONOUS - must complete before response)
        // ============================================================================
        
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

        // ============================================================================
        // STEP 6: Push to QStash for background email processing
        // ============================================================================
        
        console.log(`📧 Preparing order ${orderNumber} for QStash...`);
        
        // Prepare email data
        const emailData = prepareEmailData({
            orderNumber,
            orderID,
            paypalCaptureID: captureId,
            userDetails,
            websiteProducts,
            pwaOrders,
            totals,
            testingMode: TESTING_MODE
        });

        // Determine callback URL (your send-email endpoint)
        let callbackUrl;
        if (TESTING_MODE) {
            callbackUrl = process.env.VERCEL_URL 
                ? `https://${process.env.VERCEL_URL}/api/send-email`
                : (process.env.API_BASE_URL_TEST || 'http://localhost:3001') + '/api/send-email';
        } else {
            const baseUrl = process.env.API_BASE_URL || 
                          process.env.NEXT_PUBLIC_API_BASE_URL ||
                          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');
            callbackUrl = `${baseUrl}/api/send-email`;
        }

        console.log(`🔍 QStash will call: ${callbackUrl}`);

        // Push to QStash
        const qstashResult = await pushToQStash(emailData, callbackUrl);

        if (qstashResult.success) {
            console.log(`✅ Order ${orderNumber} pushed to QStash successfully`);
            updateOrderStatus(orderNumber, { 
                emailsQueued: true,
                qstashMessageId: qstashResult.messageId,
                queuedAt: new Date().toISOString()
            });
        } else {
            console.error(`❌ Failed to push order ${orderNumber} to QStash:`, qstashResult.error);
            updateOrderStatus(orderNumber, { 
                emailsQueued: false,
                qstashError: qstashResult.error
            });
        }

        // ============================================================================
        // STEP 7: Mark as completed and return response (FAST - under 5 seconds)
        // ============================================================================
        
        console.log(`✅ Order ${orderNumber} processed successfully (payment + inventory)`);
        setOrderStatus(orderNumber, 'processing', {
            paymentCaptured: true,
            inventoryUpdated: inventoryResult.success,
            emailsQueued: queueSuccess,
            completedAt: new Date().toISOString()
        });

        console.log(`✅ Returning success response for ${orderNumber}`);
        return res.status(200).json({
            success: true,
            message: 'Payment captured and order queued for email processing via QStash.',
            paypalOrderStatus: captureData.status,
            paypalCaptureStatus: finalCaptureStatus,
            paypalCaptureID: captureId,
            orderNumber: orderNumber,
            emailsQueued: qstashResult.success
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