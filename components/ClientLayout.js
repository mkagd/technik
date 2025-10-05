// components/ClientLayout.js
// Layout dla panelu klienta z nawigacją

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { formatAddress } from '../utils/formatAddress';
import { 
  FiHome, FiPackage, FiSettings, FiLogOut, FiUser, FiMenu, FiX,
  FiShoppingBag, FiClock, FiTool
} from 'react-icons/fi';

export default function ClientLayout({ children }) {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Load client data from localStorage
    const clientData = localStorage.getItem('clientData');
    const token = localStorage.getItem('clientToken');

    if (!token || !clientData) {
      router.push('/client/login');
      return;
    }

    try {
      setClient(JSON.parse(clientData));
    } catch (err) {
      console.error('Error loading client data:', err);
      router.push('/client/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientData');
    localStorage.removeItem('clientId');
    router.push('/client/login');
  };

  const menuItems = [
    {
      href: '/client/dashboard',
      icon: FiHome,
      label: 'Dashboard',
      description: 'Przegląd zleceń'
    },
    {
      href: '/client/new-order',
      icon: FiShoppingBag,
      label: 'Nowe zlecenie',
      description: 'Utwórz nowe zgłoszenie'
    },
    {
      href: '/client/settings',
      icon: FiSettings,
      label: 'Ustawienia',
      description: 'Dane kontaktowe'
    }
  ];

  const isActivePage = (href) => {
    return router.pathname === href;
  };

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FiUser size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{client.name}</h2>
              <p className="text-sm text-blue-100 truncate">{client.email || client.phone}</p>
            </div>
          </div>
          <div className="text-xs text-blue-100 bg-white/10 rounded-lg px-3 py-2">
            ID: {client.id || client.clientId}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePage(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-gray-100 hover:transform hover:scale-105'
                    }
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-white' : 'text-gray-600'} />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    {!isActive && (
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    )}
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Client Info Card */}
        <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FiUser className="text-blue-600" />
            Twoje dane
          </h3>
          <div className="space-y-2 text-sm">
            {client.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <FiShoppingBag size={14} className="text-blue-600" />
                <span className="truncate">{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <FiPackage size={14} className="text-purple-600" />
                <span className="truncate text-xs">{typeof client.address === 'object' ? formatAddress(client.address) : client.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            <FiLogOut size={18} />
            Wyloguj się
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs text-gray-500">
          <p>Panel Klienta</p>
          <p className="mt-1">© 2025 System AGD</p>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-72 min-h-screen">
        <div className="p-4 lg:p-8">
          {/* Top Bar - Mobile */}
          <div className="lg:hidden mb-6 pt-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Panel Klienta
            </h1>
          </div>

          {/* Content */}
          <main className="max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
