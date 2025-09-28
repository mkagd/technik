// pages/index-professional-subtle.js - Profesjonalna i stonowana wersja

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
  FiCheck
} from 'react-icons/fi';

export default function HomeProfessionalSubtle() {
  const router = useRouter();
  const { colors, isDarkMode, mounted } = useTheme();
  const [loading, setLoading] = useState(true);
  const [titleColorIndex, setTitleColorIndex] = useState(0);
  
  // Stonowana paleta kolorów - profesjonalna ale subtelna
  const titleColors = [
    "bg-gradient-to-r from-slate-600 via-gray-500 to-slate-700 bg-clip-text text-transparent", // 0 - stonowany gradient
    "text-slate-600",     // 1 - ciemny szary
    "text-gray-600",      // 2 - szary
    "text-zinc-600",      // 3 - cynk
    "text-stone-600",     // 4 - kamień
    "text-neutral-600",   // 5 - neutralny
    "text-blue-600",      // 6 - profesjonalny niebieski
    "text-indigo-600",    // 7 - indygo
    "text-teal-600",      // 8 - morski
    "text-emerald-600",   // 9 - szmaragd
    "text-green-600",     // 10 - zielony
    "text-slate-700",     // 11 - ciemniejszy szary
    "text-gray-700",      // 12 - ciemny szary
    "text-zinc-700",      // 13 - ciemny cynk
    "text-blue-700",      // 14 - ciemny niebieski
    "text-indigo-700",    // 15 - ciemny indygo
    "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",   // 16 - niebieski gradient
    "bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent",    // 17 - szary gradient
    "bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent",     // 18 - morski gradient
    "bg-gradient-to-r from-indigo-600 to-slate-600 bg-clip-text text-transparent",  // 19 - indygo gradient
    "bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"   // 20 - zielony gradient
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
    return () => clearTimeout(timeout);
  }, []);

  if (loading || !mounted) {
    return (
      <div className={`min-h-screen ${colors.primary} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-400"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.primary} ${colors.textPrimary} transition-colors duration-300`}>
      {/* Stonowana nawigacja */}
      <nav className={`${colors.secondary}/95 backdrop-blur-sm ${colors.border} border-b sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo - minimalistyczne */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <FiZap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className={`text-xl font-semibold ${colors.textPrimary}`}>TECHNIK</div>
                  <div className={`text-xs ${colors.textTertiary}`}>Professional Solutions</div>
                </div>
              </div>

              {/* Mobilne kontrolki */}
              <div className="flex md:hidden items-center space-x-1 flex-shrink-0">
                <div className="flex-shrink-0">
                  <ThemeToggle />
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => setTitleColorIndex((prev) => (prev + 1) % titleColors.length)}
                    className={`p-2 rounded-lg transition-colors border ${
                      titleColorIndex === 0 
                        ? `${colors.secondary} ${colors.textSecondary} border-slate-400/30 hover:bg-slate-500/10` 
                        : 'bg-slate-500 text-white border-slate-500'
                    }`}
                    title={`Kolor ${titleColorIndex + 1}/${titleColors.length} - Kliknij dla następnego`}
                  >
                    <FiZap className="h-4 w-4" />
                  </button>
                  <span className={`text-xs ${colors.textTertiary} font-medium whitespace-nowrap`}>
                    {titleColorIndex + 1}/{titleColors.length}
                  </span>
                </div>
                
                <div className="flex-shrink-0">
                  <AccountButton />
                </div>
              </div>
            </div>
            
            {/* Desktopowe menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#elektronika" className={`${colors.textSecondary} hover:text-slate-600 transition-colors`}>
                Elektronika
              </Link>
              <Link href="#serwis" className={`${colors.textSecondary} hover:text-slate-600 transition-colors`}>
                Serwis
              </Link>
              <Link href="#portfolio" className={`${colors.textSecondary} hover:text-slate-600 transition-colors`}>
                Portfolio
              </Link>
              <Link href="#kontakt" className={`${colors.textSecondary} hover:text-slate-600 transition-colors`}>
                Kontakt
              </Link>
              
              <ThemeToggle />
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTitleColorIndex((prev) => (prev + 1) % titleColors.length)}
                  className={`p-2 rounded-lg transition-colors border ${
                    titleColorIndex === 0 
                      ? `${colors.secondary} ${colors.textSecondary} border-slate-400/30 hover:bg-slate-500/10` 
                      : 'bg-slate-500 text-white border-slate-500'
                  }`}
                  title={`Kolor ${titleColorIndex + 1}/${titleColors.length} - Kliknij dla następnego`}
                >
                  <FiZap className="h-4 w-4" />
                </button>
                <span className={`text-xs ${colors.textTertiary}`}>
                  {titleColorIndex + 1}/{titleColors.length}
                </span>
              </div>
              
              <AccountButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - stonowany ale profesjonalny */}
      <section className="relative overflow-hidden">
        {/* Subtelne tło */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 ${colors.gradient}`}></div>
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-slate-500/8 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-500/8 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Profesjonalny nagłówek */}
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className={titleColors[titleColorIndex]}>
                TECHNIK
              </span>
              <br />
              <span className={`text-3xl md:text-4xl ${colors.textSecondary} font-normal`}>
                Professional Electronics Solutions
              </span>
            </h1>

            <p className={`text-xl ${colors.textTertiary} mb-12 max-w-3xl mx-auto leading-relaxed`}>
              Dostarczamy profesjonalne rozwiązania elektroniczne i serwisowe 
              z dbałością o najwyższą jakość i niezawodność.
            </p>

            {/* Profesjonalne przyciski */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link
                href="#elektronika"
                className="group px-8 py-4 bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-slate-500/25 text-white"
              >
                <span className="flex items-center gap-3">
                  <FiCpu className="h-6 w-6" />
                  Dział Elektronika
                  <FiArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              
              <Link
                href="#serwis"
                className={`group px-8 py-4 ${colors.secondary} hover:${colors.cardHover} ${colors.border} border hover:${colors.borderHover} rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${colors.textPrimary}`}
              >
                <span className="flex items-center gap-3">
                  <FiTool className="h-6 w-6" />
                  Dział Serwis
                  <FiArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Profesjonalne statystyki */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-600 mb-2">
                  {animatedStats.years}+
                </div>
                <div className={colors.textTertiary}>Lat doświadczenia</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-600 mb-2">
                  {animatedStats.projects}+
                </div>
                <div className={colors.textTertiary}>Zrealizowanych projektów</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {animatedStats.clients}+
                </div>
                <div className={colors.textTertiary}>Zadowolonych klientów</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Działy Firmy - zachowujemy oryginalną strukturę */}
      <section className={`py-24 ${colors.secondary} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${colors.textPrimary} mb-6`}>Nasze Działy</h2>
            <p className={`text-xl ${colors.textTertiary} max-w-3xl mx-auto`}>
              Kompleksowe rozwiązania elektroniczne i serwisowe z profesjonalnym podejściem
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* DZIAŁ ELEKTRONIKA */}
            <div id="elektronika" className="group">
              <div className="bg-gradient-to-br from-slate-900 to-gray-900/20 rounded-2xl p-8 border border-slate-700 hover:border-slate-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-slate-500/10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center mr-4">
                    <FiCpu className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">ELEKTRONIKA</h3>
                    <p className="text-slate-400">Projektowanie & Produkcja</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-8 leading-relaxed">
                  Profesjonalne projektowanie i produkcja sterowników przemysłowych. 
                  Oferujemy zaawansowane rozwiązania B2B dla firm i instytucji.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-slate-400 mr-3" />
                    Kreator sterowników online
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-slate-400 mr-3" />
                    Sklep ze sterownikami B2B
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-slate-400 mr-3" />
                    Zapytania ofertowe
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-slate-400 mr-3" />
                    Wsparcie techniczne
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/ai-scanner"
                    className="flex items-center justify-center px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors font-medium"
                  >
                    <FiCpu className="h-5 w-5 mr-2" />
                    Kreator Sterowników
                  </Link>
                  <Link
                    href="/sklep-b2b"
                    className="flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors font-medium"
                  >
                    <FiShoppingBag className="h-5 w-5 mr-2" />
                    Sklep B2B
                  </Link>
                </div>
              </div>
            </div>

            {/* DZIAŁ SERWIS */}
            <div id="serwis" className="group">
              <div className="bg-gradient-to-br from-gray-900 to-slate-900/20 rounded-2xl p-8 border border-gray-700 hover:border-gray-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-gray-500/10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl flex items-center justify-center mr-4">
                    <FiTool className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">SERWIS</h3>
                    <p className="text-gray-400">Naprawa & Diagnostyka</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-8 leading-relaxed">
                  Profesjonalny serwis sprzętu AGD z wykorzystaniem nowoczesnych technologii. 
                  Kompleksowa diagnostyka i naprawa urządzeń.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-gray-400 mr-3" />
                    Serwis AGD z diagnostyką
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-gray-400 mr-3" />
                    Naprawy elektroniki
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-gray-400 mr-3" />
                    Programowanie urządzeń
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-gray-400 mr-3" />
                    Wsparcie techniczne
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/rezerwacja"
                    className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors font-medium"
                  >
                    <FiSmartphone className="h-5 w-5 mr-2" />
                    Zamów Serwis
                  </Link>
                  <Link
                    href="/pracownik-logowanie"
                    className="flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors font-medium"
                  >
                    <FiMonitor className="h-5 w-5 mr-2" />
                    Panel Serwisanta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kontakt - zachowujemy oryginalną sekcję */}
      <section id="kontakt" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Kontakt</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Skontaktuj się z nami, aby omówić Twoje potrzeby
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-8 bg-slate-800 rounded-xl">
              <FiPhone className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Telefon</h3>
              <p className="text-slate-400 mb-4">Zadzwoń w godzinach pracy</p>
              <a href="tel:+48123456789" className="text-slate-400 hover:text-slate-300 font-semibold">
                +48 123 456 789
              </a>
            </div>

            <div className="text-center p-8 bg-slate-800 rounded-xl">
              <FiMail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Email</h3>
              <p className="text-slate-400 mb-4">Odpowiadamy w ciągu 24h</p>
              <a href="mailto:kontakt@technik.pl" className="text-slate-400 hover:text-slate-300 font-semibold">
                kontakt@technik.pl
              </a>
            </div>

            <div className="text-center p-8 bg-slate-800 rounded-xl">
              <FiMapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Adres</h3>
              <p className="text-slate-400 mb-4">Siedziba firmy</p>
              <p className="text-slate-400 font-semibold">
                ul. Lipowa 17<br />
                39-200 Dębica
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
            >  
              <FiMail className="h-6 w-6 mr-3" />
              Formularz Kontaktowy
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
                <FiZap className="h-5 w-5 text-white" />
              </div>
              <div className="text-xl font-bold text-white">TECHNIK</div>
            </div>
            <p className="text-slate-400 mb-6">
              Professional Electronics Solutions - Profesjonalne rozwiązania elektroniczne
            </p>
            <div className="flex justify-center space-x-8 text-sm text-slate-500">
              <span>© 2025 TECHNIK</span>
              <span>•</span>
              <span>Wszystkie prawa zastrzeżone</span>
              <span>•</span>
              <span>Polityka prywatności</span>
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
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm shadow-lg transition-all"
        >
          🔙 Wersja Oryginalna
        </Link>
      </div>
    </div>
  );
}