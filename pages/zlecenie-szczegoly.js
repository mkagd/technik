// pages/zlecenie-szczegoly.js
// Strona szczegółów zlecenia dla pracownika z skanerem tabliczek znamionowych

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FiArrowLeft,
  FiCamera,
  FiMapPin,
  FiPhone,
  FiTool,
  FiClock,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiPackage,
  FiList,
  FiFileText,
  FiDollarSign,
  FiZap,
  FiSettings,
  FiEdit
} from 'react-icons/fi';
import ModelOCRScanner from '../components/ModelOCRScanner';
import ModelAIScanner from '../components/ModelAIScanner';

export default function ZlecenieSzczegoly() {
  const router = useRouter();
  const { id } = router.query;
  
  const [employee, setEmployee] = useState(null);
  const [task, setTask] = useState(null);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showAIScanner, setShowAIScanner] = useState(false);
  const [detectedModels, setDetectedModels] = useState([]);
  const [notes, setNotes] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);

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
    if (id && employee) {
      loadTaskDetails();
    }
  }, [id, employee]);

  const loadTaskDetails = async () => {
    try {
      setIsLoading(true);
      
      // Pobierz zadanie z API
      const today = new Date().toISOString().split('T')[0];
      const tasksResponse = await fetch(`/api/employee-tasks?employeeId=${employee.id}&date=${today}`);
      const tasksData = await tasksResponse.json();
      
      if (tasksData.success) {
        const foundTask = tasksData.tasks.find(t => t.id === id);
        if (foundTask) {
          setTask(foundTask);
          
          // Jeśli task ma orderId, pobierz szczegóły zamówienia
          if (foundTask.orderId) {
            const orderResponse = await fetch('/api/orders');
            const orderData = await orderResponse.json();
            
            if (orderData.success) {
              const foundOrder = orderData.orders.find(o => o.id === foundTask.orderId);
              if (foundOrder) {
                setOrder(foundOrder);
              }
            }
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Błąd ładowania szczegółów zlecenia:', error);
      setIsLoading(false);
    }
  };

  const handleModelDetected = (models) => {
    console.log('🔍 Wykryte modele:', models);
    setDetectedModels(prev => [...prev, ...models]);
    
    // Zapisz w kontekście zlecenia
    if (task && models.length > 0) {
      const detectionLog = {
        taskId: task.id,
        orderId: task.orderId,
        models: models,
        timestamp: new Date().toISOString(),
        employeeId: employee?.id
      };
      
      // Zapisz lokalnie
      const existingLogs = JSON.parse(localStorage.getItem('modelDetectionLogs') || '[]');
      localStorage.setItem('modelDetectionLogs', JSON.stringify([detectionLog, ...existingLogs]));
    }
  };

  // Handler dla ModelAIScanner - lepsze rozpoznawanie z GPT-4o Mini Vision
  const handleAIModelDetected = (models) => {
    console.log('🔍 handleAIModelDetected - models:', models);
    
    if (!models || models.length === 0) {
      alert('❌ Nie wykryto modelu na tabliczce');
      setShowAIScanner(false);
      return;
    }
    
    const detectedModel = models[0];
    
    // Walidacja modelu
    if (!detectedModel || typeof detectedModel !== 'object') {
      console.error('❌ Nieprawidłowy format modelu:', detectedModel);
      alert('❌ Błąd: Nieprawidłowe dane z skanera');
      setShowAIScanner(false);
      return;
    }
    
    console.log('🤖 AI wykrył model:', detectedModel);
    
    // Aktualizuj dane zlecenia
    if (order) {
      const deviceInfo = {
        type: detectedModel.type || detectedModel.finalType || order.deviceType,
        brand: detectedModel.brand || order.brand,
        model: detectedModel.model || detectedModel.finalModel || order.model,
        serialNumber: detectedModel.serialNumber || order.serialNumber
      };
      
      // Sprawdź czy wykryto przynajmniej markę lub model
      if (!deviceInfo.brand && !deviceInfo.model) {
        alert('❌ Nie udało się rozpoznać marki ani modelu');
        setShowAIScanner(false);
        return;
      }
      
      // Pokaż powiadomienie
      const message = `✅ Rozpoznano:\n${deviceInfo.brand} ${deviceInfo.model}\nTyp: ${deviceInfo.type}`;
      alert(message);
      
      // Dodaj do wykrytych modeli (kompatybilność z istniejącym systemem)
      handleModelDetected([detectedModel]);
    }
    
    setShowAIScanner(false);
  };

  const updateTaskStatus = async (newStatus) => {
    try {
      const response = await fetch('/api/employee-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          taskId: task.id,
          status: newStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        setTask(prev => ({ ...prev, status: newStatus }));
        console.log(`✅ Status zlecenia zaktualizowany: ${newStatus}`);
      }
    } catch (error) {
      console.error('❌ Błąd aktualizacji statusu:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Zakończone';
      case 'in_progress':
        return 'W trakcie';
      case 'pending':
        return 'Oczekuje';
      default:
        return 'Nieznany';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'Pilne';
      case 'high':
        return 'Wysoki';
      case 'normal':
        return 'Normalny';
      case 'low':
        return 'Niski';
      default:
        return 'Normalny';
    }
  };

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

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zlecenie nie znalezione</h2>
          <p className="text-gray-600 mb-6">Nie można załadować szczegółów zlecenia</p>
          <button
            onClick={() => router.push('/pracownik-panel')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Powrót do panelu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Zlecenie #{task.id}
                </h1>
                <p className="text-sm text-gray-600">
                  {task.customerName}
                </p>
              </div>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna - Szczegóły */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Informacje podstawowe */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiFileText className="h-5 w-5 mr-2" />
                  Informacje o zleceniu
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <FiClock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Godzina</p>
                      <p className="font-medium text-gray-900">{task.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiCalendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Data</p>
                      <p className="font-medium text-gray-900">{task.date || 'Dzisiaj'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiUser className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Klient</p>
                      <p className="font-medium text-gray-900">{task.customerName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiPhone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <a href={`tel:${task.phone}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {task.phone}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start col-span-2">
                    <FiMapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Adres</p>
                      <p className="font-medium text-gray-900">{task.address}</p>
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(task.address)}`, '_blank')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        🗺️ Otwórz nawigację
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start col-span-2">
                    <FiTool className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Urządzenie</p>
                      <p className="font-medium text-gray-900">{task.device}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Opis problemu</p>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {task.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">Priorytet</p>
                      <p className={`font-medium ${getPriorityColor(task.priority)}`}>
                        ● {getPriorityLabel(task.priority)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Szacowany czas</p>
                      <p className="font-medium text-gray-900">~{task.estimatedDuration} min</p>
                    </div>
                  </div>
                  
                  {order && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Wartość zlecenia</p>
                      <p className="text-lg font-bold text-green-600">{order.totalCost} PLN</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Wykryte modele */}
            {detectedModels.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiZap className="h-5 w-5 mr-2 text-purple-600" />
                    Wykryte modele ({detectedModels.length})
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {detectedModels.map((model, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{model.name}</h3>
                            <p className="text-sm text-gray-600">{model.brand} - {model.type}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            model.confidence === 'high' ? 'bg-green-100 text-green-800' :
                            model.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {model.confidence === 'high' ? 'Wysokie' :
                             model.confidence === 'medium' ? 'Średnie' : 'Niskie'} dopasowanie
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                          {model.model && (
                            <div>
                              <span className="text-gray-500">Model:</span>
                              <span className="ml-2 font-medium">{model.model}</span>
                            </div>
                          )}
                          {model.serialNumber && (
                            <div>
                              <span className="text-gray-500">S/N:</span>
                              <span className="ml-2 font-medium">{model.serialNumber}</span>
                            </div>
                          )}
                          {model.capacity && (
                            <div>
                              <span className="text-gray-500">Pojemność:</span>
                              <span className="ml-2 font-medium">{model.capacity}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Źródło:</span>
                            <span className="ml-2 font-medium">{model.aiProvider || 'AI Scanner'}</span>
                          </div>
                        </div>
                        
                        {model.additionalInfo && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600">{model.additionalInfo}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notatki */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiEdit className="h-5 w-5 mr-2" />
                  Notatki serwisowe
                </h2>
              </div>
              
              <div className="p-6">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dodaj notatki dotyczące naprawy, użytych części, obserwacji..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="mt-3 flex justify-end">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Zapisz notatki
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Prawa kolumna - Akcje */}
          <div className="space-y-6">
            
            {/* Akcje */}
            <div className="bg-white rounded-lg shadow sticky top-24">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Akcje</h2>
              </div>
              
              <div className="p-6 space-y-3">
                {/* Skaner tabliczek */}
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <FiCamera className="h-5 w-5 mr-2" />
                  Skanuj tabliczkę znamionową
                </button>
                
                {/* Skaner AI (GPT-4o Vision) */}
                <button
                  onClick={() => setShowAIScanner(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
                >
                  🤖 Skanuj AI (AMICA Detection)
                </button>
                
                {/* Status zlecenia */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Zmień status zlecenia:</p>
                  
                  {task.status === 'pending' && (
                    <button
                      onClick={() => updateTaskStatus('in_progress')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      ▶️ Rozpocznij zlecenie
                    </button>
                  )}
                  
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => updateTaskStatus('completed')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <FiCheckCircle className="h-5 w-5 mr-2" />
                      Zakończ zlecenie
                    </button>
                  )}
                  
                  {task.status === 'completed' && (
                    <div className="flex items-center justify-center text-green-600 font-medium py-3">
                      <FiCheckCircle className="h-5 w-5 mr-2" />
                      Zlecenie zakończone
                    </div>
                  )}
                </div>
                
                {/* Szybkie akcje */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <button
                    onClick={() => window.open(`tel:${task.phone}`, '_self')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <FiPhone className="h-4 w-4 mr-2" />
                    Zadzwoń do klienta
                  </button>
                  
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(task.address)}`, '_blank')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <FiMapPin className="h-4 w-4 mr-2" />
                    Nawigacja GPS
                  </button>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <FiZap className="h-5 w-5 text-blue-600 flex-shrink-0 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Skaner AI</h3>
                  <p className="text-sm text-blue-700">
                    Użyj skanera tabliczek znamionowych aby automatycznie rozpoznać model urządzenia za pomocą AI. 
                    System rozpoznaje marki AMICA (Typ jako model), WHIRLPOOL, CANDY, HOOVER i inne.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Skanera */}
      {showScanner && (
        <ModelOCRScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onModelDetected={handleModelDetected}
        />
      )}

      {/* Modal Skanera AI */}
      {showAIScanner && (
        <ModelAIScanner
          isOpen={showAIScanner}
          onClose={() => setShowAIScanner(false)}
          onModelDetected={handleAIModelDetected}
        />
      )}
    </div>
  );
}
