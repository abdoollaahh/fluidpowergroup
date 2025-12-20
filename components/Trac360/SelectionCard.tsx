/**
 * TRAC360 SelectionCard Component
 * Reusable card for image-based selections (CAB/ROPS, valve locations)
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GLASS_CARD, GLASS_CARD_SELECTED, COLORS, fadeIn, hoverScale, hoverGlow } from './styles';

interface SelectionCardProps {
  /** Unique identifier */
  id: string;
  /** Card title */
  title: string;
  /** Optional description */
  description?: string;
  /** Image URL or path */
  image: string;
  /** Selected state */
  selected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Optional badge (e.g., "A", "B", "C", "D") */
  badge?: string;
  /** Optional custom className */
  className?: string;
}

export default function SelectionCard({
  id,
  title,
  description,
  image,
  selected,
  onClick,
  badge,
  className = '',
}: SelectionCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // Extract style without transition property
  const getGlassStyle = (styleObj: any) => {
    const { transition, ...rest } = styleObj;
    return rest;
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      whileHover={!selected ? hoverScale : undefined}
      className={`cursor-pointer relative overflow-hidden ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={getGlassStyle(selected ? GLASS_CARD_SELECTED : GLASS_CARD)}
    >
      {/* Hover glow effect */}
      {isHovered && !selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={getGlassStyle(hoverGlow)}
        />
      )}

      {/* Badge (if provided) */}
      {badge && (
        <div
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-md"
          style={{
            background: selected ? COLORS.yellow.primary : 'rgba(74, 74, 74, 0.8)',
            color: selected ? COLORS.grey.dark : '#ffffff',
          }}
        >
          {badge}
        </div>
      )}

      {/* Image Container */}
      <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingTop: '56.25%', background: COLORS.grey.lighter }}>
        {!imageError ? (
          <div className="absolute top-0 left-0 w-full h-full">
            <Image
              src={image}
              alt={title}
              width={600}
              height={338}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`w-full h-full object-cover transition-transform duration-400 ${isHovered ? 'scale-110' : 'scale-100'}`}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Fluid Power Group"
              width={100}
              height={100}
              className="opacity-30"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3
          className="text-lg font-semibold"
          style={{
            color: selected ? COLORS.yellow.primary : COLORS.grey.dark,
            marginBottom: description ? '8px' : '0',
          }}
        >
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm leading-normal" style={{ color: COLORS.grey.medium }}>
            {description}
          </p>
        )}
      </div>

      {/* Selected indicator (checkmark) */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: COLORS.yellow.primary,
            boxShadow: '0 2px 8px rgba(250, 204, 21, 0.4)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
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