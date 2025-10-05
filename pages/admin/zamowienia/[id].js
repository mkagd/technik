// pages/admin/zamowienia/[id].js
// Szczegóły i edycja zamówienia

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import CommentsSection from '../../../components/CommentsSection';
import ModelManagerModal from '../../../components/ModelManagerModal';
import { formatAddress } from '../../../utils/formatAddress';
import { normalizeObject, statusToUI, getTechnicianId } from '../../../utils/fieldMapping';
import { checkAvailability, getBestTimeSlots, getAvailabilityCategory } from '../../../utils/availabilityScore';
import { 
  FiSave, FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, 
  FiTool, FiPackage, FiFileText, FiCalendar, FiClock, FiCheckCircle,
  FiPlus, FiX, FiAlertTriangle, FiHome
} from 'react-icons/fi';

export default function AdminZamowienieDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // 🆕 Add Visit Modal
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [addingVisit, setAddingVisit] = useState(false);
  
  // 📦 Device Models Manager
  const [showModelManager, setShowModelManager] = useState(false);
  const [orderModels, setOrderModels] = useState([]);
  const [visitForm, setVisitForm] = useState({
    type: 'diagnosis',
    employeeId: '',
    scheduledDate: '',
    scheduledTime: '09:00',
    notes: ''
  });

  const orderStatuses = [
    { value: 'nowe', label: 'Nowe' },
    { value: 'zaplanowane', label: 'Zaplanowane' },
    { value: 'w-trakcie', label: 'W trakcie' },
    { value: 'oczekuje-na-czesci', label: 'Oczekuje na części' },
    { value: 'zakonczone', label: 'Zakończone' },
    { value: 'anulowane', label: 'Anulowane' }
  ];

  const priorities = [
    { value: 'normal', label: 'Normalny' },
    { value: 'wysoki', label: 'Wysoki' },
    { value: 'pilny', label: 'Pilny' }
  ];

  useEffect(() => {
    if (id) {
      loadOrder();
      loadEmployees();
    }
  }, [id]);

  // 🆕 Load employees for visit assignment
  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      
      console.log('📞 Odpowiedź z API employees:', data);
      
      // API zwraca { employees: [...], count: X }
      if (data.employees && Array.isArray(data.employees)) {
        const activeEmployees = data.employees.filter(emp => emp.isActive === true);
        console.log(`✅ Załadowano ${activeEmployees.length} aktywnych pracowników z ${data.employees.length} ogółem`);
        setEmployees(activeEmployees);
      } else {
        console.warn('⚠️ Brak pracowników w odpowiedzi API');
        setEmployees([]);
      }
    } catch (error) {
      console.error('❌ Błąd ładowania pracowników:', error);
      setEmployees([]);
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?id=${id}`);
      const data = await response.json();
      
      if (response.ok && data) {
        setOrder(data);
      } else {
        alert('Nie znaleziono zamówienia');
        router.push('/admin/zamowienia');
      }
    } catch (error) {
      console.error('Błąd:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!order.clientName || !order.clientPhone) {
      alert('Uzupełnij wymagane pola: imię i nazwisko, telefon');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });

      if (response.ok) {
        setHasChanges(false);
        alert('Zamówienie zostało zapisane');
      } else {
        alert('Błąd podczas zapisywania zamówienia');
      }
    } catch (error) {
      console.error('Błąd:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  const updateOrder = (field, value) => {
    setOrder({ ...order, [field]: value });
    setHasChanges(true);
  };

  const updateBuiltInParam = (param, value) => {
    setOrder({
      ...order,
      builtInParams: {
        ...(order.builtInParams || {}),
        [param]: value
      }
    });
    setHasChanges(true);
  };

  // 🆕 Multi-device management functions
  const addDevice = () => {
    const newDevice = {
      deviceIndex: order.devices ? order.devices.length : 0,
      deviceType: '',
      brand: '',
      model: '',
      serialNumber: '',
      productionYear: '',
      purchaseDate: ''
    };
    
    const updatedDevices = order.devices ? [...order.devices, newDevice] : [newDevice];
    setOrder({ ...order, devices: updatedDevices });
    setHasChanges(true);
  };

  const removeDevice = (indexToRemove) => {
    if (!order.devices || order.devices.length <= 1) {
      alert('Nie możesz usunąć ostatniego urządzenia');
      return;
    }
    
    const updatedDevices = order.devices
      .filter((_, index) => index !== indexToRemove)
      .map((device, index) => ({ ...device, deviceIndex: index }));
    
    setOrder({ ...order, devices: updatedDevices });
    setHasChanges(true);
  };

  const updateDevice = (deviceIndex, field, value) => {
    const updatedDevices = [...(order.devices || [])];
    if (updatedDevices[deviceIndex]) {
      updatedDevices[deviceIndex] = {
        ...updatedDevices[deviceIndex],
        [field]: value
      };
      setOrder({ ...order, devices: updatedDevices });
      setHasChanges(true);
    }
  };

  // 🆕 Add new visit to order
  const handleAddVisit = async () => {
    // Validation
    if (!visitForm.employeeId || !visitForm.scheduledDate) {
      alert('Wybierz technika i datę wizyty');
      return;
    }

    try {
      setAddingVisit(true);

      // Generate visitId in VIS format
      const visitDate = new Date(visitForm.scheduledDate);
      const year = visitDate.getFullYear().toString().substring(2);
      const dayOfYear = Math.floor((visitDate - new Date(visitDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const visitNumber = (order.visits?.length || 0) + 1;
      const visitId = `VIS${year}${dayOfYear.toString().padStart(3, '0')}${visitNumber.toString().padStart(3, '0')}`;

      // Find selected employee
      const selectedEmployee = employees.find(emp => emp.id === visitForm.employeeId);
      
      // Create new visit object
      const newVisit = {
        visitId: visitId,
        visitNumber: visitNumber,
        type: visitForm.type,
        status: 'scheduled',
        scheduledDate: visitForm.scheduledDate,
        scheduledTime: visitForm.scheduledTime,
        date: visitForm.scheduledDate,
        time: visitForm.scheduledTime,
        technicianId: visitForm.employeeId,
        technicianName: selectedEmployee?.name || 'Nieznany',
        notes: visitForm.notes,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      // Update order with new visit (normalizuj przed zapisem)
      const updatedOrder = normalizeObject({
        ...order,
        visits: [...(order.visits || []), newVisit],
        status: 'scheduled',
        updatedAt: new Date().toISOString()
      });

      // Save to API
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          visits: updatedOrder.visits,
          status: updatedOrder.status,
          updatedAt: updatedOrder.updatedAt
        })
      });

      if (response.ok) {
        alert(`✅ Wizyta ${visitId} została dodana i przydzielona do ${selectedEmployee?.name}`);
        
        // Reset form and close modal
        setVisitForm({
          type: 'diagnosis',
          employeeId: '',
          scheduledDate: '',
          scheduledTime: '09:00',
          notes: ''
        });
        setShowAddVisitModal(false);
        
        // Reload order to get fresh data
        await loadOrder();
      } else {
        const errorData = await response.json();
        alert('❌ Błąd podczas dodawania wizyty: ' + (errorData.error || 'Nieznany błąd'));
      }
    } catch (error) {
      console.error('Błąd dodawania wizyty:', error);
      alert('❌ Błąd połączenia z serwerem');
    } finally {
      setAddingVisit(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Ładowanie..." breadcrumbs={[{ label: 'Zamówienia', href: '/admin/zamowienia' }, { label: 'Szczegóły' }]}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Ładowanie zamówienia...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) return null;

  return (
    <AdminLayout 
      title={`Zamówienie ${order.orderNumber || ''}`}
      breadcrumbs={[
        { label: 'Zamówienia', href: '/admin/zamowienia' },
        { label: order.orderNumber || 'Szczegóły' }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => router.push('/admin/zamowienia')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Powrót do listy
        </button>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 font-medium">Niezapisane zmiany</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FiSave className="mr-2 h-4 w-4" />
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Client info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2 h-5 w-5 text-blue-600" />
              Dane klienta
            </h2>

            {/* Typ klienta */}
            {order.clientType && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-900">
                    {order.clientType === 'company' ? '🏢 Firma' : '👤 Klient prywatny'}
                  </span>
                </div>
              </div>
            )}

            {/* Dane firmowe (jeśli firma) */}
            {order.clientType === 'company' && order.companyData && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-900 mb-3">🏢 Dane firmowe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {order.companyData.name && (
                    <div>
                      <span className="text-gray-600">Nazwa:</span>
                      <span className="ml-2 font-medium text-gray-900">{order.companyData.name}</span>
                    </div>
                  )}
                  {order.companyData.nip && (
                    <div>
                      <span className="text-gray-600">NIP:</span>
                      <span className="ml-2 font-medium text-gray-900">{order.companyData.nip}</span>
                    </div>
                  )}
                  {order.companyData.regon && (
                    <div>
                      <span className="text-gray-600">REGON:</span>
                      <span className="ml-2 font-medium text-gray-900">{order.companyData.regon}</span>
                    </div>
                  )}
                  {order.companyData.krs && (
                    <div>
                      <span className="text-gray-600">KRS:</span>
                      <span className="ml-2 font-medium text-gray-900">{order.companyData.krs}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imię i nazwisko *
                </label>
                <input
                  type="text"
                  value={order.clientName || ''}
                  onChange={(e) => updateOrder('clientName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={order.email || ''}
                  onChange={(e) => updateOrder('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Telefony */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefony
              </label>
              {order.phones && order.phones.length > 0 ? (
                <div className="space-y-2">
                  {order.phones.map((phone, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <a 
                        href={`tel:${phone.number}`}
                        className="flex items-center hover:text-green-600 transition-colors"
                      >
                        <FiPhone className="h-4 w-4 text-green-500 mr-3" />
                        <span className="font-medium text-gray-900">{phone.number}</span>
                      </a>
                      {phone.label && phone.label !== 'Główny' && (
                        <span className="ml-2 text-sm text-gray-600">({phone.label})</span>
                      )}
                      {phone.isPrimary && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Główny
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <a 
                    href={`tel:${order.clientPhone}`}
                    className="flex items-center hover:text-green-600 transition-colors"
                  >
                    <FiPhone className="h-4 w-4 text-green-500 mr-3" />
                    <span className="font-medium text-gray-900">{order.clientPhone || 'Brak'}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Adresy */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresy
              </label>
              {order.addresses && order.addresses.length > 0 ? (
                <div className="space-y-2">
                  {order.addresses.map((addr, index) => (
                    <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addr.street}, ${addr.postalCode} ${addr.city}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start hover:text-purple-600 transition-colors"
                      >
                        <FiMapPin className="h-4 w-4 text-purple-500 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {addr.street}, {addr.postalCode} {addr.city}
                          </div>
                          {addr.label && addr.label !== 'Główny' && (
                            <div className="text-sm text-gray-600 mt-1">({addr.label})</div>
                          )}
                        </div>
                      </a>
                      {addr.isPrimary && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Główny
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(order.address) || order.city || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start hover:text-purple-600 transition-colors"
                  >
                    <FiMapPin className="h-4 w-4 text-purple-500 mr-3 mt-0.5" />
                    <div>
                      {order.address && <div className="font-medium text-gray-900">{formatAddress(order.address)}</div>}
                      {order.city && (
                        <div className="text-sm text-gray-600">
                          {order.postalCode && `${order.postalCode} `}{order.city}
                        </div>
                      )}
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Dostępność klienta */}
            {order.availability && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dostępność klienta
                </label>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-sm">
                    <FiClock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">{order.availability}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Device info - Multi-device support */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiTool className="mr-2 h-5 w-5 text-blue-600" />
                Urządzenia {order.devices && order.devices.length > 0 && `(${order.devices.length})`}
              </h2>
              <button
                onClick={addDevice}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiPlus className="mr-1 h-4 w-4" />
                Dodaj urządzenie
              </button>
            </div>

            {/* Render devices array or fallback to old single device */}
            {order.devices && order.devices.length > 0 ? (
              <div className="space-y-6">
                {order.devices.map((device, deviceIndex) => (
                  <div key={deviceIndex} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold text-gray-800">
                        Urządzenie {deviceIndex + 1}
                      </h3>
                      {order.devices.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Czy na pewno usunąć urządzenie ${deviceIndex + 1}?`)) {
                              removeDevice(deviceIndex);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Usuń urządzenie"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Typ urządzenia
                        </label>
                        <input
                          type="text"
                          value={device.deviceType || ''}
                          onChange={(e) => updateDevice(deviceIndex, 'deviceType', e.target.value)}
                          placeholder="np. Pralka"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marka
                        </label>
                        <input
                          type="text"
                          value={device.brand || ''}
                          onChange={(e) => updateDevice(deviceIndex, 'brand', e.target.value)}
                          placeholder="np. Samsung"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Model
                        </label>
                        <input
                          type="text"
                          value={device.model || ''}
                          onChange={(e) => updateDevice(deviceIndex, 'model', e.target.value)}
                          placeholder="np. WW90K6414QW"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numer seryjny
                        </label>
                        <input
                          type="text"
                          value={device.serialNumber || ''}
                          onChange={(e) => updateDevice(deviceIndex, 'serialNumber', e.target.value)}
                          placeholder="np. SN123456789"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Fallback dla starych zamówień bez devices[]
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Typ urządzenia
                  </label>
                  <input
                    type="text"
                    value={order.deviceType || ''}
                    onChange={(e) => updateOrder('deviceType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marka
                  </label>
                  <input
                    type="text"
                    value={order.brand || ''}
                    onChange={(e) => updateOrder('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={order.model || ''}
                    onChange={(e) => updateOrder('model', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numer seryjny
                  </label>
                  <input
                    type="text"
                    value={order.serialNumber || ''}
                    onChange={(e) => updateOrder('serialNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* 📦 Przycisk do zarządzania modelami urządzeń */}
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Załaduj modele z zamówienia
                      const models = order.devices?.map(d => ({
                        brand: d.brand,
                        model: d.model,
                        name: d.deviceType,
                        type: d.deviceType,
                        serialNumber: d.serialNumber,
                        notes: d.notes || ''
                      })) || [];
                      setOrderModels(models);
                      setShowModelManager(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <FiPackage className="text-lg" />
                    <span>📷 Skanuj tabliczkę znamionową</span>
                  </button>
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={() => {
                      // Konwertuj stare pola na nowy format devices[]
                      const firstDevice = {
                        deviceIndex: 0,
                        deviceType: order.deviceType || '',
                        brand: order.brand || '',
                        model: order.model || '',
                        serialNumber: order.serialNumber || ''
                      };
                      setOrder({ ...order, devices: [firstDevice] });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Konwertuj na nowy system wielourządzeniowy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description & Problem */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiFileText className="mr-2 h-5 w-5 text-blue-600" />
              Opis problemu
            </h2>
            <textarea
              value={order.description || ''}
              onChange={(e) => updateOrder('description', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Opisz zgłoszony problem..."
            />
          </div>

          {/* Built-in params */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiPackage className="mr-2 h-5 w-5 text-blue-600" />
              Parametry zabudowy
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={order.builtInParams?.demontaz || false}
                  onChange={(e) => updateBuiltInParam('demontaz', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Demontaż</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={order.builtInParams?.montaz || false}
                  onChange={(e) => updateBuiltInParam('montaz', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Montaż</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={order.builtInParams?.trudna || false}
                  onChange={(e) => updateBuiltInParam('trudna', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Trudna zabudowa</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={order.builtInParams?.wolnostojacy || false}
                  onChange={(e) => updateBuiltInParam('wolnostojacy', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Wolnostojący</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={order.builtInParams?.ograniczony || false}
                  onChange={(e) => updateBuiltInParam('ograniczony', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Ograniczony dostęp</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={order.builtInParams?.front || false}
                  onChange={(e) => updateBuiltInParam('front', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Zabudowa frontowa</span>
              </label>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Status & Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status i priorytet</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={order.status || 'nowe'}
                  onChange={(e) => updateOrder('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {orderStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorytet
                </label>
                <select
                  value={order.priority || 'normal'}
                  onChange={(e) => updateOrder('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Daty</h3>
            
            <div className="space-y-3 text-sm">
              {order.createdAt && (
                <div className="flex items-center text-gray-600">
                  <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Utworzono</div>
                    <div>{new Date(order.createdAt).toLocaleString('pl-PL')}</div>
                  </div>
                </div>
              )}
              {order.scheduledDate && (
                <div className="flex items-center text-gray-600">
                  <FiClock className="mr-2 h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Zaplanowane</div>
                    <div>{new Date(order.scheduledDate).toLocaleString('pl-PL')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visits timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Historia wizyt {order.visits?.length > 0 && `(${order.visits.length})`}
              </h3>
              <button
                onClick={() => setShowAddVisitModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Dodaj wizytę
              </button>
            </div>
            
            {order.visits && order.visits.length > 0 ? (
              <div className="space-y-3">
                {order.visits.map((visit, index) => (
                  <div key={index} className="border-l-2 border-blue-200 pl-3 pb-3">
                    <div className="flex items-start">
                      <FiCheckCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {visit.visitId || `Wizyta ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {visit.scheduledDate ? new Date(visit.scheduledDate).toLocaleDateString('pl-PL') : 'Brak daty'}
                          {visit.scheduledTime && ` • ${visit.scheduledTime}`}
                        </div>
                        {visit.technicianName && (
                          <div className="text-xs text-gray-600 mt-1">
                            👤 {visit.technicianName}
                          </div>
                        )}
                        {visit.type && (
                          <div className="text-xs text-gray-600">
                            🔧 {visit.type === 'diagnosis' ? 'Diagnoza' : visit.type === 'repair' ? 'Naprawa' : visit.type === 'control' ? 'Kontrola' : 'Instalacja'}
                          </div>
                        )}
                        {visit.status && (
                          <div className="text-xs">
                            <span className={`inline-block px-2 py-0.5 rounded-full ${
                              visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                              visit.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              visit.status === 'scheduled' ? 'bg-gray-100 text-gray-700' :
                              visit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {visit.status === 'completed' ? 'Zakończona' :
                               visit.status === 'in_progress' ? 'W trakcie' :
                               visit.status === 'scheduled' ? 'Zaplanowana' :
                               visit.status === 'cancelled' ? 'Anulowana' : visit.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Brak zaplanowanych wizyt. Kliknij "Dodaj wizytę" aby przydzielić technika.
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Informacje</h3>
            <div className="space-y-2 text-sm">
              {order.orderNumber && (
                <div>
                  <span className="text-gray-500">Nr zamówienia:</span>
                  <span className="ml-2 font-medium text-gray-900">{order.orderNumber}</span>
                </div>
              )}
              {order.source && (
                <div>
                  <span className="text-gray-500">Źródło:</span>
                  <span className="ml-2 font-medium text-gray-900">{order.source}</span>
                </div>
              )}
              {order.createdBy && (
                <div>
                  <span className="text-gray-500">Utworzył:</span>
                  <span className="ml-2 font-medium text-gray-900">{order.createdBy}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Comments and Activity Log */}
      <div className="mt-6">
        <CommentsSection 
          entityType="order" 
          entityId={parseInt(id)} 
        />
      </div>

      {/* 🆕 Add Visit Modal */}
      {showAddVisitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Dodaj nową wizytę
              </h2>
              <button
                onClick={() => setShowAddVisitModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Visit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ wizyty *
                </label>
                <select
                  value={visitForm.type}
                  onChange={(e) => setVisitForm({...visitForm, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="diagnosis">🔍 Diagnoza</option>
                  <option value="repair">🔧 Naprawa</option>
                  <option value="control">✅ Kontrola</option>
                  <option value="installation">📦 Instalacja</option>
                </select>
              </div>

              {/* Technician Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Przydziel technika *
                </label>
                <select
                  value={visitForm.employeeId}
                  onChange={(e) => setVisitForm({...visitForm, employeeId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Wybierz technika...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.specializations && emp.specializations.length > 0 && `(${emp.specializations.join(', ')})`}
                    </option>
                  ))}
                </select>
                {employees.length === 0 ? (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700 font-medium mb-1">
                      ⚠️ Brak aktywnych techników w systemie
                    </p>
                    <p className="text-xs text-red-600">
                      Sprawdź plik data/employees.json lub dodaj pracowników w Panelu Administracyjnym.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Dostępnych techników: {employees.length}
                  </p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data wizyty *
                  </label>
                  <input
                    type="date"
                    value={visitForm.scheduledDate}
                    onChange={(e) => setVisitForm({...visitForm, scheduledDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Godzina
                  </label>
                  <select
                    value={visitForm.scheduledTime}
                    onChange={(e) => setVisitForm({...visitForm, scheduledTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notatki (opcjonalnie)
                </label>
                <textarea
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})}
                  placeholder="Dodatkowe informacje o wizycie..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Availability Warning/Info */}
              {(() => {
                // Pobierz dane klienta i sprawdź dostępność
                if (!order.clientId || !visitForm.scheduledDate || !visitForm.scheduledTime) {
                  return null;
                }

                // Tutaj będziemy musieli pobrać dane klienta z API
                // Na razie pokażemy info box ze wskazówką
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FiHome className="text-yellow-600 mt-0.5" size={20} />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900 mb-1">
                          💡 Sprawdź dostępność klienta
                        </p>
                        <p className="text-yellow-800">
                          Zaplanowano wizytę na <strong>{visitForm.scheduledDate}</strong> o godz. <strong>{visitForm.scheduledTime}</strong>
                        </p>
                        <p className="text-xs text-yellow-700 mt-2">
                          ℹ️ System automatycznie sprawdzi, czy klient będzie dostępny w tym czasie po kliknięciu "Dodaj wizytę"
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Order Info Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Szczegóły zamówienia</h4>
                <div className="space-y-1 text-xs text-blue-800">
                  <div><strong>Klient:</strong> {order.clientName}</div>
                  <div><strong>Telefon:</strong> {order.clientPhone || 'Brak'}</div>
                  <div><strong>Adres:</strong> {formatAddress(order.address) || 'Brak'}</div>
                  <div><strong>Urządzenie:</strong> {order.brand || ''} {order.deviceType || order.model || 'Nieznane'}</div>
                  {order.description && (
                    <div><strong>Problem:</strong> {order.description.substring(0, 100)}{order.description.length > 100 ? '...' : ''}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddVisitModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddVisit}
                disabled={addingVisit || !visitForm.employeeId || !visitForm.scheduledDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {addingVisit ? 'Dodawanie...' : 'Dodaj i przydziel wizytę'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Device Models Manager Modal */}
      <ModelManagerModal
        isOpen={showModelManager}
        onClose={() => setShowModelManager(false)}
        visitId={order?.id}
        initialModels={orderModels}
        onSave={async (updatedModels) => {
          // Zaktualizuj zamówienie z nowymi modelami
          setOrderModels(updatedModels);
          if (updatedModels.length > 0) {
            const mainModel = updatedModels[0];
            // Zaktualizuj główne pola urządzenia
            const updatedOrder = {
              ...order,
              brand: mainModel.brand,
              model: mainModel.model,
              deviceType: mainModel.type || mainModel.name,
              serialNumber: mainModel.serialNumber,
              devices: updatedModels.map((m, idx) => ({
                deviceIndex: idx,
                deviceType: m.type || m.name,
                brand: m.brand,
                model: m.model,
                serialNumber: m.serialNumber,
                notes: m.notes || ''
              }))
            };
            
            // 🆕 AUTOMATYCZNE ZAPISANIE DO SERWERA
            try {
              setSaving(true);
              const response = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedOrder)
              });

              if (response.ok) {
                setOrder(updatedOrder);
                setHasChanges(false);
                alert(`✅ Zapisano ${updatedModels.length} urządzeń z tabliczek znamionowych do zamówienia!`);
              } else {
                console.error('❌ Błąd zapisu:', await response.text());
                alert('❌ Błąd podczas zapisywania danych. Kliknij "Zapisz zamówienie" ręcznie.');
                setOrder(updatedOrder);
                setHasChanges(true);
              }
            } catch (error) {
              console.error('❌ Błąd połączenia:', error);
              alert('❌ Błąd połączenia z serwerem. Kliknij "Zapisz zamówienie" ręcznie.');
              setOrder(updatedOrder);
              setHasChanges(true);
            } finally {
              setSaving(false);
            }
          }
          setShowModelManager(false);
        }}
        context="admin"
      />
    </AdminLayout>
  );
}
