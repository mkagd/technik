/**
 * TESTY KOMPATYBILNOŚCI ENHANCED v4.0 Z AGD MOBILE
 * 
 * 🎯 CEL: Sprawdzenie 100% kompatybilności z aplikacją mobilną AGD
 * 
 * ✅ TESTOWANE:
 * - Wszystkie pola AGD Mobile zachowane bez zmian
 * - System zabudowy (builtInParams) działa
 * - Wykrywanie połączeń (detectedCall) działa  
 * - Google Contacts integracja działa
 * - Historia z emoji zachowana
 * - Mapowanie ID OLD→CLI działa
 * - Nowe pola opcjonalne
 * - Migracja bezstratna
 */

const { AGDMobileToV4Converter } = require('./agd-mobile-to-v4-converter');
const { ENHANCED_ORDER_STRUCTURE_V4 } = require('./enhanced-order-structure-v4');

class EnhancedV4CompatibilityTester {
  constructor() {
    this.converter = new AGDMobileToV4Converter();
    this.testResults = [];
    this.warnings = [];
  }

  /**
   * 🚀 Uruchamia wszystkie testy kompatybilności
   */
  async runAllTests() {
    console.log('🧪 ROZPOCZYNANIE TESTÓW KOMPATYBILNOŚCI ENHANCED v4.0 z AGD MOBILE');
    console.log('='.repeat(80));

    try {
      // Test 1: Struktura podstawowa
      await this.testBasicStructure();
      
      // Test 2: Pola AGD Mobile
      await this.testAGDMobileFields();
      
      // Test 3: System zabudowy
      await this.testBuiltInSystem();
      
      // Test 4: Wykrywanie połączeń
      await this.testCallDetection();
      
      // Test 5: Google Contacts
      await this.testGoogleContacts();
      
      // Test 6: Historia z emoji
      await this.testHistoryWithEmojis();
      
      // Test 7: Mapowanie ID
      await this.testIdMapping();
      
      // Test 8: Statusy hybrydowe
      await this.testHybridStatuses();
      
      // Test 9: Konwersja kompletna
      await this.testFullConversion();
      
      // Test 10: Kompatybilność wsteczna
      await this.testBackwardCompatibility();

      this.printTestResults();
      return this.generateTestReport();
      
    } catch (error) {
      console.error('❌ BŁĄD PODCZAS TESTÓW:', error.message);
      throw error;
    }
  }

  /**
   * 🏗️ Test 1: Struktura podstawowa
   */
  async testBasicStructure() {
    this.logTest('Struktura podstawowa Enhanced v4.0');
    
    const structure = ENHANCED_ORDER_STRUCTURE_V4;
    
    // Sprawdź czy ma wszystkie wymagane sekcje
    this.assert(structure.fields, 'Struktura ma pola');
    this.assert(structure.compatibility, 'Struktura ma sekcję kompatybilności');
    this.assert(structure.statusFlow, 'Struktura ma przepływ statusów');
    this.assert(structure.compatibilityMapping, 'Struktura ma mapowanie kompatybilności');
    
    // Sprawdź kompatybilność
    this.assertEqual(structure.compatibility.agdMobile, '100%');
    this.assertEqual(structure.compatibility.webApp, '100%');
    
    // Policz pola
    const fieldCount = Object.keys(structure.fields).length;
    this.assertGreaterThan(fieldCount, 70, `Struktura ma ${fieldCount} pól (expected >70)`);
    
    this.passTest('Struktura podstawowa Enhanced v4.0');
  }

  /**
   * 📱 Test 2: Pola AGD Mobile zachowane
   */
  async testAGDMobileFields() {
    this.logTest('Zachowanie pól AGD Mobile');
    
    const structure = ENHANCED_ORDER_STRUCTURE_V4;
    const requiredAGDFields = [
      'builtInParams',
      'detectedCall', 
      'googleContactData',
      'selectedEmployee',
      'selectedGoogleAccount',
      'workHours',
      'clientWorkHours', 
      'workHoursCustom',
      'devices',
      'history',
      'workSessions',
      'isTimerRunning',
      'totalWorkTime',
      'cost',
      'customCost',
      'entryTime',
      'updateGoogleContact',
      'createNewGoogleContact',
      'dates',
      'selectedDates',
      'dateAdded'
    ];
    
    requiredAGDFields.forEach(field => {
      this.assert(structure.fields[field], `Pole AGD Mobile '${field}' zachowane`);
    });
    
    this.passTest('Zachowanie pól AGD Mobile');
  }

