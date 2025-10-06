// pages/logistyka/magazyn/glowny.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DarkModeToggle from '../../../components/DarkModeToggle';
import AllegroQuickSearch from '../../../components/AllegroQuickSearch';
import { FiPackage, FiAlertCircle, FiTrendingUp, FiSearch, FiArrowLeft, FiEdit } from 'react-icons/fi';

export default function MagazynGlowny() {
  const router = useRouter();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState('all'); // all, low, ok

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/parts');
      const data = await res.json();
      
      if (data.success && data.parts) {
        console.log('✅ Załadowano części:', data.parts.length);
        setParts(data.parts);
      } else {
        console.error('Failed to load parts:', data);
      }
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrowanie
  const filteredParts = parts
    .filter(part => {
      const matchesSearch = 
        part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.partNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const stock = part.availability?.inStock || 0;
      const minStock = part.availability?.minStock || 0;
      
      if (filterStock === 'low') {
        return matchesSearch && stock <= minStock;
      } else if (filterStock === 'ok') {
        return matchesSearch && stock > minStock;
      }
      return matchesSearch;
    });

  // Statystyki
  const stats = {
    totalParts: parts.length,
    totalValue: parts.reduce((sum, p) => {
      const stock = p.availability?.inStock || 0;
      const price = parseFloat(p.pricing?.retailPrice) || 0;
      return sum + (stock * price);
    }, 0),
    totalStock: parts.reduce((sum, p) => sum + (p.availability?.inStock || 0), 0),
    lowStock: parts.filter(p => (p.availability?.inStock || 0) <= (p.availability?.minStock || 0)).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Magazyn główny</h1>
                <p className="text-sm text-gray-600 mt-1">Stan magazynu centralnego</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link
                href="/admin/magazyn/czesci"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <FiEdit className="inline h-4 w-4 mr-2" />
                Edytuj części
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiPackage className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.totalParts}
            </div>
            <div className="text-sm text-gray-600">Rodzajów części</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiPackage className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.totalStock}
            </div>
            <div className="text-sm text-gray-600">Wszystkich sztuk</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiTrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : `${stats.totalValue.toFixed(0)} zł`}
            </div>
            <div className="text-sm text-gray-600">Wartość magazynu</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiAlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.lowStock}
            </div>
            <div className="text-sm text-gray-600">Niski stan</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj części po nazwie, numerze lub kategorii..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStock('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStock === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Wszystkie ({parts.length})
              </button>
              <button
                onClick={() => setFilterStock('low')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStock === 'low'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Niski stan ({stats.lowStock})
              </button>
              <button
                onClick={() => setFilterStock('ok')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStock === 'ok'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                OK ({parts.length - stats.lowStock})
              </button>
            </div>
          </div>
        </div>

        {/* Parts table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Część
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategoria
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stan
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wartość
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      Ładowanie...
                    </td>
                  </tr>
                ) : filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      Brak części spełniających kryteria
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((part) => {
                    const stock = part.availability?.inStock || 0;
                    const minStock = part.availability?.minStock || 0;
                    const isLowStock = stock <= minStock;
                    const price = parseFloat(part.pricing?.retailPrice) || 0;
                    const value = stock * price;

                    return (
                      <tr key={part.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{part.name}</div>
                          {part.description && (
                            <div className="text-sm text-gray-500">{part.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {part.partNumber}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {part.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-lg font-bold ${
                            isLowStock ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {minStock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {price.toFixed(2)} zł
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {value.toFixed(2)} zł
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <AllegroQuickSearch
                            partName={part.name}
                            partNumber={part.partNumber}
                            compact={true}
                            maxResults={10}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {!loading && filteredParts.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Wyświetlono <strong>{filteredParts.length}</strong> z <strong>{parts.length}</strong> części.
              Wartość wyświetlonych: <strong>{filteredParts.reduce((sum, p) => sum + (p.stock * p.price), 0).toFixed(2)} zł</strong>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
