/**
 * TRAC360 Back Button Component (FIXED)
 * Floating back button (top-left) - positioned below header fade area
 */

'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { GLASS_LIGHT } from '../../../utils/trac360/glassmorphism';

interface BackButtonProps {
  /** Optional custom onClick handler (overrides default router.back()) */
  onClick?: () => void;
  /** Optional custom label (default: no label, just arrow) */
  showLabel?: boolean;
  /** Optional position override */
  position?: {
    top?: string;
    left?: string;
  };
}

/**
 * BackButton - Floating back navigation button
 * 
 * Position: Top-left, below header fade area (120px from top)
 * Style: Glassmorphism circle with arrow icon
 * 
 * Features:
 * - Fixed positioning (floats above content)
 * - Glassmorphism design matching header
 * - Yellow hover effect
 * - Accessible (keyboard + screen reader)
 * - Mobile-friendly tap target (60x60px)
 * 
 * @example
 * // Default usage (router.back())
 * <BackButton />
 * 
 * @example
 * // Custom navigation
 * <BackButton onClick={() => router.push('/previous-step')} />
 * 
 * @example
 * // With label
 * <BackButton showLabel />
 */
export default function BackButton({ 
  onClick, 
  showLabel = false,
  position = { top: '120px', left: '30px' } // ✅ FIXED: Lowered to 120px to clear header fade
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className="group"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 49,
        ...GLASS_LIGHT,
        width: showLabel ? 'auto' : '60px',
        height: '60px',
        borderRadius: showLabel ? '30px' : '50%',
        padding: showLabel ? '0 20px 0 15px' : '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showLabel ? '10px' : '0',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: '0 8px 25px rgba(250, 204, 21, 0.3)',
      }}
      whileTap={{ scale: 0.95 }}
      aria-label="Go back to previous step"
    >
      {/* Arrow Icon */}
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none"
        className="transition-colors duration-300"
        style={{
          stroke: '#4a4a4a',
        }}
      >
        <path 
          d="M19 12H5M12 19L5 12L12 5" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="group-hover:stroke-yellow-600"
        />
      </svg>

      {/* Optional Label */}
      {showLabel && (
        <span 
          className="font-semibold text-gray-700 group-hover:text-yellow-600 transition-colors duration-300"
          style={{ fontSize: '16px' }}
        >
          Back
        </span>
      )}

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(250, 204, 21, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </motion.button>
  );
}