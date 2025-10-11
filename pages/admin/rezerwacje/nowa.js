// pages/admin/rezerwacje/nowa.js
// Formularz dodawania nowej rezerwacji

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import AvailabilityScheduler from '../../../components/AvailabilityScheduler';
import DateRangePicker from '../../../components/DateRangePicker';
import { 
  FiSave, FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, 
  FiCalendar, FiTool, FiFileText, FiAlertCircle, FiPlus, FiTrash2, FiHome
} from 'react-icons/fi';

export default function NowaRezerwacja() {
  const router = useRouter();
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

  // Popularne miasta - szybkie wypełnianie (z API)
  const [popularCities, setPopularCities] = useState([]);
  const [newCityName, setNewCityName] = useState('');
  const [newCityPostal, setNewCityPostal] = useState('');
  const [loadingCities, setLoadingCities] = useState(true);

  // Wczytaj popularne miasta z API
  useEffect(() => {
    fetchPopularCities();
  }, []);

  const fetchPopularCities = async () => {
    try {
      const response = await fetch('/api/popular-cities');
      const data = await response.json();
      if (data.success) {
        setPopularCities(data.cities);
      }
    } catch (error) {
      console.error('Błąd wczytywania miast:', error);
    } finally {
      setLoadingCities(false);
    }
  };

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

  const bookingStatuses = [
    { value: 'pending', label: 'Oczekuje na kontakt' },
    { value: 'contacted', label: 'Skontaktowano się' },
    { value: 'scheduled', label: 'Umówiona wizyta' },
    { value: 'confirmed', label: 'Potwierdzona' }
  ];

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

  // ========== POPULARNE MIASTA ==========
  const fillCityData = (cityName, postalCode, addressIndex = 0) => {
    const updated = [...addresses];
    updated[addressIndex].city = cityName;
    updated[addressIndex].postalCode = postalCode;
    setAddresses(updated);
  };

  const addPopularCity = async () => {
    if (!newCityName.trim() || !newCityPostal.trim()) return;

    try {
      const response = await fetch('/api/popular-cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCityName.trim(),
          postalCode: newCityPostal.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPopularCities(data.cities);
        setNewCityName('');
        setNewCityPostal('');
      } else {
        alert(data.error || 'Nie udało się dodać miasta');
      }
    } catch (error) {
      console.error('Błąd dodawania miasta:', error);
      alert('Błąd połączenia z serwerem');
    }
  };

  const removePopularCity = async (index) => {
    try {
      const response = await fetch(`/api/popular-cities?index=${index}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setPopularCities(data.cities);
      } else {
        alert(data.error || 'Nie udało się usunąć miasta');
      }
    } catch (error) {
      console.error('Błąd usuwania miasta:', error);
      alert('Błąd połączenia z serwerem');
    }
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

        alert(`✅ Dane firmy pobrane z GUS\n\nFirma: ${data.company.name}\nAdres: ${data.company.address}\n${data.company.postalCode} ${data.company.city}`);
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

    // Imię i nazwisko jest OPCJONALNE - zostanie wygenerowane automatycznie jeśli puste
    // if (!formData.name || formData.name.trim().length < 2) {
    //   newErrors.name = 'Imię i nazwisko wymagane (min. 2 znaki)';
    // }

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

      // Auto-generuj nazwę jeśli nie podano
      const finalName = formData.name?.trim() || `Klient #${Date.now().toString().slice(-6)}`;

      // Przygotuj dane do wysłania
      const submitData = {
        ...formData,
        name: finalName, // Użyj wygenerowanej lub podanej nazwy
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

      console.log('📤 Wysyłanie danych:', submitData);

      const response = await fetch('/api/rezerwacje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Rezerwacja utworzona:', result);
        
        // Przekieruj do listy rezerwacji
        router.push('/admin/rezerwacje');
      } else {
        const error = await response.json();
        alert(`Błąd: ${error.message || 'Nie udało się utworzyć rezerwacji'}`);
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout 
      title="Nowa rezerwacja"
      breadcrumbs={[
        { label: 'Rezerwacje', href: '/admin/rezerwacje' },
        { label: 'Nowa rezerwacja' }
      ]}
    >
      {/* Action bar */}
      <div className="mb-4 sm:mb-6 flex justify-between items-center">
        <button
          onClick={() => router.push('/admin/rezerwacje')}
          className="inline-flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Powrót do listy</span>
          <span className="sm:hidden">Powrót</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-2 sm:px-0">
        {/* NOWY LAYOUT: 2 kolumny obok siebie + przycisk na dole */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          
          {/* LEWA KOLUMNA: Dane klienta */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <FiUser className="mr-2 h-4 w-4 text-blue-600" />
              Dane klienta
            </h2>

              {/* Wybór: Prywatny / Firma */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Typ klienta *
                </label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
                        💡 Kliknij "Pobierz z GUS" aby automatycznie wypełnić dane firmy z bazy Ministerstwa Finansów
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
                {/* Telefony - wiele numerów - NAJPIERW */}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 sm:col-span-2"
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

                  {/* Popularne miasta - szybkie wypełnianie */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Szybkie wypełnianie miasta
                      </label>
                    </div>

                    {/* Kafelki z miastami */}
                    <div className="flex flex-wrap sm:flex-nowrap sm:overflow-x-auto gap-2 mb-3 pb-2">
                      {loadingCities ? (
                        <div className="text-sm text-gray-500 py-2">
                          Ładowanie miast...
                        </div>
                      ) : popularCities.length === 0 ? (
                        <div className="text-sm text-gray-400 py-2">
                          Brak zapisanych miast. Dodaj pierwsze miasto poniżej.
                        </div>
                      ) : (
                        popularCities.map((city, index) => (
                          <div key={index} className="group relative">
                            <button
                              type="button"
                              onClick={() => fillCityData(city.name, city.postalCode, 0)}
                              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-all hover:shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {city.name}
                              <span className="ml-1.5 text-xs text-blue-600 font-mono">{city.postalCode}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removePopularCity(index)}
                              className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs shadow-sm transition-colors"
                              title="Usuń miasto"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Formularz dodawania nowego miasta */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
                      <div>
                        <input
                          type="text"
                          value={newCityName}
                          onChange={(e) => setNewCityName(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Nazwa miasta"
                        />
                      </div>
                      <div className="sm:w-32">
                        <input
                          type="text"
                          value={newCityPostal}
                          onChange={(e) => setNewCityPostal(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                          placeholder="00-000"
                          maxLength="6"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addPopularCity}
                        disabled={!newCityName.trim() || !newCityPostal.trim()}
                        className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FiPlus className="mr-1 h-3.5 w-3.5" />
                        Dodaj
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-gray-500 flex items-start">
                      <svg className="w-3.5 h-3.5 mr-1 mt-0.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Kliknij miasto, aby automatycznie wypełnić kod pocztowy i miejscowość w pierwszym adresie
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Imię i nazwisko - OPCJONALNE */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Imię i nazwisko klienta
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Pole opcjonalne - jeśli pozostawisz puste, zostanie wygenerowany automatyczny identyfikator
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imię i nazwisko <span className="text-gray-400 text-xs">(opcjonalnie)</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="np. Jan Kowalski"
                />
                <p className="mt-2 text-xs text-gray-500 flex items-start">
                  <svg className="w-4 h-4 mr-1 mt-0.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Jeśli nie podasz imienia i nazwiska, system automatycznie wygeneruje identyfikator w formacie: <strong>Klient #XXXXXX</strong></span>
                </p>
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
                  className="text-xs sm:text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center whitespace-nowrap"
                >
                  <FiPlus className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Dodaj urządzenie</span>
                  <span className="sm:hidden">Dodaj</span>
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
                    Po utworzeniu rezerwacji zostanie automatycznie utworzony:
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• Klient w bazie</li>
                    <li>• Zamówienie serwisowe</li>
                    <li>• Powiadomienie email (jeśli skonfigurowane)</li>
                    {formData.physicalAvailability && (
                      <li className="text-green-700 font-medium">
                        • 🏠 Dostępność z score: {formData.physicalAvailability.score}/100
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 sticky bottom-0 sm:relative bg-white sm:bg-transparent pt-4 sm:pt-0 pb-4 sm:pb-0 -mx-2 sm:mx-0 px-2 sm:px-0 border-t sm:border-t-0 border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center px-4 py-3 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base shadow-lg sm:shadow-none"
              >
                <FiSave className="mr-2 h-4 w-4" />
                {saving ? 'Zapisywanie...' : 'Utwórz rezerwację'}
              </button>
            </div>

        </div>
      </form>
    </AdminLayout>
  );
}
