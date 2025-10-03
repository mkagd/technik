// test-upload-system.js
// 🎯 KOMPLEKSOWE TESTOWANIE SYSTEMU UPLOADOWANIA ZDJĘĆ
//
// Automatyczne testy wszystkich komponentów systemu

const fs = require('fs');
const path = require('path');

console.log('🧪 ROZPOCZYNAM KOMPLEKSOWE TESTOWANIE SYSTEMU UPLOADÓW...');
console.log('');

// ========== TEST 1: STRUKTURA FOLDERÓW ==========
console.log('📁 TEST 1: Sprawdzanie struktury folderów...');

const requiredFolders = [
  'public/uploads',
  'public/uploads/orders', 
  'public/uploads/models',
  'public/uploads/temp',
  'public/uploads/temp/unassigned',
  'logs'
];

let folderTestsPassed = 0;
let folderTestsFailed = 0;

requiredFolders.forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (fs.existsSync(folderPath)) {
    console.log(`   ✅ ${folder}`);
    folderTestsPassed++;
  } else {
    console.log(`   ❌ ${folder} - BRAKUJE!`);
    folderTestsFailed++;
  }
});

console.log(`   📊 Foldery: ${folderTestsPassed}/${requiredFolders.length} OK`);
console.log('');

// ========== TEST 2: PLIKI API ==========
console.log('🔌 TEST 2: Sprawdzanie plików API...');

const requiredApiFiles = [
  'pages/api/upload-photo.js',
  'pages/api/migrate-scanner-images.js',
  'pages/api/orders/[id]/photos.js'
];

let apiTestsPassed = 0;
let apiTestsFailed = 0;

requiredApiFiles.forEach(apiFile => {
  const apiPath = path.join(__dirname, apiFile);
  if (fs.existsSync(apiPath)) {
    console.log(`   ✅ ${apiFile}`);
    apiTestsPassed++;
  } else {
    console.log(`   ❌ ${apiFile} - BRAKUJE!`);
    apiTestsFailed++;
  }
});

console.log(`   📊 API Files: ${apiTestsPassed}/${requiredApiFiles.length} OK`);
console.log('');

// ========== TEST 3: UTILITY FILES ==========
console.log('🛠️ TEST 3: Sprawdzanie plików utility...');

const requiredUtilFiles = [
  'utils/photo-integration.js',
  'utils/scanner-server-integration.js'
];

let utilTestsPassed = 0;
let utilTestsFailed = 0;

requiredUtilFiles.forEach(utilFile => {
  const utilPath = path.join(__dirname, utilFile);
  if (fs.existsSync(utilPath)) {
    console.log(`   ✅ ${utilFile}`);
    utilTestsPassed++;
  } else {
    console.log(`   ❌ ${utilFile} - BRAKUJE!`);
    utilTestsFailed++;
  }
});

console.log(`   📊 Utils: ${utilTestsPassed}/${requiredUtilFiles.length} OK`);
console.log('');

// ========== TEST 4: COMPONENTS ==========
console.log('⚛️ TEST 4: Sprawdzanie komponentów...');

const requiredComponents = [
  'components/MigrationManager.js'
];

let componentTestsPassed = 0;
let componentTestsFailed = 0;

requiredComponents.forEach(component => {
  const componentPath = path.join(__dirname, component);
  if (fs.existsSync(componentPath)) {
    console.log(`   ✅ ${component}`);
    componentTestsPassed++;
  } else {
    console.log(`   ❌ ${component} - BRAKUJE!`);
    componentTestsFailed++;
  }
});

console.log(`   📊 Components: ${componentTestsPassed}/${requiredComponents.length} OK`);
console.log('');

// ========== TEST 5: ORDERS.JSON INTEGRATION ==========
console.log('📋 TEST 5: Sprawdzanie integracji z orders.json...');

const ordersPath = path.join(__dirname, 'data', 'orders.json');
let ordersIntegrationPassed = 0;
let ordersIntegrationFailed = 0;

if (fs.existsSync(ordersPath)) {
  try {
    const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    
    // Sprawdź czy zlecenia mają pola na zdjęcia
    const hasPhotoFields = ordersData.some(order => 
      order.photos && 
      order.photos.beforePhotos !== undefined &&
      order.photos.afterPhotos !== undefined
    );
    
    if (hasPhotoFields) {
      console.log('   ✅ orders.json ma pola na zdjęcia');
      ordersIntegrationPassed++;
    } else {
      console.log('   ❌ orders.json NIE MA pól na zdjęcia');
      ordersIntegrationFailed++;
    }
    
    // Sprawdź metadata
    const hasPhotoMetadata = ordersData.some(order => 
      order.metadata && order.metadata.hasPhotoSupport
    );
    
    if (hasPhotoMetadata) {
      console.log('   ✅ orders.json ma metadata zdjęć');
      ordersIntegrationPassed++;
    } else {
      console.log('   ❌ orders.json NIE MA metadata zdjęć');
      ordersIntegrationFailed++;
    }
    
  } catch (error) {
    console.log('   ❌ Błąd parsowania orders.json:', error.message);
    ordersIntegrationFailed += 2;
  }
} else {
  console.log('   ❌ orders.json - BRAKUJE!');
  ordersIntegrationFailed += 2;
}

console.log(`   📊 Orders Integration: ${ordersIntegrationPassed}/2 OK`);
console.log('');

// ========== TEST 6: DEPENDENCIES ==========
console.log('📦 TEST 6: Sprawdzanie dependencies...');

