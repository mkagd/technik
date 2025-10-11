// pages/api/admin/stats/geo-usage.js
// Statystyki użycia API geo/maps

import fs from 'fs';
import path from 'path';

const STATS_FILE = path.join(process.cwd(), 'data', 'config', 'geo-stats.json');

export default async function handler(req, res) {
  try {
    // GET - Pobierz statystyki
    if (req.method === 'GET') {
      const stats = loadStats();
      
      return res.status(200).json({
        success: true,
        stats: calculateStats(stats)
      });
    }
    
    // POST - Zapisz nową statystykę użycia
    if (req.method === 'POST') {
      const { provider, type, success } = req.body;
      
      const stats = loadStats();
      const today = new Date().toISOString().split('T')[0];
      
      if (!stats[today]) {
        stats[today] = {
          geocoding: { google: 0, osm: 0, cache: 0, failed: 0 },
          distanceMatrix: { google: 0, osrm: 0, haversine: 0, cache: 0, failed: 0 }
        };
      }
      
      if (success) {
        stats[today][type][provider] = (stats[today][type][provider] || 0) + 1;
      } else {
        stats[today][type].failed = (stats[today][type].failed || 0) + 1;
      }
      
      saveStats(stats);
      
      return res.status(200).json({
        success: true,
        message: 'Statystyka zapisana'
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('❌ Geo stats API error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Błąd ładowania statystyk:', error);
  }
  
  return {};
}

function saveStats(stats) {
  try {
    const dir = path.dirname(STATS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Błąd zapisu statystyk:', error);
  }
}

function calculateStats(rawStats) {
  const today = new Date().toISOString().split('T')[0];
  const todayStats = rawStats[today] || {
    geocoding: { google: 0, osm: 0, cache: 0, failed: 0 },
    distanceMatrix: { google: 0, osrm: 0, haversine: 0, cache: 0, failed: 0 }
  };
  
  // Oblicz dzisiejsze użycie
  const todayGeocoding = 
    (todayStats.geocoding.google || 0) + 
    (todayStats.geocoding.osm || 0);
  
  const todayMatrix = 
    (todayStats.distanceMatrix.google || 0) + 
    (todayStats.distanceMatrix.osrm || 0) + 
    (todayStats.distanceMatrix.haversine || 0);
  
  const todayCache = 
    (todayStats.geocoding.cache || 0) + 
    (todayStats.distanceMatrix.cache || 0);
  
  const todayTotal = todayGeocoding + todayMatrix;
  
  // Cache hit rate
  const cacheHitRate = todayTotal > 0 
    ? Math.round((todayCache / (todayTotal + todayCache)) * 100) 
    : 0;
  
  // Szacunkowy koszt (Google API pricing)
  const googleGeocodingCost = (todayStats.geocoding.google || 0) * 0.005; // $5 per 1000
  const googleMatrixCost = (todayStats.distanceMatrix.google || 0) * 0.005; // $5 per 1000
  const monthlyEstimate = (googleGeocodingCost + googleMatrixCost) * 30 * 4; // ~PLN (simplified)
  
  return {
    todayGeocoding,
    todayMatrix,
    todayCache,
    cacheHitRate,
    monthlyCost: Math.round(monthlyEstimate),
    breakdown: todayStats
  };
}
