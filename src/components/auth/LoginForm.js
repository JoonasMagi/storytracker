import React, { useState } from 'react';
import { translations } from '../../utils/translations';

const LoginForm = ({ language, onSuccess, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = 'http://localhost:3000/api';
  const t = translations[language];

  const validateEmail = () => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: t.emailRequired }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: t.passwordRequired }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({
      email: '',
      password: '',
    });
    setErrorMessage('');

    // Validate fields
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (isEmailValid && isPasswordValid) {
      setIsSubmitting(true);
      
      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            rememberMe
          })
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.message === 'Invalid credentials') {
            setErrorMessage(t.invalidCreds || 'The email or password you entered is incorrect. Please try again.');
          } else {
            setErrorMessage(data.message || t.serverError || 'An error occurred during login. Please try again later.');
          }
          setIsSubmitting(false);
          return;
        }

        // Store the token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // If remember me is not checked, use sessionStorage instead which will clear when browser closes
        if (!rememberMe) {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify(data.user));
          // We keep token in localStorage too but will check sessionStorage first on app load
        }
        
        // Clear form
        setEmail('');
        setPassword('');
        setIsSubmitting(false);
        
        // Call success handler
        onLoginSuccess(data.token, data.user);
        onSuccess();
      } catch (error) {
        console.error('Login error:', error);
        setErrorMessage(t.serverError || 'Server error. Please try again later.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {errorMessage && (
        <div className="error-banner" role="alert">
          {errorMessage}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="loginEmail">{t.email}</label>
        <input
          type="email"
          id="loginEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={validateEmail}
          autoComplete="email"
        />
        <span className="error-message">{errors.email}</span>
      </div>
      
      <div className="form-group">
        <label htmlFor="loginPassword">{t.password}</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            id="loginPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePassword}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="password-toggle"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword(!showPassword)}
          >
            👁️
          </button>
        </div>
        <span className="error-message">{errors.password}</span>
      </div>
      
      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <label htmlFor="rememberMe">{t.rememberMe || 'Remember me'}</label>
      </div>
      
      <button 
        type="submit" 
        id="loginButton" 
        disabled={isSubmitting}
        className="primary-button"
      >
        {isSubmitting ? t.loggingIn || 'Logging in...' : t.login || 'Log in'}
      </button>
    </form>
  );
};

export default LoginForm;