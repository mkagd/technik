/**
 * ENHANCED ORDER STRUCTURE v3.0 - JSON/CONTEXT ADAPTER
 * 
 * Adapter dla kompatybilności z serwerem i systemem JSON/Context
 * Konwertuje Enhanced v3.0 do formatu wymaganego przez:
 * - clientOrderStorage.js
 * - pages/api/orders.js  
 * - Deployment na serwerze
 * 
 * 🏠 Zachowuje wszystkie funkcje AGD Mobile: zabudowa, Google Contacts, wykrywanie połączeń
 * 📱 Kompatybilny z Enhanced v2.0 i istniejącymi API
 * 🔄 Dwukierunkowa konwersja: v3.0 ↔ JSON/Context
 */

const { ENHANCED_ORDER_STRUCTURE_V3 } = require('./enhanced-order-structure-v3');

class EnhancedOrderV3Adapter {
  
  /**
   * 🔄 Konwertuje Enhanced Order v3.0 do formatu JSON/Context dla serwera
   * @param {Object} orderV3 - Zlecenie w formacie Enhanced v3.0
   * @returns {Object} - Zlecenie w formacie JSON/Context dla serwera
   */
  static toServerContext(orderV3) {
    return {
      // ========== PODSTAWOWE POLA (zachowane dla kompatybilności) ==========
      id: orderV3.id,
      orderNumber: orderV3.orderNumber, // NOWY FORMAT: ORDA25272001
      source: orderV3.orderSource || "web",
      
      // Klient
      clientId: orderV3.clientId,
      clientName: orderV3.clientName, // 🆕 z AGD Mobile
      employeeId: orderV3.employeeId,
      
      // Lokalizacja
      address: orderV3.address, // 🆕 z AGD Mobile  
      phone: orderV3.phone, // 🆕 z AGD Mobile
      deviceLocation: orderV3.deviceLocation,
      
      // ========== 🆕 NOWE: KONTEKST AGD MOBILE ==========
      agdMobileContext: {
        // System zabudowy - NAJWAŻNIEJSZA FUNKCJA
        builtInSystem: {
          enabled: this.hasBuiltInDevices(orderV3.devices),
          mainParams: orderV3.builtInParams || {},
          devicesWithBuiltIn: this.extractBuiltInDevices(orderV3.devices),
          estimatedExtraTime: this.calculateBuiltInExtraTime(orderV3.devices),
          specialRequirements: this.extractBuiltInRequirements(orderV3.devices)
        },
        
        // Wykrywanie połączeń
        callDetection: {
          wasDetected: !!orderV3.detectedCall,
          callData: orderV3.detectedCall || null,
          entryTime: orderV3.entryTime,
          phoneUsedInOrder: orderV3.detectedCall?.wasUsed || false
        },
        
        // Google Contacts integracja
        googleIntegration: {
          enabled: orderV3.updateGoogleContact || orderV3.createNewGoogleContact,
          updateExisting: orderV3.updateGoogleContact,
          createNew: orderV3.createNewGoogleContact,
          contactData: orderV3.googleContactData || null,
          selectedEmployee: orderV3.selectedEmployee,
          googleAccount: orderV3.selectedGoogleAccount
        },
        
        // Rozbudowane urządzenia AGD
        advancedDevices: {
          total: orderV3.devices?.length || 0,
          withBuiltIn: this.countBuiltInDevices(orderV3.devices),
          categories: this.categorizeDevices(orderV3.devices),
          hasErrorCodes: this.hasErrorCodes(orderV3.devices),
          requiresParts: this.requiresParts(orderV3.devices)
        },
        
        // Zaawansowane godziny
        workHoursAdvanced: {
          preferred: orderV3.hours,
          detailed: orderV3.clientWorkHours || [],
          custom: orderV3.workHoursCustom,
          flexible: orderV3.workHours || []
        }
      },
      
      // ========== URZĄDZENIA (adaptowane z AGD Mobile) ==========
      devices: this.adaptDevicesForServer(orderV3.devices),
      mainDevice: this.extractMainDevice(orderV3.devices),
      
      // ========== STATUS I WORKFLOW ==========
      status: orderV3.status,
      priority: this.calculatePriority(orderV3),
      
      // ========== HISTORIA (adaptowana z emoji) ==========
      history: this.adaptHistoryForServer(orderV3.history),
      changeLog: this.createServerChangeLog(orderV3.history),
      
      // ========== CZASY ==========
      timing: {
        estimated: orderV3.estimatedDuration,
        builtInExtra: this.calculateBuiltInExtraTime(orderV3.devices),
        workSessions: orderV3.workSessions || [],
        actualStart: orderV3.actualStartTime,
        actualEnd: orderV3.actualEndTime
      },
      
      // ========== KOSZTY (rozszerzone) ==========
      pricing: {
        base: parseFloat(orderV3.cost) || 0,
        labor: orderV3.laborCost || 0,
        parts: orderV3.partsCost || 0,
        travel: orderV3.travelCost || 0,
        builtInSurcharge: this.calculateBuiltInSurcharge(orderV3.devices),
        total: orderV3.totalCost || 0,
        settings: orderV3.pricingSettings || {}
      },
      
      // ========== CZĘŚCI ==========
      parts: this.adaptPartsForServer(orderV3.partsUsed),
      
      // ========== DOKUMENTACJA ==========
      documentation: {
        photos: {
          before: orderV3.beforePhotos || [],
          after: orderV3.afterPhotos || [],
          completion: orderV3.completionPhotos || []
        },
        notes: {
          work: orderV3.workNotes,
          technician: orderV3.technicianNotes,
          internal: orderV3.internalNotes,
          client: orderV3.clientFeedback
        }
      },
      
      // ========== GWARANCJA ==========
      warranty: {
        months: orderV3.warrantyMonths || 3,
        notes: orderV3.warrantyNotes,
        status: orderV3.warrantyStatus
      },
      
      // ========== POWIADOMIENIA ==========
      notifications: {
        sent: orderV3.notificationsSent || [],
        push: orderV3.pushNotificationsSent || []
      },
      
      // ========== METADANE ==========
      metadata: {
        dateAdded: orderV3.dateAdded, // 🆕 z AGD Mobile
        created: orderV3.createdAt,
        updated: orderV3.updatedAt,
        createdBy: orderV3.createdBy,
        lastModifiedBy: orderV3.lastModifiedBy,
        syncStatus: orderV3.syncStatus,
        version: "3.0"
      },
      
      // ========== KOMPATYBILNOŚĆ Z STARSZYMI WERSJAMI ==========
      legacy: {
        // Dla compatybilności z Enhanced v2.0
        gps: orderV3.deviceCoordinates,
        workTime: orderV3.totalWorkTime,
        timerRunning: orderV3.isTimerRunning,
        
        // Dla kompatybilności z podstawowym systemem
        description: orderV3.problemDescription,
        solution: orderV3.solutionDescription,
        signature: orderV3.customerSignature
      }
    };
  }
  
