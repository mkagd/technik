// pages/admin/settings/maps-geo.js
// Panel administracyjny - Ustawienia Map i Geokodowania

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MapsGeoSettings() {
  const router = useRouter();
  
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch('/api/admin/settings/maps-geo');
      const data = await res.json();
      
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('❌ Błąd ładowania konfiguracji:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats/geo-usage');
      const data = await res.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('❌ Błąd ładowania statystyk:', error);
    }
  }

  async function saveConfig() {
    setSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/admin/settings/maps-geo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '✅ Konfiguracja zapisana pomyślnie' });
        loadStats(); // Odśwież statystyki
      } else {
        setMessage({ type: 'error', text: `❌ Błąd: ${data.message}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Błąd zapisu: ${error.message}` });
    } finally {
      setSaving(false);
    }
  }

  async function testProvider(provider) {
    setTestingProvider(provider);
    setTestResults({ ...testResults, [provider]: null });
    
    try {
      const res = await fetch('/api/admin/test-geo-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config })
      });
      
      const result = await res.json();
      setTestResults({ ...testResults, [provider]: result });
    } catch (error) {
      setTestResults({ 
        ...testResults, 
        [provider]: { success: false, message: error.message } 
      });
    } finally {
      setTestingProvider(null);
    }
  }

  function updateConfig(path, value) {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Ładowanie konfiguracji...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ Nie udało się załadować konfiguracji
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/admin')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Powrót do panelu
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Ustawienia Map i Geokodowania
          </h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj wszystkimi aspektami geolokalizacji i obliczeń odległości
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-400' 
              : 'bg-red-100 text-red-700 border border-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Geokodowanie (dziś)"
              value={stats.todayGeocoding}
              icon="📍"
              color="blue"
            />
            <StatsCard 
              title="Distance Matrix (dziś)"
              value={stats.todayMatrix}
              icon="🗺️"
              color="green"
            />
            <StatsCard 
              title="Cache Hit Rate"
              value={`${stats.cacheHitRate}%`}
              icon="⚡"
              color="purple"
            />
            <StatsCard 
              title="Szacunkowy koszt/mies."
              value={`${stats.monthlyCost} zł`}
              icon="💰"
              color="yellow"
            />
          </div>
        )}

        {/* Geocoding Settings */}
        <Section title="⚙️ Ustawienia Geokodowania">
          <div className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dostawca Geokodowania
              </label>
              <div className="space-y-2">
                <RadioOption
                  name="geocoding-provider"
                  value="google"
                  checked={config.geocoding.provider === 'google'}
                  onChange={() => updateConfig('geocoding.provider', 'google')}
                  label="Google Geocoding API"
                  description="Najwyższa jakość, $5 za 1000 zapytań"
                />
                <RadioOption
                  name="geocoding-provider"
                  value="osm"
                  checked={config.geocoding.provider === 'osm'}
                  onChange={() => updateConfig('geocoding.provider', 'osm')}
                  label="OpenStreetMap Nominatim"
                  description="Darmowy, limit 1 zapytanie/sek"
                />
                <RadioOption
                  name="geocoding-provider"
                  value="hybrid"
                  checked={config.geocoding.provider === 'hybrid'}
                  onChange={() => updateConfig('geocoding.provider', 'hybrid')}
                  label="Hybrydowy (OSM → Google)"
                  description="Najpierw darmowy OSM, potem Google (zalecane)"
                />
              </div>
            </div>

            {/* Geocoding Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tryb Geokodowania
              </label>
              <div className="space-y-2">
                <RadioOption
                  name="geocoding-mode"
                  value="immediate"
                  checked={config.geocoding.mode === 'immediate'}
                  onChange={() => updateConfig('geocoding.mode', 'immediate')}
                  label="Od razu przy dodawaniu"
                  description="Geokoduj natychmiast po utworzeniu klienta/zlecenia"
                />
                <RadioOption
                  name="geocoding-mode"
                  value="on-demand"
                  checked={config.geocoding.mode === 'on-demand'}
                  onChange={() => updateConfig('geocoding.mode', 'on-demand')}
                  label="Na żądanie"
                  description="Geokoduj tylko gdy potrzebne (np. przy wyświetleniu mapy)"
                />
                <RadioOption
                  name="geocoding-mode"
                  value="nightly"
                  checked={config.geocoding.mode === 'nightly'}
                  onChange={() => updateConfig('geocoding.mode', 'nightly')}
                  label="Nocne zadania wsadowe"
                  description="Geokoduj w tle w nocy (zalecane, oszczędne)"
                />
              </div>
            </div>

            {/* Cache Settings */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Cache Geokodowania</h3>
                  <p className="text-sm text-gray-500">Przechowuj wyniki geokodowania</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.geocoding.cacheEnabled}
                    onChange={(e) => updateConfig('geocoding.cacheEnabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {config.geocoding.cacheEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TTL Cache (dni)
                  </label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded px-3 py-2 w-32"
                    value={config.geocoding.cacheTTL}
                    onChange={(e) => updateConfig('geocoding.cacheTTL', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Po tym czasie wyniki będą ponownie geokodowane
                  </p>
                </div>
              )}
            </div>

            {/* Google Geocoding Settings */}
            {(config.geocoding.provider === 'google' || config.geocoding.provider === 'hybrid') && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Google Geocoding API</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Włączony</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.geocoding.googleGeocoding.enabled}
                        onChange={(e) => updateConfig('geocoding.googleGeocoding.enabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Klucz API
                    </label>
                    <input
                      type="password"
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                      value={config.geocoding.googleGeocoding.apiKey || ''}
                      onChange={(e) => updateConfig('geocoding.googleGeocoding.apiKey', e.target.value)}
                      placeholder="Zostaw puste aby użyć z .env.local"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Obecnie: {config.geocoding.googleGeocoding.apiKey ? '🔒 Ustawiony' : '🔑 Z .env.local'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dzienny limit zapytań
                    </label>
                    <input
                      type="number"
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                      value={config.geocoding.googleGeocoding.dailyLimit}
                      onChange={(e) => updateConfig('geocoding.googleGeocoding.dailyLimit', parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                  
                  <button
                    onClick={() => testProvider('google-geocoding')}
                    disabled={testingProvider === 'google-geocoding'}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {testingProvider === 'google-geocoding' ? 'Testowanie...' : 'Test Połączenia'}
                  </button>
                  
                  {testResults['google-geocoding'] && (
                    <TestResult result={testResults['google-geocoding']} />
                  )}
                </div>
              </div>
            )}

            {/* OSM Geocoding Settings */}
            {(config.geocoding.provider === 'osm' || config.geocoding.provider === 'hybrid') && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">OpenStreetMap Nominatim</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Włączony</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.geocoding.osmGeocoding.enabled}
                        onChange={(e) => updateConfig('geocoding.osmGeocoding.enabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opóźnienie między zapytaniami (ms)
                    </label>
                    <input
                      type="number"
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                      value={config.geocoding.osmGeocoding.requestDelay}
                      onChange={(e) => updateConfig('geocoding.osmGeocoding.requestDelay', parseInt(e.target.value))}
                      min="1000"
                      step="100"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Nominatim wymaga minimum 1000ms (1 zapytanie/sek)
                    </p>
                  </div>
                  
                  <button
                    onClick={() => testProvider('osm-geocoding')}
                    disabled={testingProvider === 'osm-geocoding'}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {testingProvider === 'osm-geocoding' ? 'Testowanie...' : 'Test Połączenia'}
                  </button>
                  
                  {testResults['osm-geocoding'] && (
                    <TestResult result={testResults['osm-geocoding']} />
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Distance Matrix Settings */}
        <Section title="🗺️ Ustawienia Distance Matrix">
          <div className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dostawca Obliczeń Odległości
              </label>
              <div className="space-y-2">
                <RadioOption
                  name="matrix-provider"
                  value="osrm"
                  checked={config.distanceMatrix.provider === 'osrm'}
                  onChange={() => updateConfig('distanceMatrix.provider', 'osrm')}
                  label="OSRM (OpenStreetMap)"
                  description="Darmowy routing, dokładne trasy (zalecane)"
                />
                <RadioOption
                  name="matrix-provider"
                  value="google"
                  checked={config.distanceMatrix.provider === 'google'}
                  onChange={() => updateConfig('distanceMatrix.provider', 'google')}
                  label="Google Distance Matrix API"
                  description="Najdokładniejszy, $5 za 1000 zapytań"
                />
                <RadioOption
                  name="matrix-provider"
                  value="haversine"
                  checked={config.distanceMatrix.provider === 'haversine'}
                  onChange={() => updateConfig('distanceMatrix.provider', 'haversine')}
                  label="Haversine (matematyczny)"
                  description="Natychmiastowy, przybliżony (fallback)"
                />
              </div>
            </div>

            {/* Cache Settings */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Cache Odległości</h3>
                  <p className="text-sm text-gray-500">Przechowuj obliczone odległości</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.distanceMatrix.cacheEnabled}
                    onChange={(e) => updateConfig('distanceMatrix.cacheEnabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* OSRM Settings */}
            {(config.distanceMatrix.provider === 'osrm') && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">OSRM Configuration</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Włączony</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.distanceMatrix.osrm.enabled}
                        onChange={(e) => updateConfig('distanceMatrix.osrm.enabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endpoint
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                      value={config.distanceMatrix.osrm.endpoint}
                      onChange={(e) => updateConfig('distanceMatrix.osrm.endpoint', e.target.value)}
                      placeholder="router.project-osrm.org"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Demo: router.project-osrm.org | Własny: localhost:5000
                    </p>
                  </div>
                  
                  <button
                    onClick={() => testProvider('osrm')}
                    disabled={testingProvider === 'osrm'}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {testingProvider === 'osrm' ? 'Testowanie...' : 'Test Połączenia'}
                  </button>
                  
                  {testResults['osrm'] && (
                    <TestResult result={testResults['osrm']} />
                  )}
                </div>
              </div>
            )}

            {/* Google Distance Matrix Settings */}
            {config.distanceMatrix.provider === 'google' && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Google Distance Matrix API</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Włączony</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.distanceMatrix.googleMatrix.enabled}
                        onChange={(e) => updateConfig('distanceMatrix.googleMatrix.enabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Klucz API
                    </label>
                    <input
                      type="password"
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                      value={config.distanceMatrix.googleMatrix.apiKey || ''}
                      onChange={(e) => updateConfig('distanceMatrix.googleMatrix.apiKey', e.target.value)}
                      placeholder="Zostaw puste aby użyć z .env.local"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dzienny limit zapytań
                    </label>
                    <input
                      type="number"
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                      value={config.distanceMatrix.googleMatrix.dailyLimit}
                      onChange={(e) => updateConfig('distanceMatrix.googleMatrix.dailyLimit', parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                  
                  <button
                    onClick={() => testProvider('google-matrix')}
                    disabled={testingProvider === 'google-matrix'}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {testingProvider === 'google-matrix' ? 'Testowanie...' : 'Test Połączenia'}
                  </button>
                  
                  {testResults['google-matrix'] && (
                    <TestResult result={testResults['google-matrix']} />
                  )}
                </div>
              </div>
            )}

            {/* Haversine Settings */}
            {config.distanceMatrix.provider === 'haversine' && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Haversine Configuration</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Włączony</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.distanceMatrix.haversine.enabled}
                        onChange={(e) => updateConfig('distanceMatrix.haversine.enabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mnożnik dla miasta (odległość &lt;15km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                      value={config.distanceMatrix.haversine.cityMultiplier}
                      onChange={(e) => updateConfig('distanceMatrix.haversine.cityMultiplier', parseFloat(e.target.value))}
                      min="1.0"
                      max="2.0"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Zalecane: 1.3 (linia prosta × 1.3 = rzeczywista droga)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mnożnik międzymiastowy (odległość &gt;15km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                      value={config.distanceMatrix.haversine.intercityMultiplier}
                      onChange={(e) => updateConfig('distanceMatrix.haversine.intercityMultiplier', parseFloat(e.target.value))}
                      min="1.0"
                      max="2.0"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Zalecane: 1.5 (drogi międzymiastowe bardziej kręte)
                    </p>
                  </div>
                  
                  <button
                    onClick={() => testProvider('haversine')}
                    disabled={testingProvider === 'haversine'}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    {testingProvider === 'haversine' ? 'Testowanie...' : 'Test Obliczeń'}
                  </button>
                  
                  {testResults['haversine'] && (
                    <TestResult result={testResults['haversine']} />
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Background Jobs */}
        <Section title="🌙 Zadania w Tle">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Włącz zadania nocne</h3>
                <p className="text-sm text-gray-500">Automatyczne geokodowanie w ustalonych godzinach</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.backgroundJobs.enabled}
                  onChange={(e) => updateConfig('backgroundJobs.enabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {config.backgroundJobs.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Godzina rozpoczęcia (24h)
                  </label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded px-3 py-2 w-32"
                    value={config.backgroundJobs.scheduleHour}
                    onChange={(e) => updateConfig('backgroundJobs.scheduleHour', parseInt(e.target.value))}
                    min="0"
                    max="23"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Zadanie wystartuje codziennie o tej godzinie
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wielkość batcha
                  </label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                    value={config.backgroundJobs.batchSize}
                    onChange={(e) => updateConfig('backgroundJobs.batchSize', parseInt(e.target.value))}
                    min="10"
                    max="1000"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ile rekordów przetwarzać jednocześnie
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Tylko brakujące koordynaty</h3>
                    <p className="text-sm text-gray-500">Geokoduj tylko te bez współrzędnych</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={config.backgroundJobs.onlyMissing}
                      onChange={(e) => updateConfig('backgroundJobs.onlyMissing', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </>
            )}
          </div>
        </Section>

        {/* Cost Optimization */}
        <Section title="💰 Optymalizacja Kosztów">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dzienny limit Google Geocoding
              </label>
              <input
                type="number"
                className="border border-gray-300 rounded px-3 py-2 w-full"
                value={config.costOptimization.apiLimits.dailyGoogleGeocoding}
                onChange={(e) => updateConfig('costOptimization.apiLimits.dailyGoogleGeocoding', parseInt(e.target.value))}
                min="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Po przekroczeniu przełącz na darmowe alternatywy
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dzienny limit Google Distance Matrix
              </label>
              <input
                type="number"
                className="border border-gray-300 rounded px-3 py-2 w-full"
                value={config.costOptimization.apiLimits.dailyGoogleMatrix}
                onChange={(e) => updateConfig('costOptimization.apiLimits.dailyGoogleMatrix', parseInt(e.target.value))}
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miesięczny budżet (zł)
              </label>
              <input
                type="number"
                className="border border-gray-300 rounded px-3 py-2 w-full"
                value={config.costOptimization.apiLimits.monthlyBudget}
                onChange={(e) => updateConfig('costOptimization.apiLimits.monthlyBudget', parseInt(e.target.value))}
                min="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Alert gdy szacunkowy koszt przekroczy ten próg
              </p>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Preferuj darmowe API</h3>
                  <p className="text-sm text-gray-500">Użyj Google tylko gdy nie ma alternatywy</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.costOptimization.strategies.preferFreeProviders}
                    onChange={(e) => updateConfig('costOptimization.strategies.preferFreeProviders', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Agresywny caching</h3>
                  <p className="text-sm text-gray-500">Maksymalnie wykorzystuj cache</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.costOptimization.strategies.aggressiveCaching}
                    onChange={(e) => updateConfig('costOptimization.strategies.aggressiveCaching', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </Section>

        {/* Save Button */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Anuluj
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Zapisywanie...' : '💾 Zapisz Konfigurację'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Components

function StatsCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className={`text-4xl ${colorClasses[color]} rounded-full p-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function RadioOption({ name, value, checked, onChange, label, description }) {
  return (
    <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 mr-3"
      />
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </label>
  );
}

function TestResult({ result }) {
  return (
    <div className={`p-4 rounded ${
      result.success 
        ? 'bg-green-100 text-green-800 border border-green-400' 
        : 'bg-red-100 text-red-800 border border-red-400'
    }`}>
      <div className="font-medium">
        {result.success ? '✅ Test zakończony pomyślnie' : '❌ Test nieudany'}
      </div>
      <div className="text-sm mt-1">{result.message}</div>
      {result.responseTime && (
        <div className="text-sm mt-1">Czas odpowiedzi: {result.responseTime}ms</div>
      )}
      {result.error && (
        <div className="text-sm mt-1 font-mono">{result.error}</div>
      )}
    </div>
  );
}
