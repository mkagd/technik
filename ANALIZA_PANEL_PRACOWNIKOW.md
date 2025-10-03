# 📋 KOMPLEKSOWA ANALIZA PANELU ZARZĄDZANIA PRACOWNIKAMI

## 🎯 CEL DOKUMENTU
Analiza całego systemu pracowników w projekcie, aby określić co jest potrzebne w nowym panelu zarządzania.

---

## 1️⃣ OBECNA STRUKTURA DANYCH PRACOWNIKA

### Plik: `data/employees.json` (8 pracowników)

```json
{
  "id": "EMP25189001",
  "name": "Jan Kowalski",
  "email": "jan.kowalski@techserwis.pl",
  "phone": "+48 123 456 789",
  "specializations": ["Serwis AGD", "Naprawa pralek"],
  "isActive": true,
  "dateAdded": "2025-07-08T22:25:15.180Z",
  "address": "Warszawa",
  "workingHours": "8:00-16:00",
  "experience": "5 lat",
  "rating": 4.8,
  "completedJobs": 245,
  
  "agdSpecializations": {
    "primaryCategory": "AGD",
    "devices": [
      {
        "type": "pralka",
        "brands": ["Samsung", "LG"],
        "experienceYears": 8,
        "level": "beginner|advanced|expert",
        "certifications": ["Samsung Service Professional"]
      }
    ],
    "specialSkills": ["Diagnostyka elektroniczna"]
  },
  
  "equipment": {
    "personalTools": ["Multimetr Fluke 117"],
    "specializedEquipment": [],
    "mobileWorkshop": true,
    "toolsValue": 6301,
    "lastInventoryCheck": "2025-08-21"
  },
  
  "vehicle": {
    "make": "Ford",
    "model": "Sprinter",
    "year": 2021,
    "licensePlate": "WA76927",
    "fuelType": "diesel",
    "capacity": { "volume": "15m³", "weight": "1716kg" },
    "mileage": 41339,
    "nextService": "2025-10-18"
  },
  
  "serviceArea": {
    "primaryCity": "Warszawa",
    "radius": 30,
    "preferredDistricts": ["Mokotów", "Ursynów"],
    "maxDistanceKm": 40,
    "avoidAreas": ["Centrum w godzinach szczytu"],
    "travelTimePreference": "minimize"
  },
  
  "performance": {
    "monthlyStats": {
      "completedOrders": 32,
      "averageTimePerOrder": 139,
      "customerSatisfaction": "4.7",
      "onTimeArrival": 98,
      "firstTimeFixRate": 74
    },
    "specialtyMetrics": {
      "agdRepairSuccess": 82,
      "complexRepairCapability": 68
    }
  },
  
  "availability": {
    "vacationDays": { "total": 26, "used": 0, "planned": [] },
    "overtime": { "maxHoursPerWeek": 10, "currentWeekHours": 5 },
    "emergencyAvailability": true
  },
  
  "certifications": {
    "current": [
      {
        "name": "Uprawnienia elektryczne do 1kV",
        "issuer": "UDT",
        "validUntil": "2026-05-15"
      }
    ]
  },
  
  "metadata": {
    "createdAt": "2025-07-08T22:25:15.180Z",
    "updatedAt": "2025-09-30T20:21:02.155Z",
    "version": 2,
    "profileCompleteness": 95
  },
  
  "repairTimes": {
    "pralka": 29,
    "lodówka": 34,
    "zmywarka": 38,
    // ... inne urządzenia
  },
  
  "builtInWorkTimes": {
    "demontaż": 10,
    "montaż": 10,
    "trudnaZabudowa": 30
  }
}
```

---

## 2️⃣ GDZIE SYSTEM PRACOWNIKÓW JEST UŻYWANY

### A. System Przydziału Zleceń
**Pliki:** `pages/api/order-assignment.js`, `pages/zlecenie-szczegoly.js`

**Co się dzieje:**
- Ręczne przydzielanie zleceń do pracownika
- Automatyczne znajdowanie najlepszego pracownika (na podstawie specjalizacji, lokalizacji)
- Obliczanie obciążenia pracownika
- Tracking workload (ile zleceń ma przypisanych)

**Potrzebne dane:**
- ✅ Lista wszystkich pracowników
- ✅ Specjalizacje
- ✅ Lokalizacja/obszar działania
- ✅ Aktywność (isActive)
- ✅ Obciążenie (ile zleceń aktualnie)

---

### B. Intelligent Planner (Planer Tygodniowy)
**Pliki:** `components/IntelligentWeekPlanner.js`, `pages/intelligent-planner.js`

