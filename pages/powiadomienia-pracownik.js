// pages/powiadomienia-pracownik.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FiBell,
  FiUser,
  FiLogOut,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiClock,
  FiMail,
  FiPhone,
  FiTool,
  FiAlertCircle,
  FiSettings,
  FiTrash2,
  FiEye,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';

export default function PowiadomieniaPracownik() {
  const [employee, setEmployee] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all'); // all, new, booking, system
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    newBookings: true,
    bookingChanges: true,
    systemUpdates: true,
    emailNotifications: true,
    pushNotifications: false
  });
  const router = useRouter();

  // Mock powiadomienia
  const mockNotifications = [
    {
      id: 1,
      type: 'new_booking',
      title: 'Nowa rezerwacja',
      message: 'Jan Kowalski zarezerwował naprawę pralki na jutro o 09:00',
      details: {
        clientName: 'Jan Kowalski',
        serviceType: 'Naprawa pralki',
        date: '2024-01-16',
        time: '09:00',
        address: 'ul. Wrocławska 123, Kraków',
        phone: '+48 123 456 789'
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minut temu
      isRead: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'booking_change',
      title: 'Zmiana rezerwacji',
      message: 'Anna Nowak przełożyła wizytę z 14:00 na 16:00',
      details: {
        clientName: 'Anna Nowak',
        serviceType: 'Instalacja klimatyzacji',
        oldTime: '14:00',
        newTime: '16:00',
        date: '2024-01-17'
      },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 godziny temu
      isRead: false,
      priority: 'normal'
    },
    {
      id: 3,
      type: 'booking_cancelled',
      title: 'Anulowana rezerwacja',
      message: 'Piotr Wiśniewski anulował wizytę na dziś o 15:30',
      details: {
        clientName: 'Piotr Wiśniewski',
        serviceType: 'Naprawa zmywarki',
        date: '2024-01-15',
        time: '15:30',
        reason: 'Zmiana planów'
      },
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 godziny temu
      isRead: true,
      priority: 'normal'
    },
    {
      id: 4,
      type: 'urgent_booking',
      title: 'Pilna rezerwacja',
      message: 'Maria Kowalczyk potrzebuje natychmiastowej pomocy - awaria bojlera',
      details: {
        clientName: 'Maria Kowalczyk',
        serviceType: 'Naprawa bojlera - awaria',
        date: '2024-01-15',
        time: 'ASAP',
        address: 'ul. Floriańska 89, Kraków',
        phone: '+48 666 777 888',
        emergency: true
      },
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minut temu
      isRead: false,
      priority: 'urgent'
    },
    {
      id: 5,
      type: 'system',
      title: 'Aktualizacja systemu',
      message: 'Dodano nowe funkcje do kalendarza pracownika',
      details: {
        version: '2.1.0',
        features: [
          'Szablon tygodniowy',
          'Eksport/import harmonogramu',
          'Zaawansowane filtry rezerwacji'
        ]
      },
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dzień temu
      isRead: false,
      priority: 'low'
    }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeData = localStorage.getItem('employeeSession');
      if (!employeeData) {
        router.push('/pracownik-logowanie');
        return;
      }

      const parsedData = JSON.parse(employeeData);
      setEmployee(parsedData);

      // Załaduj powiadomienia
      const savedNotifications = localStorage.getItem(`notifications_${parsedData.id}`);
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      } else {
        setNotifications(mockNotifications);
        localStorage.setItem(`notifications_${parsedData.id}`, JSON.stringify(mockNotifications));
      }

      // Załaduj ustawienia powiadomień
      const savedSettings = localStorage.getItem(`notificationSettings_${parsedData.id}`);
      if (savedSettings) {
        setNotificationSettings(JSON.parse(savedSettings));
      }
    }
  }, [router]);

  const markAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );

    setNotifications(updatedNotifications);
    if (employee) {
      localStorage.setItem(`notifications_${employee.id}`, JSON.stringify(updatedNotifications));
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true
    }));

    setNotifications(updatedNotifications);
    if (employee) {
      localStorage.setItem(`notifications_${employee.id}`, JSON.stringify(updatedNotifications));
    }
  };

  const deleteNotification = (notificationId) => {
    const updatedNotifications = notifications.filter(notification =>
      notification.id !== notificationId
    );

    setNotifications(updatedNotifications);
    if (employee) {
      localStorage.setItem(`notifications_${employee.id}`, JSON.stringify(updatedNotifications));
    }
  };

  const saveNotificationSettings = () => {
    if (employee) {
      localStorage.setItem(`notificationSettings_${employee.id}`, JSON.stringify(notificationSettings));
    }
    setShowSettings(false);
    alert('Ustawienia powiadomień zostały zapisane!');
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'new') return !notification.isRead;
    if (filterType === 'booking') return ['new_booking', 'booking_change', 'booking_cancelled', 'urgent_booking'].includes(notification.type);
    if (filterType === 'system') return notification.type === 'system';
    return true;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'normal': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'new_booking': return <FiCheckCircle className="h-5 w-5 text-green-600" />;
      case 'booking_change': return <FiClock className="h-5 w-5 text-blue-600" />;
      case 'booking_cancelled': return <FiXCircle className="h-5 w-5 text-red-600" />;
      case 'urgent_booking': return <FiAlertCircle className="h-5 w-5 text-red-600" />;
      case 'system': return <FiSettings className="h-5 w-5 text-gray-600" />;
      default: return <FiBell className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Teraz';
    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours} godz. temu`;
    return `${days} dni temu`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie powiadomień...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <FiBell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Powiadomienia
                </h1>
                <p className="text-gray-600">
                  {employee.firstName} {employee.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} nieprzeczytanych` : 'Wszystkie przeczytane'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiSettings className="h-4 w-4 mr-2" />
                Ustawienia
              </button>
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Panel główny
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('employeeSession');
                  router.push('/pracownik-logowanie');
                }}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiLogOut className="h-4 w-4 mr-2" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>

        {/* Filtry i akcje */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filtruj:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Wszystkie ({notifications.length})</option>
                <option value="new">Nieprzeczytane ({unreadCount})</option>
                <option value="booking">Rezerwacje ({notifications.filter(n => ['new_booking', 'booking_change', 'booking_cancelled', 'urgent_booking'].includes(n.type)).length})</option>
                <option value="system">Systemowe ({notifications.filter(n => n.type === 'system').length})</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={markAllAsRead}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                disabled={unreadCount === 0}
              >
                <FiCheckCircle className="h-4 w-4 mr-1" />
                Oznacz wszystkie jako przeczytane
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <FiRefreshCw className="h-4 w-4 mr-1" />
                Odśwież
              </button>
            </div>
          </div>
        </div>

        {/* Lista powiadomień */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 text-center">
              <FiBell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Brak powiadomień do wyświetlenia</p>
            </div>
          ) : (
            filteredNotifications
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${getPriorityColor(notification.priority)} ${notification.isRead ? 'opacity-75' : ''
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                              Nowe
                            </span>
                          )}
                          {notification.priority === 'urgent' && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                              Pilne
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700 mb-3">{notification.message}</p>

                        {/* Szczegóły powiadomienia */}
                        {notification.details && (
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {notification.type.includes('booking') && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {notification.details.clientName && (
                                  <div className="flex items-center">
                                    <FiUser className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>{notification.details.clientName}</span>
                                  </div>
                                )}
                                {notification.details.serviceType && (
                                  <div className="flex items-center">
                                    <FiTool className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>{notification.details.serviceType}</span>
                                  </div>
                                )}
                                {notification.details.date && (
                                  <div className="flex items-center">
                                    <FiClock className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>
                                      {new Date(notification.details.date).toLocaleDateString('pl-PL')}
                                      {notification.details.time && ` o ${notification.details.time}`}
                                    </span>
                                  </div>
                                )}
                                {notification.details.address && (
                                  <div className="flex items-center">
                                    <FiMapPin className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>{notification.details.address}</span>
                                  </div>
                                )}
                                {notification.details.phone && (
                                  <div className="flex items-center">
                                    <FiPhone className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>{notification.details.phone}</span>
                                  </div>
                                )}
                                {notification.details.oldTime && notification.details.newTime && (
                                  <div className="col-span-2 text-orange-600">
                                    Zmiana: {notification.details.oldTime} → {notification.details.newTime}
                                  </div>
                                )}
                                {notification.details.reason && (
                                  <div className="col-span-2 text-red-600">
                                    Powód: {notification.details.reason}
                                  </div>
                                )}
                              </div>
                            )}

                            {notification.type === 'system' && notification.details.features && (
                              <div>
                                <p className="font-medium text-sm mb-2">Nowe funkcje:</p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {notification.details.features.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-3">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                          title="Oznacz jako przeczytane"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        title="Usuń powiadomienie"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Modal ustawień powiadomień */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Ustawienia powiadomień</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Nowe rezerwacje
                </label>
                <input
                  type="checkbox"
                  checked={notificationSettings.newBookings}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    newBookings: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Zmiany rezerwacji
                </label>
                <input
                  type="checkbox"
                  checked={notificationSettings.bookingChanges}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    bookingChanges: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Aktualizacje systemu
                </label>
                <input
                  type="checkbox"
                  checked={notificationSettings.systemUpdates}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    systemUpdates: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Powiadomienia email
                </label>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    emailNotifications: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Powiadomienia push
                </label>
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    pushNotifications: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={saveNotificationSettings}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
