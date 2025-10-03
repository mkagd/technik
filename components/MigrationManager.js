// components/MigrationManager.js
// 🎯 KOMPONENT DO ZARZĄDZANIA MIGRACJĄ ZDJĘĆ
//
// Pozwala użytkownikom na:
// - Sprawdzenie stanu localStorage  
// - Migrację zdjęć na serwer
// - Czyszczenie localStorage

import { useState, useEffect } from 'react';
import { 
  FiUpload, 
  FiCheck, 
  FiX, 
  FiLoader, 
  FiTrash2, 
  FiEye,
  FiDatabase,
  FiHardDrive
} from 'react-icons/fi';

export default function MigrationManager({ isOpen, onClose }) {
  const [localImages, setLocalImages] = useState([]);
  const [migrationStatus, setMigrationStatus] = useState({
    inProgress: false,
    completed: false,
    results: null
  });
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadLocalImages();
      checkSyncStatus();
    }
  }, [isOpen]);

  const loadLocalImages = () => {
    try {
      const existingImages = JSON.parse(localStorage.getItem('scannerImages') || '[]');
      setLocalImages(existingImages);
    } catch (error) {
      console.error('Błąd wczytywania zdjęć:', error);
      setLocalImages([]);
    }
  };

  const checkSyncStatus = () => {
    try {
      const existingImages = JSON.parse(localStorage.getItem('scannerImages') || '[]');
      
      const status = {
        total: existingImages.length,
        syncedToServer: 0,
        localOnly: 0,
        needsMigration: 0
      };
      
      existingImages.forEach(img => {
        if (img.metadata?.savedOnServer) {
          status.syncedToServer++;
        } else {
          status.localOnly++;
          status.needsMigration++;
        }
      });
      
      setSyncStatus(status);
    } catch (error) {
      console.error('Błąd sprawdzania synchronizacji:', error);
      setSyncStatus(null);
    }
  };

  const startMigration = async () => {
    if (localImages.length === 0) {
      alert('Brak zdjęć do migracji');
      return;
    }

    setMigrationStatus({
      inProgress: true,
      completed: false,
      results: null
    });

    try {
      const response = await fetch('/api/migrate-scanner-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: localImages,
          userId: 'MIGRATION_USER'
        })
      });

      const result = await response.json();

      setMigrationStatus({
        inProgress: false,
        completed: true,
        results: result
      });

      if (result.success && result.migrated > 0) {
        // Wyczyść localStorage po udanej migracji
        localStorage.removeItem('scannerImages');
        setLocalImages([]);
        checkSyncStatus();
        
        alert(`✅ Migracja zakończona!\n${result.migrated} zdjęć przeniesiono na serwer.`);
      }

    } catch (error) {
      console.error('Błąd migracji:', error);
      setMigrationStatus({
        inProgress: false,
        completed: false,
        results: null
      });
      alert('❌ Błąd podczas migracji: ' + error.message);
    }
  };

  const clearLocalStorage = () => {
    if (confirm('Czy na pewno chcesz wyczyścić lokalne zdjęcia?\nTa operacja jest nieodwracalna!')) {
      localStorage.removeItem('scannerImages');
      setLocalImages([]);
      checkSyncStatus();
      alert('✅ Lokalne zdjęcia zostały usunięte');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-xl font-bold">
            <FiDatabase className="inline mr-2" />
            Zarządzanie zdjęciami skanera
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          {/* Status synchronizacji */}
          {syncStatus && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <FiHardDrive className="mr-2" />
                Stan synchronizacji
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{syncStatus.total}</div>
                  <div className="text-sm text-gray-600">Razem</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{syncStatus.syncedToServer}</div>
                  <div className="text-sm text-gray-600">Na serwerze</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{syncStatus.localOnly}</div>
                  <div className="text-sm text-gray-600">Tylko lokalnie</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{syncStatus.needsMigration}</div>
                  <div className="text-sm text-gray-600">Do migracji</div>
                </div>
              </div>
            </div>
          )}

          {/* Przyciski akcji */}
          <div className="mb-6 flex flex-wrap gap-4">
            <button
              onClick={startMigration}
              disabled={migrationStatus.inProgress || localImages.length === 0}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {migrationStatus.inProgress ? (
                <>
                  <FiLoader className="h-5 w-5 mr-2 animate-spin" />
                  Migracja w toku...
                </>
              ) : (
                <>
                  <FiUpload className="h-5 w-5 mr-2" />
                  Migruj na serwer ({localImages.length})
                </>
              )}
            </button>

            <button
              onClick={clearLocalStorage}
              disabled={localImages.length === 0}
              className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              <FiTrash2 className="h-5 w-5 mr-2" />
              Wyczyść localStorage
            </button>

            <button
              onClick={() => { loadLocalImages(); checkSyncStatus(); }}
              className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              <FiEye className="h-5 w-5 mr-2" />
              Odśwież
            </button>
          </div>

          {/* Wyniki migracji */}
          {migrationStatus.results && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Wyniki migracji</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{migrationStatus.results.summary?.total || 0}</div>
                  <div className="text-sm text-gray-600">Przetworzone</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{migrationStatus.results.migrated || 0}</div>
                  <div className="text-sm text-gray-600">Sukces</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{migrationStatus.results.errors || 0}</div>
                  <div className="text-sm text-gray-600">Błędy</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{migrationStatus.results.summary?.successRate || '0%'}</div>
                  <div className="text-sm text-gray-600">Skuteczność</div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {migrationStatus.results.message}
              </div>
            </div>
          )}

          {/* Lista lokalnych zdjęć */}
          {localImages.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                Zdjęcia w localStorage ({localImages.length})
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {localImages.map((imageInfo, index) => (
                  <div key={imageInfo.id || index} className="border rounded-lg p-2 bg-gray-50">
                    <img
                      src={imageInfo.imageData}
                      alt={`Local image ${index + 1}`}
                      className="w-full h-20 object-cover rounded mb-2"
                    />
                    <div className="text-xs text-gray-600">
                      <div>ID: {imageInfo.id}</div>
                      <div>Data: {new Date(imageInfo.timestamp).toLocaleDateString()}</div>
                      <div>Źródło: {imageInfo.metadata?.source || 'N/A'}</div>
                      <div className="flex items-center mt-1">
                        {imageInfo.metadata?.savedOnServer ? (
                          <>
                            <FiCheck className="h-3 w-3 text-green-600 mr-1" />
                            <span className="text-green-600">Na serwerze</span>
                          </>
                        ) : (
                          <>
                            <FiX className="h-3 w-3 text-red-600 mr-1" />
                            <span className="text-red-600">Tylko lokalnie</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {localImages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FiDatabase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Brak zdjęć w localStorage</p>
              <p className="text-sm">Wszystkie zdjęcia zostały zmigrowane na serwer lub localStorage jest pusty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}