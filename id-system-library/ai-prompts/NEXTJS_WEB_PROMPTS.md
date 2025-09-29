# 🤖 PROMPT AI: WDROŻENIE SYSTEMU ID W NEXT.JS

## 📋 INSTRUKCJE DLA AI

**Kontekst:** Mam gotową bibliotekę ID System Library i chcę ją wdrożyć w mojej aplikacji Next.js. Pomóż mi zintegrować system ID z moją stroną internetową.

---

## 🎯 GŁÓWNY PROMPT

```
Pomóż mi wdrożyć system ID w mojej aplikacji Next.js. Mam gotową bibliotekę "id-system-library" z następującymi funkcjami:

DOSTĘPNE FUNKCJE:
- generateOrderId(source) - źródła: A,M,W,T,E,R
- generateClientId() - ID klientów
- generateEmployeeId() - ID pracowników  
- generateVisitId() - ID wizyt
- generateLegacyOrderId(oldId) - migracja starych ID
- decodeId(id) - dekodowanie informacji z ID
- validateInput(type, params) - walidacja

FORMATY ID:
- Zlecenia: "ORDA252710001" (ORD + źródło + data + numer)
- Klienci: "CLI252710001" (CLI + data + numer)
- Pracownicy: "EMP252710001" (EMP + data + numer)

ZADANIA:
1. Utwórz API routes w Next.js dla zarządzania ID
2. Zintegruj z moją istniejącą bazą danych
3. Dodaj komponenty React do wyświetlania i zarządzania ID
4. Zapewnij migrację ze starych systemów ID
5. Dodaj walidację po stronie klienta i serwera

WYMAGANIA:
- Next.js 14+
- Kompatybilność z TypeScript
- Obsługa błędów i walidacji
- Responsywny UI
- Optymalizacja dla SEO

Pokaż mi konkretny kod do implementacji.
```

---

## 🔧 PROMPTY SZCZEGÓŁOWE

### 1️⃣ **API ROUTES:**

```
Utwórz API routes Next.js dla systemu ID:

WYMAGANE ENDPOINTY:
- POST /api/orders - tworzenie nowego zlecenia
- POST /api/clients - tworzenie nowego klienta  
- GET /api/orders/[id] - pobieranie szczegółów zlecenia
- GET /api/decode/[id] - dekodowanie informacji z ID
- POST /api/migrate - migracja starych ID

BIBLIOTEKA:
import { generateOrderId, generateClientId, decodeId, validateInput } from '../../../lib/id-system-library/id-system.js';

PRZYKŁAD UŻYCIA:
const orderId = generateOrderId('W'); // Website source
const clientId = generateClientId();
const info = decodeId(orderId);

BAZA DANYCH:
- orders: id (VARCHAR 15), source (CHAR 1), created_at, data...
- clients: id (VARCHAR 15), name, email, created_at...

Pokaż kompletny kod API routes ze wszystkimi funkcjami.
```

### 2️⃣ **KOMPONENTY REACT:**

```
Utwórz komponenty React dla systemu ID:

WYMAGANE KOMPONENTY:
1. OrderForm - formularz tworzenia zlecenia z ID
2. ClientManager - zarządzanie klientami z ID
3. IDDisplay - wyświetlanie i dekodowanie ID
4. MigrationPanel - panel migracji starych ID
5. IDValidator - komponent walidacji ID

FUNKCJONALNOŚCI:
- Automatyczne generowanie ID podczas tworzenia
- Wyświetlanie zdekodowanych informacji (źródło, data)
- Walidacja po stornie klienta
- Obsługa błędów i loading states
- Responsywny design z Tailwind CSS

PRZYKŁAD ID:
- Zlecenie: "ORDA252710001" → AI Assistant, 28.09.2025, #1
- Klient: "CLI252710001" → 28.09.2025, #1

Pokaż kod komponentów z pełną funkcjonalnością.
```

### 3️⃣ **INTEGRACJA Z BAZĄ DANYCH:**

