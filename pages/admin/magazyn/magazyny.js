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
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPartData, setAddPartData] = useState({ partId: '', quantity: 1 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesRes, partsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/inventory/parts')
      ]);

      const employeesData = await employeesRes.json();
      const partsData = await partsRes.json();

      // Filter only technicians
      const technicians = (employeesData.employees || []).filter(emp => 
        emp.role === 'Serwisant' || emp.stanowisko === 'Serwisant'
      );

      setEmployees(technicians);
      setParts(partsData.parts || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeInventory = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId || e.userId === employeeId);
    return emp?.inventory || [];
  };

  const getEmployeeInventoryValue = (employeeId) => {
    const inventory = getEmployeeInventory(employeeId);
    return inventory.reduce((sum, item) => {
      const part = parts.find(p => p.partId === item.partId);
      return sum + ((part?.unitPrice || 0) * (item.quantity || 0));
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

  const handleAddPart = async () => {
    if (!selectedEmployee || !addPartData.partId || addPartData.quantity < 1) {
      alert('Wypełnij wszystkie pola!');
      return;
    }

    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: addPartData.partId,
          quantity: addPartData.quantity
        })
      });

      if (res.ok) {
        alert('✅ Część dodana do magazynu!');
        setShowAddModal(false);
        setAddPartData({ partId: '', quantity: 1 });
        loadData();
      } else {
        alert('❌ Błąd podczas dodawania');
      }
    } catch (error) {
      console.error('Error adding part:', error);
      alert('❌ Błąd: ' + error.message);
    }
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

  const handleTransfer = async (fromEmployeeId) => {
    const toEmployeeId = prompt('Podaj ID pracownika docelowego:');
    if (!toEmployeeId) return;

    const partId = prompt('Podaj ID części:');
    if (!partId) return;

    const quantity = prompt('Ile sztuk przenieść?');
    if (!quantity || parseInt(quantity) < 1) return;

    try {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmployeeId,
          toEmployeeId,
          partId,
          quantity: parseInt(quantity)
        })
      });

      if (res.ok) {
        alert('✅ Część przeniesiona!');
        loadData();
      } else {
        alert('❌ Błąd podczas transferu');
      }
    } catch (error) {
      console.error('Error transferring:', error);
      alert('❌ Błąd: ' + error.message);
    }
  };

  const getPartName = (partId) => {
    const part = parts.find(p => p.partId === partId);
    return part?.partName || partId;
  };

  const getPartPrice = (partId) => {
    const part = parts.find(p => p.partId === partId);
    return part?.unitPrice || 0;
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
                            onClick={() => handleTransfer(employee.id)}
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
                          {inventory.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Dodaj część dla: {selectedEmployee.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Część
                    </label>
                    <select
                      value={addPartData.partId}
                      onChange={(e) => setAddPartData({ ...addPartData, partId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Wybierz część...</option>
                      {parts.map(part => (
                        <option key={part.partId} value={part.partId}>
                          {part.partName} ({part.partId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ilość
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={addPartData.quantity}
                      onChange={(e) => setAddPartData({ ...addPartData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={handleAddPart}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Dodaj część
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedEmployee(null);
                      setAddPartData({ partId: '', quantity: 1 });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
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
