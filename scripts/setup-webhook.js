require('dotenv').config({ path: '.env.local' });

async function setupWebhook() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env.local');
    process.exit(1);
  }

  // Use your production domain
  const webhookUrl = 'https://fluidpowergroup.com.au/api/telegram/webhook';
  
  console.log('🔧 Setting up Telegram webhook...');
  console.log('📍 Webhook URL:', webhookUrl);
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`
    );
    const data = await response.json();
    
    console.log('\n📊 Response:', JSON.stringify(data, null, 2));
    
    if (data.ok) {
      console.log('\n✅ Webhook set up successfully!');
      console.log('🔗 Webhook URL:', data.result.url);
      console.log('✨ Telegram will now send updates to your server');
    } else {
      console.log('\n❌ Failed to set webhook:', data.description);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupWebhook();