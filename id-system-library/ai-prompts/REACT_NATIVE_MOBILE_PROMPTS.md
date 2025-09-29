# 📱 PROMPT AI: WDROŻENIE SYSTEMU ID W REACT NATIVE

## 📋 INSTRUKCJE DLA AI

**Kontekst:** Mam gotową bibliotekę ID System Library i chcę ją wdrożyć w mojej aplikacji React Native/Expo. Pomóż mi zintegrować system ID z aplikacją mobilną.

---

## 🎯 GŁÓWNY PROMPT

```
Pomóż mi wdrożyć system ID w mojej aplikacji React Native/Expo. Mam gotową bibliotekę "id-system-library" z następującymi funkcjami:

DOSTĘPNE FUNKCJE:
- generateOrderId(source) - źródła: A,M,W,T,E,R  
- generateMobileOrderId() - dedykowane dla mobile
- generateClientId() - ID klientów
- generateVisitId() - ID wizyt
- generateMobileVisitId() - wizyty mobilne
- decodeId(id) - dekodowanie informacji z ID
- validateInput(type, params) - walidacja

FORMATY ID:
- Zlecenia mobile: "ORDM252710001" (ORD + M + data + numer)
- Wizyty mobile: "VISM252710001" (VIS + M + data + numer)
- Klienci: "CLI252710001" (CLI + data + numer)

ZADANIA:
1. Zintegruj bibliotekę ID z React Native/Expo
2. Utwórz serwisy do zarządzania ID w aplikacji
3. Dodaj komponenty mobilne do wyświetlania i tworzenia ID
4. Zaimplementuj offline storage z AsyncStorage
5. Zapewnij synchronizację z serwerem (API)
6. Dodaj obsługę conflict resolution przy sync

WYMAGANIA:
- React Native/Expo SDK 51+
- AsyncStorage dla offline storage
- Obsługa trybu offline/online
- Optymalizacja battery usage
- Native performance

Pokaż mi konkretny kod do implementacji w React Native.
```

---

## 🔧 PROMPTY SZCZEGÓŁOWE

### 1️⃣ **MOBILE SERVICES:**

```
Utwórz serwisy React Native dla systemu ID:

WYMAGANE SERWISY:
- OrderService - zarządzanie zleceniami mobilnymi
- VisitService - śledzenie wizyt z GPS
- ClientService - zarządzanie klientami
- SyncService - synchronizacja z serwerem
- OfflineService - obsługa trybu offline

BIBLIOTEKA:
import { generateMobileOrderId, generateVisitId, decodeId } from '../lib/id-system-library/id-system.js';

FUNKCJONALNOŚCI:
- Tworzenie zleceń offline z unikalnym ID
- Śledzenie wizyt z geolokalizacją
- Queue dla sync gdy brak internetu
- Conflict resolution przy synchronizacji
- Cache management z TTL

STORAGE:
- AsyncStorage dla lokalnych danych
- SQLite dla większych zbiorów (opcjonalnie)
- Encrypted storage dla wrażliwych danych

PRZYKŁAD UŻYCIA:
const orderService = new OrderService();
const orderId = await orderService.createOrder(orderData);
await orderService.syncWithServer();

Pokaż kompletny kod serwisów mobilnych.
```

### 2️⃣ **KOMPONENTY MOBILNE:**

```
Utwórz komponenty React Native dla systemu ID:

WYMAGANE KOMPONENTY:
1. MobileOrderForm - formularz zlecenia mobilnego
2. VisitTracker - śledzenie aktywnej wizyty
3. IDDisplay - wyświetlanie informacji o ID
4. OfflineIndicator - status połączenia i sync
5. ClientPicker - wybór klienta z ID
6. OrderHistory - historia zleceń z ID

FUNKCJONALNOŚCI:
- Touch-friendly interface
- Barcode/QR scanner dla ID
- GPS integration dla wizyt
- Camera integration dla zdjęć
- Push notifications dla sync status
- Dark/light theme support

NATIVE MODULES:
- react-native-camera dla skanowania
- @react-native-geolocation/geolocation dla GPS
- @react-native-async-storage/async-storage
- react-native-push-notification

PRZYKŁAD ID FLOW:
1. User tworzy zlecenie → generateMobileOrderId()
2. ID "ORDM252710001" → AsyncStorage
3. Sync do serwera gdy online
4. Conflict resolution jeśli potrzebne

Pokaż kod komponentów z pełną funkcjonalnością mobile.
```

### 3️⃣ **OFFLINE & SYNC:**

