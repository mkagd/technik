// Warstwa abstrakcji dla bazy danych
// Łatwe przełączanie między plikami JSON a prawdziwą bazą danych

const fs = require('fs');
const path = require('path');

// Konfiguracja - tutaj zmieniasz źródło danych
const CONFIG = {
  // 'file' dla plików JSON, 'mysql', 'postgresql', 'mongodb' dla baz danych
  dataSource: 'file',
  
  // Ścieżka do plików JSON
  dataPath: path.join(process.cwd(), 'data'),
  
  // Konfiguracja bazy danych (dla przyszłości)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'technik_db'
  }
};

class DatabaseManager {
  constructor() {
    this.dataSource = CONFIG.dataSource;
  }

  // Uniwersalny interfejs do odczytu danych
  async getData(tableName) {
    switch (this.dataSource) {
      case 'file':
        return this.getFileData(tableName);
      case 'mysql':
        return this.getMySQLData(tableName);
      case 'postgresql':
        return this.getPostgreSQLData(tableName);
      case 'mongodb':
        return this.getMongoData(tableName);
      default:
        throw new Error(`Nieobsługiwane źródło danych: ${this.dataSource}`);
    }
  }

  // Uniwersalny interfejs do zapisu danych
  async saveData(tableName, data) {
    switch (this.dataSource) {
      case 'file':
        return this.saveFileData(tableName, data);
      case 'mysql':
        return this.saveMySQLData(tableName, data);
      case 'postgresql':
        return this.savePostgreSQLData(tableName, data);
      case 'mongodb':
        return this.saveMongoData(tableName, data);
      default:
        throw new Error(`Nieobsługiwane źródło danych: ${this.dataSource}`);
    }
  }

  // Dodanie nowego rekordu
  async addRecord(tableName, record) {
    const data = await this.getData(tableName);
    const newId = this.generateId(data);
    const newRecord = { id: newId, ...record, createdAt: new Date().toISOString() };
    
    data.push(newRecord);
    await this.saveData(tableName, data);
    return newRecord;
  }

  // Aktualizacja rekordu
  async updateRecord(tableName, id, updates) {
    const data = await this.getData(tableName);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Rekord o ID ${id} nie został znaleziony w ${tableName}`);
    }
    
    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
    await this.saveData(tableName, data);
    return data[index];
  }

  // Usunięcie rekordu
  async deleteRecord(tableName, id) {
    const data = await this.getData(tableName);
    const filteredData = data.filter(item => item.id !== id);
    
    if (data.length === filteredData.length) {
      throw new Error(`Rekord o ID ${id} nie został znaleziony w ${tableName}`);
    }
    
    await this.saveData(tableName, filteredData);
    return { success: true, deletedId: id };
  }

  // ========== IMPLEMENTACJE DLA PLIKÓW JSON ==========
  
  async getFileData(fileName) {
    try {
      const filePath = path.join(CONFIG.dataPath, `${fileName}.json`);
      if (!fs.existsSync(filePath)) {
        console.log(`Plik ${fileName}.json nie istnieje, tworzę pusty...`);
        await this.saveFileData(fileName, []);
        return [];
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Błąd odczytu pliku ${fileName}:`, error);
      return [];
    }
  }

  async saveFileData(fileName, data) {
    try {
      const filePath = path.join(CONFIG.dataPath, `${fileName}.json`);
      
      // Upewnij się, że folder data istnieje
      if (!fs.existsSync(CONFIG.dataPath)) {
        fs.mkdirSync(CONFIG.dataPath, { recursive: true });
      }
      
      // Zapisz z ładnym formatowaniem
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Błąd zapisu pliku ${fileName}:`, error);
      throw error;
    }
  }

  // ========== PRZYGOTOWANIE NA BAZY DANYCH ==========
  
  async getMySQLData(tableName) {
    // TODO: Implementacja MySQL
    // const mysql = require('mysql2/promise');
    // const connection = await mysql.createConnection(CONFIG.database);
    // const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
    // await connection.end();
    // return rows;
    throw new Error('MySQL nie jest jeszcze zaimplementowany');
  }

  async saveMySQLData(tableName, data) {
    // TODO: Implementacja MySQL
    throw new Error('MySQL nie jest jeszcze zaimplementowany');
  }

  async getPostgreSQLData(tableName) {
    // TODO: Implementacja PostgreSQL
    throw new Error('PostgreSQL nie jest jeszcze zaimplementowany');
  }

  async savePostgreSQLData(tableName, data) {
    // TODO: Implementacja PostgreSQL
    throw new Error('PostgreSQL nie jest jeszcze zaimplementowany');
  }

  async getMongoData(tableName) {
    // TODO: Implementacja MongoDB
    throw new Error('MongoDB nie jest jeszcze zaimplementowany');
  }

  async saveMongoData(tableName, data) {
    // TODO: Implementacja MongoDB
    throw new Error('MongoDB nie jest jeszcze zaimplementowany');
  }

  // ========== POMOCNICZE FUNKCJE ==========
  
  generateId(entityType = 'GENERIC') {
    // NOWY SYSTEM - używa unified-id-system.js
    try {
      const { generateUnifiedID } = require('../scripts/unified-id-system');
      return generateUnifiedID(entityType);
    } catch (error) {
      console.warn('Nie można wczytać unified-id-system:', error.message);
      // Fallback - prostsze ID z timestampem  
      return `${entityType}${Date.now()}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    }
  }

  // Backup danych
  async backupData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(CONFIG.dataPath, 'backups', timestamp);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const files = fs.readdirSync(CONFIG.dataPath)
      .filter(file => file.endsWith('.json'));

    for (const file of files) {
      const sourcePath = path.join(CONFIG.dataPath, file);
      const backupPath = path.join(backupDir, file);
      fs.copyFileSync(sourcePath, backupPath);
    }

    console.log(`Backup utworzony: ${backupDir}`);
    return backupDir;
  }
}

// Singleton instance
const db = new DatabaseManager();

module.exports = db;

// Przykłady użycia:
/*
// Odczyt danych
const orders = await db.getData('orders');
const clients = await db.getData('clients');

// Dodanie nowego rekordu
const newOrder = await db.addRecord('orders', {
  clientId: 123,
  description: 'Naprawa laptopa',
  status: 'pending'
});

// Aktualizacja
await db.updateRecord('orders', 1, { status: 'completed' });

// Usunięcie
await db.deleteRecord('orders', 1);

// Backup
await db.backupData();
*/