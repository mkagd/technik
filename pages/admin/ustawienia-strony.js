import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { FiSave, FiPhone, FiMail, FiMapPin, FiClock, FiGlobe, FiTrendingUp } from 'react-icons/fi';

export default function SiteSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    // Wczytaj ustawienia po zamontowaniu komponentu
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/site-settings');
      const data = await res.json();
      
      if (data.success) {
        // Zapewnij że wszystkie wymagane pola istnieją
        const validatedSettings = {
          contact: data.settings.contact || { phone: '', email: '', address: '' },
          businessHours: data.settings.businessHours || {
            monday: '8:00 - 18:00',
            tuesday: '8:00 - 18:00',
            wednesday: '8:00 - 18:00',
            thursday: '8:00 - 18:00',
            friday: '8:00 - 18:00',
            saturday: '9:00 - 14:00',
            sunday: 'Zamknięte'
          },
          socialMedia: data.settings.socialMedia || { facebook: '', instagram: '', linkedin: '' },
          seo: data.settings.seo || { title: '', description: '', keywords: '' },
          stats: data.settings.stats || { yearsExperience: '15+', repairsCompleted: '2500+', happyClients: '849+', rating: '4.9' },
          companyName: data.settings.companyName || 'TECHNIK Serwis AGD',
          slogan: data.settings.slogan || 'Profesjonalne naprawy sprzętu AGD',
          lastUpdated: data.settings.lastUpdated
        };
        setSettings(validatedSettings);
      } else {
        alert('Nie udało się wczytać ustawień');
      }
    } catch (error) {
      console.error('Błąd wczytywania ustawień:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Ustawienia zapisane pomyślnie');
        setSettings(data.settings);
      } else {
        alert(data.message || 'Błąd zapisu');
      }
    } catch (error) {
      console.error('Błąd zapisu:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Ładowanie ustawień...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!settings || !settings.businessHours || !settings.socialMedia || !settings.contact || !settings.seo || !settings.stats) {
    return (
      <AdminLayout>
        <div className="text-center text-red-600">
          Błąd wczytywania ustawień - brak wymaganych pól
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ⚙️ Ustawienia strony internetowej
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Zarządzaj danymi kontaktowymi i informacjami wyświetlanymi na stronie głównej
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
          >
            <FiSave />
            {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>

        {/* Kontakt */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiPhone className="text-blue-600" />
            Dane kontaktowe
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Numer telefonu</label>
              <input
                type="tel"
                value={settings.contact.phone}
                onChange={(e) => updateField('contact.phone', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="+48 123 456 789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={settings.contact.email}
                onChange={(e) => updateField('contact.email', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="kontakt@firma.pl"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Adres</label>
              <input
                type="text"
                value={settings.contact.address}
                onChange={(e) => updateField('contact.address', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="ul. Przykładowa 123, 00-000 Miasto"
              />
            </div>
          </div>
        </div>

        {/* Godziny otwarcia */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiClock className="text-blue-600" />
            Godziny otwarcia
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(settings.businessHours).map(([day, hours]) => (
              <div key={day}>
                <label className="block text-sm font-medium mb-2 capitalize">
                  {day === 'monday' && 'Poniedziałek'}
                  {day === 'tuesday' && 'Wtorek'}
                  {day === 'wednesday' && 'Środa'}
                  {day === 'thursday' && 'Czwartek'}
                  {day === 'friday' && 'Piątek'}
                  {day === 'saturday' && 'Sobota'}
                  {day === 'sunday' && 'Niedziela'}
                </label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => updateField(`businessHours.${day}`, e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="8:00 - 18:00"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiGlobe className="text-blue-600" />
            Social Media
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Facebook</label>
              <input
                type="url"
                value={settings.socialMedia.facebook}
                onChange={(e) => updateField('socialMedia.facebook', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="https://facebook.com/twoja-strona"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input
                type="url"
                value={settings.socialMedia.instagram}
                onChange={(e) => updateField('socialMedia.instagram', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="https://instagram.com/twoj-profil"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn</label>
              <input
                type="url"
                value={settings.socialMedia.linkedin}
                onChange={(e) => updateField('socialMedia.linkedin', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="https://linkedin.com/company/firma"
              />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-blue-600" />
            SEO - Meta tagi
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title (tytuł strony)</label>
              <input
                type="text"
                value={settings.seo.title}
                onChange={(e) => updateField('seo.title', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Twoja Firma - Krótki opis"
              />
              <p className="text-xs text-gray-500 mt-1">Długość: {settings.seo.title.length}/60 znaków (optymalna: 50-60)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (opis strony)</label>
              <textarea
                value={settings.seo.description}
                onChange={(e) => updateField('seo.description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Krótki opis działalności..."
              />
              <p className="text-xs text-gray-500 mt-1">Długość: {settings.seo.description.length}/160 znaków (optymalna: 150-160)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Keywords (słowa kluczowe)</label>
              <input
                type="text"
                value={settings.seo.keywords}
                onChange={(e) => updateField('seo.keywords', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="słowo1, słowo2, słowo3"
              />
              <p className="text-xs text-gray-500 mt-1">Rozdziel przecinkami, max 10-15 słów</p>
            </div>
          </div>
        </div>

        {/* Statystyki */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            📊 Statystyki na stronie głównej
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lata doświadczenia</label>
              <input
                type="text"
                value={settings.stats.yearsExperience}
                onChange={(e) => updateField('stats.yearsExperience', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="15+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wykonanych napraw</label>
              <input
                type="text"
                value={settings.stats.repairsCompleted}
                onChange={(e) => updateField('stats.repairsCompleted', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="2500+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Zadowolonych klientów</label>
              <input
                type="text"
                value={settings.stats.happyClients}
                onChange={(e) => updateField('stats.happyClients', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="849+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ocena (rating)</label>
              <input
                type="text"
                value={settings.stats.rating}
                onChange={(e) => updateField('stats.rating', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="4.9"
              />
            </div>
          </div>
        </div>

        {/* Dane firmy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">🏢 Dane firmy</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nazwa firmy</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Nazwa Twojej Firmy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slogan</label>
              <input
                type="text"
                value={settings.slogan}
                onChange={(e) => updateField('slogan', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Krótki slogan opisujący działalność"
              />
            </div>
          </div>
        </div>

        {/* Info o ostatniej aktualizacji */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Ostatnia aktualizacja: {new Date(settings.lastUpdated).toLocaleString('pl-PL')}
        </div>

        {/* Przycisk zapisu na dole */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold text-lg"
          >
            <FiSave />
            {saving ? 'Zapisywanie...' : 'Zapisz wszystkie zmiany'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
