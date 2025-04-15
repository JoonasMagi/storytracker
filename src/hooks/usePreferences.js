import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api';

export const usePreferences = () => {
  // Initialize state directly from localStorage if available
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  const [language, setLanguage] = useState(() => {
    // Explicitly get the language from localStorage with fallback to 'en'
    const savedLanguage = localStorage.getItem('preferredLanguage');
    console.log('Initial language from localStorage:', savedLanguage);
    return savedLanguage || 'en';
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set up dark mode class on body when component mounts
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Check authentication and load server preferences if authenticated
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Only load preferences from server for authenticated users
      loadPreferencesFromServer(token);
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
    
    // If user is logged in, save to server
    if (isAuthenticated) {
      savePreferencesToServer();
    }
  };

  // Change language
  const changeLanguage = (newLanguage) => {
    console.log('Changing language to:', newLanguage);
    setLanguage(newLanguage);
    localStorage.setItem('preferredLanguage', newLanguage);
    
    // If user is logged in, save to server
    if (isAuthenticated) {
      savePreferencesToServer();
    }
  };

  // Save preferences to server
  const savePreferencesToServer = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return; // Only save if user is logged in
    
    try {
      await fetch(`${API_URL}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          darkMode,
          language
        })
      });
      console.log('Preferences saved to server');
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Load preferences from server
  const loadPreferencesFromServer = async (token) => {
    if (!token) return false; // Not logged in
    
    try {
      const response = await fetch(`${API_URL}/preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Handle token expired or invalid
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setIsAuthenticated(false);
          return false;
        }
        throw new Error('Failed to load preferences');
      }
      
      const preferences = await response.json();
      console.log('Loaded server preferences:', preferences);
      
      // Only apply server preferences if they exist and have values
      if (Object.keys(preferences).length > 0) {
        // Apply dark mode if set
        if (preferences.darkMode !== undefined) {
          setDarkMode(preferences.darkMode);
          localStorage.setItem('darkMode', preferences.darkMode);
          
          if (preferences.darkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
        }
        
        // Apply language if set AND not empty
        if (preferences.language && preferences.language.trim() !== '') {
          setLanguage(preferences.language);
          localStorage.setItem('preferredLanguage', preferences.language);
          console.log('Updated language from server to:', preferences.language);
        } else {
          // If server has no language preference, use localStorage or default
          const localLanguage = localStorage.getItem('preferredLanguage');
          if (localLanguage) {
            console.log('Using localStorage language:', localLanguage);
          } else {
            console.log('Using default language: en');
            localStorage.setItem('preferredLanguage', 'en');
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return false;
    }
  };

  return {
    darkMode,
    language,
    isAuthenticated,
    setIsAuthenticated,
    toggleDarkMode,
    changeLanguage,
    loadPreferencesFromServer
  };
};