```
Zaimplementuj offline storage i synchronizację:

OFFLINE CAPABILITIES:
- Wszystkie ID generowane offline (nie wymagają serwera)
- Lokalne storage dla zleceń, klientów, wizyt
- Queue system dla akcji do sync
- Conflict detection i resolution
- Battery optimization dla background sync

SYNC STRATEGY:
- Real-time sync gdy online
- Batch sync w background
- Retry mechanism z exponential backoff
- Delta sync (tylko zmiany)
- Bidirectional sync (mobile ↔ server)

STORAGE STRUCTURE:
```javascript
AsyncStorage keys:
- 'orders_pending_sync' → array of orders to sync
- 'clients_cache' → cached clients with TTL
- 'visits_active' → current active visits
- 'sync_queue' → actions to perform when online
- 'last_sync_timestamp' → for delta sync
```

CONFLICT RESOLUTION:
- Server wins dla master data (clients)
- Mobile wins dla user actions (orders, visits)
- Merge strategy dla complex conflicts
- User prompt dla critical conflicts

Pokaż kod offline storage i sync logic.
```

### 4️⃣ **GEOLOKALIZACJA & WIZYTY:**

```
Zintegruj system ID z śledzeniem wizyt GPS:

FUNKCJONALNOŚCI WIZYT:
- Automatyczne tworzenie ID wizyty przy starcie
- GPS tracking z timestamps
- Geofencing dla lokalizacji klienta
- Battery-optimized location updates
- Offline map caching

ID INTEGRATION:
- generateVisitId() → "VIS252710001"
- generateMobileVisitId() → "VISM252710001"
- decodeId() dla informacji o wizycie
- Linking visit ID z order ID

TRACKING DATA:
```javascript
{
  visitId: "VISM252710001",
  orderId: "ORDM252710001", 
  clientId: "CLI252710001",
  startTime: Date,
  endTime: Date,
  locations: [
    { lat, lng, timestamp, accuracy }
  ],
  status: 'active' | 'completed' | 'cancelled'
}
```

PERMISSIONS:
- Location permission handling
- Background location access
- Battery optimization whitelist

OPTIMIZATION:
- Smart location frequency
- Geofence untuk start/stop tracking
- Background job scheduling

Pokaż kod GPS tracking z integracją ID.
```

### 5️⃣ **PERFORMANCE & OPTIMIZATION:**

```
Optymalizuj aplikację mobilną dla systemu ID:

PERFORMANCE OPTIMIZATIONS:
- Lazy loading komponentów ID
- Virtualized lists dla dużej ilości ID
- Image optimization dla QR codes
- Memory management dla cache
- Bundle size optimization

ID SYSTEM OPTIMIZATIONS:
- Local ID generation (bez API calls)
- Batch operations dla sync
- Compression dla stored data
- Index dla fast searches
- Cleanup starych cached ID

BATTERY OPTIMIZATIONS:
- Background job scheduling
- Location updates frequency
- Network request batching
- Wake lock management dla długich operacji

NATIVE OPTIMIZATIONS:
- Hermes engine optimization
- Native module integration
- Platform-specific optimizations
- Memory leak prevention

MONITORING:
- Performance metrics tracking  
- Crash reporting z ID context
- Network usage monitoring
- Battery usage analytics

Pokaż kod optimizations i monitoring.
```

---

## 🎨 PROMPTY UI/UX MOBILE

### 📱 **NATIVE DESIGN:**

```
Utwórz native-feeling UI dla systemu ID:

DESIGN PRINCIPLES:
- Platform-specific design (iOS/Android)
- Gesture-based navigation
- Haptic feedback dla akcji
- Accessible design (screen readers)
- Large touch targets

KOMPONENTY ID:
- IDCard z swipe actions
- IDGenerator z animated progress
- IDScanner z camera overlay
- IDHistory z pull-to-refresh
- IDStats z native charts

ANIMATIONS:
- Smooth transitions między screens
- Loading animations dla sync
- Success/error feedback animations
- Pull-to-refresh animations
- Skeleton loading dla lists

PRZYKŁAD ID CARD:
```
┌─────────────────────────┐
│ 🔷 ORDM252710001       │
│ Mobile Order #1         │  
│ 📅 28 września 2025     │
│ 📍 AI Assistant         │
│ [👁️ View] [🔄 Sync]    │
└─────────────────────────┘
```

Pokaż kod UI components z native styling.
```

### 🔍 **SEARCH & NAVIGATION:**

