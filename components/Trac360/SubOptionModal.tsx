/**
 * TRAC360 SubOptionModal Component
 * Modal for selecting add-on sub-options (Nylon vs Spiral, One vs Two buttons)
 */

'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Addon } from '../../types/trac360';
import { GLASS_MODAL, COLORS, scaleUp, modalBackdrop } from './styles';

interface SubOptionModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Add-on with sub-options */
  addon: Addon;
  /** Sub-option selection handler */
  onSelect: (subOptionId: string) => void;
}

export default function SubOptionModal({
  isOpen,
  onClose,
  addon,
  onSelect,
}: SubOptionModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [imageErrors, setImageErrors] = React.useState<Record<string, boolean>>({});

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedOption(null);
    }
  }, [isOpen]);

  const handleSelect = () => {
    if (selectedOption) {
      onSelect(selectedOption);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 9998,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              variants={scaleUp}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                ...GLASS_MODAL,
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '24px',
                  borderBottom: `1px solid ${COLORS.grey.light}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: COLORS.grey.dark,
                    margin: 0,
                  }}
                >
                  {addon.name} Options
                </h2>

                {/* Close button */}
                <button
                  onClick={onClose}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Close modal"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path
                      d="M18 6L6 18M6 6L18 18"
                      stroke={COLORS.grey.dark}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '24px' }}>
                {/* Description */}
                <p
                  style={{
                    fontSize: '15px',
                    color: COLORS.grey.medium,
                    marginBottom: '24px',
                    lineHeight: '1.6',
                  }}
                >
                  {addon.description}
                </p>

                {/* Sub-options Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                  }}
                >
                  {addon.subOptions?.map((subOption) => {
                    const isSelected = selectedOption === subOption.id;
                    const hasError = imageErrors[subOption.id];

                    return (
                      <motion.div
                        key={subOption.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedOption(subOption.id)}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: isSelected
                            ? `2px solid ${COLORS.yellow.primary}`
                            : '1px solid rgba(0, 0, 0, 0.1)',
                          background: isSelected
                            ? 'rgba(250, 204, 21, 0.1)'
                            : 'rgba(255, 255, 255, 0.5)',
                          cursor: 'pointer',
                          boxShadow: isSelected
                            ? `0 0 15px ${COLORS.yellow.glow}`
                            : '0 2px 8px rgba(0, 0, 0, 0.05)',
                          position: 'relative',
                        }}
                      >
                        {/* Image */}
                        {subOption.image && (
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              paddingTop: '75%',
                              marginBottom: '12px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: COLORS.grey.lighter,
                            }}
                          >
                            {!hasError ? (
                              <div className="absolute top-0 left-0 w-full h-full">
                                <Image
                                  src={subOption.image}
                                  alt={subOption.name}
                                  width={200}
                                  height={150}
                                  className="w-full h-full object-cover"
                                  onError={() =>
                                    setImageErrors((prev) => ({
                                      ...prev,
                                      [subOption.id]: true,
                                    }))
                                  }
                                />
                              </div>
                            ) : (
                              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                <Image
                                  src="/logo.png"
                                  alt="Fluid Power Group"
                                  width={60}
                                  height={60}
                                  className="opacity-30"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Name */}
                        <div
                          style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: isSelected ? COLORS.yellow.primary : COLORS.grey.dark,
                            marginBottom: '4px',
                          }}
                        >
                          {subOption.name}
                        </div>

                        {/* Price */}
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: isSelected ? COLORS.yellow.primary : COLORS.grey.dark,
                          }}
                        >
                          {subOption.additionalPrice > 0 ? '+' : ''}A$
                          {subOption.additionalPrice.toLocaleString()}
                        </div>

                        {/* Selected indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: COLORS.yellow.primary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(250, 204, 21, 0.4)',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24">
                              <path
                                d="M5 12L10 17L20 7"
                                stroke={COLORS.grey.dark}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexDirection: 'column',
                  }}
                >
                  {/* Confirm Button */}
                  <button
                    onClick={handleSelect}
                    disabled={!selectedOption}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: selectedOption ? COLORS.yellow.primary : COLORS.grey.light,
                      color: selectedOption ? COLORS.grey.dark : COLORS.grey.medium,
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: selectedOption ? 'pointer' : 'not-allowed',
                      boxShadow: selectedOption
                        ? `0 4px 12px ${COLORS.yellow.glow}`
                        : 'none',
                    }}
                  >
                    Confirm Selection
                  </button>

                  {/* Skip Button */}
                  <button
                    onClick={handleSkip}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${COLORS.grey.light}`,
                      background: 'transparent',
                      color: COLORS.grey.medium,
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}