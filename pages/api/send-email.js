// pages/api/send-email.js
import fetch from 'node-fetch'; // Keep this if using Node < 18, otherwise you can remove if using built-in fetch

// --- Environment Variables ---
// Ensure these are loaded correctly from your environment (e.g., .env.local, Vercel env vars)
const BREVO_API_KEY = process.env.EXPO_PUBLIC_BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;
const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY; // Needed for auth check

// --- Allowed Origins Definition --- (Copied from previous working config)
const allowedOrigins = [
    process.env.LOCAL_DEV_URL, // Define in .env.local if used
    process.env.API_BASE_URL,  // Define in .env.local/Vercel
    'http://localhost:3000',   // Your backend origin
    'http://localhost:19006',  // Your Expo Web dev origin
    'https://fluidpowergroup.com.au' // Your production frontend origin
];
const vercelPreviewPattern = /^https:\/\/fluidpowergroup-[a-z0-9]+-fluidpower\.vercel\.app$/; // For Vercel previews

// --- Main Handler Function ---
export default async function handler(req, res) {
    const origin = req.headers.origin;

    // --- Unified CORS Header Logic ---
    let isOriginAllowed = false;
    if (origin) {
        if (allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
            isOriginAllowed = true;
        }
    } else {
        // Allow requests without an origin (like curl)
        isOriginAllowed = true;
    }

    if (isOriginAllowed && origin) {
       res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-server-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // --- Handle OPTIONS preflight request FIRST ---
    if (req.method === 'OPTIONS') {
        if (!isOriginAllowed && origin) {
             console.warn(`CORS preflight denied for origin: ${origin}`);
             return res.status(403).end('Forbidden');
        }
        console.log(`CORS preflight OK for origin: ${origin}`);
        return res.status(204).end();
    }

    // --- Handle POST request ---
    if (req.method === 'POST') {
        // --- Authentication ---
        const serverKey = req.headers['x-server-key'];
        // Ensure VALID_SERVER_KEY is defined
        if (!VALID_SERVER_KEY) {
             console.error("FATAL: VALID_SERVER_KEY is not configured on the server.");
             return res.status(500).json({ error: 'Server configuration error.' });
        }
        if (serverKey !== VALID_SERVER_KEY) {
            console.error(`Unauthorized access attempt to /api/send-email. Key: ${serverKey ? 'Provided (mismatch)' : 'Missing'}`);
            return res.status(403).json({ error: 'Unauthorized' });
        }
        console.log('Server authorization passed for /api/send-email');

        // --- Main Logic ---
        try {
            console.log('Email endpoint accessed (/api/send-email)');
            // console.log('Received request body:', JSON.stringify(req.body, null, 2)); // Keep for debugging if needed

            // Ensure Brevo key is present
            if (!BREVO_API_KEY || !SENDER_EMAIL || !BUSINESS_EMAIL) {
                 console.error("FATAL: Brevo/Email configuration missing (API Key, Sender, or Business Email).");
                 return res.status(500).json({ success: false, error: "Email service configuration error." });
            }

            // Extract data needed for sending (Trusting emailService prepared it)
            const {
                orderNumber,
                userDetails,
                pdfAttachment,     // Base64 string (or null/undefined)
                emailTemplates,    // Should contain { customerEmailContent, businessEmailContent }
                userEmail          // Fallback email from emailService
            } = req.body;

            // Simplified Validation
            const customerEmailAddress = userDetails?.email || userEmail;
            if (!customerEmailAddress || !emailTemplates || !emailTemplates.customerEmailContent || !emailTemplates.businessEmailContent) {
                 console.error('Validation Failed: Missing crucial email content or customer email.', { customerEmailAddress, emailTemplatesExists: !!emailTemplates });
                 console.error('Failing Request Body:', JSON.stringify(req.body, null, 2));
                 return res.status(400).json({ success: false, error: "Missing required email content or recipient data." });
            }
            const currentOrderNumber = orderNumber || 'Unknown';
            // Define customerName here as it's used below
            const customerName = userDetails?.name || 'Valued Customer';

            // Define attachments here as it's used below
            const attachments = pdfAttachment ? [{
                name: `Order-${currentOrderNumber}.pdf`,
                content: pdfAttachment // Brevo expects base64 string
            }] : []; // Use empty array if no PDF

            // --- Send Business Email ---
            const businessEmailPayload = {
                sender: { name: 'FluidPower Group Order System', email: SENDER_EMAIL },
                to: [{ email: BUSINESS_EMAIL, name: 'FluidPower Group' }],
                subject: `New Order Received - Order #${currentOrderNumber}`,
                htmlContent: emailTemplates.businessEmailContent,
                // Use the defined attachments array
                attachment: attachments.length > 0 ? attachments : undefined
            };
            console.log(`Sending business email for order ${currentOrderNumber} to ${BUSINESS_EMAIL}`);
            const businessResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                 method: 'POST',
                 headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
                 body: JSON.stringify(businessEmailPayload)
            });
            const businessResponseData = await businessResponse.json().catch(() => ({}));
            if (!businessResponse.ok) { console.error(`Failed to send business email. Status: ${businessResponse.status}`, businessResponseData); /* Log error */ }
            else { console.log(`Business email sent successfully.`); } // Log messageId


            // --- Send Customer Email ---
            const customerEmailPayload = {
                sender: { name: 'FluidPower Group', email: SENDER_EMAIL },
                // Use the defined customerName and email address
                to: [{ email: customerEmailAddress, name: customerName }],
                subject: `Your Order Confirmation - Order #${currentOrderNumber}`,
                htmlContent: emailTemplates.customerEmailContent,
                 // Use the defined attachments array
                attachment: attachments.length > 0 ? attachments : undefined
            };
            console.log(`Sending customer email for order ${currentOrderNumber} to ${customerEmailAddress}`);
            const customerResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
                body: JSON.stringify(customerEmailPayload)
            });
            const customerResponseData = await customerResponse.json().catch(() => ({}));
            if (!customerResponse.ok) {
                console.error(`Failed to send customer email. Status: ${customerResponse.status}`, customerResponseData);
                // Decide if this should prevent overall success response
                throw new Error(`Failed to send customer email (Status: ${customerResponse.status})`);
            } else {
                console.log(`Customer email sent successfully.`); // Log messageId
            }

            // Success
            res.status(200).json({ success: true });

        } catch (error) {
            console.error('Error processing /api/send-email:', error);
            res.status(500).json({ success: false, error: error.message || 'Internal server error processing email request.' });
        }
    } else {
        // Handle unsupported methods
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}

export const config = {
    api: {
      bodyParser: {
        sizeLimit: '10mb', // Increase limit to 10MB (or adjust as needed)
      },
    },
  };