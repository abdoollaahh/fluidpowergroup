// pages/api/paypal/capture-order.js - BLOB + QSTASH VERSION
// This version captures payment + updates inventory, uploads PDFs to Vercel Blob, then uses QStash
// ✅ Works within Vercel Hobby plan 10-second timeout limit
// ✅ No message size limits - PDFs stored in Blob

import fetch from 'node-fetch';
import swell from 'swell-node';
import { put } from '@vercel/blob';
import { setOrderStatus, getOrderStatus, updateOrderStatus } from './order-status.js';
import { pushToQStash, generateEmailTemplates } from '../../../lib/qstash-helper';

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

// --- Helper: Upload PDFs to Vercel Blob ---
async function uploadPDFsToBlob(pwaOrders, orderNumber) {
    const blobUrls = [];
    
    for (let i = 0; i < pwaOrders.length; i++) {
        const order = pwaOrders[i];
        
        if (!order.pdfDataUrl) continue;
        
        try {
            // Extract base64 data and convert to Buffer
            const base64Data = order.pdfDataUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Generate unique filename
            const filename = `orders/${orderNumber}/assembly-${order.cartId || i}.pdf`;
            
            console.log(`📤 Uploading PDF to Blob: ${filename} (${(buffer.length / 1024).toFixed(2)}KB)`);
            
            // Upload to Vercel Blob with 1 hour expiration
            const blob = await put(filename, buffer, {
                access: 'public',
                addRandomSuffix: true,
                contentType: 'application/pdf',
            });
            
            console.log(`✅ PDF uploaded: ${blob.url}`);
            
            blobUrls.push({
                url: blob.url,
                name: `Custom-Hose-Assembly-${order.cartId || 'order'}.pdf`,
                cartId: order.cartId
            });
            
        } catch (error) {
            console.error(`❌ Failed to upload PDF for order ${order.cartId}:`, error);
            // Continue with other PDFs - don't fail entire order
        }
    }
    
    return blobUrls;
}

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
        // STEP 6: Upload PDFs to Vercel Blob (if any)
        // ============================================================================
        
        let blobUrls = [];
        if (pwaOrders && pwaOrders.length > 0 && pwaOrders.some(o => o.pdfDataUrl)) {
            console.log(`📤 Uploading ${pwaOrders.filter(o => o.pdfDataUrl).length} PDF(s) to Vercel Blob...`);
            blobUrls = await uploadPDFsToBlob(pwaOrders, orderNumber);
            console.log(`✅ Uploaded ${blobUrls.length} PDF(s) to Blob`);
        }

        // ============================================================================
        // STEP 7: Push to QStash for background email processing
        // ============================================================================
        
        console.log(`📧 Preparing order ${orderNumber} for QStash...`);
        
        // ✅ Generate email templates BEFORE creating payload
        console.log('📧 Generating email templates...');
        const emailTemplates = generateEmailTemplates(
            orderNumber,
            userDetails,
            websiteProducts,
            pwaOrders,
            totals,
            captureId,
            TESTING_MODE
        );
        
        console.log('✅ Email templates generated:', {
            hasCustomerEmail: !!emailTemplates.customerEmailContent,
            hasBusinessEmail: !!emailTemplates.businessEmailContent,
            customerLength: emailTemplates.customerEmailContent?.length || 0,
            businessLength: emailTemplates.businessEmailContent?.length || 0
        });
        
        // Prepare email data WITHOUT PDF base64 data (use Blob URLs instead)
        const emailData = {
            orderNumber,
            paypalCaptureID: captureId,
            userDetails,
            websiteProducts,
            pwaOrders: pwaOrders.map(order => ({
                ...order,
                pdfDataUrl: undefined // Remove large base64 data
            })),
            blobUrls, // Include Blob URLs instead
            totals,
            testingMode: TESTING_MODE,
            emailTemplates: emailTemplates // ✅ NOW INCLUDED!
        };

        // Check payload size
        const payloadSize = JSON.stringify(emailData).length;
        const sizeMB = (payloadSize / 1024 / 1024).toFixed(2);
        console.log(`📊 Email payload size: ${sizeMB}MB (with Blob URLs)`);

        // Determine callback URL
        const callbackUrl = (() => {
            // Priority 1: Use VERCEL_URL (works for both test and production deployments)
            if (process.env.VERCEL_URL) {
                return `https://${process.env.VERCEL_URL}/api/send-email`;
            }
            
            // Priority 2: Use explicit API_BASE_URL if set (for manual overrides)
            if (process.env.API_BASE_URL) {
                return `${process.env.API_BASE_URL}/api/send-email`;
            }
            
            // Priority 3: Fallback based on mode
            if (TESTING_MODE) {
                return process.env.API_BASE_URL_TEST 
                    ? `${process.env.API_BASE_URL_TEST}/api/send-email`
                    : 'http://localhost:3001/api/send-email';
            }
            
            // Priority 4: Production domain fallback (when nothing else is set)
            return 'https://fluidpowergroup.com.au/api/send-email';
        })();
        
        console.log(`🔍 QStash will call: ${callbackUrl}`);
        console.log(`📍 Deployment: ${process.env.VERCEL_URL || 'local/custom'}`);
        console.log('🔍 DEBUG Environment Variables:');
        console.log('   VERCEL_URL:', process.env.VERCEL_URL || 'UNDEFINED');
        console.log('   VERCEL_ENV:', process.env.VERCEL_ENV || 'UNDEFINED');
        console.log('   API_BASE_URL:', process.env.API_BASE_URL ? 'SET' : 'UNDEFINED');
        console.log('   API_BASE_URL_TEST:', process.env.API_BASE_URL_TEST ? 'SET' : 'UNDEFINED');
        console.log(`🧪 Testing Mode: ${TESTING_MODE}`);

        // Push to QStash
        const qstashResult = await pushToQStash(emailData, callbackUrl);

        if (qstashResult.success) {
            console.log(`✅ Order ${orderNumber} email processing initiated`);
            updateOrderStatus(orderNumber, { 
                emailsQueued: true,
                qstashMessageId: qstashResult.messageId,
                blobUrls: blobUrls.length > 0 ? blobUrls.map(b => b.url) : [],
                queuedAt: new Date().toISOString()
            });
        } else {
            console.error(`❌ Failed to process order ${orderNumber} emails:`, qstashResult.error);
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
            emailsQueued: qstashResult.success,
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