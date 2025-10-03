// pages/admin/zamowienia/[id].js
// Szczegóły i edycja zamówienia

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { 
  FiSave, FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, 
  FiTool, FiPackage, FiFileText, FiCalendar, FiClock, FiCheckCircle
} from 'react-icons/fi';

export default function AdminZamowienieDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    }
  }, [id]);

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
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={order.clientPhone || ''}
                  onChange={(e) => updateOrder('clientPhone', e.target.value)}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Miasto
                </label>
                <input
                  type="text"
                  value={order.city || ''}
                  onChange={(e) => updateOrder('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <input
                  type="text"
                  value={order.address || ''}
                  onChange={(e) => updateOrder('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Device info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiTool className="mr-2 h-5 w-5 text-blue-600" />
              Urządzenie
            </h2>
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
            </div>
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
          {order.visits && order.visits.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Historia wizyt</h3>
              
              <div className="space-y-3">
                {order.visits.map((visit, index) => (
                  <div key={index} className="border-l-2 border-blue-200 pl-3 pb-3">
                    <div className="flex items-start">
                      <FiCheckCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Wizyta {index + 1}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {visit.date ? new Date(visit.date).toLocaleDateString('pl-PL') : 'Brak daty'}
                        </div>
                        {visit.description && (
                          <div className="text-xs text-gray-600 mt-1">
                            {visit.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
    </AdminLayout>
  );
}
