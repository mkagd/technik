import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ThemeToggle from '../components/ThemeToggle';
import AccountButton from '../components/AccountButton';
import LiveChatAI from '../components/LiveChatAI';

export default function CleanModernHomepage() {
  const router = useRouter();
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Spokojne, eleganckie kolory - bez przesady
  const cleanColors = [
    // Klasyczny niebieski
    { bg: 'from-slate-50 to-blue-50', text: 'from-slate-700 to-blue-700', accent: 'from-blue-500 to-blue-600', card: 'bg-white/70' },
    // Elegancka szarość
    { bg: 'from-gray-50 to-slate-100', text: 'from-gray-700 to-slate-700', accent: 'from-slate-500 to-slate-600', card: 'bg-white/80' },
    // Spokojny zielony
    { bg: 'from-emerald-50 to-green-50', text: 'from-emerald-700 to-green-700', accent: 'from-emerald-500 to-green-600', card: 'bg-white/70' },
    // Delikatny fiolet
    { bg: 'from-violet-50 to-purple-50', text: 'from-violet-700 to-purple-700', accent: 'from-violet-500 to-purple-600', card: 'bg-white/70' },
    // Ciepły pomarańczowy
    { bg: 'from-orange-50 to-amber-50', text: 'from-orange-700 to-amber-700', accent: 'from-orange-500 to-amber-600', card: 'bg-white/70' },
    // Profesjonalny indygo
    { bg: 'from-indigo-50 to-blue-50', text: 'from-indigo-700 to-blue-700', accent: 'from-indigo-500 to-blue-600', card: 'bg-white/70' },
  ];

  const currentTheme = cleanColors[currentColorIndex];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleQuickOrder = () => {
    router.push('/zlecenie-ekspresowe');
  };

  const nextColor = () => {
    setCurrentColorIndex((prev) => (prev + 1) % cleanColors.length);
  };

  return (
    <>
      <Head>
        <title>Serwis Technik - Profesjonalne Naprawy</title>
        <meta name="description" content="Profesjonalny serwis elektroniczny - naprawy, konserwacja, doradztwo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} transition-all duration-700`}>
        
        {/* Subtelne tło - tylko delikatne kształty */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-green-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 flex justify-between items-center p-6 backdrop-blur-sm bg-white/10 border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 bg-gradient-to-r ${currentTheme.accent} rounded-lg flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className={`text-xl font-bold bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent`}>
              Serwis Technik
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={nextColor}
              className={`px-4 py-2 bg-gradient-to-r ${currentTheme.accent} text-white rounded-lg hover:shadow-lg transition-all duration-300`}
            >
              🎨 Zmień Motyw
            </button>
            <ThemeToggle />
            <AccountButton />
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            
            {/* Main Title - spokojniejszy */}
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent leading-tight`}>
              Profesjonalne
              <br />
              <span className="text-4xl md:text-6xl font-light">Naprawy</span>
            </h1>

            {/* Subtitle */}
            <p className={`text-lg md:text-xl mb-12 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent font-medium max-w-3xl mx-auto leading-relaxed opacity-80`}>
              Nowoczesny serwis elektroniczny z wieloletnim doświadczeniem. 
              Specjalizujemy się w naprawach AGD, RTV i elektroniki użytkowej.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={handleQuickOrder}
                className={`px-8 py-4 bg-gradient-to-r ${currentTheme.accent} text-white rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg`}
              >
                🚀 Szybkie Zlecenie
              </button>

              <Link href="/zlecenie" className={`px-8 py-4 border-2 border-current bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent font-semibold text-lg rounded-xl hover:scale-105 transition-all duration-300`}>
                📋 Standardowe Zlecenie
              </Link>
            </div>

            {/* Features Grid - czytelniejsze */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: '🔧',
                  title: 'Doświadczenie',
                  desc: 'Wieloletnie doświadczenie w naprawach elektroniki'
                },
                {
                  icon: '⚡',
                  title: 'Szybkość',
                  desc: 'Ekspresowe naprawy i profesjonalna diagnostyka'
                },
                {
                  icon: '✅',
                  title: 'Gwarancja',
                  desc: 'Pełna gwarancja na wykonane usługi'
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`p-8 ${currentTheme.card} backdrop-blur-sm border border-white/20 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                >
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent`}>
                    {feature.title}
                  </h3>
                  <p className={`bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent opacity-70`}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats Section - prostsze */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {[
                { number: '500+', label: 'Napraw miesięcznie' },
                { number: '98%', label: 'Zadowolonych klientów' },
                { number: '24h', label: 'Średni czas naprawy' },
                { number: '2 lata', label: 'Gwarancja' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent mb-2`}>
                    {stat.number}
                  </div>
                  <div className={`text-sm bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent opacity-60`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {[
                { icon: '📺', title: 'Serwis RTV', desc: 'Telewizory, odtwarzacze, systemy audio' },
                { icon: '🏠', title: 'Serwis AGD', desc: 'Pralki, lodówki, zmywarki, piekarniki' },
                { icon: '💻', title: 'Elektronika', desc: 'Laptopy, komputery, telefony' },
                { icon: '🔌', title: 'Instalacje', desc: 'Instalacje elektryczne i satelitarne' },
                { icon: '🛠️', title: 'Konserwacja', desc: 'Przeglądy i konserwacja urządzeń' },
                { icon: '📞', title: 'Doradztwo', desc: 'Profesjonalne doradztwo techniczne' }
              ].map((service, index) => (
                <div
                  key={index}
                  className={`p-6 ${currentTheme.card} backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300`}
                >
                  <div className="text-2xl mb-3">{service.icon}</div>
                  <h4 className={`font-semibold mb-2 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent`}>
                    {service.title}
                  </h4>
                  <p className={`text-sm bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent opacity-70`}>
                    {service.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom CTA - eleganckie */}
            <div className={`p-8 ${currentTheme.card} backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl`}>
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent`}>
                Potrzebujesz pomocy?
              </h2>
              <p className={`text-lg mb-6 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent opacity-80`}>
                Skontaktuj się z nami już dziś i umów wizytę serwisową
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleQuickOrder}
                  className={`px-8 py-3 bg-gradient-to-r ${currentTheme.accent} text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg`}
                >
                  Umów Wizytę
                </button>
                <Link href="/kontakt" className={`px-8 py-3 border-2 border-current bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent font-semibold rounded-xl hover:scale-105 transition-all duration-300`}>
                  Kontakt
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Live Chat AI */}
        <LiveChatAI />
      </div>
    </>
  );
}