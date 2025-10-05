// generate-password-hash.js
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'haslo123';
  const saltRounds = 10;
  
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('==================================');
  console.log('📝 Generowanie hasła dla pracowników');
  console.log('==================================');
  console.log(`Hasło: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('==================================');
  console.log('');
  
  // Test weryfikacji
  const isValid = await bcrypt.compare(password, hash);
  console.log(`✅ Weryfikacja: ${isValid ? 'POPRAWNA' : 'BŁĘDNA'}`);
  
  return hash;
}

generateHash().catch(console.error);
