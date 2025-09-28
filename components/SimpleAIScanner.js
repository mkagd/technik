// components/SimpleAIScanner.js
// Uproszczona wersja ModelAIScanner dla strony ai-scanner

import { useState, useRef, useEffect } from 'react';
import {
  FiCamera,
  FiX,
  FiCheck,
  FiLoader,
  FiRefreshCw,
  FiZap,
  FiCpu
} from 'react-icons/fi';

// Funkcja do inteligentnego parsowania modelu i typu (kopiowana z ModelAIScanner)
const smartParseModelAndType = (parsed) => {
  let finalModel = parsed.model;
  let finalType = parsed.type;
  let finalName = parsed.name || `${parsed.brand} ${parsed.model}`;
  
  console.log('🔍 Smart parsing input:', { brand: parsed.brand, model: parsed.model, type: parsed.type });
  
  // Lista marek które często mają model w polu "type"
  const brandsWithModelInType = ['AMICA', 'WHIRLPOOL', 'CANDY', 'HOOVER'];
  
  if (brandsWithModelInType.includes(parsed.brand?.toUpperCase())) {
    
    // WARUNEK 1: Jeśli typ wygląda jak kod modelu (zawiera cyfry i litery w formacie modelu)
    const typeAsModelPattern = /^[A-Z]{2,}[0-9]{3,}[A-Z]*$/i;
    const isTypeAModel = parsed.type && typeAsModelPattern.test(parsed.type.replace(/\s+/g, ''));
    
    // WARUNEK 2: Jeśli model to słowo opisowe bez cyfr (jak "Płyta indukcyjna")
    const isModelDescriptive = parsed.model && !parsed.model.match(/[0-9]/) && parsed.model.length > 8;
    
    // WARUNEK 3: Dla Amica - sprawdź czy w tekście jest "TYPE/TYP:" i to jest model
    let isAmicaWithTypeAsModel = false;
    let extractedAmicaModel = null;
    let allText = '';
    
    if (parsed.brand?.toUpperCase() === 'AMICA') {
      // Sprawdź w różnych polach czy jest "TYPE/TYP:" - to będzie model dla WSZYSTKICH urządzeń Amica
      allText = `${parsed.model || ''} ${parsed.type || ''} ${parsed.additionalInfo || ''} ${parsed.serialNumber || ''} ${parsed.capacity || ''}`;
      console.log(`🔍 Amica detected! Full parsed object:`, parsed);
      console.log(`🔍 Searching for "TYPE/TYP:" in Amica text: "${allText}"`);
      
      // Szukaj różnych wariantów TYPE/TYP - uwzględnij również bez dwukropka
      let typMatch = allText.match(/(?:TYPE\s*\/\s*TYP|Typ|Type|TYP):\s*([A-Z0-9+\-\/\(\)\.\s]+)/i);
      
      // Jeśli nie znaleziono z dwukropkiem, spróbuj bez dwukropka (czasem OpenAI może pominąć)
      if (!typMatch) {
        typMatch = allText.match(/(?:TYPE\s*\/\s*TYP|TYPE|TYP)\s+([A-Z0-9+\-\/\(\)\.\s]{8,})/i);
      }
      
      // Jeśli nie znaleziono w allText, sprawdź każde pole osobno
      if (!typMatch) {
        for (const field of ['model', 'type', 'additionalInfo', 'serialNumber', 'capacity']) {
          const fieldValue = parsed[field];
          if (fieldValue && typeof fieldValue === 'string') {
            typMatch = fieldValue.match(/(?:TYPE\s*\/\s*TYP|Typ|Type|TYP):\s*([A-Z0-9+\-\/\(\)\.\s]+)/i);
            if (!typMatch) {
              typMatch = fieldValue.match(/(?:TYPE\s*\/\s*TYP|TYPE|TYP)\s+([A-Z0-9+\-\/\(\)\.\s]{8,})/i);
            }
            if (typMatch) {
              console.log(`🔧 Found "TYPE/TYP:" in field "${field}": "${fieldValue}"`);
              break;
            }
          }
        }
      }
      
      if (typMatch) {
        extractedAmicaModel = typMatch[1].trim(); // Usuń białe znaki
        isAmicaWithTypeAsModel = true;
        console.log(`🔧 Found Amica "TYPE/TYP:" pattern: "${extractedAmicaModel}"`);
      } else {
        console.log(`❌ No "TYPE/TYP:" pattern found for Amica. Trying direct type field...`);
        // Fallback - dla Amica często TYPE to właściwy model, nawet bez etykiety
        if (parsed.type && parsed.type.length >= 8 && parsed.type.match(/[0-9]/)) {
          extractedAmicaModel = parsed.type;
          isAmicaWithTypeAsModel = true;
          console.log(`🔧 Using Amica type field as model: "${parsed.type}"`);
        }
      }
    }
    
    if (isTypeAModel || isModelDescriptive || isAmicaWithTypeAsModel) {
      console.log(`🔧 Detected model in type field for ${parsed.brand}: "${parsed.type}" (pattern match: ${isTypeAModel}, descriptive model: ${isModelDescriptive}, Amica special: ${isAmicaWithTypeAsModel})`);
      
      // Dla Amica z "Typ:" użyj wyciągniętego modelu
      if (isAmicaWithTypeAsModel && extractedAmicaModel) {
        finalModel = extractedAmicaModel;
      } else {
        // Zamień miejscami: typ staje się modelem
        finalModel = parsed.type;
      }
      
      // Określ właściwy typ na podstawie marki i wzorca modelu
      if (parsed.brand?.toUpperCase() === 'AMICA') {
        if (finalModel.startsWith('PI') || allText.toLowerCase().includes('indukcyj')) {
          finalType = 'Płyta indukcyjna';
        } else if (finalModel.startsWith('PC') || allText.toLowerCase().includes('ceramiczn')) {
          finalType = 'Płyta ceramiczna';
        } else if (finalModel.startsWith('PG') || allText.toLowerCase().includes('gazow')) {
          finalType = 'Płyta gazowa';
        } else if (finalModel.includes('OKA') || finalModel.includes('OKC') || allText.toLowerCase().includes('okap')) {
          finalType = 'Okap kuchenny';
        } else if (allText.toLowerCase().includes('piekarnik') || allText.toLowerCase().includes('oven')) {
          finalType = 'Piekarnik';
        } else {
          finalType = isModelDescriptive ? parsed.model : 'Urządzenie AGD';
        }
      } else {
        finalType = isModelDescriptive ? parsed.model : 'Urządzenie AGD';
      }
      
      finalName = `${parsed.brand} ${finalModel}`;
      console.log(`✅ After swap - Model: "${finalModel}", Type: "${finalType}"`);
    }
  }
  
  // Jeśli model i typ są nadal takie same, ostateczna korekta
  if (finalModel === finalType) {
    if (parsed.brand?.toUpperCase() === 'AMICA') {
      finalType = 'Urządzenie AGD Amica';
    } else {
      finalType = 'Urządzenie AGD';
    }
  }
  
  console.log('✅ Smart parsing result:', { finalModel, finalType, finalName });
  return { finalModel, finalType, finalName };
};

