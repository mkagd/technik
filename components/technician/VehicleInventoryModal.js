import { useState, useEffect } from 'react';
import { getUniversalToken } from '../../utils/tokenHelper';

export default function VehicleInventoryModal({ visitId, onPartsUsed, onClose }) {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedParts, setSelectedParts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    loadEmployeeAndInventory();
  }, []);

  const loadEmployeeAndInventory = async () => {
    setLoading(true);
    try {
      // Get token first
      const token = getUniversalToken();
      if (!token) {
        alert('❌ Brak tokenu autoryzacji. Zaloguj się ponownie.');
        onClose();
        return;
      }

      // Load inventory - backend will return inventory for authenticated user
      // We use "me" as special keyword to get current user's inventory
      const res = await fetch(`/api/inventory/personal/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (data.success) {
        setInventory(data.inventory);
        
        // Set employee from inventory data (backend enriches it)
        if (data.inventory.employeeName) {
          setEmployee({
            id: data.inventory.employeeId,
            name: data.inventory.employeeName
          });
        }
        
        console.log(`📦 Loaded vehicle inventory: ${data.inventory.parts?.length || 0} parts (${data.inventory.employeeId})`);
      } else {
        console.error('❌ Error loading inventory:', data.error);
        alert(`❌ Błąd: ${data.error || 'Nie można załadować magazynu pojazdu'}`);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      alert('❌ Błąd podczas ładowania magazynu');
    } finally {
      setLoading(false);
    }
  };

  const handlePartSelect = (part) => {
    const existing = selectedParts.find(p => p.partId === part.partId);
    
    if (existing) {
      // Already selected - remove
      setSelectedParts(selectedParts.filter(p => p.partId !== part.partId));
    } else {
      // Add with quantity 1
      setSelectedParts([...selectedParts, {
        partId: part.partId,
        partName: part.partName,
        partNumber: part.partNumber,
        maxQuantity: part.quantity,
        quantity: 1,
        unitPrice: part.unitPrice || 0
      }]);
    }
  };

  const updateQuantity = (partId, quantity) => {
    setSelectedParts(selectedParts.map(p => 
      p.partId === partId 
        ? { ...p, quantity: Math.min(Math.max(1, quantity), p.maxQuantity) }
        : p
    ));
  };

  const handleSubmit = async () => {
    if (selectedParts.length === 0) {
      alert('❌ Wybierz przynajmniej jedną część');
      return;
    }

    if (!inventory?.employeeId) {
      alert('❌ Brak danych magazynu. Odśwież stronę.');
      return;
    }

    setSubmitting(true);

    try {
      const token = getUniversalToken();
      
      // Use parts from vehicle inventory
      const res = await fetch('/api/inventory/personal/use', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: inventory.employeeId, // Use employeeId from inventory (authenticated via token)
          orderId: visitId, // Link to visit
          parts: selectedParts.map(p => ({
            partId: p.partId,
            quantity: p.quantity,
            installationNotes: `Użyto podczas wizyty ${visitId}`
          })),
          addToInvoice: true
        })
      });

      const data = await res.json();

      if (data.success) {
        console.log(`✅ Used ${selectedParts.length} parts from vehicle inventory (${inventory.employeeId})`);
        console.log(`💰 Wartość użytych części: ${data.usage.totalValue.toFixed(2)} zł`);
        
        // Notify parent with used parts
        if (onPartsUsed) {
          onPartsUsed(data.usage, selectedParts);
        }

        onClose();
      } else {
        console.error('❌ API error:', data.error);
        alert(`❌ Błąd: ${data.error}`);
      }
    } catch (error) {
      console.error('Error using parts:', error);
      alert('❌ Błąd podczas używania części');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredParts = inventory?.parts?.filter(part =>
    part.partName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.partId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.partNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalValue = selectedParts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-green-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🚗 Użyj część z pojazdu</h2>
              <p className="text-sm text-green-100 mt-1">
                Magazyn: {inventory?.vehicle || 'Twój pojazd'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-green-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj części (nazwa, ID, numer)..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchQuery ? 'Nie znaleziono części' : 'Pusty magazyn'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Spróbuj innej frazy wyszukiwania' : 'Brak części w magazynie pojazdu'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredParts.map((part) => {
                const isSelected = selectedParts.find(p => p.partId === part.partId);
                
                return (
                  <div
                    key={part.partId}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                    }`}
                    onClick={() => !isSelected && handlePartSelect(part)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{part.partName}</h4>
                        <p className="text-sm text-gray-500">{part.partNumber}</p>
                      </div>
                      {isSelected && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                          WYBRANO
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dostępne:</span>
                        <span className="font-semibold text-gray-900">{part.quantity} szt</span>
                      </div>
                      {part.unitPrice > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cena:</span>
                          <span className="font-semibold text-gray-900">{part.unitPrice.toFixed(2)} zł</span>
                        </div>
                      )}
                      {part.location && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lokalizacja:</span>
                          <span className="font-medium text-gray-700">{part.location}</span>
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ilość do użycia:
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(part.partId, isSelected.quantity - 1);
                            }}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={part.quantity}
                            value={isSelected.quantity}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateQuantity(part.partId, parseInt(e.target.value) || 1);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 text-center px-3 py-1 border border-gray-300 rounded"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(part.partId, isSelected.quantity + 1);
                            }}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedParts(selectedParts.filter(p => p.partId !== part.partId));
                            }}
                            className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Usuń
                          </button>
                        </div>
                        {part.unitPrice > 0 && (
                          <p className="text-sm text-gray-600 mt-2">
                            Wartość: <span className="font-semibold">{(part.unitPrice * isSelected.quantity).toFixed(2)} zł</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gradient-to-r from-gray-50 to-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Wybrano: <span className="font-semibold text-gray-900">{selectedParts.length} części</span>
                  </p>
                </div>
                {totalValue > 0 && (
                  <div className="border-l pl-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Razem</p>
                    <p className="text-2xl font-bold text-green-600">
                      {totalValue.toFixed(2)} <span className="text-sm text-gray-500">PLN</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedParts.length === 0 || submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Przetwarzam...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Użyj części
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
