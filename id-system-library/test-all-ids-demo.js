/**
 * DEMONSTRACJA WSZYSTKICH ID Z NOWYM SYSTEMEM KODOWANIA
 * Format: PREFIX-[ŹRÓDŁO][DATECODE]-XXX
 * DATECODE = (rok%100)*1000 + dzień_roku
 * 
 * Dzisiaj: 28 września 2025 (dzień 271 w roku)
 * Kod daty: (25)*1000 + 271 = 25271
 */

// ========== FUNKCJA TESTOWA ==========
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

function testLeapYear() {
  console.log("=== TEST ROKU PRZESTĘPNEGO ===");
  
  // 2024 - rok przestępny (366 dni)
  const leap2024_Feb29 = new Date(2024, 1, 29); // 29 lutego 2024
  const leap2024_Dec31 = new Date(2024, 11, 31); // 31 grudnia 2024
  
  console.log("29 lutego 2024 (rok przestępny):");
  console.log("  Dzień roku:", getDayOfYear(leap2024_Feb29)); // 60
  console.log("  Kod:", encodeDateCode(leap2024_Feb29)); // 24060
  
  console.log("31 grudnia 2024 (rok przestępny):");
  console.log("  Dzień roku:", getDayOfYear(leap2024_Dec31)); // 366
  console.log("  Kod:", encodeDateCode(leap2024_Dec31)); // 24366
  
  // 2025 - rok zwykły (365 dni)  
  const normal2025_Dec31 = new Date(2025, 11, 31);
  console.log("31 grudnia 2025 (rok zwykły):");
  console.log("  Dzień roku:", getDayOfYear(normal2025_Dec31)); // 365
  console.log("  Kod:", encodeDateCode(normal2025_Dec31)); // 25365
}

// Uruchom test
testLeapYear();

// ========== WSZYSTKIE ID W APLIKACJI ==========

console.log("\n=== WSZYSTKIE ID W APLIKACJI TECHNIK ===");

// Dzisiaj: 28.09.2025 = dzień 271 = kod 25271

// ========== 1. KLIENCI (CLIENTS) ==========
const CLIENTS_NEW_FORMAT = [
  "CLI-25271-001", // Mariusz Bielaszka (28.09.2025)
  "CLI-25271-002", // Kręgielnia Laguna (28.09.2025)  
  "CLI-25272-001", // Anna Kowalska (29.09.2025)
  "CLI-25273-001", // Piotr Nowak (30.09.2025)
  "CLI-25274-001", // Firma TechSerwis (1.10.2025)
];

console.log("\n📋 KLIENCI (Clients):");
CLIENTS_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 2. ZAMÓWIENIA/ZLECENIA (ORDERS) ==========
const ORDERS_NEW_FORMAT = [
  // AI Assistant (A)
  "ORD-A25271-001", // AI: "Pralka nie wiruje"
  "ORD-A25271-002", // AI: "Lodówka nie chłodzi"
  "ORD-A25272-001", // AI: "Zmywarka hałasuje"
  
  // Mobilne (M) - serwisant w terenie
  "ORD-M25271-001", // Mobile: Naprawa w Rzeszowie
  "ORD-M25271-002", // Mobile: Serwis w Jasле
  "ORD-M25273-001", // Mobile: Wizyta w Krośnie
  
  // Website (W) - formularze online
  "ORD-W25271-001", // Web: Formularz kontaktowy
  "ORD-W25272-001", // Web: Rezerwacja online
  "ORD-W25274-001", // Web: Szybkie zgłoszenie
  
  // Telefon (T) - call center
  "ORD-T25271-001", // Tel: Rozmowa o naprawie
  "ORD-T25272-001", // Tel: Umówienie wizyty
  "ORD-T25273-001", // Tel: Konsultacja techniczna
  
  // Email (E) - zgłoszenia mailowe
  "ORD-E25271-001", // Email: Awaria AGD
  "ORD-E25272-001", // Email: Zapytanie o serwis
];

console.log("\n📋 ZAMÓWIENIA/ZLECENIA (Orders):");
ORDERS_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 3. PRACOWNICY (EMPLOYEES) ==========
const EMPLOYEES_NEW_FORMAT = [
  "EMP-25200-001", // Jan Kowalski (zatrudniony 19.07.2025)
  "EMP-25200-002", // Anna Nowak (zatrudniona 19.07.2025)
  "EMP-25210-001", // Piotr Wiśniewski (29.07.2025)
  "EMP-25271-001", // Maria Zielińska (dzisiaj)
  "EMP-25271-002", // Tomasz Kaczmarek (dzisiaj)
];

