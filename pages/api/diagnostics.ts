import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const startTime = Date.now();
  let diagnostics: any = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {},
    totalTime: 0
  };

  try {
    // Test 1: Basic Swell connection
    console.log('Testing basic Swell connection...');
    let testStart = Date.now();
    
    try {
      const basicTest: any = await Promise.race([
        swell.get('/categories', { limit: 1 }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000)
        )
      ]);
      
      diagnostics.tests.push({
        name: 'Basic Swell Connection',
        status: 'SUCCESS',
        time: Date.now() - testStart,
        details: `Fetched ${basicTest.results?.length || 0} categories`
      });
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'Basic Swell Connection', 
        status: 'FAILED',
        time: Date.now() - testStart,
        error: error.message,
        details: error.response?.status ? `HTTP ${error.response.status}` : 'Network error'
      });
    }

    // Test 2: Larger data fetch
    console.log('Testing larger data fetch...');
    testStart = Date.now();
    
    try {
      const largeTest: any = await Promise.race([
        swell.get('/categories', { limit: 50 }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Large fetch timeout after 15s')), 15000)
        )
      ]);
      
      diagnostics.tests.push({
        name: 'Larger Data Fetch (50 items)',
        status: 'SUCCESS', 
        time: Date.now() - testStart,
        details: `Fetched ${largeTest.results?.length || 0} categories`
      });
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'Larger Data Fetch (50 items)',
        status: 'FAILED',
        time: Date.now() - testStart,
        error: error.message,
        details: error.response?.status ? `HTTP ${error.response.status}` : 'Network error'
      });
    }

    // Test 3: Check API limits/authentication
    console.log('Testing API authentication...');
    testStart = Date.now();
    
    try {
      // Try to get store info (usually requires proper auth)
      const authTest: any = await Promise.race([
        swell.get('/account'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth test timeout after 5s')), 5000)
        )
      ]);
      
      diagnostics.tests.push({
        name: 'API Authentication',
        status: 'SUCCESS',
        time: Date.now() - testStart,
        details: 'Authentication working'
      });
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'API Authentication',
        status: error.response?.status === 401 ? 'AUTH_ISSUE' : 'FAILED',
        time: Date.now() - testStart,
        error: error.message,
        details: error.response?.status ? `HTTP ${error.response.status}` : 'Network error'
      });
    }

  } catch (generalError: any) {
    diagnostics.tests.push({
      name: 'General Error',
      status: 'FAILED',
      time: Date.now() - startTime,
      error: generalError.message
    });
  }

  diagnostics.totalTime = Date.now() - startTime;
  
  // Generate summary
  const successful = diagnostics.tests.filter((t: any) => t.status === 'SUCCESS').length;
  const failed = diagnostics.tests.filter((t: any) => t.status === 'FAILED').length;
  const authIssues = diagnostics.tests.filter((t: any) => t.status === 'AUTH_ISSUE').length;
  
  diagnostics.summary = {
    successful,
    failed, 
    authIssues,
    overallStatus: failed > 0 ? 'ISSUES_DETECTED' : 'HEALTHY'
  };

  // Return diagnostics regardless of test results
  console.log('Diagnostics completed:', diagnostics);
  res.status(200).json(diagnostics);

};

export default handler;