**Co się dzieje:**
- Wybór pracownika z dropdown
- Planowanie wizyt dla konkretnego pracownika
- Przerzucanie wizyt między pracownikami
- Optymalizacja tras
- Osobne plany dla każdego pracownika

**Potrzebne dane:**
- ✅ Lista aktywnych pracowników
- ✅ Imię i nazwisko
- ✅ ID pracownika
- ✅ Specjalizacje (do filtrowania zleceń)
- ✅ Lokalizacja bazowa

---

### C. Kalendarz Pracownika
**Pliki:** `pages/kalendarz-pracownika-prosty.js`, `pages/api/employee-calendar.js`

**Co się dzieje:**
- Pracownik widzi swój harmonogram
- Ustawia godziny pracy (work slots)
- Oznacza dostępność/niedostępność
- Zaznacza przerwy
- System automatycznie generuje time slots

**Potrzebne dane:**
- ✅ workingHours (domyślne godziny pracy)
- ✅ Schedule (harmonogram per dzień)
- ✅ Time slots (szczegółowe 30-min sloty)
- ✅ Availability settings

---

### D. System Czasów Napraw
**Pliki:** `pages/ustawienia-czasow.js`, `utils/repairTimeCalculator.js`

**Co się dzieje:**
- Admin ustawia indywidualne czasy napraw dla każdego pracownika
- Każdy pracownik ma swoje czasy dla różnych urządzeń
- System oblicza czas wizyty na podstawie:
  - Bazowego czasu pracownika dla urządzenia
  - Czasów dodatkowych (zabudowa)
  - Ręcznych korekt

**Potrzebne dane:**
- ✅ `repairTimes` (czasy dla każdego typu urządzenia)
- ✅ `builtInWorkTimes` (czasy pracy z zabudową) ⭐ **NOWO DODANE!**
- ✅ Poziom doświadczenia (level: beginner/advanced/expert)

---

### E. Panel Pracownika
**Pliki:** `pages/pracownik-panel.js`, `pages/pracownik-logowanie.js`

**Co się dzieje:**
- Pracownik loguje się (email + hasło)
- Widzi swoje przypisane zlecenia
- Widzi statystyki
- Widzi swój kalendarz
- Aktualizuje status zleceń

**Potrzebne dane:**
- ✅ Email, hasło (auth)
- ✅ Przypisane zlecenia (orders where assignedTo = employeeId)
- ✅ Statystyki (completedJobs, rating)

---

### F. Wizyty i Zlecenia
**Pliki:** `pages/api/intelligent-planner/get-data.js`, `generate-new-orders.js`

**Co się dzieje:**
- Każda wizyta ma `technicianId` i `technicianName`
- System filtruje wizyty dla konkretnego pracownika
- Pokazuje imię pracownika przy wizytach

**Potrzebne dane:**
- ✅ ID pracownika (do przypisania)
- ✅ Imię pracownika (do wyświetlenia)

---

### G. Admin Panel (obecnie)
**Plik:** `pages/admin.js` (zakładka "Pracownicy")

**Co się dzieje:**
- Lista wszystkich pracowników
- Filtrowanie (imię, email, specjalizacja, status)
- Podgląd szczegółów
- Edycja pracownika (podstawowe dane)
- Usuwanie pracownika

**Braki obecnego panelu:**
- ❌ Brak edycji czasów napraw
- ❌ Brak edycji czasów zabudowy ⭐ **NOWO POTRZEBNE!**
- ❌ Brak zarządzania specjalizacjami AGD
- ❌ Brak zarządzania pojazdem
- ❌ Brak zarządzania wyposażeniem
- ❌ Brak statystyk wydajności
- ❌ Brak zarządzania certyfikatami
- ❌ Brak obszaru działania (mapa)

---

## 3️⃣ CO MUSI BYĆ W NOWYM PANELU

### 🎯 LISTA FUNKCJONALNOŚCI (PRIORYTETY)

#### ⭐ MUST-HAVE (Absolutnie potrzebne)
1. **Lista pracowników** z sortowaniem i filtrowaniem
2. **Dodawanie nowego pracownika** (pełny formularz)
3. **Edycja podstawowych danych:**
   - Imię i nazwisko
   - Email
   - Telefon
   - Adres
   - Godziny pracy (workingHours)
   - Doświadczenie
   - Status aktywności (isActive)

