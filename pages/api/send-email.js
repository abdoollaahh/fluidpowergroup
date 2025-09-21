// pages/api/send-email.js
import fetch from 'node-fetch';

// --- Environment Variables ---
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;

// Existing environment variables
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;
const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY;

// --- Allowed Origins Definition --- (UNCHANGED)
const allowedOrigins = [
    process.env.LOCAL_DEV_URL,
    process.env.API_BASE_URL,
    'http://localhost:3000',
    'http://localhost:19006',
    'https://fluidpowergroup.com.au'
];
const vercelPreviewPattern = /^https:\/\/fluidpowergroup-[a-z0-9]+-fluidpower\.vercel\.app$/;

// --- Microsoft Graph Authentication ---
async function getGraphAccessToken() {
    const tokenEndpoint = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', AZURE_CLIENT_ID);
    params.append('client_secret', AZURE_CLIENT_SECRET);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Failed to get Graph access token:', error);
        throw new Error('Authentication failed');
    }
}

// --- Send Email via Microsoft Graph ---
async function sendEmailViaGraph(accessToken, emailData) {
    const graphEndpoint = 'https://graph.microsoft.com/v1.0/me/sendMail';
    
    try {
        const response = await fetch(graphEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        // Graph API returns 202 Accepted for successful email submissions
        if (response.status === 202) {
            return { success: true, messageId: response.headers.get('request-id') || 'sent' };
        } else {
            const errorText = await response.text();
            throw new Error(`Graph API error: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Graph API send failed:', error);
        throw error;
    }
}

// --- Format Email for Graph API ---
function formatEmailForGraph(toEmail, subject, htmlContent, pdfAttachment, orderNumber) {
    const emailData = {
        message: {
            subject: subject,
            body: {
                contentType: 'HTML',
                content: htmlContent
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: toEmail
                    }
                }
            ]
        },
        saveToSentItems: true
    };

    // Add PDF attachment if provided
    if (pdfAttachment) {
        emailData.message.attachments = [
            {
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: `Order-${orderNumber}.pdf`,
                contentType: 'application/pdf',
                contentBytes: pdfAttachment
            }
        ];
    }

    return emailData;
}

// --- Main Handler Function ---
export default async function handler(req, res) {
    const origin = req.headers.origin;

    // --- CORS Logic --- (UNCHANGED)
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

    // --- Handle OPTIONS preflight request --- (UNCHANGED)
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
        if (!VALID_SERVER_KEY) {
             console.error("FATAL: VALID_SERVER_KEY is not configured.");
             return res.status(500).json({ error: 'Server configuration error.' });
        }
        if (serverKey !== VALID_SERVER_KEY) {
            console.error(`Unauthorized access attempt. Key: ${serverKey ? 'Provided (mismatch)' : 'Missing'}`);
            return res.status(403).json({ error: 'Unauthorized' });
        }

        try {
            console.log('Graph email endpoint accessed (/api/send-email)');

            // --- Validate Graph Configuration ---
            if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
                console.error("FATAL: Microsoft Graph configuration missing.");
                return res.status(500).json({ success: false, error: "Email service configuration error." });
            }

            if (!BUSINESS_EMAIL) {
                console.error("FATAL: Business email not configured.");
                return res.status(500).json({ success: false, error: "Email service configuration error." });
            }

            // Extract request data
            const {
                orderNumber,
                userDetails,
                pdfAttachment,
                emailTemplates,
                userEmail
            } = req.body;

            // Validate required data
            const customerEmailAddress = userDetails?.email || userEmail;
            if (!customerEmailAddress || !emailTemplates || !emailTemplates.customerEmailContent || !emailTemplates.businessEmailContent) {
                 console.error('Validation Failed: Missing crucial email content or customer email.');
                 return res.status(400).json({ success: false, error: "Missing required email content or recipient data." });
            }
            
            const currentOrderNumber = orderNumber || 'Unknown';

            // --- Get Graph Access Token ---
            console.log('Getting Microsoft Graph access token...');
            const accessToken = await getGraphAccessToken();
            console.log('Graph access token obtained successfully');

            // --- Prepare emails ---
            const customerEmailData = formatEmailForGraph(
                customerEmailAddress,
                `Your Order Confirmation - Order #${currentOrderNumber}`,
                emailTemplates.customerEmailContent,
                pdfAttachment,
                currentOrderNumber
            );

            const businessEmailData = formatEmailForGraph(
                BUSINESS_EMAIL,
                `New Order Received - Order #${currentOrderNumber}`,
                emailTemplates.businessEmailContent,
                pdfAttachment,
                currentOrderNumber
            );

            // --- Send emails sequentially ---
            console.log(`Sending emails for order ${currentOrderNumber}`);
            console.log(`Customer email to: ${customerEmailAddress}`);
            console.log(`Business email to: ${BUSINESS_EMAIL}`);

            let results = {
                customerEmailSent: false,
                businessEmailSent: false,
                warnings: []
            };

            // Step 1: Send customer email first (CRITICAL)
            try {
                console.log('Sending customer email via Graph API...');
                const customerResult = await sendEmailViaGraph(accessToken, customerEmailData);
                results.customerEmailSent = true;
                console.log(`Customer email sent successfully. ID: ${customerResult.messageId}`);
            } catch (customerError) {
                console.error('CRITICAL: Customer email failed:', customerError.message);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to send order confirmation to customer',
                    details: customerError.message 
                });
            }

            // Step 2: Send business email second (NICE TO HAVE)
            try {
                console.log('Sending business email via Graph API...');
                const businessResult = await sendEmailViaGraph(accessToken, businessEmailData);
                results.businessEmailSent = true;
                console.log(`Business email sent successfully. ID: ${businessResult.messageId}`);
            } catch (businessError) {
                console.error('Business email failed (customer email succeeded):', businessError.message);
                results.warnings.push('Business notification email failed to send');
            }

            // --- Determine response ---
            if (results.customerEmailSent && results.businessEmailSent) {
                res.status(200).json({ 
                    success: true,
                    message: 'Order processed and all emails sent successfully via Microsoft Graph',
                    method: 'Microsoft Graph API'
                });
            } else if (results.customerEmailSent && !results.businessEmailSent) {
                res.status(200).json({ 
                    success: true,
                    message: 'Order processed and customer notified successfully via Microsoft Graph',
                    warnings: results.warnings,
                    method: 'Microsoft Graph API'
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    error: 'Unexpected error in email processing' 
                });
            }

        } catch (error) {
            console.error('Error in Graph email processing:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message || 'Internal server error processing email request.' 
            });
        }
    } else {
        // Handle unsupported methods
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}

// Keep the same size limit
export const config = {
    api: {
      bodyParser: {
        sizeLimit: '10mb',
      },
    },
};