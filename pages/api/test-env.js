/**
 * 🔍 Test Endpoint - Check ALL Environment Variables
 * Sprawdza czy wszystkie wymagane zmienne są ustawione
 */

export default function handler(req, res) {
  console.log('🔧 Test zmiennych środowiskowych - ALL');
  
  // Sprawdź WSZYSTKIE potrzebne zmienne
  const envCheck = {
    // Auth & JWT
    JWT_SECRET: !!process.env.JWT_SECRET,
    
    // Supabase
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    
    // OpenAI
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    
    // Google Maps
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    
    // System
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV
  };
  
  // Lista brakujących zmiennych
  const missing = Object.entries(envCheck)
    .filter(([key, value]) => value === false && !key.startsWith('NODE_') && !key.startsWith('VERCEL'))
    .map(([key]) => key);
  
  // Wszystkie dostępne zmienne (bez wartości!)
  const availableEnvVars = Object.keys(process.env).filter(key => 
    key.startsWith('NEXT_') || 
    key.startsWith('OPENAI_') || 
    key.startsWith('GOOGLE_') ||
    key.startsWith('SUPABASE_') ||
    key.startsWith('JWT_') ||
    key.startsWith('OCR_')
  );
  
  console.log('✅ Ustawione:', availableEnvVars);
  console.log('❌ Brakujące:', missing);
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: envCheck,
    availableEnvVars: availableEnvVars,
    missing: missing,
    criticalMissing: missing.filter(key => key === 'JWT_SECRET' || key === 'SUPABASE_SERVICE_ROLE_KEY'),
    allSet: missing.length === 0,
    message: missing.length === 0 
      ? '✅ All required environment variables are set!' 
      : `❌ Missing: ${missing.join(', ')}`
  });
}