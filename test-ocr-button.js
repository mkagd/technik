// 🧪 TEST: Sprawdź czy OCR button jest w kodzie HTML

// OTWÓRZ CONSOLE (F12) i wklej:

// Test 1: Sprawdź czy button istnieje w DOM
const ocrButton = document.querySelector('[title*="Skanuj tabliczkę"]');
console.log('🔍 OCR Button znaleziony:', ocrButton ? '✅ TAK' : '❌ NIE');
if (ocrButton) {
  console.log('📏 Rozmiar:', ocrButton.getBoundingClientRect());
  console.log('👀 Widoczny:', ocrButton.offsetParent !== null ? '✅ TAK' : '❌ NIE (hidden)');
  console.log('🎨 Klasy:', ocrButton.className);
}

// Test 2: Sprawdź czy PartNameplateScanner jest zaimportowany
console.log('📦 Komponenty w React DevTools:');
console.log('Otwórz: React DevTools → Components → szukaj "PartNameplateScanner"');

// Test 3: Sprawdź state showOCRScanner
console.log('🔄 State: sprawdź w React DevTools czy showOCRScanner istnieje');

// Test 4: Wymuszenie otwarcia modalu (jeśli button istnieje)
if (ocrButton) {
  console.log('🚀 Klikam button...');
  ocrButton.click();
}

// Test 5: Sprawdź wszystkie buttony na stronie
const allButtons = document.querySelectorAll('button');
console.log('🔘 Wszystkie buttony na stronie:', allButtons.length);
const ocrRelated = Array.from(allButtons).filter(btn => 
  btn.textContent.includes('OCR') || 
  btn.textContent.includes('Skanuj') || 
  btn.className.includes('gradient')
);
console.log('📷 Buttony związane z OCR/Skanuj:', ocrRelated.length, ocrRelated);

// WYNIKI:
// ✅ Jeśli OCR Button znaleziony: ✅ TAK → Hard refresh pomógł!
// ❌ Jeśli OCR Button znaleziony: ❌ NIE → Problem z buildem/importem
