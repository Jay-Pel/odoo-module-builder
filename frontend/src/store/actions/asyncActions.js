import { setLoading, setError, saveModule } from './sessionActions';

// Thunk action creator for saving module data
export const saveModuleAsync = (moduleData) => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
      });

      if (!response.ok) {
        throw new Error('Failed to save module');
      }

      const savedModule = await response.json();
      dispatch(saveModule(savedModule));
      dispatch(setError(null));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// Thunk action creator for loading module data
export const loadModuleAsync = (moduleId) => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/modules/${moduleId}`);

      if (!response.ok) {
        throw new Error('Failed to load module');
      }

      const moduleData = await response.json();
      dispatch(saveModule(moduleData));
      dispatch(setError(null));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };
}; 