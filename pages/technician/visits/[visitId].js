// pages/technician/visit/[visitId].js (plik powinien być w /visit/ nie /visits/)
// 🔧 Szczegóły wizyty dla technika
// ⚠️ Ten plik jest w złym katalogu - powinien być w pages/technician/visit/[visitId].js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TechnicianLayout from '../../../components/TechnicianLayout';

export default function VisitDetails() {
  const router = useRouter();
  const { visitId } = router.query;
  
  const [employee, setEmployee] = useState(null);
  const [visit, setVisit] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  // Status update
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    const employeeData = localStorage.getItem('technicianEmployee');

    if (!token || !employeeData) {
      router.push('/technician/login');
      return;
    }

    try {
      const emp = JSON.parse(employeeData);
      setEmployee(emp);
      
      if (visitId) {
        loadVisitDetails(token, visitId);
      }
    } catch (err) {
      console.error('❌ Auth error:', err);
      router.push('/technician/login');
    }
  }, [router, visitId]);

  const loadVisitDetails = async (token, visitId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Ładuję wizytę:', visitId);
      console.log('🔑 Token:', token ? 'Obecny' : 'BRAK');
      
      // Pobierz szczegóły wizyty
      const res = await fetch(`/api/technician/visits/${visitId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Status odpowiedzi:', res.status);
      
      const data = await res.json();
      console.log('📦 Dane z API:', data);

      if (data.success) {
        setVisit(data.visit);
        setOrder(data.order);
        setNewStatus(data.visit.status);
        console.log('✅ Wizyta załadowana:', data.visit.visitId);
      } else {
        console.error('❌ API error:', data.message);
        setError(data.message || 'Nie udało się załadować szczegółów wizyty');
      }
    } catch (err) {
      console.error('❌ Load error:', err);
      setError('Błąd połączenia z serwerem: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      alert('Wybierz status');
      return;
    }

    setUpdating(true);
    const token = localStorage.getItem('technicianToken');

    try {
      const res = await fetch(`/api/technician/visits/${visitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Status zaktualizowany');
        setShowStatusUpdate(false);
        setStatusNote('');
        loadVisitDetails(token, visitId);
      } else {
        alert('❌ ' + (data.message || 'Nie udało się zaktualizować'));
      }
    } catch (err) {
      console.error('❌ Update error:', err);
      alert('❌ Błąd połączenia');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'unscheduled': return 'bg-orange-100 text-orange-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-indigo-100 text-indigo-800';
      case 'waiting_parts': return 'bg-amber-100 text-amber-800';
      case 'ready': return 'bg-teal-100 text-teal-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return '⏳ Oczekuje na kontakt';
      case 'contacted': return '📞 Skontaktowano się';
      case 'unscheduled': return '📦 Nieprzypisane';
      case 'scheduled': return '📅 Umówiona wizyta';
      case 'confirmed': return '✅ Potwierdzona';
      case 'in_progress': return '🔧 W trakcie realizacji';
      case 'waiting_parts': return '🔩 Oczekuje na części';
      case 'ready': return '🎉 Gotowe do odbioru';
      case 'completed': return '✔️ Zakończone';
      case 'cancelled': return '❌ Anulowane';
      case 'no_show': return '👻 Nie stawił się';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie wizyty...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <TechnicianLayout employee={employee} currentPage="visits">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Błąd</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ← Wróć
            </button>
          </div>
        </div>
      </TechnicianLayout>
    );
  }

  if (!visit || !order) {
    return (
      <TechnicianLayout employee={employee} currentPage="visits">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-yellow-800 mb-2">Nie znaleziono wizyty</h2>
            <p className="text-yellow-600">Wizyta {visitId} nie istnieje lub została usunięta</p>
            <button
              onClick={() => router.push('/technician/schedule')}
              className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              ← Wróć do harmonogramu
            </button>
          </div>
        </div>
      </TechnicianLayout>
    );
  }

  return (
    <TechnicianLayout employee={employee} currentPage="visits">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 font-medium mb-2 flex items-center gap-2"
            >
              ← Wróć
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              🔧 Szczegóły wizyty
            </h1>
          </div>
          <div className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(visit.status)}`}>
            {getStatusLabel(visit.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Główne informacje */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wizyta */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📅 Informacje o wizycie
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">ID wizyty:</span>
                  <span className="font-semibold text-gray-800">{visit.visitId}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-semibold text-gray-800">{visit.scheduledDate}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Godzina:</span>
                  <span className="font-semibold text-gray-800">{visit.scheduledTime}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Czas trwania:</span>
                  <span className="font-semibold text-gray-800">{visit.estimatedDuration} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Typ:</span>
                  <span className="font-semibold text-gray-800 capitalize">{visit.type}</span>
                </div>
              </div>
            </div>

            {/* Klient */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                👤 Klient
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Imię i nazwisko:</span>
                  <span className="font-semibold text-gray-800">{order.clientName || order.name}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Telefon:</span>
                  <a href={`tel:${order.phone}`} className="font-semibold text-blue-600 hover:text-blue-800">
                    📞 {order.phone}
                  </a>
                </div>
                {order.email && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-600">Email:</span>
                    <a href={`mailto:${order.email}`} className="font-semibold text-blue-600 hover:text-blue-800">
                      {order.email}
                    </a>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Adres:</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">{order.address}</div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      🗺️ Otwórz w mapach
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Urządzenie */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🔧 Urządzenie
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Typ:</span>
                  <span className="font-semibold text-gray-800">{order.deviceType || order.device}</span>
                </div>
                {order.brand && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-600">Marka:</span>
                    <span className="font-semibold text-gray-800">{order.brand}</span>
                  </div>
                )}
                {order.model && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-semibold text-gray-800">{order.model}</span>
                  </div>
                )}
                {order.description && (
                  <div className="border-b pb-2">
                    <span className="text-gray-600 block mb-1">Opis problemu:</span>
                    <p className="text-gray-800">{order.description}</p>
                  </div>
                )}
                {order.notes && order.notes.length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-2">Notatki:</span>
                    <div className="space-y-2">
                      {order.notes.map((note, idx) => (
                        <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                          <div className="text-gray-500 text-xs">{note.date} - {note.author}</div>
                          <div className="text-gray-800">{note.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Akcje */}
          <div className="space-y-6">
            {/* Zmiana statusu */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4">⚙️ Akcje</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowStatusUpdate(!showStatusUpdate)}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                >
                  📝 Zmień status
                </button>
                <a
                  href={`tel:${order.phone}`}
                  className="block w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-center transition"
                >
                  📞 Zadzwoń do klienta
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-center transition"
                >
                  🗺️ Nawiguj
                </a>
              </div>
            </div>

            {/* Numer zlecenia */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-gray-800 mb-2">📋 Numer zlecenia</h3>
              <div className="text-2xl font-mono font-bold text-blue-600">
                {order.orderNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Modal zmiany statusu */}
        {showStatusUpdate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">📝 Zmień status wizyty</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nowy status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="scheduled">📅 Umówiona wizyta</option>
                    <option value="confirmed">✅ Potwierdzona</option>
                    <option value="in_progress">🔧 W trakcie realizacji</option>
                    <option value="waiting_parts">🔩 Oczekuje na części</option>
                    <option value="ready">🎉 Gotowe do odbioru</option>
                    <option value="completed">✔️ Zakończone</option>
                    <option value="cancelled">❌ Anulowane</option>
                    <option value="no_show">👻 Nie stawił się</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notatka (opcjonalnie):</label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Dodaj notatkę..."
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                  >
                    {updating ? '⏳ Zapisywanie...' : '✅ Zapisz'}
                  </button>
                  <button
                    onClick={() => {
                      setShowStatusUpdate(false);
                      setStatusNote('');
                      setNewStatus(visit.status);
                    }}
                    disabled={updating}
                    className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold disabled:opacity-50"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TechnicianLayout>
  );
}
