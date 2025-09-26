// components/LiveCha  const [inputMessage, setInputMessage] = useState('');Chat na żywo z AI asystentem

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../utils/ThemeContext';
import { 
  FiMessageCircle, 
  FiX, 
  FiMinus, 
  FiSend, 
  FiUser,
  FiCpu,
  FiPhone,
  FiMail,
  FiSettings
} from 'react-icons/fi';

const LiveChatAI = () => {
  const { colors, isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showContactForm, setShowContactForm] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Stan zamówienia serwisu
  const [orderInProgress, setOrderInProgress] = useState(false);
  const [orderData, setOrderData] = useState({
    device: '',        // pralka/lodówka/zmywarka
    brand: '',         // marka urządzenia
    model: '',         // model (opcjonalnie)
    problem: '',       // opis problemu
    address: '',       // adres
    city: '',          // miasto
    phone: '',         // telefon
    preferredTime: '', // preferowany termin
    urgency: 'normal', // normal/urgent
    step: 1            // aktualny krok procesu
  });

  // Formularz kontaktowy
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  // Przewijanie do końca wiadomości
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ładowanie historii z localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    const savedUserInfo = localStorage.getItem('chatUserInfo');
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    
    if (savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo));
      setShowContactForm(false);
    }

    // Wiadomość powitalna
    if (!savedMessages) {
      const welcomeMessage = {
        id: Date.now(),
        text: "Cześć! 👋 Jestem AI asystentem firmy TECHNIK. Pomogę Ci z pytaniami o nasze usługi elektroniczne i serwisowe. O czym chciałbyś porozmawiać?",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Zapisywanie do localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (userInfo) {
      localStorage.setItem('chatUserInfo', JSON.stringify(userInfo));
    }
  }, [userInfo]);

  // Funkcja korekcji imion z błędami
  const correctName = (inputName) => {
    const commonNames = {
      // Męskie imiona z popularnymi błędami
      'oliwer': 'Oliver', 'oliver': 'Oliver', 'oliwwer': 'Oliver', 'olifer': 'Oliver',
      'jakub': 'Jakub', 'jakób': 'Jakub', 'jacob': 'Jakub', 'jkub': 'Jakub',
      'michał': 'Michał', 'michal': 'Michał', 'michael': 'Michał', 'mihal': 'Michał',
      'tomasz': 'Tomasz', 'tomas': 'Tomasz', 'thomas': 'Tomasz', 'tomek': 'Tomek',
      'adam': 'Adam', 'adem': 'Adam', 'adm': 'Adam',
      'paweł': 'Paweł', 'pawel': 'Paweł', 'paul': 'Paweł', 'pawl': 'Paweł',
      'marcin': 'Marcin', 'martin': 'Marcin', 'marek': 'Marek', 'mark': 'Marek',
      'kamil': 'Kamil', 'kamel': 'Kamil', 'camil': 'Kamil',
      'krzysztof': 'Krzysztof', 'christoph': 'Krzysztof', 'krzysiek': 'Krzysiek',
      'dawid': 'Dawid', 'david': 'Dawid', 'dawd': 'Dawid',
      
      // Żeńskie imiona z popularnymi błędami
      'anna': 'Anna', 'ana': 'Anna', 'ania': 'Ania', 
      'katarzyna': 'Katarzyna', 'kasia': 'Kasia', 'kate': 'Katarzyna', 'katrina': 'Katarzyna',
      'agnieszka': 'Agnieszka', 'aga': 'Aga', 'agnes': 'Agnieszka',
      'magdalena': 'Magdalena', 'magda': 'Magda', 'magdalla': 'Magdalena',
      'monika': 'Monika', 'monica': 'Monika', 'monia': 'Monia',
      'joanna': 'Joanna', 'jonna': 'Joanna', 'asia': 'Asia', 'joan': 'Joanna',
      'karolina': 'Karolina', 'carolina': 'Karolina', 'karola': 'Karola',
      'natalia': 'Natalia', 'nata': 'Nata', 'natasha': 'Natalia',
      'justyna': 'Justyna', 'justa': 'Justa', 'justina': 'Justyna',
      'marta': 'Marta', 'martha': 'Marta', 'mata': 'Marta'
    };
    
    const lowerInput = inputName.toLowerCase().trim();
    const corrected = commonNames[lowerInput];
    
    if (corrected && corrected.toLowerCase() !== lowerInput) {
      return corrected;
    }
    
    // Jeśli nie znajdzie korekcji, zwróć oryginalne z wielką literą
    return inputName.charAt(0).toUpperCase() + inputName.slice(1).toLowerCase();
  };

  // Obsługa formularza kontaktowego
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email) {
      const correctedName = correctName(contactForm.name);
      const finalUserInfo = { ...contactForm, name: correctedName };
      
      setUserInfo(finalUserInfo);
      setShowContactForm(false);
      
      let welcomeText = `Dziękuję ${correctedName}! Teraz możemy rozmawiać. Jestem tutaj, żeby pomóc Ci z usługami TECHNIK - elektronika i serwis AGD. Zadaj mi dowolne pytanie! 🔧⚡`;
      
      // Jeśli skorygowano imię, dodaj informację
      if (correctedName !== contactForm.name) {
        welcomeText = `Cześć ${correctedName}! 😊 (skorygowałem pisownię z "${contactForm.name}")\n\nTeraz możemy rozmawiać! Jestem tutaj, żeby pomóc Ci z usługami TECHNIK - elektronika i serwis AGD. Zadaj mi dowolne pytanie! 🔧⚡\n\n💡 **Chcesz założyć konto?** Napишz "załóż konto" żeby mieć dostęp do historii napraw i szybszego zamawiania!`;
      } else {
        welcomeText += `\n\n💡 **Chcesz założyć konto?** Napisz "załóż konto" żeby mieć dostęp do historii napraw i szybszego zamawiania!`;
      }
      
      const welcomePersonal = {
        id: Date.now(),
        text: welcomeText,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, welcomePersonal]);
    }
  };

  // Funkcja zapisywania zamówienia
  const saveOrder = async (orderData) => {
    try {
      const response = await fetch('/api/save-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderData,
          userInfo: userInfo,
          timestamp: new Date().toISOString(),
          status: 'new'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.orderId;
      }
    } catch (error) {
      console.error('Błąd zapisywania zamówienia:', error);
    }
    return null;
  };

  // Wysyłanie wiadomości do AI
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Wywołanie API OpenAI
      const response = await fetch('/api/chat-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userInfo: userInfo,
          orderInProgress: orderInProgress,
          orderData: orderData,
          context: 'TECHNIK - firma elektroniczna i serwisowa. Dwa działy: Elektronika (sterowniki, kreator, sklep B2B) i Serwis (AGD, AI rozpoznawanie, naprawy).'
        }),
      });

      const data = await response.json();
      
      // AKTUALIZACJA STANU ZAMÓWIENIA
      if (data.orderUpdate) {
        if (data.orderUpdate.step === 1 && !orderInProgress) {
          // Start procesu zamówienia
          setOrderInProgress(true);
          setOrderData({
            step: 1,
            device: '',
            brand: '',
            problem: '',
            address: '',
            city: '',
            phone: '',
            preferredTime: '',
            urgency: 'normalny'
          });
        } else if (orderInProgress) {
          // Aktualizacja danych zamówienia
          setOrderData(prev => ({
            ...prev,
            ...data.orderUpdate
          }));
          
          // Zapisz zamówienie gdy jest ukończone
          if (data.orderUpdate.step === 'completed' && data.orderUpdate.confirmed) {
            try {
              await fetch('/api/save-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerName: userInfo?.name || 'Klient',
                  customerEmail: userInfo?.email || '',
                  customerPhone: orderData.phone || '',
                  device: orderData.device,
                  brand: orderData.brand,
                  problemDescription: orderData.problem,
                  address: orderData.address,
                  city: orderData.city,
                  preferredTime: orderData.preferredTime,
                  urgency: orderData.urgency,
                  orderId: data.orderUpdate.orderId
                })
              });
              
              // Resetuj stan po zapisaniu
              setTimeout(() => {
                setOrderInProgress(false);
                setOrderData({});
              }, 3000);
              
            } catch (saveError) {
              console.error('Błąd zapisu zamówienia:', saveError);
            }
          }
        }
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: data.response || 'Przepraszam, wystąpił problem z połączeniem. Spróbuj ponownie.',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Zwiększ licznik nieprzeczytanych jeśli chat jest minimalizowany
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (error) {
      console.error('Błąd AI chat:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Przepraszam, wystąpił problem z połączeniem. Czy mogę pomóc Ci w inny sposób? Możesz również zadzwonić: +48 123 456 789',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Obsługa Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Otwieranie chatu
  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Minimalizacja
  const minimizeChat = () => {
    setIsMinimized(true);
  };

  // Zamykanie
  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Formatowanie czasu
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Przycisk Chat (zawsze widoczny) */}
      {!isOpen && (
        <button
          onClick={openChat}
          className={`
            fixed bottom-6 right-6 z-50
            w-16 h-16 rounded-full shadow-2xl
            bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
            flex items-center justify-center
            transition-all duration-300 transform hover:scale-110
            ${unreadCount > 0 ? 'animate-bounce' : ''}
          `}
        >
          <FiMessageCircle className="h-8 w-8 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Okno Chatu */}
      {isOpen && (
        <div className={`
          fixed bottom-6 right-6 z-50
          w-96 max-w-[calc(100vw-2rem)]
          ${isMinimized ? 'h-16' : 'h-[32rem]'}
          ${colors.card} ${colors.border} border rounded-2xl shadow-2xl
          transition-all duration-300 transform
          ${isMinimized ? 'scale-95' : 'scale-100'}
        `}>
          {/* Header */}
          <div className={`
            flex items-center justify-between p-4 ${colors.border} border-b rounded-t-2xl
            ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}
          `}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <FiCpu className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${colors.textPrimary}`}>TECHNIK AI</h3>
                <p className={`text-xs ${colors.textTertiary}`}>
                  {isTyping ? 'AI pisze...' : 'Online 24/7'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={minimizeChat}
                className={`p-2 rounded-lg ${colors.textSecondary} hover:${colors.cardHover} transition-colors`}
              >
                <FiMinus className="h-4 w-4" />
              </button>
              <button
                onClick={closeChat}
                className={`p-2 rounded-lg ${colors.textSecondary} hover:${colors.cardHover} transition-colors`}
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Formularz kontaktowy */}
              {showContactForm && (
                <div className="p-4 border-b border-gray-200">
                  <h4 className={`font-semibold mb-3 ${colors.textPrimary}`}>Przedstaw się:</h4>
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Imię i nazwisko"
                      required
                      className={`w-full px-3 py-2 ${colors.tertiary} ${colors.border} border rounded-lg ${colors.textPrimary} placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({...prev, name: e.target.value}))}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      className={`w-full px-3 py-2 ${colors.tertiary} ${colors.border} border rounded-lg ${colors.textPrimary} placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({...prev, email: e.target.value}))}
                    />
                    <input
                      type="tel"
                      placeholder="Telefon (opcjonalnie)"
                      className={`w-full px-3 py-2 ${colors.tertiary} ${colors.border} border rounded-lg ${colors.textPrimary} placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({...prev, phone: e.target.value}))}
                    />
                    <input
                      type="text"
                      placeholder="Firma (opcjonalnie)"
                      className={`w-full px-3 py-2 ${colors.tertiary} ${colors.border} border rounded-lg ${colors.textPrimary} placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      value={contactForm.company}
                      onChange={(e) => setContactForm(prev => ({...prev, company: e.target.value}))}
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
                    >
                      Rozpocznij chat
                    </button>
                  </form>
                </div>
              )}

              {/* Wiadomości */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-80">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[80%] p-3 rounded-2xl
                      ${message.sender === 'user' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-4' 
                        : `${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} ${colors.textPrimary} mr-4`
                      }
                    `}>
                      <div className="flex items-start space-x-2">
                        {message.sender === 'ai' && (
                          <FiCpu className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <span className={`text-xs mt-1 block ${
                            message.sender === 'user' 
                              ? 'text-blue-100' 
                              : colors.textTertiary
                          }`}>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className={`max-w-[80%] p-3 rounded-2xl mr-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <div className="flex items-center space-x-2">
                        <FiCpu className="h-4 w-4 text-blue-500" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Szybkie akcje */}
              {!showContactForm && userInfo && !orderInProgress && messages.length <= 2 && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setInputMessage('Chcę zamówić naprawę');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      🔧 Zamów naprawę
                    </button>
                    <button
                      onClick={() => {
                        setInputMessage('Ile kosztuje naprawa?');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      💰 Koszt naprawy
                    </button>
                    <button
                      onClick={() => {
                        setInputMessage('Kiedy możecie przyjechać?');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      ⏰ Termin wizyty
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => {
                        setInputMessage('Jaki sprzęt naprawiasz?');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      🔧 Jaki sprzęt?
                    </button>
                    <button
                      onClick={() => {
                        setInputMessage('Gdzie obsługujesz?');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      📍 Lokalizacje
                    </button>
                    <button
                      onClick={() => {
                        setInputMessage('Jakie masz godziny pracy?');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      ⏰ Godziny
                    </button>
                    <button
                      onClick={() => {
                        setInputMessage('Jaki masz cennik?');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      💰 Cennik
                    </button>
                    <button
                      onClick={() => {
                        setInputMessage('załóż konto');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      👤 Załóż konto
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => {
                        setInputMessage('Pralka nie działa');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      🔧 Pralka
                    </button>
                    <button
                      onClick={() => {
                        setInputMessage('Lodówka nie chłodzi');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      ❄️ Lodówka
                    </button>
                    <button
                      onClick={() => {
                        setInputMessage('Zmywarka nie myje');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      🍽️ Zmywarka
                    </button>
                    <button
                      onClick={() => {
                        setInputMessage('Piekarnik nie grzeje');
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      🔥 Piekarnik
                    </button>
                  </div>
                </div>
              )}

              {/* Progress zamówienia */}
              {orderInProgress && (
                <div className="px-4 pb-2">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                        📋 Zamówienie serwisu - Krok {orderData.step || 1}/6
                      </span>
                      <div className="flex space-x-1">
                        {[1,2,3,4,5,6].map(step => (
                          <div
                            key={step}
                            className={`w-2 h-2 rounded-full ${
                              step <= (orderData.step || 1) 
                                ? 'bg-green-500' 
                                : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Przyciski szybkich akcji podczas zamówienia */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(orderData.step > 1) && (
                        <button
                          onClick={() => {
                            setInputMessage('wstecz');
                            setTimeout(() => sendMessage(), 100);
                          }}
                          className="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full transition-all transform hover:scale-105"
                        >
                          ← Wstecz
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setInputMessage('anuluj');
                          setTimeout(() => sendMessage(), 100);
                        }}
                        className="px-3 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full transition-all transform hover:scale-105"
                      >
                        ✖ Anuluj
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Input */}
              {!showContactForm && (
                <div className={`p-4 ${colors.border} border-t`}>
                  <div className="flex space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Napisz swoją wiadomość..."
                      className={`flex-1 px-4 py-2 ${colors.tertiary} ${colors.border} border rounded-full ${colors.textPrimary} placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isTyping}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                    >
                      <FiSend className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default LiveChatAI;