// pages/admin/ustawienia/index.js
// Główna strona ustawień systemu

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { 
  FiSettings, FiCpu, FiShield, FiDatabase, FiMail, 
  FiBell, FiMap, FiUsers, FiImage, FiKey, FiServer, FiCloud
} from 'react-icons/fi';

export default function AdminUstawienia() {
  const router = useRouter();

  const settingsSections = [
    {
      id: 'general',
      title: 'Ogólne',
      icon: FiSettings,
      description: 'Podstawowe ustawienia aplikacji',
      color: 'blue',
      items: [
        { label: 'Nazwa firmy', value: 'Serwis AGD' },
        { label: 'Adres email', value: 'kontakt@serwisagd.pl' },
        { label: 'Telefon kontaktowy', value: '+48 123 456 789' }
      ]
    },
    {
      id: 'ai',
      title: 'Konfiguracja AI',
      icon: FiCpu,
      description: 'Ustawienia OpenAI, Google Vision OCR',
      color: 'purple',
      items: [
        { label: 'OpenAI API', value: 'Skonfigurowane' },
        { label: 'Google Vision', value: 'Aktywne' },
        { label: 'OCR System', value: 'Włączone' }
      ]
    },
    {
      id: 'privacy',
      title: 'Prywatność i RODO',
      icon: FiShield,
      description: 'Ustawienia zgodności z RODO',
      color: 'green',
      items: [
        { label: 'Zgody użytkowników', value: 'Wymagane' },
        { label: 'Czas przechowywania danych', value: '5 lat' },
        { label: 'Logi dostępu', value: 'Aktywne' }
      ]
    },
    {
      id: 'database',
      title: 'Baza danych',
      icon: FiDatabase,
      description: 'Zarządzanie danymi i kopiami zapasowymi',
      color: 'indigo',
      items: [
        { label: 'Backup automatyczny', value: 'Codziennie 02:00' },
        { label: 'Ostatni backup', value: new Date().toLocaleDateString('pl-PL') },
        { label: 'Rozmiar bazy', value: '245 MB' }
      ]
    },
    {
      id: 'notifications',
      title: 'Powiadomienia',
      icon: FiBell,
      description: 'Konfiguracja alertów i powiadomień',
      color: 'yellow',
      items: [
        { label: 'Email notifications', value: 'Włączone' },
        { label: 'SMS notifications', value: 'Wyłączone' },
        { label: 'Push notifications', value: 'Włączone' }
      ]
    },
    {
      id: 'maps',
      title: 'Mapy i routing',
      icon: FiMap,
      description: 'Google Maps API, optymalizacja tras',
      color: 'red',
      items: [
        { label: 'Google Maps API', value: 'Aktywne' },
        { label: 'Inteligentny routing', value: 'Włączony' },
        { label: 'Radius serwisowy', value: '50 km' }
      ]
    },
    {
      id: 'users',
      title: 'Użytkownicy i uprawnienia',
      icon: FiUsers,
      description: 'Zarządzanie kontami i rolami',
      color: 'teal',
      items: [
        { label: 'Liczba użytkowników', value: '8 aktywnych' },
        { label: 'Role systemowe', value: 'Admin, Technik, Biuro' },
        { label: 'Dwuetapowa weryfikacja', value: 'Zalecane' }
      ]
    },
    {
      id: 'media',
      title: 'Media i pliki',
      icon: FiImage,
      description: 'Zarządzanie zdjęciami i dokumentami',
      color: 'pink',
      items: [
        { label: 'Maksymalny rozmiar pliku', value: '10 MB' },
        { label: 'Formaty zdjęć', value: 'JPG, PNG, WebP' },
        { label: 'Kompresja zdjęć', value: 'Automatyczna' }
      ]
    }
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', hover: 'hover:border-blue-400' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', hover: 'hover:border-purple-400' },
    green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', hover: 'hover:border-green-400' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', hover: 'hover:border-indigo-400' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600', hover: 'hover:border-yellow-400' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', hover: 'hover:border-red-400' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', hover: 'hover:border-teal-400' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-600', hover: 'hover:border-pink-400' }
  };

  return (
    <AdminLayout 
      title="Ustawienia"
      breadcrumbs={[
        { label: 'Ustawienia' }
      ]}
    >
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-600">
          Zarządzaj konfiguracją systemu, integracjami i ustawieniami bezpieczeństwa
        </p>
      </div>

      {/* Settings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          const colors = colorClasses[section.color];

          return (
            <div 
              key={section.id}
              className={`${colors.bg} rounded-lg border-2 ${colors.border} ${colors.hover} p-6 transition-all cursor-pointer`}
              onClick={() => alert(`Sekcja "${section.title}" - wkrótce dostępna`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
                  <Icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {section.description}
              </p>

              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{item.label}:</span>
                    <span className="font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Edytuj ustawienia →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* System info */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiServer className="mr-2 h-5 w-5 text-gray-600" />
          Informacje systemowe
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Wersja aplikacji</div>
            <div className="text-lg font-semibold text-gray-900">v2.1.0</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Środowisko</div>
            <div className="text-lg font-semibold text-gray-900">Production</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Ostatnia aktualizacja</div>
            <div className="text-lg font-semibold text-gray-900">{new Date().toLocaleDateString('pl-PL')}</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FiKey className="mr-2 h-4 w-4 text-blue-600" />
          Szybkie akcje
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            onClick={() => alert('Backup bazy - funkcja wkrótce')}
            className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <FiDatabase className="inline mr-2 h-4 w-4" />
            Utwórz backup bazy
          </button>
          <button 
            onClick={() => alert('Test połączeń API - funkcja wkrótce')}
            className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <FiCloud className="inline mr-2 h-4 w-4" />
            Test połączeń API
          </button>
          <button 
            onClick={() => alert('Czyszczenie cache - funkcja wkrótce')}
            className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <FiServer className="inline mr-2 h-4 w-4" />
            Wyczyść cache
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
