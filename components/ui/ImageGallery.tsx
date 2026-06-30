'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className = '' }: ImageGalleryProps) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className={`aspect-[3/4] bg-surface-soft rounded-[--radius-card] flex items-center justify-center ${className}`}>
        <span className="text-sm text-ink-muted">No image</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[--radius-card] bg-surface-soft">
        <Image
          src={images[active]}
          alt={`${alt} — view ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={active === 0}
        />
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-ink/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            {active + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-none w-16 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-colors ${
                i === active ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
