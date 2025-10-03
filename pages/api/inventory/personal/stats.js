import fs from 'fs';
import path from 'path';

const personalInventoriesPath = path.join(process.cwd(), 'data', 'personal-inventories.json');
const partUsagePath = path.join(process.cwd(), 'data', 'part-usage.json');
const partsInventoryPath = path.join(process.cwd(), 'data', 'parts-inventory.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

function findPart(partId) {
  const parts = readJSON(partsInventoryPath);
  if (!parts) return null;
  return parts.find(p => p.id === partId);
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
  
  const { employeeId, period } = req.query;
  
  if (!employeeId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Brak employeeId' 
    });
  }
  
  // Odczytaj magazyn
  const inventories = readJSON(personalInventoriesPath);
  if (!inventories) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można odczytać magazynów' 
    });
  }
  
  const inventory = inventories.find(inv => inv.employeeId === employeeId);
  if (!inventory) {
    return res.status(404).json({ 
      success: false, 
      error: 'Magazyn nie znaleziony' 
    });
  }
  
  // Odczytaj historię użycia
  let usageHistory = readJSON(partUsagePath) || [];
  usageHistory = usageHistory.filter(u => u.employeeId === employeeId);
  
  // Filtruj po okresie (month, week, all)
  const now = new Date();
  if (period === 'month') {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    usageHistory = usageHistory.filter(u => new Date(u.usageDate) >= monthAgo);
  } else if (period === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    usageHistory = usageHistory.filter(u => new Date(u.usageDate) >= weekAgo);
  }
  
  // Statystyki aktualnego magazynu
  const currentStats = {
    totalParts: inventory.parts.reduce((sum, p) => sum + p.quantity, 0),
    totalValue: inventory.parts.reduce((sum, p) => {
      const partDetails = findPart(p.partId);
      return sum + (partDetails?.price || 0) * p.quantity;
    }, 0),
    uniqueParts: inventory.parts.length
  };
  
  // Statystyki użycia
  const usageStats = {
    totalUsages: usageHistory.length,
    totalPartsUsed: usageHistory.reduce((sum, u) => {
      return sum + u.parts.reduce((partSum, p) => partSum + p.quantity, 0);
    }, 0),
    totalValueUsed: usageHistory.reduce((sum, u) => sum + u.totalValue, 0)
  };
  
  // Top 5 najczęściej używanych części
  const partUsageCount = {};
  usageHistory.forEach(usage => {
    usage.parts.forEach(part => {
      if (!partUsageCount[part.partId]) {
        partUsageCount[part.partId] = {
          partId: part.partId,
          partName: part.partName,
          timesUsed: 0,
          quantityUsed: 0,
          totalValue: 0
        };
      }
      partUsageCount[part.partId].timesUsed++;
      partUsageCount[part.partId].quantityUsed += part.quantity;
      partUsageCount[part.partId].totalValue += part.totalPrice;
    });
  });
  
  const topParts = Object.values(partUsageCount)
    .sort((a, b) => b.quantityUsed - a.quantityUsed)
    .slice(0, 5);
  
  // Części z niskim stanem (< 2 szt)
  const lowStockParts = inventory.parts
    .filter(p => p.quantity < 2)
    .map(p => {
      const partDetails = findPart(p.partId);
      return {
        partId: p.partId,
        partName: partDetails?.name || 'Nieznana część',
        quantity: p.quantity,
        location: p.location
      };
    });
  
  return res.status(200).json({ 
    success: true, 
    employeeId,
    period: period || 'all',
    currentInventory: currentStats,
    usage: usageStats,
    topUsedParts: topParts,
    lowStockParts,
    lowStockAlert: lowStockParts.length > 0
  });
}
