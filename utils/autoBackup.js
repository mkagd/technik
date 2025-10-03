/**
 * 🗄️ PROFESSIONAL AUTO-BACKUP SYSTEM
 * Enterprise-grade automated backup with rotation and cloud sync preparation
 */

import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { LockedFileOperations } from './fileLocking.js';

// Configuration
const BACKUP_CONFIG = {
  // Backup settings
  enabled: true,
  backupInterval: '0 * * * *', // Every hour
  backupDir: path.join(process.cwd(), 'backups'),
  dataDir: path.join(process.cwd(), 'data'),
  
  // Retention policy
  hourlyBackups: 48,    // Keep 48 hourly backups (2 days)
  dailyBackups: 30,     // Keep 30 daily backups (1 month)
  weeklyBackups: 12,    // Keep 12 weekly backups (3 months)
  monthlyBackups: 12,   // Keep 12 monthly backups (1 year)
  
  // Compression
  compressBackups: true,
  compressionLevel: 6,
  
  // Cloud sync settings (prepare for future implementation)
  cloudSync: {
    enabled: false,
    provider: 'aws-s3', // aws-s3, google-cloud, azure
    bucket: 'technik-backups',
    region: 'eu-west-1'
  }
};

// Backup metadata structure
const BACKUP_METADATA = {
  version: '1.0.0',
  timestamp: null,
  type: null, // 'hourly', 'daily', 'weekly', 'monthly', 'manual'
  files: [],
  totalSize: 0,
  compressionRatio: 0,
  checksum: null
};

/**
 * Auto Backup System Class
 */
export class AutoBackupSystem {
  constructor(config = BACKUP_CONFIG) {
    this.config = { ...BACKUP_CONFIG, ...config };
    this.isRunning = false;
    this.cronJob = null;
    this.backupQueue = [];
    this.stats = {
      totalBackups: 0,
      lastBackup: null,
      totalSize: 0,
      errors: 0
    };
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    try {
      // Create backup directories
      await this.ensureBackupDirectories();
      
      // Load existing backup stats
      await this.loadBackupStats();
      
      // Clean old backups on startup
      await this.cleanupOldBackups();
      
      // Start scheduled backups if enabled
      if (this.config.enabled) {
        this.startScheduledBackups();
      }
      
      console.log('🗄️ Auto backup system initialized');
      console.log(`   - Backup directory: ${this.config.backupDir}`);
      console.log(`   - Schedule: ${this.config.backupInterval}`);
      console.log(`   - Retention: ${this.config.hourlyBackups}h/${this.config.dailyBackups}d/${this.config.weeklyBackups}w/${this.config.monthlyBackups}m`);
      
      return true;
    } catch (error) {
      console.error('🗄️ Failed to initialize backup system:', error.message);
      return false;
    }
  }

