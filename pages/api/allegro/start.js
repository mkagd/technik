// pages/api/allegro/start.js
// Rozpoczyna proces autoryzacji OAuth - przekierowuje użytkownika do Allegro

import { generateAuthUrl } from '../../../lib/allegro-oauth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID from session/auth
    // TODO: Replace with actual user authentication
    const userId = req.query.userId || 'admin-001';
    
    console.log(`🚀 Starting Allegro authorization for user: ${userId}`);
    
    // Generate authorization URL
    const authUrl = generateAuthUrl(userId);
    
    console.log('📍 Redirecting to Allegro authorization page...');
    
    // Redirect user to Allegro login page
    res.redirect(authUrl);
    
  } catch (error) {
    console.error('❌ Error starting authorization:', error);
    res.status(500).json({ 
      error: 'Failed to start authorization',
      message: error.message 
    });
  }
}
