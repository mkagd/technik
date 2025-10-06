# 📋 Analiza karty zlecenia dla serwisanta

**Data analizy**: 2025-10-06  
**Plik**: `pages/technician/visit/[visitId].js`  
**Liczba linii**: 1073

---

## 🎯 Przegląd funkcjonalności

Karta zlecenia to kompleksowa aplikacja webowa dla serwisantów pracujących w terenie. Umożliwia pełną obsługę wizyty serwisowej od momentu przyjazdu do klienta do zamknięcia zlecenia.

---

## 📱 Struktura interfejsu

### 1. **Top Navigation Bar** (Sticky)
```
┌────────────────────────────────────────────────────┐
│ [←] Szczegóły wizyty          [Zamów część] [✓Status] │
│     VIS25279002                                     │
└────────────────────────────────────────────────────┘
```

**Elementy:**
- ← Przycisk powrotu do listy wizyt
- Nazwa i ID wizyty (np. VIS25279002)
- Przycisk "Zamów część" (z auto-wypełnianiem danych)
- Badge statusu (z kolorami)

**Statusy wizyty:**
- 🔵 **scheduled** - Zaplanowana
- 🟡 **on_way** - W drodze
- 🟢 **in_progress** - W trakcie
- 🟠 **paused** - Wstrzymana
- ⚫ **completed** - Zakończona
- 🔴 **cancelled** - Anulowana
- 🟣 **rescheduled** - Przełożona

---

### 2. **Lewa kolumna - Główne informacje**

#### A. **Karta klienta** 👤
```javascript
{
  name: "Jan Kowalski",
  phone: "+48 601 234 567",  // Klikalny link (tel:)
  email: "jan@example.com",   // Klikalny link (mailto:)
  address: "ul. Kwiatowa 15",
  postalCode: "35-001",
  city: "Rzeszów"
}
```

**Funkcje:**
- ✅ Bezpośrednie dzwonienie (klik na numer)
- ✅ Wysyłanie emaila (klik na adres)
- ✅ **Otwórz w mapach** - Google Maps z automatycznym wyszukiwaniem adresu

---

#### B. **Karta urządzenia** 🔧

**Multi-device support** - Obsługa wielu urządzeń w jednej wizycie:

```javascript
// Selector urządzeń (jeśli > 1)
[Zmywarka - Bosch] [Lodówka - Samsung] [Pralka - LG]
     ↑ aktywne
```

**Informacje o urządzeniu:**
- Typ (Zmywarka, Lodówka, Pralka...)
- Marka (Bosch, Samsung, LG...)
- Model (np. SMS46KI03E)
- Numer seryjny (mono font)
- Status gwarancji (jeśli aktywna)

**Główny przycisk:**
```
┌────────────────────────────────────────────────────┐
│ 📸 Zeskanuj tabliczkę znamionową                  │
│                                                    │
│ ✅ Zeskanowano: 2 urządzenia                      │
└────────────────────────────────────────────────────┘
```

**Workflow skanowania:**
1. Klik "Zeskanuj tabliczkę"
2. Otwiera się **ModelManagerModal** (zaawansowany)
3. Możliwość użycia **AI Scanner** (rozpoznawanie z kamery/zdjęcia)
4. AI rozpoznaje markę, model, serial number
5. Walidacja duplikatów
6. Zapis do bazy z confidence level
7. Aktualizacja lokalnego state

---

#### C. **Karta problemu** ⚠️

**Sekcje:**
1. **Opis problemu**
   ```
   "Zmywarka nie grzeje wody, naczynia wychodzą zimne"
   ```

2. **Objawy** (badges)
   ```
   [Brak grzania] [Zimna woda] [Błąd E4]
   ```

3. **Diagnoza** (jeśli ustalona)
   ```
   ┌────────────────────────────────────────────────┐
   │ 📋 Diagnoza                                    │
   │ Uszkodzony grzałkowy element. Wymiana         │
   │ konieczna. Czas naprawy: ~45 min              │
   │                                                │
   │ Zdiagnozowano: 05.10.2025 14:23               │
   └────────────────────────────────────────────────┘
   ```

---

### 3. **System zakładek** (Tabs)

```
┌────┬────┬────┬────┬────────┐
│📝  │📸  │🔧 │⏱️ │Historia│
│    │    │    │    │        │
```

#### Tab 1: **📝 Notatki** 

