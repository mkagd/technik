/**
 * 🎛️ KONFIGURACJA POZIOMÓW BEZPIECZEŃSTWA
 * 
 * Umożliwia elastyczne zarządzanie bezpieczeństwem w zależności od potrzeb
 * Można dostosować poziom ochrony bez wpływu na codzienną pracę
 * 
 * Wersja: 1.0
 * Data: 2025-01-23
 */

// ========== POZIOMY BEZPIECZEŃSTWA ==========
const SECURITY_LEVELS = {
  
  // 🟢 PODSTAWOWY - dla małych firm
  BASIC: {
    name: 'Podstawowy',
    description: 'Minimalna ochrona, maksymalna wydajność',
    features: {
      encryption: false,           // Bez szyfrowania
      rateLimiting: {
        enabled: true,
        requests: 100,            // 100 req/min
        window: '1m'
      },
      fileLocking: true,          // Podstawowa ochrona plików
      backup: {
        enabled: true,
        frequency: 'daily'        // Codzienne backup
      },
      authentication: 'simple',   // Proste logowanie
      sessionTimeout: '8h'        // 8 godzin sesji
    }
  },
  
  // 🟡 STANDARDOWY - dla większości firm
  STANDARD: {
    name: 'Standardowy',
    description: 'Balans między bezpieczeństwem a wydajnością',
    features: {
      encryption: {
        enabled: true,
        fields: ['name', 'email', 'phone'] // Tylko podstawowe dane
      },
      rateLimiting: {
        enabled: true,
        requests: 60,             // 60 req/min  
        window: '1m'
      },
      fileLocking: true,
      backup: {
        enabled: true,
        frequency: 'hourly',      // Co godzinę
        retention: '30d'
      },
      authentication: 'jwt',      // JWT z refresh token
      sessionTimeout: '4h',       // 4 godziny sesji
      bruteForceProtection: true
    }
  },
  
  // 🔴 ZAAWANSOWANY - dla dużych firm/wrażliwych danych
  ENTERPRISE: {
    name: 'Zaawansowany',
    description: 'Maksymalne bezpieczeństwo dla wrażliwych danych',
    features: {
      encryption: {
        enabled: true,
        fields: 'all',            // Wszystkie wrażliwe pola
        algorithm: 'aes-256-gcm'
      },
      rateLimiting: {
        enabled: true,
        requests: 30,             // 30 req/min
        window: '1m',
        progressive: true         // Progresywne ograniczenia
      },
      fileLocking: true,
      backup: {
        enabled: true,
        frequency: 'realtime',    // Backup w czasie rzeczywistym
        retention: '90d',
        encryption: true
      },
      authentication: 'jwt-advanced', // JWT + 2FA
      sessionTimeout: '2h',       // 2 godziny sesji
      bruteForceProtection: true,
      ipWhitelist: true,         // Lista dozwolonych IP
      auditLog: true             // Pełny log akcji
    }
  }
};

// ========== AKTUALNY POZIOM BEZPIECZEŃSTWA ==========
class SecurityManager {
  
  constructor() {
    // Odczytaj poziom z konfiguracji lub ustaw domyślny
    this.currentLevel = process.env.SECURITY_LEVEL || 'STANDARD';
    this.config = SECURITY_LEVELS[this.currentLevel] || SECURITY_LEVELS.STANDARD;
  }
  
  /**
   * Zwraca aktualną konfigurację bezpieczeństwa
   */
  getConfig() {
    return {
      level: this.currentLevel,
      ...this.config
    };
  }
  
  /**
   * Sprawdza czy funkcja jest włączona
   */
  isEnabled(feature) {
    const features = this.config.features;
    
    switch (feature) {
      case 'encryption':
        return features.encryption && features.encryption.enabled;
      
      case 'rateLimiting':
        return features.rateLimiting && features.rateLimiting.enabled;
      
      case 'backup':
        return features.backup && features.backup.enabled;
        
      case 'authentication':
        return features.authentication !== 'none';
        
      default:
        return features[feature] === true;
    }
  }
  
  /**
   * Pobiera ustawienia konkretnej funkcji
   */
  getSettings(feature) {
    return this.config.features[feature];
  }
  
  /**
   * Zmienia poziom bezpieczeństwa
   */
  setLevel(newLevel) {
    if (!SECURITY_LEVELS[newLevel]) {
      throw new Error(`Nieznany poziom bezpieczeństwa: ${newLevel}`);
    }
    
    this.currentLevel = newLevel;
    this.config = SECURITY_LEVELS[newLevel];
    
    console.log(`🔒 Zmieniono poziom bezpieczeństwa na: ${this.config.name}`);
    return this.getConfig();
  }
  
