# 📊 SYSTEM ZARZĄDZANIA CZASAMI NAPRAW - DOKUMENTACJA

**Data utworzenia:** 2 października 2025  
**Wersja:** 1.0  
**Status:** ✅ GOTOWY DO PRODUKCJI

---

## 🎯 CEL SYSTEMU

System automatycznego zarządzania czasami napraw AGD, który uwzględnia:
- **Typ urządzenia** (pralka, lodówka, zmywarka, itp.)
- **Indywidualne umiejętności pracownika** (doświadczenie, specjalizacje)
- **Dodatkowe czynności** (demontaż, montaż, trudna zabudowa)
- **Ręczny dodatkowy czas** na nietypowe sytuacje

---

## 📁 STRUKTURA PLIKÓW

### **Nowe pliki:**

```
data/
├── repair-time-settings.json      # Konfiguracja typów urządzeń i czasów dodatkowych
└── employees.json                  # Rozszerzony o pole repairTimes

utils/
└── repairTimeCalculator.js        # Kalkulator czasów napraw

pages/
├── ustawienia-czasow.js           # Panel administracyjny
└── api/
    └── repair-time-settings.js    # API endpoint dla ustawień

scripts/
└── add-repair-times-to-employees.js  # Skrypt inicjalizujący czasy
```

### **Zmodyfikowane pliki:**

```
pages/
├── zlecenie-szczegoly.js          # Modal z polami urządzenia i dodatkowych czynności
└── api/
    ├── orders.js                   # Obsługa deviceDetails
    └── intelligent-planner/
        └── save-plan.js            # Integracja z kalkulatorem

components/
└── IntelligentWeekPlanner.js      # Import suggestVisitDuration
```

---

## 🔧 FUNKCJONALNOŚCI

### **1. Konfiguracja czasów bazowych**

**Plik:** `data/repair-time-settings.json`

Zawiera:
- **16 typów urządzeń** z ikonami i czasami domyślnymi
- **Czasy dodatkowe:** demontaż (10min), montaż (10min), trudna zabudowa (30min)
- **Metadata:** wersja, daty aktualizacji

**Przykład urządzenia:**
```json
{
  "id": "pralka",
  "label": "Pralka automatyczna",
  "icon": "🧺",
  "category": "pralki",
  "defaultTime": 30,
  "supportsBuiltIn": true
}
```

### **2. Indywidualne czasy pracowników**

**Plik:** `data/employees.json` (pole `repairTimes`)

Każdy pracownik ma obiekt `repairTimes` z czasami dla każdego typu urządzenia:

```json
{
  "id": "EMP25189001",
  "name": "Jan Kowalski",
  "repairTimes": {
    "pralka": 29,
    "lodówka": 34,
    "zmywarka": 38,
    "piekarnik": 37
  }
}
```

**Automatyczne obliczanie czasów:**
- **Expert:** -5 min od czasu bazowego
- **Advanced:** -2 min
- **Intermediate:** 0 min
- **Beginner:** +3 min
- **Doświadczenie:** -1 min za każde 2 lata doświadczenia

### **3. Kalkulator czasu naprawy**

**Plik:** `utils/repairTimeCalculator.js`

**Główne funkcje:**

#### `calculateRepairTime(params)`
```javascript
const result = calculateRepairTime({
  employee: employeeObject,
  deviceType: 'pralka',
  additionalWork: {
    hasDemontaz: true,
    hasMontaz: true,
    hasTrudnaZabudowa: false,
    manualAdditionalTime: 15
  }
});

// Zwraca:
{
  baseTime: 29,
  additionalTime: 35,
  totalTime: 64,
  breakdown: {
    base: 29,
    demontaz: 10,
    montaz: 10,
    trudnaZabudowa: 0,
    manual: 15
  },
  deviceType: 'pralka',
  employeeName: 'Jan Kowalski'
}
```

#### `suggestVisitDuration(order, employee)`
Inteligentnie sugeruje czas wizyty na podstawie:
- deviceDetails w zleceniu (jeśli istnieje)
- Opisu zlecenia (próba wykrycia typu urządzenia)
- Fallback do średniego czasu (60 min)

#### `formatTime(minutes)`
```javascript
formatTime(45);  // "45min"
formatTime(90);  // "1h 30min"
formatTime(120); // "2h"
```

