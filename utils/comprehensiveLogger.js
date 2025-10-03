/**
 * 📝 COMPREHENSIVE LOGGING SYSTEM
 * 
 * Enterprise-grade logging system z zaawansowanymi funkcjami:
 * - Poziomy logowania (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Strukturalne logi JSON z metadanymi
 * - Rotacja plików i archiwizacja
 * - Performance metrics i audit trails
 * - Error tracking z stack traces
 * - Korelacja requestów (tracing)
 * - Log agregacja i analityka
 * 
 * Wersja: 1.0
 * Data: 2025-10-01
 */

import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';

// ========== KONFIGURACJA LOGOWANIA ==========
const LOG_CONFIG = {
  // Poziomy logowania
  levels: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
  },
  
  // Kolory dla konsoli
  colors: {
    DEBUG: '\x1b[36m',  // Cyan
    INFO: '\x1b[32m',   // Green
    WARN: '\x1b[33m',   // Yellow
    ERROR: '\x1b[31m',  // Red
    FATAL: '\x1b[35m',  // Magenta
    RESET: '\x1b[0m'
  },
  
  // Konfiguracja plików
  files: {
    directory: path.join(process.cwd(), 'logs'),
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,               // Przechowuj 10 plików
    datePattern: 'YYYY-MM-DD',
    
    // Osobne pliki dla różnych poziomów
    filenames: {
      combined: 'combined.log',
      error: 'error.log',
      access: 'access.log',
      performance: 'performance.log',
      audit: 'audit.log',
      debug: 'debug.log'
    }
  },
  
  // Formatowanie
  format: {
    timestamp: true,
    json: true,
    prettyPrint: process.env.NODE_ENV !== 'production',
    includeStack: true,
    maxDepth: 5
  },
  
  // Filtrowanie
  minLevel: process.env.LOG_LEVEL || 'INFO',
  blacklist: [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'session'
  ]
};

// ========== GŁÓWNA KLASA LOGGERA ==========
class ComprehensiveLogger {
  
  constructor() {
    this.startTime = Date.now();
    this.requestCounter = 0;
    this.logStreams = new Map();
    this.performanceMetrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      slowQueries: []
    };
    