**Struktura notatki:**
```javascript
{
  id: "note_123",
  type: "diagnosis" | "repair" | "observation" | "client_info",
  priority: "normal" | "medium" | "high",
  content: "Sprawdzono pompę - działa prawidłowo",
  tags: ["pompa", "test", "ok"],
  createdAt: "2025-10-05T14:23:00Z"
}
```

**Widok:**
```
┌──────────────────────────────────────────────┐
│ [diagnosis] [Wysoki] │ 05.10.2025 14:23     │
│                                              │
│ Sprawdzono pompę - działa prawidłowo        │
│                                              │
│ #pompa #test #ok                             │
└──────────────────────────────────────────────┘
```

**Funkcje:**
- ✅ Dodawanie notatek z priorytetem
- ✅ Kategoryzacja (diagnoza, naprawa, obserwacja)
- ✅ Tagowanie (#hashtags)
- ✅ Timestamp z każdej notatki

---

#### Tab 2: **📸 Zdjęcia**

**PhotoUploader component:**
- ✅ Robienie zdjęć kamerą telefonu
- ✅ Upload wielu zdjęć naraz
- ✅ Galeria miniatur
- ✅ Preview w pełnym rozmiarze
- ✅ Usuwanie zdjęć
- ✅ Licznik: "Zdjęcia (5)"

**Format zapisu:**
```javascript
{
  visitId: "VIS25279002",
  allPhotos: [
    {
      id: "photo_1",
      url: "/uploads/visits/VIS25279002/photo_1.jpg",
      thumbnail: "/uploads/visits/VIS25279002/thumb_photo_1.jpg",
      uploadedAt: "2025-10-05T14:30:00Z",
      uploadedBy: "EMPA252780002"
    }
  ],
  photoCount: 5
}
```

---

#### Tab 3: **🔧 Części** (NOWY!)

**Integracja z Allegro:**

```
┌──────────────────────────────────────────────────┐
│ 🔍 Szukaj części na Allegro                     │
│                                                  │
│ Urządzenie w naprawie:                          │
│ Bosch SMS46KI03E                                │
│                                                  │
│ 💡 Sugerowane części dla tego modelu:           │
│                                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ Pompa odpływowa                    [🛒]   │ │
│ │ 00611332                                   │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ Termostat bezpieczeństwa          [🛒]   │ │
│ │ 00165242                                   │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ 🔧 Lub wyszukaj dowolną część:                  │
│ [___________________________________] [Szukaj] │
│                                                  │
│ ℹ️ Sprawdź najpierw swój magazyn                │
│ [📦 Sprawdź mój magazyn]                        │
└──────────────────────────────────────────────────┘
```

**Funkcje:**
- ✅ **AllegroQuickSearch** - komponent do szybkiego wyszukiwania
- ✅ Sugerowane części z AI (commonParts z wykrytego modelu)
- ✅ Custom search - własne zapytanie
- ✅ Link do magazynu serwisanta
- ✅ Instrukcja zamawiania części

**Workflow zamawiania:**
1. Klik 🛒 przy części
2. Otwiera Allegro w nowej karcie
3. Automatyczne wyszukiwanie: "Bosch 00611332 pompa odpływowa"
4. Serwisant kopiuje link do oferty
5. Wysyła link do logistyka lub kupuje sam

---

#### Tab 4: **⏱️ Czas pracy**

**TimeTracker component:**
```
┌──────────────────────────────────────────────┐
│ ⏱️ Tracking czasu pracy                      │
│                                              │
│ Status: 🟢 W TRAKCIE                        │
│                                              │
│ ⏰ Rozpoczęto: 14:15                         │
│ 🕐 Aktualny czas: 01:23:45                   │
│                                              │
│ [⏸️ Pauza] [⏹️ Zakończ]                     │
│                                              │
│ Historia:                                    │
│ • 14:15 - 15:30 (1h 15m) - Praca            │
│ • 15:30 - 15:45 (15m) - Przerwa             │
│ • 15:45 - 16:38 (53m) - Praca               │
│                                              │
│ ⏱️ Łączny czas pracy: 2h 08m                 │
└──────────────────────────────────────────────┘
```

**Funkcje:**
- ✅ Start/Stop/Pauza tracking
- ✅ Automatyczne liczenie czasu
- ✅ Historia sesji pracy
- ✅ Rozróżnienie praca/przerwa
- ✅ Podsumowanie łącznego czasu

---

#### Tab 5: **Historia**

**Chronologiczna lista zdarzeń:**
```
┌──────────────────────────────────────────────┐
│ 05.10.2025 14:15 - Wizyta rozpoczęta        │
│ 05.10.2025 14:23 - Dodano diagnozę          │
│ 05.10.2025 14:30 - Dodano 3 zdjęcia         │
│ 05.10.2025 15:15 - Status zmieniony na...   │
│ 05.10.2025 16:38 - Wizyta zakończona        │
└──────────────────────────────────────────────┘
```

---

### 4. **Prawa kolumna - Kontrola statusu**

#### **StatusControl Component**

```
┌──────────────────────────────────────────────┐
│ 🎯 Kontrola wizyty                           │
│                                              │
│ Obecny status: 🟢 W trakcie                 │
│                                              │
│ Zmień status na:                             │
│                                              │
│ [🔵 W drodze]                                │
│ [🟢 Rozpocznij wizytę]                       │
│ [⏸️ Wstrzymaj]                              │
│ [✅ Zakończ wizytę]                         │
│ [❌ Anuluj]                                  │
│ [📅 Przełóż]                                │
│                                              │
│ ─────────────────────────────────            │
│                                              │
│ 📝 Notatka do zmiany statusu:               │
│ [_________________________________]          │
│                                              │
│ [💾 Zapisz zmianę]                          │
└──────────────────────────────────────────────┘
```

**Funkcje:**
- ✅ Szybka zmiana statusu wizyty
- ✅ Opcjonalna notatka do zmiany
- ✅ Walidacja przejść między statusami
- ✅ Automatyczny update w bazie

---

## 🔄 Workflow serwisanta

### Typowy przebieg wizyty:

```
1. ZAPLANOWANA (scheduled)
   ↓ [Serwisant w drodze]
   
2. W DRODZE (on_way)
   ↓ [Przyjazd do klienta]
   
3. W TRAKCIE (in_progress)
   ├─ Skanowanie tabliczki znamionowej
   ├─ Diagnoza problemu
   ├─ Robienie zdjęć
   ├─ Dodawanie notatek
   ├─ Sprawdzanie części (Allegro)
   ├─ Naprawa / Wymiana części
   └─ Tracking czasu pracy
   ↓
   
4. ZAKOŃCZONA (completed)
   ├─ Podsumowanie czasu
   ├─ Finalne zdjęcia
   └─ Raport dla klienta
```

---

## 🎨 Responsywność

**Mobile-first design:**

```scss
// Breakpoints
sm: 640px   // Telefony (pionowo)
md: 768px   // Tablety
lg: 1024px  // Laptop
xl: 1280px  // Desktop

// Grid layout
mobile:     1 kolumna
lg:         3 kolumny (2 + 1 sidebar)
```

**Optymalizacje mobile:**
- ✅ Sticky top bar (zawsze widoczny)
- ✅ Zmniejszone paddingi na mobile
- ✅ Responsywne fonty (text-base sm:text-lg)
- ✅ Horizontally scrollable tabs
- ✅ Touch-friendly button sizes
- ✅ Kompresja obrazów przed uplodem

---

## 🔌 Integracje API

### 1. **GET** `/api/technician/visit-details?visitId={id}`
**Pobiera szczegóły wizyty**

**Headers:**
```
Authorization: Bearer {technicianToken}
```

**Response:**
```json
{
  "visit": {
    "visitId": "VIS25279002",
    "status": "in_progress",
    "type": "repair",
    "scheduledDate": "2025-10-05",
    "scheduledTime": "14:00",
    "client": {...},
    "devices": [{...}, {...}],
    "deviceModels": [
      {
        "deviceIndex": 0,
        "models": [...]
      }
    ],
    "problem": {...},
    "notes": [...],
    "allPhotos": [...],
    "photoCount": 5
  }
}
```

---

### 2. **PUT** `/api/technician/visits/{visitId}`
**Aktualizuje dane wizyty (np. dodaje modele)**

**Body:**
```json
{
  "models": [
    {
      "brand": "Bosch",
      "model": "SMS46KI03E",
      "finalModel": "SMS46KI03E",
      "finalType": "Zmywarka",
      "serialNumber": "FD9408123456",
      "confidence": "high",
      "source": "ai_scanner",
      "timestamp": "2025-10-05T14:30:00Z"
    }
  ],
  "deviceIndex": 0
}
```

---

### 3. **POST** `/api/technician/time-tracking`
**Tracking czasu pracy**

**Actions:**
- `start` - Rozpoczęcie pracy
- `pause` - Pauza
- `resume` - Wznowienie
- `stop` - Zakończenie

---

## 🚀 Kluczowe komponenty

### 1. **ModelAIScanner**
```javascript
<ModelAIScanner
  onModelDetected={handleAIModelDetected}
  onClose={() => setShowAIScanner(false)}
  deviceBrand="Bosch"
  deviceType="Zmywarka"
/>
```

**Funkcje:**
- ✅ OCR z kamery/zdjęcia
- ✅ AI recognition (marka, model, serial)
- ✅ Walidacja i confidence score
- ✅ Integracja z bazą modeli

---

### 2. **ModelManagerModal**
```javascript
<ModelManagerModal
  isOpen={showModelManager}
  onClose={() => setShowModelManager(false)}
  onSave={handleSaveModels}
  initialModels={visitModels}
  deviceType={currentDevice.deviceType}
  deviceBrand={currentDevice.brand}
/>
```

**Funkcje:**
- ✅ Pełne zarządzanie modelami
- ✅ Dodawanie/Edycja/Usuwanie
- ✅ AI Scanner embedded
- ✅ Multi-device support

---

### 3. **AllegroQuickSearch**
```javascript
<AllegroQuickSearch
  partName="Pompa odpływowa"
  partNumber="00611332"
  compact={true}
/>
```

**Funkcje:**
- ✅ Szybkie wyszukiwanie na Allegro
- ✅ Auto-generated query
- ✅ Otwiera w nowej karcie
- ✅ Compact/Full mode

---

### 4. **PhotoUploader**
```javascript
<PhotoUploader
  visitId={visitId}
  existingPhotos={visit.allPhotos || []}
  onPhotosUpdate={(updatedPhotos) => {
    setVisit(prev => ({
      ...prev,
      allPhotos: updatedPhotos,
      photoCount: updatedPhotos.length
    }));
  }}
/>
```

**Funkcje:**
- ✅ Camera access (mobile)
- ✅ Multi-file upload
- ✅ Image preview
- ✅ Delete photos
- ✅ Automatic thumbnails

---

### 5. **StatusControl**
```javascript
<StatusControl
  currentStatus={visit.status}
  onStatusChange={async (newStatus, note) => {
    // Update API
    // Refresh visit data
  }}
/>
```

---

## 💾 State Management

### **Local State (useState)**

```javascript
const [visit, setVisit] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [employee, setEmployee] = useState(null);
const [activeTab, setActiveTab] = useState('overview');
const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
const [visitModels, setVisitModels] = useState([]);
```

### **LocalStorage**

```javascript
// Authentication
technicianToken: "Bearer ..."
technicianEmployee: { id, name, phone, ... }
```

---

## 🐛 Obsługa błędów

### **Validacje:**

1. **Token expiry** → Redirect to /technician/login
2. **Missing visit** → Error screen z linkiem powrotu
3. **API errors** → Alert z komunikatem
4. **Duplicate models** → Warning toast
5. **Empty fields** → Client-side validation

### **Error boundary:**
```javascript
if (error || !visit) {
  return (
    <ErrorScreen 
      message={error || 'Nie znaleziono wizyty'}
      backLink="/technician/visits"
    />
  );
}
```

---

## 📊 Metryki wydajności

### **Lazy loading:**
- ✅ Zdjęcia ładowane on-demand
- ✅ Tabs render tylko aktywnej zakładki
- ✅ API calls tylko gdy potrzebne

### **Optymalizacje:**
- ✅ Memo dla drogich komponentów
- ✅ Debounce dla wyszukiwania części
- ✅ Image compression przed upload
- ✅ Skeleton screens podczas ładowania

---

## 🎯 Wnioski i rekomendacje

### **Mocne strony:**
✅ Kompleksowa funkcjonalność w jednym miejscu  
✅ Intuicyjny UI/UX  
✅ Mobile-first design  
✅ Integracja z AI Scanner  
✅ Real-time tracking czasu  
✅ Multi-device support  
✅ Integracja z Allegro  

### **Możliwe usprawnienia:**
💡 **Offline mode** - Praca bez internetu (Service Worker)  
💡 **Push notifications** - Alerty o nowych wizytach  
💡 **Voice notes** - Dyktowanie notatek głosem  
💡 **QR code scan** - Szybkie skanowanie części  
💡 **GPS tracking** - Automatyczne przejście "w drodze"  
💡 **Client signature** - Podpis klienta po zakończeniu  
💡 **PDF report** - Automatyczny raport dla klienta  
💡 **Parts inventory check** - Sprawdzenie dostępności w magazynie  

---

## 📝 Changelog

**v1.0** (2025-10-06)
- Initial analysis
- Documented all major features
- Identified improvement areas

---

**Koniec analizy** 🎉
