import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight scroll-reveal hook using IntersectionObserver.
 * Returns [ref, isVisible] — attach ref to the element, use isVisible to trigger CSS.
 *
 * @param {Object} options
 * @param {number} options.threshold - 0–1, how much must be visible (default 0.15)
 * @param {string} options.rootMargin - observer margin (default '0px 0px -60px 0px')
 * @param {boolean} options.once - only trigger once (default true)
 */
const useScrollReveal = ({ threshold = 0.15, rootMargin = '0px 0px -60px 0px', once = true } = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, isVisible];
};

export default useScrollReveal;
