// pages/api/paypal/capture-order.js
import fetch from 'node-fetch';

// More precise environment determination
const isVercelPreview = process.env.VERCEL_ENV === 'preview';
const forceSandbox = process.env.PAYPAL_MODE === 'sandbox';
const forceProduction = process.env.PAYPAL_MODE === 'production';

// If PAYPAL_MODE is explicitly set, use that, otherwise use environment detection
const USE_SANDBOX = forceProduction ? false : (forceSandbox || isVercelPreview || process.env.NODE_ENV !== 'production');

const PAYPAL_CLIENT_ID = USE_SANDBOX
    ? process.env.SANDBOX_CLIENT_ID
    : process.env.PRODUCTION_CLIENT_ID;
    
const PAYPAL_CLIENT_SECRET = USE_SANDBOX
    ? process.env.SANDBOX_SECRET
    : process.env.PRODUCTION_SECRET;
    
const PAYPAL_API_BASE = USE_SANDBOX
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

// --- Helper: Get PayPal Access Token --- (Keep this)
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const url = `${PAYPAL_API_BASE}/v1/oauth2/token`;
    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded', }, body: 'grant_type=client_credentials', });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Failed to get token, status: ${response.status}`}));
            throw new Error(errorData.message || `Failed to get PayPal access token. Status: ${response.status}`);
        }
        const data = await response.json();
        return data.access_token;
    } catch (error) { console.error("Error fetching PayPal access token:", error); throw new Error('Could not obtain PayPal access token.'); }
}

