import React, { useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ThemeContext } from '../../context/ThemeContext';
import { useKeyboard, useOnClickOutside } from '../../utils/hooks';
import Tooltip from './Tooltip';

const SwitcherContainer = styled.div`
  position: relative;
`;

const ToggleButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.main};
  }
`;

const IconContainer = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  overflow: hidden;
`;

const SunIcon = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.warning};
`;

const MoonIcon = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary.main};
`;

const ThemePreviewContainer = styled(motion.div)`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 240px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  z-index: 10;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const PreviewTitle = styled.h4`
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
`;

const ThemeOptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ThemeOption = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: ${({ active, theme }) => 
    active ? theme.colors.background.active : 'transparent'};
  border: 1px solid ${({ active, theme }) => 
    active ? theme.colors.primary.main : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.main};
  }
`;

const ThemePreview = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const LightThemePreview = styled(ThemePreview)`
  background: linear-gradient(to bottom right, #ffffff 50%, #f0f0f0 50%);
`;

const DarkThemePreview = styled(ThemePreview)`
  background: linear-gradient(to bottom right, #1a1a1a 50%, #2d2d2d 50%);
`;

const ThemeText = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [showPreview, setShowPreview] = React.useState(false);
  const containerRef = useRef(null);
  
  // Close preview when clicking outside
  useOnClickOutside(containerRef, () => setShowPreview(false));
  
  // Handle keyboard shortcuts
  useKeyboard({
    'Escape': () => setShowPreview(false),
    'd': (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        toggleTheme();
      }
    }
  });
  
  // Animation variants
  const iconVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };
  
  const previewVariants = {
    hidden: { opacity: 0, scale: 0.9, y: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 25
      }
    }
  };
  
  const handleToggleClick = () => {
    setShowPreview(!showPreview);
  };
  
  const handleThemeChange = (newTheme) => {
    if (theme !== newTheme) {
      toggleTheme();
    }
    setShowPreview(false);
  };
  
  return (
    <SwitcherContainer ref={containerRef}>
      <Tooltip 
        content={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode (Ctrl+D)`}
        disabled={showPreview}
      >
        <ToggleButton 
          onClick={handleToggleClick}
          whileTap="tap"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-expanded={showPreview}
          aria-controls="theme-preview"
        >
          <IconContainer>
            {theme === 'light' ? (
              <SunIcon 
                initial="hidden"
                animate="visible"
                variants={iconVariants}
              >
                ☀️
              </SunIcon>
            ) : (
              <MoonIcon 
                initial="hidden"
                animate="visible"
                variants={iconVariants}
              >
                🌙
              </MoonIcon>
            )}
          </IconContainer>
        </ToggleButton>
      </Tooltip>
      
      {showPreview && (
        <ThemePreviewContainer
          id="theme-preview"
          initial="hidden"
          animate="visible"
          variants={previewVariants}
        >
          <PreviewTitle>Choose Theme</PreviewTitle>
          <ThemeOptionContainer>
            <ThemeOption 
              active={theme === 'light'}
              onClick={() => handleThemeChange('light')}
              aria-label="Switch to light mode"
              role="radio"
              aria-checked={theme === 'light'}
            >
              <LightThemePreview />
              <ThemeText>Light Theme</ThemeText>
            </ThemeOption>
            
            <ThemeOption 
              active={theme === 'dark'}
              onClick={() => handleThemeChange('dark')}
              aria-label="Switch to dark mode"
              role="radio"
              aria-checked={theme === 'dark'}
            >
              <DarkThemePreview />
              <ThemeText>Dark Theme</ThemeText>
            </ThemeOption>
          </ThemeOptionContainer>
        </ThemePreviewContainer>
      )}
    </SwitcherContainer>
  );
};

export default ThemeSwitcher; 