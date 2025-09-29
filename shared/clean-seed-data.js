/**
 * FUNKCJE POMOCNICZE DLA DANYCH TESTOWYCH
 * 
 * Automatyczne generowanie dat, ID i innych pól które 
 * normalnie są zarządzane przez bazę danych
 */

// ========== GENERATORY DAT ==========

/**
 * Generuje datę w przeszłości (dla createdAt)
 * @param {number} daysAgo - ile dni temu
 * @param {number} hoursAgo - ile godzin temu (opcjonalnie)
 * @returns {string} ISO date string
 */
function generatePastDate(daysAgo = 0, hoursAgo = 0) {
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);
  now.setHours(now.getHours() - hoursAgo);
  return now.toISOString();
}

/**
 * Generuje datę w przyszłości (dla scheduledDate)
 * @param {number} daysAhead - ile dni do przodu
 * @param {number} hour - godzina (0-23)
 * @param {number} minute - minuta (0-59)
 * @returns {string} ISO date string
 */
function generateFutureDate(daysAhead = 1, hour = 9, minute = 0) {
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);
  future.setHours(hour, minute, 0, 0);
  return future.toISOString();
}

/**
 * Generuje dzisiejszą datę o określonej godzinie
 * @param {number} hour - godzina (0-23)
 * @param {number} minute - minuta (0-59)
 * @returns {string} ISO date string
 */
function generateTodayDate(hour = 9, minute = 0) {
  const today = new Date();
  today.setHours(hour, minute, 0, 0);
  return today.toISOString();
}

// ========== COUNTERY ID ==========
let counters = {
  clients: 0,
  orders: 0,
  employees: 0,
  servicemen: 0,
  visits: 0,
  visit_orders: 0,
  appointments: 0,
  inventory: 0,
  invoices: 0,
  notifications: 0
};

/**
 * Generuje następny ID dla tabeli (dla danych testowych)
 * @param {string} table - nazwa tabeli
 * @returns {number} następny numer ID
 */
function getNextTestId(table) {
  counters[table] = (counters[table] || 0) + 1;
  return counters[table];
}

/**
 * Resetuje countery (przydatne do testów)
 */
function resetCounters() {
  Object.keys(counters).forEach(key => {
    counters[key] = 0;
  });
}

// ========== AUTOMATYCZNE POLA ==========

/**
 * Dodaje automatyczne pola do obiektu danych
 * @param {object} data - dane obiektu
 * @param {string} table - nazwa tabeli
 * @param {object} options - opcje (daysAgo, futureDate)
 * @returns {object} dane z automatycznymi polami
 */
function addAutoFields(data, table, options = {}) {
  const result = { ...data };
  
  // Automatyczne ID
  result.id = getNextTestId(table);
  
  // CreatedAt - domyślnie teraz, ale można ustawić w przeszłości
  const daysAgo = options.createdDaysAgo || 0;
  const hoursAgo = options.createdHoursAgo || 0;
  result.createdAt = generatePastDate(daysAgo, hoursAgo);
  
  // UpdatedAt - domyślnie to samo co createdAt
  result.updatedAt = options.updatedAt || result.createdAt;
  
  return result;
}

// ========== PRZYKŁADY ZASTOSOWANIA ==========

