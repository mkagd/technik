export default async function handler(req, res) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@technik.pl';
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin123';
  
  res.status(200).json({
    method: req.method,
    body: req.body,
    env: {
      ADMIN_EMAIL: ADMIN_EMAIL,
      ADMIN_EMAIL_length: ADMIN_EMAIL?.length,
      ADMIN_PASSWORD: ADMIN_PASSWORD,
      ADMIN_PASSWORD_length: ADMIN_PASSWORD?.length,
      ADMIN_PASSWORD_type: typeof ADMIN_PASSWORD,
      NEXT_PUBLIC_ADMIN_PASS_raw: process.env.NEXT_PUBLIC_ADMIN_PASS,
      ADMIN_EMAIL_raw: process.env.ADMIN_EMAIL,
      NODE_ENV: process.env.NODE_ENV
    },
    expectedEmail: 'admin@technik.pl',
    expectedPassword: 'admin123',
    emailMatch: ADMIN_EMAIL === 'admin@technik.pl',
    passwordMatch: ADMIN_PASSWORD === 'admin123',
    emailMatchLower: ADMIN_EMAIL?.toLowerCase() === 'admin@technik.pl'.toLowerCase(),
  });
}
