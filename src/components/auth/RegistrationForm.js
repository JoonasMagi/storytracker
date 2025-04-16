import React, { useState } from 'react';
import { translations } from '../../utils/translations';

const RegistrationForm = ({ language, onSuccess, onAutoLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = 'http://localhost:3001/api';
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordMinLength = 8;
  const t = translations[language];

  const validateEmail = () => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: t.emailRequired }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: t.emailInvalid }));
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
    if (password.length < passwordMinLength) {
      setErrors(prev => ({ ...prev, password: t.passwordLength }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: t.confirmRequired }));
      return false;
    }
    if (confirmPassword !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: t.passwordsMatch }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setErrors({
      email: '',
      password: '',
      confirmPassword: ''
    });

    // Validate all fields
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    if (isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      setIsSubmitting(true);

      try {
        const response = await fetch(`${API_URL}/register`, {
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
          if (data.message === 'User already exists with this email') {
            setErrors(prev => ({ ...prev, email: t.userExists }));
          } else if (data.errors && data.errors.length > 0) {
            // Handle validation errors from server
            data.errors.forEach(error => {
              if (error.param === 'email') {
                setErrors(prev => ({ ...prev, email: error.msg }));
              } else if (error.param === 'password') {
                setErrors(prev => ({ ...prev, password: error.msg }));
              }
            });
          } else {
            throw new Error(data.message || 'Registration failed');
          }
          setIsSubmitting(false);
          return;
        }

        // Store language preference
        localStorage.setItem('preferredLanguage', language);

        // Now automatically log in the user
        try {
          const loginResponse = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email,
              password,
              rememberMe: true // Default to remember me for auto-login
            })
          });

          const loginData = await loginResponse.json();

          if (!loginResponse.ok) {
            throw new Error(loginData.message || 'Auto-login failed');
          }

          // Store the token and user info
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('user', JSON.stringify(loginData.user));

          // Clear form
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setIsSubmitting(false);

          // Call success handler with the email and auto-login handler with token and user
          onSuccess(email);
          if (onAutoLogin) {
            onAutoLogin(loginData.token, loginData.user);
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
          // If auto-login fails, still consider registration successful
          // but user will need to log in manually
          setIsSubmitting(false);
          onSuccess(email, false); // Pass false to indicate auto-login failed
        }
      } catch (error) {
        console.error('Registration error:', error);
        setErrors(prev => ({ ...prev, email: t.serverError }));
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">{t.email}</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={validateEmail}
        />
        <span className="error-message">{errors.email}</span>
      </div>

      <div className="form-group">
        <label htmlFor="password">{t.password}</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
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

      <div className="form-group">
        <label htmlFor="confirmPassword">{t.confirmPassword}</label>
        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={validateConfirmPassword}
          />
          <button
            type="button"
            className="password-toggle"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            👁️
          </button>
        </div>
        <span className="error-message">{errors.confirmPassword}</span>
      </div>

      <button
        type="submit"
        id="registerButton"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Registering...' : t.register}
      </button>
    </form>
  );
};

export default RegistrationForm;