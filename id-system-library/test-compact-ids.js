/**
 * SYSTEM ID BEZ MYŚLNIKÓW - KOMPAKTOWY FORMAT
 * Format: PREFIX[ŹRÓDŁO][DATECODE][NUMER]
 * 
 * Przykład: ORDA25271001
 * - ORD = zamówienie
 * - A = AI Assistant  
 * - 25271 = 28.09.2025 (dzień 271)
 * - 001 = pierwszy tego dnia
 */

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function encodeDateCode(date) {
  const year = date.getFullYear() % 100;
  const dayOfYear = getDayOfYear(date);
  return (year * 1000) + dayOfYear;
}

// Dzisiaj: 28.09.2025 = dzień 271 = kod 25271

console.log("=== SYSTEM ID BEZ MYŚLNIKÓW ===");
console.log("Format: PREFIX[ŹRÓDŁO][DATECODE][NUMER]");
console.log("Dzisiaj: 28.09.2025 = kod 25271");
console.log("");

// ========== KLIENCI (bez źródła, bo nie mają) ==========
const CLIENTS_COMPACT = [
  "CLI25271001", // Mariusz Bielaszka
  "CLI25271002", // Kręgielnia Laguna  
  "CLI25272001", // Anna Kowalska (jutro)
  "CLI25273001", // Piotr Nowak
  "CLI25274001", // Firma TechSerwis
];

console.log("👥 KLIENCI (Clients) - bez źródła:");
CLIENTS_COMPACT.forEach(id => console.log(`  ${id} (${id.length} znaków)`));
console.log("");

// ========== ZAMÓWIENIA - RÓŻNE ŹRÓDŁA ==========
console.log("📋 ZAMÓWIENIA - wszystkie źródła:");

// AI Assistant
const AI_ORDERS = [
  "ORDA25271001", // AI: "Pralka nie wiruje"
  "ORDA25271002", // AI: "Lodówka nie chłodzi"  
  "ORDA25271003", // AI: "Zmywarka hałasuje"
  "ORDA25272001", // AI: jutro pierwszy
  "ORDA25272002", // AI: jutro drugi
];

console.log("🤖 AI Assistant (A):");
AI_ORDERS.forEach(id => console.log(`  ${id} (${id.length} znaków)`));

// Mobile/Mobilne
const MOBILE_ORDERS = [
  "ORDM25271001", // Mobile: Naprawa w Rzeszowie
  "ORDM25271002", // Mobile: Serwis w Jaśle
  "ORDM25271003", // Mobile: Wizyta w Krośnie
  "ORDM25272001", // Mobile: jutro
  "ORDM25273001", // Mobile: pojutrze
];

console.log("📱 Mobile (M):");
MOBILE_ORDERS.forEach(id => console.log(`  ${id} (${id.length} znaków)`));

// Website  
const WEB_ORDERS = [
  "ORDW25271001", // Web: Formularz kontaktowy
  "ORDW25271002", // Web: Rezerwacja online
  "ORDW25272001", // Web: jutro
  "ORDW25273001", // Web: pojutrze
  "ORDW25274001", // Web: za 3 dni
];

console.log("🌐 Website (W):");
WEB_ORDERS.forEach(id => console.log(`  ${id} (${id.length} znaków)`));

// Telefon
const PHONE_ORDERS = [
  "ORDT25271001", // Tel: Rozmowa o naprawie
  "ORDT25271002", // Tel: Umówienie wizyty
  "ORDT25272001", // Tel: jutro
  "ORDT25273001", // Tel: pojutrze
  "ORDT25274001", // Tel: za 3 dni
];

console.log("📞 Telefon (T):");
PHONE_ORDERS.forEach(id => console.log(`  ${id} (${id.length} znaków)`));

// Email
const EMAIL_ORDERS = [
  "ORDE25271001", // Email: Awaria AGD
  "ORDE25271002", // Email: Zapytanie o serwis
  "ORDE25272001", // Email: jutro
  "ORDE25273001", // Email: pojutrze
  "ORDE25274001", // Email: za 3 dni
];

console.log("📧 Email (E):");
EMAIL_ORDERS.forEach(id => console.log(`  ${id} (${id.length} znaków)`));
console.log("");

// ========== SKALOWALNOŚĆ - TYSIĄCE ZAMÓWIEŃ ==========
console.log("📈 SKALOWALNOŚĆ - TYSIĄCE ZAMÓWIEŃ:");

const THOUSAND_ORDERS = [
  "ORDA25271001", // 1. zamówienie AI
  "ORDA25271010", // 10. zamówienie AI
  "ORDA25271100", // 100. zamówienie AI  
  "ORDA25271999", // 999. zamówienie AI (maksimum 3 cyfry)
  "ORDM25271001", // 1. zamówienie Mobile
  "ORDM25271500", // 500. zamówienie Mobile
  "ORDW25271750", // 750. zamówienie Web
];

THOUSAND_ORDERS.forEach(id => {
  const source = id[3]; // A, M, W
  const dateCode = id.slice(4, 9); // 25271
  const number = id.slice(9); // 001, 010, 100, etc.
  console.log(`  ${id} → Źródło: ${source}, Data: ${dateCode}, Nr: ${number}`);
});
console.log("");

// ========== INNE TYPY ID ==========
console.log("🏢 INNE TYPY ID:");

// Pracownicy (bez źródła)
const EMPLOYEES_COMPACT = [
  "EMP25271001", // Maria Zielińska (dzisiaj)
  "EMP25271002", // Tomasz Kaczmarek (dzisiaj)
  "EMP25272001", // Nowy pracownik (jutro)
];

