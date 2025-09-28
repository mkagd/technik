// pages/logowanie-wybor.js - Ujednolicona strona wyboru logowania

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiUsers, FiUser, FiArrowRight, FiHome } from 'react-icons/fi';

export default function LogowanieWybor() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <FiUsers className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Wybierz typ logowania
          </h1>
          <p className="text-gray-600 text-lg">
            Zaloguj się jako klient lub pracownik
          </p>
        </div>

        {/* Opcje logowania */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Logowanie klientów */}
          <div 
            className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 cursor-pointer ${
              hoveredCard === 'client' 
                ? 'border-blue-500 shadow-xl transform scale-105' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onMouseEnter={() => setHoveredCard('client')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => router.push('/logowanie')}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <FiUser className="h-10 w-10 text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Jestem Klientem
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Zaloguj się jako klient, żeby składać zlecenia, sprawdzać status napraw 
                i zarządzać swoimi urządzeniami.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Logowanie przez Google
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Składanie zleceń online
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Śledzenie statusu napraw
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                <span>Zaloguj jako Klient</span>
                <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Logowanie pracowników */}
          <div 
            className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 cursor-pointer ${
              hoveredCard === 'employee' 
                ? 'border-green-500 shadow-xl transform scale-105' 
                : 'border-gray-200 hover:border-green-300'
            }`}
            onMouseEnter={() => setHoveredCard('employee')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => router.push('/pracownik-logowanie')}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <FiUsers className="h-10 w-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Jestem Pracownikiem
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Panel dla pracowników serwisu. Zarządzaj zleceniami, 
                aktualizuj statusy napraw i komunikuj się z klientami.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Panel pracownika
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Zarządzanie zleceniami
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Kalendarz pracy
                </div>
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                <span>Zaloguj jako Pracownik</span>
                <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Powrót do strony głównej */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiHome className="h-4 w-4" />
            <span>Powrót do strony głównej</span>
          </Link>
        </div>
      </div>
    </div>
  );
}