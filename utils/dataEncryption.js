/**
 * 🔐 SYSTEM SZYFROWANIA DANYCH WRAŻLIWYCH
 * 
 * Implementuje selektywne szyfrowanie wrażliwych danych osobowych
 * zgodnie z RODO/GDPR - tylko dane które tego wymagają
 * 
 * Wersja: 1.0
 * Data: 2025-01-23
 */

const crypto = require('crypto');

// ========== KONFIGURACJA SZYFROWANIA ==========
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  
  // Klucz szyfrowania (NIGDY nie commituj do repozytorium!)
  // W produkcji: process.env.ENCRYPTION_KEY
  key: process.env.ENCRYPTION_KEY || crypto.randomBytes(32)
};

// ========== POLA DO SZYFROWANIA ==========
const SENSITIVE_FIELDS = {
  clients: [
    'name',           // Imię i nazwisko
    'email',          // Adres email
    'phones',         // Numery telefonów
    'addresses',      // Adresy zamieszkania
    'companyInfo.nip', // NIP firmy
    'companyInfo.regon', // REGON
    'contactHistory', // Historia kontaktów
    'notes',          // Prywatne notatki
    'coordinates'     // Dokładne koordynaty GPS
  ],
  
  orders: [
    'customerName',   // Nazwa klienta
    'customerPhone',  // Telefon klienta
    'customerEmail',  // Email klienta
    'address',        // Adres serwisu
    'addressDetails', // Szczegółowe dane adresowe
    'notes',          // Notatki do zamówienia
    'internalNotes'   // Wewnętrzne uwagi
  ],
  
  employees: [
    'firstName',      // Imię pracownika
    'lastName',       // Nazwisko
    'email',          // Email służbowy
    'phone',          // Telefon służbowy
    'emergencyPhone', // Telefon awaryjny
    'personalNotes'   // Osobiste uwagi
  ]
};

// ========== GŁÓWNA KLASA SZYFROWANIA ==========
class DataEncryption {
  
  /**
   * Szyfruje pojedynczą wartość
   */
  static encrypt(text) {
    if (!text || typeof text !== 'string') return text;
    
    try {
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
      const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, ENCRYPTION_CONFIG.key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Format: iv:tag:encryptedData
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('❌ Błąd szyfrowania:', error.message);
      return text; // Zwróć oryginalny tekst w przypadku błędu
    }
  }
  
  /**
   * Odszyfrowuje pojedynczą wartość
   */
  static decrypt(encryptedText) {
    if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
      return encryptedText; // Prawdopodobnie niezaszyfrowane
    }
    
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText;
      
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.algorithm, ENCRYPTION_CONFIG.key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('❌ Błąd odszyfrowywania:', error.message);
      return encryptedText; // Zwróć zaszyfrowany tekst w przypadku błędu
    }
  }
  
  /**
   * Szyfruje obiekt - tylko wrażliwe pola
   */
  static encryptObject(obj, dataType = 'clients') {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveFields = SENSITIVE_FIELDS[dataType] || [];
    const result = { ...obj };
    
    sensitiveFields.forEach(field => {
      const value = this.getNestedValue(result, field);
      if (value) {
        this.setNestedValue(result, field, this.encryptValue(value));
      }
    });
    
    return result;
  }
  
  /**
   * Odszyfrowuje obiekt - tylko wrażliwe pola
   */
  static decryptObject(obj, dataType = 'clients') {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveFields = SENSITIVE_FIELDS[dataType] || [];
    const result = { ...obj };
    
    sensitiveFields.forEach(field => {
      const value = this.getNestedValue(result, field);
      if (value) {
        this.setNestedValue(result, field, this.decryptValue(value));
      }
    });
    
    return result;
  }
  
  /**
   * Pomocnicza: szyfruje różne typy wartości
   */
  static encryptValue(value) {
    if (typeof value === 'string') {
      return this.encrypt(value);
    } else if (Array.isArray(value)) {
      return value.map(item => 
        typeof item === 'object' ? this.encryptObject(item) : this.encrypt(String(item))
      );
    } else if (typeof value === 'object') {
      return this.encryptObject(value);
    }
    return value;
  }
  
  /**
   * Pomocnicza: odszyfrowuje różne typy wartości
   */
  static decryptValue(value) {
    if (typeof value === 'string') {
      return this.decrypt(value);
    } else if (Array.isArray(value)) {
      return value.map(item => 
        typeof item === 'object' ? this.decryptObject(item) : this.decrypt(String(item))
      );
    } else if (typeof value === 'object') {
      return this.decryptObject(value);
    }
    return value;
  }
  
  /**
   * Pomocnicza: pobiera zagnieżdżoną wartość (np. "companyInfo.nip")
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Pomocnicza: ustawia zagnieżdżoną wartość
   */
  static setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}

// ========== INTEGRACJA Z SYSTEMEM PLIKÓW ==========
class EncryptedFileOperations {
  
