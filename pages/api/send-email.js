// pages/api/test-email-connection.js
// Diagnostic function to identify what's actually failing

import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;
const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY;

export default async function handler(req, res) {
    // Simple auth check
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
        // Test 1: Basic configuration check
        console.log('=== DIAGNOSTIC TEST 1: Configuration ===');
        diagnostics.tests.configuration = {
            smtpHost: !!SMTP_HOST,
            smtpPort: SMTP_PORT,
            smtpUser: !!SMTP_USER,
            smtpPass: !!SMTP_PASS,
            businessEmail: !!BUSINESS_EMAIL,
            status: 'PASS'
        };
        console.log('✅ Configuration check passed');

        // Test 2: Transporter creation
        console.log('=== DIAGNOSTIC TEST 2: Transporter Creation ===');
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
            socketTimeout: 10000,
            debug: true, // Enable debug logging
            logger: true // Enable logging
        });
        diagnostics.tests.transporterCreation = { status: 'PASS' };
        console.log('✅ Transporter creation passed');

        // Test 3: SMTP Connection Test (without sending)
        console.log('=== DIAGNOSTIC TEST 3: SMTP Connection ===');
        const connectionStart = Date.now();
        
        try {
            await transporter.verify();
            const connectionTime = Date.now() - connectionStart;
            diagnostics.tests.smtpConnection = { 
                status: 'PASS',
                connectionTime: `${connectionTime}ms`,
                message: 'SMTP server connection successful'
            };
            console.log(`✅ SMTP connection verified in ${connectionTime}ms`);
        } catch (verifyError) {
            const connectionTime = Date.now() - connectionStart;
            diagnostics.tests.smtpConnection = { 
                status: 'FAIL',
                connectionTime: `${connectionTime}ms`,
                error: verifyError.message,
                code: verifyError.code,
                command: verifyError.command
            };
            console.error(`❌ SMTP connection failed after ${connectionTime}ms:`, verifyError.message);
        }

        // Test 4: Simple Email Send (without PDF)
        console.log('=== DIAGNOSTIC TEST 4: Simple Email Send ===');
        const emailStart = Date.now();
        
        try {
            const testEmail = {
                from: `"FluidPower Diagnostic" <${SMTP_USER}>`,
                to: BUSINESS_EMAIL,
                subject: `Diagnostic Test - ${diagnostics.timestamp}`,
                html: `
                    <h3>Email System Diagnostic Test</h3>
                    <p><strong>Test Time:</strong> ${diagnostics.timestamp}</p>
                    <p><strong>Server Location:</strong> ${diagnostics.serverLocation}</p>
                    <p><strong>Purpose:</strong> Testing email functionality after recent issues</p>
                    <p>If you receive this email, basic SMTP functionality is working.</p>
                `
            };

            const result = await transporter.sendMail(testEmail);
            const emailTime = Date.now() - emailStart;
            
            diagnostics.tests.simpleEmailSend = {
                status: 'PASS',
                sendTime: `${emailTime}ms`,
                messageId: result.messageId,
                accepted: result.accepted,
                rejected: result.rejected
            };
            console.log(`✅ Simple email sent successfully in ${emailTime}ms. Message ID: ${result.messageId}`);
        } catch (emailError) {
            const emailTime = Date.now() - emailStart;
            diagnostics.tests.simpleEmailSend = {
                status: 'FAIL',
                sendTime: `${emailTime}ms`,
                error: emailError.message,
                code: emailError.code,
                command: emailError.command
            };
            console.error(`❌ Simple email send failed after ${emailTime}ms:`, emailError.message);
        }

        // Test 5: PDF Email Send (with small test PDF)
        console.log('=== DIAGNOSTIC TEST 5: PDF Email Send ===');
        const pdfStart = Date.now();
        
        try {
            // Create a minimal PDF in base64 for testing
            const testPdfBase64 = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA5IFRmCjUwIDc1MCBUZAooVGVzdCBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAwMDkgMDAwMDAgbgowMDAwMDAwMDU4IDAwMDAwIG4KMDAwMDAwMDExNSAwMDAwMCBuCjAwMDAwMDAyNTEgMDAwMDAgbgowMDAwMDAwMzE4IDAwMDAwIG4KDQP0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQxMQolJUVPRg==';
            
            const testEmailWithPdf = {
                from: `"FluidPower Diagnostic" <${SMTP_USER}>`,
                to: BUSINESS_EMAIL,
                subject: `Diagnostic Test with PDF - ${diagnostics.timestamp}`,
                html: `
                    <h3>Email System Diagnostic Test (with PDF)</h3>
                    <p><strong>Test Time:</strong> ${diagnostics.timestamp}</p>
                    <p><strong>Server Location:</strong> ${diagnostics.serverLocation}</p>
                    <p>Testing PDF attachment functionality. A small test PDF should be attached.</p>
                `,
                attachments: [{
                    filename: 'diagnostic-test.pdf',
                    content: testPdfBase64,
                    encoding: 'base64',
                    contentType: 'application/pdf'
                }]
            };

            const pdfResult = await transporter.sendMail(testEmailWithPdf);
            const pdfTime = Date.now() - pdfStart;
            
            diagnostics.tests.pdfEmailSend = {
                status: 'PASS',
                sendTime: `${pdfTime}ms`,
                messageId: pdfResult.messageId,
                accepted: pdfResult.accepted,
                rejected: pdfResult.rejected
            };
            console.log(`✅ PDF email sent successfully in ${pdfTime}ms. Message ID: ${pdfResult.messageId}`);
        } catch (pdfError) {
            const pdfTime = Date.now() - pdfStart;
            diagnostics.tests.pdfEmailSend = {
                status: 'FAIL',
                sendTime: `${pdfTime}ms`,
                error: pdfError.message,
                code: pdfError.code,
                command: pdfError.command
            };
            console.error(`❌ PDF email send failed after ${pdfTime}ms:`, pdfError.message);
        }

        // Close transporter
        transporter.close();

        // Generate summary
        const passCount = Object.values(diagnostics.tests).filter(test => test.status === 'PASS').length;
        const totalTests = Object.keys(diagnostics.tests).length;
        
        diagnostics.summary = {
            totalTests,
            passed: passCount,
            failed: totalTests - passCount,
            overallStatus: passCount === totalTests ? 'ALL_PASS' : passCount > 0 ? 'PARTIAL_PASS' : 'ALL_FAIL'
        };

        console.log('=== DIAGNOSTIC SUMMARY ===');
        console.log(`Tests passed: ${passCount}/${totalTests}`);
        console.log(`Overall status: ${diagnostics.summary.overallStatus}`);

        res.status(200).json(diagnostics);

    } catch (error) {
        console.error('Diagnostic test failed:', error);
        diagnostics.tests.criticalError = {
            status: 'FAIL',
            error: error.message
        };
        diagnostics.summary = { overallStatus: 'CRITICAL_FAIL' };
        res.status(500).json(diagnostics);
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
    },
};