import React from 'react';
import Tippy from '@tippyjs/react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';

// Styled component for tooltip content
const TooltipContent = styled(motion.div)`
  font-size: 0.85rem;
  line-height: 1.4;
  padding: 0.5rem 0.75rem;
  color: ${({ theme }) => theme.colors.text.inverse};
  max-width: 300px;
`;

// Custom arrow component
const Arrow = styled.div`
  width: 10px;
  height: 10px;
  position: absolute;
  z-index: -1;
  background-color: ${({ theme }) => theme.colors.tooltip.background};
  transform: rotate(45deg);
  
  &[data-placement*='top'] {
    bottom: -4px;
  }
  
  &[data-placement*='bottom'] {
    top: -4px;
  }
  
  &[data-placement*='left'] {
    right: -4px;
  }
  
  &[data-placement*='right'] {
    left: -4px;
  }
`;

// Custom wrapper component for consistent styling
const CustomTippy = styled(Tippy)`
  background-color: ${({ theme }) => theme.colors.tooltip.background};
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  border-radius: 0.375rem;
  
  .tippy-content {
    padding: 0;
  }
`;

// Animation variants for tooltip content
const tooltipVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

/**
 * Custom tooltip component that wraps Tippy.js with consistent styling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Element that will have the tooltip
 * @param {string|React.ReactNode} props.content - Tooltip content
 * @param {string} props.placement - Tooltip placement (top, bottom, left, right, etc.)
 * @param {number} props.delay - Delay before showing tooltip in ms
 * @param {number} props.duration - Duration of show/hide animation in ms
 * @param {boolean} props.arrow - Whether to show an arrow on the tooltip
 * @param {string} props.className - Additional class names for the tooltip
 * @param {Object} props.tippyProps - Additional props to pass to Tippy
 */
const Tooltip = ({
  children,
  content,
  placement = 'top',
  delay = 100,
  duration = 200,
  arrow = true,
  className = '',
  tippyProps = {},
  ...rest
}) => {
  // If no content is provided, just render the children
  if (!content) {
    return children;
  }
  
  // Create a function to render the tooltip content with animation
  const renderContent = () => (
    <AnimatePresence>
      <TooltipContent
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={tooltipVariants}
      >
        {content}
      </TooltipContent>
    </AnimatePresence>
  );
  
  // Create a function to render a custom arrow
  const renderArrow = (attrs) => (
    <Arrow data-placement={attrs.placement} {...attrs} />
  );
  
  return (
    <CustomTippy
      content={renderContent()}
      placement={placement}
      arrow={arrow ? renderArrow : false}
      animation="shift-away"
      delay={[delay, 0]}
      duration={duration}
      className={`tooltip-component ${className}`}
      trigger="mouseenter focus"
      hideOnClick={false}
      {...tippyProps}
      {...rest}
    >
      {children}
    </CustomTippy>
  );
};

/**
 * Helper function to add a tooltip to any element
 * @param {React.ReactElement} element - Element to wrap with tooltip
 * @param {string|React.ReactNode} content - Tooltip content
 * @param {Object} options - Additional tooltip options
 */
export const withTooltip = (element, content, options = {}) => {
  if (!content || !element) return element;
  
  return (
    <Tooltip content={content} {...options}>
      {element}
    </Tooltip>
  );
};

export default Tooltip; 