/**
 * SYSTEM ID DLA 10,000+ ZLECEŃ + STARE ZLECENIA
 * 
 * PROBLEMY DO ROZWIĄZANIA:
 * 1. Więcej niż 999 zleceń dziennie (limit 3 cyfr)
 * 2. 6000 starych zleceń bez systemu - jak oznaczyć?
 * 3. Zlecenia dodane ręcznie przez admina
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

console.log("=== ROZWIĄZANIE PROBLEMU 10,000+ ZLECEŃ ===");
console.log("");

// ========== ROZWIĄZANIE 1: ROZSZERZENIE DO 4 CYFR ==========
console.log("🔧 ROZWIĄZANIE 1: 4 CYFRY NUMERACJI (do 9999 zleceń dziennie)");
console.log("Format: PREFIX[ŹRÓDŁO][DATECODE][XXXX]");
console.log("");

const EXTENDED_ORDERS = [
  "ORDA252710001", // 1. zamówienie AI (4 cyfry)
  "ORDA252710010", // 10. zamówienie AI
  "ORDA252710100", // 100. zamówienie AI
  "ORDA252711000", // 1000. zamówienie AI
  "ORDA252715000", // 5000. zamówienie AI
  "ORDA252719999", // 9999. zamówienie AI (maksimum)
];

console.log("📊 Przykłady z rozszerzoną numeracją:");
EXTENDED_ORDERS.forEach((id, index) => {
  const number = id.slice(9); // Ostatnie 4 cyfry
  console.log(`  ${id} → Nr: ${number} (${id.length} znaków)`);
});
console.log("");

// ========== ROZWIĄZANIE 2: STARE ZLECENIA (6000 sztuk) ==========
console.log("🔧 ROZWIĄZANIE 2: OZNACZENIE STARYCH ZLECEŃ");
console.log("Specjalny prefiks 'OLD' + timestamp/ID z bazy");
console.log("");

// Symulacja starych zleceń z twojej bazy danych
const OLD_ORDERS = [
  "OLD1751696099051", // Timestamp z orders.json
  "OLD1751696127520", // Drugi timestamp
  "OLD1751698731243", // Trzeci timestamp
  "OLD1751699697774", // Czwarty timestamp
  "OLD1751712010123", // Piąty timestamp
];

console.log("📜 Przykłady starych zleceń:");
OLD_ORDERS.forEach(id => {
  const timestamp = id.slice(3); // Usuń 'OLD'
  const date = new Date(parseInt(timestamp));
  console.log(`  ${id} → ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
});
console.log("");

// ========== ROZWIĄZANIE 3: ZLECENIA RĘCZNE ==========
console.log("🔧 ROZWIĄZANIE 3: ZLECENIA DODANE RĘCZNIE");
console.log("Specjalne źródło 'R' (Ręczne/Manual)");
console.log("");

const MANUAL_ORDERS = [
  "ORDR252710001", // Ręczne dzisiaj #1
  "ORDR252710002", // Ręczne dzisiaj #2  
  "ORDR252720001", // Ręczne jutro #1
];

console.log("✋ Przykłady zleceń ręcznych:");
MANUAL_ORDERS.forEach(id => {
  console.log(`  ${id} → Dodane ręcznie przez admina`);
});
console.log("");

// ========== KOMPLETNY SYSTEM ŹRÓDEŁ ==========
console.log("📋 KOMPLETNY SYSTEM ŹRÓDEŁ:");
const SOURCES = {
  'A': 'AI Assistant',
  'M': 'Mobile/Serwisant', 
  'W': 'Website/Formularz',
  'T': 'Telefon/Call Center',
  'E': 'Email/Poczta',
  'R': 'Ręczne/Manual (Admin)',
  'OLD': 'Stare zlecenia (przed systemem)'
};

Object.entries(SOURCES).forEach(([code, name]) => {
  console.log(`  ${code} = ${name}`);
});
console.log("");

// ========== PRZYKŁADY WSZYSTKICH TYPÓW ==========
console.log("🎯 PRZYKŁADY WSZYSTKICH TYPÓW ZLECEŃ:");

// Dzisiaj z różnymi źródłami (4 cyfry)
const TODAY_EXAMPLES = [
  { id: "ORDA252710001", desc: "1. AI dzisiaj" },
  { id: "ORDA252715000", desc: "5000. AI dzisiaj" },
  { id: "ORDM252710500", desc: "500. Mobile dzisiaj" },
  { id: "ORDW252712000", desc: "2000. Website dzisiaj" },
  { id: "ORDT252710100", desc: "100. Telefon dzisiaj" },
  { id: "ORDE252710050", desc: "50. Email dzisiaj" },
  { id: "ORDR252710010", desc: "10. Ręczne dzisiaj" },
  { id: "OLD1751696099051", desc: "Stare z 5 lipca 2025" }
];

TODAY_EXAMPLES.forEach(example => {
  console.log(`  ${example.id} ← ${example.desc}`);
});
console.log("");

// ========== FUNKCJA DEKODOWANIA ROZSZERZONA ==========
console.log("🔍 ROZSZERZONA FUNKCJA DEKODOWANIA:");

function decodeExtendedId(id) {
  // Stare zlecenia
  if (id.startsWith('OLD')) {
    const timestamp = id.slice(3);
    const date = new Date(parseInt(timestamp));
    return {
      type: 'legacy',
      prefix: 'OLD',
      originalId: timestamp,
      date: date,
      isLegacy: true
    };
  }
  
  // Nowe zlecenia z ORD
  if (id.startsWith('ORD')) {
    const source = id[3]; // A, M, W, T, E, R
    const dateCode = id.slice(4, 9); // 25271
    const number = id.slice(9); // 0001 lub 001
    
    return {
      type: 'new',
      prefix: 'ORD',
      source: source,
      sourceName: SOURCES[source] || 'Nieznane',
      dateCode: dateCode,
      number: number,
      isLegacy: false
    };
  }
  
  // Inne typy (CLI, EMP, etc.)
  return {
    type: 'other',
    prefix: id.slice(0, 3),
    dateCode: id.slice(3, 8),
    number: id.slice(8)
  };
}

// Testy dekodowania
const TEST_IDS = [
  "ORDA252715000",      // Nowe AI
  "ORDR252710010",      // Ręczne
  "OLD1751696099051",   // Stare
  "CLI252710001"        // Klient
];

console.log("");
TEST_IDS.forEach(id => {
  const decoded = decodeExtendedId(id);
  console.log(`${id} →`, JSON.stringify(decoded, null, 2));
  console.log("");
});

// ========== MIGRACJA STARYCH DANYCH ==========
console.log("📦 PLAN MIGRACJI STARYCH 6000 ZLECEŃ:");
console.log("");

// Przykłady z twojej bazy orders.json
const MIGRATION_EXAMPLES = [
  {
    old: { id: 1751696099051, clientId: "#0001", dateAdded: "2025-07-05T06:14:59.051Z" },
    new: "OLD1751696099051"
  },
  {
    old: { id: 1751696127520, clientId: "#0002", dateAdded: "2025-07-05T06:15:27.520Z" },
    new: "OLD1751696127520"  
  },
  {
    old: { id: 1751698731243, clientId: "#0003", dateAdded: "2025-07-05T06:58:51.243Z" },
    new: "OLD1751698731243"
  }
];

console.log("🔄 Przykłady migracji:");
MIGRATION_EXAMPLES.forEach((example, index) => {
  const oldDate = new Date(example.old.dateAdded);
  console.log(`${index + 1}. Stare: ID=${example.old.id}, Data=${oldDate.toLocaleDateString()}`);
  console.log(`   Nowe: ${example.new}`);
  console.log("");
});

// ========== MAKSYMALNE MOŻLIWOŚCI ==========
console.log("📈 MAKSYMALNE MOŻLIWOŚCI SYSTEMU:");
console.log("");

const MAX_CAPACITIES = [
  { source: "AI (A)", daily: 9999, yearly: 9999 * 365 },
  { source: "Mobile (M)", daily: 9999, yearly: 9999 * 365 },
  { source: "Website (W)", daily: 9999, yearly: 9999 * 365 },
  { source: "Telefon (T)", daily: 9999, yearly: 9999 * 365 },
  { source: "Email (E)", daily: 9999, yearly: 9999 * 365 },
  { source: "Ręczne (R)", daily: 9999, yearly: 9999 * 365 },
];

let totalDaily = 0;
let totalYearly = 0;

MAX_CAPACITIES.forEach(cap => {
  totalDaily += cap.daily;
  totalYearly += cap.yearly;
  console.log(`📊 ${cap.source}: ${cap.daily.toLocaleString()} dziennie, ${cap.yearly.toLocaleString()} rocznie`);
});

console.log("");
console.log(`🎯 ŁĄCZNIE: ${totalDaily.toLocaleString()} zleceń dziennie`);
console.log(`🎯 ŁĄCZNIE: ${totalYearly.toLocaleString()} zleceń rocznie`);
console.log(`🎯 PLUS: Nieograniczona liczba starych zleceń (OLD prefix)`);
console.log("");

// ========== ZAPYTANIA SQL ==========
console.log("💾 PRZYKŁADY ZAPYTAŃ SQL:");
console.log("");

const SQL_EXAMPLES = [
  "-- Wszystkie nowe zlecenia AI z dzisiaj",
  "SELECT * FROM orders WHERE orderId LIKE 'ORDA25271%';",
  "",
  "-- Stare zlecenia (przed systemem)", 
  "SELECT * FROM orders WHERE orderId LIKE 'OLD%';",
  "",
  "-- Zlecenia ręczne",
  "SELECT * FROM orders WHERE orderId LIKE 'ORDR%';",
  "",
  "-- Wszystkie zlecenia z września 2025",
  "SELECT * FROM orders WHERE orderId LIKE 'ORD_252%' OR orderId LIKE 'OLD%';",
  "",
  "-- Statystyki według źródła (tylko nowe)",
  "SELECT ",
  "  SUBSTR(orderId, 4, 1) as source,",
  "  COUNT(*) as count",
  "FROM orders ", 
  "WHERE orderId LIKE 'ORD_%'",
  "GROUP BY source;",
];

SQL_EXAMPLES.forEach(line => console.log(line));
console.log("");

// ========== PODSUMOWANIE ==========
console.log("✅ PODSUMOWANIE ROZSZERZONEGO SYSTEMU:");
console.log("🔢 Nowe zlecenia: do 59,994 dziennie (6 źródeł × 9999)");
console.log("📜 Stare zlecenia: prefix OLD + timestamp (6000 istniejących)");
console.log("✋ Ręczne zlecenia: źródło R (admin panel)");
console.log("📅 Pełne wsparcie lat przestępnych");
console.log("🎯 Łatwe filtrowanie i grupowanie");
console.log("💾 Kompatybilność z istniejącymi danymi");
console.log("⚡ Oszczędność miejsca vs tradycyjne UUID");

module.exports = {
  getDayOfYear,
  encodeDateCode,
  decodeExtendedId,
  SOURCES,
  EXTENDED_ORDERS,
  OLD_ORDERS,
  MANUAL_ORDERS
};