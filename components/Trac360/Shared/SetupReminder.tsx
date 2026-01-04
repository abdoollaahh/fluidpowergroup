/**
 * TRAC360 Setup Reminder Component
 * Floating visual reminder of selected valve setup
 * Shown on all pages from operation-type to mounting-brackets
 * NOW WITH DRAG & DROP POSITIONING!
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import Image from 'next/image';
import { useTrac360 } from '../../../context/Trac360Context';
import { COLORS } from '../styles';

const SESSION_STORAGE_KEY = 'trac360-setup-reminder-position'; // ✅ Changed to sessionStorage
const SESSION_MINIMIZED_KEY = 'trac360-setup-reminder-minimized';

/**
 * SetupReminder - Draggable floating image showing selected valve setup
 * 
 * Features:
 * - Draggable positioning with session persistence (resets on app restart)
 * - Constrained to viewport boundaries
 * - Fixed position top-right by default
 * - Collapsible/expandable
 * - Shows setup GIF with code badge
 * - Remembers position during current session only
 * 
 * @example
 * <SetupReminder />
 */
export default function SetupReminder() {
  const { config } = useTrac360();
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasCustomPosition, setHasCustomPosition] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Load saved position AND minimized state from sessionStorage on mount
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedPosition) {
      const parsed = JSON.parse(savedPosition);
      setPosition(parsed);
      setHasCustomPosition(true);
    }
    
    // ✅ Load minimized state
    const savedMinimized = sessionStorage.getItem(SESSION_MINIMIZED_KEY);
    if (savedMinimized === 'true') {
      setIsMinimized(true);
    }
  }, []);

  // ✅ Save position to sessionStorage when it changes
    const handleDragEnd = (_event: any, info: any) => {
        if (!containerRef.current) return;
    
        const rect = containerRef.current.getBoundingClientRect();
        
        // ✅ Simple boundary calculation: keep at least 50px visible
        let newX = info.offset.x;
        let newY = info.offset.y;
    
        // Get current absolute position
        const currentLeft = rect.left;
        const currentTop = rect.top;
        
        // Calculate how far element can move
        const maxLeftMove = currentLeft + rect.width - 50; // Can move left until only 50px visible
        const maxRightMove = window.innerWidth - currentLeft - 50; // Can move right until only 50px visible
        const maxUpMove = currentTop + rect.height - 50; // Can move up until only 50px visible
        const maxDownMove = window.innerHeight - currentTop - 50; // Can move down until only 50px visible
    
        // Constrain the movement
        newX = Math.max(-maxLeftMove, Math.min(maxRightMove, newX));
        newY = Math.max(-maxUpMove, Math.min(maxDownMove, newY));
    
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        setHasCustomPosition(true);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newPosition));
  };

  // Reset to default position
  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
    setHasCustomPosition(false);
    setIsMinimized(false); // ✅ Also expand when resetting
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_MINIMIZED_KEY); // ✅ Clear minimized state
  };

  // Don't show if no valve setup selected
  if (!config.valveSetup || !config.tractorInfo.protectionType) {
    return null;
  }

  const { code, name } = config.valveSetup;
  const protectionType = config.tractorInfo.protectionType;

  return (
    <>
      {/* Expanded View - Now Draggable! */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            ref={containerRef}
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={handleDragEnd}
            initial={{ x: position.x, y: position.y, opacity: 1 }} // ✅ Start visible immediately
            animate={{ x: position.x, y: position.y, opacity: 1 }}
            exit={{ x: position.x, y: position.y, opacity: 0 }}
            transition={{ duration: 0 }} // ✅ No transition on position changes from navigation
            className="w-40 md:w-[250px] fixed top-40 md:top-40 right-4 md:right-6 cursor-move"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: `2px solid ${COLORS.yellow.primary}`,
              borderRadius: '16px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              zIndex: 45,
            }}
          >
            {/* Header with Minimize & Reset Buttons */}
            <div 
              className="flex items-center justify-between px-3 py-2 border-b"
              style={{ borderColor: 'rgba(200, 200, 200, 0.3)' }}
            >
              <span className="text-xs font-semibold" style={{ color: COLORS.grey.medium }}>
                Selected Setup
              </span>
              <div className="flex items-center gap-1">
                {/* Reset Position Button (only show if custom position) */}
                {hasCustomPosition && (
                  <button
                    onClick={resetPosition}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    aria-label="Reset position"
                    title="Reset to default position"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
                        stroke={COLORS.grey.medium}
                        strokeWidth="2"
                      />
                      <path
                        d="M12 8V12L15 15"
                        stroke={COLORS.grey.medium}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
                
                {/* Minimize Button */}
                <button
                  onClick={() => {
                    setIsMinimized(true);
                    sessionStorage.setItem(SESSION_MINIMIZED_KEY, 'true'); // ✅ Save minimized state
                  }}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Minimize setup reminder"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 15L12 9L6 15"
                      stroke={COLORS.grey.medium}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* GIF Image */}
            <div className="p-3">
              <div className="w-full aspect-video bg-gray-50 rounded-lg overflow-hidden mb-2">
                <Image
                  src={`/trac360/${protectionType.toUpperCase()}_(${code}).gif`}
                  alt={`Setup ${code}`}
                  width={180}
                  height={120}
                  className="object-contain w-full h-full scale-90 md:scale-100 pointer-events-none"
                  unoptimized
                />
              </div>

              {/* Setup Info */}
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: COLORS.yellow.primary,
                    color: COLORS.grey.dark,
                  }}
                >
                  {code}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: COLORS.grey.dark }}>
                    Setup {code}
                  </p>
                  <p className="text-xs truncate" style={{ color: COLORS.grey.medium }}>
                    {name}
                  </p>
                </div>
              </div>
            </div>

            {/* Drag Hint (shows on first load) */}
            {!hasCustomPosition && (
              <div className="px-3 pb-2">
                <p className="text-[10px] text-center italic" style={{ color: COLORS.grey.medium }}>
                  💡 Drag to reposition
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized View - Small Badge (Also Draggable) */}
      <AnimatePresence>
        {isMinimized && (
          <motion.button
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={handleDragEnd}
            initial={{ scale: 1, x: position.x, y: position.y }} // ✅ Start at full size
            animate={{ scale: 1, x: position.x, y: position.y }}
            exit={{ scale: 0 }}
            onClick={() => {
              setIsMinimized(false);
              sessionStorage.setItem(SESSION_MINIMIZED_KEY, 'false'); // ✅ Clear minimized state
            }}
            className="fixed top-40 md:top-40 right-4 md:right-6 cursor-move"
            style={{
              background: COLORS.yellow.primary,
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              boxShadow: '0 4px 15px rgba(250, 204, 21, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 45,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Expand setup reminder"
          >
            <span className="text-lg font-bold" style={{ color: COLORS.grey.dark }}>
              {code}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}