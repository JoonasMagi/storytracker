import React from 'react';
import './App.css';
import './styles.css'; // Import the CSS directly from src folder
import AuthContainer from './components/auth/AuthContainer';
import ProjectBoard from './components/ProjectBoard';
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
      {isAuthenticated ? (
        <ProjectBoard 
          darkMode={darkMode} 
          language={language}
          toggleDarkMode={toggleDarkMode}
          onLogout={() => setIsAuthenticated(false)}
        />
      ) : (
        <AuthContainer 
          language={language}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          changeLanguage={changeLanguage}
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
        />
      )}
    </div>
  );
}

export default App;
