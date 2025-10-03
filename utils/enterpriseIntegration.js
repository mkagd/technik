/**
 * Enterprise System Integration Manager
 * 
 * Unified middleware chain that integrates all enterprise systems:
 * - JWT Authentication
 * - Rate Limiting & Security  
 * - Data Validation
 * - Advanced Caching
 * - File Locking
 * - Comprehensive Logging
 * - Auto Backup System
 * 
 * This creates a seamless, enterprise-grade request processing pipeline.
 */

import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import globalValidator, { validationMiddleware } from './advancedValidator.js';
import { AdvancedCache } from './advancedCache.js';
import { FileLockManager } from './fileLockManager.js';
import { ComprehensiveLogger } from './comprehensiveLogger.js';
import { AutoBackupManager } from './autoBackupManager.js';

// Initialize system components
const logger = new ComprehensiveLogger();
const cache = new AdvancedCache();
const fileLock = new FileLockManager();
const backupManager = new AutoBackupManager();

/**
 * Enterprise Integration Manager Class
 */
class EnterpriseIntegration {
  constructor() {
    this.initialized = false;
    this.systemStats = {
      requestsProcessed: 0,
      authAttempts: 0,
      validationChecks: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fileOperations: 0,
      backupOperations: 0,
      errors: 0
    };
    
    this.middlewareChain = [];
    this.initializeMiddlewareChain();
  }

