// pages/index-serwis-agd.js - Dedykowana homepage dla serwisu AGD

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../utils/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import LiveChatAI from '../components/LiveChatAI';
import AccountButton from '../components/AccountButton';
import { CITY_LIST, findNearestCity, DEFAULT_CITY, getCityBySlug } from '../config/cities';
import { 
  FiTool,
  FiCheck,
  FiClock,
  FiStar,
  FiPhone,
  FiMail,
  FiMapPin,
  FiShield,
  FiAward,
  FiUsers,
  FiSettings
} from 'react-icons/fi';

// Ikony AGD
const AGDIcons = {
  Pralka: () => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="8" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="16" cy="5" r="1" fill="currentColor" />
    </svg>
  ),
  Lodowka: () => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="7" y1="6" x2="7" y2="8" strokeWidth="3" strokeLinecap="round" />
      <line x1="7" y1="14" x2="7" y2="16" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  Zmywarka: () => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 8 h18" />
      <circle cx="7" cy="5.5" r="0.5" fill="currentColor" />
      <circle cx="9" cy="5.5" r="0.5" fill="currentColor" />
      <circle cx="11" cy="5.5" r="0.5" fill="currentColor" />
      <circle cx="12" cy="14" r="4" strokeDasharray="2 2" />
    </svg>
  ),
  Piekarnik: () => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="7" y="10" width="10" height="7" rx="1" />
      <circle cx="17" cy="7" r="0.5" fill="currentColor" />
      <circle cx="15" cy="7" r="0.5" fill="currentColor" />
    </svg>
  )
};

