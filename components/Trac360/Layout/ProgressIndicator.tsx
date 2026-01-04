/**
 * TRAC360 Progress Indicator Component (UPDATED for 10 steps)
 * Shows visual progress bar and step count
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GLASS_DARK } from '../../../utils/trac360/glassmorphism';

interface ProgressIndicatorProps {
  /** Current step (1-10) */
  current: number;
  /** Total steps (always 10) */
  total: number;
}

/**
 * ProgressIndicator - Visual progress bar with step count
 * 
 * Desktop: Full width bar at top
 * Mobile: Slightly narrower with smaller text
 * 
 * Features:
 * - Glassmorphism background
 * - Yellow gradient for completed portion
 * - Smooth transition animation
 * - Responsive text sizing
 * 
 * Step Breakdown:
 * 1. Tractor Info
 * 2. Valve Setup
 * 3. Operation Type
 * 4. Circuits (optional)
 * 5. Valve Adaptors (optional)
 * 6. Tractor Hose Kit (optional)
 * 7. Hose Protection (optional)
 * 8. Joystick Upgradation (optional)
 * 9. Mounting Brackets (optional)
 * 10. Summary
 * 
 * @example
 * <ProgressIndicator current={7} total={10} />
 * // Shows: [██████████████░░░░░░] 7 of 10 steps completed
 */
export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  // Calculate progress percentage
  const progressPercentage = Math.round((current / total) * 100);
  
  return (
    <div 
      className="w-full py-6 px-4 md:px-8"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
      }}
    >
      <div className="container mx-auto max-w-4xl">
        {/* Progress Bar Container */}
        <div 
          className="w-full h-3 rounded-full overflow-hidden mb-3"
          style={{
            ...GLASS_DARK,
            background: 'rgba(0, 0, 0, 0.1)',
          }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Step ${current} of ${total}`}
        >
          {/* Filled Progress Bar */}
          <motion.div
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, rgba(250, 204, 21, 0.9) 0%, rgba(255, 215, 0, 0.95) 50%, rgba(250, 204, 21, 1) 100%)',
              boxShadow: '0 0 10px rgba(250, 204, 21, 0.5)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
            }}
          />
        </div>
        
        {/* Step Counter Text */}
        <div className="text-center">
          <motion.p
            className="text-sm md:text-base font-semibold text-gray-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Step <span className="text-yellow-600">{current}</span> of {total}
            {progressPercentage === 100 && (
              <span className="ml-2 text-green-600">✓ Complete</span>
            )}
          </motion.p>
          
          {/* Optional: Progress percentage */}
          <motion.p
            className="text-xs text-gray-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {progressPercentage}% completed
          </motion.p>
        </div>
      </div>
    </div>
  );
}