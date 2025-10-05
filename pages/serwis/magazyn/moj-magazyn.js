import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function SerwisantMojMagazyn() {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // ✅ Pobierz dane pracownika z localStorage (jak w /technician)
    const employeeData = localStorage.getItem('serwisEmployee') || localStorage.getItem('technicianEmployee');
    
    if (!employeeData) {
      console.warn('⚠️ Brak danych pracownika, przekierowanie do logowania');
      router.push('/pracownik-logowanie');
      return;
    }

    try {
      const emp = JSON.parse(employeeData);
      setEmployee(emp);
      loadInventory(emp.id);
    } catch (err) {
      console.error('❌ Błąd parsowania danych pracownika:', err);
      router.push('/pracownik-logowanie');
    }
  }, []);

  const loadInventory = async (employeeId) => {
    if (!employeeId) {
      console.error('❌ Brak employeeId');
      return;
    }

    setLoading(true);
    try {
      console.log(`📦 Ładowanie magazynu dla: ${employeeId}`);
      const res = await fetch(`/api/inventory/personal?employeeId=${employeeId}`);
      const data = await res.json();
      
      if (data.success) {
        setInventory(data.inventory);
        console.log(`✅ Załadowano magazyn:`, data.inventory);
      } else {
        console.error('❌ Błąd API:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = inventory?.parts?.filter(part =>
    part.partName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.partId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.partNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const lowStockParts = filteredParts.filter(p => p.quantity < 2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🚗 Mój Magazyn</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Części w twoim aucie</p>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link href="/serwis/magazyn" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                ← Wróć
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Statistics Bar */}
      {inventory && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm opacity-90">Rodzaje części</p>
                <p className="text-3xl font-bold">{inventory.parts?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Łączna ilość</p>
                <p className="text-3xl font-bold">{inventory.statistics?.totalParts || 0} szt</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Wartość magazynu</p>
                <p className="text-3xl font-bold">{inventory.statistics?.totalValue?.toFixed(0) || 0} zł</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Low Stock</p>
                <p className="text-3xl font-bold">{lowStockParts.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj części (nazwa, ID, numer katalogowy)..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery ? 'Nie znaleziono części' : 'Pusty magazyn'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Spróbuj innej frazy wyszukiwania' : 'Zamów swoje pierwsze części'}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <Link
                  href="/serwis/magazyn/zamow"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Zamów części
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Low Stock Alert */}
            {lowStockParts.length > 0 && !searchQuery && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <span className="font-medium">Uwaga!</span> {lowStockParts.length} część/części ma niski stan (&lt;2 szt). Rozważ zamówienie.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Parts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParts.map((part, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-lg shadow hover:shadow-md transition-all ${
                    part.quantity < 2 ? 'border-2 border-red-300' : ''
                  }`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{part.partName || part.partId}</h3>
                        <p className="text-sm text-gray-500">{part.partNumber}</p>
                      </div>
                      {part.quantity < 2 && (
                        <span className="px-2 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full">
                          LOW
                        </span>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Ilość:</span>
                        <span className={`text-2xl font-bold ${part.quantity < 2 ? 'text-red-600' : 'text-gray-900'}`}>
                          {part.quantity} szt
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            part.quantity < 2 ? 'bg-red-500' : part.quantity < 5 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((part.quantity / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Lokalizacja:</span>
                        <span className="font-medium text-gray-900">{part.location || 'Nie określono'}</span>
                      </div>
                      {part.unitPrice && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cena jedn.:</span>
                          <span className="font-medium text-gray-900">{part.unitPrice.toFixed(2)} zł</span>
                        </div>
                      )}
                      {part.unitPrice && (
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-500">Wartość:</span>
                          <span className="font-bold text-gray-900">{(part.unitPrice * part.quantity).toFixed(2)} zł</span>
                        </div>
                      )}
                    </div>

                    {/* Last Restocked */}
                    {part.lastRestocked && (
                      <div className="text-xs text-gray-500 border-t pt-2">
                        Ostatnio uzupełnione: {new Date(part.lastRestocked).toLocaleDateString('pl-PL')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
