// pages/integracja-rezerwacji.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Calendar from 'react-calendar';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiLogOut,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiRefreshCw,
  FiUsers,
  FiTool
} from 'react-icons/fi';
import 'react-calendar/dist/Calendar.css';

export default function IntegracjaRezerwacji() {
  const [employee, setEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workSchedule, setWorkSchedule] = useState({});
  const [clientBookings, setClientBookings] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'accept', 'reject', 'complete'
  const router = useRouter();

  // Mock dane rezerwacji klientów
  const mockClientBookings = {
    '2024-01-15': [
      {
        id: 'booking_1',
        slotId: '2024-01-15_morning',
        clientName: 'Jan Kowalski',
        clientPhone: '+48 123 456 789',
        clientEmail: 'jan.kowalski@email.com',
        serviceType: 'Naprawa pralki',
        address: 'ul. Wrocławska 123, Kraków',
        description: 'Pralka Samsung nie wiruje, możliwy problem z silnikiem',
        estimatedDuration: 120,
        status: 'pending', // pending, confirmed, completed, cancelled
        priority: 'normal', // low, normal, high, urgent
        createdAt: '2024-01-10T10:30:00Z',
        preferredTime: '09:00',
        price: 150
      }
    ],
    '2024-01-16': [
      {
        id: 'booking_2',
        slotId: '2024-01-16_afternoon',
        clientName: 'Anna Nowak',
        clientPhone: '+48 987 654 321',
        clientEmail: 'anna.nowak@email.com',
        serviceType: 'Instalacja klimatyzacji',
        address: 'ul. Krakowska 45, Kraków',
        description: 'Montaż nowej klimatyzacji w salonie, mieszkanie 50m2',
        estimatedDuration: 180,
        status: 'confirmed',
        priority: 'high',
        createdAt: '2024-01-12T14:20:00Z',
        preferredTime: '14:00',
        price: 300
      },
      {
        id: 'booking_3',
        slotId: '2024-01-16_afternoon',
        clientName: 'Piotr Wiśniewski',
        clientPhone: '+48 555 666 777',
        clientEmail: 'piotr.wisniewski@email.com',
        serviceType: 'Naprawa zmywarki',
        address: 'ul. Długa 67, Kraków',
        description: 'Zmywarka Bosch - problem z odpływem wody',
        estimatedDuration: 90,
        status: 'pending',
        priority: 'normal',
        createdAt: '2024-01-13T16:45:00Z',
        preferredTime: '15:30',
        price: 120
      }
    ]
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeData = localStorage.getItem('employeeSession');
      if (!employeeData) {
        router.push('/pracownik-logowanie');
        return;
      }

      const parsedData = JSON.parse(employeeData);
      setEmployee(parsedData);

      // Załaduj harmonogram pracownika
      const savedSchedule = localStorage.getItem(`workSchedule_${parsedData.id}`);
      if (savedSchedule) {
        setWorkSchedule(JSON.parse(savedSchedule));
      }

      // Załaduj rezerwacje klientów (mock dane + localStorage)
      const savedBookings = localStorage.getItem('clientBookings');
      if (savedBookings) {
        const parsed = JSON.parse(savedBookings);
        setClientBookings({ ...mockClientBookings, ...parsed });
      } else {
        setClientBookings(mockClientBookings);
        localStorage.setItem('clientBookings', JSON.stringify(mockClientBookings));
      }
    }
  }, [router]);

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getSelectedDateSchedule = () => {
    const dateKey = formatDateKey(selectedDate);
    return workSchedule[dateKey] || [];
  };

  const getSelectedDateBookings = () => {
    const dateKey = formatDateKey(selectedDate);
    return clientBookings[dateKey] || [];
  };

  const getSlotBookings = (slotId) => {
    const dateKey = formatDateKey(selectedDate);
    const dayBookings = clientBookings[dateKey] || [];
    return dayBookings.filter(booking => booking.slotId === slotId);
  };

  const handleBookingAction = (booking, action) => {
    setSelectedSlot(booking);
    setActionType(action);
    setShowConfirmModal(true);
  };

  const confirmBookingAction = () => {
    if (!selectedSlot) return;

    const dateKey = formatDateKey(selectedDate);
    const updatedBookings = { ...clientBookings };

    if (!updatedBookings[dateKey]) {
      updatedBookings[dateKey] = [];
    }

    const bookingIndex = updatedBookings[dateKey].findIndex(b => b.id === selectedSlot.id);

    if (bookingIndex !== -1) {
      switch (actionType) {
        case 'accept':
          updatedBookings[dateKey][bookingIndex].status = 'confirmed';
          break;
        case 'reject':
          updatedBookings[dateKey][bookingIndex].status = 'cancelled';
          break;
        case 'complete':
          updatedBookings[dateKey][bookingIndex].status = 'completed';
          break;
      }
    }

    setClientBookings(updatedBookings);
    localStorage.setItem('clientBookings', JSON.stringify(updatedBookings));
    setShowConfirmModal(false);
    setSelectedSlot(null);
    setActionType('');
  };

  const getDayBookingStats = (date) => {
    const dateKey = formatDateKey(date);
    const dayBookings = clientBookings[dateKey] || [];

    return {
      total: dayBookings.length,
      pending: dayBookings.filter(b => b.status === 'pending').length,
      confirmed: dayBookings.filter(b => b.status === 'confirmed').length,
      completed: dayBookings.filter(b => b.status === 'completed').length,
      cancelled: dayBookings.filter(b => b.status === 'cancelled').length
    };
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const stats = getDayBookingStats(date);

      if (stats.total === 0) return '';

      if (stats.pending > 0) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      if (stats.confirmed > 0) return 'bg-blue-100 border-blue-300 text-blue-800';
      if (stats.completed > 0) return 'bg-green-100 border-green-300 text-green-800';

      return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'completed': return 'bg-green-100 border-green-300 text-green-800';
      case 'cancelled': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Oczekuje';
      case 'confirmed': return 'Potwierdzona';
      case 'completed': return 'Zakończona';
      case 'cancelled': return 'Anulowana';
      default: return 'Nieznany';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-gray-600';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie systemu rezerwacji...</p>
        </div>
      </div>
    );
  }

  const selectedDateSchedule = getSelectedDateSchedule();
  const selectedDateBookings = getSelectedDateBookings();
  const dayStats = getDayBookingStats(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <FiUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Integracja Rezerwacji z Kalendarzem
                </h1>
                <p className="text-gray-600">
                  {employee.firstName} {employee.lastName} - Zarządzanie rezerwacjami klientów
                </p>
                <p className="text-sm text-gray-500">
                  Specjalizacje: {employee.specialization.join(', ')}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/kalendarz-pracownika')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Kalendarz
              </button>
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Panel główny
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('employeeSession');
                  router.push('/pracownik-logowanie');
                }}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiLogOut className="h-4 w-4 mr-2" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>

        {/* Statystyki dnia */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <FiCalendar className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Wszystkie</p>
                <p className="text-xl font-bold text-gray-900">{dayStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <FiClock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Oczekujące</p>
                <p className="text-xl font-bold text-yellow-600">{dayStats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <FiCheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Potwierdzone</p>
                <p className="text-xl font-bold text-blue-600">{dayStats.confirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <FiCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Zakończone</p>
                <p className="text-xl font-bold text-green-600">{dayStats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <FiXCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Anulowane</p>
                <p className="text-xl font-bold text-red-600">{dayStats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kalendarz */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Kalendarz Rezerwacji</h2>
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-1"></div>
                  <span>Oczekujące</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></div>
                  <span>Potwierdzone</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
                  <span>Zakończone</span>
                </div>
              </div>
            </div>

            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={tileClassName}
              className="w-full"
              locale="pl-PL"
            />
          </div>

          {/* Rezerwacje na wybrany dzień */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Rezerwacje na {selectedDate.toLocaleDateString('pl-PL')}
                </h2>
                <p className="text-gray-600">
                  {selectedDate.toLocaleDateString('pl-PL', { weekday: 'long' })}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FiRefreshCw className="h-4 w-4 mr-1" />
                Odśwież
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedDateBookings.length === 0 ? (
                <div className="text-center py-8">
                  <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Brak rezerwacji na ten dzień</p>
                </div>
              ) : (
                selectedDateBookings
                  .sort((a, b) => a.preferredTime.localeCompare(b.preferredTime))
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className={`p-4 rounded-lg border-2 ${getStatusColor(booking.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900">{booking.clientName}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                            <span className={`text-xs font-medium ${getPriorityColor(booking.priority)}`}>
                              {booking.priority.toUpperCase()}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <FiTool className="h-4 w-4 mr-2" />
                              <span>{booking.serviceType}</span>
                            </div>
                            <div className="flex items-center">
                              <FiClock className="h-4 w-4 mr-2" />
                              <span>{booking.preferredTime} ({booking.estimatedDuration} min)</span>
                            </div>
                            <div className="flex items-center">
                              <FiMapPin className="h-4 w-4 mr-2" />
                              <span>{booking.address}</span>
                            </div>
                            <div className="flex items-center">
                              <FiPhone className="h-4 w-4 mr-2" />
                              <span>{booking.clientPhone}</span>
                            </div>
                            <div className="flex items-center">
                              <FiMail className="h-4 w-4 mr-2" />
                              <span>{booking.clientEmail}</span>
                            </div>
                          </div>

                          {booking.description && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                              <strong>Opis:</strong> {booking.description}
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">
                              Cena: {booking.price} zł
                            </span>
                            <span className="text-xs text-gray-500">
                              Zgłoszono: {new Date(booking.createdAt).toLocaleDateString('pl-PL')}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-1 ml-4">
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleBookingAction(booking, 'accept')}
                                className="p-2 text-green-600 hover:bg-green-100 rounded"
                                title="Potwierdź rezerwację"
                              >
                                <FiCheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleBookingAction(booking, 'reject')}
                                className="p-2 text-red-600 hover:bg-red-100 rounded"
                                title="Odrzuć rezerwację"
                              >
                                <FiXCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleBookingAction(booking, 'complete')}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                              title="Oznacz jako zakończoną"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedSlot(booking);
                              setShowBookingModal(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Pokaż szczegóły"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Harmonogram pracownika na dany dzień */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Twój harmonogram pracy na {selectedDate.toLocaleDateString('pl-PL')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedDateSchedule.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nie masz zaplanowanego harmonogramu na ten dzień</p>
                <button
                  onClick={() => router.push('/kalendarz-pracownika')}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Dodaj harmonogram
                </button>
              </div>
            ) : (
              selectedDateSchedule
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((slot) => {
                  const slotBookings = getSlotBookings(slot.id);
                  const isOverbooked = slotBookings.length > (slot.maxBookings || 1);

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-lg border-2 ${slot.isAvailable
                          ? isOverbooked
                            ? 'border-red-200 bg-red-50'
                            : 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        {isOverbooked && (
                          <FiAlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                      </div>

                      {slot.note && (
                        <div className="text-sm text-gray-600 mb-2">{slot.note}</div>
                      )}

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Status: {slot.isAvailable ? 'Dostępny' : 'Niedostępny'}</div>
                        <div>
                          Rezerwacje: {slotBookings.length} / {slot.maxBookings || 1}
                        </div>
                        {slotBookings.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {slotBookings.map(booking => (
                              <div key={booking.id} className="text-xs bg-white p-1 rounded">
                                {booking.clientName} - {booking.serviceType}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Modal szczegółów rezerwacji */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Szczegóły rezerwacji</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Klient</label>
                  <p className="text-gray-900">{selectedSlot.clientName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(selectedSlot.status)}`}>
                    {getStatusText(selectedSlot.status)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Usługa</label>
                <p className="text-gray-900">{selectedSlot.serviceType}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <p className="text-gray-900">{selectedSlot.clientPhone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedSlot.clientEmail}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Adres</label>
                <p className="text-gray-900">{selectedSlot.address}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferowana godzina</label>
                  <p className="text-gray-900">{selectedSlot.preferredTime}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Czas trwania</label>
                  <p className="text-gray-900">{selectedSlot.estimatedDuration} min</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cena</label>
                  <p className="text-gray-900 font-medium text-green-600">{selectedSlot.price} zł</p>
                </div>
              </div>

              {selectedSlot.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Opis problemu</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedSlot.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priorytet</label>
                  <p className={`font-medium ${getPriorityColor(selectedSlot.priority)}`}>
                    {selectedSlot.priority.toUpperCase()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data zgłoszenia</label>
                  <p className="text-gray-900">
                    {new Date(selectedSlot.createdAt).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Zamknij
              </button>
              {selectedSlot.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowBookingModal(false);
                      handleBookingAction(selectedSlot, 'accept');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Potwierdź
                  </button>
                  <button
                    onClick={() => {
                      setShowBookingModal(false);
                      handleBookingAction(selectedSlot, 'reject');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Odrzuć
                  </button>
                </>
              )}
              {selectedSlot.status === 'confirmed' && (
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    handleBookingAction(selectedSlot, 'complete');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Oznacz jako zakończoną
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal potwierdzenia akcji */}
      {showConfirmModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Potwierdzenie</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">
                Czy na pewno chcesz{' '}
                {actionType === 'accept' && 'potwierdzić'}
                {actionType === 'reject' && 'odrzucić'}
                {actionType === 'complete' && 'oznaczyć jako zakończoną'}
                {' '}rezerwację dla <strong>{selectedSlot.clientName}</strong>?
              </p>

              <div className="mt-2 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">
                  <div>Usługa: {selectedSlot.serviceType}</div>
                  <div>Data: {selectedDate.toLocaleDateString('pl-PL')}</div>
                  <div>Godzina: {selectedSlot.preferredTime}</div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={confirmBookingAction}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${actionType === 'accept'
                    ? 'bg-green-600 hover:bg-green-700'
                    : actionType === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                Potwierdź
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
