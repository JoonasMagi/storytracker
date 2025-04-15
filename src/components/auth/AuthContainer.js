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
  
  const API_URL = 'http://localhost:3000/api';
  const t = translations[language];

  // Handle registration success
  const handleRegisterSuccess = () => {
    setShowSuccess(true);
    setSuccessMessage(t.success);
  };
  
  // Handle login success
  const handleLoginSuccess = async (token) => {
    setIsAuthenticated(true);
    setShowSuccess(true);
    setSuccessMessage(t.loginSuccess);
    
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
    setIsAuthenticated(false);
    setUserData(null);
    setShowSuccess(false);
  };
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await fetch(`${API_URL}/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            return;
          }
          throw new Error('Failed to verify authentication');
        }
        
        const data = await response.json();
        setUserData(data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check error:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    };
    
    checkAuthStatus();
  }, [setIsAuthenticated]);
  
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
          <button onClick={handleLogout}>{t.logout}</button>
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