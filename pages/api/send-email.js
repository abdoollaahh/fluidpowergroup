// pages/api/send-email.js - BARE MINIMUM VERSION FOR TESTING
// ⚠️ NO SECURITY - ONLY FOR TESTING!

import fetch from 'node-fetch';

const TESTING_MODE = process.env.TESTING_MODE === 'true';

// Email config
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;

const BUSINESS_EMAIL = TESTING_MODE 
    ? (process.env.BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au')
    : process.env.BUSINESS_EMAIL;

const SENDER_EMAIL = TESTING_MODE
    ? (process.env.SENDER_EMAIL_TEST || process.env.SENDER_EMAIL)
    : process.env.SENDER_EMAIL;

console.log('🧪 SIMPLE EMAIL ENDPOINT - NO SECURITY');
console.log(`📧 Business email: ${BUSINESS_EMAIL}`);
console.log(`📧 Sender email: ${SENDER_EMAIL}`);

// Get Microsoft Graph token
async function getGraphAccessToken() {
    const tokenEndpoint = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', AZURE_CLIENT_ID);
    params.append('client_secret', AZURE_CLIENT_SECRET);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Send email via Graph
async function sendEmailViaGraph(accessToken, emailData, fromEmail) {
    const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`;
    
    const response = await fetch(graphEndpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
    });

    if (response.status === 202) {
        return { success: true };
    } else {
        const errorText = await response.text();
        throw new Error(`Graph API error: ${response.status} - ${errorText}`);
    }
}

// Format email
function formatEmail(toEmail, subject, htmlContent, pdfAttachments, orderNumber) {
    const finalSubject = TESTING_MODE ? `[TEST] ${subject}` : subject;

    const emailData = {
        message: {
            subject: finalSubject,
            body: {
                contentType: 'HTML',
                content: htmlContent
            },
            toRecipients: [{ emailAddress: { address: toEmail } }]
        },
        saveToSentItems: true
    };

    // Add PDFs if provided
    if (pdfAttachments && Array.isArray(pdfAttachments) && pdfAttachments.length > 0) {
        emailData.message.attachments = pdfAttachments.map((pdf, index) => ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: pdf.name || `Order-${orderNumber}-${index + 1}.pdf`,
            contentType: 'application/pdf',
            contentBytes: pdf.contentBytes
        }));
        console.log(`📎 Added ${pdfAttachments.length} PDF(s)`);
    }

    return emailData;
}

// Main handler
export default async function handler(req, res) {
    console.log('📨 Email endpoint called');

    // CORS - allow everything for testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // NO SECURITY CHECKS - JUST SEND!
        
        const { orderNumber, userDetails, pdfAttachments, emailTemplates, userEmail } = req.body;

        const customerEmailAddress = userDetails?.email || userEmail;
        
        if (!customerEmailAddress || !emailTemplates) {
            console.error('❌ Missing email data');
            return res.status(400).json({ error: 'Missing email data' });
        }

        console.log(`📧 Sending emails for order ${orderNumber}`);
        console.log(`👤 Customer: ${customerEmailAddress}`);
        console.log(`🏢 Business: ${BUSINESS_EMAIL}`);

        // Get token
        console.log('🔑 Getting Graph token...');
        const accessToken = await getGraphAccessToken();
        console.log('✅ Token obtained');

        // Prepare emails
        const customerEmailData = formatEmail(
            customerEmailAddress,
            `Your Order Confirmation - Order #${orderNumber}`,
            emailTemplates.customerEmailContent,
            pdfAttachments,
            orderNumber
        );

        const businessEmailData = formatEmail(
            BUSINESS_EMAIL,
            `New Order Received - Order #${orderNumber}`,
            emailTemplates.businessEmailContent,
            pdfAttachments,
            orderNumber
        );

        // Send customer email
        console.log('📧 Sending customer email...');
        await sendEmailViaGraph(accessToken, customerEmailData, SENDER_EMAIL);
        console.log('✅ Customer email sent!');

        // Send business email
        console.log('📧 Sending business email...');
        try {
            await sendEmailViaGraph(accessToken, businessEmailData, SENDER_EMAIL);
            console.log('✅ Business email sent!');
        } catch (err) {
            console.error('⚠️ Business email failed (not critical):', err.message);
        }

        return res.status(200).json({ 
            success: true,
            message: 'Emails sent successfully!',
            testMode: TESTING_MODE
        });

    } catch (error) {
        console.error('❌ Email error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
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