```
Dodaj native search i navigation dla ID:

SEARCH FEATURES:
- Native search bar w navigation
- Voice search integration
- Barcode/QR scanner search
- Recent searches history
- Fuzzy search dla ID

NAVIGATION:
- Tab navigation dla głównych sekcji
- Stack navigation dla details
- Modal navigation dla forms
- Deep linking z ID parameters

FILTERS:
- Native picker dla typu ID
- Date range picker
- Status filters (pending, synced, offline)
- Swipe filters w lists

SHORTCUTS:
- 3D Touch/Long press shortcuts
- Widget dla quick actions
- Siri shortcuts integration
- Quick actions z home screen

Pokaż kod navigation i search components.
```

---

## 🧪 PROMPTY TESTOWANIA MOBILE

### ✅ **UNIT & INTEGRATION TESTS:**

```
Utwórz testy dla React Native ID integration:

TESTING FRAMEWORK:
- Jest dla unit tests
- React Native Testing Library
- Detox dla E2E tests
- Flipper dla debugging

TESTY DO UTWORZENIA:
- ID generation w różnych scenariuszach
- Offline storage i sync logic
- GPS tracking z ID integration
- Component rendering z ID data
- AsyncStorage operations

MOCK SCENARIOS:
- Network unavailable podczas sync
- GPS permission denied
- Low memory situations
- Background app termination
- Large dataset operations

PRZYKŁAD TESTÓW:
```javascript
test('generates mobile order ID offline', async () => {
  const orderId = await orderService.createOfflineOrder(data);
  expect(orderId).toMatch(/ORDM\d{9}/);
  expect(await AsyncStorage.getItem('orders_pending')).toContain(orderId);
});
```

Pokaż kompletne testy mobile functionality.
```

### 🔬 **E2E MOBILE TESTS:**

```
Utwórz E2E testy dla mobile workflows:

E2E SCENARIOS:
1. Create order offline → sync when online → verify server
2. Start visit tracking → generate visit ID → complete visit
3. Scan QR code → decode ID → display info
4. App backgrounded → resumed → sync continues
5. Network lost → regained → auto-sync triggers

DEVICE TESTING:
- Different screen sizes i orientations
- Various OS versions (iOS/Android)
- Low memory devices
- Slow network conditions
- Battery saver mode

PERMISSIONS TESTING:
- Location permission flow
- Camera permission dla scanning
- Notification permissions
- Background app refresh

Pokaż E2E test scenarios z Detox.
```

---

## 🚀 PROMPT DEPLOYMENT MOBILE

```
Pomóż z deployment aplikacji mobilnej z systemem ID:

BUILD CONFIGURATION:
- EAS Build dla Expo
- Fastlane dla CI/CD
- Code signing setup
- Bundle optimization

STORE DEPLOYMENT:
- App Store Connect setup
- Google Play Console config
- Screenshots z ID features
- Store descriptions highlighting ID system

MONITORING:
- Crashlytics integration
- Analytics dla ID usage
- Performance monitoring
- User feedback tracking

OTA UPDATES:
- Expo Updates dla hot fixes
- A/B testing ID features
- Rollback strategies
- Update prompts dla users

SECURITY:
- Code obfuscation
- Certificate pinning
- Secure storage dla sensitive ID data
- API authentication

Pokaż deployment configuration i monitoring.
```

---

## 🎯 PRZYKŁADY UŻYCIA PROMPTU

### **Podstawowa integracja:**
```
Mam bibliotekę id-system-library i chcę ją użyć w React Native. Potrzebuję:

1. Serwis do tworzenia zleceń mobilnych z ID
2. Komponent do wyświetlania aktywnej wizyty
3. Offline storage z AsyncStorage

Moje funkcje:
- generateMobileOrderId() → "ORDM252710001"
- generateMobileVisitId() → "VISM252710001"  
- decodeId(id) → {type, source, date, number}

Pokaż kod serwisu i komponentu.
```

### **GPS Integration:**
```
Chcę śledzić wizyty GPS z systemem ID. Potrzebuję:

1. Auto-start tracking gdy tworzę wizytę
2. ID wizyty powiązane z GPS data
3. Geofencing dla klienta

ID format: "VISM252710001" 
GPS data: lat, lng, timestamp, accuracy

Pokaż kod GPS tracking z ID integration.
```

### **Offline Sync:**
```
Moja aplikacja musi działać offline. Potrzebuję:

1. Generowanie ID bez internetu
2. Queue dla sync z serwerem
3. Conflict resolution przy sync

ID types: orders (ORDM...), visits (VISM...), clients (CLI...)

Pokaż kod offline storage i sync logic.
```

---

## 🎉 GOTOWE PROMPTY MOBILE!

Wszystkie prompty są przygotowane dla React Native/Expo. Skopiuj odpowiedni prompt i otrzymaj gotowy kod mobilny!