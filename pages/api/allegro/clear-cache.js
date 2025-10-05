// API endpoint to clear OAuth token cache
import { clearTokenCache } from '../../../lib/allegro-oauth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    clearTokenCache();
    
    return res.status(200).json({ 
      success: true,
      message: 'Token cache cleared successfully'
    });
    
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
