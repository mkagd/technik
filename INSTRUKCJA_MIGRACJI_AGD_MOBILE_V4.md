# 📱 INSTRUKCJA MIGRACJI APLIKACJI MOBILNEJ AGD DO ENHANCED v4.0

## 🎯 CEL MIGRACJI
Bezstratna migracja aplikacji mobilnej AGD do nowego systemu Enhanced v4.0, zachowując **100% funkcjonalności** i dodając nowe możliwości.

---

## ✅ GWARANCJE KOMPATYBILNOŚCI

### 🔒 **ZACHOWANE 100%** (bez zmian w kodzie)
- ✅ **System zabudowy** - `builtInParams` (demontaż, montaż, trudna, etc.)
- ✅ **Wykrywanie połączeń** - `detectedCall`, `entryTime`
- ✅ **Google Contacts** - `updateGoogleContact`, `googleContactData`
- ✅ **Urządzenia AGD** - `devices` z 8 typami, kodami błędów, częściami
- ✅ **Historia z emoji** - `history` ze szczegółowymi opisami
- ✅ **Godziny pracy** - `workHours`, `clientWorkHours`, `workHoursCustom`
- ✅ **Sesje robocze** - `workSessions`, `isTimerRunning`, `totalWorkTime`
- ✅ **Statusy AGD** - 'Nowe', 'W realizacji', 'Zakończone'
- ✅ **Koszty** - `cost`, `customCost`
- ✅ **Powiadomienia** - `notificationsSent`, `pushNotificationsSent`
- ✅ **Kalendarz** - `dates`, `selectedDates`

### 🆕 **NOWE OPCJONALNE** (do dodania stopniowo)
- 🏥 **System wizyt** - `visitId`, `appointmentDate`, `technicianNotes`
- 🆔 **Nowe ID** - `orderNumber` (ORDA format), `clientId` (CLI format)
- 📋 **Rozszerzone statusy** - dodatkowe statusy webowe
- 🔄 **Metadane migracji** - `version`, `migratedFrom`

---

## 🚀 STRATEGIA MIGRACJI (3 FAZY)

### **FAZA 1: PRZYGOTOWANIE (1-2 dni)** 
```javascript
// 1. Dodaj nowe pola OPCJONALNE do modeli
class Order {
  // Zachowane wszystkie stare pola
  builtInParams: any;           // ✅ BEZ ZMIAN
  detectedCall: any;            // ✅ BEZ ZMIAN
  googleContactData: any;       // ✅ BEZ ZMIAN
  
  // Nowe opcjonalne pola
  orderNumber?: string;         // 🆕 ORDA25292001
  visitId?: string;             // 🆕 VIS25292001  
  appointmentDate?: Date;       // 🆕 Data wizyty
  technicianNotes?: string;     // 🆕 Notatki z wizyty
  version?: string = '4.0';     // 🆕 Wersja
}
```

### **FAZA 2: MAPOWANIE ID (2-3 dni)**
```javascript
// 2. Dodaj funkcje mapowania ID
function mapClientId(oldId: string): string {
  const mapping = {
    'OLD0001': 'CLI25186001',
    'OLD0002': 'CLI25186002', 
    'OLD0003': 'CLI25186003',
    // ... pozostałe mapowania
  };
  return mapping[oldId] || oldId;
}

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `ORDA${year}${month}${day}001`; // Przykład
}
```

### **FAZA 3: INTEGRACJA API (1-2 dni)**
```javascript
// 3. Aktualizuj wywołania API
const createOrder = async (orderData) => {
  // Stare pola działają bez zmian
  const payload = {
    ...orderData,
    
    // Opcjonalnie dodaj nowe pola
    orderNumber: generateOrderNumber(),
    visitId: orderData.hasAppointment ? generateVisitId() : null,
    version: '4.0'
  };
  
  // API automatycznie wykryje AGD Mobile i skonwertuje
  const response = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};
```

---

