// pages/admin/klienci/[id].js
// Szczegóły i edycja klienta + historia wizyt

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import AvailabilityScheduler from '../../../components/AvailabilityScheduler';
import { 
  FiSave, FiX, FiChevronLeft, FiUser, FiPhone, FiMail, 
  FiMapPin, FiCalendar, FiAlertCircle, FiClock, FiTool, FiHome
} from 'react-icons/fi';

export default function KlientDetale() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});

  const [klient, setKlient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    street: '',
    postalCode: '',
    clientId: '',
    source: '',
    sourceDetails: '',
    userId: null,
    isAuthenticated: false,
    createdAt: '',
    updatedAt: '',
    history: [],
    physicalAvailability: null
  });

  useEffect(() => {
    if (id) {
      loadKlient();
    }
  }, [id]);

  const loadKlient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients?id=${id}`);
      const data = await response.json();
      
      console.log('📞 Odpowiedź z API clients:', data);
      
      // API zwraca obiekt klienta bezpośrednio, nie tablicę
      if (response.ok && data && data.id) {
        console.log('✅ Załadowano klienta:', data.name);
        
        // Jeśli address jest obiektem, wypełnij poszczególne pola
        if (typeof data.address === 'object' && data.address !== null) {
          data.city = data.address.city || '';
          data.street = data.address.street || '';
          data.postalCode = data.address.postalCode || '';
        }
        
        setKlient(data);
      } else if (response.status === 404) {
        alert('Nie znaleziono klienta o ID: ' + id);
        router.push('/admin/klienci');
      } else {
        alert(data.message || 'Nie znaleziono klienta');
        router.push('/admin/klienci');
      }
    } catch (error) {
      console.error('❌ Błąd pobierania klienta:', error);
      alert('Błąd połączenia z serwerem');
      router.push('/admin/klienci');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setKlient(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!klient.name?.trim()) {
      newErrors.name = 'Imię i nazwisko jest wymagane';
    }
    if (!klient.phone?.trim()) {
      newErrors.phone = 'Telefon jest wymagany';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      alert('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    try {
      setSaving(true);
      
      // Debug: sprawdź co zapisujemy
      console.log('💾 Zapisywanie klienta:', {
        id: klient.id,
        name: klient.name,
        hasPhysicalAvailability: !!klient.physicalAvailability,
        physicalAvailabilityDetails: klient.physicalAvailability
      });
      
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...klient,
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        setHasChanges(false);
        alert('Dane klienta zostały zaktualizowane');
        await loadKlient();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas zapisywania');
      }
    } catch (error) {
      console.error('Błąd:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('Masz niezapisane zmiany. Czy na pewno chcesz wyjść?')) {
        router.push('/admin/klienci');
      }
    } else {
      router.push('/admin/klienci');
    }
  };

  if (loading) {
    return (
      <AdminLayout 
        title="Ładowanie..."
        breadcrumbs={[
          { label: 'Klienci', path: '/admin/klienci' },
          { label: 'Ładowanie...' }
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Ładowanie danych klienta...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={klient.name}
      breadcrumbs={[
        { label: 'Klienci', path: '/admin/klienci' },
        { label: klient.name }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleCancel}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiChevronLeft className="h-5 w-5 mr-1" />
          Powrót do listy
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiX className="inline mr-2 h-4 w-4" />
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Zapisywanie...
              </>
            ) : (
              <>
                <FiSave className="inline mr-2 h-4 w-4" />
                Zapisz zmiany
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info badges */}
      <div className="mb-6 flex items-center space-x-3">
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800">
          ID: {klient.clientId || id}
        </span>
        {klient.source && (
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-800">
            Źródło: {klient.source}
          </span>
        )}
        {klient.createdAt && (
          <span className="text-sm text-gray-500">
            Dodano: {new Date(klient.createdAt).toLocaleDateString('pl-PL')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUser className="mr-2 h-5 w-5" />
            Dane klienta
          </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imię i nazwisko <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={klient.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={klient.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-4 w-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={klient.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miasto
                  </label>
                  <input
                    type="text"
                    value={klient.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ulica
                  </label>
                  <input
                    type="text"
                    value={klient.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kod pocztowy
                  </label>
                  <input
                    type="text"
                    value={klient.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder="00-000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pełny adres
                  </label>
                  <input
                    type="text"
                    value={
                      typeof klient.address === 'object' && klient.address !== null
                        ? `${klient.address.street || ''} ${klient.address.buildingNumber || ''}${klient.address.apartmentNumber ? '/' + klient.address.apartmentNumber : ''}, ${klient.address.postalCode || ''} ${klient.address.city || ''}`
                        : klient.address || ''
                    }
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ul. Przykładowa 123/45, 00-000 Miasto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sekcja dostępności fizycznej */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiHome className="mr-2 h-5 w-5 text-green-600" />
            Dostępność fizyczna klienta
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Określ, kiedy klient jest w domu i dostępny na wizytę technika.
            System automatycznie podpowie najlepszy czas i ostrzeże przed wizytami w złych godzinach.
          </p>
          
          <AvailabilityScheduler
            value={klient.physicalAvailability}
            onChange={(availability) => {
              updateField('physicalAvailability', availability);
            }}
          />
        </div>

        {/* Grid z historią i metadanymi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Historia wizyt */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiClock className="mr-2 h-5 w-5" />
              Historia wizyt
            </h3>

            {klient.history && klient.history.length > 0 ? (
              <div className="space-y-3">
                {klient.history.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center text-sm text-gray-900 mb-1">
                      <FiTool className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{item.service || 'Wizyta serwisowa'}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <FiCalendar className="h-3 w-3 mr-1" />
                      {new Date(item.date).toLocaleDateString('pl-PL')}
                    </div>
                    {item.description && (
                      <p className="mt-2 text-xs text-gray-600">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiClock className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Brak historii wizyt
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Metadane</h4>
            <div className="space-y-2 text-xs text-gray-600">
              {klient.createdBy && (
                <div>
                  <span className="font-medium">Utworzono przez:</span> {klient.createdByName || klient.createdBy}
                </div>
              )}
              {klient.sourceDetails && (
                <div>
                  <span className="font-medium">Źródło szczegóły:</span> {klient.sourceDetails}
                </div>
              )}
              {klient.updatedAt && (
                <div>
                  <span className="font-medium">Ostatnia aktualizacja:</span><br />
                  {new Date(klient.updatedAt).toLocaleString('pl-PL')}
                </div>
              )}
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}
