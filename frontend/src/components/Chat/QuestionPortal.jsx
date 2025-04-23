import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import useOnboardingStore from '../../stores/onboardingStore';

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
`;

const QuestionPortal = ({ currentQuestion }) => {
  const { questions, currentQuestionIndex, setCurrentQuestionIndex } = useOnboardingStore();
  
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
      <AnimatePresence mode="wait">
        <QuestionMask
          key={currentQuestionIndex}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
        >
          <QuestionTitle
            variants={itemVariants}
          >
            {questions[currentQuestionIndex]?.title || 'Question'}
          </QuestionTitle>
          
          <QuestionContent
            variants={itemVariants}
          >
            {questions[currentQuestionIndex]?.content || 'Please answer the following question.'}
          </QuestionContent>
          
          <motion.div
            variants={itemVariants}
          >
            {questions[currentQuestionIndex]?.component || 
              <p className="text-gray-500">No input component available.</p>
            }
          </motion.div>
        </QuestionMask>
      </AnimatePresence>
    </PortalContainer>
  );
};

export default QuestionPortal; 