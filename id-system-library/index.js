/**
 * ==========================================
 * TECHNIK ID SYSTEM LIBRARY - MAIN ENTRY
 * ==========================================
 * 
 * Główny punkt wejścia do biblioteki systemów ID
 * 
 * @version 1.0.0
 * @author Technik System
 * @license MIT
 */

// Import głównego systemu (najnowszy i rekomendowany)
const IDSystem = require('./id-system.js');

// Import starszego systemu (kompatybilność wsteczna)
const IDGenerator = require('./id-generator.js');

// Re-export wszystkich funkcji z głównego systemu jako default
module.exports = {
  // ========================================
  // GŁÓWNY SYSTEM (REKOMENDOWANY)
  // ========================================
  
  // Konfiguracja
  ID_PREFIXES: IDSystem.ID_PREFIXES,
  ORDER_SOURCES: IDSystem.ORDER_SOURCES,
  LIMITS: IDSystem.LIMITS,
  
  // Funkcje pomocnicze
  getDayOfYear: IDSystem.getDayOfYear,
  encodeDateCode: IDSystem.encodeDateCode,
  decodeDateCode: IDSystem.decodeDateCode,
  formatNumber: IDSystem.formatNumber,
  
  // Generatory główne
  generateOrderId: IDSystem.generateOrderId,
  generateClientId: IDSystem.generateClientId,
  generateEmployeeId: IDSystem.generateEmployeeId,
  generateServicemanId: IDSystem.generateServicemanId,
  generateVisitId: IDSystem.generateVisitId,
  generateAppointmentId: IDSystem.generateAppointmentId,
  generateGenericId: IDSystem.generateGenericId,
  generateLegacyOrderId: IDSystem.generateLegacyOrderId,
  
  // Dekodowanie i walidacja
  decodeId: IDSystem.decodeId,
  isValidId: IDSystem.isValidId,
  getEntityType: IDSystem.getEntityType,
  
  // Funkcje biznesowe
  getNextSequenceNumber: IDSystem.getNextSequenceNumber,
  generateCompleteId: IDSystem.generateCompleteId,
  
  // Funkcje mobilne
  generateMobileVisitId: IDSystem.generateMobileVisitId,
  generateMobileOrderId: IDSystem.generateMobileOrderId,
  isMobileId: IDSystem.isMobileId,
  
  // Statystyki
  getDayStatistics: IDSystem.getDayStatistics,
  
  // Walidacja
  validateInput: IDSystem.validateInput,
  
  // Narzędzia
  convertLegacyId: IDSystem.convertLegacyId,
  getAvailablePrefixes: IDSystem.getAvailablePrefixes,
  getAvailableSources: IDSystem.getAvailableSources,
  
  // ========================================
  // STARSZY SYSTEM (KOMPATYBILNOŚĆ)
  // ========================================
  
  // Dostęp do starszego systemu przez prefix 'legacy'
  legacy: {
    ID_PREFIXES: IDGenerator.ID_PREFIXES,
    SPECIAL_FORMATS: IDGenerator.SPECIAL_FORMATS,
    generateNextId: IDGenerator.generateNextId,
    generateClientId: IDGenerator.generateClientId,
    generateOrderId: IDGenerator.generateOrderId,
    generateOrderNumber: IDGenerator.generateOrderNumber,
    generateEmployeeId: IDGenerator.generateEmployeeId,
    generateServicemanId: IDGenerator.generateServicemanId,
    generateVisitId: IDGenerator.generateVisitId,
    generateVisitNumber: IDGenerator.generateVisitNumber,
    parseId: IDGenerator.parseId,
    isValidId: IDGenerator.isValidId,
    getNextNumber: IDGenerator.getNextNumber
  },
  
  // ========================================
  // METADATA I INFORMACJE
  // ========================================
  
  version: '1.0.0',
  
  // Informacje o systemach
  systems: {
    current: {
      name: 'id-system.js',
      version: '1.0.0',
      format: 'PREFIXŹRÓDŁODATANUMER',
      example: 'ORDA252710001',
      features: [
        'Kodowanie daty',
        'Źródła zleceń (A,M,W,T,E,R)',
        'Migracja legacy (OLD)',
        'Skalowalność 59,994/dzień',
        'Funkcje mobilne',
        'Walidacja i dekodowanie'
      ]
    },
    legacy: {
      name: 'id-generator.js',
      version: '0.5.0',
      format: 'PREFIX-XXX',
      example: 'ORD-001',
      features: [
        'Prostszy format',
        'Myślniki w ID',
        'Podstawowa numeracja',
        'Kompatybilność wsteczna'
      ]
    }
  },
  
  // Szybkie przykłady użycia
  examples: {
    // Podstawowe generowanie
    basicUsage: () => {
      console.log('=== PODSTAWOWE UŻYCIE ===');
      console.log('Zlecenie:', IDSystem.generateOrderId('A'));
      console.log('Klient:', IDSystem.generateClientId());
      console.log('Pracownik:', IDSystem.generateEmployeeId());
      console.log('');
    },
    
    // Dekodowanie
    decoding: (id = 'ORDA252710001') => {
      console.log('=== DEKODOWANIE ===');
      console.log('ID:', id);
      const decoded = IDSystem.decodeId(id);
      console.log('Dekodowane:', decoded);
      console.log('');
    },
    
    // Funkcje mobilne
    mobile: () => {
      console.log('=== FUNKCJE MOBILNE ===');
      console.log('Wizyta:', IDSystem.generateMobileVisitId());
      console.log('Zlecenie mobile:', IDSystem.generateMobileOrderId());
      console.log('');
    },
    
    // Migracja legacy
    legacy: () => {
      console.log('=== MIGRACJA LEGACY ===');
      console.log('Stare zlecenie:', IDSystem.generateLegacyOrderId('123'));
      console.log('Z timestamp:', IDSystem.generateLegacyOrderId('1696099051'));
      console.log('');
    },
    
    // Wszystkie przykłady naraz
    all: function() {
      this.basicUsage();
      this.decoding();
      this.mobile();
      this.legacy();
    }
  },
  
  // Szybkie testy
  test: {
    // Test podstawowych funkcji
    basic: () => {
      const tests = [
        { name: 'generateOrderId', fn: () => IDSystem.generateOrderId('A') },
        { name: 'generateClientId', fn: () => IDSystem.generateClientId() },
        { name: 'generateEmployeeId', fn: () => IDSystem.generateEmployeeId() },
        { name: 'generateLegacyOrderId', fn: () => IDSystem.generateLegacyOrderId('123') }
      ];
      
      console.log('=== TESTY PODSTAWOWE ===');
      tests.forEach(test => {
        try {
          const result = test.fn();
          console.log(`✅ ${test.name}: ${result}`);
        } catch (error) {
          console.log(`❌ ${test.name}: ${error.message}`);
        }
      });
      console.log('');
    },
    
    // Test dekodowania
    decoding: () => {
      const testIds = ['ORDA252710001', 'CLI252710001', 'OLD123456', 'INVALID'];
      
      console.log('=== TESTY DEKODOWANIA ===');
      testIds.forEach(id => {
        const decoded = IDSystem.decodeId(id);
        console.log(`${id}: ${decoded.isValid ? '✅' : '❌'} ${decoded.error || 'OK'}`);
      });
      console.log('');
    },
    
    // Wszystkie testy
    all: function() {
      this.basic();
      this.decoding();
    }
  }
};

// ========================================
// ES6 EXPORT (dla kompatybilności)
// ========================================

// Jeśli używane jako ES6 module
if (typeof exports !== 'undefined') {
  Object.assign(exports, module.exports);
}

// Global dla browser/React Native
if (typeof global !== 'undefined') {
  global.TechnikIDSystemLibrary = module.exports;
}
if (typeof window !== 'undefined') {
  window.TechnikIDSystemLibrary = module.exports;
}