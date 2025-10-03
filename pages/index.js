// pages/index.js - Nowa profesjonalna homepage firmy elektronicznej

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

export default function Home() {
  const router = useRouter();
  const { colors, isDarkMode, mounted } = useTheme();
  const [loading, setLoading] = useState(true);
  const [titleColorIndex, setTitleColorIndex] = useState(0); // Indeks aktualnego koloru (0 = gradient)
  
  // Paleta 50 różnych kolorów + gradient na początku (dodano 20 odcieni niebieskiego)
  const titleColors = [
    "bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent", // 0 - gradient
    "text-blue-500",     // 1
    "text-red-500",      // 2
    "text-green-500",    // 3
    "text-purple-500",   // 4
    "text-pink-500",     // 5
    "text-indigo-500",   // 6
    "text-yellow-500",   // 7
    "text-orange-500",   // 8
    "text-teal-500",     // 9
    "text-cyan-500",     // 10
    "text-emerald-500",  // 11
    "text-rose-500",     // 12
    "text-violet-500",   // 13
    "text-sky-500",      // 14
    "text-amber-500",    // 15
    "text-lime-500",     // 16
    "text-blue-600",     // 17
    "text-red-600",      // 18
    "text-green-600",    // 19
    "text-purple-600",   // 20
    "text-pink-600",     // 21
    "text-indigo-600",   // 22
    "text-yellow-600",   // 23
    "text-orange-600",   // 24
    "text-teal-600",     // 25
    "text-cyan-600",     // 26
    "text-emerald-600",  // 27
    "text-rose-600",     // 28
    "text-violet-600",   // 29
    "text-sky-600",      // 30
    // 20 dodatkowych odcieni niebieskiego
    "text-blue-50",      // 31 - bardzo jasny niebieski
    "text-blue-100",     // 32
    "text-blue-200",     // 33
    "text-blue-300",     // 34
    "text-blue-400",     // 35
    "text-blue-700",     // 36
    "text-blue-800",     // 37
    "text-blue-900",     // 38
    "text-blue-950",     // 39 - bardzo ciemny niebieski
    "text-sky-50",       // 40
    "text-sky-100",      // 41
    "text-sky-200",      // 42
    "text-sky-300",      // 43
    "text-sky-400",      // 44
    "text-sky-700",      // 45
    "text-sky-800",      // 46
    "text-sky-900",      // 47
    "text-indigo-400",   // 48
    "text-indigo-700",   // 49
    "text-indigo-800"    // 50
  ];
  
  const [animatedStats, setAnimatedStats] = useState({
    years: 0,
    projects: 0,
    clients: 0
  });

  useEffect(() => {
    // Sprawdzenie czy komponent jest gotowy
    if (typeof window !== 'undefined') {
      setLoading(false);
    }

    // Animacja statystyk
    const animateStats = () => {
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;
      
      const targets = { years: 15, projects: 500, clients: 200 };
      let current = { years: 0, projects: 0, clients: 0 };
      
      const increment = {
        years: targets.years / steps,
        projects: targets.projects / steps,
        clients: targets.clients / steps
      };

      const timer = setInterval(() => {
        current.years = Math.min(current.years + increment.years, targets.years);
        current.projects = Math.min(current.projects + increment.projects, targets.projects);
        current.clients = Math.min(current.clients + increment.clients, targets.clients);

        setAnimatedStats({
          years: Math.floor(current.years),
          projects: Math.floor(current.projects),
          clients: Math.floor(current.clients)
        });

        if (current.years >= targets.years && 
            current.projects >= targets.projects && 
            current.clients >= targets.clients) {
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
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.primary} ${colors.textPrimary} transition-colors duration-300`}>
      {/* Professional Navigation */}
      <nav className={`${colors.secondary}/95 backdrop-blur-sm ${colors.border} border-b sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo i Mobile Controls */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <FiZap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className={`text-xl font-bold ${colors.textPrimary}`}>TECHNIK</div>
                  <div className={`text-xs ${colors.textTertiary}`}>ELECTRONICS & SERVICE</div>
                </div>
              </div>

              {/* Mobile Controls - kompaktowe i responsive */}
              <div className="flex md:hidden items-center space-x-1 flex-shrink-0">
                {/* Admin Panel dla mobile */}
                <Link href="/admin" className={`p-2 ${colors.secondary} rounded-lg hover:bg-blue-500/10 transition-colors`} title="Panel Admina">
                  <FiSettings className="h-4 w-4" />
                </Link>
                
                {/* Theme Toggle dla mobile */}
                <div className="flex-shrink-0">
                  <ThemeToggle />
                </div>
                
                {/* Title Color Toggle dla mobile - kompaktowy */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => setTitleColorIndex((prev) => (prev + 1) % titleColors.length)}
                    className={`p-2 rounded-lg transition-colors border ${
                      titleColorIndex === 0 
                        ? `${colors.secondary} ${colors.textSecondary} border-blue-400/30 hover:bg-blue-500/10` 
                        : 'bg-blue-500 text-white border-blue-500'
                    }`}
                    title={`Kolor ${titleColorIndex + 1}/${titleColors.length} - Kliknij dla następnego`}
                  >
                    <FiZap className="h-4 w-4" />
                  </button>
                  <span className={`text-xs ${colors.textTertiary} font-semibold whitespace-nowrap`}>
                    {titleColorIndex + 1}/{titleColors.length}
                  </span>
                </div>
                
                {/* Zunifikowany przycisk Moje Konto dla mobile */}
                <div className="flex-shrink-0">
                  <AccountButton />
                </div>
              </div>
            </div>
            
            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#elektronika" className={`${colors.textSecondary} hover:text-blue-400 transition-colors`}>
                Elektronika
              </Link>
              <Link href="#serwis" className={`${colors.textSecondary} hover:text-blue-400 transition-colors`}>
                Serwis
              </Link>
              <Link href="#portfolio" className={`${colors.textSecondary} hover:text-blue-400 transition-colors`}>
                Portfolio
              </Link>
              <Link href="#kontakt" className={`${colors.textSecondary} hover:text-blue-400 transition-colors`}>
                Kontakt
              </Link>
              <Link href="/admin" className={`${colors.textSecondary} hover:text-blue-400 transition-colors flex items-center space-x-1`}>
                <FiSettings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Title Color Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTitleColorIndex((prev) => (prev + 1) % titleColors.length)}
                  className={`p-2 rounded-lg transition-colors ${
                    titleColorIndex === 0 
                      ? `${colors.secondary} ${colors.textSecondary} hover:bg-blue-500/10` 
                      : 'bg-blue-500 text-white'
                  }`}
                  title={`Kolor ${titleColorIndex + 1}/${titleColors.length} - Kliknij dla następnego`}
                >
                  <FiZap className="h-4 w-4" />
                </button>
                <span className={`text-xs ${colors.textTertiary}`}>
                  {titleColorIndex + 1}/{titleColors.length}
                </span>
              </div>
              
              {/* Zunifikowany przycisk Moje Konto */}
              <AccountButton />
            </div>


          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 ${colors.gradient}`}></div>
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className={titleColors[titleColorIndex]}>
                TECHNIK
              </span>
              <br />
              <span className={`text-3xl md:text-4xl ${colors.textSecondary} font-normal`}>
                Electronics & Service Solutions
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-xl ${colors.textTertiary} mb-12 max-w-3xl mx-auto leading-relaxed`}>
              Profesjonalne rozwiązania elektroniczne i serwisowe dla firm i instytucji. 
              Od projektowania sterowników po kompleksowy serwis urządzeń AGD.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link
                href="#elektronika"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 text-white"
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

              <Link
                href="/cennik"
                className="group px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/25 text-white"
              >
                <span className="flex items-center gap-2">
                  💰 Cennik
                  <FiArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {animatedStats.years}+
                </div>
                <div className={colors.textTertiary}>Lat doświadczenia</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {animatedStats.projects}+
                </div>
                <div className={colors.textTertiary}>Zrealizowanych projektów</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {animatedStats.clients}+
                </div>
                <div className={colors.textTertiary}>Zadowolonych klientów</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Działy Firmy */}
      <section className={`py-24 ${colors.secondary} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${colors.textPrimary} mb-6`}>Nasze Działy</h2>
            <p className={`text-xl ${colors.textTertiary} max-w-3xl mx-auto`}>
              Kompleksowe rozwiązania elektroniczne i serwisowe pod jednym dachem
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* DZIAŁ ELEKTRONIKA */}
            <div id="elektronika" className="group">
              <div className="bg-gradient-to-br from-slate-900 to-blue-900/20 rounded-2xl p-8 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <FiCpu className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">ELEKTRONIKA</h3>
                    <p className="text-blue-400">Projektowanie & Produkcja</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-8 leading-relaxed">
                  Projektujemy i produkujemy sterowniki do maszyn przemysłowych. 
                  Oferujemy kreator sterowników online oraz kompleksowy sklep B2B.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-green-400 mr-3" />
                    Kreator sterowników online
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-green-400 mr-3" />
                    Sklep ze sterownikami B2B
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-green-400 mr-3" />
                    Zapytania ofertowe
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-green-400 mr-3" />
                    Projekty na zamówienie
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/kreator-sterownikow"
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                  >
                    <FiSettings className="h-5 w-5 mr-2" />
                    Kreator Sterowników
                  </Link>
                  <Link
                    href="/sklep-elektronika"
                    className="flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors font-medium"
                  >
                    <FiShoppingBag className="h-5 w-5 mr-2" />
                    Sklep Online
                  </Link>
                </div>
              </div>
            </div>

            {/* DZIAŁ SERWIS */}
            <div id="serwis" className="group">
              <div className="bg-gradient-to-br from-slate-900 to-green-900/20 rounded-2xl p-8 border border-slate-700 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <FiTool className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">SERWIS</h3>
                    <p className="text-green-400">Naprawa & Programowanie</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-8 leading-relaxed">
                  Profesjonalny serwis sprzętu AGD z wykorzystaniem najnowszych technologii AI. 
                  Naprawy chłodziarek, pralek, zmywarek i programowanie urządzeń.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-green-400 mr-3" />
                    Serwis AGD z AI rozpoznawaniem
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-green-400 mr-3" />
                    Naprawy elektroniki
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-green-400 mr-3" />
                    Programowanie urządzeń
                  </div>
                  <div className="flex items-center text-slate-300">
                    <FiCheck className="h-5 w-5 text-green-400 mr-3" />
                    System AI diagnostyki
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/rezerwacja"
                    className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
                  >
                    <FiSmartphone className="h-5 w-5 mr-2" />
                    Zamów Serwis
                  </Link>
                  <Link
                    href="/moje-zamowienie"
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                  >
                    <FiCheck className="h-5 w-5 mr-2" />
                    Sprawdź Status Zamówienia
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

      {/* Portfolio/Certyfikaty */}
      <section id="portfolio" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Nasze Osiągnięcia</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Certyfikaty, nagrody i zaufanie klientów budowane przez lata
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-slate-800 rounded-xl border border-slate-700">
              <FiAward className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Certyfikat ISO 9001</h3>
              <p className="text-slate-400">Gwarancja najwyższej jakości usług</p>
            </div>
            
            <div className="text-center p-8 bg-slate-800 rounded-xl border border-slate-700">
              <FiUsers className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">200+ Firm</h3>
              <p className="text-slate-400">Zaufało naszym rozwiązaniom</p>
            </div>
            
            <div className="text-center p-8 bg-slate-800 rounded-xl border border-slate-700">
              <FiTrendingUp className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">98% Zadowolenia</h3>
              <p className="text-slate-400">Klientów poleca nasze usługi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Kontakt */}
      <section id="kontakt" className="py-24 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Skontaktuj się z nami</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Gotowi na współpracę? Napisz lub zadzwoń - odpowiemy w ciągu 24 godzin
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="text-center p-8 bg-slate-900 rounded-xl">
              <FiPhone className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Telefon</h3>
              <p className="text-slate-400 mb-4">Zadzwoń w godzinach 8:00-18:00</p>
              <a href="tel:+48123456789" className="text-blue-400 hover:text-blue-300 font-semibold">
                +48 123 456 789
              </a>
            </div>

            <div className="text-center p-8 bg-slate-900 rounded-xl">
              <FiMail className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Email</h3>
              <p className="text-slate-400 mb-4">Odpowiadamy w ciągu 24h</p>
              <a href="mailto:kontakt@technik.pl" className="text-purple-400 hover:text-purple-300 font-semibold">
                kontakt@technik.pl
              </a>
            </div>

            <div className="text-center p-8 bg-slate-900 rounded-xl">
              <FiMapPin className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Adres</h3>
              <p className="text-slate-400 mb-4">Siedziba firmy</p>
              <p className="text-green-400 font-semibold">
                ul. Lipowa 17<br />
                39-200 Dębica
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/kontakt"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
            >  
              <FiMail className="h-6 w-6 mr-3" />
              Formularz Kontaktowy
            </Link>
          </div>
        </div>
      </section>

      {/* Sprawdź Status Zamówienia - Sekcja CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <FiCheck className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Masz już zlecenie? Sprawdź jego status!
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Wpisz numer swojego zamówienia (np. <strong>ORDW252750001</strong>) i numer telefonu, 
              aby śledzić postęp realizacji w czasie rzeczywistym.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/moje-zamowienie"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                <FiCheck className="h-5 w-5 mr-2" />
                Sprawdź Status Teraz
              </Link>
              <Link
                href="/rezerwacja"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                <FiSmartphone className="h-5 w-5 mr-2" />
                Złóż Nowe Zamówienie
              </Link>
            </div>
            <div className="mt-6 text-sm text-white/80">
              <p>💡 <strong>Wskazówka:</strong> Numer zamówienia znajdziesz w emailu potwierdzającym lub SMS-ie</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <FiZap className="h-5 w-5 text-white" />
              </div>
              <div className="text-xl font-bold text-white">TECHNIK</div>
            </div>
            <p className="text-slate-400 mb-6">
              Electronics & Service Solutions - Profesjonalne rozwiązania elektroniczne
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

      {/* Live Chat AI */}
      <LiveChatAI />

      {/* Role Tester - tylko w trybie development */}
      <RoleTester />

      {/* Przełącznik wszystkich wersji homepage */}  
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-h-96 overflow-y-auto">
        <div className="text-xs text-gray-600 font-medium mb-1 px-2">🏠 Wybierz Wersję:</div>
        
        <Link
          href="/index-serwis-agd"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm shadow-lg transition-all font-medium animate-pulse"
        >
          🔧 SERWIS AGD (NOWA!)
        </Link>
        
        <Link
          href="/"
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg text-sm shadow-lg transition-all font-medium"
        >
          🎨 Oryginalna (51 kolorów)
        </Link>
        
        <Link
          href="/index-clean-modern"
          className="px-4 py-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white rounded-lg text-sm shadow-lg transition-all font-medium"
        >
          🧘 Clean Modern
        </Link>
        
        <Link
          href="/index-modern-minimal"
          className="px-4 py-2 bg-white hover:bg-gray-50 text-blue-900 border-2 border-blue-900 rounded-lg text-sm shadow-lg transition-all font-medium"
        >
          ✨ Minimalistyczna
        </Link>
        
        <Link
          href="/index-elegant-version"
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-sm shadow-lg transition-all font-medium"
        >
          🍃 Elegancka (kremowa)
        </Link>
        
        <Link
          href="/index-professional-subtle"
          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm shadow-lg transition-all font-medium"
        >
          💼 Profesjonalna
        </Link>
        
        <Link
          href="/index-futuristic-2026"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white rounded-lg text-sm shadow-lg transition-all font-medium animate-pulse"
        >
          � Futurystyczna 2026
        </Link>
      </div>
    </div>
  );
}