  /**
   * Wyświetla aktualną konfigurację
   */
  displayConfig() {
    console.log(`\n🔒 AKTUALNY POZIOM BEZPIECZEŃSTWA: ${this.config.name}`);
    console.log(`📝 ${this.config.description}\n`);
    
    const features = this.config.features;
    
    console.log('🔐 Szyfrowanie:', features.encryption ? '✅ Włączone' : '❌ Wyłączone');
    if (features.encryption && features.encryption.enabled) {
      console.log(`   └─ Pola: ${Array.isArray(features.encryption.fields) ? features.encryption.fields.join(', ') : features.encryption.fields}`);
    }
    
    console.log('🚦 Rate Limiting:', features.rateLimiting?.enabled ? '✅ Włączone' : '❌ Wyłączone');
    if (features.rateLimiting?.enabled) {
      console.log(`   └─ Limit: ${features.rateLimiting.requests} req/${features.rateLimiting.window}`);
    }
    
    console.log('🔐 Autoryzacja:', features.authentication || 'Brak');
    console.log('⏱️  Sesja:', features.sessionTimeout || 'Bez limitu');
    console.log('💾 Backup:', features.backup?.frequency || 'Wyłączone');
    
    if (features.bruteForceProtection) {
      console.log('🛡️  Ochrona brute force: ✅ Włączona');
    }
    
    if (features.ipWhitelist) {
      console.log('🌐 Whitelist IP: ✅ Włączona');
    }
    
    if (features.auditLog) {
      console.log('📋 Audit Log: ✅ Włączony');
    }
  }
}

// ========== INTEGRACJA Z ISTNIEJĄCYMI SYSTEMAMI ==========
class SecurityIntegration {
  
  constructor() {
    this.security = new SecurityManager();
  }
  
  /**
   * Konfiguruje szyfrowanie według poziomu bezpieczeństwa
   */
  configureEncryption() {
    const encryptionConfig = this.security.getSettings('encryption');
    
    if (!encryptionConfig || !encryptionConfig.enabled) {
      return null; // Szyfrowanie wyłączone
    }
    
    // Zaktualizuj pola do szyfrowania według poziomu
    if (encryptionConfig.fields === 'all') {
      // Wszystkie pola (poziom ENTERPRISE)
      return require('./dataEncryption').SENSITIVE_FIELDS;
    } else if (Array.isArray(encryptionConfig.fields)) {
      // Wybrane pola (poziom STANDARD)
      return {
        clients: encryptionConfig.fields,
        orders: encryptionConfig.fields.filter(f => ['customerName', 'customerPhone', 'customerEmail'].includes(f)),
        employees: encryptionConfig.fields.filter(f => ['firstName', 'lastName', 'email'].includes(f))
      };
    }
    
    return null;
  }
  
  /**
   * Konfiguruje rate limiting według poziomu
   */
  configureRateLimiting() {
    const rateLimitConfig = this.security.getSettings('rateLimiting');
    
    if (!rateLimitConfig || !rateLimitConfig.enabled) {
      return null;
    }
    
    return {
      windowMs: this.parseTimeWindow(rateLimitConfig.window),
      max: rateLimitConfig.requests,
      progressive: rateLimitConfig.progressive || false
    };
  }
  
  /**
   * Konfiguruje backup według poziomu
   */
  configureBackup() {
    const backupConfig = this.security.getSettings('backup');
    
    if (!backupConfig || !backupConfig.enabled) {
      return null;
    }
    
    const schedules = {
      'realtime': '*/5 * * * *',    // Co 5 minut
      'hourly': '0 * * * *',        // Co godzinę
      'daily': '0 2 * * *',         // Codziennie o 2:00
      'weekly': '0 2 * * 0'         // W niedzielę o 2:00
    };
    
    return {
      schedule: schedules[backupConfig.frequency] || schedules.daily,
      retention: backupConfig.retention || '30d',
      encryption: backupConfig.encryption || false
    };
  }
  
  /**
   * Pomocnicza: parsuje okno czasowe (np. "1m" -> 60000ms)
   */
  parseTimeWindow(window) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    const match = window.match(/^(\d+)([smhd])$/);
    if (!match) return 60000; // Domyślnie 1 minuta
    
    const [, value, unit] = match;
    return parseInt(value) * (units[unit] || units.m);
  }
}

