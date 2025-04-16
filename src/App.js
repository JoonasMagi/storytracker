import React, { useState } from 'react';
import './App.css';
import './styles.css'; // Import the CSS directly from src folder
import AuthContainer from './components/auth/AuthContainer';
import ProjectBoard from './components/ProjectBoard';
import Toast from './components/Toast';
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

  // State for toast notifications
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  // Handle logout - clear all tokens and set authentication state to false
  const handleLogout = () => {
    // Show confirmation dialog
    const confirmLogout = window.confirm('Are you sure you want to log out?');

    if (confirmLogout) {
      // Clear both storage types to ensure complete logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Update authentication state
      setIsAuthenticated(false);

      // Show toast notification
      setToast({
        visible: true,
        message: 'You have been successfully logged out',
        type: 'success'
      });

      // Log the logout action
      console.log('User logged out successfully');
    } else {
      console.log('Logout cancelled by user');
    }
  };

  // Close toast notification
  const closeToast = () => {
    setToast({ ...toast, visible: false });
  };

  return (
    <div className="container">
      {isAuthenticated ? (
        <ProjectBoard
          darkMode={darkMode}
          language={language}
          toggleDarkMode={toggleDarkMode}
          onLogout={handleLogout}
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

      {/* Toast notification */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={3000}
        />
      )}
    </div>
  );
}

export default App;
