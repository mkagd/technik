// components/GlobalSearch.js
// Globalny search z Ctrl+K - szuka po wszystkim

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  FiSearch, FiX, FiUser, FiCalendar, FiShoppingBag, 
  FiPhone, FiMail, FiMapPin, FiClock
} from 'react-icons/fi';

export default function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    clients: [],
    orders: [],
    reservations: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Skrót klawiszowy Ctrl+K lub Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ clients: [], orders: [], reservations: [] });
      return;
    }

    setLoading(true);
    try {
      const [clientsRes, ordersRes, reservationsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/orders'),
        fetch('/api/rezerwacje')
      ]);

      const clients = await clientsRes.json();
      const orders = await ordersRes.json();
      const reservations = await reservationsRes.json();

      const clientsArray = Array.isArray(clients) ? clients : (clients.clients || clients.data || []);
      const ordersArray = Array.isArray(orders) ? orders : (orders.orders || orders.data || []);
      const reservationsArray = Array.isArray(reservations) ? reservations : (reservations.rezerwacje || reservations.data || []);

      const searchLower = searchQuery.toLowerCase();

      // Filtruj klientów
      const filteredClients = clientsArray.filter(client =>
        client.name?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.phone?.includes(searchQuery) ||
        client.city?.toLowerCase().includes(searchLower)
      ).slice(0, 5);

      // Filtruj zamówienia
      const filteredOrders = ordersArray.filter(order =>
        order.clientName?.toLowerCase().includes(searchLower) ||
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.description?.toLowerCase().includes(searchLower) ||
        order.deviceType?.toLowerCase().includes(searchLower)
      ).slice(0, 5);

      // Filtruj rezerwacje
      const filteredReservations = reservationsArray.filter(res =>
        res.name?.toLowerCase().includes(searchLower) ||
        res.email?.toLowerCase().includes(searchLower) ||
        res.phone?.includes(searchQuery) ||
        res.city?.toLowerCase().includes(searchLower) ||
        res.category?.toLowerCase().includes(searchLower)
      ).slice(0, 5);

      setResults({
        clients: filteredClients,
        orders: filteredOrders,
        reservations: filteredReservations
      });
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults({ clients: [], orders: [], reservations: [] });
    setSelectedIndex(0);
  };

  const allResults = [
    ...results.reservations.map(r => ({ type: 'reservation', data: r })),
    ...results.orders.map(o => ({ type: 'order', data: o })),
    ...results.clients.map(c => ({ type: 'client', data: c }))
  ];

  const handleNavigate = (result) => {
    handleClose();
    
    switch (result.type) {
      case 'reservation':
        router.push(`/admin/rezerwacje/${result.data.id}`);
        break;
      case 'order':
        router.push(`/admin/zamowienia/${result.data.id}`);
        break;
      case 'client':
        router.push(`/admin/klienci/${result.data.clientId || result.data.id}`);
        break;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleNavigate(allResults[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  const totalResults = results.clients.length + results.orders.length + results.reservations.length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleClose}
      />

      {/* Search Modal */}
      <div className="fixed inset-x-4 top-4 sm:top-20 sm:left-1/2 sm:transform sm:-translate-x-1/2 w-auto sm:max-w-2xl z-50">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] sm:max-h-[600px] flex flex-col">
          {/* Search Input */}
          <div className="flex items-center px-3 sm:px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <FiSearch className="h-5 w-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Szukaj..."
              className="flex-1 outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400 min-w-0"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 mr-2 p-1"
              >
                <FiX className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Zamknij (ESC)"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm">Szukam...</p>
              </div>
            ) : totalResults === 0 && query ? (
              <div className="p-8 text-center text-gray-500">
                <FiSearch className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nie znaleziono wyników dla "{query}"</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Rezerwacje */}
                {results.reservations.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Rezerwacje ({results.reservations.length})
                    </div>
                    {results.reservations.map((reservation, index) => {
                      const globalIndex = index;
                      return (
                        <button
                          key={reservation.id}
                          onClick={() => handleNavigate({ type: 'reservation', data: reservation })}
                          className={`w-full px-3 sm:px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedIndex === globalIndex ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-2 sm:space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                              <FiCalendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {reservation.name}
                                </p>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {new Date(reservation.date).toLocaleDateString('pl-PL')}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <FiPhone className="h-3 w-3 mr-1" />
                                  {reservation.phone}
                                </span>
                                <span className="flex items-center truncate">
                                  <FiMapPin className="h-3 w-3 mr-1" />
                                  {reservation.city}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Zamówienia */}
                {results.orders.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Zamówienia ({results.orders.length})
                    </div>
                    {results.orders.map((order, index) => {
                      const globalIndex = results.reservations.length + index;
                      return (
                        <button
                          key={order.id}
                          onClick={() => handleNavigate({ type: 'order', data: order })}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedIndex === globalIndex ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <FiShoppingBag className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {order.clientName}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {order.orderNumber}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {order.deviceType} • {order.description?.substring(0, 50)}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Klienci */}
                {results.clients.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Klienci ({results.clients.length})
                    </div>
                    {results.clients.map((client, index) => {
                      const globalIndex = results.reservations.length + results.orders.length + index;
                      return (
                        <button
                          key={client.id}
                          onClick={() => handleNavigate({ type: 'client', data: client })}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedIndex === globalIndex ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <FiUser className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {client.name}
                              </p>
                              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                {client.phone && (
                                  <span className="flex items-center">
                                    <FiPhone className="h-3 w-3 mr-1" />
                                    {client.phone}
                                  </span>
                                )}
                                {client.email && (
                                  <span className="flex items-center truncate">
                                    <FiMail className="h-3 w-3 mr-1" />
                                    {client.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Keyboard hints */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded mr-1">↑↓</kbd>
                Nawiguj
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded mr-1">Enter</kbd>
                Otwórz
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded mr-1">ESC</kbd>
                Zamknij
              </span>
            </div>
            {totalResults > 0 && (
              <span>{totalResults} wyników</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
