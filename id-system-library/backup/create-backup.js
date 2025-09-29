#!/usr/bin/env node

/**
 * 🛡️ SYSTEM KOPII ZAPASOWYCH ID LIBRARY
 * 
 * Automatyczne tworzenie kopii zapasowych biblioteki ID
 * z pełnym systemem wersjonowania i odzyskiwania
 */

const fs = require('fs');
const path = require('path');

// Konfiguracja backup
const BACKUP_CONFIG = {
  backupDir: './backup/snapshots',
  maxBackups: 10,
  compressionLevel: 6,
  includeTests: true,
  includeDocs: true,
  autoCleanup: true
};

// Pliki do backup
const BACKUP_FILES = [
  'id-system.js',
  'id-generator.js', 
  'index.js',
  'package.json',
  'README.md',
  'ID_SYSTEM_USAGE_GUIDE.md',
  'README_ID_SYSTEM.md',
  'demo-id-system.js',
  'test-all-ids-demo.js',
  'test-10k-orders.js',
  'test-compact-ids.js',
  'CHANGELOG.md',
  '.gitignore'
];

class IDSystemBackup {
  constructor() {
    this.backupDir = path.resolve(__dirname, BACKUP_CONFIG.backupDir);
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.version = this.getVersion();
  }

  getVersion() {
    try {
      const pkg = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
      return pkg.version || '1.0.0';
    } catch (e) {
      return '1.0.0';
    }
  }

  async createBackup() {
    console.log('🛡️ ROZPOCZYNAM BACKUP ID SYSTEM LIBRARY...');
    console.log(`📅 Timestamp: ${this.timestamp}`);
    console.log(`📦 Version: ${this.version}`);

    // Utwórz folder backup
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const backupFolder = path.join(this.backupDir, `backup-${this.timestamp}`);
    fs.mkdirSync(backupFolder, { recursive: true });

    // Backup głównych plików
    await this.backupMainFiles(backupFolder);
    
    // Backup context i dokumentacji
    await this.backupContext(backupFolder);
    
    // Utwórz manifest
    await this.createManifest(backupFolder);
    
    // Cleanup starych backup
    if (BACKUP_CONFIG.autoCleanup) {
      await this.cleanupOldBackups();
    }

    console.log(`✅ BACKUP ZAKOŃCZONY: ${backupFolder}`);
    return backupFolder;
  }

