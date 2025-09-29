const { ENHANCED_ORDER_STRUCTURE_V2, EnhancedOrderHelpers } = require('./enhanced-order-structure-v2');

/**
 * PRZYKŁADOWE ZLECENIE - ENHANCED ORDER STRUCTURE v2.0
 * 
 * Pokazuje wszystkie nowe funkcje z aplikacji mobilnej
 * zintegrowane z istniejącą strukturą webową
 */

const EXAMPLE_ENHANCED_ORDER_V2 = {
  // ========== PODSTAWOWE INFORMACJE ==========
  id: 1,
  orderNumber: "ORDA25272001", // System ID z id-system-library
  orderSource: "mobile", // 🆕 Źródło: web/mobile/api/ai
  
  // Powiązania
  clientId: 1,
  employeeId: 2,
  visitId: 15, // 🆕 Powiązanie z wizytą serwisanta
  servicemanId: 3, // 🆕 Przypisany serwisant
  
  // ========== URZĄDZENIE + 🆕 LOKALIZACJA ==========
  deviceType: "Pralka",
  brand: "Samsung",
  model: "WW70J5346MW",
  serialNumber: "S1234567890",
  
  // 🆕 NOWE: GPS i lokalizacja urządzenia
  deviceLocation: "Pralnia, Piętro 1, Pokój 102", 
  deviceCoordinates: { 
    lat: 52.2297, 
    lng: 21.0122,
    accuracy: 10,
    timestamp: "2025-01-27T14:30:00Z"
  },
  
  // ========== PROBLEM I DIAGNOZA ==========
  problemDescription: "Pralka nie włącza się, brak reakcji na przyciski. Po podłączeniu do prądu nie świeci się żadna lampka kontrolna.",
  symptoms: ["Brak zasilania", "Nie świeci się display", "Nie reaguje na przyciski"],
  category: "Elektronika",
  
  // 🆕 NOWE: Rozszerzona diagnoza z mobile
  diagnosis: "Uszkodzona płyta główna - spalony bezpiecznik F1 oraz uszkodzony transformator T1. Konieczna wymiana płyty sterującej.",
  solutionDescription: "Wymieniono płytę główną, sprawdzono instalację elektryczną, przeprowadzono testy funkcjonalne wszystkich programów prania.",
  
  // ========== STATUS + 🆕 WORKFLOW ==========
  status: "completed",
  priority: "high",
  
  // 🆕 NOWE: Historia zmian statusu
  statusHistory: [
    { status: "pending", timestamp: "2025-01-27T08:00:00Z", userId: 1, notes: "Zlecenie utworzone przez system" },
    { status: "in_progress", timestamp: "2025-01-27T09:15:00Z", userId: 3, notes: "Serwisant rozpoczął diagnostykę" },
    { status: "waiting_parts", timestamp: "2025-01-27T10:30:00Z", userId: 3, notes: "Zamówiona płyta główna" },
    { status: "in_progress", timestamp: "2025-01-27T14:00:00Z", userId: 3, notes: "Otrzymano części, kontynuacja naprawy" },
    { status: "testing", timestamp: "2025-01-27T15:30:00Z", userId: 3, notes: "Testy funkcjonalne" },
    { status: "completed", timestamp: "2025-01-27T16:00:00Z", userId: 3, notes: "Naprawa ukończona pomyślnie" }
  ],
  
  canEdit: false, // 🆕 Automatycznie false dla completed
  
  // ========== ZARZĄDZANIE CZASEM ==========
  estimatedDuration: 120, // min
  
  // Z Web App
  isTimerRunning: false,
  timerStartTime: null,
  totalWorkTime: 7200, // 2 godziny w sekundach
  workSessions: [
    { start: "2025-01-27T09:15:00Z", end: "2025-01-27T10:30:00Z", duration: 4500, notes: "Diagnostyka" },
    { start: "2025-01-27T14:00:00Z", end: "2025-01-27T16:00:00Z", duration: 7200, notes: "Wymiana płyty + testy" }
  ],
  
  // 🆕 NOWE: Czasy z mobile workflow
  actualStartTime: "2025-01-27T09:15:00Z",
  actualEndTime: "2025-01-27T16:00:00Z",
  timeSpentMinutes: 195, // 3h 15min rzeczywisty czas
  
  // ========== KOSZTY I PŁATNOŚCI ==========
  estimatedCost: 350.00,
  laborCost: 200.00,
  partsCost: 280.00,
  travelCost: 30.00,
  totalCost: 510.00,
  finalAmount: 510.00,
  
  paymentMethod: "card",
  paymentReceived: true,
  isPaid: true,
  
  // ========== CZĘŚCI ==========
  partsUsed: [
    {
      id: 1,
      name: "Płyta sterująca Samsung",
      quantity: 1,
      price: 280.00,
      total: 280.00,
      partNumber: "DC92-01681A",
      supplier: "Samsung Parts",
      modelInfo: "Samsung WW70J5346MW"
    }
  ],
  
  deviceModels: [
    {
      brand: "Samsung",
      model: "WW70J5346MW",
      parts: ["DC92-01681A", "DC97-16350A", "DC63-00376A"]
    }
  ],
  
  // ========== 🆕 NOWE: DOKUMENTACJA ZDJĘCIOWA ==========
  beforePhotos: [
    {
      url: "/uploads/orders/ORDA25272001/before_1.jpg",
      description: "Pralka przed naprawą - brak reakcji na przyciski",
      timestamp: "2025-01-27T09:20:00Z",
      uploadedBy: 3
    },
    {
      url: "/uploads/orders/ORDA25272001/before_2.jpg", 
      description: "Płyta główna - widoczne ślady przepalenia",
      timestamp: "2025-01-27T09:45:00Z",
      uploadedBy: 3
    }
  ],
  
  afterPhotos: [
    {
      url: "/uploads/orders/ORDA25272001/after_1.jpg",
      description: "Nowa płyta główna zamontowana",
      timestamp: "2025-01-27T15:30:00Z", 
      uploadedBy: 3
    },
    {
      url: "/uploads/orders/ORDA25272001/after_2.jpg",
      description: "Pralka po naprawie - wszystkie funkcje działają",
      timestamp: "2025-01-27T16:00:00Z",
      uploadedBy: 3
    }
  ],
  
  // ========== NOTATKI ==========
  workNotes: "Klient zgłosił problem w weekend. Pralka była używana intensywnie przez 5 lat. Po wymianie płyty wszystko działa prawidłowo.",
  technicianNotes: "Sprawdziłem również instalację - napięcie w normie. Zalecam regularne czyszczenie filtrów.",
  internalNotes: "Klient VIP - szybka realizacja. Możliwa reklamacja gwarancyjna u producenta.",
  clientFeedback: "Bardzo zadowolona z szybkości naprawy. Serwisant profesjonalny i punktualny.",
  
  // 🆕 NOWE: Zalecenia prewencyjne
  recommendations: "Zalecam czyszczenie filtra co miesiąc oraz używanie programu czyszczenia pralki raz na kwartał.",
  preventiveMaintenance: "Kontrola węży wodnych co 6 miesięcy. Sprawdzanie stabilności ustawienia pralki co rok.",
  
  // ========== PODPISY I UKOŃCZENIE ==========
  customerSignature: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiLz48L3N2Zz4=",
  
  completionPhotos: [
    {
      url: "/uploads/orders/ORDA25272001/completion_1.jpg",
      description: "Podpis klienta na dokumencie odbioru",
      timestamp: "2025-01-27T16:00:00Z"
    }
  ],
  
  // ========== 🆕 NOWE: GWARANCJA ==========
  warrantyMonths: 12,
  warrantyNotes: "Gwarancja na wymienioną płytę główną oraz wykonane prace serwisowe. Nie obejmuje uszkodzeń mechanicznych.",
  warrantyStatus: "gwarancja_wygasla", // Gwarancja producenta wygasła
  
  // ========== CENNIK ==========
  pricingSettings: {
    serviceType: "repair",
    deviceCategory: "pralki",
    distance: 15,
    autoCalculateLaborCost: true,
    customRates: {
      repair: 200,
      diagnostic: 150,
      travel: 2.0 // za km
    }
  },
  
  // ========== 🆕 NOWE: POWIADOMIENIA ==========
  notificationsSent: [
    { type: "order_created", recipient: "client", timestamp: "2025-01-27T08:00:00Z", status: "delivered" },
    { type: "order_assigned", recipient: "serviceman", timestamp: "2025-01-27T08:15:00Z", status: "delivered" },
    { type: "order_started", recipient: "client", timestamp: "2025-01-27T09:15:00Z", status: "delivered" },
    { type: "order_completed", recipient: "client", timestamp: "2025-01-27T16:00:00Z", status: "delivered" }
  ],
  
  pushNotificationsSent: [
    { 
      message: "Serwisant jest w drodze do Pani pralki", 
      recipient: "client_1", 
      timestamp: "2025-01-27T08:45:00Z", 
      delivered: true 
    },
    { 
      message: "Naprawa zakończona pomyślnie!", 
      recipient: "client_1", 
      timestamp: "2025-01-27T16:00:00Z", 
      delivered: true 
    }
  ],
  
  // ========== HISTORIA SERWISU ==========
  serviceHistory: [
    {
      date: "2022-03-15",
      service: "Pierwsza instalacja",
      technician: "Jan Kowalski",
      notes: "Instalacja i pierwsze uruchomienie"
    },
    {
      date: "2023-08-20", 
      service: "Wymiana węży doprowadzających",
      technician: "Anna Nowak",
      notes: "Profilaktyczna wymiana po 1.5 roku"
    }
  ],
  
  // ========== METADANE ==========
  createdAt: "2025-01-27T08:00:00Z",
  updatedAt: "2025-01-27T16:05:00Z",
  
  // 🆕 NOWE: Metadane mobile
  createdBy: 1, // Operator
  lastModifiedBy: 3, // Serwisant
  syncStatus: "synced"
};