### **4. Modal dodawania wizyty**

**Plik:** `pages/zlecenie-szczegoly.js`

**Nowe pola:**
1. **Typ urządzenia** - select z 16 opcjami + ikony
2. **Dodatkowe czynności** - 3 checkboxy:
   - Demontaż zabudowy (+10 min)
   - Montaż zabudowy (+10 min)
   - Trudna zabudowa (+30 min)
3. **Dodatkowy czas (ręczny)** - pole numeryczne (minuty)
4. **Szacowany czas trwania** - automatycznie obliczony, tylko do odczytu

**Automatyczne obliczanie:**
```javascript
useEffect(() => {
  if (newVisit.deviceType && newVisit.assignedTo) {
    const selectedEmployee = employees.find(emp => emp.id === newVisit.assignedTo);
    
    const result = calculateRepairTime({
      employee: selectedEmployee,
      deviceType: newVisit.deviceType,
      additionalWork: {
        hasDemontaz: newVisit.hasDemontaz,
        hasMontaz: newVisit.hasMontaz,
        hasTrudnaZabudowa: newVisit.hasTrudnaZabudowa,
        manualAdditionalTime: newVisit.manualAdditionalTime
      }
    });
    
    setNewVisit(prev => ({
      ...prev,
      estimatedDuration: result.totalTime
    }));
  }
}, [
  newVisit.deviceType, 
  newVisit.assignedTo, 
  newVisit.hasDemontaz, 
  newVisit.hasMontaz, 
  newVisit.hasTrudnaZabudowa, 
  newVisit.manualAdditionalTime
]);
```

### **5. Panel administracyjny**

**URL:** `/ustawienia-czasow`

**Funkcje:**
- Edycja czasów dodatkowych (demontaż, montaż, trudna zabudowa)
- Edycja indywidualnych czasów napraw dla każdego pracownika
- Podgląd specjalizacji pracownika
- Porównanie z czasami domyślnymi
- Walidacja (5-300 minut)

**Uprawnienia:** Dostępne tylko dla administratorów

### **6. API Endpoints**

#### `GET /api/repair-time-settings`
Pobiera wszystkie ustawienia:
```json
{
  "settings": {...},
  "employees": [...],
  "deviceTypes": [...],
  "additionalTimes": {...}
}
```

#### `PUT /api/repair-time-settings`

**Typy aktualizacji:**

**1. Czasy dodatkowe:**
```json
{
  "type": "additionalTimes",
  "data": {
    "demontaz": 10,
    "montaz": 10,
    "trudnaZabudowa": 30
  }
}
```

**2. Czasy napraw pracownika:**
```json
{
  "type": "employeeRepairTimes",
  "data": {
    "employeeId": "EMP25189001",
    "repairTimes": {
      "pralka": 25,
      "lodówka": 35,
      "zmywarka": 30
    }
  }
}
```

**3. Czasy domyślne urządzeń:**
```json
{
  "type": "deviceDefaults",
  "data": {
    "pralka": 30,
    "lodówka": 40
  }
}
```

### **7. Integracja z Intelligent Planner**

**Plik:** `pages/api/intelligent-planner/save-plan.js`

Podczas tworzenia wizyt w planie:
1. Ładuje pracownika z bazy
2. Używa `suggestVisitDuration(order, employee)` do obliczenia czasu
3. Tworzy wizytę z inteligentnie obliczonym czasem

```javascript
const currentEmployee = employees.find(emp => emp.id === servicemanId);

const newVisit = createOrUpdateVisit(orderInDb, {
  employeeId: servicemanId,
  employeeName: currentEmployee?.name,
  scheduledDate: dayDate,
  scheduledTime: '09:00',
  estimatedDuration: planOrder.estimatedDuration || 60,
  type: 'diagnosis',
  status: 'scheduled'
}, currentEmployee); // Przekazany pracownik do kalkulacji
```

---

## 📊 STRUKTURA DANYCH

### **deviceDetails w orders.json:**

```json
{
  "id": 1001,
  "orderNumber": "ORDA25270001",
  "deviceDetails": {
    "deviceType": "pralka",
    "hasDemontaz": true,
    "hasMontaz": true,
    "hasTrudnaZabudowa": false,
    "manualAdditionalTime": 15
  },
  "visits": [
    {
      "visitId": "VIS252700001",
      "estimatedDuration": 64,
      "deviceType": "pralka",
      "hasDemontaz": true,
      "hasMontaz": true,
      "hasTrudnaZabudowa": false,
      "manualAdditionalTime": 15
    }
  ]
}
```

