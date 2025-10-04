import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showResolved, setShowResolved] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, [showResolved]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/security-alerts?includeResolved=${showResolved}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle alert actions
  const handleAlertAction = async (alertId, action) => {
    setActionLoading(alertId);
    try {
      const res = await fetch('/api/admin/alert-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action })
      });

      if (res.ok) {
        // Refresh alerts
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error performing action:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const viewDetails = (alert) => {
    // Open modal or navigate to details page
    console.log('View details:', alert);
    window.open(`/admin/audit-logs?employeeId=${alert.employeeId}`, '_blank');
  };

  const markResolved = async (alertId) => {
    if (confirm('Czy na pewno chcesz oznaczyć ten alert jako rozwiązany?')) {
      await handleAlertAction(alertId, 'resolve');
    }
  };

  const contactEmployee = (alert) => {
    // Open contact modal or initiate call
    const message = `Alert: ${alert.title}\n\nPracownik: ${alert.employeeName}\n\nSkontaktuj się w sprawie: ${alert.description}`;
    if (confirm(message + '\n\nOtworzyć panel kontaktu?')) {
      // Here you could integrate with email/SMS system
      window.location.href = `mailto:?subject=Alert: ${alert.title}&body=${encodeURIComponent(message)}`;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-900';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-900';
      default: return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie alertów...</p>
        </div>
      </div>
    );
  }

  // Generate mock alerts for demo (in production, this comes from API)
  const mockAlerts = [
    {
      id: 1,
      severity: 'critical',
      type: 'missing_signature',
      title: 'Brak podpisu cyfrowego',
      description: 'Jan Kowalski - 3 płatności gotówką bez podpisu klienta (dziś)',
      employeeName: 'Jan Kowalski',
      timestamp: new Date().toISOString(),
      details: {
        count: 3,
        totalAmount: 1250
      }
    },
    {
      id: 2,
      severity: 'high',
      type: 'gps_suspicious',
      title: 'Podejrzana lokalizacja GPS',
      description: 'Anna Wiśniewska - Płatność 250m od adresu klienta',
      employeeName: 'Anna Wiśniewska',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: {
        distance: 250,
        accuracy: 15
      }
    },
    {
      id: 3,
      severity: 'medium',
      type: 'high_cash_percentage',
      title: 'Wysoki % płatności gotówką',
      description: 'Piotr Nowak - 85% płatności gotówką (ten miesiąc)',
      employeeName: 'Piotr Nowak',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: {
        percentage: 85,
        cashAmount: 4250,
        totalAmount: 5000
      }
    },
    {
      id: 4,
      severity: 'high',
      type: 'missing_photo',
      title: 'Brak zdjęcia dowodu płatności',
      description: 'Jan Kowalski - Płatność kartą bez zdjęcia potwierdzenia',
      employeeName: 'Jan Kowalski',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      details: {
        amount: 450,
        method: 'card'
      }
    },
    {
      id: 5,
      severity: 'medium',
      type: 'payment_edited',
      title: 'Edycja płatności',
      description: 'Anna Wiśniewska - Zmiana z karty na gotówkę po 2 dniach',
      employeeName: 'Anna Wiśniewska',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      details: {
        original: 'card',
        edited: 'cash',
        amount: 320
      }
    },
    {
      id: 6,
      severity: 'low',
      type: 'low_gps_accuracy',
      title: 'Niska dokładność GPS',
      description: 'Piotr Nowak - Płatność z dokładnością GPS ±120m',
      employeeName: 'Piotr Nowak',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      details: {
        accuracy: 120
      }
    }
  ];

  const displayAlerts = alerts.length > 0 ? alerts : mockAlerts;

  const filteredAlerts = filterType === 'all' 
    ? displayAlerts 
    : displayAlerts.filter(a => a.type === filterType);

  // Count by severity
  const criticalCount = displayAlerts.filter(a => a.severity === 'critical').length;
  const highCount = displayAlerts.filter(a => a.severity === 'high').length;
  const mediumCount = displayAlerts.filter(a => a.severity === 'medium').length;

  return (
    <>
      <Head>
        <title>Alerty Bezpieczeństwa - Panel Admina</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">🚨 Alerty Bezpieczeństwa</h1>
            <p className="text-gray-600 mt-2">Monitorowanie podejrzanych transakcji i nieprawidłowości</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-red-500 text-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm mb-1">Krytyczne</p>
                  <p className="text-4xl font-bold">{criticalCount}</p>
                </div>
                <span className="text-5xl">🚨</span>
              </div>
            </div>
            <div className="bg-orange-500 text-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Wysokie</p>
                  <p className="text-4xl font-bold">{highCount}</p>
                </div>
                <span className="text-5xl">⚠️</span>
              </div>
            </div>
            <div className="bg-yellow-500 text-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm mb-1">Średnie</p>
                  <p className="text-4xl font-bold">{mediumCount}</p>
                </div>
                <span className="text-5xl">⚡</span>
              </div>
            </div>
            <div className="bg-blue-500 text-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Wszystkie</p>
                  <p className="text-4xl font-bold">{displayAlerts.length}</p>
                </div>
                <span className="text-5xl">📊</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">🔍 Filtry</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showResolved}
                  onChange={(e) => setShowResolved(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Pokaż rozwiązane</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Wszystkie ({displayAlerts.length})
              </button>
              <button
                onClick={() => setFilterType('missing_signature')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'missing_signature'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Brak podpisu
              </button>
              <button
                onClick={() => setFilterType('gps_suspicious')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'gps_suspicious'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                GPS podejrzane
              </button>
              <button
                onClick={() => setFilterType('high_cash_percentage')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'high_cash_percentage'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dużo gotówki
              </button>
              <button
                onClick={() => setFilterType('missing_photo')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'missing_photo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Brak zdjęcia
              </button>
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border-l-4 p-6 shadow-sm ${getSeverityColor(alert.severity)} ${
                  alert.resolved ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{alert.resolved ? '✅' : getSeverityIcon(alert.severity)}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold mb-1">
                          {alert.title}
                          {alert.resolved && <span className="ml-2 text-sm text-green-600">(Rozwiązano)</span>}
                        </h3>
                        <p className="text-sm opacity-90 mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs opacity-75">
                          <span>👤 {alert.employeeName}</span>
                          <span>🕐 {new Date(alert.timestamp).toLocaleString('pl-PL')}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        alert.severity === 'critical' ? 'bg-red-200 text-red-900' :
                        alert.severity === 'high' ? 'bg-orange-200 text-orange-900' :
                        alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-blue-200 text-blue-900'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    
                    {/* Alert Details */}
                    {alert.details && (
                      <div className="mt-4 p-3 bg-white bg-opacity-50 rounded text-sm">
                        <strong>Szczegóły:</strong>
                        <ul className="mt-1 space-y-1">
                          {alert.details.count && <li>• Liczba przypadków: {alert.details.count}</li>}
                          {alert.details.totalAmount && <li>• Całkowita kwota: {alert.details.totalAmount} PLN</li>}
                          {alert.details.distance && <li>• Odległość od klienta: {alert.details.distance}m</li>}
                          {alert.details.accuracy && <li>• Dokładność GPS: ±{alert.details.accuracy}m</li>}
                          {alert.details.percentage && <li>• Procent gotówki: {alert.details.percentage}%</li>}
                          {alert.details.cashAmount && <li>• Kwota gotówką: {alert.details.cashAmount} PLN</li>}
                          {alert.details.amount && <li>• Kwota: {alert.details.amount} PLN</li>}
                          {alert.details.method && <li>• Metoda: {alert.details.method}</li>}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    {!alert.resolved && (
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => viewDetails(alert)}
                          disabled={actionLoading === alert.id}
                          className="px-4 py-2 bg-white rounded text-sm font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                        >
                          🔍 Sprawdź szczegóły
                        </button>
                        <button 
                          onClick={() => markResolved(alert.id)}
                          disabled={actionLoading === alert.id}
                          className="px-4 py-2 bg-white rounded text-sm font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                        >
                          {actionLoading === alert.id ? '⏳' : '✅'} Rozwiązano
                        </button>
                        <button 
                          onClick={() => contactEmployee(alert)}
                          disabled={actionLoading === alert.id}
                          className="px-4 py-2 bg-white rounded text-sm font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                        >
                          📞 Skontaktuj się
                        </button>
                      </div>
                    )}
                    {alert.resolved && (
                      <div className="mt-4 text-sm text-green-600 font-semibold">
                        ✅ Alert został rozwiązany
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredAlerts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <span className="text-6xl">✅</span>
                <p className="text-gray-500 mt-4">Brak alertów tego typu</p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ O alertach</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>🚨 <strong>Krytyczne:</strong> Wymagają natychmiastowej reakcji (brak podpisu, podejrzana lokalizacja)</li>
              <li>⚠️ <strong>Wysokie:</strong> Poważne nieprawidłowości (brak zdjęcia, edycje płatności)</li>
              <li>⚡ <strong>Średnie:</strong> Do weryfikacji (wysoki % gotówki, niska dokładność GPS)</li>
              <li>ℹ️ <strong>Niskie:</strong> Informacyjne (statystyki, trendy)</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