```
Zintegruj system ID z bazą danych:

STRUKTURA TABEL:
- orders: id VARCHAR(15) PRIMARY KEY, source CHAR(1), date_code VARCHAR(5)
- clients: id VARCHAR(15) PRIMARY KEY, name VARCHAR(255), email VARCHAR(255)
- employees: id VARCHAR(15) PRIMARY KEY
- legacy_mapping: old_id VARCHAR(255), new_id VARCHAR(15)

WYMAGANIA:
- Automatyczne indeksy dla optymalizacji
- Constraints zapewniające unikalność
- Triggers do aktualizacji pól computed
- Migracja istniejących danych

SYSTEM ID:
- generateOrderId('W') → "ORDW252710001"
- generateClientId() → "CLI252710001"
- generateLegacyOrderId("123") → "OLD123"

ORM/QUERY BUILDER:
[Podaj czy używasz Prisma, Drizzle, czy raw SQL]

Pokaż schema bazy danych i kod migracji.
```

### 4️⃣ **TYPESCRIPT INTEGRATION:**

```
Dodaj pełne wsparcie TypeScript dla systemu ID:

TYPY DO UTWORZENIA:
- OrderSource: 'A' | 'M' | 'W' | 'T' | 'E' | 'R'
- IDTypes: 'ORD' | 'CLI' | 'EMP' | 'VIS' | 'APP'
- DecodedID: interface z polami type, source, date, number
- IDValidationResult: interface z success, errors

FUNKCJE:
- generateOrderId(source: OrderSource): string
- generateClientId(): string
- decodeId(id: string): DecodedID
- validateInput(type: string, params: any): IDValidationResult

PRZYKŁADY UŻYCIA:
const orderId = generateOrderId('W'); // Type-safe
const decoded: DecodedID = decodeId(orderId);
const isValid: boolean = decoded.isValid;

Pokaż pełne typy TypeScript i przykłady użycia.
```

### 5️⃣ **MIGRACJA DANYCH:**

```
Pomóż z migracją starych systemów ID:

SCENARIUSZE MIGRACJI:
1. Z liczb całkowitych: 1, 2, 3... → OLD1, OLD2, OLD3...
2. Z UUID: "550e8400-..." → "OLD550e8400-..."
3. Z własnych formatów: "ZL2024/001" → "OLDZL2024/001"

NARZĘDZIA:
- generateLegacyOrderId(originalId) dla migracji
- Mapowanie stare→nowe ID w tabeli legacy_mapping
- Skrypty do aktualizacji wszystkich referencji

PROCES MIGRACJI:
1. Backup istniejących danych
2. Utworzenie mapowania ID
3. Aktualizacja wszystkich tabel z referencjami
4. Walidacja integralności danych
5. Czyszczenie i optymalizacja

WYMAGANIA:
- Zero downtime deployment
- Rollback plan
- Walidacja każdego kroku

Pokaż kod do bezpiecznej migracji danych.
```

---

## 🎨 PROMPTY UI/UX

### 📱 **RESPONSIVE COMPONENTS:**

```
Utwórz responsywne komponenty dla systemu ID:

KOMPONENTY:
- IDCard - karta wyświetlająca ID z detalami
- IDGenerator - generator nowych ID z podglądem
- IDHistory - historia wygenerowanych ID
- IDSearch - wyszukiwanie i filtrowanie ID
- IDStats - statystyki użycia ID

DESIGN REQUIREMENTS:
- Tailwind CSS dla stylowania
- Dark/light mode support
- Mobile-first approach
- Accessibility (ARIA labels, keyboard navigation)
- Loading states i error handling

PRZYKŁAD ID DISPLAY:
ID: ORDA252710001
├── Typ: Zlecenie (ORD)
├── Źródło: AI Assistant (A)  
├── Data: 28 września 2025
└── Numer: #1

Pokaż kod komponentów z pełnym stylingiem.
```

### 🔍 **SEARCH & FILTERING:**

```
Dodaj wyszukiwanie i filtrowanie ID:

FUNKCJONALNOŚCI:
- Wyszukiwanie po ID, typie, źródle, dacie
- Filtrowanie po zakresie dat
- Sortowanie po różnych kryteriach
- Paginacja wyników
- Export do CSV/JSON

INTERFEJS:
- Search input z auto-complete
- Filter dropdowns (typ, źródło)
- Date range picker
- Results table z sort headers
- Actions (view, edit, delete)

SYSTEM ID FIELDS:
- ID: "ORDA252710001"
- Type: "ORD" 
- Source: "A" (AI Assistant)
- Date: 2025-09-28
- Number: 1

Pokaż kod komponentów wyszukiwania i filtrowania.
```

