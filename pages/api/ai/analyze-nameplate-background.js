// pages/api/ai/analyze-nameplate-background.js
// 🤖 Asynchroniczna analiza tabliczki znamionowej w tle

import fs from 'fs';
import path from 'path';
import { analyzeNameplateWithAI } from '../../../utils/ai/nameplate-analyzer';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

// Helper functions
const readOrders = () => {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading orders.json:', error);
    return [];
  }
};

const writeOrders = (orders) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Error writing orders.json:', error);
    return false;
  }
};

// Znajdź wizytę po ID
const findVisitInOrders = (orders, visitId) => {
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (order.visits && Array.isArray(order.visits)) {
      const visitIndex = order.visits.findIndex(v => v.visitId === visitId);
      if (visitIndex !== -1) {
        return {
          orderIndex: i,
          visitIndex,
          order: order,
          visit: order.visits[visitIndex]
        };
      }
    }
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { photoPath, visitId, deviceIndex = 0 } = req.body;

    if (!photoPath || !visitId) {
      return res.status(400).json({
        success: false,
        message: 'photoPath and visitId are required'
      });
    }

    console.log(`🤖 [BACKGROUND] Rozpoczynam analizę tabliczki dla wizyty ${visitId}, urządzenie ${deviceIndex}`);
    console.log(`📸 Ścieżka zdjęcia: ${photoPath}`);

    // Natychmiast zwróć odpowiedź (nie czekaj na analizę)
    res.status(202).json({
      success: true,
      message: 'Analysis started in background',
      visitId,
      deviceIndex,
      status: 'processing'
    });

    // 🔥 ANALIZA W TLE - nie blokuje odpowiedzi
    (async () => {
      try {
        console.log(`🔍 [BACKGROUND] Analizuję zdjęcie...`);
        
        // Przeczytaj zdjęcie z dysku
        const fullPath = path.join(process.cwd(), 'public', photoPath);
        
        if (!fs.existsSync(fullPath)) {
          console.error(`❌ [BACKGROUND] Zdjęcie nie istnieje: ${fullPath}`);
          return;
        }

        const imageBuffer = fs.readFileSync(fullPath);
        const base64Image = imageBuffer.toString('base64');

        // Wywołaj AI
        const result = await analyzeNameplateWithAI(base64Image);

        if (!result || !result.brand) {
          console.error(`❌ [BACKGROUND] AI nie rozpoznało modelu`);
          return;
        }

        console.log(`✅ [BACKGROUND] AI rozpoznało: ${result.brand} ${result.model}`);

        // Zaktualizuj bazę danych
        const orders = readOrders();
        const visitData = findVisitInOrders(orders, visitId);

        if (!visitData) {
          console.error(`❌ [BACKGROUND] Nie znaleziono wizyty ${visitId}`);
          return;
        }

        // Utwórz obiekt modelu
        const modelData = {
          id: Date.now(),
          brand: result.brand,
          model: result.model || result.finalModel,
          name: `${result.brand} ${result.model || result.finalModel}`,
          type: result.type || result.finalType || 'Nieznane',
          serialNumber: result.serialNumber || '',
          notes: result.additionalInfo ? `Rozpoznane ze zdjęcia tabliczki. ${result.additionalInfo}` : '',
          dateAdded: new Date().toISOString(),
          source: 'scanner',
          photoPath: photoPath,
          confidence: result.confidence || 'unknown',
          parts: []
        };

        // Dodaj model do visit.deviceModels[deviceIndex]
        if (!visitData.visit.deviceModels) {
          visitData.visit.deviceModels = [];
        }

        let deviceModelsEntry = visitData.visit.deviceModels.find(dm => dm.deviceIndex === deviceIndex);
        
        if (!deviceModelsEntry) {
          deviceModelsEntry = {
            deviceIndex: deviceIndex,
            models: []
          };
          visitData.visit.deviceModels.push(deviceModelsEntry);
        }

        // Dodaj model (lub zastąp jeśli już istnieje)
        const existingModelIndex = deviceModelsEntry.models.findIndex(m => 
          m.brand === modelData.brand && m.model === modelData.model
        );

        if (existingModelIndex !== -1) {
          deviceModelsEntry.models[existingModelIndex] = modelData;
          console.log(`🔄 [BACKGROUND] Zaktualizowano istniejący model`);
        } else {
          deviceModelsEntry.models.push(modelData);
          console.log(`➕ [BACKGROUND] Dodano nowy model`);
        }

        // Backward compatibility
        if (deviceIndex === 0) {
          visitData.visit.models = deviceModelsEntry.models;
        }

        // Zaktualizuj urządzenie w order.devices
        const order = orders[visitData.orderIndex];
        
        if (!order.devices || !Array.isArray(order.devices)) {
          order.devices = [];
        }

        if (!order.devices[deviceIndex]) {
          order.devices[deviceIndex] = {
            deviceIndex: deviceIndex,
            deviceType: modelData.type,
            brand: modelData.brand,
            model: modelData.model,
            serialNumber: modelData.serialNumber,
            notes: ''
          };
          console.log(`📦 [BACKGROUND] Utworzono order.devices[${deviceIndex}]`);
        } else {
          // Nadpisz danymi z tabliczki
          if (modelData.type) {
            order.devices[deviceIndex].deviceType = modelData.type;
          }
          if (modelData.brand) {
            order.devices[deviceIndex].brand = modelData.brand;
          }
          if (modelData.model) {
            order.devices[deviceIndex].model = modelData.model;
          }
          if (modelData.serialNumber) {
            order.devices[deviceIndex].serialNumber = modelData.serialNumber;
          }
          console.log(`🔄 [BACKGROUND] Zaktualizowano order.devices[${deviceIndex}]`);
        }

        // Zapisz do pliku
        visitData.visit.updatedAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        
        orders[visitData.orderIndex].visits[visitData.visitIndex] = visitData.visit;
        
        const saved = writeOrders(orders);

        if (saved) {
          console.log(`✅ [BACKGROUND] Zapisano model do bazy danych`);
          console.log(`📊 [BACKGROUND] Model: ${modelData.brand} ${modelData.model}`);
          console.log(`📋 [BACKGROUND] Urządzenie: ${order.devices[deviceIndex]?.brand} ${order.devices[deviceIndex]?.model}`);
        } else {
          console.error(`❌ [BACKGROUND] Błąd zapisu do pliku`);
        }

      } catch (error) {
        console.error('❌ [BACKGROUND] Błąd podczas analizy:', error);
      }
    })();

  } catch (error) {
    console.error('❌ Error starting background analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start background analysis',
      error: error.message
    });
  }
}
