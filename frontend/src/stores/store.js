import { configureStore } from '@reduxjs/toolkit';
import moduleSessionReducer from './moduleSession.js';
import storage from '../utils/storage.js';
import { persistReducer, persistStore } from 'redux-persist';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['modules', 'activeSession'] // Only persist these fields
};

const persistedReducer = persistReducer(persistConfig, moduleSessionReducer);

export const store = configureStore({
  reducer: {
    moduleSession: persistedReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['persist/PERSIST']
    }
  })
});

export const persistor = persistStore(store); 