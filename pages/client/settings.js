// pages/client/settings.js
// 🔧 USTAWIENIA KONTA KLIENTA - z dodawaniem dodatkowych adresów i numerów

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ClientLayout from '../../components/ClientLayout';
import AvailabilityScheduler from '../../components/AvailabilityScheduler';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiPlus, FiTrash2, 
  FiAlertCircle, FiCheckCircle, FiHome, FiX, FiEdit2
} from 'react-icons/fi';

export default function ClientSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // Client data
  const [clientData, setClientData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    // Dodatkowe numery telefonu
    additionalPhones: [],
    // Dodatkowe adresy
    additionalAddresses: [],
    // Dostępność fizyczna
    physicalAvailability: null
  });

  // New phone/address forms
  const [newPhone, setNewPhone] = useState({ number: '', label: '', isPrimary: false });
  const [newAddress, setNewAddress] = useState({ 
    street: '', 
    city: '', 
    postalCode: '', 
    label: '', 
    isPrimary: false 
  });

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      // Get client ID from localStorage
      const clientId = localStorage.getItem('clientId');
      if (!clientId) {
        router.push('/client/login');
        return;
      }

      const response = await fetch(`/api/clients?id=${clientId}`);
      const data = await response.json();

      console.log('📞 Client data:', data);

      if (response.ok && data && data.id) {
        setClientData({
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          additionalPhones: data.additionalPhones || [],
          additionalAddresses: data.additionalAddresses || []
        });
      } else {
        setError('Nie znaleziono danych klienta');
      }
    } catch (error) {
      console.error('❌ Error loading client:', error);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!clientData.name || !clientData.phone) {
      setError('Imię/nazwisko i telefon są wymagane');
      return;
    }

    try {
      setSaving(true);
      setError('');

      console.log('💾 Saving client data:', clientData);

      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });

      const result = await response.json();
      console.log('📞 API response:', result);

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Refresh data
        await loadClientData();
      } else {
        setError(result.message || 'Błąd podczas zapisywania');
      }
    } catch (error) {
      console.error('❌ Error saving:', error);
      setError('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  // Add additional phone
  const handleAddPhone = () => {
    if (!newPhone.number) {
      setError('Podaj numer telefonu');
      return;
    }

    const phoneEntry = {
      id: Date.now().toString(),
      number: newPhone.number,
      label: newPhone.label || 'Dodatkowy',
      isPrimary: newPhone.isPrimary,
      addedAt: new Date().toISOString()
    };

    setClientData({
      ...clientData,
      additionalPhones: [...clientData.additionalPhones, phoneEntry]
    });

    setNewPhone({ number: '', label: '', isPrimary: false });
    setError('');
  };

  // Remove phone
  const handleRemovePhone = (phoneId) => {
    setClientData({
      ...clientData,
      additionalPhones: clientData.additionalPhones.filter(p => p.id !== phoneId)
    });
  };

  // Add additional address
  const handleAddAddress = () => {
    if (!newAddress.street || !newAddress.city) {
      setError('Podaj ulicę i miasto');
      return;
    }

    const addressEntry = {
      id: Date.now().toString(),
      street: newAddress.street,
      city: newAddress.city,
      postalCode: newAddress.postalCode,
      label: newAddress.label || 'Dodatkowy',
      isPrimary: newAddress.isPrimary,
      fullAddress: `${newAddress.street}, ${newAddress.postalCode} ${newAddress.city}`,
      addedAt: new Date().toISOString()
    };

    setClientData({
      ...clientData,
      additionalAddresses: [...clientData.additionalAddresses, addressEntry]
    });

    setNewAddress({ street: '', city: '', postalCode: '', label: '', isPrimary: false });
    setError('');
  };

  // Remove address
  const handleRemoveAddress = (addressId) => {
    setClientData({
      ...clientData,
      additionalAddresses: clientData.additionalAddresses.filter(a => a.id !== addressId)
    });
  };

  // Set as primary phone
  const setPhoneAsPrimary = (phoneId) => {
    const phone = clientData.additionalPhones.find(p => p.id === phoneId);
    if (phone) {
      // Swap with main phone
      setClientData({
        ...clientData,
        phone: phone.number,
        additionalPhones: clientData.additionalPhones.map(p => 
          p.id === phoneId ? { ...p, isPrimary: true } : { ...p, isPrimary: false }
        )
      });
    }
  };

  // Set as primary address
  const setAddressAsPrimary = (addressId) => {
    const address = clientData.additionalAddresses.find(a => a.id === addressId);
    if (address) {
      // Swap with main address
      setClientData({
        ...clientData,
        address: address.fullAddress,
        additionalAddresses: clientData.additionalAddresses.map(a => 
          a.id === addressId ? { ...a, isPrimary: true } : { ...a, isPrimary: false }
        )
      });
    }
  };

  const tabs = [
    { id: 'basic', label: 'Podstawowe dane', icon: FiUser },
    { id: 'phones', label: 'Numery telefonu', icon: FiPhone },
    { id: 'addresses', label: 'Adresy', icon: FiMapPin },
    { id: 'availability', label: 'Dostępność', icon: FiHome }
  ];

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiUser className="text-blue-600" />
            Ustawienia konta
          </h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj swoimi danymi kontaktowymi
          </p>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <FiCheckCircle className="text-green-600" />
            <span className="text-green-800">Dane zostały zapisane pomyślnie</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <FiAlertCircle className="text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    ${activeTab === tab.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Basic Data Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imię i nazwisko *
                  </label>
                  <input
                    type="text"
                    value={clientData.name}
                    onChange={(e) => setClientData({...clientData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jan Kowalski"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({...clientData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="jan@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon główny *
                  </label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123-456-789"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    To jest Twój główny numer kontaktowy
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres główny
                  </label>
                  <input
                    type="text"
                    value={clientData.address}
                    onChange={(e) => setClientData({...clientData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ul. Przykładowa 123, 00-000 Warszawa"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    To jest Twój główny adres
                  </p>
                </div>
              </div>
            )}

            {/* Additional Phones Tab */}
            {activeTab === 'phones' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Główny numer telefonu
                  </h3>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <FiPhone className="text-blue-600" size={20} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{clientData.phone}</div>
                      <div className="text-sm text-gray-600">Główny</div>
                    </div>
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                      Podstawowy
                    </span>
                  </div>
                </div>

                {/* Additional phones list */}
                {clientData.additionalPhones.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Dodatkowe numery ({clientData.additionalPhones.length})
                    </h3>
                    <div className="space-y-2">
                      {clientData.additionalPhones.map((phone) => (
                        <div 
                          key={phone.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <FiPhone className="text-gray-600" size={20} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{phone.number}</div>
                            <div className="text-sm text-gray-600">{phone.label}</div>
                          </div>
                          <button
                            onClick={() => setPhoneAsPrimary(phone.id)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Ustaw jako główny
                          </button>
                          <button
                            onClick={() => handleRemovePhone(phone.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add new phone */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiPlus className="text-green-600" />
                    Dodaj nowy numer
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numer telefonu *
                      </label>
                      <input
                        type="tel"
                        value={newPhone.number}
                        onChange={(e) => setNewPhone({...newPhone, number: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="123-456-789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Etykieta (opcjonalnie)
                      </label>
                      <input
                        type="text"
                        value={newPhone.label}
                        onChange={(e) => setNewPhone({...newPhone, label: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="np. Telefon służbowy, Komórkowy"
                      />
                    </div>
                    <button
                      onClick={handleAddPhone}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FiPlus size={18} />
                      Dodaj numer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Główny adres
                  </h3>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <FiHome className="text-blue-600" size={20} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {clientData.address || 'Nie podano'}
                      </div>
                      <div className="text-sm text-gray-600">Główny adres</div>
                    </div>
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                      Podstawowy
                    </span>
                  </div>
                </div>

                {/* Additional addresses list */}
                {clientData.additionalAddresses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Dodatkowe adresy ({clientData.additionalAddresses.length})
                    </h3>
                    <div className="space-y-2">
                      {clientData.additionalAddresses.map((address) => (
                        <div 
                          key={address.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <FiMapPin className="text-gray-600" size={20} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{address.fullAddress}</div>
                            <div className="text-sm text-gray-600">{address.label}</div>
                          </div>
                          <button
                            onClick={() => setAddressAsPrimary(address.id)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Ustaw jako główny
                          </button>
                          <button
                            onClick={() => handleRemoveAddress(address.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add new address */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiPlus className="text-green-600" />
                    Dodaj nowy adres
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ulica i numer *
                      </label>
                      <input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="ul. Przykładowa 123"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kod pocztowy
                        </label>
                        <input
                          type="text"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="00-000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Miasto *
                        </label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Warszawa"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Etykieta (opcjonalnie)
                      </label>
                      <input
                        type="text"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="np. Biuro, Dom letniskowy, Praca"
                      />
                    </div>
                    <button
                      onClick={handleAddAddress}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FiPlus size={18} />
                      Dodaj adres
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <FiHome className="text-green-600 mt-1" size={24} />
                  <div>
                    <h3 className="font-medium text-green-900 mb-1">
                      Kiedy jesteś w domu?
                    </h3>
                    <p className="text-sm text-green-700">
                      Określ swoje godziny dostępności, aby technik mógł zaplanować wizytę w najlepszym dla Ciebie terminie.
                      System automatycznie podpowie najlepsze okna czasowe i ostrzeże technika, jeśli będzie planował wizytę w złych godzinach.
                    </p>
                  </div>
                </div>

                <AvailabilityScheduler
                  value={clientData.physicalAvailability}
                  onChange={(availability) => {
                    setClientData({
                      ...clientData,
                      physicalAvailability: availability
                    });
                  }}
                />

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-blue-600 mt-0.5" size={20} />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">💡 Dlaczego to ważne?</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-800">
                        <li>Oszczędzasz czas - technik przychodzi, gdy jesteś w domu</li>
                        <li>Unikamy pustych przejazdów i dodatkowych kosztów</li>
                        <li>System automatycznie sugeruje najlepsze terminy</li>
                        <li>Twój score dostępności pomaga w efektywnym planowaniu tras</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push('/client/dashboard')}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Zapisywanie...
              </>
            ) : (
              <>
                <FiSave size={18} />
                Zapisz zmiany
              </>
            )}
          </button>
        </div>

        {/* Info box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-blue-600 mt-0.5" size={20} />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Wskazówki:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Możesz dodać wiele numerów telefonu i adresów</li>
                <li>Każdy dodatkowy numer/adres może mieć własną etykietę (np. "Praca", "Dom")</li>
                <li>Możesz zmienić numer/adres główny klikając "Ustaw jako główny"</li>
                <li>Dane są zapisywane po kliknięciu "Zapisz zmiany"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
