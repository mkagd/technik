// Rozszerzona struktura zamówienia AGD
const extendedAGDOrder = {
  // Podstawowe dane (już mamy)
  id: 1001,
  orderNumber: "ORDA25261001",
  clientId: "CLI25186001",
  
  // Dane urządzenia (już mamy, ale można rozszerzyć)
  device: {
    brand: "Samsung",
    model: "WW70J5346MW", 
    deviceType: "Pralka",
    serialNumber: "SAM2023-789456",
    
    // POTRZEBNE DODATKOWO:
    productionYear: 2023,
    purchaseDate: "2023-03-15",
    warrantyEndDate: "2025-03-15",
    warrantyStatus: "active", // active, expired, extended
    
    specifications: {
      capacity: "7kg", // dla pralk/zmywarek
      energyClass: "A+++",
      dimensions: {
        width: 60,
        height: 85,
        depth: 55
      },
      power: 2100, // W
      voltage: "220-240V",
      features: ["EcoBubble", "Digital Inverter", "Steam Wash"]
    },
    
    // Historia serwisowa
    serviceHistory: [
      {
        date: "2024-03-10",
        type: "maintenance",
        description: "Przegląd roczny",
        technicianId: "EMP25092001",
        cost: 150
      }
    ],
    
    // Dokumentacja
    manualUrl: "/manuals/samsung-ww70j5346mw.pdf",
    schematicUrl: "/schematics/samsung-ww70j5346mw.pdf",
    partsListUrl: "/parts/samsung-ww70j5346mw.json"
  },
  
  // Problem/usterka (rozszerzone)
  issue: {
    reportedDate: "2025-09-18T16:30:00Z",
    reportedBy: "client", // client, technician, automatic
    category: "mechanical", // mechanical, electrical, software, cleaning
    priority: "high", // low, medium, high, critical
    
    symptoms: [
      {
        description: "Pralka nie wiruje końcowo",
        severity: "high",
        frequency: "always", // always, sometimes, rarely
        whenOccurs: "end_of_cycle"
      },
      {
        description: "Mokre pranie",
        severity: "high", 
        frequency: "always",
        whenOccurs: "end_of_cycle"
      }
    ],
    
    errorCodes: ["E02", "E15"], // kody błędów z wyświetlacza
    clientDescription: "Pralka nie wiruje końcowo, pranie zostaje mokre. Problem wystąpił nagle wczoraj wieczorem.",
    
    environment: {
      location: "łazienka",
      temperature: "20°C",
      humidity: "60%",
      powerIssues: false,
      waterPressure: "normal"
    }
  },
  
  // Diagnoza i naprawa (rozszerzone)
  diagnosis: {
    initialDiagnosis: "Możliwy problem z pompą odpływową lub łożyskami",
    finalDiagnosis: "Uszkodzony łożysk bębna, wymaga części zamiennych",
    diagnosisDate: "2025-09-20T15:45:00Z",
    diagnosedBy: "EMP25092001",
    
    testsPerformed: [
      {
        testName: "Test wirowania",
        result: "failed",
        details: "Bęben nie osiąga pełnych obrotów"
      },
      {
        testName: "Test pompy odpływowej", 
        result: "passed",
        details: "Pompa działa prawidłowo"
      }
    ],
    
    rootCause: "Zużycie łożysk przez długotrwałe użytkowanie",
    riskAssessment: "medium" // low, medium, high
  },
  
  // Części zamienne (rozszerzone)
  partsNeeded: [
    {
      partNumber: "SAM-BRG-70J5346",
      name: "Łożysko bębna Samsung",
      category: "mechanical",
      priority: "critical",
      
      supplier: {
        name: "Samsung Parts Official",
        phone: "+48 22 123 45 67",
        deliveryTime: "2-3 dni"
      },
      
      pricing: {
        wholesalePrice: 45.00,
        retailPrice: 65.00,
        markupPercent: 44.4
      },
      
      compatibility: ["WW70J5346MW", "WW80J5346MW"],
      alternativeParts: ["AFTERMARKET-BRG-7080"],
      
      installation: {
        difficulty: "hard",
        estimatedTime: 120, // minuty
        specialToolsNeeded: ["Bearing puller", "Torque wrench"],
        safetyPrecautions: ["Disconnect power", "Drain water completely"]
      }
    }
  ],
  
  // Koszty (rozszerzone)
  costing: {
    estimation: {
      partsTotal: 85.00,
      laborTotal: 95.00,
      travelCost: 25.00,
      additionalFees: 0.00,
      totalEstimate: 205.00,
      estimateDate: "2025-09-20T15:45:00Z"
    },
    
    final: {
      partsTotal: 85.00,
      laborTotal: 95.00,
      travelCost: 25.00,
      discount: 0.00,
      tax: 26.00, // 23% VAT
      totalFinal: 231.00,
      invoiceDate: "2025-09-25T12:30:00Z"
    },
    
    paymentStatus: "paid", // pending, paid, partial, overdue
    paymentMethod: "card", // cash, card, transfer, invoice
    paymentDate: "2025-09-25T14:00:00Z"
  }
};

console.log('=== ROZSZERZONA STRUKTURA AGD ===');
console.log('To jest propozycja rozszerzonej struktury dla serwisu AGD');
console.log('Zawiera wszystkie potrzebne informacje dla profesjonalnego serwisu');

module.exports = extendedAGDOrder;