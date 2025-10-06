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
  const [useUnoptimized, setUseUnoptimized] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  
  if (!src || isError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} 
        style={{ width: '100%', height: '100%', minHeight: '200px' }}
      >
        <div className="text-center">
          <span className="text-gray-400 text-sm block">Loading Image</span>
          <button 
            onClick={() => {
              setIsError(false);
              setUseUnoptimized(false);
              setImgKey(prev => prev + 1);
            }}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const handleImageError = () => {
    if (!useUnoptimized) {
      console.warn(`Optimized image failed, trying unoptimized: ${src}`);
      setUseUnoptimized(true);
    } else {
      console.error(`Image failed to load: ${src}`);
      setIsError(true);
    }
  };
  
  return (
    <Image
      key={imgKey}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleImageError}
      priority={priority}
      quality={75}
      unoptimized={useUnoptimized}
    />
  );
};

export default OptimizedImage;