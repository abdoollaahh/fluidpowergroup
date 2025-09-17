// pages/api/test-email-connection.js
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;
const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY;

export default async function handler(req, res) {
    const serverKey = req.headers['x-server-key'];
    if (serverKey !== VALID_SERVER_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const diagnostics = {
        timestamp: new Date().toISOString(),
        serverLocation: process.env.VERCEL_REGION || 'unknown',
        tests: {}
    };

    try {
        console.log('=== EMAIL DIAGNOSTIC START ===');
        
        // Test 1: Configuration check
        diagnostics.tests.configuration = {
            smtpHost: !!SMTP_HOST,
            smtpPort: SMTP_PORT,
            smtpUser: !!SMTP_USER,
            smtpPass: !!SMTP_PASS,
            businessEmail: !!BUSINESS_EMAIL,
            status: 'PASS'
        };

        // Test 2: Create transporter
        const transporter = nodemailer.createTransporter({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000
        });

        // Test 3: Verify connection
        const connectionStart = Date.now();
        try {
            await transporter.verify();
            const connectionTime = Date.now() - connectionStart;
            diagnostics.tests.smtpConnection = { 
                status: 'PASS',
                connectionTime: `${connectionTime}ms`
            };
        } catch (verifyError) {
            const connectionTime = Date.now() - connectionStart;
            diagnostics.tests.smtpConnection = { 
                status: 'FAIL',
                connectionTime: `${connectionTime}ms`,
                error: verifyError.message
            };
        }

        res.status(200).json(diagnostics);

    } catch (error) {
        console.error('Diagnostic error:', error);
        res.status(500).json({ error: error.message });
    }
}