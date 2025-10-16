import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import StatusControl from '../../../components/technician/StatusControl';
import NotesEditor from '../../../components/technician/NotesEditor';
import TimeTracker from '../../../components/technician/TimeTracker';
import PhotoUploader from '../../../components/technician/PhotoUploader';
import ModelAIScanner from '../../../components/ModelAIScanner';
import ModelManagerModal from '../../../components/ModelManagerModal';
import AllegroQuickSearch from '../../../components/AllegroQuickSearch';
import CompletionWizard from '../../../components/technician/CompletionWizard';
import VehicleInventoryModal from '../../../components/technician/VehicleInventoryModal';
import { showToast } from '../../../utils/toast';

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
  const [showAIScanner, setShowAIScanner] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [showCompletionWizard, setShowCompletionWizard] = useState(false);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const [showVehicleInventory, setShowVehicleInventory] = useState(false);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);
  const [isEditVisitDateModal, setIsEditVisitDateModal] = useState(false);
  const [editDateForm, setEditDateForm] = useState({ date: '', time: '09:00' });
  
  // Inicjalizuj formularz daty przy otwarciu modala
  useEffect(() => {
    if (isEditVisitDateModal && visit) {
      setEditDateForm({
        date: visit.scheduledDate ? new Date(visit.scheduledDate).toISOString().split('T')[0] : '',
        time: visit.scheduledTime || '09:00'
      });
    }
  }, [isEditVisitDateModal, visit]);
  
  // ✅ MULTI-DEVICE: Selected device index
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  
  // Visit models state
  const [visitModels, setVisitModels] = useState([]);
  
  // 🚗 Vehicle parts usage state
  const [vehiclePartsUsage, setVehiclePartsUsage] = useState([]);
  
  // 🔄 Auto-refresh state (dla background processing)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [lastModelCount, setLastModelCount] = useState(0);

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

  // 🔄 Auto-refresh: Sprawdzaj nowe modele co 3 sekundy
  useEffect(() => {
    if (!autoRefreshEnabled || !visitId || !employee) return;

    const interval = setInterval(async () => {
      console.log('🔄 Auto-refresh: Sprawdzam nowe modele...');
      
      try {
        const token = localStorage.getItem('technicianToken');
        const response = await fetch(`/api/technician/visit-details?visitId=${visitId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        
        // Sprawdź czy pojawiły się nowe modele
        const currentDeviceModels = data.visit.deviceModels?.find(
          dm => dm.deviceIndex === selectedDeviceIndex
        );
        const newModelCount = currentDeviceModels?.models?.length || 0;

        if (newModelCount > lastModelCount) {
          console.log(`✨ Wykryto nowe modele! ${lastModelCount} → ${newModelCount}`);
          setVisit(data.visit);
          setVisitModels(currentDeviceModels?.models || []);
          setLastModelCount(newModelCount);
          
          // Zatrzymaj auto-refresh po znalezieniu nowych modeli
          setAutoRefreshEnabled(false);
          
          // 🎉 CICHE odświeżenie - bez alertu! Dane po prostu się pojawią
          console.log(`✅ SUKCES: Rozpoznano ${newModelCount - lastModelCount} model(i) - aktualizacja cicha`);
        }
      } catch (error) {
        console.error('❌ Auto-refresh error:', error);
      }
    }, 3000); // Co 3 sekundy

    // Cleanup
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, visitId, employee, selectedDeviceIndex, lastModelCount]);

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
      
      // ✅ MULTI-DEVICE: Load models for currently selected device
      if (data.visit.deviceModels && Array.isArray(data.visit.deviceModels)) {
        const currentDeviceModels = data.visit.deviceModels.find(
          dm => dm.deviceIndex === selectedDeviceIndex
        );
        setVisitModels(currentDeviceModels?.models || []);
      } else if (data.visit.models && Array.isArray(data.visit.models)) {
        // Fallback: old single-device format
        setVisitModels(data.visit.models);
      } else {
        setVisitModels([]);
      }
      
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

  // 🚗 Load vehicle parts usage for this visit
  const loadVehiclePartsUsage = async () => {
    if (!visitId) return;

    try {
      const token = localStorage.getItem('technicianToken');
      const res = await fetch(`/api/inventory/personal/history?orderId=${visitId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (data.success && data.usageHistory && data.usageHistory.length > 0) {
        setVehiclePartsUsage(data.usageHistory);
        console.log(`🚗 Loaded ${data.usageHistory.length} vehicle parts usage records`);
      } else {
        setVehiclePartsUsage([]);
      }
    } catch (error) {
      console.error('Error loading vehicle parts usage:', error);
      setVehiclePartsUsage([]);
    }
  };

  // Load vehicle parts usage when visit is loaded
  useEffect(() => {
    if (visit?.visitId) {
      loadVehiclePartsUsage();
    }
  }, [visit?.visitId]);

  // Status helpers
  const getStatusColor = (status) => {
    const colors = {
      unscheduled: 'bg-gray-100 text-gray-700 border-gray-300',
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
      unscheduled: 'Do zaplanowania',
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

  // ✅ FIXED: Handler dla ModelAIScanner - wykryty pojedynczy model z tabliczki
  const handleAIModelDetected = async (detectedModel) => {
    console.log('� Model wykryty przez AI Scanner:', detectedModel);
    
    // ModelAIScanner przekazuje pojedynczy obiekt model (nie tablicę!)
    if (!detectedModel || typeof detectedModel !== 'object') {
      console.error('❌ Nieprawidłowy format modelu:', detectedModel);
      showToast.error('Błąd: Nieprawidłowe dane z skanera');
      setShowAIScanner(false);
      return;
    }

    // Konwertuj do formatu zgodnego z API
    const modelToSave = {
      brand: detectedModel.brand || detectedModel.clean || '',
      model: detectedModel.model || detectedModel.clean || detectedModel.finalModel || '',
      finalModel: detectedModel.finalModel || detectedModel.model || detectedModel.clean || '',
      finalType: detectedModel.finalType || detectedModel.type || '',
      finalName: detectedModel.finalName || detectedModel.name || `${detectedModel.brand || ''} ${detectedModel.model || ''}`.trim(),
      serialNumber: detectedModel.serialNumber || '',
      confidence: detectedModel.confidence || 'medium',
      source: detectedModel.source || 'ai_scanner',
      timestamp: new Date().toISOString()
    };

    // Walidacja - sprawdź czy wykryto przynajmniej markę lub model
    if (!modelToSave.brand && !modelToSave.finalModel) {
      showToast.error('Nie udało się rozpoznać marki ani modelu');
      setShowAIScanner(false);
      return;
    }

    console.log('💾 Zapisuję model z AI Scanner:', modelToSave);

    // Sprawdź czy już nie ma tego modelu w visitModels (unikaj duplikatów)
    const isDuplicate = visitModels.some(
      m => m.finalModel === modelToSave.finalModel && m.brand === modelToSave.brand
    );

    if (isDuplicate) {
      showToast.warning('Ten model został już dodany do tej wizyty');
      setShowAIScanner(false);
      return;
    }

    // Dodaj nowy model do istniejących modeli
    const updatedModels = [...visitModels, modelToSave];

    // Zapisz przez istniejący handler (który obsługuje API i odświeżanie)
    await handleSaveModels(updatedModels);
    
    // Modal zostanie zamknięty przez handleSaveModels po sukcesie
    setShowAIScanner(false);
  };

  // Handler dla ModelManagerModal - zapisuje modele do wizyty
  const handleSaveModels = async (models) => {
    console.log(`💾 Zapisuję modele do wizyty dla urządzenia ${selectedDeviceIndex}:`, models);
    
    try {
      const token = localStorage.getItem('technicianToken');
      
      const response = await fetch(`/api/technician/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          models: models,
          deviceIndex: selectedDeviceIndex  // ✅ MULTI-DEVICE: Specify which device
        })
      });

      if (!response.ok) {
        throw new Error('Błąd zapisywania modeli');
      }

      const result = await response.json();
      console.log('✅ API Response:', result);

      // Aktualizuj lokalny state z danymi z serwera
      setVisitModels(models);
      
      // Odśwież pełne dane wizyty (pobierze zaktualizowane dane urządzenia z API)
      await loadVisitDetails();
      
      // Pokaż komunikat
      const modelCount = models.length;
      const deviceInfo = models[0] ? `${models[0].brand} ${models[0].model || models[0].finalModel}` : '';
      const deviceName = visit.devices && visit.devices[selectedDeviceIndex] 
        ? visit.devices[selectedDeviceIndex].deviceType 
        : `Urządzenie ${selectedDeviceIndex + 1}`;
      
      showToast.success(`Zapisano ${modelCount} ${modelCount === 1 ? 'model' : 'modeli'} dla ${deviceName}${deviceInfo ? '\n📱 ' + deviceInfo : ''}`);
      setShowModelManager(false);
      
    } catch (err) {
      console.error('Error saving models:', err);
      showToast.error('Błąd zapisywania modeli: ' + err.message);
    }
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
              {/* Przycisk Dodaj wizytę */}
              <button
                onClick={() => setIsAddVisitModalOpen(true)}
                className="flex items-center px-2 sm:px-3 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors"
                title="Dodaj kolejną wizytę do tego zlecenia"
              >
                <svg className="w-4 h-4 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Dodaj wizytę</span>
              </button>
              
              {/* Przycisk Zamów część */}
              <Link
                href={`/technician/magazyn/zamow?visitId=${visit.visitId}&orderNumber=${visit.visitId}&clientName=${encodeURIComponent(visit.client?.name || '')}&deviceType=${encodeURIComponent(visit.devices?.[selectedDeviceIndex]?.deviceType || visitModels?.[0]?.type || '')}&deviceBrand=${encodeURIComponent(visit.devices?.[selectedDeviceIndex]?.brand || visitModels?.[0]?.brand || '')}&deviceModel=${encodeURIComponent(visit.devices?.[selectedDeviceIndex]?.model || visitModels?.[0]?.finalModel || visitModels?.[0]?.model || '')}&issueDescription=${encodeURIComponent(visit.description || '')}`}
                className="flex items-center px-2 sm:px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Zamów część</span>
              </Link>
              
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

            {/* Visit Date/Schedule Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Termin wizyty
              </h2>

              {visit.scheduledDate ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Zaplanowano na:</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(visit.scheduledDate).toLocaleDateString('pl-PL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {visit.scheduledTime && (
                        <p className="text-base text-gray-700 mt-1">
                          🕐 Godzina: <span className="font-medium">{visit.scheduledTime}</span>
                        </p>
                      )}
                    </div>
                    <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  <button
                    onClick={() => setIsEditVisitDateModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Zmień termin wizyty
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-900 mb-1">
                          ⚠️ Wizyta nie ma ustalonego terminu
                        </p>
                        <p className="text-xs text-yellow-700">
                          Aby rozpocząć pracę, musisz zaplanować termin wizyty w swoim harmonogramie.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditVisitDateModal(true)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Zaplanuj wizytę w harmonogramie
                  </button>

                  <p className="text-xs text-center text-gray-500">
                    💡 Po dodaniu do harmonogramu będziesz mógł rozpocząć śledzenie czasu i wykonać serwis
                  </p>
                </div>
              )}
            </div>

            {/* Device info card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Urządzenie {visit.devices && visit.devices.length > 1 ? `(${visit.devices.length})` : ''}
              </h2>

              {/* Device Selector - pokazuje się tylko gdy jest więcej niż 1 urządzenie */}
              {visit.devices && visit.devices.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
                  {visit.devices.map((device, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDeviceIndex(index)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedDeviceIndex === index
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {device.deviceType || `Urządzenie ${index + 1}`}
                      {device.brand && ` - ${device.brand}`}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Typ</p>
                  <p className="text-base font-medium text-gray-900">
                    {visit.devices && visit.devices[selectedDeviceIndex]
                      ? visit.devices[selectedDeviceIndex].deviceType
                      : visit.device?.type || 'Nieznany'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Marka</p>
                  <p className="text-base font-medium text-gray-900">
                    {visit.devices && visit.devices[selectedDeviceIndex]
                      ? visit.devices[selectedDeviceIndex].brand
                      : visit.device?.brand || 'Nieznana'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Model</p>
                  <p className="text-base text-gray-900">
                    {visit.devices && visit.devices[selectedDeviceIndex]
                      ? visit.devices[selectedDeviceIndex].model
                      : visit.device?.model || 'Nieznany'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Numer seryjny</p>
                  <p className="text-base text-gray-900 font-mono text-sm">
                    {visit.devices && visit.devices[selectedDeviceIndex]
                      ? visit.devices[selectedDeviceIndex].serialNumber
                      : visit.device?.serialNumber || 'Brak'}
                  </p>
                </div>
              </div>

              {/* Przycisk Model Manager - Pełne zarządzanie urządzeniami */}
              <div className="mt-4">
                <button
                  onClick={() => setShowModelManager(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  📸 Zeskanuj tabliczkę znamionową
                </button>
                
                {/* Pokazuje liczbę zeskanowanych modeli */}
                {visitModels && visitModels.length > 0 && (
                  <div className="mt-2 text-center">
                    <span className="text-sm text-gray-600">
                      ✅ Zeskanowano: <strong>{visitModels.length}</strong> {visitModels.length === 1 ? 'urządzenie' : 'urządzeń'}
                    </span>
                  </div>
                )}
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

                {/* Zdjęcia od klienta/administratora */}
                {((visit.photos && visit.photos.length > 0) || 
                  (visit.problemPhotos && visit.problemPhotos.length > 0) || 
                  (visit.beforePhotos && visit.beforePhotos.length > 0)) && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Zdjęcia zgłoszenia
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {/* Główne zdjęcia od klienta */}
                      {visit.photos && visit.photos.map((photo, idx) => (
                        <div key={`photo-${idx}`} className="relative group">
                          <img
                            src={photo.thumbnailUrl || photo.url || photo}
                            alt={`Zdjęcie ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer"
                            onClick={() => window.open(photo.url || photo, '_blank')}
                            loading="lazy"
                          />
                          <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                            Klient
                          </div>
                        </div>
                      ))}
                      
                      {/* Zdjęcia problemu */}
                      {visit.problemPhotos && visit.problemPhotos.map((photo, idx) => (
                        <div key={`problem-${idx}`} className="relative group">
                          <img
                            src={photo.thumbnailUrl || photo.url || photo}
                            alt={`Problem ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-all cursor-pointer"
                            onClick={() => window.open(photo.url || photo, '_blank')}
                            loading="lazy"
                          />
                          <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded">
                            Problem
                          </div>
                        </div>
                      ))}
                      
                      {/* Zdjęcia "przed" */}
                      {visit.beforePhotos && visit.beforePhotos.map((photo, idx) => (
                        <div key={`before-${idx}`} className="relative group">
                          <img
                            src={photo.thumbnailUrl || photo.url || photo}
                            alt={`Przed ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-all cursor-pointer"
                            onClick={() => window.open(photo.url || photo, '_blank')}
                            loading="lazy"
                          />
                          <div className="absolute top-1 right-1 bg-gray-500 text-white text-xs px-2 py-0.5 rounded">
                            Przed
                          </div>
                        </div>
                      ))}
                    </div>
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
                    onClick={() => setActiveTab('parts')}
                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === 'parts'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🔧 Części
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
                      
                      // 🔄 Włącz auto-refresh jeśli dodano tabliczkę znamionową
                      const hasSerialPhoto = updatedPhotos.some(photo => photo.type === 'serial');
                      if (hasSerialPhoto && updatedPhotos.length > (visit.allPhotos?.length || 0)) {
                        console.log('🔄 Wykryto nową tabliczkę - włączam auto-refresh');
                        setLastModelCount(visitModels?.length || 0);
                        setAutoRefreshEnabled(true);
                        
                        // Auto-wyłącz po 30 sekundach (10 prób x 3s)
                        setTimeout(() => {
                          setAutoRefreshEnabled(false);
                          console.log('⏱️ Auto-refresh timeout - wyłączam');
                        }, 30000);
                      }
                    }}
                  />
                )}

                {/* Parts tab - NEW */}
                {activeTab === 'parts' && (
                  <div className="space-y-6">
                    {/* 🔧 Przypisane części do wizyty */}
                    {visit.parts?.assigned && visit.parts.assigned.length > 0 && (
                      <div className="bg-white rounded-lg border-2 border-green-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Części przypisane do wizyty ({visit.parts.assigned.length})
                        </h3>
                        
                        <div className="space-y-3">
                          {visit.parts.assigned.map((part, index) => (
                            <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {part.partName}
                                </h4>
                                {part.partNumber && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    Nr katalogowy: <span className="font-mono">{part.partNumber}</span>
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-gray-700">
                                    Ilość: <strong>{part.quantity} szt</strong>
                                  </span>
                                  <span className="text-gray-700">
                                    Cena: <strong className="text-blue-600">{part.unitPrice} zł/szt</strong>
                                  </span>
                                  <span className="text-gray-700">
                                    Suma: <strong className="text-green-600">{part.totalPrice?.toFixed(2) || (part.unitPrice * part.quantity).toFixed(2)} zł</strong>
                                  </span>
                                </div>
                                {part.priceNotes && (
                                  <p className="text-xs text-gray-500 mt-2 italic">
                                    💡 {part.priceNotes}
                                  </p>
                                )}
                              </div>
                              
                              {/* Przycisk szukania na Allegro */}
                              <div className="ml-4">
                                <AllegroQuickSearch
                                  partName={part.partName}
                                  partNumber={part.partNumber}
                                  compact={true}
                                />
                              </div>
                            </div>
                          ))}
                          
                          {/* Suma wszystkich części */}
                          <div className="pt-4 border-t-2 border-gray-300">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-gray-700">Suma części:</span>
                              <span className="text-2xl font-bold text-green-600">
                                {visit.parts.assigned.reduce((sum, p) => sum + (p.totalPrice || (p.unitPrice * p.quantity)), 0).toFixed(2)} zł
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 🚗 Części użyte z magazynu pojazdu */}
                    {vehiclePartsUsage && vehiclePartsUsage.length > 0 && (
                      <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                          🚗 Części użyte z magazynu pojazdu ({vehiclePartsUsage.reduce((sum, u) => sum + u.parts.length, 0)})
                        </h3>
                        
                        <div className="space-y-4">
                          {vehiclePartsUsage.map((usage, idx) => (
                            <div key={idx} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-500">
                                  {new Date(usage.usageDate).toLocaleString('pl-PL')}
                                </span>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Razem</p>
                                  <p className="text-lg font-bold text-blue-600">
                                    {usage.totalValue.toFixed(2)} <span className="text-sm text-gray-500">PLN</span>
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {usage.parts.map((part, partIdx) => (
                                  <div key={partIdx} className="flex items-start justify-between p-3 bg-white rounded border border-blue-100">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900 mb-1">
                                        {part.partName}
                                      </h4>
                                      {part.partNumber && (
                                        <p className="text-sm text-gray-600 mb-2">
                                          Nr katalogowy: <span className="font-mono text-xs">{part.partNumber}</span>
                                        </p>
                                      )}
                                      <div className="flex items-center space-x-4 text-sm">
                                        <span className="text-gray-700">
                                          Ilość: <strong>{part.quantity} szt</strong>
                                        </span>
                                        <span className="text-gray-700">
                                          Cena: <strong className="text-blue-600">{part.unitPrice.toFixed(2)} zł/szt</strong>
                                        </span>
                                      </div>
                                      {part.installationNotes && (
                                        <p className="text-xs text-gray-500 mt-2 italic">
                                          💡 {part.installationNotes}
                                        </p>
                                      )}
                                    </div>
                                    
                                    {/* Przycisk usuwania */}
                                    <button
                                      onClick={async () => {
                                        if (!confirm(`Cofnąć użycie części: ${part.partName}?\n\nCzęść zostanie przywrócona do magazynu pojazdu.`)) return;
                                        
                                        try {
                                          const token = localStorage.getItem('technicianToken');
                                          const res = await fetch(`/api/inventory/personal/undo-usage`, {
                                            method: 'POST',
                                            headers: {
                                              'Authorization': `Bearer ${token}`,
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                              usageId: usage.usageId,
                                              partId: part.partId
                                            })
                                          });
                                          
                                          const data = await res.json();
                                          
                                          if (data.success) {
                                            console.log('✅ Cofnięto użycie części:', part.partName);
                                            await loadVehiclePartsUsage();
                                            await loadVisitDetails();
                                          } else {
                                            showToast.error(`Błąd: ${data.error}`);
                                          }
                                        } catch (error) {
                                          console.error('Error undoing part usage:', error);
                                          showToast.error('Błąd podczas cofania użycia części');
                                        }
                                      }}
                                      className="ml-3 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center"
                                      title="Cofnij użycie tej części"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Cofnij
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {/* Suma wszystkich części z pojazdu */}
                          <div className="pt-4 border-t-2 border-blue-300">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-gray-700">🚗 Razem części z pojazdu:</span>
                              <span className="text-2xl font-bold text-blue-600">
                                {vehiclePartsUsage.reduce((sum, u) => sum + u.totalValue, 0).toFixed(2)} zł
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Search */}
                    <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        🔍 Szukaj części na Allegro
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Znajdź potrzebną część bezpośrednio z wizyty. System automatycznie wyszuka najlepsze oferty.
                      </p>
                      
                      {/* Device model info */}
                      {visit.device && (
                        <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Urządzenie w naprawie:</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {visit.device.brand} {visit.device.model}
                          </p>
                        </div>
                      )}

                      {/* Common parts suggestions */}
                      {visitModels && visitModels.length > 0 && visitModels[0].commonParts && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            💡 Sugerowane części dla tego modelu:
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {visitModels[0].commonParts.slice(0, 5).map((part, idx) => (
                              <div key={idx} className="bg-white dark:bg-gray-900/50 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">{part.name}</p>
                                  {part.partNumber && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{part.partNumber}</p>
                                  )}
                                </div>
                                <AllegroQuickSearch
                                  partName={part.name}
                                  partNumber={part.partNumber}
                                  compact={true}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom search */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          🔧 Lub wyszukaj dowolną część:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="np. Pompa odpływowa, Termostat, Uszczelka..."
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                // Trigger search via AllegroQuickSearch
                                document.getElementById('custom-search-btn').click();
                              }
                            }}
                            id="custom-part-input"
                          />
                          <div id="custom-search-btn">
                            <AllegroQuickSearch
                              partName={document.getElementById('custom-part-input')?.value || 'część'}
                              compact={false}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Link to technician warehouse */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                            💡 Sprawdź najpierw swój magazyn
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                            Możliwe że masz potrzebną część w swoim magazynie w pojeździe.
                          </p>
                          <Link
                            href="/technician/magazyn/moj-magazyn"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            📦 Sprawdź mój magazyn
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Info about ordering */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        📋 Jak zamówić część?
                      </h4>
                      <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal ml-5">
                        <li>Znajdź część na Allegro używając przycisku 🛒</li>
                        <li>Skopiuj link do oferty</li>
                        <li>Wyślij link do logistyka (email/telefon)</li>
                        <li>Lub kup bezpośrednio jeśli masz pilną wizytę</li>
                        <li>Po otrzymaniu części - użyj jej przy kolejnej wizycie</li>
                      </ol>
                    </div>
                  </div>
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
                    <p className="text-base font-bold text-green-600">{visit.actualDuration} min</p>
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
            {(visit.payment || visit.costs) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Koszty</h3>
                
                {visit.payment ? (
                  // 💰 Nowy system - z CompletionWizard
                  <div className="space-y-2">
                    {visit.payment.laborCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Robocizna</span>
                        <span className="text-sm font-medium text-gray-900">{visit.payment.laborCost.toFixed(2)} PLN</span>
                      </div>
                    )}
                    {visit.payment.partsCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Części</span>
                        <span className="text-sm font-medium text-gray-900">{visit.payment.partsCost.toFixed(2)} PLN</span>
                      </div>
                    )}
                    {visit.payment.prepaidAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="text-sm">✅ Zaliczka</span>
                        <span className="text-sm font-medium">-{visit.payment.prepaidAmount.toFixed(2)} PLN</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-base font-semibold text-gray-900">Razem</span>
                        <span className="text-base font-bold text-blue-600">{visit.payment.totalCost.toFixed(2)} PLN</span>
                      </div>
                      {visit.payment.amountDue > 0 && (
                        <div className="flex justify-between mt-1">
                          <span className="text-sm font-medium text-orange-700">Do zapłaty</span>
                          <span className="text-sm font-bold text-orange-700">{visit.payment.amountDue.toFixed(2)} PLN</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status płatności */}
                    {visit.payment.paymentStatus && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Status płatności</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            visit.payment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            visit.payment.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {visit.payment.paymentStatus === 'paid' ? '✅ Zapłacono' :
                             visit.payment.paymentStatus === 'partial' ? '🟡 Częściowo' :
                             '❌ Niezapłacone'}
                          </span>
                        </div>
                        {visit.payment.paymentMethod && (
                          <p className="text-xs text-gray-600 mt-1">
                            Metoda: {visit.payment.paymentMethod === 'cash' ? 'Gotówka' :
                                    visit.payment.paymentMethod === 'card' ? 'Karta' :
                                    visit.payment.paymentMethod === 'transfer' ? 'Przelew' : visit.payment.paymentMethod}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Stary system - visit.costs
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
                )}
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

            {/* Vehicle Parts Usage card */}
            {vehiclePartsUsage.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">🚗 Części z pojazdu</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                    {vehiclePartsUsage.reduce((sum, usage) => sum + usage.parts.length, 0)} szt
                  </span>
                </div>
                <div className="space-y-3">
                  {vehiclePartsUsage.map((usage, usageIdx) => (
                    <div key={usageIdx} className="border-l-4 border-green-500 pl-3">
                      {usage.parts.map((part, partIdx) => (
                        <div key={partIdx} className="mb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{part.partName || part.name}</p>
                              <p className="text-xs text-gray-500">{part.partNumber}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-semibold text-green-700">{part.quantity} szt</p>
                              {part.unitPrice > 0 && (
                                <p className="text-xs text-gray-600">{part.totalPrice.toFixed(2)} zł</p>
                              )}
                            </div>
                          </div>
                          {part.location && (
                            <p className="text-xs text-gray-500 mt-1">📍 {part.location}</p>
                          )}
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>Użyto: {new Date(usage.usageDate).toLocaleString('pl-PL')}</span>
                          <span className="font-semibold text-green-700">{usage.totalValue.toFixed(2)} zł</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Control / Complete Visit */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Status wizyty</h3>
              
              {/* Show completion button only for in_progress visits */}
              {visit.status === 'in_progress' ? (
                <button
                  onClick={() => setShowCompletionWizard(true)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-bold shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ✅ Zakończ wizytę
                </button>
              ) : (
                <StatusControl 
                  visit={visit} 
                  onStatusChanged={(updatedVisit) => {
                    setVisit(updatedVisit);
                  }}
                />
              )}
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
                <button 
                  onClick={() => setShowPhotoUploader(true)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  📸 Dodaj zdjęcia
                </button>

                <button 
                  onClick={() => setShowVehicleInventory(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center mt-3"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  🚗 Użyj część z pojazdu
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

      {/* Modal AI Scanner */}
      {showAIScanner && (
        <ModelAIScanner
          isOpen={showAIScanner}
          onClose={() => setShowAIScanner(false)}
          onModelDetected={handleAIModelDetected}
        />
      )}

      {/* Model Manager Modal - Pełne zarządzanie tabliczkami znamionowymi */}
      {showModelManager && (
        <ModelManagerModal
          isOpen={showModelManager}
          onClose={() => setShowModelManager(false)}
          onSave={handleSaveModels}
          initialModels={visitModels}
          context={{
            type: 'visit',
            visitId: visit?.visitId,
            clientName: visit?.client?.name || 'Wizyta',
            deviceName: visit.devices && visit.devices[selectedDeviceIndex]
              ? `${visit.devices[selectedDeviceIndex].deviceType || 'Urządzenie'} - ${visit.devices[selectedDeviceIndex].brand || ''}`
              : 'Urządzenie',
            deviceIndex: selectedDeviceIndex,
            description: visit.devices && visit.devices.length > 1
              ? `Skanowanie tabliczki znamionowej dla urządzenia ${selectedDeviceIndex + 1}/${visit.devices.length}`
              : 'Zarządzanie tabliczkami znamionowymi urządzeń dla wizyty'
          }}
        />
      )}

      {/* Photo Uploader Modal - 📸 Dodawanie zdjęć do wizyty */}
      {showPhotoUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  📸 Dodaj zdjęcia do wizyty
                </h2>
                <button
                  onClick={() => setShowPhotoUploader(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <PhotoUploader
                visitId={visit.visitId}
                existingPhotos={visit.allPhotos || []}
                onPhotosUpdate={async (updatedPhotos, addedCount) => {
                  console.log('📸 Zdjęcia zaktualizowane:', updatedPhotos.length, `(+${addedCount} nowych)`);
                  
                  // Odśwież dane wizyty z serwera
                  await loadVisitDetails();
                  
                  // Komunikat sukcesu (tylko przy dodawaniu)
                  if (addedCount > 0) {
                    showToast.success(`Dodano ${addedCount} ${addedCount === 1 ? 'zdjęcie' : 'zdjęć'} do wizyty!`);
                    
                    // Zamknij modal po sukcesie
                    setTimeout(() => setShowPhotoUploader(false), 1500);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Completion Wizard Modal - Smart Visit Completion System */}
      {showCompletionWizard && (
        <CompletionWizard
          visit={{
            ...visit,
            visitId: visit.visitId || visitId,
            photos: visit.allPhotos || [],
            status: visit.status
          }}
          onComplete={async (result) => {
            console.log('✅ Wizyta zakończona:', result);
            setShowCompletionWizard(false);
            
            // Reload visit to get fresh data with completion info
            await loadVisitDetails();
            
            // Optional: Show success message
            showToast.success(`Wizyta ${visit.visitId} zakończona pomyślnie!\n\n` +
                  `Typ: ${result.completionType}\n` +
                  `Zdjęcia: ${result.completionPhotos || 0}\n` +
                  (result.modelsDetected > 0 ? `Wykryto modeli: ${result.modelsDetected}` : ''));
            
            // Optional: Navigate back to visits list
            // router.push('/technician/visits');
          }}
          onCancel={() => setShowCompletionWizard(false)}
        />
      )}

      {/* Vehicle Inventory Modal - Use Parts from Technician's Vehicle */}
      {showVehicleInventory && (
        <VehicleInventoryModal
          visitId={visit?.visitId || visitId}
          onPartsUsed={async (usage, parts) => {
            console.log(`✅ Used ${parts.length} parts from vehicle inventory:`, usage);
            console.log(`💰 Total value: ${usage.totalValue.toFixed(2)} zł`);
            
            // Reload visit and vehicle parts usage
            await loadVisitDetails();
            await loadVehiclePartsUsage();
            
            // Parts are now visible in the Parts tab with "🚗 Razem części z pojazdu: X zł"
          }}
          onClose={() => setShowVehicleInventory(false)}
        />
      )}

      {/* Add Visit Modal - Add another visit to the same order */}
      {isAddVisitModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  📅 Dodaj kolejną wizytę do zlecenia
                </h2>
                <button
                  onClick={() => setIsAddVisitModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      Dodajesz wizytę do zlecenia: {visit.visitId}
                    </p>
                    <p className="text-sm text-blue-700">
                      Klient: {visit.client?.name}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                  const token = localStorage.getItem('technicianToken');
                  const res = await fetch('/api/technician/add-visit-to-order', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      orderId: visit.orderId,
                      visitType: formData.get('visitType'),
                      scheduledDate: formData.get('scheduledDate'),
                      description: formData.get('description')
                    })
                  });

                  const data = await res.json();

                  if (data.success) {
                    showToast.success(`Dodano nową wizytę!\n\nID: ${data.visitId}\nTyp: ${formData.get('visitType')}`);
                    setIsAddVisitModalOpen(false);
                    router.push(`/technician/visit/${data.visitId}`);
                  } else {
                    showToast.error(`Błąd: ${data.error}`);
                  }
                } catch (error) {
                  console.error('Error adding visit:', error);
                  showToast.error('Błąd podczas dodawania wizyty');
                }
              }}>
                <div className="space-y-4">
                  {/* Typ wizyty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Typ wizyty *
                    </label>
                    <select
                      name="visitType"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="repair">🔧 Naprawa</option>
                      <option value="diagnosis">🔍 Diagnoza</option>
                      <option value="control">✓ Kontrola</option>
                      <option value="installation">📦 Instalacja</option>
                      <option value="warranty">🛡️ Gwarancja</option>
                    </select>
                  </div>

                  {/* Data wizyty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planowana data i godzina <span className="text-gray-400 text-xs">(opcjonalne)</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledDate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Możesz pozostawić puste - wizyta będzie w statusie "Do zaplanowania"
                    </p>
                  </div>

                  {/* Opis */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opis problemu / cel wizyty
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      placeholder="Np. Wymiana uszczelki po diagnozie, kontrola po naprawie..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddVisitModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Dodaj wizytę
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal edycji daty wizyty */}
      {isEditVisitDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {visit?.scheduledDate ? 'Zmień termin wizyty' : 'Zaplanuj wizytę w harmonogramie'}
                </h2>
                <button
                  onClick={() => setIsEditVisitDateModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                
                if (!editDateForm.date) {
                  alert('Proszę wybrać datę wizyty');
                  return;
                }

                try {
                  const response = await fetch('/api/technician/update-visit-date', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('technicianToken')}`
                    },
                    body: JSON.stringify({
                      visitId: visit.visitId,
                      scheduledDate: editDateForm.date,
                      scheduledTime: editDateForm.time
                    })
                  });

                  if (!response.ok) {
                    throw new Error('Błąd podczas aktualizacji terminu wizyty');
                  }

                  // Sukces - zamknij modal i odśwież dane
                  setIsEditVisitDateModal(false);
                  loadVisitDetails(); // Odśwież dane wizyty
                  
                  // Pokaż komunikat sukcesu
                  alert('Termin wizyty został zaktualizowany');
                } catch (error) {
                  console.error('Error updating visit date:', error);
                  alert('Wystąpił błąd podczas zapisywania terminu wizyty');
                }
              }}>
                <div className="space-y-4">
                  {/* Data wizyty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data wizyty *
                    </label>
                    <input
                      type="date"
                      value={editDateForm.date}
                      onChange={(e) => setEditDateForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Godzina wizyty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Godzina wizyty (opcjonalnie)
                    </label>
                    <input
                      type="time"
                      value={editDateForm.time}
                      onChange={(e) => setEditDateForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Wizyta zostanie zaplanowana w Twoim harmonogramie na wybrany termin.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditVisitDateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {visit?.scheduledDate ? 'Zmień termin' : 'Zaplanuj wizytę'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
