// API endpoint do sprawdzania sugestii zakupów na Allegro dla części z low stock
import fs from 'fs';
import path from 'path';

const partsInventoryPath = path.join(process.cwd(), 'data', 'parts-inventory.json');
const allegroSuggestionsPath = path.join(process.cwd(), 'data', 'allegro-suggestions.json');

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading file:', filePath, error);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing file:', filePath, error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Pobierz aktualnie cached suggestions
    const suggestions = readJSON(allegroSuggestionsPath) || { 
      lastCheck: null, 
      suggestions: [] 
    };

    return res.status(200).json(suggestions);
  }

  if (req.method === 'POST') {
    // Sprawdź ceny na Allegro dla części z low stock
    try {
      const inventory = readJSON(partsInventoryPath);
      
      if (!inventory) {
        return res.status(500).json({ 
          success: false, 
          error: 'Nie można odczytać magazynu' 
        });
      }

      const lowStockParts = inventory.stockAlerts?.lowStock || [];
      const outOfStockParts = inventory.stockAlerts?.outOfStock || [];
      const partsToCheck = [...lowStockParts, ...outOfStockParts];

      console.log(`🔍 Sprawdzam ceny Allegro dla ${partsToCheck.length} części...`);

      const suggestions = [];
      let checkedCount = 0;
      let foundCount = 0;

      for (const alert of partsToCheck) {
        const part = inventory.inventory.find(p => p.id === alert.partId);
        
        if (!part) continue;

        checkedCount++;

        try {
          // Konstruuj query
          const query = part.partNumber 
            ? `${part.name} ${part.partNumber}`
            : part.name;

          const params = new URLSearchParams({
            query: query,
            limit: '5',
            sortBy: 'price-asc'
          });

          // Wywołaj API Allegro
          const allegroRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/allegro/search?${params}`
          );

          const allegroData = await allegroRes.json();

          if (allegroData.success && allegroData.results && allegroData.results.length > 0) {
            foundCount++;
            const bestOffer = allegroData.results[0]; // Najtańsza oferta

            // Oblicz oszczędności (jeśli masz cenę detaliczną)
            const yourPrice = part.pricing?.retailPrice || 0;
            const allegroPrice = parseFloat(bestOffer.price.amount);
            const savings = yourPrice - allegroPrice;
            const savingsPercent = yourPrice > 0 ? (savings / yourPrice * 100) : 0;

            suggestions.push({
              // Dane części
              partId: part.id,
              partName: part.name,
              partNumber: part.partNumber,
              category: part.category,
              subcategory: part.subcategory,
              
              // Stan magazynowy
              currentStock: alert.currentStock || 0,
              minStock: alert.minStock || part.availability?.minStock || 3,
              recommendedOrder: alert.recommendedOrder || part.availability?.minStock || 3,
              urgency: alert.urgency || (alert.currentStock === 0 ? 'critical' : 'high'),
              
              // Dane z Allegro
              allegroPrice: allegroPrice,
              allegroOriginalPrice: allegroPrice,
              allegroCurrency: bestOffer.price.currency,
              allegroUrl: bestOffer.url,
              allegroSeller: bestOffer.seller.login,
              allegroSuperSeller: bestOffer.seller.superSeller || false,
              allegroFreeDelivery: bestOffer.delivery.free || false,
              allegroDeliveryPrice: bestOffer.delivery.free ? 0 : parseFloat(bestOffer.delivery.price || 0),
              allegroImage: bestOffer.image,
              allegroItemName: bestOffer.name,
              
              // Porównanie cen
              yourPrice: yourPrice,
              savings: savings,
              savingsPercent: savingsPercent,
              isCheaper: savings > 0,
              
              // Timestamp
              checkedAt: new Date().toISOString(),
              
              // Dodatkowe oferty (top 3)
              alternativeOffers: allegroData.results.slice(1, 4).map(offer => ({
                price: parseFloat(offer.price.amount),
                seller: offer.seller.login,
                url: offer.url,
                freeDelivery: offer.delivery.free
              }))
            });
          }

          // Delay żeby nie spamować API (100ms między requestami)
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`❌ Błąd sprawdzania części ${part.name}:`, error.message);
          // Continue with next part
        }
      }

      // Sortuj sugestie: najpierw pilne (currentStock=0), potem największe oszczędności
      suggestions.sort((a, b) => {
        if (a.currentStock === 0 && b.currentStock !== 0) return -1;
        if (a.currentStock !== 0 && b.currentStock === 0) return 1;
        return b.savings - a.savings;
      });

      // Zapisz sugestie do cache
      const cacheData = {
        lastCheck: new Date().toISOString(),
        checkedCount: checkedCount,
        foundCount: foundCount,
        suggestions: suggestions,
        summary: {
          totalParts: partsToCheck.length,
          foundOffers: foundCount,
          criticalParts: suggestions.filter(s => s.currentStock === 0).length,
          potentialSavings: suggestions.reduce((sum, s) => sum + (s.savings > 0 ? s.savings : 0), 0),
          cheaperOnAllegro: suggestions.filter(s => s.isCheaper).length
        }
      };

      writeJSON(allegroSuggestionsPath, cacheData);

      console.log(`✅ Sprawdzono ${checkedCount} części, znaleziono ${foundCount} ofert na Allegro`);
      console.log(`💰 Potencjalne oszczędności: ${cacheData.summary.potentialSavings.toFixed(2)} zł`);

      return res.status(200).json({
        success: true,
        ...cacheData
      });

    } catch (error) {
      console.error('❌ Error checking Allegro prices:', error);
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas sprawdzania cen',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
