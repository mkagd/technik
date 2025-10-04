// components/technician/PhotoUploader.js
// 📸 Komponent do uploadowania i zarządzania zdjęciami wizyty

import { useState, useRef } from 'react';
import { FiUpload, FiX, FiImage, FiTrash2, FiDownload, FiMaximize2, FiCamera } from 'react-icons/fi';

export default function PhotoUploader({ visitId, existingPhotos = [], onPhotosUpdate }) {
  const [photos, setPhotos] = useState(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [photoType, setPhotoType] = useState('during');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const PHOTO_TYPES = {
    before: { label: 'Przed pracą', icon: '📷', color: 'blue' },
    during: { label: 'W trakcie', icon: '🔧', color: 'green' },
    after: { label: 'Po pracy', icon: '✅', color: 'purple' },
    problem: { label: 'Problem', icon: '⚠️', color: 'yellow' },
    completion: { label: 'Ukończenie', icon: '🎉', color: 'indigo' },
    part: { label: 'Część', icon: '⚙️', color: 'gray' },
    serial: { label: 'Tabliczka znamionowa', icon: '🔢', color: 'orange' },
    damage: { label: 'Uszkodzenie', icon: '💥', color: 'red' }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFileInput = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Sprawdź czy to zdjęcie
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} nie jest plikiem graficznym`);
        return false;
      }
      // Sprawdź rozmiar (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} jest za duży (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Otwórz modal z opcjami
    setPendingFiles(validFiles);
    setShowUploadModal(true);
    setPhotoType('during');
    setPhotoCaption('');
    setPhotoDescription('');
  };

  const confirmUpload = async () => {
    if (pendingFiles.length === 0) return;

    setUploading(true);
    setShowUploadModal(false);

    try {
      const token = localStorage.getItem('technicianToken');
      const uploadPromises = pendingFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('visitId', visitId);
        formData.append('type', photoType);
        formData.append('caption', photoCaption);
        formData.append('description', photoDescription);

        const response = await fetch('/api/technician/upload-photo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Błąd uploadu: ${file.name}`);
        }

        const data = await response.json();
        return data.photo;
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      const newPhotos = [...photos, ...uploadedPhotos];
      setPhotos(newPhotos);
      
      if (onPhotosUpdate) {
        onPhotosUpdate(newPhotos);
      }

      alert(`Pomyślnie dodano ${uploadedPhotos.length} zdjęć`);
      setPendingFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Wystąpił błąd podczas uploadowania zdjęć');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('Czy na pewno chcesz usunąć to zdjęcie?')) return;

    try {
      const token = localStorage.getItem('technicianToken');
      const response = await fetch(`/api/technician/upload-photo?photoId=${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const newPhotos = photos.filter(p => p.id !== photoId);
        setPhotos(newPhotos);
        
        if (onPhotosUpdate) {
          onPhotosUpdate(newPhotos);
        }

        alert('Zdjęcie zostało usunięte');
      } else {
        throw new Error('Błąd usuwania zdjęcia');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Nie udało się usunąć zdjęcia');
    }
  };

  const handleDownload = (photo) => {
    // Symulacja pobierania - w prawdziwej aplikacji byłby link do pliku
    const link = document.createElement('a');
    link.href = photo.url || photo.path;
    link.download = photo.filename || `photo_${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FiUpload className="w-8 h-8 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {uploading ? 'Uploadowanie...' : 'Dodaj zdjęcia'}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Przeciągnij i upuść pliki tutaj lub użyj przycisku poniżej
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Przycisk "Zrób zdjęcie" - otwiera kamerę na mobile */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiCamera className="w-4 h-4 mr-2" />
              Zrób zdjęcie
            </button>
            
            {/* Przycisk "Wybierz pliki" - otwiera galerię */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiImage className="w-4 h-4 mr-2" />
              Wybierz z galerii
            </button>
          </div>

          {/* Input dla kamery (pojedyncze zdjęcie) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Input dla galerii (wiele plików) */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />

          <p className="text-xs text-gray-500 mt-4">
            📱 Na telefonie: użyj "Zrób zdjęcie" aby otworzyć kamerę<br/>
            Akceptowane formaty: JPG, PNG, GIF, WebP (max 10MB na plik)
          </p>
        </div>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Zdjęcia ({photos.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id || index}
                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              >
                {/* Photo Type Badge */}
                {photo.type && PHOTO_TYPES[photo.type] && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${PHOTO_TYPES[photo.type].color}-100 text-${PHOTO_TYPES[photo.type].color}-800 border border-${PHOTO_TYPES[photo.type].color}-200`}>
                      {PHOTO_TYPES[photo.type].icon} {PHOTO_TYPES[photo.type].label}
                    </span>
                  </div>
                )}

                {/* Image */}
                <img
                  src={photo.url || photo.path || '/placeholder-image.png'}
                  alt={photo.description || `Zdjęcie ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay on hover (desktop) */}
                <div className="hidden sm:flex absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                    {/* View */}
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      title="Podgląd"
                    >
                      <FiMaximize2 className="w-5 h-5 text-gray-700" />
                    </button>

                    {/* Download */}
                    <button
                      onClick={() => handleDownload(photo)}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      title="Pobierz"
                    >
                      <FiDownload className="w-5 h-5 text-gray-700" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                      title="Usuń"
                    >
                      <FiTrash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Mobile buttons - always visible on mobile */}
                <div className="sm:hidden absolute top-2 right-2 flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="p-2 bg-white/90 backdrop-blur rounded-lg active:bg-gray-100 transition-colors shadow-lg"
                    title="Podgląd"
                  >
                    <FiMaximize2 className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="p-2 bg-red-500/90 backdrop-blur rounded-lg active:bg-red-600 transition-colors shadow-lg"
                    title="Usuń"
                  >
                    <FiTrash2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Timestamp */}
                {photo.uploadedAt && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-xs text-white">
                      {new Date(photo.uploadedAt).toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && !uploading && (
        <div className="text-center py-8 text-gray-500">
          <FiImage className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">Brak zdjęć</p>
          <p className="text-xs mt-1">Dodaj pierwsze zdjęcie powyżej</p>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiX className="w-6 h-6 text-gray-900" />
          </button>

          <div className="max-w-6xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.url || selectedPhoto.path}
              alt={selectedPhoto.description || 'Zdjęcie'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />

            {selectedPhoto.description && (
              <div className="mt-4 p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-900">{selectedPhoto.description}</p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center space-x-3">
              <button
                onClick={() => handleDownload(selectedPhoto)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <FiDownload className="w-5 h-5 mr-2" />
                Pobierz
              </button>

              <button
                onClick={() => {
                  handleDelete(selectedPhoto.id);
                  setSelectedPhoto(null);
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
              >
                <FiTrash2 className="w-5 h-5 mr-2" />
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Configuration Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-end sm:items-center justify-center"
          onClick={() => !uploading && setShowUploadModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Dodaj zdjęcia ({pendingFiles.length})
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>

            {/* Photo Type Selector */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Kategoria zdjęcia
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {Object.entries(PHOTO_TYPES).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setPhotoType(type)}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      photoType === type
                        ? `border-${config.color}-500 bg-${config.color}-50`
                        : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{config.icon}</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{config.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tytuł (opcjonalny)
              </label>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="np. Problem z silnikiem"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opis (opcjonalny)
              </label>
              <textarea
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                rows={3}
                placeholder="Szczegółowy opis zdjęcia..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Preview Files */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Wybrane pliki:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {pendingFiles.map((file, idx) => (
                  <li key={idx} className="flex items-center">
                    <FiImage className="w-4 h-4 mr-2 text-gray-400" />
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPendingFiles([]);
                }}
                disabled={uploading}
                className="order-2 sm:order-1 flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
              >
                Anuluj
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploading}
                className="order-1 sm:order-2 flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 inline-flex items-center justify-center font-medium text-base"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload className="w-5 h-5 mr-2" />
                    Dodaj zdjęcia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
