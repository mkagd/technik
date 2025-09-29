# SYSTEM SERWISANTÓW - DOKUMENTACJA

## 📋 Przegląd Systemu

System serwisantów jest zbudowany w oparciu o model relacyjny:
**Serwisant** → **Klient** → **Wizyty** → **Zlecenia**

### 🏗️ Architektura Danych

```
SERWISANT (Jan Kowalski)
    ↓
GŁÓWNY KLIENT (Szkoła Podstawowa Nr 5)
    ↓
WIZYTY (rutynowe, awaryjne, konserwacje)
    ↓  
ZLECENIA (konkretne naprawy/prace podczas wizyty)
```

### 📊 Schematy Tabel

#### 1. **servicemen** - Serwisanci
```sql
CREATE TABLE servicemen (
    id INT PRIMARY KEY AUTO_INCREMENT,
    servicemanId VARCHAR(20) UNIQUE,     -- SRV001
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    primaryClientId INT,                 -- Główny klient serwisanta
    specializations JSON,                -- ["laptopy", "drukarki"]
    isActive BOOLEAN DEFAULT true,
    workingHours JSON,                   -- Godziny pracy
    emergencyPhone VARCHAR(20),
    canAccessMobile BOOLEAN DEFAULT true,
    mobileToken VARCHAR(255),
    pushToken VARCHAR(255),
    lastKnownLocation JSON,              -- GPS tracking
    notes TEXT,
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME DEFAULT NOW() ON UPDATE NOW()
);
```

#### 2. **serviceman_visits** - Wizyty
```sql
CREATE TABLE serviceman_visits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visitNumber VARCHAR(20) UNIQUE,      -- VIS-2024-001
    servicemanId INT,
    clientId INT,
    scheduledDate DATETIME NOT NULL,
    estimatedDuration INT DEFAULT 120,   -- minuty
    actualStartTime DATETIME,
    actualEndTime DATETIME,
    actualDuration INT,
    status ENUM('scheduled', 'in_transit', 'on_site', 'completed', 'cancelled', 'postponed'),
    clientAddress TEXT NOT NULL,
    coordinates JSON,                    -- {lat, lng}
    visitType ENUM('routine', 'emergency', 'follow_up', 'installation', 'maintenance'),
    description TEXT,
    summary TEXT,
    nextVisitRecommended BOOLEAN DEFAULT false,
    nextVisitDate DATE,
    totalCost DECIMAL(10,2) DEFAULT 0,
    laborCost DECIMAL(10,2) DEFAULT 0,
    partsCost DECIMAL(10,2) DEFAULT 0,
    photos JSON,                         -- Zdjęcia z wizyty
    documents JSON,                      -- Dokumenty
    clientSignature TEXT,                -- Podpis cyfrowy (base64)
    clientName VARCHAR(100),
    clientRating INT,                    -- 1-5
    clientFeedback TEXT,
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME DEFAULT NOW() ON UPDATE NOW()
);
```

#### 3. **visit_orders** - Zlecenia w ramach wizyty
```sql
CREATE TABLE visit_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orderNumber VARCHAR(20) UNIQUE,      -- ORD-VIS-001
    visitId INT NOT NULL,
    servicemanId INT NOT NULL,
    clientId INT NOT NULL,
    deviceType VARCHAR(50) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(100),
    serialNumber VARCHAR(100),
    location VARCHAR(100),               -- "Sala 101"
    problemDescription TEXT NOT NULL,
    diagnosis TEXT,
    solutionDescription TEXT,
    status ENUM('pending', 'in_progress', 'waiting_parts', 'completed', 'deferred'),
    priority ENUM('low', 'medium', 'high', 'critical'),
    startTime DATETIME,
    endTime DATETIME,
    timeSpentMinutes INT,
    partsUsed JSON,                      -- Użyte części
    laborCost DECIMAL(10,2) DEFAULT 0,
    partsCost DECIMAL(10,2) DEFAULT 0,
    totalCost DECIMAL(10,2) DEFAULT 0,
    beforePhotos JSON,
    afterPhotos JSON,
    recommendations TEXT,
    preventiveMaintenance TEXT,
    warrantyMonths INT DEFAULT 3,
    warrantyNotes TEXT,
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME DEFAULT NOW() ON UPDATE NOW()
);
```

## 🔄 Workflow Statusów

### Statusy Wizyt
```
scheduled → in_transit → on_site → completed
    ↓           ↓           ↓
cancelled   cancelled   postponed
    ↓           
postponed → scheduled
```

