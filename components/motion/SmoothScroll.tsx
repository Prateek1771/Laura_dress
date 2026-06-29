'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ReactLenis, type LenisRef } from 'lenis/react';

import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

// App-wide smooth scroll. Lenis owns the scroll; GSAP's ticker drives its rAF and
// ScrollTrigger stays in sync. Reduced-motion → lerp:1 (instant, native-feel) so
// scroll never breaks. Navbar is a normal (non-fixed) header, so it scrolls inside.
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const pathname = usePathname();
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(prefersReducedMotion()), []);

  useEffect(() => {
    function raf(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    const lenis = lenisRef.current?.lenis;
    lenis?.on('scroll', ScrollTrigger.update);
    return () => {
      gsap.ticker.remove(raf);
      lenis?.off('scroll', ScrollTrigger.update);
    };
  }, []);

  // Content height changes between routes — recompute trigger positions.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [pathname]);

  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: reduced ? 1 : 0.1, duration: 1 }}>
      {children}
    </ReactLenis>
  );
}