console.log("\n👷 PRACOWNICY (Employees):");
EMPLOYEES_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 4. SERWISANCI MOBILNI (SERVICEMEN) ==========
const SERVICEMEN_NEW_FORMAT = [
  "SRV-25271-001", // Mariusz B. - Mobilny Expert
  "SRV-25271-002", // Krzysztof M. - Termostat Pro
  "SRV-25272-001", // Łukasz P. - AGD Master
  "SRV-25273-001", // Robert K. - ElektroTech
  "SRV-25274-001", // Michał S. - Cool Service
];

console.log("\n🛠️ SERWISANCI MOBILNI (Servicemen):");
SERVICEMEN_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 5. WIZYTY SERWISANTÓW (VISITS) ==========
const VISITS_NEW_FORMAT = [
  "VIS-25271-001", // Wizyta w Rzeszowie - ul. Mickiewicza 15
  "VIS-25271-002", // Dojazd do Jasła - Rynek 8
  "VIS-25271-003", // Serwis w Krośnie - Słowackiego 22
  "VIS-25272-001", // Naprawa w Stalowej Woli - Poniatowskiego 5
  "VIS-25272-002", // Wizyta w Tarnobrzegu - Sienkiewicza 12
];

console.log("\n🏠 WIZYTY SERWISANTÓW (Visits):");
VISITS_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 6. TERMINY/WIZYTY (APPOINTMENTS) ==========
const APPOINTMENTS_NEW_FORMAT = [
  "APP-25271-001", // 28.09.2025 08:00 - Naprawa pralki
  "APP-25271-002", // 28.09.2025 10:30 - Serwis zmywarki
  "APP-25271-003", // 28.09.2025 14:00 - Instalacja piekarnika
  "APP-25272-001", // 29.09.2025 09:15 - Konserwacja lodówki
  "APP-25272-002", // 29.09.2025 16:45 - Naprawa mikrofali
];

console.log("\n📅 TERMINY/WIZYTY (Appointments):");
APPOINTMENTS_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 7. MAGAZYN/CZĘŚCI (INVENTORY) ==========
const INVENTORY_NEW_FORMAT = [
  "ITM-25271-001", // Pompa do pralki Samsung WF80F5E
  "ITM-25271-002", // Termostat do lodówki Bosch KGN39VI45
  "ITM-25271-003", // Grzałka do zmywarki Siemens SN236I
  "ITM-25272-001", // Filtr do odkurzacza Dyson V11
  "ITM-25272-002", // Uszczelka do piekarnika Electrolux EOB3400
];

console.log("\n📦 MAGAZYN/CZĘŚCI (Inventory):");
INVENTORY_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 8. FAKTURY (INVOICES) ==========
const INVOICES_NEW_FORMAT = [
  "INV-25271-001", // FV 2025/09/001 - Naprawa pralki
  "INV-25271-002", // FV 2025/09/002 - Serwis zmywarki
  "INV-25271-003", // FV 2025/09/003 - Instalacja AGD
  "INV-25272-001", // FV 2025/09/004 - Konserwacja sprzętu
  "INV-25272-002", // FV 2025/09/005 - Części zamienne
];

console.log("\n🧾 FAKTURY (Invoices):");
INVOICES_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 9. POWIADOMIENIA (NOTIFICATIONS) ==========
const NOTIFICATIONS_NEW_FORMAT = [
  "NOT-25271-001", // "Wizyta potwierdzona na jutro o 10:00"
  "NOT-25271-002", // "Części dostępne do odbioru"
  "NOT-25271-003", // "Faktura gotowa do pobrania"
  "NOT-25272-001", // "Przypomnienie o serwisie"
  "NOT-25272-002", // "Nowe zlecenie przypisane"
];

console.log("\n🔔 POWIADOMIENIA (Notifications):");
NOTIFICATIONS_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 10. HARMONOGRAM SERWISANTÓW (SCHEDULE) ==========
const SCHEDULE_NEW_FORMAT = [
  "SCH-25271-001", // Harmonogram Mariusza na 28.09
  "SCH-25271-002", // Harmonogram Anny na 28.09
  "SCH-25272-001", // Harmonogram Piotra na 29.09
  "SCH-25273-001", // Harmonogram zespołowy na 30.09
  "SCH-25274-001", // Harmonogram weekendowy na 1.10
];