    this.ensureLogDirectory();
    this.initializeStreams();
  }
  
  /**
   * Główna metoda logowania
   */
  log(level, message, metadata = {}) {
    const levelNum = LOG_CONFIG.levels[level];
    const minLevelNum = LOG_CONFIG.levels[LOG_CONFIG.minLevel];
    
    // Filtruj poziomy poniżej minimum
    if (levelNum < minLevelNum) return;
    
    const logEntry = this.createLogEntry(level, message, metadata);
    
    // Log do konsoli
    if (LOG_CONFIG.format.prettyPrint) {
      this.logToConsole(logEntry);
    }
    
    // Log do plików
    this.logToFile(logEntry);
    
    // Specjalne przetwarzanie dla błędów
    if (level === 'ERROR' || level === 'FATAL') {
      this.handleError(logEntry);
    }
    
    return logEntry;
  }
  
  /**
   * Metody dla różnych poziomów
   */
  debug(message, metadata = {}) {
    return this.log('DEBUG', message, metadata);
  }
  
  info(message, metadata = {}) {
    return this.log('INFO', message, metadata);
  }
  
  warn(message, metadata = {}) {
    return this.log('WARN', message, metadata);
  }
  
  error(message, metadata = {}) {
    return this.log('ERROR', message, metadata);
  }
  
  fatal(message, metadata = {}) {
    return this.log('FATAL', message, metadata);
  }
  
  /**
   * Logowanie requestów HTTP
   */
  logRequest(req, res, responseTime) {
    const metadata = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      responseTime: responseTime,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length'),
      requestId: req.requestId
    };
    
    // Aktualizuj metryki wydajności
    this.updatePerformanceMetrics(metadata);
    
    const level = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    this.log(level, `${req.method} ${req.url}`, metadata);
    
    // Log do pliku access
    this.logToAccessFile(metadata);
  }
  
  /**
   * Logowanie operacji na danych (audit trail)
   */
  logAudit(action, resource, userId, metadata = {}) {
    const auditEntry = {
      action,
      resource,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    this.log('INFO', `AUDIT: ${action} ${resource}`, auditEntry);
    this.logToAuditFile(auditEntry);
  }
  
  /**
   * Logowanie wydajności
   */
  logPerformance(operation, duration, metadata = {}) {
    const perfEntry = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    if (duration > 1000) { // Powyżej 1 sekundy to wolne
      this.warn(`SLOW OPERATION: ${operation} took ${duration}ms`, perfEntry);
      this.performanceMetrics.slowQueries.push(perfEntry);
    } else {
      this.debug(`PERFORMANCE: ${operation} took ${duration}ms`, perfEntry);
    }
    
    this.logToPerformanceFile(perfEntry);
  }
  
  /**
   * Tworzy strukturę log entry
   */
  createLogEntry(level, message, metadata) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      pid: process.pid,
      hostname: require('os').hostname(),
      ...this.sanitizeMetadata(metadata)
    };
    
    // Dodaj stack trace dla błędów
    if ((level === 'ERROR' || level === 'FATAL') && LOG_CONFIG.format.includeStack) {
      entry.stack = this.getStackTrace();
    }
    
    // Dodaj memory usage
    const memUsage = process.memoryUsage();
    entry.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
    };
    
    return entry;
  }
  
  /**
   * Usuwa wrażliwe dane
   */
  sanitizeMetadata(metadata) {
    const sanitized = { ...metadata };
    
    LOG_CONFIG.blacklist.forEach(keyword => {
      Object.keys(sanitized).forEach(key => {
        if (key.toLowerCase().includes(keyword)) {
          sanitized[key] = '[FILTERED]';
        }
      });
    });
    
    return sanitized;
  }
  
  /**
   * Logowanie do konsoli z kolorami
   */
  logToConsole(entry) {
    const color = LOG_CONFIG.colors[entry.level];
    const reset = LOG_CONFIG.colors.RESET;
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    
    console.log(`${color}[${timestamp}] ${entry.level}${reset}: ${entry.message}`);
    
    if (entry.stack) {
      console.log(`${color}Stack: ${entry.stack}${reset}`);
    }
    
    // Pokaż ważne metadane
    if (entry.responseTime || entry.duration) {
      const time = entry.responseTime || entry.duration;
      console.log(`${color}⏱️  ${time}ms${reset}`);
    }
  }
  
  /**
   * Logowanie do plików
   */
  logToFile(entry) {
    const logLine = JSON.stringify(entry) + '\n';
    
    // Combined log
    this.writeToStream('combined', logLine);
    
    // Level-specific logs
    if (entry.level === 'ERROR' || entry.level === 'FATAL') {
      this.writeToStream('error', logLine);
    }
    
    if (entry.level === 'DEBUG') {
      this.writeToStream('debug', logLine);
    }
  }
  
  /**
   * Log access requests
   */
  logToAccessFile(metadata) {
    const accessLine = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...metadata
    }) + '\n';
    
    this.writeToStream('access', accessLine);
  }
  
  /**
   * Log audit trail
   */
  logToAuditFile(auditEntry) {
    const auditLine = JSON.stringify(auditEntry) + '\n';
    this.writeToStream('audit', auditLine);
  }
  
  /**
   * Log performance metrics
   */
  logToPerformanceFile(perfEntry) {
    const perfLine = JSON.stringify(perfEntry) + '\n';
    this.writeToStream('performance', perfLine);
  }
  
  /**
   * Zapisuje do streamu
   */
  writeToStream(streamName, data) {
    const stream = this.logStreams.get(streamName);
    if (stream && !stream.destroyed) {
      stream.write(data);
    }
  }
  
  /**
   * Inicjalizuje file streams
   */
  initializeStreams() {
    Object.entries(LOG_CONFIG.files.filenames).forEach(([type, filename]) => {
      const filepath = path.join(LOG_CONFIG.files.directory, filename);
      const stream = createWriteStream(filepath, { flags: 'a' });
      this.logStreams.set(type, stream);
    });
  }
  
  /**
   * Zapewnia istnienie katalogu logs
   */
  ensureLogDirectory() {
    if (!fs.existsSync(LOG_CONFIG.files.directory)) {
      fs.mkdirSync(LOG_CONFIG.files.directory, { recursive: true });
    }
  }
  
  /**
   * Pobiera stack trace
   */
  getStackTrace() {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(3, 8).join('\n') : 'No stack available';
  }
  
  /**
   * Obsługuje błędy
   */
  handleError(logEntry) {
    this.performanceMetrics.errors++;
    
    // Możesz tutaj dodać integrację z zewnętrznymi systemami
    // np. Sentry, DataDog, NewRelic
  }
  
  /**
   * Aktualizuje metryki wydajności
   */
  updatePerformanceMetrics(metadata) {
    this.performanceMetrics.requests++;
    
    if (metadata.responseTime) {
      this.performanceMetrics.totalResponseTime += metadata.responseTime;
    }
    
    if (metadata.statusCode >= 400) {
      this.performanceMetrics.errors++;
    }
  }
  
  /**
   * Rotacja plików log
   */
  async rotateLogFiles() {
    for (const [type, filename] of Object.entries(LOG_CONFIG.files.filenames)) {
      const filepath = path.join(LOG_CONFIG.files.directory, filename);
      
      try {
        const stats = fs.statSync(filepath);
        
        if (stats.size > LOG_CONFIG.files.maxSize) {
          // Zamknij obecny stream
          const stream = this.logStreams.get(type);
          if (stream) {
            stream.end();
          }
          
          // Przenieś plik
          const timestamp = new Date().toISOString().split('T')[0];
          const rotatedFile = path.join(
            LOG_CONFIG.files.directory,
            `${filename}.${timestamp}`
          );
          
          fs.renameSync(filepath, rotatedFile);
          
          // Stwórz nowy stream
          const newStream = createWriteStream(filepath, { flags: 'a' });
          this.logStreams.set(type, newStream);
          
          this.info(`Log file rotated: ${filename} -> ${path.basename(rotatedFile)}`);
          
          // Wyczyść stare pliki
          this.cleanupOldLogFiles(type, filename);
        }
      } catch (error) {
        this.error('Error during log rotation', { error: error.message });
      }
    }
  }
  
  /**
   * Czyści stare pliki log
   */
  cleanupOldLogFiles(type, baseFilename) {
    try {
      const files = fs.readdirSync(LOG_CONFIG.files.directory)
        .filter(file => file.startsWith(baseFilename))
        .map(file => ({
          name: file,
          path: path.join(LOG_CONFIG.files.directory, file),
          stats: fs.statSync(path.join(LOG_CONFIG.files.directory, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);
      
      // Usuń pliki powyżej limitu
      if (files.length > LOG_CONFIG.files.maxFiles) {
        const filesToDelete = files.slice(LOG_CONFIG.files.maxFiles);
        
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          this.info(`Old log file deleted: ${file.name}`);
        });
      }
    } catch (error) {
      this.error('Error cleaning up old log files', { error: error.message });
    }
  }
  
  /**
   * Pobiera statystyki logowania
   */
  getStats() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.performanceMetrics.requests > 0 
      ? Math.round(this.performanceMetrics.totalResponseTime / this.performanceMetrics.requests)
      : 0;
    
    return {
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      requests: this.performanceMetrics.requests,
      errors: this.performanceMetrics.errors,
      errorRate: this.performanceMetrics.requests > 0 
        ? ((this.performanceMetrics.errors / this.performanceMetrics.requests) * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: avgResponseTime,
      slowQueries: this.performanceMetrics.slowQueries.slice(-10), // Ostatnie 10
      memory: process.memoryUsage(),
      logFiles: this.getLogFilesInfo()
    };
  }
  
  /**
   * Formatuje uptime
   */
  formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  /**
   * Informacje o plikach log
   */
  getLogFilesInfo() {
    const filesInfo = {};
    
    Object.entries(LOG_CONFIG.files.filenames).forEach(([type, filename]) => {
      const filepath = path.join(LOG_CONFIG.files.directory, filename);
      
      try {
        const stats = fs.statSync(filepath);
        filesInfo[type] = {
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          modified: stats.mtime.toISOString()
        };
      } catch (error) {
        filesInfo[type] = { error: 'File not found' };
      }
    });
    
    return filesInfo;
  }
  
  /**
   * Formatuje bajty
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Zamyka wszystkie streamy
   */
  close() {
    this.logStreams.forEach(stream => {
      if (stream && !stream.destroyed) {
        stream.end();
      }
    });
    this.logStreams.clear();
  }
}

// ========== MIDDLEWARE EXPRESS ==========
function createLoggerMiddleware(logger) {
  return (req, res, next) => {
    const start = Date.now();
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log incoming request
    logger.debug(`Incoming ${req.method} ${req.url}`, {
      requestId: req.requestId,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args) {
      const responseTime = Date.now() - start;
      logger.logRequest(req, res, responseTime);
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

// ========== INSTANCJA GLOBALNA ==========
let globalLogger = null;

function getLogger() {
  if (!globalLogger) {
    globalLogger = new ComprehensiveLogger();
    
    // Automatyczna rotacja co godzinę
    setInterval(() => {
      globalLogger.rotateLogFiles();
    }, 60 * 60 * 1000); // 1 godzina
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      globalLogger.info('Application shutting down...');
      globalLogger.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      globalLogger.info('Application terminated...');
      globalLogger.close();
      process.exit(0);
    });
  }
  
  return globalLogger;
}

// ========== EXPORT ==========
export {
  ComprehensiveLogger,
  createLoggerMiddleware,
  getLogger,
  LOG_CONFIG
};