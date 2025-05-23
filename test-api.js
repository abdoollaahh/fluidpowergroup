// enhanced-test.js - More detailed debugging
const axios = require('axios');

const PRODUCTION_URL = 'https://fluidpowergroup-9d3bhmaau-fluidpower.vercel.app';

async function detailedTest() {
  console.log('\n🔍 DETAILED API TESTING');
  console.log('========================\n');

  // Test 1: Check what categories actually returns
  try {
    console.log('1. Testing Categories API Response Structure:');
    const catResponse = await axios.get(`${PRODUCTION_URL}/api/categories`);
    console.log('Raw response data:', JSON.stringify(catResponse.data, null, 2));
    console.log('Type of categories:', typeof catResponse.data.categories);
    console.log('Is array?:', Array.isArray(catResponse.data.categories));
  } catch (error) {
    console.log('Categories failed:', error.message);
  }

  console.log('\n------------------------\n');

  // Test 2: Check the external API directly
  try {
    console.log('2. Testing External Categories API Directly:');
    const extResponse = await axios.get('https://fluidpowergroup.com.au/api/getCategories');
    console.log('External API response (first 500 chars):', JSON.stringify(extResponse.data).substring(0, 500));
    console.log('Response type:', typeof extResponse.data);
    console.log('Is array?:', Array.isArray(extResponse.data));
    if (Array.isArray(extResponse.data) && extResponse.data.length > 0) {
      console.log('First item structure:', JSON.stringify(extResponse.data[0], null, 2));
    }
  } catch (error) {
    console.log('External API failed:', error.message);
  }

  console.log('\n------------------------\n');

  // Test 3: Try different series endpoints
  console.log('3. Testing Various Series Endpoints:');
  
  const seriesEndpoints = [
    'https://fluidpowergroup.com.au/api/getSeries?categoryId=1',
    'https://fluidpowergroup.com.au/api/getSeries?id=1',
    'https://fluidpowergroup.com.au/api/series?categoryId=1',
    'https://fluidpowergroup.com.au/api/getProducts?categoryId=1'
  ];

  for (const endpoint of seriesEndpoints) {
    try {
      console.log(`\nTrying: ${endpoint}`);
      const response = await axios.get(endpoint);
      console.log('✅ Success! Status:', response.status);
      console.log('Response preview:', JSON.stringify(response.data).substring(0, 200));
      break; // Stop if we find a working endpoint
    } catch (error) {
      console.log('❌ Failed:', error.response?.status || error.message);
    }
  }
}

detailedTest();