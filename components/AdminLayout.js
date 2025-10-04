// components/AdminLayout.js - Uniwersalny layout dla wszystkich stron admin

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import GlobalSearch from './GlobalSearch';
import { 
  FiHome, FiCalendar, FiUsers, FiShoppingBag, FiSettings, 
  FiMenu, FiX, FiBell, FiLogOut, FiUserCheck, FiChevronRight, FiClock, FiSearch, FiPackage, FiDollarSign
} from 'react-icons/fi';

export default function AdminLayout({ children, title, breadcrumbs = [] }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Domyślnie zamknięty na mobile
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check for unread notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        // Get unread count
        const countRes = await fetch('/api/notifications?count=unread');
        if (countRes.ok) {
          const data = await countRes.json();
          setNotificationCount(data.unreadCount || 0);
        }

        // Get all unread notifications for dropdown
        const notifRes = await fetch('/api/notifications?read=false');
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    checkNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  // Auto-close sidebar on mobile after navigation
  useEffect(() => {
    const handleRouteChange = () => {
      // Sprawdź czy jesteśmy na mobile (szerokość < 1024px)
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    router.events?.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    router.push('/');
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (res.ok) {
        // Refresh notifications
        setNotifications(prev => prev.filter(n => n.id !== id));
        setNotificationCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });
      
      if (res.ok) {
        setNotifications([]);
        setNotificationCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Navigation items with badges
  const navItems = [
    { 
      icon: FiHome, 
      label: 'Dashboard', 
      path: '/admin',
      active: router.pathname === '/admin'
    },
    { 
      icon: FiCalendar, 
      label: 'Rezerwacje', 
      path: '/admin/rezerwacje',
      badge: notificationCount,
      active: router.pathname.startsWith('/admin/rezerwacje')
    },
    { 
      icon: FiClock, 
      label: 'Kalendarz', 
      path: '/admin/kalendarz',
      active: router.pathname.startsWith('/admin/kalendarz')
    },
    { 
      icon: FiUserCheck, 
      label: 'Pracownicy', 
      path: '/admin/pracownicy',
      active: router.pathname.startsWith('/admin/pracownicy')
    },
    { 
      icon: FiUsers, 
      label: 'Klienci', 
      path: '/admin/klienci',
      active: router.pathname.startsWith('/admin/klienci')
    },
    { 
      icon: FiShoppingBag, 
      label: 'Zamówienia', 
      path: '/admin/zamowienia',
      active: router.pathname.startsWith('/admin/zamowienia')
    },
    { 
      icon: FiPackage, 
      label: 'Magazyn', 
      path: '/admin/magazyn',
      active: router.pathname.startsWith('/admin/magazyn')
    },
    { 
      icon: FiDollarSign, 
      label: 'Rozliczenia', 
      path: '/admin/rozliczenia',
      active: router.pathname.startsWith('/admin/rozliczenia')
    },
    { 
      icon: FiSettings, 
      label: 'Ustawienia', 
      path: '/admin/ustawienia',
      active: router.pathname.startsWith('/admin/ustawienia')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-20 -translate-x-full lg:translate-x-0'
      } ${sidebarOpen ? 'translate-x-0' : ''}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen ? (
            <>
              <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zwiń sidebar"
              >
                <FiX className="h-5 w-5 text-gray-600" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 hover:bg-gray-100 rounded-lg mx-auto transition-colors"
              title="Rozwiń sidebar"
            >
              <FiMenu className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                router.push(item.path);
                // Zamknij sidebar na mobile po kliknięciu
                if (window.innerWidth < 1024) {
                  setTimeout(() => setSidebarOpen(false), 300);
                }
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                item.active
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem] text-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}
              {!sidebarOpen && item.badge > 0 && (
                <span className="absolute right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title={!sidebarOpen ? 'Wyloguj' : undefined}
          >
            <FiLogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Wyloguj</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`transition-all duration-300 lg:ml-20 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Mobile menu button */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Menu"
              >
                <FiMenu className="h-6 w-6 text-gray-600" />
              </button>

              <div className="min-w-0 flex-1">
                {/* Breadcrumbs - hide on small screens */}
                {breadcrumbs.length > 0 && (
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 mb-1">
                    <button 
                      onClick={() => router.push('/admin')}
                      className="hover:text-blue-600 transition-colors"
                    >
                      Dashboard
                    </button>
                    {breadcrumbs.map((crumb, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FiChevronRight className="h-4 w-4" />
                        {crumb.path ? (
                          <button 
                            onClick={() => router.push(crumb.path)}
                            className="hover:text-blue-600 transition-colors truncate"
                          >
                            {crumb.label}
                          </button>
                        ) : (
                          <span className="text-gray-900 font-medium truncate">{crumb.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Title */}
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Global Search Button */}
              <button 
                onClick={() => {
                  const searchEvent = new KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                    bubbles: true
                  });
                  document.dispatchEvent(searchEvent);
                }}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Global Search (Ctrl+K)"
              >
                <FiSearch className="h-4 w-4" />
                <span className="hidden md:inline">Szukaj...</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded">
                  Ctrl+K
                </kbd>
              </button>

              {/* Mobile search button */}
              <button 
                onClick={() => {
                  const searchEvent = new KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                    bubbles: true
                  });
                  document.dispatchEvent(searchEvent);
                }}
                className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Szukaj"
              >
                <FiSearch className="h-5 w-5 text-gray-600" />
              </button>

              {/* Notifications */}
              <div className="relative notification-dropdown">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors"
                  title="Powiadomienia"
                >
                  <FiBell className="h-5 w-5 text-gray-600" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Powiadomienia</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Oznacz wszystkie
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <FiBell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>Brak nowych powiadomień</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.link) router.push(notif.link);
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                notif.type === 'error' ? 'bg-red-500' :
                                notif.type === 'warning' ? 'bg-yellow-500' :
                                notif.type === 'success' ? 'bg-green-500' :
                                'bg-blue-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(notif.createdAt).toLocaleString('pl-PL', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* User info - hide on mobile */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">Administrator</p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('pl-PL', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearch />
    </div>
  );
}
