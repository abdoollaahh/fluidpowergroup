// lib/order-queue.js
// Queue management for email processing using Vercel KV (Redis)

import { kv } from '@vercel/kv';

const QUEUE_KEY = 'order-email-queue';
const PROCESSING_KEY = 'order-email-processing';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60000; // 1 minute

/**
 * Add an order to the email processing queue
 * @param {Object} orderData - Complete order data for email processing
 * @returns {Promise<boolean>} Success status
 */
export async function addToQueue(orderData) {
    try {
        const queueItem = {
            id: `${orderData.orderNumber}-${Date.now()}`,
            orderNumber: orderData.orderNumber,
            paypalOrderID: orderData.orderID,
            paypalCaptureID: orderData.paypalCaptureID,
            userDetails: orderData.userDetails,
            websiteProducts: orderData.websiteProducts || [],
            pwaOrders: orderData.pwaOrders || [],
            totals: orderData.totals,
            testingMode: orderData.testingMode || false,
            addedAt: new Date().toISOString(),
            retries: 0,
            status: 'pending'
        };

        // Add to queue (LPUSH - add to left/head of list)
        await kv.lpush(QUEUE_KEY, JSON.stringify(queueItem));
        
        console.log(`✅ Added order ${orderData.orderNumber} to email queue`);
        return true;
    } catch (error) {
        console.error('❌ Failed to add order to queue:', error);
        return false;
    }
}

/**
 * Get next batch of orders to process from queue
 * @param {number} batchSize - Number of orders to fetch
 * @returns {Promise<Array>} Array of order objects
 */
export async function getNextBatch(batchSize = 5) {
    try {
        // Get items from right/tail of list (FIFO)
        const items = await kv.rpop(QUEUE_KEY, batchSize);
        
        if (!items || items.length === 0) {
            return [];
        }

        // Parse JSON strings back to objects
        const orders = Array.isArray(items) 
            ? items.map(item => JSON.parse(item))
            : [JSON.parse(items)];

        console.log(`📦 Retrieved ${orders.length} order(s) from queue`);
        return orders;
    } catch (error) {
        console.error('❌ Failed to get orders from queue:', error);
        return [];
    }
}

/**
 * Mark an order as being processed (to prevent duplicate processing)
 * @param {string} orderId - Unique order identifier
 * @returns {Promise<boolean>} Success status
 */
export async function markAsProcessing(orderId) {
    try {
        // Set with 10-minute expiration (in case processing fails)
        await kv.set(`${PROCESSING_KEY}:${orderId}`, 'processing', {
            ex: 600 // 10 minutes in seconds
        });
        return true;
    } catch (error) {
        console.error('❌ Failed to mark order as processing:', error);
        return false;
    }
}

/**
 * Check if an order is currently being processed
 * @param {string} orderId - Unique order identifier
 * @returns {Promise<boolean>} True if being processed
 */
export async function isProcessing(orderId) {
    try {
        const status = await kv.get(`${PROCESSING_KEY}:${orderId}`);
        return status === 'processing';
    } catch (error) {
        console.error('❌ Failed to check processing status:', error);
        return false;
    }
}

/**
 * Remove processing lock after completion
 * @param {string} orderId - Unique order identifier
 */
export async function clearProcessing(orderId) {
    try {
        await kv.del(`${PROCESSING_KEY}:${orderId}`);
    } catch (error) {
        console.error('❌ Failed to clear processing lock:', error);
    }
}

/**
 * Re-queue an order that failed processing (with retry limit)
 * @param {Object} orderData - Order data to re-queue
 * @returns {Promise<boolean>} Success status
 */
export async function requeueOrder(orderData) {
    try {
        if (orderData.retries >= MAX_RETRIES) {
            console.error(`❌ Order ${orderData.orderNumber} exceeded max retries (${MAX_RETRIES})`);
            // Store in dead letter queue for manual review
            await kv.lpush('order-email-failed', JSON.stringify({
                ...orderData,
                failedAt: new Date().toISOString(),
                reason: 'max_retries_exceeded'
            }));
            return false;
        }

        // Increment retry count and add back to queue
        const updatedOrder = {
            ...orderData,
            retries: (orderData.retries || 0) + 1,
            lastRetryAt: new Date().toISOString(),
            status: 'retrying'
        };

        await kv.lpush(QUEUE_KEY, JSON.stringify(updatedOrder));
        console.log(`🔄 Re-queued order ${orderData.orderNumber} (retry ${updatedOrder.retries}/${MAX_RETRIES})`);
        return true;
    } catch (error) {
        console.error('❌ Failed to re-queue order:', error);
        return false;
    }
}

/**
 * Get queue statistics for monitoring
 * @returns {Promise<Object>} Queue stats
 */
export async function getQueueStats() {
    try {
        const queueLength = await kv.llen(QUEUE_KEY);
        const failedLength = await kv.llen('order-email-failed');
        
        return {
            pending: queueLength || 0,
            failed: failedLength || 0,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Failed to get queue stats:', error);
        return {
            pending: 0,
            failed: 0,
            error: error.message
        };
    }
}

/**
 * Clear all queues (use with caution - for testing only)
 */
export async function clearAllQueues() {
    try {
        await kv.del(QUEUE_KEY);
        await kv.del('order-email-failed');
        console.log('🗑️ Cleared all queues');
        return true;
    } catch (error) {
        console.error('❌ Failed to clear queues:', error);
        return false;
    }
}