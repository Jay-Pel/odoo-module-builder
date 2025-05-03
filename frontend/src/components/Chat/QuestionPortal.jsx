import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import useOnboardingStore from '../../stores/onboardingStore';
import { withErrorBoundary } from '../ErrorBoundary';

const PortalContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 1.5rem;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.secondary};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
`;

const QuestionMask = styled(motion.div)`
  width: 100%;
  padding: 2rem;
  position: relative;
  overflow: hidden;
`;

const QuestionTitle = styled(motion.h2)`
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const QuestionContent = styled(motion.div)`
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
  line-height: 1.6;
`;

const NavigationContainer = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const NavButton = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  background: ${({ theme, primary }) => primary ? theme.colors.primary : 'transparent'};
  color: ${({ theme, primary }) => primary ? theme.colors.text.onPrimary : theme.colors.text.primary};
  border: ${({ theme, primary }) => primary ? 'none' : `1px solid ${theme.colors.border}`};
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease-in-out;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ProgressBar = styled(motion.div)`
  width: 100%;
  height: 4px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 2rem;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 2px;
`;

const ValidationMessage = styled(motion.div)`
  color: ${({ theme, isError }) => isError ? theme.colors.error : theme.colors.success};
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuestionPortal = () => {
  const { 
    questions, 
    currentQuestionIndex, 
    setCurrentQuestionIndex,
    nextQuestion,
    previousQuestion,
    responses,
    setCurrentQuestionResponse,
    getAllResponses
  } = useOnboardingStore();

  const [validation, setValidation] = useState({ isValid: true, message: '' });
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const validateResponse = () => {
    const currentResponse = responses[currentQuestion.id];
    
    if (!currentResponse || currentResponse.trim() === '') {
      setValidation({
        isValid: false,
        message: 'Please provide an answer before continuing'
      });
      return false;
    }
    
    setValidation({ isValid: true, message: '' });
    return true;
  };

  const handleNext = () => {
    if (validateResponse()) {
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    previousQuestion();
  };
  
  // Variants for animations
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30,
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { 
        duration: 0.2, 
        ease: 'easeInOut',
        when: 'afterChildren',
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.2,
        ease: 'easeInOut'
      }
    }
  };
  
  return (
    <PortalContainer
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      aria-live="polite"
    >
      <ProgressBar>
        <ProgressFill
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </ProgressBar>

      <AnimatePresence mode="wait">
        <QuestionMask
          key={currentQuestionIndex}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
        >
          <QuestionTitle variants={itemVariants}>
            {currentQuestion?.title || 'Question'}
          </QuestionTitle>
          
          <QuestionContent variants={itemVariants}>
            {currentQuestion?.content || 'Please answer the following question.'}
          </QuestionContent>
          
          <motion.div variants={itemVariants}>
            {React.cloneElement(currentQuestion?.component || <p>No input component available.</p>, {
              value: responses[currentQuestion?.id] || '',
              onChange: (value) => setCurrentQuestionResponse(value),
              'aria-label': currentQuestion?.title,
              'aria-invalid': !validation.isValid
            })}
            
            {!validation.isValid && (
              <ValidationMessage
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                isError
              >
                {validation.message}
              </ValidationMessage>
            )}
          </motion.div>

          <NavigationContainer variants={itemVariants}>
            <NavButton
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              whileTap={{ scale: 0.95 }}
            >
              Previous
            </NavButton>

            <NavButton
              onClick={handleNext}
              primary
              disabled={currentQuestionIndex === questions.length - 1}
              whileTap={{ scale: 0.95 }}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </NavButton>
          </NavigationContainer>
        </QuestionMask>
      </AnimatePresence>
    </PortalContainer>
  );
};

export default withErrorBoundary(QuestionPortal, {
  fallbackMessage: 'There was an error loading the question portal. Please try again.',
  onError: (error) => {
    // You can add error reporting service integration here
    console.error('QuestionPortal Error:', error);
  }
}); 