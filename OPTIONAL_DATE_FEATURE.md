# ✅ DATA OPCJONALNA PRZY TWORZENIU WIZYTY - DOKUMENTACJA

**Data:** 15 października 2025  
**Status:** ✅ ZAKOŃCZONE

---

## 🎯 Problem

Użytkownik zapytał:
> "ale moze nie wymagamy daty, podczas tworzenia nowej wizyty, ? tylko jak moemy to ogaranć ?"

**Potrzeba:** Możliwość utworzenia wizyty bez określonej daty (np. gdy klient jeszcze nie potwierdził terminu).

---

## ✅ Rozwiązanie

### 1. Pole daty jest teraz **OPCJONALNE**

**Formularz:**
- ❌ USUNIĘTO: `required` attribute z pola `datetime-local`
- ✅ DODANO: Podpowiedź "(opcjonalne)" obok etykiety
- ✅ DODANO: Hint: "💡 Możesz pozostawić puste - wizyta będzie w statusie 'Do zaplanowania'"

---

### 2. Nowy status: **"unscheduled"** (Do zaplanowania)

**Logika API:**
```javascript
// PRZED:
status: 'scheduled',
scheduledDate: scheduledDate,  // required

// PO:
status: scheduledDate ? 'scheduled' : 'unscheduled',  // ✅ Dynamiczny status
scheduledDate: scheduledDate || null,  // ✅ null jeśli puste
```

**Tłumaczenia statusów:**
| Status | Polski | Kolor | Użycie |
|--------|--------|-------|--------|
| `unscheduled` | Do zaplanowania | Szary | Wizyta bez daty |
| `scheduled` | Zaplanowana | Niebieski | Wizyta z datą |
| `in_progress` | W trakcie | Zielony | Serwisant na miejscu |
| `completed` | Zakończona | Ciemnoszary | Wizyta zakończona |

---

### 3. Walidacja API

**Zmienione wymagania:**

```javascript
// PRZED:
if (!orderId || !visitType || !scheduledDate) {
  return res.status(400).json({ error: 'Brak wymaganych danych' });
}

// PO:
if (!orderId || !visitType) {  // ✅ scheduledDate OPCJONALNE
  return res.status(400).json({ error: 'Brak wymaganych danych' });
}
```

**Pola wymagane:**
- ✅ `orderId` - ID zlecenia (zawsze wymagane)
- ✅ `visitType` - Typ wizyty (zawsze wymagane)
- ❌ `scheduledDate` - **OPCJONALNE** (może być puste)
- ❌ `description` - Opcjonalne (może być puste)

---

## 📊 Przepływ pracy

### Scenariusz 1: Wizyta Z DATĄ

```
1. Serwisant wypełnia formularz:
   - Typ: Naprawa
   - Data: 16-10-2025 14:00 ✅
   - Opis: "Wymiana pompy"

2. System tworzy wizytę:
   {
     "visitId": "VIS251016001",
     "status": "scheduled",          // ✅ Zaplanowana
     "scheduledDate": "2025-10-16T14:00",
     "type": "repair"
   }

3. Wizyta widoczna:
   - W kalendarzu na 16.10.2025 14:00
   - Na liście wizyt z niebieskim znaczkiem
   - Status: "Zaplanowana"
```

---

### Scenariusz 2: Wizyta BEZ DATY

```
1. Serwisant wypełnia formularz:
   - Typ: Naprawa
   - Data: (PUSTE) ❌
   - Opis: "Do ustalenia z klientem"

2. System tworzy wizytę:
   {
     "visitId": "VIS251016002",
     "status": "unscheduled",        // ✅ Do zaplanowania
     "scheduledDate": null,
     "type": "repair"
   }

3. Wizyta widoczna:
   - ❌ NIE pojawia się w kalendarzu (brak daty)
   - ✅ Jest na liście "Wszystkie wizyty"
   - ✅ Status: "Do zaplanowania" (szary)
   - 💡 Można później edytować i dodać datę
```

---

## 🎨 Wygląd UI

### Formularz dodawania wizyty:

```
┌─────────────────────────────────────────┐
│ 📅 Dodaj kolejną wizytę do zlecenia    │
├─────────────────────────────────────────┤
│                                          │
│ Typ wizyty *                             │
│ ┌────────────────────────────────────┐  │
│ │ 🔧 Naprawa                      ▼  │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Planowana data i godzina (opcjonalne)   │
│ ┌────────────────────────────────────┐  │
│ │                                     │  │ ← PUSTE pole
│ └────────────────────────────────────┘  │
│ 💡 Możesz pozostawić puste - wizyta     │
│    będzie w statusie "Do zaplanowania"  │
│                                          │
│ Opis problemu / cel wizyty              │
│ ┌────────────────────────────────────┐  │
│ │ Do ustalenia z klientem            │  │
│ └────────────────────────────────────┘  │
│                                          │
│         [Anuluj]  [Dodaj wizytę]        │
└─────────────────────────────────────────┘
```

### Wizyta na liście (status "Do zaplanowania"):

