// Custom storage implementation for redux-persist
const createWebStorage = () => {
  const storage = window.localStorage;
  
  return {
    getItem: (key) => {
      return new Promise((resolve) => {
        resolve(storage.getItem(key));
      });
    },
    setItem: (key, item) => {
      return new Promise((resolve) => {
        resolve(storage.setItem(key, item));
      });
    },
    removeItem: (key) => {
      return new Promise((resolve) => {
        resolve(storage.removeItem(key));
      });
    }
  };
};

const storage = createWebStorage();

export default storage;