// ========== NARZĘDZIA KONFIGURACYJNE ==========
const CONFIGURATION_TOOLS = {
  
  /**
   * Interaktywny kreator konfiguracji
   */
  async configurationWizard() {
    console.log('\n🧙‍♂️ KREATOR KONFIGURACJI BEZPIECZEŃSTWA\n');
    
    console.log('Wybierz poziom bezpieczeństwa dla swojej firmy:\n');
    
    Object.keys(SECURITY_LEVELS).forEach((level, index) => {
      const config = SECURITY_LEVELS[level];
      console.log(`${index + 1}. ${config.name}`);
      console.log(`   ${config.description}`);
      console.log(`   Szyfrowanie: ${config.features.encryption ? '✅' : '❌'}`);
      console.log(`   Rate Limit: ${config.features.rateLimiting?.requests || 'Brak'} req/min`);
      console.log(`   Backup: ${config.features.backup?.frequency || 'Brak'}`);
      console.log('');
    });
    
    // W rzeczywistej implementacji tutaj byłaby interakcja z użytkownikiem
    return 'STANDARD'; // Domyślny wybór
  },
  
  /**
   * Generuje plik konfiguracyjny
   */
  generateConfigFile(level = 'STANDARD') {
    const config = SECURITY_LEVELS[level];
    
    const envContent = `# 🔒 KONFIGURACJA BEZPIECZEŃSTWA
# Poziom: ${config.name}
# ${config.description}

# Główne ustawienia
SECURITY_LEVEL=${level}
NODE_ENV=production

# Szyfrowanie danych
ENCRYPTION_ENABLED=${config.features.encryption ? 'true' : 'false'}
${config.features.encryption ? 'ENCRYPTION_KEY=GENERATED_KEY_HERE' : '# ENCRYPTION_KEY=disabled'}

# Rate limiting
RATE_LIMIT_ENABLED=${config.features.rateLimiting?.enabled || false}
RATE_LIMIT_REQUESTS=${config.features.rateLimiting?.requests || 60}
RATE_LIMIT_WINDOW=${config.features.rateLimiting?.window || '1m'}

# Sesje użytkowników  
SESSION_TIMEOUT=${config.features.sessionTimeout || '4h'}
JWT_EXPIRES_IN=${config.features.sessionTimeout || '4h'}

# Backup
BACKUP_ENABLED=${config.features.backup?.enabled || false}
BACKUP_FREQUENCY=${config.features.backup?.frequency || 'daily'}
BACKUP_RETENTION=${config.features.backup?.retention || '30d'}

# Dodatkowe opcje bezpieczeństwa
BRUTE_FORCE_PROTECTION=${config.features.bruteForceProtection || false}
IP_WHITELIST_ENABLED=${config.features.ipWhitelist || false}
AUDIT_LOG_ENABLED=${config.features.auditLog || false}
`;

    return envContent;
  },
  
  /**
   * Waliduje konfigurację
   */
  validateConfiguration() {
    const security = new SecurityManager();
    const issues = [];
    const warnings = [];
    
    // Sprawdź podstawowe ustawienia
    if (security.currentLevel === 'ENTERPRISE' && !process.env.ENCRYPTION_KEY) {
      issues.push('❌ KRYTYCZNE: Brak klucza szyfrowania dla poziomu ENTERPRISE');
    }
    
    if (security.isEnabled('encryption') && !process.env.ENCRYPTION_KEY) {
      warnings.push('⚠️  Szyfrowanie włączone ale brak klucza szyfrowania');
    }
    
    if (process.env.NODE_ENV === 'production' && security.currentLevel === 'BASIC') {
      warnings.push('⚠️  Niski poziom bezpieczeństwa w środowisku produkcyjnym');
    }
    
    // Wyniki walidacji
    console.log('\n🔍 WYNIKI WALIDACJI KONFIGURACJI:\n');
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ Konfiguracja jest prawidłowa!');
      return { valid: true, issues: [], warnings: [] };
    }
    
    if (issues.length > 0) {
      console.log('❌ KRYTYCZNE PROBLEMY:');
      issues.forEach(issue => console.log(issue));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  OSTRZEŻENIA:');
      warnings.forEach(warning => console.log(warning));
    }
    
    return { valid: issues.length === 0, issues, warnings };
  }
};

// ========== EXPORT ==========
module.exports = {
  SECURITY_LEVELS,
  SecurityManager,
  SecurityIntegration,
  CONFIGURATION_TOOLS
};