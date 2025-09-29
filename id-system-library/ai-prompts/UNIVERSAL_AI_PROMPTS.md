# 🤖 UNIWERSALNE PROMPTY AI - SYSTEM ID

## 📋 PROMPT MASTER INDEX

**Wszystkie prompty AI w jednym miejscu** - skopiuj, dostosuj i używaj z dowolnym AI asystentem.

---

## 🎯 SZYBKIE PROMPTY (COPY & PASTE)

### 1️⃣ **BASIC INTEGRATION PROMPT:**

```
Mam gotową bibliotekę JavaScript "id-system-library" z funkcjami:

• generateOrderId(source) → "ORDA252710001" (źródła: A,M,W,T,E,R)
• generateClientId() → "CLI252710001" 
• generateEmployeeId() → "EMP252710001"
• decodeId(id) → {type, source, date, number, isValid}
• validateInput(type, params) → {isValid, errors}

ZADANIE: Zintegruj z moją aplikacją [Next.js/React Native/Node.js].

Pokaż kod:
1. Import biblioteki
2. Użycie w API/serwisie
3. Wyświetlanie ID w UI
4. Obsługa błędów

Framework: [PODAJ SWÓJ FRAMEWORK]
Database: [PODAJ SWOJĄ BAZĘ]
```

### 2️⃣ **DATABASE INTEGRATION PROMPT:**

```
Chcę zintegrować system ID z bazą danych:

FUNKCJE ID:
• generateOrderId('W') → "ORDW252710001"
• generateClientId() → "CLI252710001"
• decodeId(id) → informacje o ID

STRUKTURA TABEL:
• orders: id (VARCHAR 15), source (CHAR 1), created_at
• clients: id (VARCHAR 15), name, email
• [DODAJ SWOJE TABELE]

WYMAGANIA:
1. Schema z ID jako PRIMARY KEY
2. Indeksy dla optymalizacji
3. Foreign key constraints
4. Migration script

Database: [PostgreSQL/MySQL/MongoDB]
ORM: [Prisma/Drizzle/Sequelize/None]

Pokaż schema i migration code.
```

### 3️⃣ **MIGRATION PROMPT:**

```
Migracj stary system ID do biblioteki id-system-library:

STARY SYSTEM:
• Typ: [liczby całkowite/UUID/własny format]
• Przykłady: [123, 456 / uuid-strings / "ZL2024/001"]
• Tabele do migracji: [orders, clients, etc.]

NOWY SYSTEM:
• generateLegacyOrderId(oldId) → "OLD" + oldId
• Mapowanie: old_id → new_id
• Zachowanie referencji w całym systemie

WYMAGANIA:
1. Zero-downtime migration
2. Backup plan
3. Rollback możliwość
4. Walidacja każdego kroku

Pokaż bezpieczny migration plan i kod.
```

### 4️⃣ **API ENDPOINTS PROMPT:**

```
Utwórz API endpoints dla systemu ID:

BIBLIOTEKA:
import { generateOrderId, generateClientId, decodeId } from './lib/id-system-library';

WYMAGANE ENDPOINTS:
• POST /api/orders - nowe zlecenie z ID
• POST /api/clients - nowy klient z ID  
• GET /api/decode/:id - dekodowanie ID
• GET /api/orders/:id - szczegóły zlecenia
• POST /api/migrate - migracja starych ID

FUNKCJONALNOŚCI:
• Automatyczne generowanie ID
• Walidacja input data
• Error handling
• Response z ID info

Framework: [Express/Next.js/Fastify/inne]

Pokaż complete API code.
```

### 5️⃣ **REACT COMPONENTS PROMPT:**

```
Utwórz komponenty React dla systemu ID:

FUNKCJE DOSTĘPNE:
• generateOrderId(source) → "ORDA252710001"
• decodeId(id) → {type: "ORD", source: "A", date: Date, number: 1}

KOMPONENTY DO UTWORZENIA:
1. IDDisplay - wyświetla ID z decoded info
2. OrderForm - formularz z auto-generated ID
3. IDSearch - wyszukiwanie po ID
4. ClientManager - zarządzanie klientami z ID

WYMAGANIA:
• TypeScript support
• Error handling
• Loading states
• Responsive design z [Tailwind/MUI/Styled-components]

PRZYKŁAD DECODED ID:
"ORDA252710001" → AI Assistant, 28.09.2025, #1

Pokaż kod komponentów.
```