  /**
   * 🔄 Konwertuje z formatu JSON/Context serwera do Enhanced v3.0
   * @param {Object} serverContext - Dane z serwera w formacie JSON/Context  
   * @returns {Object} - Zlecenie w formacie Enhanced v3.0
   */
  static fromServerContext(serverContext) {
    const agdContext = serverContext.agdMobileContext || {};
    
    return {
      // Podstawowe
      id: serverContext.id,
      orderNumber: serverContext.orderNumber,
      orderSource: serverContext.source,
      clientId: serverContext.clientId,
      clientName: serverContext.clientName,
      employeeId: serverContext.employeeId,
      address: serverContext.address,
      phone: serverContext.phone,
      deviceLocation: serverContext.deviceLocation,
      deviceCoordinates: serverContext.legacy?.gps,
      
      // 🆕 AGD Mobile features
      selectedEmployee: agdContext.googleIntegration?.selectedEmployee,
      selectedGoogleAccount: agdContext.googleIntegration?.googleAccount,
      detectedCall: agdContext.callDetection?.callData,
      entryTime: agdContext.callDetection?.entryTime,
      updateGoogleContact: agdContext.googleIntegration?.updateExisting || false,
      createNewGoogleContact: agdContext.googleIntegration?.createNew || false,
      googleContactData: agdContext.googleIntegration?.contactData,
      
      // Godziny
      hours: agdContext.workHoursAdvanced?.preferred,
      orderHours: agdContext.workHoursAdvanced?.preferred,
      clientWorkHours: agdContext.workHoursAdvanced?.detailed,
      workHoursCustom: agdContext.workHoursAdvanced?.custom,
      workHours: agdContext.workHoursAdvanced?.flexible,
      
      // Urządzenia (przywrócenie z serwera)
      devices: this.restoreDevicesFromServer(serverContext.devices, agdContext.builtInSystem),
      builtInParams: agdContext.builtInSystem?.mainParams,
      
      // Status i workflow
      status: serverContext.status,
      priority: serverContext.priority,
      history: this.restoreHistoryFromServer(serverContext.changeLog),
      
      // Czasy
      estimatedDuration: serverContext.timing?.estimated,
      totalWorkTime: serverContext.legacy?.workTime,
      isTimerRunning: serverContext.legacy?.timerRunning,
      workSessions: serverContext.timing?.workSessions,
      actualStartTime: serverContext.timing?.actualStart,
      actualEndTime: serverContext.timing?.actualEnd,
      
      // Koszty
      cost: serverContext.pricing?.base?.toString(),
      laborCost: serverContext.pricing?.labor,
      partsCost: serverContext.pricing?.parts,
      travelCost: serverContext.pricing?.travel,
      totalCost: serverContext.pricing?.total,
      pricingSettings: serverContext.pricing?.settings,
      
      // Pozostałe
      partsUsed: this.restorePartsFromServer(serverContext.parts),
      beforePhotos: serverContext.documentation?.photos?.before,
      afterPhotos: serverContext.documentation?.photos?.after,
      completionPhotos: serverContext.documentation?.photos?.completion,
      workNotes: serverContext.documentation?.notes?.work,
      technicianNotes: serverContext.documentation?.notes?.technician,
      internalNotes: serverContext.documentation?.notes?.internal,
      clientFeedback: serverContext.documentation?.notes?.client,
      
      // Gwarancja
      warrantyMonths: serverContext.warranty?.months,
      warrantyNotes: serverContext.warranty?.notes,
      warrantyStatus: serverContext.warranty?.status,
      
      // Metadane
      dateAdded: serverContext.metadata?.dateAdded,
      createdAt: serverContext.metadata?.created,
      updatedAt: serverContext.metadata?.updated,
      createdBy: serverContext.metadata?.createdBy,
      lastModifiedBy: serverContext.metadata?.lastModifiedBy,
      syncStatus: serverContext.metadata?.syncStatus,
      
      // Legacy compatibility
      problemDescription: serverContext.legacy?.description,
      solutionDescription: serverContext.legacy?.solution,
      customerSignature: serverContext.legacy?.signature
    };
  }
  
