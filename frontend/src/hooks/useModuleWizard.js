import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModuleSession } from './useModuleSession';
import { useFormValidation } from './useFormValidation';

const WIZARD_STEPS = {
  requirements: {
    path: '/create-module/requirements',
    next: 'specification',
    prev: null
  },
  specification: {
    path: '/create-module/specification',
    next: 'development',
    prev: 'requirements'
  },
  development: {
    path: '/create-module/development',
    next: 'review',
    prev: 'specification'
  },
  review: {
    path: '/create-module/review',
    next: null,
    prev: 'development'
  }
};

export const useModuleWizard = () => {
  const navigate = useNavigate();
  const {
    activeSession,
    currentStep,
    error,
    isLoading,
    start,
    update,
    setStep,
    save,
    end
  } = useModuleSession();
  
  const { validateForm, errors: validationErrors } = useFormValidation(currentStep);

  // Initialize wizard if no active session exists
  useEffect(() => {
    if (!activeSession && !isLoading) {
      start();
      navigate(WIZARD_STEPS.requirements.path);
    }
  }, [activeSession, isLoading, start, navigate]);

  // Handle step navigation
  const goToStep = useCallback(async (stepName) => {
    if (!WIZARD_STEPS[stepName]) {
      console.error(`Invalid step: ${stepName}`);
      return false;
    }

    // Validate current step before proceeding
    if (activeSession?.currentModule) {
      const isValid = await validateForm(activeSession.currentModule);
      if (!isValid) {
        return false;
      }
    }

    setStep(stepName);
    navigate(WIZARD_STEPS[stepName].path);
    return true;
  }, [activeSession, validateForm, setStep, navigate]);

  // Navigate to next step
  const nextStep = useCallback(async () => {
    if (!currentStep || !WIZARD_STEPS[currentStep].next) {
      return false;
    }
    return goToStep(WIZARD_STEPS[currentStep].next);
  }, [currentStep, goToStep]);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    if (!currentStep || !WIZARD_STEPS[currentStep].prev) {
      return false;
    }
    return goToStep(WIZARD_STEPS[currentStep].prev);
  }, [currentStep, goToStep]);

  // Update module data
  const updateModule = useCallback((data) => {
    if (!activeSession) return;
    update(data);
  }, [activeSession, update]);

  // Complete the wizard
  const completeWizard = useCallback(async () => {
    if (!activeSession?.currentModule) return false;

    try {
      // Validate all steps
      const validationResults = await Promise.all([
        validateForm(activeSession.currentModule),
        validateForm(activeSession.currentModule),
        validateForm(activeSession.currentModule)
      ]);

      if (validationResults.some(result => !result)) {
        return false;
      }

      // Save the final module
      save(activeSession.currentModule);
      
      // End the session
      end();
      
      // Navigate to the dashboard
      navigate('/dashboard');
      
      return true;
    } catch (err) {
      console.error('Failed to complete wizard:', err);
      return false;
    }
  }, [activeSession, validateForm, save, end, navigate]);

  // Calculate progress
  const progress = useCallback(() => {
    if (!currentStep) return 0;
    const steps = Object.keys(WIZARD_STEPS);
    const currentIndex = steps.indexOf(currentStep);
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  }, [currentStep]);

  return {
    // State
    activeSession,
    currentStep,
    error,
    isLoading,
    validationErrors,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    
    // Data management
    updateModule,
    completeWizard,
    
    // Utilities
    progress,
    WIZARD_STEPS
  };
};

export default useModuleWizard; 