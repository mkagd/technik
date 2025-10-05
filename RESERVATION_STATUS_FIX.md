# 🔧 Naprawa zmiany statusu rezerwacji

## Problem
W liście rezerwacji (`/admin/rezerwacje`) nie działała zmiana statusu poprzez dropdown. Dropdown był widoczny i aktywny, ale po zmianie wartości status nie był zapisywany w bazie danych.

## Przyczyna
API endpoint `/api/rezerwacje` w metodzie PUT miał błędną logikę wykrywania typu ID:
```javascript
// ❌ STARY KOD - błędna logika
const isReservationId = String(id).startsWith('REZ');
```

Problem: Rezerwacje w `data/rezerwacje.json` mają **numeryczne ID** (timestampy), np. `1759598648030`, NIE stringi zaczynające się od "REZ". 

To powodowało, że:
1. Warunek `isReservationId` zawsze zwracał `false`
2. Kod próbował aktualizować klienta/zamówienie zamiast rezerwacji
3. Update rezerwacji nie był wykonywany

## Rozwiązanie

### 1. Poprawiono logikę wykrywania rezerwacji
Zamiast sprawdzać prefiks "REZ", teraz kod:
- Najpierw szuka rezerwacji w pliku `rezerwacje.json` po ID
- Obsługuje różne formaty ID (number, string)
- Jeśli znajdzie rezerwację, aktualizuje ją bezpośrednio

### 2. Nowy kod w `pages/api/rezerwacje.js`
```javascript
// ✅ NOWY KOD - poprawna logika
try {
  const reservations = readReservations();
  const reservationIndex = reservations.findIndex(r => 
    r.id === id || r.id === Number(id) || String(r.id) === String(id)
  );

  if (reservationIndex !== -1) {
    // Znaleziono rezerwację - aktualizuj ją
    const result = updateReservation(reservations[reservationIndex].id, {
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    });

    if (result) {
      return res.status(200).json({ 
        message: 'Rezerwacja zaktualizowana', 
        data: result 
      });
    }
  }
} catch (error) {
  console.error('❌ Error updating reservation:', error);
  // Continue to try client/order update
}
```

## Zmiany w plikach

### `pages/api/rezerwacje.js`
- **Linia ~520-555**: Poprawiono metodę PUT
- Usunięto błędną logikę `String(id).startsWith('REZ')`
- Dodano bezpośrednie wyszukiwanie rezerwacji po ID
- Dodano obsługę różnych formatów ID

## Funkcje które już działały poprawnie

### Frontend (`pages/admin/rezerwacje/index.js`)
✅ Dropdown ze statusami - działał poprawnie
✅ Handler `handleStatusChange()` - wysyłał prawidłowe zapytanie PUT
✅ Lista statusów `bookingStatuses` - 10 statusów z ikonami
✅ Funkcja `getStatusInfo()` - zwracała kolory i ikony

### Dostępne statusy rezerwacji
1. **pending** (⏳) - Oczekuje na kontakt
2. **contacted** (📞) - Skontaktowano się  
3. **scheduled** (📅) - Umówiona wizyta
4. **confirmed** (✅) - Potwierdzona
5. **in-progress** (🔧) - W trakcie realizacji
6. **waiting-parts** (📦) - Oczekuje na części
7. **ready** (🎉) - Gotowe do odbioru
8. **completed** (✔️) - Zakończone
9. **cancelled** (❌) - Anulowane
10. **no-show** (👻) - Nie stawił się

## Testowanie

### Test 1: Zmiana statusu pojedynczej rezerwacji
1. Otwórz `/admin/rezerwacje`
2. Znajdź dowolną rezerwację na liście
3. Kliknij na dropdown statusu
4. Wybierz nowy status (np. zmień "Oczekuje na kontakt" → "Skontaktowano się")
5. ✅ Status powinien się zmienić
6. ✅ Powinien pojawić się toast "Status rezerwacji został zaktualizowany"
7. ✅ Zmiana powinna być zapisana w `data/rezerwacje.json`

### Test 2: Sprawdzenie trwałości zmiany
1. Odśwież stronę (F5)
2. ✅ Status powinien pozostać zmieniony
3. Otwórz `data/rezerwacje.json`
4. ✅ Pole `status` powinno mieć nową wartość
5. ✅ Pole `updatedAt` powinno mieć aktualną datę
6. ✅ Pole `updatedBy` powinno mieć wartość "admin"

### Test 3: Sprawdzenie kolorów i ikon
1. Zmień status na różne wartości
2. ✅ Kolory tła powinny się zmieniać zgodnie z statusem
3. ✅ Ikony powinny się wyświetlać obok nazwy statusu
4. ✅ Hover effect powinien działać (shadow-md)

## Struktura danych

### Format rezerwacji w `data/rezerwacje.json`
```json
{
  "id": 1759598648030,
  "name": "Jan Kowalski",
  "phone": "123456789",
  "email": "jan@example.com",
  "status": "pending",
  "category": "Pralki",
  "date": "2025-10-05",
  "created_at": "2025-10-04T17:24:08.030Z",
  "updatedAt": "2025-10-04T18:30:00.000Z",
  "updatedBy": "admin"
}
```

### Request PUT do API
```javascript
fetch('/api/rezerwacje', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1759598648030,
    status: 'contacted',
    updatedAt: new Date().toISOString()
  })
})
```

### Response z API
```json
{
  "message": "Rezerwacja zaktualizowana",
  "data": {
    "id": 1759598648030,
    "status": "contacted",
    "updatedAt": "2025-10-04T18:30:00.000Z",
    "updatedBy": "admin",
    ...
  }
}
```

## Dodatkowe informacje

### Fallback logic
Jeśli nie znajdzie rezerwacji po ID, API próbuje:
1. Zaktualizować w Supabase (jeśli skonfigurowane)
2. Zaktualizować jako klient + zamówienie
3. Zwrócić błąd 404

### Logi w konsoli
```
📞 API PUT /api/rezerwacje - aktualizacja rezerwacji
🔍 Updating reservation/client: 1759598648030
📝 Update data: { status: 'contacted', updatedAt: '...' }
✅ Found reservation at index: 0
✅ Reservation updated successfully
```

## Status
✅ **NAPRAWIONE** - Zmiana statusu rezerwacji działa poprawnie

## Data naprawy
2025-10-04

## Powiązane pliki
- `pages/api/rezerwacje.js` - API endpoint (metoda PUT)
- `pages/admin/rezerwacje/index.js` - Lista rezerwacji z dropdown
- `utils/dataStorage.js` - Funkcja updateReservation()
- `data/rezerwacje.json` - Przechowywanie danych
