/**
 * Advanced Data Validation System
 * 
 * Comprehensive input validation with schema validation, sanitization,
 * and type safety for all API endpoints and data operations.
 * 
 * Features:
 * - Schema-based validation with built-in rules
 * - Data sanitization and XSS protection
 * - Type coercion and normalization
 * - Custom validation rules
 * - Async validation support
 * - Detailed error reporting
 * - Performance monitoring
 */

import { ComprehensiveLogger } from './comprehensiveLogger.js';

// Initialize logger for validation system
const logger = new ComprehensiveLogger();

/**
 * Built-in validation rules
 */
const ValidationRules = {
  // String validation
  string: {
    validate: (value) => typeof value === 'string',
    sanitize: (value) => String(value).trim(),
    message: 'Field must be a string'
  },

  // Email validation
  email: {
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    sanitize: (value) => String(value).toLowerCase().trim(),
    message: 'Field must be a valid email address'
  },

  // Phone validation (Polish format)
  phone: {
    validate: (value) => {
      const phoneRegex = /^(\+48|48)?[1-9]\d{8}$/;
      return phoneRegex.test(value.replace(/[\s-]/g, ''));
    },
    sanitize: (value) => value.replace(/[\s-]/g, '').replace(/^(\+48|48)/, ''),
    message: 'Field must be a valid Polish phone number'
  },

  // Number validation
  number: {
    validate: (value) => !isNaN(Number(value)),
    sanitize: (value) => Number(value),
    message: 'Field must be a number'
  },

  // Integer validation
  integer: {
    validate: (value) => Number.isInteger(Number(value)),
    sanitize: (value) => parseInt(value, 10),
    message: 'Field must be an integer'
  },

  // Boolean validation
  boolean: {
    validate: (value) => typeof value === 'boolean' || ['true', 'false', '1', '0'].includes(String(value).toLowerCase()),
    sanitize: (value) => {
      if (typeof value === 'boolean') return value;
      return ['true', '1'].includes(String(value).toLowerCase());
    },
    message: 'Field must be a boolean value'
  },

  // Date validation
  date: {
    validate: (value) => !isNaN(Date.parse(value)),
    sanitize: (value) => new Date(value).toISOString(),
    message: 'Field must be a valid date'
  },

  // URL validation
  url: {
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    sanitize: (value) => String(value).trim(),
    message: 'Field must be a valid URL'
  },

  // Postal code validation (Polish format)
  postalCode: {
    validate: (value) => /^\d{2}-\d{3}$/.test(value),
    sanitize: (value) => {
      const clean = value.replace(/[^\d]/g, '');
      return clean.length === 5 ? `${clean.slice(0, 2)}-${clean.slice(2)}` : value;
    },
    message: 'Field must be a valid postal code (XX-XXX format)'
  },

  // UUID validation
  uuid: {
    validate: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    sanitize: (value) => String(value).toLowerCase(),
    message: 'Field must be a valid UUID'
  },

  // Array validation
  array: {
    validate: (value) => Array.isArray(value),
    sanitize: (value) => Array.isArray(value) ? value : [value],
    message: 'Field must be an array'
  },

  // Object validation
  object: {
    validate: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
    sanitize: (value) => value,
    message: 'Field must be an object'
  }
};

/**
 * Advanced Data Validator Class
 */