4. **Edycja specjalizacji:**
   - Lista specjalizacji ogólnych (Serwis AGD, Naprawa pralek)
   - Specjalizacje AGD (devices: pralka, lodówka, etc.)
   - Marki (Samsung, LG, Bosch)
   - Poziom doświadczenia (beginner/advanced/expert)
   - Lata doświadczenia

5. **Edycja czasów napraw** ⚡ KRYTYCZNE
   - Wszystkie typy urządzeń (pralka, lodówka, zmywarka, etc.)
   - Możliwość ustawienia indywidualnych czasów
   - Podgląd domyślnych czasów

6. **Edycja czasów pracy z zabudową** ⚡ NOWE!
   - Demontaż (min)
   - Montaż (min)
   - Trudna zabudowa (min)

7. **Usuwanie pracownika** (soft delete - zmiana isActive)

8. **Pobieranie z API:** `GET /api/employees`
9. **Zapisywanie do API:** `POST /api/employees` (dodawanie), `PUT /api/employees` (edycja)

---

#### ⚙️ SHOULD-HAVE (Bardzo przydatne)
10. **Obszar działania:**
    - Miasto główne
    - Promień działania (km)
    - Preferowane dzielnice
    - Strefy których unika

11. **Statystyki wydajności:**
    - Wykonane zlecenia (completedJobs)
    - Ocena (rating)
    - Średni czas naprawy
    - Współczynnik punktualności
    - Satysfakcja klientów

12. **Dostępność:**
    - Urlop (dni wykorzystane/pozostałe)
    - Nadgodziny (max/wykorzystane)
    - Dostępność w nagłych przypadkach

13. **Pojazd:**
    - Marka, model
    - Nr rejestracyjny
    - Przebieg
    - Data następnego serwisu

---

#### 🎨 NICE-TO-HAVE (Dodatkowe udogodnienia)
14. **Certyfikaty:**
    - Lista certyfikatów
    - Daty ważności
    - Przypomnienia o wygasających

15. **Wyposażenie:**
    - Lista narzędzi
    - Wartość wyposażenia
    - Data ostatniej inwentaryzacji

16. **Wizualizacje:**
    - Mapa obszaru działania
    - Wykresy wydajności
    - Timeline aktywności

17. **Historia zmian:**
    - Kto i kiedy edytował
    - Log zmian w profilu

---

## 4️⃣ API ENDPOINTS POTRZEBNE

### Istniejące:
```javascript
✅ GET  /api/employees              // Lista wszystkich pracowników
✅ POST /api/employees              // Dodaj nowego pracownika
❌ PUT  /api/employees/:id          // Aktualizuj pracownika (BRAK!)
❌ DELETE /api/employees/:id        // Usuń pracownika (BRAK!)
```

### DO DODANIA:
```javascript
PUT  /api/employees/:id             // Aktualizacja pracownika
DELETE /api/employees/:id           // Usunięcie (soft delete)
PUT  /api/employees/:id/times       // Aktualizacja czasów napraw
PUT  /api/employees/:id/built-in-times  // Aktualizacja czasów zabudowy ⭐ NOWE
GET  /api/employees/:id/stats       // Statystyki pracownika
GET  /api/employees/:id/assignments // Zlecenia pracownika
```

---

## 5️⃣ STRUKTURA FORMULARZA EDYCJI

### Zakładki/Sekcje:

#### 📝 Sekcja 1: PODSTAWOWE DANE
- Imię i nazwisko *
- Email
- Telefon *
- Adres
- Godziny pracy (workingHours) np. "8:00-16:00"
- Doświadczenie (lata)
- Status: Aktywny / Nieaktywny

#### 🔧 Sekcja 2: SPECJALIZACJE
- **Specjalizacje ogólne** (multi-select)
  - Serwis AGD
  - Naprawa pralek
  - Chłodnictwo
  - Elektronika
  
- **Specjalizacje AGD** (rozwijane)
  - Typ urządzenia (pralka, lodówka, etc.)
  - Marki (Samsung, LG, Bosch)
  - Lata doświadczenia w tym urządzeniu
  - Poziom: Beginner / Advanced / Expert
  - Certyfikaty (lista)

#### ⏱️ Sekcja 3: CZASY NAPRAW ⚡ KRYTYCZNE
Grid z wszystkimi urządzeniami:

| Urządzenie | Czas domyślny | Czas pracownika | Akcje |
|------------|---------------|-----------------|-------|
| Pralka | 30 min | 29 min | 📝 |
| Lodówka | 40 min | 34 min | 📝 |
| Zmywarka | 35 min | 38 min | 📝 |
| ... | ... | ... | ... |

