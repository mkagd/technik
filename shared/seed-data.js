/**
 * DANE INICJALIZACYJNE - SEED DATA
 * Przykładowe dane do uruchomienia systemu
 */

const SEED_DATA = {
  
  // ========== SPECJALIZACJE ==========
  specializations: [
    { id: 1, name: "Laptopy", category: "Hardware", description: "Naprawa i serwis laptopów" },
    { id: 2, name: "Komputery stacjonarne", category: "Hardware", description: "Naprawa PC" },
    { id: 3, name: "Drukarki", category: "Hardware", description: "Serwis drukarek i urządzeń wielofunkcyjnych" },
    { id: 4, name: "Sieci komputerowe", category: "Network", description: "Konfiguracja i naprawa sieci" },
    { id: 5, name: "Windows", category: "Software", description: "Instalacja i naprawa Windows" },
    { id: 6, name: "Linux", category: "Software", description: "Systemy Linux i Unix" },
    { id: 7, name: "Odzyskiwanie danych", category: "Hardware", description: "Ratowanie danych z uszkodzonych nośników" },
    { id: 8, name: "Telefony", category: "Hardware", description: "Serwis smartfonów i tabletów" }
  ],

  // ========== PRACOWNICY (przykładowi) ==========
  employees: [
    {
      id: 1,
      employeeId: "EMP001",
      firstName: "Anna",
      lastName: "Kowalska", 
      email: "anna.kowalska@serwis.pl",
      phone: "+48111222333",
      position: "Starszy Technik",
      department: "Serwis",
      role: "technician",
      hourlyRate: 75.00,
      isActive: true,
      canAccessMobile: true,
      canManageOrders: true,
      passwordHash: "hashed_password_here",
      workingHours: {
        monday: { start: "08:00", end: "16:00", isWorking: true },
        tuesday: { start: "08:00", end: "16:00", isWorking: true },
        wednesday: { start: "08:00", end: "16:00", isWorking: true },
        thursday: { start: "08:00", end: "16:00", isWorking: true },
        friday: { start: "08:00", end: "16:00", isWorking: true },
        saturday: { start: "09:00", end: "13:00", isWorking: false },
        sunday: { start: "00:00", end: "00:00", isWorking: false }
      }
    },
    {
      id: 2,
      employeeId: "EMP002", 
      firstName: "Marcin",
      lastName: "Nowak",
      email: "marcin.nowak@serwis.pl",
      phone: "+48222333444",
      position: "Kierownik Serwisu",
      department: "Serwis",
      role: "manager",
      hourlyRate: 90.00,
      isActive: true,
      canAccessMobile: true,
      canAccessAdmin: true,
      canManageOrders: true,
      canManageClients: true,
      canViewReports: true,
      passwordHash: "hashed_password_here"
    },
    {
      id: 3,
      employeeId: "ADM001",
      firstName: "Katarzyna", 
      lastName: "Wiśniewska",
      email: "admin@serwis.pl",
      phone: "+48333444555",
      position: "Administrator Systemu",
      department: "IT",
      role: "admin",
      isActive: true,
      canAccessMobile: true,
      canAccessAdmin: true,
      canManageOrders: true,
      canManageClients: true,
      canViewReports: true,
      passwordHash: "hashed_password_here"
    }
  ],

  // ========== KLIENCI (przykładowi) ==========
  clients: [
    {
      id: 1,
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan.kowalski@email.com",
      phone: "+48500123456",
      address: "ul. Główna 15",
      city: "Warszawa",
      postalCode: "00-001",
      customerType: "individual",
      preferredContact: "phone",
      allowNotifications: true,
      isActive: true
    },
    {
      id: 2,
      firstName: "Maria",
      lastName: "Nowak", 
      email: "biuro@firma-abc.pl",
      phone: "+48600234567",
      address: "ul. Biznesowa 10",
      city: "Kraków", 
      postalCode: "30-001",
      company: "Firma ABC Sp. z o.o.",
      nip: "1234567890",
      customerType: "business",
      preferredContact: "email",
      allowNotifications: true,
      allowSMS: false
    }
  ],

  // ========== MAGAZYN (przykładowe części) ==========
  inventory: [
    {
      id: 1,
      partNumber: "RAM-DDR4-8GB-001",
      name: "RAM DDR4 8GB Kingston ValueRAM",
      category: "Pamięć",
      brand: "Kingston",
      model: "ValueRAM KVR26N19S8/8",
      quantity: 25,
      minQuantity: 5,
      maxQuantity: 100,
      purchasePrice: 120.00,
      sellPrice: 180.00,
      location: "Magazyn A - Półka 3",
      barcode: "1234567890123"
    },
    {
      id: 2,
      partNumber: "SSD-500GB-001", 
      name: "SSD 500GB Samsung 980",
      category: "Dyski",
      brand: "Samsung",
      model: "980 NVMe SSD 500GB",
      quantity: 15,
      minQuantity: 3,
      maxQuantity: 50,
      purchasePrice: 250.00,
      sellPrice: 380.00,
      location: "Magazyn A - Półka 1"
    },
    {
      id: 3,
      partNumber: "HDD-1TB-001",
      name: "HDD 1TB Seagate BarraCuda", 
      category: "Dyski",
      brand: "Seagate",
      model: "BarraCuda 1TB",
      quantity: 10,
      minQuantity: 2,
      maxQuantity: 30,
      purchasePrice: 180.00,
      sellPrice: 280.00,
      location: "Magazyn A - Półka 2"
    },
    {
      id: 4,
      partNumber: "PSU-500W-001",
      name: "Zasilacz 500W be quiet!",
      category: "Zasilanie", 
      brand: "be quiet!",
      model: "System Power 9 500W",
      quantity: 8,
      minQuantity: 2,
      maxQuantity: 20,
      purchasePrice: 220.00,
      sellPrice: 320.00,
      location: "Magazyn B - Półka 1"
    }
  ],

  // ========== USTAWIENIA SYSTEMU ==========
  settings: [
    // Dane firmy
    { key: "company_name", value: "Serwis Technik Pro", type: "string", category: "company", description: "Nazwa firmy" },
    { key: "company_address", value: "ul. Serwisowa 123, 00-001 Warszawa", type: "string", category: "company", description: "Adres firmy" },
    { key: "company_phone", value: "+48123456789", type: "string", category: "company", description: "Telefon firmy" },
    { key: "company_email", value: "kontakt@serwis.pl", type: "string", category: "company", description: "Email firmy" },
    { key: "company_nip", value: "1234567890", type: "string", category: "company", description: "NIP firmy" },
    
    // Ustawienia serwisu
    { key: "default_warranty_months", value: "12", type: "number", category: "service", description: "Domyślna gwarancja w miesiącach" },
    { key: "default_priority", value: "medium", type: "string", category: "service", description: "Domyślny priorytet zlecenia" },
    { key: "auto_assign_technician", value: "false", type: "boolean", category: "service", description: "Automatyczne przypisywanie technika" },
    { key: "require_client_approval", value: "true", type: "boolean", category: "service", description: "Wymagaj akceptacji klienta" },
    
    // Powiadomienia mobilne
    { key: "enable_push_notifications", value: "true", type: "boolean", category: "mobile", description: "Włącz powiadomienia push" },
    { key: "enable_sms_notifications", value: "true", type: "boolean", category: "mobile", description: "Włącz powiadomienia SMS" },
    { key: "reminder_hours_before", value: "24", type: "number", category: "mobile", description: "Przypomnienie na X godzin przed" },
    
    // Email
    { key: "email_smtp_host", value: "smtp.gmail.com", type: "string", category: "email", description: "Serwer SMTP" },
    { key: "email_smtp_port", value: "587", type: "number", category: "email", description: "Port SMTP" },
    { key: "email_username", value: "", type: "string", category: "email", description: "Login email" },
    { key: "email_from_name", value: "Serwis Technik Pro", type: "string", category: "email", description: "Nazwa nadawcy" },
    
    // Magazyn
    { key: "low_inventory_threshold", value: "5", type: "number", category: "inventory", description: "Próg niskiego stanu" },
    { key: "auto_order_parts", value: "false", type: "boolean", category: "inventory", description: "Automatyczne zamawianie części" },
    
    // System
    { key: "backup_frequency_hours", value: "24", type: "number", category: "system", description: "Częstotliwość backupu (h)" },
    { key: "session_timeout_minutes", value: "120", type: "number", category: "system", description: "Timeout sesji (min)" },
    { key: "max_file_upload_mb", value: "10", type: "number", category: "system", description: "Max rozmiar pliku (MB)" },
    
    // Aplikacja mobilna
    { key: "mobile_app_version", value: "1.0.0", type: "string", category: "mobile", description: "Wersja aplikacji mobilnej" },
    { key: "force_app_update", value: "false", type: "boolean", category: "mobile", description: "Wymuś aktualizację aplikacji" },
    { key: "enable_offline_mode", value: "true", type: "boolean", category: "mobile", description: "Tryb offline" }
  ],

  // ========== PRZYKŁADOWE ZLECENIA ==========
  orders: [
    {
      id: 1,
      orderNumber: "SRV-2024-001",
      clientId: 1,
      employeeId: 1,
      deviceType: "laptop",
      brand: "Dell",
      model: "Inspiron 15 3000",
      serviceType: "naprawa",
      category: "Hardware", 
      problemDescription: "Laptop się nie włącza, brak reakcji na przycisk power",
      status: "in_progress",
      priority: "high",
      estimatedCost: 300.00,
      requiresPickup: false,
      requiresDelivery: true,
      notes: "Klient pilnie potrzebuje laptopa do pracy",
      createdAt: "2024-01-15T10:00:00Z"
    },
    {
      id: 2,
      orderNumber: "SRV-2024-002", 
      clientId: 2,
      deviceType: "desktop",
      brand: "HP",
      model: "ProDesk 400 G7",
      serviceType: "instalacja",
      category: "Software",
      problemDescription: "Instalacja systemu Windows 11 i oprogramowania biurowego",
      status: "pending",
      priority: "medium",
      estimatedCost: 200.00,
      requiresPickup: true,
      requiresDelivery: true,
      createdAt: "2024-01-16T14:30:00Z"
    }
  ]
};

// Funkcja do generowania numerów zleceń
function generateOrderNumber(year = new Date().getFullYear()) {
  // Pobierz ostatni numer z bazy danych lub użyj 1
  const lastNumber = 1; // w rzeczywistości pobieraj z bazy
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `SRV-${year}-${nextNumber}`;
}

// Funkcja do generowania ID pracownika
function generateEmployeeId(department) {
  const prefixes = {
    'Serwis': 'EMP',
    'IT': 'ADM',
    'Biuro': 'OFF'
  };
  
  const prefix = prefixes[department] || 'EMP';
  const lastNumber = 1; // w rzeczywistości pobieraj z bazy
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `${prefix}${nextNumber}`;
}

module.exports = {
  SEED_DATA,
  generateOrderNumber,
  generateEmployeeId
};