### **repairTimes w employees.json:**

```json
{
  "id": "EMP25189001",
  "name": "Jan Kowalski",
  "repairTimes": {
    "pralka": 29,
    "lodówka": 34,
    "zmywarka": 38,
    "piekarnik": 37,
    "kuchenka": 40,
    "płyta indukcyjna": 35,
    "suszarka": 35,
    "pralko-suszarka": 45,
    "zamrażarka": 40,
    "ekspres do kawy": 25,
    "robot kuchenny": 30,
    "blender": 20,
    "sokowirówka": 20,
    "mikrofalówka": 25,
    "okap": 30,
    "inne AGD": 30
  }
}
```

---

## 🔄 FLOW UŻYCIA

### **Scenariusz 1: Dodawanie wizyty manualnie**

1. Użytkownik otwiera **zlecenie-szczegoly**
2. Klika "Dodaj wizytę"
3. Wypełnia:
   - Data i godzina
   - Typ wizyty (diagnoza/naprawa/kontrola/montaż)
   - **Typ urządzenia** (np. "Pralka")
   - **Serwisant** (np. "Jan Kowalski")
   - **Dodatkowe czynności** (zaznacza: demontaż, montaż)
   - **Dodatkowy czas** (wpisuje: 15 min)
4. System automatycznie oblicza:
   - Czas bazowy: 29 min (pralka dla Jana)
   - Demontaż: +10 min
   - Montaż: +10 min
   - Ręczny: +15 min
   - **RAZEM: 64 min**
5. Użytkownik klika "Dodaj wizytę"
6. Wizyta zapisywana do orders.json z `estimatedDuration: 64`

### **Scenariusz 2: Intelligent Planner**

1. Użytkownik generuje plan tygodniowy
2. Planner analizuje zlecenia i optymalizuje trasę
3. Klika "Zapisz Plan"
4. System dla każdej wizyty:
   - Sprawdza `order.deviceDetails` (jeśli istnieje)
   - Pobiera pracownika z bazy
   - Używa `suggestVisitDuration(order, employee)`
   - Oblicza inteligentnie czas na podstawie:
     * Typu urządzenia z deviceDetails
     * Indywidualnych czasów pracownika
     * Dodatkowych czynności (jeśli są)
5. Tworzy wizyty z realistycznymi czasami

### **Scenariusz 3: Edycja czasów w panelu admin**

1. Administrator otwiera `/ustawienia-czasow`
2. Wybiera pracownika (np. "Marek Pralkowski")
3. Widzi jego specjalizacje i aktualne czasy
4. Zmienia czas dla "Pralka" z 22 na 20 minut
5. Klika "Zapisz czasy napraw"
6. System:
   - Waliduje (5-300 min)
   - Zapisuje do employees.json
   - Aktualizuje metadata (updatedAt, lastModifiedBy)
7. Od teraz wszystkie nowe wizyty z pralkami dla Marka będą używać 20 min

---

## 🧪 TESTOWANIE

### **Test 1: Automatyczne obliczanie w modalu**
```
1. Otwórz zlecenie-szczegoly
2. Kliknij "Dodaj wizytę"
3. Wybierz urządzenie: "Pralka"
4. Wybierz serwisanta: "Marek Pralkowski"
✅ Czas powinien pokazać: 22 min (Expert w pralki)

5. Zaznacz "Demontaż zabudowy"
✅ Czas powinien pokazać: 32 min (22 + 10)

6. Zaznacz "Montaż zabudowy"
✅ Czas powinien pokazać: 42 min (22 + 10 + 10)

7. Wpisz dodatkowy czas: 18
✅ Czas powinien pokazać: 60 min (22 + 10 + 10 + 18)
```

### **Test 2: Panel ustawień**
```
1. Otwórz /ustawienia-czasow
✅ Powinno załadować 8 pracowników

2. Wybierz "Piotr Chłodnictwo"
3. Sprawdź czas dla "Lodówka"
✅ Powinien pokazać: 29 min (Expert z 12 latami doświadczenia)

4. Zmień na 25 min
5. Kliknij "Zapisz czasy napraw"
✅ Powinna pokazać się notyfikacja sukcesu

6. Odśwież stronę
7. Sprawdź ponownie czas dla Piotra - Lodówka
✅ Powinien pokazać: 25 min (zapisane)
```

