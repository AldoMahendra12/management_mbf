import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import logoBEF from '../../assets/logo_BEF.png';
import logoMBF from '../../assets/logo_MBF.png';

export const BrandLoader = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Horizontal 3D Coin Flip using GSAP for high-performance sub-pixel animation
    const tl = gsap.timeline({ repeat: -1 });
    
    tl.to(containerRef.current, {
      rotateY: 360,
      duration: 1.0, // Faster spin as requested
      ease: "none",
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="flex items-center justify-center overflow-hidden">
      <div className="relative flex flex-col items-center justify-center">
        {/* Logo Container - Smaller size as requested */}
        <div className="relative w-32 h-32 flex items-center justify-center" style={{ perspective: '1200px' }}>
          <div
            ref={containerRef}
            className="relative w-16 h-16" // Smaller logo (64px)
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front Side: MBF */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <img 
                src={logoMBF} 
                alt="MBF" 
                className="w-full h-full object-contain drop-shadow-sm" 
              />
            </div>
            
            {/* Back Side: BEF */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <img 
                src={logoBEF} 
                alt="BEF" 
                className="w-full h-full object-contain drop-shadow-sm" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
