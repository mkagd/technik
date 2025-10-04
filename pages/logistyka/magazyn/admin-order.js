import { useState, useEffect } from 'react';
import Link from 'next/link';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function LogistykaAdminOrder() {
  const [employees, setEmployees] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedParts, setSelectedParts] = useState([{ partId: '', quantity: 1 }]);
  const [urgency, setUrgency] = useState('standard');
  const [delivery, setDelivery] = useState('paczkomat');
  const [paczkomatId, setPaczkomatId] = useState('');
  const [reason, setReason] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empRes, partsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/inventory/parts')
      ]);
      const empData = await empRes.json();
      const partsData = await partsRes.json();
      
      setEmployees(empData.employees?.filter(e => e.role === 'serwisant') || []);
      setParts(partsData.parts || []);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTechnician) {
      alert('Wybierz serwisanta!');
      return;
    }
    if (selectedParts.some(p => !p.partId)) {
      alert('Wybierz wszystkie części!');
      return;
    }
    if (!reason) {
      alert('Podaj powód zamówienia!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/part-requests/admin-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: 'EMPADMIN001', // TODO: Get from auth
          technicianId: selectedTechnician,
          parts: selectedParts.map(p => ({ partId: p.partId, quantity: parseInt(p.quantity) })),
          urgency,
          preferredDelivery: delivery,
          paczkomatId: delivery === 'paczkomat' ? paczkomatId : undefined,
          reason,
          autoApprove
        })
      });

      if (res.ok) {
        alert('✅ Zamówienie utworzone! ' + (autoApprove ? '(Auto-zatwierdzone)' : ''));
        // Reset form
        setSelectedTechnician('');
        setSelectedParts([{ partId: '', quantity: 1 }]);
        setReason('');
        setPaczkomatId('');
      } else {
        const error = await res.json();
        alert('❌ Błąd: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating order:', error);
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zamów dla serwisanta</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Admin Ordering</p>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link href="/logistyka/magazyn" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                ← Wróć
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Technician Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serwisant *
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Wybierz serwisanta...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id})
                </option>
              ))}
            </select>
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

          {/* Urgency */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorytet
            </label>
            <div className="flex space-x-4">
              {['standard', 'urgent', 'express'].map(level => (
                <label key={level} className="flex items-center">
                  <input
                    type="radio"
                    name="urgency"
                    value={level}
                    checked={urgency === level}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="mr-2"
                  />
                  <span className="capitalize">{level}</span>
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
              <label className="flex items-center">
                <input
                  type="radio"
                  name="delivery"
                  value="paczkomat"
                  checked={delivery === 'paczkomat'}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="mr-2"
                />
                📦 Paczkomat
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="delivery"
                  value="office"
                  checked={delivery === 'office'}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="mr-2"
                />
                🏢 Biuro
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

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Powód zamówienia *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Np. Serwisant zgubił część, klient czeka..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Auto Approve */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Auto-zatwierdź (pomiń approval process)
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              Gdy zaznaczone, zamówienie będzie natychmiast zatwierdzone i gotowe do realizacji.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              href="/logistyka/magazyn"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Anuluj
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Tworzenie...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Utwórz zamówienie
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-purple-50 border-l-4 border-purple-500 p-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-2">💡 Admin Ordering</h3>
          <ul className="space-y-1 text-sm text-purple-800">
            <li>• Zamów części w imieniu serwisanta</li>
            <li>• Auto-approve pomija proces zatwierdzania</li>
            <li>• Serwisant otrzyma notyfikację o zamówieniu</li>
            <li>• Użyj w przypadkach pilnych lub gdy serwisant zgubił część</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
