import {
  SESSION_START,
  SESSION_END,
  MODULE_UPDATE,
  STEP_SET,
  MODULE_SAVE,
  SET_LOADING,
  SET_ERROR
} from '../actions/sessionActions';

const initialState = {
  activeSession: false,
  currentStep: 0,
  moduleData: null,
  isLoading: false,
  error: null
};

const sessionReducer = (state = initialState, action) => {
  switch (action.type) {
    case SESSION_START:
      return {
        ...state,
        activeSession: true,
        currentStep: 0,
        moduleData: null,
        error: null
      };

    case SESSION_END:
      return {
        ...state,
        activeSession: false,
        currentStep: 0,
        moduleData: null,
        error: null
      };

    case MODULE_UPDATE:
      return {
        ...state,
        moduleData: {
          ...state.moduleData,
          ...action.payload
        }
      };

    case STEP_SET:
      return {
        ...state,
        currentStep: action.payload
      };

    case MODULE_SAVE:
      return {
        ...state,
        moduleData: action.payload
      };

    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    default:
      return state;
  }
};

export default sessionReducer; 