  // ========== POMOCNICZE FUNKCJE ==========
  
  static hasBuiltInDevices(devices) {
    return devices?.some(device => device.builtIn) || false;
  }
  
  static extractBuiltInDevices(devices) {
    return devices?.filter(device => device.builtIn) || [];
  }
  
  static calculateBuiltInExtraTime(devices) {
    let totalExtraTime = 0;
    devices?.forEach(device => {
      if (device.builtIn && device.builtInParams?.czas) {
        const extraTime = parseInt(device.builtInParamsNotes?.czas) || 0;
        totalExtraTime += extraTime;
      }
    });
    return totalExtraTime;
  }
  
  static extractBuiltInRequirements(devices) {
    const requirements = [];
    devices?.forEach(device => {
      if (device.builtIn && device.builtInParams) {
        const params = device.builtInParams;
        if (params.demontaz) requirements.push("demontaż");
        if (params.montaz) requirements.push("montaż");
        if (params.trudna) requirements.push("trudna zabudowa");
        if (params.ograniczony) requirements.push("ograniczony dostęp");
        if (params.front) requirements.push("demontaż frontu");
      }
    });
    return [...new Set(requirements)]; // Unikalne wartości
  }
  
  static countBuiltInDevices(devices) {
    return devices?.filter(device => device.builtIn).length || 0;
  }
  
  static categorizeDevices(devices) {
    const categories = {};
    devices?.forEach(device => {
      const type = device.deviceType || "Inne";
      categories[type] = (categories[type] || 0) + 1;
    });
    return categories;
  }
  
