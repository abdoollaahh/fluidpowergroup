const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
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

async function testUpstash() {
  const env = loadEnvFile();
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  
  console.log('🔧 Testing Upstash connection...\n');
  
  // Test write
  try {
    const writeResponse = await fetch(`${url}/set/test-key/test-value`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const writeData = await writeResponse.json();
    console.log('✅ Write test:', writeData);
  } catch (error) {
    console.error('❌ Write failed:', error.message);
  }
  
  // Test read
  try {
    const readResponse = await fetch(`${url}/get/test-key`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const readData = await readResponse.json();
    console.log('✅ Read test:', readData);
  } catch (error) {
    console.error('❌ Read failed:', error.message);
  }
  
  // Test conversation
  console.log('\n🔍 Checking for existing conversations...');
  try {
    const keysResponse = await fetch(`${url}/keys/conversation:*`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const keysData = await keysResponse.json();
    console.log('📦 Found conversations:', keysData);
  } catch (error) {
    console.error('❌ Keys lookup failed:', error.message);
  }
}

testUpstash();