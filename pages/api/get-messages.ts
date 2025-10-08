import { NextApiRequest, NextApiResponse } from 'next';
import { getConversation } from '../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { customerId } = req.query;
    
    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    const conversation = await getConversation(customerId);
    
    res.status(200).json({
      success: true,
      messages: conversation?.messages || []
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
}