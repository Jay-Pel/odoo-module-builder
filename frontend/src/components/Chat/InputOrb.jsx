import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import useOnboardingStore from '../../stores/onboardingStore';

const OrbContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 1.5rem auto;
`;

const InputContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  height: 60px;
  border-radius: 100px;
  background: ${({ theme, isFocused }) => 
    isFocused ? theme.colors.background.active : theme.colors.background.secondary};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const StyledInput = styled.input`
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  padding: 0 1.5rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
    opacity: 0.7;
  }
`;

const FloatingOrb = styled(motion.div)`
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary.main};
  filter: blur(1px);
  z-index: -1;
`;

const InputOrb = ({ 
  placeholder = "Type your answer...", 
  onSubmit,
  type = "text"
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const { setCurrentQuestionResponse } = useOnboardingStore();
  
  const handleChange = (e) => {
    setValue(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      setCurrentQuestionResponse(value);
      if (onSubmit) onSubmit(value);
      setValue('');
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };
  
  // Floating orb animation variants
  const orbVariants = {
    idle: {
      scale: [1, 1.2, 1],
      opacity: 0.6,
      x: [0, 5, -5, 0],
      y: [0, -5, 5, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse"
      }
    },
    focused: {
      scale: [1, 1.5, 1.2],
      opacity: 0.8,
      x: [0, 10, -10, 0],
      y: [0, -10, 10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };
  
  // Container animation variants
  const containerVariants = {
    idle: {
      scale: 1,
    },
    focused: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    }
  };
  
  return (
    <OrbContainer>
      <InputContainer 
        as={motion.div}
        variants={containerVariants}
        animate={isFocused ? "focused" : "idle"}
        isFocused={isFocused}
      >
        <form onSubmit={handleSubmit}>
          <StyledInput
            ref={inputRef}
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
          />
        </form>
        
        {/* Floating orbs for visual effect */}
        <FloatingOrb
          variants={orbVariants}
          animate={isFocused ? "focused" : "idle"}
          style={{ top: '15%', left: '10%' }}
        />
        <FloatingOrb
          variants={orbVariants}
          animate={isFocused ? "focused" : "idle"}
          style={{ top: '60%', left: '85%' }}
        />
        <FloatingOrb
          variants={orbVariants}
          animate={isFocused ? "focused" : "idle"}
          style={{ top: '70%', left: '20%' }}
        />
      </InputContainer>
    </OrbContainer>
  );
};

export default InputOrb; 