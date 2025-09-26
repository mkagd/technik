// pages/index.js - Nowa profesjonalna homepage firmy elektronicznej

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({
    years: 0,
    projects: 0,
    clients: 0
  });

  useEffect(() => {
    // Sprawdzenie użytkownika
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberUser');
      setCurrentUser(null);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Professional Navigation */}
      <nav className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <FiZap className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">TECHNIK</div>
                <div className="text-xs text-slate-400">ELECTRONICS & SERVICE</div>
              </div>
            </div>
            
            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#elektronika" className="text-slate-300 hover:text-blue-400 transition-colors">
                Elektronika
              </Link>
              <Link href="#serwis" className="text-slate-300 hover:text-blue-400 transition-colors">
                Serwis
              </Link>
              <Link href="#portfolio" className="text-slate-300 hover:text-blue-400 transition-colors">
                Portfolio
              </Link>
              <Link href="#kontakt" className="text-slate-300 hover:text-blue-400 transition-colors">
                Kontakt
              </Link>
              
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-400">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                  >
                    Wyloguj
                  </button>
                </div>
              ) : (
                <Link
                  href="/logowanie"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  Logowanie
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20"></div>
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                TECHNIK
              </span>
              <br />
              <span className="text-3xl md:text-4xl text-slate-300 font-normal">
                Electronics & Service Solutions
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Profesjonalne rozwiązania elektroniczne i serwisowe dla firm i instytucji. 
              Od projektowania sterowników po kompleksowy serwis urządzeń AGD.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link
                href="#elektronika"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                <span className="flex items-center gap-3">
                  <FiCpu className="h-6 w-6" />
                  Dział Elektronika
                  <FiArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              
              <Link
                href="#serwis"
                className="group px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <FiTool className="h-6 w-6" />
                  Dział Serwis
                  <FiArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {animatedStats.years}+
                </div>
                <div className="text-slate-400">Lat doświadczenia</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {animatedStats.projects}+
                </div>
                <div className="text-slate-400">Zrealizowanych projektów</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {animatedStats.clients}+
                </div>
                <div className="text-slate-400">Zadowolonych klientów</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Działy Firmy */}
      <section className="py-24 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Nasze Działy</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
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
                ul. Elektroniczna 1<br />
                35-123 Rzeszów
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
    </div>
  );
}