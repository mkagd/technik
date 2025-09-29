// Skrypt migracji danych z plików JSON do bazy danych
// Uruchom: node scripts/migrate-data.js

const fs = require('fs');
const path = require('path');
const db = require('../utils/database');
const { models, generateCreateTableSQL, mapLegacyData } = require('../utils/models');

class DataMigrator {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'data');
    this.backupPath = path.join(process.cwd(), 'data', 'migration-backup');
  }

  // Główna funkcja migracji
  async migrate() {
    console.log('🚀 Rozpoczynam migrację danych...\n');
    
    try {
      // 1. Utwórz backup obecnych danych
      await this.createBackup();
      
      // 2. Analizuj obecne pliki JSON
      const analysis = await this.analyzeLegacyData();
      this.printAnalysis(analysis);
      
      // 3. Normalizuj dane zgodnie z nowymi modelami
      await this.normalizeData(analysis);
      
      // 4. Wygeneruj SQL dla bazy danych (opcjonalnie)
      await this.generateSQL();
      
      console.log('\n✅ Migracja zakończona pomyślnie!');
      console.log('\n📋 Następne kroki:');
      console.log('1. Sprawdź znormalizowane dane w folderze data/');
      console.log('2. Gdy będziesz gotowy na bazę danych, uruchom: node scripts/setup-database.js');
      console.log('3. Zmień CONFIG.dataSource w utils/database.js na odpowiednią bazę danych');
      
    } catch (error) {
      console.error('❌ Błąd podczas migracji:', error);
      process.exit(1);
    }
  }

  // Utwórz backup obecnych danych
  async createBackup() {
    console.log('📦 Tworzę backup obecnych danych...');
    
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }

    const files = fs.readdirSync(this.dataPath)
      .filter(file => file.endsWith('.json') || file.endsWith('.js'));

    for (const file of files) {
      const sourcePath = path.join(this.dataPath, file);
      const backupFilePath = path.join(this.backupPath, file);
      fs.copyFileSync(sourcePath, backupFilePath);
    }

    console.log(`✅ Backup utworzony w: ${this.backupPath}\n`);
  }

  // Analizuj obecne dane
  async analyzeLegacyData() {
    console.log('🔍 Analizuję obecne dane...');
    
    const analysis = {
      files: {},
      totalRecords: 0,
      issues: []
    };

    const files = fs.readdirSync(this.dataPath)
      .filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(this.dataPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        const fileName = path.basename(file, '.json');
        
        analysis.files[fileName] = {
          records: Array.isArray(data) ? data.length : 1,
          structure: this.analyzeStructure(data),
          hasModel: !!models[fileName]
        };

        analysis.totalRecords += analysis.files[fileName].records;
        
        if (!models[fileName]) {
          analysis.issues.push(`❗ Brak modelu dla: ${fileName}`);
        }
        
      } catch (error) {
        analysis.issues.push(`❌ Błąd odczytu ${file}: ${error.message}`);
      }
    }

    return analysis;
  }

  // Analizuj strukturę danych
  analyzeStructure(data) {
    if (!Array.isArray(data)) {
      return typeof data === 'object' ? Object.keys(data) : [typeof data];
    }
    
    if (data.length === 0) return [];
    
    // Zbierz wszystkie unikalne klucze z pierwszych kilku rekordów
    const keys = new Set();
    const sample = data.slice(0, Math.min(5, data.length));
    
    sample.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => keys.add(key));
      }
    });
    
    return Array.from(keys);
  }

  // Wydrukuj analizę
  printAnalysis(analysis) {
    console.log('📊 Analiza obecnych danych:\n');
    
    Object.entries(analysis.files).forEach(([fileName, info]) => {
      const status = info.hasModel ? '✅' : '❗';
      console.log(`${status} ${fileName}.json: ${info.records} rekordów`);
      console.log(`   Pola: ${info.structure.join(', ')}`);
      console.log('');
    });

    console.log(`📈 Łącznie rekordów: ${analysis.totalRecords}\n`);
    
    if (analysis.issues.length > 0) {
      console.log('⚠️  Znalezione problemy:');
      analysis.issues.forEach(issue => console.log(issue));
      console.log('');
    }
  }

  // Normalizuj dane zgodnie z modelami
  async normalizeData(analysis) {
    console.log('🔄 Normalizuję dane zgodnie z nowymi modelami...\n');
    
    for (const [fileName, info] of Object.entries(analysis.files)) {
      if (!info.hasModel) {
        console.log(`⏭️  Pomijam ${fileName} (brak modelu)`);
        continue;
      }

      console.log(`🔧 Normalizuję ${fileName}...`);
      
      try {
        // Wczytaj obecne dane
        const filePath = path.join(this.dataPath, `${fileName}.json`);
        const legacyData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Zmapuj na nową strukturę
        const normalizedData = mapLegacyData(fileName, legacyData);
        
        // Zapisz znormalizowane dane
        const normalizedPath = path.join(this.dataPath, `${fileName}.json`);
        fs.writeFileSync(normalizedPath, JSON.stringify(normalizedData, null, 2));
        
        console.log(`✅ ${fileName}: ${normalizedData.length} rekordów znormalizowanych`);
        
      } catch (error) {
        console.error(`❌ Błąd normalizacji ${fileName}:`, error.message);
      }
    }
    
    console.log('');
  }

  // Wygeneruj SQL dla bazy danych
  async generateSQL() {
    console.log('📝 Generuję skrypty SQL...');
    
    const sqlDir = path.join(process.cwd(), 'database', 'migrations');
    if (!fs.existsSync(sqlDir)) {
      fs.mkdirSync(sqlDir, { recursive: true });
    }

    let allSQL = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    Object.entries(models).forEach(([modelName, model]) => {
      const sql = generateCreateTableSQL(modelName, model);
      allSQL += `-- Tabela: ${model.tableName}\n${sql}\n\n`;
    });

    // Zapisz kompletny skrypt
    const sqlPath = path.join(sqlDir, `${timestamp}-create-tables.sql`);
    fs.writeFileSync(sqlPath, allSQL);
    
    console.log(`✅ Skrypt SQL zapisany: ${sqlPath}\n`);
    
    // Wygeneruj też skrypt Node.js do tworzenia tabel
    await this.generateNodeSetup();
  }

  // Wygeneruj skrypt Node.js do setupu bazy danych
  async generateNodeSetup() {
    const setupScript = `// Automatycznie wygenerowany skrypt setupu bazy danych
// Uruchom: node scripts/setup-database.js

const mysql = require('mysql2/promise');
const { models, generateCreateTableSQL } = require('../utils/models');

async function setupDatabase() {
  console.log('🗄️  Tworzę strukturę bazy danych...');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'technik_db'
  };

  try {
    // Połącz się z MySQL (bez bazy danych)
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });

    // Utwórz bazę danych jeśli nie istnieje
    await connection.execute(\`CREATE DATABASE IF NOT EXISTS \\\`\${config.database}\\\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci\`);
    console.log(\`✅ Baza danych '\${config.database}' gotowa\`);
    
    await connection.end();

    // Połącz się z bazą danych
    const db = await mysql.createConnection(config);

    // Utwórz tabele
    for (const [modelName, model] of Object.entries(models)) {
      console.log(\`📋 Tworzę tabelę: \${model.tableName}\`);
      
      const sql = generateCreateTableSQL(modelName, model);
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await db.execute(statement);
        }
      }
      
      console.log(\`✅ Tabela \${model.tableName} utworzona\`);
    }

    await db.end();
    console.log('\\n🎉 Baza danych skonfigurowana pomyślnie!');
    console.log('\\n📋 Następne kroki:');
    console.log('1. Zmień CONFIG.dataSource w utils/database.js na "mysql"');
    console.log('2. Ustaw zmienne środowiskowe bazy danych w .env.local');
    console.log('3. Uruchom: npm install mysql2');
    console.log('4. Przetestuj aplikację');

  } catch (error) {
    console.error('❌ Błąd setupu bazy danych:', error);
    process.exit(1);
  }
}

// Uruchom jeśli wywoływany bezpośrednio
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };`;

    const scriptsDir = path.join(process.cwd(), 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(scriptsDir, 'setup-database.js'), setupScript);
    console.log('✅ Skrypt setup-database.js wygenerowany');
  }
}

// Uruchom migrację jeśli skrypt wywoływany bezpośrednio
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.migrate();
}

module.exports = DataMigrator;