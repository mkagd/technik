// components/AccountButton.js - Zunifikowany przycisk Moje Konto

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  FiUser, 
  FiChevronDown, 
  FiLogOut, 
  FiHome,
  FiSettings
} from 'react-icons/fi';
import { detectUserRole, getRoleIcon, getRoleButtonText, getRoleDescription } from '../utils/roleDetector';

export default function AccountButton() {
  const [userInfo, setUserInfo] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Wykryj rolę użytkownika przy ładowaniu
    const roleInfo = detectUserRole();
    setUserInfo(roleInfo);
    setIsLoading(false);

    // Aktualizuj informacje o użytkowniku co 5 sekund (na wypadek zmiany stanu logowania)
    const interval = setInterval(() => {
      const updatedRoleInfo = detectUserRole();
      setUserInfo(updatedRoleInfo);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Zamknij dropdown gdy kliknięto poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.account-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const handleAccountClick = () => {
    if (userInfo && userInfo.route) {
      router.push(userInfo.route);
    } else {
      // Fallback - przekieruj do logowania klienta
      router.push('/client/login');
    }
  };

  const handleLogout = () => {
    // Wyloguj użytkownika w zależności od roli
    if (userInfo.role === 'admin') {
      sessionStorage.removeItem('adminAuth');
      localStorage.removeItem('adminAuth');
    } else if (userInfo.role === 'employee') {
      localStorage.removeItem('employeeSession');
    } else if (userInfo.role === 'client') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberedTechnikUser');
      localStorage.removeItem('chatUserInfo');
      localStorage.removeItem('chatHistory');
    }

    // Odśwież informacje o użytkowniku
    const roleInfo = detectUserRole();
    setUserInfo(roleInfo);
    setShowDropdown(false);

    // Przekieruj na stronę główną
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
      </div>
    );
  }

  // Jeśli to gość, pokaż prosty przycisk logowania - dostosowany do mobile
  if (userInfo.role === 'guest') {
    return (
      <button
        onClick={() => router.push('/client/login')}
        className="px-2 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-white flex items-center space-x-1 sm:space-x-2 text-sm"
      >
        <FiUser className="h-4 w-4" />
        <span className="hidden sm:inline">Logowanie</span>
        <span className="sm:hidden">👤</span>
      </button>
    );
  }

  // Dla zalogowanych użytkowników pokaż dropdown - dostosowany do mobile
  return (
    <div className="relative account-dropdown">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-1 sm:space-x-3 px-2 sm:px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors text-gray-700 hover:text-gray-900 text-sm"
      >
        <div className="flex items-center space-x-1 sm:space-x-2">
          <span className="text-base sm:text-lg">{getRoleIcon(userInfo.role)}</span>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium">
              {userInfo.displayName || getRoleButtonText(userInfo.role)}
            </div>
            {userInfo.email && (
              <div className="text-xs text-gray-500 hidden sm:block">
                {userInfo.email}
              </div>
            )}
          </div>
        </div>
        <FiChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - dostosowany do mobile */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getRoleIcon(userInfo.role)}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {userInfo.displayName || 'Użytkownik'}
                </p>
                {userInfo.email && (
                  <p className="text-xs text-gray-500">{userInfo.email}</p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  {getRoleDescription(userInfo.role)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="py-2">
            <button
              onClick={handleAccountClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-3">{getRoleIcon(userInfo.role)}</span>
              {getRoleButtonText(userInfo.role)}
            </button>
            
            <button
              onClick={() => {
                router.push('/');
                setShowDropdown(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FiHome className="h-4 w-4 mr-3" />
              Strona główna
            </button>

            {userInfo.role === 'admin' && (
              <>
                <button
                  onClick={() => {
                    router.push('/admin-harmonogram');
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FiSettings className="h-4 w-4 mr-3" />
                  Harmonogram
                </button>
                <button
                  onClick={() => {
                    router.push('/admin-zgloszenia');
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  📋 Zgłoszenia
                </button>
              </>
            )}

            {userInfo.role === 'employee' && (
              <button
                onClick={() => {
                  router.push('/kalendarz-pracownika');
                  setShowDropdown(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FiSettings className="h-4 w-4 mr-3" />
                Kalendarz
              </button>
            )}
          </div>
          
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <FiLogOut className="h-4 w-4 mr-3" />
              Wyloguj się
            </button>
          </div>
        </div>
      )}
    </div>
  );
}