import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';

export default function AllegroHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    partName: '',
    days: 30,
    limit: 50
  });

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: filters.limit,
        days: filters.days,
        ...(filters.partName && { partName: filters.partName })
      });
      
      const res = await fetch(`/api/allegro/history?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setHistory(data.history || []);
        setStats(data.stats || null);
      } else {
        setError(data.message || 'Błąd pobierania historii');
      }
    } catch (err) {
      setError('Nie można połączyć się z API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('Czy na pewno chcesz wyczyścić całą historię wyszukiwań?')) return;
    
    try {
      const res = await fetch('/api/allegro/history?all=true', {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Historia została wyczyszczona');
        fetchHistory();
      } else {
        alert('Błąd czyszczenia historii: ' + data.message);
      }
    } catch (err) {
      alert('Nie można połączyć się z API');
      console.error(err);
    }
  };

  const deleteEntry = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis?')) return;
    
    try {
      const res = await fetch(`/api/allegro/history?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.success) {
        fetchHistory();
      } else {
        alert('Błąd usuwania wpisu: ' + data.message);
      }
    } catch (err) {
      alert('Nie można połączyć się z API');
      console.error(err);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return `${price.toFixed(2)} zł`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📊 Historia wyszukiwań Allegro
            </h1>
            <p className="text-gray-600">
              Przeglądaj historię wyszukiwań i śledź zmiany cen
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link href="/logistyka/allegro/suggestions">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                ← Dashboard
              </button>
            </Link>
            
            <button
              onClick={clearAllHistory}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              🗑️ Wyczyść historię
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-sm font-medium mb-1 opacity-90">Łącznie wyszukiwań</div>
              <div className="text-3xl font-bold">{stats.totalSearches}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-sm font-medium mb-1 opacity-90">Unikalnych części</div>
              <div className="text-3xl font-bold">{stats.uniqueParts}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-sm font-medium mb-1 opacity-90">Łącznie wyników</div>
              <div className="text-3xl font-bold">{stats.totalResults}</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-sm font-medium mb-1 opacity-90">Średnio wyników</div>
              <div className="text-3xl font-bold">{stats.averageResults}</div>
            </div>
          </div>
        )}

        {/* Price Statistics */}
        {stats?.priceStats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">💰 Statystyki cen</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Najniższa cena</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(stats.priceStats.lowestEver)}
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Średnia najniższych</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(stats.priceStats.averageLowest)}
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Najwyższa cena</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatPrice(stats.priceStats.highestEver)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Filtry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa części
              </label>
              <input
                type="text"
                value={filters.partName}
                onChange={(e) => setFilters({ ...filters, partName: e.target.value })}
                placeholder="Wpisz nazwę..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ostatnie dni
              </label>
              <select
                value={filters.days}
                onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">7 dni</option>
                <option value="14">14 dni</option>
                <option value="30">30 dni</option>
                <option value="90">90 dni</option>
                <option value="365">Rok</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limit wyników
              </label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Zapytanie
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Część
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Wyniki
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Min. cena
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Średnia
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Max. cena
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      ⏳ Ładowanie...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-red-500">
                      ❌ {error}
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      Brak wyszukiwań w historii
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {entry.query}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>{entry.partName || '-'}</div>
                        {entry.partNumber && (
                          <div className="text-xs text-gray-500">{entry.partNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {entry.resultCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                        {formatPrice(entry.lowestPrice)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatPrice(entry.averagePrice)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">
                        {formatPrice(entry.highestPrice)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Usuń wpis"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Informacja o historii
              </h3>
              <p className="text-sm text-blue-800">
                System automatycznie zapisuje wszystkie wyszukiwania Allegro z komponentu AllegroQuickSearch.
                Historia przechowuje 1000 ostatnich wyszukiwań wraz ze statystykami cen i wynikami.
                Możesz filtrować wyniki po nazwie części, zakresie dat i limicie rekordów.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
