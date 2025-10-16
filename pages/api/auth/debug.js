export default async function handler(req, res) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@technik.pl';
  const ADMIN_PASSWORD_OLD = process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin123';
  const ADMIN_PASSWORD_NEW = process.env.ADMIN_PASSWORD || 'fallback123';
  
  // Simulate login logic
  const testEmail = req.body?.email || 'test@test.com';
  const testPassword = req.body?.password || 'test123';
  
  res.status(200).json({
    method: req.method,
    body: req.body,
    requestInfo: {
      testEmail: testEmail,
      testPassword: testPassword,
    },
    env: {
      ADMIN_EMAIL: ADMIN_EMAIL,
      ADMIN_EMAIL_length: ADMIN_EMAIL?.length,
      
      ADMIN_PASSWORD_OLD: ADMIN_PASSWORD_OLD,
      ADMIN_PASSWORD_OLD_length: ADMIN_PASSWORD_OLD?.length,
      ADMIN_PASSWORD_OLD_type: typeof ADMIN_PASSWORD_OLD,
      
      ADMIN_PASSWORD_NEW: ADMIN_PASSWORD_NEW,
      ADMIN_PASSWORD_NEW_length: ADMIN_PASSWORD_NEW?.length,
      ADMIN_PASSWORD_NEW_type: typeof ADMIN_PASSWORD_NEW,
      
      NEXT_PUBLIC_ADMIN_PASS_raw: process.env.NEXT_PUBLIC_ADMIN_PASS,
      ADMIN_PASSWORD_raw: process.env.ADMIN_PASSWORD,
      ADMIN_EMAIL_raw: process.env.ADMIN_EMAIL,
      NODE_ENV: process.env.NODE_ENV
    },
    comparisons: {
      emailMatch: testEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
      passwordMatchOld: testPassword === ADMIN_PASSWORD_OLD,
      passwordMatchNew: testPassword === ADMIN_PASSWORD_NEW,
      expectedEmail: 'admin@technik.pl',
      expectedPasswordOld: ADMIN_PASSWORD_OLD,
      expectedPasswordNew: ADMIN_PASSWORD_NEW,
    }
  });
}
