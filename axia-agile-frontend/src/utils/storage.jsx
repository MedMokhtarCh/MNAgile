export const getStoredData = (key, defaultValue = []) => {
    return JSON.parse(localStorage.getItem(key)) || defaultValue;
  };
  
  export const setStoredData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };
  
  export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('currentUser')) || {};
  };