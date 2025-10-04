// components/PartNameplateScanner.js
// System OCR do rozpoznawania numerów części z tabliczek AGD
// Bazuje na sprawdzonym ModelOCRScanner + OpenAI Vision API

import { useState, useRef } from 'react';
import { FiCamera, FiX, FiImage, FiSearch, FiZap } from 'react-icons/fi';

export default function PartNameplateScanner({ isOpen, onClose, onPartDetected, parts = [] }) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [detectedParts, setDetectedParts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  
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
          facingMode: 'environment' // Kamera tylna
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
      setIsScanning(true);
    } catch (error) {
      console.error('Błąd dostępu do kamery:', error);
      setCameraError('Nie można uzyskać dostępu do kamery. Sprawdź uprawnienia.');
    }
  };

  // Zatrzymanie kamery
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  // Kompresja obrazu (jak w SimpleAIScanner) - optymalizacja dla API
  const compressImage = (imageData, maxWidth = 600, quality = 0.6) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Oblicz nowe wymiary
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Narysuj z kompresją
        ctx.drawImage(img, 0, 0, width, height);

        // Zwróć skompresowany obraz
        const compressed = canvas.toDataURL('image/jpeg', quality);
        
        // Log kompresji
        const originalSize = (imageData.length * 0.75 / 1024).toFixed(2);
        const compressedSize = (compressed.length * 0.75 / 1024).toFixed(2);
        console.log(`🗜️ Kompresja: ${originalSize}KB → ${compressedSize}KB (${((compressedSize/originalSize)*100).toFixed(0)}%)`);

        resolve(compressed);
      };
      img.src = imageData;
    });
  };

  // Zrobienie zdjęcia z KOMPRESJĄ
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const rawImageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // KOMPRESJA (600px max, 60% quality) - jak w SimpleAIScanner
    const compressedImageData = await compressImage(rawImageData, 600, 0.6);
    
    setCapturedImage(compressedImageData);
    stopCamera();
    analyzeImage(compressedImageData);
  };

  // Wybór z galerii z KOMPRESJĄ
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawImageData = e.target.result;
      
      // KOMPRESJA (600px max, 60% quality) - jak w SimpleAIScanner
      const compressedImageData = await compressImage(rawImageData, 600, 0.6);
      
      setCapturedImage(compressedImageData);
      analyzeImage(compressedImageData);
    };
    reader.readAsDataURL(file);
  };

  // Analiza obrazu przez GPT-4o Mini Vision (TYLKO GPT-4o Mini, jak w SimpleAIScanner)
  const analyzeImage = async (imageData) => {
    setIsProcessing(true);
    setOcrResult('');
    setDetectedParts([]);

    try {
      // Konwersja do base64 (usuń prefix data:image/jpeg;base64,)
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

      console.log('🤖 GPT-4o Mini - analizuje tabliczkę znamionową...');

      // Wysłanie do OpenAI Vision API (TYLKO GPT-4o Mini)
      const response = await fetch('/api/openai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          prompt: `Przeanalizuj to zdjęcie tabliczki znamionowej sprzętu AGD i wyciągnij WSZYSTKIE widoczne numery części zamiennych. 

Szukaj numerów w różnych formatach:
- Standardowe numery części (np. 00144978, BSH4832149)
- E-Nr (np. E-Nr.: ABC123)
- Typ/Type (np. Type: WM123)
- Part Number (np. P/N: 12345)
- Serial Number (może zawierać numery części)
- Kody alfanumeryczne (np. WM60-123, ABC-456-789)

WAŻNE: Zwróć TYLKO JSON, bez dodatkowego tekstu:
{
  "detectedParts": [
    {
      "partNumber": "dokładny numer części",
      "type": "typ/kategoria jeśli widoczna",
      "location": "gdzie znaleziono (np. E-Nr, Type, P/N)",
      "confidence": "high/medium/low"
    }
  ],
  "brand": "marka urządzenia",
  "model": "model urządzenia",
  "rawText": "cały widoczny tekst z tabliczki"
}`,
          force_openai_only: true // Wymusza użycie tylko GPT-4o Mini
        })
      });

      const data = await response.json();
      
      // Sprawdź czy to GPT-4o Mini
      if (data.success && data.source && data.source.includes('GPT-4o Mini')) {
        console.log('✅ GPT-4o Mini odpowiedział:', data.source);
        
        try {
          // Parse analizy (może być w markdown ```json)
          let analysisText = data.analysis;
          if (analysisText.includes('```json')) {
            const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              analysisText = jsonMatch[1];
            }
          }
          
          const analysis = JSON.parse(analysisText);
          setOcrResult(analysis.rawText || 'Rozpoznano tabliczkę znamionową');

          // Dopasowanie do bazy części
          const matched = matchPartsFromDatabase(analysis, parts);
          setDetectedParts(matched);

          // Jeśli nie znaleziono dopasowań, pokaż raw wykryte numery
          if (matched.length === 0 && analysis.detectedParts?.length > 0) {
            const unmatchedParts = analysis.detectedParts.map(p => ({
              partNumber: p.partNumber,
              name: `Nieznana część (${p.type || 'brak typu'})`,
              confidence: p.confidence === 'high' ? 0.8 : p.confidence === 'medium' ? 0.6 : 0.4,
              source: 'GPT-4o Mini - nie w bazie',
              isUnknown: true,
              location: p.location
            }));
            setDetectedParts(unmatchedParts);
          }
        } catch (parseError) {
          console.error('Błąd parsowania odpowiedzi GPT-4o Mini:', parseError);
          throw new Error('Błąd parsowania odpowiedzi GPT-4o Mini. Spróbuj ponownie.');
        }
      } else {
        // Jeśli to nie GPT-4o Mini lub błąd
        const errorMessage = data.error || 'GPT-4o Mini niedostępny. Sprawdź klucz API lub spróbuj ponownie.';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('Błąd połączenia z GPT-4o Mini:', error);
      alert(`❌ ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Inteligentne parsowanie modelu i typu (jak w SimpleAIScanner)
  // Specjalna obsługa dla AMICA, WHIRLPOOL, CANDY, HOOVER
  const smartParseModelAndType = (model, type, brand, allText) => {
    const brandsWithModelInType = ['AMICA', 'WHIRLPOOL', 'CANDY', 'HOOVER'];
    
    let finalModel = model?.trim() || '';
    let finalType = type?.trim() || '';
    
    // Dla specjalnych marek - sprawdź czy TYPE zawiera właściwie MODEL
    if (brand && brandsWithModelInType.includes(brand.toUpperCase())) {
      const typeAsModelPattern = /^[A-Z]{2,}[0-9]{3,}[A-Z]*$/i;
      
      // Jeśli TYPE wygląda jak MODEL (np. "PG6510ZTN")
      if (typeAsModelPattern.test(finalType) && !typeAsModelPattern.test(finalModel)) {
        console.log(`⚠️ ${brand}: TYPE zawiera MODEL - zamieniam miejscami`);
        [finalModel, finalType] = [finalType, finalModel];
      }
      
      // Specjalne parsowanie dla AMICA - szukaj "TYPE/TYP:" w tekście
      if (brand.toUpperCase() === 'AMICA' && allText) {
        const typMatch = allText.match(/(?:TYPE\s*\/\s*TYP|Typ|Type|TYP):\s*([A-Z0-9+\-\/\(\)\.\s]+)/i);
        if (typMatch) {
          const foundType = typMatch[1].trim();
          console.log(`🔍 AMICA: Znaleziono TYPE/TYP: "${foundType}"`);
          
          // Jeśli znaleziony TYPE wygląda jak model - użyj go jako model
          if (typeAsModelPattern.test(foundType)) {
            finalModel = foundType;
            console.log(`✅ AMICA: Ustawiam MODEL = "${finalModel}"`);
          } else {
            finalType = foundType;
          }
        }
      }
    }
    
    // Określenie typu urządzenia z prefiksu modelu (dla płyt AMICA)
    if (finalModel && !finalType) {
      if (finalModel.startsWith('PI')) {
        finalType = 'Płyta indukcyjna';
      } else if (finalModel.startsWith('PC')) {
        finalType = 'Płyta ceramiczna';
      } else if (finalModel.startsWith('PG')) {
        finalType = 'Płyta gazowa';
      } else if (finalModel.startsWith('WM')) {
        finalType = 'Pralka';
      }
    }
    
    // Sprawdź czy model nie jest za długi/opisowy
    if (finalModel && finalModel.length > 20 && finalModel.includes(' ')) {
      const words = finalModel.split(' ');
      const typeAsModelPattern = /^[A-Z]{2,}[0-9]{3,}[A-Z]*$/i;
      const potentialModel = words.find(w => typeAsModelPattern.test(w));
      if (potentialModel) {
        console.log(`✂️ Skracam model: "${finalModel}" → "${potentialModel}"`);
        finalModel = potentialModel;
      }
    }
    
    return { model: finalModel, type: finalType };
  };

  // Dopasowanie wykrytych numerów do bazy części
  const matchPartsFromDatabase = (analysis, partsDB) => {
    const matches = [];
    
    if (!analysis.detectedParts || analysis.detectedParts.length === 0) {
      return matches;
    }

    // Zastosuj smart parsing do brand/model/type jeśli dostępne
    if (analysis.brand && analysis.model) {
      const parsed = smartParseModelAndType(
        analysis.model, 
        analysis.type || '', 
        analysis.brand, 
        analysis.rawText || ''
      );
      analysis.model = parsed.model;
      analysis.type = parsed.type;
      console.log(`🧠 Smart parsing: Model="${parsed.model}", Type="${parsed.type}"`);
    }

    analysis.detectedParts.forEach(detected => {
      // Szukaj w bazie po numerze części
      partsDB.forEach(part => {
        const partNumbers = [
          part.partNumber,
          part.id,
          ...(part.alternativePartNumbers || [])
        ].filter(Boolean).map(n => n.toLowerCase().replace(/[\s-]/g, ''));

        const detectedNumber = detected.partNumber.toLowerCase().replace(/[\s-]/g, '');

        // Dokładne dopasowanie
        if (partNumbers.includes(detectedNumber)) {
          matches.push({
            ...part,
            confidence: 0.95,
            source: 'OCR - dokładne dopasowanie',
            detectedAs: detected.partNumber,
            location: detected.location
          });
        } 
        // Częściowe dopasowanie (zawiera numer)
        else if (partNumbers.some(pn => pn.includes(detectedNumber) || detectedNumber.includes(pn))) {
          matches.push({
            ...part,
            confidence: 0.75,
            source: 'OCR - częściowe dopasowanie',
            detectedAs: detected.partNumber,
            location: detected.location
          });
        }
      });
    });

    // Usuń duplikaty (sortuj po confidence i weź najlepsze)
    const unique = Array.from(new Map(matches.map(m => [m.id, m])).values());
    return unique.sort((a, b) => b.confidence - a.confidence);
  };

  // Wybór części
  const selectPart = (part) => {
    if (onPartDetected) {
      onPartDetected(part);
    }
    handleClose();
  };

  // Zamknięcie
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setOcrResult('');
    setDetectedParts([]);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black bg-opacity-90 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiCamera className="text-blue-600" />
            Skanuj Tabliczkę Znamionową
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Camera/Image Section */}
          {!capturedImage && !isScanning && (
            <div className="space-y-4">
              <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <FiSearch className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Zeskanuj tabliczkę znamionową AGD aby automatycznie<br />
                  rozpoznać numery części zamiennych
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={initCamera}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                  >
                    <FiCamera className="w-5 h-5" />
                    Użyj Kamery
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 font-medium"
                  >
                    <FiImage className="w-5 h-5" />
                    Wybierz z Galerii
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {cameraError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{cameraError}</p>
                </div>
              )}

              {/* Tips */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <FiZap className="w-4 h-4" />
                  Wskazówki:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Upewnij się, że tabliczka jest dobrze oświetlona</li>
                  <li>Zrób zdjęcie z bliska, ale zachowaj ostrość</li>
                  <li>Unikaj odbić światła na tabliczce</li>
                  <li>System GPT-4o Mini automatycznie wykryje numery części</li>
                </ul>
              </div>
            </div>
          )}

          {/* Camera View */}
          {isScanning && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Camera Overlay - Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white border-dashed w-4/5 h-4/5 rounded-lg"></div>
                </div>
              </div>

              <button
                onClick={capturePhoto}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg flex items-center justify-center gap-2"
              >
                <FiCamera className="w-6 h-6" />
                Zrób Zdjęcie
              </button>
            </div>
          )}

          {/* Captured Image + Results */}
          {capturedImage && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
                      <p className="text-white font-medium">Analizuję tabliczkę przez GPT-4o Mini...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* OCR Result Text */}
              {ocrResult && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Rozpoznany tekst:
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                    {ocrResult}
                  </p>
                </div>
              )}

              {/* Detected Parts */}
              {detectedParts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Wykryte części ({detectedParts.length}):
                  </h3>
                  {detectedParts.map((part, index) => (
                    <button
                      key={index}
                      onClick={() => selectPart(part)}
                      className="w-full p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left"
                    >
                      <div className="flex items-start gap-4">
                        {part.images?.[0]?.url && (
                          <img
                            src={part.images[0].url}
                            alt={part.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white mb-1">
                            {part.name || part.partName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <div>Numer: <span className="font-mono font-medium">{part.partNumber}</span></div>
                            {part.detectedAs && part.detectedAs !== part.partNumber && (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Wykryto jako: {part.detectedAs} ({part.location})
                              </div>
                            )}
                            {part.pricing?.retailPrice && (
                              <div className="font-medium text-green-600 dark:text-green-400">
                                {part.pricing.retailPrice} zł
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Pewność
                          </div>
                          <div className={`text-lg font-bold ${
                            part.confidence > 0.9 ? 'text-green-600' :
                            part.confidence > 0.7 ? 'text-yellow-600' :
                            'text-orange-600'
                          }`}>
                            {Math.round(part.confidence * 100)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isProcessing && detectedParts.length === 0 && ocrResult && (
                <div className="p-6 text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-300 mb-4">
                    Nie znaleziono żadnych części w bazie pasujących do wykrytych numerów.
                  </p>
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setOcrResult('');
                      setDetectedParts([]);
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Spróbuj ponownie
                  </button>
                </div>
              )}

              {/* Retry Button */}
              {!isProcessing && (
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setOcrResult('');
                    setDetectedParts([]);
                    initCamera();
                  }}
                  className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <FiCamera className="w-5 h-5" />
                  Zrób Nowe Zdjęcie
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
