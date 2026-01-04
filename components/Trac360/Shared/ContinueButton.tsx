/**
 * TRAC360 Continue Button Component (FIXED)
 * Validation-aware button with darker disabled state for better visibility
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GLASS_BUTTON, GLASS_HOVER } from '../../../utils/trac360/glassmorphism';

interface ContinueButtonProps {
  /** Click handler for navigation */
  onClick: () => void;
  /** Disabled state (based on validation) */
  disabled?: boolean;
  /** Custom button text (default: "Continue") */
  text?: string;
  /** Show arrow icon (default: true) */
  showArrow?: boolean;
  /** Full width on mobile (default: false) */
  fullWidthOnMobile?: boolean;
  /** Optional custom className */
  className?: string;
}

// ✅ FIXED: Darker disabled state for better text visibility
const GLASS_DISABLED_DARKER = {
  opacity: 1, // Full opacity instead of 0.5
  background: 'rgba(100, 100, 100, 0.5)', // Darker grey
  cursor: 'not-allowed',
  pointerEvents: 'none' as const,
  color: '#ffffff', // White text stands out better
  border: '1px solid rgba(100, 100, 100, 0.6)',
};

/**
 * ContinueButton - Proceed to next step button
 * 
 * States:
 * - Disabled: Darker grey, white text (better visibility)
 * - Active: Glassmorphism base, yellow hover
 * 
 * Features:
 * - Validation-aware styling
 * - Smooth hover transitions
 * - Arrow icon for direction
 * - Accessible (ARIA, keyboard)
 * - Mobile responsive
 * 
 * @example
 * const canProceed = canProceedFromStep('tractor-info', config);
 * 
 * <ContinueButton
 *   onClick={() => router.push('/next-step')}
 *   disabled={!canProceed}
 * />
 * 
 * @example
 * // Custom text
 * <ContinueButton
 *   onClick={handleSubmit}
 *   text="Add to Cart"
 *   disabled={false}
 *   showArrow={false}
 * />
 */
export default function ContinueButton({
  onClick,
  disabled = false,
  text = 'Continue',
  showArrow = true,
  fullWidthOnMobile = false,
  className = '',
}: ContinueButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${fullWidthOnMobile ? 'w-full md:w-auto' : ''}
        ${className}
      `}
      style={{
        ...(disabled ? GLASS_DISABLED_DARKER : GLASS_BUTTON), // ✅ FIXED: Use darker disabled style
        ...(isHovered && !disabled ? GLASS_HOVER : {}),
        minWidth: '180px',
        padding: '15px 30px',
        fontSize: '18px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      aria-label={disabled ? `${text} (disabled - complete required fields)` : text}
      aria-disabled={disabled}
    >
      {/* Button Text */}
      <span className="relative z-10">
        {text}
      </span>

      {/* Arrow Icon */}
      {showArrow && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="relative z-10 transition-transform duration-300"
          style={{
            transform: isHovered && !disabled ? 'translateX(4px)' : 'translateX(0)',
          }}
        >
          <path
            d="M5 12H19M12 5L19 12L12 19"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Shine effect on hover (only when active) */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
          }}
          initial={{ x: '-100%' }}
          animate={isHovered ? { x: '100%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.button>
  );
}