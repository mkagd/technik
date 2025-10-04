import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import StatusControl from '../../../components/technician/StatusControl';
import NotesEditor from '../../../components/technician/NotesEditor';
import TimeTracker from '../../../components/technician/TimeTracker';
import PhotoUploader from '../../../components/technician/PhotoUploader';

export default function VisitDetailsPage() {
  const router = useRouter();
  const { visitId } = router.query;
  
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, notes, photos, time
  
  // Modals
  const [showNotesEditor, setShowNotesEditor] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    const employeeData = localStorage.getItem('technicianEmployee');
    
    if (!token || !employeeData) {
      router.push('/technician/login');
      return;
    }

    try {
      setEmployee(JSON.parse(employeeData));
    } catch (err) {
      console.error('Error parsing employee data:', err);
      router.push('/technician/login');
    }
  }, []);

  // Load visit details when visitId is available
  useEffect(() => {
    if (visitId && employee) {
      loadVisitDetails();
    }
  }, [visitId, employee]);

  const loadVisitDetails = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('technicianToken');

    try {
      const response = await fetch(`/api/technician/visit-details?visitId=${visitId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd pobierania szczegółów wizyty');
      }

      setVisit(data.visit);
      
    } catch (err) {
      console.error('Error loading visit details:', err);
      setError(err.message || 'Błąd ładowania danych wizyty');
      
      if (err.message.includes('token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('technicianToken');
        localStorage.removeItem('technicianEmployee');
        router.push('/technician/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Status helpers
  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      on_way: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-green-100 text-green-800 border-green-200',
      paused: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      rescheduled: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Zaplanowana',
      on_way: 'W drodze',
      in_progress: 'W trakcie',
      paused: 'Wstrzymana',
      completed: 'Zakończona',
      cancelled: 'Anulowana',
      rescheduled: 'Przełożona'
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type) => {
    const labels = {
      diagnosis: 'Diagnoza',
      repair: 'Naprawa',
      control: 'Kontrola',
      installation: 'Instalacja',
      warranty: 'Gwarancja'
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const dt = new Date(dateTimeStr);
    return dt.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie szczegółów wizyty...</p>
        </div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center mb-4">
            <svg className="mx-auto w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Błąd</h2>
            <p className="text-gray-600 mb-4">{error || 'Nie znaleziono wizyty'}</p>
          </div>
          <Link href="/technician/visits" className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Wróć do listy wizyt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/technician/visits" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900">Szczegóły wizyty</h1>
                <p className="text-xs sm:text-sm text-gray-500">{visit.visitId}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full border ${getStatusColor(visit.status)}`}>
                {getStatusLabel(visit.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column - Main info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Client info card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Klient
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nazwa</p>
                  <p className="text-base font-medium text-gray-900">{visit.client?.name || 'Brak danych'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Telefon</p>
                    {visit.client?.phone ? (
                      <a href={`tel:${visit.client.phone}`} className="text-base text-blue-600 hover:underline flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {visit.client.phone}
                      </a>
                    ) : (
                      <p className="text-base text-gray-400">Brak</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    {visit.client?.email ? (
                      <a href={`mailto:${visit.client.email}`} className="text-base text-blue-600 hover:underline truncate block">
                        {visit.client.email}
                      </a>
                    ) : (
                      <p className="text-base text-gray-400">Brak</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Adres</p>
                  <p className="text-base text-gray-900">{visit.client?.address}</p>
                  <p className="text-base text-gray-900">{visit.client?.postalCode} {visit.client?.city}</p>
                </div>

                {/* Map link */}
                {visit.client?.address && visit.client?.city && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.client.address + ', ' + visit.client.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Otwórz w mapach
                  </a>
                )}
              </div>
            </div>

            {/* Device info card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Urządzenie
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Typ</p>
                  <p className="text-base font-medium text-gray-900">{visit.device?.type || 'Nieznany'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Marka</p>
                  <p className="text-base font-medium text-gray-900">{visit.device?.brand || 'Nieznana'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Model</p>
                  <p className="text-base text-gray-900">{visit.device?.model || 'Nieznany'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Numer seryjny</p>
                  <p className="text-base text-gray-900 font-mono text-sm">{visit.device?.serialNumber || 'Brak'}</p>
                </div>
              </div>

              {visit.device?.warranty && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      Urządzenie na gwarancji (do {formatDate(visit.device.warrantyEndDate)})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Problem card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Problem
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Opis problemu</p>
                  <p className="text-base text-gray-900">{visit.problem?.description || 'Brak opisu'}</p>
                </div>

                {visit.problem?.symptoms && visit.problem.symptoms.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Objawy</p>
                    <div className="flex flex-wrap gap-2">
                      {visit.problem.symptoms.map((symptom, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {visit.diagnosis && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Diagnoza</p>
                    <p className="text-base text-blue-800">{visit.diagnosis}</p>
                    {visit.diagnosisDate && (
                      <p className="text-xs text-blue-600 mt-2">
                        Zdiagnozowano: {formatDateTime(visit.diagnosisDate)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex space-x-2 sm:space-x-4 px-4 sm:px-6 min-w-max" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === 'notes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📝 Notatki {visit.notes && visit.notes.length > 0 && `(${visit.notes.length})`}
                  </button>
                  <button
                    onClick={() => setActiveTab('photos')}
                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === 'photos'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📸 Zdjęcia {visit.photoCount > 0 && `(${visit.photoCount})`}
                  </button>
                  <button
                    onClick={() => setActiveTab('time')}
                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === 'time'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    ⏱️ Czas pracy
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === 'history'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Historia
                  </button>
                </nav>
              </div>

              <div className="p-4 sm:p-6">
                {/* Notes tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {visit.notes && visit.notes.length > 0 ? (
                      visit.notes.map((note) => (
                        <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                {note.type}
                              </span>
                              {note.priority && note.priority !== 'normal' && (
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  note.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {note.priority === 'high' ? 'Wysoki' : 'Średni'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{formatDateTime(note.createdAt)}</p>
                          </div>
                          <p className="text-gray-900 mb-2">{note.content}</p>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {note.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>Brak notatek</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Photos tab */}
                {activeTab === 'photos' && (
                  <PhotoUploader
                    visitId={visitId}
                    existingPhotos={visit.allPhotos || []}
                    onPhotosUpdate={(updatedPhotos) => {
                      setVisit(prev => ({
                        ...prev,
                        allPhotos: updatedPhotos,
                        photoCount: updatedPhotos.length
                      }));
                    }}
                  />
                )}

                {/* Time tracking tab */}
                {activeTab === 'time' && (
                  <div className="space-y-4">
                    {visit.timeTracking?.workSessions && visit.timeTracking.workSessions.length > 0 ? (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-blue-600 mb-1">Całkowity czas pracy</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {visit.timeTracking.totalTime || 0} minut
                          </p>
                        </div>
                        {visit.timeTracking.workSessions.map((session) => (
                          <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900">Sesja {session.id.substring(5, 15)}</p>
                              <span className="text-sm font-semibold text-blue-600">
                                {session.duration || 0} min
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Start</p>
                                <p className="text-gray-900">{formatDateTime(session.startTime)}</p>
                              </div>
                              {session.endTime && (
                                <div>
                                  <p className="text-gray-500">Koniec</p>
                                  <p className="text-gray-900">{formatDateTime(session.endTime)}</p>
                                </div>
                              )}
                            </div>
                            {session.pauseDuration > 0 && (
                              <p className="text-xs text-orange-600 mt-2">
                                Przerwy: {session.pauseDuration} min
                              </p>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Brak sesji pracy</p>
                      </div>
                    )}
                  </div>
                )}

                {/* History tab */}
                {activeTab === 'history' && (
                  <div className="space-y-3">
                    {visit.statusHistory && visit.statusHistory.length > 0 ? (
                      visit.statusHistory.map((entry, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {getStatusLabel(entry.from)} → {getStatusLabel(entry.to)}
                              </p>
                              <p className="text-xs text-gray-500">{formatDateTime(entry.changedAt)}</p>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Brak historii</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Actions & Summary */}
          <div className="space-y-6">
            {/* Visit info card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Informacje</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Data wizyty</p>
                  <p className="text-base font-medium text-gray-900">{formatDate(visit.date)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Godzina</p>
                  <p className="text-base font-medium text-gray-900">{formatTime(visit.time)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Typ wizyty</p>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                    {getTypeLabel(visit.type)}
                  </span>
                </div>

                {visit.estimatedDuration && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Szacowany czas</p>
                    <p className="text-base font-medium text-gray-900">{visit.estimatedDuration} min</p>
                  </div>
                )}

                {visit.actualDuration && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Rzeczywisty czas</p>
                    <p className="text-base font-medium text-gray-900">{visit.actualDuration} min</p>
                  </div>
                )}
              </div>
            </div>

            {/* Costs card */}
            {visit.costs && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Koszty</h3>
                
                <div className="space-y-2">
                  {visit.costs.labor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Robocizna</span>
                      <span className="text-sm font-medium text-gray-900">{visit.costs.labor} PLN</span>
                    </div>
                  )}
                  {visit.costs.parts > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Części</span>
                      <span className="text-sm font-medium text-gray-900">{visit.costs.parts} PLN</span>
                    </div>
                  )}
                  {visit.costs.transport > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dojazd</span>
                      <span className="text-sm font-medium text-gray-900">{visit.costs.transport} PLN</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-gray-900">Razem</span>
                      <span className="text-base font-bold text-blue-600">{visit.costs.total} PLN</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parts card */}
            {visit.parts && visit.parts.used && visit.parts.used.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Użyte części</h3>
                <div className="space-y-2">
                  {visit.parts.used.map((part, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{part.name}</p>
                        {part.quantity && (
                          <p className="text-xs text-gray-500">Ilość: {part.quantity}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Control */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Zmień status</h3>
              <StatusControl 
                visit={visit} 
                onStatusChanged={(updatedVisit) => {
                  setVisit(updatedVisit);
                }}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Szybkie akcje</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowNotesEditor(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Dodaj notatkę
                </button>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Dodaj zdjęcie
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Editor Modal */}
      {showNotesEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <NotesEditor
              visit={visit}
              onNoteAdded={(updatedVisit) => {
                setVisit(updatedVisit);
                setShowNotesEditor(false);
              }}
              onClose={() => setShowNotesEditor(false)}
            />
          </div>
        </div>
      )}

      {/* Time Tracker Widget */}
      {visit && (
        <TimeTracker
          visit={visit}
          onSessionChanged={(updatedVisit) => {
            setVisit(updatedVisit);
          }}
        />
      )}
    </div>
  );
}