```
┌──────────────────────────────────────────────────┐
│ VIS251016002  [Do zaplanowania]  🔧 Naprawa     │
│                ^^^ szary badge                    │
│ 📍 Brak ustalonej daty                           │
│ 👤 Mariusz Bielaszka                             │
│ 📝 Do ustalenia z klientem                       │
└──────────────────────────────────────────────────┘
```

---

## 🔧 Pliki zmodyfikowane

| Plik | Linie | Zmiany |
|------|-------|--------|
| `pages/technician/visit/[visitId].js` | 1743-1751 | ✅ Usunięto `required`, dodano hint |
| `pages/technician/visit/[visitId].js` | 199, 212 | ✅ Dodano status "unscheduled" |
| `pages/api/technician/add-visit-to-order.js` | 80-87 | ✅ scheduledDate opcjonalne |
| `pages/api/technician/add-visit-to-order.js` | 118-119 | ✅ Dynamiczny status i null dla daty |

---

## 🧪 Testy

### Test 1: Wizyta BEZ daty

1. Otwórz wizytę: `http://localhost:3000/technician/visit/VIS251014001`
2. Kliknij "Dodaj wizytę"
3. Wypełnij:
   - Typ: **Naprawa**
   - Data: **(POZOSTAW PUSTE)**
   - Opis: **"Do ustalenia z klientem"**
4. Kliknij "Dodaj wizytę"

**Oczekiwany rezultat:**
```json
{
  "visitId": "VIS251016XXX",
  "orderId": "ORDW252850003",
  "status": "unscheduled",  // ✅
  "scheduledDate": null,     // ✅
  "type": "repair",
  "description": "Do ustalenia z klientem"
}
```

**Sprawdź:**
- ✅ Wizyta utworzona pomyślnie
- ✅ Status: "Do zaplanowania" (szary)
- ✅ `scheduledDate: null` w JSON
- ✅ Wizyta NIE pojawia się w kalendarzu
- ✅ Wizyta widoczna na liście "Wszystkie wizyty"

---

### Test 2: Wizyta Z DATĄ

1. Otwórz wizytę: `http://localhost:3000/technician/visit/VIS251014001`
2. Kliknij "Dodaj wizytę"
3. Wypełnij:
   - Typ: **Kontrola**
   - Data: **16-10-2025 10:00**
   - Opis: **"Kontrola po naprawie"**
4. Kliknij "Dodaj wizytę"

**Oczekiwany rezultat:**
```json
{
  "visitId": "VIS251016YYY",
  "orderId": "ORDW252850003",
  "status": "scheduled",              // ✅
  "scheduledDate": "2025-10-16T10:00", // ✅
  "type": "control",
  "description": "Kontrola po naprawie"
}
```

**Sprawdź:**
- ✅ Wizyta utworzona pomyślnie
- ✅ Status: "Zaplanowana" (niebieski)
- ✅ Data: 16.10.2025 10:00
- ✅ Wizyta widoczna w kalendarzu na 16.10
- ✅ Wizyta widoczna na liście wizyt

---

## 💡 Dodatkowe funkcje (przyszłość)

### 1. Edycja wizyty - dodanie daty później

```javascript
// TODO: API endpoint do aktualizacji daty
PUT /api/visits/{visitId}
{
  "scheduledDate": "2025-10-17T14:00",
  "status": "scheduled"  // Zmiana z "unscheduled" na "scheduled"
}
```

### 2. Filtrowanie wizyt

```javascript
// Lista wizyt - dodać filtr
- [ ] Wszystkie
- [ ] Zaplanowane (scheduled)
- [x] Do zaplanowania (unscheduled)  // ← NOWY
- [ ] W trakcie (in_progress)
- [ ] Zakończone (completed)
```

### 3. Powiadomienia

```javascript
// Alert dla wizyt bez daty
if (visit.status === 'unscheduled' && daysSinceCreation > 2) {
  alert('⚠️ Wizyta VIS251016002 nadal bez ustalonej daty!');
}
```

---

## ⚠️ Uwagi

1. **Kalendarze:** Wizyty bez daty (`unscheduled`) NIE pojawią się w widoku kalendarza
2. **Raporty:** W raportach trzeba uwzględnić wizyty bez daty jako osobną kategorię
3. **Przypomnienia:** System nie wyśle przypomnień dla wizyt bez daty
4. **Statystyki:** Wizyty `unscheduled` liczą się do "zaległości do zaplanowania"

---

## 📋 Podsumowanie

### Co działa:
- ✅ Można utworzyć wizytę bez daty
- ✅ Status automatycznie ustawiany na "unscheduled"
- ✅ Wizualne oznaczenie (szary badge)
- ✅ Walidacja API zaktualizowana
- ✅ Backwards compatible (stare wizyty nadal działają)

### Co należy rozważyć:
- 🔄 Edycja wizyty (dodanie daty później)
- 🔄 Filtrowanie po statusie "unscheduled"
- 🔄 Dashboard - sekcja "Do zaplanowania"
- 🔄 Notyfikacje dla przeterminowanych wizyt bez daty

---

**Status:** ✅ **GOTOWE DO UŻYCIA**  
**Wersja:** 1.1.0  
**Data:** 15.10.2025
