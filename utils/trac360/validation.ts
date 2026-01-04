/**
 * TRAC360 Validation Utilities
 * Validates configuration at each step to enable/disable Continue button
 */

import {
  Trac360Config,
  TractorInfo,
  ValveSetup,
  OperationType,
  Circuit,
  Trac360Step,
  ValidationResult,
} from 'types/trac360';

// ============================================================================
// STEP-SPECIFIC VALIDATION
// ============================================================================

/**
 * Validate Step 1: Tractor Info
 * Requires: brand, model, driveType, protectionType
 * 
 * @param info - Tractor information object
 * @returns Validation result with errors if any
 */
export function validateTractorInfo(info: TractorInfo): ValidationResult {
  const errors: string[] = [];
  
  if (!info.brand) errors.push('Please select a tractor brand');
  if (!info.model) errors.push('Please select a tractor model');
  if (!info.driveType) errors.push('Please select drive type (2WD/4WD)');
  if (!info.protectionType) errors.push('Please select protection type (CAB/ROPS)');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Step 2: Valve Setup
 * Requires: At least one valve location selected
 * 
 * @param setup - Valve setup object
 * @returns Validation result
 */
export function validateValveSetup(setup: ValveSetup | null): ValidationResult {
  const errors: string[] = [];
  
  if (!setup) {
    errors.push('Please select a valve mounting position');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Step 3: Operation Type
 * Requires: One operation type selected
 * 
 * @param type - Operation type object
 * @returns Validation result
 */
export function validateOperationType(type: OperationType | null): ValidationResult {
  const errors: string[] = [];
  
  if (!type) {
    errors.push('Please select an operation type');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Step 4: Circuits
 * Requires: One circuit count selected
 * 
 * @param circuits - Circuit configuration object
 * @returns Validation result
 */
export function validateCircuits(circuits: Circuit | null): ValidationResult {
  const errors: string[] = [];
  
  if (!circuits) {
    errors.push('Please select number of circuits');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Step 5: Add-ons
 * All optional - always valid
 * However, if addon has subOptions, one must be selected
 * 
 * @param addons - Array of selected addons
 * @returns Validation result
 */
export function validateAddons(addons: any[]): ValidationResult {
  const errors: string[] = [];
  
  // Check if any addon with subOptions is missing a selection
  addons.forEach(addon => {
    if (addon.subOptions && addon.subOptions.length > 0 && !addon.selectedSubOption) {
      errors.push(`Please select an option for "${addon.name}"`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Step 6: Summary
 * All fields optional (additional info is textarea)
 * 
 * @returns Always valid
 */
export function validateSummary(): ValidationResult {
  return {
    isValid: true,
    errors: [],
  };
}

// ============================================================================
// OVERALL VALIDATION
// ============================================================================

/**
 * Check if user can proceed from current step
 * Used to enable/disable Continue button
 * 
 * @param step - Current step identifier
 * @param config - Current configuration state
 * @returns True if user can proceed
 * 
 * @example
 * const canProceed = canProceedFromStep('tractor-info', config);
 * <button disabled={!canProceed}>Continue</button>
 */
export function canProceedFromStep(step: Trac360Step, config: Trac360Config): boolean {
  switch (step) {
    case 'start':
      return true; // Landing page, no validation
    
    case 'tractor-info':
      return validateTractorInfo(config.tractorInfo).isValid;
    
    case 'valve-setup':
      return validateValveSetup(config.valveSetup).isValid;
    
    case 'operation-type':
      return validateOperationType(config.operationType).isValid;
    
    case 'circuits':
      return validateCircuits(config.circuits).isValid;
    
    case 'addons':
      return validateAddons(config.addons).isValid;
    
    case 'summary':
      return validateSummary().isValid;
    
    default:
      return false;
  }
}

/**
 * Validate entire configuration before adding to cart
 * Ensures all required steps are complete
 * 
 * @param config - Complete configuration
 * @returns Validation result with all errors
 * 
 * @example
 * const result = validateFullConfig(config);
 * if (!result.isValid) {
 *   alert(result.errors.join('\n'));
 * }
 */
export function validateFullConfig(config: Trac360Config): ValidationResult {
  const allErrors: string[] = [];
  
  // Validate each step
  const tractorResult = validateTractorInfo(config.tractorInfo);
  const valveResult = validateValveSetup(config.valveSetup);
  const operationResult = validateOperationType(config.operationType);
  const circuitsResult = validateCircuits(config.circuits);
  const addonsResult = validateAddons(config.addons);
  
  // Collect all errors
  allErrors.push(...tractorResult.errors);
  allErrors.push(...valveResult.errors);
  allErrors.push(...operationResult.errors);
  allErrors.push(...circuitsResult.errors);
  allErrors.push(...addonsResult.errors);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

// ============================================================================
// COMPATIBILITY VALIDATION
// ============================================================================

/**
 * Check if valve setup is compatible with tractor protection type
 * 
 * @param valveSetup - Valve setup to check
 * @param protectionType - Tractor protection type ('cab' or 'rops')
 * @returns True if compatible
 * 
 * @example
 * const isCompatible = isValveCompatible(valveSetup, 'cab');
 */
export function isValveCompatible(
  valveSetup: ValveSetup,
  protectionType: 'cab' | 'rops'
): boolean {
  return valveSetup.compatibleWith.includes(protectionType);
}

/**
 * Check if operation type is compatible with tractor protection type
 * 
 * @param operationType - Operation type to check
 * @param protectionType - Tractor protection type ('cab' or 'rops')
 * @returns True if compatible
 */
export function isOperationCompatible(
  operationType: OperationType,
  protectionType: 'cab' | 'rops'
): boolean {
  return operationType.compatibleWith.includes(protectionType);
}

/**
 * Filter valve setups by compatibility with protection type
 * 
 * @param valveSetups - All available valve setups
 * @param protectionType - Tractor protection type
 * @returns Filtered array of compatible valve setups
 */
export function filterCompatibleValves(
  valveSetups: ValveSetup[],
  protectionType: 'cab' | 'rops' | null
): ValveSetup[] {
  if (!protectionType) return valveSetups;
  return valveSetups.filter(valve => isValveCompatible(valve, protectionType));
}

/**
 * Filter operation types by compatibility with protection type
 * 
 * @param operationTypes - All available operation types
 * @param protectionType - Tractor protection type
 * @returns Filtered array of compatible operation types
 */
export function filterCompatibleOperations(
  operationTypes: OperationType[],
  protectionType: 'cab' | 'rops' | null
): OperationType[] {
  if (!protectionType) return operationTypes;
  return operationTypes.filter(op => isOperationCompatible(op, protectionType));
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Get user-friendly error message for validation
 * 
 * @param step - Step that failed validation
 * @param errors - Array of error messages
 * @returns Formatted error string
 */
export function getValidationMessage(step: Trac360Step, errors: string[]): string {
  if (errors.length === 0) return '';
  
  const stepNames: Record<Trac360Step, string> = {
    'start': 'Start',
    'tractor-info': 'Tractor Information',
    'valve-setup': 'Valve Setup',
    'operation-type': 'Operation Type',
    'circuits': 'Circuit Selection',
    'addons': 'Add-ons',
    'summary': 'Summary',
  };
  
  return `${stepNames[step]}:\n${errors.join('\n')}`;
}

/**
 * Check if configuration is complete enough to add to cart
 * 
 * @param config - Current configuration
 * @returns True if ready for cart
 */
export function isReadyForCart(config: Trac360Config): boolean {
  return validateFullConfig(config).isValid;
}

/**
 * Get progress percentage (0-100)
 * Based on completed steps
 * 
 * @param config - Current configuration
 * @returns Progress percentage
 * 
 * @example
 * const progress = getProgressPercentage(config);
 * // 71 (5 out of 7 steps complete)
 */
export function getProgressPercentage(config: Trac360Config): number {
  let completed = 0;
  const totalSteps = 6; // Excluding 'start'
  
  if (validateTractorInfo(config.tractorInfo).isValid) completed++;
  if (validateValveSetup(config.valveSetup).isValid) completed++;
  if (validateOperationType(config.operationType).isValid) completed++;
  if (validateCircuits(config.circuits).isValid) completed++;
  if (validateAddons(config.addons).isValid) completed++;
  // Summary is always valid, so we count it if circuits is done
  if (config.circuits) completed++;
  
  return Math.round((completed / totalSteps) * 100);
}