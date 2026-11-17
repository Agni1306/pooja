import React, { useState } from 'react';
import { Store } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F5EBDD] text-[#174C3C] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Store className="w-8 h-8 mb-2 opacity-70" strokeWidth={1.6} />
        <span className="text-xs font-medium text-[#242D2A]/80 line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
