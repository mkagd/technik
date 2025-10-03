import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, MapPin, Clock, Phone, Video, Send, Paperclip, Smile, MoreVertical, Bell, AlertCircle, CheckCircle2, Navigation, Car } from 'lucide-react';

const TeamCommunication = () => {
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState('USER_001');
  const [typing, setTyping] = useState({});
  const [onlineStatus, setOnlineStatus] = useState({});
  const [locations, setLocations] = useState({});
  const messagesEndRef = useRef(null);

  // Kanały komunikacji
  const channels = [
    { id: 'general', name: 'Ogólny', icon: MessageCircle, type: 'text' },
    { id: 'urgent', name: 'Pilne', icon: AlertCircle, type: 'text' },
    { id: 'coordination', name: 'Koordynacja', icon: Users, type: 'text' },
    { id: 'locations', name: 'Lokalizacje', icon: MapPin, type: 'location' },
    { id: 'voice', name: 'Rozmowa głosowa', icon: Phone, type: 'voice' },
    { id: 'video', name: 'Video call', icon: Video, type: 'video' }
  ];

  useEffect(() => {
    loadTeamData();
    initializeMessages();
    simulateRealTimeUpdates();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChannel]);

  const loadTeamData = () => {
    // Symulacja danych zespołu
    const team = [
      {
        id: 'USER_001',
        name: 'Jan Kowalski',
        role: 'Technik Senior',
        avatar: '/api/placeholder/40/40',
        phone: '+48 123 456 789',
        skills: ['AGD', 'RTV', 'Elektronika'],
        currentLocation: { lat: 50.8661, lng: 20.6286, address: 'Kielce centrum' },
        status: 'online',
        currentTask: 'Naprawa pralki - ul. Wesoła 15',
        availability: 'Do 16:00'
      },
      {
        id: 'USER_002',
        name: 'Marek Nowak',
        role: 'Technik',
        avatar: '/api/placeholder/40/40',
        phone: '+48 987 654 321',
        skills: ['IT', 'Sieci', 'Hardware'],
        currentLocation: { lat: 50.9000, lng: 20.6500, address: 'Kielce - Szydłówek' },
        status: 'busy',
        currentTask: 'Instalacja sieci - Firma TechMax',
        availability: 'Po 14:00'
      },
      {
        id: 'USER_003',
        name: 'Anna Wójcik',
        role: 'Koordynator',
        avatar: '/api/placeholder/40/40',
        phone: '+48 555 666 777',
        skills: ['Zarządzanie', 'Planowanie', 'Komunikacja'],
        currentLocation: { lat: 50.8500, lng: 20.6100, address: 'Biuro - Kielce' },
        status: 'online',
        currentTask: 'Planowanie tras na jutro',
        availability: 'Cały dzień'
      },
      {
        id: 'USER_004',
        name: 'Piotr Zieliński',
        role: 'Technik mobilny',
        avatar: '/api/placeholder/40/40',
        phone: '+48 111 222 333',
        skills: ['Naprawa mobilna', 'Diagnostyka', 'AGD'],
        currentLocation: { lat: 50.7800, lng: 20.5500, address: 'Pacanów - w drodze' },
        status: 'away',
        currentTask: 'Przejazd do klienta',
        availability: 'Za 30 min'
      }
    ];
    
    setTeamMembers(team);
    
    // Ustaw statusy online
    const statuses = {};
    const locs = {};
    team.forEach(member => {
      statuses[member.id] = member.status;
      locs[member.id] = member.currentLocation;
    });
    setOnlineStatus(statuses);
    setLocations(locs);
  };

  const initializeMessages = () => {
    const initialMessages = {
      general: [
        {
          id: 1,
          userId: 'USER_003',
          userName: 'Anna Wójcik',
          message: 'Dzień dobry zespół! Jak postępy z dzisiejszymi zadaniami?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'text'
        },
        {
          id: 2,
          userId: 'USER_001',
          userName: 'Jan Kowalski',
          message: 'Witam! Skończyłem naprawę w centrum, jadę na Wesołą.',
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          type: 'text'
        },
        {
          id: 3,
          userId: 'USER_002',
          userName: 'Marek Nowak',
          message: 'U mnie instalacja sieci trwa dłużej niż przewidywano. Może opóźnienie 1h.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: 'text'
        }
      ],
      urgent: [
        {
          id: 1,
          userId: 'USER_003',
          userName: 'Anna Wójcik',
          message: '🚨 Pilne zgłoszenie: awaria pieca c.o. - ul. Sienkiewicza 12. Kto może pojechać?',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          type: 'urgent'
        }
      ],
      coordination: [
        {
          id: 1,
          userId: 'USER_003',
          userName: 'Anna Wójcik',
          message: 'Plan na jutro: Jan - Pacanów (3 zlecenia), Marek - Kielce IT (2 zlecenia), Piotr - objazd wiejski',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'text'
        }
      ],
      locations: []
    };
    
    setMessages(initialMessages);
  };

  const simulateRealTimeUpdates = () => {
    // Symulacja aktualizacji w czasie rzeczywistym
    const interval = setInterval(() => {
      // Losowo aktualizuj statusy
      if (Math.random() < 0.1) {
        const randomUser = teamMembers[Math.floor(Math.random() * teamMembers.length)];
        if (randomUser) {
          setTyping(prev => ({
            ...prev,
            [randomUser.id]: Math.random() < 0.5
          }));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      userId: currentUser,
      userName: teamMembers.find(m => m.id === currentUser)?.name || 'Ja',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: activeChannel === 'urgent' ? 'urgent' : 'text'
    };
    
    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), message]
    }));
    
    setNewMessage('');
  };

  const sendLocationUpdate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationMessage = {
            id: Date.now(),
            userId: currentUser,
            userName: teamMembers.find(m => m.id === currentUser)?.name || 'Ja',
            message: `📍 Moja aktualna lokalizacja`,
            timestamp: new Date().toISOString(),
            type: 'location',
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          };
          
          setMessages(prev => ({
            ...prev,
            locations: [...(prev.locations || []), locationMessage]
          }));
        },
        (error) => {
          console.error('Błąd pobierania lokalizacji:', error);
        }
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'busy': return 'bg-red-400';
      case 'away': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'busy': return 'Zajęty';
      case 'away': return 'Nieobecny';
      default: return 'Offline';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Teraz';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min temu`;
    if (diff < 86400000) return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('pl-PL');
  };

  const currentChannel = channels.find(ch => ch.id === activeChannel);
  const channelMessages = messages[activeChannel] || [];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar z kanałami i zespołem */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Nagłówek */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Komunikacja zespołu</h2>
          <p className="text-sm text-gray-500">Techniczni w terenie</p>
        </div>
        
        {/* Kanały */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">KANAŁY</h3>
          <div className="space-y-1">
            {channels.map(channel => {
              const Icon = channel.icon;
              const hasUnread = activeChannel !== channel.id && channelMessages.length > 0;
              
              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeChannel === channel.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{channel.name}</span>
                  {hasUnread && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                  {channel.id === 'urgent' && messages.urgent?.length > 0 && (
                    <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {messages.urgent.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Członkowie zespołu */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">ZESPÓŁ ({teamMembers.length})</h3>
          <div className="space-y-3">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate">{member.name}</p>
                    <span className="text-xs text-gray-500">{getStatusText(member.status)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{member.role}</p>
                  <p className="text-xs text-blue-600 truncate mt-1">{member.currentTask}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{member.availability}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 truncate">{member.currentLocation.address}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <button className="p-1 text-gray-400 hover:text-green-600" title="Zadzwoń">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-blue-600" title="Video call">
                    <Video className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Główny obszar czatu */}
      <div className="flex-1 flex flex-col">
        {/* Nagłówek kanału */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentChannel && <currentChannel.icon className="h-5 w-5 text-gray-600" />}
            <div>
              <h3 className="font-semibold text-gray-900">{currentChannel?.name}</h3>
              <p className="text-sm text-gray-500">
                {activeChannel === 'locations' ? 'Śledzenie lokalizacji zespołu' :
                 activeChannel === 'urgent' ? 'Pilne komunikaty i awarie' :
                 activeChannel === 'coordination' ? 'Planowanie i koordynacja zadań' :
                 'Ogólna komunikacja zespołu'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeChannel === 'locations' && (
              <button
                onClick={sendLocationUpdate}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <Navigation className="h-4 w-4" />
                Udostępnij lokalizację
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Obszar wiadomości */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {channelMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {currentChannel && <currentChannel.icon className="h-8 w-8 text-gray-400" />}
              </div>
              <p className="text-gray-500">Brak wiadomości w tym kanale</p>
              <p className="text-sm text-gray-400 mt-1">Rozpocznij konwersację!</p>
            </div>
          ) : (
            channelMessages.map(message => (
              <div key={message.id} className={`flex gap-3 ${message.userId === currentUser ? 'flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                    {message.userName.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                
                <div className={`flex-1 max-w-md ${message.userId === currentUser ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{message.userName}</span>
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    message.userId === currentUser
                      ? 'bg-blue-600 text-white'
                      : message.type === 'urgent'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.type === 'location' ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{message.message}</span>
                        {message.coordinates && (
                          <button className="text-xs underline">
                            Zobacz na mapie
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{message.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Wskaźnik "ktoś pisze" */}
          {Object.entries(typing).some(([userId, isTyping]) => isTyping && userId !== currentUser) && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>Ktoś pisze...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Pole do wprowadzania wiadomości */}
        {currentChannel?.type === 'text' || currentChannel?.type === 'location' ? (
          <div className="bg-white border-t p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={
                      activeChannel === 'urgent' ? 'Napisz pilną wiadomość...' :
                      activeChannel === 'locations' ? 'Napisz o swojej lokalizacji...' :
                      'Napisz wiadomość...'
                    }
                    className="flex-1 bg-transparent border-none outline-none placeholder-gray-500"
                  />
                  <div className="flex items-center gap-2 ml-3">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Smile className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className={`p-2 rounded-lg transition-colors ${
                  newMessage.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            {activeChannel === 'urgent' && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Kanał pilnych komunikatów - używaj tylko w nagłych przypadkach
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white border-t p-4 text-center">
            <p className="text-gray-500 mb-4">
              {activeChannel === 'voice' ? 'Rozpocznij rozmowę głosową' : 'Rozpocznij video call'}
            </p>
            <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mx-auto">
              {activeChannel === 'voice' ? <Phone className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              {activeChannel === 'voice' ? 'Dołącz do rozmowy' : 'Rozpocznij video call'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCommunication;