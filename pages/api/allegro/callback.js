// pages/api/allegro/callback.js
// Odbiera kod autoryzacyjny z Allegro i wymienia go na token

import { exchangeCodeForToken, saveUserToken } from '../../../lib/allegro-oauth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  // Handle authorization denial
  if (error) {
    console.log('❌ User denied authorization:', error);
    return res.redirect('/admin/allegro/settings?error=denied');
  }

  // Validate code and state
  if (!code || !state) {
    console.log('❌ Missing code or state parameter');
    return res.redirect('/admin/allegro/settings?error=invalid_callback');
  }

  try {
    const userId = state; // State contains user ID
    
    console.log(`✅ Authorization code received for user: ${userId}`);
    console.log(`🔄 Exchanging code for access token...`);
    
    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(code);
    
    // Save token for this user
    saveUserToken(userId, tokenData);
    
    console.log(`✅ User ${userId} successfully authorized with Allegro`);
    
    // Redirect back to settings page with success message
    res.redirect('/admin/allegro/settings?success=authorized');
    
  } catch (error) {
    console.error('❌ Error in authorization callback:', error);
    res.redirect(`/admin/allegro/settings?error=token_exchange_failed&message=${encodeURIComponent(error.message)}`);
  }
}