export default function SimpleAIScanner({ onModelDetected, employeeInfo }) {
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
          facingMode: 'environment'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
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
    setIsScanning(false);
  };

  // Przechwycenie zdjęcia
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Ogranicz rozdzielczość do max 600px szerokości
    const maxWidth = 600;
    let { videoWidth, videoHeight } = video;
    
    if (videoWidth > maxWidth) {
      videoHeight = (videoHeight * maxWidth) / videoWidth;
      videoWidth = maxWidth;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    context.drawImage(video, 0, 0, videoWidth, videoHeight);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.6); // Bardzo wysoka kompresja
    
    console.log('📸 Zdjęcie z kamery skompresowane do:', (imageDataUrl.length / 1024 / 1024).toFixed(2), 'MB');
    
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  // Analiza AI - TYLKO GPT-4o Mini (bez fallback APIs)
  const processAI = async (imageData) => {
    setIsProcessing(true);
    setAiResult('');
    setDetectedModels([]);

    try {
      setProcessingStage('🤖 GPT-4o Mini - analizuje tabliczkę znamionową...');
      
      const response = await fetch('/api/openai-vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
          prompt: 'Analizuj tabliczkę znamionową urządzenia AGD - TYLKO GPT-4o Mini',
          force_openai_only: true // Wymusza użycie tylko OpenAI
        })
      });

      const result = await response.json();
      
      if (result.success && result.source && result.source.includes('GPT-4o Mini')) {
        setAiResult(`✅ [${result.source}] ${result.analysis}`);
        
        try {
          const parsedAnalysis = JSON.parse(result.analysis);
          
          // Inteligentne parsowanie dla Amica - sprawdź czy "Typ:" to model
          const { finalModel, finalType, finalName } = smartParseModelAndType(parsedAnalysis);
          
          const model = {
            id: Date.now(),
            brand: parsedAnalysis.brand || 'Nieznana marka',
            model: finalModel || parsedAnalysis.model || 'Nieznany model',
            name: finalName || `${parsedAnalysis.brand} ${finalModel || parsedAnalysis.model}`.trim(),
            type: finalType || parsedAnalysis.type || 'Nieznany typ',
            capacity: parsedAnalysis.capacity,
            serialNumber: parsedAnalysis.serialNumber,
            confidence: parsedAnalysis.confidence || 'medium',
            source: 'gpt4o-mini',
            additionalInfo: parsedAnalysis.additionalInfo,
            dateAdded: new Date().toISOString(),
            addedBy: employeeInfo?.name || 'Serwisant',
            aiProvider: 'OpenAI GPT-4o Mini'
          };
          
          setDetectedModels([model]);
          
          if (onModelDetected) {
            onModelDetected([model]);
          }
        } catch (parseError) {
          console.error('Błąd parsowania odpowiedzi GPT-4o Mini:', parseError);
          setAiResult('❌ Błąd parsowania odpowiedzi GPT-4o Mini. Spróbuj ponownie.');
        }
      } else {
        // Jeśli to nie GPT-4o Mini lub błąd - wyświetl konkretny błąd
        const errorMessage = result.error || 'GPT-4o Mini niedostępny. Sprawdź klucz API lub spróbuj ponownie.';
        setAiResult(`❌ ${errorMessage}`);
        console.error('GPT-4o Mini nie odpowiedział poprawnie:', result);
      }
    } catch (error) {
      console.error('Błąd połączenia z GPT-4o Mini:', error);
      setAiResult('❌ Błąd połączenia z GPT-4o Mini. Sprawdź połączenie i spróbuj ponownie.');
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // Funkcja kompresji obrazu
  const compressImage = (file, maxWidth = 600, quality = 0.6) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Oblicz nowe wymiary z zachowaniem proporcji
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Narysuj skompresowany obraz
        ctx.drawImage(img, 0, 0, width, height);
        
        // Konwertuj do base64 z kompresją
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      const reader = new FileReader();
      reader.onload = (e) => img.src = e.target.result;
      reader.readAsDataURL(file);
    });
  };

  // Upload pliku
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      console.log('📁 Oryginalna wielkość pliku:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Kompresuj obraz przed zapisaniem
      const compressedImage = await compressImage(file, 600, 0.6);
      
      console.log('📦 Skompresowana wielkość:', (compressedImage.length / 1024 / 1024).toFixed(2), 'MB');
      
      setCapturedImage(compressedImage);
    } catch (error) {
      console.error('Błąd kompresji obrazu:', error);
      // Fallback - użyj oryginalnego pliku
      const reader = new FileReader();
      reader.onload = (e) => setCapturedImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setAiResult('');
    setDetectedModels([]);
    setIsProcessing(false);
    setCameraError(null);
    setProcessingStage('');
    stopCamera();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {!capturedImage && !isScanning && (
        <div className="text-center p-8">
          <FiCamera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Skanowanie modelu urządzenia
          </h3>
          <p className="text-gray-600 mb-6">
            Wykonaj zdjęcie tabliczki znamionowej, a AI automatycznie rozpozna model
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={initCamera}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              <FiCamera className="h-5 w-5 mr-2" />
              Użyj kamery
            </button>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FiRefreshCw className="h-5 w-5 mr-2" />
              Wybierz plik
            </button>
          </div>
          
          {cameraError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {cameraError}
            </div>
          )}
        </div>
      )}

      {isScanning && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover bg-black"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-white border-dashed w-3/4 h-3/4 rounded-lg opacity-50"></div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={capturePhoto}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiCamera className="h-5 w-5 mr-2 inline" />
              Zrób zdjęcie
            </button>
            <button
              onClick={stopCamera}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FiX className="h-5 w-5 mr-2 inline" />
              Anuluj
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Zdjęcie przechwycone
            </h3>
            <button
              onClick={resetScanner}
              className="text-gray-600 hover:text-gray-800"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          
          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={() => processAI(capturedImage)}
              disabled={isProcessing}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <FiLoader className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <FiZap className="h-5 w-5 mr-2" />
              )}
              {isProcessing ? 'Analizuję...' : 'Analizuj z AI'}
            </button>
            
            <button
              onClick={resetScanner}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Nowe zdjęcie
            </button>
          </div>

          {processingStage && (
            <div className="text-center py-4">
              <FiLoader className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">{processingStage}</p>
            </div>
          )}

          {detectedModels.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FiCheck className="h-5 w-5 mr-2 text-green-600" />
                Rozpoznane modele ({detectedModels.length})
              </h4>
              <div className="space-y-3">
                {detectedModels.map((model, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {model.brand} {model.model}
                        </h5>
                        <p className="text-sm text-gray-600">{model.type}</p>
                        {model.capacity && (
                          <p className="text-sm text-gray-600">Pojemność: {model.capacity}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          model.confidence === 'high' ? 'bg-green-100 text-green-800' :
                          model.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {model.confidence === 'high' ? 'Wysoka pewność' :
                           model.confidence === 'medium' ? 'Średnia pewność' : 'Niska pewność'}
                        </span>
                      </div>
                    </div>
                    {model.additionalInfo && (
                      <p className="text-sm text-gray-700 mt-2">
                        ℹ️ {model.additionalInfo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiResult && detectedModels.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FiCpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>AI nie rozpoznało modelu na zdjęciu.</p>
              <p className="text-sm">Spróbuj z lepszym oświetleniem lub kątem.</p>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}