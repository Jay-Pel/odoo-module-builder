import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

// Register GSAP plugins
gsap.registerPlugin(Flip);

/**
 * Collection of GSAP animation utilities for consistent animations across the app
 */

// Check if user prefers reduced motion
const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Creates a staggered entrance animation for multiple elements
 * @param {string|Element|Array} targets - The element(s) to animate
 * @param {Object} options - Configuration options
 * @returns {gsap.timeline} The animation timeline
 */
export const staggerEntrance = (targets, options = {}) => {
  const {
    duration = 0.6,
    stagger = 0.08,
    y = 20,
    delay = 0,
    ease = 'power2.out',
    opacity = 0,
    reducedMotion = false,
  } = options;

  // Skip or simplify animation for reduced motion
  if (prefersReducedMotion() || reducedMotion) {
    return gsap.to(targets, { duration: 0.3, opacity: 1, delay });
  }

  return gsap.fromTo(
    targets,
    { opacity, y },
    { 
      duration, 
      stagger, 
      opacity: 1, 
      y: 0, 
      delay,
      ease
    }
  );
};

/**
 * Creates a flip animation for card elements
 * @param {string|Element} container - The container element to monitor for changes
 * @param {Object} options - Configuration options
 * @returns {Function} A function to execute the flip animation
 */
export const createFlipAnimation = (container, options = {}) => {
  const {
    duration = 0.6,
    ease = 'power2.inOut',
    stagger = 0.05,
    absolute = true,
    reducedMotion = false,
  } = options;

  // For reduced motion, just apply instant state changes
  if (prefersReducedMotion() || reducedMotion) {
    return () => Flip.from(Flip.getState(container), { 
      duration: 0.2, 
      ease: 'power1.inOut',
      absolute
    });
  }

  return () => {
    // Capture the current state
    const state = Flip.getState(container);
    
    // Return the animation
    return Flip.from(state, {
      duration,
      ease,
      stagger,
      absolute
    });
  };
};

/**
 * Creates a question sequence animation for the chat flow
 * @param {Element} container - The container element
 * @param {Element} questionElement - The question element to animate
 * @param {Element} inputElement - The input element to animate
 * @returns {gsap.timeline} The animation timeline
 */
export const questionSequence = (container, questionElement, inputElement) => {
  // Skip or simplify animation for reduced motion
  if (prefersReducedMotion()) {
    return gsap.timeline()
      .to(container, { opacity: 1, duration: 0.3 })
      .to(questionElement, { opacity: 1, duration: 0.3 })
      .to(inputElement, { opacity: 1, duration: 0.3 });
  }

  return gsap.timeline()
    .fromTo(
      container,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
    )
    .fromTo(
      questionElement,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.3'
    )
    .fromTo(
      inputElement,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.2'
    );
};

/**
 * Creates a micro-interaction animation for UI elements
 * @param {string|Element} target - The element to animate
 * @param {string} type - The type of micro-interaction
 * @returns {gsap.timeline} The animation timeline
 */
export const microInteraction = (target, type = 'pulse') => {
  // Skip animation for reduced motion
  if (prefersReducedMotion()) {
    return gsap.timeline();
  }

  switch (type) {
    case 'pulse':
      return gsap.timeline()
        .to(target, { scale: 1.05, duration: 0.15, ease: 'power1.inOut' })
        .to(target, { scale: 1, duration: 0.15, ease: 'power1.out' });
    
    case 'shake':
      return gsap.timeline()
        .to(target, { x: -3, duration: 0.1, ease: 'power1.inOut' })
        .to(target, { x: 3, duration: 0.1, ease: 'power1.inOut' })
        .to(target, { x: -2, duration: 0.1, ease: 'power1.inOut' })
        .to(target, { x: 2, duration: 0.1, ease: 'power1.inOut' })
        .to(target, { x: 0, duration: 0.1, ease: 'power1.out' });
    
    case 'highlight':
      return gsap.timeline()
        .to(target, { 
          boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.6)', 
          duration: 0.3, 
          ease: 'power2.out' 
        })
        .to(target, { 
          boxShadow: '0 0 0 0px rgba(66, 153, 225, 0)', 
          duration: 0.5, 
          ease: 'power2.out' 
        });
    
    default:
      return gsap.timeline();
  }
};

// Export the animations object for easy access
export default {
  staggerEntrance,
  createFlipAnimation,
  questionSequence,
  microInteraction,
  prefersReducedMotion
}; 