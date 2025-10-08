const TELEGRAM_API_BASE = 'https://api.telegram.org';

export async function setWebhook(webhookUrl: string): Promise<any> {
  try {
    const url = `${TELEGRAM_API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`;
    const response = await fetch(`${url}?url=${webhookUrl}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to set webhook:', error);
    throw error;
  }
}

export async function getWebhookInfo(): Promise<any> {
  try {
    const url = `${TELEGRAM_API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get webhook info:', error);
    throw error;
  }
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: any = {}
): Promise<any> {
  try {
    const url = `${TELEGRAM_API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options
      })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}