import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function AllegroSettings() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [sandbox, setSandbox] = useState(true); // Default to Sandbox for safety
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadCurrentConfig();
    
    // Check for success/error messages from OAuth callback
    if (router.query.success === 'authorized') {
      setMessage({ 
        type: 'success', 
        text: '✅ Pomyślnie połączono z Allegro! Możesz teraz wyszukiwać oferty.' 
      });
      // Clear query params
      router.replace('/admin/allegro/settings', undefined, { shallow: true });
    } else if (router.query.error) {
      const errorMessages = {
        'denied': '❌ Odmówiłeś autoryzacji aplikacji.',
        'invalid_callback': '❌ Nieprawidłowy callback (brak kodu lub state).',
        'token_exchange_failed': '❌ Nie udało się wymienić kodu na token.'
      };
      const errorMsg = errorMessages[router.query.error] || '❌ Wystąpił błąd podczas autoryzacji.';
      setMessage({ type: 'error', text: errorMsg });
      // Clear query params
      router.replace('/admin/allegro/settings', undefined, { shallow: true });
    }
  }, [router.query]);

  const loadCurrentConfig = async () => {
    try {
      const res = await fetch('/api/allegro/config');
      const data = await res.json();
      
      if (data.clientId) {
        setClientId(data.clientId);
        // Don't show secret for security
        setClientSecret('••••••••••••••••');
        setSandbox(data.sandbox !== undefined ? data.sandbox : true);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setMessage({ type: 'error', text: 'Wypełnij Client ID i Client Secret!' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/allegro/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, sandbox }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Konfiguracja zapisana pomyślnie!' });
      } else {
        setMessage({ type: 'error', text: '❌ Błąd zapisu: ' + data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Błąd połączenia: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/allegro/test');
      const data = await res.json();

      setTestResult(data);
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Błąd połączenia: ' + error.message 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/allegro/clear-cache', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '🗑️ Cache wyczyszczony' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd czyszczenia cache' });
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ⚙️ Konfiguracja Allegro API
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Skonfiguruj OAuth 2.0 aby używać prawdziwego Allegro API
              </p>
            </div>
            <DarkModeToggle />
          </div>

          {/* Instructions Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
              📚 Jak uzyskać dane dostępu?
            </h2>
            <ol className="list-decimal ml-5 space-y-2 text-blue-800 dark:text-blue-300 text-sm">
              <li>
                Przejdź na <a 
                  href="https://apps.developer.allegro.pl/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600 dark:hover:text-blue-100"
                >
                  https://apps.developer.allegro.pl/
                </a>
              </li>
              <li>Zaloguj się na swoje konto Allegro</li>
              <li>Kliknij "Utwórz nową aplikację"</li>
              <li>Wybierz typ: <strong>"REST API"</strong></li>
              <li>Podaj nazwę aplikacji (np. "Serwis AGD Manager")</li>
              <li>
                W polu <strong>Redirect URI</strong> wpisz: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">http://localhost:3000</code>
              </li>
              <li>Zatwierdź regulamin i zapisz</li>
              <li>Skopiuj <strong>Client ID</strong> i <strong>Client Secret</strong></li>
              <li>Wklej poniżej i zapisz</li>
            </ol>
          </div>

          {/* Configuration Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔑 Dane OAuth
            </h2>

            <div className="space-y-4">
              {/* Client ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="np. a1b2c3d4e5f6g7h8i9j0..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Client Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ⚠️ Nigdy nie udostępniaj Client Secret publicznie!
                </p>
              </div>

              {/* Sandbox Toggle */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sandbox}
                    onChange={(e) => setSandbox(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white block">
                      🧪 Używaj Sandbox (środowisko testowe)
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Sandbox to bezpieczne środowisko testowe Allegro. Zalecane do nauki i testów!
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💡 Zarejestruj aplikację Sandbox na:{' '}
                      <a 
                        href="https://apps.developer.allegro.pl.allegrosandbox.pl/" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-700"
                      >
                        apps.developer.allegro.pl.allegrosandbox.pl
                      </a>
                    </p>
                  </div>
                </label>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? '💾 Zapisywanie...' : '💾 Zapisz konfigurację'}
                </button>
                
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {testing ? '🔄 Testuję...' : '🧪 Testuj połączenie'}
                </button>
              </div>
              
              {/* Info about public search */}
              {!sandbox && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        Wyszukiwanie wszystkich ofert Allegro
                      </h4>
                      <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                        Używamy endpointu <code className="bg-green-100 dark:bg-green-800 px-2 py-0.5 rounded">/offers/listing</code> 
                        który pozwala przeszukiwać WSZYSTKIE oferty na Allegro.
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                        💡 Jeśli widzisz błąd "VerificationRequired" - Twoja aplikacja wymaga weryfikacji przez Allegro (1-3 dni).
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        📧 Weryfikacja: <a href="https://apps.developer.allegro.pl/" target="_blank" rel="noopener" className="underline">apps.developer.allegro.pl</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Authorization Button */}
              <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                  <span className="text-2xl">🔐</span>
                  Autoryzacja z Allegro
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                  Aby wyszukiwać oferty na Allegro, musisz połączyć swoje konto. 
                  Kliknij przycisk poniżej, aby zalogować się do Allegro i autoryzować aplikację.
                </p>
                <a
                  href="/api/allegro/start?userId=admin-001"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  <span className="text-xl">🔗</span>
                  Połącz z Allegro
                </a>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-3">
                  💡 Po kliknięciu zostaniesz przekierowany na stronę Allegro do zalogowania.
                </p>
              </div>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-6 rounded-lg shadow-lg mb-6 ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-3xl">
                  {testResult.success ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg mb-2 ${
                    testResult.success
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {testResult.success ? 'Test zakończony sukcesem!' : 'Test nieudany'}
                  </h3>
                  <p className={`text-sm ${
                    testResult.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {testResult.message}
                  </p>
                  {testResult.success && (
                    <div className="mt-4">
                      <button
                        onClick={() => router.push('/admin/allegro/search')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        🎉 Przejdź do wyszukiwania →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔧 Zaawansowane
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Cache tokenów OAuth
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Token jest ważny przez 12 godzin i przechowywany lokalnie
                  </p>
                </div>
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  🗑️ Wyczyść cache
                </button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  📊 Status
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Konfiguracja:</strong> {clientId ? '✅ Skonfigurowane' : '❌ Brak'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Tryb:</strong> {clientId ? '🔐 OAuth API' : '🎭 DEMO'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/admin/allegro/search')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Wróć do wyszukiwania
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
