import { useEffect, useRef } from 'react';

export const useLenis = () => {
  const lenisRef = useRef(null);

  useEffect(() => {
    const initLenis = async () => {
      const Lenis = (await import('lenis')).default;
      
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        direction: 'vertical',
        gestureDirection: 'vertical',
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      lenisRef.current = lenis;

      // Scroll progress tracking
      const updateScrollProgress = () => {
        const progress = lenis.progress;
        const progressBar = document.getElementById('scroll-progress');
        if (progressBar) {
          progressBar.style.width = `${progress * 100}%`;
        }
      };

      // Update progress on scroll
      lenis.on('scroll', updateScrollProgress);

      // Animation frame loop
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Cleanup
      return () => {
        lenis.destroy();
      };
    };

    initLenis();
  }, []);

  const scrollTo = (target, options = {}) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: -80,
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        ...options
      });
    }
  };

  return { scrollTo, lenis: lenisRef.current };
};
