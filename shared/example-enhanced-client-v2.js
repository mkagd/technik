/**
 * 🎯 PRZYKŁAD PEŁNEGO KLIENTA - ENHANCED v2.0 
 * 
 * Pokazuje jak wygląda klient z wszystkimi polami z mobile + web
 * Gotowy na wdrożenie na serwer
 */

const EXAMPLE_ENHANCED_CLIENT_V2 = {
  // ========== PODSTAWOWE IDENTYFIKATORY ==========
  id: "CLI25272001",
  legacyId: "#0001", 
  name: "Jan Kowalski",
  email: "jan.kowalski@email.com",
  
  // ========== TELEFONY (Enhanced + Mobile features) ==========
  phones: [
    {
      number: "+48 123 456 789",
      label: "Komórka",
      isPrimary: true,
      notes: "Główny numer kontaktowy", 
      canCall: true,           // NOWE z mobile
      canSMS: true,            // NOWE z mobile
      isWhatsApp: false        // NOWE - dodatkowa info
    },
    {
      number: "+48 987 654 321", 
      label: "Praca",
      isPrimary: false,
      notes: "Tylko w godzinach 8-16",
      canCall: true,
      canSMS: false,
      isWhatsApp: false
    }
  ],
  
  // ========== ADRESY (Enhanced + GPS z Mobile) ==========
  addresses: [
    {
      street: "ul. Warszawska 123/45",
      city: "Kraków",
      postalCode: "31-155", 
      label: "Dom",
      isPrimary: true,
      notes: "Główne miejsce zamieszkania",
      coordinates: {           // NOWE z mobile - GPS!
        lat: 50.0647,
        lng: 19.9450,
        accuracy: 8,
        timestamp: "2025-09-29T10:15:00Z",
        source: "gps"        // gps, manual, geocoded
      }
    },
    {
      street: "ul. Biznesowa 567",
      city: "Kraków", 
      postalCode: "30-001",
      label: "Praca",
      isPrimary: false,
      notes: "Biuro - można zostawić sprzęt",
      coordinates: {
        lat: 50.0584,
        lng: 19.9306,
        accuracy: 10,
        timestamp: "2025-09-29T10:15:00Z", 
        source: "geocoded"
      }
    }
  ],
  
  // ========== DANE FIRMOWE (Enhanced + GUS z Mobile) ==========
  companyInfo: {
    isCompany: false,
    companyName: "",
    nip: "", 
    regon: "",
    krs: "",
    address: "",
    // NOWE z mobile - pełne dane GUS API
    gusCompany: null,        // Puste dla klienta prywatnego
    gusVatStatus: null,      // Puste dla klienta prywatnego  
    gusFetchedAt: null       // Kiedy ostatnio sprawdzono GUS
  },
  
  // ========== GODZINY DOSTĘPNOŚCI (Enhanced + Mobile) ==========
  availability: {
    // Istniejąca struktura Enhanced (szczegółowa)
    workingHours: [
      {
        dayOfWeek: "monday",
        periods: [
          {
            from: "17:00",
            to: "20:00",
            label: "Po pracy"
          }
        ]
      },
      {
        dayOfWeek: "saturday", 
        periods: [
          {
            from: "09:00",
            to: "15:00",
            label: "Weekend"
          }
        ]
      },
      {
        dayOfWeek: "sunday",
        periods: [
          {
            from: "10:00", 
            to: "14:00",
            label: "Niedziela"
          }
        ]
      }
    ],
    specialAvailability: [],
    unavailableDates: ["2025-12-24", "2025-12-25", "2025-01-01"],
    preferredContactTime: "Po 17:00 w dni robocze, weekendy OK",
    notes: "Najlepiej dzwonić wieczorem po pracy lub w weekend",
    
    // NOWE z mobile - elastyczne godziny (prostsza struktura)
    workHours: [             
      {
        label: "Po pracy", 
        from: "17:00",
        to: "20:00",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      {
        label: "Weekend",
        from: "09:00",
        to: "15:00", 
        days: ["saturday", "sunday"]
      }
    ],
    
    // NOWE - preferencje kontaktu
    preferredContactMethod: "phone",    // phone, sms, email, app
    canCallAfterHours: false,          // Czy można dzwonić po godzinach
    emergencyContact: true,            // Czy można kontaktować w nagłych przypadkach
    responseTimeExpected: "2h"         // Oczekiwany czas odpowiedzi
  },
  
  // ========== TAGI I GRUPY (Enhanced + Mobile groups) ==========
  tags: [
    "VIP", 
    "Szybka płatność",
    "AGD",
    "Punktualny"
  ],
  groups: [                            // NOWE z mobile  
    "Serwis",
    "Elektronika", 
    "Stali klienci"
  ],
  
  // ========== HISTORIA KONTAKTÓW (Enhanced + Mobile contactHistory) ==========
  contactHistory: [
    {
      id: "contact_20250929_001",
      date: "2025-09-29T14:30:00Z",
      type: "call",                    // call, sms, email, visit, system
      direction: "outgoing",           // incoming, outgoing
      result: "successful",            // successful, no_answer, busy, failed, cancelled
      duration: 180,                   // sekundy dla rozmowy
      notes: "Umówiono serwis pralki na jutro 10:00",
      initiatedBy: "admin",            // user ID kto zainicjował
      source: "WebApp",                // WebApp, MobileApp, System
      relatedOrderId: "ORD25272001"    // Powiązane zlecenie
    },
    {
      id: "contact_20250928_002", 
      date: "2025-09-28T09:15:00Z",
      type: "sms",
      direction: "outgoing",
      result: "delivered", 
      message: "Dzień dobry! Przypominamy o wizycie serwisanta jutro o 14:30. Pozdrawiamy - Serwis Technik",
      initiatedBy: "system",
      source: "System",
      messageLength: 94
    },
    {
      id: "contact_20250927_003",
      date: "2025-09-27T16:45:00Z", 
      type: "email",
      direction: "outgoing",
      result: "opened",                 // sent, delivered, opened, clicked
      subject: "Potwierdzenie rezerwacji serwisu",
      initiatedBy: "admin",
      source: "WebApp",
      openedAt: "2025-09-27T17:20:00Z"
    },
    {
      id: "contact_20250925_004",
      date: "2025-09-25T10:00:00Z",
      type: "visit",                   // Wizyta technika
      direction: "incoming",           // Klient u nas / my u klienta
      result: "completed",
      duration: 7200,                  // 2 godziny
      notes: "Naprawa pralki - wymiana pompy, wszystko działa",
      initiatedBy: "emp_001",          // ID technika
      source: "MobileApp",
      servicemanId: "emp_001",
      relatedOrderId: "ORD25268001"
    }
  ],
  
  // ========== NOTATKI (Enhanced - już istniejące) ==========
  notes: [
    {
      id: "note_001",
      content: "Stały klient serwisu AGD - zawsze punktualny i miły",
      type: "general",
      createdAt: "2025-09-29T10:00:00Z",
      createdBy: "admin",
      tags: ["customer_service", "personality"]
    },
    {
      id: "note_002", 
      content: "Preferuje kontakt telefoniczny, nie lubi SMS-ów",
      type: "contact_preference",
      createdAt: "2025-09-29T10:05:00Z",
      createdBy: "admin",
      tags: ["communication"]
    },
    {
      id: "note_003",
      content: "Ma dużo sprzętu AGD marki Samsung - potencjał na więcej zleceń",
      type: "business_opportunity", 
      createdAt: "2025-09-29T10:10:00Z",
      createdBy: "admin",
      tags: ["sales", "samsung"]
    }
  ],
  
  // ========== NOWE POLA z MOBILE ==========
  profession: "Inżynier IT",          // Zawód klienta
  type: "Prywatny",                   // Prywatny/Firma
  needInvoice: false,                 // Czy wymaga faktury
  contactPerson: "Jan Kowalski",      // Główna osoba kontaktowa
  internalNotes: "Dobry klient - zawsze płaci na czas, nie sprawia problemów", // Wewnętrzne uwagi
  
  // ========== PREFERENCJE KLIENTA (Enhanced + Mobile) ==========
  preferences: {
    contactMethod: "phone",           // phone, email, sms, app
    language: "pl",                   // pl, en, de
    currency: "PLN",                  // PLN, EUR, USD
    notifications: {
      sms: true,                      // Zgoda na SMS
      email: true,                    // Zgoda na email  
      push: false,                    // Zgoda na push (mobile)
      marketing: false,               // Zgoda na marketing
      reminders: true                 // Przypomnienia o wizytach
    },
    invoicePreference: "email",       // email, mail, pickup
    paymentMethod: "cash",            // cash, card, transfer, blik
    serviceReminders: {
      enabled: true,
      daysBefore: 1,                  // Ile dni przed wizytą przypomnieć
      method: "sms"                   // sms, email, call
    }
  },
  
  // ========== MOBILE SPECIFIC (NOWE) ==========
  mobileData: {
    hasApp: false,                    // Czy ma aplikację mobilną
    pushToken: null,                  // Token push notifications
    lastAppActivity: null,            // Ostatnia aktywność w app
    appVersion: null,                 // Wersja aplikacji
    deviceInfo: {
      platform: null,                // ios, android
      deviceId: null,
      appInstalled: false
    }
  },
  
  // ========== LOKALIZACJA GPS (NOWE z Mobile) ==========
  location: {
    lat: 50.0647,
    lng: 19.9450,
    accuracy: 8,
    timestamp: "2025-09-29T10:15:00Z",
    source: "gps",                    // manual, gps, geocoded
    address: "ul. Warszawska 123/45, 31-155 Kraków" // Adres z geocoding
  },
  
  // ========== STATYSTYKI (Enhanced - już istniejące + rozszerzenia) ==========
  stats: {
    totalOrders: 8,
    completedOrders: 7,
    cancelledOrders: 1,
    totalRevenue: 1250.00,
    averageOrderValue: 156.25,
    lastOrderDate: "2025-09-25T00:00:00Z",
    customerSince: "2024-03-15T10:00:00Z",
    averageRating: 4.8,
    loyaltyPoints: 125,               // NOWE - punkty lojalnościowe
    lifetimeValue: 1250.00,           // NOWE - wartość klienta
    responseRate: 0.95,               // NOWE - % odpowiedzi na kontakt
    averageResponseTime: "45m"        // NOWE - średni czas odpowiedzi
  },
  
  // ========== DEFAULTS z Mobile (NOWE) ==========
  defaults: {
    firstName: "Jan",
    lastName: "Kowalski",
    address: "ul. Warszawska 123/45",
    phoneIdx: 0,                      // Domyślny telefon (indeks)
    addressIdx: 0,                    // Domyślny adres (indeks)
    contactMethod: "phone"            // Domyślny sposób kontaktu
  },
  
  // ========== METADATA (Enhanced + Mobile) ==========
  status: "active",                   // active, inactive, blocked, vip
  enhanced: true,                     // Czy używa nowej struktury
  version: "2.0-mobile",              // Wersja struktury danych
  createdAt: "2024-03-15T10:00:00Z",
  updatedAt: "2025-09-29T14:30:00Z",
  createdBy: "admin",
  lastModifiedBy: "admin",
  
  // MIGRACJA (istniejące)
  migrated: true,
  migrationDate: "2025-09-29T10:00:00Z",
  migrationSource: "mobile-integration",
  
  // ========== SYSTEM FIELDS ==========
  systemData: {
    priority: "normal",               // low, normal, high, vip
    riskLevel: "low",                 // low, medium, high (payment risk)
    dataSource: "manual",             // manual, import, api, mobile
    syncStatus: "synced",             // synced, pending, error
    lastSyncAt: "2025-09-29T14:30:00Z"
  }
};

module.exports = {
  EXAMPLE_ENHANCED_CLIENT_V2
};