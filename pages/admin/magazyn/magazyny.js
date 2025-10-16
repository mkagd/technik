import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function AdminMagazynMagazyny() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [employees, setEmployees] = useState([]);
  const [parts, setParts] = useState([]);
  const [personalInventories, setPersonalInventories] = useState([]); // ✅ Dodane
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]); // Array of { partId, quantity }
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({ 
    fromEmployeeId: null, 
    toEmployeeId: '', 
    partId: '', 
    quantity: 1 
  });
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [partMetadata, setPartMetadata] = useState({
    location: 'Schowek główny',
    notes: '',
    assignedBy: 'ADMIN'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesRes, partsRes, inventoriesRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/inventory/parts'),
        fetch('/api/inventory/personal') // ✅ Pobierz wszystkie magazyny osobiste
      ]);

      const employeesData = await employeesRes.json();
      const partsData = await partsRes.json();
      const inventoriesData = await inventoriesRes.json();

      // All employees in employees.json are technicians
      // Filter active employees only
      const technicians = (employeesData.employees || []).filter(emp => 
        emp.isActive !== false
      );

      setEmployees(technicians);
      setParts(partsData.parts || []);
      setPersonalInventories(inventoriesData.inventories || []); // ✅ Zapisz magazyny
      
      console.log('✅ Loaded data:', {
        employees: technicians.length,
        parts: (partsData.parts || []).length,
        inventories: (inventoriesData.inventories || []).length
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeInventory = (employeeId) => {
    // ✅ Używamy personal-inventories.json
    const inventory = personalInventories.find(inv => inv.employeeId === employeeId);
    return inventory?.parts || [];
  };

  const getEmployeeInventoryAsync = async (employeeId) => {
    try {
      const res = await fetch(`/api/inventory/personal?employeeId=${employeeId}`);
      const data = await res.json();
      if (data.success && data.inventory) {
        return data.inventory.parts || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
  };

  const getEmployeeInventoryValue = (employeeId) => {
    const inventory = getEmployeeInventory(employeeId);
    return inventory.reduce((sum, item) => {
      // Użyj unitPrice z części lub znajdź w parts
      const itemPrice = item.unitPrice || 0;
      const part = parts.find(p => (p.id || p.partId) === item.partId);
      const partPrice = part?.pricing?.retailPrice || part?.unitPrice || 0;
      const price = itemPrice || partPrice;
      return sum + (price * (item.quantity || 0));
    }, 0);
  };

  const getTotalInventoryValue = () => {
    return employees.reduce((sum, emp) => sum + getEmployeeInventoryValue(emp.id), 0);
  };

  const getTotalParts = () => {
    return employees.reduce((sum, emp) => {
      const inventory = getEmployeeInventory(emp.id);
      return sum + inventory.reduce((s, item) => s + (item.quantity || 0), 0);
    }, 0);
  };

  const handleAddParts = async () => {
    console.log('handleAddParts called', { selectedEmployee, selectedParts, metadata: partMetadata });
    
    if (!selectedEmployee || selectedParts.length === 0) {
      alert('Wybierz przynajmniej jedną część!');
      return;
    }

    console.log('Adding parts to employee:', selectedEmployee.id, selectedParts);

    try {
      // Add all selected parts in parallel with metadata
      const promises = selectedParts.map(part => {
        console.log('Sending POST request for part:', part, 'with metadata:', partMetadata);
        return fetch(`/api/employees/${selectedEmployee.id}/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partId: part.partId,
            quantity: part.quantity,
            location: partMetadata.location,
            notes: partMetadata.notes,
            assignedBy: partMetadata.assignedBy
          })
        });
      });

      const results = await Promise.all(promises);
      console.log('Results:', results);
      
      // Log detailed response info
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        console.log(`Response ${i}:`, {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          url: res.url
        });
        if (!res.ok) {
          const errorData = await res.clone().json().catch(() => null);
          console.error(`Error response ${i}:`, errorData);
        }
      }
      
      const allSucceeded = results.every(res => res.ok);

      if (allSucceeded) {
        alert(`✅ Dodano ${selectedParts.length} części do magazynu!`);
        setShowAddModal(false);
        setSelectedParts([]);
        setPartSearchQuery('');
        setPartMetadata({ location: 'Schowek główny', notes: '', assignedBy: 'ADMIN' });
        loadData();
      } else {
        // Show which parts failed
        const failed = await Promise.all(
          results.map(async (res, idx) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              console.error(`❌ Failed to add part ${selectedParts[idx].partId}:`, {
                status: res.status,
                statusText: res.statusText,
                error: data.message || 'Unknown error',
                fullData: data
              });
              return { part: selectedParts[idx], status: res.status, error: data.message || 'Unknown error', data };
            }
            return null;
          })
        );
        const failedParts = failed.filter(Boolean);
        console.error('Failed parts summary:', failedParts);
        const errorMsg = failedParts.map(f => `${f.part.partId}: ${f.error}`).join('\n');
        alert(`❌ Błąd podczas dodawania części:\n\n${errorMsg}\n\nSprawdź konsolę przeglądarki dla więcej szczegółów.`);
      }
    } catch (error) {
      console.error('Error adding parts:', error);
      alert('❌ Błąd: ' + error.message);
    }
  };

  const togglePartSelection = (partId) => {
    console.log('Toggle part selection:', partId);
    setSelectedParts(prev => {
      const exists = prev.find(p => p.partId === partId);
      if (exists) {
        // Remove if already selected
        console.log('Removing part:', partId);
        return prev.filter(p => p.partId !== partId);
      } else {
        // Add with default quantity 1
        console.log('Adding part:', partId);
        return [...prev, { partId, quantity: 1 }];
      }
    });
  };

  const updatePartQuantity = (partId, quantity) => {
    setSelectedParts(prev => 
      prev.map(p => p.partId === partId ? { ...p, quantity: Math.max(1, quantity) } : p)
    );
  };

  const handleRemovePart = async (employeeId, partId) => {
    const quantity = prompt('Ile sztuk usunąć?');
    if (!quantity || parseInt(quantity) < 1) return;

    try {
      const res = await fetch(`/api/employees/${employeeId}/inventory/${partId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: parseInt(quantity) })
      });

      if (res.ok) {
        alert('✅ Część usunięta z magazynu!');
        loadData();
      } else {
        alert('❌ Błąd podczas usuwania');
      }
    } catch (error) {
      console.error('Error removing part:', error);
      alert('❌ Błąd: ' + error.message);
    }
  };

  const handleTransfer = async () => {
    if (!transferData.fromEmployeeId || !transferData.toEmployeeId || !transferData.partId || transferData.quantity < 1) {
      alert('Wypełnij wszystkie pola!');
      return;
    }

    if (transferData.fromEmployeeId === transferData.toEmployeeId) {
      alert('Nie możesz przenieść części do tego samego pracownika!');
      return;
    }

    try {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmployeeId: transferData.fromEmployeeId,
          toEmployeeId: transferData.toEmployeeId,
          partId: transferData.partId,
          quantity: parseInt(transferData.quantity)
        })
      });

      if (res.ok) {
        alert('✅ Część przeniesiona!');
        setShowTransferModal(false);
        setTransferData({ fromEmployeeId: null, toEmployeeId: '', partId: '', quantity: 1 });
        setEmployeeSearchQuery('');
        loadData();
      } else {
        const data = await res.json();
        alert(`❌ Błąd podczas transferu: ${data.message || 'Nieznany błąd'}`);
      }
    } catch (error) {
      console.error('Error transferring:', error);
      alert('❌ Błąd: ' + error.message);
    }
  };

  const getFilteredEmployees = () => {
    if (!employeeSearchQuery.trim()) return employees;
    
    const query = employeeSearchQuery.toLowerCase();
    return employees.filter(emp => {
      const name = (emp.name || '').toLowerCase();
      const id = (emp.id || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      
      return name.includes(query) || id.includes(query) || email.includes(query);
    });
  };

  const getEmployeeInventoryForTransfer = (employeeId) => {
    // ✅ Używamy personal-inventories.json
    const inventory = personalInventories.find(inv => inv.employeeId === employeeId);
    return inventory?.parts || [];
  };

  const getPartName = (partId) => {
    const part = parts.find(p => p.id === partId || p.partId === partId);
    return part?.name || part?.partName || partId;
  };

  const getPartPrice = (partId) => {
    const part = parts.find(p => p.id === partId || p.partId === partId);
    return part?.pricing?.retailPrice || part?.unitPrice || 0;
  };

  const getFilteredParts = () => {
    if (!partSearchQuery.trim()) return parts;
    
    const query = partSearchQuery.toLowerCase();
    return parts.filter(part => {
      const partId = (part.id || part.partId || '').toLowerCase();
      const partName = (part.name || part.partName || '').toLowerCase();
      const partNumber = (part.partNumber || '').toLowerCase();
      const category = (part.category || '').toLowerCase();
      const subcategory = (part.subcategory || part.subCategory || '').toLowerCase();
      
      return partId.includes(query) || 
             partName.includes(query) || 
             partNumber.includes(query) ||
             category.includes(query) ||
             subcategory.includes(query);
    });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Przegląd magazynów</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Magazyny osobiste wszystkich serwisantów
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <DarkModeToggle />
                <button
                  onClick={() => router.push('/admin/magazyn')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  ← Wróć do magazynu
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Serwisantów</p>
                    <p className="text-3xl font-bold mt-2">{employees.length}</p>
                  </div>
                  <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Części w terenie</p>
                    <p className="text-3xl font-bold mt-2">{getTotalParts()}</p>
                  </div>
                  <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Wartość całkowita</p>
                    <p className="text-3xl font-bold mt-2">{getTotalInventoryValue().toFixed(0)} zł</p>
                  </div>
                  <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Śr. wartość</p>
                    <p className="text-3xl font-bold mt-2">
                      {employees.length > 0 ? (getTotalInventoryValue() / employees.length).toFixed(0) : 0} zł
                    </p>
                  </div>
                  <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Brak serwisantów</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Nie znaleziono serwisantów w systemie.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {employees.map((employee) => {
                const inventory = getEmployeeInventory(employee.id);
                const totalValue = getEmployeeInventoryValue(employee.id);
                const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

                return (
                  <div key={employee.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    {/* Employee Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{employee.name}</h3>
                          <p className="text-sm opacity-90 mt-1">{employee.id}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <div>
                              <div className="text-2xl font-bold">{totalItems}</div>
                              <div className="text-xs opacity-75">Części</div>
                            </div>
                            <div className="h-8 w-px bg-white opacity-30"></div>
                            <div>
                              <div className="text-2xl font-bold">{totalValue.toFixed(0)} zł</div>
                              <div className="text-xs opacity-75">Wartość</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowAddModal(true);
                            }}
                            className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50"
                          >
                            + Dodaj
                          </button>
                          <button
                            onClick={() => {
                              router.push('/admin/magazyn/czesci');
                            }}
                            className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded text-sm font-medium hover:from-indigo-600 hover:to-purple-600"
                            title="Przejdź do części i filtruj wg modelu"
                          >
                            📱 Wg modelu
                          </button>
                          <button
                            onClick={() => {
                              setTransferData({ ...transferData, fromEmployeeId: employee.id });
                              setShowTransferModal(true);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-400"
                          >
                            ⇄ Transfer
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inventory List */}
                    <div className="p-6">
                      {inventory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <svg className="mx-auto h-12 w-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          Pusty magazyn
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {inventory.map((item) => (
                            <div key={item.partId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {getPartName(item.partId)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {item.partId}
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {item.quantity} szt
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {(getPartPrice(item.partId) * item.quantity).toFixed(2)} zł
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemovePart(employee.id, item.partId)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                  title="Usuń część"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  💡 Zarządzanie magazynami
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• <strong>Dodaj</strong> - dodaj część do magazynu serwisanta</li>
                  <li>• <strong>Usuń</strong> - usuń określoną ilość części</li>
                  <li>• <strong>Transfer</strong> - przenieś część między serwisantami</li>
                  <li>• Każdy serwisant ma osobny magazyn osobisty</li>
                  <li>• Wartość to suma cen wszystkich części w magazynie</li>
                </ul>
              </div>
            </div>
          </div>
        </main>

        {/* Add Part Modal */}
        {showAddModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Dodaj część do magazynu
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Serwisant: {selectedEmployee.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedEmployee(null);
                      setSelectedParts([]);
                      setPartSearchQuery('');
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={partSearchQuery}
                    onChange={(e) => setPartSearchQuery(e.target.value)}
                    placeholder="🔍 Szukaj części po nazwie, ID, numerze katalogowym..."
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {partSearchQuery && (
                    <button
                      onClick={() => setPartSearchQuery('')}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Znaleziono: {getFilteredParts().length} części
                  </span>
                  <span className={`font-medium ${selectedParts.length > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    Zaznaczono: {selectedParts.length} części
                  </span>
                </div>
                
                {/* Hint for user */}
                {selectedParts.length === 0 && getFilteredParts().length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Wskazówka:</strong> Zaznacz części klikając na checkbox lub kartę części. Po zaznaczeniu możesz ustawić ilość i dodać do magazynu.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Parts Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {getFilteredParts().length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">Nie znaleziono części</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Spróbuj zmienić kryteria wyszukiwania</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getFilteredParts().map(part => {
                      const partId = part.id || part.partId;
                      const partName = part.name || part.partName;
                      const partPrice = part.pricing?.retailPrice || part.unitPrice || 0;
                      const partImage = part.imageUrl || part.images?.[0]?.url || '/uploads/parts/default-part.svg';
                      const inStock = part.availability?.inStock || part.availability?.available || part.stockQuantity || 0;
                      const selectedPart = selectedParts.find(p => p.partId === partId);
                      const isSelected = !!selectedPart;

                      return (
                        <div
                          key={partId}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex space-x-4">
                            {/* Checkbox */}
                            <div className="flex-shrink-0 pt-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePartSelection(partId)}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                            </div>

                            {/* Image */}
                            <div 
                              className="flex-shrink-0 cursor-pointer"
                              onClick={() => togglePartSelection(partId)}
                            >
                              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                <img 
                                  src={partImage} 
                                  alt={partName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMyOC45NTQzIDIwIDIwIDI4Ljk1NDMgMjAgNDBDMjAgNTEuMDQ1NyAyOC45NTQzIDYwIDQwIDYwQzUxLjA0NTcgNjAgNjAgNTEuMDQ1NyA2MCA0MEM2MCAyOC45NTQzIDUxLjA0NTcgMjAgNDAgMjBaIiBmaWxsPSIjRDFENUREIi8+CjxwYXRoIGQ9Ik00MCAzMEMzOS40NDc3IDMwIDM5IDMwLjQ0NzcgMzkgMzFWNDFDMzkgNDEuNTUyMyAzOS40NDc3IDQyIDQwIDQyQzQwLjU1MjMgNDIgNDEgNDEuNTUyMyA0MSA0MVYzMUM0MSAzMC40NDc3IDQwLjU1MjMgMzAgNDAgMzBaIiBmaWxsPSIjOUM5RUE2Ii8+CjxwYXRoIGQ9Ik00MCA0N0MzOS40NDc3IDQ3IDM5IDQ3LjQ0NzcgMzkgNDhDMzkgNDguNTUyMyAzOS40NDc3IDQ5IDQwIDQ5QzQwLjU1MjMgNDkgNDEgNDguNTUyMyA0MSA0OEM0MSA0Ny40NDc3IDQwLjU1MjMgNDcgNDAgNDdaIiBmaWxsPSIjOUM5RUE2Ii8+Cjwvc3ZnPgo=';
                                  }}
                                />
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div 
                                className="font-medium text-gray-900 dark:text-white truncate cursor-pointer"
                                onClick={() => togglePartSelection(partId)}
                              >
                                {partName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {partId} {part.partNumber && `• ${part.partNumber}`}
                              </div>
                              {(part.category || part.subcategory) && (
                                <div className="flex items-center space-x-1 mt-1">
                                  {part.category && (
                                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                                      {part.category}
                                    </span>
                                  )}
                                  {part.subcategory && (
                                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                                      {part.subcategory || part.subCategory}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                  {partPrice} zł
                                </div>
                                <div className={`text-xs ${inStock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {inStock > 0 ? `✓ ${inStock} szt` : '✗ Brak'}
                                </div>
                              </div>

                              {/* Quantity input - only show when selected */}
                              {isSelected && (
                                <div className="mt-3 flex items-center space-x-2">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    Ilość:
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedPart.quantity}
                                    onChange={(e) => updatePartQuantity(partId, parseInt(e.target.value) || 1)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-20 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-500 dark:text-gray-400">szt</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {/* Metadata fields */}
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📍 Lokalizacja w aucie
                    </label>
                    <select
                      value={partMetadata.location}
                      onChange={(e) => setPartMetadata({...partMetadata, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Schowek główny</option>
                      <option>Schowek przedni</option>
                      <option>Schowek boczny lewy</option>
                      <option>Schowek boczny prawy</option>
                      <option>Tylny bagażnik</option>
                      <option>Szuflada główna</option>
                      <option>Szuflada boczna</option>
                      <option>Pod siedzeniem</option>
                      <option>Drzwi boczne</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📝 Notatki (opcjonalne)
                    </label>
                    <input
                      type="text"
                      value={partMetadata.notes}
                      onChange={(e) => setPartMetadata({...partMetadata, notes: e.target.value})}
                      placeholder="Np. 'Priorytet - brakuje w magazynie'"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {selectedParts.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        Wybrane części ({selectedParts.length}):
                      </span>
                      <button
                        onClick={() => setSelectedParts([])}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Wyczyść wszystkie
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedParts.map(sp => {
                        const part = parts.find(p => (p.id || p.partId) === sp.partId);
                        const partName = part?.name || part?.partName || sp.partId;
                        return (
                          <div key={sp.partId} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 dark:text-gray-300 truncate">
                              {partName}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium ml-2 whitespace-nowrap">
                              {sp.quantity} szt
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-3">
                  {selectedParts.length === 0 && (
                    <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ⚠️ Zaznacz przynajmniej jedną część aby aktywować przycisk "Dodaj"
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setSelectedEmployee(null);
                        setSelectedParts([]);
                        setPartSearchQuery('');
                      }}
                      className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handleAddParts}
                      disabled={selectedParts.length === 0}
                      className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                        selectedParts.length === 0
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      title={selectedParts.length === 0 ? 'Zaznacz przynajmniej jedną część' : 'Dodaj zaznaczone części do magazynu'}
                    >
                      ✓ Dodaj części ({selectedParts.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && transferData.fromEmployeeId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Transfer części między magazynami
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Z magazynu: {employees.find(e => e.id === transferData.fromEmployeeId)?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferData({ fromEmployeeId: null, toEmployeeId: '', partId: '', quantity: 1 });
                      setEmployeeSearchQuery('');
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content - Two columns */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-x dark:divide-gray-700">
                  
                  {/* Left: Select Part */}
                  <div className="p-6">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                      1️⃣ Wybierz część do przeniesienia
                    </h4>
                    
                    {getEmployeeInventoryForTransfer(transferData.fromEmployeeId).length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400">Brak części w magazynie</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {getEmployeeInventoryForTransfer(transferData.fromEmployeeId).map((item) => {
                          const part = parts.find(p => p.id === item.partId || p.partId === item.partId);
                          const partId = item.partId;
                          const partName = part?.name || part?.partName || partId;
                          const partImage = part?.imageUrl || part?.images?.[0]?.url || '/uploads/parts/default-part.svg';
                          const partPrice = part?.pricing?.retailPrice || part?.unitPrice || 0;
                          const isSelected = transferData.partId === partId;

                          return (
                            <div
                              key={partId}
                              onClick={() => setTransferData({ ...transferData, partId, quantity: Math.min(item.quantity, transferData.quantity) })}
                              className={`cursor-pointer border-2 rounded-lg p-3 transition-all hover:shadow-lg ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={partImage} 
                                      alt={partName}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMyOC45NTQzIDIwIDIwIDI4Ljk1NDMgMjAgNDBDMjAgNTEuMDQ1NyAyOC45NTQzIDYwIDQwIDYwQzUxLjA0NTcgNjAgNjAgNTEuMDQ1NyA2MCA0MEM2MCAyOC45NTQzIDUxLjA0NTcgMjAgNDAgMjBaIiBmaWxsPSIjRDFENUREIi8+CjxwYXRoIGQ9Ik00MCAzMEMzOS40NDc3IDMwIDM5IDMwLjQ0NzcgMzkgMzFWNDFDMzkgNDEuNTUyMyAzOS40NDc3IDQyIDQwIDQyQzQwLjU1MjMgNDIgNDEgNDEuNTUyMyA0MSA0MVYzMUM0MSAzMC40NDc3IDQwLjU1MjMgMzAgNDAgMzBaIiBmaWxsPSIjOUM5RUE2Ii8+CjxwYXRoIGQ9Ik00MCA0N0MzOS40NDc3IDQ3IDM5IDQ3LjQ0NzcgMzkgNDhDMzkgNDguNTUyMyAzOS40NDc3IDQ5IDQwIDQ5QzQwLjU1MjMgNDkgNDEgNDguNTUyMyA0MSA0OEM0MSA0Ny40NDc3IDQwLjU1MjMgNDcgNDAgNDdaIiBmaWxsPSIjOUM5RUE2Ii8+Cjwvc3ZnPgo=';
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                                    {partName}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {partId}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                      {partPrice} zł
                                    </div>
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                      Dostępne: {item.quantity} szt
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex-shrink-0">
                                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Select Employee */}
                  <div className="p-6">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                      2️⃣ Wybierz pracownika docelowego
                    </h4>

                    {/* Employee Search */}
                    <div className="relative mb-4">
                      <input
                        type="text"
                        value={employeeSearchQuery}
                        onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                        placeholder="🔍 Szukaj pracownika..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {getFilteredEmployees()
                        .filter(emp => emp.id !== transferData.fromEmployeeId)
                        .map((employee) => {
                          const isSelected = transferData.toEmployeeId === employee.id;
                          const inventory = getEmployeeInventory(employee.id);
                          const totalValue = getEmployeeInventoryValue(employee.id);

                          return (
                            <div
                              key={employee.id}
                              onClick={() => setTransferData({ ...transferData, toEmployeeId: employee.id })}
                              className={`cursor-pointer border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                                isSelected 
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {employee.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {employee.id}
                                  </div>
                                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    <span>{inventory.length} pozycji</span>
                                    <span>•</span>
                                    <span>{totalValue.toFixed(0)} zł</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center ml-3">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ilość do przeniesienia
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={getEmployeeInventoryForTransfer(transferData.fromEmployeeId).find(i => i.partId === transferData.partId)?.quantity || 1}
                      value={transferData.quantity}
                      onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {transferData.partId && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Max: {getEmployeeInventoryForTransfer(transferData.fromEmployeeId).find(i => i.partId === transferData.partId)?.quantity || 0} szt
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleTransfer}
                    disabled={!transferData.partId || !transferData.toEmployeeId}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    ⇄ Przenieś część
                  </button>
                  <button
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferData({ fromEmployeeId: null, toEmployeeId: '', partId: '', quantity: 1 });
                      setEmployeeSearchQuery('');
                    }}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
