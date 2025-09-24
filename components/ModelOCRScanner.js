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
  FiSearch
} from 'react-icons/fi';
import modelsDatabase from '../data/modelsDatabase.json';

export default function ModelOCRScanner({ isOpen, onClose, onModelDetected }) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [detectedModels, setDetectedModels] = useState([]);
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
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  // Przetwarzanie OCR
  const processOCR = async (imageData) => {
    setIsProcessing(true);
    setOcrResult('');
    setDetectedModels([]);

    try {
      const worker = await createWorker('pol+eng', 1, {
        logger: m => console.log(m)
      });

      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/().: ',
        tessedit_pageseg_mode: '6'
      });

      const { data: { text } } = await worker.recognize(imageData);
      setOcrResult(text);

      // Analiza tekstu i wyszukiwanie modeli
      const foundModels = analyzeOCRText(text);
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
    const patterns = modelsDatabase.ocr_patterns;

    patterns.forEach(patternObj => {
      const regex = new RegExp(patternObj.pattern, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        matches.forEach(match => {
          // Sprawdź czy model istnieje w bazie
          const cleanMatch = match.replace(/[^A-Z0-9]/g, '');
          const modelInfo = findModelInDatabase(cleanMatch);
          
          if (modelInfo) {
            foundModels.push({
              detected: match,
              clean: cleanMatch,
              ...modelInfo,
              confidence: 'high'
            });
          } else {
            // Dodaj jako potencjalny model
            foundModels.push({
              detected: match,
              clean: cleanMatch,
              name: 'Model nieznany',
              type: 'Nierozpoznany',
              confidence: 'low'
            });
          }
        });
      }
    });

    return foundModels;
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
                  <h3 className="font-semibold text-gray-800">Wykryte modele:</h3>
                  {detectedModels.map((model, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        model.confidence === 'high'
                          ? 'border-green-300 bg-green-50 hover:bg-green-100'
                          : 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                      }`}
                      onClick={() => selectModel(model)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg">{model.clean}</span>
                            {model.confidence === 'high' && (
                              <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                                Rozpoznany
                              </span>
                            )}
                            {model.confidence === 'low' && (
                              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                                Nieznany
                              </span>
                            )}
                          </div>
                          
                          {model.brand && (
                            <p className="text-sm text-gray-600 mt-1">
                              {model.brand} - {model.name}
                            </p>
                          )}
                          
                          {model.type && (
                            <p className="text-xs text-gray-500">{model.type}</p>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-1">
                            Wykryto: "{model.detected}"
                          </p>
                        </div>
                        
                        <FiCheck className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  ))}
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