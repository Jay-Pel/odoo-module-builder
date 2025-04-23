import React, { useState, useEffect, useContext, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { useKeyboard, useOnClickOutside } from '../../utils/hooks';
import MarkdownViewer from './MarkdownViewer';

// Create context for help content
const HelpContext = createContext({
  getHelpContent: () => null,
  registerHelpContent: () => {},
});

export const HelpProvider = ({ children }) => {
  const [helpContent, setHelpContent] = useState({});
  const location = useLocation();
  
  const registerHelpContent = (path, content) => {
    setHelpContent(prev => ({
      ...prev,
      [path]: content
    }));
  };
  
  const getHelpContent = (path = location.pathname) => {
    return helpContent[path] || helpContent['default'];
  };
  
  return (
    <HelpContext.Provider value={{ getHelpContent, registerHelpContent }}>
      {children}
      <FloatingHelpButton />
    </HelpContext.Provider>
  );
};

export const useHelp = () => useContext(HelpContext);

// Styled components
const ButtonContainer = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
`;

const HelpButton = styled(motion.button)`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary.main};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  font-size: 1.5rem;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary.dark};
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary.light};
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  backdrop-filter: blur(2px);
`;

const ModalContent = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: 1rem;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.light};
  }
`;

const HelpContent = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.95rem;
  line-height: 1.6;
`;

const KeyboardShortcutsList = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ShortcutItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
  }
`;

const ShortcutKey = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.85rem;
  margin-left: 0.5rem;
`;

const ShortcutKeys = styled.div`
  display: flex;
  align-items: center;
`;

// Default help content
const defaultHelpContent = {
  title: 'Help Center',
  content: `
# Welcome to Odoo Module Builder

This tool helps you create custom Odoo ERP modules efficiently.

## Getting Started
Navigate through the different sections using the navigation menu at the top of the page:

- **Home** - Start your journey here
- **Chat** - Define your module through guided questions
- **Specification Review** - Review and adjust your module specifications
- **Development Plan** - View the development plan for your module
- **Module Output** - Get the final code for your module
- **Dashboard** - Manage all your created modules

## Keyboard Shortcuts
`,
  shortcuts: [
    { key: ['Ctrl', 'H'], description: 'Open help dialog' },
    { key: ['Ctrl', 'D'], description: 'Toggle dark/light mode' },
    { key: ['Esc'], description: 'Close dialogs' },
    { key: ['Ctrl', 'S'], description: 'Save current progress' }
  ]
};

// Page-specific help content
const pageHelpContent = {
  '/': {
    title: 'Home Page Help',
    content: `
# Home Page Help

This is the home page of the Odoo Module Builder application.

## Overview
From here you can start creating a new module or explore existing ones.

- Click on **Start Building** to begin creating a new module
- Use the **Dashboard** to manage existing modules
- Explore the different options in the navigation bar

## Getting Started
To create your first Odoo module:

1. Click on the "Start Building" button
2. Follow the guided chat interface to define your module
3. Review your specifications
4. Generate your module code

## Tips
- Use the dark/light mode switcher for your preferred viewing experience
- Access help at any time using the floating help button
`,
    shortcuts: [
      { key: ['Ctrl', 'N'], description: 'Create new module' },
      { key: ['Ctrl', 'O'], description: 'Open dashboard' }
    ]
  },
  '/chat': {
    title: 'Module Creation Help',
    content: `
# Module Creation Help

This page helps you define your module through a guided chat interface.

## How It Works
- Answer each question to build your module specification step by step
- The AI will guide you through the entire process
- You can navigate back and forth between questions

## Tips
- Be specific in your answers for better module generation
- You can always revise your answers later
- Use the Enter key to submit your responses quickly

## Next Steps
After completing the chat:
1. Review your module specifications
2. Adjust any details if needed
3. Generate the module code
`,
    shortcuts: [
      { key: ['Enter'], description: 'Submit answer' },
      { key: ['↑', '↓'], description: 'Navigate between questions' }
    ]
  },
  '/dashboard': {
    title: 'Dashboard Help',
    content: `
# Dashboard Help

The dashboard displays all your created modules.

## Features
- **Filter** modules by status
- **Search** by module name
- **Create** new modules
- **Manage** your existing modules

## Module Cards
Each card represents a module with the following actions:
- **Edit** - Modify the module specifications
- **View** - See the generated module code
- **Delete** - Remove the module permanently

## Module Status
Modules can have different statuses:
- **Draft** - Initial module definition
- **In Progress** - Module under development
- **Completed** - Ready to use modules
`,
    shortcuts: [
      { key: ['Ctrl', 'F'], description: 'Focus search field' },
      { key: ['Ctrl', 'N'], description: 'Create new module' }
    ]
  }
};

// Component implementation
const FloatingHelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { getHelpContent, registerHelpContent } = useContext(HelpContext);
  const location = useLocation();
  const modalRef = React.useRef(null);
  
  // Register help content on component mount
  useEffect(() => {
    registerHelpContent('default', defaultHelpContent);
    
    Object.entries(pageHelpContent).forEach(([path, content]) => {
      registerHelpContent(path, content);
    });
  }, [registerHelpContent]);
  
  // Close modal when clicking outside
  useOnClickOutside(modalRef, () => {
    if (isOpen) setIsOpen(false);
  });
  
  // Keyboard shortcuts
  useKeyboard({
    'Escape': () => setIsOpen(false),
    'h': (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  });
  
  // Get current help content based on location
  const currentHelp = getHelpContent(location.pathname);
  
  // Animation variants
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30,
        delay: 0.5
      }
    },
    tap: { scale: 0.95 }
  };
  
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };
  
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30
      }
    }
  };
  
  const toggleHelpModal = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <>
      <ButtonContainer
        initial="hidden"
        animate="visible"
        variants={buttonVariants}
      >
        <HelpButton 
          onClick={toggleHelpModal}
          whileTap="tap"
          aria-label="Open help"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          ?
        </HelpButton>
      </ButtonContainer>
      
      <AnimatePresence>
        {isOpen && (
          <ModalOverlay
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
          >
            <ModalContent
              ref={modalRef}
              variants={modalVariants}
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-modal-title"
            >
              <ModalHeader>
                <ModalTitle id="help-modal-title">
                  {currentHelp.title || 'Help Center'}
                </ModalTitle>
                <CloseButton 
                  onClick={() => setIsOpen(false)}
                  aria-label="Close help modal"
                >
                  ×
                </CloseButton>
              </ModalHeader>
              
              <MarkdownViewer content={currentHelp.content} />
              
              {currentHelp.shortcuts && currentHelp.shortcuts.length > 0 && (
                <KeyboardShortcutsList aria-label="Keyboard shortcuts">
                  <h4>Keyboard Shortcuts</h4>
                  {currentHelp.shortcuts.map((shortcut, index) => (
                    <ShortcutItem key={index}>
                      <span>{shortcut.description}</span>
                      <ShortcutKeys>
                        {shortcut.key.map((k, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span style={{ margin: '0 0.25rem' }}>+</span>}
                            <ShortcutKey>{k}</ShortcutKey>
                          </React.Fragment>
                        ))}
                      </ShortcutKeys>
                    </ShortcutItem>
                  ))}
                </KeyboardShortcutsList>
              )}
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingHelpButton; 