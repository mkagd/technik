/**
 * 🔒 FILE LOCKING UTILITY
 * Professional-grade concurrent access protection
 */

import lockfile from 'lockfile';
import fs from 'fs';
import path from 'path';

// Default lock options with aggressive settings for data protection
const DEFAULT_LOCK_OPTIONS = {
  wait: 5000,      // Wait up to 5 seconds for lock
  pollPeriod: 100, // Check every 100ms
  stale: 30000,    // Consider locks stale after 30 seconds
  retries: 50,     // Retry up to 50 times
  retryWait: 100   // Wait 100ms between retries
};

/**
 * Create a lock file path from data file path
 */
function getLockPath(filePath) {
  return filePath + '.lock';
}

/**
 * Professional file locking wrapper with enhanced error handling
 */
export class FileLock {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.lockPath = getLockPath(filePath);
    this.options = { ...DEFAULT_LOCK_OPTIONS, ...options };
    this.isLocked = false;
  }

  /**
   * Acquire lock with timeout and retry logic
   */
  async lock() {
    if (this.isLocked) {
      throw new Error(`Lock already acquired for ${this.filePath}`);
    }

    return new Promise((resolve, reject) => {
      lockfile.lock(this.lockPath, this.options, (err) => {
        if (err) {
          if (err.code === 'EEXIST') {
            reject(new Error(`File is locked by another process: ${this.filePath}`));
          } else {
            reject(new Error(`Lock acquisition failed: ${err.message}`));
          }
        } else {
          this.isLocked = true;
          console.log(`🔒 Lock acquired: ${this.filePath}`);
          resolve();
        }
      });
    });
  }

  /**
   * Release lock with error handling
   */
  async unlock() {
    if (!this.isLocked) {
      console.warn(`⚠️ Attempting to unlock non-locked file: ${this.filePath}`);
      return;
    }

    return new Promise((resolve, reject) => {
      lockfile.unlock(this.lockPath, (err) => {
        if (err) {
          console.error(`🔒 Error releasing lock: ${err.message}`);
          reject(new Error(`Lock release failed: ${err.message}`));
        } else {
          this.isLocked = false;
          console.log(`🔒 Lock released: ${this.filePath}`);
          resolve();
        }
      });
    });
  }

  /**
   * Check if file is currently locked
   */
  async isFileLocked() {
    return new Promise((resolve) => {
      lockfile.check(this.lockPath, (err, isLocked) => {
        resolve(!!isLocked);
      });
    });
  }

  /**
   * Execute function with automatic lock/unlock
   */
  async withLock(fn) {
    await this.lock();
    try {
      const result = await fn();
      return result;
    } finally {
      await this.unlock();
    }
  }
}

/**
 * High-level file operations with automatic locking
 */
export class LockedFileOperations {
  /**
   * Read JSON file with lock protection
   */
  static async readJSON(filePath, defaultValue = null) {
    const lock = new FileLock(filePath);
    
    return await lock.withLock(async () => {
      try {
        if (!fs.existsSync(filePath)) {
          if (defaultValue !== null) {
            console.log(`📁 File not found, using default: ${filePath}`);
            return defaultValue;
          }
          throw new Error(`File not found: ${filePath}`);
        }

        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        if (error.message.includes('File not found')) {
          throw error;
        }
        throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
      }
    });
  }

  /**
   * Write JSON file with lock protection and backup
   */
  static async writeJSON(filePath, data, options = {}) {
    const { createBackup = true, pretty = true } = options;
    const lock = new FileLock(filePath);
    
    return await lock.withLock(async () => {
      try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Create backup if file exists and backup is requested
        if (createBackup && fs.existsSync(filePath)) {
          const backupPath = `${filePath}.backup.${Date.now()}`;
          fs.copyFileSync(filePath, backupPath);
          console.log(`💾 Backup created: ${backupPath}`);
        }

        // Write JSON data
        const jsonString = pretty ? 
          JSON.stringify(data, null, 2) : 
          JSON.stringify(data);
        
        fs.writeFileSync(filePath, jsonString, 'utf8');
        console.log(`📁 File written successfully: ${filePath}`);
        
        return true;
      } catch (error) {
        throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
      }
    });
  }

  /**
   * Update JSON file with atomic operation
   */
  static async updateJSON(filePath, updateFn, defaultValue = {}) {
    const lock = new FileLock(filePath);
    
    return await lock.withLock(async () => {
      try {
        // Read current data
        let currentData;
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          currentData = JSON.parse(content);
        } else {
          currentData = defaultValue;
        }

        // Apply update function
        const updatedData = await updateFn(currentData);
        
        // Write updated data
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
        console.log(`📁 File updated successfully: ${filePath}`);
        
        return updatedData;
      } catch (error) {
        throw new Error(`Failed to update JSON file ${filePath}: ${error.message}`);
      }
    });
  }

  /**
   * Batch operation on multiple files with proper locking order
   */
  static async batchOperation(filePaths, operationFn) {
    // Sort file paths to prevent deadlocks
    const sortedPaths = [...filePaths].sort();
    const locks = sortedPaths.map(path => new FileLock(path));
    
    // Acquire all locks in order
    for (const lock of locks) {
      await lock.lock();
    }
    
    try {
      console.log(`🔒 Batch operation started on ${locks.length} files`);
      const result = await operationFn();
      return result;
    } finally {
      // Release all locks in reverse order
      for (let i = locks.length - 1; i >= 0; i--) {
        await locks[i].unlock();
      }
      console.log(`🔒 Batch operation completed on ${locks.length} files`);
    }
  }
}

/**
 * Cleanup stale locks (should be run periodically)
 */
export async function cleanupStaleLocks(dataDirectory) {
  try {
    const lockFiles = fs.readdirSync(dataDirectory)
      .filter(file => file.endsWith('.lock'))
      .map(file => path.join(dataDirectory, file));

    for (const lockFile of lockFiles) {
      const stats = fs.statSync(lockFile);
      const age = Date.now() - stats.mtime.getTime();
      
      // Remove locks older than 5 minutes
      if (age > 5 * 60 * 1000) {
        fs.unlinkSync(lockFile);
        console.log(`🧹 Cleaned up stale lock: ${lockFile}`);
      }
    }
  } catch (error) {
    console.error('🧹 Lock cleanup error:', error.message);
  }
}

export default LockedFileOperations;