/**
 * 🔍 Quick Env Check - Direct test without cache
 * Timestamp: 2025-01-17-10-31
 */

export default function handler(req, res) {
  const result = {
    timestamp: new Date().toISOString(),
    JWT_SECRET_exists: !!process.env.JWT_SECRET,
    SUPABASE_SERVICE_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    all_env_keys: Object.keys(process.env).filter(k => 
      k.includes('JWT') || 
      k.includes('SUPABASE') || 
      k.startsWith('NEXT_PUBLIC')
    )
  };
  
  return res.status(200).json(result);
}
