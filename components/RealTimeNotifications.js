import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, MapPin, MessageCircle, Phone, Zap, Settings, Volume2, VolumeX } from 'lucide-react';

const RealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [autoMarkRead, setAutoMarkRead] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Symulacja WebSocket połączenia
    const interval = setInterval(() => {
      simulateRealTimeNotification();
      setLastUpdate(new Date());
    }, 15000); // Co 15 sekund nowe powiadomienie

    // Symulacja statusu połączenia
    const connectionInterval = setInterval(() => {
      const statuses = ['connected', 'connecting', 'disconnected'];
      const currentIndex = statuses.indexOf(connectionStatus);
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      setConnectionStatus(nextStatus);
      
      // Wróć do connected po 3 sekundach
      if (nextStatus !== 'connected') {
        setTimeout(() => setConnectionStatus('connected'), 3000);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(connectionInterval);
    };
  }, [connectionStatus]);

  const simulateRealTimeNotification = () => {
    const notificationTypes = [
      {
        id: Date.now(),
        type: 'urgent_task',
        priority: 'high',
        title: 'Pilne zgłoszenie',
        message: 'Awaria pieca c.o. - ul. Sienkiewicza 12',
        sender: 'System automatyczny',
        timestamp: new Date().toISOString(),
        actions: ['Przydziel', 'Zobacz szczegóły'],
        data: {
          taskId: 'URGENT_001',
          location: { lat: 50.8700, lng: 20.6300 },
          client: 'Jan Kowalski',
          phone: '+48 123 456 789'
        }
      },
      {
        id: Date.now() + 1,
        type: 'location_alert',
        priority: 'medium',
        title: 'Alert lokalizacji',
        message: 'Piotr Zieliński: brak aktualizacji lokalizacji przez 10 minut',
        sender: 'System śledzenia',
        timestamp: new Date().toISOString(),
        actions: ['Zadzwoń', 'Wyślij wiadomość'],
        data: {
          userId: 'USER_004',
          lastKnownLocation: 'Pacanów - ul. Słupia',
          lastUpdate: new Date(Date.now() - 600000).toISOString()
        }
      },
      {
        id: Date.now() + 2,
        type: 'task_completed',
        priority: 'low',
        title: 'Zadanie ukończone',
        message: 'Jan Kowalski ukończył naprawę pralki Samsung',
        sender: 'Jan Kowalski',
        timestamp: new Date().toISOString(),
        actions: ['Zobacz raport', 'Oceń'],
        data: {
          taskId: 'TOD76062628085',
          duration: 150,
          customerRating: 5,
          location: 'ul. Wesoła 15, Kielce'
        }
      },
      {
        id: Date.now() + 3,
        type: 'team_message',
        priority: 'medium',
        title: 'Nowa wiadomość zespołowa',
        message: 'Anna Wójcik w kanale "Koordynacja": Plan tras na jutro gotowy',
        sender: 'Anna Wójcik',
        timestamp: new Date().toISOString(),
        actions: ['Odpowiedz', 'Zobacz kanał'],
        data: {
          channelId: 'coordination',
          messageId: 'MSG_001'
        }
      },
      {
        id: Date.now() + 4,
        type: 'schedule_conflict',
        priority: 'high',
        title: 'Konflikt w harmonogramie',
        message: 'Nakładające się zadania dla Marka Nowaka o 14:00',
        sender: 'System planowania',
        timestamp: new Date().toISOString(),
        actions: ['Rozwiąż konflikt', 'Przełóż zadanie'],
        data: {
          userId: 'USER_002',
          conflictingTasks: ['TASK_A', 'TASK_B'],
          suggestedSolution: 'move_task_b'
        }
      }
    ];

    const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    
    setNotifications(prev => [randomNotification, ...prev.slice(0, 19)]); // Maks 20 powiadomień

    // Odtwórz dźwięk jeśli włączony
    if (soundEnabled && randomNotification.priority === 'high') {
      playNotificationSound();
    }

    // Pokaż natywne powiadomienie przeglądarki
    if (Notification.permission === 'granted') {
      new Notification(randomNotification.title, {
        body: randomNotification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const playNotificationSound = () => {
    // Symulacja odtwarzania dźwięku
    console.log('🔊 Notification sound played');
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleAction = (notification, actionIndex) => {
    const action = notification.actions[actionIndex];
    console.log(`Action triggered: ${action} for notification:`, notification);
    
    // Oznacz jako przeczytane po akcji
    markAsRead(notification.id);
    
    // Tutaj można dodać logikę obsługi różnych akcji
    switch (action) {
      case 'Przydziel':
        // Otwórz modal przydzielania zadania
        break;
      case 'Zadzwoń':
        // Inicjuj połączenie telefoniczne
        break;
      case 'Wyślij wiadomość':
        // Otwórz okno czatu
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'urgent_task': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'location_alert': return <MapPin className="h-5 w-5 text-yellow-500" />;
      case 'task_completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'team_message': return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'schedule_conflict': return <Clock className="h-5 w-5 text-orange-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getConnectionStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (priorityFilter === 'all') return true;
    return notif.priority === priorityFilter;
  });

  const unreadCount = notifications.filter(notif => !notif.read).length;

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Nagłówek */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Powiadomienia w czasie rzeczywistym
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <div className={`flex items-center gap-1 ${getConnectionStatusColor(connectionStatus)}`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="capitalize">{connectionStatus}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">
                  Ostatnia aktualizacja: {lastUpdate.toLocaleTimeString('pl-PL')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-md ${soundEnabled ? 'text-blue-600 bg-blue-100' : 'text-gray-400 bg-gray-100'}`}
              title={soundEnabled ? 'Wyłącz dźwięki' : 'Włącz dźwięki'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Filtry i akcje */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Wszystkie priorytety</option>
              <option value="high">Wysokie</option>
              <option value="medium">Średnie</option>
              <option value="low">Niskie</option>
            </select>
            
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoMarkRead}
                onChange={(e) => setAutoMarkRead(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-oznacz jako przeczytane
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
              >
                Oznacz wszystkie jako przeczytane
              </button>
            )}
            <button
              onClick={clearNotifications}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Wyczyść wszystkie
            </button>
          </div>
        </div>
      </div>
      
      {/* Lista powiadomień */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>Brak powiadomień</p>
            <p className="text-sm mt-1">Nowe powiadomienia będą wyświetlane tutaj</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'bg-opacity-50' : 'bg-opacity-20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString('pl-PL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500 mb-3">Od: {notification.sender}</p>
                    
                    {/* Dodatkowe dane */}
                    {notification.data && (
                      <div className="bg-white bg-opacity-50 rounded-md p-2 mb-3 text-xs">
                        {notification.type === 'urgent_task' && (
                          <div className="space-y-1">
                            <div><span className="font-medium">Klient:</span> {notification.data.client}</div>
                            <div><span className="font-medium">Telefon:</span> {notification.data.phone}</div>
                          </div>
                        )}
                        {notification.type === 'location_alert' && (
                          <div className="space-y-1">
                            <div><span className="font-medium">Ostatnia lokalizacja:</span> {notification.data.lastKnownLocation}</div>
                            <div><span className="font-medium">Ostatnia aktualizacja:</span> {new Date(notification.data.lastUpdate).toLocaleString('pl-PL')}</div>
                          </div>
                        )}
                        {notification.type === 'task_completed' && (
                          <div className="space-y-1">
                            <div><span className="font-medium">Czas wykonania:</span> {notification.data.duration} min</div>
                            <div><span className="font-medium">Ocena klienta:</span> {notification.data.customerRating}/5 ⭐</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Akcje */}
                    <div className="flex items-center gap-2">
                      {notification.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleAction(notification, index)}
                          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                            index === 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Oznacz jako przeczytane
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Stopka */}
      <div className="p-3 border-t bg-gray-50 text-center">
        <p className="text-xs text-gray-500">
          Powiadomienia są automatycznie synchronizowane z wszystkimi urządzeniami
        </p>
      </div>
    </div>
  );
};

export default RealTimeNotifications;