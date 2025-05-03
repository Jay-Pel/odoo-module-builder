import { MODULE_STEPS } from '../stores/moduleSessionStore';
import { setError } from '../stores/moduleSession';

/**
 * Middleware to enforce session validation and step access control
 */
export class SessionMiddleware {
  constructor(moduleSessionStore) {
    this.store = moduleSessionStore;
  }

  /**
   * Validate access to a specific step
   * @param {string} step - The step to validate
   * @throws {Error} If step access is not allowed
   */
  validateStepAccess = (step) => {
    const currentSession = this.store.getCurrentSession();
    
    if (!currentSession) {
      throw new Error('No active session found. Please start a new module or resume an existing one.');
    }

    if (!this.store.isStepAccessible(step)) {
      const nextRequiredStep = this.getNextRequiredStep(currentSession);
      throw new Error(
        `Cannot access ${step}. Please complete ${nextRequiredStep} first.`
      );
    }
  };

  /**
   * Get the next required step that needs to be completed
   * @param {Object} session - The current session
   * @returns {string} The next required step
   */
  getNextRequiredStep = (session) => {
    const steps = Object.values(MODULE_STEPS);
    const currentStepIndex = steps.indexOf(session.currentStep);
    
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = steps[i];
      if (!session.completedSteps.includes(step)) {
        return step;
      }
    }
    
    return session.currentStep;
  };

  /**
   * Validate step data before completion
   * @param {string} step - The step to validate
   * @param {Object} data - The step data to validate
   * @throws {Error} If validation fails
   */
  validateStepCompletion = (step, data) => {
    if (!this.store.validateStep(step, data)) {
      throw new Error(`Invalid data for ${step}. Please ensure all required information is provided.`);
    }
  };

  /**
   * Handle step transition
   * @param {string} fromStep - The current step
   * @param {string} toStep - The target step
   * @throws {Error} If transition is not allowed
   */
  handleStepTransition = (fromStep, toStep) => {
    const currentSession = this.store.getCurrentSession();
    
    if (!currentSession) {
      throw new Error('No active session found.');
    }

    const steps = Object.values(MODULE_STEPS);
    const fromIndex = steps.indexOf(fromStep);
    const toIndex = steps.indexOf(toStep);

    // Can't skip steps forward
    if (toIndex > fromIndex + 1) {
      throw new Error('Cannot skip steps. Please complete each step in order.');
    }

    // Can go back to completed steps
    if (toIndex < fromIndex) {
      if (!currentSession.completedSteps.includes(toStep)) {
        throw new Error('Cannot access incomplete previous steps.');
      }
    }
  };

  /**
   * Check if a step can be modified
   * @param {string} step - The step to check
   * @returns {boolean} Whether the step can be modified
   */
  canModifyStep = (step) => {
    const currentSession = this.store.getCurrentSession();
    if (!currentSession) return false;

    const steps = Object.values(MODULE_STEPS);
    const stepIndex = steps.indexOf(step);
    const currentStepIndex = steps.indexOf(currentSession.currentStep);

    // Can modify current step or completed steps
    return stepIndex <= currentStepIndex;
  };

  /**
   * Get session status information
   * @param {string} sessionId - Optional session ID
   * @returns {Object} Session status information
   */
  getSessionStatus = (sessionId = null) => {
    const session = sessionId 
      ? this.store.getSessionById(sessionId)
      : this.store.getCurrentSession();

    if (!session) {
      return {
        active: false,
        currentStep: null,
        progress: 0,
        completedSteps: [],
        canProceed: false,
      };
    }

    const steps = Object.values(MODULE_STEPS);
    const progress = (session.completedSteps.length / steps.length) * 100;

    return {
      active: true,
      currentStep: session.currentStep,
      progress,
      completedSteps: session.completedSteps,
      canProceed: this.store.validateStep(session.currentStep, session.stepData[session.currentStep]),
    };
  };
}

// Create and export a singleton instance
let middlewareInstance = null;

export const getSessionMiddleware = (store) => {
  if (!middlewareInstance) {
    middlewareInstance = new SessionMiddleware(store);
  }
  return middlewareInstance;
};

// Action types that should trigger auto-save
const AUTOSAVE_ACTIONS = [
  'moduleSession/updateCurrentModule',
  'moduleSession/setCurrentStep',
  'moduleSession/saveModule'
];

// Debounce helper
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Save session to localStorage
const saveToStorage = (state) => {
  try {
    const serializedState = JSON.stringify({
      modules: state.moduleSession.modules,
      activeSession: state.moduleSession.activeSession,
      lastSaved: new Date().toISOString()
    });
    localStorage.setItem('odoo_module_session', serializedState);
  } catch (err) {
    console.error('Failed to save session:', err);
  }
};

// Debounced version of saveToStorage
const debouncedSave = debounce(saveToStorage, 1000);

export const sessionMiddleware = store => next => action => {
  // Process the action first
  const result = next(action);
  
  // Get the current state
  const state = store.getState();
  
  try {
    // Handle auto-save for specific actions
    if (AUTOSAVE_ACTIONS.includes(action.type)) {
      debouncedSave(state);
    }
    
    // Handle session transitions
    if (action.type === 'moduleSession/setCurrentStep') {
      const { currentStep, activeSession } = state.moduleSession;
      
      // Validate current step data before allowing transition
      if (activeSession?.currentModule) {
        const { validateModuleData } = require('../utils/validation/moduleValidation');
        
        validateModuleData(currentStep, activeSession.currentModule)
          .then(({ isValid, errors }) => {
            if (!isValid) {
              store.dispatch(setError(`Cannot proceed: ${Object.values(errors)[0]}`));
            }
          })
          .catch(err => {
            store.dispatch(setError('Failed to validate current step'));
          });
      }
    }
    
    // Handle session cleanup
    if (action.type === 'moduleSession/endSession') {
      // Perform final save before cleanup
      saveToStorage(state);
    }
    
  } catch (err) {
    console.error('Session middleware error:', err);
    store.dispatch(setError('Session management error occurred'));
  }
  
  return result;
};

/**
 * Loads the saved session state from localStorage
 * @returns {Object|null} The saved session state or null if none exists
 */
export const loadSavedSession = () => {
  try {
    const serializedState = localStorage.getItem('odoo_module_session');
    if (!serializedState) return null;
    
    const savedState = JSON.parse(serializedState);
    
    // Validate the loaded state structure
    if (!savedState.modules || !Array.isArray(savedState.modules)) {
      throw new Error('Invalid session state structure');
    }
    
    return savedState;
  } catch (err) {
    console.error('Failed to load saved session:', err);
    return null;
  }
}; 