console.log("👷 Pracownicy:");
EMPLOYEES_COMPACT.forEach(id => console.log(`  ${id} (${id.length} znaków)`));

// Serwisanci (bez źródła)
const SERVICEMEN_COMPACT = [
  "SRV25271001", // Mariusz B.
  "SRV25271002", // Krzysztof M.
  "SRV25272001", // Łukasz P. (jutro)
];

console.log("🛠️ Serwisanci:");
SERVICEMEN_COMPACT.forEach(id => console.log(`  ${id} (${id.length} znaków)`));

// Wizyty (bez źródła)
const VISITS_COMPACT = [
  "VIS25271001", // Wizyta w Rzeszowie
  "VIS25271002", // Dojazd do Jasła
  "VIS25271003", // Serwis w Krośnie
];

console.log("🏠 Wizyty:");
VISITS_COMPACT.forEach(id => console.log(`  ${id} (${id.length} znaków)`));

// Faktury (bez źródła)
const INVOICES_COMPACT = [
  "INV25271001", // FV pierwsza dzisiaj
  "INV25271002", // FV druga dzisiaj
  "INV25272001", // FV pierwsza jutro
];

console.log("🧾 Faktury:");
INVOICES_COMPACT.forEach(id => console.log(`  ${id} (${id.length} znaków)`));
console.log("");

// ========== PORÓWNANIE DŁUGOŚCI ==========
console.log("📏 PORÓWNANIE DŁUGOŚCI:");
console.log("Stary format:    ORD-A25271-001  (14 znaków)");
console.log("Nowy format:     ORDA25271001    (12 znaków)"); 
console.log("Oszczędność:     2 znaki na ID   (-14%)");
console.log("");

// ========== DEKODOWANIE ==========
console.log("🔍 PRZYKŁADY DEKODOWANIA:");

function decodeCompactId(id) {
  // Przykład: ORDA25271001
  const prefix = id.slice(0, 3); // ORD
  
  if (prefix === 'CLI' || prefix === 'EMP' || prefix === 'SRV' || 
      prefix === 'VIS' || prefix === 'INV' || prefix === 'APP') {
    // Bez źródła: CLI25271001
    const dateCode = id.slice(3, 8); // 25271
    const number = id.slice(8); // 001
    return { prefix, source: null, dateCode, number };
  } else {
    // Ze źródłem: ORDA25271001
    const source = id.slice(3, 4); // A
    const dateCode = id.slice(4, 9); // 25271
    const number = id.slice(9); // 001
    return { prefix, source, dateCode, number };
  }
}

const testIds = [
  "ORDA25271001", // Zamówienie AI
  "ORDM25271500", // 500. zamówienie Mobile
  "CLI25271001",  // Klient
  "VIS25271123",  // 123. wizyta
];

testIds.forEach(id => {
  const decoded = decodeCompactId(id);
  console.log(`${id} →`, decoded);
});
console.log("");

// ========== SKRAJNE PRZYPADKI ==========
console.log("🚀 SKRAJNE PRZYPADKI:");

// Rok przestępny - maksimum
console.log("Rok przestępny 2024 (366 dni):");
console.log("  ORDA24366999 ← 31.12.2024, 999. zamówienie AI");

// Maksimum zamówień w roku zwykłym
console.log("Rok zwykły 2025 (365 dni):");  
console.log("  ORDA25365999 ← 31.12.2025, 999. zamówienie AI");

// Przyszłość
console.log("Przyszłość 2099:");
console.log("  ORDA99365999 ← 31.12.2099, 999. zamówienie AI");
console.log("");

// ========== ANALITYKA ==========
console.log("📊 MOŻLIWOŚCI ANALITYCZNE:");

console.log("Łatwe zapytania SQL:");
console.log("  SELECT * FROM orders WHERE orderId LIKE 'ORDA25271%'  -- AI z dzisiaj");
console.log("  SELECT * FROM orders WHERE orderId LIKE 'ORD_252%'     -- Wszystkie z września"); 
console.log("  SELECT * FROM orders WHERE orderId LIKE 'ORDM%'        -- Wszystkie mobilne");
console.log("");

console.log("Grupowanie według źródła:");
console.log("  SELECT SUBSTR(orderId, 4, 1) as source, COUNT(*)"); 
console.log("  FROM orders WHERE orderId LIKE 'ORD_%'");
console.log("  GROUP BY source");
console.log("");

// ========== PODSUMOWANIE ==========
console.log("✅ PODSUMOWANIE SYSTEMU BEZ MYŚLNIKÓW:");
console.log("📦 Kompaktowość: 12 znaków vs 14 (-14%)");
console.log("🔢 Skalowalność: do 999 zamówień dziennie na źródło");
console.log("📅 Rok przestępny: pełne wsparcie (dzień 366)");
console.log("🎯 Sortowanie: naturalne sortowanie chronologiczne");
console.log("🔍 Dekodowanie: łatwe wyciągnięcie daty i źródła");
console.log("💾 Oszczędność: ~14% mniej miejsca w bazie danych");
console.log("⚡ Wydajność: szybsze porównania stringów");

module.exports = {
  getDayOfYear,
  encodeDateCode,
  decodeCompactId,
  CLIENTS_COMPACT,
  AI_ORDERS,
  MOBILE_ORDERS,
  WEB_ORDERS,  
  PHONE_ORDERS,
  EMAIL_ORDERS
};