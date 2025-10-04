// components/PhotoUploadZone.js
// Uniwersalny komponent do uploadu zdjęć z drag&drop, preview, multiple files

import { useState, useCallback } from 'react';

export default function PhotoUploadZone({ 
  images = [], 
  onChange, 
  maxImages = 8, 
  onUploadStart,
  onUploadComplete,
  uploadCategory = 'parts',
  disabled = false 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Upload pojedynczego pliku do API
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('category', uploadCategory);
    formData.append('orderId', 'PART_' + Date.now());

    const response = await fetch('/api/upload-photo', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return {
      id: 'IMG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      url: data.filePath,
      type: images.length === 0 ? 'main' : 'detail',
      order: images.length,
      caption: '',
      uploadedAt: new Date().toISOString()
    };
  };

  // Obsługa uploadu wielu plików
  const handleFiles = useCallback(async (files) => {
    if (disabled || uploading) return;
    
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      alert(`Maksymalna liczba zdjęć: ${maxImages}`);
      return;
    }

    setUploading(true);
    if (onUploadStart) onUploadStart();

    try {
      const uploadPromises = filesToUpload.map(async (file, index) => {
        setUploadProgress(prev => ({ ...prev, [index]: 0 }));
        const imageData = await uploadFile(file);
        setUploadProgress(prev => ({ ...prev, [index]: 100 }));
        return imageData;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedImages];
      
      if (onChange) onChange(newImages);
      if (onUploadComplete) onUploadComplete(uploadedImages);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Błąd podczas uploadu zdjęć');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [images, onChange, maxImages, disabled, uploading, uploadCategory, onUploadStart, onUploadComplete]);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // File input handler
  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // Usuwanie zdjęcia
  const removeImage = useCallback((imageId) => {
    const newImages = images.filter(img => img.id !== imageId);
    // Re-index order
    newImages.forEach((img, index) => {
      img.order = index;
      // Pierwsze zdjęcie zawsze main
      img.type = index === 0 ? 'main' : 'detail';
    });
    if (onChange) onChange(newImages);
  }, [images, onChange]);

  // Zmiana kolejności (move up)
  const moveImageUp = useCallback((imageId) => {
    const index = images.findIndex(img => img.id === imageId);
    if (index <= 0) return;

    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    
    // Re-index
    newImages.forEach((img, idx) => {
      img.order = idx;
      img.type = idx === 0 ? 'main' : 'detail';
    });
    
    if (onChange) onChange(newImages);
  }, [images, onChange]);

  // Zmiana kolejności (move down)
  const moveImageDown = useCallback((imageId) => {
    const index = images.findIndex(img => img.id === imageId);
    if (index === -1 || index >= images.length - 1) return;

    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    
    // Re-index
    newImages.forEach((img, idx) => {
      img.order = idx;
      img.type = idx === 0 ? 'main' : 'detail';
    });
    
    if (onChange) onChange(newImages);
  }, [images, onChange]);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInput}
            disabled={disabled || uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="pointer-events-none">
            {uploading ? (
              <div className="space-y-3">
                <svg className="mx-auto h-12 w-12 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Uploading zdjęć...
                </p>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Przeciągnij zdjęcia tutaj lub kliknij aby wybrać
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, WEBP do 10MB ({images.length}/{maxImages})
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
            >
              {/* Image */}
              <img
                src={image.url}
                alt={image.caption || `Zdjęcie ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Main Badge */}
              {image.type === 'main' && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  GŁÓWNE
                </div>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {/* Move Up */}
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImageUp(image.id)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Przenieś w górę"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}

                {/* Move Down */}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImageDown(image.id)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Przenieś w dół"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="Usuń zdjęcie"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Order Number */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs font-semibold px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {images.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Pierwsze zdjęcie jest zdjęciem głównym. Użyj strzałek aby zmienić kolejność.
        </p>
      )}
    </div>
  );
}
