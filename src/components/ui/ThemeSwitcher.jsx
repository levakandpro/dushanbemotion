import React, { useState, useEffect, createContext, useContext } from 'react';
import './ThemeSwitcher.css';

// Контекст темы
const ThemeContext = createContext();

export const THEMES = {
  dark: {
    name: 'Зелёная',
    icon: '🌲',
    class: 'theme-dark',
  },
  light: {
    name: 'Светлая',
    icon: '☀️',
    class: 'theme-light',
  },
  feminine: {
    name: 'Розовая',
    icon: '🌸',
    class: 'theme-feminine',
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  useEffect(() => {
    // Удаляем все классы тем
    Object.values(THEMES).forEach(t => {
      document.documentElement.classList.remove(t.class);
    });
    // Добавляем текущую тему
    document.documentElement.classList.add(THEMES[theme].class);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/**
 * Компонент переключателя темы
 */
export function ThemeSwitcher({ variant = 'dropdown' }) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const cycleTheme = () => {
    const themes = Object.keys(THEMES);
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  if (variant === 'cycle') {
    return (
      <button
        className="theme-switcher theme-switcher--cycle"
        onClick={cycleTheme}
        title={`Тема: ${THEMES[theme].name}`}
        type="button"
      >
        <span className="theme-switcher__icon">{THEMES[theme].icon}</span>
      </button>
    );
  }

  return (
    <div className="theme-switcher theme-switcher--dropdown">
      <button
        className="theme-switcher__trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="theme-switcher__icon">{THEMES[theme].icon}</span>
        <span className="theme-switcher__name">{THEMES[theme].name}</span>
      </button>
      
      {isOpen && (
        <div className="theme-switcher__menu">
          {Object.entries(THEMES).map(([key, value]) => (
            <button
              key={key}
              className={`theme-switcher__option ${theme === key ? 'is-active' : ''}`}
              onClick={() => {
                setTheme(key);
                setIsOpen(false);
              }}
              type="button"
            >
              <span>{value.icon}</span>
              <span>{value.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;
