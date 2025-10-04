import { useState, useEffect } from 'react';
import Link from 'next/link';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function LogistykaZamowienia() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, urgent, all
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let url = '/api/part-requests';
      if (filter === 'pending') url += '?status=pending';
      if (filter === 'urgent') url += '?urgency=urgent&status=pending';
      
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm('Czy na pewno zatwierdzić to zamówienie?')) return;

    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/part-requests/approve?requestId=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: 'EMPLOGISTYK001', // TODO: Get from auth
          finalDelivery: 'paczkomat',
          paczkomatId: 'KRA01M',
          logisticianNotes: 'Zatwierdzone'
        })
      });

      if (res.ok) {
        alert('✅ Zamówienie zatwierdzone!');
        loadRequests();
      } else {
        alert('❌ Błąd podczas zatwierdzania');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('❌ Błąd: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Podaj powód odrzucenia:');
    if (!reason) return;

    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/part-requests/reject?requestId=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectedBy: 'EMPLOGISTYK001', // TODO: Get from auth
          rejectionReason: reason
        })
      });

      if (res.ok) {
        alert('✅ Zamówienie odrzucone!');
        loadRequests();
      } else {
        alert('❌ Błąd podczas odrzucania');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('❌ Błąd: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      ordered: 'bg-blue-100 text-blue-800',
      delivered: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      urgent: 'bg-red-100 text-red-800',
      express: 'bg-orange-100 text-orange-800',
      standard: 'bg-blue-100 text-blue-800'
    };
    return badges[urgency] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zamówienia do zatwierdzenia</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Panel Logistyka</p>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link href="/logistyka/magazyn" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                ← Wróć do dashboardu
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Oczekujące
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'urgent'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🔥 Pilne
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Wszystkie
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Brak zamówień</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Nie ma zamówień do zatwierdzenia.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.requestId} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{request.requestId}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyBadge(request.urgency)}`}>
                          {request.urgency}
                        </span>
                        {request.isAdminOrder && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            Admin Order
                          </span>
                        )}
                      </div>

                      {/* Employee Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Zamówił:</p>
                          <p className="font-medium text-gray-900 dark:text-white">{request.requestedBy}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Dla:</p>
                          <p className="font-medium text-gray-900 dark:text-white">{request.requestedFor}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Data:</p>
                          <p className="font-medium text-gray-900 dark:text-white">{new Date(request.requestDate).toLocaleString('pl-PL')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Dostawa:</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.preferredDelivery === 'paczkomat' ? `📦 ${request.paczkomatId}` : '🏢 Biuro'}
                          </p>
                        </div>
                      </div>

                      {/* Parts List */}
                      <div className="border-t dark:border-gray-700 pt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Części ({request.parts?.length || 0}):</p>
                        <div className="space-y-2">
                          {request.parts?.map((part, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{part.partId}</p>
                                {part.partName && <p className="text-sm text-gray-500 dark:text-gray-400">{part.partName}</p>}
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900 dark:text-white">{part.quantity} szt</p>
                                {part.estimatedPrice && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{(part.estimatedPrice * part.quantity).toFixed(2)} zł</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Photos Gallery */}
                      {request.attachedPhotos && request.attachedPhotos.length > 0 && (
                        <div className="mt-4 border-t dark:border-gray-700 pt-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            📸 Zdjęcia części ({request.attachedPhotos.length})
                          </p>
                          <div className="grid grid-cols-5 gap-3">
                            {request.attachedPhotos.map((photo, idx) => (
                              <div key={idx} className="group relative">
                                <a 
                                  href={photo.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={photo.url}
                                    alt={`Zdjęcie ${idx + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer"
                                    onError={(e) => {
                                      e.target.src = '/placeholder-image.png';
                                      e.target.onerror = null;
                                    }}
                                  />
                                  {/* Overlay on hover */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                  </div>
                                </a>
                                {/* Photo info */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-b-lg">
                                  <p className="truncate">{photo.originalName || `Zdjęcie ${idx + 1}`}</p>
                                  <p className="text-gray-300">{(photo.size / 1024).toFixed(0)} KB</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            💡 Kliknij na zdjęcie aby powiększyć
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {request.notes && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <p className="text-sm text-gray-700 dark:text-blue-300">
                            <span className="font-medium">Notatka:</span> {request.notes}
                          </p>
                        </div>
                      )}

                      {/* Admin Order Reason */}
                      {request.isAdminOrder && request.adminOrderReason && (
                        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <span className="font-medium">Powód (Admin):</span> {request.adminOrderReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {request.status === 'pending' && (
                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => handleApprove(request.requestId)}
                          disabled={actionLoading === request.requestId}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {actionLoading === request.requestId ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          Zatwierdź
                        </button>
                        <button
                          onClick={() => handleReject(request.requestId)}
                          disabled={actionLoading === request.requestId}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Odrzuć
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
