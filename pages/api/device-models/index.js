import fs from 'fs';
import path from 'path';

/**
 * API endpoint for device models management
 * GET /api/device-models - Get all device models with filters
 * POST /api/device-models - Add new device model
 * PUT /api/device-models - Update device model
 * DELETE /api/device-models - Delete device model
 */

const modelsPath = path.join(process.cwd(), 'data', 'device-models.json');
const modelsDatabasePath = path.join(process.cwd(), 'data', 'modelsDatabase.json');

// Helper: Read JSON file
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Helper: Write JSON file
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Helper: Parse modelsDatabase.json to flat array
function parseModelsDatabase() {
  try {
    const data = fs.readFileSync(modelsDatabasePath, 'utf8');
    const db = JSON.parse(data);
    const models = [];

    // Parse nested structure: brands -> BOSCH -> washing_machines -> WAG28461BY -> {...}
    if (db.brands) {
      Object.entries(db.brands).forEach(([brandName, categories]) => {
        Object.entries(categories).forEach(([categoryName, modelsList]) => {
          Object.entries(modelsList).forEach(([modelCode, modelData]) => {
            models.push({
              id: `${brandName}-${modelCode}`.toLowerCase().replace(/\s+/g, '-'),
              brand: brandName,
              model: modelCode,
              name: modelData.name || modelCode,
              type: modelData.type || categoryName,
              category: categoryName,
              capacity: modelData.capacity,
              serialNumber: modelData.serialNumber || '',
              common_parts: modelData.common_parts || [],
              specs: modelData.specs || {},
              createdAt: new Date().toISOString()
            });
          });
        });
      });
    }

    return models;
  } catch (error) {
    console.error('Error parsing modelsDatabase.json:', error);
    return [];
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    // GET: List device models with filters
    const {
      brand,
      type,
      search,
      sortBy = 'brand',
      sortOrder = 'asc'
    } = req.query;

    // Combine models from both sources
    let models = [
      ...readJSON(modelsPath),        // User-added models
      ...parseModelsDatabase()        // Static database models
    ];

    // Apply filters
    if (brand) {
      models = models.filter(m => m.brand.toLowerCase() === brand.toLowerCase());
    }

    if (type) {
      models = models.filter(m => m.type.toLowerCase() === type.toLowerCase());
    }

    if (search) {
      const searchLower = search.toLowerCase();
      models = models.filter(m => 
        m.brand.toLowerCase().includes(searchLower) ||
        m.model.toLowerCase().includes(searchLower) ||
        m.name?.toLowerCase().includes(searchLower) ||
        m.serialNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    models.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'brand':
          comparison = (a.brand || '').localeCompare(b.brand || '');
          break;
        case 'model':
          comparison = (a.model || '').localeCompare(b.model || '');
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return res.status(200).json({
      success: true,
      models,
      total: models.length
    });

  } else if (req.method === 'POST') {
    // POST: Add new device model
    const {
      brand,
      model,
      name,
      type,
      serialNumber,
      specs,
      plateImageUrl,
      notes,
      addedBy,
      addedByName
    } = req.body;

    if (!brand || !model) {
      return res.status(400).json({
        success: false,
        error: 'Brand and model are required'
      });
    }

    let models = readJSON(modelsPath);

    // Check if model already exists
    const existingIndex = models.findIndex(
      m => m.brand.toLowerCase() === brand.toLowerCase() && 
           m.model.toLowerCase() === model.toLowerCase()
    );

    const modelData = {
      id: existingIndex >= 0 ? models[existingIndex].id : `MODEL-${Date.now()}`,
      brand,
      model,
      name: name || `${brand} ${model}`,
      type: type || 'AGD',
      serialNumber: serialNumber || null,
      specs: specs || {},
      plateImageUrl: plateImageUrl || null,
      notes: notes || '',
      addedBy: addedBy || 'system',
      addedByName: addedByName || 'System',
      createdAt: existingIndex >= 0 ? models[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing
      models[existingIndex] = modelData;
    } else {
      // Add new
      models.push(modelData);
    }

    if (!writeJSON(modelsPath, models)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save device model'
      });
    }

    return res.status(200).json({
      success: true,
      model: modelData,
      message: existingIndex >= 0 ? 'Model updated' : 'Model added'
    });

  } else if (req.method === 'PUT') {
    // PUT: Update device model
    const { id, updates } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Model ID is required'
      });
    }

    let models = readJSON(modelsPath);
    const modelIndex = models.findIndex(m => m.id === id);

    if (modelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    models[modelIndex] = {
      ...models[modelIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (!writeJSON(modelsPath, models)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update device model'
      });
    }

    return res.status(200).json({
      success: true,
      model: models[modelIndex],
      message: 'Model updated successfully'
    });

  } else if (req.method === 'DELETE') {
    // DELETE: Remove device model
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Model ID is required'
      });
    }

    let models = readJSON(modelsPath);
    const modelIndex = models.findIndex(m => m.id === id);

    if (modelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    const deletedModel = models.splice(modelIndex, 1)[0];

    if (!writeJSON(modelsPath, models)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete device model'
      });
    }

    return res.status(200).json({
      success: true,
      model: deletedModel,
      message: 'Model deleted successfully'
    });

  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}
