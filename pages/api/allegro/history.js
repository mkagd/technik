// API endpoint for Allegro search history and price tracking
import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'allegro-history.json');

// Helper functions
const readHistory = () => {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading history:', error);
    return [];
  }
};

const saveHistory = (history) => {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving history:', error);
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // ✅ Add search to history
    const { query, partName, partNumber, results, userId, employeeId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const history = readHistory();

    const newEntry = {
      id: `SEARCH_${Date.now()}`,
      query,
      partName: partName || null,
      partNumber: partNumber || null,
      resultCount: results?.length || 0,
      lowestPrice: results && results.length > 0 
        ? Math.min(...results.map(r => parseFloat(r.price?.amount || r.price || 0)))
        : null,
      highestPrice: results && results.length > 0 
        ? Math.max(...results.map(r => parseFloat(r.price?.amount || r.price || 0)))
        : null,
      averagePrice: results && results.length > 0
        ? results.reduce((sum, r) => sum + parseFloat(r.price?.amount || r.price || 0), 0) / results.length
        : null,
      userId: userId || null,
      employeeId: employeeId || null,
      timestamp: new Date().toISOString(),
      savedResults: results ? results.slice(0, 5) : [] // Save top 5 results for price tracking
    };

    history.unshift(newEntry); // Add to beginning

    // Keep only last 1000 searches
    if (history.length > 1000) {
      history.splice(1000);
    }

    saveHistory(history);

    console.log('✅ Search saved to history:', newEntry.id);

    return res.status(201).json({
      success: true,
      message: 'Search saved to history',
      entry: newEntry
    });
  }

  if (req.method === 'GET') {
    // ✅ Get search history with filters
    const { userId, employeeId, partName, limit = 50, days = 30 } = req.query;

    let history = readHistory();

    // Filter by user
    if (userId) {
      history = history.filter(h => h.userId === userId);
    }

    // Filter by employee
    if (employeeId) {
      history = history.filter(h => h.employeeId === employeeId);
    }

    // Filter by part name
    if (partName) {
      const searchTerm = partName.toLowerCase();
      history = history.filter(h => 
        h.partName?.toLowerCase().includes(searchTerm) ||
        h.query?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    history = history.filter(h => new Date(h.timestamp) >= daysAgo);

    // Limit results
    const limitNum = parseInt(limit);
    history = history.slice(0, limitNum);

    // Calculate statistics
    const stats = {
      totalSearches: history.length,
      uniqueParts: [...new Set(history.map(h => h.partName).filter(Boolean))].length,
      totalResults: history.reduce((sum, h) => sum + h.resultCount, 0),
      averageResults: history.length > 0 
        ? history.reduce((sum, h) => sum + h.resultCount, 0) / history.length 
        : 0,
      priceStats: {
        lowestEver: Math.min(...history.map(h => h.lowestPrice).filter(p => p !== null)),
        highestEver: Math.max(...history.map(h => h.highestPrice).filter(p => p !== null)),
        averageLowest: history.filter(h => h.lowestPrice !== null).length > 0
          ? history.filter(h => h.lowestPrice !== null)
              .reduce((sum, h) => sum + h.lowestPrice, 0) / history.filter(h => h.lowestPrice !== null).length
          : 0
      }
    };

    console.log(`✅ Returning ${history.length} history entries`);

    return res.status(200).json({
      success: true,
      history,
      stats
    });
  }

  if (req.method === 'DELETE') {
    // ✅ Clear history or delete specific entry
    const { id, all } = req.query;

    if (all === 'true') {
      // Clear all history
      saveHistory([]);
      console.log('✅ All history cleared');
      return res.status(200).json({
        success: true,
        message: 'All history cleared'
      });
    }

    if (id) {
      // Delete specific entry
      let history = readHistory();
      const initialLength = history.length;
      history = history.filter(h => h.id !== id);

      if (history.length < initialLength) {
        saveHistory(history);
        console.log('✅ History entry deleted:', id);
        return res.status(200).json({
          success: true,
          message: 'Entry deleted'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Entry not found'
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: 'Provide id or all=true parameter'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
