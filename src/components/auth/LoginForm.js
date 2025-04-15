import React, { useState } from 'react';
import { translations } from '../../utils/translations';

const LoginForm = ({ language, onSuccess, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.message === 'Invalid credentials') {
            setErrors(prev => ({ ...prev, email: t.invalidCreds }));
          } else {
            throw new Error(data.message || 'Login failed');
          }
          setIsSubmitting(false);
          return;
        }

        // Store the token
        localStorage.setItem('token', data.token);
        
        // Clear form
        setEmail('');
        setPassword('');
        setIsSubmitting(false);
        
        // Call success handler
        onLoginSuccess(data.token);
        onSuccess();
      } catch (error) {
        console.error('Login error:', error);
        setErrors(prev => ({ ...prev, email: t.serverError }));
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="loginEmail">{t.email}</label>
        <input
          type="email"
          id="loginEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={validateEmail}
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
      
      <button 
        type="submit" 
        id="loginButton" 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Logging in...' : t.login}
      </button>
    </form>
  );
};

export default LoginForm;