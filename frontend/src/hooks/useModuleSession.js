import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  startSession,
  updateCurrentModule,
  setCurrentStep,
  saveModule,
  endSession
} from '../stores/moduleSession.js';

export const useModuleSession = () => {
  const dispatch = useDispatch();
  
  // Select relevant state from Redux store
  const activeSession = useSelector(state => state.moduleSession.activeSession);
  const currentStep = useSelector(state => state.moduleSession.currentStep);
  const error = useSelector(state => state.moduleSession.error);
  const isLoading = useSelector(state => state.moduleSession.isLoading);

  // Start a new module session
  const start = useCallback((moduleData = {}) => {
    dispatch(startSession({ module: moduleData }));
  }, [dispatch]);

  // Update the current module data
  const update = useCallback((moduleData) => {
    dispatch(updateCurrentModule(moduleData));
  }, [dispatch]);

  // Set the current step in the wizard
  const setStep = useCallback((step) => {
    dispatch(setCurrentStep(step));
  }, [dispatch]);

  // Save the current module
  const save = useCallback((moduleData) => {
    dispatch(saveModule(moduleData));
  }, [dispatch]);

  // End the current session
  const end = useCallback(() => {
    dispatch(endSession());
  }, [dispatch]);

  return {
    // State
    activeSession,
    currentStep,
    error,
    isLoading,
    
    // Actions
    start,
    update,
    setStep,
    save,
    end
  };
};

export default useModuleSession;