export default function Home({ siteSettings }) {
  const router = useRouter();
  const { colors, isDarkMode, mounted } = useTheme();
  const [loading, setLoading] = useState(true);
  
  // Użyj ustawień z props lub fallback na domyślne
  const settings = siteSettings || {
    contact: { phone: '+48 123 456 789', email: 'kontakt@techserwis.pl', address: 'Dębica' },
    stats: { yearsExperience: '15+', repairsCompleted: '2500+', happyClients: '849+', rating: '4.9' },
    seo: { title: 'TECHNIK Serwis AGD', description: 'Profesjonalny serwis AGD' }
  };
  
  const [animatedStats, setAnimatedStats] = useState({
    years: 0,
    repairs: 0,
    clients: 0,
    rating: 0
  });
  
  // 🌍 Auto-detekcja najbliższego miasta
  const [detectedCity, setDetectedCity] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // 🎨 Kontrola panelu wersji/miast
  const [showVersionPanel, setShowVersionPanel] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoading(false);
      
      // 🧪 TRYB TESTOWY - ?test=rzeszow w URL
      const urlParams = new URLSearchParams(window.location.search);
      const testCity = urlParams.get('test');
      
      if (testCity) {
        const city = getCityBySlug(testCity);
        if (city) {
          console.log('🧪 TRYB TESTOWY - Symulacja wykrycia:', city.name);
          setDetectedCity(city);
          setIsRedirecting(true);
          
          setTimeout(() => {
            router.push(`/serwis/${city.slug}`);
          }, 1500);
          return;
        }
      }
      
      // Spróbuj wykryć lokalizację użytkownika
      if (navigator.geolocation) {
        console.log('📍 Próba wykrycia lokalizacji...');
        setIsDetectingLocation(true);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('📍 Otrzymano współrzędne:', latitude, longitude);
            const nearest = findNearestCity(latitude, longitude);
            
            if (nearest) {
              setDetectedCity(nearest);
              setIsRedirecting(true);
              setIsDetectingLocation(false);
              console.log('🌍 Wykryto lokalizację:', nearest.name);
              
              // ⚡ Automatyczne przekierowanie po 1.5 sekundy
              setTimeout(() => {
                console.log('🚀 Przekierowanie na:', `/serwis/${nearest.slug}`);
                router.push(`/serwis/${nearest.slug}`);
              }, 1500);
            } else {
              setIsDetectingLocation(false);
              setTimeout(() => {
                setShowCitySelector(true);
              }, 500);
            }
          },
          (error) => {
            console.log('❌ Lokalizacja niedostępna:', error.message);
            setIsDetectingLocation(false);
            // Pokaż selektor miast jeśli GPS nie działa
            setTimeout(() => {
              setShowCitySelector(true);
            }, 1000);
          },
          {
            timeout: 10000, // 10 sekund timeout
            enableHighAccuracy: false,
            maximumAge: 300000 // 5 minut cache
          }
        );
      } else {
        console.log('❌ Geolokalizacja nie jest dostępna w tej przeglądarce');
        // Pokaż selektor miast jeśli geolokalizacja niedostępna
        setTimeout(() => {
          setShowCitySelector(true);
        }, 1000);
      }
    }

    // Animacja statystyk
    const animateStats = () => {
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;
      
      // Pobierz wartości z ustawień i przekonwertuj na liczby
      const targets = { 
        years: parseInt(settings.stats.yearsExperience) || 15, 
        repairs: parseInt(settings.stats.repairsCompleted) || 2500, 
        clients: parseInt(settings.stats.happyClients) || 850, 
        rating: parseFloat(settings.stats.rating) || 4.9 
      };
      let current = { years: 0, repairs: 0, clients: 0, rating: 0 };
      
      const increment = {
        years: targets.years / steps,
        repairs: targets.repairs / steps,
        clients: targets.clients / steps,
        rating: targets.rating / steps
      };

      const timer = setInterval(() => {
        current.years = Math.min(current.years + increment.years, targets.years);
        current.repairs = Math.min(current.repairs + increment.repairs, targets.repairs);
        current.clients = Math.min(current.clients + increment.clients, targets.clients);
        current.rating = Math.min(current.rating + increment.rating, targets.rating);

        setAnimatedStats({
          years: Math.floor(current.years),
          repairs: Math.floor(current.repairs),
          clients: Math.floor(current.clients),
          rating: current.rating.toFixed(1)
        });

        if (current.years >= targets.years) {
          clearInterval(timer);
        }
      }, stepTime);

      return () => clearInterval(timer);
    };

    const timeout = setTimeout(animateStats, 1000);
    return () => clearTimeout(timeout);
  }, []);

  if (loading || !mounted) {
    return (
      <div className={`min-h-screen ${colors.primary} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // 🌍 Ekran wykrywania lokalizacji
  if (isDetectingLocation) {
    return (
      <div className={`min-h-screen ${colors.primary} flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className="mb-6">
            <FiMapPin className="h-16 w-16 text-blue-500 mx-auto animate-pulse" />
          </div>
          <h2 className={`text-3xl font-bold ${colors.textPrimary} mb-4`}>
            Wykrywam Twoją lokalizację...
          </h2>
          <p className={`text-lg ${colors.textSecondary} mb-6`}>
            Poczekaj chwilę, sprawdzam najbliższe miasto
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className={colors.textTertiary}>Ładowanie GPS...</span>
          </div>
          <button
            onClick={() => {
              setIsDetectingLocation(false);
              setShowCitySelector(true);
            }}
            className={`mt-8 px-6 py-3 ${colors.secondary} hover:${colors.cardHover} border ${colors.border} rounded-lg ${colors.textSecondary} transition-all`}
          >
            Pomiń i wybierz miasto ręcznie
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out;
        }
      `}</style>
      
      <div className={`min-h-screen ${colors.primary} transition-colors duration-300`}>
        {/* Professional Navigation - prostszy, bardziej stonowany */}
        <nav className={`${colors.secondary}/95 backdrop-blur-sm ${colors.border} border-b sticky top-0 z-50`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiTool className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${colors.textPrimary}`}>TECHNIK</div>
                <div className={`text-xs ${colors.textTertiary} font-medium`}>Serwis AGD • Dębica</div>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#uslugi" className={`${colors.textSecondary} hover:text-blue-600 transition-colors font-medium`}>
                Usługi
              </Link>
              <Link href="#cennik" className={`${colors.textSecondary} hover:text-blue-600 transition-colors font-medium`}>
                Cennik
              </Link>
              <Link href="#o-nas" className={`${colors.textSecondary} hover:text-blue-600 transition-colors font-medium`}>
                O nas
              </Link>
              <Link href="#kontakt" className={`${colors.textSecondary} hover:text-blue-600 transition-colors font-medium`}>
                Kontakt
              </Link>
              
              <ThemeToggle />
              <AccountButton />
              
              <Link href="/admin" className={`p-2 ${colors.secondary} rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors`} title="Panel Admina">
                <FiSettings className="h-5 w-5" />
              </Link>
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center space-x-2">
              <ThemeToggle />
              <AccountButton />
              <Link href="/admin" className={`p-2 ${colors.secondary} rounded-lg`}>
                <FiSettings className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - bardziej przyziemny, mniej futurystyczny */}
      <section className={`relative overflow-hidden ${colors.primary}`}>
        {/* Subtelne tło bez przesady */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Najpierw najprostsze info */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6">
              <FiCheck className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Naprawy od 1995 roku</span>
            </div>

            <h1 className={`text-5xl md:text-6xl font-bold ${colors.textPrimary} mb-6`}>
              Profesjonalny Serwis<br />
              <span className="text-blue-600">Sprzętu AGD</span>
            </h1>

            <p className={`text-xl ${colors.textSecondary} mb-8 max-w-2xl mx-auto`}>
              Naprawiamy pralki, lodówki, zmywarki, piekarniki i inne urządzenia.<br />
              <strong>Szybko, tanio, z gwarancją.</strong>
            </p>

            {/* Główne CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/rezerwacja"
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg text-white"
              >
                <span className="flex items-center gap-3">
                  📱 Zamów Naprawę
                </span>
              </Link>
              
              <Link
                href="/moje-zamowienie"
                className={`group px-8 py-4 ${colors.secondary} border-2 ${colors.border} hover:border-blue-600 rounded-xl font-semibold text-lg transition-all ${colors.textPrimary}`}
              >
                <span className="flex items-center gap-3">
                  🔍 Sprawdź Status
                </span>
              </Link>

              <Link
                href="/cennik"
                className="group px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition-all text-white"
              >
                💰 Cennik
              </Link>
            </div>

            {/* Szybki kontakt */}
            <div className={`inline-flex items-center gap-6 px-6 py-4 ${colors.secondary} ${colors.border} border rounded-xl`}>
              <a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
                <FiPhone className="h-5 w-5" />
                <span>{settings.contact.phone}</span>
              </a>
              <div className={`w-px h-6 ${colors.border} border-l`}></div>
              <div className={`flex items-center gap-2 ${colors.textTertiary}`}>
                <FiClock className="h-5 w-5" />
                <span className="text-sm">Pn-Pt: 8:00-18:00</span>
              </div>
            </div>
          </div>

          {/* Statystyki - proste i czytelne */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className={`text-center p-6 ${colors.secondary} rounded-xl ${colors.border} border`}>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {animatedStats.years}+
              </div>
              <div className={`text-sm ${colors.textTertiary}`}>Lat<br/>doświadczenia</div>
            </div>
            <div className={`text-center p-6 ${colors.secondary} rounded-xl ${colors.border} border`}>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {animatedStats.repairs}+
              </div>
              <div className={`text-sm ${colors.textTertiary}`}>Naprawionych<br/>urządzeń</div>
            </div>
            <div className={`text-center p-6 ${colors.secondary} rounded-xl ${colors.border} border`}>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {animatedStats.clients}+
              </div>
              <div className={`text-sm ${colors.textTertiary}`}>Zadowolonych<br/>klientów</div>
            </div>
            <div className={`text-center p-6 ${colors.secondary} rounded-xl ${colors.border} border`}>
              <div className="text-3xl font-bold text-yellow-500 mb-1 flex items-center justify-center gap-1">
                {animatedStats.rating}
                <FiStar className="h-6 w-6 fill-yellow-500" />
              </div>
              <div className={`text-sm ${colors.textTertiary}`}>Średnia<br/>ocen</div>
            </div>
          </div>
        </div>
      </section>

      {/* Naprawiamy - ikony z urządzeniami */}
      <section id="uslugi" className={`py-20 ${colors.secondary}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${colors.textPrimary} mb-4`}>Co naprawiamy?</h2>
            <p className={`text-lg ${colors.textSecondary}`}>
              Zajmujemy się wszystkimi typami sprzętu AGD
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Pralki', icon: 'Pralka', color: 'blue' },
              { name: 'Lodówki', icon: 'Lodowka', color: 'cyan' },
              { name: 'Zmywarki', icon: 'Zmywarka', color: 'teal' },
              { name: 'Piekarniki', icon: 'Piekarnik', color: 'orange' },
              { name: 'Suszarki', icon: 'Pralka', color: 'purple' },
              { name: 'Mikrofalówki', icon: 'Piekarnik', color: 'pink' },
              { name: 'Okapy', icon: 'Piekarnik', color: 'indigo' },
              { name: 'Kuchenki', icon: 'Piekarnik', color: 'red' }
            ].map((item, idx) => {
              const IconComponent = AGDIcons[item.icon] || AGDIcons.Pralka;
              return (
                <div
                  key={idx}
                  className={`group p-6 ${colors.primary} ${colors.border} border hover:border-${item.color}-500 rounded-xl transition-all hover:shadow-lg cursor-pointer`}
                >
                  <div className={`w-16 h-16 mx-auto mb-4 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                    <IconComponent />
                  </div>
                  <h3 className={`text-center font-semibold ${colors.textPrimary}`}>{item.name}</h3>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/rezerwacja"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-lg transition-all shadow-lg text-white"
            >
              📱 Zamów Naprawę Teraz
            </Link>
          </div>
        </div>
      </section>

      {/* Jak działamy */}
      <section className={`py-20 ${colors.primary}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${colors.textPrimary} mb-4`}>Jak działamy?</h2>
            <p className={`text-lg ${colors.textSecondary}`}>
              Prosty proces w 4 krokach
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Zgłoszenie', desc: 'Zadzwoń lub wypełnij formularz online', icon: FiPhone },
              { step: '2', title: 'Diagnoza', desc: 'Serwisant ustali przyczynę usterki', icon: FiTool },
              { step: '3', title: 'Naprawa', desc: 'Szybka naprawa z oryginalnymi częściami', icon: FiSettings },
              { step: '4', title: 'Gwarancja', desc: 'Otrzymujesz gwarancję na naprawę', icon: FiShield }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="relative mb-6">
                  <div className={`w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center`}>
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center font-bold text-blue-600 text-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>{item.title}</h3>
                <p className={colors.textSecondary}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dlaczego my */}
      <section className={`py-20 ${colors.secondary}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${colors.textPrimary} mb-4`}>Dlaczego warto nas wybrać?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: FiShield, 
                title: 'Gwarancja', 
                desc: 'Na każdą naprawę udzielamy gwarancji do 12 miesięcy',
                color: 'green'
              },
              { 
                icon: FiClock, 
                title: 'Szybko', 
                desc: 'Większość napraw wykonujemy tego samego dnia',
                color: 'blue'
              },
              { 
                icon: FiAward, 
                title: 'Doświadczenie', 
                desc: 'Ponad 15 lat na rynku, setki zadowolonych klientów',
                color: 'purple'
              },
              { 
                icon: FiUsers, 
                title: 'Profesjonalizm', 
                desc: 'Wykwalifikowani serwisanci z certyfikatami',
                color: 'orange'
              },
              { 
                icon: FiCheck, 
                title: 'Oryginalne części', 
                desc: 'Używamy tylko oryginalnych części zamiennych',
                color: 'teal'
              },
              { 
                icon: FiStar, 
                title: 'Najwyższe oceny', 
                desc: '4.9/5 średniej oceny od naszych klientów',
                color: 'yellow'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-6 ${colors.primary} ${colors.border} border rounded-xl hover:shadow-lg transition-all`}
              >
                <div className={`w-14 h-14 bg-${item.color}-100 dark:bg-${item.color}-900/20 rounded-lg flex items-center justify-center mb-4`}>
                  <item.icon className={`h-7 w-7 text-${item.color}-600`} />
                </div>
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>{item.title}</h3>
                <p className={colors.textSecondary}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cennik - prosty przegląd */}
      <section id="cennik" className={`py-20 ${colors.primary}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${colors.textPrimary} mb-4`}>Orientacyjne ceny</h2>
            <p className={`text-lg ${colors.textSecondary}`}>
              Dokładną wycenę otrzymasz po diagnozie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Diagnoza', price: 'GRATIS', desc: 'Przy zleceniu naprawy' },
              { name: 'Naprawa podstawowa', price: 'od 150 zł', desc: 'Wymiana prostych części' },
              { name: 'Naprawa zaawansowana', price: 'od 300 zł', desc: 'Skomplikowane usterki' }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-8 ${colors.secondary} ${colors.border} border rounded-xl text-center hover:shadow-lg transition-all`}
              >
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>{item.name}</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">{item.price}</div>
                <p className={`text-sm ${colors.textTertiary}`}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/cennik"
              className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-semibold text-lg transition-all shadow-lg text-white"
            >
              💰 Pełny Cennik
            </Link>
          </div>
        </div>
      </section>

      {/* Kontakt */}
      <section id="kontakt" className={`py-20 ${colors.secondary}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${colors.textPrimary} mb-4`}>Skontaktuj się z nami</h2>
            <p className={`text-lg ${colors.textSecondary}`}>
              Jesteśmy do Twojej dyspozycji
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`text-center p-8 ${colors.primary} rounded-xl`}>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPhone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>Telefon</h3>
              <p className={`${colors.textTertiary} mb-4`}>Pn-Pt: 8:00-18:00</p>
              <a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`} className="text-blue-600 hover:text-blue-700 font-semibold text-lg">
                {settings.contact.phone}
              </a>
            </div>

            <div className={`text-center p-8 ${colors.primary} rounded-xl`}>
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMail className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>Email</h3>
              <p className={`${colors.textTertiary} mb-4`}>Odpowiadamy w 24h</p>
              <a href={`mailto:${settings.contact.email}`} className="text-purple-600 hover:text-purple-700 font-semibold text-lg">
                {settings.contact.email}
              </a>
            </div>

            <div className={`text-center p-8 ${colors.primary} rounded-xl`}>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>Adres</h3>
              <p className={`${colors.textTertiary} mb-4`}>Punkt serwisowy</p>
              <p className="text-green-600 font-semibold">
                {settings.contact.address}
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/kontakt"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-lg transition-all shadow-lg text-white"
            >
              <FiMail className="h-6 w-6 mr-3" />
              Formularz Kontaktowy
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Status zamówienia */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Masz już zlecenie? Sprawdź jego status!
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Wpisz numer zamówienia (np. <strong>ORDW252750001</strong>) i telefon
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/moje-zamowienie"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              🔍 Sprawdź Status
            </Link>
            <Link
              href="/rezerwacja"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              📱 Nowe Zamówienie
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${colors.secondary} ${colors.border} border-t py-12`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiTool className="h-6 w-6 text-white" />
              </div>
              <div className={`text-2xl font-bold ${colors.textPrimary}`}>TECHNIK</div>
            </div>
            <p className={`${colors.textSecondary} mb-6`}>
              Profesjonalny Serwis Sprzętu AGD • Dębica
            </p>
            <div className={`flex justify-center space-x-6 text-sm ${colors.textTertiary}`}>
              <span>© 2025 {settings.companyName || 'TECHNIK Serwis AGD'}</span>
              <span>•</span>
              <span>{settings.contact.address}</span>
              <span>•</span>
              <a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`} className="hover:text-blue-600 transition-colors">
                {settings.contact.phone}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* 🌍 Modal automatycznego przekierowania */}
      {isRedirecting && detectedCity && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className={`${colors.secondary} rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slideUp`}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FiMapPin className="h-10 w-10 text-white" />
              </div>
              <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2`}>
                🎯 Wykryto lokalizację!
              </h3>
              <p className={`text-lg font-semibold text-blue-600 mb-3`}>
                {detectedCity.name}
              </p>
              <p className={colors.textSecondary}>
                Przekierowujemy Cię na stronę z lokalną ofertą dla <strong>{detectedCity.name}</strong>...
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-progress" style={{animation: 'progress 1.5s ease-in-out'}}></div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsRedirecting(false);
                  setDetectedCity(null);
                }}
                className={`block w-full px-6 py-3 ${colors.primary} border-2 ${colors.border} hover:border-red-600 rounded-lg font-semibold text-center transition-all ${colors.textPrimary}`}
              >
                ❌ Anuluj - zostań tutaj
              </button>
            </div>
            
            <Link
              href="/serwis"
              className="block text-center text-xs text-blue-600 hover:text-blue-700 mt-4 font-medium"
              onClick={() => setShowLocationPrompt(false)}
            >
              📍 Zobacz wszystkie miasta →
            </Link>
            
            <p className="text-xs text-center text-gray-500 mt-2">
              Obsługujemy również: {CITY_LIST.filter(c => c.id !== detectedCity.id).map(c => c.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* 📍 Modal wyboru miasta (gdy GPS nie działa) */}
      {showCitySelector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className={`${colors.secondary} rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-slideUp max-h-[90vh] overflow-y-auto`}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="h-10 w-10 text-white" />
              </div>
              <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2`}>
                📍 Wybierz swoje miasto
              </h3>
              <p className={colors.textSecondary}>
                Obsługujemy <strong>5 miast</strong> w Twoim regionie. Wybierz najbliższe, aby zobaczyć lokalną ofertę!
              </p>
            </div>
            
            {/* Lista miast */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {CITY_LIST.map((city) => (
                <Link
                  key={city.id}
                  href={`/serwis/${city.slug}`}
                  className={`group p-4 ${colors.primary} border-2 ${colors.border} hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer`}
                  onClick={() => setShowCitySelector(false)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiMapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-grow">
                      <div className={`text-lg font-bold ${colors.textPrimary} group-hover:text-blue-600 transition-colors`}>
                        {city.name}
                      </div>
                      <div className={`text-sm ${colors.textTertiary}`}>
                        {city.region} • {city.phone}
                      </div>
                    </div>
                    <div className="text-blue-600 text-2xl">→</div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Przycisk zamknięcia */}
            <button
              onClick={() => setShowCitySelector(false)}
              className={`block w-full px-6 py-3 ${colors.primary} border-2 ${colors.border} hover:border-gray-400 rounded-lg font-semibold text-center transition-all ${colors.textSecondary}`}
            >
              Zostań na stronie głównej
            </button>
          </div>
        </div>
      )}

      {/* Live Chat AI */}
      <LiveChatAI />

      {/* Przycisk do rozwijania panelu wersji/miast */}
      <button
        onClick={() => setShowVersionPanel(!showVersionPanel)}
        className="fixed bottom-4 left-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl transition-all transform hover:scale-110"
        title="Wersje strony i miasta"
      >
        <FiSettings className={`h-6 w-6 transition-transform ${showVersionPanel ? 'rotate-90' : ''}`} />
      </button>

      {/* Rozwijany panel wersji + wybór miast */}
      {showVersionPanel && (
        <div className="fixed bottom-20 left-4 z-50 flex flex-col gap-2 max-h-[70vh] overflow-y-auto p-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl border-2 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs ${colors.textTertiary} font-medium`}>🏠 Wybierz Wersję:</div>
            <button
              onClick={() => setShowVersionPanel(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <Link
            href="/index-serwis-agd"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm shadow-lg transition-all font-medium"
          >
            🔧 SERWIS AGD (główna)
          </Link>
          
          <Link
            href="/"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg text-sm shadow-lg transition-all font-medium"
          >
            🎨 Oryginalna
          </Link>
          
          <div className={`h-px ${colors.border} border-t my-2`}></div>
          <div className={`text-xs ${colors.textTertiary} font-medium mb-1 px-2`}>📍 Wybierz Miasto:</div>
          
          <Link
            href="/serwis"
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg text-sm shadow-lg transition-all font-medium text-center"
          >
            🗺️ Wszystkie miasta
          </Link>
          
          {CITY_LIST.map((city) => (
            <Link
              key={city.id}
              href={`/serwis/${city.slug}`}
              className={`px-4 py-2 ${colors.secondary} ${colors.border} border hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg text-sm transition-all font-medium ${colors.textPrimary} flex items-center gap-2`}
            >
              <FiMapPin className="h-4 w-4 text-blue-600" />
              {city.name}
            </Link>
          ))}
          
          <div className={`h-px ${colors.border} border-t my-2`}></div>
          
          <Link
            href="/admin"
            className={`px-4 py-2 ${colors.secondary} border ${colors.border} hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg text-sm shadow-lg transition-all font-medium ${colors.textPrimary}`}
          >
            ⚙️ Panel Admin
          </Link>
        </div>
      )}
    </div>
    </>
  );
}

// Pobierz ustawienia strony przy każdym załadowaniu
export async function getServerSideProps() {
  try {
    const fs = require('fs/promises');
    const path = require('path');
    const settingsPath = path.join(process.cwd(), 'data', 'site-settings.json');
    
    const data = await fs.readFile(settingsPath, 'utf-8');
    const siteSettings = JSON.parse(data);
    
    return {
      props: {
        siteSettings
      }
    };
  } catch (error) {
    console.error('Błąd wczytywania ustawień strony:', error);
    // Zwróć domyślne wartości w przypadku błędu
    return {
      props: {
        siteSettings: {
          contact: {
            phone: '+48 123 456 789',
            email: 'kontakt@techserwis.pl',
            address: 'Dębica'
          },
          stats: {
            yearsExperience: '15+',
            repairsCompleted: '2500+',
            happyClients: '849+',
            rating: '4.9'
          },
          seo: {
            title: 'TECHNIK Serwis AGD',
            description: 'Profesjonalny serwis AGD'
          },
          companyName: 'TECHNIK',
          slogan: 'Profesjonalne naprawy sprzętu AGD'
        }
      }
    };
  }
}
