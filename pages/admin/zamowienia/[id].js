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
import { getSmartDistanceService } from '../../../distance-matrix/SmartDistanceService';
import { STATUS_LABELS, STATUS_COLORS, STATUS_ICONS } from '../../../utils/orderStatusConstants';
import { 
  FiSave, FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, 
  FiTool, FiPackage, FiFileText, FiCalendar, FiClock, FiCheckCircle,
  FiPlus, FiX, FiAlertTriangle, FiHome, FiNavigation, FiAlertCircle
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
  
  // 🚗 Distance/Travel Time
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  
  // 📦 Device Models Manager
  const [showModelManager, setShowModelManager] = useState(false);
  const [orderModels, setOrderModels] = useState([]);
  
  // 🔧 Parts Management
  const [showAddPartsModal, setShowAddPartsModal] = useState(false);
  const [availableParts, setAvailableParts] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [editingPartId, setEditingPartId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editPriceNotes, setEditPriceNotes] = useState('');
  
  const [visitForm, setVisitForm] = useState({
    type: 'diagnosis',
    employeeId: '',
    scheduledDate: '',
    scheduledTime: '09:00',
    notes: ''
  });

  const orderStatuses = Object.keys(STATUS_LABELS).map(statusKey => ({
    value: statusKey,
    label: STATUS_LABELS[statusKey],
    color: STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-800',
    icon: STATUS_ICONS[statusKey] || '📋'
  }));

  // 🎯 Smart defaults when opening Add Visit modal
  useEffect(() => {
    if (showAddVisitModal && order && order.visits && order.visits.length > 0) {
      const lastVisit = order.visits[order.visits.length - 1];
      
      console.log('🎯 Setting smart defaults from last visit:', lastVisit);
      
      // Auto-select technician from previous visit
      const defaultEmployeeId = lastVisit.technicianId || lastVisit.employeeId || '';
      
      // If last visit was diagnosis → default to repair, otherwise keep repair
      const defaultType = lastVisit.type === 'diagnosis' ? 'repair' : 'repair';
      
      setVisitForm(prev => ({
        ...prev,
        employeeId: defaultEmployeeId,
        type: defaultType
      }));
      
      console.log('✅ Smart defaults applied:', { 
        employeeId: defaultEmployeeId, 
        type: defaultType 
      });
    } else if (showAddVisitModal && (!order || !order.visits || order.visits.length === 0)) {
      // First visit - reset to defaults
      console.log('📝 First visit - using default values');
      setVisitForm({
        type: 'diagnosis',
        employeeId: '',
        scheduledDate: '',
        scheduledTime: '09:00',
        notes: ''
      });
    }
  }, [showAddVisitModal, order]);

  const priorities = [
    { value: 'normal', label: 'Normalny' },
    { value: 'wysoki', label: 'Wysoki' },
    { value: 'pilny', label: 'Pilny' }
  ];

  useEffect(() => {
    if (id) {
      loadOrder();
      loadEmployees();
      loadParts();
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

  // 🔧 Load available parts
  const loadParts = async () => {
    try {
      const response = await fetch('/api/inventory/parts');
      const data = await response.json();
      if (data.parts) {
        setAvailableParts(data.parts);
        console.log(`✅ Załadowano ${data.parts.length} części`);
      }
    } catch (error) {
      console.error('❌ Błąd ładowania części:', error);
    }
  };

  // 🔧 Add parts to order
  const handleAddPartsToOrder = async () => {
    if (selectedParts.length === 0) {
      alert('Wybierz przynajmniej jedną część!');
      return;
    }

    try {
      const partsToAdd = selectedParts.map(sp => {
        const part = availableParts.find(p => (p.id || p.partId) === sp.partId);
        const basePrice = part?.pricing?.retailPrice || part?.unitPrice || 0;
        const finalPrice = sp.customPrice !== null && sp.customPrice !== undefined ? sp.customPrice : basePrice;
        
        return {
          partId: sp.partId,
          partName: part?.name || part?.partName || sp.partId,
          partNumber: part?.partNumber || '',
          quantity: sp.quantity,
          unitPrice: finalPrice,
          totalPrice: finalPrice * sp.quantity,
          priceNotes: sp.customPrice ? 'Cena niestandardowa (ustawiona przy dodawaniu)' : null
        };
      });

      const updatedOrder = {
        ...order,
        parts: [...(order.parts || []), ...partsToAdd],
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });

      if (response.ok) {
        setOrder(updatedOrder);
        setSelectedParts([]);
        setPartSearchQuery('');
        setShowAddPartsModal(false);
        alert(`✅ Dodano ${partsToAdd.length} części do zamówienia!`);
      } else {
        alert('❌ Błąd podczas dodawania części');
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      alert('❌ Błąd połączenia z serwerem');
    }
  };

  // 🔧 Edit part price for client
  const handleEditPartPrice = async (partId, newPrice, notes) => {
    const updatedParts = (order.parts || []).map(p => {
      if (p.partId === partId) {
        const quantity = p.quantity || 1;
        return {
          ...p,
          unitPrice: parseFloat(newPrice),
          totalPrice: parseFloat(newPrice) * quantity,
          priceNotes: notes || null,
          priceModifiedAt: new Date().toISOString()
        };
      }
      return p;
    });

    const updatedOrder = {
      ...order,
      parts: updatedParts,
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });

      if (response.ok) {
        setOrder(updatedOrder);
        alert('✅ Cena części zaktualizowana');
      } else {
        alert('❌ Błąd podczas aktualizacji ceny');
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      alert('❌ Błąd połączenia z serwerem');
    }
  };

  // 🔧 Remove part from order
  const handleRemovePart = async (partId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę część?')) return;

    const updatedParts = (order.parts || []).filter(p => p.partId !== partId);
    const updatedOrder = {
      ...order,
      parts: updatedParts,
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });

      if (response.ok) {
        setOrder(updatedOrder);
        alert('✅ Część usunięta');
      } else {
        alert('❌ Błąd podczas usuwania części');
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      alert('❌ Błąd połączenia z serwerem');
    }
  };

  // 🔧 Toggle part selection
  const togglePartSelection = (partId) => {
    setSelectedParts(prev => {
      const exists = prev.find(p => p.partId === partId);
      if (exists) {
        return prev.filter(p => p.partId !== partId);
      } else {
        return [...prev, { partId, quantity: 1 }];
      }
    });
  };

  // 🔧 Update part quantity
  const updatePartQuantity = (partId, quantity) => {
    setSelectedParts(prev =>
      prev.map(p => p.partId === partId ? { ...p, quantity: Math.max(1, quantity) } : p)
    );
  };

  // 🔧 Update part custom price
  const updatePartCustomPrice = (partId, customPrice) => {
    setSelectedParts(prev =>
      prev.map(p => p.partId === partId ? { ...p, customPrice: customPrice ? parseFloat(customPrice) : null } : p)
    );
  };

  // 🔧 Filter parts by search query
  const getFilteredParts = () => {
    if (!partSearchQuery.trim()) return availableParts;
    
    const query = partSearchQuery.toLowerCase();
    return availableParts.filter(part => {
      const partId = (part.id || part.partId || '').toLowerCase();
      const partName = (part.name || part.partName || '').toLowerCase();
      const partNumber = (part.partNumber || '').toLowerCase();
      const category = (part.category || '').toLowerCase();
      
      return partId.includes(query) || 
             partName.includes(query) || 
             partNumber.includes(query) ||
             category.includes(query);
    });
  };

  // 🔄 Sync parts from order to existing visits
  const syncPartsToVisits = async () => {
    if (!order.parts || order.parts.length === 0) {
      alert('⚠️ Brak części w zamówieniu do zsynchronizowania');
      return;
    }

    if (!order.visits || order.visits.length === 0) {
      alert('⚠️ Brak wizyt w zamówieniu. Najpierw dodaj wizytę.');
      return;
    }

    const confirmMsg = `Czy chcesz skopiować ${order.parts.length} część/części z zamówienia do ${order.visits.length} wizyty/wizyt?\n\nTo nadpisze istniejące części w wizytach.`;
    
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      setSaving(true);
      
      // Zaktualizuj każdą wizytę z częściami z zamówienia
      const updatedVisits = order.visits.map(visit => ({
        ...visit,
        parts: [...order.parts], // Kopiuj części z zamówienia
        updatedAt: new Date().toISOString()
      }));

      const updatedOrder = {
        ...order,
        visits: updatedVisits,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });

      if (response.ok) {
        setOrder(updatedOrder);
        setHasChanges(false);
        alert(`✅ Zsynchronizowano ${order.parts.length} część/części do ${order.visits.length} wizyty/wizyt!`);
        await loadOrder(); // Odśwież dane
      } else {
        const errorData = await response.json();
        alert(`❌ Błąd: ${errorData.message || 'Nie udało się zapisać'}`);
      }
    } catch (error) {
      console.error('❌ Błąd synchronizacji części:', error);
      alert('❌ Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?id=${id}`);
      const data = await response.json();
      
      if (response.ok && data) {
        setOrder(data);
        
        // 🚗 Automatycznie oblicz odległość jeśli mamy GPS
        if (data.clientLocation?.coordinates || (data.latitude && data.longitude)) {
          calculateDistance(data);
        }
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

  // 🚗 Oblicz odległość od firmy
  const calculateDistance = async (orderData) => {
    if (calculatingDistance) return;
    
    try {
      setCalculatingDistance(true);
      
      const destination = orderData.clientLocation?.coordinates || {
        lat: orderData.latitude,
        lng: orderData.longitude
      };
      
      if (!destination.lat || !destination.lng) {
        console.warn('⚠️ Brak współrzędnych GPS');
        return;
      }
      
      console.log('🚗 Obliczam odległość do:', destination);
      
      const distanceService = getSmartDistanceService();
      const result = await distanceService.calculateDistanceFromCompany(destination);
      
      console.log('✅ Odległość obliczona:', result);
      
      setDistanceInfo({
        distance: result.distance.text,
        distanceKm: result.distance.km,
        duration: result.duration.text,
        durationMinutes: result.duration.minutes,
        source: result.source
      });
      
    } catch (error) {
      console.error('❌ Błąd obliczania odległości:', error);
      setDistanceInfo({
        error: 'Nie udało się obliczyć odległości'
      });
    } finally {
      setCalculatingDistance(false);
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

      // Find selected employee
      const selectedEmployee = employees.find(emp => emp.id === visitForm.employeeId);
      
      // 🆕 Wyślij do API /api/orders/[id] - API automatycznie utworzy wizytę z unikalnym visitId
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: visitForm.employeeId,
          scheduledDate: visitForm.scheduledDate,
          scheduledTime: visitForm.scheduledTime,
          visitType: visitForm.type,
          status: 'scheduled'
        })
      });

      if (response.ok) {
        const result = await response.json();
        const createdVisit = result.order?.visits?.[result.order.visits.length - 1];
        const visitId = createdVisit?.visitId || 'nowa wizyta';
        
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
        alert('❌ Błąd podczas dodawania wizyty: ' + (errorData.message || 'Nieznany błąd'));
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

            {/* 🌍 GPS Coordinates */}
            {(order.latitude || order.clientLocation) && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Współrzędne GPS
                </label>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-700 space-y-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 mr-2">Szerokość:</span>
                          <span className="text-green-700 font-mono">
                            {order.latitude || order.clientLocation?.coordinates?.lat || 'N/A'}°
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 mr-2">Długość:</span>
                          <span className="text-green-700 font-mono">
                            {order.longitude || order.clientLocation?.coordinates?.lng || 'N/A'}°
                          </span>
                        </div>
                        {order.clientLocation?.accuracy && (
                          <div className="flex items-center text-xs text-gray-600 mt-1">
                            <span className="mr-2">Dokładność:</span>
                            <span className={`px-2 py-0.5 rounded ${
                              order.clientLocation.accuracy === 'ROOFTOP' ? 'bg-green-100 text-green-700' :
                              order.clientLocation.accuracy === 'RANGE_INTERPOLATED' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.clientLocation.accuracy}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${order.latitude || order.clientLocation?.coordinates?.lat},${order.longitude || order.clientLocation?.coordinates?.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors inline-flex items-center"
                    >
                      <FiMapPin className="mr-1 h-4 w-4" />
                      Otwórz w mapach
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 🚗 Distance & Travel Time */}
            {(order.latitude || order.clientLocation) && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🚗 Odległość i Czas Dojazdu
                </label>
                {calculatingDistance ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center text-sm text-blue-600">
                      <div className="animate-spin mr-2">⏳</div>
                      <span>Obliczam odległość...</span>
                    </div>
                  </div>
                ) : distanceInfo && !distanceInfo.error ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Odległość od siedziby</div>
                        <div className="text-lg font-bold text-blue-700">
                          <FiNavigation className="inline mr-1 h-4 w-4" />
                          {distanceInfo.distance}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Szacowany czas jazdy</div>
                        <div className="text-lg font-bold text-blue-700">
                          <FiClock className="inline mr-1 h-4 w-4" />
                          {distanceInfo.duration}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Źródło: {distanceInfo.source === 'osrm' ? 'OSRM (OpenStreetMap)' : 'Google Maps'}
                        {distanceInfo.source === 'osrm' && ' • Darmowy routing'}
                      </div>
                      <button
                        onClick={() => calculateDistance(order)}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Przelicz ponownie
                      </button>
                    </div>
                  </div>
                ) : distanceInfo?.error ? (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center text-sm text-red-600">
                      <FiAlertTriangle className="mr-2 h-4 w-4" />
                      <span>{distanceInfo.error}</span>
                    </div>
                    <button
                      onClick={() => calculateDistance(order)}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
                    >
                      Spróbuj ponownie
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <button
                      onClick={() => calculateDistance(order)}
                      className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center"
                    >
                      <FiNavigation className="mr-1 h-4 w-4" />
                      Oblicz odległość i czas dojazdu
                    </button>
                  </div>
                )}
              </div>
            )}

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
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Załaduj istniejące urządzenia z zamówienia
                    const models = order.devices?.map((d, idx) => ({
                      id: idx,
                      brand: d.brand || '',
                      model: d.model || '',
                      name: d.deviceType || '',
                      type: d.deviceType || '',
                      serialNumber: d.serialNumber || '',
                      notes: d.notes || '',
                      source: 'existing'
                    })) || [];
                    setOrderModels(models);
                    setShowModelManager(true);
                  }}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FiPackage className="mr-1 h-4 w-4" />
                  📷 Skanuj tabliczkę
                </button>
                <button
                  onClick={addDevice}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiPlus className="mr-1 h-4 w-4" />
                  Dodaj ręcznie
                </button>
              </div>
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

          {/* 🔧 Parts Management Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiPackage className="mr-2 h-5 w-5 text-green-600" />
                Części zamienne {order.parts && order.parts.length > 0 && `(${order.parts.length})`}
              </h2>
              <div className="flex items-center gap-2">
                {/* Przycisk synchronizacji części do wizyt */}
                {order.parts && order.parts.length > 0 && order.visits && order.visits.length > 0 && (
                  <button
                    onClick={syncPartsToVisits}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Skopiuj części z zamówienia do wizyt"
                  >
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {saving ? 'Synchronizuję...' : 'Synchronizuj do wizyt'}
                  </button>
                )}
                <button
                  onClick={() => setShowAddPartsModal(true)}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiPlus className="mr-1 h-4 w-4" />
                  Dodaj części
                </button>
              </div>
            </div>

            {(!order.parts || order.parts.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <FiPackage className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Brak dodanych części</p>
                <p className="text-sm">Kliknij "Dodaj części" aby przypisać części do tego zamówienia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {order.parts.map((part, index) => {
                  const isEditing = editingPartId === part.partId;
                  
                  return (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{part.partName}</div>
                          <div className="text-sm text-gray-500">
                            {part.partNumber && `${part.partNumber}`}
                          </div>
                          
                          {/* Edycja ceny */}
                          {isEditing ? (
                            <div className="mt-3 space-y-2 bg-white p-3 rounded-lg border border-blue-300">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Ilość
                                  </label>
                                  <input
                                    type="number"
                                    value={part.quantity}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Cena za szt. (zł) <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="np. 85.50"
                                    autoFocus
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Suma
                                  </label>
                                  <input
                                    type="text"
                                    value={`${(parseFloat(editPrice || 0) * part.quantity).toFixed(2)} zł`}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-semibold"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Notatka (opcjonalnie)
                                </label>
                                <input
                                  type="text"
                                  value={editPriceNotes}
                                  onChange={(e) => setEditPriceNotes(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="np. z marżą 20%, z przesyłką, cena promocyjna"
                                />
                              </div>
                              
                              <div className="flex items-center justify-end space-x-2 pt-2">
                                <button
                                  onClick={() => {
                                    setEditingPartId(null);
                                    setEditPrice('');
                                    setEditPriceNotes('');
                                  }}
                                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                >
                                  Anuluj
                                </button>
                                <button
                                  onClick={() => {
                                    if (!editPrice || parseFloat(editPrice) <= 0) {
                                      alert('Podaj prawidłową cenę!');
                                      return;
                                    }
                                    handleEditPartPrice(part.partId, editPrice, editPriceNotes);
                                    setEditingPartId(null);
                                    setEditPrice('');
                                    setEditPriceNotes('');
                                  }}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  Zapisz cenę
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">{part.quantity} szt</span>
                                {' × '}
                                <span className="font-semibold text-blue-600">{part.unitPrice} zł</span>
                                {' = '}
                                <span className="font-bold text-green-600">{part.totalPrice.toFixed(2)} zł</span>
                              </div>
                              {part.priceNotes && (
                                <div className="mt-1 text-xs text-gray-500 italic">
                                  💡 {part.priceNotes}
                                </div>
                              )}
                              {part.priceModifiedAt && (
                                <div className="mt-1 text-xs text-gray-400">
                                  Cena zmieniona: {new Date(part.priceModifiedAt).toLocaleString('pl-PL')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Przyciski akcji */}
                        <div className="flex items-center space-x-2 ml-3">
                          {!isEditing && (
                            <button
                              onClick={() => {
                                setEditingPartId(part.partId);
                                setEditPrice(part.unitPrice.toString());
                                setEditPriceNotes(part.priceNotes || '');
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edytuj cenę"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleRemovePart(part.partId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Usuń część"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-3 border-t-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-700">Suma części:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {order.parts.reduce((sum, p) => sum + (p.totalPrice || 0), 0).toFixed(2)} zł
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Możesz edytować ceny części klikając ikonę ołówka (np. aby dodać marżę, koszty przesyłki)
                  </p>
                  
                  {/* Status synchronizacji z wizytami */}
                  {order.visits && order.visits.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg border">
                      {(() => {
                        const visitsWithParts = order.visits.filter(v => v.parts && v.parts.length > 0);
                        const allVisitsHaveParts = visitsWithParts.length === order.visits.length;
                        const someVisitsHaveParts = visitsWithParts.length > 0;
                        
                        if (allVisitsHaveParts) {
                          return (
                            <div className="bg-green-50 border-green-200">
                              <div className="flex items-start space-x-2 text-sm text-green-800">
                                <FiCheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">Części zsynchronizowane z wizytami ✓</p>
                                  <p className="text-xs mt-1">
                                    {order.visits.length} {order.visits.length === 1 ? 'wizyta ma' : 'wizyty mają'} przypisane części
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (someVisitsHaveParts) {
                          return (
                            <div className="bg-yellow-50 border-yellow-200">
                              <div className="flex items-start space-x-2 text-sm text-yellow-800">
                                <FiAlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">Częściowo zsynchronizowane</p>
                                  <p className="text-xs mt-1">
                                    {visitsWithParts.length} z {order.visits.length} {order.visits.length === 1 ? 'wizyty' : 'wizyt'} ma przypisane części
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-orange-50 border-orange-200">
                              <div className="flex items-start space-x-2 text-sm text-orange-800">
                                <FiAlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">Części nie są zsynchronizowane z wizytami</p>
                                  <p className="text-xs mt-1">
                                    Kliknij "Synchronizuj do wizyt" aby skopiować części do {order.visits.length} {order.visits.length === 1 ? 'wizyty' : 'wizyt'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
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

      {/* � Add Parts Modal */}
      {showAddPartsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dodaj części do zamówienia
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Zamówienie: {order.orderNumber}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddPartsModal(false);
                    setSelectedParts([]);
                    setPartSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={partSearchQuery}
                  onChange={(e) => setPartSearchQuery(e.target.value)}
                  placeholder="🔍 Szukaj części po nazwie, ID, numerze katalogowym..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {partSearchQuery && (
                  <button
                    onClick={() => setPartSearchQuery('')}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Znaleziono: {getFilteredParts().length} części
                </span>
                <span className={`font-medium ${selectedParts.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                  Zaznaczono: {selectedParts.length} części
                </span>
              </div>
            </div>

            {/* Parts Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {getFilteredParts().length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500">Nie znaleziono części</p>
                  <p className="text-sm text-gray-400 mt-1">Spróbuj zmienić kryteria wyszukiwania</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFilteredParts().map(part => {
                    const partId = part.id || part.partId;
                    const partName = part.name || part.partName;
                    const partPrice = part.pricing?.retailPrice || part.unitPrice || 0;
                    const partImage = part.imageUrl || part.images?.[0]?.url || '/uploads/parts/default-part.svg';
                    const inStock = part.availability?.inStock || part.stockQuantity || 0;
                    const selectedPart = selectedParts.find(p => p.partId === partId);
                    const isSelected = !!selectedPart;

                    return (
                      <div
                        key={partId}
                        className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => togglePartSelection(partId)}
                      >
                        <div className="flex space-x-4">
                          {/* Checkbox */}
                          <div className="flex-shrink-0 pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          {/* Image */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
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
                            <div className="font-medium text-gray-900 truncate">
                              {partName}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {partId} {part.partNumber && `• ${part.partNumber}`}
                            </div>
                            {(part.category || part.subcategory) && (
                              <div className="flex items-center space-x-1 mt-1">
                                {part.category && (
                                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                    {part.category}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-lg font-bold text-blue-600">
                                {partPrice} zł
                              </div>
                              <div className={`text-xs ${inStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {inStock > 0 ? `✓ ${inStock} szt` : '✗ Brak'}
                              </div>
                            </div>

                            {/* Quantity and Price inputs */}
                            {isSelected && (
                              <div className="mt-3 space-y-2 bg-white p-2 rounded border border-blue-300" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm font-medium text-gray-700 w-16">
                                    Ilość:
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedPart.quantity}
                                    onChange={(e) => updatePartQuantity(partId, parseInt(e.target.value) || 1)}
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                  />
                                  <span className="text-sm text-gray-500">szt</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm font-medium text-gray-700 w-16">
                                    Cena:
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder={partPrice.toString()}
                                    value={selectedPart.customPrice || ''}
                                    onChange={(e) => updatePartCustomPrice(partId, e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                  />
                                  <span className="text-sm text-gray-500">zł</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {selectedPart.customPrice ? (
                                    <span className="text-blue-600">
                                      💡 Cena niestandardowa: {selectedPart.customPrice} zł (oryg. {partPrice} zł)
                                    </span>
                                  ) : (
                                    <span>
                                      💰 Cena magazynowa: {partPrice} zł (możesz zmienić)
                                    </span>
                                  )}
                                </div>
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
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {selectedParts.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-900">
                      Wybrane części ({selectedParts.length}):
                    </span>
                    <button
                      onClick={() => setSelectedParts([])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Wyczyść wszystkie
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedParts.map(sp => {
                      const part = availableParts.find(p => (p.id || p.partId) === sp.partId);
                      const partName = part?.name || part?.partName || sp.partId;
                      const basePrice = part?.pricing?.retailPrice || part?.unitPrice || 0;
                      const finalPrice = sp.customPrice !== null && sp.customPrice !== undefined ? sp.customPrice : basePrice;
                      const isPriceModified = sp.customPrice !== null && sp.customPrice !== undefined;
                      
                      return (
                        <div key={sp.partId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate">
                            {partName}
                            {isPriceModified && <span className="ml-1 text-xs text-orange-600">*</span>}
                          </span>
                          <span className={`font-medium ml-2 whitespace-nowrap ${isPriceModified ? 'text-orange-600' : 'text-blue-600'}`}>
                            {sp.quantity} × {finalPrice} zł = {(sp.quantity * finalPrice).toFixed(2)} zł
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 mt-2 border-t border-blue-200">
                    <div className="flex items-center justify-between font-semibold text-blue-900">
                      <span>Suma:</span>
                      <span className="text-lg">
                        {selectedParts.reduce((sum, sp) => {
                          const part = availableParts.find(p => (p.id || p.partId) === sp.partId);
                          const basePrice = part?.pricing?.retailPrice || part?.unitPrice || 0;
                          const finalPrice = sp.customPrice !== null && sp.customPrice !== undefined ? sp.customPrice : basePrice;
                          return sum + (sp.quantity * finalPrice);
                        }, 0).toFixed(2)} zł
                      </span>
                    </div>
                    {selectedParts.some(sp => sp.customPrice !== null && sp.customPrice !== undefined) && (
                      <div className="mt-1 text-xs text-orange-600">
                        * - cena niestandardowa (z marżą/przesyłką)
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowAddPartsModal(false);
                    setSelectedParts([]);
                    setPartSearchQuery('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddPartsToOrder}
                  disabled={selectedParts.length === 0}
                  className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                    selectedParts.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  title={selectedParts.length === 0 ? 'Zaznacz przynajmniej jedną część' : 'Dodaj zaznaczone części do zamówienia'}
                >
                  ✓ Dodaj części ({selectedParts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* �📦 Device Models Manager Modal */}
      <ModelManagerModal
        isOpen={showModelManager}
        onClose={() => setShowModelManager(false)}
        visitId={order?.id}
        initialModels={orderModels}
        onSave={async (updatedModels) => {
          // Zaktualizuj zamówienie z nowymi modelami
          setOrderModels(updatedModels);
          
          console.log('💾 Zapisuję modele z tabliczek znamionowych:', updatedModels);
          
          if (updatedModels.length > 0) {
            const mainModel = updatedModels[0];
            // Zaktualizuj główne pola urządzenia + devices[]
            const updatedOrder = {
              ...order,
              brand: mainModel.brand || order.brand,
              model: mainModel.model || order.model,
              deviceType: mainModel.type || mainModel.name || order.deviceType,
              serialNumber: mainModel.serialNumber || order.serialNumber,
              devices: updatedModels.map((m, idx) => ({
                deviceIndex: idx,
                deviceType: m.type || m.name || 'Nieznane urządzenie',
                brand: m.brand || '',
                model: m.model || '',
                serialNumber: m.serialNumber || '',
                notes: m.notes || '',
                scannedAt: m.source === 'scanner' ? new Date().toISOString() : undefined
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
                console.log('✅ Zapisano do serwera:', updatedOrder);
                alert(`✅ Zapisano ${updatedModels.length} urządzeń z tabliczek znamionowych do zamówienia ${order.orderNumber}!`);
                // Przeładuj zamówienie aby pobrać świeże dane
                await loadOrder();
              } else {
                const errorText = await response.text();
                console.error('❌ Błąd zapisu:', errorText);
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
          } else {
            // Jeśli usunięto wszystkie modele
            console.log('⚠️ Brak modeli - usuwam devices[] z zamówienia');
            const updatedOrder = {
              ...order,
              devices: []
            };
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
                await loadOrder();
              }
            } catch (error) {
              console.error('❌ Błąd:', error);
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
