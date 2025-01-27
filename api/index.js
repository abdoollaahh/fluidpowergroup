const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const API_KEY = process.env.EXPO_PUBLIC_BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;

console.log('Serverless Function Started');

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.LOCAL_DEV_URL,
      process.env.API_BASE_URL,
      'http://localhost:19006', // Add your local development origin here
      'https://fluidpowergroup.com.au' // Your production domain
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow requests from allowed origins
    } else {
      callback(new Error('Not allowed by CORS')); // Reject requests from other origins
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'], // Include OPTIONS for preflight requests
  allowedHeaders: ['Content-Type', 'x-api-key'], // Include any custom headers you use
}));

// Preflight request handler (add this line here)
app.options('*', cors(), (req, res) => {
  res.sendStatus(204); // Respond with 'No Content' for preflight requests
});

// Authorization middleware
const authMiddleware = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];
  const VALID_SERVER_KEY = process.env.VALID_SERVER_KEY;

  if (providedKey !== VALID_SERVER_KEY) {
    console.error('Unauthorized: Key Mismatch', { provided: providedKey, expected: VALID_SERVER_KEY });
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  console.log('Authorization Passed');
  next();
};

// PayPal configuration endpoint
app.get('/api/get-paypal-config', authMiddleware, (req, res) => {
    console.log('PayPal config endpoint accessed');
  res.json({
    environment: process.env.EXPO_PUBLIC_PAYPAL_ENVIRONMENT || 'sandbox',
    sandboxEmail: process.env.EXPO_PUBLIC_PAYPAL_SANDBOX_EMAIL,
    productionEmail: process.env.EXPO_PUBLIC_PAYPAL_PRODUCTION_EMAIL
  });
});

// Email sending endpoint
app.post('/api/send-email', authMiddleware, async (req, res) => {
    console.log('Email endpoint accessed');
  try {
    const {
      orderNumber,
      userDetails,
      pdfAttachment,
      emailTemplates
    } = req.body;

    const attachments = pdfAttachment ? [{
      name: `Order-${orderNumber || 'unknown'}.pdf`,
      content: pdfAttachment
    }] : [];

    // Send business email
    const businessEmailPayload = {
      sender: {
        name: 'FluidPower Group Order System',
        email: SENDER_EMAIL,
      },
      to: [{
        email: BUSINESS_EMAIL,
        name: 'FluidPower Group',
      }],
      subject: `New Order Received - Order #${orderNumber || 'Unknown'}`,
      htmlContent: emailTemplates.businessEmailContent,
      attachment: attachments
    };

    const businessResponse = await fetch('https://api.sendinblue.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': API_KEY
      },
      body: JSON.stringify(businessEmailPayload)
    });

    if (!businessResponse.ok) {
      throw new Error('Failed to send business email');
    }

    // Send customer email if customer email exists
    if (userDetails?.email) {
      const customerEmailPayload = {
        sender: {
          name: 'FluidPower Group',
          email: SENDER_EMAIL,
        },
        to: [{
          email: userDetails.email,
          name: userDetails.name || 'Valued Customer',
        }],
        subject: `Your Order Confirmation - Order #${orderNumber || 'Unknown'}`,
        htmlContent: emailTemplates.customerEmailContent,
        attachment: attachments
      };

      const customerResponse = await fetch('https://api.sendinblue.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': API_KEY
        },
        body: JSON.stringify(customerEmailPayload)
      });

      if (!customerResponse.ok) {
        throw new Error('Failed to send customer email');
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Development server
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Development server running on port ${port}`);
    if (!process.env.EXPO_PUBLIC_BREVO_API_KEY) {
      console.warn('WARNING: EXPO_PUBLIC_BREVO_API_KEY is not set');
    }
  });
}

// Export for serverless
module.exports = app;