# 🏗️ Architektura Systemu Wizyt - Dokumentacja

## 📋 Spis treści
1. [Hierarchia danych](#hierarchia-danych)
2. [Workflow biznesowy](#workflow-biznesowy)
3. [Struktura danych](#struktura-danych)
4. [API i Planer](#api-i-planer)
5. [UI - Wyświetlanie](#ui-wyświetlanie)
6. [Przykłady użycia](#przykłady-użycia)

---

## 🎯 Hierarchia danych

System bazuje na trójpoziomowej hierarchii:

```
KLIENT (Client)
  ├── ID: CLI25271002
  ├── Dane kontaktowe
  └── ZLECENIA (Orders) ⬇️
       ├── ID: ORDA25271002
       ├── Urządzenie (zmywarka, pralka, lodówka)
       ├── Problem/Opis
       └── WIZYTY (Visits) ⬇️ ← TO PLANUJEMY!
            ├── VIS252730001 - Diagnoza
            ├── VIS252750002 - Naprawa
            └── VIS252760003 - Kontrola
```

### Kluczowe zasady:
- ✅ **Jeden klient** może mieć **wiele zleceń**
- ✅ **Jedno zlecenie** może mieć **wiele wizyt**
- ✅ **Planer optymalizuje WIZYTY**, nie zlecenia
- ✅ Każda wizyta ma unikalny `visitId` w formacie `VIS + rok + dzień + numer`

---

## 📞 Workflow biznesowy

### Scenariusz 1: Nowe zgłoszenie

```
1. Klient dzwoni 📞
   └─> "Moja zmywarka nie grzeje wody"

2. Pracownik tworzy ZLECENIE 📋
   ├─ Zapisuje dane klienta (jeśli nowy)
   ├─ Zapisuje dane urządzenia (marka, model, opis)
   ├─ Tworzy zlecenie z ID: ORDA25271002
   └─ Ustala pierwszą wizytę

3. Planowanie pierwszej wizyty 📅
   ├─ Typ: "diagnosis" (diagnoza)
   ├─ Data: 2025-09-30
   ├─ Technik: Jan Kowalski
   └─ Generuje visitId: VIS252730001
```

### Scenariusz 2: Kolejne wizyty

```
Po diagnozie:
├─ Status wizyty #1: "completed"
└─ Technik tworzy wizytę #2:
   ├─ Typ: "repair" (naprawa)
   ├─ Data: 2025-10-02
   └─ visitId: VIS252750002

Po naprawie:
└─ Technik może dodać wizytę #3:
   ├─ Typ: "control" (kontrola)
   ├─ Data: 2025-10-10
   └─ visitId: VIS252770003
```

### Typy wizyt:
- 🔍 **diagnosis** - Diagnoza problemu
- 🔧 **repair** - Naprawa
- ✅ **control** - Kontrola po naprawie
- 📦 **installation** - Montaż/Instalacja

---

## 💾 Struktura danych

### Format zlecenia z wizytami (`data/orders.json`)

```json
{
  "id": 1002,
  "orderNumber": "ORDA25271002",
  "source": "phone",
  
  "clientId": "CLI25271002",
  "clientName": "Katarzyna Kowalska",
  "clientPhone": "+48 606 789 123",
  "clientEmail": "k.kowalska@email.com",
  "address": "ul. Krakowska 25/10, Kraków",
  
  "category": "Serwis AGD",
  "deviceType": "Zmywarka",
  "brand": "Bosch",
  "model": "SMS46KI03E",
  "serialNumber": "BSH2024-456123",
  
  "description": "Zmywarka nie grzeje wody, naczynia wychodzą zimne.",
  "symptoms": ["Nie grzeje wody", "Zimne naczynia"],
  
  "status": "assigned",
  "priority": "medium",
  "estimatedCost": 220,
  
  "visits": [
    {
      "visitId": "VIS252730001",
      "visitNumber": 1,
      "type": "diagnosis",
      "scheduledDate": "2025-09-30T09:00:00Z",
      "scheduledTime": "09:00",
      "status": "completed",
      "technicianId": "EMP25189001",
      "technicianName": "Jan Kowalski",
      "workDescription": "Diagnoza problemu z grzaniem wody",
      "estimatedDuration": 45,
      "actualStartTime": "2025-09-30T09:10:00Z",
      "actualEndTime": "2025-09-30T09:50:00Z",
      "findings": "Grzałka przepalona, wymiana konieczna",
      "photos": [],
      "createdAt": "2025-09-28T14:30:00Z",
      "updatedAt": "2025-09-30T09:50:00Z"
    },
    {
      "visitId": "VIS252750002",
      "visitNumber": 2,
      "type": "repair",
      "scheduledDate": "2025-10-02T10:00:00Z",
      "scheduledTime": "10:00",
      "status": "scheduled",
      "technicianId": "EMP25189001",
      "technicianName": "Jan Kowalski",
      "workDescription": "Wymiana grzałki",
      "estimatedDuration": 60,
      "actualStartTime": null,
      "actualEndTime": null,
      "findings": "",
      "photos": [],
      "createdAt": "2025-09-30T10:00:00Z",
      "updatedAt": "2025-09-30T10:00:00Z"
    }
  ],
  
  "createdAt": "2025-09-28T14:22:00Z",
  "updatedAt": "2025-09-30T10:00:00Z"
}
```

### Pola wymagane dla wizyty:

#### Obowiązkowe:
- `visitId` - Unikalny ID (format: VIS + rok + dzień + numer)
- `visitNumber` - Numer wizyty w zleceniu (1, 2, 3...)
- `type` - Typ wizyty (diagnosis, repair, control, installation)
- `scheduledDate` - Planowana data (ISO format)
- `status` - Status (scheduled, in_progress, completed, cancelled)
- `technicianId` - ID przypisanego technika

#### Opcjonalne ale zalecane:
- `scheduledTime` - Godzina wizyty (HH:MM)
- `estimatedDuration` - Szacowany czas w minutach
- `technicianName` - Imię i nazwisko technika
- `workDescription` - Opis prac do wykonania
- `findings` - Ustalenia po wizycie
- `actualStartTime` - Rzeczywisty czas rozpoczęcia
- `actualEndTime` - Rzeczywisty czas zakończenia

---

## 🔧 API i Planer

### Endpoint: `/api/intelligent-route-optimization`

#### Przed zmianą (❌ Źle):
```javascript
// Optymalizował ZLECENIA
const orders = await getServicemanOrders(servicemanId);
// Zwracał: [{id: 1002, clientName: "Jan", ...}]
```

#### Po zmianie (✅ Dobrze):
```javascript
// Optymalizuje WIZYTY
const visits = await getServicemanOrders(servicemanId);
// Zwraca: [
//   {visitId: "VIS252730001", orderNumber: "ORDA25271002", type: "diagnosis", ...},
//   {visitId: "VIS252750002", orderNumber: "ORDA25271002", type: "repair", ...}
// ]
```

### Kluczowe zmiany w `getServicemanOrders()`:

```javascript
async function getServicemanOrders(servicemanId) {
  // 1. Wczytaj wszystkie zlecenia
  const allOrders = JSON.parse(await fs.readFile('data/orders.json'));
  
  // 2. Wyekstrahuj WIZYTY z zleceń
  const allVisits = [];
  allOrders.forEach(order => {
    if (!order.visits) return;
    
    order.visits.forEach(visit => {
      // Pomiń zakończone wizyty
      if (visit.status === 'completed' || visit.status === 'cancelled') {
        return;
      }
      
      // Filtruj po serwisancie
      const visitTechnicianId = visit.technicianId || visit.employeeId;
      if (servicemanId && visitTechnicianId !== servicemanId) {
        return;
      }
      
      // Dodaj wizytę z pełnym kontekstem zlecenia
      allVisits.push({
        ...visit,
        // Dane zlecenia macierzystego
        orderId: order.id,
        orderNumber: order.orderNumber,
        clientName: order.clientName,
        clientPhone: order.clientPhone,
        address: order.address,
        deviceType: order.deviceType,
        description: order.description,
        priority: order.priority,
        // ... inne dane
      });
    });
  });
  
  return allVisits; // ← Zwraca WIZYTY, nie zlecenia!
}
```

---

## 🎨 UI - Wyświetlanie

### Karta wizyty w planerze

```jsx
<div className="visit-card">
  {/* Typ wizyty */}
  <span className="visit-type-badge">
    {visitType === 'diagnosis' ? '🔍 Diagnoza' :
     visitType === 'repair' ? '🔧 Naprawa' :
     visitType === 'control' ? '✅ Kontrola' :
     '📦 Montaż'}
  </span>
  
  {/* Numer wizyty */}
  <span className="visit-number">
    (wizyta {visitNumber})
  </span>
  
  {/* Klient */}
  <h4>{clientName}</h4>
  
  {/* Numer zlecenia */}
  <p className="order-number">
    📋 Zlecenie: {orderNumber}
  </p>
  
  {/* Urządzenie */}
  <p className="device">
    🔧 {deviceType} {brand} {model}
  </p>
  
  {/* Czas */}
  <p>
    📍 Przyjazd: {arrivalTime}
    🏁 Wyjazd: {departureTime}
  </p>
</div>
```

### Modal ze szczegółami zlecenia

Po kliknięciu wizyty otwiera się modal z:
- ✅ Danymi zlecenia (urządzenie, problem, klient)
- ✅ **Timeline wszystkich wizyt w zleceniu**
- ✅ Status każdej wizyty
- ✅ Przypisany technik
- ✅ Możliwość dodania kolejnej wizyty

```jsx
<div className="order-modal">
  <h3>Zlecenie {orderNumber}</h3>
  
  {/* Info o obecnej wizycie */}
  <div className="current-visit-info">
    Obecnie wyświetlasz: Wizyta #{visitNumber} - 🔍 Diagnoza
  </div>
  
  {/* Timeline wizyt */}
  <div className="visits-timeline">
    <VisitCard 
      visitNumber={1}
      type="diagnosis"
      status="completed"
      date="2025-09-30"
      technician="Jan Kowalski"
      isCurrentlyViewed={true}
    />
    
    <VisitCard 
      visitNumber={2}
      type="repair"
      status="scheduled"
      date="2025-10-02"
      technician="Jan Kowalski"
    />
    
    <AddVisitButton />
  </div>
</div>
```

---

## 📝 Przykłady użycia

### Przykład 1: Tworzenie nowego zlecenia z wizytą

```javascript
const newOrder = {
  orderNumber: generateOrderId(existingOrders), // ORDA25275001
  clientId: "CLI25271002",
  clientName: "Jan Kowalski",
  deviceType: "Pralka",
  description: "Pralka nie wiruje",
  status: "assigned",
  visits: [
    {
      visitId: generateVisitId(existingVisits), // VIS252750001
      visitNumber: 1,
      type: "diagnosis",
      scheduledDate: "2025-10-02T10:00:00Z",
      status: "scheduled",
      technicianId: "EMP25189001"
    }
  ]
};
```

### Przykład 2: Dodawanie kolejnej wizyty do istniejącego zlecenia

```javascript
// Znajdź zlecenie
const order = orders.find(o => o.orderNumber === "ORDA25271002");

// Dodaj nową wizytę
const newVisit = {
  visitId: generateVisitId(order.visits), // VIS252770003
  visitNumber: order.visits.length + 1, // 3
  type: "control",
  scheduledDate: "2025-10-10T14:00:00Z",
  status: "scheduled",
  technicianId: "EMP25189001"
};

order.visits.push(newVisit);
```

### Przykład 3: Pobieranie wizyt serwisanta do planera

```javascript
// W komponencie React
const fetchVisitsForPlanner = async (servicemanId) => {
  const response = await fetch('/api/intelligent-route-optimization', {
    method: 'POST',
    body: JSON.stringify({
      servicemanId: servicemanId,
      timeframe: 'week'
    })
  });
  
  const { data } = await response.json();
  // data.monday.orders ← zawiera WIZYTY, nie zlecenia
  // Każda "order" to właściwie wizyta z kontekstem zlecenia
};
```

---

## 🎯 Korzyści nowej architektury

### ✅ Przed zmianą:
- Planer pokazywał 1 zlecenie = 1 pozycja w kalendarzu
- Problem: Jedno zlecenie mogło wymagać 3 wizyt
- Brak możliwości śledzenia historii wizyt
- Trudność w planowaniu sekwencji (diagnoza → naprawa → kontrola)

### ✅ Po zmianie:
- ✨ Planer pokazuje WIZYTY (diagnoza i naprawa to osobne pozycje)
- ✨ Każda wizyta ma swój unikalny ID i status
- ✨ Łatwe śledzenie postępu: wizyta 1/3, 2/3, 3/3
- ✨ Kliknięcie wizyty → widok całego zlecenia z historią
- ✨ Lepsze planowanie: diagnoza w poniedziałek, naprawa w środę
- ✨ Statystyki: ile wizyt zrealizowanych, ile zaplanowanych

---

## 🔄 Migracja danych

Jeśli masz stare dane z pojedynczymi wizytami, użyj skryptu:

```bash
node fix-visit-ids.js
```

Skrypt:
- ✅ Generuje prawidłowe `visitId` (VIS25275001)
- ✅ Dodaje `visitNumber` do każdej wizyty
- ✅ Tworzy backup przed migracją
- ✅ Weryfikuje spójność danych

---

## 📚 Pliki kluczowe

1. **`utils/id-generator.js`** - Generator ID dla wizyt
2. **`pages/api/intelligent-route-optimization.js`** - API optymalizacji (ekstrahuje wizyty)
3. **`components/IntelligentWeekPlanner.js`** - UI planera (wyświetla wizyty)
4. **`data/orders.json`** - Baza danych zleceń z wizytami
5. **`fix-visit-ids.js`** - Skrypt migracyjny

---

## 🚀 Roadmap

### Faza 1: Podstawy (✅ GOTOWE)
- [x] Struktura danych z wizytami
- [x] Generator visitId
- [x] API ekstrahuje wizyty zamiast zleceń
- [x] UI pokazuje typ i numer wizyty
- [x] Modal z timeline wizyt

### Faza 2: Funkcjonalność (🚧 W PLANIE)
- [ ] Dodawanie nowych wizyt z UI
- [ ] Edycja wizyt (zmiana daty, technika)
- [ ] Usuwanie/anulowanie wizyt
- [ ] Powiadomienia o nadchodzących wizytach
- [ ] Raportowanie zakończonych wizyt

### Faza 3: Optymalizacja (📋 TODO)
- [ ] Geocoding adresów (GPS coordinates)
- [ ] Rzeczywiste trasy z Google Maps
- [ ] Uwzględnienie sekwencji wizyt (diagnoza przed naprawą)
- [ ] Grupowanie wizyt tego samego klienta
- [ ] Analityka wizyt (średni czas, sukces, koszty)

---

## ❓ FAQ

**Q: Czy muszę migrować stare dane?**  
A: Tak, użyj `fix-visit-ids.js`. Skrypt automatycznie doda prawidłowe visitId.

**Q: Co jeśli zlecenie nie ma wizyt?**  
A: Planer je pominie. Każde zlecenie powinno mieć przynajmniej 1 wizytę.

**Q: Jak dodać nową wizytę do istniejącego zlecenia?**  
A: Znajdź zlecenie, dodaj obiekt do `order.visits[]` z nowym `visitId` i `visitNumber`.

**Q: Czy mogę mieć różnych techników dla różnych wizyt?**  
A: Tak! Każda wizyta ma własne `technicianId`. Diagnoza może być przez Jana, naprawa przez Piotra.

**Q: Co z filtrami w planerze?**  
A: Planer filtruje po `technicianId` w wizycie, nie w zleceniu. Każdy technik widzi swoje wizyty.

---

## 📧 Kontakt

Jeśli masz pytania lub sugestie dotyczące architektury wizyt, skontaktuj się z zespołem deweloperskim.

**Ostatnia aktualizacja:** 2025-10-01  
**Wersja:** 2.0 (architektura oparta na wizytach)
