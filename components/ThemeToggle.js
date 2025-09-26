// components/ThemeToggle.js - Elegancki przełącznik ciemny/jasny motyw

import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../utils/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme, mounted } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    
    // Reset animacji po 300ms
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  // Nie renderuj dopóki theme się nie załaduje
  if (!mounted) return null;

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex items-center justify-center
        w-14 h-8 rounded-full transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
        ${isDarkMode 
          ? 'bg-slate-700 hover:bg-slate-600 focus:ring-offset-slate-800' 
          : 'bg-gray-200 hover:bg-gray-300 focus:ring-offset-white'
        }
        ${isAnimating ? 'scale-105' : 'scale-100'}
      `}
      title={isDarkMode ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw'}
    >
      {/* Sliding Background */}
      <div
        className={`
          absolute inset-1 rounded-full transition-all duration-300 ease-in-out
          ${isDarkMode 
            ? 'bg-blue-600 transform translate-x-6' 
            : 'bg-yellow-400 transform translate-x-0'
          }
        `}
        style={{ width: '24px', height: '24px' }}
      />
      
      {/* Ikony */}
      <div className="relative flex items-center justify-between w-full px-2">
        {/* Ikona słońca - jasny motyw */}
        <FiSun 
          className={`
            w-4 h-4 transition-all duration-300
            ${!isDarkMode 
              ? 'text-white scale-110 rotate-180' 
              : 'text-gray-400 scale-90 rotate-0'
            }
          `}
        />
        
        {/* Ikona księżyca - ciemny motyw */}
        <FiMoon 
          className={`
            w-4 h-4 transition-all duration-300
            ${isDarkMode 
              ? 'text-white scale-110 rotate-12' 
              : 'text-gray-400 scale-90 rotate-0'
            }
          `}
        />
      </div>
      
      {/* Efekt świecenia przy hover */}
      <div 
        className={`
          absolute inset-0 rounded-full transition-opacity duration-300
          ${isDarkMode 
            ? 'bg-blue-400/20 opacity-0 group-hover:opacity-100' 
            : 'bg-yellow-300/20 opacity-0 group-hover:opacity-100'
          }
        `}
      />
    </button>
  );
};

export default ThemeToggle;