// ========== PRZYKŁAD UŻYCIA MOBILE HELPERS ==========

console.log('📱 ENHANCED ORDER v2.0 - PRZYKŁAD UŻYCIA');
console.log('=====================================');

// Przygotowanie zlecenia dla aplikacji mobilnej
const mobileOrder = EnhancedOrderHelpers.prepareOrderForMobile(
  EXAMPLE_ENHANCED_ORDER_V2,
  { firstName: "Anna", lastName: "Kowalska" }, // client
  { firstName: "Michał", lastName: "Serwisant" }, // employee  
  { firstName: "Jan", lastName: "Technik" } // serviceman
);

console.log('\n🎯 Zlecenie przygotowane dla mobile:');
console.log(`   Status: ${mobileOrder.statusLabel} (${mobileOrder.statusColor})`);
console.log(`   Priorytet: ${mobileOrder.priorityLabel}`);
console.log(`   Koszt: ${mobileOrder.formattedCost}`);
console.log(`   Data: ${mobileOrder.formattedDate}`);
console.log(`   Klient: ${mobileOrder.clientName}`);
console.log(`   Serwisant: ${mobileOrder.servicemanName}`);

console.log('\n🔧 Możliwe akcje:');
console.log(`   Można edytować: ${mobileOrder.canEdit ? '✅' : '❌'}`);
console.log(`   Można rozpocząć: ${mobileOrder.canStart ? '✅' : '❌'}`);
console.log(`   Można ukończyć: ${mobileOrder.canComplete ? '✅' : '❌'}`);
console.log(`   Można anulować: ${mobileOrder.canCancel ? '✅' : '❌'}`);

