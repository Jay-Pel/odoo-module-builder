import React from 'react';
import { create } from 'zustand';
import InputOrb from '../components/Chat/InputOrb';

// Sample questions for the onboarding process
const sampleQuestions = [
  {
    id: 'name',
    title: 'What is the name of your module?',
    content: 'Choose a descriptive name for your Odoo module.',
    component: <InputOrb placeholder="Enter module name..." />
  },
  {
    id: 'purpose',
    title: 'What is the purpose of your module?',
    content: 'Describe what your module will do and what problem it solves.',
    component: <InputOrb placeholder="Describe the purpose..." />
  },
  {
    id: 'features',
    title: 'What features will your module include?',
    content: 'List the main features your module will provide to users.',
    component: <InputOrb placeholder="Enter key features..." />
  },
  {
    id: 'dependencies',
    title: 'Does your module depend on other Odoo modules?',
    content: 'List any Odoo modules that your module will depend on.',
    component: <InputOrb placeholder="Enter dependencies (comma-separated)..." />
  }
];

const useOnboardingStore = create((set, get) => ({
  // State
  questions: sampleQuestions,
  currentQuestionIndex: 0,
  responses: {},
  
  // Actions
  nextQuestion: () => set((state) => ({ 
    currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1) 
  })),
  
  previousQuestion: () => set((state) => ({ 
    currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0) 
  })),
  
  setCurrentQuestionIndex: (index) => set(() => ({ 
    currentQuestionIndex: Math.max(0, Math.min(index, get().questions.length - 1)) 
  })),
  
  setCurrentQuestionResponse: (response) => set((state) => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    
    return {
      responses: {
        ...state.responses,
        [currentQuestion.id]: response
      }
    };
  }),
  
  getAllResponses: () => get().responses,
  
  resetOnboarding: () => set(() => ({ 
    currentQuestionIndex: 0, 
    responses: {} 
  }))
}));

export default useOnboardingStore;