const CLEAN_SEED_DATA = {
  
  // ========== KLIENCI ==========
  clients: [
    addAutoFields({
      clientId: "CLI-001",
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan.kowalski@email.com",
      phone: "+48 123 456 789",
      address: "ul. Krakowska 15",
      city: "Kraków",
      postalCode: "31-066",
      customerType: "individual",
      preferredContact: "phone",
      allowNotifications: true,
      isActive: true,
      loyaltyPoints: 50
    }, 'clients', { createdDaysAgo: 30 }),

    addAutoFields({
      clientId: "CLI-002", 
      firstName: "Anna",
      lastName: "Nowak",
      email: "biuro@firma.pl",
      phone: "+48 987 654 321",
      address: "ul. Słowackiego 25/3",
      city: "Kraków", 
      postalCode: "31-123",
      company: "Firma ABC Sp. z o.o.",
      nip: "123-456-78-90",
      customerType: "business",
      preferredContact: "email",
      allowNotifications: true,
      allowSMS: true,
      isActive: true,
      loyaltyPoints: 120
    }, 'clients', { createdDaysAgo: 15 })
  ],

  // ========== ZLECENIA ==========
  orders: [
    addAutoFields({
      orderId: "ORD-001",
      orderNumber: "SRV-2024-001",
      clientId: 1, // Jan Kowalski
      employeeId: 1, // zostanie przypisane
      deviceType: "laptop",
      brand: "Lenovo",
      model: "ThinkPad T490",
      serialNumber: "PC123456",
      serviceType: "repair", 
      category: "hardware",
      problemDescription: "Laptop nie uruchamia się, czarny ekran po włączeniu",
      status: "pending",
      priority: "medium",
      estimatedCost: 250.00,
      isUrgent: false,
      requiresPickup: true,
      requiresDelivery: true
    }, 'orders', { createdDaysAgo: 5 }),

    addAutoFields({
      orderId: "ORD-002",
      orderNumber: "SRV-2024-002", 
      clientId: 2, // Firma ABC
      employeeId: 2,
      deviceType: "printer",
      brand: "HP",
      model: "LaserJet Pro M404dn",
      serialNumber: "HP789012",
      serviceType: "maintenance",
      category: "hardware", 
      problemDescription: "Rutynowa konserwacja drukarki - wymiana toneru i czyszczenie",
      status: "in_progress",
      priority: "low",
      estimatedCost: 150.00,
      diagnosis: "Wymiana toneru i czyszczenie mechanizmu podawania papieru",
      isUrgent: false,
      requiresPickup: false,
      requiresDelivery: false
    }, 'orders', { createdDaysAgo: 3 })
  ],

  // ========== PRACOWNICY ==========
  employees: [
    addAutoFields({
      employeeId: "EMP-001",
      firstName: "Piotr",
      lastName: "Serwisant", 
      email: "piotr@serwis.pl",
      phone: "+48 111 222 333",
      position: "Starszy Technik",
      department: "Serwis",
      specializations: ["laptopy", "drukarki", "sieci"],
      isActive: true,
      canAccessMobile: true,
      permissions: {
        canManageOrders: true,
        canManageClients: false,
        canViewReports: true,
        canManageInventory: true
      }
    }, 'employees', { createdDaysAgo: 90 }),

    addAutoFields({
      employeeId: "EMP-002",
      firstName: "Katarzyna",
      lastName: "Admin",
      email: "admin@serwis.pl", 
      phone: "+48 444 555 666",
      position: "Administrator Systemu",
      department: "IT",
      specializations: ["system", "bazy_danych", "bezpieczenstwo"],
      isActive: true,
      canAccessMobile: true,
      permissions: {
        canManageOrders: true,
        canManageClients: true,
        canViewReports: true,
        canManageEmployees: true,
        canManageInventory: true
      }
    }, 'employees', { createdDaysAgo: 180 })
  ],

  // ========== CZĘŚCI MAGAZYNOWE ==========
  inventory: [
    addAutoFields({
      itemId: "ITM-001",
      partNumber: "RAM-DDR4-8GB-001",
      name: "RAM DDR4 8GB",
      description: "Pamięć RAM DDR4 8GB 2400MHz",
      category: "Pamięć RAM",
      brand: "Kingston",
      model: "KVR24N17S8/8",
      quantity: 15,
      minQuantity: 5,
      maxQuantity: 50,
      reservedQuantity: 2,
      purchasePrice: 120.00,
      sellPrice: 180.00,
      isActive: true
    }, 'inventory', { createdDaysAgo: 60 }),

    addAutoFields({
      itemId: "ITM-002", 
      partNumber: "SSD-256GB-001",
      name: "SSD 256GB",
      description: "Dysk SSD 256GB SATA III",
      category: "Dyski",
      brand: "Samsung",
      model: "860 EVO 256GB",
      quantity: 8,
      minQuantity: 3,
      maxQuantity: 30,
      reservedQuantity: 1,
      purchasePrice: 200.00,
      sellPrice: 280.00,
      isActive: true
    }, 'inventory', { createdDaysAgo: 45 })
  ],

  // ========== SERWISANCI ==========
  servicemen: [
    addAutoFields({
      servicemanId: "SRV-001",
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan.kowalski@techserwis.pl",
      phone: "+48 123 456 789",
      primaryClientId: 1, // Szkoła
      specializations: ["laptopy", "drukarki", "sieci", "projektory"],
      isActive: true,
      workingHours: {
        monday: { start: "08:00", end: "16:00", available: true },
        tuesday: { start: "08:00", end: "16:00", available: true },
        wednesday: { start: "08:00", end: "16:00", available: true },
        thursday: { start: "08:00", end: "16:00", available: true },
        friday: { start: "08:00", end: "15:00", available: true },
        saturday: { start: "00:00", end: "00:00", available: false },
        sunday: { start: "00:00", end: "00:00", available: false }
      },
      emergencyPhone: "+48 987 654 321",
      canAccessMobile: true,
      notes: "Doświadczony serwisant, specjalizuje się w infrastrukturze IT dla szkół."
    }, 'servicemen', { createdDaysAgo: 120 })
  ],

  // ========== WIZYTY SERWISANTA ==========
  serviceman_visits: [
    addAutoFields({
      visitNumber: "VIS-2024-001",
      servicemanId: 1,
      clientId: 1, 
      scheduledDate: generateFutureDate(1, 9, 0), // jutro o 9:00
      estimatedDuration: 180,
      status: "scheduled",
      clientAddress: "ul. Szkolna 15, 31-123 Kraków",
      coordinates: { lat: 50.0647, lng: 19.9450 },
      visitType: "routine",
      description: "Comiesięczny przegląd i konserwacja sprzętu IT w szkole",
      totalCost: 0,
      laborCost: 0,
      partsCost: 0,
      photos: [],
      documents: []
    }, 'visits', { createdDaysAgo: 7 }),

    addAutoFields({
      visitNumber: "VIS-2024-002",
      servicemanId: 1,
      clientId: 1,
      scheduledDate: generatePastDate(3, 14), // 3 dni temu o 14:00
      estimatedDuration: 90,
      actualStartTime: generatePastDate(3, 14, 5),
      actualEndTime: generatePastDate(3, 15, 45),
      actualDuration: 100,
      status: "completed",
      clientAddress: "ul. Szkolna 15, 31-123 Kraków",
      coordinates: { lat: 50.0647, lng: 19.9450 },
      visitType: "emergency",
      description: "Awaria sieci w pracowni komputerowej - brak internetu",
      summary: "Wymieniony został uszkodzony switch sieciowy. Przywrócono połączenie internetowe.",
      nextVisitRecommended: true,
      nextVisitDate: generateFutureDate(21), // za 3 tygodnie
      totalCost: 350.00,
      laborCost: 200.00,
      partsCost: 150.00,
      clientRating: 5,
      clientFeedback: "Bardzo szybka i profesjonalna pomoc. Polecam!"
    }, 'visits', { createdDaysAgo: 3 })
  ]
};

module.exports = {
  // Funkcje pomocnicze
  generatePastDate,
  generateFutureDate,
  generateTodayDate,
  getNextTestId,
  resetCounters,
  addAutoFields,
  
  // Czyste dane bez duplikowania dat
  CLEAN_SEED_DATA
};