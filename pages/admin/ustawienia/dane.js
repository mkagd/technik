// pages/admin/ustawienia/dane.js
// Zarządzanie danymi - czyszczenie i eksport

import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useToast } from '../../../contexts/ToastContext';
import { 
  FiTrash2, FiAlertTriangle, FiDatabase, FiDownload, 
  FiPackage, FiShoppingCart, FiUsers, FiClock, FiLock
} from 'react-icons/fi';

export default function DataManagement() {
  const router = useRouter();
  const toast = useToast();
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const dataCategories = [
    {
      id: 'orders',
      title: 'Zamówienia i wizyty',
      description: 'Usuń wszystkie zamówienia serwisowe wraz z wizytami techników',
      icon: FiShoppingCart,
      color: 'red',
      dangerLevel: 'high',
      estimatedCount: '~250 zleceń'
    },
    {
      id: 'part-requests',
      title: 'Zamówienia części z magazynu',
      description: 'Usuń wszystkie zamówienia części składane przez techników',
      icon: FiPackage,
      color: 'orange',
      dangerLevel: 'medium',
      estimatedCount: '~80 zamówień'
    },
    {
      id: 'inventories',
      title: 'Stany magazynowe techników',
      description: 'Wyzeruj wszystkie osobiste magazyny techników',
      icon: FiDatabase,
      color: 'yellow',
      dangerLevel: 'medium',
      estimatedCount: '~12 magazynów'
    },
    {
      id: 'parts',
      title: 'Katalog części magazynu głównego',
      description: 'Usuń wszystkie części z katalogu magazynu (nie wpływa na stany)',
      icon: FiPackage,
      color: 'blue',
      dangerLevel: 'low',
      estimatedCount: '~150 pozycji'
    },
    {
      id: 'reservations',
      title: 'Rezerwacje wizyt',
      description: 'Usuń wszystkie rezerwacje klientów (statusy: pending, contacted)',
      icon: FiClock,
      color: 'purple',
      dangerLevel: 'medium',
      estimatedCount: '~45 rezerwacji'
    },
    {
      id: 'clients',
      title: 'Baza klientów',
      description: 'Usuń wszystkich klientów z systemu',
      icon: FiUsers,
      color: 'pink',
      dangerLevel: 'high',
      estimatedCount: '~320 klientów'
    },
    {
      id: 'audit-logs',
      title: 'Logi audytowe',
      description: 'Usuń historię zmian i logi systemu',
      icon: FiClock,
      color: 'gray',
      dangerLevel: 'low',
      estimatedCount: '~1200 wpisów'
    },
    {
      id: 'notifications',
      title: 'Powiadomienia',
      description: 'Usuń wszystkie powiadomienia systemowe i badge\'y',
      icon: FiAlertTriangle,
      color: 'indigo',
      dangerLevel: 'low',
      estimatedCount: '~50 powiadomień'
    },
    {
      id: 'all-warehouse',
      title: '🏭 Cały magazyn',
      description: 'Usuń zamówienia części + stany magazynowe + katalog części',
      icon: FiDatabase,
      color: 'orange',
      dangerLevel: 'high',
      estimatedCount: 'Kombinacja 3 kategorii'
    },
    {
      id: 'all-data',
      title: '⚠️ WSZYSTKIE DANE',
      description: 'NIEBEZPIECZNE: Usuń wszystko poza pracownikami i ustawieniami',
      icon: FiTrash2,
      color: 'red',
      dangerLevel: 'critical',
      estimatedCount: 'Cały system!'
    }
  ];

  const handleClearData = (category) => {
    setSelectedCategory(category);
    setConfirmPassword('');
    setShowConfirmModal(true);
  };

  const confirmClear = async () => {
    if (!confirmPassword) {
      toast.error('❌ Wprowadź hasło potwierdzenia');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory.id,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`✅ ${data.message}`);
        setShowConfirmModal(false);
        setConfirmPassword('');
        
        // 🔄 Odśwież badge'e w menu po wyczyszczeniu danych
        if (typeof window !== 'undefined' && window.refreshAdminBadges) {
          console.log('🔄 Refreshing admin badges after data clear...');
          setTimeout(() => {
            window.refreshAdminBadges();
          }, 500); // Małe opóźnienie aby API zdążyło zapisać zmiany
        }
      } else {
        toast.error(`❌ ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('❌ Błąd podczas czyszczenia danych');
    } finally {
      setLoading(false);
    }
  };

  const getDangerColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-900 text-white border-red-700';
      case 'high': return 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900 dark:text-red-100';
      case 'medium': return 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100';
      case 'low': return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900 dark:text-blue-100';
      default: return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            ← Powrót
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <FiDatabase className="text-3xl text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Zarządzanie danymi
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Czyszczenie, eksport i zarządzanie danymi systemu
          </p>
        </div>

        {/* Ostrzeżenie */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-red-600 dark:text-red-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                ⚠️ UWAGA: Operacje nieodwracalne!
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                Usunięte dane <strong>nie mogą być odzyskane</strong>. Przed wykonaniem operacji:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                <li>Upewnij się, że masz aktualną kopię zapasową</li>
                <li>Zweryfikuj, które dane chcesz usunąć</li>
                <li>Poinformuj zespół o planowanym czyszczeniu</li>
                <li>Użyj hasła: <code className="bg-red-200 dark:bg-red-800 px-2 py-0.5 rounded">CLEAR_DATA_2025</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Kategorie danych */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataCategories.map(category => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className={`border-2 rounded-lg p-4 ${getDangerColor(category.dangerLevel)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Icon className="text-2xl" />
                    <div>
                      <h3 className="font-semibold text-lg">{category.title}</h3>
                      <p className="text-sm opacity-80">{category.estimatedCount}</p>
                    </div>
                  </div>
                  
                  {category.dangerLevel === 'critical' && (
                    <div className="bg-red-700 text-white text-xs px-2 py-1 rounded font-bold">
                      NIEBEZPIECZNE
                    </div>
                  )}
                </div>

                <p className="text-sm mb-4 opacity-90">
                  {category.description}
                </p>

                <button
                  onClick={() => handleClearData(category)}
                  className="w-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 
                           text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium 
                           transition-colors flex items-center justify-center gap-2"
                >
                  <FiTrash2 />
                  Wyczyść dane
                </button>
              </div>
            );
          })}
        </div>

        {/* Sekcja eksportu (placeholder) */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiDownload className="text-2xl text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Eksport danych
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Eksportuj dane w formacie JSON lub CSV do analizy lub migracji.
          </p>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       transition-colors flex items-center gap-2"
              onClick={() => toast.info('ℹ️ Funkcja eksportu w przygotowaniu')}
            >
              <FiDownload />
              Eksportuj wszystko (JSON)
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 
                       transition-colors flex items-center gap-2"
              onClick={() => toast.info('ℹ️ Funkcja eksportu w przygotowaniu')}
            >
              <FiDownload />
              Eksportuj zamówienia (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Modal potwierdzenia */}
      {showConfirmModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiAlertTriangle className="text-3xl text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Potwierdź usunięcie
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Zamierzasz usunąć:
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                <p className="font-bold text-red-900 dark:text-red-100">
                  {selectedCategory.title}
                </p>
                <p className="text-sm text-red-800 dark:text-red-200">
                  {selectedCategory.description}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mb-4">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  <strong>⚠️ Ta operacja jest nieodwracalna!</strong>
                  <br />
                  Usunięte dane nie mogą być przywrócone.
                </p>
              </div>

              <label className="block mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hasło potwierdzenia:
                </span>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="CLEAR_DATA_2025"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                             rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Wprowadź hasło: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">CLEAR_DATA_2025</code>
                </p>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmPassword('');
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white 
                         rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anuluj
              </button>
              <button
                onClick={confirmClear}
                disabled={loading || !confirmPassword}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Czyszczenie...
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    Usuń dane
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
