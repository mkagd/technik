/**
 * 🎯 ROZSZERZONA STRUKTURA KLIENTA
 * 
 * Łączy najlepsze funkcje z aplikacji internetowej i mobilnej
 * Przygotowana pod przyszły serwer i bazy danych
 * 
 * Wersja: 2.0 - Mobile Integration
 * Data: 2025-09-29
 */

// ========== ENHANCED CLIENT STRUCTURE v2.0 ==========
const ENHANCED_CLIENT_STRUCTURE = {
  // PODSTAWOWE POLA (istniejące)
  id: "CLI25272001", // Unified ID system
  legacyId: "#0001", // Kompatybilność z mobile
  name: "Jan Kowalski",
  email: "jan@example.com",
  
  // TELEFONY (Enhanced - już mamy)
  phones: [
    {
      number: "123456789",
      label: "Komórka", 
      isPrimary: true,
      notes: "Główny numer kontaktowy",
      canCall: true, // NOWE z mobile
      canSMS: true   // NOWE z mobile
    }
  ],
  
  // ADRESY (Enhanced - już mamy + GPS z mobile)
  addresses: [
    {
      street: "ul. Przykładowa 123",
      city: "Warszawa", 
      postalCode: "00-000",
      label: "Dom",
      isPrimary: true,
      notes: "Główne miejsce zamieszkania",
      coordinates: {  // NOWE z mobile - GPS!
        lat: 52.2297,
        lng: 21.0122,
        accuracy: 10,
        timestamp: "2025-09-29T10:00:00Z"
      }
    }
  ],
  
  // DANE FIRMOWE (Enhanced + GUS z mobile)
  companyInfo: {
    isCompany: false,
    companyName: "ABC Sp. z o.o.",
    nip: "1234567890", 
    regon: "123456789",
    krs: "0000123456",
    address: "ul. Firmowa 456",
    // NOWE z mobile - GUS API data
    gusCompany: {        // Pełne dane z GUS
      name: "ABC SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ",
      address: "UL. FIRMOWA 456, 00-001 WARSZAWA",
      status: "AKTYWNA",
      dateRegistered: "2020-01-15",
      mainActivity: "62.01.Z"
    },
    gusVatStatus: {      // Status VAT z GUS
      active: true,
      number: "PL1234567890", 
      dateFrom: "2020-01-15",
      dateTo: null
    },
    gustFetchedAt: "2025-09-29T10:00:00Z" // Kiedy pobrano z GUS
  },
  
  // GODZINY DOSTĘPNOŚCI (Enhanced + mobile workHours)
  availability: {
    // Istniejąca struktura internetowa
    workingHours: [
      {
        dayOfWeek: "monday",
        periods: [
          {
            from: "17:00",
            to: "19:00", 
            label: "Po pracy"
          }
        ]
      }
    ],
    preferredContactTime: "Po 17:00",
    
    // NOWE z mobile - elastyczne godziny
    workHours: [         // Format z mobile
      {
        label: "Po pracy",
        from: "17:00",
        to: "19:00",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      {
        label: "Weekend",
        from: "10:00", 
        to: "16:00",
        days: ["saturday", "sunday"]
      }
    ],
    
    // NOWE - preferencje kontaktu
    preferredContactMethod: "phone", // phone, email, sms, app
    canCallAfterHours: false,
    emergencyContact: true
  },
  
  // GRUPY I TAGI (Enhanced + mobile groups)
  tags: ["VIP", "Szybka płatność", "AGD"], // Istniejące
  groups: ["Serwis", "Elektronika", "Prywatnie"], // NOWE z mobile
  
  // HISTORIA KONTAKTÓW (Enhanced + mobile contactHistory)
  contactHistory: [
    {
      id: "contact_001",
      date: "2025-09-29T10:00:00Z",
      type: "call",        // call, sms, email, visit, system
      direction: "outgoing", // incoming, outgoing
      result: "successful", // successful, no_answer, busy, failed
      duration: 120,       // sekundy dla call
      notes: "Umówiono wizytę na jutro",
      initiatedBy: "admin", // user ID
      source: "WebApp"     // WebApp, MobileApp, System
    },
    {
      id: "contact_002", 
      date: "2025-09-28T15:30:00Z",
      type: "sms",
      direction: "outgoing",
      result: "sent",
      message: "Przypomnienie o wizycie jutro o 10:00",
      initiatedBy: "system",
      source: "System"
    }
  ],
  
  // NOTATKI (Enhanced - już mamy)
  notes: [
    {
      id: "note1",
      content: "Stały klient serwisu AGD", 
      type: "general",
      createdAt: "2025-09-29T10:00:00Z",
      createdBy: "admin"
    }
  ],
  
  // NOWE z mobile - DODATKOWE POLA
  profession: "Inżynier",           // Zawód klienta
  type: "Prywatny",                // Prywatny/Firma  
  needInvoice: true,               // Czy potrzebuje FV
  contactPerson: "Jan Kowalski",   // Osoba kontaktowa
  internalNotes: "Uwagi wewnętrzne", // Notatki tylko dla zespołu
  
  // NOWE - PREFERENCJE KLIENTA
  preferences: {
    contactMethod: "phone",        // phone, email, sms, app
    language: "pl",               // pl, en, de
    currency: "PLN",              // PLN, EUR, USD
    notifications: {
      sms: true,                  // Zgoda na SMS
      email: true,                // Zgoda na email
      push: false,                // Zgoda na push (mobile)
      marketing: false            // Zgoda na marketing
    },
    invoicePreference: "email",   // email, mail, pickup
    paymentMethod: "cash"         // cash, card, transfer
  },
  
  // NOWE - MOBILE SPECIFIC
  mobileData: {
    hasApp: false,                // Czy ma aplikację mobilną
    pushToken: null,              // Token push notifications
    lastAppActivity: null,        // Ostatnia aktywność w app
    appVersion: null              // Wersja aplikacji
  },
  
  // LOKALIZACJA GPS (NOWE z mobile)
  location: {
    lat: 52.2297,
    lng: 21.0122, 
    accuracy: 10,
    timestamp: "2025-09-29T10:00:00Z",
    source: "manual"              // manual, gps, geocoded
  },
  
  // STATYSTYKI (Enhanced - już mamy)
  stats: {
    totalOrders: 15,
    totalRevenue: 3500.00,
    lastOrderDate: "2025-09-20",
    averageRating: 4.8,
    loyaltyPoints: 150            // NOWE - punkty lojalnościowe
  },
  
  // DEFAULTS z mobile (NOWE)
  defaults: {
    firstName: "Jan",
    lastName: "Kowalski", 
    address: "ul. Przykładowa 123",
    phoneIdx: 0                   // Domyślny telefon (indeks)
  },
  
  // METADATA (Enhanced + mobile)
  status: "active",               // active, inactive, blocked
  enhanced: true,                 // Czy używa nowej struktury
  version: "2.0-mobile",          // Wersja struktury danych
  createdAt: "2025-09-29T10:00:00Z",
  updatedAt: "2025-09-29T10:00:00Z", 
  createdBy: "admin",
  lastModifiedBy: "admin",
  
  // MIGRACJA (istniejące)
  migrated: true,
  migrationDate: "2025-09-29T10:00:00Z",
  migrationSource: "mobile-integration"
};

// ========== VALIDATION SCHEMA ==========
const CLIENT_VALIDATION_RULES = {
  required: {
    web: ["name", "phones", "addresses"],
    mobile: ["name", "phone", "address"],
    server: ["name", "email", "phones"]
  },
  
  optional: {
    gps: ["location.lat", "location.lng"],
    company: ["companyInfo.nip", "companyInfo.regon"],
    mobile: ["mobileData.pushToken", "groups"],
    contact: ["contactHistory", "preferences"]
  },
  
  validation: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^(\+48\s?)?[\d\s\-]{9,}$/,
    nip: /^\d{10}$/,
    coordinates: {
      lat: { min: -90, max: 90 },
      lng: { min: -180, max: 180 }
    }
  }
};