**Funkcje:**
- Edycja inline lub modal
- Reset do domyślnych wartości
- Kopiuj czasy z innego pracownika

#### 🏠 Sekcja 4: CZASY ZABUDOWY ⭐ NOWE!
```
┌─────────────────────────────────┐
│ Demontaż zabudowy:    [10] min  │
│ Montaż zabudowy:      [10] min  │
│ Trudna zabudowa:      [30] min  │
└─────────────────────────────────┘
```

Wskazówka: "Te czasy są dodawane do czasu bazowego naprawy gdy urządzenie jest zabudowane"

#### 📍 Sekcja 5: OBSZAR DZIAŁANIA
- Miasto główne *
- Promień działania (km): slider 0-100
- Preferowane dzielnice (multi-select lub input)
- Strefy których unika (input)
- Preferuje: Minimize czas | Maximize liczba wizyt

#### 📊 Sekcja 6: STATYSTYKI (read-only)
Karty z numerami:
- Wykonane zlecenia: 245
- Ocena: ⭐ 4.8
- Średni czas naprawy: 139 min
- Punktualność: 98%
- Satysfakcja klientów: 4.7/5

#### 🚗 Sekcja 7: POJAZD
- Marka, Model
- Rok produkcji
- Nr rejestracyjny
- Paliwo: Diesel / Benzyna / Elektryczny / Hybryda
- Pojemność (m³)
- Przebieg (km)
- Data następnego serwisu
- Cechy (Klimatyzacja, Regały, LED, Gniazdka 230V)

#### 🎓 Sekcja 8: CERTYFIKATY
Lista certyfikatów:
```
┌─────────────────────────────────────────┐
│ 🎓 Uprawnienia elektryczne do 1kV       │
│    Wydawca: UDT                          │
│    Ważny do: 2026-05-15 ✅               │
│    [Edytuj] [Usuń]                       │
├─────────────────────────────────────────┤
│ + Dodaj nowy certyfikat                 │
└─────────────────────────────────────────┘
```

#### 📅 Sekcja 9: DOSTĘPNOŚĆ
- Dni urlopu: Wykorzystane [0] / Razem [26]
- Zaplanowane urlopy: [Lista dat]
- Nadgodziny: Wykorzystane w tym tygodniu [5] / Max [10]
- Dostępny w nagłych przypadkach: ☑️ Tak

---

## 6️⃣ DESIGN/UI REKOMENDACJE

### Styl wizualny:
- **Modern Material Design** (jak Google Admin)
- Karty z cieniami
- Przyjazne kolory (niebieskie, zielone)
- Responsywny (działa na mobile)
- Animacje przejść

### Layout:
```
┌────────────────────────────────────────────────────┐
│ 🏠 Dashboard > Pracownicy > Jan Kowalski          │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐    │
│  │ Podst.   │ Specj.   │ Czasy    │ Obszar   │    │
│  │ dane     │          │ napraw   │          │    │
│  └──────────┴──────────┴──────────┴──────────┘    │
│                                                     │
│  [Zawartość aktywnej zakładki]                     │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ [Anuluj]          [Zapisz] [Zapisz i zamknij]│ │
│  └───────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

### Komponenty:
- Tabs (zakładki) na górze
- Scroll w content area
- Fixed header z nazwą pracownika i awatarem
- Sticky footer z przyciskami akcji
- Loading states (skeleton screens)
- Success/Error notifications (toast)

---

## 7️⃣ WALIDACJA I LOGIKA

### Walidacja formularza:
- **Imię i nazwisko:** Wymagane, min 3 znaki
- **Telefon:** Wymagany, format +48 XXX XXX XXX
- **Email:** Opcjonalny, ale jeśli podany - musi być unikalny
- **workingHours:** Format "HH:MM-HH:MM"
- **Czasy napraw:** Muszą być > 0
- **Obszar działania:** Promień 1-100 km

### Zapisywanie:
1. Waliduj dane
2. Pokaż loading
3. PUT /api/employees/:id
4. Jeśli success:
   - Toast: "Pracownik zaktualizowany"
   - Opcjonalnie: Wróć do listy
5. Jeśli error:
   - Toast: "Błąd: {message}"
   - Pozostań w formularzu

### Porzucanie zmian:
- Jeśli są niezapisane zmiany:
  - Modal: "Masz niezapisane zmiany. Czy na pewno chcesz wyjść?"
  - [Anuluj] [Wyjdź bez zapisywania]

---

## 8️⃣ NOWY PLIK DO STWORZENIA

### Nazwa: `pages/admin/pracownicy.js`

**Struktura:**
```javascript
import { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiFilter } from 'react-icons/fi';

