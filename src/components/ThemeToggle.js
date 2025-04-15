import React from 'react';

const ThemeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <div className="theme-toggle">
      <input 
        type="checkbox" 
        id="darkModeToggle" 
        checked={darkMode}
        onChange={toggleDarkMode}
      />
      <label htmlFor="darkModeToggle" className="theme-toggle-label">
        <span className="theme-icon">🌙</span>
        <span className="theme-icon">☀️</span>
      </label>
    </div>
  );
};

export default ThemeToggle;