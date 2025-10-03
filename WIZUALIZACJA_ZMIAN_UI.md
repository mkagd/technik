# 📸 WIZUALIZACJA ZMIAN W UI

## Modal dodawania wizyty - PRZED vs PO

---

## ❌ PRZED (stary modal)

```
┌─────────────────────────────────────┐
│ 📅 Umów wizytę                      │
├─────────────────────────────────────┤
│                                     │
│ Data         Godzina                │
│ [________]   [_____]                │
│                                     │
│ Typ wizyty                          │
│ [🔍 Diagnoza]  [🔧 Naprawa]         │
│                                     │
│ Serwisant                           │
│ [Wybierz serwisanta ▼]             │
│ - jan_kowalski                      │
│ - anna_nowak                        │
│ - piotr_wisniewski                  │
│ - maria_wojcik                      │
│                                     │
│ Notatka (opcjonalnie)               │
│ [____________________________]      │
│                                     │
│ [Anuluj]         [Umów]            │
└─────────────────────────────────────┘
```

### Problemy:
- ⚠️ Tylko 2 typy wizyt
- ⚠️ Sztywno zapisani pracownicy (4 osoby)
- ⚠️ Brak pola szacowanego czasu
- ⚠️ Mały modal (max-w-sm)
- ⚠️ Brak X do zamknięcia
- ⚠️ Proste przyciski bez ikon

---

## ✅ PO (nowy modal)

```
┌──────────────────────────────────────────────┐
│ 📅 Nowa wizyta                          [X]  │
├──────────────────────────────────────────────┤
│                                              │
│ Data                    Godzina              │
│ [___________]           [________]           │
│                                              │
│ Typ wizyty                                   │
│ ┌───────────┬───────────┐                   │
│ │ 🔍        │ 🔧        │                   │
│ │ Diagnoza  │ Naprawa   │ [aktywny: niebieski]
│ └───────────┴───────────┘                   │
│ ┌───────────┬───────────┐                   │
│ │ ✅        │ 📦        │                   │
│ │ Kontrola  │ Montaż    │                   │
│ └───────────┴───────────┘                   │
│                                              │
│ Serwisant                                    │
│ [Wybierz serwisanta ▼]                      │
│ - 👨‍🔧 Jan Kowalski                          │
│ - 👨‍🔧 Anna Nowak                            │
│ - 👨‍🔧 Jan Serwisant                         │
│ - 👨‍🔧 Anna Technik                          │
│ - 👨‍🔧 Piotr Chłodnictwo                     │
│ - 👨‍🔧 Tomasz Elektryk                        │
│ - 👨‍🔧 Marek Pralkowski                       │
│ - 👨‍🔧 Karolina Kucharska                     │
│ Ładowanie pracowników... (jeśli puste)      │
│                                              │
│ Szacowany czas trwania                       │
│ [Wybierz ▼]                                 │
│ - 30 minut                                   │
│ - 1 godzina                                  │
│ - 1.5 godziny                                │
│ - 2 godziny                                  │
│ - 3 godziny                                  │
│ - 4 godziny                                  │
│                                              │
│ Notatka (opcjonalnie)                        │
│ [_____________________________________]      │
│ [_____________________________________]      │
│                                              │
├──────────────────────────────────────────────┤
│ [✕ Anuluj]         [✓ Dodaj wizytę]        │
└──────────────────────────────────────────────┘
```

### Ulepszenia:
- ✅ 4 typy wizyt w grid 2x2
- ✅ 8 prawdziwych pracowników z API
- ✅ Pole szacowanego czasu (6 opcji)
- ✅ Większy modal (max-w-md)
- ✅ Przycisk X w nagłówku
- ✅ Przyciski z ikonami
- ✅ Cienie i lepsze kolory
- ✅ Obramowanie między sekcjami

---

## Lista wizyt - PRZED vs PO

### ❌ PRZED

```
┌────────────────────────────────────────┐
│ 2 października 2025 o 10:00           │
│ 🔍 Diagnoza • 60 min                  │
│ 👨‍🔧 jan_kowalski                      │ ← ID zamiast imienia
│                                        │
│ [▶] [✓] [✕] [✏️] [🗑️]                 │
└────────────────────────────────────────┘
```

### ✅ PO

```
┌────────────────────────────────────────┐
│ 2 października 2025 o 10:00           │
│ 🔍 Diagnoza • 60 min                  │ ← Wszystkie typy wizyt
│ 👨‍🔧 Jan Kowalski                      │ ← Prawdziwe imię
│                                        │
│ [Zaplanowana] [▶] [✓] [✕] [✏️] [🗑️]   │
└────────────────────────────────────────┘

Typy wizyt:
🔍 Diagnoza    - niebieski badge
🔧 Naprawa     - zielony badge  
✅ Kontrola    - fioletowy badge
📦 Montaż      - pomarańczowy badge
```

---

## Intelligent Planner - PRZED vs PO

### ❌ PRZED (dropdown pracowników)

```
┌─────────────────────────┐
│ Wybierz serwisanta ▼   │
├─────────────────────────┤
│ Jan Kowalski            │ ← Sztywno w kodzie
│ Anna Nowak              │ ← Sztywno w kodzie
│ Piotr Wiśniewski        │ ← Sztywno w kodzie
└─────────────────────────┘
```

### ✅ PO (dropdown pracowników)

```
┌─────────────────────────────┐
│ Wybierz serwisanta ▼       │
├─────────────────────────────┤
│ Jan Kowalski                │ ← Z API
│ Anna Nowak                  │ ← Z API
│ Jan Serwisant               │ ← Z API
│ Anna Technik                │ ← Z API
│ Piotr Chłodnictwo           │ ← Z API
│ Tomasz Elektryk             │ ← Z API
│ Marek Pralkowski            │ ← Z API
│ Karolina Kucharska          │ ← Z API
└─────────────────────────────┘

Dynamicznie z /api/employees
Filtrowane: isActive === true
```