export default function AdminPracownicy() {
  // States
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic, specs, times, area, etc.
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    isActive: 'all'
  });
  
  // API calls
  const loadEmployees = async () => { ... }
  const saveEmployee = async (employeeData) => { ... }
  const deleteEmployee = async (id) => { ... }
  
  // Render components
  return (
    <div>
      {/* Header */}
      {/* Filters */}
      {/* Lista pracowników */}
      {/* Modal edycji */}
    </div>
  );
}
```

---

## 9️⃣ HARMONOGRAM IMPLEMENTACJI

### Faza 1: PODSTAWY (1 dzień)
- ✅ Utworzenie `pages/admin/pracownicy.js`
- ✅ Lista pracowników (fetch z API)
- ✅ Filtrowanie i wyszukiwanie
- ✅ Modal podglądu szczegółów

### Faza 2: EDYCJA PODSTAWOWA (1 dzień)
- ✅ Formularz edycji (zakładka "Podstawowe dane")
- ✅ Endpoint PUT /api/employees/:id
- ✅ Zapisywanie zmian
- ✅ Walidacja

### Faza 3: CZASÓW NAPRAW ⚡ PRIORYTET (0.5 dnia)
- ✅ Zakładka "Czasy napraw"
- ✅ Grid z edycją czasów
- ✅ **Zakładka "Czasy zabudowy"** ⭐ NOWE!
- ✅ Zapisywanie do `repairTimes` i `builtInWorkTimes`

### Faza 4: SPECJALIZACJE (1 dzień)
- ✅ Zakładka "Specjalizacje"
- ✅ Edycja specjalizacji ogólnych
- ✅ Edycja specjalizacji AGD
- ✅ Zarządzanie certyfikatami

### Faza 5: OBSZAR I STATYSTYKI (1 dzień)
- ✅ Zakładka "Obszar działania"
- ✅ Zakładka "Statystyki" (read-only)
- ✅ Zakładka "Pojazd"
- ✅ Zakładka "Dostępność"

### Faza 6: DODAWANIE PRACOWNIKA (0.5 dnia)
- ✅ Modal dodawania
- ✅ Endpoint POST /api/employees
- ✅ Generowanie domyślnych wartości

### Faza 7: POLISH & UX (0.5 dnia)
- ✅ Animacje
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Responsive design

---

## 🎯 PODSUMOWANIE

### Co jest NAJBARDZIEJ potrzebne:
1. **Edycja czasów napraw** - używane przez system czasu wizyt
2. **Edycja czasów zabudowy** ⭐ **NOWO DODANE!** - używane przy obliczaniu czasu wizyty
3. **Edycja specjalizacji** - używane przez system przydziału
4. **Edycja godzin pracy** - używane przez kalendarz
5. **Edycja podstawowych danych** - kontakt, adres

### Co może poczekać:
- Pojazd (nice to have)
- Wyposażenie (nice to have)
- Historia zmian (nice to have)
- Wizualizacje (nice to have)

### Kluczowe decyzje:
1. **Jeden duży modal z zakładkami** vs **Osobna strona edycji**
   - Rekomendacja: **Osobna strona** (więcej miejsca, lepszy UX)

2. **Inline editing** vs **Modal editing** dla czasów
   - Rekomendacja: **Modal** (więcej kontroli, lepszy UX)

3. **Auto-save** vs **Explicit save**
   - Rekomendacja: **Explicit save** (więcej kontroli, mniej błędów)

---

## 📦 ZALEŻNOŚCI DO DODANIA

```bash
# Jeśli nie ma:
npm install react-hot-toast       # Notyfikacje
npm install react-select          # Lepsze multi-selecty
npm install react-datepicker      # Wybór dat
npm install recharts              # Wykresy (opcjonalnie)
```

---

## ✅ CHECKLIST PRZED ROZPOCZĘCIEM

- [ ] Zrozumienie struktury `employees.json`
- [ ] Sprawdzenie API endpoints
- [ ] Przygotowanie design mockupów
- [ ] Setup nowego pliku `pages/admin/pracownicy.js`
- [ ] Stworzenie komponentów reużywalnych
- [ ] Dodanie endpoints do API (PUT, DELETE)
- [ ] Testy podstawowe

---

**Ostatnia aktualizacja:** 2 października 2025
**Autor analizy:** AI Assistant
**Status:** Ready for implementation 🚀