## 🔧 SZCZEGÓŁY IMPLEMENTACJI

### **A. Wykrywanie źródła zlecenia**
```javascript
// Server automatycznie wykrywa AGD Mobile po:
const isAGDMobile = orderData.builtInParams || 
                   orderData.detectedCall || 
                   orderData.selectedEmployee ||
                   ['Nowe', 'W realizacji', 'Zakończone'].includes(orderData.status);
```

### **B. Konwersja automatyczna**
```javascript
// Serwer automatycznie:
if (isAGDMobile) {
  // 1. Zachowuje wszystkie pola AGD Mobile
  // 2. Mapuje OLD0001 → CLI25186001  
  // 3. Generuje ORDA25292001
  // 4. Dodaje wpis do historii o migracji
  // 5. Ustawia source: 'agd_mobile'
}
```

### **C. Mapowanie statusów**
```javascript
// Statusy AGD Mobile zachowane + mapowanie
const statusMapping = {
  // AGD Mobile (zachowane)
  'Nowe': 'Nowe',              // ✅ Bez zmian
  'W realizacji': 'W realizacji', // ✅ Bez zmian  
  'Zakończone': 'Zakończone',     // ✅ Bez zmian
  
  // Opcjonalne dodatkowe
  'pending': 'Nowe',           // Mapowanie z web
  'in_progress': 'W realizacji',
  'completed': 'Zakończone'
};
```

---

## 📋 CHECKLIST MIGRACJI

### **Przygotowanie kodu:**
- [ ] Dodać nowe opcjonalne pola do modeli
- [ ] Zaimplementować funkcje mapowania ID  
- [ ] Przygotować generatory ORDA/VIS ID
- [ ] Dodać obsługę wersji '4.0'

### **Testowanie:**
- [ ] Sprawdzić czy stare funkcje działają bez zmian
- [ ] Przetestować system zabudowy (builtInParams)
- [ ] Przetestować wykrywanie połączeń (detectedCall)  
- [ ] Przetestować Google Contacts integrację
- [ ] Przetestować tworzenie nowych zleceń
- [ ] Przetestować synchronizację z serwerem

### **Wdrożenie:**
- [ ] Deploy etapowy (10% użytkowników)
- [ ] Monitoring błędów i kompatybilności
- [ ] Pełny rollout po weryfikacji
- [ ] Dokumentacja dla użytkowników

---

## 🔍 PRZYKŁADY KODU

### **1. Tworzenie zlecenia (zachowane)**
```javascript
// PRZED i PO - IDENTYCZNY KOD
const newOrder = {
  clientId: 'OLD0001',           // Mapowane na CLI25186001
  clientName: 'Jan Kowalski',
  address: 'ul. Testowa 1',
  phone: '+48 123 456 789',
  selectedEmployee: 'EMP001',    // ✅ Zachowane
  
  devices: [{                    // ✅ Zachowane 100%
    deviceType: 'Pralka',
    issueDescription: 'Nie wiruje',
    builtIn: true,
    builtInParams: {             // ✅ System zabudowy bez zmian
      demontaz: true,
      montaz: true,
      trudna: false
    }
  }],
  
  detectedCall: {                // ✅ Wykrywanie połączeń bez zmian
    phoneNumber: '+48 123 456 789',
    type: 'INCOMING',
    wasUsed: true
  },
  
  status: 'Nowe'                 // ✅ Status bez zmian
};

// API automatycznie doda:
// - orderNumber: 'ORDA25292001'
// - clientId → 'CLI25186001' 
// - version: '4.0'
// - source: 'agd_mobile'
```

### **2. System wizyt (nowy, opcjonalny)**
```javascript
// Opcjonalnie dodać system wizyt
const orderWithVisit = {
  ...standardOrder,
  
  // Nowe opcjonalne pola
  appointmentDate: new Date('2025-01-28T10:00'),
  technicianNotes: 'Proszę przygotować części zamienne'
};

// Server automatycznie generuje visitId: 'VIS25292001'
```

