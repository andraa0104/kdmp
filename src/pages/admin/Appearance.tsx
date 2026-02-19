import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './Appearance.css';

const Appearance = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      value: 'light',
      label: 'Light',
      description: 'Light theme for daytime use',
      icon: Sun
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Dark theme for nighttime use',
      icon: Moon
    },
    {
      value: 'system',
      label: 'System',
      description: 'Automatically match system theme',
      icon: Monitor
    }
  ];

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  return (
    <div className="appearance-page">
      <div className="page-header">
        <h1>Appearance</h1>
        <p>Customize the appearance of the application</p>
      </div>

      <div className="settings-card">
        <div className="settings-section">
          <h2>Theme</h2>
          <p className="section-description">Select your preferred theme for the interface</p>

          <div className="theme-options">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.value;

              return (
                <button
                  key={themeOption.value}
                  className={`theme-option ${isActive ? 'active' : ''}`}
                  onClick={() => handleThemeChange(themeOption.value as 'light' | 'dark' | 'system')}
                >
                  <div className="theme-option-header">
                    <div className="theme-icon">
                      <Icon size={24} />
                    </div>
                    {isActive && (
                      <div className="check-icon">
                        <Check size={20} />
                      </div>
                    )}
                  </div>
                  <div className="theme-preview">
                    <div className={`preview-box ${themeOption.value}`}>
                      <div className="preview-header"></div>
                      <div className="preview-content">
                        <div className="preview-line"></div>
                        <div className="preview-line short"></div>
                      </div>
                    </div>
                  </div>
                  <div className="theme-info">
                    <h3>{themeOption.label}</h3>
                    <p>{themeOption.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appearance;
