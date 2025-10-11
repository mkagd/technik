// Allegro OAuth 2.0 Token Manager
// Handles authentication and token management for Allegro REST API

import fs from 'fs';
import path from 'path';

const TOKEN_CACHE_FILE = path.join(process.cwd(), 'data', 'allegro-token.json');
const CONFIG_FILE = path.join(process.cwd(), 'data', 'allegro-config.json');
const TOKEN_VALIDITY_HOURS = 12; // Allegro tokens are valid for 12 hours

/**
 * Check if using Sandbox environment
 */
export function isSandbox() {
  // Check config file first
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (config.sandbox !== undefined) {
        return config.sandbox;
      }
    } catch (error) {
      // Ignore
    }
  }

  // Fallback to env variable
  return process.env.ALLEGRO_SANDBOX === 'true';
}

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
          clientSecret: config.clientSecret,
          sandbox: config.sandbox || false
        };
      }
    } catch (error) {
      console.error('❌ Error reading config file:', error.message);
    }
  }

  // Fallback to environment variables
  const clientId = process.env.ALLEGRO_CLIENT_ID;
  const clientSecret = process.env.ALLEGRO_CLIENT_SECRET;
  const sandbox = process.env.ALLEGRO_SANDBOX === 'true';

  if (!clientId || !clientSecret) {
    throw new Error('Allegro credentials not configured. Configure in /admin/allegro/settings or set ALLEGRO_CLIENT_ID and ALLEGRO_CLIENT_SECRET');
  }

  return { clientId, clientSecret, sandbox };
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
  const { clientId, clientSecret, sandbox } = getCredentials();

  // Create Basic Auth header
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  // Choose API URL based on environment
  const authUrl = sandbox 
    ? 'https://allegro.pl.allegrosandbox.pl/auth/oauth/token'
    : 'https://allegro.pl/auth/oauth/token';

  console.log(`🔑 Fetching new Allegro access token... (${sandbox ? 'SANDBOX' : 'PRODUCTION'})`);

  try {
    const response = await fetch(authUrl, {
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

// ============================================
// AUTHORIZATION CODE FLOW (dla użytkowników)
// ============================================

const USER_TOKENS_FILE = path.join(process.cwd(), 'data', 'allegro-user-tokens.json');

/**
 * Generate authorization URL for user to login to Allegro
 * @param {string} userId - Internal user ID
 * @returns {string} Authorization URL
 */
export function generateAuthUrl(userId) {
  const { clientId, sandbox } = getCredentials();
  
  const baseUrl = sandbox
    ? 'https://allegro.pl.allegrosandbox.pl/auth/oauth/authorize'
    : 'https://allegro.pl/auth/oauth/authorize';
  
  const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/allegro/callback`
    : 'http://localhost:3000/api/allegro/callback';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: userId, // Pass user ID in state to identify user after callback
    scope: 'allegro:api:sale:offers:read' // Only request permission to read offers
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from Allegro
 * @returns {Promise<object>} Token data
 */
export async function exchangeCodeForToken(code) {
  const { clientId, clientSecret, sandbox } = getCredentials();
  
  const authUrl = sandbox
    ? 'https://allegro.pl.allegrosandbox.pl/auth/oauth/token'
    : 'https://allegro.pl/auth/oauth/token';
  
  const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/allegro/callback`
    : 'http://localhost:3000/api/allegro/callback';
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  console.log('🔄 Exchanging authorization code for token...');
  
  try {
    const axios = require('axios');
    const response = await axios.post(authUrl, 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );
    
    const data = response.data;
    console.log('✅ User token obtained successfully');
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope
    };
    
  } catch (error) {
    console.error('❌ Error exchanging code for token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Save user token to storage
 * @param {string} userId - Internal user ID
 * @param {object} tokenData - Token data from Allegro
 */
export function saveUserToken(userId, tokenData) {
  try {
    // Load existing tokens
    let tokens = {};
    if (fs.existsSync(USER_TOKENS_FILE)) {
      tokens = JSON.parse(fs.readFileSync(USER_TOKENS_FILE, 'utf8'));
    }
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expiresIn);
    
    // Save token for this user
    tokens[userId] = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: expiresAt.toISOString(),
      scope: tokenData.scope,
      updatedAt: new Date().toISOString()
    };
    
    // Ensure data directory exists
    const dataDir = path.dirname(USER_TOKENS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(USER_TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log(`💾 User token saved for user: ${userId}`);
    
  } catch (error) {
    console.error('❌ Error saving user token:', error.message);
    throw error;
  }
}

/**
 * Get user's Allegro token
 * @param {string} userId - Internal user ID
 * @returns {string|null} Access token or null if not found/expired
 */
export function getUserToken(userId) {
  try {
    if (!fs.existsSync(USER_TOKENS_FILE)) {
      return null;
    }
    
    const tokens = JSON.parse(fs.readFileSync(USER_TOKENS_FILE, 'utf8'));
    const userToken = tokens[userId];
    
    if (!userToken) {
      return null;
    }
    
    // Check if token is still valid
    const expiresAt = new Date(userToken.expiresAt);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minute buffer
    
    if (expiresAt.getTime() - bufferMs <= now.getTime()) {
      console.log(`⏰ User token expired for ${userId}`);
      return null;
    }
    
    console.log(`✅ Using user token for ${userId} (valid until: ${expiresAt.toISOString()})`);
    return userToken.accessToken;
    
  } catch (error) {
    console.error('❌ Error getting user token:', error.message);
    return null;
  }
}

/**
 * Check if user has valid Allegro authorization
 * @param {string} userId - Internal user ID
 * @returns {boolean}
 */
export function isUserAuthorized(userId) {
  return getUserToken(userId) !== null;
}

/**
 * Test the OAuth configuration
 */
export async function testConfiguration() {
  try {
    const token = await getAccessToken();
    const sandbox = isSandbox();
    
    // Choose API URL based on environment
    const apiUrl = sandbox
      ? 'https://api.allegro.pl.allegrosandbox.pl/sale/categories'
      : 'https://api.allegro.pl/sale/categories';
    
    console.log(`🧪 Testing API connection... (${sandbox ? 'SANDBOX' : 'PRODUCTION'})`);
    
    // Test token by making a simple API call
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.allegro.public.v1+json'
      }
    });

    if (response.ok) {
      console.log(`✅ Allegro OAuth configuration test successful! (${sandbox ? 'SANDBOX' : 'PRODUCTION'})`);
      return { 
        success: true, 
        message: `Connection successful (${sandbox ? 'Sandbox' : 'Production'} mode)` 
      };
    } else {
      const error = await response.text();
      throw new Error(`API test failed: ${error}`);
    }

  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    return { success: false, message: error.message };
  }
}
