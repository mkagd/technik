#!/usr/bin/env node

/**
 * 🔄 SYSTEM PRZYWRACANIA BACKUP ID LIBRARY
 * 
 * Przywracanie biblioteki ID z kopii zapasowych
 * z walidacją integralności i rollback
 */

const fs = require('fs');
const path = require('path');

class IDSystemRestore {
  constructor() {
    this.backupDir = path.resolve(__dirname, 'snapshots');
    this.libraryDir = path.resolve(__dirname, '..');
  }

  async restoreBackup(backupName) {
    console.log(`🔄 PRZYWRACANIE BACKUP: ${backupName}`);
    
    const backupPath = path.join(this.backupDir, backupName);
    
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Backup nie istnieje: ${backupName}`);
      return false;
    }

    // Sprawdź manifest
    const manifest = await this.loadManifest(backupPath);
    if (!manifest) {
      console.error('❌ Brak manifestu backup');
      return false;
    }

    console.log(`📋 Backup info:`);
    console.log(`   📅 Utworzony: ${manifest.backup.created}`);
    console.log(`   📦 Wersja: ${manifest.backup.version}`);
    console.log(`   📂 Plików: ${manifest.integrity.totalFiles}`);

    // Utwórz backup obecnego stanu
    const currentBackup = await this.createCurrentStateBackup();
    console.log(`💾 Zapisano obecny stan jako: ${currentBackup}`);

    try {
      // Przywróć główne pliki
      await this.restoreMainFiles(backupPath);
      
      // Przywróć kontekst
      await this.restoreContext(backupPath);
      
      // Walidacja
      const validation = await this.validateRestore(manifest);
      
      if (validation.success) {
        console.log('✅ PRZYWRACANIE ZAKOŃCZONE POMYŚLNIE');
        console.log(`🔄 Rollback dostępny: ${currentBackup}`);
        return true;
      } else {
        console.error('❌ WALIDACJA NIEUDANA');
        console.error('🔄 Przywracanie poprzedniego stanu...');
        await this.rollback(currentBackup);
        return false;
      }
      
    } catch (error) {
      console.error('❌ BŁĄD PODCZAS PRZYWRACANIA:', error.message);
      console.error('🔄 Przywracanie poprzedniego stanu...');
      await this.rollback(currentBackup);
      return false;
    }
  }

  async loadManifest(backupPath) {
    const manifestPath = path.join(backupPath, 'BACKUP_MANIFEST.json');
    
    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      return null;
    }
  }

  async createCurrentStateBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `rollback-${timestamp}`;
    const rollbackPath = path.join(this.backupDir, backupName);
    
    fs.mkdirSync(rollbackPath, { recursive: true });
    
    // Backup obecnych plików
    const mainFiles = [
      'id-system.js', 'id-generator.js', 'index.js', 'package.json',
      'README.md', 'ID_SYSTEM_USAGE_GUIDE.md', 'README_ID_SYSTEM.md'
    ];

    const rollbackMain = path.join(rollbackPath, 'main');
    fs.mkdirSync(rollbackMain, { recursive: true });

    for (const file of mainFiles) {
      const sourcePath = path.join(this.libraryDir, file);
      const targetPath = path.join(rollbackMain, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }

    // Backup kontekstu
    const contextSource = path.join(this.libraryDir, 'context');
    const contextTarget = path.join(rollbackPath, 'context');
    
    if (fs.existsSync(contextSource)) {
      this.copyFolderRecursive(contextSource, contextTarget);
    }

    return backupName;
  }

  async restoreMainFiles(backupPath) {
    console.log('📂 Przywracanie głównych plików...');
    
    const mainBackupPath = path.join(backupPath, 'main');
    
    if (!fs.existsSync(mainBackupPath)) {
      throw new Error('Brak folderu main w backup');
    }

    const files = fs.readdirSync(mainBackupPath);
    
    for (const file of files) {
      const sourcePath = path.join(mainBackupPath, file);
      const targetPath = path.join(this.libraryDir, file);
      
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ ${file}`);
    }
  }

  async restoreContext(backupPath) {
    console.log('📋 Przywracanie kontekstu...');
    
    const contextBackupPath = path.join(backupPath, 'context');
    const contextTargetPath = path.join(this.libraryDir, 'context');
    
    if (fs.existsSync(contextBackupPath)) {
      // Usuń obecny kontekst
      if (fs.existsSync(contextTargetPath)) {
        this.deleteFolderRecursive(contextTargetPath);
      }
      
      // Przywróć z backup
      this.copyFolderRecursive(contextBackupPath, contextTargetPath);
      console.log('  ✅ Context folder');
    }
  }

  async validateRestore(manifest) {
    console.log('🔍 Walidacja przywróconej biblioteki...');
    
    const results = {
      success: true,
      checks: []
    };

    // Sprawdź główne pliki
    const mainFile = path.join(this.libraryDir, 'id-system.js');
    if (fs.existsSync(mainFile)) {
      results.checks.push({ name: 'id-system.js', status: 'OK' });
    } else {
      results.checks.push({ name: 'id-system.js', status: 'MISSING' });
      results.success = false;
    }

    // Sprawdź index.js
    const indexFile = path.join(this.libraryDir, 'index.js');
    if (fs.existsSync(indexFile)) {
      results.checks.push({ name: 'index.js', status: 'OK' });
    } else {
      results.checks.push({ name: 'index.js', status: 'MISSING' });
      results.success = false;
    }

    // Test funkcjonalności
    try {
      delete require.cache[require.resolve(path.join(this.libraryDir, 'id-system.js'))];
      const IDSystem = require(path.join(this.libraryDir, 'id-system.js'));
      
      const testId = IDSystem.generateOrderId('A');
      if (testId && testId.startsWith('ORD')) {
        results.checks.push({ name: 'Funkcjonalność', status: 'OK' });
      } else {
        results.checks.push({ name: 'Funkcjonalność', status: 'FAILED' });
        results.success = false;
      }
    } catch (e) {
      results.checks.push({ name: 'Funkcjonalność', status: 'ERROR: ' + e.message });
      results.success = false;
    }

    // Wyświetl wyniki
    results.checks.forEach(check => {
      const icon = check.status === 'OK' ? '✅' : '❌';
      console.log(`  ${icon} ${check.name}: ${check.status}`);
    });

    return results;
  }

  async rollback(rollbackName) {
    console.log(`🔄 ROLLBACK do: ${rollbackName}`);
    
    const rollbackPath = path.join(this.backupDir, rollbackName);
    
    if (!fs.existsSync(rollbackPath)) {
      console.error('❌ Rollback backup nie istnieje');
      return false;
    }

    try {
      await this.restoreMainFiles(rollbackPath);
      await this.restoreContext(rollbackPath);
      
      console.log('✅ ROLLBACK ZAKOŃCZONY');
      return true;
    } catch (e) {
      console.error('❌ BŁĄD ROLLBACK:', e.message);
      return false;
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

  listAvailableBackups() {
    console.log('📋 DOSTĘPNE BACKUP DO PRZYWRÓCENIA:');
    
    if (!fs.existsSync(this.backupDir)) {
      console.log('  ❌ Brak backup');
      return [];
    }

    const backups = fs.readdirSync(this.backupDir)
      .filter(name => name.startsWith('backup-') || name.startsWith('rollback-'))
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
          type: name.startsWith('rollback-') ? 'ROLLBACK' : 'BACKUP',
          timestamp: manifest.backup?.timestamp || 'unknown',
          version: manifest.backup?.version || 'unknown',
          created: manifest.backup?.created || 'unknown'
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    backups.forEach((backup, i) => {
      const icon = backup.type === 'ROLLBACK' ? '🔄' : '📦';
      console.log(`  ${i + 1}. ${icon} ${backup.name}`);
      console.log(`     📅 ${backup.created}`);
      console.log(`     📦 v${backup.version}`);
      console.log('');
    });

    return backups;
  }
}

// CLI Interface
if (require.main === module) {
  const restore = new IDSystemRestore();
  
  const command = process.argv[2];
  const backupName = process.argv[3];
  
  switch (command) {
    case 'restore':
      if (!backupName) {
        console.error('❌ Podaj nazwę backup do przywrócenia');
        console.log('Użycie: node restore-backup.js restore backup-2025-09-28T...');
        process.exit(1);
      }
      restore.restoreBackup(backupName).catch(console.error);
      break;
      
    case 'list':
      restore.listAvailableBackups();
      break;
      
    default:
      console.log('🔄 ID SYSTEM RESTORE TOOL');
      console.log('');
      console.log('Użycie:');
      console.log('  node restore-backup.js restore <backup-name>  - Przywróć backup');
      console.log('  node restore-backup.js list                   - Lista backup');
      console.log('');
      console.log('Przykłady:');
      console.log('  node restore-backup.js restore backup-2025-09-28T12-00-00-000Z');
      console.log('  npm run backup:restore backup-nazwa');
  }
}

module.exports = IDSystemRestore;