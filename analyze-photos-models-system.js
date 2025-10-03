const fs = require('fs');
const path = require('path');

// ANALIZA SYSTEMU FOTOGRAFII I MODELI

console.log('📸 ANALIZA SYSTEMU ZDJĘĆ I MODELI...');
console.log('');

// 1. OBECNY STAN
console.log('🔍 OBECNY STAN:');
console.log('   ✅ modelsDatabase.json - 60+ modeli AGD');
console.log('   ✅ ModelOCRScanner.js - skanowanie Tesseract');
console.log('   ✅ ModelAIScanner.js - skanowanie OpenAI');
console.log('   ✅ localStorage - zapisywanie w przeglądarce');
console.log('   ✅ orders.json - pola na zdjęcia (beforePhotos, afterPhotos)');
console.log('');

// 2. CO BRAKUJE
console.log('❌ CO BRAKUJE:');
console.log('   📁 Folder /uploads/ na serwerze');
console.log('   🔌 API endpoint do zapisywania zdjęć');
console.log('   🔗 Integracja skanera z zleceniami');
console.log('   💾 Trwałe przechowywanie zdjęć');
console.log('');

// 3. SPRAWDŹ ISTNIEJĄCE STRUKTURY
const dataDir = path.join(__dirname, 'data');

console.log('📋 SPRAWDZANIE STRUKTUR:');

// Sprawdź modelsDatabase.json
const modelsDatabasePath = path.join(dataDir, 'modelsDatabase.json');
if (fs.existsSync(modelsDatabasePath)) {
  const modelsData = JSON.parse(fs.readFileSync(modelsDatabasePath, 'utf8'));
  const brandsCount = Object.keys(modelsData.brands || {}).length;
  const patternsCount = modelsData.ocr_patterns?.length || 0;
  
  console.log(`   ✅ modelsDatabase.json - ${brandsCount} marek, ${patternsCount} wzorców OCR`);
} else {
  console.log('   ❌ modelsDatabase.json - BRAK');
}

// Sprawdź orders.json - czy mają pola na zdjęcia
const ordersPath = path.join(dataDir, 'orders.json');
if (fs.existsSync(ordersPath)) {
  const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
  const hasPhotos = orders.some(order => 
    order.beforePhotos || order.afterPhotos || order.photos
  );
  
  console.log(`   ✅ orders.json - ${orders.length} zleceń, ${hasPhotos ? 'MAJĄ' : 'BRAK'} pola na zdjęcia`);
} else {
  console.log('   ❌ orders.json - BRAK');
}

// Sprawdź czy istnieją foldery na zdjęcia
const uploadsDir = path.join(__dirname, 'uploads');
const publicUploadsDir = path.join(__dirname, 'public', 'uploads');

console.log('');
console.log('📁 FOLDERY NA ZDJĘCIA:');
console.log(`   ${fs.existsSync(uploadsDir) ? '✅' : '❌'} /uploads/`);
console.log(`   ${fs.existsSync(publicUploadsDir) ? '✅' : '❌'} /public/uploads/`);

// Sprawdź API endpoints
const apiDir = path.join(__dirname, 'pages', 'api');
const uploadEndpoints = [];

if (fs.existsSync(apiDir)) {
  const scanApiDir = (dir, prefix = '') => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(prefix, file);
      
      if (fs.statSync(fullPath).isDirectory()) {
        scanApiDir(fullPath, relativePath);
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('upload') || content.includes('photo') || content.includes('image')) {
          uploadEndpoints.push(relativePath);
        }
      }
    });
  };
  
  scanApiDir(apiDir);
}

console.log('');
console.log('🔌 API ENDPOINTS DLA ZDJĘĆ:');
if (uploadEndpoints.length > 0) {
  uploadEndpoints.forEach(endpoint => {
    console.log(`   ✅ /api/${endpoint.replace(/\\/g, '/').replace('.js', '')}`);
  });
} else {
  console.log('   ❌ BRAK endpointów do uploadowania zdjęć');
}

console.log('');
console.log('💡 REKOMENDACJE:');
console.log('');
console.log('1️⃣ UTWÓRZ FOLDERY:');
console.log('   mkdir public/uploads');
console.log('   mkdir public/uploads/orders');
console.log('   mkdir public/uploads/models');
console.log('');

console.log('2️⃣ DODAJ API ENDPOINT:');
console.log('   pages/api/upload-photo.js - do zapisywania zdjęć');
console.log('   pages/api/models/scan.js - do integracji skanera');
console.log('');

console.log('3️⃣ POŁĄCZ SYSTEMY:');
console.log('   ModelScanner → orders.json');
console.log('   localStorage → server storage');
console.log('   Automatyczne rozpoznawanie → wypełnianie pól');
console.log('');

console.log('🎯 PRIORYTET: Stwórz system uploadowania zdjęć na serwer!');
console.log('📸 MASZ JUŻ: Skanowanie, rozpoznawanie, struktury danych');
console.log('❗ POTRZEBUJESZ: Trwałe przechowywanie na serwerze');