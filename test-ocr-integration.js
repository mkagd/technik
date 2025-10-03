// test-ocr-integration.js
// Test integracji OCR → Sugestie części → Magazyn osobisty

const testOCRIntegration = async () => {
  console.log('🧪 TEST: Integracja OCR → Magazyn');
  console.log('=' .repeat(60));

  try {
    // TEST 1: Sugestie części dla Samsung WW90T4540AE
    console.log('\n📋 TEST 1: Sugestie części dla Samsung WW90T4540AE');
    console.log('Serwisant: Adam Nowak (EMP25189002)');
    
    const test1 = await fetch('http://localhost:3000/api/inventory/suggest-parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: 'Samsung',
        model: 'WW90T4540AE',
        employeeId: 'EMP25189002',
        symptoms: ['hałas podczas wirowania', 'wibracje']
      })
    });

    const result1 = await test1.json();
    
    if (result1.success) {
      console.log(`✅ Znaleziono ${result1.suggestions.length} sugestii`);
      
      result1.suggestions.slice(0, 3).forEach((part, i) => {
        console.log(`\n   ${i + 1}. ${part.name} (${part.partNumber})`);
        console.log(`      💰 Cena: ${part.price} zł`);
        console.log(`      🎯 Kompatybilność: ${part.compatibility}%`);
        console.log(`      📦 W magazynie Adama: ${part.inPersonalInventory ? `TAK (${part.personalInventoryQuantity} szt)` : 'NIE - wymaga zamówienia'}`);
        console.log(`      ℹ️  ${part.reason}`);
      });
    } else {
      console.error('❌ Błąd:', result1.error);
    }

    // TEST 2: OCR tabliczki + sugestie
    console.log('\n\n📋 TEST 2: OCR tabliczki + automatyczne sugestie');
    console.log('Zlecenie: ORD1027');
    
    const test2 = await fetch('http://localhost:3000/api/ocr/device-plate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD1027',
        employeeId: 'EMP25189002',
        photoUrl: '/uploads/test/plate_test.jpg',
        ocrResult: {
          brand: 'Samsung',
          model: 'WW90T4540AE',
          serialNumber: 'TEST123456',
          confidence: 0.95,
          power: '2200W',
          voltage: '230V',
          capacity: '9 kg',
          rawText: 'Samsung WW90T4540AE Test'
        },
        symptoms: ['hałas podczas wirowania']
      })
    });

    const result2 = await test2.json();
    
    if (result2.success) {
      console.log(`✅ OCR zapisany: ${result2.ocrId}`);
      console.log(`   📱 Urządzenie: ${result2.device.brand} ${result2.device.model}`);
      console.log(`   🎯 Confidence: ${Math.round(result2.confidence * 100)}%`);
      console.log(`   💡 Sugerowane części: ${result2.suggestedParts.length}`);
      
      result2.suggestedParts.slice(0, 3).forEach((part, i) => {
        console.log(`\n   ${i + 1}. ${part.name}`);
        console.log(`      ${part.inPersonalInventory ? '✅ MASZ w aucie' : '❌ BRAK - zamów'}`);
        if (part.inPersonalInventory) {
          console.log(`      📦 Ilość: ${part.personalInventoryQuantity} szt`);
        }
      });
    } else {
      console.error('❌ Błąd:', result2.error);
    }

    // TEST 3: Historia OCR dla serwisanta
    console.log('\n\n📋 TEST 3: Historia OCR dla serwisanta Adam');
    
    const test3 = await fetch('http://localhost:3000/api/ocr/history?employeeId=EMP25189002&limit=3');
    const result3 = await test3.json();
    
    if (result3.success) {
      console.log(`✅ Znaleziono ${result3.history.length} rekordów OCR`);
      
      result3.history.forEach((ocr, i) => {
        console.log(`\n   ${i + 1}. ${ocr.ocrResult.brand} ${ocr.ocrResult.model}`);
        console.log(`      📅 Data: ${new Date(ocr.capturedAt).toLocaleString('pl-PL')}`);
        console.log(`      📋 Zlecenie: ${ocr.orderId}`);
        console.log(`      💡 Sugestii: ${ocr.suggestedParts.length}`);
      });
    } else {
      console.error('❌ Błąd:', result3.error);
    }

    // TEST 4: Wszystkie części w katalogu
    console.log('\n\n📋 TEST 4: Katalog części Samsung');
    
    const test4 = await fetch('http://localhost:3000/api/inventory/parts?brand=Samsung&available=true');
    const result4 = await test4.json();
    
    if (result4.success) {
      console.log(`✅ Znaleziono ${result4.count} dostępnych części Samsung`);
      
      result4.parts.slice(0, 5).forEach((part, i) => {
        console.log(`\n   ${i + 1}. ${part.name} (${part.partNumber})`);
        console.log(`      💰 ${part.pricing.retailPrice} zł`);
        console.log(`      📦 Dostępne: ${part.availability.available} szt`);
        console.log(`      🏭 ${part.supplier.name}`);
      });
    } else {
      console.error('❌ Błąd:', result4.error);
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('🎉 TESTY ZAKOŃCZONE!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n\n❌ BŁĄD TESTU:', error);
    console.error('💡 Czy serwer działa? (npm run dev)');
  }
};

// Uruchom test
testOCRIntegration();
