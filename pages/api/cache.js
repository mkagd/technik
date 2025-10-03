// pages/api/cache.js
// API endpoint dla zarządzania cache - monitoring, statystyki, invalidation

import { CacheHelpers, CacheMonitor, getCache } from '../../utils/advancedCache.js';

export default async function handler(req, res) {
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    
    if (req.method === 'GET') {
      const { action } = req.query;
      
      switch (action) {
        
        // Statystyki cache
        case 'stats':
          const cache = getCache();
          const stats = cache.getStats();
          return res.status(200).json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
          });
        
        // Test wydajności
        case 'performance':
          console.log('🚀 Starting cache performance test...');
          
          const performanceResults = {
            timestamp: new Date().toISOString(),
            tests: []
          };
          
          // Test 1: Cold cache (miss)
          const start1 = Date.now();
          await CacheHelpers.invalidateAll(); // Clear cache
          const clients1 = await CacheHelpers.getClients();
          const coldTime = Date.now() - start1;
          
          performanceResults.tests.push({
            name: 'Cold Cache (Miss)',
            time: coldTime,
            recordCount: clients1.length,
            type: 'clients'
          });
          
          // Test 2: Warm cache (hit)
          const start2 = Date.now();
          const clients2 = await CacheHelpers.getClients();
          const warmTime = Date.now() - start2;
          
          performanceResults.tests.push({
            name: 'Warm Cache (Hit)',
            time: warmTime,
            recordCount: clients2.length,
            speedup: `${(coldTime / warmTime).toFixed(1)}x`,
            type: 'clients'
          });
          
          // Test 3: Orders cache
          const start3 = Date.now();
          const orders = await CacheHelpers.getOrders();
          const ordersTime = Date.now() - start3;
          
          performanceResults.tests.push({
            name: 'Orders Cache',
            time: ordersTime,
            recordCount: orders.length,
            type: 'orders'
          });
          
          // Test 4: Stats cache
          const start4 = Date.now();
          const stats4 = await CacheHelpers.getStats();
          const statsTime = Date.now() - start4;
          
          performanceResults.tests.push({
            name: 'Stats Cache',
            time: statsTime,
            calculations: Object.keys(stats4).length,
            type: 'stats'
          });
          
          // Podsumowanie
          const totalTime = coldTime + warmTime + ordersTime + statsTime;
          performanceResults.summary = {
            totalTime,
            averageTime: Math.round(totalTime / 4),
            cacheEffective: warmTime < coldTime / 5 // Cache jest skuteczny jeśli jest 5x szybszy
          };
          
          return res.status(200).json({
            success: true,
            performance: performanceResults
          });
        
        // Health check cache
        case 'health':
          const cache_health = getCache();
          const healthStats = cache_health.getStats();
          
          const health = {
            status: 'healthy',
            cacheSize: healthStats.cacheSize,
            hitRate: parseFloat(healthStats.hitRate.replace('%', '')),
            issues: []
          };
          
          // Sprawdź potencjalne problemy
          if (health.hitRate < 50) {
            health.issues.push('Low hit rate - cache may not be effective');
          }
          
          if (healthStats.cacheSize > 1000) {
            health.issues.push('Cache size is large - consider cleanup');
          }
          
          if (health.issues.length === 0) {
            health.issues.push('No issues detected');
          }
          
          return res.status(200).json({
            success: true,
            health
          });
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use: stats, performance, health'
          });
      }
    }
    
    if (req.method === 'POST') {
      const { action, category } = req.body;
      
      switch (action) {
        
        // Odśwież konkretną kategorię
        case 'refresh':
          if (category === 'clients') {
            CacheHelpers.invalidateClients();
            const refreshedClients = await CacheHelpers.getClients();
            return res.status(200).json({
              success: true,
              message: 'Clients cache refreshed',
              count: refreshedClients.length
            });
          }
          
          if (category === 'orders') {
            CacheHelpers.invalidateOrders();
            const refreshedOrders = await CacheHelpers.getOrders();
            return res.status(200).json({
              success: true,
              message: 'Orders cache refreshed',
              count: refreshedOrders.length
            });
          }
          
          if (category === 'stats') {
            CacheHelpers.invalidateStats();
            const refreshedStats = await CacheHelpers.getStats();
            return res.status(200).json({
              success: true,
              message: 'Stats cache refreshed',
              stats: refreshedStats
            });
          }
          
          return res.status(400).json({
            success: false,
            message: 'Invalid category. Use: clients, orders, stats'
          });
        
        // Preload cache
        case 'preload':
          const preloadResults = {
            timestamp: new Date().toISOString(),
            loaded: []
          };
          
          // Preload clients
          const preClients = await CacheHelpers.getClients();
          preloadResults.loaded.push({
            category: 'clients',
            count: preClients.length
          });
          
          // Preload orders
          const preOrders = await CacheHelpers.getOrders();
          preloadResults.loaded.push({
            category: 'orders',
            count: preOrders.length
          });
          
          // Preload stats
          const preStats = await CacheHelpers.getStats();
          preloadResults.loaded.push({
            category: 'stats',
            calculations: Object.keys(preStats).length
          });
          
          return res.status(200).json({
            success: true,
            message: 'Cache preloaded successfully',
            preload: preloadResults
          });
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use: refresh, preload'
          });
      }
    }
    
    if (req.method === 'DELETE') {
      const { category } = req.query;
      
      if (category === 'all') {
        CacheHelpers.invalidateAll();
        return res.status(200).json({
          success: true,
          message: 'All cache invalidated'
        });
      }
      
      if (category === 'clients') {
        CacheHelpers.invalidateClients();
        return res.status(200).json({
          success: true,
          message: 'Clients cache invalidated'
        });
      }
      
      if (category === 'orders') {
        CacheHelpers.invalidateOrders();
        return res.status(200).json({
          success: true,
          message: 'Orders cache invalidated'
        });
      }
      
      if (category === 'stats') {
        CacheHelpers.invalidateStats();
        return res.status(200).json({
          success: true,
          message: 'Stats cache invalidated'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Use: all, clients, orders, stats'
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET, POST, DELETE'
    });
    
  } catch (error) {
    console.error('❌ Cache API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}