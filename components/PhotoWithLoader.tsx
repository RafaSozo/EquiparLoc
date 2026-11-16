'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface PhotoWithLoaderProps {
  src: string;
  alt: string;
  sizes: string;
  /** Espaço entre a foto e a borda do quadro */
  className?: string;
  priority?: boolean;
}

/**
 * Foto inteira (sem corte) dentro de um quadro `relative`. Enquanto a foto não chega,
 * mostra o logo da EquiparLoc pulsando no centro.
 */
export function PhotoWithLoader({ src, alt, sizes, className = 'p-3', priority }: PhotoWithLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <Image
            src="/images/icone-equiparloc-512.png"
            alt=""
            width={56}
            height={56}
            className="w-14 h-14 opacity-40 motion-safe:animate-pulse"
          />
        </span>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </>
  );
}
