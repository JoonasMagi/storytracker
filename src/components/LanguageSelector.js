import React from 'react';

const LanguageSelector = ({ language, changeLanguage }) => {
  return (
    <div className="language-selector">
      <select 
        id="language" 
        value={language} 
        onChange={(e) => changeLanguage(e.target.value)}
      >
        <option value="en">English</option>
        <option value="et">Eesti</option>
        <option value="ru">Русский</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
};

export default LanguageSelector;