// pages/api/ocr/device-plate.js
// Rozszerzony endpoint OCR - analizuje tabliczkę + sugeruje części
// Integruje istniejący SimpleAIScanner z systemem magazynowym

import path from 'path';
import fs from 'fs/promises';

const OCR_FILE = path.join(process.cwd(), 'data', 'device-plate-ocr.json');

// Import funkcji sugestii części
async function getSuggestedParts(brand, model, employeeId, symptoms = []) {
  try {
    // Wywołaj endpoint suggest-parts wewnętrznie
    const suggestModule = await import('../inventory/suggest-parts');
    
    // Symuluj request
    const mockReq = {
      method: 'POST',
      body: { brand, model, employeeId, symptoms }
    };
    
    let result = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => { result = data; return mockRes; }
      })
    };
    
    await suggestModule.default(mockReq, mockRes);
    return result;
  } catch (error) {
    console.error('Błąd pobierania sugestii części:', error);
    return { success: false, suggestions: [] };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      orderId,
      employeeId,
      photoUrl, // URL już uploadowanego zdjęcia
      ocrResult, // Wynik z SimpleAIScanner (już rozpoznane dane)
      symptoms = [] // Objawy usterki (opcjonalnie)
    } = req.body;

    if (!orderId || !employeeId || !ocrResult) {
      return res.status(400).json({
        success: false,
        error: 'Brak wymaganych parametrów: orderId, employeeId, ocrResult'
      });
    }

    console.log('📸 Przetwarzanie OCR tabliczki dla zlecenia:', orderId);
    console.log('🔧 Serwisant:', employeeId);
    console.log('🤖 OCR Result:', ocrResult);

    // Wczytaj istniejące OCR
    let ocrData = [];
    try {
      const data = await fs.readFile(OCR_FILE, 'utf-8');
      ocrData = JSON.parse(data);
    } catch (error) {
      console.log('📝 Tworzenie nowego pliku OCR');
      ocrData = [];
    }

    // Znajdź pracownika
    let employeeName = 'Unknown';
    try {
      const empData = await fs.readFile(
        path.join(process.cwd(), 'data', 'employees.json'),
        'utf-8'
      );
      const employees = JSON.parse(empData);
      const emp = employees.find(e => e.id === employeeId);
      if (emp) employeeName = emp.name;
    } catch (error) {
      console.error('Błąd wczytywania pracowników:', error);
    }

    // Generuj ID dla OCR
    const ocrId = `OCR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(ocrData.length + 1).padStart(3, '0')}`;

    // Pobierz sugestie części na podstawie modelu
    console.log('🔍 Szukam kompatybilnych części...');
    const suggestionsResult = await getSuggestedParts(
      ocrResult.brand,
      ocrResult.model,
      employeeId,
      symptoms
    );

    const suggestions = suggestionsResult.success ? suggestionsResult.suggestions : [];
    console.log(`✅ Znaleziono ${suggestions.length} sugestii części`);

    // Utwórz rekord OCR
    const ocrRecord = {
      id: ocrId,
      orderId,
      employeeId,
      employeeName,
      photoUrl: photoUrl || `/uploads/plates/${orderId}_plate_${Date.now()}.jpg`,
      capturedAt: new Date().toISOString(),
      ocrResult: {
        success: true,
        confidence: ocrResult.confidence || 0.9,
        brand: ocrResult.brand,
        model: ocrResult.model,
        serialNumber: ocrResult.serialNumber || null,
        productionDate: ocrResult.productionDate || null,
        power: ocrResult.power || null,
        voltage: ocrResult.voltage || null,
        capacity: ocrResult.capacity || null,
        energyClass: ocrResult.energyClass || null,
        spinSpeed: ocrResult.spinSpeed || null,
        rawText: ocrResult.rawText || ocrResult.additionalInfo || ''
      },
      manualCorrection: null,
      suggestedParts: suggestions.map(s => ({
        partId: s.partId,
        partNumber: s.partNumber,
        name: s.name,
        price: s.price,
        compatibility: s.compatibility,
        reason: s.reason,
        inPersonalInventory: s.inPersonalInventory,
        personalInventoryQuantity: s.personalInventoryQuantity,
        needToOrder: s.needToOrder,
        suppliers: s.suppliers?.map(sup => ({
          id: sup.id,
          name: sup.name,
          price: sup.price,
          deliveryTime: sup.deliveryTime
        })) || []
      })),
      usedInRequest: null, // Będzie wypełnione gdy serwisant złoży zamówienie
      createdAt: new Date().toISOString()
    };

    // Sprawdź czy OCR dla tego zlecenia już istnieje
    const existingIndex = ocrData.findIndex(ocr => ocr.orderId === orderId);
    if (existingIndex >= 0) {
      // Aktualizuj istniejący
      console.log('🔄 Aktualizacja istniejącego OCR');
      ocrRecord.id = ocrData[existingIndex].id;
      ocrData[existingIndex] = ocrRecord;
    } else {
      // Dodaj nowy
      ocrData.push(ocrRecord);
    }

    // Zapisz do pliku
    await fs.writeFile(OCR_FILE, JSON.stringify(ocrData, null, 2), 'utf-8');

    console.log('✅ OCR zapisany:', ocrId);

    return res.status(200).json({
      success: true,
      ocrId: ocrRecord.id,
      confidence: ocrRecord.ocrResult.confidence,
      device: {
        brand: ocrRecord.ocrResult.brand,
        model: ocrRecord.ocrResult.model,
        serialNumber: ocrRecord.ocrResult.serialNumber,
        specs: {
          power: ocrRecord.ocrResult.power,
          voltage: ocrRecord.ocrResult.voltage,
          capacity: ocrRecord.ocrResult.capacity,
          energyClass: ocrRecord.ocrResult.energyClass,
          spinSpeed: ocrRecord.ocrResult.spinSpeed
        }
      },
      suggestedParts: ocrRecord.suggestedParts,
      message: suggestions.length > 0 
        ? `Znaleziono ${suggestions.length} kompatybilnych części` 
        : 'Brak sugestii części dla tego modelu'
    });

  } catch (error) {
    console.error('❌ Błąd API /api/ocr/device-plate:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera',
      details: error.message
    });
  }
}
