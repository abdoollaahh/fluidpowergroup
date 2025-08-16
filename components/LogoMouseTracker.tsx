import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface LogoMouseTrackerProps {
  /**
   * Number of floating logos (default: 30)
   */
  logoCount?: number;
  
  /**
   * Opacity of the logos (0-100, default: 60)
   */
  opacity?: number;
  
  /**
   * Hover opacity of the logos (0-100, default: 80)
   */
  hoverOpacity?: number;
  
  /**
   * Size of the logos in pixels (default: 32)
   */
  logoSize?: number;
  
  /**
   * Maximum Y position as percentage of viewport (default: 70)
   * Used to prevent logos from appearing in footer areas
   */
  maxYPosition?: number;
  
  /**
   * Custom logo path (default: "/fluidpower-logo.png")
   */
  logoPath?: string;
  
  /**
   * Z-index of the tracker (default: 0)
   */
  zIndex?: number;
  
  /**
   * Whether to show on mobile devices (default: true)
   */
  showOnMobile?: boolean;
  
  /**
   * Fade out distance from bottom (default: 100px)
   */
  fadeOutDistance?: number;
}

const LogoMouseTracker: React.FC<LogoMouseTrackerProps> = ({
  logoCount = 30,
  opacity = 60,
  hoverOpacity = 80,
  logoSize = 32,
  maxYPosition = 70, // Reduced from 75 to 70
  logoPath = "/fluidpower-logo.png",
  zIndex = 0,
  showOnMobile = true,
  fadeOutDistance = 100
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    // Check if mobile and set window height
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setWindowHeight(window.innerHeight);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Don't render on mobile if showOnMobile is false
  if (isMobile && !showOnMobile) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex }}
    >
      {typeof window !== 'undefined' && windowHeight > 0 && (
        <>
          {[...Array(logoCount)].map((_, i) => {
            // Calculate positions with wave effect
            const baseYPercent = (mousePosition.y / windowHeight) * 100;
            const waveOffset = Math.cos(Date.now() / 1000 + i) * 15; // Reduced wave intensity
            const finalYPercent = baseYPercent + waveOffset;
            
            // Calculate if logo should be visible (within allowed area)
            const maxYPixels = (maxYPosition / 100) * windowHeight;
            const currentYPixels = (finalYPercent / 100) * windowHeight;
            const isInAllowedArea = currentYPixels < maxYPixels;
            
            // Calculate fade out effect as logos approach the forbidden zone
            const distanceFromLimit = maxYPixels - currentYPixels;
            const fadeStartDistance = fadeOutDistance;
            let calculatedOpacity = opacity;
            
            if (distanceFromLimit < fadeStartDistance && distanceFromLimit > 0) {
              // Fade out gradually as approaching the limit
              const fadeRatio = distanceFromLimit / fadeStartDistance;
              calculatedOpacity = opacity * fadeRatio;
            } else if (distanceFromLimit <= 0) {
              // Completely hide if beyond the limit
              calculatedOpacity = 0;
            }
            
            const baseXPercent = (mousePosition.x / window.innerWidth) * 100;
            const xWaveOffset = Math.sin(Date.now() / 1000 + i) * 15; // Reduced wave intensity
            const finalXPercent = baseXPercent + xWaveOffset;
            
            return (
              <div
                key={i}
                className="absolute transition-all duration-1000 ease-out"
                style={{
                  width: `${logoSize}px`,
                  height: `${logoSize}px`,
                  left: `${Math.max(0, Math.min(95, finalXPercent))}%`, // Keep within bounds
                  top: `${Math.max(0, Math.min(95, finalYPercent))}%`, // Keep within bounds
                  opacity: calculatedOpacity / 100,
                  transition: 'all 1.5s ease-out, opacity 0.5s ease-out',
                  animationDelay: `${i * 0.1}s`,
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                  display: calculatedOpacity <= 0 ? 'none' : 'block'
                }}
                onMouseEnter={(e) => {
                  if (calculatedOpacity > 0) {
                    e.currentTarget.style.opacity = String(hoverOpacity / 100);
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = String(calculatedOpacity / 100);
                }}
              >
                <Image
                  src={logoPath}
                  alt="FluidPower Group Logo"
                  width={logoSize}
                  height={logoSize}
                  className="w-full h-full object-contain"
                  priority={false}
                  loading="lazy"
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default LogoMouseTracker;