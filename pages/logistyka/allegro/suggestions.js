import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function AllegroSuggestions() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('all'); // all, critical, savings

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/allegro-suggestions');
      const data = await res.json();
      
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setSummary(data.summary);
        setLastCheck(data.lastCheck);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPrices = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/inventory/allegro-suggestions', {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
        setSummary(data.summary);
        setLastCheck(data.lastCheck);
        alert(`✅ Sprawdzono ceny!\n\nZnaleziono ${data.foundCount} ofert na Allegro\nPotencjalne oszczędności: ${data.summary.potentialSavings.toFixed(2)} zł`);
      }
    } catch (error) {
      console.error('Error checking prices:', error);
      alert('❌ Błąd podczas sprawdzania cen');
    } finally {
      setChecking(false);
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (filter === 'critical') return s.currentStock === 0;
    if (filter === 'savings') return s.isCheaper && s.savings > 10;
    return true;
  });

  const getUrgencyBadge = (urgency, currentStock) => {
    if (currentStock === 0) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    }
    if (urgency === 'high' || urgency === 'critical') {
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    }
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
  };

  const getUrgencyLabel = (urgency, currentStock) => {
    if (currentStock === 0) return '🔴 BRAK NA STANIE';
    if (urgency === 'high' || urgency === 'critical') return '🟡 PILNE';
    return '🟢 ZALECANE';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/logistyka"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Powrót
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🛒 Allegro - Sugestie Zakupów
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Automatyczne sprawdzanie cen dla części z low stock
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/logistyka/allegro/historia">
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-sm">
                  📊 Historia wyszukiwań
                </button>
              </Link>
              <button
                onClick={checkPrices}
                disabled={checking}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 font-medium shadow-sm"
              >
                {checking ? '⏳ Sprawdzam...' : '🔄 Odśwież ceny'}
              </button>
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Znaleziono ofert</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {summary.foundOffers} / {summary.totalParts}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-red-500">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Części krytyczne</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {summary.criticalParts}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Oszczędności</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {summary.potentialSavings.toFixed(0)} zł
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Taniej na Allegro</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {summary.cheaperOnAllegro}
              </div>
            </div>
          </div>
        )}

        {/* Last Check Info */}
        {lastCheck && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              📅 Ostatnie sprawdzenie: {new Date(lastCheck).toLocaleString('pl-PL')}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtruj:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Wszystkie ({suggestions.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🔴 Krytyczne ({suggestions.filter(s => s.currentStock === 0).length})
            </button>
            <button
              onClick={() => setFilter('savings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'savings'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              💰 Oszczędności 10+ zł ({suggestions.filter(s => s.isCheaper && s.savings > 10).length})
            </button>
          </div>
        </div>

        {/* Suggestions List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Brak sugestii!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {suggestions.length === 0
                ? 'Kliknij "Odśwież ceny" aby sprawdzić oferty Allegro'
                : 'Wszystkie części są dostępne lub nie ma lepszych ofert'}
            </p>
            {suggestions.length === 0 && (
              <button
                onClick={checkPrices}
                disabled={checking}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                🔄 Sprawdź teraz
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.partId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-6">
                  {/* Image */}
                  {suggestion.allegroImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={suggestion.allegroImage}
                        alt={suggestion.partName}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {suggestion.partName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {suggestion.partNumber} • {suggestion.subcategory}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(suggestion.urgency, suggestion.currentStock)}`}>
                        {getUrgencyLabel(suggestion.urgency, suggestion.currentStock)}
                      </span>
                    </div>

                    {/* Stock Info */}
                    <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aktualny stan</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {suggestion.currentStock} szt
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Min. stan</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {suggestion.minStock} szt
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Zalecane zamówienie</div>
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {suggestion.recommendedOrder} szt
                        </div>
                      </div>
                    </div>

                    {/* Price Comparison */}
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">🏪 Twój dostawca:</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {suggestion.yourPrice > 0 ? `${suggestion.yourPrice.toFixed(2)} zł` : 'Brak ceny'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">🛒 Allegro (najtaniej):</div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {suggestion.allegroPrice.toFixed(2)} zł
                          </div>
                          {suggestion.isCheaper && (
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              (−{suggestion.savings.toFixed(2)} zł, {suggestion.savingsPercent.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                        {suggestion.allegroFreeDelivery && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            🚚 Darmowa dostawa
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Seller Info */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Sprzedawca: <span className="font-medium text-gray-900 dark:text-white">{suggestion.allegroSeller}</span>
                      {suggestion.allegroSuperSeller && <span className="ml-1" title="Super Sprzedawca">⭐</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <a
                        href={suggestion.allegroUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-sm"
                      >
                        🛒 Zobacz ofertę na Allegro
                      </a>
                      
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(suggestion.allegroUrl);
                          alert('✅ Link skopiowany!');
                        }}
                        className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        📋 Kopiuj link
                      </button>

                      <Link
                        href={`/admin/magazyn/czesci?partId=${suggestion.partId}`}
                        className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        📦 Zobacz w magazynie
                      </Link>
                    </div>

                    {/* Alternative Offers */}
                    {suggestion.alternativeOffers && suggestion.alternativeOffers.length > 0 && (
                      <details className="mt-4">
                        <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white">
                          📊 Pokaż alternatywne oferty ({suggestion.alternativeOffers.length})
                        </summary>
                        <div className="mt-3 space-y-2">
                          {suggestion.alternativeOffers.map((offer, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{offer.seller}</span>
                                {offer.freeDelivery && <span className="ml-2 text-xs text-green-600">🚚 Darmowa dostawa</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900 dark:text-white">{offer.price.toFixed(2)} zł</span>
                                <a
                                  href={offer.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
                                >
                                  Zobacz →
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
