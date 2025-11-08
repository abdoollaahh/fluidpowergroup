// pages/api/admin/queue-stats.js
// Admin endpoint to check queue status
// Usage: GET /api/admin/queue-stats?secret=YOUR_CRON_SECRET

import { getQueueStats } from '../../../lib/order-queue.js';
import { kv } from '@vercel/kv';

const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req, res) {
    // Security: Require secret in query params
    const { secret } = req.query;
    
    if (!CRON_SECRET || secret !== CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Get basic stats
        const stats = await getQueueStats();
        
        // Get more detailed info
        const pendingOrders = await kv.llen('order-email-queue');
        const failedOrders = await kv.llen('order-email-failed');
        
        // Sample pending orders (first 3)
        const pendingSample = await kv.lrange('order-email-queue', 0, 2);
        const parsedPending = pendingSample.map(order => {
            try {
                const parsed = JSON.parse(order);
                return {
                    orderNumber: parsed.orderNumber,
                    addedAt: parsed.addedAt,
                    retries: parsed.retries,
                    status: parsed.status
                };
            } catch (e) {
                return { error: 'Parse error' };
            }
        });
        
        // Sample failed orders (first 3)
        const failedSample = await kv.lrange('order-email-failed', 0, 2);
        const parsedFailed = failedSample.map(order => {
            try {
                const parsed = JSON.parse(order);
                return {
                    orderNumber: parsed.orderNumber,
                    failedAt: parsed.failedAt,
                    reason: parsed.reason,
                    retries: parsed.retries
                };
            } catch (e) {
                return { error: 'Parse error' };
            }
        });
        
        return res.status(200).json({
            success: true,
            stats: {
                pending: pendingOrders,
                failed: failedOrders,
                timestamp: new Date().toISOString()
            },
            samples: {
                pending: parsedPending,
                failed: parsedFailed
            },
            health: {
                status: pendingOrders < 10 ? 'healthy' : 'warning',
                message: pendingOrders < 10 
                    ? 'Queue is processing normally' 
                    : `Queue has ${pendingOrders} pending orders - check cron job`
            }
        });
        
    } catch (error) {
        console.error('Error getting queue stats:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}