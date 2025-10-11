// pages/historia-napraw.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  FiTool, FiCalendar, FiClock, FiMapPin, FiPhone, FiUser,
  FiCheckCircle, FiAlertCircle, FiLoader, FiEye, FiDownload,
  FiFilter, FiSearch, FiArrowLeft, FiStar, FiDollarSign, FiEdit,
  FiTrash2, FiPlus, FiSave
} from 'react-icons/fi';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function HistoriaNapraw() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [filteredRepairs, setFilteredRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Sprawdzenie czy użytkownik jest zalogowany
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        router.push('/client/login?returnUrl=/historia-napraw');
        return;
      }

      const userData = JSON.parse(currentUser);
      setUser(userData);

      // Symulacja danych historii napraw
      const mockRepairs = [
        {
          id: 1,
          date: '2024-06-15T10:30:00',
          completedDate: '2024-06-15T14:45:00',
          category: 'Naprawa AGD',
          service: 'Naprawa zmywarek',
          device: 'Bosch SMS46GI55E',
          problem: 'Nie uruchamia się, błąd E15',
          solution: 'Wymieniono pompe odpływową i czujnik poziomu wody',
          technician: 'Jan Kowalski',
          technicianPhone: '+48 123 456 789',
          status: 'completed',
          rating: 5,
          price: 219,
          warranty: 12,
          address: userData.address + ', ' + userData.city,
          invoiceNumber: 'FV/2024/06/001',
          photos: ['before.jpg', 'during.jpg', 'after.jpg'],
          duration: 255, // 4 hours 15 minutes
          priority: 'high',
          parts: [
            { name: 'Pompa odpływowa', price: 85 },
            { name: 'Czujnik poziomu wody', price: 45 }
          ]
        },
        {
          id: 2,
          date: '2024-05-20T09:00:00',
          completedDate: '2024-05-20T11:30:00',
          category: 'Elektryk',
          service: 'Instalacje elektryczne',
          device: 'Panel elektryczny',
          problem: 'Wymiana starego rozdzielnika',
          solution: 'Zainstalowano nowy rozdzielnik z zabezpieczeniami B16',
          technician: 'Piotr Nowak',
          technicianPhone: '+48 987 654 321',
          status: 'completed',
          rating: 5,
          price: 350,
          warranty: 24,
          address: userData.address + ', ' + userData.city,
          invoiceNumber: 'FV/2024/05/032',
          photos: ['old_panel.jpg', 'new_panel.jpg'],
          duration: 150, // 2 hours 30 minutes
          priority: 'normal',
          parts: [
            { name: 'Rozdzielnik 12-modułowy', price: 120 },
            { name: 'Wyłączniki B16 (6szt)', price: 90 },
            { name: 'Przewody instalacyjne', price: 40 }
          ]
        },
        {
          id: 3,
          date: '2024-04-10T14:00:00',
          completedDate: '2024-04-10T16:15:00',
          category: 'Hydraulik',
          service: 'Wymiana kranów',
          device: 'Kran kuchenny',
          problem: 'Przeciek z podstawy kranu',
          solution: 'Wymieniono uszczelki i O-ringi, sprawdzono ciśnienie',
          technician: 'Marek Wiśniewski',
          technicianPhone: '+48 555 777 999',
          status: 'completed',
          rating: 4,
          price: 150,
          warranty: 6,
          address: userData.address + ', ' + userData.city,
          invoiceNumber: 'FV/2024/04/078',
          photos: ['leak_before.jpg', 'repair_process.jpg', 'fixed_tap.jpg'],
          duration: 135, // 2 hours 15 minutes
          priority: 'normal',
          parts: [
            { name: 'Zestaw uszczelek', price: 25 },
            { name: 'O-ring 12mm', price: 8 }
          ]
        },
        {
          id: 4,
          date: '2024-03-05T11:00:00',
          completedDate: null,
          category: 'Popularne',
          service: 'Naprawa pralek',
          device: 'Samsung WW70J5346MW',
          problem: 'Pralka nie wiruje, hałasuje podczas prania',
          solution: 'W trakcie diagnozy - prawdopodobnie uszkodzone łożyska',
          technician: 'Anna Kowal',
          technicianPhone: '+48 111 222 333',
          status: 'in_progress',
          rating: null,
          price: 219,
          warranty: null,
          address: userData.address + ', ' + userData.city,
          invoiceNumber: null,
          photos: ['diagnosis.jpg'],
          duration: 120, // estimated 2 hours
          priority: 'high',
          parts: []
        }
      ];

      setRepairs(mockRepairs);
      setFilteredRepairs(mockRepairs);
      setLoading(false);
    }
  }, [router]);

  // Filtrowanie napraw
  useEffect(() => {
    let filtered = repairs;

    // Filtr po statusie
    if (statusFilter !== 'all') {
      filtered = filtered.filter(repair => repair.status === statusFilter);
    }

    // Filtr po wyszukiwaniu
    if (searchTerm) {
      filtered = filtered.filter(repair =>
        repair.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.technician.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRepairs(filtered);
  }, [repairs, statusFilter, searchTerm]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Zakończona',
          color: 'bg-green-100 text-green-800',
          icon: FiCheckCircle
        };
      case 'in_progress':
        return {
          label: 'W trakcie',
          color: 'bg-blue-100 text-blue-800',
          icon: FiLoader
        };
      case 'cancelled':
        return {
          label: 'Anulowana',
          color: 'bg-red-100 text-red-800',
          icon: FiAlertCircle
        };
      default:
        return {
          label: 'Nieznany',
          color: 'bg-gray-100 text-gray-800',
          icon: FiAlertCircle
        };
    }
  };

  const handleViewDetails = (repair) => {
    setSelectedRepair(repair);
    setShowModal(true);
  };

  const downloadInvoice = (invoiceNumber) => {
    // Symulacja pobierania faktury
    alert(`Pobieranie faktury: ${invoiceNumber}`);
  };

  const handleEditRepair = (repair) => {
    setEditingRepair(repair);
    setEditForm({
      device: repair.device,
      category: repair.category,
      service: repair.service,
      problem: repair.problem,
      solution: repair.solution,
      price: repair.price,
      warranty: repair.warranty || '',
      status: repair.status,
      rating: repair.rating || '', estimatedDuration: repair.estimatedDuration || 60,
      duration: repair.duration || repair.estimatedDuration || 60,
      priority: repair.priority || 'normal',
      parts: repair.parts || []
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      // Symulacja zapisu na serwerze
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aktualizacja lokalnych danych
      const updatedRepairs = repairs.map(repair =>
        repair.id === editingRepair.id
          ? { ...repair, ...editForm }
          : repair
      );

      setRepairs(updatedRepairs);
      setFilteredRepairs(updatedRepairs.filter(repair => {
        let filtered = updatedRepairs;
        if (statusFilter !== 'all') {
          filtered = filtered.filter(r => r.status === statusFilter);
        }
        if (searchTerm) {
          filtered = filtered.filter(r =>
            r.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.technician.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return filtered.includes(repair);
      }));

      setShowEditModal(false);
      setEditingRepair(null);
      setEditForm({});
      alert('Zlecenie zostało zaktualizowane pomyślnie!');
    } catch (error) {
      alert('Wystąpił błąd podczas zapisywania zmian.');
    } finally {
      setIsSaving(false);
    }
  };

  const addPart = () => {
    setEditForm(prev => ({
      ...prev,
      parts: [...prev.parts, { name: '', price: 0 }]
    }));
  };

  const removePart = (index) => {
    setEditForm(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const updatePart = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) =>
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  // Funkcja auto-sugestii czasu na podstawie kategorii i usługi
  const getSuggestedDuration = (category, service) => {
    const suggestions = {
      'Naprawa AGD': {
        'Naprawa zmywarek': 180,
        'Naprawa pralek': 150,
        'Naprawa lodówek': 120,
        default: 120
      },
      'Elektryk': {
        'Instalacje elektryczne': 240,
        'Naprawa oświetlenia': 60,
        default: 90
      },
      'Hydraulik': {
        'Wymiana kranów': 90,
        'Naprawa rur': 120,
        default: 90
      },
      'Popularne': {
        default: 60
      }
    };

    return suggestions[category]?.[service] || suggestions[category]?.default || 60;
  };

  const handleAutoSuggest = () => {
    const suggested = getSuggestedDuration(editForm.category, editForm.service);
    setEditForm({ ...editForm, duration: suggested });
  };

  const renderStars = (rating) => {
    if (!rating) return null;

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
                <FiArrowLeft className="h-5 w-5 mr-2" />
                Powrót
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Historia napraw</h1>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <FiUser className="h-4 w-4" />
              <span className="text-sm">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Szukaj napraw..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center space-x-4">
              <FiFilter className="h-5 w-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Wszystkie</option>
                <option value="completed">Zakończone</option>
                <option value="in_progress">W trakcie</option>
                <option value="cancelled">Anulowane</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiTool className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Łącznie napraw</p>
                <p className="text-2xl font-semibold text-gray-900">{repairs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Zakończone</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {repairs.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiDollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Łączny koszt</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {repairs.reduce((sum, r) => sum + r.price, 0)} zł
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiStar className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Średnia ocena</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {repairs.filter(r => r.rating).length > 0
                    ? (repairs.filter(r => r.rating).reduce((sum, r) => sum + r.rating, 0) / repairs.filter(r => r.rating).length).toFixed(1)
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Repairs list */}
        <div className="space-y-6">
          {filteredRepairs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FiTool className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Nie znaleziono napraw spełniających kryteria wyszukiwania.'
                  : 'Nie masz jeszcze żadnych napraw w historii.'
                }
              </p>
            </div>
          ) : (
            filteredRepairs.map((repair) => {
              const statusInfo = getStatusInfo(repair.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={repair.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(repair.date), 'dd MMMM yyyy, HH:mm', { locale: pl })}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {repair.service} - {repair.device}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              <strong>Problem:</strong> {repair.problem}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Technik:</strong> {repair.technician}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Czas trwania:</strong> {Math.floor(repair.duration / 60)}h {repair.duration % 60}min
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              <strong>Cena:</strong> {repair.price} zł
                            </p>
                            {repair.warranty && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Gwarancja:</strong> {repair.warranty} miesięcy
                              </p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Priorytet:</strong>
                              <span className={`ml-1 px-2 py-1 rounded text-xs ${repair.priority === 'high' ? 'bg-red-100 text-red-800' :
                                repair.priority === 'low' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                {repair.priority === 'high' ? 'Wysoki' :
                                  repair.priority === 'low' ? 'Niski' : 'Normalny'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {repair.rating && (
                          <div className="mb-4">
                            {renderStars(repair.rating)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => handleViewDetails(repair)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiEye className="h-4 w-4 mr-1" />
                          Szczegóły
                        </button>

                        <button
                          onClick={() => handleEditRepair(repair)}
                          className="inline-flex items-center px-3 py-2 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          <FiEdit className="h-4 w-4 mr-1" />
                          Edytuj
                        </button>

                        {repair.invoiceNumber && (
                          <button
                            onClick={() => downloadInvoice(repair.invoiceNumber)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <FiDownload className="h-4 w-4 mr-1" />
                            Faktura
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal with repair details */}
      {showModal && selectedRepair && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Szczegóły naprawy #{selectedRepair.id}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Zamknij</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informacje podstawowe</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Urządzenie:</strong> {selectedRepair.device}</p>
                      <p><strong>Kategoria:</strong> {selectedRepair.category}</p>
                      <p><strong>Usługa:</strong> {selectedRepair.service}</p>
                      <p><strong>Data naprawy:</strong> {format(new Date(selectedRepair.date), 'dd MMMM yyyy, HH:mm', { locale: pl })}</p>
                      {selectedRepair.completedDate && (
                        <p><strong>Data zakończenia:</strong> {format(new Date(selectedRepair.completedDate), 'dd MMMM yyyy, HH:mm', { locale: pl })}</p>
                      )}
                      <p><strong>Czas trwania:</strong> {Math.floor(selectedRepair.duration / 60)}h {selectedRepair.duration % 60}min</p>
                      <p><strong>Priorytet:</strong>
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${selectedRepair.priority === 'high' ? 'bg-red-100 text-red-800' :
                          selectedRepair.priority === 'low' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {selectedRepair.priority === 'high' ? 'Wysoki' :
                            selectedRepair.priority === 'low' ? 'Niski' : 'Normalny'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Technik</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Imię i nazwisko:</strong> {selectedRepair.technician}</p>
                      <p><strong>Telefon:</strong> {selectedRepair.technicianPhone}</p>
                      <p><strong>Adres:</strong> {selectedRepair.address}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Opis problemu</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedRepair.problem}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Rozwiązanie</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedRepair.solution}
                  </p>
                </div>

                {selectedRepair.parts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Użyte części</h4>
                    <div className="space-y-2">
                      {selectedRepair.parts.map((part, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <span>{part.name}</span>
                          <span className="font-medium">{part.price} zł</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Koszt naprawy</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedRepair.price} zł</p>
                  </div>
                  {selectedRepair.warranty && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Gwarancja</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedRepair.warranty} mies.</p>
                    </div>
                  )}
                  {selectedRepair.rating && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Ocena</p>
                      <div className="flex justify-center mt-1">
                        {renderStars(selectedRepair.rating)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Zamknij
                </button>
                {selectedRepair.invoiceNumber && (
                  <button
                    onClick={() => downloadInvoice(selectedRepair.invoiceNumber)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Pobierz fakturę
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Repair Modal */}
      {showEditModal && editingRepair && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edytuj naprawę #{editingRepair.id}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Zamknij</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urządzenie
                    </label>
                    <input
                      type="text"
                      value={editForm.device}
                      onChange={(e) => setEditForm({ ...editForm, device: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategoria
                    </label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usługa
                    </label>
                    <input
                      type="text"
                      value={editForm.service}
                      onChange={(e) => setEditForm({ ...editForm, service: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data naprawy
                    </label>
                    <input
                      type="datetime-local"
                      value={editingRepair.date ? format(new Date(editingRepair.date), 'yyyy-MM-dd\'T\'HH:mm') : ''}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Problem
                    </label>
                    <textarea
                      value={editForm.problem}
                      onChange={(e) => setEditForm({ ...editForm, problem: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rozwiązanie
                    </label>
                    <textarea
                      value={editForm.solution}
                      onChange={(e) => setEditForm({ ...editForm, solution: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cena (zł)
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gwarancja (miesiące)
                    </label>
                    <input
                      type="number"
                      value={editForm.warranty}
                      onChange={(e) => setEditForm({ ...editForm, warranty: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Czas trwania
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoSuggest}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        🤖 Auto-sugestia
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={editForm.duration}
                        onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="15"
                        max="480"
                        step="15"
                        placeholder="Czas w minutach"
                      />

                      {/* Quick duration buttons */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 self-center">Szybki wybór:</span>
                        {[30, 60, 90, 120, 180, 240].map(minutes => (
                          <button
                            key={minutes}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, duration: minutes })}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${editForm.duration === minutes
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                              }`}
                          >
                            {minutes < 60 ? `${minutes}min` : `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? ` ${minutes % 60}min` : ''}`}
                          </button>
                        ))}
                      </div>

                      <div className="text-sm">
                        {editForm.duration && editForm.duration > 0 ? (
                          <span className="text-blue-700">
                            📅 Czas naprawy: <strong>{Math.floor(editForm.duration / 60)}h {editForm.duration % 60}min</strong>
                          </span>
                        ) : (
                          <span className="text-gray-400">Wprowadź czas w minutach</span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        💡 <strong>Wytyczne:</strong> Proste naprawy 30-60 min • Średnie 60-120 min • Złożone 120+ min
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="completed">Zakończona</option>
                      <option value="in_progress">W trakcie</option>
                      <option value="cancelled">Anulowana</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorytet
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="normal">Normalny</option>
                      <option value="high">Wysoki</option>
                      <option value="low">Niski</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ocena (1-5)
                    </label>
                    <select
                      value={editForm.rating || ''}
                      onChange={(e) => setEditForm({ ...editForm, rating: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Brak oceny</option>
                      <option value="1">1 - Bardzo słaba</option>
                      <option value="2">2 - Słaba</option>
                      <option value="3">3 - Średnia</option>
                      <option value="4">4 - Dobra</option>
                      <option value="5">5 - Bardzo dobra</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Części</h4>
                  <div className="space-y-2">
                    {editForm.parts.map((part, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <div className="flex-1 pr-4">
                          <input
                            type="text"
                            value={part.name}
                            onChange={(e) => updatePart(index, 'name', e.target.value)}
                            placeholder="Nazwa części"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <input
                            type="number"
                            value={part.price}
                            onChange={(e) => updatePart(index, 'price', parseFloat(e.target.value))}
                            placeholder="Cena części"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={() => removePart(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addPart}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiPlus className="h-4 w-4 mr-1" />
                    Dodaj część
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <FiLoader className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <FiSave className="h-5 w-5 mr-2" />
                  )}
                  Zapisz zmiany
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
