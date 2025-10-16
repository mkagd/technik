import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin123';
    const testPassword = 'admin123';
    
    // Generate hash
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    
    // Test comparison
    const isValid = await bcrypt.compare(testPassword, hash);
    
    res.status(200).json({
      success: true,
      data: {
        envPassword: ADMIN_PASSWORD,
        testPassword: testPassword,
        generatedHash: hash,
        comparisonResult: isValid,
        bcryptAvailable: typeof bcrypt !== 'undefined',
        hashSyncAvailable: typeof bcrypt.hashSync !== 'undefined',
        compareAvailable: typeof bcrypt.compare !== 'undefined'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
