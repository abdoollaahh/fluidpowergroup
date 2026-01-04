/**
 * FUNCTION360 Additional Notes Page - Step 8
 * Optional textarea for customization notes
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Function360Layout from '../../../components/Function360/Layout/Function360Layout';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useFunction360 } from '../../../context/Function360Context';
import { COLORS } from '../../../components/Trac360/styles';

export default function AdditionalNotes() {
  const router = useRouter();
  const { config, updateAdditionalNotes } = useFunction360();

  const [notesText, setNotesText] = useState<string>(config.additionalNotes || '');
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(false);
  const [wasNotRequired, setWasNotRequired] = useState<boolean>(false);

  useEffect(() => {
    setNotesText(config.additionalNotes || '');
  }, [config.additionalNotes]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNotesText(text);
    updateAdditionalNotes(text);

    if (wasNotRequired && text.trim()) {
      setHasConfirmed(false);
      setWasNotRequired(false);
    }
  };

  const handleAdd = () => {
    setHasConfirmed(true);
    setWasNotRequired(false);
  };

  const handleNotRequired = () => {
    setNotesText('');
    updateAdditionalNotes('');
    setHasConfirmed(true);
    setWasNotRequired(true);
  };

  const handleContinue = () => {
    if (!hasConfirmed) return;
    router.push('/suite360/function360/summary');
  };

  const handleBack = () => {
    router.push('/suite360/function360/mounting-brackets');
  };

  return (
    <Function360Layout currentStep={8} totalSteps={9}>
      <BackButton onClick={handleBack} />

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
            ADDITIONAL NOTES
          </div>
        </motion.div>

        {/* Notes Card */}
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
                Machine Details & Customization
              </h3>
            </div>

            {/* Textarea Section */}
            <div className="p-6">
              <textarea
                value={notesText}
                onChange={handleTextChange}
                placeholder="Provide details about the machine where this 3rd function will be used so we can supply the correct adaptors, hoses, and supporting components.

Example: Machine make/model, hydraulic system details, any specific requirements or preferences."
                rows={12}
                className="w-full px-4 py-3 rounded-lg resize-none outline-none transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: `2px solid ${notesText.trim() ? COLORS.yellow.primary : 'rgba(200, 200, 200, 0.3)'}`,
                  color: COLORS.grey.dark,
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                }}
                onFocus={(e) => {
                  if (!notesText.trim()) {
                    e.currentTarget.style.borderColor = COLORS.yellow.primary;
                  }
                }}
                onBlur={(e) => {
                  if (!notesText.trim()) {
                    e.currentTarget.style.borderColor = 'rgba(200, 200, 200, 0.3)';
                  }
                }}
              />

              {/* ADD+ / ADDED Button */}
              {notesText.trim() && (
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

            {/* NOT REQUIRED Button */}
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

        {/* Continue Button */}
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
    </Function360Layout>
  );
}