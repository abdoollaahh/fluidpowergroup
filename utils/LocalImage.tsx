// utils/LocalImage.tsx
import Image from 'next/image';

interface LocalImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  layout?: string;  // For compatibility with existing code
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  objectPosition?: string;
  quality?: number;
}

const LocalImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '',
  layout,
  objectFit,
  objectPosition,
  quality
}: LocalImageProps) => {
  // If using the legacy layout="fill" approach
  if (layout === 'fill') {
    return (
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          layout="fill"
          objectFit={objectFit}
          objectPosition={objectPosition}
          className={className}
          unoptimized={true}
          quality={quality}
        />
      </div>
    );
  }
  
  // Standard approach with width/height
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 500}
      height={height || 300}
      className={className}
      unoptimized={true}
      quality={quality}
    />
  );
};

export default LocalImage;