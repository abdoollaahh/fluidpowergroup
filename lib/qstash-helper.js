// lib/qstash-helper.js
// QStash integration for background email processing

const QSTASH_URL = 'https://qstash.upstash.io/v2/publish';
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

/**
 * Push order to QStash for background email processing
 * @param {Object} orderData - Complete order data
 * @param {string} callbackUrl - Your /api/send-email endpoint URL
 * @returns {Promise<Object>} QStash response
 */
export async function pushToQStash(orderData, callbackUrl) {
    if (!QSTASH_TOKEN) {
        throw new Error('QSTASH_TOKEN environment variable not set');
    }

    try {
        const response = await fetch(QSTASH_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${QSTASH_TOKEN}`,
                'Content-Type': 'application/json',
                'Upstash-Method': 'POST',
                'Upstash-Forward-x-server-key': process.env.VALID_SERVER_KEY,
            },
            body: JSON.stringify({
                url: callbackUrl,
                body: JSON.stringify(orderData),
                retries: 3,
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`QStash push failed: ${error}`);
        }

        const result = await response.json();
        console.log(`✅ Order ${orderData.orderNumber} pushed to QStash. Message ID: ${result.messageId}`);
        
        return {
            success: true,
            messageId: result.messageId
        };

    } catch (error) {
        console.error('❌ Failed to push to QStash:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Prepare order data for email processing
 * @param {Object} params - Order parameters
 * @returns {Object} Formatted order data
 */
export function prepareEmailData(params) {
    const {
        orderNumber,
        orderID,
        paypalCaptureID,
        userDetails,
        websiteProducts,
        pwaOrders,
        totals,
        testingMode
    } = params;

    // Extract PDF attachments
    const pdfAttachments = pwaOrders
        .filter(order => order.pdfDataUrl)
        .map(order => {
            const base64Data = order.pdfDataUrl.split(',')[1];
            return {
                name: `Custom-Hose-Assembly-${order.cartId || 'order'}.pdf`,
                contentBytes: base64Data
            };
        });

    // Generate email templates (reusing your existing logic)
    const emailTemplates = generateEmailTemplates(
        orderNumber,
        userDetails,
        websiteProducts,
        pwaOrders,
        totals,
        paypalCaptureID,
        testingMode
    );

    return {
        orderNumber,
        userDetails,
        userEmail: userDetails.email,
        emailTemplates,
        pdfAttachments: pdfAttachments.length > 0 ? pdfAttachments : null,
        testingMode
    };
}

/**
 * Generate email templates (copied from capture-order.js)
 */
function generateEmailTemplates(orderNumber, userDetails, websiteProducts, pwaOrders, totals, paypalCaptureID, TESTING_MODE) {
    const currentDate = new Date().toLocaleDateString('en-AU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const businessEmailDisplay = TESTING_MODE 
        ? process.env.BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au'
        : process.env.BUSINESS_EMAIL;

    // Customer Email Template
    const customerEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="background-color: #e74c3c; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Thank You for Your Order!</h1>
                </div>
                <div style="padding: 30px 20px;">
                    <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                        Hi ${userDetails.firstName} ${userDetails.lastName},
                    </p>
                    <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                        We've received your order and will begin processing it right away. Here are your order details:
                    </p>
                    <div style="background-color: #f8f9fa; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
                        <p style="margin: 5px 0; color: #333333;"><strong>Order Number:</strong> #${orderNumber}</p>
                        <p style="margin: 5px 0; color: #333333;"><strong>Order Date:</strong> ${currentDate}</p>
                        <p style="margin: 5px 0; color: #333333;"><strong>PayPal Transaction ID:</strong> ${paypalCaptureID}</p>
                    </div>
                    ${websiteProducts.length > 0 ? `
                    <h2 style="color: #e74c3c; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
                        Website Products
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${websiteProducts.map(product => `
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                        ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; vertical-align: middle; border-radius: 4px;">` : ''}
                                        <span style="vertical-align: middle;">${product.name}</span>
                                    </td>
                                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${product.quantity}</td>
                                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">$${(product.price * product.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ` : ''}
                    ${pwaOrders.length > 0 ? `
                    <h2 style="color: #e74c3c; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
                        Custom Hose Assemblies
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Assembly</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pwaOrders.map(order => `
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                        ${order.image ? `<img src="${order.image}" alt="${order.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; vertical-align: middle; border-radius: 4px;">` : ''}
                                        <span style="vertical-align: middle;">${order.name}</span>
                                    </td>
                                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${order.quantity}</td>
                                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">$${order.totalPrice.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">
                        📎 Detailed specifications for your custom hose assemblies are attached to this email as PDF files.
                    </p>
                    ` : ''}
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #333333;">Subtotal:</td>
                                <td style="padding: 8px 0; text-align: right; color: #333333;">$${totals.subtotal.toFixed(2)}</td>
                            </tr>
                            ${totals.discount > 0 ? `
                            <tr>
                                <td style="padding: 8px 0; color: #28a745;">Discount:</td>
                                <td style="padding: 8px 0; text-align: right; color: #28a745;">-$${totals.discount.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            ${totals.shipping > 0 ? `
                            <tr>
                                <td style="padding: 8px 0; color: #333333;">Shipping:</td>
                                <td style="padding: 8px 0; text-align: right; color: #333333;">$${totals.shipping.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 8px 0; color: #333333;">GST (10%):</td>
                                <td style="padding: 8px 0; text-align: right; color: #333333;">$${totals.gst.toFixed(2)}</td>
                            </tr>
                            <tr style="border-top: 2px solid #dee2e6;">
                                <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #e74c3c;">Total:</td>
                                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #e74c3c;">$${totals.total.toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
                    <div style="margin-top: 30px;">
                        <h3 style="color: #e74c3c; font-size: 18px; margin-bottom: 10px;">Shipping Address</h3>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <p style="margin: 5px 0; color: #333333;">${userDetails.firstName} ${userDetails.lastName}</p>
                            ${userDetails.companyName ? `<p style="margin: 5px 0; color: #333333;">${userDetails.companyName}</p>` : ''}
                            <p style="margin: 5px 0; color: #333333;">${userDetails.address}</p>
                            <p style="margin: 5px 0; color: #333333;">${userDetails.city}, ${userDetails.state} ${userDetails.postcode}</p>
                            <p style="margin: 5px 0; color: #333333;">${userDetails.country}</p>
                        </div>
                    </div>
                    <div style="margin-top: 30px; padding: 20px; background-color: #e8f4f8; border-radius: 8px;">
                        <h3 style="color: #e74c3c; font-size: 18px; margin-top: 0;">What's Next?</h3>
                        <ul style="color: #333333; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                            <li>We'll prepare your order for shipment</li>
                            <li>You'll receive a tracking number once shipped</li>
                            <li>Contact us if you have any questions</li>
                        </ul>
                    </div>
                    <div style="margin-top: 30px; text-align: center; color: #666666; font-size: 14px;">
                        <p>Questions about your order?</p>
                        <p style="color: #e74c3c; font-weight: bold;">${businessEmailDisplay}</p>
                    </div>
                </div>
                <div style="background-color: #333333; color: #ffffff; padding: 20px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} FluidPower Group. All rights reserved.</p>
                    ${TESTING_MODE ? '<p style="margin: 10px 0 0 0; color: #ffc107;">⚠️ TEST MODE - This is a test order</p>' : ''}
                </div>
            </div>
        </body>
        </html>
    `;

    // Business email template (shortened for brevity - use same pattern)
    const businessEmailContent = `<!-- Similar structure for business notification -->`;

    return {
        customerEmailContent,
        businessEmailContent
    };
}