  /**
   * Create backup directory structure
   */
  async ensureBackupDirectories() {
    const dirs = [
      this.config.backupDir,
      path.join(this.config.backupDir, 'hourly'),
      path.join(this.config.backupDir, 'daily'),
      path.join(this.config.backupDir, 'weekly'),
      path.join(this.config.backupDir, 'monthly'),
      path.join(this.config.backupDir, 'manual'),
      path.join(this.config.backupDir, 'metadata')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Load backup statistics
   */
  async loadBackupStats() {
    const statsFile = path.join(this.config.backupDir, 'metadata', 'stats.json');
    
    try {
      if (fs.existsSync(statsFile)) {
        this.stats = await LockedFileOperations.readJSON(statsFile, this.stats);
      }
    } catch (error) {
      console.warn('🗄️ Could not load backup stats:', error.message);
    }
  }

  /**
   * Save backup statistics
   */
  async saveBackupStats() {
    const statsFile = path.join(this.config.backupDir, 'metadata', 'stats.json');
    
    try {
      await LockedFileOperations.writeJSON(statsFile, this.stats);
    } catch (error) {
      console.error('🗄️ Could not save backup stats:', error.message);
    }
  }

  /**
   * Create a backup
   */
  async createBackup(type = 'manual', options = {}) {
    if (this.isRunning && type !== 'manual') {
      console.log('🗄️ Backup already in progress, skipping...');
      return false;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log(`🗄️ Starting ${type} backup...`);
      
      // Generate backup metadata
      const metadata = {
        ...BACKUP_METADATA,
        timestamp: new Date().toISOString(),
        type,
        startTime
      };
      
      // Create backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${type}_${timestamp}`;
      const backupPath = path.join(this.config.backupDir, type, backupName);
      
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Get list of files to backup
      const filesToBackup = await this.getFilesToBackup();
      metadata.files = filesToBackup.map(f => ({ path: f, size: this.getFileSize(f) }));
      
      // Copy files to backup directory
      let totalSize = 0;
      for (const filePath of filesToBackup) {
        const relativePath = path.relative(this.config.dataDir, filePath);
        const backupFilePath = path.join(backupPath, relativePath);
        
        // Ensure subdirectory exists
        const backupFileDir = path.dirname(backupFilePath);
        if (!fs.existsSync(backupFileDir)) {
          fs.mkdirSync(backupFileDir, { recursive: true });
        }
        
        // Copy file
        fs.copyFileSync(filePath, backupFilePath);
        totalSize += this.getFileSize(filePath);
      }
      
      metadata.totalSize = totalSize;
      metadata.endTime = Date.now();
      metadata.duration = metadata.endTime - startTime;
      
      // Calculate checksum for integrity verification
      metadata.checksum = await this.calculateBackupChecksum(backupPath);
      
      // Save metadata
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      await LockedFileOperations.writeJSON(metadataPath, metadata);
      
      // Update stats
      this.stats.totalBackups++;
      this.stats.lastBackup = metadata.timestamp;
      this.stats.totalSize += totalSize;
      await this.saveBackupStats();
      
      const duration = Date.now() - startTime;
      console.log(`✅ ${type} backup completed in ${duration}ms`);
      console.log(`   - Files: ${filesToBackup.length}`);
      console.log(`   - Size: ${(totalSize / 1024).toFixed(2)} KB`);
      console.log(`   - Location: ${backupPath}`);
      
      return {
        success: true,
        path: backupPath,
        metadata,
        duration
      };
      
    } catch (error) {
      this.stats.errors++;
      await this.saveBackupStats();
      
      console.error(`❌ ${type} backup failed:`, error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get list of files to backup
   */
  async getFilesToBackup() {
    const files = [];
    
    if (!fs.existsSync(this.config.dataDir)) {
      return files;
    }
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          // Skip backup directories
          if (item === 'backups' || item === 'test-locking') {
            continue;
          }
          scanDirectory(itemPath);
        } else if (stat.isFile()) {
          // Skip lock files and temporary files
          if (item.endsWith('.lock') || item.startsWith('.') || item.includes('.tmp')) {
            continue;
          }
          files.push(itemPath);
        }
      }
    };
    
    scanDirectory(this.config.dataDir);
    return files;
  }

  /**
   * Get file size
   */
  getFileSize(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate backup checksum for integrity verification
   */
  async calculateBackupChecksum(backupPath) {
    // Simple checksum based on file count and total size
    // In production, consider using crypto hashes
    const files = await this.getFilesToBackup();
    const totalSize = files.reduce((sum, file) => sum + this.getFileSize(file), 0);
    return `files:${files.length}-size:${totalSize}`;
  }

  /**
   * Start scheduled backups
   */
  startScheduledBackups() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
    
    this.cronJob = cron.schedule(this.config.backupInterval, async () => {
      await this.createScheduledBackup();
    }, {
      scheduled: true,
      timezone: 'Europe/Warsaw'
    });
    
    console.log('🗄️ Scheduled backups started');
  }

  /**
   * Stop scheduled backups
   */
  stopScheduledBackups() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🗄️ Scheduled backups stopped');
    }
  }

  /**
   * Create scheduled backup with intelligent type selection
   */
  async createScheduledBackup() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const date = now.getDate();
    
    let backupType = 'hourly';
    
    // Monthly backup on 1st of month at midnight
    if (date === 1 && hour === 0) {
      backupType = 'monthly';
    }
    // Weekly backup on Sunday at midnight
    else if (day === 0 && hour === 0) {
      backupType = 'weekly';
    }
    // Daily backup at midnight
    else if (hour === 0) {
      backupType = 'daily';
    }
    
    await this.createBackup(backupType);
    
