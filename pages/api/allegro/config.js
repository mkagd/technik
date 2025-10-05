// API endpoint to manage Allegro OAuth configuration
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'allegro-config.json');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get current configuration (without exposing secret)
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        
        return res.status(200).json({
          success: true,
          clientId: data.clientId || null,
          sandbox: data.sandbox !== undefined ? data.sandbox : true,
          configured: !!(data.clientId && data.clientSecret),
        });
      }

      return res.status(200).json({
        success: true,
        clientId: null,
        sandbox: true,
        configured: false,
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  if (req.method === 'POST') {
    // Save new configuration
    try {
      const { clientId, clientSecret, sandbox } = req.body;

      if (!clientId || !clientSecret) {
        return res.status(400).json({ 
          success: false, 
          error: 'Client ID and Secret are required' 
        });
      }

      // Validate format (basic check)
      if (clientId.length < 10 || clientSecret.length < 10) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid Client ID or Secret format' 
        });
      }

      // Don't save if it's the masked secret (••••)
      let configToSave = { 
        clientId,
        sandbox: sandbox !== undefined ? sandbox : true
      };
      
      if (!clientSecret.includes('••••')) {
        configToSave.clientSecret = clientSecret;
      } else {
        // Keep existing secret if user didn't change it
        if (fs.existsSync(CONFIG_FILE)) {
          const existing = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
          configToSave.clientSecret = existing.clientSecret;
        }
      }

      // Ensure data directory exists
      const dataDir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Save to file
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2));

      console.log(`✅ Allegro OAuth config saved (${configToSave.sandbox ? 'SANDBOX' : 'PRODUCTION'})`);

      // Also update environment variables for this process
      process.env.ALLEGRO_CLIENT_ID = configToSave.clientId;
      process.env.ALLEGRO_CLIENT_SECRET = configToSave.clientSecret;
      process.env.ALLEGRO_SANDBOX = configToSave.sandbox ? 'true' : 'false';

      return res.status(200).json({ 
        success: true, 
        message: `Configuration saved successfully (${configToSave.sandbox ? 'SANDBOX' : 'PRODUCTION'} mode)` 
      });

    } catch (error) {
      console.error('❌ Error saving config:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
