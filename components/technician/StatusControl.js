import { useState } from 'react';

export default function StatusControl({ visit, onStatusChanged }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState('');

  // Get available next statuses based on current status
  const getAvailableStatuses = (currentStatus) => {
    const transitions = {
      scheduled: ['on_way', 'in_progress', 'cancelled', 'rescheduled'],
      on_way: ['in_progress', 'cancelled', 'rescheduled'],
      in_progress: ['paused', 'completed', 'cancelled'],
      paused: ['in_progress', 'cancelled'],
      completed: [],
      cancelled: [],
      rescheduled: ['scheduled']
    };
    return transitions[currentStatus] || [];
  };

  // Status configuration
  const statusConfig = {
    scheduled: {
      label: 'Zaplanowana',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    on_way: {
      label: 'W drodze',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    in_progress: {
      label: 'W trakcie',
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    paused: {
      label: 'Wstrzymana',
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    completed: {
      label: 'Zakończona',
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    cancelled: {
      label: 'Anulowana',
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    rescheduled: {
      label: 'Przełożona',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    }
  };

  const availableStatuses = getAvailableStatuses(visit.status);

  const handleStatusClick = (newStatus) => {
    // Statuses that require confirmation
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      setSelectedStatus(newStatus);
      setShowConfirmation(true);
    } else {
      updateStatus(newStatus, '');
    }
  };

  const updateStatus = async (newStatus, statusNotes) => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('technicianToken');

    try {
      const response = await fetch('/api/technician/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          status: newStatus,  // API expects 'status', not 'newStatus'
          notes: statusNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd aktualizacji statusu');
      }

      // Success! Call callback to refresh visit data
      if (onStatusChanged) {
        onStatusChanged(data.visit);
      }

      // Close confirmation modal
      setShowConfirmation(false);
      setSelectedStatus(null);
      setNotes('');

    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Błąd aktualizacji statusu');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    updateStatus(selectedStatus, notes);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedStatus(null);
    setNotes('');
    setError('');
  };

  if (availableStatuses.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center text-gray-600">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">Brak dostępnych akcji statusu</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Current status display */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Aktualny status:</p>
        <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${statusConfig[visit.status].color}`}>
          {statusConfig[visit.status].icon}
          <span className="ml-2 font-medium">{statusConfig[visit.status].label}</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Available status buttons */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Zmień status na:</p>
        <div className="space-y-2">
          {availableStatuses.map((status) => {
            const config = statusConfig[status];
            return (
              <button
                key={status}
                onClick={() => handleStatusClick(status)}
                disabled={loading}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-md hover:scale-105'
                } ${config.color}`}
              >
                <div className="flex items-center">
                  {config.icon}
                  <span className="ml-3 font-medium">{config.label}</span>
                </div>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Aktualizowanie statusu...</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusConfig[selectedStatus].color}`}>
                {statusConfig[selectedStatus].icon}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Potwierdź zmianę statusu
                </h3>
                <p className="text-sm text-gray-600">
                  {statusConfig[selectedStatus].label}
                </p>
              </div>
            </div>

            {selectedStatus === 'completed' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Wizyta zostanie oznaczona jako zakończona. Wszystkie sesje pracy zostaną zamknięte.
                </p>
              </div>
            )}

            {selectedStatus === 'cancelled' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Wizyta zostanie anulowana. Podaj powód anulowania.
                </p>
              </div>
            )}

            {/* Notes input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedStatus === 'cancelled' ? 'Powód anulowania (wymagany)' : 'Notatki (opcjonalne)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={
                  selectedStatus === 'cancelled'
                    ? 'np. Klient anulował wizytę'
                    : 'Dodatkowe informacje...'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || (selectedStatus === 'cancelled' && !notes.trim())}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Zapisywanie...' : 'Potwierdź'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
