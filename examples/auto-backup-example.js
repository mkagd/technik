/**
 * 💾 PRZYKŁAD AUTO BACKUP
 * Automatyczne kopie zapasowe co godzinę
 */

// scripts/autoBackup.js
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');
const DATA_DIR = path.join(process.cwd(), 'data');

// Utwórz folder backupów
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `auto-backup-${timestamp}`);
  
  try {
    // Utwórz folder dla tego backupu
    fs.mkdirSync(backupPath, { recursive: true });
    
    // Kopiuj wszystkie pliki JSON
    const dataFiles = fs.readdirSync(DATA_DIR)
      .filter(file => file.endsWith('.json'));
    
    dataFiles.forEach(file => {
      const sourcePath = path.join(DATA_DIR, file);
      const destPath = path.join(backupPath, file);
      fs.copyFileSync(sourcePath, destPath);
    });
    
    // Kopiuj też zdjęcia (jeśli są)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const uploadsBackup = path.join(backupPath, 'uploads');
      execSync(`xcopy "${uploadsDir}" "${uploadsBackup}" /E /I /Q`, { stdio: 'inherit' });
    }
    
    console.log(`✅ Backup created: ${timestamp}`);
    
    // Usuń stare backupy (zostaw tylko 24 ostatnie = 1 dzień)
    cleanupOldBackups();
    
  } catch (error) {
    console.error(`❌ Backup failed: ${error.message}`);
  }
}

function cleanupOldBackups() {
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(dir => dir.startsWith('auto-backup-'))
    .map(dir => ({
      name: dir,
      path: path.join(BACKUP_DIR, dir),
      date: fs.statSync(path.join(BACKUP_DIR, dir)).mtime
    }))
    .sort((a, b) => b.date - a.date); // Najnowsze pierwsze
  
  // Usuń wszystkie poza 24 najnowszymi
  if (backups.length > 24) {
    backups.slice(24).forEach(backup => {
      fs.rmSync(backup.path, { recursive: true, force: true });
      console.log(`🗑️ Removed old backup: ${backup.name}`);
    });
  }
}

// HARMONOGRAM BACKUPÓW:
console.log('🕐 Starting backup scheduler...');

// Co godzinę
cron.schedule('0 * * * *', () => {
  console.log('⏰ Creating hourly backup...');
  createBackup();
});

// Codziennie o 2:00 - specjalny backup
cron.schedule('0 2 * * *', () => {
  console.log('🌙 Creating daily backup...');
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  // Dodatkowy backup z datą
  execSync(`xcopy "${DATA_DIR}" "${BACKUP_DIR}/daily-${timestamp}" /E /I /Q`);
});

// Test na starcie
console.log('🧪 Creating initial backup...');
createBackup();

console.log('✅ Backup system ready!');
console.log('📅 Hourly backups: every hour');
console.log('📅 Daily backups: 2:00 AM');
console.log('🗑️ Retention: 24 hourly backups');

// EFEKT:
// Folder struktura:
// data/backups/
//   ├── auto-backup-2025-09-30T20-00-00-000Z/
//   ├── auto-backup-2025-09-30T21-00-00-000Z/
//   ├── daily-2025-09-30/
//   └── ...

// W package.json dodaj:
// "scripts": {
//   "backup": "node scripts/autoBackup.js",
//   "dev": "node scripts/autoBackup.js & next dev"  // Backup + server
// }