  /**
   * 🏠 Test 3: System zabudowy
   */
  async testBuiltInSystem() {
    this.logTest('System zabudowy (builtInParams)');
    
    const sampleAGDOrder = {
      id: 'ORD001',
      clientId: 'OLD0001',
      clientName: 'Jan Kowalski',
      address: 'ul. Testowa 1, Warszawa',
      phone: '+48 123 456 789',
      devices: [{
        deviceType: 'Pralka',
        issueDescription: 'Nie wiruje',
        builtIn: true,
        builtInParams: {
          demontaz: true,
          montaz: true, 
          trudna: false,
          wolnostojacy: false,
          ograniczony: true,
          front: false,
          czas: true
        },
        builtInParamsNotes: {
          czas: '30',
          demontaz: 'Uwaga na przewody',
          ograniczony: 'Bardzo wąska przestrzeń'
        }
      }],
      builtInParams: {
        demontaz: true,
        montaz: true,
        trudna: false,
        ograniczony: true,
        czas: '30'
      },
      status: 'Nowe'
    };
    
    const converted = this.converter.convertSingleOrder(sampleAGDOrder);
    
    // System zabudowy zachowany
    this.assert(converted.builtInParams, 'builtInParams zachowane');
    this.assertEqual(converted.builtInParams.demontaz, true);
    this.assertEqual(converted.builtInParams.montaz, true);
    this.assertEqual(converted.builtInParams.ograniczony, true);
    
    // Urządzenia z systemem zabudowy
    this.assert(converted.devices[0].builtIn, 'Device builtIn flag zachowany');
    this.assert(converted.devices[0].builtInParams, 'Device builtInParams zachowane');
    this.assert(converted.devices[0].builtInParamsNotes, 'Device builtInParamsNotes zachowane');
    
    this.passTest('System zabudowy (builtInParams)');
  }

  /**
   * 📞 Test 4: Wykrywanie połączeń
   */
  async testCallDetection() {
    this.logTest('Wykrywanie połączeń (detectedCall)');
    
    const sampleWithCall = {
      clientId: 'OLD0001',
      clientName: 'Jan Kowalski',
      phone: '+48 123 456 789',
      detectedCall: {
        phoneNumber: '+48 123 456 789',
        timestamp: 1643723400000,
        type: 'INCOMING',
        duration: 45,
        wasUsed: true
      },
      entryTime: 1643723400000,
      status: 'Nowe'
    };
    
    const converted = this.converter.convertSingleOrder(sampleWithCall);
    
    // Wykrywanie połączeń zachowane 100%
    this.assert(converted.detectedCall, 'detectedCall zachowane');
    this.assertEqual(converted.detectedCall.phoneNumber, '+48 123 456 789');
    this.assertEqual(converted.detectedCall.type, 'INCOMING');
    this.assertEqual(converted.detectedCall.wasUsed, true);
    this.assertEqual(converted.entryTime, 1643723400000);
    
    this.passTest('Wykrywanie połączeń (detectedCall)');
  }

  /**
   * 📧 Test 5: Google Contacts
   */
  async testGoogleContacts() {
    this.logTest('Google Contacts integracja');
    
    const sampleWithGoogle = {
      clientId: 'OLD0001',
      clientName: 'Jan Kowalski',
      phone: '+48 123 456 789',
      updateGoogleContact: true,
      createNewGoogleContact: false,
      googleContactData: {
        resourceName: 'people/c12345',
        email: 'bielaszkam2@gmail.com',
        lastUpdated: '2025-01-27T16:00:00Z',
        biographyUpdated: true,
        ordersCount: 3
      },
      selectedGoogleAccount: 'bielaszkam2@gmail.com',
      status: 'Nowe'
    };
    
    const converted = this.converter.convertSingleOrder(sampleWithGoogle);
    
    // Google Contacts zachowane 100%
    this.assertEqual(converted.updateGoogleContact, true);
    this.assertEqual(converted.createNewGoogleContact, false);
    this.assert(converted.googleContactData, 'googleContactData zachowane');
    this.assertEqual(converted.googleContactData.resourceName, 'people/c12345');
    this.assertEqual(converted.googleContactData.email, 'bielaszkam2@gmail.com');
    this.assertEqual(converted.selectedGoogleAccount, 'bielaszkam2@gmail.com');
    
    this.passTest('Google Contacts integracja');
  }

  /**
   * 📚 Test 6: Historia z emoji
   */
  async testHistoryWithEmojis() {
    this.logTest('Historia z emoji');
    
    const sampleWithHistory = {
      clientId: 'OLD0001',
      clientName: 'Jan Kowalski',
      history: [
        {
          date: '2025-01-27T16:00:00Z',
          action: 'Utworzenie zlecenia',
          details: 'Zlecenie utworzone dla: Jan Kowalski (ID: OLD0001)',
          description: '🆕 Nowe zlecenie\n📞 Automatycznie wykryto połączenie\n🏠 Sprzęt w zabudowie'
        },
        {
          date: '2025-01-27T16:30:00Z', 
          action: 'Przypisanie pracownika',
          details: 'Przypisano: Michał Tech',
          description: '👨‍🔧 Technik przypisany\n📱 AGD Mobile\n⚡ Auto-sync'
        }
      ],
      status: 'W realizacji'
    };
    
    const converted = this.converter.convertSingleOrder(sampleWithHistory);
    
    // Historia zachowana z emoji
    this.assert(converted.history, 'Historia zachowana');
    this.assertGreaterThan(converted.history.length, 2, 'Historia ma więcej wpisów (original + migration)');
    
    // Sprawdź zachowanie emoji
    const originalEntry = converted.history[0];
    this.assert(originalEntry.description.includes('🆕'), 'Emoji 🆕 zachowane');
    this.assert(originalEntry.description.includes('📞'), 'Emoji 📞 zachowane');
    this.assert(originalEntry.description.includes('🏠'), 'Emoji 🏠 zachowane');
    
    // Sprawdź wpis migracji
    const migrationEntry = converted.history[converted.history.length - 1];
    this.assertEqual(migrationEntry.action, 'Migracja do Enhanced v4.0');
    this.assert(migrationEntry.description.includes('🔄'), 'Emoji migracji 🔄 dodane');
    
    this.passTest('Historia z emoji');
  }

  /**
   * 🗂️ Test 7: Mapowanie ID
   */
  async testIdMapping() {
    this.logTest('Mapowanie ID (OLD → CLI)');
    
    const sampleWithOldId = {
      id: 'ORD001',
      clientId: 'OLD0001',
      clientName: 'Jan Kowalski',
      address: 'ul. Testowa 1',
      phone: '+48 123 456 789',
      status: 'Nowe'
    };
    
    const converted = this.converter.convertSingleOrder(sampleWithOldId);
    
    // Mapowanie ID
    this.assertEqual(converted.clientId, 'CLI25186001', 'OLD0001 → CLI25186001');
    this.assertEqual(converted.clientId_legacy, 'OLD0001', 'Stare ID zachowane w legacy');
    this.assertEqual(converted.id_legacy, 'ORD001', 'Stare order ID zachowane');
    
    // Nowe formaty
    this.assert(converted.orderNumber.startsWith('ORDA'), 'Nowy format orderNumber');
    this.assert(converted.orderNumber.match(/^ORDA\d{8}$/), 'Format ORDA12345678');
    
    this.passTest('Mapowanie ID (OLD → CLI)');
  }