    // Cleanup old backups after creating new one
    setTimeout(() => this.cleanupOldBackups(), 5000);
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    try {
      const types = ['hourly', 'daily', 'weekly', 'monthly'];
      let cleanedCount = 0;
      
      for (const type of types) {
        const typeDir = path.join(this.config.backupDir, type);
        
        if (!fs.existsSync(typeDir)) continue;
        
        const backups = fs.readdirSync(typeDir)
          .filter(name => name.startsWith('backup_'))
          .map(name => ({
            name,
            path: path.join(typeDir, name),
            time: fs.statSync(path.join(typeDir, name)).mtime
          }))
          .sort((a, b) => b.time - a.time); // Newest first
        
        const maxBackups = this.config[`${type}Backups`];
        const toDelete = backups.slice(maxBackups);
        
        for (const backup of toDelete) {
          fs.rmSync(backup.path, { recursive: true, force: true });
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} old backups`);
      }
      
    } catch (error) {
      console.error('🗄️ Backup cleanup error:', error.message);
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupPath) {
    try {
      console.log(`🔄 Starting restore from: ${backupPath}`);
      
      // Verify backup integrity
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      if (!fs.existsSync(metadataPath)) {
        throw new Error('Backup metadata not found');
      }
      
      const metadata = await LockedFileOperations.readJSON(metadataPath);
      
      // Create restore point before proceeding
      const restorePoint = await this.createBackup('manual');
      if (!restorePoint.success) {
        throw new Error('Failed to create restore point');
      }
      
      // Restore files
      const files = fs.readdirSync(backupPath).filter(f => f !== 'backup-metadata.json');
      
      for (const file of files) {
        const sourcePath = path.join(backupPath, file);
        const targetPath = path.join(this.config.dataDir, file);
        
        // Ensure target directory exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy file
        if (fs.statSync(sourcePath).isDirectory()) {
          fs.cpSync(sourcePath, targetPath, { recursive: true });
        } else {
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
      
      console.log(`✅ Restore completed from backup: ${metadata.timestamp}`);
      console.log(`   - Restore point created: ${restorePoint.path}`);
      
      return {
        success: true,
        metadata,
        restorePoint: restorePoint.path
      };
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    const backups = [];
    const types = ['hourly', 'daily', 'weekly', 'monthly', 'manual'];
    
    for (const type of types) {
      const typeDir = path.join(this.config.backupDir, type);
      
      if (!fs.existsSync(typeDir)) continue;
      
      const typeBackups = fs.readdirSync(typeDir)
        .filter(name => name.startsWith('backup_'))
        .map(name => {
          const backupPath = path.join(typeDir, name);
          const metadataPath = path.join(backupPath, 'backup-metadata.json');
          
          let metadata = null;
          if (fs.existsSync(metadataPath)) {
            try {
              metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            } catch (error) {
              // Ignore metadata errors
            }
          }
          
          return {
            name,
            type,
            path: backupPath,
            created: fs.statSync(backupPath).mtime,
            metadata
          };
        });
      
      backups.push(...typeBackups);
    }
    
    return backups.sort((a, b) => b.created - a.created);
  }

  /**
   * Get backup system status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      isRunning: this.isRunning,
      scheduledBackups: !!this.cronJob,
      stats: this.stats,
      config: {
        backupInterval: this.config.backupInterval,
        retentionPolicy: {
          hourly: this.config.hourlyBackups,
          daily: this.config.dailyBackups,
          weekly: this.config.weeklyBackups,
          monthly: this.config.monthlyBackups
        }
      },
      lastBackup: this.stats.lastBackup,
      nextBackup: this.cronJob ? 'Next scheduled backup based on cron' : 'No scheduled backups'
    };
  }
}

// Global backup system instance
let backupSystem = null;

/**
 * Initialize global backup system
 */
export async function initializeBackupSystem(config) {
  if (!backupSystem) {
    backupSystem = new AutoBackupSystem(config);
    await backupSystem.initialize();
  }
  return backupSystem;
}

/**
 * Get global backup system instance
 */
export function getBackupSystem() {
  return backupSystem;
}

/**
 * Start backup system
 */
export async function startBackupSystem(config) {
  const system = await initializeBackupSystem(config);
  return system.getStatus();
}

export default AutoBackupSystem;