---

## 🔥 POWER PROMPTS (ZAAWANSOWANE)

### 💪 **FULL STACK INTEGRATION:**

```
MEGA PROMPT: Kompletna integracja systemu ID

KONTEKST:
Mam bibliotekę id-system-library z funkcjami generowania unikalnych ID. Chcę pełną integrację full-stack.

STACK:
• Frontend: [React/Next.js/Vue/Angular]
• Backend: [Node.js/Python/PHP/.NET]  
• Database: [PostgreSQL/MySQL/MongoDB]
• Deployment: [Vercel/AWS/Azure/GCP]

FUNKCJE ID SYSTEM:
• generateOrderId(source) - źródła: A,M,W,T,E,R
• generateClientId(), generateEmployeeId()
• decodeId(id) - dekoduje typ, źródło, datę, numer
• validateInput() - walidacja
• generateLegacyOrderId() - migracja

WYMAGANIA FULL-STACK:
1. 🗄️ DATABASE: Schema z ID jako PRIMARY KEY, indeksy, foreign keys
2. 🔌 API: RESTful endpoints dla CRUD operacji z ID
3. 🎨 FRONTEND: Komponenty do zarządzania ID, forms, display
4. 🔄 MIGRATION: Plan migracji z starych systemów ID
5. 🧪 TESTING: Unit, integration, E2E tests
6. 🚀 DEPLOYMENT: Production-ready config
7. 📊 MONITORING: Logging, analytics, error tracking

DODATKOWE:
• TypeScript dla type safety
• Error handling na wszystkich poziomach  
• Performance optimization
• Security best practices
• Documentation i comments

Pokaż kompletny kod dla full-stack integration.
```

### 🏗️ **ARCHITECTURE PROMPT:**

```
Zaprojektuj architekturę systemu z biblioteką ID:

SYSTEM OVERVIEW:
• Biblioteka: id-system-library (generuje unikalne ID)
• Aplikacje: Web (Next.js) + Mobile (React Native)
• Backend: API Server + Database
• Integracje: Third-party services

ID SYSTEM FEATURES:
• Format: PREFIX + SOURCE + DATE + NUMBER
• Przykłady: "ORDA252710001", "CLI252710001"
• Dekodowanie: typ, źródło, data, numer sekwencyjny
• Skalowalność: 59,994 ID/dzień per typ

ARCHITECTURE REQUIREMENTS:
1. 🏢 MICROSERVICES: ID service jako osobny serwis
2. 🔄 SYNC: Web ↔ Mobile synchronizacja  
3. 📱 OFFLINE: Mobile działa bez internetu
4. ⚡ PERFORMANCE: Sub-millisecond ID generation
5. 🛡️ RELIABILITY: 99.9% uptime, backup/recovery
6. 📊 SCALABILITY: Handle 1M+ ID/day
7. 🔒 SECURITY: Encrypt sensitive ID data

TECHNOLOGIES:
• Containers: Docker + Kubernetes
• Cache: Redis dla frequently accessed ID
• Queue: dla async ID operations
• Monitoring: dla tracking ID usage

Pokaż architecture diagram i implementation plan.
```

---

## 🎨 SPECIALIZED PROMPTS

### 📱 **MOBILE-FIRST PROMPT:**

```
React Native + Expo integration z id-system-library:

MOBILE FEATURES:
• generateMobileOrderId() → "ORDM252710001"
• generateMobileVisitId() → "VISM252710001"  
• Offline ID generation (no internet required)
• GPS tracking z visit ID
• Barcode scanning dla existing ID

REQUIREMENTS:
1. 📴 OFFLINE FIRST: Wszystko działa bez internetu
2. 🔄 SYNC: Auto-sync gdy online z conflict resolution
3. 📍 GPS: Location tracking z visit ID
4. 📷 CAMERA: QR/Barcode scanner dla ID
5. 💾 STORAGE: AsyncStorage dla lokalnych danych
6. 🔋 BATTERY: Optimized dla long usage

NATIVE INTEGRATIONS:
• @react-native-geolocation/geolocation
• react-native-camera lub expo-camera
• @react-native-async-storage/async-storage
• react-native-background-job

Pokaż mobile-optimized implementation.
```

