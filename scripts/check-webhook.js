const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

async function checkWebhook() {
  const env = loadEnvFile();
  const token = env.TELEGRAM_BOT_TOKEN;
  
  console.log('🔍 Checking webhook status...\n');
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const data = await response.json();
    
    console.log('📊 Webhook Info:', JSON.stringify(data.result, null, 2));
    
    if (data.result.url) {
      console.log('\n✅ Webhook is active!');
      console.log('🔗 URL:', data.result.url);
      console.log('📝 Pending updates:', data.result.pending_update_count);
      
      if (data.result.last_error_message) {
        console.log('\n⚠️  Last error:', data.result.last_error_message);
        console.log('🕐 Error time:', new Date(data.result.last_error_date * 1000));
      } else {
        console.log('\n✨ No errors - webhook is working perfectly!');
      }
    } else {
      console.log('\n❌ No webhook is set');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkWebhook();