// components/PhotoGallery.js
// Lightbox do przeglądania galerii zdjęć z nawigacją, zoom i fullscreen

import { useState, useEffect } from 'react';
import Model360Viewer from './Model360Viewer';

export default function PhotoGallery({ images = [], isOpen, onClose, initialIndex = 0, model3DData = null }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [viewMode, setViewMode] = useState('photos'); // 'photos' lub '360'

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
  };

  const goToIndex = (index) => {
    setCurrentIndex(index);
    setIsZoomed(false);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
        title="Zamknij (Esc)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* View Mode Tabs (jeśli jest model 360) */}
      {model3DData && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex bg-black/70 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('photos')}
            className={`px-6 py-2 text-sm font-medium transition-colors ${
              viewMode === 'photos' 
                ? 'bg-white text-black' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Zdjęcia ({images.length})
            </span>
          </button>
          <button
            onClick={() => setViewMode('360')}
            className={`px-6 py-2 text-sm font-medium transition-colors ${
              viewMode === '360' 
                ? 'bg-white text-black' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Widok 360°
            </span>
          </button>
        </div>
      )}
      
      {/* Image Counter (tylko gdy brak model3D lub pokazujemy photos) */}
      {(!model3DData || viewMode === 'photos') && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Zoom Button (tylko dla trybu photos) */}
      {viewMode === 'photos' && (
        <button
          onClick={toggleZoom}
          className="absolute top-4 left-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          title={isZoomed ? "Pomniejsz" : "Powiększ"}
        >
          {isZoomed ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          )}
        </button>
      )}

      {/* Main Content Area */}
      <div className="relative flex items-center justify-center w-full h-full p-16">
        {viewMode === '360' && model3DData ? (
          /* 360° Viewer */
          <div className="w-full max-w-4xl">
            <Model360Viewer 
              model3DData={model3DData}
              autoplay={false}
            />
          </div>
        ) : (
          /* Regular Photo Gallery */
          <>
            <img
              src={currentImage.url}
              alt={currentImage.caption || `Zdjęcie ${currentIndex + 1}`}
              className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={toggleZoom}
            />

            {/* Image Type Badge */}
            {currentImage.type === 'main' && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                GŁÓWNE
              </div>
            )}

            {/* Caption */}
            {currentImage.caption && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-2xl px-4 py-2 bg-black/70 rounded-lg text-white text-sm text-center">
                {currentImage.caption}
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation Buttons (tylko dla trybu photos) */}
      {viewMode === 'photos' && images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            title="Poprzednie (←)"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            title="Następne (→)"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Thumbnail Strip (tylko dla trybu photos) */}
      {viewMode === 'photos' && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-4xl overflow-x-auto">
          <div className="flex gap-2 px-4">
            {images.map((image, index) => (
              <button
                key={image.id || index}
                onClick={() => goToIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={image.url}
                  alt={`Miniatura ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white/50 text-xs">
        ← → klawisze strzałek | ESC zamknij | Kliknij aby powiększyć
      </div>
    </div>
  );
}
