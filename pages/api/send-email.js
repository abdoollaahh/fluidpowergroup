// pages/api/send-email.js
import nodemailer from 'nodemailer';
import fetch from 'node-fetch'; // Keep this if needed for other services

// --- Environment Variables ---
// SMTP configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Existing environment variables
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;
const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY; // Needed for auth check

// --- Create optimized transporter for faster connections ---
let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      // Speed optimizations for 10-second timeout
      connectionTimeout: 5000,   // Fail fast if connection is slow
      greetingTimeout: 2000,     // Quick greeting
      socketTimeout: 5000,       // Don't hang on slow responses
      pool: false,               // Don't use pooling - direct connection
      maxConnections: 1,
      maxMessages: 1
    });
  }
  return transporter;
}

// --- Allowed Origins Definition --- (UNCHANGED)
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

    // --- Unified CORS Header Logic --- (UNCHANGED)
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

    // --- Handle OPTIONS preflight request FIRST --- (UNCHANGED)
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
        // --- Authentication --- (UNCHANGED)
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

            // --- Validate SMTP Configuration ---
            if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
                console.error("FATAL: SMTP configuration missing (Host, User, or Password).");
                return res.status(500).json({ success: false, error: "Email service configuration error." });
            }

            if (!BUSINESS_EMAIL) {
                console.error("FATAL: Business email not configured.");
                return res.status(500).json({ success: false, error: "Email service configuration error." });
            }

            // --- Get the optimized transporter ---
            const mailer = getTransporter();

            // Extract data needed for sending
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

            // Define attachments for Nodemailer
            const attachments = pdfAttachment ? [{
                filename: `Order-${currentOrderNumber}.pdf`,
                content: pdfAttachment,
                encoding: 'base64',
                contentType: 'application/pdf'
            }] : [];

            // --- Prepare email options ---
            const businessEmailOptions = {
                from: `"FluidPower Group Order System" <${SMTP_USER}>`,
                to: BUSINESS_EMAIL,
                subject: `New Order Received - Order #${currentOrderNumber}`,
                html: emailTemplates.businessEmailContent,
                attachments: attachments.length > 0 ? attachments : undefined
            };

            const customerEmailOptions = {
                from: `"FluidPower Group" <${SMTP_USER}>`,
                to: customerEmailAddress,
                subject: `Your Order Confirmation - Order #${currentOrderNumber}`,
                html: emailTemplates.customerEmailContent,
                attachments: attachments.length > 0 ? attachments : undefined
            };

            // Log what we're about to do
            console.log(`Starting sequential email sending for order ${currentOrderNumber}`);
            console.log(`Customer email to: ${customerEmailAddress}`);
            console.log(`Business email to: ${BUSINESS_EMAIL}`);

            // --- SEQUENTIAL EMAIL SENDING (Customer First, Business Second) ---
            let customerResult = null;
            let businessResult = null;
            let results = {
                customerEmailSent: false,
                businessEmailSent: false,
                warnings: []
            };

            // Step 1: Send customer email first (MOST CRITICAL)
            try {
                console.log('Sending customer email first...');
                customerResult = await mailer.sendMail(customerEmailOptions);
                results.customerEmailSent = true;
                console.log(`Customer email sent successfully. Message ID: ${customerResult.messageId}`);
            } catch (customerError) {
                console.error('CRITICAL: Customer email failed:', customerError.message);
                // If customer email fails, this is a critical error
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to send order confirmation to customer',
                    details: customerError.message 
                });
            }

            // Step 2: Send business email second (NICE TO HAVE)
            try {
                console.log('Sending business email second...');
                businessResult = await mailer.sendMail(businessEmailOptions);
                results.businessEmailSent = true;
                console.log(`Business email sent successfully. Message ID: ${businessResult.messageId}`);
            } catch (businessError) {
                console.error('Business email failed (but customer email succeeded):', businessError.message);
                results.warnings.push('Business notification email failed to send');
                // Don't fail the entire request - customer got their confirmation
            }

            // --- Determine response based on results ---
            if (results.customerEmailSent && results.businessEmailSent) {
                // Perfect - both emails sent
                res.status(200).json({ 
                    success: true,
                    message: 'Order processed and all emails sent successfully',
                    customerMessageId: customerResult.messageId,
                    businessMessageId: businessResult.messageId
                });
            } else if (results.customerEmailSent && !results.businessEmailSent) {
                // Good enough - customer got confirmation, business notification failed
                res.status(200).json({ 
                    success: true,
                    message: 'Order processed and customer notified successfully',
                    warnings: results.warnings,
                    customerMessageId: customerResult.messageId
                });
            } else {
                // This shouldn't happen since we return early if customer email fails
                res.status(500).json({ 
                    success: false, 
                    error: 'Unexpected error in email processing' 
                });
            }

        } catch (error) {
            console.error('Error processing /api/send-email:', error);
            res.status(500).json({ success: false, error: error.message || 'Internal server error processing email request.' });
        } finally {
            // Clean up transporter to free resources
            if (transporter) {
                transporter.close();
                transporter = null;
            }
        }
    } else {
        // Handle unsupported methods (UNCHANGED)
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}

// Maintain the existing size limit config (UNCHANGED)
export const config = {
    api: {
      bodyParser: {
        sizeLimit: '10mb', // Maintain 10MB limit
      },
    },
};