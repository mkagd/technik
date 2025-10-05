# 📋 Dokumentacja Statusów Zamówień

## 🔄 Przepływ Statusów (Order Status Flow)

```
┌─────────────┐
│   pending   │  ← Nowa rezerwacja (formularz online)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  scheduled  │  ← Admin przydzielił serwisanta + termin
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ in_progress │  ← Serwisant rozpoczął naprawę
└──────┬──────┘
       │
       ├──→ ┌─────────────┐
       │    │  completed  │  ← Naprawa zakończona sukcesem
       │    └─────────────┘
       │
       └──→ ┌─────────────┐
            │  cancelled  │  ← Anulowane przez klienta/admin
            └─────────────┘
```

---

## 📊 Szczegółowy Opis Statusów

### 1️⃣ **`pending`** - Oczekujące
**Kiedy:** Zaraz po wypełnieniu formularza rezerwacji przez klienta

**Charakterystyka:**
- ✅ Zgłoszenie zostało utworzone
- ⏳ Oczekuje na przydzielenie serwisanta
- ⏳ Nie ustalono dokładnego terminu wizyty
- 📧 Klient otrzymał potwierdzenie e-mail (jeśli podał)
- 👁️ Widoczne w panelu admin w sekcji "Oczekujące"

**Co należy zrobić:**
1. Przejrzeć szczegóły zgłoszenia
2. Przydzielić odpowiedniego serwisanta
3. Ustalić dokładny termin wizyty
4. Zmienić status na `scheduled`

**Dostępność API:**
- Liczony jako aktywne zlecenie w `/api/availability`
- Wpływa na obłożenie przedziałów czasowych

---

### 2️⃣ **`scheduled`** - Zaplanowane
**Kiedy:** Admin przydzielił serwisanta i ustalił dokładny termin

**Charakterystyka:**
- ✅ Przydzielony serwisant
- ✅ Ustalona dokładna data i godzina
- 📅 Widoczne w kalendarzu serwisanta
- 📧 Klient otrzymał potwierdzenie terminu (opcjonalnie)
- 👁️ Widoczne w panelu jako "Zaplanowane"

**Co należy zrobić:**
1. Serwisant przygotowuje się do wizyty
2. Przed wizytą można jeszcze zmienić termin
3. W dniu wizyty zmienić status na `in_progress`

**Dostępność API:**
- Liczony jako aktywne zlecenie w `/api/availability`
- Blokuje konkretny przedział czasowy dla serwisanta

---

### 3️⃣ **`in_progress`** - W trakcie
**Kiedy:** Serwisant rozpoczął naprawę

**Charakterystyka:**
- 🔧 Serwisant aktywnie pracuje nad urządzeniem
- 📍 Serwisant jest na miejscu u klienta
- ⏱️ Trwa realizacja zlecenia
- 🚫 Nie można anulować bez konsekwencji
- 👁️ Widoczne jako "W realizacji"

**Co należy zrobić:**
1. Serwisant diagnozuje i naprawia
2. Aktualizuje notatki i zużyte części
3. Po zakończeniu zmienia status na `completed`

**Dostępność API:**
- Liczony jako aktywne zlecenie
- Blokuje serwisanta w danym przedziale

---

### 4️⃣ **`completed`** - Ukończone
**Kiedy:** Naprawa została zakończona

**Charakterystyka:**
- ✅ Urządzenie naprawione
- ✅ Klient odebrał urządzenie / naprawa na miejscu zakończona
- 💰 Rozliczenie finansowe (opcjonalnie)
- 📧 Klient może otrzymać potwierdzenie zakończenia
- 👁️ Widoczne w historii/archiwum

**Co należy zrobić:**
1. Archiwizacja zlecenia
2. Generowanie raportu (opcjonalnie)
3. Prośba o opinię klienta (opcjonalnie)

**Dostępność API:**
- ❌ NIE liczony jako aktywne zlecenie
- Nie wpływa na obłożenie

---

### 5️⃣ **`cancelled`** - Anulowane
**Kiedy:** Zlecenie zostało anulowane

**Charakterystyka:**
- ❌ Naprawa nie zostanie wykonana
- 📝 Powód anulowania zapisany w notatkach
- 👁️ Widoczne w historii/archiwum

**Powody anulowania:**
- Klient zrezygnował
- Nie można skontaktować się z klientem
- Urządzenie naprawione gdzie indziej
- Koszt naprawy zbyt wysoki

**Dostępność API:**
- ❌ NIE liczony jako aktywne zlecenie
- Nie wpływa na obłożenie

---

## 🔍 Wykorzystanie w API Availability

### Endpoint: `/api/availability`

**Aktywne zlecenia** (liczą się do obłożenia):
```javascript
['pending', 'in_progress', 'scheduled']
```

**Nieaktywne zlecenia** (nie liczą się):
```javascript
['completed', 'cancelled']
```

### Algorytm obliczeń:

1. **Pobierz wszystkie aktywne zlecenia** (`pending`, `scheduled`, `in_progress`)
2. **Zlicz popyt na każdy przedział czasowy** (np. "8:00-12:00", "Po 15:00")
3. **Oblicz dostępność serwisantów** (z `employees.json`)
4. **Wygeneruj czasy oczekiwania:**
   - "Cały dzień" = najniższe obłożenie (20%)
   - "Po 15:00" = najwyższe obłożenie (95%)

---

## 📝 Notatki dla Developerów

### Gdzie zmieniać status:

1. **Nowa rezerwacja:** 
   - `utils/clientOrderStorage.js` (linia 388)
   - Domyślnie: `'pending'`

2. **Panel Admin:**
   - Formularz edycji zamówienia
   - Dropdown ze wszystkimi statusami

3. **API Endpoints:**
   - `POST /api/rezerwacje` - tworzy z `'pending'`
   - `PUT /api/rezerwacje` - aktualizuje status

### Walidacja statusów:

```javascript
const VALID_STATUSES = [
  'pending',
  'scheduled', 
  'in_progress',
  'completed',
  'cancelled'
];
```

### Kolory statusów w UI:

```javascript
const statusColors = {
  'pending': 'yellow',      // Żółty - oczekujące
  'scheduled': 'blue',       // Niebieski - zaplanowane
  'in_progress': 'purple',   // Fioletowy - w trakcie
  'completed': 'green',      // Zielony - ukończone
  'cancelled': 'red'         // Czerwony - anulowane
};
```

---

## 🚀 Przyszłe Rozszerzenia

### Możliwe dodatkowe statusy:

- `awaiting_parts` - Oczekiwanie na części
- `on_hold` - Wstrzymane
- `requires_consultation` - Wymaga konsultacji
- `ready_for_pickup` - Gotowe do odbioru

### Możliwe triggery automatyczne:

- Automatyczne przypomnienia przed wizytą (`scheduled` → email za 24h)
- Auto-anulowanie po braku kontaktu (`pending` → `cancelled` po 7 dniach)
- SMS-y o zmianie statusu

---

**Ostatnia aktualizacja:** 5 października 2025
**Wersja:** 1.0.0
