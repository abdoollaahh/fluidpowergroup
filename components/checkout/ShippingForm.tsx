// components/checkout/ShippingForm.tsx
// REFACTOR PHASE 3 - EXTRACTED FROM checkout.tsx
// Shipping details form with validation and developer mode trigger

import { useState } from 'react';
import { 
  STATES, 
  DEVELOPER_MODE_CODE, 
  DEVELOPER_MODE_DEMO_DATA 
} from '../../lib/checkout/checkout-config';
import {
  ShippingDetails,
  ValidationErrors,
  validateField,
  validateAllFields,
  hasValidationErrors,
  createEmptyShippingDetails
} from '../../lib/checkout/form-validation';

interface ShippingFormProps {
  /** Callback when form is valid and user clicks Continue */
  onContinue: (shippingDetails: ShippingDetails) => void;
  /** Optional initial shipping details (for editing) */
  initialDetails?: ShippingDetails;
  /** Callback when developer mode is activated */
  onDeveloperModeActivated?: () => void;
}

export default function ShippingForm({ 
  onContinue, 
  initialDetails,
  onDeveloperModeActivated 
}: ShippingFormProps) {
  // Form state - PHASE 3: Moved from parent checkout.tsx
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>(
    initialDetails || createEmptyShippingDetails()
  );
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formSubmitAttempted, setFormSubmitAttempted] = useState(false);

  // ============================================================================
  // FIELD CHANGE HANDLERS
  // ============================================================================

  const handleFieldChange = (name: keyof ShippingDetails, value: string) => {
    // PHASE 3: Developer mode trigger (kept in form component)
    if (name === 'name' && value === DEVELOPER_MODE_CODE) {
      // Auto-fill demo data
      setShippingDetails(DEVELOPER_MODE_DEMO_DATA);
      
      // Notify parent that developer mode was activated
      if (onDeveloperModeActivated) {
        onDeveloperModeActivated();
      }
      
      // Show popup
      alert('🔧 Developer Mode Activated!\n\nPayment amount overridden to A$0.20\nDemo shipping details auto-filled');
      
      return;
    }
    
    // Update field value
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));

    // Show validation errors only after first submit attempt
    if (formSubmitAttempted) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleFieldBlur = (name: keyof ShippingDetails) => {
    if (formSubmitAttempted) {
      const error = validateField(name, shippingDetails[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const handleSubmit = () => {
    setFormSubmitAttempted(true);
    
    const validationErrors = validateAllFields(shippingDetails);
    setErrors(validationErrors);
    
    if (!hasValidationErrors(validationErrors)) {
      console.log('Shipping form valid, proceeding to payment');
      onContinue(shippingDetails);
    } else {
      console.log('Shipping form has errors:', validationErrors);
      alert('Please fill in all required fields correctly.');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Shipping Details</h2>
      <p className="text-sm text-red-600 mb-4">Fields marked with * are required</p>
      
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={shippingDetails.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            onBlur={() => handleFieldBlur('name')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.name 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Company Name (Optional) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Company Name <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="text"
            value={shippingDetails.companyName}
            onChange={(e) => handleFieldChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Address <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={shippingDetails.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            onBlur={() => handleFieldBlur('address')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.address 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.address && (
            <p className="text-red-600 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        {/* Suburb */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Suburb <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={shippingDetails.suburb}
            onChange={(e) => handleFieldChange('suburb', e.target.value)}
            onBlur={() => handleFieldBlur('suburb')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.suburb 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.suburb && (
            <p className="text-red-600 text-sm mt-1">{errors.suburb}</p>
          )}
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            State <span className="text-red-600">*</span>
          </label>
          <select
            value={shippingDetails.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            onBlur={() => handleFieldBlur('state')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.state 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          >
            {STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {formSubmitAttempted && errors.state && (
            <p className="text-red-600 text-sm mt-1">{errors.state}</p>
          )}
        </div>

        {/* Postcode */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Postcode <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={shippingDetails.postcode}
            onChange={(e) => handleFieldChange('postcode', e.target.value)}
            onBlur={() => handleFieldBlur('postcode')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.postcode 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.postcode && (
            <p className="text-red-600 text-sm mt-1">{errors.postcode}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            inputMode="email"
            value={shippingDetails.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.email 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Contact Number <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={shippingDetails.contactNumber}
            onChange={(e) => handleFieldChange('contactNumber', e.target.value)}
            onBlur={() => handleFieldBlur('contactNumber')}
            className={`w-full px-3 py-2 border-2 rounded-lg ${
              formSubmitAttempted && errors.contactNumber 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}
          />
          {formSubmitAttempted && errors.contactNumber && (
            <p className="text-red-600 text-sm mt-1">{errors.contactNumber}</p>
          )}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            className="mt-6 py-3 px-8 font-bold rounded-full transition-all duration-300"
            style={{
              background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
              border: "1px solid rgba(255, 215, 0, 0.9)",
              color: "#000",
              boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 15px 40px rgba(250, 204, 21, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 3px 10px rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0px) scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
            }}
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}