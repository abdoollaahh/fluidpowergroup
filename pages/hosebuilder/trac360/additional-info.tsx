/**
 * TRAC360 Additional Information Page - Step 10 (Part 1)
 * Optional textarea for special requests/notes before order confirmation
 * UPDATED: ADD+ button changes to ADDED with visual feedback
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Trac360Layout from '../../../components/Trac360/Layout/Trac360Layout';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useTrac360 } from '../../../context/Trac360Context';
import { COLORS } from '../../../components/Trac360/styles';
import SetupReminder from '../../../components/Trac360/Shared/SetupReminder';

export default function AdditionalInfo() {
  const router = useRouter();
  const { config, updateAdditionalInfo } = useTrac360();

  // Local state for textarea
  const [infoText, setInfoText] = useState<string>(config.additionalInfo || '');
  
  // State to track if user has taken action (ADD+ or NOT REQUIRED)
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(false);
  
  // Track if NOT REQUIRED was the last action
  const [wasNotRequired, setWasNotRequired] = useState<boolean>(false);

  // Sync with context when component mounts
  useEffect(() => {
    setInfoText(config.additionalInfo || '');
  }, [config.additionalInfo]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInfoText(text);
    // Update context in real-time
    updateAdditionalInfo(text);
    
    // If user previously clicked NOT REQUIRED and now is typing,
    // reset hasConfirmed so they need to click ADD+ again
    if (wasNotRequired && text.trim()) {
      setHasConfirmed(false);
      setWasNotRequired(false);
    }
  };

  // Handle ADD+ button - save info and enable Continue
  const handleAdd = () => {
    // Info already saved to context via handleTextChange
    setHasConfirmed(true);
    setWasNotRequired(false); // Clear the flag
  };

  // Handle "NOT REQUIRED" - clear info and enable Continue
  const handleNotRequired = () => {
    setInfoText('');
    updateAdditionalInfo('');
    setHasConfirmed(true); // Enable Continue button
    setWasNotRequired(true); // Mark that NOT REQUIRED was clicked
  };

  // Handle continue - only enabled after ADD+ or NOT REQUIRED
  const handleContinue = () => {
    if (!hasConfirmed) return;
    router.push('/hosebuilder/trac360/trac360-order-confirmation');
  };

  // Handle back
  const handleBack = () => {
    router.push('/hosebuilder/trac360/mounting-brackets');
  };

  // Redirect if no valve setup or operation type selected
  useEffect(() => {
    if (!config.valveSetup || !config.operationType) {
      router.push('/hosebuilder/trac360/tractor-info');
    }
  }, [config.valveSetup, config.operationType, router]);

  // Don't render if redirecting
  if (!config.valveSetup || !config.operationType) {
    return null;
  }

  return (
    <Trac360Layout currentStep={10} totalSteps={10}>
      {/* Back Button */}
      <BackButton onClick={handleBack} />
      <SetupReminder />

      <div className="max-w-xl mx-auto px-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="relative w-60 h-60">
            <Image
              src="/fluidpower_logo_transparent.gif"
              alt="Fluid Power Group"
              width={240}
              height={240}
              className="object-contain"
              unoptimized
            />
          </div>
        </motion.div>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div
            className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold"
            style={{
              background: COLORS.grey.dark,
            }}
          >
            ADDITIONAL INFORMATION
          </div>
        </motion.div>

        {/* Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Title Section */}
            <div className="p-6 text-center border-b border-gray-200">
              <h3 className="text-base font-semibold mb-2" style={{ color: COLORS.grey.dark }}>
                ADDITIONAL INFORMATION
              </h3>
            </div>

            {/* Textarea Section */}
            <div className="p-6">
              <textarea
                value={infoText}
                onChange={handleTextChange}
                placeholder="Add any details that will help us supply the correct parts (e.g., prefer female couplings instead of male, or adaptors instead of couplings).

Add any details that will help us assist you."
                rows={12}
                className="w-full px-4 py-3 rounded-lg resize-none outline-none transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: `2px solid ${infoText.trim() ? COLORS.yellow.primary : 'rgba(200, 200, 200, 0.3)'}`,
                  color: COLORS.grey.dark,
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                }}
                onFocus={(e) => {
                  if (!infoText.trim()) {
                    e.currentTarget.style.borderColor = COLORS.yellow.primary;
                  }
                }}
                onBlur={(e) => {
                  if (!infoText.trim()) {
                    e.currentTarget.style.borderColor = 'rgba(200, 200, 200, 0.3)';
                  }
                }}
              />

              {/* ADD+ / ADDED Button - Only show if text exists */}
              {infoText.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center mt-4"
                >
                  <motion.button
                    onClick={handleAdd}
                    disabled={hasConfirmed}
                    className="px-8 py-3 rounded-full font-semibold transition-all duration-300"
                    style={{
                      background: hasConfirmed 
                        ? 'rgba(250, 204, 21, 0.9)' 
                        : COLORS.grey.dark,
                      backdropFilter: hasConfirmed ? 'blur(10px)' : 'none',
                      WebkitBackdropFilter: hasConfirmed ? 'blur(10px)' : 'none',
                      color: hasConfirmed ? COLORS.grey.dark : '#ffffff',
                      border: hasConfirmed ? '2px solid rgba(255, 255, 255, 0.6)' : '2px solid rgba(255, 255, 255, 0.3)',
                      cursor: hasConfirmed ? 'default' : 'pointer',
                      boxShadow: hasConfirmed 
                        ? '0 4px 15px rgba(250, 204, 21, 0.4)' 
                        : '0 4px 10px rgba(0, 0, 0, 0.15)',
                    }}
                    whileHover={!hasConfirmed ? {
                      scale: 1.05,
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                    } : {}}
                    whileTap={!hasConfirmed ? { scale: 0.98 } : {}}
                  >
                    {hasConfirmed ? 'ADDED' : 'ADD+'}
                  </motion.button>
                </motion.div>
              )}
            </div>

            {/* NOT REQUIRED Button - Always visible at bottom */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 text-center border-t border-gray-200"
            >
              <motion.button
                onClick={handleNotRequired}
                className="px-8 py-3 rounded-full font-semibold transition-all duration-300"
                style={{
                  background: wasNotRequired 
                    ? 'rgba(107, 114, 128, 0.85)' 
                    : 'rgba(74, 74, 74, 0.85)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  border: wasNotRequired 
                    ? '2px solid rgba(255, 255, 255, 0.5)' 
                    : '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  boxShadow: wasNotRequired 
                    ? '0 6px 20px rgba(0, 0, 0, 0.25)' 
                    : '0 4px 10px rgba(0, 0, 0, 0.15)',
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                {wasNotRequired ? 'SKIPPED ✓' : 'NOT REQUIRED'}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Continue Button - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-12"
        >
          <ContinueButton onClick={handleContinue} disabled={!hasConfirmed} />
        </motion.div>

        {/* Helper text */}
        {!hasConfirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-4 text-sm"
            style={{ color: COLORS.grey.medium }}
          >
            Click <span style={{ color: COLORS.yellow.primary }}>ADD+</span> to save your notes or{' '}
            <span style={{ color: COLORS.grey.dark }}>NOT REQUIRED</span> to skip
          </motion.div>
        )}
      </div>
    </Trac360Layout>
  );
}