// pages/api/send-email.js
// Using SendGrid - much faster than Office365 SMTP
import sgMail from '@sendgrid/mail';

// Environment variables needed:
// SENDGRID_API_KEY=your-sendgrid-api-key
// BUSINESS_EMAIL=info@fluidpowergroup.com.au
// VALID_SERVER_KEY=your-existing-server-key

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;
const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY;

// Initialize SendGrid
sgMail.setApiKey(SENDGRID_API_KEY);

// --- Allowed Origins (UNCHANGED) ---
const allowedOrigins = [
    process.env.LOCAL_DEV_URL,
    process.env.API_BASE_URL,
    'http://localhost:3000',
    'http://localhost:19006',
    'https://fluidpowergroup.com.au'
];
const vercelPreviewPattern = /^https:\/\/fluidpowergroup-[a-z0-9]+-fluidpower\.vercel\.app$/;

export default async function handler(req, res) {
    const origin = req.headers.origin;

    // --- CORS Logic (UNCHANGED) ---
    let isOriginAllowed = false;
    if (origin) {
        if (allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
            isOriginAllowed = true;
        }
    } else {
        isOriginAllowed = true;
    }

    if (isOriginAllowed && origin) {
       res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-server-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        if (!isOriginAllowed && origin) {
             console.warn(`CORS preflight denied for origin: ${origin}`);
             return res.status(403).end('Forbidden');
        }
        console.log(`CORS preflight OK for origin: ${origin}`);
        return res.status(204).end();
    }

    if (req.method === 'POST') {
        // --- Authentication (UNCHANGED) ---
        const serverKey = req.headers['x-server-key'];
        if (!VALID_SERVER_KEY) {
             console.error("FATAL: VALID_SERVER_KEY is not configured on the server.");
             return res.status(500).json({ error: 'Server configuration error.' });
        }
        if (serverKey !== VALID_SERVER_KEY) {
            console.error(`Unauthorized access attempt to /api/send-email. Key: ${serverKey ? 'Provided (mismatch)' : 'Missing'}`);
            return res.status(403).json({ error: 'Unauthorized' });
        }
        console.log('Server authorization passed for /api/send-email');

        try {
            console.log('Email endpoint accessed (/api/send-email)');

            // --- Validate Configuration ---
            if (!SENDGRID_API_KEY) {
                console.error("FATAL: SENDGRID_API_KEY is not configured.");
                return res.status(500).json({ success: false, error: "Email service configuration error." });
            }

            if (!BUSINESS_EMAIL) {
                console.error("FATAL: Business email not configured.");
                return res.status(500).json({ success: false, error: "Email service configuration error." });
            }

            // --- Extract data (UNCHANGED) ---
            const {
                orderNumber,
                userDetails,
                pdfAttachment,
                emailTemplates,
                userEmail
            } = req.body;

            const customerEmailAddress = userDetails?.email || userEmail;
            if (!customerEmailAddress || !emailTemplates || !emailTemplates.customerEmailContent || !emailTemplates.businessEmailContent) {
                 console.error('Validation Failed: Missing crucial email content or customer email.');
                 return res.status(400).json({ success: false, error: "Missing required email content or recipient data." });
            }
            
            const currentOrderNumber = orderNumber || 'Unknown';

            // --- Prepare attachments for SendGrid ---
            const attachments = pdfAttachment ? [{
                content: pdfAttachment,
                filename: `Order-${currentOrderNumber}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment'
            }] : [];

            // --- Prepare emails for SendGrid ---
            const emails = [
                {
                    to: BUSINESS_EMAIL,
                    from: {
                        email: 'orders@fluidpowergroup.com.au', // Use your verified domain
                        name: 'FluidPower Group Order System'
                    },
                    subject: `New Order Received - Order #${currentOrderNumber}`,
                    html: emailTemplates.businessEmailContent,
                    attachments: attachments
                },
                {
                    to: customerEmailAddress,
                    from: {
                        email: 'orders@fluidpowergroup.com.au', // Use your verified domain
                        name: 'FluidPower Group'
                    },
                    subject: `Your Order Confirmation - Order #${currentOrderNumber}`,
                    html: emailTemplates.customerEmailContent,
                    attachments: attachments
                }
            ];

            console.log(`Sending emails for order ${currentOrderNumber}`);
            console.log(`Business email to: ${BUSINESS_EMAIL}`);
            console.log(`Customer email to: ${customerEmailAddress}`);

            // --- Send both emails via SendGrid (much faster than SMTP) ---
            const results = await sgMail.send(emails);
            
            console.log(`✅ Both emails sent successfully via SendGrid`);
            console.log(`Business email status: ${results[0].statusCode}`);
            console.log(`Customer email status: ${results[1].statusCode}`);

            res.status(200).json({ 
                success: true,
                message: 'Both emails sent successfully',
                businessStatus: results[0].statusCode,
                customerStatus: results[1].statusCode
            });

        } catch (error) {
            console.error('SendGrid error:', error);
            
            // SendGrid specific error handling
            if (error.response) {
                console.error('SendGrid API error:', error.response.body);
                res.status(500).json({ 
                    success: false, 
                    error: 'Email service error',
                    details: error.response.body.errors || error.message
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    error: error.message || 'Internal server error processing email request.' 
                });
            }
        }
    } else {
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}

export const config = {
    api: {
      bodyParser: {
        sizeLimit: '10mb',
      },
    },
};