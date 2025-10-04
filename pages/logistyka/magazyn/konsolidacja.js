import { useState, useEffect } from 'react';
import Link from 'next/link';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function LogistykaKonsolidacja() {
  const [opportunities, setOpportunities] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    loadConsolidation();
  }, []);

  const loadConsolidation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/supplier-orders/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoDetect: true })
      });
      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setStatistics(data.statistics || {});
    } catch (error) {
      console.error('Error loading consolidation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (opportunity) => {
    if (!confirm(`Utworzyć skonsolidowane zamówienie?\nOszczędność: ${opportunity.savings} zł`)) return;

    setCreating(opportunity.requests[0]);
    try {
      const res = await fetch('/api/supplier-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdBy: 'EMPLOGISTYK001', // TODO: Get from auth
          supplierId: 'SUP001', // Default ASWO
          partRequestIds: opportunity.requests,
          deliveryMethod: 'consolidated',
          consolidationInfo: {
            type: opportunity.type,
            location: opportunity.location,
            savings: opportunity.savings
          },
          priority: 'standard'
        })
      });

      if (res.ok) {
        alert('✅ Zamówienie utworzone! Oszczędność: ' + opportunity.savings + ' zł');
        loadConsolidation();
      } else {
        const error = await res.json();
        alert('❌ Błąd: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('❌ Błąd: ' + error.message);
    } finally {
      setCreating(null);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      paczkomat: '📦',
      office: '🏢',
      address: '🏠'
    };
    return icons[type] || '📍';
  };

  const getTypeName = (type) => {
    const names = {
      paczkomat: 'Ten sam Paczkomat',
      office: 'Dostawa do biura',
      address: 'Podobny adres'
    };
    return names[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Konsolidacja zamówień</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Oszczędzaj na kosztach dostawy</p>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <button
                onClick={loadConsolidation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Odśwież
              </button>
              <Link href="/logistyka/magazyn" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                ← Wróć
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Statistics Bar */}
      {statistics && (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm opacity-90">Możliwości</p>
                <p className="text-3xl font-bold">{statistics.totalOpportunities || 0}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Oszczędności</p>
                <p className="text-3xl font-bold">{statistics.totalSavings || 0} zł</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Zamówień do konsolidacji</p>
                <p className="text-3xl font-bold">{opportunities.reduce((sum, o) => sum + o.requests.length, 0)}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Wskaźnik konsolidacji</p>
                <p className="text-3xl font-bold">{statistics.consolidationRate?.toFixed(0) || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Brak możliwości konsolidacji</h3>
            <p className="mt-1 text-sm text-gray-500">
              Wszystkie zamówienia są już optymalne lub nie ma wystarczającej liczby zamówień do konsolidacji.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {opportunities.map((opportunity, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-400 to-blue-400 p-6">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{getTypeIcon(opportunity.type)}</div>
                      <div>
                        <h3 className="text-xl font-bold">{getTypeName(opportunity.type)}</h3>
                        <p className="text-sm opacity-90">{opportunity.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{opportunity.savings} zł</p>
                      <p className="text-sm opacity-90">Oszczędność</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Employees */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Serwisanci ({opportunity.employees.length}):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {opportunity.employees.map((emp, empIdx) => (
                        <span
                          key={empIdx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          👤 {emp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Requests */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Zamówienia ({opportunity.requests.length}):
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {opportunity.requests.map((reqId, reqIdx) => (
                        <div key={reqIdx} className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                          {reqId}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculation */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Koszt bez konsolidacji:</span>
                      <span className="font-medium text-gray-900">
                        {opportunity.requests.length} × 15 zł = {opportunity.requests.length * 15} zł
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-700">Koszt z konsolidacją:</span>
                      <span className="font-medium text-gray-900">1 × 15 zł = 15 zł</span>
                    </div>
                    <div className="border-t border-green-300 mt-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-700">Oszczędność:</span>
                        <span className="text-2xl font-bold text-green-600">{opportunity.savings} zł 🎉</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleCreateOrder(opportunity)}
                    disabled={creating === opportunity.requests[0]}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center"
                  >
                    {creating === opportunity.requests[0] ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Tworzenie...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Utwórz skonsolidowane zamówienie → Oszczędź {opportunity.savings} zł
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Jak działa konsolidacja?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Ten sam Paczkomat:</strong> Gdy kilku serwisantów wybiera ten sam paczkomat</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Dostawa do biura:</strong> Gdy wszyscy wybierają dostawę do biura</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Podobny adres:</strong> Gdy adresy są podobne (70%+ dopasowanie słów)</span>
            </li>
            <li className="flex items-start mt-3 pt-3 border-t border-blue-200">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              <span><strong>Oszczędność:</strong> (N-1) × 15 zł, gdzie N = liczba zamówień w grupie</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