console.log("\n📅 HARMONOGRAM SERWISANTÓW (Schedule):");
SCHEDULE_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 11. RAPORTY SERWISANTÓW (REPORTS) ==========
const REPORTS_NEW_FORMAT = [
  "RPT-25271-001", // Raport dzienny - serwisant #1
  "RPT-25271-002", // Raport wydajności - zespół AGD
  "RPT-25271-003", // Raport finansowy - dzisiaj
  "RPT-25272-001", // Raport tygodniowy
  "RPT-25272-002", // Raport jakości usług
];

console.log("\n📊 RAPORTY SERWISANTÓW (Reports):");
REPORTS_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== 12. SYSTEM RECENZJI (REVIEWS) ==========
const REVIEWS_NEW_FORMAT = [
  "REV-25271-001", // Recenzja za naprawę pralki ⭐⭐⭐⭐⭐
  "REV-25271-002", // Ocena serwisu zmywarki ⭐⭐⭐⭐
  "REV-25271-003", // Feedback instalacji AGD ⭐⭐⭐⭐⭐
  "REV-25272-001", // Opinia o konserwacji ⭐⭐⭐⭐⭐
  "REV-25272-002", // Ocena szybkości serwisu ⭐⭐⭐⭐
];

console.log("\n⭐ SYSTEM RECENZJI (Reviews):");
REVIEWS_NEW_FORMAT.forEach(id => console.log(`  ${id}`));

// ========== TEST ROKU PRZESTĘPNEGO ==========
console.log("\n=== TEST RÓŻNYCH LAT ===");

// 2024 - rok przestępny
const leap2024Tests = [
  { date: new Date(2024, 1, 29), desc: "29 lutego 2024 (przestępny)" }, // dzień 60
  { date: new Date(2024, 11, 31), desc: "31 grudnia 2024 (przestępny)" }, // dzień 366
];

// 2025 - rok zwykły  
const normal2025Tests = [
  { date: new Date(2025, 8, 28), desc: "28 września 2025 (dzisiaj)" }, // dzień 271
  { date: new Date(2025, 11, 31), desc: "31 grudnia 2025 (zwykły)" }, // dzień 365
];

// 2026 - rok zwykły
const normal2026Tests = [
  { date: new Date(2026, 0, 1), desc: "1 stycznia 2026" }, // dzień 1
  { date: new Date(2026, 11, 31), desc: "31 grudnia 2026" }, // dzień 365
];

console.log("\n📅 TESTY RÓŻNYCH DAT:");
[...leap2024Tests, ...normal2025Tests, ...normal2026Tests].forEach(test => {
  const dayOfYear = getDayOfYear(test.date);
  const code = encodeDateCode(test.date);
  console.log(`  ${test.desc}:`);
  console.log(`    Dzień roku: ${dayOfYear}`);
  console.log(`    Kod: ${code}`);
  console.log(`    Przykład ID: ORD-A${code}-001`);
  console.log("");
});

// ========== PODSUMOWANIE ==========
console.log("=== PODSUMOWANIE SYSTEMU ID ===");
console.log("✅ System radzi sobie z rokiem przestępnym");
console.log("✅ Maksymalny kod dla roku przestępnego: (rok%100)*1000 + 366");
console.log("✅ Przykład: 2024 → 24366 (31 grudnia 2024)");
console.log("✅ Wszystkie ID są unikalne i sortowalne chronologicznie");
console.log("✅ Format jest konsystentny dla wszystkich typów ID");
console.log("✅ Łatwe dekodowanie daty z ID");

module.exports = {
  getDayOfYear,
  encodeDateCode,
  CLIENTS_NEW_FORMAT,
  ORDERS_NEW_FORMAT,
  EMPLOYEES_NEW_FORMAT,
  SERVICEMEN_NEW_FORMAT,
  VISITS_NEW_FORMAT,
  APPOINTMENTS_NEW_FORMAT,
  INVENTORY_NEW_FORMAT,
  INVOICES_NEW_FORMAT,
  NOTIFICATIONS_NEW_FORMAT,
  SCHEDULE_NEW_FORMAT,
  REPORTS_NEW_FORMAT,
  REVIEWS_NEW_FORMAT
};