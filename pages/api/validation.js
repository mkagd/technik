/**
 * Advanced Data Validation API Endpoint
 * 
 * Provides comprehensive validation management:
 * - Schema validation testing
 * - Custom rule management
 * - Validation statistics
 * - System health checks
 * - Bulk data validation
 */

import globalValidator, { AdvancedValidator, CommonSchemas } from '../../utils/advancedValidator.js';
import { ComprehensiveLogger } from '../../utils/comprehensiveLogger.js';

const logger = new ComprehensiveLogger();

export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    const { method, query, body } = req;
    const { action } = query;

    logger.logRequest(req);

    switch (method) {
      case 'GET':
        await handleGetRequest(req, res, action);
        break;

      case 'POST':
        await handlePostRequest(req, res, action, body);
        break;

      case 'PUT':
        await handlePutRequest(req, res, action, body);
        break;

      case 'DELETE':
        await handleDeleteRequest(req, res, action);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }

  } catch (error) {
    logger.log('error', 'Validation API error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      action: req.query.action
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    const responseTime = Date.now() - startTime;
    logger.logPerformance('validation_api', responseTime, {
      method: req.method,
      action: req.query.action,
      success: res.statusCode < 400
    });
  }
}

/**
 * Handle GET requests
 */
async function handleGetRequest(req, res, action) {
  switch (action) {
    case 'stats':
      await getValidationStats(req, res);
      break;

    case 'schemas':
      await getAvailableSchemas(req, res);
      break;

    case 'rules':
      await getValidationRules(req, res);
      break;

    case 'health':
      await getValidationHealth(req, res);
      break;

    case 'test':
      await testValidationPerformance(req, res);
      break;

    default:
      res.status(400).json({
        success: false,
        message: 'Invalid action. Available actions: stats, schemas, rules, health, test'
      });
  }
}

/**
 * Handle POST requests
 */
async function handlePostRequest(req, res, action, body) {
  switch (action) {
    case 'validate':
      await validateData(req, res, body);
      break;

    case 'bulk-validate':
      await bulkValidateData(req, res, body);
      break;

    case 'custom-rule':
      await addCustomRule(req, res, body);
      break;

    case 'test-schema':
      await testSchema(req, res, body);
      break;

    default:
      res.status(400).json({
        success: false,
        message: 'Invalid action. Available actions: validate, bulk-validate, custom-rule, test-schema'
      });
  }
}

/**
 * Handle PUT requests
 */
async function handlePutRequest(req, res, action, body) {
  switch (action) {
    case 'reset-stats':
      await resetValidationStats(req, res);
      break;

    default:
      res.status(400).json({
        success: false,
        message: 'Invalid action. Available actions: reset-stats'
      });
  }
}

/**
 * Handle DELETE requests
 */
async function handleDeleteRequest(req, res, action) {
  const { ruleName } = req.query;

  switch (action) {
    case 'custom-rule':
      await removeCustomRule(req, res, ruleName);
      break;

    default:
      res.status(400).json({
        success: false,
        message: 'Invalid action. Available actions: custom-rule'
      });
  }
}

/**
 * Get validation statistics
 */
async function getValidationStats(req, res) {
  try {
    const stats = globalValidator.getStats();
    
    res.json({
      success: true,
      data: {
        statistics: stats,
        timestamp: new Date().toISOString()
      }
    });

    logger.log('info', 'Validation statistics retrieved', { stats });

  } catch (error) {
    throw new Error(`Failed to get validation stats: ${error.message}`);
  }
}

/**
 * Get available schemas
 */
async function getAvailableSchemas(req, res) {
  try {
    const schemas = {};
    
    // Add all common schemas with their field descriptions
    for (const [schemaName, schema] of Object.entries(CommonSchemas)) {
      schemas[schemaName] = {
        fields: Object.keys(schema),
        description: getSchemaDescription(schemaName),
        schema: schema
      };
    }

    res.json({
      success: true,
      data: {
        totalSchemas: Object.keys(schemas).length,
        schemas,
        timestamp: new Date().toISOString()
      }
    });

    logger.log('debug', 'Available schemas retrieved', { 
      schemaCount: Object.keys(schemas).length 
    });

  } catch (error) {
    throw new Error(`Failed to get schemas: ${error.message}`);
  }
}

/**
 * Get validation rules
 */