  static hasErrorCodes(devices) {
    return devices?.some(device => device.errorCode) || false;
  }
  
  static requiresParts(devices) {
    return devices?.some(device => device.parts?.length > 0) || false;
  }
  
  static adaptDevicesForServer(devices) {
    return devices?.map((device, index) => ({
      id: index,
      type: device.deviceType,
      issue: device.issueDescription,
      errorCode: device.errorCode,
      producer: device.producer,
      model: device.model,
      parts: device.parts || [],
      notes: device.notes,
      builtIn: device.builtIn,
      builtInConfig: device.builtInParams,
      builtInNotes: device.builtInParamsNotes
    })) || [];
  }
  
  static extractMainDevice(devices) {
    if (!devices || devices.length === 0) return null;
    
    // Główne urządzenie to pierwsze z zabudową lub pierwsze w ogóle
    const builtInDevice = devices.find(device => device.builtIn);
    return builtInDevice || devices[0];
  }
  
  static calculatePriority(orderV3) {
    let priority = "medium";
    
    // Wysokie jeśli trudna zabudowa
    if (orderV3.devices?.some(device => device.builtInParams?.trudna)) {
      priority = "high";
    }
    
    // Krytyczne jeśli błędy i zabudowa jednocześnie
    if (orderV3.devices?.some(device => device.errorCode && device.builtIn)) {
      priority = "critical";
    }
    
    return orderV3.priority || priority;
  }
  
  static adaptHistoryForServer(history) {
    return history?.map(entry => ({
      timestamp: entry.date,
      action: entry.action,
      details: entry.details || entry.description,
      // Usuwamy emoji dla serwera, zachowujemy w rawDescription
      cleanDescription: entry.description?.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim(),
      rawDescription: entry.description
    })) || [];
  }
  
  static createServerChangeLog(history) {
    return {
      totalChanges: history?.length || 0,
      lastChange: history?.[history.length - 1]?.date,
      hasBuiltInChanges: history?.some(entry => entry.description?.includes('zabudowa')) || false,
      hasDeviceChanges: history?.some(entry => entry.description?.includes('Urządzenie')) || false,
      hasStatusChanges: history?.some(entry => entry.description?.includes('Status')) || false
    };
  }
  
  static calculateBuiltInSurcharge(devices) {
    let surcharge = 0;
    devices?.forEach(device => {
      if (device.builtIn && device.builtInParams) {
        if (device.builtInParams.trudna) surcharge += 50;
        if (device.builtInParams.ograniczony) surcharge += 25;
        if (device.builtInParams.czas) surcharge += 30;
      }
    });
    return surcharge;
  }
  
  static adaptPartsForServer(partsUsed) {
    return partsUsed?.map(part => ({
      name: part.partName,
      number: part.partNumber,
      quantity: part.quantity,
      unitCost: part.unitCost,
      totalCost: part.totalCost,
      deviceIndex: part.deviceIndex
    })) || [];
  }
  
  // Funkcje przywracania z serwera
  static restoreDevicesFromServer(serverDevices, builtInSystem) {
    return serverDevices?.map(device => ({
      deviceType: device.type,
      issueDescription: device.issue,
      errorCode: device.errorCode,
      producer: device.producer,
      model: device.model,
      parts: device.parts || [],
      notes: device.notes,
      builtIn: device.builtIn,
      builtInParams: device.builtInConfig || {},
      builtInParamsNotes: device.builtInNotes || {},
      showParts: false // UI state
    })) || [];
  }
  
  static restoreHistoryFromServer(changeLog) {
    // To będzie bardziej złożone - trzeba będzie przechowywać oryginalne history
    return [];
  }
  
  static restorePartsFromServer(serverParts) {
    return serverParts?.map(part => ({
      partName: part.name,
      partNumber: part.number,
      quantity: part.quantity,
      unitCost: part.unitCost,
      totalCost: part.totalCost,
      deviceIndex: part.deviceIndex
    })) || [];
  }
  