### **3. Migracja historii**
```javascript
// Historia zachowana + dodany wpis migracji
const migratedHistory = [
  // Stare wpisy zachowane z emoji
  {
    date: '2025-01-27T16:00:00Z',
    action: 'Utworzenie zlecenia',
    description: '🆕 Nowe zlecenie\n📞 Wykryto połączenie\n🏠 Sprzęt w zabudowie'
  },
  
  // Automatycznie dodany wpis migracji
  {
    date: '2025-01-27T16:15:00Z', 
    action: 'Migracja do Enhanced v4.0',
    description: '🔄 Migracja z AGD Mobile\n✅ Wszystkie dane zachowane\n🆕 Dodane nowe funkcje'
  }
];
```

---

## ⚠️ OSTRZEŻENIA I OGRANICZENIA

### **🔴 UWAGI KRYTYCZNE:**
1. **NIE ZMIENIAJ** logiki builtInParams - działa identycznie
2. **NIE ZMIENIAJ** struktury detectedCall - zachowana 100%
3. **NIE ZMIENIAJ** statusów AGD Mobile - obsługiwane bez zmian
4. **clientId** jest automatycznie mapowane - nie zmieniaj ręcznie

### **🟡 DOBRE PRAKTYKI:**
1. Dodawaj nowe pola jako **opcjonalne**
2. Używaj `orderNumber` zamiast starego `id` w nowych funkcjach
3. Zachowaj kompatybilność z starymi zapisami
4. Testuj na małej grupie przed pełnym wdrożeniem

### **🟢 ZALECENIA:**
1. Używaj `version: '4.0'` do rozróżnienia nowych zleceń
2. Implementuj stopniowo - nie wszystko naraz
3. Monitoruj logi serwera podczas migracji
4. Przygotuj rollback plan

---

## 🔬 TESTOWANIE

### **Test podstawowy:**
```javascript
// Test czy stara funkcjonalność działa
const testOrder = createSampleAGDOrder();
const response = await sendToServer(testOrder);

console.assert(response.order.builtInParams, 'builtInParams zachowane');
console.assert(response.order.detectedCall, 'detectedCall zachowane');
console.assert(response.compatibility.agdMobileFieldsPreserved, 'AGD Mobile preserved');
```

### **Test nowych funkcji:**
```javascript
// Test wizyt
const orderWithVisit = {
  ...testOrder,
  appointmentDate: new Date(),
  technicianNotes: 'Test notatki'
};

const response = await sendToServer(orderWithVisit);
console.assert(response.order.visitId.startsWith('VIS'), 'visitId generated');
```

---

## 📞 WSPARCIE

### **Kontakt w przypadku problemów:**
- 🔧 **Problemy techniczne**: Backend team
- 📱 **Problemy AGD Mobile**: Mobile team  
- 🔄 **Problemy migracji**: DevOps team
- 📋 **Pytania biznesowe**: Product team

### **Zasoby:**
- 📚 **Testy kompatybilności**: `shared/enhanced-v4-compatibility-tests.js`
- 🔧 **Konwerter**: `shared/agd-mobile-to-v4-converter.js`
- 📋 **Struktura**: `shared/enhanced-order-structure-v4.js`
- 🌐 **API**: `pages/api/orders.js`

---

## 🎯 PODSUMOWANIE

Enhanced v4.0 to **ewolucja, nie rewolucja**:

✅ **Wszystkie funkcje AGD Mobile działają bez zmian**  
✅ **Migracja automatyczna i bezstratna**  
✅ **Nowe funkcje opcjonalne**  
✅ **Kompatybilność wsteczna 100%**  

**Strategia:** Wdróż stopniowo, testuj często, zachowaj kompatybilność.

---

*Dokument wersja 1.0 - Enhanced Order Structure v4.0*  
*Data utworzenia: 2025-01-27*