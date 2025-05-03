import { combineReducers } from 'redux';
import sessionReducer from './sessionReducer';

const rootReducer = combineReducers({
  session: sessionReducer,
  // Add other reducers here as needed
});

export default rootReducer; 