import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'settled'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleForm, setSettleForm] = useState({
    method: 'atm',
    amount: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch settlements
  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/employee-settlements?period=${selectedPeriod}`);
      const data = await res.json();

      if (data.success) {
        setSettlements(data.settlements);
        setTotals(data.totals);
      } else {
        setError('Błąd podczas pobierania rozliczeń');
      }
    } catch (err) {
      console.error('Error fetching settlements:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [selectedPeriod]);

  // Filter settlements
  const filteredSettlements = settlements.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  // Open settle modal
  const openSettleModal = (employee) => {
    setSelectedEmployee(employee);
    setSettleForm({
      method: employee.balanceType === 'to_deposit' ? 'atm' : 'transfer',
      amount: employee.balanceAbs.toString(),
      notes: ''
    });
    setShowSettleModal(true);
    setError(null);
    setSuccess(null);
  };

  // Submit settlement
  const handleSettle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/settlement-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee.employeeId,
          period: selectedPeriod,
          amount: parseFloat(settleForm.amount),
          settlementMethod: settleForm.method,
          notes: settleForm.notes
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('✅ Rozliczenie zatwierdzone pomyślnie!');
        setShowSettleModal(false);
        fetchSettlements(); // Refresh data
      } else {
        setError(data.error || 'Błąd podczas zatwierdzania rozliczenia');
      }
    } catch (err) {
      console.error('Error submitting settlement:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setSubmitting(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Pracownik', 'Gotówka', 'Karta', 'BLIK', 'Suma', 'Wypłata', 'Bilans', 'Status'];
    const rows = filteredSettlements.map(s => [
      s.employeeName,
      s.cashCollected.toFixed(2),
      s.cardCollected.toFixed(2),
      s.blikCollected.toFixed(2),
      s.totalCollected.toFixed(2),
      s.salaryDue.toFixed(2),
      `${s.balanceType === 'to_deposit' ? '+' : '-'}${s.balanceAbs.toFixed(2)}`,
      s.status === 'pending' ? 'Do rozliczenia' : 'Rozliczone'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rozliczenia-${selectedPeriod}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <AdminLayout title="Rozliczenia">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Ładowanie rozliczeń...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="💰 Rozliczenia Pracowników" breadcrumbs={[{ label: 'Rozliczenia' }]}>
      <div className="max-w-7xl mx-auto">
          {/* Info */}
          <div className="mb-6">
            <p className="text-gray-600">Zarządzaj rozliczeniami gotówkowo-kartowymi pracowników</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Period selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📅 Okres</label>
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📊 Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Wszystkie</option>
                  <option value="pending">Do rozliczenia</option>
                  <option value="settled">Rozliczone</option>
                </select>
              </div>

              {/* Export button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">💾 Eksport</label>
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  📥 Eksportuj CSV
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {totals && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
                <p className="text-green-100 text-sm mb-2">💵 Gotówka zebrana</p>
                <p className="text-3xl font-bold">{totals.totalCashCollected.toFixed(0)} PLN</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
                <p className="text-blue-100 text-sm mb-2">💳 Karta zebrana</p>
                <p className="text-3xl font-bold">{totals.totalCardCollected.toFixed(0)} PLN</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                <p className="text-purple-100 text-sm mb-2">📱 BLIK zebrany</p>
                <p className="text-3xl font-bold">{totals.totalBlikCollected.toFixed(0)} PLN</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
                <p className="text-orange-100 text-sm mb-2">💰 Wypłaty należne</p>
                <p className="text-3xl font-bold">{totals.totalSalaryDue.toFixed(0)} PLN</p>
              </div>
            </div>
          )}

          {/* Settlements Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pracownik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      💵 Gotówka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      💳 Karta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📱 BLIK
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Suma zebrana
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wypłata
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bilans
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSettlements.map((settlement) => (
                    <tr key={settlement.employeeId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-semibold text-gray-900">{settlement.employeeName}</div>
                          <div className="text-sm text-gray-500">{settlement.visitCount} wizyt</div>
                          {/* Alerts */}
                          {settlement.alerts.paymentsWithoutSignature > 0 && (
                            <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              ⚠️ {settlement.alerts.paymentsWithoutSignature} bez podpisu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold">{settlement.cashCollected.toFixed(2)} PLN</div>
                        <div className="text-sm text-gray-500">{settlement.percentages.cash}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold">{settlement.cardCollected.toFixed(2)} PLN</div>
                        <div className="text-sm text-gray-500">{settlement.percentages.card}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold">{settlement.blikCollected.toFixed(2)} PLN</div>
                        <div className="text-sm text-gray-500">{settlement.percentages.blik}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-green-600">
                          {settlement.totalCollected.toFixed(2)} PLN
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold">{settlement.salaryDue.toFixed(2)} PLN</div>
                        {settlement.commission > 0 && (
                          <div className="text-xs text-gray-500">+{settlement.commission.toFixed(0)} PLN prowizja</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-lg font-bold ${
                          settlement.balanceType === 'to_deposit' ? 'text-orange-600' : 'text-blue-600'
                        }`}>
                          {settlement.balanceType === 'to_deposit' ? '+' : '-'}
                          {settlement.balanceAbs.toFixed(2)} PLN
                        </div>
                        <div className="text-sm text-gray-600">
                          {settlement.balanceType === 'to_deposit' ? 'DO WPŁATY' : 'DO WYPŁATY'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {settlement.status === 'pending' ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                            ⏳ Do rozliczenia
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                            ✅ Rozliczone
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {settlement.status === 'pending' ? (
                          <button
                            onClick={() => openSettleModal(settlement)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                          >
                            💰 Rozlicz
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSettlements.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Brak rozliczeń do wyświetlenia</p>
                </div>
              )}
            </div>
          </div>

          {/* Settlement Modal */}
          {showSettleModal && selectedEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4">💰 Rozlicz pracownika</h2>
                
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pracownik</p>
                  <p className="text-lg font-semibold">{selectedEmployee.employeeName}</p>
                  <p className="text-sm text-gray-600 mt-2">Bilans</p>
                  <p className={`text-2xl font-bold ${
                    selectedEmployee.balanceType === 'to_deposit' ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {selectedEmployee.balanceType === 'to_deposit' ? '+' : '-'}
                    {selectedEmployee.balanceAbs.toFixed(2)} PLN
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedEmployee.balanceType === 'to_deposit' 
                      ? 'Pracownik musi wpłacić tę kwotę' 
                      : 'Wypłać pracownikowi tę kwotę'}
                  </p>
                </div>

                <form onSubmit={handleSettle} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metoda rozliczenia
                    </label>
                    <select
                      value={settleForm.method}
                      onChange={(e) => setSettleForm({ ...settleForm, method: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="atm">🏧 Wpłatomat</option>
                      <option value="cash">💵 Gotówka do ręki</option>
                      <option value="transfer">💳 Przelew bankowy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kwota (PLN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settleForm.amount}
                      onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notatki (opcjonalnie)
                    </label>
                    <textarea
                      value={settleForm.notes}
                      onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Np. numer wpłatomatu, data przelewu..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSettleModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      disabled={submitting}
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300"
                      disabled={submitting}
                    >
                      {submitting ? '⏳ Zapisywanie...' : '✅ Potwierdź'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
  );
}
