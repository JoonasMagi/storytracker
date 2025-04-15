import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api';

export const usePreferences = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }

    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
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
    setLanguage(newLanguage);
    localStorage.setItem('preferredLanguage', newLanguage);
    
    // If user is logged in, save to server
    if (isAuthenticated) {
      savePreferencesToServer();
    }
  };

  // Save preferences to server
  const savePreferencesToServer = async () => {
    const token = localStorage.getItem('token');
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
          setIsAuthenticated(false);
          return false;
        }
        throw new Error('Failed to load preferences');
      }
      
      const preferences = await response.json();
      
      // Apply dark mode if set
      if (preferences.darkMode) {
        setDarkMode(true);
        document.body.classList.add('dark-mode');
      } else {
        setDarkMode(false);
        document.body.classList.remove('dark-mode');
      }
      
      // Apply language if set
      if (preferences.language) {
        setLanguage(preferences.language);
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