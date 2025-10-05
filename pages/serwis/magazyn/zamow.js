import { useState, useEffect } from 'react';
import Link from 'next/link';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function SerwisantZamow() {
    const router = useRouter();
  
  // ✅ FIX: Get employeeId from localStorage (like moj-magazyn.js)
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const employeeData = localStorage.getItem('serwisEmployee') || localStorage.getItem('technicianEmployee');
    if (employeeData) {
      const emp = JSON.parse(employeeData);
      setEmployeeId(emp.id);
    } else {
      alert('❌ Nie znaleziono danych pracownika. Zaloguj się ponownie.');
      router.push('/serwis/login');
    }
  }, []);
  const [parts, setParts] = useState([]);
  const [selectedParts, setSelectedParts] = useState([{ partId: '', quantity: 1 }]);
  const [urgency, setUrgency] = useState('standard');
  const [delivery, setDelivery] = useState('paczkomat');
  const [paczkomatId, setPaczkomatId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Photo upload states
  const [photos, setPhotos] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
          notes
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
        const formData = new FormData();
        formData.append('requestId', requestId);
        photos.forEach((photo) => {
          formData.append('photo', photo);
        });

        const uploadRes = await fetch('/api/upload/part-photo', {
          method: 'POST',
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedPhotos = uploadData.photos;
          
          // Update request with photo URLs
          await fetch('/api/part-requests', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId,
              attachedPhotos: uploadedPhotos
            })
          });
        }
        setUploadingPhotos(false);
      }

      alert(`✅ Zamówienie utworzone: ${requestId}\n${photos.length > 0 ? `📸 Dodano ${photos.length} zdjęć` : ''}`);
      
      // Reset form
      setSelectedParts([{ partId: '', quantity: 1 }]);
      setNotes('');
      setPaczkomatId('');
      setPhotos([]);
      setPhotoUrls([]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
              {/* Quick Suggestions */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Szybkie sugestie</h3>
                <p className="text-xs text-blue-700 mb-3">Wpisz markę i model urządzenia, aby otrzymać sugestie części:</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Marka (np. Samsung)"
                    id="brand"
                    className="flex-1 px-3 py-2 border border-blue-200 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Model (np. WW90T4540AE)"
                    id="model"
                    className="flex-1 px-3 py-2 border border-blue-200 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const brand = document.getElementById('brand').value;
                      const model = document.getElementById('model').value;
                      if (brand && model) loadSuggestions(brand, model);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Szukaj
                  </button>
                </div>
              </div>

              {/* Suggestions Results */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-green-900">✨ Sugerowane części ({suggestions.length})</h3>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-green-700 hover:text-green-900"
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

              {/* Urgency */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorytet
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'standard', label: 'Standard', desc: 'Normalna dostawa' },
                    { value: 'urgent', label: '🔥 Pilne', desc: 'Potrzebne szybko' },
                    { value: 'express', label: '⚡ Express', desc: 'Klient czeka!' }
                  ].map(opt => (
                    <label key={opt.value} className="flex-1">
                      <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                        urgency === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="urgency"
                          value={opt.value}
                          checked={urgency === opt.value}
                          onChange={(e) => setUrgency(e.target.value)}
                          className="sr-only"
                        />
                        <p className="font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
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

                {/* Drag & Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={photos.length >= 5}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer"
                  >
                    <div className="text-gray-600">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">
                        {photos.length >= 5 ? (
                          'Osiągnięto maksymalną liczbę zdjęć (5)'
                        ) : (
                          <>
                            <span className="text-blue-600">Kliknij aby wybrać</span> lub przeciągnij zdjęcia tutaj
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, WebP (max 10MB każde)
                      </p>
                    </div>
                  </label>
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

            {/* Info */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Wskazówki</h3>
              <ul className="space-y-2 text-xs text-blue-800">
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
