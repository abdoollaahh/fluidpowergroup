import { NextApiRequest, NextApiResponse } from 'next';
import { updateConversation, getConversation } from '../../../utils/db';
import { sendTelegramMessage } from '../../../utils/telegram';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔔 Webhook received:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const update = req.body;
    const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    
    // Handle callback queries from "Reply" button
    if (update.callback_query) {
      console.log('🔘 Button callback detected');
      
      const callbackData = update.callback_query.data;
      
      if (callbackData.startsWith('reply_')) {
        const customerId = callbackData.replace('reply_', '');
        
        console.log('📤 Setting active customer for chat:', chatId);
        
        // Store which customer this chat is replying to (expires in 1 hour)
        await redis.set(`reply_context:${chatId}`, customerId, { ex: 3600 });
        
        await sendTelegramMessage(
          chatId.toString(),
          `💬 Ready to reply to customer ${customerId}\n\n👉 Send your message now (it will be sent to the customer)`,
        );
        
        console.log('✅ Reply context set');
      }
    }
    
    // Handle incoming messages (replies from supplier)
    if (update.message && update.message.text) {
      console.log('💬 Message received from supplier');
      
      let customerId: string | null = null;
      
      // Method 1: Check if this is a direct reply to a bot message
      if (update.message.reply_to_message) {
        const originalMessage = update.message.reply_to_message.text;
        const customerIdMatch = originalMessage.match(/ID: (cust_\w+)\)/);
        
        if (customerIdMatch && customerIdMatch[1]) {
          customerId = customerIdMatch[1];
          console.log('✅ Customer ID found from reply:', customerId);
        }
      }
      
      // Method 2: Check if there's an active reply context from clicking "Reply" button
      if (!customerId) {
        const contextCustomerId = await redis.get<string>(`reply_context:${chatId}`);
        if (contextCustomerId) {
          customerId = contextCustomerId;
          console.log('✅ Customer ID found from context:', customerId);
          
          // Clear the context after use
          await redis.del(`reply_context:${chatId}`);
        }
      }
      
      // Save the reply if we found a customer ID
      if (customerId) {
        const replyText = update.message.text;
        
        console.log('💾 Saving reply for customer:', customerId);
        console.log('💬 Reply text:', replyText);
        
        await updateConversation(customerId, {
          sender: 'supplier',
          text: replyText,
          timestamp: new Date()
        });
        
        // Confirm to supplier
        await sendTelegramMessage(
          chatId.toString(),
          '✅ Message sent to customer!'
        );
        
        console.log('✅ Reply saved successfully');
      } else {
        console.log('⚠️  Could not determine which customer to reply to');
        
        await sendTelegramMessage(
          chatId.toString(),
          '⚠️ Please use the "Reply" button on customer messages to send replies.'
        );
      }
    }
    
    res.status(200).end('OK');
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}