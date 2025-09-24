// components/ModelAIScanner.js

import { useState, useRef, useEffect } from 'react';
import {
  FiCamera,
  FiX,
  FiRotateCw,
  FiCheck,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiZap,
  FiEye,
  FiBrain
} from 'react-icons/fi';
import modelsDatabase from '../data/modelsDatabase.json';

export default function ModelAIScanner({ isOpen, onClose, onModelDetected }) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [aiResult, setAiResult] = useState('');
  const [detectedModels, setDetectedModels] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [processingStage, setProcessingStage] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Inicjalizacja kamery
  const initCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  // Analiza AI z wieloma źródłami
  const processAI = async (imageData) => {
    setIsProcessing(true);
    setAiResult('');
    setDetectedModels([]);

    try {
      // ETAP 1: Google Vision API (ekonomiczne, dobre dla tekstu)
      setProcessingStage('💰 Google Vision - ekonomiczna analiza...');
      const googleResult = await analyzeWithGoogleVision(imageData);
      
      if (googleResult.success) {
        setAiResult(`[Google Vision] ${googleResult.analysis}`);
        const models = parseGoogleResponse(googleResult.analysis);
        if (models.length > 0) {
          setDetectedModels(models);
          return;
        }
      }

      // ETAP 2: OpenAI Vision API (premium, najinteligentniejsze)
      setProcessingStage('🧠 OpenAI GPT-4 Vision - premium analiza...');
      const openAiResult = await analyzeWithOpenAI(imageData);
      
      if (openAiResult.success) {
        setAiResult(`[OpenAI GPT-4] ${openAiResult.analysis}`);
        const models = parseAIResponse(openAiResult.analysis);
        setDetectedModels(models);
        return;
      }

      // ETAP 3: OCR fallback (darmowe, podstawowe)
      setProcessingStage('🔍 Tesseract OCR - darmowy backup...');
      const ocrResult = await fallbackOCR(imageData);
      setAiResult(`[OCR Backup] ${ocrResult.text}`);
      const models = analyzeOCRText(ocrResult.text);
      setDetectedModels(models);

    } catch (error) {
      console.error('Błąd analizy AI:', error);
      setAiResult('Błąd podczas analizy obrazu');
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // OpenAI Vision Analysis
  const analyzeWithOpenAI = async (imageData) => {
    try {
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const response = await fetch('/api/openai-vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: `Analizuj tę tabliczkę znamionową urządzenia AGD. Znajdź i wyodrębnij:
          1. Markę urządzenia (BOSCH, SAMSUNG, WHIRLPOOL, ELECTROLUX, LG, itp.)
          2. Model/numer katalogowy (np. WAG28461BY, WW90T4540AE)
          3. Typ urządzenia (pralka, zmywarka, lodówka, piekarnik, itp.)
          4. Pojemność/rozmiar jeśli widoczny
          5. Numer seryjny jeśli widoczny
          6. Inne ważne informacje techniczne
          
          Odpowiedź w formacie JSON:
          {
            "brand": "MARKA",
            "model": "MODEL",
            "type": "TYP_URZADZENIA",
            "capacity": "POJEMNOSC",
            "serialNumber": "NUMER_SERYJNY",
            "confidence": "high/medium/low",
            "additionalInfo": "DODATKOWE_INFO"
          }`
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, analysis: result.analysis };
      }
      
      return { success: false, error: 'OpenAI API error' };
    } catch (error) {
      console.error('OpenAI Vision error:', error);
      return { success: false, error: error.message };
    }
  };

  // Google Vision Analysis  
  const analyzeWithGoogleVision = async (imageData) => {
    try {
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const response = await fetch('/api/google-vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, analysis: result.text };
      }
      
      return { success: false, error: 'Google Vision API error' };
    } catch (error) {
      console.error('Google Vision error:', error);
      return { success: false, error: error.message };
    }
  };

  // OCR Fallback (gdy AI APIs nie działają)
  const fallbackOCR = async (imageData) => {
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker('eng', 1, {
      logger: m => console.log('OCR:', m)
    });

    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/().: ',
      tessedit_pageseg_mode: '6'
    });

    const { data: { text, confidence } } = await worker.recognize(imageData);
    await worker.terminate();
    
    return { text, confidence };
  };

  // Parsowanie odpowiedzi OpenAI
  const parseAIResponse = (analysis) => {
    try {
      const parsed = JSON.parse(analysis);
      
      // Sprawdź w bazie danych
      const dbModel = findModelInDatabase(parsed.model);
      
      if (dbModel) {
        return [{
          detected: parsed.model,
          clean: parsed.model,
          brand: parsed.brand,
          model: parsed.model,
          name: dbModel.name,
          type: parsed.type,
          confidence: 'high',
          source: 'ai_database',
          capacity: parsed.capacity,
          serialNumber: parsed.serialNumber,
          additionalInfo: parsed.additionalInfo,
          common_parts: dbModel.common_parts || []
        }];
      } else {
        // Model nie w bazie, ale AI go rozpoznało
        return [{
          detected: parsed.model,
          clean: parsed.model,
          brand: parsed.brand,
          model: parsed.model,
          name: `${parsed.brand} ${parsed.model}`,
          type: parsed.type,
          confidence: parsed.confidence,
          source: 'ai_new',
          capacity: parsed.capacity,
          serialNumber: parsed.serialNumber,
          additionalInfo: parsed.additionalInfo,
          common_parts: []
        }];
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return [];
    }
  };

  // Parsowanie odpowiedzi Google Vision
  const parseGoogleResponse = (text) => {
    return analyzeOCRText(text);
  };

  // Analiza tekstu OCR (z poprzedniej wersji)
  const analyzeOCRText = (text) => {
    const foundModels = [];
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9\s\-\/.():]/g, ' ');
    
    const enhancedPatterns = [
      ...modelsDatabase.ocr_patterns,
      {
        pattern: '([A-Z]{2,4}[0-9]{4,8}[A-Z]{0,4})',
        description: 'Model AGD standard'
      }
    ];

    enhancedPatterns.forEach(patternObj => {
      const regex = new RegExp(patternObj.pattern, 'gi');
      const matches = cleanText.match(regex);
      
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.replace(/[^A-Z0-9]/g, '');
          const modelInfo = findModelInDatabase(cleanMatch);
          
          if (modelInfo) {
            foundModels.push({
              detected: match,
              clean: cleanMatch,
              ...modelInfo,
              confidence: 'medium',
              source: 'ocr_database'
            });
          } else if (cleanMatch.length >= 6) {
            foundModels.push({
              detected: match,
              clean: cleanMatch,
              name: `Model OCR: ${cleanMatch}`,
              type: 'Nierozpoznany typ',
              confidence: 'low',
              source: 'ocr_only'
            });
          }
        });
      }
    });

    return foundModels.filter((model, index, self) => 
      index === self.findIndex(m => m.clean === model.clean)
    );
  };

  // Wyszukiwanie w bazie danych
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

  // Obsługa wyboru pliku
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Ponowne uruchomienie kamery
  const restartCamera = () => {
    setCapturedImage(null);
    setAiResult('');
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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-xl font-bold">
            <FiBrain className="inline mr-2" />
            AI Scanner - Analiza tabliczki
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg"
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
                        <FiZap className="inline mr-2" />
                        <p className="text-sm">Wyceluj w tabliczkę znamionową</p>
                        <p className="text-xs opacity-75">AI automatycznie rozpozna wszystkie dane</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Przyciski kontrolne */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={capturePhoto}
                  disabled={!!cameraError || !stream}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  <FiCamera className="h-5 w-5 mr-2" />
                  Zrób zdjęcie AI
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FiCamera className="h-5 w-5 mr-2" />
                  Z galerii
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
          ) : (
            <div className="space-y-4">
              {/* Przechwycone zdjęcie */}
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full rounded-lg max-h-64 object-contain bg-gray-100"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <FiLoader className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">{processingStage}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Przyciski akcji */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => processAI(capturedImage)}
                  disabled={isProcessing}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isProcessing ? (
                    <FiLoader className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <FiBrain className="h-5 w-5 mr-2" />
                  )}
                  {isProcessing ? 'Analizuję AI...' : 'Analizuj z AI'}
                </button>

                <button
                  onClick={restartCamera}
                  className="flex items-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FiRefreshCw className="h-5 w-5 mr-2" />
                  Nowe zdjęcie
                </button>
              </div>

              {/* Wyniki AI */}
              {aiResult && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FiEye className="mr-2" />
                    Analiza AI:
                  </h3>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border max-h-32 overflow-y-auto">
                    {aiResult}
                  </div>
                </div>
              )}

              {/* Wykryte modele */}
              {detectedModels.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <FiZap className="mr-2" />
                    Rozpoznane modele ({detectedModels.length}):
                  </h3>
                  {detectedModels.map((model, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        model.confidence === 'high' && model.source?.includes('ai')
                          ? 'border-green-300 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100'
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
                            
                            {model.source?.includes('ai') && (
                              <span className="px-2 py-1 bg-gradient-to-r from-green-200 to-blue-200 text-green-800 text-xs rounded-full flex items-center">
                                <FiBrain className="h-3 w-3 mr-1" />
                                AI Recognition
                              </span>
                            )}
                            
                            {model.confidence === 'high' && (
                              <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                                Wysoka pewność
                              </span>
                            )}
                          </div>
                          
                          {model.brand && (
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {model.brand} - {model.name}
                            </p>
                          )}
                          
                          {model.type && (
                            <p className="text-xs text-gray-600 mb-1">{model.type}</p>
                          )}

                          {model.capacity && (
                            <p className="text-xs text-gray-600 mb-1">Pojemność: {model.capacity}</p>
                          )}

                          {model.serialNumber && (
                            <p className="text-xs text-gray-500 mb-1">S/N: {model.serialNumber}</p>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-1 text-xs">
                              {model.source?.includes('ai') && (
                                <span className="text-blue-600">🤖 AI</span>
                              )}
                              {model.source?.includes('database') && (
                                <span className="text-green-600">📚 Baza</span>
                              )}
                              {model.common_parts?.length > 0 && (
                                <span className="text-purple-600">🔧 {model.common_parts.length} części</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex items-center">
                          <FiCheck className={`h-6 w-6 ${
                            model.source?.includes('ai') ? 'text-blue-600' :
                            model.confidence === 'high' ? 'text-green-600' :
                            'text-yellow-600'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-xs text-gray-500 mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    🤖 <strong>AI Scanner:</strong> Zaawansowana analiza obrazu z rozpoznawaniem kontekstu, 
                    marki i modelu urządzenia. Znacznie dokładniejszy niż tradycyjny OCR!
                  </div>
                </div>
              )}

              {aiResult && detectedModels.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FiBrain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>AI nie rozpoznało modelu na zdjęciu.</p>
                  <p className="text-sm">Spróbuj z lepszym oświetleniem lub kątem.</p>
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