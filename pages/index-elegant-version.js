// pages/index-elegant-version.js - Elegancka wersja homepage dla żony :)

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
  FiHeart,
  FiStar,
  FiFeather
} from 'react-icons/fi';

export default function HomeElegant() {
  const router = useRouter();
  const { colors, isDarkMode, mounted } = useTheme();
  const [loading, setLoading] = useState(true);
  const [titleColorIndex, setTitleColorIndex] = useState(0);
  
  // Elegancka paleta - zielono-oliwkowo-niebieska na kremowym tle
  const titleColors = [
    "bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent", // 0 - główny gradient
    "text-emerald-700",   // 1 - ciemny szmaragd
    "text-teal-700",      // 2 - ciemnozielonkawy
    "text-green-700",     // 3 - zielony
    "text-lime-700",      // 4 - limonka
    "text-cyan-700",      // 5 - cyjan
    "text-blue-700",      // 6 - niebieski
    "text-indigo-700",    // 7 - indygo
    "text-slate-700",     // 8 - szary
    "text-stone-700",     // 9 - kamień
    "text-zinc-700",      // 10 - cynk
    "text-olive-700",     // 11 - oliwkowy
    "text-forest-700",    // 12 - leśny
    "bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent", // 13 - szmaragd-niebieski
    "bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent",  // 14 - morski-cyjan
    "bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent", // 15 - zielony-szmaragd
    "bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent", // 16 - limonka-zielony
    "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", // 17 - niebieski-indygo
    "bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent"      // 18 - cyjan-morski
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
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-stone-800">
      {/* Elegancka nawigacja */}
      <nav className="bg-stone-50/95 backdrop-blur-sm border-stone-200 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo z sercem */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <FiZap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-light text-stone-800">TECHNIK</div>
                  <div className="text-xs text-emerald-600 font-light">Electronics & Nature</div>
                </div>
              </div>

              {/* Mobilne kontrolki - eleganckie */}
              <div className="flex md:hidden items-center space-x-1 flex-shrink-0">
                <div className="flex-shrink-0">
                  <ThemeToggle />
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => setTitleColorIndex((prev) => (prev + 1) % titleColors.length)}
                    className={`p-2 rounded-full transition-colors border ${
                      titleColorIndex === 0 
                        ? 'bg-stone-100 text-stone-600 border-emerald-300/30 hover:bg-emerald-50' 
                        : 'bg-emerald-500 text-white border-emerald-500'
                    }`}
                    title={`Kolor ${titleColorIndex + 1}/${titleColors.length} - Kliknij dla następnego`}
                  >
                    <FiFeather className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-emerald-600 font-light whitespace-nowrap">
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
              <Link href="#elektronika" className="text-stone-600 hover:text-emerald-600 transition-colors font-light">
                Elektronika
              </Link>
              <Link href="#serwis" className="text-stone-600 hover:text-teal-600 transition-colors font-light">
                Serwis
              </Link>
              <Link href="#portfolio" className="text-stone-600 hover:text-blue-600 transition-colors font-light">
                Portfolio
              </Link>
              <Link href="#kontakt" className="text-stone-600 hover:text-emerald-600 transition-colors font-light">
                Kontakt
              </Link>
              
              <ThemeToggle />
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTitleColorIndex((prev) => (prev + 1) % titleColors.length)}
                  className={`p-2 rounded-full transition-colors border ${
                    titleColorIndex === 0 
                      ? `${colors.secondary} ${colors.textSecondary} border-rose-400/30 hover:bg-rose-500/10` 
                      : 'bg-rose-500 text-white border-rose-500'
                  }`}
                  title={`Kolor ${titleColorIndex + 1}/${titleColors.length} - Kliknij dla następnego`}
                >
                  <FiFeather className="h-4 w-4" />
                </button>
                <span className={`text-xs ${colors.textTertiary} font-light`}>
                  {titleColorIndex + 1}/{titleColors.length}
                </span>
              </div>
              
              <AccountButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - bardziej elegancki */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Delikatne tło naturalne */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-50/30 to-transparent"></div>
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-200/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-teal-200/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-200/8 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Elegancki nagłówek */}
            <div className="mb-8">
              <FiStar className="h-12 w-12 text-emerald-500 mx-auto mb-6 animate-pulse" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-light mb-8 leading-tight">
              <span className={titleColors[titleColorIndex]}>
                TECHNIK
              </span>
              <br />
              <span className={`text-2xl md:text-3xl ${colors.textSecondary} font-extralight tracking-wide`}>
                Elegance meets Technology
              </span>
            </h1>

            <p className={`text-lg ${colors.textTertiary} mb-12 max-w-2xl mx-auto leading-relaxed font-light`}>
              Połączenie profesjonalizmu z elegancją. Tworzymy rozwiązania elektroniczne 
              z dbałością o każdy detal i estetykę, która zachwyca.
            </p>

            {/* Eleganckie przyciski */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="#elektronika"
                className="group px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-full font-light text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25 text-white"
              >
                <span className="flex items-center gap-3">
                  <FiZap className="h-5 w-5" />
                  Elektronika z Naturą
                  <FiArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              
              <Link
                href="#serwis"
                className="group px-8 py-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 hover:border-emerald-300 rounded-full font-light text-lg transition-all transform hover:scale-105 text-stone-700"
              >
                <span className="flex items-center gap-3">
                  <FiFeather className="h-5 w-5" />
                  Serwis z Elegancją
                  <FiArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Eleganckie statystyki */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-light text-emerald-600 mb-2">
                  {animatedStats.years}+
                </div>
                <div className="text-stone-600 font-light text-sm tracking-wide">
                  Lat Doświadczenia
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-light text-teal-600 mb-2">
                  {animatedStats.projects}+
                </div>
                <div className="text-stone-600 font-light text-sm tracking-wide">
                  Projektów z Naturą
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-light text-blue-600 mb-2">
                  {animatedStats.clients}+
                </div>
                <div className="text-stone-600 font-light text-sm tracking-wide">
                  Szczęśliwych Klientów
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reszta stron - zachowujemy strukturę, ale w eleganckim stylu */}
      {/* ... (dodamy resztę sekcji w podobnym eleganckim stylu) */}

      <LiveChatAI />
      <RoleTester />

      {/* Przełącznik powrotu */}
      <div className="fixed bottom-4 left-4 z-50">
        <Link
          href="/"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-light shadow-lg transition-all"
        >
          🌿 Wersja Oryginalna
        </Link>
      </div>
    </div>
  );
}