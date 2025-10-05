// pages/cennik.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FiHome, 
  FiClock, 
  FiTool, 
  FiMapPin, 
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
  FiPhone,
  FiMail,
  FiCalendar,
  FiChevronRight,
  FiDollarSign
} from 'react-icons/fi';

export default function Cennik() {
  const [pricingRules, setPricingRules] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Kalkulator kosztów
  const [calculator, setCalculator] = useState({
    serviceType: 'diagnosis', // diagnosis or repair
    duration: 0.5, // w godzinach
    distance: 10, // w km
    category: 'pralki'
  });
  const [calculatedCost, setCalculatedCost] = useState(null);

  useEffect(() => {
    loadPricingRules();
  }, []);

  const loadPricingRules = async () => {
    try {
      const response = await fetch('/api/pricing-rules');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rules = await response.json();
      setPricingRules(rules);
      console.log('✅ Pricing rules loaded successfully');
    } catch (error) {
      console.error('Błąd ładowania cennika:', error);
    }
  };

  const calculateCost = () => {
    if (!pricingRules) return null;
    
    const category = pricingRules.deviceCategories[calculator.category];
    if (!category) return null;

    let serviceCost = 0;
    if (calculator.serviceType === 'diagnosis') {
      const hourlyRate = category.diagnosis?.hourlyRate || 150;
      const minCharge = category.diagnosis?.minCharge || 120;
      serviceCost = Math.max(hourlyRate * calculator.duration, minCharge);
    } else {
      const baseRate = category.repair?.baseRate || 200;
      const hourlyRate = category.repair?.hourlyRateAfter30min || 250;
      if (calculator.duration <= 0.5) {
        serviceCost = baseRate;
      } else {
        serviceCost = baseRate + (hourlyRate * (calculator.duration - 0.5));
      }
    }

    let travelCost = 0;
    if (calculator.distance <= 15) {
      travelCost = 0;
    } else if (calculator.distance <= 30) {
      travelCost = (calculator.distance - 15) * 2;
    } else if (calculator.distance <= 50) {
      travelCost = 30 + ((calculator.distance - 30) * 3);
    } else {
      travelCost = 90 + ((calculator.distance - 50) * 4);
    }

    return {
      serviceCost: Math.round(serviceCost),
      travelCost: Math.round(travelCost),
      total: Math.round(serviceCost + travelCost)
    };
  };

  if (!pricingRules) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie cennika...</p>
        </div>
      </div>
    );
  }

  const categories = Object.entries(pricingRules.deviceCategories);
  const filteredCategories = selectedCategory === 'all' 
    ? categories 
    : categories.filter(([key]) => key === selectedCategory);

  return (
    <>
      <Head>
        <title>Cennik Serwisu AGD - Przejrzyste Ceny Napraw | TECHNIK Serwis</title>
        <meta name="description" content="Sprawdź nasz przejrzysty cennik napraw AGD. Diagnoza od 120 PLN, naprawa od 200 PLN. Dojazd gratis do 15 km. Pralki, lodówki, zmywarki i więcej." />
        <meta name="keywords" content="cennik serwis agd, ceny napraw agd, koszt naprawy pralki, naprawa lodówki cena, ile kosztuje naprawa zmywarki, dojazd serwisant" />
        <meta property="og:title" content="Cennik Serwisu AGD - TECHNIK Serwis" />
        <meta property="og:description" content="Przejrzyste ceny napraw AGD. Diagnoza, naprawa, dojazd. Sprawdź ile kosztuje naprawa Twojego sprzętu." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://techserwis.pl/cennik" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
        {/* Header z nawigacją */}
        <div className="bg-white shadow-md border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo i tytuł */}
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <a className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <FiTool className="h-6 w-6 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-lg font-bold text-gray-900">TECHNIK</div>
                      <div className="text-xs text-gray-500">Serwis AGD</div>
                    </div>
                  </a>
                </Link>
                <div className="hidden md:block w-px h-8 bg-gray-300"></div>
                <h1 className="hidden md:block text-xl font-bold text-gray-900">Cennik usług</h1>
              </div>

              {/* Nawigacja */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/">
                  <a className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">
                    <FiHome className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Strona główna</span>
                  </a>
                </Link>
                <Link href="/rezerwacja">
                  <a className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium shadow-md">
                    <FiCalendar className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Umów wizytę</span>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Przejrzyste <span className="text-blue-600">ceny napraw</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Bez ukrytych kosztów. Bez niespodzianek. Tylko uczciwe ceny za profesjonalną usługę.
          </p>
        </div>

        {/* Informacje ogólne - karty z gradienta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white rounded-2xl p-6 m-0.5 hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-4">
                <FiTool className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Diagnoza</h3>
              <p className="text-gray-600 mb-3">Stawka godzinowa z minimalną opłatą</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-blue-600">od 120</span>
                <span className="text-gray-500">PLN</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">+ dojazd gratis do 15 km</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white rounded-2xl p-6 m-0.5 hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-4">
                <FiCheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Naprawa</h3>
              <p className="text-gray-600 mb-3">Pierwsze 30 minut + stawka godzinowa</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-green-600">od 200</span>
                <span className="text-gray-500">PLN</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">+ części w cenie zakupu</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white rounded-2xl p-6 m-0.5 hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-4">
                <FiMapPin className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dojazd</h3>
              <p className="text-gray-600 mb-3">Bezpłatny w promieniu 15 km</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-purple-600">GRATIS</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Dalej 2-3 PLN/km</p>
            </div>
          </div>
        </div>

        {/* Filtr kategorii */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Kategorie urządzeń</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Wszystkie
            </button>
            {categories.map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Cennik kategorii */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCategories.map(([key, category]) => (
            <div key={key} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <span className="text-2xl mr-3">{category.icon}</span>
                  {category.name}
                </h3>
                <div className="mt-1">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    category.diagnosis?.complexity === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : category.diagnosis?.complexity === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    Złożoność: {
                      category.diagnosis?.complexity === 'high' ? 'Wysoka' :
                      category.diagnosis?.complexity === 'medium' ? 'Średnia' : 'Niska'
                    }
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Diagnoza */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FiTool className="h-4 w-4 mr-2 text-blue-600" />
                      Diagnoza
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stawka godzinowa:</span>
                        <span className="font-semibold">{category.diagnosis?.hourlyRate || 150} PLN/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Opłata minimalna:</span>
                        <span className="font-semibold text-green-600">{category.diagnosis?.minCharge || 120} PLN</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                      <p className="text-xs text-blue-800">
                        <FiInfo className="inline h-3 w-3 mr-1" />
                        Przykład: 10 min = {category.diagnosis?.minCharge || 120} PLN (minimum)
                      </p>
                      <p className="text-xs text-blue-800 mt-1">
                        Przykład: 1.5h = {((category.diagnosis?.hourlyRate || 150) * 1.5).toFixed(0)} PLN
                      </p>
                    </div>
                  </div>

                  {/* Naprawa */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FiCheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Naprawa
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pierwsze 30 min:</span>
                        <span className="font-semibold">{category.repair?.baseRate || 200} PLN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Następne godziny:</span>
                        <span className="font-semibold">{category.repair?.hourlyRateAfter30min || 250} PLN/h</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-green-50 rounded-md">
                      <p className="text-xs text-green-800">
                        <FiClock className="inline h-3 w-3 mr-1" />
                        Przykład: 20 min = {category.repair?.baseRate || 200} PLN
                      </p>
                      <p className="text-xs text-green-800 mt-1">
                        Przykład: 1.5h = {(category.repair?.baseRate || 200) + ((category.repair?.hourlyRateAfter30min || 250) * 1)} PLN
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Informacje o dojazdach */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <FiMapPin className="h-5 w-5 mr-2 text-purple-600" />
            Koszty dojazdu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(pricingRules.distanceRates).map(([range, info]) => (
              <div key={range} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900">{info.name}</div>
                <div className="text-2xl font-bold text-purple-600 my-2">
                  {info.rate === 0 ? 'GRATIS' : `${info.rate} PLN/km`}
                </div>
                <div className="text-xs text-gray-600">{info.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Kalkulator kosztów */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 mt-12 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <FiDollarSign className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Kalkulator kosztów</h3>
              <p className="text-blue-100">Oblicz szacunkowy koszt naprawy swojego urządzenia</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Rodzaj usługi</label>
                <select
                  value={calculator.serviceType}
                  onChange={(e) => setCalculator({...calculator, serviceType: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                >
                  <option value="diagnosis" className="text-gray-900">Diagnoza</option>
                  <option value="repair" className="text-gray-900">Naprawa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Kategoria urządzenia</label>
                <select
                  value={calculator.category}
                  onChange={(e) => setCalculator({...calculator, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                >
                  {pricingRules && Object.entries(pricingRules.deviceCategories).map(([key, cat]) => (
                    <option key={key} value={key} className="text-gray-900">{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Szacowany czas (godziny): {calculator.duration}h</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.5"
                  value={calculator.duration}
                  onChange={(e) => setCalculator({...calculator, duration: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-blue-100 mt-1">
                  <span>30 min</span>
                  <span>3h</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Odległość (km): {calculator.distance} km</label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={calculator.distance}
                  onChange={(e) => setCalculator({...calculator, distance: parseInt(e.target.value)})}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-blue-100 mt-1">
                  <span>5 km</span>
                  <span>100 km</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCalculatedCost(calculateCost())}
              className="w-full bg-white text-blue-600 font-semibold py-4 rounded-lg hover:bg-blue-50 transition-colors mb-6"
            >
              Oblicz koszt
            </button>

            {calculatedCost && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-blue-100 mb-1">Koszt usługi</div>
                    <div className="text-3xl font-bold">{calculatedCost.serviceCost} PLN</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-100 mb-1">Koszt dojazdu</div>
                    <div className="text-3xl font-bold">{calculatedCost.travelCost} PLN</div>
                  </div>
                  <div className="border-l-2 border-white/30">
                    <div className="text-sm text-blue-100 mb-1">Razem (szacunkowo)</div>
                    <div className="text-4xl font-bold text-green-300">{calculatedCost.total} PLN</div>
                  </div>
                </div>
                <p className="text-xs text-blue-100 text-center mt-4">
                  * Ostateczna cena może się różnić w zależności od rzeczywistego czasu naprawy i dodatkowych części
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-xl p-8 md:p-12 mt-12 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">Gotowy na naprawę?</h3>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Umów się na wizytę już dziś i pozwól nam zadbać o Twój sprzęt AGD
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/rezerwacja">
              <a className="inline-flex items-center px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <FiCalendar className="mr-2 h-5 w-5" />
                Umów wizytę online
              </a>
            </Link>
            <a href="tel:+48123456789" className="inline-flex items-center px-8 py-4 bg-green-800 text-white font-semibold rounded-xl hover:bg-green-900 transition-all">
              <FiPhone className="mr-2 h-5 w-5" />
              Zadzwoń: +48 123 456 789
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Najczęściej zadawane pytania</h3>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Czy diagnoza jest płatna?",
                a: "Tak, diagnoza jest płatna według stawki godzinowej z minimalną opłatą 120 PLN. Koszt diagnozy obejmuje dojazd do 15 km."
              },
              {
                q: "Co jeśli naprawa zajmie krócej niż 30 minut?",
                a: "W przypadku naprawy pobieramy opłatę minimalną 200 PLN za pierwsze 30 minut, nawet jeśli naprawa zajmie krócej."
              },
              {
                q: "Czy ceny obejmują części zamienne?",
                a: "Nie, ceny podane w cenniku dotyczą tylko usługi. Części zamienne są rozliczane osobno według ceny zakupu + marża serwisowa."
              },
              {
                q: "Jak liczona jest odległość dojazdu?",
                a: "Odległość mierzymy od naszej siedziby do miejsca wykonania usługi. Do 15 km dojazd jest bezpłatny."
              },
              {
                q: "Czy mogę negocjować cenę?",
                a: "Nasze ceny są stałe i uczciwe. W przypadku większych zleceń lub stałej współpracy możemy zaproponować rabaty."
              },
              {
                q: "Co jeśli urządzenie nie da się naprawić?",
                a: "W takim przypadku płacisz tylko za diagnozę. Nie pobieramy opłaty za nieudaną naprawę."
              }
            ].map((faq, index) => (
              <details key={index} className="group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-900">
                  <span>{faq.q}</span>
                  <FiChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Uwagi */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <div className="flex items-start">
            <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Ważne informacje</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Wszystkie ceny podane są brutto (z VAT)</li>
                <li>• Diagnoza obejmuje dojazd do 15 km od miejsca zgłoszenia</li>
                <li>• Suszarki do ubrań zaliczane są do kategorii wysokiej złożoności</li>
                <li>• Czas pracy liczony jest od momentu rozpoczęcia obsługi</li>
                <li>• Minimalna opłata za diagnozę zawsze wynosi co najmniej 120 PLN</li>
                <li>• Ceny mogą ulec zmianie - aktualne stawki dostępne u serwisanta</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white mt-16 py-12 rounded-t-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold text-lg mb-4 flex items-center">
                  <FiPhone className="mr-2" />
                  Kontakt
                </h4>
                <div className="space-y-2 text-gray-300">
                  <p className="flex items-center">
                    <FiPhone className="mr-2 h-4 w-4" />
                    <a href="tel:+48123456789" className="hover:text-white transition-colors">
                      +48 123 456 789
                    </a>
                  </p>
                  <p className="flex items-center">
                    <FiMail className="mr-2 h-4 w-4" />
                    <a href="mailto:kontakt@techserwis.pl" className="hover:text-white transition-colors">
                      kontakt@techserwis.pl
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-4">Godziny otwarcia</h4>
                <div className="space-y-2 text-gray-300">
                  <p>Poniedziałek - Piątek: 8:00 - 18:00</p>
                  <p>Sobota: 9:00 - 14:00</p>
                  <p>Niedziela: Zamknięte</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-4">Szybkie linki</h4>
                <div className="space-y-2">
                  <Link href="/">
                    <a className="block text-gray-300 hover:text-white transition-colors">
                      Strona główna
                    </a>
                  </Link>
                  <Link href="/cennik">
                    <a className="block text-gray-300 hover:text-white transition-colors">
                      Cennik
                    </a>
                  </Link>
                  <Link href="/rezerwacja">
                    <a className="block text-gray-300 hover:text-white transition-colors">
                      Umów wizytę
                    </a>
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
              <p>© {new Date().getFullYear()} TECHNIK Serwis AGD. Wszelkie prawa zastrzeżone.</p>
            </div>
          </div>
        </footer>
      </div>
      </div>
    </>
  );
}