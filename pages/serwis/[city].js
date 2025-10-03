// pages/serwis/[city].js - Dynamiczne landing pages dla każdego miasta

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../../utils/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import LiveChatAI from '../../components/LiveChatAI';
import AccountButton from '../../components/AccountButton';
import { getCityBySlug, getAllCitySlugs, CITY_LIST } from '../../config/cities';
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

// Ikony AGD (takie same jak w index-serwis-agd.js)
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

export default function CityPage({ city }) {
  const router = useRouter();
  const { colors, isDarkMode, mounted } = useTheme();
  const [loading, setLoading] = useState(true);
  
  const [animatedStats, setAnimatedStats] = useState({
    years: 0,
    repairs: 0,
    clients: 0,
    rating: 0
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoading(false);
    }

    // Animacja statystyk
    const animateStats = () => {
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;
      
      const targets = { years: 15, repairs: 2500, clients: 850, rating: 4.9 };
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

  return (
    <>
      <Head>
        <title>{city.metaTitle}</title>
        <meta name="description" content={city.metaDescription} />
        <meta name="keywords" content={city.metaKeywords} />
        
        {/* Local Business Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": `TECHNIK Serwis AGD ${city.name}`,
              "image": "https://technik-serwis.pl/logo.png",
              "telephone": city.phone,
              "email": city.email,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": city.address.street,
                "addressLocality": city.address.city,
                "postalCode": city.address.postalCode,
                "addressCountry": "PL"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": city.address.coords.lat,
                "longitude": city.address.coords.lng
              },
              "url": `https://technik-serwis.pl/serwis/${city.slug}`,
              "priceRange": "$$",
              "areaServed": {
                "@type": "City",
                "name": city.name
              }
            })
          }}
        />
      </Head>

      <div className={`min-h-screen ${colors.primary} transition-colors duration-300`}>
        {/* Navigation */}
        <nav className={`${colors.secondary}/95 backdrop-blur-sm ${colors.border} border-b sticky top-0 z-50`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center space-x-3 cursor-pointer">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FiTool className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colors.textPrimary}`}>TECHNIK</div>
                  <div className={`text-xs ${colors.textTertiary} font-medium`}>Serwis AGD • {city.name}</div>
                </div>
              </Link>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-6">
                <Link href="#uslugi" className={`${colors.textSecondary} hover:text-blue-600 transition-colors font-medium`}>
                  Usługi
                </Link>
                <Link href="#cennik" className={`${colors.textSecondary} hover:text-blue-600 transition-colors font-medium`}>
                  Cennik
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

        {/* Hero Section */}
        <section className={`relative overflow-hidden ${colors.primary}`}>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6">
                <FiMapPin className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{city.hero.localText}</span>
              </div>

              <h1 className={`text-5xl md:text-6xl font-bold ${colors.textPrimary} mb-6`}>
                {city.hero.title}<br />
                <span className="text-blue-600">Naprawy AGD</span>
              </h1>

              <p className={`text-xl ${colors.textSecondary} mb-8 max-w-2xl mx-auto`}>
                {city.hero.subtitle}<br />
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

              {/* Kontakt lokalny */}
              <div className={`inline-flex items-center gap-6 px-6 py-4 ${colors.secondary} ${colors.border} border rounded-xl`}>
                <a href={`tel:${city.phone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
                  <FiPhone className="h-5 w-5" />
                  <span>{city.phone}</span>
                </a>
                <div className={`w-px h-6 ${colors.border} border-l`}></div>
                <div className={`flex items-center gap-2 ${colors.textTertiary}`}>
                  <FiClock className="h-5 w-5" />
                  <span className="text-sm">Pn-Pt: 8:00-18:00</span>
                </div>
              </div>
            </div>

            {/* Statystyki */}
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

        {/* Reszta contentu taka sama jak w index-serwis-agd.js */}
        {/* (dla zwięzłości pomijam - możesz skopiować sekcje: Co naprawiamy, Jak działamy, etc.) */}

        {/* Kontakt - z danymi dla konkretnego miasta */}
        <section id="kontakt" className={`py-20 ${colors.secondary}`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-4xl font-bold ${colors.textPrimary} mb-4`}>Skontaktuj się z nami w {city.name}</h2>
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
                <a href={`tel:${city.phone}`} className="text-blue-600 hover:text-blue-700 font-semibold text-lg">
                  {city.phone}
                </a>
              </div>

              <div className={`text-center p-8 ${colors.primary} rounded-xl`}>
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMail className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>Email</h3>
                <p className={`${colors.textTertiary} mb-4`}>Odpowiadamy w 24h</p>
                <a href={`mailto:${city.email}`} className="text-purple-600 hover:text-purple-700 font-semibold text-lg">
                  {city.email}
                </a>
              </div>

              <div className={`text-center p-8 ${colors.primary} rounded-xl`}>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMapPin className="h-8 w-8 text-green-600" />
                </div>
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>Adres</h3>
                <p className={`${colors.textTertiary} mb-4`}>Punkt serwisowy</p>
                <p className="text-green-600 font-semibold">
                  {city.address.street}<br />
                  {city.address.postalCode} {city.address.city}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO: Inne miasta */}
        <section className={`py-16 ${colors.primary}`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-4`}>
                Obsługujemy również inne miasta
              </h3>
              <p className={colors.textSecondary}>
                Sprawdź naszą ofertę w innych lokalizacjach
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {CITY_LIST.filter(c => c.id !== city.id).map((otherCity) => (
                <Link
                  key={otherCity.id}
                  href={`/serwis/${otherCity.slug}`}
                  className={`p-4 ${colors.secondary} ${colors.border} border hover:border-blue-600 rounded-lg text-center transition-all hover:shadow-lg`}
                >
                  <FiMapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className={`font-semibold ${colors.textPrimary}`}>{otherCity.name}</div>
                </Link>
              ))}
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
                Profesjonalny Serwis Sprzętu AGD • {city.name}
              </p>
              <div className={`flex justify-center space-x-6 text-sm ${colors.textTertiary}`}>
                <span>© 2025 TECHNIK Serwis AGD</span>
                <span>•</span>
                <span>{city.address.street}, {city.address.postalCode} {city.address.city}</span>
                <span>•</span>
                <span>{city.phone}</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Live Chat AI */}
        <LiveChatAI />
      </div>
    </>
  );
}

// Next.js: Wygeneruj statyczne ścieżki dla wszystkich miast
export async function getStaticPaths() {
  const paths = getAllCitySlugs().map(slug => ({
    params: { city: slug }
  }));

  return {
    paths,
    fallback: false // 404 dla nieistniejących miast
  };
}

// Next.js: Pobierz dane dla konkretnego miasta
export async function getStaticProps({ params }) {
  const city = getCityBySlug(params.city);

  return {
    props: {
      city
    }
  };
}
