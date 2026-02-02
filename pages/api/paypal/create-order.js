// pages/api/paypal/create-order.js
import fetch from 'node-fetch'; // Or built-in fetch if Node >= 18

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

// --- Helper: Get Access Token ---
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const url = `${PAYPAL_API_BASE}/v1/oauth2/token`;
    
    console.log(`Attempting to get PayPal access token from: ${url}`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Authorization': `Basic ${auth}`, 
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
            body: 'grant_type=client_credentials',
        });
        
        const responseText = await response.text();
        let data;
        
        try {
            // Try to parse as JSON
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse PayPal response as JSON:", responseText);
            throw new Error(`Non-JSON response from PayPal: ${responseText}`);
        }
        
        if (!response.ok) {
            console.error("PayPal Auth Error Response (createOrder):", data);
            throw new Error(`Failed to get PayPal access token. Status: ${response.status}, Message: ${data.error_description || data.error || 'Unknown error'}`);
        }
        
        if (!data.access_token) {
            console.error("PayPal returned success but no access token:", data);
            throw new Error('PayPal response missing access token');
        }
        
        console.log("Successfully obtained PayPal access token");
        return data.access_token;
    } catch (error) {
        console.error("Error fetching PayPal access token (createOrder):", error);
        throw new Error(`Could not obtain PayPal access token: ${error.message}`);
    }
}

// --- Main API Handler ---
export default async function handler(req, res) {
   {/*} console.log("Vercel deployment information:");
    console.log("VERCEL_ENV:", process.env.VERCEL_ENV); // 'production', 'preview', or 'development'
    console.log("VERCEL_GIT_COMMIT_REF:", process.env.VERCEL_GIT_COMMIT_REF); // The branch name
    console.log("PAYPAL_MODE:", process.env.PAYPAL_MODE);
    console.log("Calculated USE_SANDBOX:", USE_SANDBOX);
    console.log("USING CLIENT_ID starting with:", PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.substring(0, 5) + "..." : "NOT FOUND");
    console.log("USING CLIENT_SECRET exists:", !!PAYPAL_CLIENT_SECRET);*/}
    // Set more permissive CORS for development
    const allowedOrigins = [
        'http://localhost:19006',
        'http://localhost:3000',
        'https://fluidpowergroup.com.au'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // For requests without origin header or from unknown origins
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    console.log("Received request to /api/paypal/create-order");

    // --- Extract expected amount/details from frontend request ---
    const { amount, currency = 'AUD', description } = req.body;

    // Get the origin URL from where the request was made
    const frontendBaseUrl = process.env.NODE_ENV === 'production'
         ? 'https://fluidpowergroup.com.au' 
         : 'http://localhost:19006';

    // We don't actually use these URLs with the JS SDK, but they're required by the API
    const cancelRedirectUrl = `${frontendBaseUrl}`;
    const returnUrl = `${frontendBaseUrl}`;

    // Validate required parameters
    if (amount === undefined || isNaN(parseFloat(amount))) {
        console.error("Invalid or missing amount in create-order request:", amount);
        return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Ensure amount is properly formatted as a string with 2 decimal places
    const amountStringForPayPal = parseFloat(amount).toFixed(2);
    
    console.log(`Creating PayPal order for amount: ${amountStringForPayPal} ${currency}`);

    try {
        const accessToken = await getPayPalAccessToken();
        
        // Build the order payload with improved application context
        const orderPayload = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: currency,
                    value: amountStringForPayPal
                },
                description: description || 'FluidPower Group Order'
            }],
            application_context: {
                brand_name: 'FluidPower Group',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                return_url: `${frontendBaseUrl}`,
                cancel_url: `${frontendBaseUrl}`,
                // This is key - change from 'LOGIN' to 'BILLING'
                landing_page: 'BILLING'
              }
        };

        const url = `${PAYPAL_API_BASE}/v2/checkout/orders`;
        console.log("Calling PayPal Create Order API...");

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'PayPal-Request-Id': `fpg-${Date.now()}` // Unique ID for idempotency
            },
            body: JSON.stringify(orderPayload)
        });

        const responseText = await response.text();
        let responseData;
        
        try {
            // Try to parse as JSON
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse PayPal Create Order response as JSON:", responseText);
            throw new Error(`Non-JSON response from PayPal Create Order: ${responseText}`);
        }

        if (!response.ok) {
            console.error(`PayPal create order failed. Status: ${response.status}`, responseData);
            // Try to extract a more specific error message from PayPal's response
            const errorMessage = responseData?.details?.[0]?.description || 
                               responseData?.message || 
                               `PayPal error: ${response.status}`;
            throw new Error(errorMessage);
        }

        console.log("PayPal order created successfully. ID:", responseData.id);

        // Send the orderID and HATEOAS links from PayPal back to the frontend
        res.status(200).json({ 
            id: responseData.id,
            links: responseData.links,
            status: responseData.status
        });

    } catch (error) {
        console.error("Error in /api/paypal/create-order catch block:", error);
        res.status(500).json({ 
            error: error.message || 'Internal server error creating order.',
            timestamp: new Date().toISOString()
        });
    }
}