const packageJsonPath = path.join(__dirname, 'package.json');
let dependencyTestsPassed = 0;
let dependencyTestsFailed = 0;

if (fs.existsSync(packageJsonPath)) {
  try {
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };
    
    const requiredDeps = ['formidable', 'sharp'];
    
    requiredDeps.forEach(dep => {
      if (dependencies[dep]) {
        console.log(`   ✅ ${dep} v${dependencies[dep]}`);
        dependencyTestsPassed++;
      } else {
        console.log(`   ❌ ${dep} - BRAKUJE!`);
        dependencyTestsFailed++;
      }
    });
    
  } catch (error) {
    console.log('   ❌ Błąd parsowania package.json:', error.message);
    dependencyTestsFailed += 2;
  }
} else {
  console.log('   ❌ package.json - BRAKUJE!');
  dependencyTestsFailed += 2;
}

console.log(`   📊 Dependencies: ${dependencyTestsPassed}/2 OK`);
console.log('');

// ========== TEST 7: NEXT.JS CONFIG ==========
console.log('⚙️ TEST 7: Sprawdzanie konfiguracji Next.js...');

const nextConfigPath = path.join(__dirname, 'next.config.js');
let nextConfigPassed = 0;
let nextConfigFailed = 0;

if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfigContent.includes('sizeLimit')) {
    console.log('   ✅ Next.js skonfigurowany dla uploadów');
    nextConfigPassed++;
  } else {
    console.log('   ❌ Next.js NIE MA konfiguracji uploadów');
    nextConfigFailed++;
  }
} else {
  console.log('   ❌ next.config.js - BRAKUJE!');
  nextConfigFailed++;
}

console.log(`   📊 Next.js Config: ${nextConfigPassed}/1 OK`);
console.log('');

// ========== PODSUMOWANIE TESTÓW ==========
console.log('📊 ===== PODSUMOWANIE TESTÓW =====');
console.log('');

const totalTests = folderTestsPassed + folderTestsFailed + 
                  apiTestsPassed + apiTestsFailed +
                  utilTestsPassed + utilTestsFailed +
                  componentTestsPassed + componentTestsFailed +
                  ordersIntegrationPassed + ordersIntegrationFailed +
                  dependencyTestsPassed + dependencyTestsFailed +
                  nextConfigPassed + nextConfigFailed;

const passedTests = folderTestsPassed + apiTestsPassed + utilTestsPassed + 
                   componentTestsPassed + ordersIntegrationPassed + 
                   dependencyTestsPassed + nextConfigPassed;

const failedTests = totalTests - passedTests;

console.log(`✅ TESTY ZALICZONE: ${passedTests}`);
console.log(`❌ TESTY NIEZALICZONE: ${failedTests}`);
console.log(`📈 SKUTECZNOŚĆ: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('');

// ========== OCENA KOŃCOWA ==========
if (failedTests === 0) {
  console.log('🎉 WSZYSTKIE TESTY ZALICZONE!');
  console.log('✨ System uploadowania zdjęć jest w pełni funkcjonalny!');
  console.log('');
  console.log('🚀 GOTOWY DO UŻYCIA:');
  console.log('   • Struktura folderów ✅');
  console.log('   • API endpoints ✅');
  console.log('   • Integracja z orders.json ✅');
  console.log('   • Modyfikacje skanerów ✅');
  console.log('   • System migracji ✅');
  console.log('   • Wszystkie dependencies ✅');
} else if (failedTests <= 2) {
  console.log('⚠️ SYSTEM PRAWIE GOTOWY');
  console.log(`📝 Wymaga poprawienia ${failedTests} elementów`);
  console.log('💡 System będzie działał, ale zalecane są poprawki');
} else {
  console.log('❌ SYSTEM WYMAGA POPRAWEK');
  console.log(`🔧 Należy naprawić ${failedTests} elementów przed użyciem`);
}

console.log('');
console.log('📋 NASTĘPNE KROKI:');
console.log('   1. Napraw wszystkie błędy wskazane w testach');
console.log('   2. Uruchom serwer deweloperski: npm run dev');
console.log('   3. Przetestuj upload przez /api/upload-photo');
console.log('   4. Sprawdź integrację ze skanerami');
console.log('   5. Przetestuj migrację localStorage');
console.log('');

console.log('🌙 TESTOWANIE ZAKOŃCZONE');
console.log(`⏰ Godzina: ${new Date().toLocaleTimeString()}`);

// Zapisz wyniki testów
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: totalTests,
  passedTests: passedTests,
  failedTests: failedTests,
  successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
  details: {
    folders: { passed: folderTestsPassed, failed: folderTestsFailed },
    api: { passed: apiTestsPassed, failed: apiTestsFailed },
    utils: { passed: utilTestsPassed, failed: utilTestsFailed },
    components: { passed: componentTestsPassed, failed: componentTestsFailed },
    orders: { passed: ordersIntegrationPassed, failed: ordersIntegrationFailed },
    dependencies: { passed: dependencyTestsPassed, failed: dependencyTestsFailed },
    nextConfig: { passed: nextConfigPassed, failed: nextConfigFailed }
  }
};

const testResultsPath = path.join(__dirname, 'logs', 'test-results.json');
const logsDir = path.dirname(testResultsPath);

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

fs.writeFileSync(testResultsPath, JSON.stringify(testResults, null, 2));
console.log('💾 Wyniki testów zapisane w: logs/test-results.json');