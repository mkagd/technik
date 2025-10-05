# 🏠 System Dostępności Fizycznej Klientów - Dokumentacja Integracji

## 📋 Spis Treści
1. [Przegląd systemu](#przegląd-systemu)
2. [Miejsca integracji](#miejsca-integracji)
3. [Struktura danych](#struktura-danych)
4. [API i funkcje](#api-i-funkcje)
5. [Komponenty UI](#komponenty-ui)
6. [Przykłady użycia](#przykłady-użycia)

---

## 🎯 Przegląd systemu

System dostępności fizycznej klientów pozwala na:
- **Określenie godzin dostępności** klienta w domu (okna czasowe dla każdego dnia tygodnia)
- **Automatyczne obliczanie score** 0-100 na podstawie szerokości okien, historii wizyt i elastyczności
- **Kategoryzację klientów** (Cały dzień, Po pracy, Tylko wieczory, Tylko weekendy, Trudno dostępny)
- **Ostrzeganie techników** przed planowaniem wizyt w złych godzinach
- **Sugerowanie najlepszych terminów** na podstawie dostępności klienta
- **Śledzenie historii** (czy klient był w domu podczas wizyty)

---

## 📍 Miejsca integracji

### 1. **Panel Admina - Lista klientów** (`/admin/klienci`)
✅ **Implementacja:** Badge z score i emoji kategorii
- Wyświetlany obok badge'a źródła klienta
- Tooltip pokazuje pełną nazwę kategorii
- Sortowanie: dostępność wysoka→niska / niska→wysoka

```javascript
// pages/admin/klienci/index.js
{klient.physicalAvailability && klient.physicalAvailability.score !== undefined && (() => {
  const category = getAvailabilityCategory(klient.physicalAvailability.score);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${category.badgeClass}`}>
      <span>{category.emoji}</span>
      <span>{klient.physicalAvailability.score}</span>
    </span>
  );
})()}
```

### 2. **Panel Admina - Edycja klienta** (`/admin/klienci/[id]`)
✅ **Implementacja:** Pełna sekcja z komponentem AvailabilityScheduler
- Wizualny kalendarz tygodniowy (8:00-20:00)
- Zarządzanie oknami czasowymi
- Live preview score
- 4 presety (Cały dzień, Po pracy, Wieczory, Weekendy)
- Dodatkowe opcje (elastyczny harmonogram, wymaga powiadomienia)

### 3. **Panel Admina - Nowa rezerwacja** (`/admin/rezerwacje/nowa`) ✅ **NOWE!**
✅ **Implementacja:** Opcjonalna sekcja "Dostępność fizyczna klienta"
- Przycisk toggle: "+ Dodaj szczegółową dostępność" / "✓ Zaawansowane"
- Info box z korzyściami
- Pełny komponent AvailabilityScheduler po rozwinięciu
- Automatyczne przekazywanie do klienta przy tworzeniu

**Jak działa:**
1. Admin wypełnia dane klienta (imię, telefon, adres)
2. Opcjonalnie klika "+ Dodaj szczegółową dostępność"
3. Konfiguruje okna czasowe dostępności
4. System automatycznie zapisuje `physicalAvailability` do nowo utworzonego klienta
5. Score jest od razu dostępny w systemie

### 4. **Panel Klienta - Ustawienia** (`/client/settings`)
✅ **Implementacja:** Zakładka "Dostępność"
- 4 zakładki: Podstawowe dane, Telefony, Adresy, **Dostępność**
- Pełny komponent AvailabilityScheduler
- Klient może samodzielnie ustawić swoje godziny

### 5. **Panel Klienta - Nowe zamówienie** (`/client/new-order.js`)
✅ **Implementacja:** Info w kroku 3 (Termin)
- Jeśli klient NIE ma dostępności: przycisk "➕ Dodaj moje godziny dostępności"
- Jeśli klient MA dostępność: badge z score i emoji + link do edycji

### 6. **Planowanie wizyt** (`/admin/zamowienia/[id].js`)
✅ **Implementacja:** Ostrzeżenie w modalu dodawania wizyty
- Info box pokazuje wybraną datę i godzinę
- Informacja o automatycznym sprawdzeniu dostępności

---

## 📊 Struktura danych

### Client Object (clients.json)
```javascript
{
  "id": "CLI25001001",
  "name": "Jan Kowalski",
  "phone": "123456789",
  "email": "jan@example.com",
  "address": "ul. Testowa 1, 00-000 Warszawa",
  // ... inne pola ...
  
  "physicalAvailability": {
    // Okna dostępności
    "timeWindows": [
      {
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "timeFrom": "16:00",
        "timeTo": "20:00",
        "label": "Po pracy"
      },
      {
        "days": ["saturday", "sunday"],
        "timeFrom": "08:00",
        "timeTo": "20:00",
        "label": "Weekend"
      }
    ],
    
    // Preferencje
    "preferences": {
      "flexibleSchedule": false,
      "requiresAdvanceNotice": true,
      "advanceNoticeHours": 24
    },
    
    // Historia wizyt (wypełniane automatycznie)
    "presenceHistory": [
      {
        "visitId": "VIS25001001",
        "scheduledDate": "2025-10-15T16:30:00Z",
        "wasPresent": true,
        "notes": "Klient był w domu, wizyta przebiegła pomyślnie"
      }
    ],
    
    // Statystyki (obliczane automatycznie)
    "stats": {
      "totalVisits": 5,
      "successfulVisits": 4,
      "missedVisits": 1,
      "successRate": 0.8
    },
    
    // Score i kategoria (obliczane automatycznie)
    "score": 75,
    "category": "after-work",
    
    // Notatki
    "notes": [
      "Pracuje 8-16, dzwonić przed przyjazdem",
      "Preferuje wizyty po 17:00"
    ],
    
    // Metadane
    "lastUpdated": "2025-10-04T12:00:00Z"
  }
}
```

### Category Object
```javascript
{
  category: 'after-work',        // Identyfikator
  label: 'Po pracy',             // Polska nazwa
  color: 'blue',                 // Kolor główny
  emoji: '🕐',                   // Emoji
  badgeClass: 'bg-blue-100 text-blue-800',  // Klasy Tailwind
  description: 'Klient dostępny głównie po godzinach pracy'
}
```

---

## 🔧 API i funkcje

### Core Functions (utils/availabilityScore.js)

#### 1. `calculateAvailabilityScore(physicalAvailability)`
Oblicza score 0-100 na podstawie:
- **60 pkt** - szerokość okien czasowych (max 84h/tydzień)
- **30 pkt** - historia wizyt (success rate)
- **10 pkt** - elastyczność harmonogramu
- **+10 pkt** - bonus za dostępność w dni robocze
- **+5 pkt** - bonus za długie okna (≥6h)

```javascript
const score = calculateAvailabilityScore({
  timeWindows: [...],
  preferences: {...},
  presenceHistory: [...]
});
// Zwraca: 75
```

#### 2. `getAvailabilityCategory(score)`
Zwraca kategorię na podstawie score:
- 90-100: 'full-day' 🏠 Cały dzień
- 70-89: 'after-work' 🕐 Po pracy
- 50-69: 'evening-only' 🌙 Tylko wieczory
- 30-49: 'weekends-only' 📅 Tylko weekendy
- 0-29: 'very-limited' ⚠️ Trudno dostępny

```javascript
const category = getAvailabilityCategory(75);
// Zwraca: { category: 'after-work', label: 'Po pracy', emoji: '🕐', ... }
```

#### 3. `checkAvailability(physicalAvailability, dateTime)`
Sprawdza czy klient jest dostępny w konkretnym momencie.

```javascript
const check = checkAvailability(availability, new Date('2025-10-15T18:00:00'));
// Zwraca:
{
  available: true,
  reason: "Klient dostępny w oknie: Po pracy (16:00-20:00)",
  confidence: "high",
  suggestion: null
}
```

#### 4. `getBestTimeSlots(physicalAvailability, daysAhead = 7)`
Zwraca 5 najlepszych terminów na wizyty w ciągu X dni.

```javascript
const bestSlots = getBestTimeSlots(availability, 7);
// Zwraca:
[
  {
    date: "2025-10-15",
    time: "17:00",
    day: "Wtorek",
    score: 95,
    window: "Po pracy",
    reason: "Środek okna dostępności, dzień roboczy"
  },
  // ... więcej slotów
]
```

#### 5. `updatePresenceHistory(physicalAvailability, visitData)`
Aktualizuje historię wizyt po zakończeniu wizyty.

```javascript
const updated = updatePresenceHistory(availability, {
  visitId: "VIS25001001",
  scheduledDate: "2025-10-15T17:00:00Z",
  wasPresent: true,
  actualArrivalTime: "17:05",
  notes: "Klient był w domu"
});
// Zwraca zaktualizowany obiekt z nowym score
```

#### 6. `createDefaultAvailability(type)`
Tworzy szablon dostępności.

```javascript
const template = createDefaultAvailability('after-work');
// Zwraca gotowy obiekt physicalAvailability
```

---

## 🎨 Komponenty UI

### AvailabilityScheduler.js

**Props:**
- `value` - obiekt physicalAvailability
- `onChange(availability)` - callback przy zmianie
- `compact` - tryb kompaktowy (tylko score i przycisk)

**Funkcje:**
- Wizualny kalendarz tygodniowy
- Zarządzanie oknami czasowymi (dodaj/usuń/edytuj)
- Checkboxy dla dni tygodnia
- Time pickery (od-do)
- Etykiety dla okien
- Live preview score (duży, text-3xl)
- 4 presety (Cały dzień, Po pracy, Wieczory, Weekendy)
- Opcje preferencji (elastyczny harmonogram, wymaga powiadomienia)
- Pole notatek

**Użycie:**
```jsx
<AvailabilityScheduler
  value={klient.physicalAvailability}
  onChange={(availability) => {
    updateField('physicalAvailability', availability);
  }}
/>
```

---

## 💡 Przykłady użycia

### 1. Tworzenie nowego klienta z dostępnością (Admin)
```
1. Admin wchodzi: /admin/rezerwacje/nowa
2. Wypełnia dane klienta
3. Klika "+ Dodaj szczegółową dostępność"
4. Wybiera preset "Po pracy" LUB konfiguruje własne okna
5. Klika "Utwórz rezerwację"
6. System:
   - Tworzy klienta z physicalAvailability
   - Oblicza score (np. 75)
   - Przypisuje kategorię (np. "Po pracy" 🕐)
   - Klient pojawia się na liście z badge'em
```

### 2. Klient ustawia swoją dostępność
```
1. Klient loguje się: /client/login
2. Wchodzi w Ustawienia: /client/settings
3. Przełącza na zakładkę "Dostępność"
4. Dodaje okna czasowe:
   - Pon-Pt: 16:00-20:00 (Po pracy)
   - Sob-Nd: 10:00-18:00 (Weekend)
5. Ustawia preferencje: "Wymaga powiadomienia 24h"
6. Klika "Zapisz zmiany"
7. System oblicza score: 75/100
8. Kategoria: "Po pracy" 🕐
```

### 3. Technik planuje wizytę
```
1. Technik otwiera zamówienie: /admin/zamowienia/[id]
2. Klika "Dodaj wizytę"
3. Wybiera datę: 15.10.2025, godzinę: 14:00
4. System pokazuje ostrzeżenie:
   ⚠️ "Klient dostępny głównie po 16:00"
   💡 "Sugerowane godziny: 17:00, 18:00, 19:00"
5. Technik zmienia na 17:00
6. ✓ "Klient dostępny w tym czasie"
7. Wizyta zostaje zaplanowana
```

### 4. Po wizycie - aktualizacja historii
```javascript
// Po zakończeniu wizyty
const updatedAvailability = updatePresenceHistory(
  klient.physicalAvailability,
  {
    visitId: "VIS25001001",
    scheduledDate: "2025-10-15T17:00:00Z",
    wasPresent: true,  // lub false jeśli nie było
    notes: "Klient był w domu"
  }
);

// Zapisz zaktualizowane dane
await updateClient({
  ...klient,
  physicalAvailability: updatedAvailability
});

// Score automatycznie się zaktualizuje na podstawie success rate
```

---

## 🎯 Korzyści biznesowe

1. **⏰ Oszczędność czasu**
   - Technik nie przyjeżdża na próżno
   - Mniej czasu na koordynację wizyt

2. **💰 Redukcja kosztów**
   - Mniej pustych przejazdów
   - Lepsze wykorzystanie czasu pracy

3. **😊 Zadowolenie klientów**
   - Wizyty w wygodnym czasie
   - Mniej przełożonych terminów

4. **📈 Lepsza efektywność**
   - Optymalne planowanie tras
   - AI sugestie najlepszych terminów

5. **🤖 Automatyzacja**
   - System sam podpowiada terminy
   - Automatyczne ostrzeżenia
   - Samouczący się algorytm (historia wizyt)

---

## 🚀 Roadmap

### ✅ Zaimplementowane (7/8)
1. ✅ Algorytm scoring
2. ✅ Komponent AvailabilityScheduler
3. ✅ Integracja z formularzem admina (edycja klienta)
4. ✅ Integracja z formularzem klienta (ustawienia + nowe zamówienie)
5. ✅ Badge'y w listach klientów (z sortowaniem)
6. ✅ Integracja z planowaniem wizyt (ostrzeżenia)
7. ✅ **NOWE:** Integracja z formularzem nowej rezerwacji

### 🔮 Do rozważenia w przyszłości
8. ⏳ Dashboard analityczny (statystyki dostępności)
9. 💡 Push notifications przed wizytą
10. 💡 SMS reminder 1h przed wizytą
11. 💡 Automatyczne dopasowanie technika do dostępności klienta
12. 💡 Machine learning - przewidywanie dostępności na podstawie historii

---

## 📚 Dodatkowe zasoby

- `utils/availabilityScore.js` - Core logic
- `components/AvailabilityScheduler.js` - React component (495 linii)
- `pages/admin/klienci/index.js` - Lista z badge'ami
- `pages/admin/klienci/[id].js` - Edycja klienta
- `pages/admin/rezerwacje/nowa.js` - **NOWA:** Nowa rezerwacja z dostępnością
- `pages/client/settings.js` - Ustawienia klienta
- `pages/client/new-order.js` - Nowe zamówienie klienta
- `utils/clientOrderStorage.js` - Konwersja rezerwacja→klient+zamówienie

---

## 🎓 Najlepsze praktyki

1. **Zawsze ustawiaj dostępność dla nowych klientów** - oszczędza czas później
2. **Aktualizuj historię po każdej wizycie** - algorytm się uczy
3. **Sprawdzaj score przed planowaniem** - unikniesz problemów
4. **Użyj presetów** - szybsze niż ręczna konfiguracja
5. **Dodaj notatki** - kontekst jest ważny
6. **Regularnie przeglądaj klientów z niskim score** - może trzeba zmienić strategię

---

**Data stworzenia:** 2025-10-04  
**Wersja:** 1.1 (dodano integrację z formularzem nowej rezerwacji)  
**Autor:** System AI + Developer