  /**
   * Initialize the complete middleware chain
   */
  initializeMiddlewareChain() {
    // 1. Security Headers (Helmet)
    this.middlewareChain.push({
      name: 'Security Headers',
      middleware: helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      })
    });

    // 2. Rate Limiting
    this.middlewareChain.push({
      name: 'Rate Limiting',
      middleware: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: {
          success: false,
          message: 'Too many requests, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          this.systemStats.errors++;
          logger.log('warn', 'Rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.url
          });
          
          res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            retryAfter: Math.round(15 * 60) // seconds
          });
        }
      })
    });

    // 3. Request Logging
    this.middlewareChain.push({
      name: 'Request Logging',
      middleware: (req, res, next) => {
        this.systemStats.requestsProcessed++;
        logger.logRequest(req);
        
        // Track response time
        const startTime = Date.now();
        
        res.on('finish', () => {
          const responseTime = Date.now() - startTime;
          logger.logPerformance('request_processing', responseTime, {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            success: res.statusCode < 400
          });
        });
        
        next();
      }
    });

    this.initialized = true;
    logger.log('info', 'Enterprise middleware chain initialized', {
      middlewareCount: this.middlewareChain.length
    });
  }

  /**
   * Authentication middleware with full integration
   */
  createAuthMiddleware(options = {}) {
    const { 
      required = true, 
      roles = [], 
      skipRoutes = ['/api/auth/login', '/api/auth/register'] 
    } = options;

    return async (req, res, next) => {
      try {
        // Skip authentication for certain routes
        if (skipRoutes.includes(req.path)) {
          return next();
        }

        this.systemStats.authAttempts++;
        
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token && required) {
          logger.log('warn', 'Authentication failed - No token provided', {
            ip: req.ip,
            method: req.method,
            url: req.url
          });
          
          return res.status(401).json({
            success: false,
            message: 'Access token required'
          });
        }

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.user = decoded;

            // Role-based access control
            if (roles.length > 0 && !roles.includes(decoded.role)) {
              logger.log('warn', 'Authorization failed - Insufficient permissions', {
                userId: decoded.userId,
                userRole: decoded.role,
                requiredRoles: roles,
                method: req.method,
                url: req.url
              });
              
              return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
              });
            }

            logger.log('debug', 'Authentication successful', {
              userId: decoded.userId,
              role: decoded.role,
              method: req.method,
              url: req.url
            });

          } catch (jwtError) {
            logger.log('warn', 'Authentication failed - Invalid token', {
              ip: req.ip,
              method: req.method,
              url: req.url,
              error: jwtError.message
            });
            
            return res.status(401).json({
              success: false,
              message: 'Invalid or expired token'
            });
          }
        }

        next();
      } catch (error) {
        this.systemStats.errors++;
        logger.log('error', 'Authentication middleware error', {
          error: error.message,
          stack: error.stack,
          method: req.method,
          url: req.url
        });

        res.status(500).json({
          success: false,
          message: 'Authentication system error'
        });
      }
    };
  }

  /**
   * Validation middleware with caching integration
   */
  createValidationMiddleware(schema, options = {}) {
    return async (req, res, next) => {
      try {
        this.systemStats.validationChecks++;
        
        // Create cache key for validation result
        const cacheKey = `validation:${req.method}:${req.path}:${JSON.stringify(req.body)}`;
        
        // Check cache first
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult && cachedResult.valid) {
          this.systemStats.cacheHits++;
          req.body = cachedResult.sanitizedData;
          logger.log('debug', 'Validation cache hit', { cacheKey });
          return next();
        }
        
        this.systemStats.cacheMisses++;

        // Perform validation
        const result = await globalValidator.validate(req.body, schema);
        
        if (!result.valid) {
          logger.log('warn', 'Validation failed', {
            errors: result.errors,
            method: req.method,
            url: req.url,
            userId: req.user?.userId
          });
          
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.errors
          });
        }

        // Cache successful validation result
        await cache.set(cacheKey, result, 300); // Cache for 5 minutes
        
        // Use sanitized data
        req.body = result.sanitizedData;
        
        logger.log('debug', 'Validation successful', {
          method: req.method,
          url: req.url,
          userId: req.user?.userId
        });
        
        next();
      } catch (error) {
        this.systemStats.errors++;
        logger.log('error', 'Validation middleware error', {
          error: error.message,
          method: req.method,
          url: req.url
        });

        res.status(500).json({
          success: false,
          message: 'Validation system error'
        });
      }
    };
  }

  /**
   * File operation middleware with locking and backup
   */
  createFileOperationMiddleware(filePath, operation = 'read') {
    return async (req, res, next) => {
      let lockId = null;
      
      try {
        this.systemStats.fileOperations++;
        
        // Acquire file lock for write operations
        if (operation === 'write' || operation === 'update' || operation === 'delete') {
          lockId = await fileLock.acquireLock(filePath, {
            timeout: 10000,
            retryDelay: 100
          });
          
          logger.log('debug', 'File lock acquired', {
            filePath,
            lockId,
            operation,
            userId: req.user?.userId
          });
        }

        // Add file operation context to request
        req.fileOperation = {
          filePath,
          operation,
          lockId,
          startTime: Date.now()
        };

        // Continue to next middleware
        next();

      } catch (error) {
        this.systemStats.errors++;
        
        if (lockId) {
          await fileLock.releaseLock(lockId);
        }
        
        logger.log('error', 'File operation middleware error', {
          error: error.message,
          filePath,
          operation,
          userId: req.user?.userId
        });

        res.status(500).json({
          success: false,
          message: 'File operation error'
        });
      }
    };
  }

  /**
   * Response finalization middleware
   */
  createFinalizationMiddleware() {
    return async (req, res, next) => {
      // Store original res.json method
      const originalJson = res.json.bind(res);
      
      res.json = async (data) => {
        try {
          // Release file locks
          if (req.fileOperation?.lockId) {
            await fileLock.releaseLock(req.fileOperation.lockId);
            
            const operationTime = Date.now() - req.fileOperation.startTime;
            logger.logPerformance('file_operation', operationTime, {
              filePath: req.fileOperation.filePath,
              operation: req.fileOperation.operation,
              success: res.statusCode < 400
            });
          }

          // Trigger backup for write operations
          if (req.fileOperation?.operation === 'write' && res.statusCode < 400) {
            this.systemStats.backupOperations++;
            
            // Async backup - don't wait for completion
            backupManager.createBackup('manual', `API operation: ${req.method} ${req.path}`)
              .catch(error => {
                logger.log('error', 'Backup operation failed', {
                  error: error.message,
                  filePath: req.fileOperation.filePath
                });
              });
          }

          // Add system statistics to response (for admin requests)
          if (req.user?.role === 'admin' && req.query.includeStats === 'true') {
            data.systemStats = this.getSystemStats();
          }

          // Log successful operations
          if (res.statusCode < 400) {
            logger.log('info', 'Request completed successfully', {
              method: req.method,
              url: req.url,
              statusCode: res.statusCode,
              userId: req.user?.userId,
              fileOperation: req.fileOperation?.operation
            });
          }

        } catch (error) {
          logger.log('error', 'Finalization middleware error', {
            error: error.message,
            method: req.method,
            url: req.url
          });
        }

        // Send response
        return originalJson(data);
      };

      next();
    };
  }

  /**
   * Create complete middleware stack for API endpoint
   */
  createApiMiddleware(config = {}) {
    const {
      auth = { required: true },
      validation = null,
      fileOperation = null,
      cache = true
    } = config;

    const middlewares = [];

    // Add base middleware chain
    middlewares.push(...this.middlewareChain.map(m => m.middleware));

    // Add authentication
    middlewares.push(this.createAuthMiddleware(auth));

    // Add validation if specified
    if (validation) {
      middlewares.push(this.createValidationMiddleware(validation.schema, validation.options));
    }

    // Add file operation middleware
    if (fileOperation) {
      middlewares.push(this.createFileOperationMiddleware(fileOperation.filePath, fileOperation.operation));
    }

    // Add finalization middleware
    middlewares.push(this.createFinalizationMiddleware());

    return middlewares;
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    return {
      ...this.systemStats,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      cacheStats: cache.getStats(),
      lockStats: fileLock.getStats(),
      loggerStats: logger.getStats(),
      backupStats: backupManager.getStats()
    };
  }

  /**
   * Reset system statistics
   */
  resetStats() {
    this.systemStats = {
      requestsProcessed: 0,
      authAttempts: 0,
      validationChecks: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fileOperations: 0,
      backupOperations: 0,
      errors: 0
    };

    logger.log('info', 'Enterprise system statistics reset');
  }

  /**
   * Health check for all systems
   */
  async performHealthCheck() {
    const healthChecks = {
      middleware: this.initialized,
      authentication: true, // JWT is stateless
      validation: globalValidator !== null,
      cache: await cache.healthCheck(),
      fileLocking: fileLock.isHealthy(),
      logging: logger.isHealthy(),
      backup: await backupManager.isHealthy()
    };

    const overallHealth = Object.values(healthChecks).every(Boolean);

    const healthReport = {
      status: overallHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      systems: healthChecks,
      statistics: this.getSystemStats()
    };

    logger.log('info', 'Enterprise system health check completed', {
      status: healthReport.status,
      healthySystems: Object.values(healthChecks).filter(Boolean).length,
      totalSystems: Object.keys(healthChecks).length
    });

    return healthReport;
  }
}

// Create global integration manager instance
const enterpriseIntegration = new EnterpriseIntegration();

// Export both class and instance
export { EnterpriseIntegration };
export default enterpriseIntegration;