// --- Main API Handler ---
export default async function handler(req, res) {
    console.log("Vercel deployment information:");
    console.log("VERCEL_ENV:", process.env.VERCEL_ENV); // 'production', 'preview', or 'development'
    console.log("VERCEL_GIT_COMMIT_REF:", process.env.VERCEL_GIT_COMMIT_REF); // The branch name
    console.log("PAYPAL_MODE:", process.env.PAYPAL_MODE);
    console.log("Calculated USE_SANDBOX:", USE_SANDBOX);
    console.log("USING CLIENT_ID starting with:", PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.substring(0, 5) + "..." : "NOT FOUND");
    console.log("USING CLIENT_SECRET exists:", !!PAYPAL_CLIENT_SECRET);
    // --- Keep Basic CORS ---
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust as needed for production
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Add x-server-key if you use server-side auth here
    if (req.method === 'OPTIONS') { return res.status(204).end(); }
    if (req.method !== 'POST') { res.setHeader('Allow', ['POST', 'OPTIONS']); return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` }); }

    console.log("Received request to /api/paypal/capture-order");
    //console.log("Full request body for capture:", JSON.stringify(req.body, null, 2)); // Log the full body

    // *** MODIFIED: Extract more details from req.body ***
    const {
        orderID,        // PayPal Order ID (from SDK onApprove)
        payerID,        // PayPal Payer ID (from SDK onApprove) <-- NEW
        orderNumber,    // Your internal order number (generated on frontend) <-- NEW
        userDetails,    // Customer details for record/email <-- NEW
        originalOrderParams // The original order details for record keeping <-- NEW
        // If you pass pdfAttachment or emailTemplates, extract them here too
    } = req.body;
    // ******************************************************

    // --- Updated Validation ---
    if (!orderID) {
        console.error("Missing PayPal orderID in request body for capture");
        return res.status(400).json({ success: false, error: 'Missing required PayPal orderID.' });
    }
    // Add warnings for other potentially missing important data
    if (!payerID) console.warn(`Warning: PayerID not received for orderID: ${orderID}`);
    if (!orderNumber) console.warn(`Warning: Internal orderNumber not received for orderID: ${orderID}`);
    if (!userDetails) console.warn(`Warning: userDetails not received for orderID: ${orderID}`);
    if (!originalOrderParams) console.warn(`Warning: originalOrderParams not received for orderID: ${orderID}`);
    // ***************************

    try {
        // *** Include payerID in log ***
        console.log(`Attempting to capture PayPal order ID: ${orderID}, Payer ID: ${payerID}`);
        const accessToken = await getPayPalAccessToken();
        console.log("Obtained PayPal Access Token for capture.");

        const captureUrl = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`;

        // --- Call PayPal Capture API ---
        const captureResponse = await fetch(captureUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', }
        });
        const captureData = await captureResponse.json().catch(async () => ({ error_text: await captureResponse.text() })); // More robust error parsing

        // --- Handle Capture Response ---
        if (!captureResponse.ok) {
            console.error(`PayPal capture failed for order ${orderID}. Status: ${captureResponse.status}`, captureData);
            const errorMessage = captureData?.details?.[0]?.description || captureData?.message || captureData?.error_text || 'Payment capture failed.';
            // Improved idempotency check
            if (captureData.name === 'ORDER_ALREADY_CAPTURED' || (captureData?.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED')) {
                 console.warn(`Order ${orderID} was already captured.`);
                 return res.status(200).json({ success: true, message: 'Order already captured.', paypalStatus: 'COMPLETED', code: 'ORDER_ALREADY_CAPTURED'});
             }
            return res.status(captureResponse.status >= 500 ? 502 : 400).json({ success: false, error: errorMessage });
        }

        console.log(`Successfully captured PayPal order ${orderID}. Overall Capture Status: ${captureData.status}`);

        // *** MODIFIED: Extract detailed capture status and ID ***
        let finalCaptureStatus = captureData.status; // Default to overall status
        let captureId = null; // This is PayPal's transaction ID for the capture

        if (captureData.purchase_units && captureData.purchase_units[0] &&
            captureData.purchase_units[0].payments && captureData.purchase_units[0].payments.captures &&
            captureData.purchase_units[0].payments.captures[0]) {
            finalCaptureStatus = captureData.purchase_units[0].payments.captures[0].status;
            captureId = captureData.purchase_units[0].payments.captures[0].id;
            console.log(`Detailed Capture Status: ${finalCaptureStatus}, Capture ID: ${captureId}`);
        } else {
            console.warn(`Could not find detailed capture info in purchase_units for orderID: ${orderID}. Using overall status.`);
        }
        // *******************************************************

        // --- Check Detailed Capture Status ---
        if (finalCaptureStatus !== 'COMPLETED' && finalCaptureStatus !== 'PENDING') { // PENDING might be for eChecks etc.
            console.warn(`PayPal order ${orderID} capture status is ${finalCaptureStatus}, not COMPLETED/PENDING.`);
            return res.status(400).json({ success: false, error: `Payment status is ${finalCaptureStatus}. Consider this as potentially failed or requiring review.` });
        }

        // --- Payment Capture Successful (or Pending) ---
        console.log(`Payment processed for order ${orderID}. Internal Order #: ${orderNumber}, Payer ID: ${payerID}, Capture ID: ${captureId}, Status: ${finalCaptureStatus}`);

        {/*// ** TODO: Save Order Details to Your Database **
        // Example of what you'd save:
        console.log("Order details ready for database:", {
            yourInternalOrderNumber: orderNumber,
            payPalOrderID: orderID,
            payPalPayerID: payerID,
            payPalCaptureID: captureId, // Very important for reconciliation/refunds
            payPalOrderStatus: captureData.status, // Overall PayPal order status
            payPalCaptureStatus: finalCaptureStatus, // Specific status of this capture
            customerDetails: userDetails,
            fullOrderDetails: originalOrderParams // Contains item specifics, original prices etc.
            // You might also save amounts confirmed by PayPal from captureData.purchase_units[0].amount
        });
        // ********************************************* */}

        // --- Respond to Frontend ---
        res.status(200).json({
            success: true,
            message: 'Order captured successfully.',
            paypalOrderStatus: captureData.status,
            paypalCaptureStatus: finalCaptureStatus,
            paypalCaptureID: captureId // Send capture ID back to frontend if needed
        });

    } catch (error) {
        console.error(`Unhandled error in /api/paypal/capture-order for orderID ${orderID}:`, error);
        res.status(500).json({ success: false, error: error.message || 'Internal server error during payment capture.' });
    }
}