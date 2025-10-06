# 📋 STRUKTURA FORMULARZY REZERWACJI

**Data:** 6 października 2025  
**Status:** ✅ KLAROWNY PODZIAŁ

---

## 🎯 DWA FORMULARZE - DWA CELE

### 1️⃣ Formularz dla KLIENTA `/rezerwacja`

**Przeznaczenie:** Szybkie zgłoszenie przez klienta ze strony głównej

**Lokalizacja:** `pages/rezerwacja.js` (1634 linie)

**Charakterystyka:**
- ✅ **Prosty** - Krok po kroku (wizard)
- ✅ **Auto-save** - Zapis co 5 sekund
- ✅ **Progress bar** - Wizualizacja postępu
- ✅ **Sticky header** - "Nowe zgłoszenie AGD"
- ✅ **Opcjonalne imię** - Auto-generacja "Klient #XXXXXX"
- ✅ **Przyjazny UX** - Dla osób nietechnicznych

**Kolejność kroków:**
1. Lokalizacja (kod pocztowy, miasto, ulica)
2. Kontakt (telefon, email opcjonalny)
3. Urządzenie (kategoria, marka, problem)
4. Dostępność (wybór terminu)
5. Podsumowanie

**Funkcje specjalne:**
- 💾 Auto-save draftu (localStorage + API)
- 🔄 Przywracanie draftu po odświeżeniu
- 📊 Wskaźnik zapisu (prawy dolny róg)
- ⚠️ Bezpieczny przycisk Anuluj z potwierdzeniem

**URL:** 
- Dla klienta: `https://twoja-domena.pl/rezerwacja`
- Może być udostępniony publicznie

---

### 2️⃣ Formularz dla ADMINA `/admin/rezerwacje/nowa`

**Przeznaczenie:** Profesjonalne tworzenie rezerwacji przez pracownika call center

**Lokalizacja:** `pages/admin/rezerwacje/nowa.js` (1179 linii)

**Charakterystyka:**
- 🏢 **Rozbudowany** - Wszystkie pola naraz
- 📞 **Wiele telefonów** - Główny, dodatkowy, firmowy
- 📍 **Wiele adresów** - Główny, serwisowy, firmowy
- 🔧 **Wiele urządzeń** - Wiele napraw w jednym zleceniu
- 🏢 **Dane firmowe** - NIP, REGON, KRS, nazwa firmy
- 📅 **Zaawansowana dostępność** - Scheduler wizyt
- 🎨 **AdminLayout** - Nawigacja, powiadomienia, sidebar

**Struktura:**
```
┌─────────────────────────────────────────┐
│ AdminLayout (sidebar + header)          │
│                                         │
│  Dane klienta:                          │
│  ├─ Typ: Osoba fizyczna / Firma         │
│  ├─ Imię i nazwisko / Nazwa firmy      │
│  ├─ [+] Wiele telefonów                │
│  ├─ [+] Wiele adresów                  │
│  └─ Dane firmowe (NIP, REGON, KRS)     │
│                                         │
│  Urządzenia:                            │
│  └─ [+] Dodaj kolejne urządzenie       │
│                                         │
│  Dostępność:                            │
│  └─ AvailabilityScheduler               │
│                                         │
│  Status rezerwacji:                     │
│  └─ Dropdown (pending, contacted, etc.) │
│                                         │
│  [Zapisz] [Anuluj]                     │
└─────────────────────────────────────────┘
```

**Funkcje specjalne:**
- 🔍 Autocomplete modeli urządzeń
- 🏢 Integracja z GUS (sprawdzanie NIP)
- 📅 Kalendarz dostępności techników
- 📊 Wybór statusu rezerwacji
- 📝 Szczegółowe notatki

**URL:** 
- Tylko dla admina: `https://twoja-domena.pl/admin/rezerwacje/nowa`
- Wymaga zalogowania (AdminLayout)

---

## 🔀 PORÓWNANIE

| Feature | Klient `/rezerwacja` | Admin `/admin/rezerwacje/nowa` |
|---------|---------------------|-------------------------------|
| Layout | Prosty wizard | AdminLayout |
| Telefony | 1 | Wiele |
| Adresy | 1 | Wiele |
| Urządzenia | Wiele (uproszczone) | Wiele (szczegółowe) |
| Dane firmowe | ❌ | ✅ (NIP, REGON, KRS) |
| Auto-save | ✅ Co 5s | ❌ |
| Progress bar | ✅ | ❌ |
| Sticky header | ✅ | ❌ (AdminLayout) |
| Status rezerwacji | Auto (pending) | Wybór dropdown |
| Scheduler wizyt | ❌ | ✅ |
| GUS integracja | ❌ | ✅ |
| Model suggestions | ❌ | ✅ |

