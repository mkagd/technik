// components/AdminLayout.js - Uniwersalny layout dla wszystkich stron admin

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import GlobalSearch from './GlobalSearch';
import { 
  FiHome, FiCalendar, FiUsers, FiShoppingBag, FiSettings, 
  FiMenu, FiX, FiBell, FiLogOut, FiUserCheck, FiChevronRight, FiClock, FiSearch, FiPackage, FiDollarSign, FiFileText, FiTool, FiGlobe
} from 'react-icons/fi';

export default function AdminLayout({ children, title, breadcrumbs = [] }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Domyślnie zamknięty na mobile
  const [notificationCount, setNotificationCount] = useState(0); // Dzwonek - WSZYSTKIE
  
  // 🔒 AUTHENTICATION CHECK
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Badge counts z priorytetem (error > info > success)
  const [reservationsBadge, setReservationsBadge] = useState({ count: 0, type: 'info' });
  const [ordersBadge, setOrdersBadge] = useState({ count: 0, type: 'info' });
  const [magazynBadge, setMagazynBadge] = useState({ count: 0, type: 'info' });
  const [logistykaBadge, setLogistykaBadge] = useState({ count: 0, type: 'info' });
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // 🔧 Funkcja do natychmiastowego odświeżania badge'y (wywoływana po zmianach)
  const refreshBadges = async () => {
    try {
      console.log('🔄 Refreshing badges...');
      
      // Odśwież badge rezerwacji
      const rezRes = await fetch('/api/rezerwacje');
      if (rezRes.ok) {
        const data = await rezRes.json();
        // API może zwrócić tablicę lub obiekt { rezerwacje: [...] }
        const rezerwacje = Array.isArray(data) ? data : (data.rezerwacje || []);
        console.log('📊 Total reservations:', rezerwacje.length);
        const pendingCount = rezerwacje.filter(r => 
          r.status === 'pending' && !r.orderId && !r.convertedToOrder
        ).length;
        console.log('✅ Pending reservations (no orderId):', pendingCount);
        setReservationsBadge({ 
          count: pendingCount, 
          type: pendingCount > 0 ? 'info' : 'success'
        });
        console.log('✅ Reservations badge updated to:', pendingCount);
      }
      
      // Odśwież badge zleceń
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        // API może zwrócić tablicę lub obiekt { orders: [...] }
        const orders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);
        console.log('📊 Total orders:', orders.length);
        const activeOrdersCount = orders.filter(o => 
          !o.reservationId && o.status !== 'completed' && o.status !== 'cancelled'
        ).length;
        console.log('✅ Active orders (no reservationId):', activeOrdersCount);
        setOrdersBadge({ 
          count: activeOrdersCount, 
          type: activeOrdersCount > 0 ? 'info' : 'success'
        });
        console.log('✅ Orders badge updated to:', activeOrdersCount);
      }
      
      // Odśwież badge magazynu (zamówienia części pending)
      const partRequestsRes = await fetch('/api/part-requests?status=pending');
      if (partRequestsRes.ok) {
        const partRequestsData = await partRequestsRes.json();
        const partRequests = partRequestsData.requests || [];
        const pendingRequestsCount = partRequests.length;
        console.log('📊 Part requests pending:', pendingRequestsCount);
        setMagazynBadge({ 
          count: pendingRequestsCount, 
          type: pendingRequestsCount > 0 ? 'error' : 'success' // error = pilne/czerwony
        });
        console.log('✅ Magazyn badge updated to:', pendingRequestsCount);
      }
    } catch (error) {
      console.error('❌ Error refreshing badges:', error);
    }
  };
  
  // 🔧 Expose refreshBadges globally so it can be called from other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.refreshAdminBadges = refreshBadges;
      console.log('✅ window.refreshAdminBadges registered');
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.refreshAdminBadges;
      }
    };
  }, [refreshBadges]);

  // 🔒 CHECK AUTHENTICATION - Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (!token || !userData) {
          console.warn('🔒 No auth token found, redirecting to login...');
          router.push('/admin/login');
          return;
        }
        
        const user = JSON.parse(userData);
        
        // Sprawdź czy token nie wygasł (prosty check - w produkcji użyj JWT decode)
        const tokenData = parseJWT(token);
        if (tokenData && tokenData.exp) {
          const expirationDate = new Date(tokenData.exp * 1000);
          if (expirationDate < new Date()) {
            console.warn('🔒 Token expired, redirecting to login...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            router.push('/admin/login');
            return;
          }
        }
        
        // Sprawdź czy użytkownik ma odpowiednie uprawnienia
        const allowedRoles = ['admin', 'manager', 'employee', 'logistyk'];
        if (!allowedRoles.includes(user.role)) {
          console.error('🔒 Unauthorized role:', user.role);
          router.push('/admin/login');
          return;
        }
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        setAuthLoading(false);
      } catch (error) {
        console.error('🔒 Auth check error:', error);
        router.push('/admin/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Helper function to parse JWT token
  const parseJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

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
        // Get all unread notifications for dropdown
        const notifRes = await fetch('/api/notifications?read=false');
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data);
          
          // Helper: Get priority type for a category (error > info > success)
          const getPriorityType = (notifs) => {
            if (notifs.some(n => n.type === 'error')) return 'error';
            if (notifs.some(n => n.type === 'info')) return 'info';
            if (notifs.some(n => n.type === 'success')) return 'success';
            return 'info';
          };
          
          // Categorize notifications by link
          const total = data.length;
          const reservationsNotifs = data.filter(n => n.link && n.link.startsWith('/admin/rezerwacje'));
          const ordersNotifs = data.filter(n => n.link && n.link.startsWith('/admin/zamowienia'));
          const magazynNotifs = data.filter(n => n.link && n.link.startsWith('/admin/magazyn'));
          const logistykaNotifs = data.filter(n => n.link && n.link.startsWith('/admin/logistyk'));
          
          // 🔧 Badge dla rezerwacji pokazuje tylko rezerwacje pending (nieprzetworzone)
          // Pobierz aktualną liczbę rezerwacji pending zamiast liczyć notyfikacje
          try {
            const rezRes = await fetch('/api/rezerwacje');
            if (rezRes.ok) {
              const rezData = await rezRes.json();
              // API może zwrócić tablicę lub obiekt { rezerwacje: [...] }
              const rezerwacje = Array.isArray(rezData) ? rezData : (rezData.rezerwacje || []);
              const pendingCount = rezerwacje.filter(r => 
                r.status === 'pending' && !r.orderId && !r.convertedToOrder
              ).length;
              setReservationsBadge({ 
                count: pendingCount, 
                type: pendingCount > 0 ? 'info' : 'success'
              });
            } else {
              // Fallback: użyj liczby notyfikacji jeśli API nie działa
              setReservationsBadge({ count: reservationsNotifs.length, type: getPriorityType(reservationsNotifs) });
            }
          } catch (error) {
            console.error('Error fetching reservations:', error);
            // Fallback: użyj liczby notyfikacji
            setReservationsBadge({ count: reservationsNotifs.length, type: getPriorityType(reservationsNotifs) });
          }
          
          // 🔧 Badge dla zleceń pokazuje tylko zlecenia bez reservationId (nie przekonwertowane z rezerwacji)
          try {
            const ordersRes = await fetch('/api/orders');
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              // API może zwrócić tablicę lub obiekt { orders: [...] }
              const orders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);
              const activeOrdersCount = orders.filter(o => 
                !o.reservationId && o.status !== 'completed' && o.status !== 'cancelled'
              ).length;
              console.log('📊 Total orders:', orders.length);
              console.log('✅ Active orders (no reservationId):', activeOrdersCount);
              setOrdersBadge({ 
                count: activeOrdersCount, 
                type: activeOrdersCount > 0 ? 'info' : 'success'
              });
            } else {
              // Fallback: użyj liczby notyfikacji jeśli API nie działa
              setOrdersBadge({ count: ordersNotifs.length, type: getPriorityType(ordersNotifs) });
            }
          } catch (error) {
            console.error('Error fetching orders:', error);
            // Fallback: użyj liczby notyfikacji
            setOrdersBadge({ count: ordersNotifs.length, type: getPriorityType(ordersNotifs) });
          }
          
          // 🔧 Badge dla magazynu pokazuje zamówienia części pending (do zaakceptowania)
          try {
            const partRequestsRes = await fetch('/api/part-requests?status=pending');
            if (partRequestsRes.ok) {
              const partRequestsData = await partRequestsRes.json();
              const partRequests = partRequestsData.requests || [];
              const pendingRequestsCount = partRequests.length;
              setMagazynBadge({ 
                count: pendingRequestsCount, 
                type: pendingRequestsCount > 0 ? 'error' : 'success' // error = pilne/czerwony
              });
            } else {
              // Fallback: użyj liczby notyfikacji jeśli API nie działa
              setMagazynBadge({ count: magazynNotifs.length, type: getPriorityType(magazynNotifs) });
            }
          } catch (error) {
            console.error('Error fetching part requests:', error);
            // Fallback: użyj liczby notyfikacji
            setMagazynBadge({ count: magazynNotifs.length, type: getPriorityType(magazynNotifs) });
          }
          
          setNotificationCount(total);
          setLogistykaBadge({ count: logistykaNotifs.length, type: getPriorityType(logistykaNotifs) });
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
    // Wyczyść dane uwierzytelniania
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('adminAuth'); // legacy
    
    console.log('👋 User logged out');
    
    // Przekieruj do strony logowania
    router.push('/admin/login');
  };

  // Helper: Get badge color based on notification type
  const getBadgeColor = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-500'; // Czerwony - PILNE/BŁĄD
      case 'info':
        return 'bg-yellow-500'; // Żółty - INFORMACJA/DO ZROBIENIA
      case 'success':
        return 'bg-green-500'; // Zielony - SUKCES/UKOŃCZONE
      default:
        return 'bg-blue-500'; // Niebieski - DEFAULT
    }
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

  // 🔒 Loading screen during authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Sprawdzanie uprawnień...</p>
        </div>
      </div>
    );
  }

  // 🔒 If not authenticated, don't render anything (redirect happens in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Navigation items with badges
  const navItems = [
    { 
      icon: FiHome, 
      label: 'Dashboard', 
      path: '/admin',
      active: router.pathname === '/admin'
    },
    { 
      icon: FiUsers, 
      label: '👤 Panel Klienta', 
      path: '/client/login',
      active: router.pathname.startsWith('/client'),
      external: true,
      color: 'text-pink-600'
    },
    { 
      icon: FiFileText, 
      label: 'Zgłoszenia', 
      path: '/admin/rezerwacje',
      badge: reservationsBadge,
      active: router.pathname.startsWith('/admin/rezerwacje')
    },
    { 
      icon: FiTool, 
      label: 'Zlecenia', 
      path: '/admin/zamowienia',
      badge: ordersBadge,
      active: router.pathname.startsWith('/admin/zamowienia')
    },
    { 
      icon: FiCalendar, 
      label: 'Kalendarz Wizyt', 
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
      icon: FiPackage, 
      label: 'Magazyn', 
      path: '/admin/magazyn',
      badge: magazynBadge,
      active: router.pathname.startsWith('/admin/magazyn') && !router.pathname.startsWith('/admin/allegro')
    },
    { 
      icon: FiTool, 
      label: 'Logistyka', 
      path: '/admin/logistyk/zamowienia',
      badge: logistykaBadge,
      active: router.pathname.startsWith('/admin/logistyk')
    },
    { 
      icon: FiShoppingBag, 
      label: 'Allegro (zakupy)', 
      path: '/admin/allegro/search',
      active: router.pathname.startsWith('/admin/allegro')
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
      active: router.pathname === '/admin/ustawienia'
    },
    { 
      icon: FiGlobe, 
      label: 'Ustawienia strony', 
      path: '/admin/ustawienia-strony',
      active: router.pathname.startsWith('/admin/ustawienia-strony')
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
                if (item.external) {
                  // Dla external linków otwórz w nowej karcie lub tym samym oknie
                  window.location.href = item.path;
                } else {
                  router.push(item.path);
                }
                // Zamknij sidebar na mobile po kliknięciu
                if (window.innerWidth < 1024) {
                  setTimeout(() => setSidebarOpen(false), 300);
                }
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                item.active
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : item.color 
                    ? `${item.color} hover:bg-pink-50`
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${item.color || ''}`} />
              {sidebarOpen && (
                <>
                  <span className={`flex-1 text-left font-medium ${item.color || ''}`}>{item.label}</span>
                  {item.badge && item.badge.count > 0 && (
                    <span className={`${getBadgeColor(item.badge.type)} text-white text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem] text-center`}>
                      {item.badge.count > 99 ? '99+' : item.badge.count}
                    </span>
                  )}
                </>
              )}
              {!sidebarOpen && item.badge && item.badge.count > 0 && (
                <span className={`absolute right-2 w-2 h-2 ${getBadgeColor(item.badge.type)} rounded-full`}></span>
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          {/* User info */}
          {currentUser && sidebarOpen && (
            <div className="mb-3 px-4 py-2 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-600 truncate">{currentUser.email}</p>
              <p className="text-xs text-blue-600 font-medium mt-1">
                {currentUser.role === 'admin' && '👑 Administrator'}
                {currentUser.role === 'manager' && '📊 Kierownik'}
                {currentUser.role === 'logistyk' && '📦 Logistyk'}
                {currentUser.role === 'employee' && '👤 Pracownik'}
              </p>
            </div>
          )}
          
          {/* Logout button */}
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