  async backupMainFiles(backupFolder) {
    console.log('📂 Backup głównych plików...');
    
    const mainFolder = path.join(backupFolder, 'main');
    fs.mkdirSync(mainFolder, { recursive: true });

    for (const file of BACKUP_FILES) {
      const sourcePath = path.resolve(__dirname, '..', file);
      const targetPath = path.join(mainFolder, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`  ✅ ${file}`);
      } else {
        console.log(`  ⚠️ Brak pliku: ${file}`);
      }
    }
  }

  async backupContext(backupFolder) {
    console.log('📋 Backup kontekstu...');
    
    const contextFolder = path.join(backupFolder, 'context');
    const sourceContext = path.resolve(__dirname, '..', 'context');
    
    if (fs.existsSync(sourceContext)) {
      this.copyFolderRecursive(sourceContext, contextFolder);
      console.log('  ✅ Context folder');
    }
  }

  copyFolderRecursive(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);
    
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      if (fs.statSync(sourcePath).isDirectory()) {
        this.copyFolderRecursive(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  async createManifest(backupFolder) {
    console.log('📝 Tworzenie manifestu...');
    
    const manifest = {
      backup: {
        timestamp: this.timestamp,
        version: this.version,
        created: new Date().toISOString(),
        type: 'full-backup',
        files: this.getFilesList(backupFolder)
      },
      system: {
        name: 'Technik ID System Library',
        mainFile: 'id-system.js',
        entryPoint: 'index.js',
        version: this.version
      },
      restore: {
        instructions: 'Użyj restore-backup.js do przywrócenia',
        command: `node restore-backup.js backup-${this.timestamp}`,
        requirements: ['Node.js >= 12.0.0']
      },
      integrity: {
        totalFiles: this.getFilesList(backupFolder).length,
        checksum: this.calculateChecksum(backupFolder),
        validated: true
      }
    };

    const manifestPath = path.join(backupFolder, 'BACKUP_MANIFEST.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('  ✅ BACKUP_MANIFEST.json');
  }

  getFilesList(folder) {
    const files = [];
    
    const scanFolder = (dir, prefix = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = prefix ? `${prefix}/${item}` : item;
        
        if (fs.statSync(fullPath).isDirectory()) {
          scanFolder(fullPath, relativePath);
        } else {
          files.push({
            path: relativePath,
            size: fs.statSync(fullPath).size,
            modified: fs.statSync(fullPath).mtime.toISOString()
          });
        }
      }
    };

    scanFolder(folder);
    return files;
  }

  calculateChecksum(folder) {
    // Prosty checksum bazowany na liczbie plików i rozmiarze
    const files = this.getFilesList(folder);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return `${files.length}-${totalSize}-${this.timestamp}`;
  }

  async cleanupOldBackups() {
    console.log('🧹 Czyszczenie starych backup...');
    
    const backups = fs.readdirSync(this.backupDir)
      .filter(name => name.startsWith('backup-'))
      .map(name => ({
        name,
        path: path.join(this.backupDir, name),
        created: fs.statSync(path.join(this.backupDir, name)).ctime
      }))
      .sort((a, b) => b.created - a.created);

    if (backups.length > BACKUP_CONFIG.maxBackups) {
      const toDelete = backups.slice(BACKUP_CONFIG.maxBackups);
      
      for (const backup of toDelete) {
        this.deleteFolderRecursive(backup.path);
        console.log(`  🗑️ Usunięto: ${backup.name}`);
      }
    }
  }

  deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
      fs.readdirSync(folderPath).forEach(file => {
        const curPath = path.join(folderPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          this.deleteFolderRecursive(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(folderPath);
    }
  }

  // Lista wszystkich backup
  listBackups() {
    console.log('📋 DOSTĘPNE BACKUP:');
    
    if (!fs.existsSync(this.backupDir)) {
      console.log('  ❌ Brak backup');
      return [];
    }

    const backups = fs.readdirSync(this.backupDir)
      .filter(name => name.startsWith('backup-'))
      .map(name => {
        const manifestPath = path.join(this.backupDir, name, 'BACKUP_MANIFEST.json');
        let manifest = {};
        
        if (fs.existsSync(manifestPath)) {
          try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          } catch (e) {
            manifest = { backup: { timestamp: 'unknown' } };
          }
        }

        return {
          name,
          timestamp: manifest.backup?.timestamp || 'unknown',
          version: manifest.backup?.version || 'unknown',
          files: manifest.integrity?.totalFiles || 0,
          created: manifest.backup?.created || 'unknown'
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    backups.forEach((backup, i) => {
      console.log(`  ${i + 1}. ${backup.name}`);
      console.log(`     📅 ${backup.created}`);
      console.log(`     📦 v${backup.version} (${backup.files} plików)`);
      console.log('');
    });

    return backups;
  }
}

// CLI Interface
if (require.main === module) {
  const backup = new IDSystemBackup();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      backup.createBackup().catch(console.error);
      break;
      
    case 'list':
      backup.listBackups();
      break;
      
    default:
      console.log('🛡️ ID SYSTEM BACKUP TOOL');
      console.log('');
      console.log('Użycie:');
      console.log('  node create-backup.js create  - Utwórz nowy backup');
      console.log('  node create-backup.js list    - Lista backup');
      console.log('');
      console.log('Przykłady:');
      console.log('  npm run backup:create');
      console.log('  npm run backup:list');
  }
}

module.exports = IDSystemBackup;