---

## 🧪 PROMPTY TESTOWANIA

### ✅ **UNIT TESTS:**

```
Utwórz testy jednostkowe dla integracji ID:

TESTY DO UTWORZENIA:
- API routes testing (POST /api/orders, /api/clients)
- Component testing (OrderForm, ClientManager)  
- ID generation testing (prawidłowe formaty)
- Validation testing (błędne dane)
- Database integration testing

FRAMEWORK: Jest + React Testing Library

PRZYKŁADY TESTÓW:
- generateOrderId('W') → prawidłowy format "ORDW..."
- decodeId("ORDA252710001") → prawidłowe dekodowanie
- API POST /api/orders → zwraca 201 z ID
- OrderForm submit → wywołuje API i wyświetla ID

COVERAGE:
- 100% code coverage dla funkcji ID
- Unit tests dla wszystkich API routes
- Integration tests dla komponentów

Pokaż kod testów z pełnym coverage.
```

### 🔬 **E2E TESTS:**

```
Utwórz testy end-to-end dla workflow ID:

SCENARIUSZE TESTOWE:
1. Użytkownik tworzy nowe zlecenie → ID jest generowane i wyświetlane
2. Admin migruje stare ID → mapowanie działa prawidłowo
3. Klient wyszukuje zlecenie po ID → znajduje prawidłowe dane
4. System generuje różne typy ID → wszystkie są unikalne

NARZĘDZIA: Playwright lub Cypress

WORKFLOW TESTS:
- Create Order Flow: formularz → submit → API call → success page
- Migration Flow: upload old data → process → validation → completion
- Search Flow: search input → API call → results display

ASSERTIONS:
- ID ma prawidłowy format
- Dane są zapisywane w bazie
- UI updates reflect database changes

Pokaż kod testów E2E dla głównych workflow.
```

---

## 🚀 PROMPT DEPLOYMENT

```
Pomóż z deployment systemu ID na produkcję:

ŚRODOWISKO:
- Vercel/Netlify dla Next.js
- PostgreSQL/MySQL dla bazy danych
- Redis dla cache (opcjonalnie)

KONFIGURACJA:
- Zmienne środowiskowe dla połączenia z bazą
- Rate limiting dla API endpoints ID
- Monitoring i logowanie generacji ID
- Backup automatyczny

OPTYMALIZACJE:
- Database indexing dla pól ID
- Cache frequently used ID decoding
- Bundle size optimization
- SEO optimization dla stron z ID

SECURITY:
- Walidacja wszystkich inputs
- Rate limiting dla generacji ID
- Audit log dla zmian ID
- CORS configuration

MONITORING:
- Śledzenie wydajności generacji ID
- Alert gdy ID generation fails
- Dashboard z statistykami użycia

Pokaż konfigurację deployment i monitoring.
```

---

## 🎯 PRZYKŁAD UŻYCIA PROMPTU

**Wklej to do AI:**
```
Używam biblioteki id-system-library w Next.js. Potrzebuję:

1. API route do tworzenia zleceń z automatycznym ID
2. Komponent React do wyświetlania informacji o ID  
3. Migrację starych zleceń (liczby całkowite → nowy format)

Moja biblioteka ma funkcje:
- generateOrderId('W') → "ORDW252710001"
- decodeId(id) → {type, source, date, number}
- generateLegacyOrderId(oldId) → "OLD" + oldId

Baza: PostgreSQL z tabelą orders (id, customer_name, status, created_at)

Pokaż kod API route i komponentu React.
```

**AI odpowie z konkretnym, gotowym kodem do użycia!**

---

## 🎉 GOTOWE PROMPTY!

Wszystkie prompty są przygotowane do natychmiastowego użycia z AI. Skopiuj odpowiedni prompt, dostosuj do swoich potrzeb i otrzymaj gotowy kod!