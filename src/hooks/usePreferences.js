import { useState, useEffect } from 'react';

export const usePreferences = () => {
  // Initialize state directly from localStorage if available
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      // Immediately apply dark mode class on initialization
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    return savedDarkMode;
  });
  
  const [language, setLanguage] = useState(() => {
    // Explicitly get the language from localStorage with fallback to 'en'
    const savedLanguage = localStorage.getItem('preferredLanguage');
    console.log('Initial language from localStorage:', savedLanguage);
    return savedLanguage || 'en';
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set up dark mode class on body when component mounts or darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Check authentication status
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Save preference in localStorage
    localStorage.setItem('darkMode', newDarkMode);
  };

  // Change language
  const changeLanguage = (newLanguage) => {
    console.log('Changing language to:', newLanguage);
    setLanguage(newLanguage);
    localStorage.setItem('preferredLanguage', newLanguage);
  };

  return {
    darkMode,
    language,
    isAuthenticated,
    setIsAuthenticated,
    toggleDarkMode,
    changeLanguage
  };
};