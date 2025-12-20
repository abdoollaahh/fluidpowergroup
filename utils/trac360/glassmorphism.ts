/**
 * TRAC360 Glassmorphism Style Constants
 * Reusable CSS-in-JS objects for consistent glassmorphic design
 * Based on existing Header.tsx patterns
 */

import { CSSProperties } from 'react';

// ============================================================================
// BASE GLASS STYLES
// ============================================================================

/**
 * Base glassmorphism effect for cards and containers
 * Usage: style={{ ...GLASS_BASE }}
 */
export const GLASS_BASE: CSSProperties = {
  background: `linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.2) 60%, rgba(255,255,255,0.35) 85%, rgba(255,255,255,0.4) 100%), rgba(255,255,255,0.3)`,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)', // Safari support
  border: '1px solid rgba(255, 255, 255, 0.25)',
  boxShadow: `
    0 4px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 2px 8px rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05)
  `,
};

/**
 * Lighter glass effect for subtle elements
 */
export const GLASS_LIGHT: CSSProperties = {
  background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`,
  backdropFilter: 'blur(15px)',
  WebkitBackdropFilter: 'blur(15px)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: `
    0 4px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 2px 8px rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05)
  `,
};

/**
 * Darker glass effect for containers
 */
export const GLASS_DARK: CSSProperties = {
  background: 'rgba(0, 0, 0, 0.15)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
};

// ============================================================================
// HOVER STATES
// ============================================================================

/**
 * Yellow/gold hover effect (active state)
 * Usage: onMouseEnter={(e) => Object.assign(e.currentTarget.style, GLASS_HOVER)}
 */
export const GLASS_HOVER: CSSProperties = {
  background: `radial-gradient(ellipse at center, rgba(250,204,21,0.6) 0%, rgba(250,204,21,0.4) 50%, rgba(255,215,0,0.5) 100%), rgba(250,204,21,0.3)`,
  border: '1px solid rgba(255, 215, 0, 0.8)',
  transform: 'translateY(-2px) scale(1.02)',
  boxShadow: `
    0 10px 30px rgba(250, 204, 21, 0.6),
    inset 0 2px 0 rgba(255, 255, 255, 0.8),
    inset 0 3px 10px rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(255, 215, 0, 0.4)
  `,
};

/**
 * Active/selected state (for selected cards)
 */
export const GLASS_ACTIVE: CSSProperties = {
  background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
  border: '1px solid rgba(255, 215, 0, 0.9)',
  color: '#000',
  transform: 'translateY(-2px) scale(1.02)',
  boxShadow: `
    0 10px 30px rgba(250, 204, 21, 0.6),
    inset 0 2px 0 rgba(255, 255, 255, 0.8),
    inset 0 3px 10px rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(255, 215, 0, 0.4)
  `,
};

// ============================================================================
// DISABLED STATE
// ============================================================================

/**
 * Disabled state for buttons/cards
 */
export const GLASS_DISABLED: CSSProperties = {
  opacity: 0.5,
  background: 'rgba(200, 200, 200, 0.3)',
  cursor: 'not-allowed',
  pointerEvents: 'none',
};

// ============================================================================
// BUTTON STYLES
// ============================================================================

/**
 * Base button style with glassmorphism
 */
export const GLASS_BUTTON: CSSProperties = {
  ...GLASS_LIGHT,
  padding: '12px 30px',
  borderRadius: '40px',
  fontSize: '18px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  color: '#333',
};

/**
 * Primary button (yellow/active)
 */
export const GLASS_BUTTON_PRIMARY: CSSProperties = {
  ...GLASS_BUTTON,
  ...GLASS_ACTIVE,
};

/**
 * Secondary button (neutral)
 */
export const GLASS_BUTTON_SECONDARY: CSSProperties = {
  ...GLASS_BUTTON,
  ...GLASS_LIGHT,
};

// ============================================================================
// CARD STYLES
// ============================================================================

/**
 * Selection card style (for options grid)
 */
export const GLASS_CARD: CSSProperties = {
  ...GLASS_BASE,
  padding: '20px',
  borderRadius: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Selected card state
 */
export const GLASS_CARD_SELECTED: CSSProperties = {
  ...GLASS_CARD,
  ...GLASS_ACTIVE,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get hover handlers for interactive elements
 * Usage: {...getGlassHoverHandlers()}
 */
export const getGlassHoverHandlers = (isActive = false) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    if (!isActive) {
      Object.assign(e.currentTarget.style, GLASS_HOVER);
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    if (!isActive) {
      Object.assign(e.currentTarget.style, GLASS_LIGHT);
    }
  },
});

/**
 * Apply glassmorphism to an element dynamically
 */
export const applyGlassEffect = (
  element: HTMLElement,
  variant: 'base' | 'light' | 'dark' | 'hover' | 'active' = 'base'
) => {
  const styles = {
    base: GLASS_BASE,
    light: GLASS_LIGHT,
    dark: GLASS_DARK,
    hover: GLASS_HOVER,
    active: GLASS_ACTIVE,
  }[variant];

  Object.assign(element.style, styles);
};

// ============================================================================
// PROGRESS BAR STYLES
// ============================================================================

/**
 * Progress bar container (floating at top)
 */
export const GLASS_PROGRESS_BAR: CSSProperties = {
  ...GLASS_DARK,
  padding: '15px 30px',
  borderRadius: '50px',
};

/**
 * Progress step (completed)
 */
export const GLASS_PROGRESS_STEP_COMPLETE: CSSProperties = {
  background: 'rgba(250, 204, 21, 0.8)',
  border: '2px solid rgba(255, 215, 0, 0.9)',
};

/**
 * Progress step (active)
 */
export const GLASS_PROGRESS_STEP_ACTIVE: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.4)',
  border: '2px solid rgba(255, 255, 255, 0.8)',
};

/**
 * Progress step (incomplete)
 */
export const GLASS_PROGRESS_STEP_INCOMPLETE: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.15)',
  border: '2px solid rgba(255, 255, 255, 0.3)',
};

// ============================================================================
// PRICE BAR STYLES
// ============================================================================

/**
 * Floating price bar (desktop)
 */
export const GLASS_PRICE_BAR_DESKTOP: CSSProperties = {
  ...GLASS_DARK,
  padding: '15px 30px',
  borderRadius: '50px',
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  zIndex: 40,
};

/**
 * Mini price bar (mobile - collapsed)
 */
export const GLASS_PRICE_BAR_MOBILE_MINI: CSSProperties = {
  ...GLASS_DARK,
  padding: '10px 20px',
  borderRadius: '30px',
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 40,
};

/**
 * Expanded price bar (mobile - tapped)
 */
export const GLASS_PRICE_BAR_MOBILE_EXPANDED: CSSProperties = {
  ...GLASS_DARK,
  padding: '20px',
  borderRadius: '20px',
  position: 'fixed',
  bottom: '20px',
  left: '20px',
  right: '20px',
  zIndex: 40,
};

// ============================================================================
// MODAL STYLES
// ============================================================================

/**
 * Modal overlay (backdrop)
 */
export const GLASS_MODAL_OVERLAY: CSSProperties = {
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
};

/**
 * Modal content container
 */
export const GLASS_MODAL_CONTENT: CSSProperties = {
  ...GLASS_BASE,
  padding: '30px',
  borderRadius: '24px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
};