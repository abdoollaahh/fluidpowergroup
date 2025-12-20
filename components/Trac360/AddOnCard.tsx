/**
 * TRAC360 AddOnCard Component
 * Toggle card for optional add-ons with NOT REQUIRED / ADD+ buttons
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Addon } from '../../types/trac360';
import { GLASS_CARD, COLORS, fadeIn } from './styles';

interface AddOnCardProps {
  /** Add-on data from JSON */
  addon: Addon;
  /** Selected state */
  selected: boolean;
  /** Toggle handler - if has subOptions, returns without subOption to trigger modal */
  onToggle: (selected: boolean, subOption?: string) => void;
  /** Optional custom className */
  className?: string;
}

/**
 * AddOnCard - Optional add-on selection card
 * 
 * Features:
 * - Toggle between NOT REQUIRED / ADD+
 * - Header-style toggle buttons (glassmorphism)
 * - Shows price prominently (EXTRA A$XXX)
 * - Collapsible details on mobile
 * - Triggers modal if has subOptions
 * 
 * @example
 * <AddOnCard
 *   addon={valveAdaptors}
 *   selected={isAdded}
 *   onToggle={(selected, subOption) => {
 *     if (selected && addon.hasSubOptions) {
 *       openModal(); // Show SubOptionModal
 *     } else {
 *       handleToggle(selected, subOption);
 *     }
 *   }}
 * />
 */
export default function AddOnCard({
  addon,
  selected,
  onToggle,
  className = '',
}: AddOnCardProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAddClick = () => {
    // If has subOptions, caller should open modal
    // Pass selected=true but no subOption
    onToggle(true);
  };

  const handleRemoveClick = () => {
    onToggle(false);
  };

  const hasDetails = addon.details && addon.details.length > 0;
  const shouldCollapse = isMobile && hasDetails;
  const showDetails = !shouldCollapse || detailsExpanded;

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className={className}
      style={{
        ...GLASS_CARD,
        padding: '24px',
        border: selected ? `2px solid ${COLORS.yellow.primary}` : GLASS_CARD.border,
        boxShadow: selected 
          ? `0 0 20px ${COLORS.yellow.glow}, 0 4px 15px rgba(0, 0, 0, 0.1)`
          : GLASS_CARD.boxShadow,
      }}
    >
      {/* Header: Name + Price */}
      <div style={{ marginBottom: '16px' }}>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: selected ? COLORS.yellow.primary : COLORS.grey.dark,
            marginBottom: '8px',
            transition: 'color 0.3s ease',
          }}
        >
          {addon.name}
        </h3>
        
        <p
          style={{
            fontSize: '14px',
            color: COLORS.grey.medium,
            marginBottom: '12px',
            lineHeight: '1.5',
          }}
        >
          {addon.description}
        </p>

        {/* Price Badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '20px',
            background: selected ? COLORS.yellow.primary : COLORS.grey.lighter,
            color: selected ? COLORS.grey.dark : COLORS.grey.medium,
            fontSize: '16px',
            fontWeight: '700',
            transition: 'all 0.3s ease',
          }}
        >
          EXTRA A${addon.basePrice.toLocaleString()}
        </div>
      </div>

      {/* Details List */}
      {hasDetails && (
        <>
          {/* Mobile: Collapse toggle */}
          {shouldCollapse && (
            <button
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                background: 'transparent',
                border: `1px solid ${COLORS.grey.light}`,
                borderRadius: '8px',
                color: COLORS.grey.dark,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{detailsExpanded ? 'Hide' : 'Show'} Details</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  transform: detailsExpanded ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* Details */}
          {showDetails && (
            <motion.ul
              initial={shouldCollapse ? { height: 0, opacity: 0 } : false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                marginBottom: '16px',
                paddingLeft: '20px',
                listStyle: 'disc',
              }}
            >
              {addon.details!.map((detail, index) => (
                <li
                  key={index}
                  style={{
                    fontSize: '14px',
                    color: COLORS.grey.medium,
                    marginBottom: '6px',
                    lineHeight: '1.5',
                  }}
                >
                  {detail}
                </li>
              ))}
            </motion.ul>
          )}
        </>
      )}

      {/* Note (if any) */}
      {addon.note && (
        <div
          style={{
            padding: '12px',
            marginBottom: '16px',
            background: 'rgba(250, 204, 21, 0.1)',
            borderLeft: `3px solid ${COLORS.yellow.primary}`,
            borderRadius: '4px',
            fontSize: '13px',
            color: COLORS.grey.medium,
            lineHeight: '1.5',
          }}
        >
          <strong>Note:</strong> {addon.note}
        </div>
      )}

      {/* Toggle Buttons (Header style) */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '50px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* NOT REQUIRED Button */}
        <button
          onClick={handleRemoveClick}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '50px',
            border: 'none',
            background: !selected
              ? 'rgba(255, 255, 255, 0.9)'
              : 'transparent',
            color: !selected ? COLORS.grey.dark : COLORS.grey.medium,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: !selected ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
          }}
        >
          NOT REQUIRED
        </button>

        {/* ADD+ Button */}
        <button
          onClick={handleAddClick}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '50px',
            border: 'none',
            background: selected
              ? COLORS.yellow.primary
              : 'transparent',
            color: selected ? COLORS.grey.dark : COLORS.grey.medium,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: selected ? `0 2px 8px ${COLORS.yellow.glow}` : 'none',
          }}
        >
          ADD+
        </button>
      </div>

      {/* Sub-options indicator */}
      {addon.subOptions && addon.subOptions.length > 0 && selected && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            color: COLORS.info,
            textAlign: 'center',
          }}
        >
          ℹ️ Select options after clicking ADD+
        </div>
      )}
    </motion.div>
  );
}