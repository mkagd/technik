import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function TechnicianZamow() {
  const router = useRouter();
  
  // ✅ FIX: Get employeeId from localStorage (supports multiple login methods)
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Sprawdź różne źródła danych pracownika
    const technicianData = localStorage.getItem('technicianEmployee');
    const employeeSessionData = localStorage.getItem('employeeSession');
    const serwisData = localStorage.getItem('serwisEmployee');

    let employeeData = null;
    
    if (technicianData) {
      employeeData = JSON.parse(technicianData);
    } else if (employeeSessionData) {
      employeeData = JSON.parse(employeeSessionData);
    } else if (serwisData) {
      employeeData = JSON.parse(serwisData);
    }

    if (employeeData && employeeData.id) {
      setEmployeeId(employeeData.id);
      console.log('✅ Załadowano pracownika:', employeeData.fullName || employeeData.name, '(ID:', employeeData.id + ')');
    } else {
      alert('❌ Nie znaleziono danych pracownika. Zaloguj się ponownie.');
      router.push('/pracownik-logowanie');
    }
  }, [router]);
  const [parts, setParts] = useState([]);
  const [selectedParts, setSelectedParts] = useState([{ partId: '', quantity: 1 }]);
  const [urgency, setUrgency] = useState('standard');
  const [delivery, setDelivery] = useState('paczkomat');
  const [paczkomatId, setPaczkomatId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 🆕 Kontekst naprawy
  const [orderNumber, setOrderNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  
  // Photo upload states
  const [photos, setPhotos] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // 🆕 Prawdziwe dane
  const [recentOrders, setRecentOrders] = useState([]);
  const [frequentParts, setFrequentParts] = useState([]);

  // 🆕 Automatyczne wypełnianie z query params
  useEffect(() => {
    if (router.query.orderNumber) setOrderNumber(router.query.orderNumber);
    if (router.query.clientName) setClientName(router.query.clientName);
    if (router.query.deviceBrand) setDeviceBrand(router.query.deviceBrand);
    if (router.query.deviceModel) setDeviceModel(router.query.deviceModel);
    if (router.query.issueDescription) setIssueDescription(router.query.issueDescription);
  }, [router.query]);

  useEffect(() => {
    loadParts();
    if (employeeId) {
      loadRecentOrders();
      loadFrequentParts();
    }
  }, [employeeId]);

  const loadRecentOrders = async () => {
    try {
      const res = await fetch(`/api/part-requests?requestedFor=${employeeId}&limit=3`);
      const data = await res.json();
      if (data.requests) {
        setRecentOrders(data.requests.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  const loadFrequentParts = async () => {
    try {
      const res = await fetch(`/api/part-requests?requestedFor=${employeeId}`);
      const data = await res.json();
      if (data.requests) {
        // Policz częstotliwość części
        const partCount = {};
        data.requests.forEach(req => {
          req.parts.forEach(p => {
            partCount[p.partId] = (partCount[p.partId] || 0) + 1;
          });
        });
        
        // Posortuj i weź top 4
        const sorted = Object.entries(partCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([partId, count]) => ({ partId, count }));
        
        setFrequentParts(sorted);
      }
    } catch (error) {
      console.error('Error loading frequent parts:', error);
    }
  };

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const res = await fetch('/api/inventory/parts');
      const data = await res.json();
      setParts(data.parts || []);
    } catch (error) {
      console.error('Error loading parts:', error);
    }
  };

  const loadSuggestions = async (brand, model) => {
    try {
      const res = await fetch('/api/inventory/suggest-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          model,
          employeeId
        })
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const addPartRow = () => {
    setSelectedParts([...selectedParts, { partId: '', quantity: 1 }]);
  };

  const removePartRow = (index) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const updatePart = (index, field, value) => {
    const updated = [...selectedParts];
    updated[index][field] = value;
    setSelectedParts(updated);
  };

  const addSuggestedPart = (partId) => {
    const exists = selectedParts.find(p => p.partId === partId);
    if (exists) {
      alert('Ta część jest już dodana!');
      return;
    }
    setSelectedParts([...selectedParts, { partId, quantity: 1 }]);
    setShowSuggestions(false);
  };

  // 🆕 Załaduj poprzednie zamówienie
  const reorderFromHistory = (partId, partName) => {
    if (confirm(`Zamówić ponownie: ${partName}?`)) {
      setSelectedParts([{ partId, quantity: 1 }]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Photo handling functions
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    addPhotos(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    addPhotos(files);
  };

  const addPhotos = (files) => {
    if (photos.length + files.length > 5) {
      alert('Maksymalnie 5 zdjęć!');
      return;
    }

    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedParts.some(p => !p.partId)) {
      alert('Wybierz wszystkie części!');
      return;
    }
    if (delivery === 'paczkomat' && !paczkomatId) {
      alert('Podaj ID Paczkomatu!');
      return;
    }

    setLoading(true);
    try {
      // First, create the request
      const res = await fetch('/api/part-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedBy: employeeId,
          requestedFor: employeeId,
          parts: selectedParts.map(p => ({ partId: p.partId, quantity: parseInt(p.quantity) })),
          urgency,
          preferredDelivery: delivery,
          paczkomatId: delivery === 'paczkomat' ? paczkomatId : undefined,
          notes,
          // 🆕 Kontekst naprawy
          orderNumber: orderNumber || undefined,
          clientName: clientName || undefined,
          deviceInfo: (deviceBrand || deviceModel || issueDescription) ? {
            brand: deviceBrand || undefined,
            model: deviceModel || undefined,
            issueDescription: issueDescription || undefined
          } : undefined
        })
      });

      if (!res.ok) {
        const error = await res.json();
        alert('❌ Błąd: ' + error.error);
        return;
      }

      const data = await res.json();
      const requestId = data.request.requestId;

      // Upload photos if any
      let uploadedPhotos = [];
      if (photos.length > 0) {
        setUploadingPhotos(true);
        try {
          console.log('📸 Uploading', photos.length, 'photos...');
          const formData = new FormData();
          formData.append('requestId', requestId);
          
          photos.forEach((photo, index) => {
            console.log(`📎 Adding photo ${index + 1}:`, photo.name, photo.type, photo.size);
            formData.append('photo', photo);
          });

          console.log('🚀 Sending upload request...');
          const uploadRes = await fetch('/api/upload/part-photo', {
            method: 'POST',
            body: formData
          });

          console.log('📥 Upload response status:', uploadRes.status);
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedPhotos = uploadData.photos;
            console.log('✅ Upload successful:', uploadedPhotos);
            
            // Update request with photo URLs
            await fetch('/api/part-requests', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestId,
                attachedPhotos: uploadedPhotos
              })
            });
          } else {
            const errorData = await uploadRes.json();
            console.error('❌ Upload failed:', errorData);
            alert('⚠️ Nie udało się przesłać zdjęć: ' + (errorData.error || errorData.details || 'Unknown error'));
          }
        } catch (uploadError) {
          console.error('❌ Upload exception:', uploadError);
          alert('⚠️ Błąd podczas przesyłania zdjęć: ' + uploadError.message);
        } finally {
          setUploadingPhotos(false);
        }
      }

      // Pokaż potwierdzenie
      const shouldViewOrders = confirm(`✅ Zamówienie utworzone pomyślnie!\n\nNumer: ${requestId}\nStatus: Oczekuje na zatwierdzenie\n${photos.length > 0 ? `📸 Dodano ${photos.length} zdjęć\n` : ''}${urgency === 'urgent' ? '🔴 PILNE\n' : ''}${urgency === 'tomorrow' ? '⚠️ NA JUTRO\n' : ''}\nZostaniesz powiadomiony o statusie.\n\n👉 Kliknij OK aby zobaczyć listę zamówień\n👉 Kliknij Anuluj aby utworzyć kolejne zamówienie`);
      
      if (shouldViewOrders) {
        // Przekieruj do listy zamówień
        router.push('/serwis/magazyn/zamowienia');
      } else {
        // Reset form dla kolejnego zamówienia
        setSelectedParts([{ partId: '', quantity: 1 }]);
        setNotes('');
        setPaczkomatId('');
        setPhotos([]);
        setPhotoUrls([]);
      }

    } catch (error) {
      console.error('Error creating request:', error);
      alert('❌ Błąd: ' + error.message);
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zamów części</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Utwórz nowe zamówienie</p>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link href="/serwis/magazyn" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                ← Wróć
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 🆕 Quick Actions - Najczęściej zamawiane */}
        {frequentParts.length > 0 && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span className="mr-2">⚡</span>
              Twoje najczęściej zamawiane
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {frequentParts.map(item => {
                const part = parts.find(p => p.id === item.partId);
                if (!part) return null;
                
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => {
                      const newParts = [...selectedParts];
                      newParts[0] = { partId: part.id, quantity: 1 };
                      setSelectedParts(newParts);
                    }}
                    className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow transition-all"
                  >
                    <div className="text-2xl mb-1">
                      {part.category === 'Łożyska' ? '⚙️' : 
                       part.category === 'Pompy' ? '💧' : 
                       part.category === 'Grzałki' ? '🔥' : '📦'}
                    </div>
                    <div className="text-xs font-medium text-gray-900 truncate w-full text-center">
                      {part.name.split(' ')[0]}
                    </div>
                    <div className="text-xs text-gray-500">×{item.count}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Kliknij aby dodać do zamówienia
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
              {/* Quick Suggestions */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">💡 Szybkie sugestie</h3>
                <p className="text-xs text-gray-600 mb-3">Wpisz markę i model urządzenia, aby otrzymać sugestie części:</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Marka (np. Samsung)"
                    id="brand"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Model (np. WW90T4540AE)"
                    id="model"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const brand = document.getElementById('brand').value;
                      const model = document.getElementById('model').value;
                      if (brand && model) loadSuggestions(brand, model);
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-800"
                  >
                    Szukaj
                  </button>
                </div>
              </div>

              {/* Suggestions Results */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">✨ Sugerowane części ({suggestions.length})</h3>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2">
                    {suggestions.slice(0, 5).map((sugg, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-3 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{sugg.partName}</p>
                          <p className="text-xs text-gray-500">{sugg.partId} • {sugg.compatibility}% dopasowanie</p>
                          {sugg.inPersonalInventory && (
                            <span className="text-xs text-green-600 font-medium">✓ Masz w aucie!</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => addSuggestedPart(sugg.partId)}
                          className="ml-4 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Dodaj
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🆕 Kontekst naprawy */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="mr-2">🔧</span>
                  Kontekst naprawy (opcjonalnie)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nr zlecenia</label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="np. ORD-2025-001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Klient</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Jan Kowalski"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Marka urządzenia</label>
                    <input
                      type="text"
                      value={deviceBrand}
                      onChange={(e) => setDeviceBrand(e.target.value)}
                      placeholder="Samsung, Bosch..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      placeholder="WW90T4540AE"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opis usterki</label>
                    <textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="np. Nie kręci bęben, podejrzenie uszkodzonego łożyska..."
                      rows="2"
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  💡 Te informacje pomogą logistykowi lepiej zrozumieć kontekst zamówienia
                </p>
              </div>

              {/* Parts Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Części *
                  </label>
                  <button
                    type="button"
                    onClick={addPartRow}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Dodaj część
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedParts.map((part, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <select
                        value={part.partId}
                        onChange={(e) => updatePart(index, 'partId', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Wybierz część...</option>
                        {parts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.partNumber}) - {p.price} zł
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => updatePart(index, 'quantity', e.target.value)}
                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ilość"
                        required
                      />
                      {selectedParts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePartRow(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Urgency - Ulepszone wizualizacje */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ⏱️ Priorytet
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { 
                      value: 'standard', 
                      label: 'Standard', 
                      icon: '📦',
                      desc: '2-3 dni robocze', 
                      borderColor: 'border-gray-300',
                      bgColor: 'bg-white',
                      selectedBorder: 'border-gray-700',
                      cost: 'Bez opłat'
                    },
                    { 
                      value: 'urgent', 
                      label: 'Pilne', 
                      icon: '⚠️',
                      desc: 'Na jutro', 
                      borderColor: 'border-gray-300',
                      bgColor: 'bg-amber-50',
                      selectedBorder: 'border-amber-700',
                      cost: 'Standardowa'
                    },
                    { 
                      value: 'express', 
                      label: 'Express', 
                      icon: '🔴',
                      desc: 'Dzisiaj!', 
                      borderColor: 'border-gray-300',
                      bgColor: 'bg-rose-50',
                      selectedBorder: 'border-rose-700',
                      cost: '+25 zł po 15:00'
                    }
                  ].map(opt => (
                    <label key={opt.value} className="cursor-pointer group">
                      <div className={`border-2 rounded-xl p-4 transition-all ${
                        urgency === opt.value 
                          ? `${opt.selectedBorder} ${opt.bgColor} shadow-lg scale-105` 
                          : `${opt.borderColor} hover:shadow-md hover:scale-102`
                      }`}>
                        <input
                          type="radio"
                          name="urgency"
                          value={opt.value}
                          checked={urgency === opt.value}
                          onChange={(e) => setUrgency(e.target.value)}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className="text-4xl mb-2">{opt.icon}</div>
                          <p className="font-bold text-gray-900 text-base mb-1">{opt.label}</p>
                          <p className="text-sm text-gray-600 mb-2">{opt.desc}</p>
                          <p className="text-xs text-gray-500 font-medium">{opt.cost}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delivery */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dostawa
                </label>
                <div className="flex space-x-4 mb-3">
                  <label className="flex items-center flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300">
                    <input
                      type="radio"
                      name="delivery"
                      value="paczkomat"
                      checked={delivery === 'paczkomat'}
                      onChange={(e) => setDelivery(e.target.value)}
                      className="mr-2"
                    />
                    <div>
                      <p className="font-medium text-gray-900">📦 Paczkomat</p>
                      <p className="text-xs text-gray-500">InPost lub podobny</p>
                    </div>
                  </label>
                  <label className="flex items-center flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300">
                    <input
                      type="radio"
                      name="delivery"
                      value="office"
                      checked={delivery === 'office'}
                      onChange={(e) => setDelivery(e.target.value)}
                      className="mr-2"
                    />
                    <div>
                      <p className="font-medium text-gray-900">🏢 Biuro</p>
                      <p className="text-xs text-gray-500">Dostawa do firmy</p>
                    </div>
                  </label>
                </div>
                {delivery === 'paczkomat' && (
                  <input
                    type="text"
                    value={paczkomatId}
                    onChange={(e) => setPaczkomatId(e.target.value)}
                    placeholder="ID Paczkomatu (np. KRA01M)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={delivery === 'paczkomat'}
                  />
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notatka (opcjonalna)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dodatkowe informacje..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 Zdjęcia części (opcjonalne, max 5)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Dodaj zdjęcia części, aby logistyk wiedział dokładnie czego potrzebujesz
                </p>

                {/* Buttons for Photo/Camera */}
                <div className="flex gap-3 mb-4">
                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={photos.length >= 5}
                  />
                  <input
                    type="file"
                    id="camera-capture"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={photos.length >= 5}
                  />
                  
                  <label
                    htmlFor="photo-upload"
                    className={`flex-1 py-3 px-4 rounded-lg border-2 text-center cursor-pointer transition-all ${
                      photos.length >= 5
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-sm">Wybierz z galerii</span>
                    </div>
                  </label>

                  <label
                    htmlFor="camera-capture"
                    className={`flex-1 py-3 px-4 rounded-lg border-2 text-center cursor-pointer transition-all ${
                      photos.length >= 5
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium text-sm">Zrób zdjęcie</span>
                    </div>
                  </label>
                </div>

                {/* Drag & Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <p className="text-xs text-gray-500">
                    {photos.length >= 5 
                      ? 'Osiągnięto maksymalną liczbę zdjęć (5)'
                      : 'lub przeciągnij zdjęcia tutaj'
                    }
                  </p>
                </div>

                {/* Photo Previews */}
                {photoUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-5 gap-3">
                    {photoUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Zdjęcie ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center rounded-b-lg">
                          {(photos[index]?.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ {photos.length} {photos.length === 1 ? 'zdjęcie' : 'zdjęcia'} {photos.length > 4 ? 'zdjęć' : ''} gotowe do wysłania
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end space-x-4">
                <Link
                  href="/serwis/magazyn"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Anuluj
                </Link>
                <button
                  type="submit"
                  disabled={loading || uploadingPhotos}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading || uploadingPhotos ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {uploadingPhotos ? 'Wysyłanie zdjęć...' : 'Tworzenie...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Utwórz zamówienie {photos.length > 0 && `(${photos.length} 📸)`}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar - Quick Info */}
          <div className="space-y-6">
            {/* 🆕 Historia zamówień */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📜</span>
                Ostatnie zamówienia
              </h3>
              <div className="space-y-2">
                {recentOrders.length > 0 ? recentOrders.map(order => {
                  const firstPart = order.parts && order.parts[0];
                  const part = firstPart ? parts.find(p => p.id === firstPart.partId) : null;
                  const date = new Date(order.createdAt);
                  const formattedDate = `${date.getDate()}.${date.getMonth() + 1}`;
                  
                  return (
                    <div key={order.requestId} className="p-2 bg-gray-50 rounded border border-gray-200 hover:border-gray-400 transition-all group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-mono text-gray-600">{order.requestId}</div>
                        <div className={`text-xs px-2 py-0.5 rounded ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'approved' || order.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {order.status === 'delivered' ? '✓' : order.status === 'approved' || order.status === 'ordered' ? '✓' : '⏳'}
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-900 mb-1">
                        {part ? part.name : firstPart?.partId || 'Część'}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">{formattedDate}</div>
                        {firstPart && (
                          <button
                            type="button"
                            onClick={() => reorderFromHistory(firstPart.partId, part?.name || 'Część')}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            🔄 Zamów ponownie
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-xs text-gray-500 text-center py-4">
                    Brak zamówień
                  </div>
                )}
              </div>
              <Link
                href="/technician/magazyn/zamowienia"
                className="block text-xs text-blue-600 hover:text-blue-700 mt-3 font-medium"
              >
                Zobacz wszystkie →
              </Link>
            </div>

            {/* My Inventory Quick View */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">🚗 Szybki podgląd magazynu</h3>
              <Link
                href="/serwis/magazyn/moj-magazyn"
                className="block text-sm text-blue-600 hover:text-blue-700"
              >
                Zobacz pełny magazyn →
              </Link>
            </div>

            {/* 🆕 Podpowiedzi AI */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">🤖</span>
                Podpowiedzi AI
              </h3>
              <div className="text-xs text-gray-600 mb-3">
                Inni serwisanci do <strong>Samsung WW90</strong> brali również:
              </div>
              <div className="space-y-2">
                {[
                  { part: 'Łożysko bębna', percent: 85 },
                  { part: 'Pompa odpływowa', percent: 60 },
                  { part: 'Amortyzator', percent: 45 }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900">{item.part}</span>
                    <span className="text-xs text-gray-600 font-bold">{item.percent}%</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                💡 Na podstawie 150+ napraw
              </p>
            </div>

            {/* Info */}
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">💡 Wskazówki</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li>• Użyj sugestii, aby szybko znaleźć część</li>
                <li>• Zamówienia standardowe: do 3 dni</li>
                <li>• Pilne: do 24h (za dopłatą)</li>
                <li>• Express: tego samego dnia</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
