import { NextApiRequest, NextApiResponse } from 'next';
import { updateConversation } from '../../../utils/db';
import { sendTelegramMessage } from '../../../utils/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const update = req.body;
    
    // Handle direct replies from supplier
    if (update.message && update.message.reply_to_message) {
      const originalMessage = update.message.reply_to_message.text;
      const customerIdMatch = originalMessage.match(/ID: (cust_\w+)\)/);
      
      if (customerIdMatch && customerIdMatch[1]) {
        const customerId = customerIdMatch[1];
        const replyText = update.message.text;
        
        await updateConversation(customerId, {
          sender: 'supplier',
          text: replyText,
          timestamp: new Date()
        });
      }
    }
    
    // Handle callback queries from "Reply" button
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.message.chat.id;
      
      if (callbackData.startsWith('reply_')) {
        const customerId = callbackData.replace('reply_', '');
        
        await sendTelegramMessage(
          chatId.toString(),
          `Reply to customer (ID: ${customerId}):`,
          {
            reply_to_message_id: update.callback_query.message.message_id
          }
        );
      }
    }
    
    res.status(200).end('OK');
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}