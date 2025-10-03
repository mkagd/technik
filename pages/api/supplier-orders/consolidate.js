import fs from 'fs';
import path from 'path';

const partRequestsPath = path.join(process.cwd(), 'data', 'part-requests.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
const systemConfigPath = path.join(process.cwd(), 'data', 'system-config.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

function findEmployee(employeeId) {
  const employees = readJSON(employeesPath);
  if (!employees) return null;
  return employees.find(emp => emp.id === employeeId);
}

// Helper: Sprawdź czy adresy są podobne (dla konsolidacji)
function areAddressesSimilar(addr1, addr2) {
  if (!addr1 || !addr2) return false;
  
  // Normalizuj adresy
  const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const norm1 = normalize(addr1);
  const norm2 = normalize(addr2);
  
  // Dokładne dopasowanie
  if (norm1 === norm2) return true;
  
  // Sprawdź czy zawiera większość słów (podobny adres)
  const words1 = norm1.split(/\s+/);
  const words2 = norm2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  
  // Jeśli 70%+ słów się zgadza → podobny adres
  return commonWords.length >= Math.min(words1.length, words2.length) * 0.7;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
  
  const {
    requestIds,         // Array ID zamówień do sprawdzenia
    autoDetect,         // true = automatycznie znajdź wszystkie approved pending consolidation
    checkAllApproved    // true = sprawdź wszystkie approved w systemie
  } = req.body;
  
  // Odczytaj konfigurację
  const config = readJSON(systemConfigPath);
  const consolidationEnabled = config?.delivery?.consolidationEnabled !== false;
  const consolidationSavings = config?.delivery?.consolidationSavings || 15;
  
  if (!consolidationEnabled) {
    return res.status(200).json({ 
      success: true, 
      consolidationEnabled: false,
      message: 'Konsolidacja wyłączona w konfiguracji',
      opportunities: []
    });
  }
  
  // Odczytaj zamówienia
  let requests = readJSON(partRequestsPath);
  if (!requests) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można odczytać zamówień' 
    });
  }
  
  // Określ które zamówienia sprawdzać
  let requestsToCheck = [];
  
  if (checkAllApproved) {
    // Wszystkie zatwierdzone, jeszcze niezamówione u dostawcy
    requestsToCheck = requests.filter(r => 
      r.status === 'approved' && 
      r.consolidatedWith.length === 0
    );
  } else if (autoDetect) {
    // Zatwierdzone z ostatnich 24h
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    requestsToCheck = requests.filter(r => 
      r.status === 'approved' && 
      new Date(r.approvedAt) >= yesterday &&
      r.consolidatedWith.length === 0
    );
  } else if (requestIds && Array.isArray(requestIds)) {
    // Konkretne zamówienia
    requestsToCheck = requests.filter(r => requestIds.includes(r.requestId));
  } else {
    return res.status(400).json({ 
      success: false, 
      error: 'Brak requestIds, autoDetect lub checkAllApproved' 
    });
  }
  
  if (requestsToCheck.length === 0) {
    return res.status(200).json({ 
      success: true, 
      message: 'Brak zamówień do sprawdzenia',
      opportunities: []
    });
  }
  
  // ============================================
  // DETEKCJA MOŻLIWOŚCI KONSOLIDACJI
  // ============================================
  const opportunities = [];
  const processed = new Set();
  
  for (let i = 0; i < requestsToCheck.length; i++) {
    const request1 = requestsToCheck[i];
    
    if (processed.has(request1.requestId)) continue;
    
    const group = {
      type: null,  // 'paczkomat', 'address', 'office'
      requests: [request1],
      location: null,
      savings: 0,
      employees: [request1.requestedForName],
      totalParts: request1.parts.length,
      description: ''
    };
    
    // Sprawdź czy można skonsolidować z innymi
    for (let j = i + 1; j < requestsToCheck.length; j++) {
      const request2 = requestsToCheck[j];
      
      if (processed.has(request2.requestId)) continue;
      
      let canConsolidate = false;
      let consolidationType = null;
      let consolidationLocation = null;
      
      // 1. Ten sam paczkomat
      if (request1.finalDelivery === 'paczkomat' && 
          request2.finalDelivery === 'paczkomat' &&
          request1.paczkomatId && 
          request2.paczkomatId &&
          request1.paczkomatId === request2.paczkomatId) {
        canConsolidate = true;
        consolidationType = 'paczkomat';
        consolidationLocation = request1.paczkomatId;
      }
      
      // 2. Dostawa do biura
      else if (request1.finalDelivery === 'office' && 
               request2.finalDelivery === 'office') {
        canConsolidate = true;
        consolidationType = 'office';
        consolidationLocation = 'Biuro firmy';
      }
      
      // 3. Podobny adres
      else if (request1.finalDelivery === 'technician-address' && 
               request2.finalDelivery === 'technician-address' &&
               request1.deliveryAddress && 
               request2.deliveryAddress &&
               areAddressesSimilar(request1.deliveryAddress, request2.deliveryAddress)) {
        canConsolidate = true;
        consolidationType = 'address';
        consolidationLocation = request1.deliveryAddress;
      }
      
      if (canConsolidate) {
        if (!group.type) {
          group.type = consolidationType;
          group.location = consolidationLocation;
        }
        
        group.requests.push(request2);
        group.employees.push(request2.requestedForName);
        group.totalParts += request2.parts.length;
        processed.add(request2.requestId);
      }
    }
    
    // Jeśli znaleziono grupę (2+ zamówień) → dodaj jako opportunity
    if (group.requests.length >= 2) {
      processed.add(request1.requestId);
      
      // Oblicz oszczędności
      // Każde zamówienie kosztuje 15zł dostawy (lub 0zł jeśli free shipping threshold)
      // Konsolidacja = 1 dostawa zamiast N
      const deliveryCostPerRequest = 15; // Można to wziąć z suppliers
      group.savings = (group.requests.length - 1) * deliveryCostPerRequest;
      
      // Opis
      const employeesList = [...new Set(group.employees)].join(', ');
      
      switch (group.type) {
        case 'paczkomat':
          group.description = `${group.requests.length} zamówienia → paczkomat ${group.location}`;
          break;
        case 'office':
          group.description = `${group.requests.length} zamówienia → ${group.location}`;
          break;
        case 'address':
          group.description = `${group.requests.length} zamówienia → podobny adres`;
          break;
      }
      
      opportunities.push({
        ...group,
        requestIds: group.requests.map(r => r.requestId),
        employees: [...new Set(group.employees)],
        employeesList,
        canConsolidate: true
      });
    }
  }
  
  // Sortuj po oszczędnościach (największe pierwsze)
  opportunities.sort((a, b) => b.savings - a.savings);
  
  // Statystyki
  const totalSavings = opportunities.reduce((sum, opp) => sum + opp.savings, 0);
  const totalConsolidations = opportunities.length;
  const totalRequestsInGroups = opportunities.reduce((sum, opp) => sum + opp.requests.length, 0);
  
  return res.status(200).json({ 
    success: true, 
    consolidationEnabled: true,
    opportunities,
    statistics: {
      totalOpportunities: totalConsolidations,
      totalRequests: requestsToCheck.length,
      requestsInConsolidation: totalRequestsInGroups,
      requestsStandalone: requestsToCheck.length - totalRequestsInGroups,
      totalSavings,
      savingsPerConsolidation: consolidationSavings
    },
    message: totalConsolidations > 0 
      ? `Znaleziono ${totalConsolidations} możliwości konsolidacji (oszczędność: ${totalSavings}zł)`
      : 'Nie znaleziono możliwości konsolidacji'
  });
}
