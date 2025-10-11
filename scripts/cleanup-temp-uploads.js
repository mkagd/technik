#!/usr/bin/env node
// scripts/cleanup-temp-uploads.js
// 🧹 Skrypt do czyszczenia tymczasowych uploadów zdjęć
//
// Usuwa:
// 1. Zdjęcia z /uploads/temp/ starsze niż 24h
// 2. Foldery /uploads/orders/TEMP-* starsze niż 24h
//
// Użycie:
//   node scripts/cleanup-temp-uploads.js
//   node scripts/cleanup-temp-uploads.js --dry-run (podgląd bez usuwania)
//   node scripts/cleanup-temp-uploads.js --hours 48 (usuń starsze niż 48h)

const fs = require('fs');
const path = require('path');

// Konfiguracja
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const TEMP_DIR = path.join(UPLOADS_DIR, 'temp');
const ORDERS_DIR = path.join(UPLOADS_DIR, 'orders');

// Parametry z CLI
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const HOURS_OLD = parseInt(args.find(arg => arg.startsWith('--hours'))?.split('=')[1]) || 24;

console.log('🧹 CLEANUP TEMP UPLOADS');
console.log('='.repeat(50));
console.log(`📂 Uploads directory: ${UPLOADS_DIR}`);
console.log(`⏰ Removing files older than: ${HOURS_OLD} hours`);
console.log(`🔍 Mode: ${DRY_RUN ? 'DRY RUN (no files deleted)' : 'LIVE (files will be deleted)'}`);
console.log('='.repeat(50));

// Statystyki
let stats = {
  scanned: 0,
  deleted: 0,
  errors: 0,
  freedSpace: 0
};

/**
 * Sprawdź czy plik/folder jest starszy niż X godzin
 */
function isOlderThan(filePath, hours) {
  try {
    const fileStats = fs.statSync(filePath);
    const ageInMs = Date.now() - fileStats.mtimeMs;
    const ageInHours = ageInMs / (1000 * 60 * 60);
    return ageInHours > hours;
  } catch (error) {
    console.error(`❌ Error checking age: ${filePath}`, error.message);
    return false;
  }
}

/**
 * Usuń plik rekursywnie (z folderami)
 */
function deleteRecursive(targetPath) {
  if (!fs.existsSync(targetPath)) return;

  try {
    const fileStats = fs.statSync(targetPath);
    
    if (fileStats.isDirectory()) {
      // Usuń zawartość folderu
      const files = fs.readdirSync(targetPath);
      files.forEach(file => {
        deleteRecursive(path.join(targetPath, file));
      });
      
      // Usuń sam folder
      if (!DRY_RUN) {
        fs.rmdirSync(targetPath);
      }
      console.log(`🗑️  ${DRY_RUN ? '[DRY RUN] Would delete' : 'Deleted'} directory: ${targetPath}`);
    } else {
      // Usuń plik
      stats.freedSpace += fileStats.size;
      
      if (!DRY_RUN) {
        fs.unlinkSync(targetPath);
      }
      console.log(`🗑️  ${DRY_RUN ? '[DRY RUN] Would delete' : 'Deleted'} file: ${path.basename(targetPath)} (${formatBytes(fileStats.size)})`);
    }
    
    stats.deleted++;
  } catch (error) {
    console.error(`❌ Error deleting: ${targetPath}`, error.message);
    stats.errors++;
  }
}

/**
 * Formatuj bajty do czytelnej formy
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Wyczyść /uploads/temp/
 */
function cleanupTempDirectory() {
  console.log('\n📁 Checking /uploads/temp/...');
  
  if (!fs.existsSync(TEMP_DIR)) {
    console.log('⚠️  Directory does not exist: /uploads/temp/');
    return;
  }

  const files = fs.readdirSync(TEMP_DIR);
  console.log(`   Found ${files.length} files/folders`);

  files.forEach(file => {
    const filePath = path.join(TEMP_DIR, file);
    stats.scanned++;

    if (isOlderThan(filePath, HOURS_OLD)) {
      deleteRecursive(filePath);
    }
  });
}

/**
 * Wyczyść /uploads/orders/TEMP-*/
 */
function cleanupTempOrders() {
  console.log('\n📁 Checking /uploads/orders/TEMP-*/...');
  
  if (!fs.existsSync(ORDERS_DIR)) {
    console.log('⚠️  Directory does not exist: /uploads/orders/');
    return;
  }

  const folders = fs.readdirSync(ORDERS_DIR);
  const tempFolders = folders.filter(folder => folder.startsWith('TEMP-'));
  
  console.log(`   Found ${tempFolders.length} TEMP-* folders`);

  tempFolders.forEach(folder => {
    const folderPath = path.join(ORDERS_DIR, folder);
    stats.scanned++;

    if (isOlderThan(folderPath, HOURS_OLD)) {
      deleteRecursive(folderPath);
    }
  });
}

/**
 * Wyczyść puste foldery
 */
function cleanupEmptyFolders(dir) {
  if (!fs.existsSync(dir)) return;

  try {
    const files = fs.readdirSync(dir);
    
    // Rekursywnie sprawdź podfoldery
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        cleanupEmptyFolders(fullPath);
      }
    });

    // Jeśli folder jest pusty, usuń
    const remainingFiles = fs.readdirSync(dir);
    if (remainingFiles.length === 0 && dir !== UPLOADS_DIR) {
      if (!DRY_RUN) {
        fs.rmdirSync(dir);
      }
      console.log(`🗑️  ${DRY_RUN ? '[DRY RUN] Would delete' : 'Deleted'} empty directory: ${dir}`);
      stats.deleted++;
    }
  } catch (error) {
    console.error(`❌ Error cleaning empty folders: ${dir}`, error.message);
  }
}

/**
 * Main cleanup
 */
async function main() {
  try {
    // 1. Wyczyść /uploads/temp/
    cleanupTempDirectory();

    // 2. Wyczyść /uploads/orders/TEMP-*/
    cleanupTempOrders();

    // 3. Wyczyść puste foldery
    console.log('\n📁 Checking for empty folders...');
    cleanupEmptyFolders(UPLOADS_DIR);

    // 4. Podsumowanie
    console.log('\n' + '='.repeat(50));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`📄 Files/folders scanned: ${stats.scanned}`);
    console.log(`🗑️  Items deleted: ${stats.deleted}`);
    console.log(`❌ Errors: ${stats.errors}`);
    console.log(`💾 Space freed: ${formatBytes(stats.freedSpace)}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no files were actually deleted.');
      console.log('   Run without --dry-run to delete files.');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Uruchom
main();
