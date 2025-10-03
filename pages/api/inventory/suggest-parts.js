// pages/api/inventory/suggest-parts.js
// API dla sugestii części na podstawie OCR tabliczki znamionowej
// Sprawdza kompatybilność + czy serwisant ma część w swoim magazynie

import path from 'path';
import fs from 'fs/promises';

const PARTS_FILE = path.join(process.cwd(), 'data', 'parts-inventory.json');
const PERSONAL_INV_FILE = path.join(process.cwd(), 'data', 'personal-inventories.json');
const SUPPLIERS_FILE = path.join(process.cwd(), 'data', 'suppliers.json');

// Funkcja sprawdzająca kompatybilność części z modelem
function checkCompatibility(part, brand, model) {
  let score = 0;
  let reason = '';

  // Sprawdź markę
  const brandMatch = part.compatibleBrands?.some(b => 
    b.toLowerCase() === brand.toLowerCase()
  );
  
  if (!brandMatch) {
    // Sprawdź czy część uniwersalna
    if (part.compatibleBrands?.includes('Universal') || 
        part.compatibleModels?.includes('universal')) {
      score = 60;
      reason = `Część uniwersalna, może pasować do ${brand}`;
    } else {
      return { compatible: false, score: 0, reason: 'Niezgodna marka' };
    }
  } else {
    score = 80; // Bazowy score dla zgodnej marki
  }

  // Sprawdź model
  if (part.compatibleModels?.includes('universal')) {
    score = Math.max(score, 75);
    reason = `Uniwersalna dla większości modeli ${brand}`;
  } else if (part.compatibleModels?.some(m => m === model)) {
    score = 100;
    reason = `Dedykowana dla modelu ${model}`;
  } else if (part.compatibleModels?.some(m => {
    // Sprawdź podobieństwo modelu (np. WW90T* pasuje do WW90T4540AE)
    const pattern = m.replace(/\*/g, '.*');
    return new RegExp(pattern).test(model);
  })) {
    score = 95;
    reason = `Kompatybilna z serią ${model.substring(0, 5)}*`;
  } else if (brandMatch) {
    score = 70;
    reason = `Pasuje do marki ${brand} (weryfikacja zalecana)`;
  }

  return {
    compatible: score >= 60,
    score,
    reason
  };
}

// Funkcja sprawdzająca czy część jest w magazynie serwisanta
async function checkPersonalInventory(employeeId, partId) {
  try {
    const data = await fs.readFile(PERSONAL_INV_FILE, 'utf-8');
    const inventories = JSON.parse(data);
    
    const employeeInv = inventories.find(inv => inv.employeeId === employeeId);
    if (!employeeInv) {
      return { hasIt: false, quantity: 0 };
    }

    const part = employeeInv.parts.find(p => p.partId === partId);
    if (!part) {
      return { hasIt: false, quantity: 0 };
    }

    return {
      hasIt: part.quantity > 0,
      quantity: part.quantity,
      location: part.location,
      status: part.status
    };
  } catch (error) {
    console.error('Błąd sprawdzania magazynu osobistego:', error);
    return { hasIt: false, quantity: 0 };
  }
}

