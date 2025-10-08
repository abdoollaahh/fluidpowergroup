import { NextApiRequest, NextApiResponse } from 'next';
import { updateConversation } from '../../../utils/db';
import { sendTelegramMessage } from '../../../utils/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { customerId, customerName, message } = req.body;
    
    if (!customerId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const formattedMessage = `📩 New message from ${customerName || 'Guest'} (ID: ${customerId}):\n\n${message}`;
    
    const telegramResponse = await sendTelegramMessage(
      process.env.TELEGRAM_CHAT_ID!,
      formattedMessage,
      {
        reply_markup: {
          inline_keyboard: [[{
            text: "Reply",
            callback_data: `reply_${customerId}`
          }]]
        }
      }
    );
    
    if (!telegramResponse.ok) {
      throw new Error(`Telegram API error: ${telegramResponse.description}`);
    }
    
    await updateConversation(customerId, {
      sender: 'customer',
      text: message,
      timestamp: new Date(),
      customerName: customerName || 'Guest'
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}