/**
 * PRZYKŁADOWE DANE DLA SYSTEMU SERWISANTÓW
 * 
 * Model relacji:
 * Serwisant (Jan Kowalski) → Klient (Szkoła Podstawowa Nr 5) → Wizyty → Zlecenia
 */

const SERVICEMAN_SEED_DATA = {

  // ========== SERWISANCI ==========
  servicemen: [
    {
      id: 1,
      servicemanId: "SRV001",
      firstName: "Jan",
      lastName: "Kowalski", 
      email: "jan.kowalski@techserwis.pl",
      phone: "+48 123 456 789",
      primaryClientId: 1, // Szkoła Podstawowa Nr 5
      specializations: ["laptopy", "drukarki", "sieci", "projektory"],
      isActive: true,
      workingHours: {
        monday: { start: "08:00", end: "16:00", available: true },
        tuesday: { start: "08:00", end: "16:00", available: true },
        wednesday: { start: "08:00", end: "16:00", available: true },
        thursday: { start: "08:00", end: "16:00", available: true },
        friday: { start: "08:00", end: "15:00", available: true },
        saturday: { start: "09:00", end: "13:00", available: false },
        sunday: { start: "00:00", end: "00:00", available: false }
      },
      emergencyPhone: "+48 987 654 321",
      canAccessMobile: true,
      mobileToken: "mob_token_12345",
      pushToken: "push_token_abcde",
      lastKnownLocation: {
        lat: 50.0647,
        lng: 19.9450,
        timestamp: "2024-12-26T10:30:00Z"
      },
      notes: "Doświadczony serwisant, specjalizuje się w infrastrukturze IT dla szkół.",
      createdAt: "2024-01-15T08:00:00Z",
      updatedAt: "2024-12-26T10:30:00Z"
    },
    
    {
      id: 2,
      servicemanId: "SRV002",
      firstName: "Anna",
      lastName: "Nowak",
      email: "anna.nowak@techserwis.pl", 
      phone: "+48 234 567 890",
      primaryClientId: 2, // Biuro Rachunkowe CONTA
      specializations: ["drukarki", "skanery", "kaseta_fiskalna", "oprogramowanie"],
      isActive: true,
      workingHours: {
        monday: { start: "07:30", end: "15:30", available: true },
        tuesday: { start: "07:30", end: "15:30", available: true },
        wednesday: { start: "07:30", end: "15:30", available: true },
        thursday: { start: "07:30", end: "15:30", available: true },
        friday: { start: "07:30", end: "15:30", available: true },
        saturday: { start: "00:00", end: "00:00", available: false },
        sunday: { start: "00:00", end: "00:00", available: false }
      },
      emergencyPhone: "+48 876 543 210",
      canAccessMobile: true,
      notes: "Specjalistka od oprogramowania księgowego i urządzeń fiskalnych.",
      createdAt: "2024-02-01T08:00:00Z",
      updatedAt: "2024-12-26T09:15:00Z"
    }
  ],

  // ========== WIZYTY ==========
  serviceman_visits: [
    {
      id: 1,
      visitNumber: "VIS-2024-001",
      servicemanId: 1, // Jan Kowalski
      clientId: 1, // Szkoła Podstawowa Nr 5
      scheduledDate: "2024-12-27T09:00:00Z",
      estimatedDuration: 180, // 3 godziny
      
      actualStartTime: null,
      actualEndTime: null,
      actualDuration: null,
      
      status: "scheduled",
      
      clientAddress: "ul. Szkolna 15, 31-123 Kraków",
      coordinates: { lat: 50.0647, lng: 19.9450 },
      
      visitType: "routine",
      description: "Comiesięczny przegląd i konserwacja sprzętu IT w szkole",
      
      summary: null,
      nextVisitRecommended: false,
      nextVisitDate: null,
      
      totalCost: 0,
      laborCost: 0,
      partsCost: 0,
      
      photos: [],
      documents: [],
      
      clientSignature: null,
      clientName: null,
      clientRating: null,
      clientFeedback: null,
      
      createdAt: "2024-12-20T10:00:00Z",
      updatedAt: "2024-12-20T10:00:00Z"
    },
    
    {
      id: 2,
      visitNumber: "VIS-2024-002", 
      servicemanId: 1, // Jan Kowalski
      clientId: 1, // Szkoła Podstawowa Nr 5
      scheduledDate: "2024-12-23T14:00:00Z",
      estimatedDuration: 90,
      
      actualStartTime: "2024-12-23T14:05:00Z",
      actualEndTime: "2024-12-23T15:45:00Z",
      actualDuration: 100,
      
      status: "completed",
      
      clientAddress: "ul. Szkolna 15, 31-123 Kraków",
      coordinates: { lat: 50.0647, lng: 19.9450 },
      
      visitType: "emergency",
      description: "Awaria sieci w pracowni komputerowej - brak internetu",
      
      summary: "Wymieniony został uszkodzony switch sieciowy. Przywrócono połączenie internetowe we wszystkich pracowniach. Zalecam zakup zapasowego switch'a.",
      nextVisitRecommended: true,
      nextVisitDate: "2025-01-15",
      
      totalCost: 350.00,
      laborCost: 200.00,
      partsCost: 150.00,
      
      photos: [
        {
          url: "/uploads/visits/vis-002-before-1.jpg",
          description: "Uszkodzony switch przed wymianą",
          timestamp: "2024-12-23T14:15:00Z",
          type: "before"
        },
        {
          url: "/uploads/visits/vis-002-after-1.jpg", 
          description: "Nowy switch po instalacji",
          timestamp: "2024-12-23T15:30:00Z",
          type: "after"
        }
      ],
      
      documents: [
        {
          url: "/uploads/visits/vis-002-invoice.pdf",
          name: "Faktura za części",
          type: "invoice"
        }
      ],
      
      clientSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhE...", // base64
      clientName: "Mgr. Katarzyna Wiśniewska - Dyrektor",
      clientRating: 5,
      clientFeedback: "Bardzo szybka i profesjonalna pomoc. Polecam!",
      
      createdAt: "2024-12-23T10:00:00Z",
      updatedAt: "2024-12-23T16:00:00Z"
    },

    {
      id: 3,
      visitNumber: "VIS-2024-003",
      servicemanId: 2, // Anna Nowak
      clientId: 2, // Biuro Rachunkowe CONTA
      scheduledDate: "2024-12-28T10:00:00Z",
      estimatedDuration: 120,
      
      actualStartTime: null,
      actualEndTime: null,
      actualDuration: null,
      
      status: "scheduled",
      
      clientAddress: "ul. Krakowska 25/3, 31-066 Kraków",
      coordinates: { lat: 50.0619, lng: 19.9399 },
      
      visitType: "maintenance",
      description: "Konserwacja drukarek fiskalnych i aktualizacji oprogramowania",
      
      summary: null,
      nextVisitRecommended: false,
      nextVisitDate: null,
      
      totalCost: 0,
      laborCost: 0,
      partsCost: 0,
      
      photos: [],
      documents: [],
      
      clientSignature: null,
      clientName: null,
      clientRating: null,
      clientFeedback: null,
      
      createdAt: "2024-12-25T14:00:00Z",
      updatedAt: "2024-12-25T14:00:00Z"
    }
  ],

  // ========== ZLECENIA W WIZYTACH ==========
  visit_orders: [
    // Zlecenia dla wizyty VIS-2024-002 (ukończonej)
    {
      id: 1,
      orderNumber: "ORD-VIS2-001",
      visitId: 2,
      servicemanId: 1, // Jan Kowalski
      clientId: 1, // Szkoła
      
      deviceType: "Switch sieciowy",
      brand: "TP-Link",
      model: "TL-SG1016D",
      serialNumber: "20231204001", 
      location: "Pracownia komputerowa - sala 12",
      
      problemDescription: "Switch nie odpowiada, brak światła LED, prawdopodobnie spalony zasilacz",
      diagnosis: "Uszkodzony zasilacz wewnętrzny switch'a. Wymagana wymiana całego urządzenia.",
      solutionDescription: "Wymieniony switch na nowy model TP-Link TL-SG1024D (24 porty). Skonfigurowane wszystkie połączenia. Przywrócono łączność sieciową.",
      
      status: "completed",
      priority: "high",
      
      startTime: "2024-12-23T14:10:00Z",
      endTime: "2024-12-23T15:30:00Z", 
      timeSpentMinutes: 80,
      
      partsUsed: [
        { name: "Switch TP-Link TL-SG1024D", quantity: 1, cost: 150.00 }
      ],
      
      laborCost: 200.00,
      partsCost: 150.00,
      totalCost: 350.00,
      
      beforePhotos: [
        { 
          url: "/uploads/orders/ord-1-before-1.jpg",
          description: "Uszkodzony switch",
          timestamp: "2024-12-23T14:15:00Z"
        }
      ],
      
      afterPhotos: [
        {
          url: "/uploads/orders/ord-1-after-1.jpg",
          description: "Nowy switch po instalacji",
          timestamp: "2024-12-23T15:25:00Z"
        }
      ],
      
      recommendations: "Zalecam zakup zapasowego switch'a oraz UPS do zabezpieczenia sprzętu sieciowego.",
      preventiveMaintenance: "Kontrola połączeń co 3 miesiące, czyszczenie kurzu co 6 miesięcy.",
      
      warrantyMonths: 24,
      warrantyNotes: "Gwarancja producenta na switch + 6 miesięcy gwarancji na wykonane prace serwisowe.",
      
      createdAt: "2024-12-23T14:10:00Z",
      updatedAt: "2024-12-23T15:45:00Z"
    },

    // Zlecenia dla przyszłej wizyty VIS-2024-001 
    {
      id: 2,
      orderNumber: "ORD-VIS1-001",
      visitId: 1,
      servicemanId: 1, // Jan Kowalski
      clientId: 1, // Szkoła
      
      deviceType: "Laptopy uczniowskie",
      brand: "Lenovo",
      model: "ThinkPad E15", 
      serialNumber: "Seria 20 urządzeń",
      location: "Pracownia komputerowa - sala 15",
      
      problemDescription: "Rutynowa konserwacja: czyszczenie, aktualizacje, sprawdzenie wydajności",
      diagnosis: "",
      solutionDescription: "",
      
      status: "pending",
      priority: "medium",
      
      startTime: null,
      endTime: null,
      timeSpentMinutes: null,
      
      partsUsed: [],
      
      laborCost: 0,
      partsCost: 0,
      totalCost: 0,
      
      beforePhotos: [],
      afterPhotos: [],
      
      recommendations: "",
      preventiveMaintenance: "",
      
      warrantyMonths: 3,
      warrantyNotes: "",
      
      createdAt: "2024-12-20T10:00:00Z",
      updatedAt: "2024-12-20T10:00:00Z"
    },

    {
      id: 3,
      orderNumber: "ORD-VIS1-002",
      visitId: 1,
      servicemanId: 1, // Jan Kowalski
      clientId: 1, // Szkoła
      
      deviceType: "Drukarki",
      brand: "HP",
      model: "LaserJet Pro MFP M428fdw",
      serialNumber: "HP001, HP002, HP003",
      location: "Sekretariat, Biblioteka, Sala nauczycielska",
      
      problemDescription: "Rutynowa konserwacja drukarek: wymiana tonerów, czyszczenie, test funkcji",
      diagnosis: "",
      solutionDescription: "",
      
      status: "pending",
      priority: "medium",
      
      startTime: null,
      endTime: null,
      timeSpentMinutes: null,
      
      partsUsed: [],
      
      laborCost: 0,
      partsCost: 0,
      totalCost: 0,
      
      beforePhotos: [],
      afterPhotos: [],
      
      recommendations: "",
      preventiveMaintenance: "",
      
      warrantyMonths: 3,
      warrantyNotes: "",
      
      createdAt: "2024-12-20T10:05:00Z",
      updatedAt: "2024-12-20T10:05:00Z"
    },

    // Zlecenia dla wizyty Anna Nowak
    {
      id: 4,
      orderNumber: "ORD-VIS3-001",
      visitId: 3,
      servicemanId: 2, // Anna Nowak
      clientId: 2, // Biuro rachunkowe
      
      deviceType: "Drukarka fiskalna",
      brand: "Posnet",
      model: "Thermal HD",
      serialNumber: "POS2024001",
      location: "Stanowisko księgowej głównej",
      
      problemDescription: "Konserwacja okresowa drukarki fiskalnej + aktualizacja stawek VAT",
      diagnosis: "",
      solutionDescription: "",
      
      status: "pending",
      priority: "high",
      
      startTime: null,
      endTime: null,
      timeSpentMinutes: null,
      
      partsUsed: [],
      
      laborCost: 0,
      partsCost: 0,
      totalCost: 0,
      
      beforePhotos: [],
      afterPhotos: [],
      
      recommendations: "",
      preventiveMaintenance: "",
      
      warrantyMonths: 12,
      warrantyNotes: "Gwarancja na konfigurację fiskalną",
      
      createdAt: "2024-12-25T14:00:00Z",
      updatedAt: "2024-12-25T14:00:00Z"
    }
  ],

  // ========== HARMONOGRAM SERWISANTÓW ==========
  serviceman_schedule: [
    // Harmonogram Jan Kowalski - 27.12.2024
    {
      id: 1,
      servicemanId: 1,
      date: "2024-12-27",
      startTime: "08:00",
      endTime: "09:00",
      type: "travel",
      visitId: null,
      description: "Dojazd do Szkoły Podstawowej Nr 5",
      location: "ul. Szkolna 15, Kraków",
      isRecurring: false,
      createdAt: "2024-12-20T10:00:00Z"
    },
    
    {
      id: 2,
      servicemanId: 1,
      date: "2024-12-27",
      startTime: "09:00",
      endTime: "12:00",
      type: "work", 
      visitId: 1,
      description: "Wizyta serwisowa - konserwacja sprzętu IT",
      location: "Szkoła Podstawowa Nr 5",
      isRecurring: false,
      createdAt: "2024-12-20T10:00:00Z"
    },
    
    {
      id: 3,
      servicemanId: 1,
      date: "2024-12-27",
      startTime: "12:00", 
      endTime: "13:00",
      type: "break",
      visitId: null,
      description: "Przerwa obiadowa",
      location: "Restauracja Smak",
      isRecurring: false,
      createdAt: "2024-12-20T10:00:00Z"
    },

    // Harmonogram Anna Nowak - 28.12.2024
    {
      id: 4,
      servicemanId: 2,
      date: "2024-12-28",
      startTime: "09:30",
      endTime: "10:00",
      type: "travel",
      visitId: null,
      description: "Dojazd do Biura Rachunkowego CONTA",
      location: "ul. Krakowska 25/3, Kraków",
      isRecurring: false,
      createdAt: "2024-12-25T14:00:00Z"
    },
    
    {
      id: 5,
      servicemanId: 2,
      date: "2024-12-28", 
      startTime: "10:00",
      endTime: "12:00",
      type: "work",
      visitId: 3,
      description: "Konserwacja drukarek fiskalnych",
      location: "Biuro Rachunkowe CONTA",
      isRecurring: false,
      createdAt: "2024-12-25T14:00:00Z"
    }
  ],

  // ========== RAPORTY SERWISANTÓW ==========
  serviceman_reports: [
    {
      id: 1,
      reportNumber: "RPT-2024-001",
      servicemanId: 1, // Jan Kowalski
      clientId: 1, // Szkoła
      
      periodStart: "2024-12-01",
      periodEnd: "2024-12-31",
      
      totalVisits: 2,
      totalOrders: 3,
      totalHours: 4.5,
      totalRevenue: 350.00,
      
      summary: "W grudniu 2024 wykonane zostały 2 wizyty w Szkole Podstawowej Nr 5. Głównym zdarzeniem była awaryjna wymiana switch'a sieciowego, która została zakończona sukcesem. Planowana jest wizyta konserwacyjna w styczniu 2025.",
      
      issues: "Jedna awaria sprzętu sieciowego - switch 16-portowy. Zalecam zakup zapasowego sprzętu.",
      
      recommendations: "1. Zakup zapasowego switch'a sieciowego\n2. Instalacja UPS dla sprzętu sieciowego\n3. Regularne kopie zapasowe konfiguracji sieci",
      
      status: "submitted",
      pdfPath: "/reports/serviceman/rpt-2024-001.pdf",
      
      createdAt: "2024-12-31T16:00:00Z",
      submittedAt: "2024-12-31T16:30:00Z",
      approvedAt: null
    }
  ]
};

module.exports = {
  SERVICEMAN_SEED_DATA
};