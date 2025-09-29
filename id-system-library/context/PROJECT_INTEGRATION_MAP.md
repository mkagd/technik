# 🎯 MAPA INTEGRACJI SYSTEMU ID

## 📊 STRUKTURA PROJEKTU TECHNIK

```
📁 PROJEKT TECHNIK/
├── 🌐 STRONA INTERNETOWA (Next.js)
│   ├── pages/api/orders/        # API dla zleceń
│   ├── pages/api/clients/       # API dla klientów  
│   ├── pages/admin/            # Panel administracyjny
│   ├── components/             # Komponenty React
│   └── utils/                  # Narzędzia i helpery
│
├── 📱 APLIKACJA MOBILNA (React Native)
│   ├── App.js                  # Główny plik aplikacji
│   ├── components/             # Komponenty mobilne
│   ├── services/               # Serwisy i API calls
│   └── storage/                # AsyncStorage management
│
├── 🗄️ BAZA DANYCH
│   ├── orders                  # Tabela zleceń
│   ├── clients                 # Tabela klientów
│   ├── employees               # Tabela pracowników
│   └── visits                  # Tabela wizyt
│
└── 📚 ID SYSTEM LIBRARY
    ├── id-system.js            # Główny system
    ├── context/                # Pliki kontekstu
    └── backup/                 # Kopie zapasowe
```

---

## 🔄 PRZEPŁYW DANYCH ID

### 1️⃣ **TWORZENIE NOWEGO ZLECENIA:**

```
[STRONA/APLIKACJA] 
    ↓ User tworzy zlecenie
[GENERACJA ID]
    ↓ generateOrderId('W') → "ORDA252710001"
[WALIDACJA]
    ↓ validateInput()
[ZAPIS DO BAZY]
    ↓ INSERT INTO orders...
[ZWROT RESPONSE]
    ↓ { id: "ORDA252710001", success: true }
```

### 2️⃣ **MIGRACJA STARYCH DANYCH:**

```
[STARE DANE]
    ↓ ID: 123, 456, "uuid-xyz"
[KONWERSJA]
    ↓ generateLegacyOrderId() → "OLD123", "OLD456", "OLDuuid-xyz"
[ZACHOWANIE REFERENCJI]
    ↓ Mapowanie stare→nowe ID
[AKTUALIZACJA BAZY]
    ↓ UPDATE wszystkich tabel z referencjami
```

### 3️⃣ **SYNCHRONIZACJA WEB ↔ MOBILE:**

```
[WEB CREATES ORDER]
    ↓ generateOrderId('W') → "ORDW252710001"
[SYNC TO MOBILE]
    ↓ API call z nowym ID
[MOBILE STORAGE]
    ↓ AsyncStorage.setItem()
[MOBILE CREATES ORDER]
    ↓ generateMobileOrderId() → "ORDM252710002"
[SYNC TO WEB]
    ↓ POST /api/orders/sync
```

---

## 🎯 PUNKTY INTEGRACJI

### 🌐 **STRONA INTERNETOWA:**

| Lokalizacja | Funkcja | Kod |
|-------------|---------|-----|
| `pages/api/orders/create.js` | Nowe zlecenie | `generateOrderId('W')` |
| `pages/api/clients/create.js` | Nowy klient | `generateClientId()` |
| `pages/admin/orders.js` | Lista zleceń | `decodeId()` dla info |
| `components/OrderForm.js` | Formularz | Walidacja ID |
| `utils/dataManager.js` | Zarządzanie | Import z biblioteki |

### 📱 **APLIKACJA MOBILNA:**

| Lokalizacja | Funkcja | Kod |
|-------------|---------|-----|
| `App.js` | Główny import | `import { generateOrderId }` |
| `services/OrderService.js` | Tworzenie zleceń | `generateMobileOrderId()` |
| `services/ClientService.js` | Zarządzanie klientów | `generateClientId()` |
| `components/VisitTracker.js` | Śledzenie wizyt | `generateVisitId()` |
| `storage/DataSync.js` | Synchronizacja | `decodeId()` i walidacja |

### 🗄️ **BAZA DANYCH:**

| Tabela | ID Column | Format | Indeksy |
|--------|-----------|--------|---------|
| `orders` | `id VARCHAR(15)` | `ORDA252710001` | `idx_source`, `idx_date` |
| `clients` | `id VARCHAR(15)` | `CLI252710001` | `idx_date_code` |
| `employees` | `id VARCHAR(15)` | `EMP252710001` | `idx_active` |
| `visits` | `id VARCHAR(15)` | `VIS252710001` | `idx_mobile` |
| `legacy_mapping` | `old_id`, `new_id` | `123` → `OLD123` | `idx_both` |

---

## 🛠️ KONFIGURACJA ŚRODOWISKA

### 🔧 **ZMIENNE ŚRODOWISKOWE:**

```bash
# .env.local (Next.js)
ID_SYSTEM_VERSION=1.0.0
ID_LEGACY_SUPPORT=true
ID_DEBUG_MODE=false

# .env (React Native)
EXPO_ID_SYSTEM_VERSION=1.0.0
EXPO_ID_MOBILE_PREFIX=true
```

### 📦 **DEPENDENCIES:**

```json
// package.json (Web)
{
  "dependencies": {
    "next": "^14.2.30",
    "./lib/id-system-library": "file:./lib/id-system-library"
  }
}

// package.json (Mobile)  
{
  "dependencies": {
    "expo": "~51.0.28",
    "@react-native-async-storage/async-storage": "^1.23.1"
  }
}
```

---

## 🚨 PUNKTY UWAGI

### ⚠️ **POTENCJALNE KONFLIKTY:**

1. **Stare systemy ID** - sprawdź czy nie ma konfliktów
2. **Cache invalidation** - wyczyść cache przy migracji  
3. **Foreign key constraints** - zaktualizuj referencje
4. **API versioning** - zachowaj kompatybilność wsteczną

### 🔒 **BEZPIECZEŃSTWO:**

1. **Walidacja input** - zawsze używaj `validateInput()`
2. **Rate limiting** - ogranicz generację ID per user
3. **Audit log** - loguj wszystkie zmiany ID
4. **Backup before migration** - zawsze rób kopię przed migracją

---

## 📋 CHECKLIST INTEGRACJI

### ✅ **PRZED WDROŻENIEM:**

- [ ] Backup istniejących danych
- [ ] Test biblioteki na środowisku dev  
- [ ] Sprawdzenie wszystkich importów
- [ ] Walidacja formatów ID w bazie
- [ ] Test wydajności generacji ID

### ✅ **PODCZAS WDROŻENIA:**

- [ ] Migracja danych etapami
- [ ] Monitoring błędów
- [ ] Sprawdzenie indeksów bazy  
- [ ] Test API endpoints
- [ ] Walidacja UI/UX

### ✅ **PO WDROŻENIU:**

- [ ] Monitoring wydajności
- [ ] Backup nowego stanu
- [ ] Dokumentacja zmian
- [ ] Test user acceptance
- [ ] Planowanie dalszego rozwoju

---

## 🎯 READY TO DEPLOY!

System jest przygotowany do pełnej integracji z projektem Technik. Wszystkie komponenty są zsynchronizowane i gotowe do działania w środowisku produkcyjnym.