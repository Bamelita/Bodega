import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

export const THEMES = [
  { name: 'Morado', color: '#7c3aed', light: '#a78bfa' },
  { name: 'Azul', color: '#2563eb', light: '#60a5fa' },
  { name: 'Esmeralda', color: '#059669', light: '#34d399' },
  { name: 'Rosa', color: '#db2777', light: '#f472b6' },
  { name: 'Naranja', color: '#ea580c', light: '#fb923c' },
];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [themeColor, setThemeColor] = useState(THEMES[0].color); // Default purple

  // Initialize Color from API or LocalStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('themeColor');
    if (savedColor) setThemeColor(savedColor);

    // Fetch from API to sync
    api.get('/settings/system').then(r => {
      if (r.data.themeColor) {
        setThemeColor(r.data.themeColor);
        localStorage.setItem('themeColor', r.data.themeColor);
      }
    }).catch(() => { });
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    if (darkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Listen for storage changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setDarkMode(e.newValue === 'dark');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Apply Theme Color to CSS Variable
  useEffect(() => {
    const selected = THEMES.find(t => t.color === themeColor) || THEMES[0];
    document.documentElement.style.setProperty('--purple', selected.color);
    document.documentElement.style.setProperty('--purple-light', selected.light);
    localStorage.setItem('themeColor', themeColor);
  }, [themeColor]);

  const toggleTheme = () => setDarkMode(prev => !prev);

  const changeThemeColor = (color) => {
    setThemeColor(color);
    api.patch('/settings/system', { themeColor: color }).catch(console.error);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, themeColor, changeThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
