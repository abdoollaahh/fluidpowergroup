import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface Message {
  sender: 'customer' | 'supplier';
  text: string;
  timestamp: Date;
}

export interface Conversation {
  customerId: string;
  customerName: string;
  lastActivity: Date;
  messages: Message[];
}

export async function getConversation(customerId: string): Promise<Conversation | null> {
  try {
    const conversation = await redis.get<Conversation>(`conversation:${customerId}`);
    return conversation || null;
  } catch (error) {
    console.error('Error getting conversation:', error);
    return null;
  }
}

export async function updateConversation(
  customerId: string,
  message: Partial<Message> & { customerName?: string }
): Promise<Conversation | null> {
  try {
    let conversation = await getConversation(customerId);
    
    if (!conversation) {
      conversation = {
        customerId,
        customerName: message.customerName || 'Guest',
        lastActivity: new Date(),
        messages: []
      };
    }
    
    if (message.sender && message.text) {
      conversation.messages.push({
        sender: message.sender,
        text: message.text,
        timestamp: message.timestamp || new Date()
      });
    }
    
    conversation.lastActivity = new Date();
    if (message.customerName) {
      conversation.customerName = message.customerName;
    }
    
    // Store with 30-day expiration (2592000 seconds)
    await redis.set(`conversation:${customerId}`, conversation, { ex: 2592000 });
    
    return conversation;
  } catch (error) {
    console.error('Error updating conversation:', error);
    return null;
  }
}