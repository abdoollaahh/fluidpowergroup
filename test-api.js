// test-api.js - Run this locally to test your API routes
const axios = require('axios');

// IMPORTANT: Update this to your actual Vercel deployment URL
const PRODUCTION_URL = 'https://fluidpowergroup-bhif7ffhv-fluidpower.vercel.app'; // <- Replace with your actual URL
const LOCAL_URL = 'http://localhost:3000';

// Set which environment to test
const TEST_PRODUCTION = true; // Set to false to test locally

const BASE_URL = TEST_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;

async function testAPIs() {
  console.log(`\nTesting APIs at: ${BASE_URL}`);
  console.log('================================\n');

  // Test Categories API
  try {
    console.log('Testing Categories API...');
    const startTime = Date.now();
    const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`);
    const endTime = Date.now();
    
    console.log('✅ Categories API Success');
    console.log(`Response time: ${endTime - startTime}ms`);
    console.log('Status:', categoriesResponse.status);
    console.log('Headers:', categoriesResponse.headers);
    console.log('Response structure:', Object.keys(categoriesResponse.data));
    console.log('Categories count:', categoriesResponse.data.categories?.length || 'N/A');
    if (categoriesResponse.data.categories?.length > 0) {
      console.log('First category:', JSON.stringify(categoriesResponse.data.categories[0], null, 2));
    }
  } catch (error) {
    console.log('❌ Categories API Failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      console.log('Error data:', error.response.data);
    } else if (error.request) {
      console.log('No response received');
      console.log('Request:', error.request);
    } else {
      console.log('Error:', error.message);
    }
  }

  console.log('\n--------------------------------\n');

  // Test Series API
  try {
    console.log('Testing Series API...');
    const startTime = Date.now();
    const seriesResponse = await axios.post(`${BASE_URL}/api/series`, { id: '1' });
    const endTime = Date.now();
    
    console.log('✅ Series API Success');
    console.log(`Response time: ${endTime - startTime}ms`);
    console.log('Status:', seriesResponse.status);
    console.log('Headers:', seriesResponse.headers);
    console.log('Response structure:', Object.keys(seriesResponse.data));
    console.log('Series count:', seriesResponse.data.series?.length || 'N/A');
    if (seriesResponse.data.series?.length > 0) {
      console.log('First series:', JSON.stringify(seriesResponse.data.series[0], null, 2));
    }
  } catch (error) {
    console.log('❌ Series API Failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      console.log('Error data:', error.response.data);
    } else if (error.request) {
      console.log('No response received');
    } else {
      console.log('Error:', error.message);
    }
  }

  console.log('\n================================\n');
  
  // Test if we're getting CORS errors by checking the external API directly
  console.log('Testing direct access to external API (this should fail with CORS in browser but work in Node.js):');
  try {
    const directResponse = await axios.get('https://fluidpowergroup.com.au/api/getCategories');
    console.log('✅ Direct API access works from Node.js');
    console.log('Response has data:', !!directResponse.data);
  } catch (error) {
    console.log('❌ Direct API access failed');
    console.log('Error:', error.message);
  }
}

// Run the tests
testAPIs();