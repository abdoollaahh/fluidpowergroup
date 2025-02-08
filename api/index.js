const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const BREVO_API_KEY = process.env.EXPO_PUBLIC_BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;

console.log('Serverless Function Started');

// Define valid client keys and their permissions
const validClientKeys = {
    [process.env.EXPO_PUBLIC_API_CLIENT_KEY]: {
        name: 'web-client',
        permissions: ['read_prices']
    }
};

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.LOCAL_DEV_URL,
            process.env.API_BASE_URL,
            'http://localhost:3000',
            'http://localhost:19006',
            'https://fluidpowergroup.com.au'
        ];
        
        // Regex pattern for Vercel preview URLs
        const vercelPreviewPattern = /^https:\/\/fluidpowergroup-[a-z0-9]+-fluidpower\.vercel\.app$/;

        if (!origin || 
            allowedOrigins.includes(origin) || 
            vercelPreviewPattern.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'x-server-key'],
}));

app.options('*', cors(), (req, res) => {
    res.sendStatus(204);
});

// Enhanced authorization middleware
const authMiddleware = (req, res, next) => {
    const clientKey = req.headers['x-api-key'];
    const serverKey = req.headers['x-server-key'];

    // Check server key for internal operations
    if (serverKey === process.env.VALID_SERVER_KEY) {
        console.log('Server authorization passed');
        return next();
    }

    // Check client key for public endpoints
    if (validClientKeys[clientKey]) {
        const endpoint = req.path;
        // You can add more specific endpoint checks here
        if (endpoint === '/api/get-prices' && 
            validClientKeys[clientKey].permissions.includes('read_prices')) {
            console.log('Client authorization passed');
            return next();
        }
    }

    console.error('Unauthorized: Invalid Key');
    return res.status(403).json({ error: 'Unauthorized' });
};

// New prices endpoint
app.get('/api/get-prices', authMiddleware, (req, res) => {

  // Add debug logging
  console.log('Prices endpoint accessed');
  console.log('Request headers:', req.headers);
  
  // Set correct content type
  res.setHeader('Content-Type', 'application/json');

    res.json({
      hosePrices: {
          "1/4": process.env.REACT_APP_HOSE_PRICE_1_4,
          "3/8": process.env.REACT_APP_HOSE_PRICE_3_8,
          "1/2": process.env.REACT_APP_HOSE_PRICE_1_2,
          "5/8": process.env.REACT_APP_HOSE_PRICE_5_8,
          "3/4": process.env.REACT_APP_HOSE_PRICE_3_4,
          "1": process.env.REACT_APP_HOSE_PRICE_1
      },
        bspPrices: {
            "1/8": process.env.REACT_APP_BSP_PRICE_1_8,
            "1/4": process.env.REACT_APP_BSP_PRICE_1_4,
            "3/8": process.env.REACT_APP_BSP_PRICE_3_8,
            "1/2": process.env.REACT_APP_BSP_PRICE_1_2,
            "3/4": process.env.REACT_APP_BSP_PRICE_3_4,
            "1": process.env.REACT_APP_BSP_PRICE_1
        },
        jicPrices: {
            "7/16": process.env.REACT_APP_JIC_PRICE_7_16,
            "9/16": process.env.REACT_APP_JIC_PRICE_9_16,
            "3/4": process.env.REACT_APP_JIC_PRICE_3_4,
            "7/8": process.env.REACT_APP_JIC_PRICE_7_8,
            "1-1/16": process.env.REACT_APP_JIC_PRICE_1_1_16,
            "1-3/16": process.env.REACT_APP_JIC_PRICE_1_3_16
        },
        metricPrices: {
          "M12": process.env.REACT_APP_METRIC_PRICE_M12,
          "M14": process.env.REACT_APP_METRIC_PRICE_M14,
          "M16": process.env.REACT_APP_METRIC_PRICE_M16,
          "M18": process.env.REACT_APP_METRIC_PRICE_M18,
          "M22": process.env.REACT_APP_METRIC_PRICE_M22,
          "M26": process.env.REACT_APP_METRIC_PRICE_M26,
          "M30": process.env.REACT_APP_METRIC_PRICE_M30,
          "M36": process.env.REACT_APP_METRIC_PRICE_M36
      },
      orfsPrices: {
        "9/16": process.env.REACT_APP_ORFS_PRICE_9_16,
        "11/16": process.env.REACT_APP_ORFS_PRICE_11_16,
        "13/16": process.env.REACT_APP_ORFS_PRICE_13_16,
        "1": process.env.REACT_APP_ORFS_PRICE_1,
        "1-3/16": process.env.REACT_APP_ORFS_PRICE_1_3_16
    }
    });
});

// PayPal endpoint - now using server key auth
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
        'api-key': BREVO_API_KEY
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
          'api-key': BREVO_API_KEY
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