// ========== MIGRATION HELPERS ==========
const MIGRATION_HELPERS = {
  // Konwersja z mobile do enhanced
  fromMobile(mobileClient) {
    return {
      ...ENHANCED_CLIENT_STRUCTURE,
      id: mobileClient.id,
      name: mobileClient.name,
      email: mobileClient.email,
      
      // Mobile phones -> Enhanced phones
      phones: [
        {
          number: mobileClient.phone,
          label: "Główny",
          isPrimary: true,
          canCall: true,
          canSMS: true
        },
        ...((mobileClient.phones || []).map(p => ({
          number: p.number || p,
          label: p.label || "Dodatkowy",
          isPrimary: false,
          canCall: true,
          canSMS: true
        })))
      ],
      
      // Mobile location -> Enhanced GPS
      location: mobileClient.location ? {
        lat: mobileClient.location.lat,
        lng: mobileClient.location.lng,
        accuracy: mobileClient.location.accuracy || 10,
        timestamp: new Date().toISOString(),
        source: "mobile"
      } : null,
      
      // Mobile GUS data
      companyInfo: {
        ...ENHANCED_CLIENT_STRUCTURE.companyInfo,
        nip: mobileClient.nip || "",
        regon: mobileClient.regon || "",
        krs: mobileClient.krs || "",
        gusCompany: mobileClient.gusCompany || null,
        gusVatStatus: mobileClient.gusVatStatus || null
      },
      
      // Mobile groups i tags
      groups: mobileClient.groups || [],
      tags: mobileClient.tags || [],
      
      // Mobile contact history
      contactHistory: mobileClient.contactHistory || [],
      
      // Mobile work hours -> Enhanced availability
      availability: {
        ...ENHANCED_CLIENT_STRUCTURE.availability,
        workHours: mobileClient.workHours || []
      },
      
      migrationSource: "mobile-to-enhanced",
      migrationDate: new Date().toISOString()
    };
  },
  
  // Konwersja z enhanced do mobile (kompatybilność)
  toMobile(enhancedClient) {
    return {
      id: enhancedClient.id,
      name: enhancedClient.name,
      email: enhancedClient.email,
      phone: enhancedClient.phones?.[0]?.number || "",
      address: enhancedClient.addresses?.[0]?.street || "",
      
      // Enhanced -> Mobile format
      phones: enhancedClient.phones?.slice(1) || [],
      location: enhancedClient.location,
      nip: enhancedClient.companyInfo?.nip || "",
      regon: enhancedClient.companyInfo?.regon || "",
      krs: enhancedClient.companyInfo?.krs || "",
      gusCompany: enhancedClient.companyInfo?.gusCompany,
      gusVatStatus: enhancedClient.companyInfo?.gusVatStatus,
      
      groups: enhancedClient.groups || [],
      tags: enhancedClient.tags || [],
      contactHistory: enhancedClient.contactHistory || [],
      workHours: enhancedClient.availability?.workHours || []
    };
  }
};

// ========== PRZYKŁAD UŻYCIA ==========
const EXAMPLE_USAGE = {
  // Tworzenie nowego klienta Enhanced
  createEnhancedClient: (basicData) => ({
    ...ENHANCED_CLIENT_STRUCTURE,
    ...basicData,
    id: generateClientId(), 
    createdAt: new Date().toISOString(),
    version: "2.0-mobile"
  }),
  
  // Upgrade istniejącego klienta
  upgradeToEnhanced: (oldClient) => ({
    ...oldClient,
    ...ENHANCED_CLIENT_STRUCTURE,
    // Zachowaj stare dane
    name: oldClient.name,
    email: oldClient.email,
    phones: oldClient.phones || [
      {
        number: oldClient.phone,
        label: "Główny", 
        isPrimary: true
      }
    ],
    enhanced: true,
    version: "2.0-mobile",
    migrationDate: new Date().toISOString()
  })
};

module.exports = {
  ENHANCED_CLIENT_STRUCTURE,
  CLIENT_VALIDATION_RULES,
  MIGRATION_HELPERS,
  EXAMPLE_USAGE
};