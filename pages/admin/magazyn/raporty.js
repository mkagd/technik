import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function AdminMagazynRaporty() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Data
  const [requests, setRequests] = useState([]);
  const [parts, setParts] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalRequests: 0,
    approvalRate: 0,
    avgOrderValue: 0,
    topEmployee: null,
    topPart: null,
    monthlyTrend: []
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [requests, parts, employees, dateFrom, dateTo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsRes, partsRes, employeesRes] = await Promise.all([
        fetch('/api/part-requests'),
        fetch('/api/inventory/parts'),
        fetch('/api/employees')
      ]);

      const requestsData = await requestsRes.json();
      const partsData = await partsRes.json();
      const employeesData = await employeesRes.json();

      setRequests(requestsData.requests || []);
      setParts(partsData.parts || []);
      setEmployees(employeesData.employees || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    let filteredRequests = [...requests];

    // Apply date filters
    if (dateFrom) {
      filteredRequests = filteredRequests.filter(r => r.requestDate && new Date(r.requestDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      filteredRequests = filteredRequests.filter(r => r.requestDate && new Date(r.requestDate) <= new Date(dateTo));
    }

    // Total spent
    const totalSpent = filteredRequests
      .filter(r => r.status !== 'rejected')
      .reduce((sum, r) => {
        return sum + (r.parts?.reduce((s, p) => s + (p.unitPrice * p.quantity), 0) || 0);
      }, 0);

    // Approval rate
    const totalRequests = filteredRequests.length;
    const approvedRequests = filteredRequests.filter(r => r.status === 'approved' || r.status === 'ordered' || r.status === 'delivered').length;
    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    // Avg order value
    const avgOrderValue = approvedRequests > 0 ? totalSpent / approvedRequests : 0;

    // Top employee (by spending)
    const employeeSpending = {};
    filteredRequests
      .filter(r => r.status !== 'rejected')
      .forEach(r => {
        const empId = r.requestedBy;
        const value = r.parts?.reduce((s, p) => s + (p.unitPrice * p.quantity), 0) || 0;
        employeeSpending[empId] = (employeeSpending[empId] || 0) + value;
      });
    
    const topEmployeeId = Object.keys(employeeSpending).reduce((a, b) => 
      employeeSpending[a] > employeeSpending[b] ? a : b, null
    );
    const topEmployee = topEmployeeId ? {
      id: topEmployeeId,
      name: employees.find(e => e.id === topEmployeeId)?.name || topEmployeeId,
      spent: employeeSpending[topEmployeeId]
    } : null;

    // Top part (most ordered)
    const partOrders = {};
    filteredRequests
      .filter(r => r.status !== 'rejected')
      .forEach(r => {
        r.parts?.forEach(p => {
          partOrders[p.partId] = (partOrders[p.partId] || 0) + p.quantity;
        });
      });

    const topPartId = Object.keys(partOrders).reduce((a, b) => 
      partOrders[a] > partOrders[b] ? a : b, null
    );
    const topPart = topPartId ? {
      id: topPartId,
      name: parts.find(p => p.partId === topPartId)?.partName || topPartId,
      quantity: partOrders[topPartId]
    } : null;

    // Monthly trend (last 6 months)
    const monthlyData = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[key] = 0;
    }

    filteredRequests
      .filter(r => r.status !== 'rejected' && r.requestDate)
      .forEach(r => {
        const month = r.requestDate?.slice(0, 7);
        if (month && monthlyData.hasOwnProperty(month)) {
          const value = r.parts?.reduce((s, p) => s + (p.unitPrice * p.quantity), 0) || 0;
          monthlyData[month] += value;
        }
      });

    const monthlyTrend = Object.entries(monthlyData).map(([month, value]) => ({
      month,
      value
    }));

    setStats({
      totalSpent,
      totalRequests,
      approvalRate,
      avgOrderValue,
      topEmployee,
      topPart,
      monthlyTrend
    });
  };

  const getTopPartsByValue = () => {
    const partValues = {};
    
    requests
      .filter(r => r.status !== 'rejected')
      .forEach(r => {
        r.parts?.forEach(p => {
          const value = p.unitPrice * p.quantity;
          partValues[p.partId] = (partValues[p.partId] || 0) + value;
        });
      });

    return Object.entries(partValues)
      .map(([partId, value]) => ({
        partId,
        name: parts.find(p => p.partId === partId)?.partName || partId,
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const getTopEmployeesByRequests = () => {
    const employeeRequests = {};
    
    requests.forEach(r => {
      employeeRequests[r.requestedBy] = (employeeRequests[r.requestedBy] || 0) + 1;
    });

    return Object.entries(employeeRequests)
      .map(([empId, count]) => ({
        id: empId,
        name: employees.find(e => e.id === empId)?.name || empId,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getStatusDistribution = () => {
    const distribution = {
      pending: 0,
      approved: 0,
      rejected: 0,
      ordered: 0,
      delivered: 0
    };

    requests.forEach(r => {
      if (distribution.hasOwnProperty(r.status)) {
        distribution[r.status]++;
      }
    });

    return distribution;
  };

  const exportReport = () => {
    const report = [
      '=== RAPORT MAGAZYNU ===',
      `Data wygenerowania: ${new Date().toLocaleString('pl-PL')}`,
      dateFrom ? `Okres od: ${dateFrom}` : '',
      dateTo ? `Okres do: ${dateTo}` : '',
      '',
      '=== PODSUMOWANIE ===',
      `Łączne wydatki: ${stats.totalSpent.toFixed(2)} zł`,
      `Liczba zamówień: ${stats.totalRequests}`,
      `Wskaźnik akceptacji: ${stats.approvalRate.toFixed(1)}%`,
      `Średnia wartość zamówienia: ${stats.avgOrderValue.toFixed(2)} zł`,
      '',
      stats.topEmployee ? `Największy zamawiający: ${stats.topEmployee.name} (${stats.topEmployee.spent.toFixed(2)} zł)` : '',
      stats.topPart ? `Najczęściej zamawiana część: ${stats.topPart.name} (${stats.topPart.quantity} szt)` : '',
      '',
      '=== DYSTRYBUCJA STATUSÓW ===',
      ...Object.entries(getStatusDistribution()).map(([status, count]) => `${status}: ${count}`),
      '',
      '=== TOP 5 CZĘŚCI (WARTOŚĆ) ===',
      ...getTopPartsByValue().map((p, i) => `${i+1}. ${p.name}: ${p.value.toFixed(2)} zł`),
      '',
      '=== TOP 5 PRACOWNIKÓW (LICZBA ZAMÓWIEŃ) ===',
      ...getTopEmployeesByRequests().map((e, i) => `${i+1}. ${e.name}: ${e.count} zamówień`),
      '',
      '=== TREND MIESIĘCZNY (6 OSTATNICH MIESIĘCY) ===',
      ...stats.monthlyTrend.map(m => `${m.month}: ${m.value.toFixed(2)} zł`)
    ].filter(Boolean).join('\n');

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raport_magazyn_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const maxMonthlyValue = Math.max(...stats.monthlyTrend.map(m => m.value), 1);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporty i analiza</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Statystyki i trendy magazynu
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <DarkModeToggle />
                <button
                  onClick={exportReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  📊 Eksportuj raport
                </button>
                <button
                  onClick={() => router.push('/admin/magazyn')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  ← Wróć do magazynu
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Date Filters */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Okres:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                placeholder="Od"
              />
              <span className="text-gray-500 dark:text-gray-400">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                placeholder="Do"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Wyczyść
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Łączne wydatki</h3>
                    <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{stats.totalSpent.toFixed(2)} zł</div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Liczba zamówień</h3>
                    <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{stats.totalRequests}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Akceptacja</h3>
                    <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{stats.approvalRate.toFixed(1)}%</div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Śr. zamówienie</h3>
                    <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{stats.avgOrderValue.toFixed(2)} zł</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📈 Trend miesięczny (6 ostatnich miesięcy)
                  </h3>
                  <div className="space-y-3">
                    {stats.monthlyTrend.map((item) => (
                      <div key={item.month}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            {new Date(item.month + '-01').toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {item.value.toFixed(2)} zł
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${(item.value / maxMonthlyValue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📊 Rozkład statusów
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(getStatusDistribution()).map(([status, count]) => {
                      const total = stats.totalRequests;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      const colors = {
                        pending: 'from-yellow-500 to-yellow-600',
                        approved: 'from-blue-500 to-blue-600',
                        rejected: 'from-red-500 to-red-600',
                        ordered: 'from-purple-500 to-purple-600',
                        delivered: 'from-green-500 to-green-600'
                      };

                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="capitalize text-gray-600 dark:text-gray-400">{status}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                              className={`bg-gradient-to-r ${colors[status]} h-3 rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Top Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Parts by Value */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    🏆 Top 5 części (wartość)
                  </h3>
                  <div className="space-y-3">
                    {getTopPartsByValue().map((part, index) => (
                      <div key={part.partId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            index === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          } font-bold text-sm`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{part.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{part.partId}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">{part.value.toFixed(2)} zł</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Employees by Requests */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    👥 Top 5 pracowników (zamówienia)
                  </h3>
                  <div className="space-y-3">
                    {getTopEmployeesByRequests().map((employee, index) => (
                      <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            index === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          } font-bold text-sm`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{employee.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{employee.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">{employee.count} zamówień</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Highlights */}
              {(stats.topEmployee || stats.topPart) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stats.topEmployee && (
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                      <h3 className="text-sm font-medium opacity-90 mb-2">🏆 Największy zamawiający</h3>
                      <div className="text-2xl font-bold">{stats.topEmployee.name}</div>
                      <div className="text-lg mt-1">{stats.topEmployee.spent.toFixed(2)} zł</div>
                    </div>
                  )}

                  {stats.topPart && (
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                      <h3 className="text-sm font-medium opacity-90 mb-2">⭐ Najczęściej zamawiana część</h3>
                      <div className="text-2xl font-bold">{stats.topPart.name}</div>
                      <div className="text-lg mt-1">{stats.topPart.quantity} sztuk</div>
                    </div>
                  )}
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                      💡 O raportach
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• Użyj filtrów daty aby zawęzić okres analizy</li>
                      <li>• Wskaźnik akceptacji = (zatwierdzone + zamówione + dostarczone) / wszystkie</li>
                      <li>• Trend miesięczny pokazuje wydatki w ostatnich 6 miesiącach</li>
                      <li>• Eksportuj raport aby zapisać dane do pliku tekstowego</li>
                      <li>• Odrzucone zamówienia nie są wliczane do wydatków</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminLayout>
  );
}
