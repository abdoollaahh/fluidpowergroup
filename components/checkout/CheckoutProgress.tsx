// components/checkout/CheckoutProgress.tsx
// REFACTOR PHASE 1 - EXTRACTED FROM checkout.tsx
// Purely presentational component for checkout step progress indicator

interface CheckoutProgressProps {
    currentStep: 'shipping' | 'payment';
  }
  
  export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {/* Step 1: Shipping Details */}
          <div 
            className="px-6 py-3 rounded-full font-semibold transition-all flex flex-col items-center justify-center text-center"
            style={{
              minWidth: "140px",
              minHeight: "85px",
              ...(currentStep === 'shipping' ? {
                background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                border: "1px solid rgba(255, 215, 0, 0.9)",
                color: "#000",
                boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
              } : {
                background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(15px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                color: "#666",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.05)"
              })
            }}
          >
            <div>1.</div>
            <div>Shipping Details</div>
          </div>
  
          {/* Connector Line */}
          <div className="h-1 w-16 bg-gray-300 rounded" />
  
          {/* Step 2: Payment */}
          <div 
            className="px-6 py-3 rounded-full font-semibold transition-all flex flex-col items-center justify-center text-center"
            style={{
              minWidth: "140px",
              minHeight: "85px",
              ...(currentStep === 'payment' ? {
                background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                border: "1px solid rgba(255, 215, 0, 0.9)",
                color: "#000",
                boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
              } : {
                background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(15px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                color: "#666",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.05)"
              })
            }}
          >
            <div>2.</div>
            <div>Payment</div>
          </div>
        </div>
      </div>
    );
  }