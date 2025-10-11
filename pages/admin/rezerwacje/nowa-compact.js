// pages/admin/rezerwacje/nowa-compact.js
// NOWY KOMPAKTOWY FORMULARZ - 2 kolumny, wszystko na jednej stronie

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import AvailabilityScheduler from '../../../components/AvailabilityScheduler';
import DateRangePicker from '../../../components/DateRangePicker';
import { 
  FiSave, FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, 
  FiCalendar, FiTool, FiFileText, FiAlertCircle, FiPlus, FiTrash2, FiHome
} from 'react-icons/fi';

export default function NowaRezerwacjaCompact() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    dateRange: { from: '', to: '' },
    dateMode: 'single',
    time: '',
    status: 'pending',
    physicalAvailability: null,
    clientType: 'private'
  });

  const [showAdvancedAvailability, setShowAdvancedAvailability] = useState(false);

  const [companyData, setCompanyData] = useState({
    nip: '', name: '', address: '', city: '', postalCode: '', regon: '', krs: ''
  });
  const [fetchingGUS, setFetchingGUS] = useState(false);

  const [phones, setPhones] = useState([{ number: '', label: 'Główny', isPrimary: true }]);
  const [addresses, setAddresses] = useState([{ street: '', city: '', postalCode: '', label: 'Główny', isPrimary: true }]);
  const [devices, setDevices] = useState([{ category: '', brand: '', model: '', problem: '', serialNumber: '', hasBuiltIn: false }]);

  const [popularCities, setPopularCities] = useState([]);
  const [newCityName, setNewCityName] = useState('');
  const [newCityPostal, setNewCityPostal] = useState('');
  const [loadingCities, setLoadingCities] = useState(true);

  const [modelSuggestions, setModelSuggestions] = useState({});
  const [showModelSuggestions, setShowModelSuggestions] = useState(null);
  const [loadingModels, setLoadingModels] = useState(false);

  const categories = ['Pralki', 'Lodówki', 'Zmywarki', 'Piekarniki', 'Kuchenki', 'Płyty indukcyjne', 'Suszarki', 'Inne'];
  const brands = ['Amica', 'AEG', 'Beko', 'Bosch', 'Candy', 'Electrolux', 'Gorenje', 'Haier', 'Hotpoint', 'Indesit', 'LG', 'Miele', 'Panasonic', 'Samsung', 'Sharp', 'Siemens', 'Whirlpool', 'Zanussi', 'Inne'];
  const bookingStatuses = [
    { value: 'pending', label: 'Oczekuje na kontakt' },
    { value: 'contacted', label: 'Skontaktowano się' },
    { value: 'scheduled', label: 'Umówiona wizyta' },
    { value: 'confirmed', label: 'Potwierdzona' }
  ];

  useEffect(() => {
    fetchPopularCities();
  }, []);

  const fetchPopularCities = async () => {
    try {
      const response = await fetch('/api/popular-cities');
      const data = await response.json();
      if (data.success) setPopularCities(data.cities);
    } catch (error) {
      console.error('Błąd wczytywania miast:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  // TELEFONY
  const addPhone = () => setPhones([...phones, { number: '', label: '', isPrimary: false }]);
  const removePhone = (index) => { if (phones.length > 1) setPhones(phones.filter((_, i) => i !== index)); };
  const updatePhone = (index, field, value) => {
    const updated = [...phones];
    updated[index][field] = value;
    setPhones(updated);
  };

  // ADRESY
  const addAddress = () => setAddresses([...addresses, { street: '', city: '', postalCode: '', label: '', isPrimary: false }]);
  const removeAddress = (index) => { if (addresses.length > 1) setAddresses(addresses.filter((_, i) => i !== index)); };
  const updateAddress = (index, field, value) => {
    const updated = [...addresses];
    updated[index][field] = value;
    setAddresses(updated);
  };

  // MIASTA
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
        body: JSON.stringify({ name: newCityName.trim(), postalCode: newCityPostal.trim() })
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
      const response = await fetch(`/api/popular-cities?index=${index}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) setPopularCities(data.cities);
      else alert(data.error || 'Nie udało się usunąć miasta');
    } catch (error) {
      console.error('Błąd usuwania miasta:', error);
      alert('Błąd połączenia z serwerem');
    }
  };

  // URZĄDZENIA
  const addDevice = () => setDevices([...devices, { category: '', brand: '', model: '', problem: '', serialNumber: '', hasBuiltIn: false }]);
  const removeDevice = (index) => { if (devices.length > 1) setDevices(devices.filter((_, i) => i !== index)); };
  const updateDevice = (index, field, value) => {
    const updated = [...devices];
    updated[index][field] = value;
    setDevices(updated);
    if (field === 'brand' || field === 'category') fetchModels(index);
  };

  // MODELE
  const fetchModels = async (deviceIndex) => {
    const device = devices[deviceIndex];
    if (!device.brand) {
      setModelSuggestions({ ...modelSuggestions, [deviceIndex]: [] });
      return;
    }
    setLoadingModels(true);
    try {
      const params = new URLSearchParams();
      params.append('brand', device.brand);
      if (device.category) params.append('type', device.category);
      const response = await fetch(`/api/device-models?${params.toString()}`);
      const data = await response.json();
      if (data.success && data.models) {
        setModelSuggestions({ ...modelSuggestions, [deviceIndex]: data.models });
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
    if (!searchTerm) return suggestions.slice(0, 10);
    const search = searchTerm.toLowerCase();
    return suggestions.filter(m => 
      m.model?.toLowerCase().includes(search) || m.name?.toLowerCase().includes(search)
    ).slice(0, 10);
  };

  const handleModelSelect = (deviceIndex, model) => {
    const updated = [...devices];
    updated[deviceIndex].model = model.model;
    if (model.serialNumber) updated[deviceIndex].serialNumber = model.serialNumber;
    setDevices(updated);
    setShowModelSuggestions(null);
  };

  // GUS API
  const fetchCompanyFromGUS = async () => {
    if (!companyData.nip || companyData.nip.length < 10) {
      alert('❌ Podaj poprawny NIP (10 cyfr)');
      return;
    }
    setFetchingGUS(true);
    try {
      const response = await fetch(`/api/gus?nip=${companyData.nip}`);
      const data = await response.json();
      if (data.success && data.company) {
        setCompanyData({
          ...companyData,
          name: data.company.name || '',
          address: data.company.address || '',
          city: data.company.city || '',
          postalCode: data.company.postalCode || '',
          regon: data.company.regon || '',
          krs: data.company.krs || ''
        });
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
    const primaryPhone = phones.find(p => p.isPrimary);
    if (!primaryPhone || !primaryPhone.number || primaryPhone.number.trim().length < 9) {
      newErrors.phone = 'Główny telefon wymagany (min. 9 cyfr)';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }
    const primaryAddress = addresses.find(a => a.isPrimary);
    if (!primaryAddress || !primaryAddress.city || !primaryAddress.street) {
      newErrors.address = 'Główny adres wymagany (miasto i ulica)';
    }
    const hasValidDevice = devices.some(d => d.category);
    if (!hasValidDevice) {
      newErrors.device = 'Przynajmniej jedno urządzenie wymagane';
    }
    if (formData.dateMode === 'range') {
      if (!formData.dateRange.from) newErrors.date = 'Data początkowa wymagana';
      if (!formData.dateRange.to) newErrors.date = 'Data końcowa wymagana';
    } else {
      if (!formData.date) newErrors.date = 'Data wizyty wymagana';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const primaryPhone = phones.find(p => p.isPrimary) || phones[0];
      const primaryAddress = addresses.find(a => a.isPrimary) || addresses[0];
      const primaryDevice = devices[0];
      const finalName = formData.name?.trim() || `Klient #${Date.now().toString().slice(-6)}`;

      const submitData = {
        ...formData,
        name: finalName,
        phone: primaryPhone.number,
        city: primaryAddress.city,
        street: primaryAddress.street,
        fullAddress: `${primaryAddress.street}, ${primaryAddress.postalCode || ''} ${primaryAddress.city}`.trim(),
        category: primaryDevice.category,
        device: primaryDevice.model || primaryDevice.brand || primaryDevice.category,
        problem: primaryDevice.problem || 'Brak opisu problemu',
        phones: phones.filter(p => p.number),
        addresses: addresses.filter(a => a.street && a.city),
        devices: devices.filter(d => d.category),
        physicalAvailability: formData.physicalAvailability,
        isFlexibleDate: formData.dateMode === 'range',
        dateRange: formData.dateMode === 'range' ? {
          from: formData.dateRange.from,
          to: formData.dateRange.to,
          flexible: true
        } : null,
        clientType: formData.clientType,
        companyData: formData.clientType === 'company' ? companyData : null,
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
    <AdminLayout title="Nowa rezerwacja" breadcrumbs={[
      { label: 'Rezerwacje', href: '/admin/rezerwacje' },
      { label: 'Nowa rezerwacja' }
    ]}>
      <div className="mb-4 flex justify-between items-center">
        <button onClick={() => router.push('/admin/rezerwacje')} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Powrót do listy
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* GŁÓWNY LAYOUT: 2 KOLUMNY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* ============= LEWA KOLUMNA: DANE KLIENTA ============= */}
          <div className="space-y-4">
            
            {/* Typ klienta */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <FiUser className="mr-2 h-4 w-4 text-blue-600" />
                Dane klienta
              </h2>

              <div className="flex gap-2 mb-4">
                <label className={`flex-1 flex items-center justify-center px-3 py-2 border-2 rounded-lg cursor-pointer text-sm ${
                  formData.clientType === 'private' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                }`}>
                  <input type="radio" name="clientType" value="private" checked={formData.clientType === 'private'} 
                    onChange={(e) => handleChange('clientType', e.target.value)} className="sr-only" />
                  <span className="mr-1">👤</span> Prywatny
                </label>
                <label className={`flex-1 flex items-center justify-center px-3 py-2 border-2 rounded-lg cursor-pointer text-sm ${
                  formData.clientType === 'company' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-300'
                }`}>
                  <input type="radio" name="clientType" value="company" checked={formData.clientType === 'company'} 
                    onChange={(e) => handleChange('clientType', e.target.value)} className="sr-only" />
                  <span className="mr-1">🏢</span> Firma
                </label>
              </div>

              {/* Dane firmy */}
              {formData.clientType === 'company' && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="text-xs font-semibold text-purple-900 mb-2">🏢 Dane firmowe</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" value={companyData.nip} 
                        onChange={(e) => setCompanyData({ ...companyData, nip: e.target.value.replace(/\D/g, '') })}
                        maxLength="10" className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg" placeholder="NIP (10 cyfr)" />
                      <button type="button" onClick={fetchCompanyFromGUS} disabled={fetchingGUS || !companyData.nip || companyData.nip.length < 10}
                        className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap">
                        {fetchingGUS ? '⏳' : '🔍 GUS'}
                      </button>
                    </div>
                    <input type="text" value={companyData.name} onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg" placeholder="Nazwa firmy *" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={companyData.regon} onChange={(e) => setCompanyData({ ...companyData, regon: e.target.value })}
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg" placeholder="REGON" />
                      <input type="text" value={companyData.krs} onChange={(e) => setCompanyData({ ...companyData, krs: e.target.value })}
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg" placeholder="KRS" />
                    </div>
                  </div>
                </div>
              )}

              {/* Telefony - kompakt */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">Telefony *</label>
                  <button type="button" onClick={addPhone} className="text-xs text-blue-600 hover:text-blue-700">
                    <FiPlus className="inline h-3 w-3" /> Dodaj
                  </button>
                </div>
                <div className="space-y-1.5">
                  {phones.map((phone, index) => (
                    <div key={index} className="flex gap-1.5">
                      <input type="tel" value={phone.number} onChange={(e) => updatePhone(index, 'number', e.target.value)}
                        className={`flex-1 px-2 py-1.5 text-sm border rounded-lg ${errors.phone && index === 0 ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="123456789" />
                      <input type="text" value={phone.label} onChange={(e) => updatePhone(index, 'label', e.target.value)}
                        className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-lg" placeholder="Etykieta" />
                      {phones.length > 1 && (
                        <button type="button" onClick={() => removePhone(index)} className="px-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="jan@example.com" />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              {/* Adresy - kompakt */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">Adresy *</label>
                  <button type="button" onClick={addAddress} className="text-xs text-blue-600 hover:text-blue-700">
                    <FiPlus className="inline h-3 w-3" /> Dodaj
                  </button>
                </div>
                <div className="space-y-2">
                  {addresses.map((addr, index) => (
                    <div key={index} className="p-2 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-1.5">
                        <input type="text" value={addr.label} onChange={(e) => updateAddress(index, 'label', e.target.value)}
                          className="text-xs px-2 py-0.5 border border-gray-300 rounded" placeholder="Etykieta" />
                        {addresses.length > 1 && (
                          <button type="button" onClick={() => removeAddress(index)} className="text-red-600 p-0.5 rounded">
                            <FiTrash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <input type="text" value={addr.street} onChange={(e) => updateAddress(index, 'street', e.target.value)}
                          className={`w-full px-2 py-1.5 text-sm border rounded-lg ${errors.address && index === 0 ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Ulica i numer" />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input type="text" value={addr.city} onChange={(e) => updateAddress(index, 'city', e.target.value)}
                            className={`px-2 py-1.5 text-sm border rounded-lg ${errors.address && index === 0 ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Miasto" />
                          <input type="text" value={addr.postalCode} onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg" placeholder="00-000" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>

              {/* Szybkie miasta */}
              <div className="pt-3 border-t border-gray-200">
                <label className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                  <FiMapPin className="w-3 h-3 mr-1 text-blue-500" />
                  Szybkie wypełnianie
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {loadingCities ? (
                    <span className="text-xs text-gray-500">Ładowanie...</span>
                  ) : popularCities.length === 0 ? (
                    <span className="text-xs text-gray-400">Brak miast</span>
                  ) : (
                    popularCities.map((city, index) => (
                      <div key={index} className="group relative">
                        <button type="button" onClick={() => fillCityData(city.name, city.postalCode, 0)}
                          className="inline-flex items-center px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs text-blue-700">
                          {city.name} <span className="ml-1 font-mono text-[10px]">{city.postalCode}</span>
                        </button>
                        <button type="button" onClick={() => removePopularCity(index)}
                          className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 bg-red-500 text-white rounded-full text-[10px] items-center justify-center">×</button>
                      </div>
                    ))
                  )}
                </div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-1.5">
                  <input type="text" value={newCityName} onChange={(e) => setNewCityName(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg" placeholder="Miasto" />
                  <input type="text" value={newCityPostal} onChange={(e) => setNewCityPostal(e.target.value)}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg" placeholder="00-000" maxLength="6" />
                  <button type="button" onClick={addPopularCity} disabled={!newCityName.trim() || !newCityPostal.trim()}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs rounded-lg">
                    <FiPlus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Imię - opcjonalne */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">👨 Imię i nazwisko</h3>
              <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Jan Kowalski (opcjonalnie)" />
              <p className="mt-1 text-xs text-gray-500">💡 Puste = wygeneruje się automatycznie</p>
            </div>

          </div>

          {/* ============= PRAWA KOLUMNA: URZĄDZENIA + WIZYTA ============= */}
          <div className="space-y-4">
            
            {/* Urządzenia - kompakt */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 flex items-center">
                  <FiTool className="mr-2 h-4 w-4 text-blue-600" />
                  Urządzenia
                </h2>
                <button type="button" onClick={addDevice} className="text-xs px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <FiPlus className="inline h-3 w-3 mr-1" /> Dodaj
                </button>
              </div>
              
              <div className="space-y-3">
                {devices.map((device, index) => (
                  <div key={index} className="p-3 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Urządzenie {index + 1}</span>
                      {devices.length > 1 && (
                        <button type="button" onClick={() => removeDevice(index)} className="text-red-600 p-1 rounded-lg">
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select value={device.category} onChange={(e) => updateDevice(index, 'category', e.target.value)}
                        className={`px-2 py-1.5 text-sm border rounded-lg ${errors.device && index === 0 ? 'border-red-500' : 'border-gray-300'}`}>
                        <option value="">Kategoria *</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>

                      <select value={device.brand} onChange={(e) => updateDevice(index, 'brand', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                        <option value="">Marka</option>
                        {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                      </select>

                      <div className="relative col-span-2">
                        <input type="text" value={device.model} 
                          onChange={(e) => {
                            updateDevice(index, 'model', e.target.value);
                            if (device.brand && e.target.value) setShowModelSuggestions(index);
                          }}
                          onFocus={() => { if (device.brand) setShowModelSuggestions(index); }}
                          onBlur={() => setTimeout(() => setShowModelSuggestions(null), 200)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg" 
                          placeholder={device.brand ? "Model (wpisz lub wybierz)" : "Najpierw wybierz markę"}
                          disabled={!device.brand} />
                        
                        {showModelSuggestions === index && device.brand && (
                          <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                            {loadingModels ? (
                              <div className="px-2 py-2 text-xs text-gray-500 text-center">⏳ Ładowanie...</div>
                            ) : getFilteredModels(index, device.model).length > 0 ? (
                              <>
                                <div className="px-2 py-1 bg-gray-50 border-b text-[10px] text-gray-600 font-medium">💡 Modele z bazy</div>
                                {getFilteredModels(index, device.model).map((model, mIdx) => (
                                  <button key={mIdx} type="button" onClick={() => handleModelSelect(index, model)}
                                    className="w-full text-left px-2 py-1.5 hover:bg-blue-50 text-xs border-b last:border-b-0">
                                    <div className="font-medium text-gray-900">{model.model}</div>
                                    {model.name && <div className="text-[10px] text-gray-500">{model.name}</div>}
                                  </button>
                                ))}
                              </>
                            ) : (
                              <div className="px-2 py-2 text-xs text-gray-500">🔍 Brak dopasowań</div>
                            )}
                          </div>
                        )}
                      </div>

                      <input type="text" value={device.serialNumber} onChange={(e) => updateDevice(index, 'serialNumber', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg col-span-2" placeholder="Numer seryjny (opcja)" />

                      <textarea value={device.problem} onChange={(e) => updateDevice(index, 'problem', e.target.value)}
                        rows={2} className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg col-span-2"
                        placeholder="Opis problemu..." />

                      <label className="flex items-center space-x-2 cursor-pointer p-2 bg-yellow-50 border border-yellow-200 rounded-lg col-span-2">
                        <input type="checkbox" checked={device.hasBuiltIn || false} 
                          onChange={(e) => updateDevice(index, 'hasBuiltIn', e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded" />
                        <span className="text-xs font-medium">🔧 W zabudowie</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {errors.device && <p className="mt-2 text-xs text-red-600">{errors.device}</p>}
            </div>

            {/* Data wizyty */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <FiCalendar className="mr-2 h-4 w-4 text-blue-600" />
                Wizyta
              </h2>
              
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
              {errors.date && <p className="mt-2 text-xs text-red-600">{errors.date}</p>}

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Preferowana godzina</label>
                <input type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg" />
              </div>
            </div>

            {/* Dostępność */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center">
                  <FiHome className="mr-2 h-4 w-4 text-green-600" />
                  Dostępność klienta
                </h3>
                <button type="button" onClick={() => setShowAdvancedAvailability(!showAdvancedAvailability)}
                  className={`px-2 py-1 rounded text-xs font-medium ${showAdvancedAvailability ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {showAdvancedAvailability ? '✓' : '+'}
                </button>
              </div>

              {!showAdvancedAvailability ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <p className="font-medium mb-1">💡 Określ kiedy klient jest w domu</p>
                  <p>System obliczy score i zaproponuje optymalne terminy wizyt</p>
                </div>
              ) : (
                <AvailabilityScheduler
                  value={formData.physicalAvailability}
                  onChange={(availability) => setFormData({ ...formData, physicalAvailability: availability })}
                />
              )}
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Status rezerwacji</h3>
              <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                {bookingStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            {/* Info */}
            {(formData.date || (formData.dateRange.from && formData.dateRange.to)) && (
              <div className="bg-green-50 rounded-lg border border-green-200 p-3">
                <div className="flex items-start">
                  <FiCalendar className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                  <div className="text-xs">
                    <p className="font-medium text-gray-900 mb-1">
                      {formData.dateMode === 'range' ? '📅 Elastyczny termin' : '📆 Termin'}
                    </p>
                    {formData.dateMode === 'range' ? (
                      <p className="text-gray-700">
                        {new Date(formData.dateRange.from + 'T00:00:00').toLocaleDateString('pl-PL')}
                        {' → '}
                        {new Date(formData.dateRange.to + 'T00:00:00').toLocaleDateString('pl-PL')}
                      </p>
                    ) : (
                      <p className="text-gray-700">
                        {new Date(formData.date + 'T00:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    )}
                    {formData.time && <p className="text-gray-700 mt-1">🕐 {formData.time}</p>}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* PRZYCISK NA DOLE - PEŁNA SZEROKOŚĆ */}
        <div className="mt-4 sticky bottom-0 bg-white border-t border-gray-200 pt-4 pb-4 -mx-4 px-4">
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-lg">
            <FiSave className="mr-2 h-5 w-5" />
            {saving ? 'Zapisywanie...' : '💾 Utwórz rezerwację'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
