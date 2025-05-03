import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeSession: null,
  modules: [],
  currentStep: null,
  validationErrors: {},
  lastSaved: null,
  isLoading: false,
  error: null
};

const moduleSessionSlice = createSlice({
  name: 'moduleSession',
  initialState,
  reducers: {
    startSession: (state, action) => {
      state.activeSession = {
        id: action.payload.id || Date.now().toString(),
        startedAt: new Date().toISOString(),
        currentModule: action.payload.module || null
      };
      state.currentStep = 'requirements';
      state.isLoading = false;
      state.error = null;
    },
    
    updateCurrentModule: (state, action) => {
      if (state.activeSession) {
        state.activeSession.currentModule = {
          ...state.activeSession.currentModule,
          ...action.payload
        };
        state.lastSaved = new Date().toISOString();
      }
    },
    
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    
    addValidationError: (state, action) => {
      state.validationErrors[action.payload.field] = action.payload.error;
    },
    
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },
    
    saveModule: (state, action) => {
      const moduleIndex = state.modules.findIndex(m => m.id === action.payload.id);
      if (moduleIndex >= 0) {
        state.modules[moduleIndex] = action.payload;
      } else {
        state.modules.push(action.payload);
      }
      state.lastSaved = new Date().toISOString();
    },
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    endSession: (state) => {
      if (state.activeSession?.currentModule) {
        const moduleIndex = state.modules.findIndex(
          m => m.id === state.activeSession.currentModule.id
        );
        if (moduleIndex >= 0) {
          state.modules[moduleIndex] = state.activeSession.currentModule;
        } else {
          state.modules.push(state.activeSession.currentModule);
        }
      }
      state.activeSession = null;
      state.currentStep = null;
      state.validationErrors = {};
      state.lastSaved = new Date().toISOString();
    }
  }
});

export const {
  startSession,
  updateCurrentModule,
  setCurrentStep,
  addValidationError,
  clearValidationErrors,
  saveModule,
  setLoading,
  setError,
  endSession
} = moduleSessionSlice.actions;

export default moduleSessionSlice.reducer; 