class AdvancedValidator {
  constructor() {
    this.customRules = new Map();
    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
      totalValidationTime: 0
    };
  }

  /**
   * Add custom validation rule
   */
  addCustomRule(name, rule) {
    if (!rule.validate || typeof rule.validate !== 'function') {
      throw new Error('Custom rule must have a validate function');
    }

    this.customRules.set(name, {
      validate: rule.validate,
      sanitize: rule.sanitize || ((value) => value),
      message: rule.message || `Field failed custom validation: ${name}`
    });

    logger.log('info', 'Custom validation rule added', { ruleName: name });
  }

  /**
   * Get all available rules
   */
  getAvailableRules() {
    return {
      builtin: Object.keys(ValidationRules),
      custom: Array.from(this.customRules.keys())
    };
  }

  /**
   * Validate single field
   */
  async validateField(value, fieldSchema, fieldName = 'field') {
    const startTime = Date.now();

    try {
      // Check if field is required
      if (fieldSchema.required && (value === undefined || value === null || value === '')) {
        return {
          valid: false,
          errors: [`${fieldName} is required`],
          sanitizedValue: value
        };
      }

      // Skip validation if field is optional and empty
      if (!fieldSchema.required && (value === undefined || value === null || value === '')) {
        return {
          valid: true,
          errors: [],
          sanitizedValue: value
        };
      }

      let sanitizedValue = value;
      const errors = [];

      // Apply type validation and sanitization
      if (fieldSchema.type) {
        const rule = ValidationRules[fieldSchema.type] || this.customRules.get(fieldSchema.type);
        
        if (!rule) {
          errors.push(`Unknown validation type: ${fieldSchema.type}`);
        } else {
          // Sanitize first
          try {
            sanitizedValue = rule.sanitize(value);
          } catch (error) {
            errors.push(`Sanitization failed for ${fieldName}: ${error.message}`);
          }

          // Then validate
          if (!rule.validate(sanitizedValue)) {
            errors.push(rule.message.replace('Field', fieldName));
          }
        }
      }

      // Apply length constraints
      if (fieldSchema.minLength !== undefined && String(sanitizedValue).length < fieldSchema.minLength) {
        errors.push(`${fieldName} must be at least ${fieldSchema.minLength} characters long`);
      }

      if (fieldSchema.maxLength !== undefined && String(sanitizedValue).length > fieldSchema.maxLength) {
        errors.push(`${fieldName} must be no more than ${fieldSchema.maxLength} characters long`);
      }

      // Apply numeric constraints
      if (fieldSchema.min !== undefined && Number(sanitizedValue) < fieldSchema.min) {
        errors.push(`${fieldName} must be at least ${fieldSchema.min}`);
      }

      if (fieldSchema.max !== undefined && Number(sanitizedValue) > fieldSchema.max) {
        errors.push(`${fieldName} must be no more than ${fieldSchema.max}`);
      }

      // Apply pattern validation
      if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(sanitizedValue)) {
        errors.push(`${fieldName} does not match required pattern`);
      }

      // Apply enum validation
      if (fieldSchema.enum && !fieldSchema.enum.includes(sanitizedValue)) {
        errors.push(`${fieldName} must be one of: ${fieldSchema.enum.join(', ')}`);
      }

      // Apply custom validator function
      if (fieldSchema.validator && typeof fieldSchema.validator === 'function') {
        const customResult = await fieldSchema.validator(sanitizedValue, fieldName);
        if (customResult !== true && typeof customResult === 'string') {
          errors.push(customResult);
        } else if (customResult === false) {
          errors.push(`${fieldName} failed custom validation`);
        }
      }

      const validationTime = Date.now() - startTime;
      this.updateStats(errors.length === 0, validationTime);

      return {
        valid: errors.length === 0,
        errors,
        sanitizedValue
      };

    } catch (error) {
      const validationTime = Date.now() - startTime;
      this.updateStats(false, validationTime);

      logger.log('error', 'Field validation error', {
        fieldName,
        error: error.message,
        value: typeof value === 'object' ? JSON.stringify(value) : value
      });

      return {
        valid: false,
        errors: [`Validation error for ${fieldName}: ${error.message}`],
        sanitizedValue: value
      };
    }
  }

  /**
   * Validate object against schema
   */
  async validate(data, schema) {
    const startTime = Date.now();

    try {
      if (!data || typeof data !== 'object') {
        return {
          valid: false,
          errors: ['Data must be an object'],
          sanitizedData: data
        };
      }

      const sanitizedData = {};
      const allErrors = [];

      // Validate each field in schema
      for (const [fieldName, fieldSchema] of Object.entries(schema)) {
        const fieldResult = await this.validateField(data[fieldName], fieldSchema, fieldName);
        
        if (!fieldResult.valid) {
          allErrors.push(...fieldResult.errors);
        }

        // Only include field in sanitized data if it's valid or has a value
        if (fieldResult.valid || fieldResult.sanitizedValue !== undefined) {
          sanitizedData[fieldName] = fieldResult.sanitizedValue;
        }
      }

      // Check for unknown fields if strict mode is enabled
      if (schema._strict !== false) {
        const unknownFields = Object.keys(data).filter(key => !schema.hasOwnProperty(key) && key !== '_strict');
        if (unknownFields.length > 0) {
          allErrors.push(`Unknown fields: ${unknownFields.join(', ')}`);
        }
      }

      const totalTime = Date.now() - startTime;
      
      logger.log('debug', 'Schema validation completed', {
        valid: allErrors.length === 0,
        errorCount: allErrors.length,
        fieldCount: Object.keys(schema).length,
        validationTime: totalTime
      });

      return {
        valid: allErrors.length === 0,
        errors: allErrors,
        sanitizedData
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.updateStats(false, totalTime);

      logger.log('error', 'Schema validation error', {
        error: error.message,
        schema: Object.keys(schema),
        data: typeof data === 'object' ? Object.keys(data) : typeof data
      });

      return {
        valid: false,
        errors: [`Schema validation error: ${error.message}`],
        sanitizedData: data
      };
    }
  }

  /**
   * Sanitize HTML and prevent XSS
   */
  sanitizeHtml(html) {
    if (typeof html !== 'string') return html;

    // Basic XSS prevention - remove script tags and javascript: URLs
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  }

  /**
   * Deep sanitize object
   */
  deepSanitize(obj) {
    if (typeof obj === 'string') {
      return this.sanitizeHtml(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.deepSanitize(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Update validation statistics
   */
  updateStats(success, validationTime) {
    this.validationStats.totalValidations++;
    this.validationStats.totalValidationTime += validationTime;
    
    if (success) {
      this.validationStats.successfulValidations++;
    } else {
      this.validationStats.failedValidations++;
    }

    this.validationStats.averageValidationTime = 
      this.validationStats.totalValidationTime / this.validationStats.totalValidations;
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return {
      ...this.validationStats,
      successRate: this.validationStats.totalValidations > 0 
        ? (this.validationStats.successfulValidations / this.validationStats.totalValidations * 100).toFixed(2)
        : 0,
      availableRules: this.getAvailableRules()
    };
  }

  /**
   * Reset validation statistics
   */
  resetStats() {
    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
      totalValidationTime: 0
    };

    logger.log('info', 'Validation statistics reset');
  }
}

/**
 * Pre-defined schemas for common data types
 */
export const CommonSchemas = {
  // Client data schema
  client: {
    id: { type: 'string', required: false },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    email: { type: 'email', required: true },
    phone: { type: 'phone', required: true },
    address: { type: 'string', required: true, minLength: 5, maxLength: 200 },
    postalCode: { type: 'postalCode', required: false },
    city: { type: 'string', required: false, minLength: 2, maxLength: 50 }
  },

  // Service order schema
  serviceOrder: {
    id: { type: 'string', required: false },
    clientId: { type: 'string', required: true },
    type: { type: 'string', required: true, enum: ['naprawa', 'usterka', 'konserwacja'] },
    description: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
    priority: { type: 'string', required: false, enum: ['low', 'medium', 'high', 'urgent'] },
    status: { type: 'string', required: false, enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'] },
    scheduledDate: { type: 'date', required: false },
    completedDate: { type: 'date', required: false },
    employeeId: { type: 'string', required: false },
    cost: { type: 'number', required: false, min: 0 },
    notes: { type: 'string', required: false, maxLength: 2000 }
  },

  // Employee schema
  employee: {
    id: { type: 'string', required: false },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    email: { type: 'email', required: true },
    phone: { type: 'phone', required: true },
    specialization: { type: 'array', required: false },
    isActive: { type: 'boolean', required: false },
    hireDate: { type: 'date', required: false }
  },

  // User authentication schema
  userAuth: {
    username: { type: 'string', required: true, minLength: 3, maxLength: 50 },
    password: { type: 'string', required: true, minLength: 6, maxLength: 128 },
    email: { type: 'email', required: false },
    role: { type: 'string', required: false, enum: ['admin', 'employee', 'client'] }
  },

  // Booking schema
  booking: {
    clientId: { type: 'string', required: true },
    serviceType: { type: 'string', required: true },
    preferredDate: { type: 'date', required: true },
    preferredTime: { type: 'string', required: false, pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
    description: { type: 'string', required: true, minLength: 10, maxLength: 500 },
    urgency: { type: 'string', required: false, enum: ['low', 'medium', 'high'] }
  }
};

/**
 * Express middleware for request validation
 */
export function validationMiddleware(schema, options = {}) {
  const validator = new AdvancedValidator();
  const { 
    validateBody = true, 
    validateQuery = false, 
    validateParams = false,
    sanitize = true 
  } = options;

  return async (req, res, next) => {
    try {
      const validationResults = {};

      // Validate request body
      if (validateBody && req.body && schema.body) {
        const result = await validator.validate(req.body, schema.body);
        validationResults.body = result;
        
        if (result.valid && sanitize) {
          req.body = result.sanitizedData;
        }
      }

      // Validate query parameters
      if (validateQuery && req.query && schema.query) {
        const result = await validator.validate(req.query, schema.query);
        validationResults.query = result;
        
        if (result.valid && sanitize) {
          req.query = result.sanitizedData;
        }
      }

      // Validate URL parameters
      if (validateParams && req.params && schema.params) {
        const result = await validator.validate(req.params, schema.params);
        validationResults.params = result;
        
        if (result.valid && sanitize) {
          req.params = result.sanitizedData;
        }
      }

      // Check if any validation failed
      const hasErrors = Object.values(validationResults).some(result => !result.valid);
      
      if (hasErrors) {
        const allErrors = Object.values(validationResults)
          .filter(result => !result.valid)
          .flatMap(result => result.errors);

        logger.log('warn', 'Request validation failed', {
          method: req.method,
          url: req.url,
          errors: allErrors,
          ip: req.ip
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: allErrors
        });
      }

      // Store validation results for debugging
      req.validationResults = validationResults;
      next();

    } catch (error) {
      logger.log('error', 'Validation middleware error', {
        error: error.message,
        method: req.method,
        url: req.url
      });

      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };
}

// Create global validator instance
const globalValidator = new AdvancedValidator();

// Export both class and instance
export { AdvancedValidator };
export default globalValidator;