/**
 * TRAC360 OptionGrid Component
 * Grid layout for circuits/setups with multiple choices
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GLASS_CARD, GLASS_CARD_SELECTED, COLORS, fadeIn, hoverScale, hoverGlow } from './styles';

interface GridOption {
  id: string;
  label: string;
  value: string | number;
  price?: number;
  description?: string;
}

interface OptionGridProps {
  options: GridOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  columns?: number;
  currency?: string;
  className?: string;
}

export default function OptionGrid({
  options,
  selectedId,
  onSelect,
  columns = 3,
  currency = 'A$',
  className = '',
}: OptionGridProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((option, index) => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={option.id === selectedId}
            onSelect={() => onSelect(option.id)}
            currency={currency}
            index={index}
          />
        ))}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .grid {
            grid-template-columns: repeat(${columns}, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

function OptionCard({
  option,
  isSelected,
  onSelect,
  currency,
  index,
}: {
  option: GridOption;
  isSelected: boolean;
  onSelect: () => void;
  currency: string;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract style without transition property for motion.div
  const getGlassStyle = (styleObj: any) => {
    const { transition, ...rest } = styleObj;
    return rest;
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      custom={index}
      whileHover={!isSelected ? hoverScale : undefined}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="p-6 cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px] relative"
      style={getGlassStyle(isSelected ? GLASS_CARD_SELECTED : GLASS_CARD)}
    >
      {/* Hover glow effect */}
      {isHovered && !isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={getGlassStyle(hoverGlow)}
        />
      )}

      {/* Content layer */}
      <div className="relative z-10">
        {/* Label */}
        <div
          className="text-xl font-semibold mb-2"
          style={{
            color: isSelected ? COLORS.yellow.primary : COLORS.grey.dark,
          }}
        >
          {option.label}
        </div>

        {/* Value */}
        {option.value && option.value.toString() !== option.label && (
          <div className="text-base mb-2" style={{ color: COLORS.grey.medium }}>
            {option.value}
          </div>
        )}

        {/* Price */}
        {option.price !== undefined && (
          <div
            className="text-lg font-bold mt-1"
            style={{
              color: isSelected ? COLORS.yellow.primary : COLORS.grey.dark,
            }}
          >
            {currency}
            {option.price.toLocaleString()}
          </div>
        )}

        {/* Description */}
        {option.description && (
          <div className="text-sm mt-2 leading-tight" style={{ color: COLORS.grey.medium }}>
            {option.description}
          </div>
        )}
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center z-20"
          style={{
            background: COLORS.yellow.primary,
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
}