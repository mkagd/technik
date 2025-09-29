const fs = require('fs');
const path = require('path');

// Skrypt optymalizacji struktury urządzeń - uproszczenie builtInParams
// Stworzony: 2025-09-29

class DeviceStructureOptimizationScript {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.orders = [];
    this.optimizationStats = {
      ordersProcessed: 0,
      devicesOptimized: 0,
      builtInParamsRemoved: 0,
      characteristicsAdded: 0,
      categoriesStandardized: 0
    };
  }

  // Definicje kategorii urządzeń i ich standardowych charakterystyk
  getDeviceCategories() {
    return {
      'AGD': {
        types: ['piekarnik', 'lodówka', 'pralka', 'zmywarka', 'mikrofalówka', 'płyta grzewcza'],
        commonCharacteristics: {
          powerSource: 'electric', // electric, gas, mixed
          installationType: 'built-in', // built-in, freestanding, countertop
          accessLevel: 'standard', // easy, standard, difficult
          serviceComplexity: 'medium' // low, medium, high
        }
      },
      'Elektronika': {
        types: ['laptop', 'komputer', 'telefon', 'tablet', 'monitor', 'drukarka'],
        commonCharacteristics: {
          portability: 'portable', // portable, desktop, fixed
          accessLevel: 'easy',
          serviceComplexity: 'medium',
          requiresDataBackup: true
        }
      },
      'Instalacje': {
        types: ['klimatyzacja', 'ogrzewanie', 'wentylacja', 'instalacja wodna'],
        commonCharacteristics: {
          installationType: 'fixed',
          accessLevel: 'difficult',
          serviceComplexity: 'high',
          requiresSpecialist: true
        }
      }
    };
  }

  // Mapowanie urządzeń na kategorie
  getDeviceTypeMapping() {
    return {
      // AGD
      'piekarnik': { category: 'AGD', standardName: 'Piekarnik', installationType: 'built-in' },
      'lodówka': { category: 'AGD', standardName: 'Lodówka', installationType: 'freestanding' },
      'pralka': { category: 'AGD', standardName: 'Pralka', installationType: 'freestanding' },
      'zmywarka': { category: 'AGD', standardName: 'Zmywarka', installationType: 'built-in' },
      'mikrofalówka': { category: 'AGD', standardName: 'Mikrofalówka', installationType: 'countertop' },
      'płyta': { category: 'AGD', standardName: 'Płyta grzewcza', installationType: 'built-in' },
      'płyta grzewcza': { category: 'AGD', standardName: 'Płyta grzewcza', installationType: 'built-in' },
      
      // Elektronika
      'laptop': { category: 'Elektronika', standardName: 'Laptop', portability: 'portable' },
      'komputer': { category: 'Elektronika', standardName: 'Komputer', portability: 'desktop' },
      'telefon': { category: 'Elektronika', standardName: 'Telefon', portability: 'portable' },
      'tablet': { category: 'Elektronika', standardName: 'Tablet', portability: 'portable' },
      'monitor': { category: 'Elektronika', standardName: 'Monitor', portability: 'desktop' },
      'drukarka': { category: 'Elektronika', standardName: 'Drukarka', portability: 'desktop' },
      
      // Specjalne
      'qwqw': { category: 'Nieznane', standardName: 'Nieokreślone urządzenie', requiresClassification: true },
      'sc': { category: 'Nieznane', standardName: 'Nieokreślone urządzenie', requiresClassification: true }
    };
  }

  // Wczytaj dane
  loadData() {
    console.log('📂 Wczytywanie danych...');
    
    try {
      // Wczytaj najnowszą wersję zamówień
      let ordersPath = path.join(this.dataDir, 'standardized-orders.json');
      if (!fs.existsSync(ordersPath)) {
        ordersPath = path.join(this.dataDir, 'improved-orders.json');
      }
      if (!fs.existsSync(ordersPath)) {
        ordersPath = path.join(this.dataDir, 'unified-orders.json');
      }
      
      if (fs.existsSync(ordersPath)) {
        this.orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        console.log(`📋 Wczytano ${this.orders.length} zamówień z ${path.basename(ordersPath)}`);
      } else {
        console.log('⚠️  Nie znaleziono pliku zamówień do optymalizacji');
      }
      
    } catch (error) {
      console.error('❌ Błąd podczas wczytywania danych:', error.message);
      throw error;
    }
  }

  // Konwertuj stary system builtInParams na nowy
  convertBuiltInParams(builtInParams) {
    if (!builtInParams || typeof builtInParams !== 'object') {
      return {};
    }
    
    const characteristics = {};
    
    // Mapowanie starych pól na nowe
    if (builtInParams.wolnostojacy !== undefined) {
      characteristics.installationType = builtInParams.wolnostojacy ? 'freestanding' : 'built-in';
    }
    
    if (builtInParams.ograniczony !== undefined) {
      characteristics.accessLevel = builtInParams.ograniczony ? 'difficult' : 'easy';
    }
    
    if (builtInParams.demontaz !== undefined) {
      characteristics.requiresDisassembly = builtInParams.demontaz;
    }
    
    if (builtInParams.montaz !== undefined) {
      characteristics.requiresAssembly = builtInParams.montaz;
    }
    
    if (builtInParams.trudna !== undefined) {
      characteristics.serviceComplexity = builtInParams.trudna ? 'high' : 'medium';
    }
    
    if (builtInParams.front !== undefined) {
      characteristics.frontAccess = builtInParams.front;
    }
    
    if (builtInParams.czas !== undefined) {
      characteristics.timeIntensive = builtInParams.czas;
    }
    
    return characteristics;
  }

  // Optymalizuj urządzenie
  optimizeDevice(device) {
    const deviceMapping = this.getDeviceTypeMapping();
    const deviceCategories = this.getDeviceCategories();
    
    // Znajdź mapowanie typu urządzenia
    const deviceKey = device.name?.toLowerCase() || device.type?.toLowerCase() || '';
    const deviceInfo = deviceMapping[deviceKey] || deviceMapping['qwqw']; // fallback
    
    // Rozpocznij od podstawowej struktury
    const optimizedDevice = {
      name: device.name || deviceInfo.standardName || 'Nieznane urządzenie',
      brand: device.brand || '',
      model: device.model || '',
      description: device.description || device.problem || '',
      
      // Nowa ujednolicona kategoria
      category: deviceInfo.category,
      type: deviceInfo.standardName || device.name,
      
      // Nowy system charakterystyk (zastępuje builtInParams)
      characteristics: {}
    };
    
    // Konwertuj stare builtInParams
    if (device.builtInParams) {
      const convertedCharacteristics = this.convertBuiltInParams(device.builtInParams);
      optimizedDevice.characteristics = { ...optimizedDevice.characteristics, ...convertedCharacteristics };
      this.optimizationStats.builtInParamsRemoved++;
    }
    
    // Dodaj standardowe charakterystyki dla kategorii
    const categoryDefaults = deviceCategories[deviceInfo.category]?.commonCharacteristics || {};
    Object.entries(categoryDefaults).forEach(([key, defaultValue]) => {
      if (!(key in optimizedDevice.characteristics)) {
        optimizedDevice.characteristics[key] = defaultValue;
      }
    });
    
    // Dodaj specyficzne charakterystyki z mapowania
    Object.entries(deviceInfo).forEach(([key, value]) => {
      if (key !== 'category' && key !== 'standardName' && key !== 'requiresClassification') {
        optimizedDevice.characteristics[key] = value;
      }
    });
    
    // Oznacz urządzenia wymagające klasyfikacji
    if (deviceInfo.requiresClassification) {
      optimizedDevice.requiresManualClassification = true;
      optimizedDevice.classificationNotes = 'Urządzenie wymaga ręcznej klasyfikacji przez administratora';
    }
    
    // Dodaj informacje o serwisie
    optimizedDevice.serviceInfo = {
      estimatedDuration: this.estimateServiceDuration(optimizedDevice),
      requiredTools: this.getRequiredTools(optimizedDevice),
      safetyRequirements: this.getSafetyRequirements(optimizedDevice)
    };
    
    this.optimizationStats.devicesOptimized++;
    this.optimizationStats.characteristicsAdded++;
    
    return optimizedDevice;
  }

  // Oszacuj czas serwisu
  estimateServiceDuration(device) {
    const baseTime = 60; // 60 minut jako podstawa
    let multiplier = 1;
    
    // Modyfikatory czasu
    if (device.characteristics?.serviceComplexity === 'high') multiplier *= 1.5;
    if (device.characteristics?.serviceComplexity === 'low') multiplier *= 0.7;
    
    if (device.characteristics?.accessLevel === 'difficult') multiplier *= 1.3;
    if (device.characteristics?.accessLevel === 'easy') multiplier *= 0.8;
    
    if (device.characteristics?.requiresDisassembly) multiplier *= 1.2;
    if (device.characteristics?.requiresAssembly) multiplier *= 1.2;
    
    return Math.round(baseTime * multiplier);
  }

  // Określ wymagane narzędzia
  getRequiredTools(device) {
    const tools = ['podstawowy zestaw narzędzi'];
    
    if (device.category === 'AGD') {
      tools.push('multimetr', 'klucze do AGD');
    }
    
    if (device.category === 'Elektronika') {
      tools.push('zestaw śrubokrętów precyzyjnych', 'multimetr cyfrowy');
    }
    
    if (device.category === 'Instalacje') {
      tools.push('narzędzia hydrauliczne', 'detektor przewodów');
    }
    
    if (device.characteristics?.requiresDisassembly) {
      tools.push('narzędzia do demontażu');
    }
    
    return tools;
  }

  // Określ wymagania bezpieczeństwa
  getSafetyRequirements(device) {
    const requirements = [];
    
    if (device.category === 'AGD') {
      requirements.push('wyłączenie zasilania', 'sprawdzenie braku napięcia');
    }
    
    if (device.category === 'Elektronika') {
      requirements.push('wyładowanie kondensatorów', 'zabezpieczenie przed ESD');
    }
    
    if (device.category === 'Instalacje') {
      requirements.push('wyłączenie mediów', 'sprawdzenie ciśnienia');
    }
    
    if (device.characteristics?.serviceComplexity === 'high') {
      requirements.push('dodatkowe środki ostrożności');
    }
    
    return requirements;
  }

  // Optymalizuj wszystkie zamówienia
  optimizeAllOrders() {
    console.log('🔄 Optymalizacja struktury urządzeń...');
    
    this.orders = this.orders.map(order => {
      if (!order.devices || !Array.isArray(order.devices)) {
        this.optimizationStats.ordersProcessed++;
        return order;
      }
      
      const optimizedDevices = order.devices.map(device => this.optimizeDevice(device));
      
      // Aktualizuj kategorie usług na podstawie urządzeń
      const deviceCategories = [...new Set(optimizedDevices.map(d => d.category))];
      const primaryCategory = deviceCategories[0] || 'Inne';
      
      const updatedOrder = {
        ...order,
        devices: optimizedDevices,
        
        // Aktualizuj kategorie usług
        service: {
          ...order.service,
          category: this.standardizeServiceCategory(order.service?.category, primaryCategory),
          deviceCategories: deviceCategories,
          complexity: this.calculateServiceComplexity(optimizedDevices)
        },
        
        // Aktualizuj czas realizacji na podstawie urządzeń
        scheduling: {
          ...order.scheduling,
          estimatedDuration: optimizedDevices.reduce((total, device) => 
            total + device.serviceInfo.estimatedDuration, 0),
          requiredTools: [...new Set(optimizedDevices.flatMap(d => d.serviceInfo.requiredTools))],
          safetyRequirements: [...new Set(optimizedDevices.flatMap(d => d.serviceInfo.safetyRequirements))]
        },
        
        // Dodaj informacje o optymalizacji
        optimizationInfo: {
          optimizedAt: new Date().toISOString(),
          devicesOptimized: optimizedDevices.length,
          builtInParamsConverted: order.devices.filter(d => d.builtInParams).length,
          version: '1.0'
        }
      };
      
      this.optimizationStats.ordersProcessed++;
      
      if (order.service?.category !== updatedOrder.service?.category) {
        this.optimizationStats.categoriesStandardized++;
        console.log(`  📝 ${order.id}: Kategoria '${order.service?.category}' → '${updatedOrder.service?.category}'`);
      }
      
      return updatedOrder;
    });
    
    console.log(`📊 Zoptymalizowano urządzenia w ${this.optimizationStats.ordersProcessed} zamówieniach`);
  }

  // Standaryzuj kategorie usług
  standardizeServiceCategory(currentCategory, deviceCategory) {
    const categoryMapping = {
      'Naprawa laptopa': 'Serwis elektroniki',
      'Naprawa laptopów': 'Serwis elektroniki', 
      'Naprawa komputerów': 'Serwis elektroniki',
      'Naprawa telefonu': 'Serwis elektroniki',
      'Naprawa piekarników': 'Serwis AGD',
      'Naprawa lodówek': 'Serwis AGD',
      'Naprawa pralek': 'Serwis AGD',
      'Naprawa zmywarek': 'Serwis AGD',
      'Serwis AGD': 'Serwis AGD',
      'serwis': 'Serwis ogólny',
      'instalacja': 'Instalacje',
      'konsultacja': 'Konsultacje'
    };
    
    // Najpierw sprawdź mapowanie
    if (categoryMapping[currentCategory]) {
      return categoryMapping[currentCategory];
    }
    
    // Następnie na podstawie kategorii urządzenia
    const deviceCategoryMapping = {
      'AGD': 'Serwis AGD',
      'Elektronika': 'Serwis elektroniki',
      'Instalacje': 'Instalacje'
    };
    
    return deviceCategoryMapping[deviceCategory] || currentCategory || 'Inne usługi';
  }

  // Oblicz złożoność serwisu
  calculateServiceComplexity(devices) {
    if (!devices || devices.length === 0) return 'medium';
    
    const complexities = devices.map(device => device.characteristics?.serviceComplexity || 'medium');
    
    if (complexities.includes('high')) return 'high';
    if (complexities.every(c => c === 'low')) return 'low';
    return 'medium';
  }

  // Zapisz zoptymalizowane dane
  async saveOptimizedData() {
    console.log('💾 Zapisywanie zoptymalizowanych danych...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      // Zapisz zoptymalizowane zamówienia
      const optimizedOrdersPath = path.join(this.dataDir, 'device-optimized-orders.json');
      fs.writeFileSync(optimizedOrdersPath, JSON.stringify(this.orders, null, 2));
      
      // Zapisz słownik kategorii urządzeń
      const deviceCategoriesPath = path.join(this.dataDir, 'device-categories.json');
      fs.writeFileSync(deviceCategoriesPath, JSON.stringify({
        categories: this.getDeviceCategories(),
        typeMapping: this.getDeviceTypeMapping(),
        lastUpdated: new Date().toISOString()
      }, null, 2));
      
      console.log('✅ Zapisano zoptymalizowane dane:');
      console.log(`  - device-optimized-orders.json (${this.orders.length} zamówień)`);
      console.log(`  - device-categories.json (słownik kategorii)`);
      
    } catch (error) {
      console.error('❌ Błąd podczas zapisywania:', error.message);
      throw error;
    }
  }

  // Główna funkcja optymalizacji
  async optimizeDeviceStructure() {
    console.log('🚀 Rozpoczynam optymalizację struktury urządzeń...');
    
    this.loadData();
    this.optimizeAllOrders();
    await this.saveOptimizedData();
    
    this.showOptimizationStatistics();
    
    console.log('✅ Optymalizacja struktury urządzeń zakończona!');
  }

  // Wyświetl statystyki optymalizacji
  showOptimizationStatistics() {
    console.log('\n📊 STATYSTYKI OPTYMALIZACJI:');
    console.log(`Zamówienia przetworzone: ${this.optimizationStats.ordersProcessed}`);
    console.log(`Urządzenia zoptymalizowane: ${this.optimizationStats.devicesOptimized}`);
    console.log(`Usunięte builtInParams: ${this.optimizationStats.builtInParamsRemoved}`);
    console.log(`Dodane charakterystyki: ${this.optimizationStats.characteristicsAdded}`);
    console.log(`Standaryzowane kategorie: ${this.optimizationStats.categoriesStandardized}`);
    
    // Analiza kategorii urządzeń
    const categoryStats = {};
    this.orders.forEach(order => {
      if (order.devices) {
        order.devices.forEach(device => {
          const category = device.category || 'Nieznane';
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        });
      }
    });
    
    console.log('\nRozkład kategorii urządzeń:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
  }
}

// Uruchom jeśli wywołany bezpośrednio
if (require.main === module) {
  const script = new DeviceStructureOptimizationScript();
  script.optimizeDeviceStructure().catch(console.error);
}

module.exports = DeviceStructureOptimizationScript;