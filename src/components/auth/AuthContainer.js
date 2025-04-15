import React, { useState, useEffect } from 'react';
import { translations } from '../../utils/translations';
import RegistrationForm from './RegistrationForm';
import LoginForm from './LoginForm';
import ThemeToggle from '../ThemeToggle';
import LanguageSelector from '../LanguageSelector';

const AuthContainer = ({ language, darkMode, toggleDarkMode, changeLanguage, isAuthenticated, setIsAuthenticated }) => {
  const [activeForm, setActiveForm] = useState('signup');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const API_URL = 'http://localhost:3000/api';
  const t = translations[language];

  // Handle registration success
  const handleRegisterSuccess = () => {
    setShowSuccess(true);
    setSuccessMessage(t.success);
  };
  
  // Handle login success
  const handleLoginSuccess = async (token, user) => {
    setIsAuthenticated(true);
    setShowSuccess(true);
    setSuccessMessage(t.loginSuccess);
    
    // If user data is provided in response, use it directly
    if (user) {
      setUserData(user);
      return;
    }
    
    // Otherwise fetch the user profile
    try {
      // Fetch user profile
      const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  // Switch between signup and login forms
  const switchForm = (formName) => {
    setActiveForm(formName);
    setShowSuccess(false);
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserData(null);
    setShowSuccess(false);
  };
  
  // Redirect to dashboard after successful login
  useEffect(() => {
    let redirectTimer;
    if (isAuthenticated && showSuccess) {
      redirectTimer = setTimeout(() => {
        // Here you would navigate to the dashboard
        // This will depend on your routing implementation
        // For now, we'll just hide the success message
        setShowSuccess(false);
      }, 2000);
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isAuthenticated, showSuccess]);
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      
      // First check sessionStorage (for non-remembered sessions)
      let token = sessionStorage.getItem('token');
      let userStr = sessionStorage.getItem('user');
      
      // If not in sessionStorage, check localStorage (for remembered sessions)
      if (!token) {
        token = localStorage.getItem('token');
        userStr = localStorage.getItem('user');
      }
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        // If we have user data in storage, use it
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUserData(userData);
        }
        
        // Verify token is still valid
        const response = await fetch(`${API_URL}/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Clear invalid tokens
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to verify authentication');
        }
        
        const data = await response.json();
        setUserData(data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check error:', error);
        // Clear invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [setIsAuthenticated]);
  
  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="form-container">
        <div className="form-header">
          <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <LanguageSelector language={language} changeLanguage={changeLanguage} />
        </div>
        <div className="loading-container">
          <p>{t.dashboardLoading}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="form-container">
      <div className="form-header">
        <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <LanguageSelector language={language} changeLanguage={changeLanguage} />
      </div>
      
      {isAuthenticated && userData ? (
        // Authenticated user view
        <>
          <h1>{t.welcome}, {userData.email}</h1>
          <p className="subtitle">{t.welcomeSubtitle}</p>
          <button onClick={handleLogout} className="logout-button">{t.logout}</button>
        </>
      ) : (
        // Auth forms
        <>
          {!showSuccess && (
            <div className="form-switcher">
              <div 
                className={`form-tile ${activeForm === 'signup' ? 'active' : ''}`} 
                onClick={() => switchForm('signup')}
              >
                {t.signUp}
              </div>
              <div 
                className={`form-tile ${activeForm === 'login' ? 'active' : ''}`} 
                onClick={() => switchForm('login')}
              >
                {t.login}
              </div>
            </div>
          )}
          
          <h1>{showSuccess ? '' : activeForm === 'signup' ? t.title : t.loginTitle}</h1>
          <p className="subtitle">{showSuccess ? '' : activeForm === 'signup' ? t.subtitle : t.loginSubtitle}</p>
          
          {showSuccess ? (
            <div className="success-message">{successMessage}</div>
          ) : activeForm === 'signup' ? (
            <RegistrationForm 
              language={language} 
              onSuccess={handleRegisterSuccess} 
            />
          ) : (
            <LoginForm 
              language={language} 
              onSuccess={() => setShowSuccess(true)} 
              onLoginSuccess={handleLoginSuccess} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default AuthContainer;