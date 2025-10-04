// pages/api/inventory/parts.js
// API dla zarządzania częściami w magazynie - główny katalog części

import path from 'path';
import fs from 'fs/promises';

const PARTS_FILE = path.join(process.cwd(), 'data', 'parts-inventory.json');

export default async function handler(req, res) {
  const { method, query } = req;

  try {
    // Odczyt części z pliku
    const partsData = await fs.readFile(PARTS_FILE, 'utf-8');
    const partsDatabase = JSON.parse(partsData);
    let inventory = partsDatabase.inventory || [];

    switch (method) {
      case 'GET':
        // GET /api/inventory/parts - lista wszystkich części
        // GET /api/inventory/parts?id=PART001 - konkretna część
        // GET /api/inventory/parts?brand=Samsung - filtrowanie po marce
        // GET /api/inventory/parts?model=WW90T4540AE - filtrowanie po modelu
        // GET /api/inventory/parts?category=Pralka - filtrowanie po kategorii
        
        let filteredParts = [...inventory];

        // Filtrowanie po ID
        if (query.id) {
          const part = filteredParts.find(p => p.id === query.id);
          if (!part) {
            return res.status(404).json({ 
              success: false, 
              error: 'Część nie znaleziona' 
            });
          }
          return res.status(200).json({ success: true, part });
        }

        // Filtrowanie po marce
        if (query.brand) {
          filteredParts = filteredParts.filter(p => 
            p.compatibleBrands?.some(b => 
              b.toLowerCase().includes(query.brand.toLowerCase())
            )
          );
        }

        // Filtrowanie po modelu
        if (query.model) {
          filteredParts = filteredParts.filter(p => 
            p.compatibleModels?.includes('universal') ||
            p.compatibleModels?.some(m => 
              m.toLowerCase().includes(query.model.toLowerCase())
            )
          );
        }

        // Filtrowanie po kategorii
        if (query.category) {
          filteredParts = filteredParts.filter(p => 
            p.subcategory?.toLowerCase() === query.category.toLowerCase()
          );
        }

        // Filtrowanie po dostępności
        if (query.available === 'true') {
          filteredParts = filteredParts.filter(p => 
            p.availability?.available > 0
          );
        }

        return res.status(200).json({
          success: true,
          parts: filteredParts,
          count: filteredParts.length
        });

      case 'POST':
        // POST /api/inventory/parts - dodanie nowej części (tylko admin/logistyk)
        const newPart = req.body;
        
        if (!newPart.name || !newPart.partNumber) {
          return res.status(400).json({
            success: false,
            error: 'Brak wymaganych pól: name, partNumber'
          });
        }

        // Auto-generuj ID jeśli nie podano
        if (!newPart.id) {
          // Znajdź największy numer ID
          const existingIds = inventory.map(p => {
            const match = p.id.match(/^PART(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          });
          const maxId = Math.max(0, ...existingIds);
          newPart.id = `PART${String(maxId + 1).padStart(3, '0')}`;
        } else {
          // Sprawdź czy część już istnieje
          const existingPart = inventory.find(p => p.id === newPart.id);
          if (existingPart) {
            return res.status(409).json({
              success: false,
              error: 'Część o tym ID już istnieje'
            });
          }
        }

        // Dodaj metadata
        newPart.metadata = {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastOrderDate: null,
          popularityScore: 0,
          seasonalDemand: 'stable'
        };

        inventory.push(newPart);
        
        // Zapisz do pliku
        partsDatabase.inventory = inventory;
        await fs.writeFile(PARTS_FILE, JSON.stringify(partsDatabase, null, 2), 'utf-8');

        return res.status(201).json({
          success: true,
          message: 'Część dodana pomyślnie',
          part: newPart
        });

      case 'PUT':
        // PUT /api/inventory/parts?id=PART001 - aktualizacja części
        if (!query.id) {
          return res.status(400).json({
            success: false,
            error: 'Brak parametru ID'
          });
        }

        const partIndex = inventory.findIndex(p => p.id === query.id);
        if (partIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Część nie znaleziona'
          });
        }

        const updatedPart = {
          ...inventory[partIndex],
          ...req.body,
          id: query.id, // ID nie może być zmienione
          metadata: {
            ...inventory[partIndex].metadata,
            updatedAt: new Date().toISOString()
          }
        };

        inventory[partIndex] = updatedPart;
        partsDatabase.inventory = inventory;
        await fs.writeFile(PARTS_FILE, JSON.stringify(partsDatabase, null, 2), 'utf-8');

        return res.status(200).json({
          success: true,
          message: 'Część zaktualizowana',
          part: updatedPart
        });

      case 'DELETE':
        // DELETE /api/inventory/parts?id=PART001 - usunięcie części
        if (!query.id) {
          return res.status(400).json({
            success: false,
            error: 'Brak parametru ID'
          });
        }

        const deleteIndex = inventory.findIndex(p => p.id === query.id);
        if (deleteIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Część nie znaleziona'
          });
        }

        const deletedPart = inventory[deleteIndex];
        inventory.splice(deleteIndex, 1);
        
        partsDatabase.inventory = inventory;
        await fs.writeFile(PARTS_FILE, JSON.stringify(partsDatabase, null, 2), 'utf-8');

        return res.status(200).json({
          success: true,
          message: 'Część usunięta',
          part: deletedPart
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('❌ Błąd API /api/inventory/parts:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera',
      details: error.message
    });
  }
}
