import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function AdminMagazynZamowienia() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected, ordered, delivered
  const [urgencyFilter, setUrgencyFilter] = useState('all'); // all, high, medium, low
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, urgencyFilter, employeeFilter, searchQuery, dateFrom, dateTo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsRes, employeesRes] = await Promise.all([
        fetch('/api/part-requests'),
        fetch('/api/employees')
      ]);

      const requestsData = await requestsRes.json();
      const employeesData = await employeesRes.json();

      setRequests(requestsData.requests || []);
      setEmployees(employeesData.employees || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(r => r.urgency === urgencyFilter);
    }

    // Employee filter
    if (employeeFilter !== 'all') {
      filtered = filtered.filter(r => r.requestedBy === employeeFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.requestId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requestedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.parts?.some(p => 
          p.partName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.partId?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(r => r.requestDate && new Date(r.requestDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(r => r.requestDate && new Date(r.requestDate) <= new Date(dateTo));
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.requestDate ? new Date(a.requestDate) : new Date(0);
      const dateB = b.requestDate ? new Date(b.requestDate) : new Date(0);
      return dateB - dateA;
    });

    setFilteredRequests(filtered);
  };

  const handleApprove = async (requestId) => {
    if (!confirm('Zatwierdzić to zamówienie?')) return;

    try {
      const res = await fetch(`/api/part-requests/approve?requestId=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approvedBy: 'ADMIN001',
          finalDelivery: 'paczkomat',
          logisticianNotes: 'Zatwierdzone przez administratora'
        })
      });

      if (res.ok) {
        alert('✅ Zamówienie zatwierdzone!');
        loadData();
      } else {
        const error = await res.json();
        alert('❌ Błąd: ' + (error.error || 'Nie można zatwierdzić'));
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('❌ Błąd: ' + error.message);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Podaj powód odrzucenia:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/part-requests/reject?requestId=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rejectedBy: 'ADMIN001',
          rejectionReason: reason
        })
      });

      if (res.ok) {
        alert('✅ Zamówienie odrzucone!');
        loadData();
      } else {
        alert('❌ Błąd podczas odrzucania');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('❌ Błąd: ' + error.message);
    }
  };

  const handleMarkOrdered = async (requestId) => {
    const trackingNumber = prompt('Podaj numer przesyłki (opcjonalnie):');

    try {
      const res = await fetch(`/api/part-requests/${requestId}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingNumber || null })
      });

      if (res.ok) {
        alert('✅ Zamówienie oznaczone jako zamówione!');
        loadData();
      } else {
        alert('❌ Błąd');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Błąd: ' + error.message);
    }
  };

  const handleMarkDelivered = async (requestId) => {
    if (!confirm('Oznaczyć jako dostarczone?')) return;

    try {
      const res = await fetch(`/api/part-requests/${requestId}/deliver`, {
        method: 'POST'
      });

      if (res.ok) {
        alert('✅ Zamówienie dostarczone!');
        loadData();
      } else {
        alert('❌ Błąd');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Błąd: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      approved: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      ordered: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      delivered: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    };
    return badges[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'OCZEKUJE',
      approved: 'ZATWIERDZONE',
      rejected: 'ODRZUCONE',
      ordered: 'ZAMÓWIONE',
      delivered: 'DOSTARCZONE'
    };
    return labels[status] || status;
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      high: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      low: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    };
    return badges[urgency] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  const getUrgencyLabel = (urgency) => {
    const labels = {
      high: 'PILNE',
      medium: 'ŚREDNIE',
      low: 'NISKIE'
    };
    return labels[urgency] || urgency;
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId || e.userId === employeeId);
    return emp ? emp.name : employeeId;
  };

  const exportToCSV = () => {
    const csv = [
      ['ID', 'Data', 'Pracownik', 'Status', 'Pilność', 'Części', 'Wartość'].join(','),
      ...filteredRequests.map(r => [
        r.requestId,
        r.requestDate ? new Date(r.requestDate).toLocaleDateString('pl-PL') : 'Brak daty',
        getEmployeeName(r.requestedBy),
        getStatusLabel(r.status),
        getUrgencyLabel(r.urgency),
        r.parts?.length || 0,
        (r.parts?.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) || 0).toFixed(2) + ' zł'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `zamowienia_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getTotalValue = () => {
    return filteredRequests.reduce((sum, r) => {
      return sum + (r.parts?.reduce((partSum, p) => partSum + (p.unitPrice * p.quantity), 0) || 0);
    }, 0);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wszystkie zamówienia</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Zarządzaj wszystkimi zamówieniami pracowników
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <DarkModeToggle />
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

        {/* Stats Bar */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredRequests.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Wyniki</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {requests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Oczekujące</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {requests.filter(r => r.status === 'approved').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Zatwierdzone</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {requests.filter(r => r.status === 'ordered').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Zamówione</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {getTotalValue().toFixed(2)} zł
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Wartość</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-4">
              {/* Search & Export */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Szukaj po ID, pracowniku, części..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Eksportuj CSV
                </button>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'rejected', 'ordered', 'delivered'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status === 'all' ? 'Wszystkie' : getStatusLabel(status)}
                  </button>
                ))}
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Wszystkie pilności</option>
                  <option value="high">Pilne</option>
                  <option value="medium">Średnie</option>
                  <option value="low">Niskie</option>
                </select>

                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Wszyscy pracownicy</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Data od"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Data do"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
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
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Brak zamówień</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Nie znaleziono zamówień pasujących do kryteriów.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.requestId} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.requestId}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyBadge(request.urgency)}`}>
                          {getUrgencyLabel(request.urgency)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {getEmployeeName(request.requestedBy)} • {request.requestDate ? new Date(request.requestDate).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Brak daty'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {(request.parts?.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) || 0).toFixed(2)} zł
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {request.parts?.length || 0} części
                      </div>
                    </div>
                  </div>

                  {/* Parts List */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Części:</div>
                    <div className="space-y-2">
                      {request.parts?.map((part, idx) => {
                        const unitPrice = part.unitPrice || 0;
                        const totalPrice = part.quantity * unitPrice;
                        return (
                          <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{part.partName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{part.partId}</div>
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {part.quantity} szt × {unitPrice.toFixed(2)} zł = <strong>{totalPrice.toFixed(2)} zł</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(request.requestId)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          ✓ Zatwierdź
                        </button>
                        <button
                          onClick={() => handleReject(request.requestId)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                        >
                          ✗ Odrzuć
                        </button>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <button
                        onClick={() => handleMarkOrdered(request.requestId)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                      >
                        📦 Oznacz jako zamówione
                      </button>
                    )}
                    {request.status === 'ordered' && (
                      <button
                        onClick={() => handleMarkDelivered(request.requestId)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        ✓ Oznacz jako dostarczone
                      </button>
                    )}
                    {request.trackingNumber && (
                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tracking:</span>{' '}
                        <span className="font-mono text-gray-900 dark:text-white">{request.trackingNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                      <div className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">Uwagi:</div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">{request.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AdminLayout>
  );
}
