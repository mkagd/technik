#!/usr/bin/env node

/**
 * 🔄 MIGRACJA DANYCH DO NOWEGO SYSTEMU ID
 * 
 * Skrypt do dodania nowych ID do wszystkich istniejących
 * zleceń i klientów bez utraty danych
 */

const fs = require('fs');
const path = require('path');

// Import biblioteki ID
const {
  generateLegacyOrderId,
  generateOrderId,
  generateClientId,
  decodeId
} = require('./id-system.js');

class DataMigrator {
  constructor() {
    this.ordersFile = path.resolve(__dirname, '../data/orders.json');
    this.clientsFile = path.resolve(__dirname, '../data/clients.json');
    this.employeesFile = path.resolve(__dirname, '../data/employees.json');
    
    this.backupDir = path.resolve(__dirname, '../data/backup');
    this.migrationLog = [];
  }

  async migrate() {
    console.log('🔄 ROZPOCZYNAM MIGRACJĘ DANYCH DO NOWEGO SYSTEMU ID');
    console.log('📅 Data:', new Date().toISOString());
    console.log('');

    try {
      // 1. Utwórz backup
      await this.createBackup();
      
      // 2. Migruj klientów
      await this.migrateClients();
      
      // 3. Migruj zlecenia
      await this.migrateOrders();
      
      // 4. Zapisz log migracji
      await this.saveMigrationLog();
      
      console.log('✅ MIGRACJA ZAKOŃCZONA POMYŚLNIE!');
      console.log('📋 Szczegóły w:', path.join(this.backupDir, 'migration-log.json'));
      
    } catch (error) {
      console.error('❌ BŁĄD MIGRACJI:', error.message);
      console.log('🔄 Przywróć dane z backup jeśli potrzeba');
    }
  }

