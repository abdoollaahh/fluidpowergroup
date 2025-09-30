// utils/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  useContainMode?: boolean;
  priority?: boolean;
}

const OptimizedImage = ({ 
  src, 
  alt, 
  width = 300, 
  height = 300, 
  className = '',
  useContainMode = false,
  priority = false
}: OptimizedImageProps) => {
  const [isError, setIsError] = useState(false);
  
  if (!src || isError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`} 
        style={{ width: useContainMode ? '100%' : width, height: useContainMode ? '100%' : height }}
      >
        <span className="text-gray-400">Image unavailable</span>
      </div>
    );
  }
  
  if (useContainMode) {
    return (
      <div className="w-full h-full">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-contain ${className}`}
          onError={() => setIsError(true)}
          priority={priority}
          quality={75}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }
  
  // Standard mode - no flex wrapper
  return (
    <div style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`object-contain ${className}`}
        onError={() => setIsError(true)}
        priority={priority}
        quality={75}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
};

export default OptimizedImage;