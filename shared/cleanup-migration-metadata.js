const fs = require('fs');
const path = require('path');

// Skrypt czyszczenia metadanych migracji z plików danych
// Stworzony: 2025-09-29

class MigrationMetadataCleanupScript {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.cleanupStats = {
      filesProcessed: 0,
      fieldsRemoved: 0,
      recordsCleaned: 0,
      spaceSaved: 0
    };
  }

  // Lista pól do usunięcia
  getMigrationFields() {
    return [
      'migrated',
      'clientIdFixed', 
      'idUpdated',
      'oldId',
      'migrationDate',
      'migrationSource',
      'migrationInfo' // Nowe pole też można oczyścić jeśli nie jest potrzebne
    ];
  }

  // Czyść obiekt z metadanych migracji
  cleanObject(obj, removeFields) {
    if (!obj || typeof obj !== 'object') return obj;
    
    let cleaned = false;
    const cleanedObj = { ...obj };
    
    removeFields.forEach(field => {
      if (field in cleanedObj) {
        delete cleanedObj[field];
        this.cleanupStats.fieldsRemoved++;
        cleaned = true;
      }
    });
    
    // Rekurencyjnie czyść zagnieżdżone obiekty
    Object.keys(cleanedObj).forEach(key => {
      if (typeof cleanedObj[key] === 'object' && cleanedObj[key] !== null) {
        if (Array.isArray(cleanedObj[key])) {
          cleanedObj[key] = cleanedObj[key].map(item => this.cleanObject(item, removeFields));
        } else {
          cleanedObj[key] = this.cleanObject(cleanedObj[key], removeFields);
        }
      }
    });
    
    if (cleaned) {
      this.cleanupStats.recordsCleaned++;
    }
    
    return cleanedObj;
  }

  // Czyść plik JSON
  async cleanJsonFile(filePath, removeFields = null) {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Plik nie istnieje: ${path.basename(filePath)}`);
      return false;
    }
    
    console.log(`🧹 Czyszczenie: ${path.basename(filePath)}`);
    
    try {
      // Wczytaj dane
      const originalContent = fs.readFileSync(filePath, 'utf8');
      const originalSize = originalContent.length;
      const data = JSON.parse(originalContent);
      
      // Użyj domyślnych pól jeśli nie podano
      const fieldsToRemove = removeFields || this.getMigrationFields();
      
      // Czyść dane
      let cleanedData;
      if (Array.isArray(data)) {
        cleanedData = data.map(item => this.cleanObject(item, fieldsToRemove));
      } else {
        cleanedData = this.cleanObject(data, fieldsToRemove);
      }
      
      // Zapisz wyczyszczone dane
      const cleanedContent = JSON.stringify(cleanedData, null, 2);
      const cleanedSize = cleanedContent.length;
      const spaceSaved = originalSize - cleanedSize;
      
      // Utwórz backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.dataDir, 'backups');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupPath = path.join(backupDir, `${path.basename(filePath, '.json')}-pre-cleanup-${timestamp}.json`);
      fs.writeFileSync(backupPath, originalContent);
      
      // Zapisz wyczyszczone dane
      const cleanedPath = path.join(path.dirname(filePath), `cleaned-${path.basename(filePath)}`);
      fs.writeFileSync(cleanedPath, cleanedContent);
      
      this.cleanupStats.filesProcessed++;
      this.cleanupStats.spaceSaved += spaceSaved;
      
      console.log(`  ✅ Oszczędność: ${spaceSaved} znaków (${((spaceSaved/originalSize)*100).toFixed(1)}%)`);
      console.log(`  📁 Backup: ${path.basename(backupPath)}`);
      console.log(`  📄 Wyczyszczony: cleaned-${path.basename(filePath)}`);
      
      return true;
      
    } catch (error) {
      console.error(`  ❌ Błąd podczas czyszczenia ${path.basename(filePath)}:`, error.message);
      return false;
    }
  }

  // Znajdź wszystkie pliki JSON zawierające metadane migracji
  findFilesWithMigrationMetadata() {
    console.log('🔍 Szukanie plików z metadanymi migracji...');
    
    const jsonFiles = fs.readdirSync(this.dataDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(this.dataDir, file));
    
    const filesWithMetadata = [];
    
    jsonFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Sprawdź czy plik zawiera metadane migracji
        const hasMetadata = this.containsMigrationMetadata(data);
        
        if (hasMetadata) {
          filesWithMetadata.push({
            path: filePath,
            name: path.basename(filePath)
          });
        }
        
      } catch (error) {
        console.log(`  ⚠️  Nie można przeanalizować ${path.basename(filePath)}: ${error.message}`);
      }
    });
    
    console.log(`📋 Znaleziono ${filesWithMetadata.length} plików z metadanymi migracji:`);
    filesWithMetadata.forEach(file => {
      console.log(`  - ${file.name}`);
    });
    
    return filesWithMetadata;
  }

  // Sprawdź czy dane zawierają metadane migracji
  containsMigrationMetadata(data) {
    const migrationFields = this.getMigrationFields();
    
    if (Array.isArray(data)) {
      return data.some(item => this.objectContainsMigrationFields(item, migrationFields));
    } else if (typeof data === 'object' && data !== null) {
      return this.objectContainsMigrationFields(data, migrationFields);
    }
    
    return false;
  }

  // Sprawdź czy obiekt zawiera pola migracji
  objectContainsMigrationFields(obj, fields) {
    if (!obj || typeof obj !== 'object') return false;
    
    // Sprawdź bezpośrednie pola
    if (fields.some(field => field in obj)) return true;
    
    // Sprawdź zagnieżdżone obiekty
    return Object.values(obj).some(value => {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return value.some(item => this.objectContainsMigrationFields(item, fields));
        } else {
          return this.objectContainsMigrationFields(value, fields);
        }
      }
      return false;
    });
  }

  // Główna funkcja czyszczenia
  async cleanupAllMigrationMetadata() {
    console.log('🚀 Rozpoczynam czyszczenie metadanych migracji...');
    
    // Znajdź pliki do wyczyszczenia
    const filesToClean = this.findFilesWithMigrationMetadata();
    
    if (filesToClean.length === 0) {
      console.log('✅ Nie znaleziono plików wymagających czyszczenia!');
      return;
    }
    
    // Czyść każdy plik
    for (const file of filesToClean) {
      await this.cleanJsonFile(file.path);
    }
    
    // Pokaż statystyki
    this.showCleanupStatistics();
    
    console.log('✅ Czyszczenie metadanych migracji zakończone!');
  }

  // Wyświetl statystyki czyszczenia
  showCleanupStatistics() {
    console.log('\n📊 STATYSTYKI CZYSZCZENIA:');
    console.log(`Plików przetworzonych: ${this.cleanupStats.filesProcessed}`);
    console.log(`Rekordów wyczyszczonych: ${this.cleanupStats.recordsCleaned}`);
    console.log(`Pól usuniętych: ${this.cleanupStats.fieldsRemoved}`);
    console.log(`Zaoszczędzona przestrzeń: ${this.cleanupStats.spaceSaved} znaków`);
    
    if (this.cleanupStats.spaceSaved > 0) {
      const spaceSavedKB = (this.cleanupStats.spaceSaved / 1024).toFixed(2);
      console.log(`Zaoszczędzona przestrzeń: ${spaceSavedKB} KB`);
    }
  }

  // Wyczyść konkretny plik (opcjonalnie)
  async cleanSpecificFile(fileName, customFields = null) {
    const filePath = path.join(this.dataDir, fileName);
    return await this.cleanJsonFile(filePath, customFields);
  }
}

// Uruchom jeśli wywołany bezpośrednio
if (require.main === module) {
  const script = new MigrationMetadataCleanupScript();
  
  // Sprawdź argumenty wiersza poleceń
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Czyść konkretny plik
    const fileName = args[0];
    script.cleanSpecificFile(fileName).catch(console.error);
  } else {
    // Czyść wszystkie pliki
    script.cleanupAllMigrationMetadata().catch(console.error);
  }
}

module.exports = MigrationMetadataCleanupScript;