async function getValidationRules(req, res) {
  try {
    const rules = globalValidator.getAvailableRules();
    
    res.json({
      success: true,
      data: {
        totalRules: rules.builtin.length + rules.custom.length,
        builtinRules: rules.builtin,
        customRules: rules.custom,
        timestamp: new Date().toISOString()
      }
    });

    logger.log('debug', 'Validation rules retrieved', { 
      builtinCount: rules.builtin.length,
      customCount: rules.custom.length
    });

  } catch (error) {
    throw new Error(`Failed to get validation rules: ${error.message}`);
  }
}

/**
 * Get validation system health
 */
async function getValidationHealth(req, res) {
  try {
    const stats = globalValidator.getStats();
    const rules = globalValidator.getAvailableRules();
    
    // Perform health checks
    const healthChecks = {
      validatorInstance: globalValidator !== null,
      rulesLoaded: rules.builtin.length > 0,
      schemasAvailable: Object.keys(CommonSchemas).length > 0,
      statisticsTracking: stats.totalValidations !== undefined,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    const isHealthy = Object.values(healthChecks).every(check => 
      typeof check === 'boolean' ? check : true
    );

    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        checks: healthChecks,
        statistics: stats,
        timestamp: new Date().toISOString()
      }
    });

    logger.log('info', 'Validation system health check', { 
      status: isHealthy ? 'healthy' : 'degraded',
      totalValidations: stats.totalValidations
    });

  } catch (error) {
    throw new Error(`Failed to get validation health: ${error.message}`);
  }
}

/**
 * Test validation performance
 */
async function testValidationPerformance(req, res) {
  try {
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '123456789',
      address: 'Test Address 123',
      postalCode: '12-345'
    };

    const iterations = 1000;
    const startTime = Date.now();

    // Run performance test
    const results = [];
    for (let i = 0; i < iterations; i++) {
      const result = await globalValidator.validate(testData, CommonSchemas.client);
      results.push(result.valid);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    const successCount = results.filter(Boolean).length;

    res.json({
      success: true,
      data: {
        testResults: {
          iterations,
          totalTime: `${totalTime}ms`,
          averageTime: `${averageTime.toFixed(2)}ms`,
          successRate: `${(successCount / iterations * 100).toFixed(2)}%`,
          validationsPerSecond: Math.round(iterations / (totalTime / 1000))
        },
        systemStats: globalValidator.getStats(),
        timestamp: new Date().toISOString()
      }
    });

    logger.log('info', 'Validation performance test completed', {
      iterations,
      totalTime,
      averageTime,
      successRate: successCount / iterations * 100
    });

  } catch (error) {
    throw new Error(`Failed to run performance test: ${error.message}`);
  }
}

/**
 * Validate data against schema
 */
async function validateData(req, res, body) {
  try {
    const { data, schema, schemaName } = body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data is required for validation'
      });
    }

    let validationSchema;
    
    if (schemaName && CommonSchemas[schemaName]) {
      validationSchema = CommonSchemas[schemaName];
    } else if (schema) {
      validationSchema = schema;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either schemaName or schema is required'
      });
    }

    const result = await globalValidator.validate(data, validationSchema);

    res.json({
      success: true,
      data: {
        validationResult: result,
        schemaUsed: schemaName || 'custom',
        timestamp: new Date().toISOString()
      }
    });

    logger.log('debug', 'Data validation performed', {
      schemaUsed: schemaName || 'custom',
      valid: result.valid,
      errorCount: result.errors.length
    });

  } catch (error) {
    throw new Error(`Failed to validate data: ${error.message}`);
  }
}

/**
 * Bulk validate multiple data items
 */
async function bulkValidateData(req, res, body) {
  try {
    const { dataItems, schema, schemaName } = body;

    if (!Array.isArray(dataItems)) {
      return res.status(400).json({
        success: false,
        message: 'dataItems must be an array'
      });
    }

    let validationSchema;
    
    if (schemaName && CommonSchemas[schemaName]) {
      validationSchema = CommonSchemas[schemaName];
    } else if (schema) {
      validationSchema = schema;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either schemaName or schema is required'
      });
    }

    const results = [];
    let validCount = 0;

    for (let i = 0; i < dataItems.length; i++) {
      const result = await globalValidator.validate(dataItems[i], validationSchema);
      results.push({
        index: i,
        valid: result.valid,
        errors: result.errors,
        sanitizedData: result.sanitizedData
      });

      if (result.valid) validCount++;
    }

    res.json({
      success: true,
      data: {
        totalItems: dataItems.length,
        validItems: validCount,
        invalidItems: dataItems.length - validCount,
        successRate: `${(validCount / dataItems.length * 100).toFixed(2)}%`,
        results,
        schemaUsed: schemaName || 'custom',
        timestamp: new Date().toISOString()
      }
    });

    logger.log('info', 'Bulk validation completed', {
      totalItems: dataItems.length,
      validItems: validCount,
      schemaUsed: schemaName || 'custom'
    });

  } catch (error) {
    throw new Error(`Failed to bulk validate data: ${error.message}`);
  }
}

