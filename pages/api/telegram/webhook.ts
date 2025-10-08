import { NextApiRequest, NextApiResponse } from 'next';
import { updateConversation } from '../../../utils/db';
import { sendTelegramMessage } from '../../../utils/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log everything that comes in
  console.log('🔔 Webhook received:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const update = req.body;
    
    // Handle direct replies from supplier
    if (update.message && update.message.reply_to_message) {
      console.log('📩 Reply detected');
      
      const originalMessage = update.message.reply_to_message.text;
      const customerIdMatch = originalMessage.match(/ID: (cust_\w+)\)/);
      
      console.log('🔍 Original message:', originalMessage);
      console.log('🔍 Customer ID match:', customerIdMatch);
      
      if (customerIdMatch && customerIdMatch[1]) {
        const customerId = customerIdMatch[1];
        const replyText = update.message.text;
        
        console.log('💾 Saving reply for customer:', customerId);
        console.log('💬 Reply text:', replyText);
        
        await updateConversation(customerId, {
          sender: 'supplier',
          text: replyText,
          timestamp: new Date()
        });
        
        console.log('✅ Reply saved successfully');
      } else {
        console.log('⚠️  No customer ID found in message');
      }
    }
    
    // Handle callback queries from "Reply" button
    if (update.callback_query) {
      console.log('🔘 Button callback detected');
      
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.message.chat.id;
      
      if (callbackData.startsWith('reply_')) {
        const customerId = callbackData.replace('reply_', '');
        
        console.log('📤 Prompting supplier to reply to:', customerId);
        
        await sendTelegramMessage(
          chatId.toString(),
          `Reply to customer (ID: ${customerId}):`,
          {
            reply_to_message_id: update.callback_query.message.message_id
          }
        );
        
        console.log('✅ Prompt sent');
      }
    }
    
    res.status(200).end('OK');
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}