### Statusy Zleceń
```
pending → in_progress → completed
    ↓         ↓
deferred  waiting_parts → in_progress
```

## 📱 Integracja z Aplikacją Mobilną

### Funkcje dla Serwisantów:
- **GPS Tracking** - śledzenie lokalizacji podczas wizyt
- **Offline Mode** - praca bez internetu z synchronizacją
- **Quick Visit Start** - szybkie rozpoczęcie wizyty jednym dotknięciem
- **Digital Signatures** - podpisy cyfrowe klientów
- **Photo Documentation** - zdjęcia przed/po naprawie
- **Voice Notes** - notatki głosowe podczas pracy

### Push Notifications:
- `visit_scheduled` - "Wizyta zaplanowana na jutro 9:00"
- `visit_starting` - "Czas na wizytę u Szkoły Podstawowej Nr 5"
- `visit_arrived` - "Serwisant dotarł na miejsce"
- `visit_completed` - "Wizyta zakończona, podsumowanie dostępne"

## 🎯 Przykłady Użycia

### 1. Rozpoczęcie Wizyty (Aplikacja Mobilna)
```javascript
// Serwisant klika "Rozpocznij wizytę"
const visit = await ServicemanHelpers.startVisit(visitId, {
  lat: currentLocation.lat,
  lng: currentLocation.lng
});

// System aktualizuje status i wysyła powiadomienie
updateVisitStatus(visit.id, 'in_transit');
sendPushNotification(visit.clientId, 'visit_starting');
```

### 2. Zakończenie Zlecenia
```javascript
// Serwisant kończy naprawę laptopa
const order = await completeOrder(orderId, {
  solutionDescription: "Wymieniony dysk SSD, przywrócone dane",
  timeSpentMinutes: 45,
  partsUsed: [
    { name: "SSD 256GB", quantity: 1, cost: 200.00 }
  ],
  afterPhotos: ["photo1.jpg", "photo2.jpg"],
  recommendations: "Backup danych co tydzień"
});
```

### 3. Podsumowanie Wizyty
```javascript
// Po zakończeniu wszystkich zleceń
const visitSummary = await completeVisit(visitId, {
  summary: "Wymieniony switch, przywrócona sieć",
  nextVisitRecommended: true,
  nextVisitDate: "2025-01-15",
  clientSignature: signatureBase64,
  clientName: "Mgr. Katarzyna Wiśniewska"
});
```

## 📈 Raporty i Analityka

### Raport Miesięczny Serwisanta
- Liczba wizyt: `12`
- Liczba zleceń: `28` 
- Przepracowane godziny: `45.5h`
- Przychód: `2,850 PLN`
- Średnia ocena klientów: `4.8/5`

### Statystyki Klienta
- Ostatnia wizyta: `23.12.2024`
- Następna planowana: `15.01.2025`
- Historia zleceń: `15 ukończonych`
- Całkowity koszt serwisu: `8,200 PLN`

## 🔧 Konfiguracja Systemu

### Specjalizacje Serwisantów
```javascript
const SPECIALIZATIONS = [
  "laptopy", "drukarki", "sieci", "projektory", 
  "kasety_fiskalne", "oprogramowanie", "serwery", 
  "monitoring", "telefonia", "ups"
];
```

### Typy Wizyt
```javascript
const VISIT_TYPES = {
  routine: "Rutynowa konserwacja",
  emergency: "Awaria - pilne",
  follow_up: "Wizyta kontrolna", 
  installation: "Instalacja sprzętu",
  maintenance: "Konserwacja planowa"
};
```

## 🚀 Zalety Systemu

1. **Przejrzystość** - jasna relacja serwisant-klient-wizyty-zlecenia
2. **Mobilność** - pełna funkcjonalność na smartfonie
3. **Dokumentacja** - zdjęcia, podpisy, raporty automatyczne
4. **Śledzenie** - GPS, czasy pracy, koszty
5. **Skalowanie** - łatwe dodawanie nowych serwisantów i klientów
6. **Integracja** - wspólne API z systemem głównym

## 📝 Następne Kroki

1. **API Endpoints** - utworzenie endpointów REST dla aplikacji mobilnej
2. **Migracja Danych** - import istniejących klientów i serwisantów  
3. **Aplikacja Mobilna** - wybór technologii (React Native / Flutter)
4. **Powiadomienia Push** - konfiguracja Firebase/OneSignal
5. **Testy** - unit testy i testy integracyjne

---

*Dokumentacja systemu serwisantów - część centralnej struktury danych aplikacji Technik.*