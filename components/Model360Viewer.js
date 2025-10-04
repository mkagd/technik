import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import żeby uniknąć SSR issues
const ReactImageTurntable = dynamic(
  () => import('react-360-view').then(mod => mod.ReactImageTurntable),
  { ssr: false }
);

/**
 * Model360Viewer Component
 * 
 * Interaktywny viewer do obracania części w 360°
 * - Sekwencja 16-32 zdjęć
 * - Obracanie myszką (drag)
 * - Auto-play z kontrolą prędkości
 * - Fullscreen mode
 * - Loading state
 * 
 * @param {Object} model3DData - Dane modelu 360: { type, frames, autoplay, frameRate }
 * @param {string} className - Dodatkowe klasy CSS
 * @param {boolean} autoplay - Czy automatycznie odtwarzać rotację
 * @param {Function} onLoad - Callback po załadowaniu wszystkich frame'ów
 */
export default function Model360Viewer({
  model3DData,
  className = '',
  autoplay = false,
  onLoad
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [frameRate, setFrameRate] = useState(10); // FPS dla auto-play
  const [error, setError] = useState(null);

  // Walidacja danych
  useEffect(() => {
    if (!model3DData) {
      setError('Brak danych modelu 360°');
      setIsLoading(false);
      return;
    }

    if (model3DData.type !== '360-sequence') {
      setError('Nieobsługiwany typ modelu 3D');
      setIsLoading(false);
      return;
    }

    if (!model3DData.frames || model3DData.frames.length < 8) {
      setError('Zbyt mało klatek (minimum 8)');
      setIsLoading(false);
      return;
    }

    // Preload wszystkich obrazów
    let loadedCount = 0;
    const totalFrames = model3DData.frames.length;

    model3DData.frames.forEach((frameUrl) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        setLoadingProgress(Math.round((loadedCount / totalFrames) * 100));
        
        if (loadedCount === totalFrames) {
          setIsLoading(false);
          if (onLoad) onLoad();
        }
      };
      img.onerror = () => {
        setError(`Nie udało się załadować klatki: ${frameUrl}`);
        setIsLoading(false);
      };
      img.src = frameUrl;
    });
  }, [model3DData, onLoad]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Escape key handler dla fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  // Error state
  if (error) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center ${className}`}>
        <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-600 dark:text-red-400 font-medium mb-2">Błąd widoku 360°</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center ${className}`}>
        <div className="relative w-32 h-32 mx-auto mb-4">
          {/* Spinning 3D cube icon */}
          <svg className="animate-spin h-32 w-32 text-blue-500" viewBox="0 0 100 100" fill="none">
            <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M50 10 L50 90 M10 30 L90 70 M90 30 L10 70" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
          Ładowanie widoku 360°
        </p>
        <div className="w-64 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loadingProgress}% ({Math.round(loadingProgress * model3DData.frames.length / 100)} / {model3DData.frames.length} klatek)
        </p>
      </div>
    );
  }

  const viewerContent = (
    <div className={`relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ${isFullscreen ? 'h-screen w-screen' : ''}`}>
      {/* 360 Viewer */}
      <div className={`relative ${isFullscreen ? 'h-full' : 'aspect-square'}`}>
        <ReactImageTurntable
          images={model3DData.frames}
          autoplay={isPlaying}
          frameRate={frameRate}
          className="w-full h-full"
        />

        {/* 360° Badge */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          360°
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:text-blue-400 transition-colors"
            title={isPlaying ? 'Zatrzymaj' : 'Odtwórz'}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Speed Control */}
          <div className="flex items-center gap-2 text-white text-sm">
            <span>Prędkość:</span>
            <input
              type="range"
              min="5"
              max="30"
              value={frameRate}
              onChange={(e) => setFrameRate(Number(e.target.value))}
              className="w-24 accent-blue-500"
            />
            <span className="w-8 text-right">{frameRate}</span>
          </div>

          {/* Frame Count */}
          <div className="text-white text-sm border-l border-white/30 pl-4">
            {model3DData.frames.length} klatek
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-blue-400 transition-colors border-l border-white/30 pl-4"
            title={isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran'}
          >
            {isFullscreen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>

        {/* Instructions */}
        {!isPlaying && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                         bg-black/50 backdrop-blur-sm text-white px-6 py-3 rounded-lg text-center pointer-events-none">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <p className="text-sm">Przeciągnij, aby obrócić</p>
          </div>
        )}
      </div>

      {/* Close button for fullscreen */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );

  // Fullscreen portal
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {viewerContent}
      </div>
    );
  }

  return <div className={className}>{viewerContent}</div>;
}

// Helper component dla uploadu sekwencji 360°
export function Model360UploadZone({ onUpload, existingFrames = [], maxFrames = 32 }) {
  const [frames, setFrames] = useState(existingFrames);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFilesUpload = async (files) => {
    if (files.length < 8) {
      alert('Minimum 8 klatek wymagane dla widoku 360°');
      return;
    }

    if (files.length > maxFrames) {
      alert(`Maksymalnie ${maxFrames} klatek`);
      return;
    }

    setUploading(true);
    const uploadedFrames = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'model-360');

      try {
        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          uploadedFrames.push(data.url);
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setFrames(uploadedFrames);
    setUploading(false);
    setUploadProgress(0);

    if (onUpload) {
      onUpload({
        type: '360-sequence',
        frames: uploadedFrames,
        frameCount: uploadedFrames.length,
        createdAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>

        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Upload sekwencji 360°
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Wybierz 16-32 zdjęć w kolejności obrotu (0°, 11.25°, 22.5°...)
        </p>

        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFilesUpload(Array.from(e.target.files))}
          className="hidden"
          id="model360-upload"
          disabled={uploading}
        />
        <label
          htmlFor="model360-upload"
          className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading {uploadProgress}%
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Wybierz zdjęcia
            </>
          )}
        </label>

        {frames.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-green-600 dark:text-green-400 mb-2">
              ✓ Załadowano {frames.length} klatek
            </p>
            <div className="grid grid-cols-8 gap-1">
              {frames.slice(0, 16).map((frame, idx) => (
                <img
                  key={idx}
                  src={frame}
                  alt={`Frame ${idx + 1}`}
                  className="w-full h-12 object-cover rounded"
                />
              ))}
              {frames.length > 16 && (
                <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                  +{frames.length - 16}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
