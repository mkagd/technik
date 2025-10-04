import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employeeId: '',
    method: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filters.employeeId && log.employeeId !== filters.employeeId) return false;
    if (filters.method !== 'all' && log.method !== filters.method) return false;
    
    if (filters.dateFrom) {
      const logDate = new Date(log.timestamp);
      const fromDate = new Date(filters.dateFrom);
      if (logDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const logDate = new Date(log.timestamp);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      if (logDate > toDate) return false;
    }
    
    return true;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Data/Czas', 'Pracownik', 'Akcja', 'Zlecenie', 'Wizyta', 'Kwota', 'Metoda', 'GPS Lat', 'GPS Lng', 'Dokładność', 'IP'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('pl-PL'),
      log.employeeId,
      log.action,
      log.orderId,
      log.visitId,
      log.amount,
      log.method,
      log.gps?.lat || '',
      log.gps?.lng || '',
      log.gps?.accuracy || '',
      log.deviceInfo?.ip || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie logów...</p>
        </div>
      </div>
    );
  }

  const uniqueEmployees = [...new Set(logs.map(l => l.employeeId))];

  return (
    <>
      <Head>
        <title>Logi Audytu - Panel Admina</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">📜 Logi Audytu Płatności</h1>
            <p className="text-gray-600 mt-2">Niemutowalne logi wszystkich transakcji</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-500 text-white rounded-lg p-6 shadow-lg">
              <p className="text-blue-100 text-sm mb-1">Wszystkie logi</p>
              <p className="text-4xl font-bold">{logs.length}</p>
            </div>
            <div className="bg-green-500 text-white rounded-lg p-6 shadow-lg">
              <p className="text-green-100 text-sm mb-1">Gotówka</p>
              <p className="text-4xl font-bold">
                {logs.filter(l => l.cashAmount > 0).length}
              </p>
            </div>
            <div className="bg-purple-500 text-white rounded-lg p-6 shadow-lg">
              <p className="text-purple-100 text-sm mb-1">Karta/BLIK</p>
              <p className="text-4xl font-bold">
                {logs.filter(l => l.cardAmount > 0 || l.blikAmount > 0).length}
              </p>
            </div>
            <div className="bg-orange-500 text-white rounded-lg p-6 shadow-lg">
              <p className="text-orange-100 text-sm mb-1">Łączna kwota</p>
              <p className="text-4xl font-bold">
                {logs.reduce((sum, l) => sum + (l.amount || 0), 0).toFixed(0)} PLN
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold mb-4">🔍 Filtry</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pracownik</label>
                <select
                  value={filters.employeeId}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Wszyscy</option>
                  {uniqueEmployees.map(empId => (
                    <option key={empId} value={empId}>{empId}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metoda</label>
                <select
                  value={filters.method}
                  onChange={(e) => setFilters({ ...filters, method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Wszystkie</option>
                  <option value="cash">Gotówka</option>
                  <option value="card">Karta</option>
                  <option value="blik">BLIK</option>
                  <option value="mixed">Mieszana</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data od</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data do</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setFilters({ employeeId: '', method: 'all', dateFrom: '', dateTo: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                🔄 Wyczyść filtry
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                📥 Eksportuj CSV
              </button>
            </div>
          </div>

          {/* Results info */}
          <div className="mb-4 text-sm text-gray-600">
            Znaleziono <strong>{filteredLogs.length}</strong> logów
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Czas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pracownik</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcja</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kwota</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metoda</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GPS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dowody</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {log.id.substring(0, 12)}...
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pl-PL')}
                      </td>
                      <td className="px-4 py-3 font-semibold">{log.employeeId}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {log.amount?.toFixed(2)} PLN
                        {log.cashAmount > 0 && <div className="text-xs text-gray-500">💵 {log.cashAmount}</div>}
                        {log.cardAmount > 0 && <div className="text-xs text-gray-500">💳 {log.cardAmount}</div>}
                        {log.blikAmount > 0 && <div className="text-xs text-gray-500">📱 {log.blikAmount}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          log.method === 'cash' ? 'bg-green-100 text-green-800' :
                          log.method === 'card' ? 'bg-blue-100 text-blue-800' :
                          log.method === 'blik' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.gps ? (
                          <div className="text-xs">
                            <div>📍 {log.gps.lat.toFixed(4)}, {log.gps.lng.toFixed(4)}</div>
                            <div className={log.gps.accuracy > 100 ? 'text-red-600' : 'text-gray-500'}>
                              ±{Math.round(log.gps.accuracy)}m
                            </div>
                          </div>
                        ) : (
                          <span className="text-red-600 text-xs">❌ Brak</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          {log.signatureHash ? (
                            <div className="text-green-600">✅ Podpis</div>
                          ) : log.cashAmount > 0 ? (
                            <div className="text-red-600">❌ Podpis</div>
                          ) : null}
                          {log.photoHash ? (
                            <div className="text-green-600">✅ Zdjęcie</div>
                          ) : (log.cardAmount > 0 || log.blikAmount > 0) ? (
                            <div className="text-red-600">❌ Zdjęcie</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {log.deviceInfo?.ip || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Brak logów do wyświetlenia</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ UWAGA: Logi niemutowalne</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>🔒 Logi są NIEMUTOWALNE - nie można ich edytować ani usuwać</li>
              <li>🔐 Każdy wpis ma hash zapewniający integralność danych</li>
              <li>📊 Służą do audytu i kontroli skarbowej</li>
              <li>⏰ Timestamp jest pobrany z serwera (nie z urządzenia)</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