  /**
   * Zapisuje dane z automatycznym szyfrowaniem
   */
  static async saveEncrypted(filePath, data, dataType = 'clients') {
    const LockedFileOperations = require('./fileLocking').LockedFileOperations;
    
    // Szyfruj wrażliwe dane przed zapisem
    const encryptedData = Array.isArray(data) 
      ? data.map(item => DataEncryption.encryptObject(item, dataType))
      : DataEncryption.encryptObject(data, dataType);
    
    return await LockedFileOperations.updateJSON(filePath, encryptedData);
  }
  
  /**
   * Odczytuje dane z automatycznym odszyfrowywaniem
   */
  static async loadDecrypted(filePath, dataType = 'clients') {
    const LockedFileOperations = require('./fileLocking').LockedFileOperations;
    
    const encryptedData = await LockedFileOperations.readJSON(filePath);
    
    // Odszyfruj wrażliwe dane po odczytaniu
    const decryptedData = Array.isArray(encryptedData)
      ? encryptedData.map(item => DataEncryption.decryptObject(item, dataType))
      : DataEncryption.decryptObject(encryptedData, dataType);
    
    return decryptedData;
  }
}

// ========== NARZĘDZIA MIGRACJI ==========
class EncryptionMigration {
  
  /**
   * Migruje istniejące dane do wersji zaszyfrowanej
   */
  static async migrateToEncrypted(filePath, dataType = 'clients') {
    console.log(`🔐 Rozpoczynam migrację szyfrowania: ${filePath}`);
    
    try {
      // Wczytaj niezaszyfrowane dane
      const LockedFileOperations = require('./fileLocking').LockedFileOperations;
      const originalData = await LockedFileOperations.readJSON(filePath);
      
      if (!originalData || originalData.length === 0) {
        console.log('📝 Brak danych do szyfrowania');
        return { success: true, migrated: 0 };
      }
      
      // Zaszyfruj dane
      const encryptedData = Array.isArray(originalData)
        ? originalData.map(item => DataEncryption.encryptObject(item, dataType))
        : DataEncryption.encryptObject(originalData, dataType);
      
      // Zapisz zaszyfrowane dane
      await LockedFileOperations.updateJSON(filePath, encryptedData);
      
      console.log(`✅ Szyfrowanie zakończone: ${Array.isArray(originalData) ? originalData.length : 1} rekordów`);
      
      return { 
        success: true, 
        migrated: Array.isArray(originalData) ? originalData.length : 1,
        file: filePath
      };
      
    } catch (error) {
      console.error('❌ Błąd migracji szyfrowania:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Testuje szyfrowanie/odszyfrowywanie
   */
  static testEncryption() {
    console.log('🧪 Test szyfrowania danych...');
    
    const testData = {
      name: "Jan Kowalski",
      email: "jan@example.com",
      phone: "+48 123 456 789",
      companyInfo: {
        nip: "1234567890"
      }
    };
    
    console.log('📝 Dane oryginalne:', testData);
    
    // Szyfrowanie
    const encrypted = DataEncryption.encryptObject(testData, 'clients');
    console.log('🔐 Dane zaszyfrowane:', encrypted);
    
    // Odszyfrowywanie
    const decrypted = DataEncryption.decryptObject(encrypted, 'clients');
    console.log('🔓 Dane odszyfrowane:', decrypted);
    
    // Weryfikacja
    const isValid = JSON.stringify(testData) === JSON.stringify(decrypted);
    console.log(`${isValid ? '✅' : '❌'} Test ${isValid ? 'PASSED' : 'FAILED'}`);
    
    return isValid;
  }
}

// ========== KONFIGURACJA ŚRODOWISKA ==========
const ENVIRONMENT_SETUP = {
  
  /**
   * Generuje klucz szyfrowania dla środowiska produkcyjnego
   */
  generateEncryptionKey() {
    const key = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Wygenerowany klucz szyfrowania:');
    console.log(`ENCRYPTION_KEY=${key}`);
    console.log('⚠️  UWAGA: Zapisz ten klucz w bezpiecznym miejscu!');
    console.log('⚠️  Dodaj go do zmiennych środowiskowych (.env)');
    return key;
  },
  
  /**
   * Sprawdza konfigurację szyfrowania
   */
  validateConfiguration() {
    const issues = [];
    
    if (!process.env.ENCRYPTION_KEY) {
      issues.push('❌ Brak ENCRYPTION_KEY w zmiennych środowiskowych');
    }
    
    if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
      issues.push('❌ KRYTYCZNE: Brak klucza szyfrowania w produkcji!');
    }
    
    if (issues.length === 0) {
      console.log('✅ Konfiguracja szyfrowania jest prawidłowa');
      return true;
    } else {
      console.log('⚠️  Problemy z konfiguracją szyfrowania:');
      issues.forEach(issue => console.log(issue));
      return false;
    }
  }
};

module.exports = {
  DataEncryption,
  EncryptedFileOperations,
  EncryptionMigration,
  ENVIRONMENT_SETUP,
  SENSITIVE_FIELDS
};