/**
 * Add custom validation rule
 */
async function addCustomRule(req, res, body) {
  try {
    const { name, rule } = body;

    if (!name || !rule) {
      return res.status(400).json({
        success: false,
        message: 'Name and rule are required'
      });
    }

    if (!rule.validate || typeof rule.validate !== 'function') {
      return res.status(400).json({
        success: false,
        message: 'Rule must have a validate function'
      });
    }

    globalValidator.addCustomRule(name, rule);

    res.json({
      success: true,
      data: {
        message: `Custom rule '${name}' added successfully`,
        ruleName: name,
        availableRules: globalValidator.getAvailableRules(),
        timestamp: new Date().toISOString()
      }
    });

    logger.log('info', 'Custom validation rule added', { ruleName: name });

  } catch (error) {
    throw new Error(`Failed to add custom rule: ${error.message}`);
  }
}

/**
 * Test schema validation
 */
async function testSchema(req, res, body) {
  try {
    const { schema, testData } = body;

    if (!schema || !testData) {
      return res.status(400).json({
        success: false,
        message: 'Schema and testData are required'
      });
    }

    const results = [];
    
    // Test with provided data
    if (Array.isArray(testData)) {
      for (let i = 0; i < testData.length; i++) {
        const result = await globalValidator.validate(testData[i], schema);
        results.push({
          testCase: i + 1,
          data: testData[i],
          result
        });
      }
    } else {
      const result = await globalValidator.validate(testData, schema);
      results.push({
        testCase: 1,
        data: testData,
        result
      });
    }

    const validCount = results.filter(r => r.result.valid).length;

    res.json({
      success: true,
      data: {
        schemaTest: {
          totalTests: results.length,
          passedTests: validCount,
          failedTests: results.length - validCount,
          successRate: `${(validCount / results.length * 100).toFixed(2)}%`
        },
        results,
        timestamp: new Date().toISOString()
      }
    });

    logger.log('info', 'Schema testing completed', {
      totalTests: results.length,
      passedTests: validCount
    });

  } catch (error) {
    throw new Error(`Failed to test schema: ${error.message}`);
  }
}

/**
 * Reset validation statistics
 */
async function resetValidationStats(req, res) {
  try {
    globalValidator.resetStats();

    res.json({
      success: true,
      data: {
        message: 'Validation statistics reset successfully',
        newStats: globalValidator.getStats(),
        timestamp: new Date().toISOString()
      }
    });

    logger.log('info', 'Validation statistics reset');

  } catch (error) {
    throw new Error(`Failed to reset validation stats: ${error.message}`);
  }
}

/**
 * Remove custom validation rule
 */
async function removeCustomRule(req, res, ruleName) {
  try {
    if (!ruleName) {
      return res.status(400).json({
        success: false,
        message: 'Rule name is required'
      });
    }

    // Note: This would require adding a removeCustomRule method to AdvancedValidator
    // For now, we'll return an informational message
    res.json({
      success: false,
      message: 'Custom rule removal not yet implemented',
      data: {
        ruleName,
        availableRules: globalValidator.getAvailableRules(),
        timestamp: new Date().toISOString()
      }
    });

    logger.log('warn', 'Custom rule removal attempted', { ruleName });

  } catch (error) {
    throw new Error(`Failed to remove custom rule: ${error.message}`);
  }
}

/**
 * Get schema description
 */
function getSchemaDescription(schemaName) {
  const descriptions = {
    client: 'Client information validation with name, email, phone, and address',
    serviceOrder: 'Service order validation with type, description, priority, and status',
    employee: 'Employee information validation with specializations and status',
    userAuth: 'User authentication validation with username, password, and role',
    booking: 'Booking request validation with client, service type, and scheduling'
  };

  return descriptions[schemaName] || 'Custom validation schema';
}