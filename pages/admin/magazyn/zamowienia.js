import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import DarkModeToggle from '../../../components/DarkModeToggle';
import { showToast } from '../../../utils/toast';

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
      const [requestsRes, employeesRes, ordersRes, visitsRes] = await Promise.all([
        fetch('/api/part-requests'),
        fetch('/api/employees'),
        fetch('/api/orders'),
        fetch('/api/visits')
      ]);

      const requestsData = await requestsRes.json();
      const employeesData = await employeesRes.json();
      const ordersData = await ordersRes.json();
      const visitsData = await visitsRes.json();

      // Wzbogać zamówienia o dane z orders i visits
      const enrichedRequests = (requestsData.requests || []).map(request => {
        let orderDetails = null;
        let visitDetails = null;

        // Znajdź powiązane zlecenie
        if (request.orderNumber || request.orderId) {
          const order = ordersData.orders?.find(o => 
            o.orderNumber === request.orderNumber || o.id === request.orderId
          );
          
          if (order) {
            orderDetails = {
              orderNumber: order.orderNumber,
              clientName: order.clientName,
              clientPhone: order.phone,
              address: order.address,
              deviceType: order.deviceType,
              deviceBrand: order.deviceBrand,
              deviceModel: order.deviceModel,
              serialNumber: order.serialNumber,
              description: order.description,
              models: order.models, // Modele zeskanowane przez technika
            };
          }
        }

        // Znajdź powiązaną wizytę
        if (request.visitId) {
          // Szukaj wizyty w zleceniach
          for (const order of (ordersData.orders || [])) {
            const visit = order.visits?.find(v => v.visitId === request.visitId);
            if (visit) {
              visitDetails = {
                visitId: visit.visitId,
                scheduledDate: visit.scheduledDate,
                status: visit.status,
                photos: visit.photos || [],
                notes: visit.notes,
                models: visit.models, // Modele dodane podczas wizyty
              };
              
              // Jeśli nie mamy orderDetails, weź z order
              if (!orderDetails && order) {
                orderDetails = {
                  orderNumber: order.orderNumber,
                  clientName: order.clientName,
                  clientPhone: order.phone,
                  address: order.address,
                  deviceType: order.deviceType,
                  deviceBrand: order.deviceBrand,
                  deviceModel: order.deviceModel,
                  serialNumber: order.serialNumber,
                  description: order.description,
                  models: order.models,
                };
              }
              break;
            }
          }
        }

        return {
          ...request,
          orderDetails,
          visitDetails,
          // Dodaj pola do łatwiejszego dostępu
          clientName: orderDetails?.clientName || request.clientName,
          clientPhone: orderDetails?.clientPhone,
          clientAddress: orderDetails?.address,
          deviceBrand: orderDetails?.deviceBrand || request.deviceInfo?.brand,
          deviceModel: orderDetails?.deviceModel || request.deviceInfo?.model,
          deviceType: orderDetails?.deviceType,
          deviceSerialNumber: orderDetails?.serialNumber || request.deviceInfo?.serialNumber,
          issueDescription: orderDetails?.description,
          scannedModels: visitDetails?.models || orderDetails?.models,
          attachedPhotos: request.attachedPhotos || visitDetails?.photos || [],
        };
      });

      setRequests(enrichedRequests);
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
      // Użyj ID logistyka (admin działa jako logistyk)
      const logisticEmployee = employees.find(e => e.role === 'logistics');
      const approvedById = logisticEmployee ? logisticEmployee.id : 'EMP25189001';
      
      console.log('🔍 Zatwierdzam jako:', approvedById);
      
      const res = await fetch(`/api/part-requests/approve?requestId=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approvedBy: approvedById,
          finalDelivery: 'paczkomat',
          logisticianNotes: 'Zatwierdzone przez administratora'
        })
      });

      if (res.ok) {
        showToast.success('Zamówienie zatwierdzone!');
        loadData();
        
        // Odśwież badge magazynu
        if (typeof window !== 'undefined' && window.refreshAdminBadges) {
          await window.refreshAdminBadges();
        }
      } else {
        const error = await res.json();
        showToast.error('Błąd: ' + (error.error || 'Nie można zatwierdzić'));
      }
    } catch (error) {
      console.error('Error approving:', error);
      showToast.error('Błąd: ' + error.message);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Podaj powód odrzucenia:');
    if (!reason) return;

    try {
      // Użyj ID logistyka (admin działa jako logistyk)
      const logisticEmployee = employees.find(e => e.role === 'logistics');
      const rejectedById = logisticEmployee ? logisticEmployee.id : 'EMP25189001';
      
      const res = await fetch(`/api/part-requests/reject?requestId=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rejectedBy: rejectedById,
          rejectionReason: reason
        })
      });

      if (res.ok) {
        showToast.success('Zamówienie odrzucone!');
        loadData();
        
        // Odśwież badge magazynu
        if (typeof window !== 'undefined' && window.refreshAdminBadges) {
          await window.refreshAdminBadges();
        }
      } else {
        showToast.error('Błąd podczas odrzucania');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      showToast.error('Błąd: ' + error.message);
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
        showToast.success('Zamówienie oznaczone jako zamówione!');
        loadData();
      } else {
        showToast.error('Błąd');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Błąd: ' + error.message);
    }
  };

  const handleMarkDelivered = async (requestId) => {
    showToast.confirm(
      'Oznaczyć zamówienie jako dostarczone?',
      async () => {
        try {
          const res = await fetch(`/api/part-requests/${requestId}/deliver`, {
            method: 'POST'
          });

          if (res.ok) {
            showToast.success('Zamówienie dostarczone!');
            loadData();
          } else {
            showToast.error('Błąd');
          }
        } catch (error) {
          console.error('Error:', error);
          showToast.error('Błąd: ' + error.message);
        }
      }
    );
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
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.requestId}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyBadge(request.urgency)}`}>
                          {getUrgencyLabel(request.urgency)}
                        </span>
                        {/* Link do zlecenia/wizyty */}
                        {(request.orderId || request.visitId) && (
                          <a
                            href={request.visitId ? `/admin/wizyty?search=${request.visitId}` : `/admin/zamowienia?search=${request.orderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            📋 {request.visitId || request.orderId}
                          </a>
                        )}
                      </div>
                      
                      {/* Informacje o pracowniku i datach */}
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">{getEmployeeName(request.requestedBy)}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            Utworzono: <strong>
                              {request.createdAt 
                                ? new Date(request.createdAt).toLocaleString('pl-PL', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Brak daty'}
                            </strong>
                          </span>
                        </div>
                        
                        {request.approvedAt && (
                          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              Zatwierdzone: {new Date(request.approvedAt).toLocaleString('pl-PL', { 
                                month: '2-digit', 
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        
                        {request.orderedAt && (
                          <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span>
                              Zamówione: {new Date(request.orderedAt).toLocaleString('pl-PL', { 
                                month: '2-digit', 
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        
                        {request.deliveredAt && (
                          <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>
                              Dostarczone: {new Date(request.deliveredAt).toLocaleString('pl-PL', { 
                                month: '2-digit', 
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
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

                  {/* 📋 Informacje o zleceniu i kliencie */}
                  {(request.orderDetails || request.clientName || request.deviceInfo) && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Klient */}
                        {(request.clientName || request.orderDetails?.clientName) && (
                          <div>
                            <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Klient
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="text-gray-900 dark:text-white font-medium">
                                {String(request.clientName || request.orderDetails?.clientName || 'Brak danych')}
                              </div>
                              {(request.clientPhone || request.orderDetails?.clientPhone) && (
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {String(request.clientPhone || request.orderDetails?.clientPhone)}
                                </div>
                              )}
                              {(request.clientAddress || request.orderDetails?.address) && (
                                <div className="flex items-start text-gray-600 dark:text-gray-400">
                                  <svg className="w-3.5 h-3.5 mr-1 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="flex-1">{String(request.clientAddress || request.orderDetails?.address)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Urządzenie */}
                        {(request.deviceInfo || request.deviceBrand || request.orderDetails?.deviceBrand) && (
                          <div>
                            <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              <svg className="w-4 h-4 mr-1.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Urządzenie
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="text-gray-900 dark:text-white font-medium">
                                {String(request.deviceBrand || request.orderDetails?.deviceBrand || 'Nieznana marka')}
                                {(request.deviceModel || request.orderDetails?.deviceModel) && 
                                  ` ${String(request.deviceModel || request.orderDetails?.deviceModel)}`
                                }
                              </div>
                              {(request.deviceType || request.orderDetails?.deviceType) && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  Typ: {String(request.deviceType || request.orderDetails?.deviceType)}
                                </div>
                              )}
                              {(request.deviceSerialNumber || request.orderDetails?.serialNumber) && (
                                <div className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                                  S/N: {String(request.deviceSerialNumber || request.orderDetails?.serialNumber)}
                                </div>
                              )}
                              {request.deviceInfo && (
                                <div className="text-gray-600 dark:text-gray-400 text-xs mt-1 italic">
                                  {typeof request.deviceInfo === 'string' 
                                    ? request.deviceInfo 
                                    : typeof request.deviceInfo === 'object' && request.deviceInfo !== null
                                      ? `${request.deviceInfo.brand || ''} ${request.deviceInfo.model || ''}`.trim() || JSON.stringify(request.deviceInfo)
                                      : ''
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Modele zeskanowane przez technika */}
                      {(request.scannedModels || request.orderDetails?.models || request.deviceModel) && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                          <div className="flex items-start">
                            <svg className="w-4 h-4 mr-1.5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Modele urządzeń (zeskanowane przez technika):
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(Array.isArray(request.scannedModels) ? request.scannedModels : 
                                  Array.isArray(request.orderDetails?.models) ? request.orderDetails.models :
                                  [request.deviceModel]).filter(Boolean).map((model, idx) => {
                                    // Określ tekst do wyświetlenia
                                    let displayText = 'Model';
                                    if (typeof model === 'string') {
                                      displayText = model;
                                    } else if (typeof model === 'object' && model !== null) {
                                      // Jeśli obiekt ma brand i model
                                      if (model.brand && model.model) {
                                        displayText = `${model.brand} ${model.model}`;
                                      } else if (model.model) {
                                        displayText = model.model;
                                      } else if (model.name) {
                                        displayText = model.name;
                                      } else if (model.brand) {
                                        displayText = model.brand;
                                      }
                                    }
                                    
                                    return (
                                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                        </svg>
                                        {displayText}
                                      </span>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Problem/Opis usterki */}
                      {(request.issueDescription || request.orderDetails?.description) && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                          <div className="flex items-start">
                            <svg className="w-4 h-4 mr-1.5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Opis usterki/problem:
                              </div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                {String(request.issueDescription || request.orderDetails?.description || '')}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notatki technika o zamówieniu */}
                      {request.notes && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                          <div className="flex items-start">
                            <svg className="w-4 h-4 mr-1.5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                💬 Notatka technika:
                              </div>
                              <div className="text-sm text-gray-900 dark:text-white italic bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                                "{String(request.notes)}"
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 📸 Galeria zdjęć z wizyty - PRIORYTET! */}
                  {request.attachedPhotos && request.attachedPhotos.length > 0 && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-sm font-bold text-green-900 dark:text-green-100">
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          📸 Dokumentacja fotograficzna z wizyty technika
                        </div>
                        <span className="text-xs font-semibold text-green-800 dark:text-green-200 bg-green-200 dark:bg-green-800 px-2 py-1 rounded">
                          {request.attachedPhotos.length} zdjęć
                        </span>
                      </div>
                      
                      <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded p-3 mb-3">
                        <p className="text-xs text-green-900 dark:text-green-100 font-medium">
                          💡 Zdjęcia dodane przez technika podczas wizyty - pomogą zweryfikować czy zamówiona część jest właściwa
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {request.attachedPhotos.map((photo, idx) => (
                          <a
                            key={idx}
                            href={typeof photo === 'string' ? photo : photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group block"
                          >
                            <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 transition-all shadow-sm hover:shadow-lg">
                              <img
                                src={typeof photo === 'string' ? photo : photo.url}
                                alt={photo.type || `Zdjęcie ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.png';
                                  e.target.onerror = null;
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-all flex items-center justify-center">
                              <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                            {/* Typ zdjęcia jako badge */}
                            {photo.type && (
                              <div className="absolute top-1 left-1 bg-gray-900/80 text-white text-xs px-2 py-0.5 rounded font-semibold">
                                {photo.type === 'before' && '📷 Przed'}
                                {photo.type === 'after' && '✅ Po'}
                                {photo.type === 'during' && '🔧 W trakcie'}
                                {photo.type === 'serial' && '🔢 S/N'}
                                {photo.type === 'problem' && '⚠️ Problem'}
                                {!['before', 'after', 'during', 'serial', 'problem'].includes(photo.type) && photo.type}
                              </div>
                            )}
                            {/* Numer zdjęcia */}
                            <div className="absolute bottom-1 right-1 bg-gray-900/80 text-white text-xs px-2 py-0.5 rounded font-mono">
                              {idx + 1}/{request.attachedPhotos.length}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 📦 Informacje o dostawie i płatności */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Miejsce dostawy */}
                      <div>
                        <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <svg className="w-4 h-4 mr-1.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Miejsce dostawy
                        </div>
                        <div className="space-y-1 text-sm">
                          {request.preferredDelivery === 'paczkomat' && (
                            <>
                              <div className="text-gray-900 dark:text-white font-medium">
                                📮 Paczkomat InPost
                              </div>
                              {request.paczkomatId && (
                                <div className="text-gray-600 dark:text-gray-400 font-mono text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded inline-block">
                                  {request.paczkomatId}
                                </div>
                              )}
                            </>
                          )}
                          {request.preferredDelivery === 'office' && (
                            <div className="text-gray-900 dark:text-white font-medium">
                              🏢 Biuro firmowe (adres z profilu pracownika)
                            </div>
                          )}
                          {request.preferredDelivery === 'custom' && (
                            <>
                              <div className="text-gray-900 dark:text-white font-medium">
                                📍 Inny adres
                              </div>
                              {request.alternativeAddress && (
                                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                  {request.alternativeAddress}
                                </div>
                              )}
                            </>
                          )}
                          {!request.preferredDelivery && (
                            <div className="text-gray-500 dark:text-gray-400 italic">
                              Nie określono
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Forma płatności */}
                      <div>
                        <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <svg className="w-4 h-4 mr-1.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Forma płatności za przesyłkę
                        </div>
                        <div className="space-y-1 text-sm">
                          {request.paymentMethod === 'prepaid' && (
                            <div className="text-gray-900 dark:text-white font-medium">
                              ✅ Przedpłata (przelew)
                            </div>
                          )}
                          {request.paymentMethod === 'cod' && (
                            <>
                              <div className="text-gray-900 dark:text-white font-medium">
                                📦 Pobranie (przy odbiorze)
                              </div>
                              <div className="text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded inline-block">
                                ⚠️ Dodatkowa opłata ~5 zł
                              </div>
                            </>
                          )}
                          {!request.paymentMethod && (
                            <div className="text-gray-500 dark:text-gray-400 italic">
                              Nie określono (domyślnie: przedpłata)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parts List with Images */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zamówione części:</div>
                    <div className="space-y-3">
                      {request.parts?.map((part, idx) => {
                        const unitPrice = part.unitPrice || part.northData?.price || 0;
                        const totalPrice = part.quantity * unitPrice;
                        const hasNorthData = part.northData;
                        const partImages = hasNorthData?.images || [];
                        
                        return (
                          <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700">
                              {/* Zdjęcie produktu z North */}
                              {partImages.length > 0 && (
                                <div className="flex-shrink-0">
                                  <img 
                                    src={partImages[0]}
                                    alt={part.partName || hasNorthData?.name}
                                    className="w-20 h-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                </div>
                              )}
                              
                              {/* Informacje o części */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {part.partName || hasNorthData?.name || 'Część'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {part.partId || part.partNumber || hasNorthData?.partNumber}
                                </div>
                                {hasNorthData?.sourceUrl && (
                                  <a 
                                    href={hasNorthData.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 mt-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Pokaż na North.pl
                                  </a>
                                )}
                              </div>
                              
                              {/* Cena */}
                              <div className="text-sm text-gray-900 dark:text-white text-right flex-shrink-0">
                                {part.quantity} szt × {unitPrice.toFixed(2)} zł
                                <div className="font-bold">{totalPrice.toFixed(2)} zł</div>
                              </div>
                            </div>
                            
                            {/* Galeria zdjęć produktu (jeśli więcej niż 1) */}
                            {partImages.length > 1 && (
                              <div className="px-3 pb-3 bg-gray-50 dark:bg-gray-700">
                                <div className="flex gap-2 overflow-x-auto">
                                  {partImages.slice(1).map((img, imgIdx) => (
                                    <a 
                                      key={imgIdx}
                                      href={img}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0"
                                    >
                                      <img 
                                        src={img}
                                        alt={`Zdjęcie ${imgIdx + 2}`}
                                        className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600 hover:opacity-75 transition-opacity"
                                        onError={(e) => e.target.style.display = 'none'}
                                      />
                                    </a>
                                  ))}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  📸 {partImages.length} zdjęć z North.pl
                                </div>
                              </div>
                            )}
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

                  {/* Logistician Notes - notatki magazyniera/admina */}
                  {request.logisticianNotes && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
                      <div className="text-xs font-medium text-purple-900 dark:text-purple-300 mb-1">📝 Notatki magazyniera:</div>
                      <div className="text-sm text-purple-700 dark:text-purple-400">{String(request.logisticianNotes)}</div>
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
