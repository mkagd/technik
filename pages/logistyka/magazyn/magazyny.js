import { useState, useEffect } from 'react';
import Link from 'next/link';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function LogistykaMagazyny() {
  const [warehouses, setWarehouses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value'); // value, parts, name
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Pobierz wszystkich serwisantów
      const empRes = await fetch('/api/employees');
      const empData = await empRes.json();
      
      if (!empData.success || !empData.employees) {
        console.error('Failed to load employees:', empData);
        setLoading(false);
        return;
      }
      
      const technicians = empData.employees.filter(emp => emp.role === 'Serwisant' || emp.role === 'serwisant');
      setEmployees(technicians);

      console.log('📦 Ładowanie magazynów dla', technicians.length, 'serwisantów');

      // Pobierz magazyny dla każdego serwisanta
      const warehousePromises = technicians.map(async (tech) => {
        try {
          console.log('Pobieranie magazynu dla:', tech.id, tech.name);
          const res = await fetch(`/api/inventory/personal?employeeId=${tech.id}`);
          const data = await res.json();
          
          const totalValue = data.inventory?.reduce((sum, item) => 
            sum + (item.quantity * item.unitPrice), 0) || 0;
          
          const totalParts = data.inventory?.reduce((sum, item) => 
            sum + item.quantity, 0) || 0;

          const lowStockCount = data.inventory?.filter(item => item.quantity < 2).length || 0;

          console.log(`✅ Magazyn ${tech.id}:`, {
            items: data.inventory?.length,
            totalParts,
            totalValue
          });

          return {
            employeeId: tech.id,
            employeeName: tech.name,
            vehicleId: tech.vehicleId || 'Brak pojazdu',
            totalValue: totalValue,
            totalParts: totalParts,
            uniqueParts: data.inventory?.length || 0,
            lowStockCount: lowStockCount,
            inventory: data.inventory || []
          };
        } catch (err) {
          console.error(`❌ Error loading warehouse for ${tech.id}:`, err);
          return {
            employeeId: tech.id,
            employeeName: tech.name,
            vehicleId: tech.vehicleId || 'Brak pojazdu',
            totalValue: 0,
            totalParts: 0,
            uniqueParts: 0,
            lowStockCount: 0,
            inventory: []
          };
        }
      });

      const warehouseData = await Promise.all(warehousePromises);
      setWarehouses(warehouseData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrowanie i sortowanie
  const filteredWarehouses = warehouses
    .filter(w => 
      w.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.vehicleId.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'value') return b.totalValue - a.totalValue;
      if (sortBy === 'parts') return b.totalParts - a.totalParts;
      if (sortBy === 'name') return a.employeeName.localeCompare(b.employeeName);
      return 0;
    });

  // Statystyki globalne
  const globalStats = {
    totalWarehouses: warehouses.length,
    totalValue: warehouses.reduce((sum, w) => sum + w.totalValue, 0),
    totalParts: warehouses.reduce((sum, w) => sum + w.totalParts, 0),
    totalLowStock: warehouses.reduce((sum, w) => sum + w.lowStockCount, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Przegląd magazynów</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Osobiste magazyny serwisantów
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link 
                href="/logistyka/magazyn" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
              >
                ← Wróć do dashboardu
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Global Stats */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {globalStats.totalWarehouses}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Magazynów</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {globalStats.totalValue.toFixed(2)} zł
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Całkowita wartość</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {globalStats.totalParts}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Wszystkich części</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {globalStats.totalLowStock}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Niskie stany</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Szukaj po nazwisku, ID lub pojeździe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg 
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sortuj:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="value">Wartość (malejąco)</option>
                <option value="parts">Ilość części (malejąco)</option>
                <option value="name">Nazwisko (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Brak magazynów</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nie znaleziono magazynów pasujących do zapytania.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWarehouses.map((warehouse) => (
              <div 
                key={warehouse.employeeId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{warehouse.employeeName}</h3>
                        <p className="text-xs text-white/80">{warehouse.employeeId}</p>
                      </div>
                    </div>
                    {warehouse.lowStockCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {warehouse.lowStockCount} LOW
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Vehicle */}
                  <div className="mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Pojazd: <span className="font-medium text-gray-900 dark:text-white">{warehouse.vehicleId}</span>
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Rodzajów części</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{warehouse.uniqueParts}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Wszystkich szt</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{warehouse.totalParts}</p>
                    </div>
                  </div>

                  {/* Total Value */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Wartość magazynu</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {warehouse.totalValue.toFixed(2)} zł
                    </p>
                  </div>

                  {/* Low Stock Alert */}
                  {warehouse.lowStockCount > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                          {warehouse.lowStockCount} części z niskim stanem!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link
                    href={`/serwis/magazyn/moj-magazyn?employeeId=${warehouse.employeeId}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors"
                  >
                    📦 Zobacz szczegóły
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        {!loading && filteredWarehouses.length > 0 && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  💡 Zarządzanie magazynami
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Każdy serwisant ma swój osobisty magazyn w pojeździe</li>
                  <li>• Czerwone oznaczenie LOW = mniej niż 2 sztuki części</li>
                  <li>• Kliknij "Zobacz szczegóły" aby zobaczyć pełną listę części</li>
                  <li>• Sortuj magazyny według wartości, ilości lub nazwiska</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
