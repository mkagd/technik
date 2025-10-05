// API endpoint to test Allegro OAuth configuration
import { testConfiguration } from '../../../lib/allegro-oauth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing Allegro OAuth configuration...');
    
    const result = await testConfiguration();
    
    return res.status(result.success ? 200 : 500).json(result);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}