---

## Przycisk "Zapisz Plan" - Akcja

### PRZED
```
[💾 Zapisz Plan] → ❓ Niepewność czy działa
```

### PO
```
[💾 Zapisz Plan] 
    ↓
Loading...
    ↓
✅ Plan zapisany! Utworzono 15 wizyt dla 12 zleceń
    ↓
Automatyczne odświeżenie danych
    ↓
orders.json zaktualizowany:
  - wizyty z technicianId
  - wizyty z technicianName
  - status: "scheduled"
```

---

## Struktura danych - PRZED vs PO

### ❌ PRZED (w orders.json)

```json
{
  "visit": {
    "id": 1696234567890,           ← Timestamp jako ID
    "assignedTo": "jan_kowalski"   ← String ID
  }
}
```

### ✅ PO (w orders.json)

```json
{
  "visit": {
    "visitId": "VIS252700001",     ← Format VIS + data + sekwencja
    "assignedTo": "EMP25189001",   ← ID pracownika z API
    "type": "diagnosis",           ← 4 typy: diagnosis/repair/control/installation
    "estimatedDuration": 60,       ← Szacowany czas w minutach
    "technicianId": "EMP25189001", ← Duplikat dla kompatybilności
    "technicianName": "Jan Kowalski"
  }
}
```

---

## Kolory typów wizyt

```
┌─────────────────────────────────────┐
│ 🔍 Diagnoza       │ #3B82F6 (niebieski)  │
│ 🔧 Naprawa        │ #10B981 (zielony)    │
│ ✅ Kontrola       │ #8B5CF6 (fioletowy)  │
│ 📦 Montaż         │ #F59E0B (pomarańczowy)│
└─────────────────────────────────────┘
```

---

## Flow dodawania wizyty - PO

```
1. Klik "➕ Dodaj wizytę"
        ↓
2. Modal się otwiera
   - Załaduj pracowników z API
   - Ustaw domyślne wartości
        ↓
3. Użytkownik wypełnia:
   - Data: jutro
   - Godzina: 10:00
   - Typ: 🔍 Diagnoza (klik na przycisk)
   - Serwisant: Jan Kowalski (wybór z dropdown)
   - Czas: 1 godzina (wybór z dropdown)
   - Notatka: "Test" (opcjonalnie)
        ↓
4. Klik "✓ Dodaj wizytę"
        ↓
5. Walidacja danych
        ↓
6. Fetch GET /api/orders (pobierz aktualne dane)
        ↓
7. Fetch PATCH /api/orders (zapisz nową wizytę)
   Body: {
     id: orderInternalId,
     visits: [...oldVisits, newVisit],
     updatedAt: timestamp
   }
        ↓
8. Sukces!
   - Notyfikacja: "Wizyta została dodana i zapisana"
   - Modal się zamyka
   - Lista wizyt się aktualizuje
   - Wizyta widoczna z:
     * Datą i godziną
     * Typem (ikona + nazwa)
     * Serwisantem (imię z API)
     * Czasem trwania
     * Statusem "Zaplanowana"
```

---

## Responsywność modala

### Mobile (< 640px)
```
┌─────────────────────┐
│ 📅 Nowa wizyta  [X] │
├─────────────────────┤
│ Data                │
│ [_______________]   │
│                     │
│ Godzina             │
│ [_______________]   │
│                     │
│ Typ wizyty          │
│ [🔍 Diagnoza]       │
│ [🔧 Naprawa]        │
│ [✅ Kontrola]       │
│ [📦 Montaż]         │
│                     │
│ ... reszta pól      │
└─────────────────────┘
```

### Desktop (> 640px)
```
┌─────────────────────────────────┐
│ 📅 Nowa wizyta             [X] │
├─────────────────────────────────┤
│ Data            Godzina         │
│ [________]      [________]      │
│                                 │
│ Typ wizyty                      │
│ [🔍 Diagnoza] [🔧 Naprawa]     │
│ [✅ Kontrola] [📦 Montaż]      │
│                                 │
│ ... reszta pól                  │
└─────────────────────────────────┘
```

---

## Podsumowanie wizualne

### Co się zmieniło:

**Modal:**
- 📏 Szerokość: `max-w-sm` → `max-w-md`
- 🎨 Typy wizyt: 2 → 4
- 👥 Pracownicy: 4 (sztywne) → 8 (z API)
- ⏱️ Szacowany czas: brak → 6 opcji
- ❌ Przycisk X: brak → jest w nagłówku
- 🎯 Ikony: brak → FiCheck, FiX w przyciskach
- 🎨 Kolory: podstawowe → cienie, gradienty

**Lista wizyt:**
- 🏷️ Typy: 2 → 4 (z ikonami)
- 👤 Imiona: ID → prawdziwe imiona z API
- 🎨 Kolory: 1 kolor → 4 kolory dla typów

**Intelligent Planner:**
- 👥 Dropdown: 3 pracowników → 8 z API
- 🔄 Aktualizacja: manualna → automatyczna z API

**Struktura danych:**
- 🆔 ID: timestamp → VIS format
- 👤 assignedTo: string → EMP ID
- ⏱️ estimatedDuration: brak → liczba minut
- 🏷️ type: 2 opcje → 4 opcje

---

**Wszystkie zmiany wizualne mają na celu:**
✅ Lepszą czytelność
✅ Więcej funkcjonalności
✅ Łatwiejszą obsługę
✅ Integrację z systemem pracowników
✅ Zgodność z nową strukturą danych