  async createBackup() {
    console.log('💾 Tworzenie backup danych...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Backup plików
    if (fs.existsSync(this.ordersFile)) {
      fs.copyFileSync(this.ordersFile, path.join(this.backupDir, `orders_${timestamp}.json`));
    }
    
    if (fs.existsSync(this.clientsFile)) {
      fs.copyFileSync(this.clientsFile, path.join(this.backupDir, `clients_${timestamp}.json`));
    }
    
    console.log('  ✅ Backup utworzony w:', this.backupDir);
  }

  async migrateClients() {
    console.log('👥 Migracja klientów...');
    
    if (!fs.existsSync(this.clientsFile)) {
      console.log('  ⚠️ Brak pliku clients.json');
      return;
    }

    const clients = JSON.parse(fs.readFileSync(this.clientsFile, 'utf8'));
    let migratedCount = 0;
    let skippedCount = 0;

    const migratedClients = clients.map(client => {
      // Sprawdź czy już ma nowe ID
      if (client.newId) {
        skippedCount++;
        return client;
      }

      const oldId = client.id;
      let newId;

      if (oldId && oldId.startsWith('#')) {
        // Stary format: #0001 → OLD0001
        newId = generateLegacyOrderId(oldId.replace('#', ''));
      } else {
        // Brak ID lub nieprawidłowy format - utwórz nowy
        newId = generateClientId();
      }

      migratedCount++;
      
      this.migrationLog.push({
        type: 'client',
        oldId: oldId,
        newId: newId,
        name: client.name,
        timestamp: new Date().toISOString()
      });

      return {
        ...client,
        // Zachowaj stary ID dla kompatybilności
        legacyId: oldId,
        // Dodaj nowy ID
        id: newId,
        newId: newId,
        // Metadane migracji
        migrated: true,
        migrationDate: new Date().toISOString(),
        migrationSource: 'data-migrator'
      };
    });

    // Zapisz zmigrowne dane
    fs.writeFileSync(this.clientsFile, JSON.stringify(migratedClients, null, 2));
    
    console.log(`  ✅ Zmigrowani klienci: ${migratedCount}`);
    console.log(`  ⏭️ Pominięci (już zmigrowani): ${skippedCount}`);
  }

  async migrateOrders() {
    console.log('📋 Migracja zleceń...');
    
    if (!fs.existsSync(this.ordersFile)) {
      console.log('  ⚠️ Brak pliku orders.json');
      return;
    }

    const orders = JSON.parse(fs.readFileSync(this.ordersFile, 'utf8'));
    let migratedCount = 0;
    let skippedCount = 0;

    const migratedOrders = orders.map((order, index) => {
      // Sprawdź czy już ma nowe ID
      if (order.newId) {
        skippedCount++;
        return order;
      }

      // Generuj ID zlecenia (wszystkie istniejące to Website)
      const newOrderId = generateOrderId('W'); // W = Website
      
      // Obsłuż clientId
      let newClientId = order.clientId;
      if (order.clientId && order.clientId.startsWith('#')) {
        newClientId = generateLegacyOrderId(order.clientId.replace('#', ''));
      }

      migratedCount++;
      
      this.migrationLog.push({
        type: 'order',
        oldId: `order_${index}`,
        newId: newOrderId,
        clientId: newClientId,
        category: order.category,
        timestamp: new Date().toISOString()
      });

      return {
        ...order,
        // Nowe ID zlecenia
        id: newOrderId,
        newId: newOrderId,
        // Zaktualizowany clientId
        clientId: newClientId,
        // Dodatkowe metadane
        source: 'W', // Website source
        migrated: true,
        migrationDate: new Date().toISOString(),
        migrationSource: 'data-migrator'
      };
    });

    // Zapisz zmigrowne dane
    fs.writeFileSync(this.ordersFile, JSON.stringify(migratedOrders, null, 2));
    
    console.log(`  ✅ Zmigrowne zlecenia: ${migratedCount}`);
    console.log(`  ⏭️ Pominięte (już zmigrowne): ${skippedCount}`);
  }

  async saveMigrationLog() {
    const logFile = path.join(this.backupDir, 'migration-log.json');
    
    const logData = {
      migrationDate: new Date().toISOString(),
      totalMigrated: this.migrationLog.length,
      clientsMigrated: this.migrationLog.filter(l => l.type === 'client').length,
      ordersMigrated: this.migrationLog.filter(l => l.type === 'order').length,
      details: this.migrationLog
    };

    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    console.log('📋 Log migracji zapisany:', logFile);
  }

  // Metoda do sprawdzenia stanu migracji
  async checkMigrationStatus() {
    console.log('🔍 SPRAWDZANIE STANU MIGRACJI');
    console.log('');

    // Sprawdź klientów
    if (fs.existsSync(this.clientsFile)) {
      const clients = JSON.parse(fs.readFileSync(this.clientsFile, 'utf8'));
      const migrated = clients.filter(c => c.migrated).length;
      const total = clients.length;
      
      console.log(`👥 Klienci: ${migrated}/${total} zmigrowani (${Math.round(migrated/total*100)}%)`);
      
      // Przykład zmigrownego klienta
      const example = clients.find(c => c.migrated);
      if (example) {
        console.log(`   Przykład: ${example.legacyId} → ${example.newId} (${example.name})`);
      }
    }

    // Sprawdź zlecenia
    if (fs.existsSync(this.ordersFile)) {
      const orders = JSON.parse(fs.readFileSync(this.ordersFile, 'utf8'));
      const migrated = orders.filter(o => o.migrated).length;
      const total = orders.length;
      
      console.log(`📋 Zlecenia: ${migrated}/${total} zmigrowne (${Math.round(migrated/total*100)}%)`);
      
      // Przykład zmigrownego zlecenia
      const example = orders.find(o => o.migrated);
      if (example) {
        const decoded = decodeId(example.newId);
        console.log(`   Przykład: ${example.newId} (${decoded.sourceName}, ${example.category})`);
      }
    }

    console.log('');
  }
}

// CLI Interface
if (require.main === module) {
  const migrator = new DataMigrator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      migrator.migrate().catch(console.error);
      break;
      
    case 'status':
      migrator.checkMigrationStatus().catch(console.error);
      break;
      
    case 'backup':
      migrator.createBackup().then(() => {
        console.log('✅ Backup utworzony');
      }).catch(console.error);
      break;
      
    default:
      console.log('🔄 DATA MIGRATOR - SYSTEM ID');
      console.log('');
      console.log('Użycie:');
      console.log('  node migrate-data.js migrate  - Wykonaj migrację danych');
      console.log('  node migrate-data.js status   - Sprawdź stan migracji');
      console.log('  node migrate-data.js backup   - Utwórz backup');
      console.log('');
      console.log('Przykłady:');
      console.log('  node migrate-data.js migrate');
      console.log('  node migrate-data.js status');
  }
}

module.exports = DataMigrator;