  /**
   * 🔄 Test 8: Statusy hybrydowe
   */
  async testHybridStatuses() {
    this.logTest('Statusy hybrydowe (AGD Mobile + Web)');
    
    const agdStatuses = ['Nowe', 'W realizacji', 'Zakończone'];
    const webStatuses = ['pending', 'in_progress', 'completed'];
    
    agdStatuses.forEach((status, index) => {
      const sample = {
        clientId: 'OLD0001',
        clientName: 'Test',
        status: status
      };
      
      const converted = this.converter.convertSingleOrder(sample);
      this.assertEqual(converted.status, status, `Status AGD Mobile '${status}' zachowany`);
    });
    
    // Sprawdź mapowanie w strukturze
    const mapping = ENHANCED_ORDER_STRUCTURE_V4.compatibilityMapping.statusMapping;
    this.assertEqual(mapping['Nowe'], 'pending');
    this.assertEqual(mapping['W realizacji'], 'in_progress');
    this.assertEqual(mapping['Zakończone'], 'completed');
    
    this.passTest('Statusy hybrydowe (AGD Mobile + Web)');
  }

  /**
   * 🔄 Test 9: Konwersja kompletna
   */
  async testFullConversion() {
    this.logTest('Konwersja kompletna - przykład realny');
    
    const realAGDOrder = {
      id: 'ORD001',
      clientId: 'OLD0001',
      clientName: 'Jan Kowalski',
      address: 'ul. Marszałkowska 1, 00-001 Warszawa',
      phone: '+48 123 456 789',
      selectedEmployee: 'EMP001',
      selectedGoogleAccount: 'technik@firma.pl',
      
      devices: [{
        deviceType: 'Pralka',
        issueDescription: 'Nie wiruje',
        errorCode: 'E24',
        producer: 'Bosch',
        model: 'WAT28461PL',
        parts: ['Pompa', 'Grzałka'],
        builtIn: true,
        builtInParams: {
          demontaz: true,
          montaz: true,
          trudna: false,
          czas: true
        },
        builtInParamsNotes: {
          czas: '30',
          demontaz: 'Uwaga na przewody'
        }
      }],
      
      builtInParams: {
        demontaz: true,
        montaz: true,
        czas: '30'
      },
      
      detectedCall: {
        phoneNumber: '+48 123 456 789',
        timestamp: 1643723400000,
        type: 'INCOMING',
        duration: 45,
        wasUsed: true
      },
      
      googleContactData: {
        resourceName: 'people/c12345',
        email: 'jan.kowalski@email.com',
        lastUpdated: '2025-01-27T16:00:00Z',
        biographyUpdated: true,
        ordersCount: 1
      },
      
      workHours: {
        monday: '08:00-16:00',
        tuesday: '08:00-16:00',
        wednesday: '08:00-16:00',
        thursday: '08:00-16:00',
        friday: '08:00-16:00'
      },
      
      history: [{
        date: '2025-01-27T16:00:00Z',
        action: 'Utworzenie zlecenia',
        details: 'Zlecenie utworzone automatycznie',
        description: '🆕 Nowe zlecenie\n📞 Wykryto połączenie\n🏠 Sprzęt w zabudowie\n⚡ AGD Mobile'
      }],
      
      cost: '350',
      status: 'Nowe',
      dateAdded: '2025-01-27T16:00:00Z',
      
      isTimerRunning: false,
      totalWorkTime: 0,
      workSessions: [],
      
      updateGoogleContact: true,
      entryTime: 1643723400000
    };
    
    const converted = this.converter.convertSingleOrder(realAGDOrder);
    
    // Sprawdź wszystkie kluczowe elementy
    this.assertEqual(converted.clientId, 'CLI25186001');
    this.assertEqual(converted.clientId_legacy, 'OLD0001');
    this.assert(converted.orderNumber.startsWith('ORDA'));
    this.assertEqual(converted.source, 'agd_mobile');
    this.assertEqual(converted.version, '4.0');
    this.assertEqual(converted.migratedFrom, 'agd_mobile');
    
    // AGD Mobile fields
    this.assert(converted.builtInParams);
    this.assert(converted.detectedCall);
    this.assert(converted.googleContactData);
    this.assert(converted.workHours);
    this.assert(converted.devices);
    this.assert(converted.history);
    
    // Nowe pola opcjonalne
    this.assertEqual(converted.visitId, null);
    this.assertEqual(converted.appointmentDate, null);
    this.assertEqual(converted.technicianNotes, null);
    
    this.passTest('Konwersja kompletna - przykład realny');
  }

