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
  const [useOpenAI, setUseOpenAI] = useState(true); // Przełącznik GPT-4o mini vs Classical AI
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

  // Stan procesu konta przez chat
  const [accountSetupInProgress, setAccountSetupInProgress] = useState(false);
  const [accountSetupStep, setAccountSetupStep] = useState(null);

  // Kreator zakładania konta
  const [showAccountWizard, setShowAccountWizard] = useState(false);
  const [accountWizardStep, setAccountWizardStep] = useState(1);
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    agreeToTerms: false,
    newsletter: false
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
    const savedOrderState = localStorage.getItem('chatOrderState');
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    
    if (savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo));
      setShowContactForm(false);
    }

    // Przywróć stan zamówienia
    if (savedOrderState) {
      try {
        const orderState = JSON.parse(savedOrderState);
        setOrderInProgress(orderState.inProgress || false);
        setOrderData(orderState.data || {});
      } catch (error) {
        console.error('Błąd przywracania stanu zamówienia:', error);
      }
    }

    // Wiadomość powitalna
    if (!savedMessages) {
      const welcomeMessage = {
        id: Date.now(),
        text: "Cześć! 👋 Jestem AI asystentem firmy TECHNIK. Pomogę Ci z pytaniami o nasze usługi elektroniczne i serwisowe.\n\n💡 **Przedstaw się poniżej** - pomoże mi to lepiej Ci pomagać, ale **możesz też pominąć** ten krok i chatować anonimowo!",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Nasłuchiwanie wylogowania z głównej strony
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Jeśli currentUser zostało usunięte (wylogowanie), wyczyść też chat AI
      if (e.key === 'currentUser' && e.newValue === null) {
        setUserInfo(null);
        setShowContactForm(true);
        setAccountSetupInProgress(false);
        setAccountSetupStep(null);
        localStorage.removeItem('chatUserInfo');
        localStorage.removeItem('chatHistory');
        localStorage.removeItem('chatOrderState');
        
        // Wyczyść wiadomości i pokaż powitalną
        const welcomeMessage = {
          id: Date.now(),
          text: "Zostałeś wylogowany. Cześć! 👋 Jestem AI asystentem firmy TECHNIK. Pomogę Ci z pytaniami o nasze usługi elektroniczne i serwisowe. O czym chciałbyś porozmawiać?",
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
      }
      
      // Synchronizacja logowania - jeśli ktoś się zalogował na głównej stronie
      if (e.key === 'currentUser' && e.newValue) {
        try {
          const currentUser = JSON.parse(e.newValue);
          if (currentUser && !userInfo) {
            // Stwórz userInfo na podstawie currentUser
            const chatUserInfo = {
              name: `${currentUser.firstName} ${currentUser.lastName}`,
              email: currentUser.email || '',
              phone: currentUser.phone || '',
              isLoggedIn: true,
              loginTime: new Date().toISOString()
            };
            setUserInfo(chatUserInfo);
            setShowContactForm(false);
          }
        } catch (error) {
          console.error('Błąd synchronizacji logowania:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Sprawdź przy starcie czy użytkownik jest zalogowany na głównej stronie
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && !userInfo) {
      try {
        const user = JSON.parse(currentUser);
        const chatUserInfo = {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email || '',
          phone: user.phone || '',
          isLoggedIn: true,
          loginTime: new Date().toISOString()
        };
        setUserInfo(chatUserInfo);
        setShowContactForm(false);
      } catch (error) {
        console.error('Błąd odczytu currentUser:', error);
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userInfo]);

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

  // Zapis stanu zamówienia do localStorage
  useEffect(() => {
    const orderState = {
      inProgress: orderInProgress,
      data: orderData
    };
    localStorage.setItem('chatOrderState', JSON.stringify(orderState));
  }, [orderInProgress, orderData]);

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
          status: 'new',
          source: 'chat', // Źródło: chat AI
          employeeCode: 'AI' // AI Assistant
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
      // Wybór API - Gemini, OpenAI GPT-4o mini lub stary system
      let apiEndpoint, requestBody;
      
      if (useOpenAI) {
        apiEndpoint = '/api/openai-chat';
        requestBody = {
          message: inputMessage,
          userInfo: userInfo,
          orderInProgress: orderInProgress,
          orderData: orderData,
          accountSetup: accountSetupStep,
          conversationHistory: messages
        };
      } else {
        apiEndpoint = '/api/chat-ai';
        requestBody = {
          message: inputMessage,
          userInfo: userInfo,
          orderInProgress: orderInProgress,
          orderData: orderData,
          accountSetup: accountSetupStep,
          context: 'TECHNIK - firma elektroniczna i serwisowa.'
        };
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      // Logowanie kosztów (opcjonalnie, do development)
      if (data.usage && process.env.NODE_ENV === 'development') {
        console.log('💰 Koszt zapytania:', data.usage.formatted);
        console.log('🔤 Tokeny:', data.usage.totalTokens);
      }
      
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
                  orderId: data.orderUpdate.orderId,
                  source: 'chat', // Źródło: chat AI
                  employeeCode: 'AI' // AI Assistant
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

      // Obsługa procesu konta przez chat
      if (data.accountUpdate) {
        if (data.accountUpdate.step === 'offer') {
          setAccountSetupInProgress(true);
          setAccountSetupStep('offer');
        } else if (data.accountUpdate.step === 'password') {
          setAccountSetupStep('password');
        } else if (data.accountUpdate.step === 'ask-login') {
          setAccountSetupStep('ask-login');
          // Zapisz dane konta do późniejszego użycia
          if (data.accountUpdate.accountId) {
            setUserInfo(prev => ({ 
              ...prev, 
              accountId: data.accountUpdate.accountId,
              tempPassword: data.accountUpdate.password 
            }));
          }
        } else if (data.accountUpdate.step === 'logged-in') {
          setAccountSetupInProgress(false);
          setAccountSetupStep(null);
          // Zaktualizuj userInfo jako zalogowany użytkownik
          if (data.accountUpdate.isLoggedIn) {
            setUserInfo(prev => ({ 
              ...prev, 
              isLoggedIn: true,
              loginTime: new Date().toISOString() 
            }));
          }
        } else if (data.accountUpdate.step === 'completed') {
          setAccountSetupInProgress(false);
          setAccountSetupStep(null);
          // Opcjonalnie zaktualizuj userInfo z danymi konta
          if (data.accountUpdate.accountId) {
            setUserInfo(prev => ({ ...prev, accountId: data.accountUpdate.accountId }));
          }
        } else if (data.accountUpdate.step === null) {
          setAccountSetupInProgress(false);
          setAccountSetupStep(null);
        }
      }

      // Obsługa otwarcia kreatora konta
      if (data.openWizard) {
        setTimeout(() => {
          openAccountWizard();
        }, 1000); // Opóźnienie żeby użytkownik przeczytał wiadomość
      }

      // Obsługa przekierowania do auto-rezerwacji
      if (data.redirectToAutoReservation) {
        setTimeout(() => {
          window.open('/auto-rezerwacja', '_blank');
        }, 1500);
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: data.response || 'Przepraszam, wystąpił problem z połączeniem. Spróbuj ponownie.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        showAutoReservationButton: data.showAutoReservationButton || false,
        redirectToAutoReservation: data.redirectToAutoReservation || false
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

  // Funkcja otwierania kreatora konta
  const openAccountWizard = () => {
    setShowAccountWizard(true);
    setAccountWizardStep(1);
    // Prefill danych jeśli użytkownik już się zalogował
    if (userInfo) {
      setAccountData(prev => ({
        ...prev,
        name: userInfo.name || '',
        email: userInfo.email || '',
        phone: userInfo.phone || ''
      }));
    }
  };

  // Funkcja zamykania kreatora
  const closeAccountWizard = () => {
    setShowAccountWizard(false);
    setAccountWizardStep(1);
    setAccountData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      address: '',
      city: '',
      agreeToTerms: false,
      newsletter: false
    });
    
    // WAŻNE: Resetuj również stan procesu konta przez chat
    setAccountSetupInProgress(false);
    setAccountSetupStep(null);
  };

  // Funkcja przejścia do następnego kroku w kreatorze
  const nextAccountStep = () => {
    if (accountWizardStep < 4) {
      setAccountWizardStep(prev => prev + 1);
    }
  };

  // Funkcja powrotu do poprzedniego kroku w kreatorze  
  const prevAccountStep = () => {
    if (accountWizardStep > 1) {
      setAccountWizardStep(prev => prev - 1);
    }
  };

  // Funkcja tworzenia konta
  const handleCreateAccount = async () => {
    try {
      // Walidacja danych
      if (!accountData.name || !accountData.email || !accountData.password) {
        alert('Wypełnij wszystkie wymagane pola!');
        return;
      }

      if (accountData.password !== accountData.confirmPassword) {
        alert('Hasła nie są identyczne!');
        return;
      }

      // Wysłanie do prawdziwego API
      const response = await fetch('/api/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: accountData.name,
          email: accountData.email,
          phone: accountData.phone,
          password: accountData.password,
          address: accountData.address,
          city: accountData.city,
          street: accountData.street
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Błąd tworzenia konta');
      }

      // Sukces - zapisz dane użytkownika
      const successMessage = {
        id: Date.now(),
        text: `🎉 **KONTO ZAŁOŻONE POMYŚLNIE!**\n\n✅ **Witaj ${result.account.name}!**\n🆔 **ID konta:** ${result.account.id}\n📧 **Email:** ${result.account.email}\n\n🎯 **Twoje konto jest już aktywne!**\n\nMasz teraz dostęp do panelu klienta z historią napraw i rabatami!`,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, successMessage]);
      setUserInfo({ 
        ...result.account, 
        isLoggedIn: true,
        loginTime: new Date().toISOString()
      });
      closeAccountWizard();
      
      // WAŻNE: Resetuj stan procesu konta przez chat
      setAccountSetupInProgress(false);
      setAccountSetupStep(null);
      
      // Otwórz chat po utworzeniu konta
      setIsOpen(true);
      
      // Dodaj pytanie o panel klienta po chwili
      setTimeout(() => {
        const welcomeMessage = {
          id: Date.now() + 1,
          text: `Witaj w panelu klienta ${result.account.name}! 🎉\n\n📋 **Co chcesz zrobić?**\n• **"zamów naprawę"** - nowe zlecenie serwisowe\n• **"historia"** - poprzednie naprawy\n• **"ustawienia"** - zarządzanie kontem\n• **"faktury"** - dokumenty i płatności\n\n💡 *Jesteś teraz zalogowany - masz dostęp do wszystkich funkcji!*`,
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, welcomeMessage]);
      }, 2000);
      
    } catch (error) {
      console.error('Błąd tworzenia konta:', error);
      alert(error.message || 'Błąd podczas tworzenia konta. Spróbuj ponownie.');
    }
  };

  return (
    <>
      {/* Kreator zakładania konta */}
      {showAccountWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`${colors.secondary} rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            {/* Header kreatora */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${colors.textPrimary}`}>
                    👤 Załóż konto TECHNIK
                  </h2>
                  <p className={`text-sm ${colors.textSecondary} mt-1`}>
                    Krok {accountWizardStep} z 4
                  </p>
                </div>
                <button
                  onClick={closeAccountWizard}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${colors.textSecondary}`}
                >
                  ✕
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex space-x-1">
                  {[1,2,3,4].map(step => (
                    <div
                      key={step}
                      className={`flex-1 h-2 rounded-full ${
                        step <= accountWizardStep 
                          ? 'bg-blue-500' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Krok 1: Dane podstawowe */}
            {accountWizardStep === 1 && (
              <div className="p-6">
                <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4`}>
                  📝 Dane podstawowe
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                      Imię i nazwisko *
                    </label>
                    <input
                      type="text"
                      value={accountData.name}
                      onChange={(e) => setAccountData(prev => ({...prev, name: e.target.value}))}
                      className={`w-full px-4 py-2 border rounded-lg ${colors.tertiary} ${colors.border} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500`}
                      placeholder="Jan Kowalski"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData(prev => ({...prev, email: e.target.value}))}
                      className={`w-full px-4 py-2 border rounded-lg ${colors.tertiary} ${colors.border} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500`}
                      placeholder="jan@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      value={accountData.phone}
                      onChange={(e) => setAccountData(prev => ({...prev, phone: e.target.value}))}
                      className={`w-full px-4 py-2 border rounded-lg ${colors.tertiary} ${colors.border} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500`}
                      placeholder="123 456 789"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={nextAccountStep}
                    disabled={!accountData.name || !accountData.email || !accountData.phone}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Dalej →
                  </button>
                </div>
              </div>
            )}

            {/* Krok 2: Hasło */}
            {accountWizardStep === 2 && (
              <div className="p-6">
                <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4`}>
                  🔐 Bezpieczeństwo
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                      Hasło *
                    </label>
                    <input
                      type="password"
                      value={accountData.password}
                      onChange={(e) => setAccountData(prev => ({...prev, password: e.target.value}))}
                      className={`w-full px-4 py-2 border rounded-lg ${colors.tertiary} ${colors.border} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500`}
                      placeholder="Minimum 6 znaków"
                    />
                    <p className={`text-xs ${colors.textSecondary} mt-1`}>
                      Hasło powinno zawierać litery i cyfry
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                      Powtórz hasło *
                    </label>
                    <input
                      type="password"
                      value={accountData.confirmPassword}
                      onChange={(e) => setAccountData(prev => ({...prev, confirmPassword: e.target.value}))}
                      className={`w-full px-4 py-2 border rounded-lg ${colors.tertiary} ${colors.border} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500`}
                      placeholder="Powtórz hasło"
                    />
                    {accountData.password && accountData.confirmPassword && accountData.password !== accountData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Hasła nie są identyczne</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={prevAccountStep}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                  >
                    ← Wstecz
                  </button>
                  <button
                    onClick={nextAccountStep}
                    disabled={!accountData.password || accountData.password.length < 6 || accountData.password !== accountData.confirmPassword}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Dalej →
                  </button>
                </div>
              </div>
            )}

            {/* Krok 3: Adres */}
            {accountWizardStep === 3 && (
              <div className="p-6">
                <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4`}>
                  📍 Adres (opcjonalne)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                      Miasto
                    </label>
                    <input
                      type="text"
                      value={accountData.city}
                      onChange={(e) => setAccountData(prev => ({...prev, city: e.target.value}))}
                      className={`w-full px-4 py-2 border rounded-lg ${colors.tertiary} ${colors.border} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500`}
                      placeholder="Rzeszów"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                      Ulica i numer
                    </label>
                    <input
                      type="text"
                      value={accountData.address}
                      onChange={(e) => setAccountData(prev => ({...prev, address: e.target.value}))}
                      className={`w-full px-4 py-2 border rounded-lg ${colors.tertiary} ${colors.border} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500`}
                      placeholder="Mickiewicza 15/3"
                    />
                    <p className={`text-xs ${colors.textSecondary} mt-1`}>
                      Przyspieszy to zamawianie napraw
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={prevAccountStep}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                  >
                    ← Wstecz
                  </button>
                  <button
                    onClick={nextAccountStep}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Dalej →
                  </button>
                </div>
              </div>
            )}

            {/* Krok 4: Podsumowanie i zgodz */}
            {accountWizardStep === 4 && (
              <div className="p-6">
                <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4`}>
                  ✅ Podsumowanie
                </h3>
                
                {/* Podsumowanie danych */}
                <div className={`${colors.tertiary} rounded-lg p-4 mb-4`}>
                  <h4 className={`font-medium ${colors.textPrimary} mb-2`}>Twoje dane:</h4>
                  <ul className={`text-sm ${colors.textSecondary} space-y-1`}>
                    <li>👤 <strong>Imię:</strong> {accountData.name}</li>
                    <li>📧 <strong>Email:</strong> {accountData.email}</li>
                    <li>📞 <strong>Telefon:</strong> {accountData.phone}</li>
                    {accountData.city && <li>🏙️ <strong>Miasto:</strong> {accountData.city}</li>}
                    {accountData.address && <li>📍 <strong>Adres:</strong> {accountData.address}</li>}
                  </ul>
                </div>

                {/* Korzyści z konta */}
                <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4`}>
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">🎁 Korzyści konta:</h4>
                  <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                    <li>📋 Historia wszystkich napraw</li>
                    <li>⚡ Szybsze zamawianie serwisu</li>
                    <li>💰 Rabaty dla stałych klientów</li>
                    <li>🔔 Powiadomienia SMS</li>
                    <li>📊 Panel zarządzania zleceniami</li>
                  </ul>
                </div>
                
                {/* Checkboxy */}
                <div className="space-y-3 mb-6">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={accountData.agreeToTerms}
                      onChange={(e) => setAccountData(prev => ({...prev, agreeToTerms: e.target.checked}))}
                      className="mt-1"
                    />
                    <span className={`text-sm ${colors.textPrimary}`}>
                      Akceptuję <strong>regulamin</strong> i <strong>politykę prywatności</strong> *
                    </span>
                  </label>
                  
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={accountData.newsletter}
                      onChange={(e) => setAccountData(prev => ({...prev, newsletter: e.target.checked}))}
                      className="mt-1"
                    />
                    <span className={`text-sm ${colors.textPrimary}`}>
                      Chcę otrzymywać newsletter z promocjami i nowościami
                    </span>
                  </label>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={prevAccountStep}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                  >
                    ← Wstecz
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    disabled={!accountData.agreeToTerms}
                    className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🎉 Załóż konto!
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            <div 
              className={`flex items-center space-x-3 ${isMinimized ? 'cursor-pointer hover:opacity-70' : ''} flex-1`}
              onClick={isMinimized ? () => setIsMinimized(false) : undefined}
              title={isMinimized ? 'Kliknij aby rozwinąć chat' : ''}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <FiCpu className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className={`font-bold ${colors.textPrimary}`}>TECHNIK AI</h3>
                  {userInfo?.isLoggedIn && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full font-medium">
                      🔐 Zalogowany
                    </span>
                  )}
                </div>
                <p className={`text-xs ${colors.textTertiary}`}>
                  {isTyping ? 'AI pisze...' : userInfo?.isLoggedIn ? `Witaj ${userInfo.name?.split(' ')[0]}!` : 'Online 24/7'}
                  {isMinimized && <span className="ml-2 text-blue-500">▲ Kliknij aby rozwinąć</span>}
                  {!isMinimized && (
                    <span className="ml-2">
                      {useOpenAI ? '🤖 GPT-4o mini' : '🔧 Klasyczny'}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Przełączniki AI - tylko 2 opcje */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <button
                    onClick={() => {
                      setUseOpenAI(true);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      useOpenAI
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                    title="Przełącz na GPT-4o mini (GŁÓWNE AI)"
                  >
                    🤖
                  </button>
                  <button
                    onClick={() => {
                      setUseOpenAI(false);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      !useOpenAI
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                    title="Przełącz na Classical AI (BACKUP)"
                  >
                    🔧
                  </button>
                </>
              )}
              
              {userInfo?.isLoggedIn && (
                <button
                  onClick={() => {
                    // Wyloguj z chat AI i synchronizuj z główną stroną
                    setUserInfo(null);
                    setShowContactForm(true);
                    setAccountSetupInProgress(false);
                    setAccountSetupStep(null);
                    localStorage.removeItem('chatUserInfo');
                    localStorage.removeItem('chatHistory');
                    localStorage.removeItem('chatOrderState');
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('rememberUser');
                    
                    // Wyczyść wiadomości i pokaż powitalną
                    const welcomeMessage = {
                      id: Date.now(),
                      text: "Zostałeś wylogowany. Cześć! 👋 Jestem AI asystentem firmy TECHNIK. Pomogę Ci z pytaniami o nasze usługi elektroniczne i serwisowe. O czym chciałbyś porozmawiać?",
                      sender: 'ai',
                      timestamp: new Date().toISOString()
                    };
                    setMessages([welcomeMessage]);
                  }}
                  className={`p-2 rounded-lg ${colors.textSecondary} hover:${colors.cardHover} transition-colors`}
                  title="Wyloguj się"
                >
                  <FiUser className="h-4 w-4" />
                </button>
              )}
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
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
                      >
                        Rozpocznij chat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowContactForm(false);
                          setUserInfo({
                            name: 'Anonim',
                            email: '',
                            phone: '',
                            company: '',
                            isLoggedIn: false
                          });
                          // Dodaj wiadomość informacyjną
                          const skipMessage = {
                            id: Date.now(),
                            text: "Ok, możesz chatować anonimowo! 😊 Pamiętaj, że podanie danych ułatwi mi lepszą pomoc, ale nie jest wymagane. O czym chciałbyś porozmawiać?",
                            sender: 'ai',
                            timestamp: new Date().toISOString()
                          };
                          setMessages(prev => [...prev, skipMessage]);
                        }}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        title="Kontynuuj bez podawania danych"
                      >
                        Pomiń
                      </button>
                    </div>
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
                          <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                          
                          {/* Przycisk Auto-Rezerwacji */}
                          {message.sender === 'ai' && message.showAutoReservationButton && (
                            <div className="mt-3 space-y-2">
                              <button
                                onClick={() => window.open('/auto-rezerwacja', '_blank')}
                                className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                              >
                                <FiCpu className="w-4 h-4 mr-2" />
                                🤖 Auto-Rezerwacja z AI
                              </button>
                              <p className="text-xs text-gray-500 text-center">
                                Inteligentna diagnoza i automatyczne tworzenie zlecenia
                              </p>
                            </div>
                          )}
                          
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
                    {/* Przycisk "Przedstaw się" tylko dla użytkowników anonimowych */}
                    {userInfo?.name === 'Anonim' && (
                      <button
                        onClick={() => {
                          setShowContactForm(true);
                          const askMessage = {
                            id: Date.now(),
                            text: "Świetnie! 😊 Teraz możesz podać swoje dane, co pomoże mi lepiej Ci pomagać:",
                            sender: 'ai',
                            timestamp: new Date().toISOString()
                          };
                          setMessages(prev => [...prev, askMessage]);
                        }}
                        className="px-3 py-1.5 text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full transition-all transform hover:scale-105"
                      >
                        👤 Przedstaw się
                      </button>
                    )}
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
                      onClick={openAccountWizard}
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

              {accountSetupInProgress && (
                <div className="px-4 pb-2">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-indigo-900/20 border-indigo-700' : 'bg-indigo-50 border-indigo-200'} border`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                        👤 Zakładanie konta - {
                          accountSetupStep === 'offer' ? 'Potwierdzenie' : 
                          accountSetupStep === 'password' ? 'Hasło' :
                          accountSetupStep === 'ask-login' ? 'Logowanie' : 'Proces'
                        }
                      </span>
                      <div className="flex space-x-1">
                        {['offer', 'password', 'ask-login'].map((step, index) => (
                          <div
                            key={step}
                            className={`w-2 h-2 rounded-full ${
                              step === accountSetupStep || 
                              (accountSetupStep === 'password' && step === 'offer') ||
                              (accountSetupStep === 'ask-login' && (step === 'offer' || step === 'password'))
                                ? 'bg-indigo-500' 
                                : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Przyciski szybkich akcji podczas zakładania konta */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {accountSetupStep === 'ask-login' && (
                        <button
                          onClick={() => {
                            setInputMessage('zaloguj');
                            setTimeout(() => sendMessage(), 100);
                          }}
                          className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full transition-all transform hover:scale-105"
                        >
                          🔐 Zaloguj
                        </button>
                      )}
                      {accountSetupStep === 'ask-login' && (
                        <button
                          onClick={() => {
                            setInputMessage('później');
                            setTimeout(() => sendMessage(), 100);
                          }}
                          className="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full transition-all transform hover:scale-105"
                        >
                          ⏰ Później
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
                      {accountSetupStep !== 'ask-login' && (
                        <button
                          onClick={openAccountWizard}
                          className="px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full transition-all transform hover:scale-105"
                        >
                          🧙‍♂️ Kreator
                        </button>
                      )}
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