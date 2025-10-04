import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TechnicianZamow() {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [parts, setParts] = useState([]);
  const [selectedParts, setSelectedParts] = useState([{ partId: '', quantity: 1 }]);
  const [urgency, setUrgency] = useState('standard');
  const [delivery, setDelivery] = useState('paczkomat');
  const [paczkomatId, setPaczkomatId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    const employeeData = localStorage.getItem('technicianEmployee');
    
    if (!token || !employeeData) {
      router.push('/technician/login');
      return;
    }

    try {
      const emp = JSON.parse(employeeData);
      setEmployee(emp);
      loadParts();
    } catch (err) {
      router.push('/technician/login');
    }
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
          employeeId: employee?.id
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
      const res = await fetch('/api/part-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedBy: employee.id,
          requestedFor: employee.id,
          parts: selectedParts.map(p => ({ partId: p.partId, quantity: parseInt(p.quantity) })),
          urgency,
          preferredDelivery: delivery,
          paczkomatId: delivery === 'paczkomat' ? paczkomatId : undefined,
          notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert('✅ Zamówienie utworzone: ' + data.request.requestId);
        // Reset form
        setSelectedParts([{ partId: '', quantity: 1 }]);
        setNotes('');
        setPaczkomatId('');
      } else {
        const error = await res.json();
        alert('❌ Błąd: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('❌ Błąd: ' + error.message);
    } finally {
      setLoading(false);
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
              
              <Link href="/technician/magazyn" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
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

              {/* Submit */}
              <div className="flex items-center justify-end space-x-4">
                <Link
                  href="/technician/magazyn"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Anuluj
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Tworzenie...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Utwórz zamówienie
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
                href="/technician/magazyn/moj-magazyn"
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