  /**
   * 🔍 Waliduje zlecenie Enhanced v3.0
   * @param {Object} orderV3 - Zlecenie do walidacji
   * @returns {Object} - Wynik walidacji { valid: boolean, errors: [] }
   */
  static validate(orderV3) {
    const errors = [];
    
    // Podstawowa walidacja
    if (!orderV3.orderNumber) errors.push("Brak numeru zlecenia");
    if (!orderV3.clientName) errors.push("Brak nazwy klienta");
    if (!orderV3.address) errors.push("Brak adresu");
    if (!orderV3.phone) errors.push("Brak telefonu");
    if (!orderV3.devices || orderV3.devices.length === 0) errors.push("Brak urządzeń");
    
    // Walidacja formatu numeru zlecenia
    if (orderV3.orderNumber && !orderV3.orderNumber.match(/^ORDA\d{8}$/)) {
      errors.push("Nieprawidłowy format numeru zlecenia (powinien być: ORDArrmmddnn)");
    }
    
    // Walidacja urządzeń
    orderV3.devices?.forEach((device, index) => {
      if (!device.deviceType) errors.push(`Urządzenie ${index + 1}: brak typu`);
      if (!device.issueDescription) errors.push(`Urządzenie ${index + 1}: brak opisu usterki`);
      
      // Walidacja zabudowy
      if (device.builtIn && !device.builtInParams) {
        errors.push(`Urządzenie ${index + 1}: zabudowa zaznaczona ale brak parametrów`);
      }
      
      // Walidacja kodu błędu
      if (device.issueDescription === "Wyświetla błąd:" && !device.errorCode) {
        errors.push(`Urządzenie ${index + 1}: wybrano "Wyświetla błąd" ale nie podano kodu`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * 📊 Generuje statystyki zlecenia Enhanced v3.0
   * @param {Object} orderV3 - Zlecenie Enhanced v3.0
   * @returns {Object} - Statystyki zlecenia
   */
  static generateStats(orderV3) {
    return {
      summary: {
        orderNumber: orderV3.orderNumber,
        clientName: orderV3.clientName,
        devicesCount: orderV3.devices?.length || 0,
        totalCost: orderV3.totalCost || 0,
        status: orderV3.status
      },
      
      agdFeatures: {
        hasBuiltIn: this.hasBuiltInDevices(orderV3.devices),
        builtInCount: this.countBuiltInDevices(orderV3.devices),
        extraTimeMinutes: this.calculateBuiltInExtraTime(orderV3.devices),
        hasCallDetection: !!orderV3.detectedCall,
        hasGoogleIntegration: orderV3.updateGoogleContact || orderV3.createNewGoogleContact,
        deviceCategories: this.categorizeDevices(orderV3.devices)
      },
      
      complexity: {
        score: this.calculateComplexityScore(orderV3),
        factors: this.getComplexityFactors(orderV3),
        estimated: orderV3.estimatedDuration,
        actualTime: orderV3.timeSpentMinutes
      },
      
      timeline: {
        created: orderV3.dateAdded,
        lastUpdate: orderV3.updatedAt,
        historyEntries: orderV3.history?.length || 0,
        statusChanges: orderV3.statusHistory?.length || 0
      }
    };
  }
  
  static calculateComplexityScore(orderV3) {
    let score = 1; // Bazowy
    
    if (this.hasBuiltInDevices(orderV3.devices)) score += 2;
    if (orderV3.devices?.some(device => device.builtInParams?.trudna)) score += 3;
    if (orderV3.devices?.some(device => device.errorCode)) score += 1;
    if (orderV3.devices?.length > 1) score += orderV3.devices.length - 1;
    
    return Math.min(score, 10); // Max 10
  }
  
  static getComplexityFactors(orderV3) {
    const factors = [];
    
    if (this.hasBuiltInDevices(orderV3.devices)) factors.push("Sprzęt w zabudowie");
    if (orderV3.devices?.some(device => device.builtInParams?.trudna)) factors.push("Trudna zabudowa");
    if (orderV3.devices?.some(device => device.builtInParams?.ograniczony)) factors.push("Ograniczony dostęp");
    if (orderV3.devices?.some(device => device.errorCode)) factors.push("Kody błędów");
    if (orderV3.devices?.length > 1) factors.push("Wiele urządzeń");
    
    return factors;
  }
}

module.exports = {
  EnhancedOrderV3Adapter,
  ENHANCED_ORDER_STRUCTURE_V3
};