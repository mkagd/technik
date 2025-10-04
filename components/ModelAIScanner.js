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
  FiCpu,
  FiImage,
  FiGrid,
  FiTrash2
} from 'react-icons/fi';
// modelsDatabase will be loaded dynamically

export default function ModelAIScanner({ isOpen, onClose, onModelDetected }) {
  const [modelsDatabase, setModelsDatabase] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [aiResult, setAiResult] = useState('');
  const [detectedModels, setDetectedModels] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [processingStage, setProcessingStage] = useState('');
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const [showSavedImages, setShowSavedImages] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load models database
  useEffect(() => {
    const loadModelsDatabase = async () => {
      try {
        const response = await fetch('/data/modelsDatabase.json');
        const data = await response.json();
        setModelsDatabase(data);
      } catch (error) {
        console.error('Failed to load models database:', error);
      }
    };
    
    loadModelsDatabase();
  }, []);

  // Inicjalizacja kamery
  const initCamera = async () => {
    try {
      setCameraError(null);
      
      // Sprawdź czy przeglądarka obsługuje getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Przeglądarka nie obsługuje kamery');
      }

      // Poproś o uprawnienia z różnymi opcjami fallback
      let constraints = {
        video: {
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          facingMode: 'environment' // Kamera tylna na telefonie
        }
      };

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (envError) {
        // Jeśli kamera tylna nie działa, spróbuj dowolną kamerę
        console.warn('Nie można użyć kamery tylnej, próbuję dowolną kamerę');
        constraints.video.facingMode = 'user';
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      }
    } catch (error) {
      console.error('Błąd dostępu do kamery:', error);
      
      let errorMessage = 'Nie można uzyskać dostępu do kamery.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Dostęp do kamery został zablokowany. Sprawdź uprawnienia w ustawieniach przeglądarki.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'Nie znaleziono kamery. Sprawdź czy kamera jest podłączona.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Kamera jest używana przez inną aplikację.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Kamera nie spełnia wymagań. Spróbuj z inną kamerą.';
      }
      
      setCameraError(errorMessage);
    }
  };

  // Zatrzymanie kamery
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Funkcjonalność latarki
  const toggleFlashlight = async () => {
    if (!stream) {
      console.warn('🔦 Brak dostępu do stream - resetuję stan latarki');
      setFlashlightOn(false);
      return;
    }
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        console.warn('🔦 Brak video track - resetuję stan latarki');
        setFlashlightOn(false);
        return;
      }
      
      const capabilities = videoTrack.getCapabilities();
      
      if (capabilities.torch) {
        const newFlashlightState = !flashlightOn;
        await videoTrack.applyConstraints({
          advanced: [{ torch: newFlashlightState }]
        });
        setFlashlightOn(newFlashlightState);
        console.log(`🔦 Latarka ${newFlashlightState ? 'włączona' : 'wyłączona'}`);
      } else {
        alert('Latarka nie jest dostępna na tym urządzeniu');
        setFlashlightOn(false);
      }
    } catch (error) {
      console.error('Błąd obsługi latarki:', error);
      setFlashlightOn(false); // Reset stanu przy błędzie
      alert('Nie można zmienić stanu latarki');
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
          userId: metadata.userId || 'AI_SCANNER',
          description: `AI Scanner - ${metadata.source || 'Camera'}`,
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

  // Kompresja obrazu
  const compressImage = (canvas, quality = 0.6, maxWidth = 600) => {
    const context = canvas.getContext('2d');
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    // Oblicz nowe wymiary zachowując proporcje
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    if (originalWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = (originalHeight * maxWidth) / originalWidth;
    }
    
    // Stwórz nowy canvas o docelowych wymiarach
    const compressedCanvas = document.createElement('canvas');
    compressedCanvas.width = newWidth;
    compressedCanvas.height = newHeight;
    const compressedContext = compressedCanvas.getContext('2d');
    
    // Narysuj skalowany obraz
    compressedContext.drawImage(canvas, 0, 0, newWidth, newHeight);
    
    const compressedDataUrl = compressedCanvas.toDataURL('image/jpeg', quality);
    const originalSize = (originalWidth * originalHeight * 4) / 1024; // Rough estimate in KB
    const compressedSize = compressedDataUrl.length / 1024; // Rough estimate in KB
    
    console.log(`🖼️ Image compression: ${originalWidth}x${originalHeight} -> ${newWidth}x${newHeight}`);
    console.log(`📦 Size: ~${originalSize.toFixed(0)}KB -> ~${compressedSize.toFixed(0)}KB`);
    
    return compressedDataUrl;
  };

  // Przechwycenie zdjęcia
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0);
    const compressedImageDataUrl = compressImage(canvas, 0.6, 600);
    
    // NAJPIERW wyłącz latarkę (zanim zatrzymamy kamerę)
    if (flashlightOn && stream) {
      try {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities().torch) {
          await videoTrack.applyConstraints({
            advanced: [{ torch: false }]
          });
        }
        setFlashlightOn(false);
        console.log('🔦 Latarka wyłączona po zrobieniu zdjęcia');
      } catch (error) {
        console.error('Błąd wyłączania latarki:', error);
        setFlashlightOn(false); // Wymuś reset stanu
      }
    }
    
    // Zapisz zdjęcie lokalnie z metadanymi
    saveImageLocally(compressedImageDataUrl, {
      resolution: `${canvas.width}x${canvas.height}`,
      flashlight: flashlightOn ? 'Tak' : 'Nie',
      source: 'Kamera AI'
    });
    
    setCapturedImage(compressedImageDataUrl);
    stopCamera();
  };

  // Analiza AI - TYLKO GPT-4o Mini (bez fallback APIs)
  const processAI = async (imageData) => {
    setIsProcessing(true);
    setAiResult('');
    setDetectedModels([]);

    try {
      // TYLKO OpenAI GPT-4o Mini - bez fallback APIs
      setProcessingStage('📋 Analizowanie tabliczki znamionowej...');
      const openAiResult = await analyzeWithOpenAI(imageData);
      
      if (openAiResult.success) {
        console.log('🤖 OpenAI success, raw response:', openAiResult.analysis);
        setAiResult(`✅ Rozpoznano dane z tabliczki: ${openAiResult.analysis}`);
        const models = parseAIResponse(openAiResult.analysis);
        console.log('🔍 Parsed models:', models);
        if (models.length > 0) {
          setDetectedModels(models);
          return;
        } else {
          setAiResult('❌ Nie udało się rozpoznać modelu na zdjęciu. Spróbuj z lepszym oświetleniem.');
          console.log('❌ No models detected from AI response');
        }
      } else {
        setAiResult(`❌ Skaner niedostępny: ${openAiResult.error}`);
        console.error('❌ GPT-4o Mini error:', openAiResult.error);
      }

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
          
          WAŻNE: W polu "additionalInfo" umieść CAŁY ORYGINALNY TEKST z tabliczki, włączając wszystkie napisy jak "Typ:", "Model:", "S/N:" itp.
          
          Odpowiedź w formacie JSON:
          {
            "brand": "MARKA",
            "model": "MODEL",
            "type": "TYP_URZADZENIA",
            "capacity": "POJEMNOSC",
            "serialNumber": "NUMER_SERYJNY",
            "confidence": "high/medium/low",
            "additionalInfo": "CAŁY_ORYGINALNY_TEKST_Z_TABLICZKI_WRAZ_Z_OPISAMI"
          }`
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, analysis: result.analysis };
      } else {
        const errorText = await response.text();
        console.error('OpenAI API HTTP Error:', response.status, errorText);
        return { success: false, error: `OpenAI API error (${response.status}): ${errorText}` };
      }
    } catch (error) {
      console.error('OpenAI Vision error:', error);
      return { success: false, error: error.message };
    }
  };

  // OCR.space Analysis (DARMOWE!)
  const analyzeWithOCRSpace = async (imageData) => {
    try {
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const response = await fetch('/api/ocr-space', {
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
        return { 
          success: result.success, 
          analysis: result.analysis,
          confidence: result.confidence 
        };
      }
      
      return { success: false, error: 'OCR.space API error' };
    } catch (error) {
      console.error('OCR.space error:', error);
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

  // Funkcja do inteligentnego parsowania modelu i typu
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
      
      // WARUNEK 3: Dla Amica - sprawdź czy w tekście jest "TYPE/TYP:" i to jest model (dla WSZYSTKICH urządzeń Amica)
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

  // Parsowanie odpowiedzi OpenAI
  const parseAIResponse = (analysis) => {
    try {
      console.log('🔍 Parsing AI response:', analysis);
      
      // Spróbuj najpierw czysty JSON parse
      let parsed;
      try {
        parsed = JSON.parse(analysis);
      } catch (jsonError) {
        // Jeśli nie można sparsować jako JSON, spróbuj wyciągnąć JSON z tekstu
        console.log('⚠️ Direct JSON parse failed, trying to extract JSON from text');
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      }
      
      console.log('✅ Parsed JSON:', parsed);
      
      // Sprawdź czy mamy podstawowe dane
      if (!parsed.brand && !parsed.model) {
        console.log('❌ No brand or model found in parsed data');
        return [];
      }
      
      // Inteligentne parsowanie modelu i typu
      const { finalModel, finalType, finalName } = smartParseModelAndType(parsed);
      console.log('🧠 Smart parsing result:', { finalModel, finalType, finalName });
      
      // Sprawdź w bazie danych
      const dbModel = findModelInDatabase(finalModel);
      
      if (dbModel) {
        console.log('✅ Found in database:', dbModel);
        return [{
          detected: finalModel,
          clean: finalModel,
          brand: parsed.brand,
          model: finalModel,
          name: dbModel.name || finalName,
          type: dbModel.type || finalType,
          confidence: 'high',
          source: 'ai_database',
          capacity: parsed.capacity,
          serialNumber: parsed.serialNumber,
          additionalInfo: parsed.additionalInfo,
          common_parts: dbModel.common_parts || []
        }];
      } else {
        // Model nie w bazie, ale AI go rozpoznało
        console.log('ℹ️ Not in database, creating new model entry');
        return [{
          detected: finalModel,
          clean: finalModel,
          brand: parsed.brand,
          model: finalModel,
          name: finalName,
          type: finalType,
          confidence: parsed.confidence || 'medium',
          source: 'ai_new',
          capacity: parsed.capacity,
          serialNumber: parsed.serialNumber,
          additionalInfo: parsed.additionalInfo,
          common_parts: []
        }];
      }
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      console.error('❌ Original analysis text:', analysis);
      return [];
    }
  };

  // Parsowanie odpowiedzi OCR.space
  const parseOCRSpaceResponse = (text) => {
    return analyzeOCRText(text);
  };

  // Parsowanie odpowiedzi Google Vision
  const parseGoogleResponse = (text) => {
    return analyzeOCRText(text);
  };

  // Analiza tekstu OCR (z poprzedniej wersji)
  const analyzeOCRText = (text) => {
    if (!modelsDatabase) return [];
    
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
    if (!modelsDatabase) return null;
    
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
        // Skompresuj obraz z galerii
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          
          const compressedImageDataUrl = compressImage(canvas, 0.6, 600);
          
          // Zapisz zdjęcie z galerii lokalnie
          saveImageLocally(compressedImageDataUrl, {
            fileName: file.name,
            size: Math.round(file.size / 1024) + ' KB',
            source: 'Galeria AI',
            resolution: `${img.width}x${img.height}`
          });
          
          setCapturedImage(compressedImageDataUrl);
          stopCamera();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Ponowne uruchomienie kamery
  const restartCamera = () => {
    setCapturedImage(null);
    setAiResult('');
    setDetectedModels([]);
    setFlashlightOn(false); // Reset stanu latarki
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
      setFlashlightOn(false); // Reset stanu latarki przy zamykaniu
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-xl font-bold">
            <FiCpu className="inline mr-2" />
            Skaner tabliczek znamionowych
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
                      
                      {/* Instrukcje dla użytkownika */}
                      <div className="text-xs text-gray-300 mb-4 max-w-md">
                        <p className="mb-2"><strong>💡 Jak włączyć kamerę:</strong></p>
                        <ul className="text-left space-y-1">
                          <li>📱 <strong>Na telefonie:</strong> Odśwież stronę i zezwól na dostęp</li>
                          <li>🔒 <strong>Chrome:</strong> Kliknij ikonę kłódki obok adresu</li>
                          <li>🔧 <strong>Inne:</strong> Sprawdź ustawienia przeglądarki</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium mr-2"
                        >
                          Odśwież stronę
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
                        >
                          Wybierz z galerii
                        </button>
                      </div>
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
              <div className="space-y-4">
                {/* Główne przyciski */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={capturePhoto}
                    disabled={!!cameraError || !stream}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
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
                      <FiCpu className="h-5 w-5 mr-2" />
                    )}
                    {isProcessing ? 'Analizuję...' : 'Analizuj tabliczkę'}
                  </button>                <button
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
                    Wyniki analizy:
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
                                <FiCpu className="h-3 w-3 mr-1" />
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
                    📋 <strong>Inteligentny skaner:</strong> Zaawansowana analiza obrazu z automatycznym rozpoznawaniem 
                    marki i modelu urządzenia z tabliczki znamionowej.
                  </div>
                </div>
              )}

              {aiResult && detectedModels.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FiCpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nie rozpoznano modelu na zdjęciu.</p>
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