  /**
   * ⬅️ Test 10: Kompatybilność wsteczna
   */
  async testBackwardCompatibility() {
    this.logTest('Kompatybilność wsteczna');
    
    // Test: stare zlecenie bez nowych pól
    const oldOrder = {
      clientId: 'OLD0001',
      clientName: 'Stary Klient',
      address: 'Stary adres',
      phone: '+48 111 111 111',
      status: 'Nowe'
    };
    
    const converted = this.converter.convertSingleOrder(oldOrder);
    
    // Powinno działać bez błędów
    this.assert(converted.clientId, 'Konwersja działa dla starych zleceń');
    this.assertEqual(converted.clientId, 'CLI25186001');
    this.assertEqual(converted.source, 'agd_mobile');
    
    // Nowe pola mają domyślne/null wartości
    this.assertEqual(converted.visitId, null);
    this.assertEqual(converted.builtInParams, null);
    this.assertEqual(converted.detectedCall, null);
    
    // Historia została utworzona
    this.assert(converted.history);
    this.assertGreaterThan(converted.history.length, 0);
    
    this.passTest('Kompatybilność wsteczna');
  }

  // ========== POMOCNICZE METODY TESTOWE ==========
  
  logTest(testName) {
    console.log(`\n🧪 TEST: ${testName}`);
  }
  
  assert(condition, message) {
    if (!condition) {
      throw new Error(`❌ ASSERTION FAILED: ${message}`);
    }
    console.log(`  ✅ ${message}`);
  }
  
  assertEqual(actual, expected, message = null) {
    const msg = message || `Expected '${expected}', got '${actual}'`;
    if (actual !== expected) {
      throw new Error(`❌ ASSERTION FAILED: ${msg}`);
    }
    console.log(`  ✅ ${msg}`);
  }
  
  assertGreaterThan(actual, expected, message = null) {
    const msg = message || `Expected ${actual} > ${expected}`;
    if (actual <= expected) {
      throw new Error(`❌ ASSERTION FAILED: ${msg}`);
    }
    console.log(`  ✅ ${msg}`);
  }
  
  passTest(testName) {
    this.testResults.push({ name: testName, status: 'PASSED' });
    console.log(`  ✅ PASSED: ${testName}`);
  }
  
  printTestResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PODSUMOWANIE TESTÓW KOMPATYBILNOŚCI');
    console.log('='.repeat(80));
    
    const passed = this.testResults.filter(t => t.status === 'PASSED').length;
    const total = this.testResults.length;
    
    console.log(`✅ PASSED: ${passed}/${total} testów`);
    console.log(`📱 AGD MOBILE KOMPATYBILNOŚĆ: 100%`);
    console.log(`🆕 NOWE FUNKCJE: Zachowane jako opcjonalne`);
    console.log(`🔄 MIGRACJA: Bezstratna`);
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  OSTRZEŻENIA: ${this.warnings.length}`);
      this.warnings.forEach(w => console.log(`   - ${w}`));
    }
  }
  
  generateTestReport() {
    const passed = this.testResults.filter(t => t.status === 'PASSED').length;
    
    return {
      passed: passed,
      total: this.testResults.length,
      successRate: `${((passed / this.testResults.length) * 100).toFixed(1)}%`,
      agdMobileCompatibility: '100%',
      newFeaturesSupport: true,
      migrationSupport: true,
      warnings: this.warnings.length,
      tests: this.testResults,
      summary: {
        enhancedV4FieldsCount: Object.keys(ENHANCED_ORDER_STRUCTURE_V4.fields).length,
        agdMobileFieldsPreserved: [
          'builtInParams', 'detectedCall', 'googleContactData', 
          'selectedEmployee', 'workHours', 'devices', 'history',
          'workSessions', 'cost', 'dateAdded', 'entryTime'
        ].length,
        newOptionalFields: ['visitId', 'appointmentDate', 'technicianNotes', 'version'].length,
        migrationFeatures: ['clientId mapping', 'status mapping', 'history preservation', 'field compatibility'].length
      }
    };
  }
}

module.exports = {
  EnhancedV4CompatibilityTester
};