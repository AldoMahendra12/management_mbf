import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '../../lib/utils';

export const SectionContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear existing transforms to avoid conflicts
      gsap.set(containerRef.current, { clearProps: "all" });

      // Ultra-smooth reveal: Fade + Slide Up + Subtle Scale
      gsap.fromTo(containerRef.current, 
        { 
          opacity: 0, 
          y: 25, 
          scale: 0.98,
          filter: 'blur(8px)'
        }, 
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.7, 
          ease: "expo.out",
          stagger: 0.1,
          clearProps: "all"
        }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className={cn("space-y-6 w-full", className)}>
      {children}
    </div>
  );
};