// Funkcja znajdująca najlepszych dostawców dla części
async function findSuppliers(part) {
  try {
    const data = await fs.readFile(SUPPLIERS_FILE, 'utf-8');
    const suppliers = JSON.parse(data);
    
    // Filtruj dostawców którzy obsługują tę kategorię i markę
    const compatibleSuppliers = suppliers.filter(s => {
      if (!s.isActive) return false;
      
      // Sprawdź czy dostawca obsługuje tę kategorię
      const categoryMatch = s.categories?.some(cat => 
        part.category?.includes(cat) || part.subcategory?.includes(cat)
      );
      
      // Sprawdź czy dostawca jest preferowany dla tej marki
      const brandMatch = part.compatibleBrands?.some(brand => 
        s.preferredFor?.includes(brand)
      );
      
      return categoryMatch || brandMatch;
    });

    // Sortuj po: 1) Preferowani dla marki, 2) Reliability, 3) Delivery time
    return compatibleSuppliers
      .map(s => ({
        id: s.id,
        name: s.name,
        price: part.pricing?.retailPrice || 0, // W przyszłości: ceny per dostawca
        deliveryTime: s.delivery?.standardTime || '48h',
        reliability: s.statistics?.reliability || 0.9,
        hasAPI: s.integration?.hasAPI || false,
        freeShippingThreshold: s.delivery?.freeShippingThreshold || 500,
        shippingCost: s.delivery?.shippingCost || 15,
        acceptsPaczkomat: s.delivery?.acceptsPaczkomat || false
      }))
      .sort((a, b) => {
        // Sortuj po reliability i czasie dostawy
        if (Math.abs(a.reliability - b.reliability) > 0.05) {
          return b.reliability - a.reliability;
        }
        const timeA = parseInt(a.deliveryTime);
        const timeB = parseInt(b.deliveryTime);
        return timeA - timeB;
      });
  } catch (error) {
    console.error('Błąd wczytywania dostawców:', error);
    return [];
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
      brand, 
      model, 
      employeeId,
      symptoms = [] // Opcjonalnie: objawy usterki do lepszego matchowania
    } = req.body;

    if (!brand || !model) {
      return res.status(400).json({
        success: false,
        error: 'Brak wymaganych parametrów: brand, model'
      });
    }

    console.log('🔍 Szukam części dla:', { brand, model, employeeId, symptoms });

    // Wczytaj katalog części
    const partsData = await fs.readFile(PARTS_FILE, 'utf-8');
    const partsDatabase = JSON.parse(partsData);
    const inventory = partsDatabase.inventory || [];

    // Znajdź kompatybilne części
    const suggestions = [];

    for (const part of inventory) {
      // Sprawdź kompatybilność z modelem
      const compatibility = checkCompatibility(part, brand, model);
      
      if (!compatibility.compatible) {
        continue; // Pomiń niezgodne części
      }

      // Sprawdź czy część jest dostępna
      const isAvailable = part.availability?.available > 0;

      // Sprawdź czy serwisant ma tę część w magazynie
      let personalInv = { hasIt: false, quantity: 0 };
      if (employeeId) {
        personalInv = await checkPersonalInventory(employeeId, part.id);
      }

      // Znajdź dostawców
      const suppliers = await findSuppliers(part);

      // Dopasowanie do objawów (opcjonalne)
      let symptomMatch = 0;
      if (symptoms.length > 0 && part.failureIndicators) {
        const matchingSymptoms = symptoms.filter(s => 
          part.failureIndicators.some(fi => 
            fi.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(fi.toLowerCase())
          )
        );
        symptomMatch = (matchingSymptoms.length / symptoms.length) * 100;
      }

      // Oblicz finalny score (kompatybilność + objawy)
      let finalScore = compatibility.score;
      if (symptomMatch > 0) {
        finalScore = (compatibility.score * 0.7) + (symptomMatch * 0.3);
      }

      suggestions.push({
        partId: part.id,
        partNumber: part.partNumber,
        name: part.name,
        description: part.description,
        price: part.pricing?.retailPrice || 0,
        wholesalePrice: part.pricing?.wholesalePrice || 0,
        compatibility: Math.round(finalScore),
        reason: compatibility.reason,
        
        // Dostępność w katalogu
        available: isAvailable,
        inStock: part.availability?.inStock || 0,
        
        // Magazyn osobisty serwisanta
        inPersonalInventory: personalInv.hasIt,
        personalInventoryQuantity: personalInv.quantity,
        personalInventoryLocation: personalInv.location || null,
        needToOrder: !personalInv.hasIt || personalInv.quantity === 0,
        
        // Instalacja
        installationDifficulty: part.installation?.difficulty || 'medium',
        estimatedTime: part.installation?.estimatedTime || 60,
        requiredTools: part.installation?.requiredTools || [],
        
        // Objawy usterki
        failureIndicators: part.failureIndicators || [],
        symptomMatch: Math.round(symptomMatch),
        
        // Dostawcy
        suppliers: suppliers.slice(0, 3), // Top 3 dostawców
        
        // Metadata
        warranty: part.specifications?.warranty || '6 miesięcy',
        oem: part.specifications?.oem || false
      });
    }

    // Sortuj sugestie po finalnym score
    suggestions.sort((a, b) => b.compatibility - a.compatibility);

    console.log(`✅ Znaleziono ${suggestions.length} kompatybilnych części`);

    return res.status(200).json({
      success: true,
      device: { brand, model },
      employeeId: employeeId || null,
      suggestions: suggestions.slice(0, 10), // Top 10 sugestii
      count: suggestions.length
    });

  } catch (error) {
    console.error('❌ Błąd API /api/inventory/suggest-parts:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera',
      details: error.message
    });
  }
}
