// Test konfiguracji Resend API
// Uruchom: node test-resend-config.js

console.log('🔍 Sprawdzanie konfiguracji Resend API...\n');

// Wczytaj zmienne środowiskowe z .env.local
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    // Pomijaj puste linie i komentarze
    if (!line.trim() || line.trim().startsWith('#')) {
      return;
    }
    
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // Usuń cudzysłowy jeśli są
      value = value.replace(/^["']|["']$/g, '');
      env[key.trim()] = value;
    }
  });
  
  return env;
}

const envVars = loadEnvFile();

const checks = {
  '1. Plik .env.local': false,
  '2. RESEND_API_KEY ustawiony': false,
  '3. RESEND_API_KEY niepusty': false,
  '4. RESEND_API_KEY nie jest placeholderem': false,
  '5. RESEND_EMAIL_FROM ustawiony': false,
  '6. NEXT_PUBLIC_BASE_URL ustawiony': false,
};

// Sprawdź czy plik .env.local istnieje
if (fs.existsSync('.env.local')) {
  checks['1. Plik .env.local'] = true;
  console.log('✅ Plik .env.local istnieje');
} else {
  console.log('❌ Plik .env.local NIE ISTNIEJE');
  console.log('   Utwórz plik .env.local w głównym folderze projektu');
  process.exit(1);
}

// Sprawdź RESEND_API_KEY
if (envVars.RESEND_API_KEY) {
  checks['2. RESEND_API_KEY ustawiony'] = true;
  console.log('✅ RESEND_API_KEY jest ustawiony');
  
  if (envVars.RESEND_API_KEY.trim() !== '') {
    checks['3. RESEND_API_KEY niepusty'] = true;
    console.log('✅ RESEND_API_KEY nie jest pusty');
    
    if (!envVars.RESEND_API_KEY.includes('twoj_resend_api_key')) {
      checks['4. RESEND_API_KEY nie jest placeholderem'] = true;
      console.log('✅ RESEND_API_KEY wygląda na prawdziwy');
      console.log(`   Klucz: ${envVars.RESEND_API_KEY.substring(0, 10)}...`);
    } else {
      console.log('❌ RESEND_API_KEY zawiera placeholder');
      console.log('   Zamień "twoj_resend_api_key" na prawdziwy klucz z resend.com');
    }
  } else {
    console.log('❌ RESEND_API_KEY jest pusty');
  }
} else {
  console.log('❌ RESEND_API_KEY NIE jest ustawiony');
  console.log('   Dodaj linię: RESEND_API_KEY=twoj_klucz_tutaj');
}

// Sprawdź RESEND_EMAIL_FROM
if (envVars.RESEND_EMAIL_FROM) {
  checks['5. RESEND_EMAIL_FROM ustawiony'] = true;
  console.log('✅ RESEND_EMAIL_FROM jest ustawiony');
  console.log(`   Email: ${envVars.RESEND_EMAIL_FROM}`);
} else {
  console.log('⚠️  RESEND_EMAIL_FROM nie jest ustawiony');
  console.log('   Dodaj linię: RESEND_EMAIL_FROM=onboarding@resend.dev');
}

// Sprawdź NEXT_PUBLIC_BASE_URL
if (envVars.NEXT_PUBLIC_BASE_URL) {
  checks['6. NEXT_PUBLIC_BASE_URL ustawiony'] = true;
  console.log('✅ NEXT_PUBLIC_BASE_URL jest ustawiony');
  console.log(`   URL: ${envVars.NEXT_PUBLIC_BASE_URL}`);
} else {
  console.log('⚠️  NEXT_PUBLIC_BASE_URL nie jest ustawiony');
  console.log('   Dodaj linię: NEXT_PUBLIC_BASE_URL=http://localhost:3000');
}

// Podsumowanie
console.log('\n📊 PODSUMOWANIE:\n');
const passed = Object.values(checks).filter(v => v).length;
const total = Object.keys(checks).length;

Object.entries(checks).forEach(([name, status]) => {
  console.log(`${status ? '✅' : '❌'} ${name}`);
});

console.log(`\nWynik: ${passed}/${total} testów zaliczonych\n`);

if (passed === total) {
  console.log('🎉 KONFIGURACJA KOMPLETNA!');
  console.log('   Zrestartuj serwer dev: Ctrl+C, potem npm run dev');
  console.log('   Następnie wypełnij formularz z emailem i testuj!\n');
  process.exit(0);
} else {
  console.log('⚠️  KONFIGURACJA NIEPEŁNA');
  console.log('   Popraw powyższe błędy i uruchom test ponownie');
  console.log('   Instrukcja: INSTRUKCJA_RESEND_EMAIL_SETUP.md\n');
  process.exit(1);
}
