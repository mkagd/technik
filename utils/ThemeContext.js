// utils/ThemeContext.js - Context do zarządzania motywem ciemny/jasny

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme musi być używany wewnątrz ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Domyślnie ciemny
  const [mounted, setMounted] = useState(false);

  // Ładowanie motywu z localStorage po załadowaniu komponentu
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Sprawdzenie preferencji systemowych
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
    setMounted(true);
  }, []);

  // Zapisywanie motywu do localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      // Dodanie klasy do body dla globalnych stylów
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode, mounted]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    mounted,
    // Kolory dla łatwego użycia w komponentach
    colors: {
      // Tła
      primary: isDarkMode ? 'bg-slate-900' : 'bg-white',
      secondary: isDarkMode ? 'bg-slate-800' : 'bg-gray-50',
      tertiary: isDarkMode ? 'bg-slate-700' : 'bg-gray-100',
      
      // Teksty
      textPrimary: isDarkMode ? 'text-white' : 'text-gray-900',
      textSecondary: isDarkMode ? 'text-slate-300' : 'text-gray-600',
      textTertiary: isDarkMode ? 'text-slate-400' : 'text-gray-500',
      
      // Bordy
      border: isDarkMode ? 'border-slate-700' : 'border-gray-200',
      borderHover: isDarkMode ? 'border-slate-600' : 'border-gray-300',
      
      // Karty/panele
      card: isDarkMode ? 'bg-slate-800' : 'bg-white',
      cardHover: isDarkMode ? 'bg-slate-700' : 'bg-gray-50',
      
      // Przyciski - akcenty pozostają bez zmian dla brandu
      accent: 'bg-blue-600',
      accentHover: 'bg-blue-700',
      accentSecondary: 'bg-purple-600',
      accentSecondaryHover: 'bg-purple-700',
      
      // Gradients - dostosowane do motywu
      gradient: isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20'
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50',
      
      cardGradient: isDarkMode
        ? 'bg-gradient-to-br from-slate-900 to-blue-900/20'
        : 'bg-gradient-to-br from-white to-blue-50/30'
    }
  };

  // Nie renderuj dopóki nie załadujemy motywu z localStorage
  if (!mounted) {
    return <div className="min-h-screen bg-slate-900"></div>;
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};