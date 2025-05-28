// pages/api/test-response.js
export default function handler(req, res) {
    // Create a large response to test size limits
    const testData = {
      message: 'This is a test response',
      largeArray: Array(100).fill(null).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: 'This is a test item with some description text to make it larger',
        subItems: Array(5).fill(null).map((_, j) => ({
          subId: `${i}-${j}`,
          subName: `SubItem ${i}-${j}`,
          subDescription: 'Nested data to increase response size'
        }))
      }))
    };
    
    const responseSize = JSON.stringify(testData).length;
    console.log(`Test response size: ${responseSize} characters`);
    
    res.status(200).json({
      size: responseSize,
      data: testData
    });
  }