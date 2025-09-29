/**
 * PRZYKŁAD ENHANCED ORDER STRUCTURE v3.0 - ULTIMATE EDITION
 * 
 * Przykład wykorzystujący wszystkie najnowsze funkcje:
 * 🏠 System zabudowy sprzętu AGD z 7 parametrami
 * 📞 Wykrywanie połączeń z Google Contacts
 * 📱 Rozbudowany system urządzeń AGD 
 * 📝 Historia zmian z emoji
 * 🔧 Integracja Google + employee system
 */

const ENHANCED_ORDER_EXAMPLE_V3 = {
  // ========== PODSTAWOWE ID I POWIĄZANIA ==========
  id: 1275,
  orderNumber: "ORDA25272001", // 🆕 NOWY FORMAT ID (już zatwierdzony)
  orderSource: "web",
  
  // Powiązania
  clientId: 12425,
  clientName: "Jan Kowalski", // 🆕 z AGD Mobile
  employeeId: 45,
  visitId: 892,
  servicemanId: 15,
  
  // 🆕 NOWE: Przypisany pracownik z AGD Mobile
  selectedEmployee: "EMP002", 
  selectedGoogleAccount: "serwisant.jan@techserwis.pl",
  
  // ========== ADRES I LOKALIZACJA ==========
  address: "ul. Marszałkowska 123/45, 00-001 Warszawa", // 🆕 z AGD Mobile
  phone: "+48 123 456 789", // 🆕 z AGD Mobile
  
  // GPS i lokalizacja urządzenia (z Enhanced v2.0)
  deviceLocation: "Kuchnia - narożnik przy oknie",
  deviceCoordinates: {
    lat: 52.2297,
    lng: 21.0122,
    accuracy: 10,
    timestamp: 1706364000000
  },
  
  // ========== 🆕 NOWE: GODZINY DOSTĘPNOŚCI (z AGD Mobile) ==========
  hours: "14:30", // Preferowana godzina wizyty
  orderHours: "14:30", // alias dla hours
  workHours: [
    { label: "Poniedziałek-Piątek", from: "08:00", to: "16:00" },
    { label: "Sobota", from: "09:00", to: "13:00" },
    { label: "Niedziela - niedostępny" }
  ],
  clientWorkHours: [
    { day: "mon", from: "08:00", to: "16:00", available: true },
    { day: "tue", from: "08:00", to: "16:00", available: true },
    { day: "wed", from: "08:00", to: "16:00", available: true },
    { day: "thu", from: "08:00", to: "16:00", available: true },
    { day: "fri", from: "08:00", to: "16:00", available: true },
    { day: "sat", from: "09:00", to: "13:00", available: true },
    { day: "sun", available: false }
  ],
  workHoursCustom: "Najlepiej po 14:00, unikać godzin 12:00-13:00 (obiad)",
  
  // ========== 🆕 NOWE: ROZBUDOWANY SYSTEM URZĄDZEŃ AGD ==========
  devices: [
    {
      deviceType: "Zmywarka",
      issueDescription: "Wyświetla błąd:",
      errorCode: "E24", // Kod błędu dla "Wyświetla błąd:"
      producer: "Bosch",
      model: "SMS46GI56E",
      parts: ["Pompa", "Filtr"], // Wybrane części
      notes: "Błąd pojawia się po 10 minutach pracy. Wcześniej był drobny wyciek.",
      showParts: false, // UI state
      
      // 🏠 SYSTEM ZABUDOWY - NAJWAŻNIEJSZA FUNKCJA z AGD Mobile!
      builtIn: true, // Sprzęt w zabudowie
      builtInParams: {
        demontaz: true,        // ✅ Wymagany demontaż
        montaz: true,          // ✅ Wymagany montaż  
        trudna: true,          // ✅ Trudna zabudowa
        wolnostojacy: false,   // Nie wolnostojący
        ograniczony: true,     // ✅ Ограniczony dostęp
        front: true,           // ✅ Front do demontażu
        czas: true             // ✅ Dodatkowy czas
      },
      builtInParamsNotes: {
        czas: "45", // +45 minut dodatkowego czasu
        demontaz: "Uwaga na przewody elektryczne i rurki wodne - bardzo ciasno",
        trudna: "Zabudowa na wymiar, bardzo wąska przestrzeń robocza",
        front: "Front na zawiasach, trzeba ostrożnie zdemontować",
        ograniczony: "Dostęp tylko z prawej strony, lewa ściana blokuje"
      }
    },
    {
      deviceType: "Pralka",
      issueDescription: "Nie wiruje",
      producer: "Samsung",
      model: "WW70J5346MW",
      parts: ["Silnik"],
      notes: "Pranie zostaje mokre, bęben kręci się bardzo wolno.",
      showParts: false,
      
      // Ten sprzęt nie w zabudowie
      builtIn: false,
      builtInParams: {
        demontaz: false,
        montaz: false,
        trudna: false,
        wolnostojacy: true,    // ✅ Sprzęt wolnostojący
        ograniczony: false,
        front: false,
        czas: false
      },
      builtInParamsNotes: {}
    }
  ],
  
  // Główne parametry zabudowy (dla kompatybilności - z pierwszego urządzenia)
  builtInParams: {
    demontaz: true,
    montaz: true,
    trudna: true,
    wolnostojacy: false,
    ograniczony: true,
    front: true,
    czas: true,
    czasMinuty: 45,
    deviceCount: 2,
    builtInDeviceCount: 1
  },
  
  // ========== OPIS PROBLEMU I DIAGNOZY ==========
  problemDescription: "Zmywarka wyświetla błąd E24 po 10 minutach pracy. Dodatkowo pralka nie wiruje i pozostawia mokre pranie.", // 🆕 z AGD Mobile
  symptoms: [
    "Błąd E24 na wyświetlaczu zmywarki",
    "Pralka nie wiruje",
    "Mokre pranie po zakończeniu cyklu",
    "Drobny wyciek pod zmywarką"
  ],
  category: "AGD - Sprzęt w zabudowie",
  diagnosis: "1. Zmywarka: Błąd E24 wskazuje na problem z pompą odpływową. Dodatkowo zablokowany filtr. Wymagany demontaż z trudnej zabudowy (+45 min). 2. Pralka: Uszkodzony silnik wirowania, nie blokuje się mechanicznie.",
  solutionDescription: "1. Demontaż zmywarki z zabudowy (45 min dodatkowego czasu), wymiana pompy odpływowej i oczyszczenie filtra, montaż z powrotem. 2. Wymiana silnika wirowania w pralce wolnostojącej.",
  
  // ========== STATUS I WORKFLOW ==========
  status: "W realizacji",
  priority: "high", // Wysoki priorytet z powodu trudnej zabudowy
  
  // 🆕 NOWE: Rozbudowana historia zmian z AGD Mobile z emoji
  history: [
    {
      date: "2025-01-27T15:30:00Z",
      action: "Utworzenie zlecenia", 
      details: "Zlecenie utworzone dla: Jan Kowalski (ID: CLI25272001)",
      description: "🆕 Nowe zlecenie\n📞 Automatycznie wykryto połączenie z +48 123 456 789\n🏠 Wykryto sprzęt w zabudowie: zmywarka (demontaż + montaż + trudna zabudowa)\n⏰ Dodatkowy czas: +45 minut\n👤 Przypisano pracownika: serwisant.jan@techserwis.pl"
    },
    {
      date: "2025-01-27T16:15:00Z", 
      action: "Edycja zlecenia",
      description: "📌 Status: Nowe ➔ W realizacji\n💰 Koszt: 200 ➔ 350 (trudna zabudowa)\n🛠️ Urządzenie 1: Dodano szczegóły błędu E24\n➕ Urządzenie 1: dodano część - Pompa\n➕ Urządzenie 1: dodano część - Filtr\n🏠 Parametry zabudowy: wszystkie opcje zaznaczone\n📝 Notatki zabudowy: dodano szczegółowe uwagi"
    },
    {
      date: "2025-01-27T16:45:00Z",
      action: "Dodanie urządzenia",
      description: "➕ Dodano urządzenie 2: Pralka Samsung WW70J5346MW\n🔧 Problem: Nie wiruje\n🛠️ Część: Silnik\n📍 Typ: Wolnostojąca (bez zabudowy)"
    }
  ],
  
  statusHistory: [
    { status: "Nowe", timestamp: 1706364000000, user: "System" },
    { status: "W realizacji", timestamp: 1706366700000, user: "Jan Serwisant" }
  ],
  canEdit: true,
  
  // ========== ZARZĄDZANIE CZASEM ==========
  estimatedDuration: 135, // 90 min podstawowe + 45 min za trudną zabudowę
  
  // Czasy z web
  isTimerRunning: false,
  timerStartTime: null,
  totalWorkTime: 0,
  workSessions: [],
  
  // Czasy z mobile workflow
  actualStartTime: null,
  actualEndTime: null,
  timeSpentMinutes: null,
  
  // ========== KOSZTY I ROZLICZENIA ==========
  estimatedCost: 350.00,
  cost: "350", // 🆕 z AGD Mobile
  customCost: null,
  
  // Szczegółowe koszty
  laborCost: 200.00, // +50 za trudną zabudowę
  partsCost: 150.00, // Pompa + Filtr + Silnik
  travelCost: 0.00,
  totalCost: 350.00,
  finalAmount: 350.00,
  
  // Płatności
  paymentMethod: "card",
  paymentReceived: false,
  isPaid: false,
  
  // ========== CZĘŚCI I MATERIAŁY ==========
  partsUsed: [
    {
      partName: "Pompa odpływowa Bosch",
      partNumber: "BSH-165261",
      quantity: 1,
      unitCost: 80.00,
      totalCost: 80.00,
      deviceIndex: 0
    },
    {
      partName: "Filtr zmywarki Bosch",
      partNumber: "BSH-427903",
      quantity: 1,
      unitCost: 25.00,
      totalCost: 25.00,
      deviceIndex: 0
    },
    {
      partName: "Silnik wirowania Samsung",
      partNumber: "SAM-DC31-00002A",
      quantity: 1,
      unitCost: 45.00,
      totalCost: 45.00,
      deviceIndex: 1
    }
  ],
  deviceModels: ["Bosch SMS46GI56E", "Samsung WW70J5346MW"],
  
  // ========== 🆕 NOWE: DOKUMENTACJA WIZUALNA ==========
  beforePhotos: [
    {
      uri: "/photos/orders/ORDA25272001/before_zmywarka_zabudowa.jpg",
      timestamp: 1706364000000,
      description: "Zmywarka w trudnej zabudowie - widok z przodu",
      deviceIndex: 0
    },
    {
      uri: "/photos/orders/ORDA25272001/before_error_e24.jpg",
      timestamp: 1706364060000,
      description: "Błąd E24 na wyświetlaczu zmywarki",
      deviceIndex: 0
    }
  ],
  afterPhotos: [],
  completionPhotos: [],
  
  // ========== NOTATKI I KOMUNIKACJA ==========
  workNotes: "Trudna zabudowa zmywarki - bardzo wąska przestrzeń. Demontaż frontu zajął 20 minut. Dostęp do pompy ograniczony.",
  technicianNotes: "Klient przestrzegał przed delikatnym frontem kuchennym. Wszystko zabezpieczone folią.",
  internalNotes: "Następnym razem zarezerwować więcej czasu na zabudowę tego typu (narożnik).",
  clientFeedback: null,
  recommendations: "1. Regularne czyszczenie filtra zmywarki co 3 miesiące. 2. Dla pralki - unikać przeciążania bębna.",
  preventiveMaintenance: "Zmywarka: miesięczne czyszczenie filtra i ramion spryskujących. Pralka: kwartalne czyszczenie bębna.",
  
  // ========== PODPISY I POTWIERDZENIA ==========
  customerSignature: null,
  
  // ========== 🆕 NOWE: SYSTEM GWARANCJI ==========
  warrantyMonths: 6, // Przedłużona gwarancja z powodu trudnej zabudowy
  warrantyNotes: "Gwarancja obejmuje: pompę odpływową, filtr, silnik wirowania. W przypadku zabudowy - dodatkowy czas serwisu w ramach gwarancji.",
  warrantyStatus: "na_gwarancji",
  
  // ========== USTAWIENIA CENOWE ==========
  pricingSettings: {
    hourlyRate: 80.00,
    builtInSurcharge: 50.00, // Dopłata za zabudowę
    difficultAccessSurcharge: 25.00, // Dopłata za trudny dostęp
    timeBasedPricing: true
  },
  
  // ========== 🆕 NOWE: WYKRYWANIE POŁĄCZEŃ (z AGD Mobile) ==========
  detectedCall: {
    phoneNumber: "+48 123 456 789",
    timestamp: 1706364000000,
    type: "INCOMING",
    duration: 120, // 2 minuty rozmowy
    wasUsed: true // Numer został użyty w zleceniu
  },
  entryTime: 1706364000000, // Czas rozpoczęcia tworzenia zlecenia
  
  // ========== 🆕 NOWE: GOOGLE CONTACTS INTEGRACJA ==========
  updateGoogleContact: true, // 🆕 z AGD Mobile
  createNewGoogleContact: false, // Kontakt już istnieje
  googleContactData: { // 🆕 z AGD Mobile
    resourceName: "people/c7896541",
    email: "serwisant.jan@techserwis.pl", 
    lastUpdated: "2025-01-27T16:00:00Z",
    biographyUpdated: true,
    ordersCount: 4, // To jest 4. zlecenie tego klienta 
    biography: `🔧 Klient serwisu technicznego
📅 Zlecenia: ORDA25121801, ORDA25012102, ORDA25021501, ORDA25272001
🏠 Specjalizacja: AGD zabudowane, trudne dostępy
💰 Średni koszt: 280 zł
⭐ Klient wymagający ale punktualny
📝 Uwagi: Zawsze informować o postępach, preferuje kontakt SMS`
  },
  
  // ========== 🆕 NOWE: DATY I KALENDARZ ==========
  dates: ["2025-01-27", "2025-01-28"], // 🆕 z AGD Mobile - możliwe daty realizacji
  selectedDates: ["2025-01-27"], // Wybrana konkretna data
  
  // ========== POWIADOMIENIA ==========
  notificationsSent: [
    {
      type: "order_created",
      timestamp: 1706364000000,
      recipient: "client",
      method: "sms",
      content: "Zlecenie ORDA25272001 zostało utworzone. Spodziewana realizacja: 27-28.01.2025"
    },
    {
      type: "call_detected", // 🆕 z AGD Mobile
      timestamp: 1706364000000,
      recipient: "admin",
      method: "system",
      content: "Automatycznie wykryto połączenie podczas tworzenia zlecenia ORDA25272001"
    },
    {
      type: "built_in_device_detected", // 🆕 z AGD Mobile
      timestamp: 1706364000000,
      recipient: "technician",
      method: "push",
      content: "Uwaga: sprzęt w trudnej zabudowie (+45 min), przygotuj dodatkowe narzędzia"
    }
  ],
  pushNotificationsSent: [],
  
  // ========== HISTORIA SERWISU ==========
  serviceHistory: [
    {
      orderNumber: "ORDA25121801",
      date: "2024-12-18",
      devices: ["Piekarnik Bosch"],
      cost: 180.00,
      status: "completed"
    },
    {
      orderNumber: "ORDA25012102", 
      date: "2025-01-21",
      devices: ["Lodówka Samsung"],
      cost: 220.00,
      status: "completed"
    },
    {
      orderNumber: "ORDA25021501",
      date: "2025-02-15", 
      devices: ["Okap Electrolux"],
      cost: 380.00,
      status: "completed"
    }
  ],
  
  // ========== METADANE ==========
  dateAdded: "2025-01-27T15:30:00Z", // 🆕 z AGD Mobile
  createdAt: "2025-01-27T15:30:00Z",
  updatedAt: "2025-01-27T16:45:00Z",
  createdBy: 1,
  lastModifiedBy: 45,
  syncStatus: "synced"
};

module.exports = {
  ENHANCED_ORDER_EXAMPLE_V3
};