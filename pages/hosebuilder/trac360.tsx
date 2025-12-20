import { useContext } from 'react';
import { CartContext } from 'context/CartWrapper';
import { IItemCart } from 'types/cart';

const Trac360Test = () => {
  const { addItem } = useContext(CartContext);

  const addTestTractor = () => {
    // Generate a simple test PDF (base64 encoded)
    const testPDF = generateTestPDF();

    const testTractor: IItemCart = {
      id: 'trac-360-test',
      type: 'trac360_order',
      name: 'John Deere 4066R - Custom Config',
      totalPrice: 52000,
      quantity: 1,
      stock: 999,
      cartId: Date.now(),
      image: '/cartImage.jpeg', // Use default cart image
      pdfDataUrl: testPDF,
      tractorConfig: {
        tractorType: 'Compact Utility',
        modelNumber: '4066R',
        driveType: '4WD',
        cabinType: 'Cab with A/C',
        valveLocation: 'Rear',
        selectedOptions: ['Front Loader', 'Rear Ballast'],
        basePrice: 48000,
        optionsPrice: 4000,
        totalPrice: 52000,
        productIds: ['test-product-id-1', 'test-product-id-2']
      }
    };

    addItem(testTractor);
    alert('Test tractor added to cart! Check your cart to see it.');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>
          Trac 360 Integration Test
        </h1>
        
        <p style={{ marginBottom: '20px', color: '#666', lineHeight: '1.6' }}>
          This test page will add a dummy tractor configuration to your cart.
          You can then test the full checkout flow including PDF generation and email delivery.
        </p>

        <div style={{
          background: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>Test Configuration:</h2>
          <ul style={{ listStyle: 'none', padding: 0, color: '#555' }}>
            <li>🚜 Model: John Deere 4066R</li>
            <li>⚙️ Drive: 4WD</li>
            <li>🏠 Cabin: Cab with A/C</li>
            <li>💰 Price: $52,000</li>
            <li>📦 Options: Front Loader, Rear Ballast</li>
          </ul>
        </div>

        <button
          onClick={addTestTractor}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Add Test Tractor to Cart
        </button>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#999', textAlign: 'center' }}>
          After adding to cart, navigate to your cart to see the item and test checkout.
        </p>
      </div>
    </div>
  );
};

// Generate a minimal test PDF
function generateTestPDF(): string {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 200 >>
stream
BT
/F1 24 Tf
50 700 Td
(TRACTOR CONFIGURATION) Tj
/F1 12 Tf
50 650 Td
(Model: John Deere 4066R) Tj
50 630 Td
(Drive Type: 4WD) Tj
50 610 Td
(Cabin: Cab with A/C) Tj
50 590 Td
(Options: Front Loader, Rear Ballast) Tj
50 570 Td
(Total Price: $52,000.00) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000304 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
556
%%EOF`;

  return `data:application/pdf;base64,${btoa(pdfContent)}`;
}

export default Trac360Test;