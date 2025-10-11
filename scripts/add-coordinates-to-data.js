// scripts/add-coordinates-to-data.js
// Skrypt migracji - dodaje pole coordinates do klientów i zleceń

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Utwórz backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function backupFile(filePath) {
  const fileName = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `${fileName}.${timestamp}.backup`);
  
  fs.copyFileSync(filePath, backupPath);
  console.log(`✅ Backup utworzony: ${backupPath}`);
}

function loadJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Błąd ładowania ${filePath}:`, error);
    return null;
  }
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Zapisano: ${filePath}`);
  } catch (error) {
    console.error(`❌ Błąd zapisu ${filePath}:`, error);
  }
}

function addCoordinatesToClients() {
  console.log('\n📍 Migracja clients.json...');
  
  if (!fs.existsSync(CLIENTS_FILE)) {
    console.log('⚠️ Plik clients.json nie istnieje');
    return;
  }

  // Backup
  backupFile(CLIENTS_FILE);

  // Załaduj dane
  const clients = loadJSON(CLIENTS_FILE);
  if (!clients) return;

  let modified = 0;

  // Dodaj pole coordinates jeśli nie istnieje
  for (const client of clients) {
    if (!client.coordinates) {
      client.coordinates = null; // null = wymaga geokodowania
      client.geocodingMeta = {
        status: 'pending', // pending | success | failed
        provider: null,
        lastAttempt: null,
        error: null
      };
      modified++;
    }
  }

  // Zapisz
  if (modified > 0) {
    saveJSON(CLIENTS_FILE, clients);
    console.log(`✅ Dodano pole coordinates do ${modified} klientów`);
  } else {
    console.log('✅ Wszyscy klienci już mają pole coordinates');
  }
}

function addCoordinatesToOrders() {
  console.log('\n📍 Migracja orders.json...');
  
  if (!fs.existsSync(ORDERS_FILE)) {
    console.log('⚠️ Plik orders.json nie istnieje');
    return;
  }

  // Backup
  backupFile(ORDERS_FILE);

  // Załaduj dane
  const orders = loadJSON(ORDERS_FILE);
  if (!orders) return;

  let modified = 0;

  // Dodaj pole coordinates jeśli nie istnieje
  for (const order of orders) {
    if (!order.coordinates) {
      order.coordinates = null; // null = wymaga geokodowania
      order.geocodingMeta = {
        status: 'pending',
        provider: null,
        lastAttempt: null,
        error: null
      };
      modified++;
    }
  }

  // Zapisz
  if (modified > 0) {
    saveJSON(ORDERS_FILE, orders);
    console.log(`✅ Dodano pole coordinates do ${modified} zleceń`);
  } else {
    console.log('✅ Wszystkie zlecenia już mają pole coordinates');
  }
}

function showStats() {
  console.log('\n📊 Statystyki danych:');
  
  const clients = loadJSON(CLIENTS_FILE);
  const orders = loadJSON(ORDERS_FILE);
  
  if (clients) {
    const withCoords = clients.filter(c => c.coordinates && c.coordinates.lat && c.coordinates.lng).length;
    const pending = clients.filter(c => !c.coordinates || c.geocodingMeta?.status === 'pending').length;
    const failed = clients.filter(c => c.geocodingMeta?.status === 'failed').length;
    
    console.log(`\n📍 Klienci (${clients.length} total):`);
    console.log(`  ✅ Z koordynatami: ${withCoords}`);
    console.log(`  ⏳ Do geokodowania: ${pending}`);
    console.log(`  ❌ Błędy geokodowania: ${failed}`);
  }
  
  if (orders) {
    const withCoords = orders.filter(o => o.coordinates && o.coordinates.lat && o.coordinates.lng).length;
    const pending = orders.filter(o => !o.coordinates || o.geocodingMeta?.status === 'pending').length;
    const failed = orders.filter(o => o.geocodingMeta?.status === 'failed').length;
    
    console.log(`\n📦 Zlecenia (${orders.length} total):`);
    console.log(`  ✅ Z koordynatami: ${withCoords}`);
    console.log(`  ⏳ Do geokodowania: ${pending}`);
    console.log(`  ❌ Błędy geokodowania: ${failed}`);
  }
}

// Główna funkcja migracji
function migrate() {
  console.log('🚀 Start migracji - dodawanie pól coordinates');
  console.log('='.repeat(50));
  
  addCoordinatesToClients();
  addCoordinatesToOrders();
  showStats();
  
  console.log('\n='.repeat(50));
  console.log('✅ Migracja zakończona');
  console.log('\n💡 Następne kroki:');
  console.log('  1. Uruchom panel admin/settings/maps-geo');
  console.log('  2. Skonfiguruj geokodowanie (zalecane: OSM Nominatim)');
  console.log('  3. Ustaw tryb: "Nocne zadania wsadowe"');
  console.log('  4. Włącz background jobs');
  console.log('  5. System automatycznie zacznie geokodować w nocy');
}

// Uruchom migrację
migrate();
