import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the steps in the module generation process
export const MODULE_STEPS = {
  REQUIREMENTS: 'requirements',
  SPECIFICATION: 'specification',
  DEVELOPMENT_PLAN: 'development_plan',
  MODULE_OUTPUT: 'module_output',
  ODOO_TESTING: 'odoo_testing',
};

// Define step dependencies and validation rules
const STEP_CONFIG = {
  [MODULE_STEPS.REQUIREMENTS]: {
    order: 1,
    requires: [],
    validate: (data) => data?.requirements?.length > 0,
  },
  [MODULE_STEPS.SPECIFICATION]: {
    order: 2,
    requires: [MODULE_STEPS.REQUIREMENTS],
    validate: (data) => data?.specification?.approved,
  },
  [MODULE_STEPS.DEVELOPMENT_PLAN]: {
    order: 3,
    requires: [MODULE_STEPS.SPECIFICATION],
    validate: (data) => data?.developmentPlan?.approved,
  },
  [MODULE_STEPS.MODULE_OUTPUT]: {
    order: 4,
    requires: [MODULE_STEPS.DEVELOPMENT_PLAN],
    validate: (data) => data?.moduleOutput?.generated,
  },
  [MODULE_STEPS.ODOO_TESTING]: {
    order: 5,
    requires: [MODULE_STEPS.MODULE_OUTPUT],
    validate: (data) => true, // No specific validation required for this step
  },
};

const useModuleSessionStore = create(
  persist(
    (set, get) => ({
      // State
      sessions: {},
      currentSessionId: null,
      
      // Getters
      getCurrentSession: () => {
        const state = get();
        return state.currentSessionId ? state.sessions[state.currentSessionId] : null;
      },

      getSessionById: (sessionId) => {
        return get().sessions[sessionId] || null;
      },

      // Session Management
      createSession: (moduleData) => {
        const sessionId = Date.now().toString();
        const newSession = {
          id: sessionId,
          moduleData: {
            ...moduleData,
            createdAt: new Date().toISOString(),
          },
          currentStep: MODULE_STEPS.REQUIREMENTS,
          completedSteps: [],
          stepData: {},
          lastUpdated: new Date().toISOString(),
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: newSession,
          },
          currentSessionId: sessionId,
        }));

        return sessionId;
      },

      resumeSession: (sessionId) => {
        const session = get().sessions[sessionId];
        if (!session) {
          throw new Error('Session not found');
        }
        set({ currentSessionId: sessionId });
        return session;
      },

      // Step Management
      isStepAccessible: (step, sessionId = null) => {
        const session = sessionId ? get().sessions[sessionId] : get().getCurrentSession();
        if (!session) return false;

        const config = STEP_CONFIG[step];
        if (!config) return false;

        // Check if all required steps are completed
        return config.requires.every(requiredStep => 
          session.completedSteps.includes(requiredStep)
        );
      },

      isStepCompleted: (step, sessionId = null) => {
        const session = sessionId ? get().sessions[sessionId] : get().getCurrentSession();
        if (!session) return false;
        return session.completedSteps.includes(step);
      },

      validateStep: (step, data) => {
        const config = STEP_CONFIG[step];
        if (!config || !config.validate) return false;
        return config.validate(data);
      },

      completeStep: (step, data) => {
        const session = get().getCurrentSession();
        if (!session) throw new Error('No active session');

        const config = STEP_CONFIG[step];
        if (!config) throw new Error('Invalid step');

        if (!config.validate(data)) {
          throw new Error('Step validation failed');
        }

        set((state) => {
          const updatedSession = {
            ...state.sessions[session.id],
            stepData: {
              ...state.sessions[session.id].stepData,
              [step]: data,
            },
            completedSteps: [...new Set([...state.sessions[session.id].completedSteps, step])],
            currentStep: getNextStep(step),
            lastUpdated: new Date().toISOString(),
          };

          return {
            sessions: {
              ...state.sessions,
              [session.id]: updatedSession,
            },
          };
        });
      },

      updateStepData: (step, data) => {
        const session = get().getCurrentSession();
        if (!session) throw new Error('No active session');

        set((state) => {
          const updatedSession = {
            ...state.sessions[session.id],
            stepData: {
              ...state.sessions[session.id].stepData,
              [step]: {
                ...state.sessions[session.id].stepData[step],
                ...data,
              },
            },
            lastUpdated: new Date().toISOString(),
          };

          return {
            sessions: {
              ...state.sessions,
              [session.id]: updatedSession,
            },
          };
        });
      },

      // Session Cleanup
      clearSession: (sessionId) => {
        set((state) => {
          const { [sessionId]: removedSession, ...remainingSessions } = state.sessions;
          return {
            sessions: remainingSessions,
            currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
          };
        });
      },

      clearAllSessions: () => {
        set({ sessions: {}, currentSessionId: null });
      },
    }),
    {
      name: 'module-sessions',
      getStorage: () => localStorage,
    }
  )
);

// Helper function to get the next step in the sequence
function getNextStep(currentStep) {
  const steps = Object.values(MODULE_STEPS);
  const currentIndex = steps.indexOf(currentStep);
  return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
}

export default useModuleSessionStore; 