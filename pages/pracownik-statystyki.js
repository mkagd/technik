









// pages/pracownik-statystyki.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiLogOut,
  FiTrendingUp,
  FiDollarSign,
  FiStar,
  FiMapPin,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiEye
} from 'react-icons/fi';

export default function PracownikStatystyki() {
  const [employee, setEmployee] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalEarnings: 0,
    averageRating: 0,
    thisWeekJobs: 0
  });
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const router = useRouter();

  // Sprawdź autoryzację
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeData = localStorage.getItem('employeeSession');
      if (!employeeData) {
        router.push('/pracownik-logowanie');
        return;
      }

      const parsedData = JSON.parse(employeeData);
      setEmployee(parsedData);

      // Załaduj przypisane zadania (symulowane dane)
      const mockAssignments = generateMockAssignments(parsedData.id);
      setAssignments(mockAssignments);

      // Oblicz statystyki
      calculateStats(mockAssignments);
    }
  }, [router]);

  const generateMockAssignments = (employeeId) => {
    const mockData = [
      {
        id: 1,
        clientName: 'Anna Kowalska',
        clientPhone: '+48 123 456 789',
        clientEmail: 'anna.kowalska@email.com',
        address: 'ul. Słoneczna 15, Warszawa',
        serviceType: 'Naprawa pralki',
        device: 'Pralka Samsung WW70K5410UW',
        scheduledDate: '2024-12-30',
        scheduledTime: '10:00',
        status: 'pending',
        priority: 'normal',
        description: 'Pralka nie wykręca. Prawdopodobnie problem z pompą odpływową.',
        estimatedDuration: 120,
        price: 150,
        assignedAt: '2024-12-28T09:00:00'
      },
      {
        id: 2,
        clientName: 'Marek Nowak',
        clientPhone: '+48 987 654 321',
        clientEmail: 'marek.nowak@email.com',
        address: 'ul. Długa 42, Kraków',
        serviceType: 'Instalacja elektryczna',
        device: 'Oświetlenie LED',
        scheduledDate: '2024-12-29',
        scheduledTime: '14:00',
        status: 'completed',
        priority: 'high',
        description: 'Montaż nowego oświetlenia w salonie.',
        estimatedDuration: 180,
        price: 320,
        assignedAt: '2024-12-26T14:30:00',
        completedAt: '2024-12-29T16:30:00',
        rating: 5,
        clientFeedback: 'Bardzo profesjonalna obsługa, polecam!'
      },
      {
        id: 3,
        clientName: 'Piotr Wiśniewski',
        clientPhone: '+48 555 333 111',
        clientEmail: 'piotr.wisniewski@email.com',
        address: 'ul. Krótka 8, Gdańsk',
        serviceType: 'Naprawa AGD',
        device: 'Zmywarka Bosch SMS46KI03E',
        scheduledDate: '2024-12-31',
        scheduledTime: '09:00',
        status: 'confirmed',
        priority: 'normal',
        description: 'Zmywarka nie nagrzewa wody.',
        estimatedDuration: 90,
        price: 200,
        assignedAt: '2024-12-27T11:15:00'
      },
      {
        id: 4,
        clientName: 'Katarzyna Zielińska',
        clientPhone: '+48 777 888 999',
        clientEmail: 'katarzyna.zielinska@email.com',
        address: 'ul. Nowa 25, Wrocław',
        serviceType: 'Serwis elektroniki',
        device: 'Telewizor LG 55UN7300',
        scheduledDate: '2024-12-28',
        scheduledTime: '11:00',
        status: 'completed',
        priority: 'low',
        description: 'Telewizor nie włącza się.',
        estimatedDuration: 60,
        price: 120,
        assignedAt: '2024-12-25T16:00:00',
        completedAt: '2024-12-28T12:00:00',
        rating: 4,
        clientFeedback: 'Szybko i sprawnie naprawione.'
      }
    ];

    return mockData;
  };

  const calculateStats = (assignments) => {
    const totalJobs = assignments.length;
    const completedJobs = assignments.filter(a => a.status === 'completed').length;
    const pendingJobs = assignments.filter(a => a.status === 'pending').length;
    const totalEarnings = assignments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + a.price, 0);

    const ratingsSum = assignments
      .filter(a => a.rating)
      .reduce((sum, a) => sum + a.rating, 0);
    const ratingsCount = assignments.filter(a => a.rating).length;
    const averageRating = ratingsCount > 0 ? (ratingsSum / ratingsCount).toFixed(1) : 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekJobs = assignments.filter(a =>
      new Date(a.scheduledDate) >= oneWeekAgo
    ).length;

    setStats({
      totalJobs,
      completedJobs,
      pendingJobs,
      totalEarnings,
      averageRating,
      thisWeekJobs
    });
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('employeeSession');
    }
    router.push('/pracownik-logowanie');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Oczekujące';
      case 'confirmed': return 'Potwierdzone';
      case 'completed': return 'Zakończone';
      case 'cancelled': return 'Anulowane';
      default: return 'Nieznany';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'normal': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <FiTrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Statystyki i Zadania
                </h1>
                <p className="text-gray-600">
                  {employee.firstName} {employee.lastName}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kalendarz
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiLogOut className="h-4 w-4 mr-2" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiCalendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Wszystkie</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Zakończone</p>
                <p className="text-xl font-bold text-gray-900">{stats.completedJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FiClock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Oczekujące</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiDollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Zarobki</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalEarnings} zł</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FiStar className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Ocena</p>
                <p className="text-xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FiTrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Ten tydzień</p>
                <p className="text-xl font-bold text-gray-900">{stats.thisWeekJobs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Przypisane zadania ({assignments.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data / Godzina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usługa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {new Date(assignment.scheduledDate).toLocaleDateString('pl-PL')}
                        </div>
                        <div className="text-gray-500">{assignment.scheduledTime}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.clientName}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <FiPhone className="h-3 w-3 mr-1" />
                        {assignment.clientPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{assignment.serviceType}</div>
                      <div className="text-gray-500">{assignment.device}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiMapPin className="h-3 w-3 mr-1" />
                        {assignment.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                        {assignment.priority !== 'normal' && (
                          <span className={`text-xs font-medium ${getPriorityColor(assignment.priority)}`}>
                            {assignment.priority === 'high' ? 'Wysoki' : 'Niski'} priorytet
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {assignment.price} zł
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assignment Details Modal */}
      {showDetailsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Szczegóły zadania</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Data i godzina</p>
                  <p className="font-medium">
                    {new Date(selectedAssignment.scheduledDate).toLocaleDateString('pl-PL')} o {selectedAssignment.scheduledTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAssignment.status)}`}>
                    {getStatusText(selectedAssignment.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Klient</p>
                  <p className="font-medium">{selectedAssignment.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefon</p>
                  <p className="font-medium">{selectedAssignment.clientPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedAssignment.clientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cena</p>
                  <p className="font-medium">{selectedAssignment.price} zł</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Adres</p>
                <p className="font-medium">{selectedAssignment.address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Typ usługi</p>
                <p className="font-medium">{selectedAssignment.serviceType}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Urządzenie</p>
                <p className="font-medium">{selectedAssignment.device}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Opis problemu</p>
                <p className="font-medium">{selectedAssignment.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Szacowany czas realizacji</p>
                <p className="font-medium">{selectedAssignment.estimatedDuration} minut</p>
              </div>

              {selectedAssignment.status === 'completed' && selectedAssignment.rating && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Ocena klienta</p>
                    <div className="flex items-center">
                      <span className="text-yellow-400">⭐</span>
                      <span className="ml-1 font-medium">{selectedAssignment.rating}/5</span>
                    </div>
                  </div>
                  {selectedAssignment.clientFeedback && (
                    <div>
                      <p className="text-sm text-gray-600">Opinia klienta</p>
                      <p className="font-medium italic">"{selectedAssignment.clientFeedback}"</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
