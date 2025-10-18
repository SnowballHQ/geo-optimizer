import React, { useRef, useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { useInView } from 'react-intersection-observer';

/**
 * Reusable Lottie Animation Component
 *
 * @param {string} animationPath - Path to the Lottie JSON file (relative to public folder)
 * @param {boolean} loop - Whether the animation should loop (default: true)
 * @param {boolean} autoplay - Whether to autoplay on mount (default: true)
 * @param {boolean} playOnHover - Play animation on hover (default: false)
 * @param {boolean} playOnScroll - Play when scrolled into view (default: false)
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles
 * @param {number} speed - Animation speed multiplier (default: 1)
 * @param {function} onComplete - Callback when animation completes
 * @param {boolean} lazy - Lazy load animation (default: true)
 * @param {object} lottieRef - Ref to access Lottie instance
 */
const LottieAnimation = ({
  animationPath,
  animationData = null,
  loop = true,
  autoplay = true,
  playOnHover = false,
  playOnScroll = false,
  className = '',
  style = {},
  speed = 1,
  onComplete = null,
  lazy = true,
  lottieRef = null,
  width = '100%',
  height = '100%',
}) => {
  const [animationJson, setAnimationJson] = useState(animationData);
  const [isLoading, setIsLoading] = useState(!animationData);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const internalLottieRef = useRef();
  const lottieInstance = lottieRef || internalLottieRef;

  // Intersection observer for scroll-triggered animations
  const { ref: scrollRef, inView } = useInView({
    triggerOnce: playOnScroll,
    threshold: 0.3,
  });

  // Load animation JSON
  useEffect(() => {
    if (animationData) {
      setAnimationJson(animationData);
      setIsLoading(false);
      return;
    }

    if (!animationPath) {
      setError('No animation path or data provided');
      setIsLoading(false);
      return;
    }

    // Only load if not lazy, or if lazy and in view
    if (!lazy || (lazy && inView)) {
      const loadAnimation = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(animationPath);
          if (!response.ok) {
            throw new Error(`Failed to load animation: ${response.statusText}`);
          }
          const data = await response.json();
          setAnimationJson(data);
          setError(null);
        } catch (err) {
          console.error('Error loading Lottie animation:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      loadAnimation();
    }
  }, [animationPath, animationData, lazy, inView]);

  // Handle speed changes
  useEffect(() => {
    if (lottieInstance.current) {
      lottieInstance.current.setSpeed(speed);
    }
  }, [speed, lottieInstance]);

  // Handle scroll-triggered playback
  useEffect(() => {
    if (playOnScroll && lottieInstance.current) {
      if (inView) {
        lottieInstance.current.play();
      } else {
        lottieInstance.current.stop();
      }
    }
  }, [inView, playOnScroll, lottieInstance]);

  // Handle hover playback
  useEffect(() => {
    if (playOnHover && lottieInstance.current) {
      if (isHovered) {
        lottieInstance.current.play();
      } else {
        lottieInstance.current.stop();
      }
    }
  }, [isHovered, playOnHover, lottieInstance]);

  // Handle completion callback
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="animate-pulse bg-gray-200 rounded-lg w-full h-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center text-gray-400 ${className}`}
        style={{ width, height, ...style }}
      >
        <span className="text-xs">Animation unavailable</span>
      </div>
    );
  }

  if (!animationJson) {
    return null;
  }

  return (
    <div
      ref={scrollRef}
      className={className}
      style={{ width, height, ...style }}
      onMouseEnter={() => playOnHover && setIsHovered(true)}
      onMouseLeave={() => playOnHover && setIsHovered(false)}
    >
      <Lottie
        lottieRef={lottieInstance}
        animationData={animationJson}
        loop={loop}
        autoplay={autoplay && !playOnHover && !playOnScroll}
        onComplete={handleComplete}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LottieAnimation;
