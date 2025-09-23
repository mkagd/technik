// pages/zlecenie-szczegoly.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiTool,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiCamera,
  FiDollarSign
} from 'react-icons/fi';

export default function ZlecenieSzczegoly() {
  const router = useRouter();
  const { id } = router.query;
  const [employee, setEmployee] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeSession = localStorage.getItem('employeeSession');
      if (!employeeSession) {
        router.push('/pracownik-logowanie');
        return;
      }
      setEmployee(JSON.parse(employeeSession));
    }
  }, [router]);

  useEffect(() => {
    if (id) {
      // Mock danych zlecenia - w przyszłości zastąpić prawdziwymi danymi z API
      const mockOrderDetails = {
        1: {
          id: 1,
          orderNumber: 'ZL2025-001',
          client: {
            name: 'Jan Kowalski',
            phone: '+48 123 456 789',
            email: 'jan.kowalski@email.com',
            address: 'ul. Długa 5, 00-001 Warszawa'
          },
          service: {
            type: 'Naprawa pralki',
            device: 'Pralka Samsung WW70J5346MW',
            description: 'Pralka nie włącza się, brak reakcji na przyciski',
            category: 'AGD'
          },
          schedule: {
            date: '2025-09-23',
            time: '08:30',
            duration: '1-2 godziny',
            priority: 'Normalna'
          },
          status: {
            current: 'zaplanowane',
            label: 'Zaplanowane'
          },
          payment: {
            diagnostyka: 50,
            naprawa: 150,
            czesci: 80,
            total: 280,
            currency: 'PLN'
          },
          notes: 'Klient prosi o kontakt 30 min przed wizytą. Kod do bramy: 1234'
        },
        2: {
          id: 2,
          orderNumber: 'ZL2025-002',
          client: {
            name: 'Anna Nowak',
            phone: '+48 987 654 321',
            email: 'anna.nowak@email.com',
            address: 'ul. Krótka 12, 30-001 Kraków'
          },
          service: {
            type: 'Serwis zmywarki',
            device: 'Zmywarka Bosch SMS46GI01E',
            description: 'Zmywarka nie myje naczyń, słaba cyrkulacja wody',
            category: 'AGD'
          },
          schedule: {
            date: '2025-09-23',
            time: '10:00',
            duration: '2-3 godziny',
            priority: 'Wysoka'
          },
          status: {
            current: 'w_trakcie',
            label: 'W trakcie realizacji'
          },
          payment: {
            diagnostyka: 50,
            naprawa: 200,
            czesci: 120,
            total: 370,
            currency: 'PLN'
          },
          notes: 'Wymiana filtra i sprawdzenie pompy. Części dostępne w magazynie.'
        }
        // Dodaj więcej mock danych według potrzeb
      };

      const details = mockOrderDetails[id] || null;
      setOrderDetails(details);
      setIsLoading(false);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie szczegółów zlecenia...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Zlecenie nie zostało znalezione</h2>
          <p className="text-gray-600 mb-4">Zlecenie o ID {id} nie istnieje lub zostało usunięte.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Powróć
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'zaplanowane':
        return 'bg-blue-100 text-blue-800';
      case 'w_trakcie':
        return 'bg-yellow-100 text-yellow-800';
      case 'zakonczone':
        return 'bg-green-100 text-green-800';
      case 'anulowane':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Wysoka':
        return 'text-red-600';
      case 'Normalna':
        return 'text-blue-600';
      case 'Niska':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Szczegóły zlecenia #{orderDetails.orderNumber}
                </h1>
                <p className="text-sm text-gray-600">
                  {employee?.firstName} {employee?.lastName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderDetails.status.current)}`}>
                {orderDetails.status.label}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna - Główne informacje */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Informacje o kliencie */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="h-5 w-5 mr-2" />
                Informacje o kliencie
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Imię i nazwisko</label>
                  <p className="text-gray-900">{orderDetails.client.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefon</label>
                  <p className="text-gray-900 flex items-center">
                    <FiPhone className="h-4 w-4 mr-2" />
                    {orderDetails.client.phone}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900 flex items-center">
                    <FiMail className="h-4 w-4 mr-2" />
                    {orderDetails.client.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Adres</label>
                  <p className="text-gray-900 flex items-center">
                    <FiMapPin className="h-4 w-4 mr-2" />
                    {orderDetails.client.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Informacje o urządzeniu i usłudze */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiTool className="h-5 w-5 mr-2" />
                Szczegóły usługi
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Rodzaj usługi</label>
                  <p className="text-gray-900">{orderDetails.service.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Urządzenie</label>
                  <p className="text-gray-900">{orderDetails.service.device}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Opis problemu</label>
                  <p className="text-gray-900">{orderDetails.service.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Kategoria</label>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {orderDetails.service.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Notatki */}
            {orderDetails.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiFileText className="h-5 w-5 mr-2" />
                  Notatki
                </h2>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{orderDetails.notes}</p>
              </div>
            )}
          </div>

          {/* Prawa kolumna - Harmonogram i płatności */}
          <div className="space-y-6">
            
            {/* Harmonogram */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiCalendar className="h-5 w-5 mr-2" />
                Harmonogram
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FiCalendar className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Data wizyty</p>
                    <p className="font-medium">{new Date(orderDetails.schedule.date).toLocaleDateString('pl-PL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiClock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Godzina</p>
                    <p className="font-medium">{orderDetails.schedule.time}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiClock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Szacowany czas</p>
                    <p className="font-medium">{orderDetails.schedule.duration}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiAlertCircle className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Priorytet</p>
                    <p className={`font-medium ${getPriorityColor(orderDetails.schedule.priority)}`}>
                      {orderDetails.schedule.priority}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Płatności */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiDollarSign className="h-5 w-5 mr-2" />
                Rozliczenie
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Diagnostyka</span>
                  <span className="font-medium">{orderDetails.payment.diagnostyka} {orderDetails.payment.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Naprawa</span>
                  <span className="font-medium">{orderDetails.payment.naprawa} {orderDetails.payment.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Części</span>
                  <span className="font-medium">{orderDetails.payment.czesci} {orderDetails.payment.currency}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Razem</span>
                    <span className="font-bold text-lg text-green-600">
                      {orderDetails.payment.total} {orderDetails.payment.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Akcje */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Akcje</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <FiCheckCircle className="h-4 w-4 mr-2" />
                  Rozpocznij wizytę
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <FiPhone className="h-4 w-4 mr-2" />
                  Zadzwoń do klienta
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <FiCamera className="h-4 w-4 mr-2" />
                  Dodaj zdjęcia
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}