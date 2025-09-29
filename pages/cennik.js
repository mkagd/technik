// pages/cennik.js

import { useState, useEffect } from 'react';
import { 
  FiHome, 
  FiClock, 
  FiTool, 
  FiMapPin, 
  FiInfo,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';

export default function Cennik() {
  const [pricingRules, setPricingRules] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <FiHome className="h-5 w-5 mr-2" />
                Powrót
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Cennik usług serwisowych</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informacje ogólne */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <FiTool className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="font-semibold text-blue-900">Diagnoza</h3>
            </div>
            <p className="text-sm text-blue-800 mb-2">Stawka godzinowa z minimalną opłatą</p>
            <p className="text-xs text-blue-600">Obejmuje dojazd do 15 km</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <FiCheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="font-semibold text-green-900">Naprawa</h3>
            </div>
            <p className="text-sm text-green-800 mb-2">200+ PLN za pierwsze 30 min</p>
            <p className="text-xs text-green-600">Potem stawka godzinowa</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <FiMapPin className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="font-semibold text-purple-900">Dojazd</h3>
            </div>
            <p className="text-sm text-purple-800 mb-2">Do 15 km - gratis</p>
            <p className="text-xs text-purple-600">Powyżej - dodatkowa opłata</p>
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
      </div>
    </div>
  );
}