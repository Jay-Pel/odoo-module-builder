// Action Types
export const SESSION_START = 'SESSION_START';
export const SESSION_END = 'SESSION_END';
export const MODULE_UPDATE = 'MODULE_UPDATE';
export const STEP_SET = 'STEP_SET';
export const MODULE_SAVE = 'MODULE_SAVE';
export const SET_LOADING = 'SET_LOADING';
export const SET_ERROR = 'SET_ERROR';

// Action Creators
export const startSession = () => ({
  type: SESSION_START
});

export const endSession = () => ({
  type: SESSION_END
});

export const updateModule = (data) => ({
  type: MODULE_UPDATE,
  payload: data
});

export const setStep = (step) => ({
  type: STEP_SET,
  payload: step
});

export const saveModule = (moduleData) => ({
  type: MODULE_SAVE,
  payload: moduleData
});

export const setLoading = (isLoading) => ({
  type: SET_LOADING,
  payload: isLoading
});

export const setError = (error) => ({
  type: SET_ERROR,
  payload: error
}); 