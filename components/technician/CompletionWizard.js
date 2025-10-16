// components/technician/CompletionWizard.js
// 🎯 Ulepszone kończenie wizyty z analizą AI i workflow

import { useState, useEffect } from 'react';
import { FiCamera, FiCheck, FiX, FiLoader, FiAlertCircle, FiShoppingCart, FiClock } from 'react-icons/fi';
import PhotoUploader from './PhotoUploader';
import { getUniversalToken, syncAllTokens } from '../../utils/tokenHelper';

export default function CompletionWizard({ visit, onComplete, onCancel }) {
  const [step, setStep] = useState('photos'); // photos → analysis → completion → summary
  
  // 📸 Zdjęcia: istniejące z wizyty + nowe z completion
  const existingPhotos = visit.photos || []; // Zdjęcia już dodane do wizyty wcześniej
  const [photos, setPhotos] = useState([...existingPhotos]); // Wszystkie zdjęcia (stare + nowe)
  
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedModels, setDetectedModels] = useState([]);
  const [completionType, setCompletionType] = useState(null);
  const [notes, setNotes] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // 💰 Finansowe - pełne rozliczenie z klientem
  const [partsCost, setPartsCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [prepaidAmount, setPrepaidAmount] = useState(''); // Zaliczka z zamówienia części
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [paidAmount, setPaidAmount] = useState('');
  
  // 📊 Liczniki zdjęć
  const newPhotos = photos.filter(p => !existingPhotos.find(ep => ep.id === p.id)); // Nowe zdjęcia z completion
  const completionPhotos = [...existingPhotos, ...newPhotos]; // WSZYSTKIE zdjęcia (stare + nowe)
  
  console.log(`📸 Zdjęcia: ${existingPhotos.length} istniejących + ${newPhotos.length} nowych = ${completionPhotos.length} razem`);

  // Completion types
  const completionTypes = {
    diagnosis_complete: {
      label: '✅ Diagnoza zakończona',
      description: 'Problem zdiagnozowany, nie wymaga naprawy',
      color: 'bg-green-50 border-green-300 text-green-800',
      icon: '🔍✓'
    },
    diagnosis_continue: {
      label: '🔧 Diagnoza → Naprawa',
      description: 'Zdiagnozowano, potrzebna kolejna wizyta naprawy',
      color: 'bg-blue-50 border-blue-300 text-blue-800',
      icon: '🔍→🔧'
    },
    repair_complete: {
      label: '✅ Naprawa zakończona',
      description: 'Urządzenie naprawione i sprawne',
      color: 'bg-green-50 border-green-300 text-green-800',
      icon: '🔧✓'
    },
    repair_continue: {
      label: '⏳ Naprawa → Kontynuacja',
      description: 'Częściowo naprawione, wymaga kolejnej wizyty',
      color: 'bg-yellow-50 border-yellow-300 text-yellow-800',
      icon: '🔧→⏳'
    },
    no_access: {
      label: '🚫 Brak dostępu',
      description: 'Nie udało się wejść do mieszkania/urządzenia',
      color: 'bg-red-50 border-red-300 text-red-800',
      icon: '🚫'
    }
  };

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 💰 Auto-wypełnianie kosztów części z part-requests + części z pojazdu
  useEffect(() => {
    if (!visit?.visitId) return;

    const loadPartRequestsAndVehicleParts = async () => {
      try {
        let totalPartsCost = 0;
        let totalPrepaid = 0;

        // 1️⃣ Załaduj zamówienia części (part-requests)
        const partReqRes = await fetch(`/api/part-requests?visitId=${visit.visitId}`);
        if (partReqRes.ok) {
          const partReqData = await partReqRes.json();
          
          if (partReqData.requests && partReqData.requests.length > 0) {
            console.log('💰 Znaleziono part-requests dla wizyty:', partReqData.requests.length);

            // Załaduj dane części z parts.json aby pobrać ceny
            const partsRes = await fetch('/api/parts');
            if (partsRes.ok) {
              const partsData = await partsRes.json();
              const partsMap = new Map(partsData.parts.map(p => [p.id, p]));

              partReqData.requests.forEach(request => {
                request.parts.forEach(part => {
                  const partData = partsMap.get(part.partId);
                  if (partData && partData.price) {
                    totalPartsCost += partData.price * part.quantity;
                  }
                });

                // Sumuj zaliczki
                if (request.prepayment?.isPrepaid && request.prepayment?.amount) {
                  totalPrepaid += request.prepayment.amount;
                }
              });
            }
          }
        }

        // 2️⃣ Załaduj użyte części z pojazdu (part-usage)
        const token = getUniversalToken();
        const usageRes = await fetch(`/api/inventory/personal/history?orderId=${visit.visitId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          
          if (usageData.success && usageData.usageHistory && usageData.usageHistory.length > 0) {
            console.log('🚗 Znaleziono części z pojazdu dla wizyty:', usageData.usageHistory.length);

            usageData.usageHistory.forEach(usage => {
              totalPartsCost += usage.totalValue || 0;
              console.log(`  + ${usage.parts?.length || 0} części, wartość: ${usage.totalValue} zł`);
            });
          }
        } else {
          console.warn('⚠️ Nie udało się pobrać części z pojazdu:', usageRes.status);
        }

        // Auto-wypełnij pola finansowe
        if (totalPartsCost > 0) {
          setPartsCost(totalPartsCost.toFixed(2));
          console.log('✅ Auto-wypełniono koszt części:', totalPartsCost, 'zł (zamówienia + pojazd)');
        }

        if (totalPrepaid > 0) {
          setPrepaidAmount(totalPrepaid.toFixed(2));
          console.log('✅ Auto-wypełniono zaliczkę:', totalPrepaid, 'zł');
        }

      } catch (error) {
        console.error('❌ Błąd ładowania kosztów części:', error);
      }
    };

    loadPartRequestsAndVehicleParts();
  }, [visit?.visitId]);

  // Photos are managed by PhotoUploader component

  // AI Analysis in background
  const analyzePhotosInBackground = async (photoList) => {
    setAnalyzing(true);
    
    try {
      // Skip if offline - will analyze when back online
      if (isOffline) {
        console.log('📴 Offline - analiza zostanie wykonana po połączeniu z internetem');
        return;
      }

      const token = localStorage.getItem('technicianToken');
      
      // Get completion photos (serial/after/completion only)
      const photosToAnalyze = photoList.filter(p => 
        p.type === 'serial' || p.type === 'after' || p.type === 'completion'
      );
      
      if (photosToAnalyze.length === 0) {
        console.log('⚠️ Brak zdjęć do analizy AI');
        return;
      }

      // Send photo IDs/URLs for AI analysis
      const response = await fetch('/api/ai/analyze-visit-photos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          photoIds: photosToAnalyze.map(p => p.id),
          photoUrls: photosToAnalyze.map(p => p.url || p.path)
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.models && result.models.length > 0) {
          setDetectedModels(result.models);
          
          // Show notification
          showNotification('🤖 AI wykrył model urządzenia!', result.models[0].model);
        }
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      // Silent fail - nie blokuj workflow
    } finally {
      setAnalyzing(false);
    }
  };

  // Offline storage handled by PhotoUploader and Service Worker

  // Notification helper
  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  };

  // Next step validation
  const canProceed = () => {
    if (step === 'photos') {
      // Wymagamy min 2 zdjęć kategorii completion
      return completionPhotos.length >= 2;
    }
    if (step === 'completion') return completionType !== null;
    return true;
  };

  // Final submission
  const handleSubmit = async () => {
    try {
      setUploading(true);
      
      // 🔑 Universal token - działa z KAŻDYM systemem logowania
      const token = getUniversalToken();
      
      if (!token) {
        alert('❌ Brak tokenu autoryzacji! Zaloguj się ponownie.');
        window.location.href = '/pracownik-logowanie';
        return;
      }
      
      console.log('🔑 Using token for complete-visit:', token.substring(0, 20) + '...');

      // Prepare completion data (JSON, not FormData - photos already uploaded)
      const completionData = {
        visitId: visit.visitId,
        completionType,
        notes,
        detectedModels,
        selectedParts,
        photoIds: photos.map(p => p.id), // Reference existing photos
        completionPhotoIds: completionPhotos.map(p => p.id), // Specifically completion photos
        
        // 💰 Pełne rozliczenie z klientem
        payment: (partsCost || laborCost || paymentMethod) ? {
          partsCost: parseFloat(partsCost) || 0,
          laborCost: parseFloat(laborCost) || 0,
          prepaidAmount: parseFloat(prepaidAmount) || 0,
          totalCost: (parseFloat(partsCost) || 0) + (parseFloat(laborCost) || 0),
          amountDue: (parseFloat(partsCost) || 0) + (parseFloat(laborCost) || 0) - (parseFloat(prepaidAmount) || 0),
          paymentMethod: paymentMethod || null,
          paymentStatus: paymentStatus,
          paidAmount: parseFloat(paidAmount) || 0
        } : null
      };

      // If offline, queue for later
      if (isOffline) {
        await queueOfflineSubmission(completionData);
        
        alert('📴 Offline: Wizyta zostanie zsynchronizowana gdy wróci połączenie');
        onComplete();
        return;
      }

      // Online submission
      const response = await fetch('/api/technician/complete-visit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completionData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Success notification
        showNotification(
          '✅ Wizyta zakończona!',
          `${completionTypes[completionType].label} - ${visit.visitId}`
        );
        
        onComplete(result);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd serwera');
      }

    } catch (error) {
      console.error('Submit error:', error);
      alert(`Błąd podczas kończenia wizyty: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Offline queue management
  const queueOfflineSubmission = async (data) => {
    try {
      const db = await openIndexedDB();
      const tx = db.transaction('offline-queue', 'readwrite');
      const store = tx.objectStore('offline-queue');
      await store.add({
        ...data,
        timestamp: new Date().toISOString(),
        syncStatus: 'pending'
      });
      console.log('📦 Completion queued for offline sync');
    } catch (error) {
      console.error('Queue error:', error);
      throw error;
    }
  };

  const openIndexedDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TechnikVisits', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('offline-queue')) {
          db.createObjectStore('offline-queue', { keyPath: 'visitId' });
        }
      };
    });
  };

  // Render steps
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                📸 Zakończenie wizyty
                {isOffline && (
                  <span className="px-3 py-1 bg-yellow-500 text-xs rounded-full animate-pulse">
                    📴 OFFLINE
                  </span>
                )}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {visit.visitId} • {visit.client?.name}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-2 rounded-full ${step === 'photos' ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${step === 'completion' ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${step === 'summary' ? 'bg-white' : 'bg-white/30'}`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* STEP 1: Photos */}
          {step === 'photos' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  📸 Dodaj zdjęcia dokumentacyjne
                </h3>
                <p className="text-gray-600">
                  Minimum 2 zdjęcia kategorii: <strong>Po pracy</strong>, <strong>Ukończenie</strong> lub <strong>Tabliczka</strong>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  💡 Wybierz odpowiednią kategorię podczas dodawania zdjęć
                </p>
              </div>

              {/* Użyj istniejącego PhotoUploader */}
              <PhotoUploader
                visitId={visit.visitId}
                existingPhotos={photos}
                onPhotosUpdate={(updatedPhotos) => {
                  setPhotos(updatedPhotos);
                  
                  // Auto-analyze when photos added
                  const newCompletionPhotos = updatedPhotos.filter(p => 
                    p.type === 'after' || p.type === 'completion' || p.type === 'serial'
                  );
                  
                  if (newCompletionPhotos.length >= 2 && !analyzing) {
                    analyzePhotosInBackground(updatedPhotos);
                  }
                }}
              />

              {/* AI Analysis indicator */}
              {analyzing && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <FiLoader className="w-6 h-6 text-purple-600 animate-spin" />
                    <div>
                      <p className="font-semibold text-purple-900">🤖 AI analizuje zdjęcia...</p>
                      <p className="text-sm text-purple-700">Rozpoznawanie modelu urządzenia w tle</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detected models */}
              {detectedModels.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <FiCheck className="w-5 h-5" />
                    🤖 AI wykrył modele:
                  </h4>
                  <div className="space-y-2">
                    {detectedModels.map((model, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="font-bold text-gray-900">{model.brand} {model.model}</p>
                        <p className="text-sm text-gray-600">Pewność: {model.confidence}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress indicator */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-900">Postęp zdjęć</span>
                  <span className="text-blue-700">{completionPhotos.length} / 2 min</span>
                </div>
                <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (completionPhotos.length / 2) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-gray-600">
                    {existingPhotos.length > 0 ? (
                      <>
                        ✅ <strong>{existingPhotos.length}</strong> już w zleceniu + <strong>{newPhotos.length}</strong> nowych = <strong>{completionPhotos.length}</strong> razem
                      </>
                    ) : (
                      <>
                        📸 {completionPhotos.length} zdjęć • Wszystkich: {photos.length}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Completion Type */}
          {step === 'completion' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  📋 Wybierz typ zakończenia
                </h3>
                <p className="text-gray-600">
                  Co zostało zrobione podczas tej wizyty?
                </p>
              </div>

              {/* Completion type cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(completionTypes).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => setCompletionType(key)}
                    className={`p-6 border-2 rounded-xl text-left transition-all hover:scale-105 ${
                      completionType === key
                        ? type.color + ' shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-4xl mb-3">{type.icon}</div>
                    <h4 className="font-bold text-lg mb-2">{type.label}</h4>
                    <p className="text-sm opacity-80">{type.description}</p>
                  </button>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  📝 Dodatkowe informacje
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="np. Wymieniono pompę odpływową, wyczyszczono filtr..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Quick part ordering */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4">
                <button
                  onClick={() => {/* TODO: Open part ordering modal */}}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <FiShoppingCart className="w-6 h-6 text-orange-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">🛒 Zamów część</p>
                      <p className="text-sm text-gray-600">Potrzebujesz części do kolejnej wizyty?</p>
                    </div>
                  </div>
                  <div className="text-orange-600">→</div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Summary */}
          {step === 'summary' && completionType && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{completionTypes[completionType].icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Podsumowanie wizyty
                </h3>
                <p className="text-gray-600">
                  Sprawdź wszystkie dane przed zakończeniem
                </p>
              </div>

              {/* Summary cards */}
              <div className="space-y-4">
                {/* Type */}
                <div className={`p-4 rounded-lg border-2 ${completionTypes[completionType].color}`}>
                  <p className="text-sm font-medium opacity-80">Typ zakończenia</p>
                  <p className="text-lg font-bold">{completionTypes[completionType].label}</p>
                </div>

                {/* Photos */}
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-600">
                      📸 Zdjęcia razem: <strong className="text-gray-900">{completionPhotos.length}</strong>
                    </p>
                    {existingPhotos.length > 0 && (
                      <span className="text-xs text-green-600 font-medium">
                        ✅ {existingPhotos.length} już było + {newPhotos.length} nowych
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {completionPhotos.slice(0, 4).map((photo) => {
                      const isExisting = existingPhotos.find(ep => ep.id === photo.id);
                      return (
                        <div key={photo.id} className="relative">
                          <img
                            src={photo.url || photo.path}
                            alt="Zdjęcie"
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                            {isExisting ? '📎' : '�'}
                          </div>
                        </div>
                      );
                    })}
                    {completionPhotos.length > 4 && (
                      <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-bold">
                        +{completionPhotos.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Models */}
                {detectedModels.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <p className="text-sm font-medium text-purple-900 mb-2">🤖 AI wykrył:</p>
                    {detectedModels.map((model, idx) => (
                      <p key={idx} className="font-bold text-purple-800">
                        {model.brand} {model.model}
                      </p>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {notes && (
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">Notatki:</p>
                    <p className="text-gray-800">{notes}</p>
                  </div>
                )}

                {/* Time */}
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-2">
                    <FiClock className="inline mr-2" />
                    Czas pracy:
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    {visit.workTime || '?'} minut
                  </p>
                </div>

                {/* 💰 Pełne rozliczenie z klientem */}
                <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                  <h4 className="text-md font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    💰 Rozliczenie z klientem
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Koszt części */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Koszt użytych części (PLN)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={partsCost}
                        onChange={(e) => setPartsCost(e.target.value)}
                        placeholder="np. 50.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    {/* Koszt robocizny */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Koszt robocizny (PLN)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value)}
                        placeholder="np. 150.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    {/* Zaliczka */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zaliczka wpłacona wcześniej (PLN)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={prepaidAmount}
                        onChange={(e) => setPrepaidAmount(e.target.value)}
                        placeholder="np. 50.00 (jeśli była)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Jeśli klient opłacił część z góry podczas diagnozy
                      </p>
                    </div>

                    {/* Podsumowanie kwot */}
                    {((parseFloat(partsCost) || 0) > 0 || (parseFloat(laborCost) || 0) > 0 || (parseFloat(prepaidAmount) || 0) > 0) && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-400">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Części:</span>
                          <span className="font-medium">{(parseFloat(partsCost) || 0).toFixed(2)} zł</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Robocizna:</span>
                          <span className="font-medium">{(parseFloat(laborCost) || 0).toFixed(2)} zł</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1 text-blue-600">
                          <span>Suma:</span>
                          <span className="font-medium">
                            {((parseFloat(partsCost) || 0) + (parseFloat(laborCost) || 0)).toFixed(2)} zł
                          </span>
                        </div>
                        {(parseFloat(prepaidAmount) || 0) > 0 && (
                          <div className="flex justify-between text-sm mb-1 text-green-600">
                            <span>- Zaliczka:</span>
                            <span className="font-medium">-{(parseFloat(prepaidAmount) || 0).toFixed(2)} zł</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-yellow-900 pt-2 border-t border-yellow-300">
                          <span>Do zapłaty:</span>
                          <span>
                            {(
                              (parseFloat(partsCost) || 0) + 
                              (parseFloat(laborCost) || 0) - 
                              (parseFloat(prepaidAmount) || 0)
                            ).toFixed(2)} zł
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sposób płatności */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sposób płatności
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">-- Wybierz --</option>
                        <option value="cash">💵 Gotówka</option>
                        <option value="card">💳 Karta</option>
                        <option value="transfer">🏦 Przelew</option>
                        <option value="deferred">⏰ Odroczona</option>
                      </select>
                    </div>

                    {/* Status zapłaty */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status zapłaty
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="unpaid">❌ Nie zapłacono</option>
                        <option value="paid">✅ Zapłacono</option>
                        <option value="partial">⚠️ Częściowo</option>
                      </select>
                    </div>

                    {/* Zapłacona kwota (jeśli partial/paid) */}
                    {paymentStatus !== 'unpaid' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zapłacona kwota (PLN)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          placeholder="np. 200.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t-2 border-gray-200 bg-gray-50 rounded-b-2xl sticky bottom-0">
          {step !== 'photos' && (
            <button
              onClick={() => {
                if (step === 'completion') setStep('photos');
                else if (step === 'summary') setStep('completion');
              }}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              ← Wstecz
            </button>
          )}
          
          <button
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Anuluj
          </button>

          <button
            onClick={() => {
              if (step === 'photos' && canProceed()) setStep('completion');
              else if (step === 'completion' && canProceed()) setStep('summary');
              else if (step === 'summary') handleSubmit();
            }}
            disabled={!canProceed() || uploading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <FiLoader className="animate-spin" />
                {isOffline ? 'Zapisywanie offline...' : 'Wysyłanie...'}
              </span>
            ) : step === 'summary' ? (
              '✅ Zakończ wizytę'
            ) : (
              'Dalej →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
