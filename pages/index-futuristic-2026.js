import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ThemeToggle from '../components/ThemeToggle';
import AccountButton from '../components/AccountButton';
import LiveChatAI from '../components/LiveChatAI';

export default function FuturisticHomepage() {
  const router = useRouter();
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Ultra-futuristic color palettes for 2026
  const futuristicColors = [
    // Neon Cyber
    { bg: 'from-purple-900/20 via-black to-cyan-900/20', text: 'from-cyan-400 via-purple-400 to-pink-400', accent: 'from-cyan-500 to-purple-500' },
    // Neural Network
    { bg: 'from-indigo-950/30 via-slate-900/50 to-violet-950/30', text: 'from-blue-300 via-indigo-300 to-violet-300', accent: 'from-blue-400 to-violet-400' },
    // Quantum Glow
    { bg: 'from-emerald-950/20 via-black to-teal-950/20', text: 'from-emerald-300 via-teal-300 to-cyan-300', accent: 'from-emerald-400 to-teal-400' },
    // Holographic
    { bg: 'from-pink-950/20 via-purple-950/30 to-blue-950/20', text: 'from-pink-300 via-purple-300 to-blue-300', accent: 'from-pink-500 to-blue-500' },
    // Plasma Energy
    { bg: 'from-orange-950/20 via-red-950/30 to-pink-950/20', text: 'from-orange-300 via-red-300 to-pink-300', accent: 'from-orange-500 to-pink-500' },
    // Digital Dawn
    { bg: 'from-yellow-950/10 via-orange-950/20 to-red-950/10', text: 'from-yellow-300 via-orange-300 to-red-300', accent: 'from-yellow-400 to-red-400' },
    // Arctic Neon
    { bg: 'from-blue-950/20 via-slate-900/40 to-cyan-950/20', text: 'from-blue-200 via-cyan-200 to-white', accent: 'from-blue-400 to-cyan-400' },
    // Matrix Green
    { bg: 'from-green-950/20 via-black to-emerald-950/20', text: 'from-green-300 via-emerald-300 to-lime-300', accent: 'from-green-500 to-lime-500' },
    // Cosmic Purple
    { bg: 'from-purple-950/20 via-indigo-950/30 to-violet-950/20', text: 'from-purple-300 via-indigo-300 to-violet-300', accent: 'from-purple-500 to-violet-500' },
    // Chrome Silver
    { bg: 'from-gray-950/30 via-slate-900/50 to-zinc-950/30', text: 'from-gray-200 via-white to-slate-200', accent: 'from-gray-400 to-slate-400' },
  ];

  const currentTheme = futuristicColors[currentColorIndex];

  useEffect(() => {
    setIsVisible(true);
    
    // Auto color cycling every 4 seconds
    const colorInterval = setInterval(() => {
      setCurrentColorIndex((prev) => (prev + 1) % futuristicColors.length);
    }, 4000);

    // Mouse tracking for interactive effects
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Scroll tracking for parallax
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(colorInterval);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleQuickOrder = () => {
    router.push('/zlecenie-ekspresowe');
  };

  return (
    <>
      <Head>
        <title>Serwis Technik 2026 - Przyszłość Napraw</title>
        <meta name="description" content="Najnowocześniejszy serwis elektroniczny w 2026 roku" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} relative overflow-hidden transition-all duration-1000`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-gradient-to-r ${currentTheme.accent} rounded-full opacity-60 animate-pulse`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}

          {/* Neural Network Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.8" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {[...Array(8)].map((_, i) => (
              <line
                key={i}
                x1={`${Math.random() * 100}%`}
                y1={`${Math.random() * 100}%`}
                x2={`${Math.random() * 100}%`}
                y2={`${Math.random() * 100}%`}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                className="animate-pulse"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
            ))}
          </svg>

          {/* Interactive Cursor Glow */}
          <div
            className={`absolute w-96 h-96 bg-gradient-radial ${currentTheme.accent} opacity-20 blur-3xl pointer-events-none transition-all duration-300`}
            style={{
              left: mousePosition.x - 192,
              top: mousePosition.y - 192,
              transform: `translate3d(0, ${scrollY * 0.1}px, 0)`,
            }}
          />
        </div>

        {/* Navigation */}
        <nav className="relative z-50 flex justify-between items-center p-6 backdrop-blur-xl bg-black/10 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 bg-gradient-to-r ${currentTheme.accent} rounded-lg flex items-center justify-center shadow-lg shadow-current/25`}>
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className={`text-xl font-bold bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent`}>
              Serwis Technik 2026
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentColorIndex((prev) => (prev + 1) % futuristicColors.length)}
              className={`px-4 py-2 bg-gradient-to-r ${currentTheme.accent} text-white rounded-full hover:shadow-lg hover:shadow-current/25 transition-all duration-300 backdrop-blur-sm`}
            >
              🎨 Zmień Motyw
            </button>
            <ThemeToggle />
            <AccountButton />
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            
            {/* Main Title */}
            <h1 className={`text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent leading-tight drop-shadow-2xl`}>
              PRZYSZŁOŚĆ
              <br />
              <span className="text-5xl md:text-7xl">NAPRAW</span>
            </h1>

            {/* Subtitle with Glow Effect */}
            <p className={`text-xl md:text-2xl mb-12 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent font-medium max-w-4xl mx-auto leading-relaxed`}>
              Witaj w 2026 roku! Korzystamy z najnowszych technologii AI, diagnostyki kwantowej 
              i napraw w rzeczywistości rozszerzonej. Twoje urządzenia zasługują na przyszłość.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={handleQuickOrder}
                className={`group px-8 py-4 bg-gradient-to-r ${currentTheme.accent} text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-300 shadow-2xl shadow-current/25 backdrop-blur-sm border border-white/20`}
              >
                <span className="flex items-center space-x-3">
                  <span>🚀 Ekspresowa Naprawa</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </button>

              <Link href="/zlecenie" className={`px-8 py-4 border-2 border-current bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent font-bold text-lg rounded-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm hover:shadow-lg`}>
                📱 Standardowe Zlecenie
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: '🤖',
                  title: 'AI Diagnostyka',
                  desc: 'Sztuczna inteligencja wykrywa problemy w sekundach'
                },
                {
                  icon: '⚡',
                  title: 'Quantum Speed',
                  desc: 'Naprawy w czasie rzeczywistym z kwantową precyzją'
                },
                {
                  icon: '🥽',
                  title: 'AR Preview',
                  desc: 'Zobacz efekty naprawy przed jej wykonaniem'
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className={`text-4xl mb-4 filter drop-shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent`}>
                    {feature.title}
                  </h3>
                  <p className={`bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent opacity-80`}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {[
                { number: '99.9%', label: 'Precyzja AI' },
                { number: '<5min', label: 'Średni Czas' },
                { number: '∞', label: 'Gwarancja' },
                { number: '2026', label: 'Technologia' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent mb-2`}>
                    {stat.number}
                  </div>
                  <div className={`text-sm bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent opacity-70`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className={`p-8 backdrop-blur-xl bg-gradient-to-r ${currentTheme.bg} border border-white/10 rounded-3xl`}>
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent`}>
                Gotowy na przyszłość?
              </h2>
              <p className={`text-lg mb-6 bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent opacity-80`}>
                Dołącz do tysięcy zadowolonych klientów, którzy już korzystają z technologii 2026 roku
              </p>
              <button
                onClick={handleQuickOrder}
                className={`px-12 py-4 bg-gradient-to-r ${currentTheme.accent} text-white rounded-2xl font-bold text-xl hover:scale-105 transition-all duration-300 shadow-2xl shadow-current/30`}
              >
                Rozpocznij Teraz 🌟
              </button>
            </div>
          </div>
        </main>

        {/* Live Chat AI */}
        <LiveChatAI />

        {/* Scroll Indicator */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`w-6 h-10 border-2 border-current bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent rounded-full flex justify-center`}>
            <div className={`w-1 h-3 bg-gradient-to-r ${currentTheme.accent} rounded-full mt-2 animate-bounce`}></div>
          </div>
        </div>

        <style jsx>{`
          .bg-gradient-radial {
            background: radial-gradient(circle, currentColor 0%, transparent 70%);
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </>
  );
}