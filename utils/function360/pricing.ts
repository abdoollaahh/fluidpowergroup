import { Function360Config, SelectedComponents } from '../../types/function360';

// Component prices (matching JSON files)
const COMPONENT_PRICES: Record<keyof SelectedComponents, number> = {
  diverterValve: 500,
  quickCouplings: 500,
  adaptors: 500,
  hydraulicHoses: 500,
  electrical: 500,
  mountingBrackets: 500,
};

// Swell product IDs (matching JSON files)
const COMPONENT_SWELL_IDS: Record<keyof SelectedComponents, string> = {
  diverterValve: 'function360-diverter-valve',
  quickCouplings: 'function360-quick-couplings',
  adaptors: 'function360-adaptors',
  hydraulicHoses: 'function360-hydraulic-hoses',
  electrical: 'function360-electrical',
  mountingBrackets: 'function360-mounting-brackets',
};

/**
 * Calculate total price based on selected components
 */
export function calculateTotalPrice(config: Function360Config): number {
  let total = 0;

  Object.entries(config.selectedComponents).forEach(([key, isSelected]) => {
    if (isSelected) {
      const componentKey = key as keyof typeof config.componentPrices;
      total += config.componentPrices[componentKey];  // ✅ Use real price
    }
  });
  
  return total;
}

/**
 * Collect Swell product IDs for inventory management
 */
export function collectProductIds(config: Function360Config): string[] {
  const productIds: string[] = [];

  Object.entries(config.selectedComponents).forEach(([key, isSelected]) => {
    if (isSelected) {
      productIds.push(COMPONENT_SWELL_IDS[key as keyof SelectedComponents]);
    }
  });

  return productIds;
}