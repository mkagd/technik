// Allegro OAuth 2.0 Token Manager
// Handles authentication and token management for Allegro REST API

import fs from 'fs';
import path from 'path';

const TOKEN_CACHE_FILE = path.join(process.cwd(), 'data', 'allegro-token.json');
const CONFIG_FILE = path.join(process.cwd(), 'data', 'allegro-config.json');
const TOKEN_VALIDITY_HOURS = 12; // Allegro tokens are valid for 12 hours

/**
 * Get Allegro OAuth credentials from config file or environment variables
 */
function getCredentials() {
  // Try to load from config file first
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (config.clientId && config.clientSecret) {
        return {
          clientId: config.clientId,
          clientSecret: config.clientSecret
        };
      }
    } catch (error) {
      console.error('❌ Error reading config file:', error.message);
    }
  }

  // Fallback to environment variables
  const clientId = process.env.ALLEGRO_CLIENT_ID;
  const clientSecret = process.env.ALLEGRO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Allegro credentials not configured. Configure in /admin/allegro/settings or set ALLEGRO_CLIENT_ID and ALLEGRO_CLIENT_SECRET');
  }

  return { clientId, clientSecret };
}

/**
 * Check if cached token is still valid
 */
function isCachedTokenValid() {
  try {
    if (!fs.existsSync(TOKEN_CACHE_FILE)) {
      return false;
    }

    const data = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf8'));
    const expiresAt = new Date(data.expiresAt);
    const now = new Date();

    // Add 5 minute buffer before actual expiration
    const bufferMs = 5 * 60 * 1000;
    
    if (expiresAt.getTime() - bufferMs > now.getTime()) {
      console.log('✅ Using cached Allegro token (valid until:', expiresAt.toISOString(), ')');
      return true;
    }

    console.log('⏰ Cached token expired, fetching new one...');
    return false;
  } catch (error) {
    console.error('❌ Error reading token cache:', error.message);
    return false;
  }
}

/**
 * Get cached token
 */
function getCachedToken() {
  try {
    const data = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf8'));
    return data.accessToken;
  } catch (error) {
    return null;
  }
}

/**
 * Save token to cache
 */
function saveTokenToCache(accessToken, expiresIn) {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    const data = {
      accessToken,
      expiresAt: expiresAt.toISOString(),
      cachedAt: new Date().toISOString()
    };

    // Ensure data directory exists
    const dataDir = path.dirname(TOKEN_CACHE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(data, null, 2));
    console.log('💾 Token cached successfully (expires:', data.expiresAt, ')');
  } catch (error) {
    console.error('❌ Error saving token to cache:', error.message);
  }
}

/**
 * Fetch new access token from Allegro using Client Credentials flow
 */
async function fetchNewToken() {
  const { clientId, clientSecret } = getCredentials();

  // Create Basic Auth header
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  console.log('🔑 Fetching new Allegro access token...');

  try {
    const response = await fetch('https://allegro.pl/auth/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OAuth failed (${response.status}): ${errorData}`);
    }

    const data = await response.json();

    // Save to cache
    saveTokenToCache(data.access_token, data.expires_in);

    console.log('✅ New access token obtained successfully');
    return data.access_token;

  } catch (error) {
    console.error('❌ Error fetching Allegro token:', error.message);
    throw new Error(`Failed to authenticate with Allegro: ${error.message}`);
  }
}

/**
 * Get valid access token (from cache or fetch new one)
 * @returns {Promise<string>} Valid access token
 */
export async function getAccessToken() {
  try {
    // Check credentials are configured
    getCredentials();

    // Try to use cached token first
    if (isCachedTokenValid()) {
      const cachedToken = getCachedToken();
      if (cachedToken) {
        return cachedToken;
      }
    }

    // Fetch new token if cache invalid or missing
    return await fetchNewToken();

  } catch (error) {
    console.error('❌ Error getting access token:', error.message);
    throw error;
  }
}

/**
 * Clear cached token (useful for testing or when token is invalid)
 */
export function clearTokenCache() {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      fs.unlinkSync(TOKEN_CACHE_FILE);
      console.log('🗑️ Token cache cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing token cache:', error.message);
  }
}

/**
 * Check if Allegro credentials are configured
 */
export function isConfigured() {
  try {
    getCredentials();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Test the OAuth configuration
 */
export async function testConfiguration() {
  try {
    const token = await getAccessToken();
    
    // Test token by making a simple API call
    const response = await fetch('https://api.allegro.pl/sale/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.allegro.public.v1+json'
      }
    });

    if (response.ok) {
      console.log('✅ Allegro OAuth configuration test successful!');
      return { success: true, message: 'Connection successful' };
    } else {
      const error = await response.text();
      throw new Error(`API test failed: ${error}`);
    }

  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    return { success: false, message: error.message };
  }
}