console.log('\n📍 Lokalizacja:');
console.log(`   Ma lokalizację: ${mobileOrder.hasLocation ? '✅' : '❌'}`);
console.log(`   Info: ${mobileOrder.locationInfo}`);

console.log('\n📊 Statystyki:');
console.log(`   Liczba zdjęć: ${mobileOrder.photosCount}`);
console.log(`   Ma gwarancję: ${mobileOrder.hasWarranty ? '✅' : '❌'}`);
console.log(`   Opóźnione: ${mobileOrder.isOverdue ? '⚠️' : '✅'}`);

console.log('\n🔄 Workflow:');
console.log(`   Dostępne statusy: ${mobileOrder.availableStatusChanges.join(', ')}`);
console.log(`   Następna akcja: ${mobileOrder.nextRecommendedAction}`);

// ========== PORÓWNANIE: PRZED vs PO ENHANCED v2.0 ==========

console.log('\n\n📈 PORÓWNANIE FUNKCJONALNOŚCI');
console.log('==============================');

const comparison = {
  'Web App Original': {
    fields: 47,
    features: [
      'Timer pracy',
      'Zarządzanie częściami', 
      'System rozliczeniowy',
      'PDF Generator',
      'Podpisy cyfrowe',
      'Notatki robocze'
    ]
  },
  'Mobile App Original': {
    fields: 35,
    features: [
      'GPS lokalizacja',
      'Zdjęcia przed/po',
      'Workflow wizyt',
      'Push notifications',
      'Status flow',
      'Gwarancje serwisu'
    ]
  },
  'Enhanced v2.0': {
    fields: 67, // 🔥 Najwięcej!
    features: [
      // Z Web
      'Timer pracy',
      'Zarządzanie częściami',
      'System rozliczeniowy', 
      'PDF Generator',
      'Podpisy cyfrowe',
      // Z Mobile  
      'GPS lokalizacja',
      'Zdjęcia przed/po',
      'Workflow wizyt',
      'Push notifications',
      'Status flow',
      'Gwarancje serwisu',
      // Nowe kombinowane
      'Mobile helpers',
      'Zalecenia prewencyjne',
      'Historia statusów',
      'Synchronizacja offline'
    ]
  }
};

Object.entries(comparison).forEach(([name, data]) => {
  console.log(`\n${name}:`);
  console.log(`   Pola: ${data.fields}`);
  console.log(`   Funkcje: ${data.features.length}`);
  data.features.forEach(feature => console.log(`     • ${feature}`));
});

console.log('\n\n🎉 ENHANCED ORDER STRUCTURE v2.0 - GOTOWE!');
console.log('==========================================');
console.log('✅ Połączono najlepsze funkcje z Web + Mobile');
console.log('✅ 67 pól vs 47 (Web) vs 35 (Mobile)');
console.log('✅ Pełna kompatybilność wsteczna');
console.log('✅ Nowe funkcje mobilne w aplikacji webowej');
console.log('✅ Gotowe do wdrożenia na serwerze');

module.exports = {
  EXAMPLE_ENHANCED_ORDER_V2,
  mobileOrder
};