// pages/admin/ustawienia/lokalizacja.js
// Panel konfiguracji lokalizacji firmy

import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { getSmartDistanceService } from '../../../distance-matrix/SmartDistanceService';
import GoogleGeocoder from '../../../geocoding/simple/GoogleGeocoder';
import { 
  FiMapPin, FiSave, FiHome, FiNavigation, FiCheckCircle, 
  FiAlertCircle, FiRefreshCw, FiSearch
} from 'react-icons/fi';

export default function CompanyLocationSettings() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  
  const geocoderRef = useRef(null);
  
  const [form, setForm] = useState({
    lat: '',
    lng: '',
    name: '',
    address: ''
  });

  useEffect(() => {
    loadLocation();
    geocoderRef.current = new GoogleGeocoder(); // Nominatim
  }, []);

  const loadLocation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/company-location');
      const data = await response.json();
      
      if (response.ok) {
        setLocation(data);
        setForm({
          lat: data.lat.toString(),
          lng: data.lng.toString(),
          name: data.name || '',
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('❌ Błąd wczytywania lokalizacji:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        alert('Nieprawidłowe współrzędne GPS');
        return;
      }
      
      const response = await fetch('/api/settings/company-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          name: form.name || 'Siedziba firmy',
          address: form.address || `${lat}, ${lng}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocation(data);
        
        // Zaktualizuj SmartDistanceService
        const service = getSmartDistanceService();
        service.setCompanyLocation(lat, lng, form.name);
        
        alert('✅ Lokalizacja zapisana!');
      } else {
        const error = await response.json();
        alert(`❌ Błąd: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Błąd zapisywania:', error);
      alert('❌ Błąd zapisywania lokalizacji');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        alert('Najpierw wprowadź współrzędne');
        return;
      }
      
      const service = getSmartDistanceService();
      
      // Test połączenia
      const connectionTest = await service.testConnection();
      
      // Test kalkulacji (do testowego punktu - Warszawa)
      const testDestination = { lat: 52.2297, lng: 21.0122 };
      const distanceResult = await service.calculateDistance(
        { lat, lng },
        testDestination
      );
      
      setTestResult({
        connection: connectionTest,
        distance: distanceResult,
        success: true
      });
      
    } catch (error) {
      console.error('❌ Błąd testu:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const handleGeocodeAddress = async () => {
    if (!form.address) {
      alert('Wpisz adres do geocodowania');
      return;
    }
    
    try {
      setGeocoding(true);
      console.log('🔍 Geocoding:', form.address);
      
      const result = await geocoderRef.current.geocode(form.address);
      
      if (result.success) {
        console.log('✅ Geocoding sukces:', result.data);
        setForm({
          ...form,
          lat: result.data.lat.toString(),
          lng: result.data.lng.toString(),
          name: form.name || form.address.split(',')[0]
        });
        alert(`✅ Znaleziono: ${result.data.address}`);
      } else {
        alert('❌ Nie znaleziono adresu');
      }
    } catch (error) {
      console.error('❌ Błąd geocodowania:', error);
      alert('❌ Błąd geocodowania');
    } finally {
      setGeocoding(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm({
            ...form,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          });
          alert('✅ Pobrano aktualną lokalizację!');
        },
        (error) => {
          alert('❌ Nie można pobrać lokalizacji');
          console.error(error);
        }
      );
    } else {
      alert('❌ Przeglądarka nie obsługuje geolokalizacji');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Ładowanie...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiMapPin className="mr-3 text-blue-600" />
            Lokalizacja Firmy
          </h1>
          <p className="text-gray-600 mt-2">
            Ustaw lokalizację siedziby firmy do obliczania odległości i czasu dojazdu do klientów
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formularz */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiHome className="mr-2 text-blue-600" />
              Konfiguracja
            </h2>

            <div className="space-y-4">
              {/* Adres + Geocode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres (opcjonalnie)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="np. Rynek Główny 1, Kraków"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleGeocodeAddress}
                    disabled={geocoding || !form.address}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors inline-flex items-center"
                  >
                    {geocoding ? (
                      <>
                        <div className="animate-spin mr-2">⏳</div>
                        Szukam...
                      </>
                    ) : (
                      <>
                        <FiSearch className="mr-2" />
                        Znajdź
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Wpisz adres i kliknij "Znajdź" aby automatycznie pobrać współrzędne
                </p>
              </div>

              {/* Nazwa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa lokalizacji
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="np. Kraków - Centrala"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Szerokość */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Szerokość geograficzna (Latitude)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  placeholder="50.0647"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Długość */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Długość geograficzna (Longitude)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  placeholder="19.9450"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Przyciski akcji */}
              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={handleUseCurrentLocation}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors inline-flex items-center justify-center"
                >
                  <FiNavigation className="mr-2" />
                  Użyj mojej lokalizacji
                </button>

                <button
                  onClick={handleTest}
                  disabled={testing || !form.lat || !form.lng}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors inline-flex items-center justify-center"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin mr-2">⏳</div>
                      Testuję...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="mr-2" />
                      Testuj połączenie
                    </>
                  )}
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving || !form.lat || !form.lng}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors inline-flex items-center justify-center font-medium"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin mr-2">⏳</div>
                      Zapisuję...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      Zapisz lokalizację
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Podgląd i status */}
          <div className="space-y-6">
            {/* Aktualna lokalizacja */}
            {location && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiCheckCircle className="mr-2 text-green-600" />
                  Aktualna Lokalizacja
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Nazwa:</div>
                    <div className="text-lg font-semibold text-gray-900">{location.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Adres:</div>
                    <div className="text-gray-900">{location.address}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Szerokość:</div>
                      <div className="font-mono text-sm text-gray-900">{location.lat}°</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Długość:</div>
                      <div className="font-mono text-sm text-gray-900">{location.lng}°</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Zaktualizowano:</div>
                    <div className="text-sm text-gray-900">
                      {new Date(location.updatedAt).toLocaleString('pl-PL')}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <FiMapPin className="mr-1" />
                    Otwórz w Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Wynik testu */}
            {testResult && (
              <div className={`rounded-lg shadow-sm border p-6 ${
                testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  {testResult.success ? (
                    <>
                      <FiCheckCircle className="mr-2 text-green-600" />
                      <span className="text-green-900">Test Pomyślny</span>
                    </>
                  ) : (
                    <>
                      <FiAlertCircle className="mr-2 text-red-600" />
                      <span className="text-red-900">Test Nieudany</span>
                    </>
                  )}
                </h2>

                {testResult.success ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">OSRM Status:</div>
                      <div className="text-sm text-gray-900">
                        {testResult.connection.osrm.success ? (
                          <span className="text-green-600">✅ {testResult.connection.osrm.message}</span>
                        ) : (
                          <span className="text-red-600">❌ {testResult.connection.osrm.error}</span>
                        )}
                      </div>
                    </div>
                    
                    {testResult.distance && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Test odległości (do Warszawy):</div>
                        <div className="text-sm text-gray-900">
                          📏 {testResult.distance.distance.text} (~{testResult.distance.duration.text})
                        </div>
                      </div>
                    )}
                    
                    {testResult.connection.google?.available && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Google Maps:</div>
                        <div className="text-sm text-gray-900">
                          {testResult.connection.google.success ? (
                            <span className="text-green-600">✅ Dostępny</span>
                          ) : (
                            <span className="text-yellow-600">⚠️ Niedostępny (brak API key)</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
                    {testResult.error}
                  </div>
                )}
              </div>
            )}

            {/* Instrukcja */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Jak znaleźć współrzędne?
              </h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Wpisz adres i kliknij "Znajdź" (najłatwiejszy sposób)</li>
                <li>Lub użyj Google Maps → kliknij prawym na mapie → "Co tu jest?"</li>
                <li>Lub kliknij "Użyj mojej lokalizacji"</li>
                <li>Skopiuj współrzędne i wklej tutaj</li>
                <li>Kliknij "Testuj" aby sprawdzić</li>
                <li>Kliknij "Zapisz" aby zatwierdzić</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
