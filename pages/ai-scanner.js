// pages/ai-scanner.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FiArrowLeft,
  FiCamera,
  FiPackage,
  FiTool,
  FiUser,
  FiHome,
  FiSettings,
  FiCalendar,
  FiLogOut,
  FiChevronDown,
  FiZap,
  FiCpu,
  FiEye,
  FiSmartphone
} from 'react-icons/fi';
import SimpleAIScanner from '../components/SimpleAIScanner';

export default function AIScanner() {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scannedModels, setScannedModels] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeSession = localStorage.getItem('employeeSession');
      if (!employeeSession) {
        router.push('/pracownik-logowanie');
        return;
      }
      setEmployee(JSON.parse(employeeSession));
      
      // Załaduj zapisane modele
      const savedModels = localStorage.getItem('aiScanner_models');
      if (savedModels) {
        try {
          setScannedModels(JSON.parse(savedModels));
        } catch (error) {
          console.error('Error loading saved models:', error);
        }
      }
      
      setIsLoading(false);
    }
  }, [router]);

  // Zamknij user menu gdy kliknięto poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('employeeSession');
      router.push('/pracownik-logowanie');
    }
  };

  const handleModelDetected = (models) => {
    if (models && models.length > 0) {
      const newModels = models.map(model => ({
        ...model,
        scanDate: new Date().toISOString(),
        scannedBy: employee?.firstName + ' ' + employee?.lastName
      }));
      
      setScannedModels(prev => [...prev, ...newModels]);
      
      // Zapisz w localStorage
      const allModels = [...scannedModels, ...newModels];
      localStorage.setItem('aiScanner_models', JSON.stringify(allModels));
    }
  };

  const clearHistory = () => {
    if (confirm('Czy na pewno chcesz wyczyścić historię skanowania?')) {
      setScannedModels([]);
      localStorage.removeItem('aiScanner_models');
    }
  };

  const exportModels = () => {
    if (scannedModels.length === 0) {
      alert('Brak modeli do eksportu');
      return;
    }
    
    const dataStr = JSON.stringify(scannedModels, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `modele-skanowane-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie skanera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-6 w-6" />
              </button>
              <FiCpu className="h-6 w-6 md:h-8 md:w-8 text-purple-600 mr-2 md:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                  Skaner tabliczek
                </h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                  Zaawansowane rozpoznawanie modeli urządzeń
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* AI Status Indicator */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Skaner aktywny</span>
              </div>

              {/* User Menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}
                  </div>
                  <FiChevronDown className={`h-4 w-4 ml-1 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {employee?.firstName} {employee?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Serwisant AGD</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        router.push('/pracownik-panel');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiUser className="h-4 w-4 mr-3" />
                      Panel pracownika
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push('/kalendarz-pracownika-prosty');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiCalendar className="h-4 w-4 mr-3" />
                      Kalendarz
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push('/');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiHome className="h-4 w-4 mr-3" />
                      Strona główna
                    </button>
                    
                    <div className="border-t border-gray-100 mt-2">
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiLogOut className="h-4 w-4 mr-3" />
                        Wyloguj
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* AI Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white relative">
            <div className="flex items-center">
              <FiZap className="h-8 w-8 mr-3" />
              <div>
                <p className="text-blue-100 text-sm">Inteligentny skaner</p>
                <p className="text-lg font-bold">Główny system</p>
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-yellow-400 text-blue-900 text-xs px-2 py-1 rounded-full font-bold">
              ACTIVE
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white opacity-75">
            <div className="flex items-center">
              <FiEye className="h-8 w-8 mr-3" />
              <div>
                <p className="text-green-100 text-sm">OCR.space</p>
                <p className="text-lg font-bold">Fallback</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white opacity-75">
            <div className="flex items-center">
              <FiCpu className="h-8 w-8 mr-3" />
              <div>
                <p className="text-purple-100 text-sm">Google Vision</p>
                <p className="text-lg font-bold">Backup</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white opacity-75">
            <div className="flex items-center">
              <FiSmartphone className="h-8 w-8 mr-3" />
              <div>
                <p className="text-orange-100 text-sm">Tesseract OCR</p>
                <p className="text-lg font-bold">Lokalny</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna - AI Scanner */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiCamera className="h-5 w-5 mr-2" />
                  Skanowanie modelu urządzenia
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Wykonaj zdjęcie tabliczki modelu, a system automatycznie rozpozna i wypełni dane
                </p>
              </div>
              
              <div className="p-6">
                <SimpleAIScanner 
                  onModelDetected={handleModelDetected}
                  employeeInfo={{
                    name: employee?.firstName + ' ' + employee?.lastName,
                    id: employee?.id
                  }}
                />
              </div>
            </div>

            {/* Jak to działa */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiTool className="h-5 w-5 mr-2" />
                  Jak działa skaner?
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Zrób zdjęcie</h3>
                        <p className="text-sm text-gray-600">Sfotografuj tabliczkę modelu urządzenia</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">System rozpoznaje</h3>
                        <p className="text-sm text-gray-600">Zaawansowana analiza obrazu</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">3</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Wyszukuje w bazie</h3>
                        <p className="text-sm text-gray-600">Dopasowuje do bazy części</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-sm">4</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Gotowe!</h3>
                        <p className="text-sm text-gray-600">Model i części automatycznie dodane</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prawa kolumna */}
          <div className="space-y-6">
            
            {/* Historia skanowania */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiPackage className="h-5 w-5 mr-2" />
                    Historia skanowania
                  </h2>
                  {scannedModels.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={exportModels}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        Eksport
                      </button>
                      <button
                        onClick={clearHistory}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                      >
                        Wyczyść
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {scannedModels.length === 0 ? (
                  <div className="text-center py-8">
                    <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Brak zeskanowanych modeli</p>
                    <p className="text-sm text-gray-400 mt-1">Wykonaj pierwsze skanowanie!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {scannedModels.slice().reverse().map((model, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm text-gray-900">
                              {model.brand} {model.model}
                            </h3>
                            <p className="text-xs text-gray-600">{model.name}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            model.source === 'ocr' ? 'bg-blue-100 text-blue-800' :
                            model.source === 'database' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {model.source === 'ocr' ? 'OCR' :
                             model.source === 'database' ? 'Baza' : 'Ręczny'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <p>
                            {new Date(model.scanDate).toLocaleDateString('pl-PL')} {' '}
                            {new Date(model.scanDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p>Skanował: {model.scannedBy}</p>
                          {model.parts && model.parts.length > 0 && (
                            <p className="text-blue-600 mt-1">
                              <FiPackage className="inline mr-1" />
                              {model.parts.length} części dostępnych
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Statystyki AI */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiCpu className="h-5 w-5 mr-2" />
                  Statystyki AI
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Zeskanowane modele</span>
                  <span className="font-semibold text-gray-900">{scannedModels.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Udane rozpoznania</span>
                  <span className="font-semibold text-green-600">
                    {scannedModels.filter(m => m.source === 'ocr' || m.source === 'database').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Dostępne części</span>
                  <span className="font-semibold text-blue-600">
                    {scannedModels.reduce((total, model) => total + (model.parts?.length || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Dzisiaj skanowane</span>
                  <span className="font-semibold text-purple-600">
                    {scannedModels.filter(m => {
                      const scanDate = new Date(m.scanDate);
                      const today = new Date();
                      return scanDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Szybkie akcje */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiZap className="h-5 w-5 mr-2" />
                  Szybkie akcje
                </h2>
              </div>
              
              <div className="p-6 space-y-3">
                <button
                  onClick={() => router.push('/pracownik-panel')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiUser className="h-4 w-4 mr-2" />
                  Panel pracownika
                </button>
                
                <button
                  onClick={() => router.push('/kalendarz-pracownika-prosty')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiCalendar className="h-4 w-4 mr-2" />
                  Mój kalendarz
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FiCpu className="h-4 w-4 mr-2" />
                  Resetuj scanner
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}