---

## 📂 STRUKTURA PLIKÓW

```
pages/
├── rezerwacja.js                    # ← Klient (prosty, auto-save)
└── admin/
    └── rezerwacje/
        ├── index.js                # Lista rezerwacji
        ├── nowa.js                 # ← Admin (rozbudowany)
        ├── nowa.js.backup          # Backup (ten sam co nowa.js)
        └── [id].js                 # Edycja rezerwacji

pages/api/
└── drafts.js                       # API dla auto-save (klient)

data/
└── drafts.json                     # Storage draftów (klient)
```

---

## 🎬 PRZEPŁYW UŻYTKOWNIKA

### Scenariusz 1: Klient ze strony głównej
```
1. Klient wchodzi na stronę: https://twoja-domena.pl
2. Klikna "Zamów naprawę" → /rezerwacja
3. Wypełnia prosty formularz (4 kroki)
4. Auto-save zapisuje dane co 5s
5. Wysyła zgłoszenie
6. Status: "pending" (oczekuje na kontakt)
```

### Scenariusz 2: Admin call center
```
1. Admin loguje się: /admin
2. Idzie do: /admin/rezerwacje
3. Klika "+ Nowa rezerwacja"
4. Wypełnia szczegółowy formularz
5. Dodaje wiele telefonów, adresów, urządzeń
6. Sprawdza NIP w GUS
7. Umawia wizytę w kalendarzu
8. Zapisuje ze statusem "scheduled"
```

### Scenariusz 3: Admin telefoniczny
```
1. Klient dzwoni
2. Admin otwiera /admin/rezerwacje/nowa
3. W czasie rozmowy:
   - Zbiera dane kontaktowe
   - Notuje problemy z urządzeniami
   - Umawia termin wizyty
4. Zapisuje jako "contacted" lub "scheduled"
```

---

## 🚀 WDROŻENIE

### Dla klienta (strona główna)
Dodaj link do `/rezerwacja` w:
- Menu główne
- Przycisk "Zamów naprawę"
- Footer

### Dla admina (panel)
Link już istnieje w:
- `/admin/rezerwacje` → przycisk "+ Nowa rezerwacja"
- Automatycznie otwiera `/admin/rezerwacje/nowa`

---

## ⚙️ KONFIGURACJA

### Auto-save (tylko klient)
```javascript
// pages/rezerwacja.js, linia 161
const intervalId = setInterval(autoSave, 5000); // Co 5 sekund
```

### Draft retention (tylko klient)
```javascript
// pages/api/drafts.js, linia 15
const DRAFT_EXPIRY_DAYS = 7; // Drafty starsze niż 7 dni są usuwane
```

---

## 📝 DOKUMENTACJA SZCZEGÓŁOWA

### Dla formularza klienta:
- `REZERWACJA_ULEPSZENIA_WDROZONE.md` - Pełna dokumentacja
- `QUICK_TEST_REZERWACJA.md` - Przewodnik testowania

### Dla formularza admina:
- Stary formularz (standardowy Next.js)
- Brak auto-save (nie jest potrzebny)
- Używa AdminLayout

---

## ✅ CHECKLIST WDROŻENIA

**Formularz klienta** (`/rezerwacja`):
- [x] Auto-save co 5 sekund
- [x] Progress bar
- [x] Sticky header
- [x] Opcjonalne imię
- [x] Wskaźnik zapisu
- [x] Bezpieczny Anuluj
- [x] Draft API

**Formularz admina** (`/admin/rezerwacje/nowa`):
- [x] AdminLayout
- [x] Wiele telefonów
- [x] Wiele adresów
- [x] Wiele urządzeń
- [x] Dane firmowe
- [x] GUS integracja
- [x] Scheduler wizyt
- [x] Wybór statusu

---

## 🎯 PODSUMOWANIE

✅ **Klient** → Prosty, szybki, auto-save  
✅ **Admin** → Profesjonalny, szczegółowy, pełna kontrola

Oba formularze działają niezależnie i służą różnym celom!

---

**Autor:** GitHub Copilot  
**Data:** 6 października 2025  
**Status:** ✅ KLAROWNY PODZIAŁ