### 🔬 **TESTING PROMPT:**

```
Comprehensive testing dla systemu ID:

TESTING SCOPE:
• Unit tests dla ID generation functions
• Integration tests dla database operations  
• E2E tests dla user workflows
• Performance tests dla high-load scenarios
• Security tests dla validation i injection

ID SYSTEM FUNCTIONS:
• generateOrderId(source) → test all sources
• decodeId(id) → test valid/invalid inputs
• validateInput() → test edge cases
• Database operations → test ACID properties

TEST SCENARIOS:
1. 🎯 FUNCTIONALITY: Wszystkie funkcje działają
2. 🏋️ PERFORMANCE: 1000+ ID/second generation
3. 🛡️ SECURITY: SQL injection, XSS protection
4. 🔄 CONCURRENCY: Multiple users creating ID
5. 💥 FAILURE: Database down, network issues
6. 📱 MOBILE: Offline/online scenarios

FRAMEWORKS:
• Jest + React Testing Library
• Supertest dla API testing
• Playwright/Cypress dla E2E
• Artillery/k6 dla load testing

Pokaż comprehensive test suite.
```

### 🚀 **DEPLOYMENT PROMPT:**

```
Production deployment systemu ID:

DEPLOYMENT TARGET: [Vercel/AWS/Azure/GCP/Self-hosted]

SYSTEM COMPONENTS:
• Frontend: aplikacja z id-system-library
• Backend: API serwer z database  
• Database: [PostgreSQL/MySQL] z ID storage
• Cache: Redis dla ID operations

PRODUCTION REQUIREMENTS:
1. 🔒 SECURITY: HTTPS, API authentication, input validation
2. ⚡ PERFORMANCE: CDN, caching, database optimization
3. 📊 SCALABILITY: Auto-scaling, load balancing
4. 🛡️ RELIABILITY: Health checks, circuit breakers
5. 📈 MONITORING: Logs, metrics, alerts
6. 🔄 BACKUP: Automated database backups
7. 🚀 CI/CD: Automated testing i deployment

CONFIGURATION:
• Environment variables dla sensitive data
• Database connection pooling
• Rate limiting dla ID generation API
• Monitoring dashboards

ID-SPECIFIC CONFIGS:
• Database indexes dla ID columns
• Cache settings dla frequent ID lookups  
• Backup strategy dla ID mappings

Pokaż production deployment configuration.
```

---

## 🎯 QUICK COPY PROMPTS

### ⚡ **1-MINUTE SETUP:**
```
Szybka integracja id-system-library:

1. Import: const { generateOrderId } = require('./id-system-library');
2. Use: const id = generateOrderId('W'); // "ORDW252710001"
3. Store: INSERT INTO orders (id, ...) VALUES (id, ...);
4. Display: <div>Order: {id}</div>

Pokaż kod dla [TWÓJ_FRAMEWORK].
```

### 🔧 **DEBUG PROMPT:**
```
Debug problem z id-system-library:

ERROR: [WKLEJ SWÓJ BŁĄD]

CONTEXT:
• Framework: [TWÓJ_FRAMEWORK]
• Code: [WKLEJ KOD]
• Expected: [CO OCZEKUJESZ]
• Actual: [CO SIĘ DZIEJE]

Diagnozuj i napraw problem.
```

### 📚 **LEARNING PROMPT:**
```
Naucz mnie id-system-library:

1. Wyjaśnij format ID: "ORDA252710001"
2. Pokaż wszystkie funkcje z przykładami
3. Best practices dla używania w [PROJEKT_TYPE]
4. Common pitfalls i jak ich unikać

Przykłady praktyczne dla [TWÓJ_CASE].
```

---

## 🎉 GOTOWE DO UŻYCIA!

**Instrukcja:**
1. 📋 Skopiuj odpowiedni prompt
2. ✏️ Zastąp [PLACEHOLDER] swoimi wartościami  
3. 🤖 Wklej do AI (ChatGPT, Claude, etc.)
4. 🚀 Otrzymaj gotowy kod!

**Pro tip:** Kombinuj prompty dla bardziej złożonych scenariuszy!