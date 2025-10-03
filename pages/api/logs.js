// pages/api/logs.js
// API endpoint dla zarządzania systemem logowania

import { getLogger } from '../../utils/comprehensiveLogger.js';

export default async function handler(req, res) {
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const logger = getLogger();
  
  try {
    
    if (req.method === 'GET') {
      const { action, level, limit } = req.query;
      
      switch (action) {
        
        // Statystyki systemu logowania
        case 'stats':
          const stats = logger.getStats();
          logger.debug('Log stats requested', { requestId: req.requestId });
          
          return res.status(200).json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
          });
        
        // Pobierz ostatnie logi
        case 'recent':
          const recentLogs = await getRecentLogs(level, parseInt(limit) || 100);
          
          return res.status(200).json({
            success: true,
            logs: recentLogs,
            count: recentLogs.length,
            level: level || 'all'
          });
        
        // Health check systemu logowania
        case 'health':
          const health = await checkLogSystemHealth();
          
          return res.status(200).json({
            success: true,
            health
          });
        
        // Lista plików log
        case 'files':
          const files = logger.getLogFilesInfo();
          
          return res.status(200).json({
            success: true,
            files
          });
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use: stats, recent, health, files'
          });
      }
    }
    
    if (req.method === 'POST') {
      const { action, level, message, metadata } = req.body;
      
      switch (action) {
        
        // Ręczne logowanie
        case 'log':
          if (!message) {
            return res.status(400).json({
              success: false,
              message: 'Message is required'
            });
          }
          
          const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
          const logLevel = (level || 'INFO').toUpperCase();
          
          if (!validLevels.includes(logLevel)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid level. Use: DEBUG, INFO, WARN, ERROR, FATAL'
            });
          }
          
          const logEntry = logger.log(logLevel, message, {
            source: 'API',
            requestId: req.requestId,
            ...metadata
          });
          
          return res.status(200).json({
            success: true,
            message: 'Log entry created',
            entry: logEntry
          });
        
        // Rotacja plików
        case 'rotate':
          await logger.rotateLogFiles();
          logger.info('Manual log rotation triggered', { requestId: req.requestId });
          
          return res.status(200).json({
            success: true,
            message: 'Log files rotated successfully'
          });
        
        // Test logowania
        case 'test':
          const testResults = await performLogTest(logger);
          
          return res.status(200).json({
            success: true,
            message: 'Log test completed',
            results: testResults
          });
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use: log, rotate, test'
          });
      }
    }
    
    if (req.method === 'DELETE') {
      const { action, type } = req.query;
      
      if (action === 'clear') {
        if (type === 'all') {
          await clearAllLogs();
          logger.warn('All log files cleared via API', { requestId: req.requestId });
          
          return res.status(200).json({
            success: true,
            message: 'All log files cleared'
          });
        } else if (type) {
          await clearLogsByType(type);
          logger.warn(`Log files cleared: ${type}`, { requestId: req.requestId });
          
          return res.status(200).json({
            success: true,
            message: `Log files cleared: ${type}`
          });
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid delete action'
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    logger.error('Logs API error', {
      error: error.message,
      stack: error.stack,
      requestId: req.requestId
    });
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// ========== FUNKCJE POMOCNICZE ==========

/**
 * Pobiera ostatnie logi z pliku
 */
async function getRecentLogs(level, limit) {
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const combinedLogPath = path.join(logDir, 'combined.log');
    
    if (!fs.existsSync(combinedLogPath)) {
      return [];
    }
    
    const logContent = fs.readFileSync(combinedLogPath, 'utf8');
    const lines = logContent.trim().split('\n').filter(line => line);
    
    // Parse JSON logs
    let logs = lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null);
    
    // Filter by level if specified
    if (level && level !== 'all') {
      logs = logs.filter(log => log.level === level.toUpperCase());
    }
    
    // Get most recent logs
    logs = logs.slice(-limit).reverse();
    
    return logs;
    
  } catch (error) {
    console.error('Error reading recent logs:', error);
    return [];
  }
}

/**
 * Sprawdza health systemu logowania
 */
async function checkLogSystemHealth() {
  const fs = await import('fs');
  const path = await import('path');
  
  const health = {
    status: 'healthy',
    issues: [],
    checks: {}
  };
  
  try {
    const logDir = path.join(process.cwd(), 'logs');
    
    // Sprawdź czy katalog istnieje
    health.checks.logDirectory = fs.existsSync(logDir);
    if (!health.checks.logDirectory) {
      health.issues.push('Log directory does not exist');
      health.status = 'warning';
    }
    
    // Sprawdź dostępność plików
    const requiredFiles = ['combined.log', 'error.log', 'access.log'];
    health.checks.logFiles = {};
    
    requiredFiles.forEach(filename => {
      const filepath = path.join(logDir, filename);
      const exists = fs.existsSync(filepath);
      health.checks.logFiles[filename] = exists;
      
      if (!exists) {
        health.issues.push(`Log file missing: ${filename}`);
        health.status = 'warning';
      }
    });
    
    // Sprawdź rozmiary plików
    health.checks.fileSizes = {};
    const maxSizeWarning = 50 * 1024 * 1024; // 50MB
    
    requiredFiles.forEach(filename => {
      const filepath = path.join(logDir, filename);
      
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        health.checks.fileSizes[filename] = stats.size;
        
        if (stats.size > maxSizeWarning) {
          health.issues.push(`Large log file: ${filename} (${Math.round(stats.size / 1024 / 1024)}MB)`);
          health.status = 'warning';
        }
      }
    });
    
    // Sprawdź uprawnienia do zapisu
    try {
      const testFile = path.join(logDir, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      health.checks.writePermissions = true;
    } catch (error) {
      health.checks.writePermissions = false;
      health.issues.push('No write permissions to log directory');
      health.status = 'error';
    }
    
    if (health.issues.length === 0) {
      health.issues.push('All checks passed');
    }
    
  } catch (error) {
    health.status = 'error';
    health.issues.push(`Health check error: ${error.message}`);
  }
  
  return health;
}

/**
 * Wykonuje test systemu logowania
 */
async function performLogTest(logger) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  // Test 1: Wszystkie poziomy logowania
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  
  levels.forEach(level => {
    try {
      logger.log(level, `Test log message - ${level}`, { 
        test: true, 
        testId: Date.now() 
      });
      
      results.tests.push({
        name: `${level} logging`,
        status: 'passed',
        message: `${level} log created successfully`
      });
    } catch (error) {
      results.tests.push({
        name: `${level} logging`,
        status: 'failed',
        message: error.message
      });
    }
  });
  
  // Test 2: Performance logging
  try {
    logger.logPerformance('test-operation', 150, { test: true });
    results.tests.push({
      name: 'Performance logging',
      status: 'passed',
      message: 'Performance log created successfully'
    });
  } catch (error) {
    results.tests.push({
      name: 'Performance logging',
      status: 'failed',
      message: error.message
    });
  }
  
  // Test 3: Audit logging
  try {
    logger.logAudit('test-action', 'test-resource', 'test-user', { test: true });
    results.tests.push({
      name: 'Audit logging',
      status: 'passed',
      message: 'Audit log created successfully'
    });
  } catch (error) {
    results.tests.push({
      name: 'Audit logging',
      status: 'failed',
      message: error.message
    });
  }
  
  // Podsumowanie
  const passed = results.tests.filter(t => t.status === 'passed').length;
  const total = results.tests.length;
  
  results.summary = {
    passed,
    failed: total - passed,
    total,
    success: passed === total
  };
  
  return results;
}

/**
 * Czyści wszystkie pliki log
 */
async function clearAllLogs() {
  const fs = await import('fs');
  const path = await import('path');
  
  const logDir = path.join(process.cwd(), 'logs');
  
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir);
    
    files.forEach(file => {
      if (file.endsWith('.log') || file.endsWith('.tmp')) {
        const filepath = path.join(logDir, file);
        fs.writeFileSync(filepath, ''); // Clear file content
      }
    });
  }
}

/**
 * Czyści logi konkretnego typu
 */
async function clearLogsByType(type) {
  const fs = await import('fs');
  const path = await import('path');
  
  const logDir = path.join(process.cwd(), 'logs');
  const filename = `${type}.log`;
  const filepath = path.join(logDir, filename);
  
  if (fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, ''); // Clear file content
  }
}