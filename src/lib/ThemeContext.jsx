import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const THEMES = ['light', 'dark'];
const normalizeTheme = (value) => THEMES.includes(value) ? value : 'light';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => normalizeTheme(localStorage.getItem('cotask-theme')));

  const setTheme = (nextTheme) => {
    setThemeState((current) => normalizeTheme(typeof nextTheme === 'function' ? nextTheme(current) : nextTheme));
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    if (theme === 'dark') root.classList.add('dark');
    localStorage.setItem('cotask-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      const index = THEMES.indexOf(current);
      return THEMES[(index + 1) % THEMES.length];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
