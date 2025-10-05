/**
 * Rollback Script: Restore orders.json from backup
 * 
 * Restores the most recent backup created by migrate-to-multi-device.js
 * 
 * Usage: node rollback-migration.js
 * Optional: node rollback-migration.js <specific-backup-filename>
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

/**
 * Get all backup files sorted by date (newest first)
 */
function getBackupFiles() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error(`\n❌ ERROR: Backup directory not found: ${BACKUP_DIR}`);
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('orders-backup-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      stat: fs.statSync(path.join(BACKUP_DIR, f))
    }))
    .sort((a, b) => b.stat.mtime - a.stat.mtime); // Newest first
  
  return files;
}

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Restore from backup
 */
async function restoreFromBackup(backupFile) {
  console.log(`\n🔄 Restoring from backup...`);
  console.log(`   Source: ${backupFile.name}`);
  console.log(`   Size: ${formatFileSize(backupFile.stat.size)}`);
  console.log(`   Created: ${backupFile.stat.mtime.toLocaleString()}`);
  
  // Create backup of current state before rollback (just in case)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const preRollbackBackup = path.join(BACKUP_DIR, `orders-pre-rollback-${timestamp}.json`);
  
  console.log(`\n💾 Creating backup of current state...`);
  fs.copyFileSync(ORDERS_FILE, preRollbackBackup);
  console.log(`   ✅ Saved to: ${path.basename(preRollbackBackup)}`);
  
  // Perform rollback
  console.log(`\n🔄 Performing rollback...`);
  fs.copyFileSync(backupFile.path, ORDERS_FILE);
  console.log(`   ✅ orders.json restored from backup`);
  
  console.log(`\n✅ Rollback completed successfully!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Restart server: npm run dev`);
  console.log(`   2. Verify orders.json has expected structure`);
  console.log(`   3. Check admin panel and technician panel\n`);
}

/**
 * Main rollback function
 */
async function runRollback() {
  console.log(`\n🔙 Rollback Migration Tool`);
  console.log(`   ════════════════════════════════════════\n`);
  
  // Check if orders.json exists
  if (!fs.existsSync(ORDERS_FILE)) {
    console.error(`\n❌ ERROR: orders.json not found at ${ORDERS_FILE}`);
    process.exit(1);
  }
  
  // Get backup files
  const backups = getBackupFiles();
  
  if (backups.length === 0) {
    console.error(`\n❌ ERROR: No backup files found in ${BACKUP_DIR}`);
    console.log(`\n💡 Backup files should be named: orders-backup-*.json`);
    process.exit(1);
  }
  
  console.log(`📦 Found ${backups.length} backup file(s):\n`);
  
  // List all backups
  backups.forEach((backup, index) => {
    console.log(`   ${index + 1}. ${backup.name}`);
    console.log(`      Created: ${backup.stat.mtime.toLocaleString()}`);
    console.log(`      Size: ${formatFileSize(backup.stat.size)}`);
    console.log(``);
  });
  
  // Check if specific backup requested via command line
  const specificBackup = process.argv[2];
  let selectedBackup;
  
  if (specificBackup) {
    selectedBackup = backups.find(b => b.name === specificBackup);
    if (!selectedBackup) {
      console.error(`\n❌ ERROR: Backup file not found: ${specificBackup}`);
      process.exit(1);
    }
    console.log(`📌 Using specified backup: ${specificBackup}\n`);
  } else {
    // Use most recent backup
    selectedBackup = backups[0];
    console.log(`📌 Will restore most recent backup: ${selectedBackup.name}\n`);
  }
  
  // Ask for confirmation
  const confirmed = await askConfirmation(
    `⚠️  This will overwrite current orders.json. Continue? (y/n): `
  );
  
  if (!confirmed) {
    console.log(`\n❌ Rollback cancelled by user.\n`);
    process.exit(0);
  }
  
  // Perform rollback
  try {
    await restoreFromBackup(selectedBackup);
  } catch (error) {
    console.error(`\n❌ ERROR during rollback:`);
    console.error(error);
    process.exit(1);
  }
}

// Run rollback
runRollback().catch(error => {
  console.error(`\n❌ FATAL ERROR:`);
  console.error(error);
  process.exit(1);
});
