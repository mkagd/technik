// components/ModelOCRScanner.js

import { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import {
  FiCamera,
  FiX,
  FiRotateCw,
  FiCheck,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiZap,
  FiImage,
  FiGrid,
  FiTrash2
} from 'react-icons/fi';
// modelsDatabase will be loaded dynamically

export default function ModelOCRScanner({ isOpen, onClose, onModelDetected }) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [detectedModels, setDetectedModels] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const [showSavedImages, setShowSavedImages] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Inicjalizacja kamery
  const initCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Kamera tylna na telefonie
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Błąd dostępu do kamery:', error);
      setCameraError('Nie można uzyskać dostępu do kamery. Sprawdź uprawnienia.');
    }
  };

  // Funkcjonalność latarki
  const toggleFlashlight = async () => {
    if (!stream) return;
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      
      if (capabilities.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashlightOn }]
        });
        setFlashlightOn(!flashlightOn);
      } else {
        alert('Latarka nie jest dostępna na tym urządzeniu');
      }
    } catch (error) {
      console.error('Błąd obsługi latarki:', error);
      alert('Nie można włączyć latarki');
    }
  };

  // Zapisywanie zdjęcia lokalnie i na serwerze
  const saveImageLocally = async (imageData, metadata = {}) => {
    // Import funkcji (dynamiczny import dla komponentów)
    const { saveDualStorage } = await import('../utils/scanner-server-integration');
    
    const imageInfo = {
      id: Date.now(),
      imageData: imageData,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        size: Math.round(imageData.length / 1024) + ' KB'
      }
    };
    
    try {
      // Stara metoda (kompatybilność)
      const existingImages = JSON.parse(localStorage.getItem('scannerImages') || '[]');
      const updatedImages = [imageInfo, ...existingImages.slice(0, 9)]; // Zachowaj max 10 zdjęć
      localStorage.setItem('scannerImages', JSON.stringify(updatedImages));
      setSavedImages(updatedImages);
      console.log('💾 Zdjęcie zapisane lokalnie:', imageInfo.id);
      
      // Nowa metoda - zapis na serwerze
      try {
        const dualResult = await saveDualStorage(imageData, {
          orderId: metadata.orderId || 'SCANNER',
          category: 'model',
          userId: metadata.userId || 'OCR_SCANNER',
          description: `OCR Scanner - ${metadata.source || 'Camera'}`,
          ...metadata
        });
        
        if (dualResult.server.success) {
          console.log('✅ Zdjęcie również zapisane na serwerze:', dualResult.server.serverUrl);
        } else {
          console.log('⚠️ Zdjęcie zapisane tylko lokalnie, serwer niedostępny');
        }
      } catch (serverError) {
        console.log('⚠️ Fallback: zapis tylko lokalny, błąd serwera:', serverError);
      }
      
    } catch (error) {
      console.error('Błąd zapisywania zdjęcia:', error);
    }
  };

  // Wczytywanie zapisanych zdjęć
  const loadSavedImages = () => {
    try {
      const existingImages = JSON.parse(localStorage.getItem('scannerImages') || '[]');
      setSavedImages(existingImages);
    } catch (error) {
      console.error('Błąd wczytywania zdjęć:', error);
      setSavedImages([]);
    }
  };

  // Usuwanie zapisanego zdjęcia
  const deleteSavedImage = (imageId) => {
    try {
      const updatedImages = savedImages.filter(img => img.id !== imageId);
      localStorage.setItem('scannerImages', JSON.stringify(updatedImages));
      setSavedImages(updatedImages);
    } catch (error) {
      console.error('Błąd usuwania zdjęcia:', error);
    }
  };

  // Wybór zapisanego zdjęcia
  const selectSavedImage = (imageInfo) => {
    setCapturedImage(imageInfo.imageData);
    setShowSavedImages(false);
    stopCamera();
  };

  // Zatrzymanie kamery
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Przechwycenie zdjęcia
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Zapisz zdjęcie lokalnie z metadanymi
    saveImageLocally(imageDataUrl, {
      resolution: `${canvas.width}x${canvas.height}`,
      flashlight: flashlightOn ? 'Tak' : 'Nie',
      source: 'Kamera'
    });
    
    setCapturedImage(imageDataUrl);
    
    // Wyłącz latarkę po zrobieniu zdjęcia
    if (flashlightOn) {
      toggleFlashlight();
    }
    
    stopCamera();
  };

  // Przetwarzanie obrazu przed OCR
  const preprocessImage = (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Zwiększ rozmiar dla lepszej jakości
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Rysuj obraz w większej skali
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        // Pobierz dane pikseli
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        // Zwiększ kontrast i jasność
        for (let i = 0; i < data.length; i += 4) {
          // Konwertuj do skali szarości
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          
          // Zwiększ kontrast (binaryzacja)
          const threshold = 128;
          const newValue = gray > threshold ? 255 : 0;
          
          data[i] = newValue;     // R
          data[i + 1] = newValue; // G
          data[i + 2] = newValue; // B
          // Alpha pozostaje bez zmian
        }
        
        // Zastosuj zmiany
        ctx.putImageData(imageDataObj, 0, 0);
        
        // Zwróć przetworzone zdjęcie
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageData;
    });
  };

  // Przetwarzanie OCR
  const processOCR = async (imageData) => {
    setIsProcessing(true);
    setOcrResult('');
    setDetectedModels([]);

    try {
      // Przetwórz obraz przed OCR
      const processedImage = await preprocessImage(imageData);
      
      const worker = await createWorker('eng', 1, {
        logger: m => console.log(m)
      });

      // Zoptymalizowane parametry dla tabliczek znamionowych
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/().: ',
        tessedit_pageseg_mode: '7', // Treat the image as a single text line
        tessedit_ocr_engine_mode: '1', // LSTM OCR Engine only
        preserve_interword_spaces: '1',
        user_defined_dpi: '300'
      });

      // Wielokrotne próby z różnymi parametrami
      let bestResult = '';
      let bestConfidence = 0;
      
      const configs = [
        { psm: '7', oem: '1' }, // Single text line
        { psm: '8', oem: '1' }, // Single word
        { psm: '6', oem: '1' }, // Uniform block
        { psm: '13', oem: '1' } // Raw line
      ];
      
      for (const config of configs) {
        await worker.setParameters({
          tessedit_pageseg_mode: config.psm,
          tessedit_ocr_engine_mode: config.oem
        });
        
        const { data: { text, confidence } } = await worker.recognize(processedImage);
        
        if (confidence > bestConfidence && text.trim().length > 0) {
          bestResult = text;
          bestConfidence = confidence;
        }
      }
      
      setOcrResult(bestResult);
      console.log(`Najlepszy wynik OCR (pewność: ${bestConfidence}%):`, bestResult);

      // Analiza tekstu i wyszukiwanie modeli
      const foundModels = analyzeOCRText(bestResult);
      setDetectedModels(foundModels);

      await worker.terminate();
    } catch (error) {
      console.error('Błąd OCR:', error);
      setOcrResult('Błąd podczas rozpoznawania tekstu');
    } finally {
      setIsProcessing(false);
    }
  };

  // Analiza tekstu OCR
  const analyzeOCRText = (text) => {
    const foundModels = [];
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9\s\-\/.():]/g, ' ');
    
    console.log('Analizowany tekst:', cleanText);
    
    // Rozszerzone wzorce dla lepszego rozpoznawania
    const enhancedPatterns = [
      // Standardowe wzorce z bazy
      ...modelsDatabase.ocr_patterns,
      
      // Dodatkowe wzorce dla popularnych formatów
      {
        pattern: '([A-Z]{2,4}[0-9]{4,8}[A-Z]{0,4})',
        description: 'Model AGD standard'
      },
      {
        pattern: '([A-Z]{3}[0-9]{5}[A-Z]{2})',
        description: 'Format XXX12345XX'
      },
      {
        pattern: '([A-Z]{2}[0-9]{2}[A-Z][0-9]{4}[A-Z]{2})',
        description: 'Format XX00X0000XX'
      },
      {
        pattern: '(WW[0-9]{2}[A-Z][0-9]{4}[A-Z]{2})',
        description: 'Samsung washing machine'
      },
      {
        pattern: '(WA[A-Z][0-9]{5}[A-Z]{2})',
        description: 'Bosch washing machine'
      },
      {
        pattern: '(SMS[0-9]{2}[A-Z][0-9]{2}[A-Z])',
        description: 'Bosch dishwasher'
      }
    ];

    // Szukaj wzorców w tekście
    enhancedPatterns.forEach(patternObj => {
      const regex = new RegExp(patternObj.pattern, 'gi');
      const matches = cleanText.match(regex);
      
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.replace(/[^A-Z0-9]/g, '');
          
          // Sprawdź w bazie danych
          const modelInfo = findModelInDatabase(cleanMatch);
          
          if (modelInfo) {
            foundModels.push({
              detected: match,
              clean: cleanMatch,
              ...modelInfo,
              confidence: 'high',
              source: 'database'
            });
          } else {
            // Sprawdź podobieństwo z istniejącymi modelami
            const similarModel = findSimilarModel(cleanMatch);
            
            if (similarModel) {
              foundModels.push({
                detected: match,
                clean: cleanMatch,
                ...similarModel,
                confidence: 'medium',
                source: 'similarity',
                note: 'Podobny model w bazie danych'
              });
            } else if (cleanMatch.length >= 6) {
              // Dodaj jako potencjalny model tylko jeśli ma sensowną długość
              foundModels.push({
                detected: match,
                clean: cleanMatch,
                name: `Model nieznany: ${cleanMatch}`,
                type: 'Nierozpoznany typ urządzenia',
                confidence: 'low',
                source: 'ocr'
              });
            }
          }
        });
      }
    });

    // Usuń duplikaty
    const uniqueModels = foundModels.filter((model, index, self) => 
      index === self.findIndex(m => m.clean === model.clean)
    );

    // Sortuj według pewności
    uniqueModels.sort((a, b) => {
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });

    console.log('Znalezione modele:', uniqueModels);
    
    return uniqueModels;
  };

  // Wyszukiwanie modelu w bazie danych
  const findModelInDatabase = (modelNumber) => {
    for (const [brandName, brandData] of Object.entries(modelsDatabase.brands)) {
      for (const [categoryName, categoryData] of Object.entries(brandData)) {
        if (categoryData[modelNumber]) {
          return {
            brand: brandName,
            category: categoryName,
            model: modelNumber,
            ...categoryData[modelNumber]
          };
        }
      }
    }
    return null;
  };

  // Wyszukiwanie podobnego modelu (Levenshtein distance)
  const findSimilarModel = (modelNumber) => {
    let bestMatch = null;
    let bestDistance = Infinity;
    const maxDistance = 2; // Maksymalna różnica w znakach
    
    for (const [brandName, brandData] of Object.entries(modelsDatabase.brands)) {
      for (const [categoryName, categoryData] of Object.entries(brandData)) {
        for (const [existingModel, modelData] of Object.entries(categoryData)) {
          const distance = levenshteinDistance(modelNumber, existingModel);
          
          if (distance <= maxDistance && distance < bestDistance) {
            bestDistance = distance;
            bestMatch = {
              brand: brandName,
              category: categoryName,
              model: existingModel,
              ...modelData,
              similarity: Math.round((1 - distance / Math.max(modelNumber.length, existingModel.length)) * 100)
            };
          }
        }
      }
    }
    
    return bestMatch;
  };

  // Oblicz odległość Levenshteina między dwoma stringami
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Obsługa wyboru pliku
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Zapisz zdjęcie z galerii lokalnie
        saveImageLocally(e.target.result, {
          fileName: file.name,
          size: Math.round(file.size / 1024) + ' KB',
          source: 'Galeria'
        });
        
        setCapturedImage(e.target.result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Ponowne uruchomienie kamery
  const restartCamera = () => {
    setCapturedImage(null);
    setOcrResult('');
    setDetectedModels([]);
    initCamera();
  };

  // Wybór modelu
  const selectModel = (model) => {
    onModelDetected(model);
    onClose();
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      initCamera();
      loadSavedImages(); // Wczytaj zapisane zdjęcia
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            <FiSearch className="inline mr-2" />
            Skanowanie tabliczki znamionowej
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 max-h-[calc(90vh-100px)] overflow-y-auto">
          {!capturedImage ? (
            <div className="space-y-4">
              {/* Podgląd kamery */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                {cameraError ? (
                  <div className="aspect-video flex items-center justify-center text-white text-center p-8">
                    <div>
                      <FiCamera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-red-300 mb-4">{cameraError}</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
                      >
                        Wybierz zdjęcie z galerii
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-blue-400 border-dashed m-8 rounded-lg flex items-center justify-center">
                      <div className="text-white text-center bg-black bg-opacity-50 px-4 py-2 rounded">
                        <p className="text-sm">Wyceluj w tabliczkę znamionową</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Przyciski kontrolne */}
              <div className="space-y-4">
                {/* Główne przyciski */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={capturePhoto}
                    disabled={!!cameraError || !stream}
                    className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    <FiCamera className="h-5 w-5 mr-2" />
                    Zrób zdjęcie
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FiImage className="h-5 w-5 mr-2" />
                    Z galerii
                  </button>
                </div>
                
                {/* Dodatkowe opcje */}
                <div className="flex justify-center space-x-2">
                  {!cameraError && stream && (
                    <button
                      onClick={toggleFlashlight}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                        flashlightOn 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      <FiZap className="h-4 w-4 mr-1" />
                      {flashlightOn ? 'Wyłącz latarkę' : 'Włącz latarkę'}
                    </button>
                  )}
                  
                  {savedImages.length > 0 && (
                    <button
                      onClick={() => setShowSavedImages(!showSavedImages)}
                      className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <FiGrid className="h-4 w-4 mr-1" />
                      Zapisane ({savedImages.length})
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Galeria zapisanych zdjęć */}
              {showSavedImages && savedImages.length > 0 && (
                <div className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">
                      <FiGrid className="inline mr-2" />
                      Ostatnio zrobione zdjęcia ({savedImages.length}/10)
                    </h3>
                    <button
                      onClick={() => setShowSavedImages(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {savedImages.map((imageInfo) => (
                      <div key={imageInfo.id} className="relative group border rounded-lg overflow-hidden">
                        <img
                          src={imageInfo.imageData}
                          alt={`Zapisane zdjęcie ${new Date(imageInfo.timestamp).toLocaleString()}`}
                          className="w-full h-20 object-cover cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => selectSavedImage(imageInfo)}
                        />
                        
                        {/* Overlay z informacjami */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                          <div className="text-white text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div>{new Date(imageInfo.timestamp).toLocaleDateString()}</div>
                            <div>{new Date(imageInfo.timestamp).toLocaleTimeString().slice(0, 5)}</div>
                            {imageInfo.metadata?.source && (
                              <div className="text-xs opacity-75">{imageInfo.metadata.source}</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Przycisk usuwania */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedImage(imageInfo.id);
                          }}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiTrash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    💾 Kliknij na zdjęcie aby je wybrać • Zdjęcia są zapisane lokalnie w przeglądarce
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Przechwycone zdjęcie */}
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full rounded-lg max-h-64 object-contain bg-gray-100"
                />
              </div>

              {/* Przyciski akcji */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => processOCR(capturedImage)}
                  disabled={isProcessing}
                  className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isProcessing ? (
                    <FiLoader className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <FiSearch className="h-5 w-5 mr-2" />
                  )}
                  {isProcessing ? 'Analizuję...' : 'Analizuj zdjęcie'}
                </button>

                <button
                  onClick={restartCamera}
                  className="flex items-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FiRefreshCw className="h-5 w-5 mr-2" />
                  Nowe zdjęcie
                </button>
              </div>

              {/* Wyniki OCR */}
              {ocrResult && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Rozpoznany tekst:</h3>
                  <div className="text-sm text-gray-600 font-mono bg-white p-3 rounded border max-h-32 overflow-y-auto">
                    {ocrResult}
                  </div>
                </div>
              )}

              {/* Wykryte modele */}
              {detectedModels.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">
                    Wykryte modele ({detectedModels.length}):
                  </h3>
                  {detectedModels.map((model, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        model.confidence === 'high'
                          ? 'border-green-300 bg-green-50 hover:bg-green-100'
                          : model.confidence === 'medium'
                          ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                          : 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                      }`}
                      onClick={() => selectModel(model)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-bold text-lg">{model.clean}</span>
                            
                            {model.confidence === 'high' && (
                              <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full flex items-center">
                                <FiCheck className="h-3 w-3 mr-1" />
                                Dokładne dopasowanie
                              </span>
                            )}
                            
                            {model.confidence === 'medium' && (
                              <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full flex items-center">
                                <FiSearch className="h-3 w-3 mr-1" />
                                Podobny model ({model.similarity}%)
                              </span>
                            )}
                            
                            {model.confidence === 'low' && (
                              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                                Nieznany model
                              </span>
                            )}
                          </div>
                          
                          {model.brand && (
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {model.brand} - {model.name}
                            </p>
                          )}
                          
                          {model.type && (
                            <p className="text-xs text-gray-500 mb-1">{model.type}</p>
                          )}
                          
                          {model.note && (
                            <p className="text-xs text-blue-600 mb-1">{model.note}</p>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              Wykryto: "{model.detected}"
                            </p>
                            
                            <div className="flex items-center space-x-1">
                              {model.source === 'database' && (
                                <span className="text-xs text-green-600">📚 Baza</span>
                              )}
                              {model.source === 'similarity' && (
                                <span className="text-xs text-blue-600">🔍 Podobny</span>
                              )}
                              {model.source === 'ocr' && (
                                <span className="text-xs text-yellow-600">👁️ OCR</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex items-center">
                          <FiCheck className={`h-5 w-5 ${
                            model.confidence === 'high' ? 'text-green-600' :
                            model.confidence === 'medium' ? 'text-blue-600' :
                            'text-yellow-600'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg">
                    💡 <strong>Wskazówka:</strong> Kliknij na model aby go dodać. 
                    Modele z zielonym znaczkiem są najpewniejsze.
                  </div>
                </div>
              )}

              {ocrResult && detectedModels.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FiSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nie rozpoznano żadnych modeli na zdjęciu.</p>
                  <p className="text-sm">Spróbuj ponownie z lepszym oświetleniem.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}