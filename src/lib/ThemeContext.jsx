import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const THEMES = ['light', 'dark', 'loflo'];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('cotask-theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'loflo');
    if (theme === 'dark') root.classList.add('dark');
    if (theme === 'loflo') root.classList.add('loflo');
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
