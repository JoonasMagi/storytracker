import React from 'react';
import './App.css';
import './styles.css'; // Import the CSS directly from src folder
import AuthContainer from './components/auth/AuthContainer';
import { usePreferences } from './hooks/usePreferences';

function App() {
  const { 
    darkMode, 
    language, 
    isAuthenticated, 
    setIsAuthenticated,
    toggleDarkMode, 
    changeLanguage 
  } = usePreferences();

  return (
    <div className="container">
      <AuthContainer 
        language={language}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        changeLanguage={changeLanguage}
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
      />
    </div>
  );
}

export default App;
