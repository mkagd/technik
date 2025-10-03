/**
 * Example API Endpoint with Full Enterprise Integration
 * 
 * This demonstrates how to use the enterprise integration system
 * with all middleware components working together.
 */

import enterpriseIntegration from '../../utils/enterpriseIntegration.js';
import { CommonSchemas } from '../../utils/advancedValidator.js';
import { readFileWithLock, writeFileWithLock } from '../../utils/fileLockManager.js';

// API endpoint with full enterprise integration
export default async function handler(req, res) {
  // This endpoint demonstrates the complete integration
  // The middleware chain will handle:
  // 1. Security headers
  // 2. Rate limiting
  // 3. Request logging
  // 4. Authentication
  // 5. Data validation
  // 6. File locking
  // 7. Response finalization

  try {
    const { method } = req;

    switch (method) {
      case 'GET':
        await handleGetClients(req, res);
        break;

      case 'POST':
        await handleCreateClient(req, res);
        break;

      case 'PUT':
        await handleUpdateClient(req, res);
        break;

      case 'DELETE':
        await handleDeleteClient(req, res);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get all clients (with caching)
 */
async function handleGetClients(req, res) {
  try {
    const clients = await readFileWithLock('./data/clients.json');
    
    res.json({
      success: true,
      data: {
        clients: JSON.parse(clients || '[]'),
        total: JSON.parse(clients || '[]').length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new Error(`Failed to get clients: ${error.message}`);
  }
}

/**
 * Create new client (with validation and backup)
 */
async function handleCreateClient(req, res) {
  try {
    const clientData = req.body; // Already validated by middleware
    
    // Read current clients
    const existingClients = JSON.parse(await readFileWithLock('./data/clients.json') || '[]');
    
    // Add new client
    const newClient = {
      id: `client_${Date.now()}`,
      ...clientData,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.userId || 'system'
    };
    
    existingClients.push(newClient);
    
    // Write updated clients
    await writeFileWithLock('./data/clients.json', JSON.stringify(existingClients, null, 2));
    
    res.status(201).json({
      success: true,
      data: {
        client: newClient,
        message: 'Client created successfully',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new Error(`Failed to create client: ${error.message}`);
  }
}

/**
 * Update existing client
 */
async function handleUpdateClient(req, res) {
  try {
    const { id } = req.query;
    const updateData = req.body; // Already validated by middleware
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }
    
    // Read current clients
    const existingClients = JSON.parse(await readFileWithLock('./data/clients.json') || '[]');
    
    // Find and update client
    const clientIndex = existingClients.findIndex(client => client.id === id);
    
    if (clientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    existingClients[clientIndex] = {
      ...existingClients[clientIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.userId || 'system'
    };
    
    // Write updated clients
    await writeFileWithLock('./data/clients.json', JSON.stringify(existingClients, null, 2));
    
    res.json({
      success: true,
      data: {
        client: existingClients[clientIndex],
        message: 'Client updated successfully',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new Error(`Failed to update client: ${error.message}`);
  }
}

/**
 * Delete client
 */
async function handleDeleteClient(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }
    
    // Read current clients
    const existingClients = JSON.parse(await readFileWithLock('./data/clients.json') || '[]');
    
    // Find and remove client
    const clientIndex = existingClients.findIndex(client => client.id === id);
    
    if (clientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    const deletedClient = existingClients.splice(clientIndex, 1)[0];
    
    // Write updated clients
    await writeFileWithLock('./data/clients.json', JSON.stringify(existingClients, null, 2));
    
    res.json({
      success: true,
      data: {
        deletedClient,
        message: 'Client deleted successfully',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new Error(`Failed to delete client: ${error.message}`);
  }
}

// Apply enterprise middleware chain
export const config = {
  api: {
    // Configure the middleware chain for this endpoint
    middleware: enterpriseIntegration.createApiMiddleware({
      auth: { 
        required: true, 
        roles: ['admin', 'employee'] 
      },
      validation: {
        schema: CommonSchemas.client,
        options: { validateBody: true }
      },
      fileOperation: {
        filePath: './data/clients.json',
        operation: 'write' // Will be dynamically determined based on method
      },
      cache: true
    })
  }
};