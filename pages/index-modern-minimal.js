// pages/index-modern-minimal.js - Nowoczesna minimalistyczna wersja z białym tłem

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../utils/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import LiveChatAI from '../components/LiveChatAI';
import AccountButton from '../components/AccountButton';
import RoleTester from '../components/RoleTester';
import { 
  FiZap, 
  FiCpu, 
  FiSettings, 
  FiShoppingBag,
  FiTool,
  FiSmartphone,
  FiMonitor,
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowRight,
  FiPlay,
  FiCheck,
  FiStar,
  FiCircle,
  FiTarget,
  FiShield
} from 'react-icons/fi';

export default function HomeModernMinimal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [titleColorIndex, setTitleColorIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Elegancka paleta - głównie granatowy z akcentami
  const titleColors = [
    "text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900", // 0 - ciemny gradient
    "text-slate-900",     // 1 - czarny
    "text-gray-800",      // 2 - ciemnoszary  
    "text-blue-900",      // 3 - granatowy
    "text-indigo-900",    // 4 - indygo
    "text-violet-900",    // 5 - fiolet
    "text-purple-900",    // 6 - purpura
    "text-slate-800",     // 7 - ciemny slate
    "text-zinc-800",      // 8 - cynk
    "text-stone-800",     // 9 - kamień
    "text-neutral-800",   // 10 - neutralny
    "text-gray-900",      // 11 - szary
    "text-blue-800",      // 12 - niebieski
    "text-indigo-800",    // 13 - indygo
    "text-teal-800",      // 14 - morski
    "text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-indigo-900",   // 15
    "text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-gray-900",    // 16
    "text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-purple-900", // 17
    "text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-slate-800",    // 18
    "text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-teal-800"      // 19
  ];
  
  const [animatedStats, setAnimatedStats] = useState({
    years: 0,
    projects: 0,
    clients: 0
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoading(false);
    }

    // Obsługa scroll dla navbar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const animateStats = () => {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      const targets = { years: 15, projects: 250, clients: 500 };
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setAnimatedStats({
          years: Math.floor(targets.years * progress),
          projects: Math.floor(targets.projects * progress),
          clients: Math.floor(targets.clients * progress)
        });

        if (currentStep >= steps) {
          clearInterval(timer);
          setAnimatedStats(targets);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    };

    const timeout = setTimeout(animateStats, 1000);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 text-gray-900 relative">
      {/* Bardziej widoczny wzór tła */}
      <div className="fixed inset-0 opacity-[0.05] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, #3b82f6 2px, transparent 2px),
                           radial-gradient(circle at 80% 70%, #6366f1 1.5px, transparent 1.5px),
                           radial-gradient(circle at 40% 80%, #8b5cf6 1px, transparent 1px)`,
          backgroundSize: '60px 60px, 80px 80px, 100px 100px'
        }}></div>
      </div>
      
      {/* Widoczniejsze floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-indigo-400/25 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-violet-400/20 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-blue-500/35 rounded-full animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
        <div className="absolute top-1/2 left-1/5 w-1 h-1 bg-cyan-400/25 rounded-full animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}></div>
        <div className="absolute bottom-1/4 right-1/5 w-2 h-2 bg-purple-400/20 rounded-full animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '3.8s' }}></div>
      </div>
      
      {/* Bardziej widoczne gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-tr from-blue-50/20 via-white/80 to-indigo-100/15 pointer-events-none"></div>
      
      {/* Duże dekoracyjne kształty w tle */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100/10 to-indigo-100/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-100/10 to-cyan-100/12 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-gradient-to-br from-purple-100/8 to-blue-100/12 rounded-full blur-2xl"></div>
      </div>
      
      {/* Nowoczesna nawigacja */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 relative ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo - eleganckie i minimalistyczne */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                    <FiZap className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight">TECHNIK</div>
                  <div className="text-sm text-blue-900 font-medium">Professional Solutions</div>
                </div>
              </div>

              {/* Mobilne kontrolki */}
              <div className="flex md:hidden items-center space-x-3 flex-shrink-0">
                <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-2">
                  <button
                    onClick={() => setTitleColorIndex((prev) => (prev + 1) % titleColors.length)}
                    className={`p-1.5 rounded-full transition-all ${
                      titleColorIndex === 0 
                        ? 'bg-white shadow-sm' 
                        : 'bg-blue-900 shadow-sm'
                    }`}
                    title={`Kolor ${titleColorIndex + 1}/${titleColors.length}`}
                  >
                    <FiCircle className={`h-3 w-3 ${
                      titleColorIndex === 0 ? 'text-blue-900' : 'text-white'
                    }`} />
                  </button>
                  <span className="text-xs text-gray-600 font-semibold">
                    {titleColorIndex + 1}/{titleColors.length}
                  </span>
                </div>
                <AccountButton />
              </div>
            </div>
            
            {/* Desktopowe menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#uslugi" className="text-gray-600 hover:text-blue-900 transition-colors font-medium">
                Usługi
              </Link>
              <Link href="#o-nas" className="text-gray-600 hover:text-blue-900 transition-colors font-medium">
                O nas
              </Link>
              <Link href="#portfolio" className="text-gray-600 hover:text-blue-900 transition-colors font-medium">
                Portfolio
              </Link>
              <Link href="#kontakt" className="text-gray-600 hover:text-blue-900 transition-colors font-medium">
                Kontakt
              </Link>
              
              <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2">
                <button
                  onClick={() => setTitleColorIndex((prev) => (prev + 1) % titleColors.length)}
                  className={`p-2 rounded-full transition-all ${
                    titleColorIndex === 0 
                      ? 'bg-white shadow-sm hover:shadow-md' 
                      : 'bg-blue-900 shadow-sm hover:shadow-md'
                  }`}
                  title={`Zmień kolor napisu TECHNIK (${titleColorIndex + 1}/${titleColors.length})`}
                >
                  <FiCircle className={`h-4 w-4 ${
                    titleColorIndex === 0 ? 'text-blue-900' : 'text-white'
                  }`} />
                </button>
                <span className="text-sm text-gray-600 font-semibold">
                  {titleColorIndex + 1}/{titleColors.length}
                </span>
              </div>
              
              <AccountButton />
              
              <Link
                href="#kontakt"
                className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Skontaktuj się
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - minimalistyczny */}
      <section className="pt-24 pb-16 bg-transparent relative">
        {/* Bardziej widoczne koła tła */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-indigo-200/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-violet-100/50 rounded-full blur-3xl"></div>
        <div className="absolute top-60 right-1/3 w-28 h-28 bg-cyan-100/35 rounded-full blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Elegancki znaczek */}
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full mb-8 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
              <FiStar className="h-4 w-4 text-blue-900 mr-2" />
              <span className="text-blue-900 text-sm font-semibold">Profesjonalne rozwiązania elektroniczne</span>
            </div>
            
            {/* Główny nagłówek */}
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              <span className={titleColors[titleColorIndex]}>
                TECHNIK
              </span>
              <br />
              <span className="text-2xl md:text-3xl text-gray-600 font-normal">
                Innowacje w elektronice
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Tworzymy zaawansowane rozwiązania elektroniczne dla firm i instytucji. 
              Nasze doświadczenie i pasja do technologii gwarantują najwyższą jakość usług.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="#uslugi"
                className="group px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center gap-3">
                  <FiArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  Poznaj nasze usługi
                </span>
              </Link>
              
              <Link
                href="#kontakt"
                className="group px-8 py-4 bg-white hover:bg-gray-50 text-blue-900 border-2 border-blue-900 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <FiPhone className="h-5 w-5" />
                  Bezpłatna konsultacja
                </span>
              </Link>
            </div>

            {/* Statystyki z ikonami */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAward className="h-6 w-6 text-blue-900" />
                </div>
                <div className="text-4xl font-bold text-blue-900 mb-2">
                  {animatedStats.years}+
                </div>
                <div className="text-gray-600 font-medium">Lat doświadczenia</div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTrendingUp className="h-6 w-6 text-indigo-900" />
                </div>
                <div className="text-4xl font-bold text-indigo-900 mb-2">
                  {animatedStats.projects}+
                </div>
                <div className="text-gray-600 font-medium">Zrealizowanych projektów</div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="h-6 w-6 text-teal-900" />
                </div>
                <div className="text-4xl font-bold text-teal-900 mb-2">
                  {animatedStats.clients}+
                </div>
                <div className="text-gray-600 font-medium">Zadowolonych klientów</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sekcja usług */}
      <section id="uslugi" className="py-20 bg-gradient-to-b from-blue-50/30 via-gray-50/80 to-indigo-50/25 relative">
        {/* Bardziej widoczne geometric shapes */}
        <div className="absolute top-10 right-20 w-20 h-20 bg-blue-200/20 transform rotate-12 rounded-lg"></div>
        <div className="absolute bottom-20 left-10 w-16 h-16 bg-indigo-200/25 transform -rotate-6 rounded-lg"></div>
        <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-violet-100/30 transform rotate-45 rounded-lg"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Nasze usługi</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Oferujemy kompleksowe rozwiązania dostosowane do potrzeb każdego klienta
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Elektronika */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <FiCpu className="h-8 w-8 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Elektronika</h3>
                  <p className="text-blue-900">Projektowanie i produkcja</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Specjalizujemy się w projektowaniu i produkcji zaawansowanych sterowników 
                przemysłowych oraz systemów elektronicznych dla biznesu.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-gray-700">
                  <FiCheck className="h-5 w-5 text-blue-900 mr-3" />
                  Kreator sterowników online
                </div>
                <div className="flex items-center text-gray-700">
                  <FiCheck className="h-5 w-5 text-blue-900 mr-3" />
                  Sklep B2B z komponentami
                </div>
                <div className="flex items-center text-gray-700">
                  <FiCheck className="h-5 w-5 text-blue-900 mr-3" />
                  Wsparcie techniczne 24/7
                </div>
              </div>

              <Link
                href="/ai-scanner"
                className="inline-flex items-center px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium transition-all"
              >
                <FiCpu className="h-5 w-5 mr-2" />
                Kreator sterowników
              </Link>
            </div>

            {/* Serwis */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                  <FiTool className="h-8 w-8 text-indigo-900" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Serwis</h3>
                  <p className="text-indigo-900">Naprawa i diagnostyka</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Profesjonalny serwis sprzętu AGD z wykorzystaniem najnowszych technologii 
                diagnostycznych i najwyższej jakości części zamiennych.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-gray-700">
                  <FiCheck className="h-5 w-5 text-indigo-900 mr-3" />
                  Diagnostyka z AI
                </div>
                <div className="flex items-center text-gray-700">
                  <FiCheck className="h-5 w-5 text-indigo-900 mr-3" />
                  Naprawa wszystkich marek
                </div>
                <div className="flex items-center text-gray-700">
                  <FiCheck className="h-5 w-5 text-indigo-900 mr-3" />
                  Gwarancja na naprawy
                </div>
              </div>

              <Link
                href="/rezerwacja"
                className="inline-flex items-center px-6 py-3 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg font-medium transition-all"
              >
                <FiSmartphone className="h-5 w-5 mr-2" />
                Zamów serwis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sekcja "Dlaczego my" */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Dlaczego wybierają nas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShield className="h-8 w-8 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gwarancja jakości</h3>
              <p className="text-gray-600">Wszystkie nasze usługi objęte są pełną gwarancją</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="h-8 w-8 text-indigo-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Doświadczony zespół</h3>
              <p className="text-gray-600">Nasi specjaliści mają ponad 15 lat doświadczenia</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTarget className="h-8 w-8 text-teal-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Precyzja wykonania</h3>
              <p className="text-gray-600">Każdy projekt realizujemy z najwyższą precyzją</p>
            </div>
          </div>
        </div>
      </section>

      {/* Kontakt */}
      <section id="kontakt" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Skontaktuj się z nami</h2>
            <p className="text-xl text-gray-300">Jesteśmy gotowi pomóc w realizacji Twojego projektu</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6">
              <FiPhone className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Telefon</h3>
              <a href="tel:+48123456789" className="text-blue-400 hover:text-blue-300 font-semibold">
                +48 123 456 789
              </a>
            </div>

            <div className="text-center p-6">
              <FiMail className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <a href="mailto:kontakt@technik.pl" className="text-blue-400 hover:text-blue-300 font-semibold">
                kontakt@technik.pl
              </a>
            </div>

            <div className="text-center p-6">
              <FiMapPin className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Adres</h3>
              <p className="text-gray-300">
                ul. Lipowa 17<br />
                39-200 Dębica
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >  
              <FiMail className="h-6 w-6 mr-3" />
              Formularz kontaktowy
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-gray-900 via-slate-900 to-gray-900 border-t border-gray-800 py-8 relative overflow-hidden">
        {/* Subtelne tło footer */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/10 via-transparent to-indigo-950/5"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-500 rounded-xl flex items-center justify-center">
                  <FiZap className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">TECHNIK</div>
                <div className="text-sm text-blue-400">Professional Solutions</div>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              Professional Excellence - Profesjonalne rozwiązania elektroniczne
            </p>
            <div className="text-sm text-gray-500">
              © 2025 TECHNIK. Wszystkie prawa zastrzeżone.
            </div>
          </div>
        </div>
      </footer>

      <LiveChatAI />
      <RoleTester />

      {/* Przełącznik powrotu */}
      <div className="fixed bottom-4 left-4 z-50">
        <Link
          href="/"
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm shadow-lg transition-all"
        >
          🔙 Wersja Oryginalna
        </Link>
      </div>
    </div>
  );
}