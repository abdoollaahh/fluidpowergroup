// lib/checkout/form-validation.ts
// REFACTOR PHASE 3 - EXTRACTED FROM checkout.tsx
// Form validation logic for shipping details

import { AustralianState } from './checkout-config';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Shipping details form data structure
 */
export interface ShippingDetails {
  name: string;
  companyName: string;
  address: string;
  suburb: string;
  state: AustralianState | string;
  postcode: string;
  email: string;
  contactNumber: string;
}

/**
 * Validation errors object
 * Keys match ShippingDetails field names
 */
export type ValidationErrors = Partial<Record<keyof ShippingDetails, string>>;

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Email validation regex
 * Format: username@domain.tld (with optional subdomains)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._]+@[a-zA-Z]{2,}\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})*$/;

/**
 * Suburb validation regex (letters and spaces only)
 */
const SUBURB_REGEX = /^[a-zA-Z\s]+$/;

/**
 * Postcode validation regex (exactly 4 digits)
 */
const POSTCODE_REGEX = /^\d{4}$/;

/**
 * Contact number validation regex (exactly 10 digits)
 */
const CONTACT_NUMBER_REGEX = /^\d{10}$/;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a single form field based on field name and value
 * 
 * @param name - The field name to validate
 * @param value - The current value of the field
 * @returns Error message string, or empty string if valid
 */
export function validateField(name: keyof ShippingDetails, value: string): string {
  let error = '';
  
  switch (name) {
    case 'name':
    case 'address':
      if (value.trim() === '') {
        error = 'This field is required';
      }
      break;

    case 'suburb':
      if (value.trim() === '') {
        error = 'This field is required';
      } else if (!SUBURB_REGEX.test(value)) {
        error = 'Please enter letters only';
      }
      break;

    case 'state':
      if (value === 'Select State') {
        error = 'Please select a state';
      }
      break;

    case 'postcode':
      if (value.trim() === '') {
        error = 'This field is required';
      } else if (!POSTCODE_REGEX.test(value)) {
        error = 'Please enter 4 digits';
      }
      break;

    case 'email':
      if (value.trim() === '') {
        error = 'This field is required';
      } else if (!EMAIL_REGEX.test(value)) {
        error = 'Please enter a valid email address';
      }
      break;

    case 'contactNumber':
      if (value.trim() === '') {
        error = 'This field is required';
      } else if (!CONTACT_NUMBER_REGEX.test(value)) {
        error = 'Contact number must be 10 digits';
      }
      break;

    case 'companyName':
      // Company name is optional, no validation needed
      break;

    default:
      // Unknown field, no validation
      break;
  }
  
  return error;
}

/**
 * Validates all required fields in the shipping details form
 * 
 * @param shippingDetails - The complete shipping details object to validate
 * @returns Object containing validation errors (empty if all valid)
 */
export function validateAllFields(shippingDetails: ShippingDetails): ValidationErrors {
  const newErrors: ValidationErrors = {};
  let hasErrors = false;
  
  // Validate all fields except optional companyName
  (Object.entries(shippingDetails) as [keyof ShippingDetails, string][]).forEach(([fieldName, value]) => {
    if (fieldName !== 'companyName') {
      const error = validateField(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    }
  });
  
  return newErrors;
}

/**
 * Checks if there are any validation errors
 * 
 * @param errors - The validation errors object
 * @returns true if there are errors, false otherwise
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Creates an empty shipping details object with default values
 * 
 * @returns Empty ShippingDetails object
 */
export function createEmptyShippingDetails(): ShippingDetails {
  return {
    name: '',
    companyName: '',
    address: '',
    suburb: '',
    state: 'Select State',
    postcode: '',
    email: '',
    contactNumber: ''
  };
}

/**
 * Checks if shipping details form is complete and valid
 * 
 * @param shippingDetails - The shipping details to check
 * @returns true if form is valid and complete, false otherwise
 */
export function isShippingFormValid(shippingDetails: ShippingDetails): boolean {
  const errors = validateAllFields(shippingDetails);
  return !hasValidationErrors(errors);
}