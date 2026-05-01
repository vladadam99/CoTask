import React, { useState } from 'react';

/**
 * SmartImage — optimized image with skeleton loader + fade-in.
 * Cloudinary-ready: if CLOUDINARY_CLOUD_NAME is set, URLs from Cloudinary
 * will automatically get quality/format/width transformations applied.
 *
 * To enable Cloudinary later, replace the placeholder below with your cloud name:
 * const CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
 */
const CLOUDINARY_CLOUD_NAME = 'dllyfrdpr';

export function getOptimizedUrl(url, { width = 800, quality = 'auto' } = {}) {
  if (!url) return url;
  // If Cloudinary is configured and the URL is a Cloudinary URL, apply transformations
  if (CLOUDINARY_CLOUD_NAME && url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
  }
  return url;
}

export default function SmartImage({ src, alt = '', className = '', width, style, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedSrc = getOptimizedUrl(src, { width: width || 800 });

  return (
    <div className={`relative overflow-hidden bg-background ${className}`} style={style} onClick={onClick}>
      {/* Skeleton shown while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}

      {/* Actual image */}
      {optimizedSrc && !error && (
        <img
           src={optimizedSrc}
           alt={alt}
           className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
           loading="lazy"
           decoding="async"
           onLoad={() => setLoaded(true)}
           onError={() => setError(true)}
         />
      )}

      {/* Fallback on error */}
      {error && (
        <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Media unavailable</span>
        </div>
      )}
    </div>
  );
}