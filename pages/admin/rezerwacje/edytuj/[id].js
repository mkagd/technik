// pages/admin/rezerwacje/edytuj/[id].js
// Formularz edycji rezerwacji

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import AvailabilityScheduler from '../../../../components/AvailabilityScheduler';
import DateRangePicker from '../../../../components/DateRangePicker';
import { STATUS_LABELS, STATUS_COLORS, STATUS_ICONS } from '../../../../utils/orderStatusConstants';
import { 
  FiSave, FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, 
  FiCalendar, FiTool, FiFileText, FiAlertCircle, FiPlus, FiTrash2, FiHome
} from 'react-icons/fi';

export default function EdytujRezerwacje() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    city: '',
    street: '',
    address: '',
    date: '',
    dateRange: { from: '', to: '' },
    dateMode: 'single', // 'single' lub 'range'
    time: '',
    availability: '',
    status: 'pending',
    physicalAvailability: null,
    clientType: 'private' // 'private' lub 'company'
  });

  const [showAdvancedAvailability, setShowAdvancedAvailability] = useState(false);

  // Dane firmy
  const [companyData, setCompanyData] = useState({
    nip: '',
    name: '',
    address: '',
    city: '',
    postalCode: '',
    regon: '',
    krs: ''
  });

  const [fetchingGUS, setFetchingGUS] = useState(false);

  // Wiele telefonów
  const [phones, setPhones] = useState([
    { number: '', label: 'Główny', isPrimary: true }
  ]);

  // Wiele adresów
  const [addresses, setAddresses] = useState([
    { street: '', city: '', postalCode: '', label: 'Główny', isPrimary: true }
  ]);

  // Wiele urządzeń
  const [devices, setDevices] = useState([
    { category: '', brand: '', model: '', problem: '', serialNumber: '', hasBuiltIn: false }
  ]);

  // Model suggestions dla autocomplete
  const [modelSuggestions, setModelSuggestions] = useState({}); // { deviceIndex: [models] }
  const [showModelSuggestions, setShowModelSuggestions] = useState(null); // index urządzenia
  const [loadingModels, setLoadingModels] = useState(false);

  const categories = [
    'Pralki', 
    'Lodówki', 
    'Zmywarki', 
    'Piekarniki', 
    'Kuchenki', 
    'Płyty indukcyjne', 
    'Suszarki', 
    'Inne'
  ];

  // Lista popularnych marek AGD
  const brands = [
    'Amica', 'AEG', 'Beko', 'Bosch', 'Candy', 'Electrolux', 'Gorenje', 
    'Haier', 'Hotpoint', 'Indesit', 'LG', 'Miele', 'Panasonic', 'Samsung', 
    'Sharp', 'Siemens', 'Whirlpool', 'Zanussi', 'Inne'
  ];

  const bookingStatuses = Object.keys(STATUS_LABELS).map(statusKey => ({
    value: statusKey,
    label: STATUS_LABELS[statusKey],
    color: STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-800',
    icon: STATUS_ICONS[statusKey] || '📋'
  }));

  // Ładowanie danych rezerwacji
  useEffect(() => {
    if (id) {
      loadRezerwacja();
    }
  }, [id]);

  const loadRezerwacja = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rezerwacje?id=${id}`);
      const data = await response.json();
      
      if (response.ok && data) {
        const rezerwacja = Array.isArray(data) ? data[0] : data;
        
        if (rezerwacja) {
          // Załaduj podstawowe dane
          setFormData({
            name: rezerwacja.name || '',
            email: rezerwacja.email || '',
            city: rezerwacja.city || '',
            street: rezerwacja.street || '',
            address: rezerwacja.address || '',
            date: rezerwacja.date || '',
            dateRange: rezerwacja.dateRange || { from: '', to: '' },
            dateMode: rezerwacja.dateMode || 'single',
            time: rezerwacja.time || '',
            availability: rezerwacja.availability || '',
            status: rezerwacja.status || 'pending',
            physicalAvailability: rezerwacja.physicalAvailability || null,
            clientType: rezerwacja.clientType || 'private'
          });

          // Załaduj dane firmowe
          if (rezerwacja.companyData) {
            setCompanyData(rezerwacja.companyData);
          }

          // Załaduj telefony
          if (rezerwacja.phones && rezerwacja.phones.length > 0) {
            setPhones(rezerwacja.phones);
          } else if (rezerwacja.phone) {
            setPhones([{ number: rezerwacja.phone, label: 'Główny', isPrimary: true }]);
          }

          // Załaduj adresy
          if (rezerwacja.addresses && rezerwacja.addresses.length > 0) {
            setAddresses(rezerwacja.addresses);
          } else {
            setAddresses([{
              street: rezerwacja.street || '',
              city: rezerwacja.city || '',
              postalCode: rezerwacja.postalCode || '',
              label: 'Główny',
              isPrimary: true
            }]);
          }

          // Załaduj urządzenia
          if (rezerwacja.devices && rezerwacja.devices.length > 0) {
            setDevices(rezerwacja.devices.map(d => ({
              category: d.name || d.category || '',
              brand: d.brand || '',
              model: d.model || '',
              problem: d.description || d.problem || '',
              serialNumber: d.serialNumber || '',
              hasBuiltIn: d.hasBuiltIn || false
            })));
          } else if (rezerwacja.category) {
            setDevices([{
              category: rezerwacja.category,
              brand: rezerwacja.device || '',
              model: '',
              problem: rezerwacja.description || rezerwacja.problem || '',
              serialNumber: '',
              hasBuiltIn: false
            }]);
          }
        } else {
          alert('Nie znaleziono rezerwacji');
          router.push('/admin/rezerwacje');
        }
      } else {
        alert('Nie znaleziono rezerwacji');
        router.push('/admin/rezerwacje');
      }
    } catch (error) {
      console.error('Błąd:', error);
      alert('Błąd pobierania danych');
      router.push('/admin/rezerwacje');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Usuń błąd dla tego pola
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // ========== TELEFONY ==========
  const addPhone = () => {
    setPhones([...phones, { number: '', label: '', isPrimary: false }]);
  };

  const removePhone = (index) => {
    if (phones.length > 1) {
      setPhones(phones.filter((_, i) => i !== index));
    }
  };

  const updatePhone = (index, field, value) => {
    const updated = [...phones];
    updated[index][field] = value;
    setPhones(updated);
  };

  // ========== ADRESY ==========
  const addAddress = () => {
    setAddresses([...addresses, { street: '', city: '', postalCode: '', label: '', isPrimary: false }]);
  };

  const removeAddress = (index) => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter((_, i) => i !== index));
    }
  };

  const updateAddress = (index, field, value) => {
    const updated = [...addresses];
    updated[index][field] = value;
    setAddresses(updated);
  };

  // ========== URZĄDZENIA ==========
  const addDevice = () => {
    setDevices([...devices, { category: '', brand: '', model: '', problem: '', serialNumber: '', hasBuiltIn: false }]);
  };

  const removeDevice = (index) => {
    if (devices.length > 1) {
      setDevices(devices.filter((_, i) => i !== index));
    }
  };

  const updateDevice = (index, field, value) => {
    const updated = [...devices];
    updated[index][field] = value;
    setDevices(updated);

    // Jeśli zmienia się marka - pobierz nowe modele
    if (field === 'brand' || field === 'category') {
      fetchModels(index);
    }
  };

  // ========== MODELE URZĄDZEŃ (AUTOCOMPLETE) ==========
  const fetchModels = async (deviceIndex) => {
    const device = devices[deviceIndex];
    
    // Wymaga marki
    if (!device.brand) {
      setModelSuggestions({ ...modelSuggestions, [deviceIndex]: [] });
      return;
    }

    setLoadingModels(true);
    try {
      const params = new URLSearchParams();
      params.append('brand', device.brand);
      
      // Opcjonalnie: filtruj po typie urządzenia
      if (device.category) {
        params.append('type', device.category);
      }

      const response = await fetch(`/api/device-models?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.models) {
        setModelSuggestions({ 
          ...modelSuggestions, 
          [deviceIndex]: data.models 
        });
      } else {
        setModelSuggestions({ ...modelSuggestions, [deviceIndex]: [] });
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModelSuggestions({ ...modelSuggestions, [deviceIndex]: [] });
    } finally {
      setLoadingModels(false);
    }
  };

  const getFilteredModels = (deviceIndex, searchTerm) => {
    const suggestions = modelSuggestions[deviceIndex] || [];
    
    if (!searchTerm) {
      return suggestions.slice(0, 10); // Pokaż max 10 bez filtrowania
    }

    const search = searchTerm.toLowerCase();
    return suggestions
      .filter(m => 
        m.model?.toLowerCase().includes(search) ||
        m.name?.toLowerCase().includes(search)
      )
      .slice(0, 10);
  };

  const handleModelSelect = (deviceIndex, model) => {
    const updated = [...devices];
    updated[deviceIndex].model = model.model;
    
    // Opcjonalnie: wypełnij też serialNumber jeśli jest w bazie
    if (model.serialNumber) {
      updated[deviceIndex].serialNumber = model.serialNumber;
    }
    
    setDevices(updated);
    setShowModelSuggestions(null);
  };

  // ========== GUS API ==========
  const fetchCompanyFromGUS = async () => {
    if (!companyData.nip || companyData.nip.length < 10) {
      alert('❌ Podaj poprawny NIP (10 cyfr)');
      return;
    }

    setFetchingGUS(true);
    try {
      // TODO: Zintegruj z prawdziwym API GUS
      // Endpoint: https://wl-api.mf.gov.pl/api/search/nip/{nip}?date=YYYY-MM-DD
      
      const response = await fetch(`/api/gus?nip=${companyData.nip}`);
      const data = await response.json();

      if (data.success && data.company) {
        // Wypełnij dane firmy
        setCompanyData({
          ...companyData,
          name: data.company.name || '',
          address: data.company.address || '',
          city: data.company.city || '',
          postalCode: data.company.postalCode || '',
          regon: data.company.regon || '',
          krs: data.company.krs || ''
        });

        // Opcjonalnie: wypełnij też główny adres
        if (data.company.address && data.company.city) {
          const updated = [...addresses];
          const primaryIdx = updated.findIndex(a => a.isPrimary);
          if (primaryIdx >= 0) {
            updated[primaryIdx] = {
              ...updated[primaryIdx],
              street: data.company.address,
              city: data.company.city,
              postalCode: data.company.postalCode || ''
            };
            setAddresses(updated);
          }
        }

        const message = data.source === 'mock-generated' 
          ? '✅ Dane wygenerowane testowo\n\n⚠️ To nie są prawdziwe dane z GUS!\nSystem wygenerował przykładowe informacje.\nZweryfikuj i popraw dane ręcznie.'
          : '✅ Dane firmy pobrane z GUS';
        alert(message);
      } else {
        alert(`❌ Nie znaleziono firmy o NIP: ${companyData.nip}\n\n${data.message || 'Sprawdź NIP lub dodaj dane ręcznie.'}`);
      }
    } catch (error) {
      console.error('Error fetching GUS:', error);
      alert('❌ Błąd połączenia z API GUS\n\nDodaj dane firmy ręcznie.');
    } finally {
      setFetchingGUS(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Imię i nazwisko wymagane (min. 2 znaki)';
    }

    // Walidacja telefonów
    const primaryPhone = phones.find(p => p.isPrimary);
    if (!primaryPhone || !primaryPhone.number || primaryPhone.number.trim().length < 9) {
      newErrors.phone = 'Główny telefon wymagany (min. 9 cyfr)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    // Walidacja adresów
    const primaryAddress = addresses.find(a => a.isPrimary);
    if (!primaryAddress || !primaryAddress.city || !primaryAddress.street) {
      newErrors.address = 'Główny adres wymagany (miasto i ulica)';
    }

    // Walidacja urządzeń
    const hasValidDevice = devices.some(d => d.category);
    if (!hasValidDevice) {
      newErrors.device = 'Przynajmniej jedno urządzenie wymagane';
    }

    // Walidacja daty
    if (formData.dateMode === 'range') {
      if (!formData.dateRange.from) {
        newErrors.date = 'Data początkowa wymagana';
      }
      if (!formData.dateRange.to) {
        newErrors.date = 'Data końcowa wymagana';
      }
    } else {
      if (!formData.date) {
        newErrors.date = 'Data wizyty wymagana';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Pobierz główny telefon i adres
      const primaryPhone = phones.find(p => p.isPrimary) || phones[0];
      const primaryAddress = addresses.find(a => a.isPrimary) || addresses[0];
      const primaryDevice = devices[0];

      // Przygotuj dane do wysłania
      const submitData = {
        ...formData,
        // Główny telefon (dla kompatybilności)
        phone: primaryPhone.number,
        // Główny adres (dla kompatybilności)
        city: primaryAddress.city,
        street: primaryAddress.street,
        fullAddress: `${primaryAddress.street}, ${primaryAddress.postalCode || ''} ${primaryAddress.city}`.trim(),
        // Główne urządzenie (dla kompatybilności)
        category: primaryDevice.category,
        device: primaryDevice.model || primaryDevice.brand || primaryDevice.category,
        problem: primaryDevice.problem || 'Brak opisu problemu',
        // Dodatkowe dane
        phones: phones.filter(p => p.number),
        addresses: addresses.filter(a => a.street && a.city),
        devices: devices.filter(d => d.category),
        // Dostępność fizyczna
        physicalAvailability: formData.physicalAvailability,
        // Data: przekaż zakres lub pojedynczą datę
        isFlexibleDate: formData.dateMode === 'range',
        dateRange: formData.dateMode === 'range' ? {
          from: formData.dateRange.from,
          to: formData.dateRange.to,
          flexible: true
        } : null,
        // Dane firmy (jeśli typ = company)
        clientType: formData.clientType,
        companyData: formData.clientType === 'company' ? companyData : null,
        // Metadane
        multiDevice: devices.length > 1,
        multiPhone: phones.length > 1,
        multiAddress: addresses.length > 1
      };

      console.log('📤 Aktualizowanie rezerwacji:', submitData);

      const response = await fetch('/api/rezerwacje', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          ...submitData,
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Rezerwacja zaktualizowana:', result);
        
        // Przekieruj do podglądu rezerwacji
        router.push(`/admin/rezerwacje/${id}`);
      } else {
        const error = await response.json();
        alert(`Błąd: ${error.message || 'Nie udało się zaktualizować rezerwacji'}`);
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout 
        title="Ładowanie..."
        breadcrumbs={[
          { label: 'Rezerwacje', href: '/admin/rezerwacje' },
          { label: 'Ładowanie...' }
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Ładowanie danych rezerwacji...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={`Edycja rezerwacji #${id}`}
      breadcrumbs={[
        { label: 'Rezerwacje', href: '/admin/rezerwacje' },
        { label: `#${id}`, href: `/admin/rezerwacje/${id}` },
        { label: 'Edycja' }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => router.push(`/admin/rezerwacje/${id}`)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Powrót do podglądu
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dane klienta */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="mr-2 h-5 w-5 text-blue-600" />
                Dane klienta
              </h2>

              {/* Wybór: Prywatny / Firma */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Typ klienta *
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.clientType === 'private' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="clientType"
                      value="private"
                      checked={formData.clientType === 'private'}
                      onChange={(e) => handleChange('clientType', e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-lg mr-2">👤</span>
                    <span className="font-medium">Klient prywatny</span>
                  </label>
                  
                  <label className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.clientType === 'company' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="clientType"
                      value="company"
                      checked={formData.clientType === 'company'}
                      onChange={(e) => handleChange('clientType', e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-lg mr-2">🏢</span>
                    <span className="font-medium">Firma</span>
                  </label>
                </div>
              </div>

              {/* Dane firmy - pokazuje się tylko dla firm */}
              {formData.clientType === 'company' && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3">
                    🏢 Dane firmowe
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIP *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={companyData.nip}
                          onChange={(e) => setCompanyData({ ...companyData, nip: e.target.value.replace(/\D/g, '') })}
                          maxLength="10"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="1234567890"
                        />
                        <button
                          type="button"
                          onClick={fetchCompanyFromGUS}
                          disabled={fetchingGUS || !companyData.nip || companyData.nip.length < 10}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {fetchingGUS ? '⏳ Pobieranie...' : '🔍 Pobierz z GUS'}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        💡 Kliknij "Pobierz z GUS" aby automatycznie wypełnić dane firmy
                      </p>
                      <p className="mt-1 text-xs text-orange-600 font-medium">
                        ⚠️ TRYB TESTOWY: API generuje przykładowe dane. Zintegruj prawdziwe API GUS!
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nazwa firmy *
                      </label>
                      <input
                        type="text"
                        value={companyData.name}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nazwa Sp. z o.o."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        REGON
                      </label>
                      <input
                        type="text"
                        value={companyData.regon}
                        onChange={(e) => setCompanyData({ ...companyData, regon: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KRS
                      </label>
                      <input
                        type="text"
                        value={companyData.krs}
                        onChange={(e) => setCompanyData({ ...companyData, krs: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0000123456"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.clientType === 'company' ? 'Osoba kontaktowa *' : 'Imię i nazwisko *'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Jan Kowalski"
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Telefony - wiele numerów */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Numery telefonu *
                    </label>
                    <button
                      type="button"
                      onClick={addPhone}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <FiPlus className="mr-1 h-3 w-3" />
                      Dodaj numer
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {phones.map((phone, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="tel"
                          value={phone.number}
                          onChange={(e) => updatePhone(index, 'number', e.target.value)}
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.phone && index === 0 ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="123456789"
                        />
                        <input
                          type="text"
                          value={phone.label}
                          onChange={(e) => updatePhone(index, 'label', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="np. Służbowy"
                        />
                        {phones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhone(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="jan@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Adresy - wiele lokalizacji */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Adresy *
                    </label>
                    <button
                      type="button"
                      onClick={addAddress}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <FiPlus className="mr-1 h-3 w-3" />
                      Dodaj adres
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {addresses.map((addr, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <input
                            type="text"
                            value={addr.label}
                            onChange={(e) => updateAddress(index, 'label', e.target.value)}
                            className="text-sm font-medium px-2 py-1 border border-gray-300 rounded"
                            placeholder="np. Dom, Biuro"
                          />
                          {addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAddress(index)}
                              className="text-red-600 hover:bg-red-50 p-1 rounded"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={addr.street}
                            onChange={(e) => updateAddress(index, 'street', e.target.value)}
                            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              errors.address && index === 0 ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Ulica i numer"
                          />
                          <input
                            type="text"
                            value={addr.city}
                            onChange={(e) => updateAddress(index, 'city', e.target.value)}
                            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              errors.address && index === 0 ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Miasto"
                          />
                          <input
                            type="text"
                            value={addr.postalCode}
                            onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 col-span-2"
                            placeholder="Kod pocztowy (np. 00-000)"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Urządzenia - wiele sprzętów */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiTool className="mr-2 h-5 w-5 text-blue-600" />
                  Urządzenia do naprawy
                </h2>
                <button
                  type="button"
                  onClick={addDevice}
                  className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <FiPlus className="mr-1 h-3 w-3" />
                  Dodaj urządzenie
                </button>
              </div>
              
              <div className="space-y-4">
                {devices.map((device, index) => (
                  <div key={index} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">
                        Urządzenie {index + 1}
                      </h3>
                      {devices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDevice(index)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Kategoria *
                        </label>
                        <select
                          value={device.category}
                          onChange={(e) => updateDevice(index, 'category', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                            errors.device && index === 0 ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Wybierz kategorię</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Marka
                        </label>
                        <select
                          value={device.brand}
                          onChange={(e) => updateDevice(index, 'brand', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Wybierz markę</option>
                          {brands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Model {device.brand && modelSuggestions[index]?.length > 0 && (
                            <span className="text-blue-600 text-xs">
                              ({modelSuggestions[index].length} dostępnych)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={device.model}
                          onChange={(e) => {
                            updateDevice(index, 'model', e.target.value);
                            // Pokaż sugestie po wpisaniu
                            if (device.brand && e.target.value) {
                              setShowModelSuggestions(index);
                            }
                          }}
                          onFocus={() => {
                            if (device.brand) {
                              setShowModelSuggestions(index);
                            }
                          }}
                          onBlur={() => {
                            // Delay aby kliknięcie w dropdown zdążyło się wykonać
                            setTimeout(() => setShowModelSuggestions(null), 200);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder={device.brand ? "Wpisz lub wybierz..." : "Najpierw wybierz markę"}
                          disabled={!device.brand}
                        />
                        
                        {/* Dropdown z sugestiami */}
                        {showModelSuggestions === index && device.brand && (
                          <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                            {loadingModels ? (
                              <div className="px-3 py-3 text-sm text-gray-500 text-center">
                                ⏳ Ładowanie modeli...
                              </div>
                            ) : getFilteredModels(index, device.model).length > 0 ? (
                              <>
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 font-medium">
                                  💡 Modele z bazy danych
                                </div>
                                {getFilteredModels(index, device.model).map((model, mIdx) => (
                                  <button
                                    key={mIdx}
                                    type="button"
                                    onClick={() => handleModelSelect(index, model)}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                                  >
                                    <div className="font-medium text-gray-900">{model.model}</div>
                                    {model.name && (
                                      <div className="text-xs text-gray-500 mt-0.5">{model.name}</div>
                                    )}
                                    {model.type && (
                                      <div className="text-xs text-blue-600 mt-0.5">{model.type}</div>
                                    )}
                                  </button>
                                ))}
                              </>
                            ) : (
                              <div className="px-3 py-3 text-sm text-gray-500">
                                {device.model ? (
                                  <>
                                    🔍 Brak dopasowań w bazie.
                                    <div className="text-xs mt-1">Możesz wpisać własny model.</div>
                                  </>
                                ) : (
                                  <>
                                    📝 {modelSuggestions[index]?.length || 0} modeli dla marki {device.brand}
                                    <div className="text-xs mt-1">Zacznij wpisywać, aby filtrować...</div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Numer seryjny
                        </label>
                        <input
                          type="text"
                          value={device.serialNumber}
                          onChange={(e) => updateDevice(index, 'serialNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="S/N"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Opis problemu
                        </label>
                        <textarea
                          value={device.problem}
                          onChange={(e) => updateDevice(index, 'problem', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Opisz problem z tym urządzeniem..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="flex items-center space-x-2 cursor-pointer p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={device.hasBuiltIn || false}
                            onChange={(e) => updateDevice(index, 'hasBuiltIn', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            🔧 Urządzenie w zabudowie (wbudowane w meble)
                          </span>
                        </label>
                        {device.hasBuiltIn && (
                          <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                            ⚠️ <strong>Zabudowa:</strong> Urządzenie wymaga demontażu i montażu. Może wydłużyć czas wizyty.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.device && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1 h-3 w-3" />
                  {errors.device}
                </p>
              )}
            </div>

            {/* Szczegóły wizyty */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiCalendar className="mr-2 h-5 w-5 text-blue-600" />
                Szczegóły wizyty
              </h2>
              
              {/* Wizualny kalendarz */}
              <div className="md:col-span-2">
                <DateRangePicker
                  mode={formData.dateMode}
                  onModeChange={(mode) => {
                    setFormData(prev => ({
                      ...prev,
                      dateMode: mode,
                      date: mode === 'range' ? '' : prev.date,
                      dateRange: mode === 'single' ? { from: '', to: '' } : prev.dateRange
                    }));
                    setErrors(prev => ({ ...prev, date: null }));
                  }}
                  selectedDate={formData.date}
                  selectedRange={formData.dateRange}
                  onDateChange={(date) => {
                    setFormData(prev => ({ ...prev, date }));
                    setErrors(prev => ({ ...prev, date: null }));
                  }}
                  onRangeChange={(range) => {
                    setFormData(prev => ({ ...prev, dateRange: range }));
                    setErrors(prev => ({ ...prev, date: null }));
                  }}
                  minDate={new Date()}
                />
                {errors.date && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1 h-3 w-3" />
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Preferowana godzina */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferowana godzina (opcjonalnie)
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.dateMode === 'range'
                    ? 'Preferowana godzina dla każdego dnia z zakresu'
                    : 'Określ preferowaną godzinę wizyty'}
                </p>
              </div>
            </div>

            {/* Dostępność fizyczna klienta */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiHome className="mr-2 h-5 w-5 text-green-600" />
                  Dostępność fizyczna klienta
                  <span className="ml-2 text-sm font-normal text-gray-500">(opcjonalnie)</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAdvancedAvailability(!showAdvancedAvailability)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    showAdvancedAvailability 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showAdvancedAvailability ? '✓ Zaawansowane' : '+ Dodaj szczegółową dostępność'}
                </button>
              </div>

              {!showAdvancedAvailability && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiHome className="text-blue-600 mt-0.5" size={20} />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">
                        💡 Dlaczego warto?
                      </p>
                      <p className="text-blue-800 mb-2">
                        Określ dokładnie, kiedy klient jest w domu. System automatycznie:
                      </p>
                      <ul className="text-blue-800 space-y-1 ml-4">
                        <li>• Obliczy score dostępności (0-100)</li>
                        <li>• Ostrzeże technika przed wizytą w złych godzinach</li>
                        <li>• Zaproponuje najlepsze terminy wizyt</li>
                        <li>• Pomoże uniknąć pustych przejazdów</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {showAdvancedAvailability && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Określ szczegółowo, w jakich godzinach klient jest dostępny w domu.
                    System automatycznie obliczy score dostępności i pomoże w planowaniu wizyt.
                  </p>
                  
                  <AvailabilityScheduler
                    value={formData.physicalAvailability}
                    onChange={(availability) => {
                      setFormData({ ...formData, physicalAvailability: availability });
                    }}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Status rezerwacji</h3>
              
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {bookingStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview - Data wizyty */}
            {(formData.date || (formData.dateRange.from && formData.dateRange.to)) && (
              <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                <div className="flex items-start">
                  <FiCalendar className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      {formData.dateMode === 'range' ? '📅 Elastyczny termin' : '📆 Termin wizyty'}
                    </h4>
                    
                    {formData.dateMode === 'range' ? (
                      <div className="space-y-1 text-sm">
                        <div className="text-gray-900 font-medium">
                          {new Date(formData.dateRange.from + 'T00:00:00').toLocaleDateString('pl-PL', { 
                            day: 'numeric', 
                            month: 'long',
                            year: 'numeric'
                          })}
                          <span className="mx-1 text-gray-500">→</span>
                          {new Date(formData.dateRange.to + 'T00:00:00').toLocaleDateString('pl-PL', { 
                            day: 'numeric', 
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-600">
                          Klient elastyczny ({Math.ceil((new Date(formData.dateRange.to) - new Date(formData.dateRange.from)) / (1000 * 60 * 60 * 24)) + 1} dni do wyboru)
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900 font-medium">
                        {new Date(formData.date + 'T00:00:00').toLocaleDateString('pl-PL', { 
                          weekday: 'long',
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                    
                    {formData.time && (
                      <div className="mt-2 text-sm text-gray-700">
                        🕐 Godzina: <span className="font-medium">{formData.time}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-start">
                <FiFileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Informacja
                  </h4>
                  <p className="text-sm text-gray-600">
                    Po zapisaniu zmian zostanie zaktualizowana rezerwacja #{id}
                  </p>
                  {formData.physicalAvailability && (
                    <p className="mt-2 text-sm text-green-700 font-medium">
                      🏠 Dostępność z score: {formData.physicalAvailability.score}/100
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={saving || loading}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <FiSave className="mr-2 h-4 w-4" />
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push(`/admin/rezerwacje/${id}`)}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Anuluj
              </button>
            </div>
          </div>

        </div>
      </form>
    </AdminLayout>
  );
}
