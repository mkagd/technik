import { useState, useEffect } from 'react';
import Link from 'next/link';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function SerwisantMojeZamowienia() {
  const [employeeId] = useState('EMP25189002'); // TODO: Get from auth
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, ordered, delivered
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let url = `/api/part-requests?requestedFor=${employeeId}`;
      if (filter !== 'all') url += `&status=${filter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Oczekujące' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Zatwierdzone' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Odrzucone' },
      ordered: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📦', label: 'Zamówione' },
      delivered: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🎉', label: 'Dostarczone' }
    };
    return badges[status] || badges.pending;
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      urgent: { bg: 'bg-red-100', text: 'text-red-800', label: '🔥 Pilne' },
      express: { bg: 'bg-orange-100', text: 'text-orange-800', label: '⚡ Express' },
      standard: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Standard' }
    };
    return badges[urgency] || badges.standard;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moje zamówienia</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Historia i status zamówień</p>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link
                href="/serwis/magazyn/zamow"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nowe zamówienie
              </Link>
              <Link href="/serwis/magazyn" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                ← Wróć
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex space-x-2">
            {['all', 'pending', 'approved', 'ordered', 'delivered'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Wszystkie' : getStatusBadge(status).label}
              </button>
            ))}
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
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Brak zamówień</h3>
            <p className="mt-1 text-sm text-gray-500">Nie masz jeszcze żadnych zamówień.</p>
            <div className="mt-6">
              <Link
                href="/serwis/magazyn/zamow"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Utwórz zamówienie
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const statusBadge = getStatusBadge(request.status);
              const urgencyBadge = getUrgencyBadge(request.urgency);

              return (
                <div key={request.requestId} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{request.requestId}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.icon} {statusBadge.label}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${urgencyBadge.bg} ${urgencyBadge.text}`}>
                            {urgencyBadge.label}
                          </span>
                          {request.isAdminOrder && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                              👨‍💼 Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{new Date(request.requestDate).toLocaleString('pl-PL')}</p>
                      </div>
                      {request.trackingNumber && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Tracking:</p>
                          <p className="font-mono text-sm font-medium text-gray-900">{request.trackingNumber}</p>
                        </div>
                      )}
                    </div>

                    {/* Parts */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Części ({request.parts?.length || 0}):</p>
                      <div className="space-y-2">
                        {request.parts?.map((part, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                            <div>
                              <p className="font-medium text-gray-900">{part.partId}</p>
                              {part.partName && <p className="text-sm text-gray-500">{part.partName}</p>}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{part.quantity} szt</p>
                              {part.estimatedPrice && (
                                <p className="text-sm text-gray-500">{(part.estimatedPrice * part.quantity).toFixed(2)} zł</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="flex items-center justify-between text-sm border-t pt-4">
                      <div>
                        <span className="text-gray-500">Dostawa:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {request.preferredDelivery === 'paczkomat' 
                            ? `📦 ${request.paczkomatId}` 
                            : '🏢 Biuro'}
                        </span>
                      </div>
                      {request.estimatedDeliveryDate && (
                        <div>
                          <span className="text-gray-500">Est. dostawa:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {new Date(request.estimatedDeliveryDate).toLocaleDateString('pl-PL')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes / Rejection Reason */}
                    {request.status === 'rejected' && request.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Powód odrzucenia:</span> {request.rejectionReason}
                        </p>
                      </div>
                    )}
                    {request.notes && request.status !== 'rejected' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Notatka:</span> {request.notes}
                        </p>
                      </div>
                    )}

                    {/* Timeline */}
                    {(request.approvedAt || request.orderedAt || request.deliveredAt) && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-medium text-gray-700 mb-2">Timeline:</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {request.approvedAt && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Zatw. {new Date(request.approvedAt).toLocaleDateString('pl-PL')}
                            </div>
                          )}
                          {request.orderedAt && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                              </svg>
                              Zam. {new Date(request.orderedAt).toLocaleDateString('pl-PL')}
                            </div>
                          )}
                          {request.deliveredAt && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                              </svg>
                              Dost. {new Date(request.deliveredAt).toLocaleDateString('pl-PL')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
