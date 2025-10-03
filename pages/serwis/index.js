// pages/serwis/index.js - Lista wszystkich miast obsługiwanych przez serwis

import { useTheme } from '../../utils/ThemeContext';
import { CITY_LIST } from '../../config/cities';
import Link from 'next/link';
import Head from 'next/head';
import ThemeToggle from '../../components/ThemeToggle';
import AccountButton from '../../components/AccountButton';
import LiveChatAI from '../../components/LiveChatAI';
import { 
  FiTool,
  FiMapPin,
  FiPhone,
  FiMail,
  FiSettings
} from 'react-icons/fi';

export default function SerwisIndex() {
  const { colors } = useTheme();

  return (
    <>
      <Head>
        <title>Serwis AGD - Wszystkie Miasta | TECHNIK</title>
        <meta name="description" content="Profesjonalny serwis AGD w Dębicy, Rzeszowie, Tarnowie, Krakowie i Jaśle. Naprawy pralek, lodówek, zmywarek. Szybko, tanio, z gwarancją." />
        <meta name="keywords" content="serwis agd, naprawa pralek, naprawa lodówek, serwis zmywarek, podkarpackie, małopolskie" />
      </Head>

      <div className={`min-h-screen ${colors.primary}`}>
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
                  <div className={`text-xs ${colors.textTertiary} font-medium`}>Serwis AGD • Wszystkie Miasta</div>
                </div>
              </Link>

              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <AccountButton />
                <Link href="/admin" className={`p-2 ${colors.secondary} rounded-lg`}>
                  <FiSettings className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className={`py-20 ${colors.primary}`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6">
                <FiMapPin className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Działamy w całym regionie</span>
              </div>

              <h1 className={`text-5xl md:text-6xl font-bold ${colors.textPrimary} mb-6`}>
                Serwis AGD<br />
                <span className="text-blue-600">w Twoim mieście</span>
              </h1>

              <p className={`text-xl ${colors.textSecondary} mb-8 max-w-3xl mx-auto`}>
                Profesjonalne naprawy sprzętu AGD w wielu miastach w województwach podkarpackim i małopolskim. 
                <strong> Wybierz swoje miasto i zobacz lokalną ofertę!</strong>
              </p>
            </div>

            {/* Lista miast */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {CITY_LIST.map((city) => (
                <Link
                  key={city.id}
                  href={`/serwis/${city.slug}`}
                  className={`group p-8 ${colors.secondary} ${colors.border} border hover:border-blue-600 rounded-xl transition-all hover:shadow-xl cursor-pointer`}
                >
                  {/* Ikona miasta */}
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FiMapPin className="h-8 w-8 text-blue-600" />
                  </div>

                  {/* Nazwa miasta */}
                  <h2 className={`text-2xl font-bold ${colors.textPrimary} mb-2 group-hover:text-blue-600 transition-colors`}>
                    {city.name}
                  </h2>

                  {/* Województwo */}
                  <div className={`text-sm ${colors.textTertiary} mb-4`}>
                    Woj. {city.region}
                  </div>

                  {/* Obszar obsługi */}
                  <p className={`text-sm ${colors.textSecondary} mb-4`}>
                    {city.hero.localText}
                  </p>

                  {/* Kontakt */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FiPhone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">{city.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMail className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-600 font-medium">{city.email}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-blue-600 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                      Zobacz ofertę →
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Dodatkowe info */}
            <div className="mt-16 text-center">
              <div className={`inline-block p-6 ${colors.secondary} rounded-xl ${colors.border} border max-w-2xl`}>
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-3`}>
                  📞 Nie widzisz swojego miasta?
                </h3>
                <p className={colors.textSecondary}>
                  Obsługujemy również miejscowości w promieniu 20-30 km od każdego miasta. 
                  Zadzwoń i zapytaj o możliwość dojazdu!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO: Tekst o obszarze działania */}
        <section className={`py-16 ${colors.secondary}`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 className={`text-3xl font-bold ${colors.textPrimary} mb-6 text-center`}>
              Profesjonalny Serwis AGD w Całym Regionie
            </h2>
            
            <div className={`prose prose-lg ${colors.textSecondary} max-w-none`}>
              <p>
                Firma <strong>TECHNIK Serwis AGD</strong> oferuje kompleksowe usługi naprawy sprzętu AGD 
                w województwach <strong>podkarpackim</strong> i <strong>małopolskim</strong>. 
                Działamy w następujących miastach:
              </p>

              <ul>
                {CITY_LIST.map((city) => (
                  <li key={city.id}>
                    <strong>{city.name}</strong> - {city.hero.localText}
                  </li>
                ))}
              </ul>

              <p>
                Naprawiamy wszystkie typy urządzeń AGD: <strong>pralki</strong>, <strong>lodówki</strong>, 
                <strong> zmywarki</strong>, <strong>piekarniki</strong>, <strong>suszarki</strong>, 
                <strong> mikrofalówki</strong>, <strong>okapy</strong> i <strong>kuchenki</strong>.
              </p>

              <p>
                Oferujemy:
                <ul>
                  <li>✅ Dojazd tego samego dnia lub w 24h</li>
                  <li>✅ Gwarancję do 12 miesięcy na naprawy</li>
                  <li>✅ Oryginalne części zamienne</li>
                  <li>✅ Profesjonalnych, certyfikowanych serwisantów</li>
                  <li>✅ Konkurencyjne ceny</li>
                </ul>
              </p>
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
                Profesjonalny Serwis Sprzętu AGD • Podkarpackie i Małopolskie
              </p>
              <div className={`flex justify-center space-x-6 text-sm ${colors.textTertiary}`}>
                <span>© 2025 TECHNIK Serwis AGD</span>
                <span>•</span>
                <span>Obsługujemy {CITY_LIST.length} miast</span>
              </div>
            </div>
          </div>
        </footer>

        <LiveChatAI />
      </div>
    </>
  );
}