### **Test 3: Integracja z planner**
```
1. Otwórz Intelligent Planner
2. Wygeneruj plan tygodniowy
3. Kliknij "Zapisz Plan"
✅ Console powinien pokazać logi:
   "🧮 Obliczony czas naprawy: XX min dla zlecenia ORDAXXXXX"

4. Sprawdź orders.json
✅ Wizyty powinny mieć różne estimatedDuration (nie wszystkie 60)
✅ Czasy powinny być dopasowane do pracownika i urządzenia
```

---

## ⚠️ EDGE CASES

### **1. Brak deviceType w zleceniu**
- Fallback do 60 minut
- Można dodać przez edycję wizyty

### **2. Pracownik bez repairTimes**
- Używa czasów domyślnych z repair-time-settings.json
- Można dodać przez panel ustawień

### **3. Nieznany typ urządzenia**
- Używa "inne AGD" (30 min domyślnie)
- Można rozszerzyć listę typów w repair-time-settings.json

### **4. Czas < 5 min lub > 300 min**
- API zwraca błąd 400
- Walidacja po stronie frontendu

---

## 🚀 DEPLOYMENT

### **Kroki wdrożenia:**

1. **Inicjalizacja czasów pracowników:**
```bash
node scripts/add-repair-times-to-employees.js
```

2. **Weryfikacja plików:**
```bash
# Sprawdź czy pliki istnieją:
data/repair-time-settings.json
data/employees.json (z polem repairTimes)
```

3. **Test API:**
```bash
curl http://localhost:3000/api/repair-time-settings
```

4. **Test interfejsu:**
- Otwórz `/ustawienia-czasow`
- Sprawdź czy ładuje dane
- Przetestuj zapisywanie

5. **Test w produkcji:**
- Dodaj wizytę z pełnymi danymi
- Wygeneruj plan w planner
- Sprawdź czy czasy są realistyczne

---

## 📈 STATYSTYKI

### **Zaimplementowane:**
- ✅ 8 pracowników z indywidualnymi czasami
- ✅ 16 typów urządzeń AGD
- ✅ 3 typy dodatkowych czynności
- ✅ Automatyczne obliczanie w 3 miejscach:
  * Modal dodawania wizyty
  * Intelligent Planner (save-plan)
  * API suggestions
- ✅ Panel administracyjny
- ✅ 3 API endpoints
- ✅ 1 utility module (repairTimeCalculator)

### **Linie kodu:**
- **Nowe pliki:** ~1200 linii
- **Zmodyfikowane pliki:** ~300 linii zmian
- **Dokumentacja:** ~600 linii

---

## 🔮 PRZYSZŁE ROZSZERZENIA

### **Możliwe ulepszenia:**

1. **Historia zmian czasów:**
   - Śledzenie kto i kiedy zmienił czasy
   - Możliwość cofnięcia zmian

2. **Analiza rzeczywistych czasów:**
   - Porównanie szacowanych vs rzeczywistych czasów
   - Automatyczne sugerowanie korekt

3. **Uczenie maszynowe:**
   - Model ML do przewidywania czasów
   - Bazujący na historycznych danych

4. **Import/Export:**
   - Excel z czasami pracowników
   - Szablony dla nowych pracowników

5. **Uprawnienia:**
   - Różne poziomy dostępu do edycji
   - Audit log zmian

---

## 📞 WSPARCIE

W przypadku problemów sprawdź:
1. Console (F12) - błędy JavaScript
2. Network tab - odpowiedzi API
3. Logi serwera - błędy backendu
4. repair-time-settings.json - poprawność danych
5. employees.json - pole repairTimes dla każdego pracownika

**Najczęstsze problemy:**
- Brak czasu w modalu → Sprawdź czy pracownik ma repairTimes
- Błąd 500 w API → Sprawdź czy pliki JSON są poprawne
- Nie zapisuje czasów → Sprawdź uprawnienia zapisu do data/

---

**Dokument utworzył:** GitHub Copilot  
**Data:** 2 października 2025  
**Wersja systemu:** 1.0  
**Status:** ✅ PRODUKCJA
