import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for media queries
 * @param {string} query - CSS media query string
 * @returns {boolean} - Whether the media query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

/**
 * Custom hook for managing a boolean toggle state
 * @param {boolean} initialState - Initial state value
 * @returns {Array} - [state, toggle, setTrue, setFalse]
 */
export const useToggle = (initialState = false) => {
  const [state, setState] = useState(initialState);
  const toggle = () => setState((prevState) => !prevState);
  const setTrue = () => setState(true);
  const setFalse = () => setState(false);

  return [state, toggle, setTrue, setFalse];
};

/**
 * Custom hook for handling localStorage state
 * @param {string} key - localStorage key
 * @param {any} initialValue - Initial value if key is not found
 * @returns {Array} - [storedValue, setValue]
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

/**
 * Custom hook for handling click outside of refs
 * @param {React.RefObject} ref - Reference to an element
 * @param {Function} callback - Function to call when click outside
 */
export const useOnClickOutside = (ref, callback) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      callback(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, callback]);
};

/**
 * Custom hook for handling keyboard events
 * @param {Object} keyHandlers - Map of key codes to handler functions
 */
export const useKeyboard = (keyHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const handler = keyHandlers[event.key];
      if (handler) {
        handler(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyHandlers]);
};

/**
 * Custom hook for getting previous value
 * @param {any} value - Current value
 * @returns {any} - Previous value
 */
export const usePrevious = (value) => {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}; 