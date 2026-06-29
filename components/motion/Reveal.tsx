'use client';

import { useRef } from 'react';

import { gsap, useGSAP } from '@/lib/gsap';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger the direct children in (grids, card rows, form groups) instead of fading the block as one. */
  stagger?: boolean;
  /** Vertical offset in px (kept small — subtle). */
  y?: number;
  delay?: number;
}

// Reveal-on-scroll wrapper. Fades + slides its content (or staggers its children)
// when it enters the viewport, once. Reduced-motion → renders content untouched.
export function Reveal({ children, className = '', stagger = false, y = 16, delay = 0 }: RevealProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const el = scope.current!;
        const targets = stagger ? el.children : el;
        gsap.from(targets, {
          opacity: 0,
          y,
          duration: stagger ? 0.45 : 0.5,
          ease: 'power2.out',
          delay,
          stagger: stagger ? 0.06 : 0,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
