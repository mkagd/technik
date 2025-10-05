# 🔧 NAPRAWA EDYCJI REZERWACJI - PODSUMOWANIE

Data: 4 października 2025

## 📋 PROBLEM
W panelu admin → Rezerwacje → [szczegóły] nie można było zmienić statusu ani innych pól rezerwacji.

## 🔍 DIAGNOZA

### Przyczyna problemu:
1. **Niewłaściwa struktura ID:**
   - Rezerwacje w `data/rezervacje.json` mają ID w formacie: `REZ-1759576455350-766`
   - API w metodzie PUT sprawdzało tylko klientów (ID format: `CLIA252770001`)
   - Brak obsługi aktualizacji rezerwacji bezpośrednio w pliku `rezervacje.json`

2. **API GET nie zwracało rezerwacji:**
   - API czytało tylko klientów i zamówienia
   - Nie czytało pliku `data/rezervacje.json`
   - Przy próbie pobrania rezerwacji po ID zwracało 404

3. **Brak importu funkcji updateReservation:**
   - API miało dostęp do funkcji ale jej nie importowało
   - Funkcja `updateReservation` w `utils/dataStorage.js` istniała ale nie była używana

## ✅ ROZWIĄZANIE

### 1. Dodano import funkcji updateReservation
**Plik:** `pages/api/rezerwacje.js`
```javascript
import { readReservations, addReservation, updateReservation } from '../../utils/dataStorage';
```

### 2. Naprawiono metodę PUT - dodano wykrywanie typu ID
**Plik:** `pages/api/rezerwacje.js`
```javascript
if (req.method === 'PUT') {
  const { id, ...updateData } = req.body;
  
  // Sprawdź czy to ID rezerwacji (zaczyna się od "REZ")
  const isReservationId = String(id).startsWith('REZ');
  
  if (isReservationId) {
    // Aktualizuj rezerwację bezpośrednio w rezervacje.json
    const result = await updateReservation(id, {
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
  
  // Fallback: aktualizuj klientów i zamówienia (stary system)
  // ...
}
```

### 3. Naprawiono metodę GET - dodano czytanie z rezervacje.json
**Plik:** `pages/api/rezerwacje.js`
```javascript
if (req.method === 'GET') {
  const { id } = req.query;
  
  // Najpierw sprawdź rezervacje.json
  const reservations = readReservations();
  
  if (id) {
    const singleReservation = reservations.find(r => r.id === id);
    if (singleReservation) {
      // Przekształć na format zgodny z formularzem
      return res.status(200).json({
        ...singleReservation,
        name: singleReservation.clientName,
        phone: singleReservation.clientPhone,
        email: singleReservation.clientEmail,
        category: singleReservation.deviceType,
        description: singleReservation.issueDescription,
        date: singleReservation.preferredDate,
        time: singleReservation.preferredTime
      });
    }
  }
  
  // Fallback: klienci + zamówienia
  // ...
}
```

### 4. Poprawiono frontend - ID jako string
**Plik:** `pages/admin/rezerwacje/[id].js`
```javascript
body: JSON.stringify({
  id: id, // Nie parsuj na int - może być string "REZ-..."
  ...rezerwacja,
  updatedAt: new Date().toISOString()
})
```

Poprzednio było: `id: parseInt(id)` ❌
Teraz jest: `id: id` ✅

## 📊 STRUKTURA DANYCH

### Rezerwacja w data/rezervacje.json:
```json
{
  "id": "REZ-1759576455350-766",
  "clientId": "CLIA252770001",
  "clientName": "Jan Kowalski",
  "clientPhone": "146812345",
  "clientEmail": "jan.kowalski@gmail.com",
  "address": "ul. Kopernika 15/3, 39-200 Dębica",
  "city": "Dębica",
  "deviceType": "Pralka",
  "brand": "Samsung",
  "issueDescription": "Problem z urządzeniem",
  "preferredDate": "2025-10-05",
  "preferredTime": "09:00",
  "status": "confirmed",
  "notes": "Rezerwacja testowa",
  "source": "web",
  "createdAt": "2025-10-04T11:14:15.350Z",
  "updatedAt": "2025-10-04T11:14:15.350Z"
}
```

### Mapowanie pól (API → Frontend):
- `clientName` → `name`
- `clientPhone` → `phone`
- `clientEmail` → `email`
- `deviceType` → `category`
- `issueDescription` → `description`
- `preferredDate` → `date`
- `preferredTime` → `time`

## 🎯 CO ZOSTAŁO NAPRAWIONE

### ✅ Działające funkcje:
1. **Pobieranie rezerwacji** - GET /api/rezerwacje?id=REZ-...
2. **Aktualizacja rezerwacji** - PUT /api/rezerwacje z ID rezerwacji
3. **Zmiana statusu** - select w formularzu działa poprawnie
4. **Edycja wszystkich pól** - name, phone, email, address, status, notes, etc.
5. **Zapis do pliku** - zmiany zapisywane w data/rezervacje.json

### 🔄 Kompatybilność wsteczna:
- Stare rezerwacje (ID klienta format CLI...) nadal działają
- Nowe rezerwacje (ID format REZ-...) działają poprawnie
- System automatycznie wykrywa typ ID

## 🧪 TESTOWANIE

### Jak przetestować:
1. Otwórz http://localhost:3000/admin/rezerwacje
2. Kliknij na dowolną rezerwację
3. Zmień status z listy rozwijanej
4. Kliknij "Zapisz zmiany"
5. Sprawdź czy status się zmienił
6. Sprawdź w data/rezervacje.json czy dane zostały zapisane

### Testowane pola:
- ✅ Status (select dropdown)
- ✅ Imię i nazwisko
- ✅ Telefon
- ✅ Email
- ✅ Adres
- ✅ Miasto
- ✅ Kod pocztowy
- ✅ Kategoria urządzenia
- ✅ Data
- ✅ Godzina
- ✅ Opis problemu
- ✅ Notatki wewnętrzne

## 📝 DOSTĘPNE STATUSY REZERWACJI

```javascript
const bookingStatuses = [
  { value: 'pending', label: 'Oczekuje na kontakt' },
  { value: 'contacted', label: 'Skontaktowano się' },
  { value: 'scheduled', label: 'Umówiona wizyta' },
  { value: 'confirmed', label: 'Potwierdzona' },
  { value: 'in-progress', label: 'W trakcie realizacji' },
  { value: 'waiting-parts', label: 'Oczekuje na części' },
  { value: 'ready', label: 'Gotowe do odbioru' },
  { value: 'completed', label: 'Zakończone' },
  { value: 'cancelled', label: 'Anulowane' },
  { value: 'no-show', label: 'Nie stawił się' }
];
```

## 🎉 REZULTAT

Teraz można:
- ✅ Edytować wszystkie pola rezerwacji
- ✅ Zmieniać status z listy rozwijanej
- ✅ Zapisywać zmiany
- ✅ Zmiany są trwałe (zapisywane w data/rezervacje.json)
- ✅ System działa zarówno dla nowych jak i starych rezerwacji

## 📊 ZMODYFIKOWANE PLIKI

1. **pages/api/rezerwacje.js** - Dodano obsługę PUT i GET dla rezerwacji
2. **pages/admin/rezerwacje/[id].js** - Poprawiono wysyłanie ID jako string

## 🔍 LOGI DEBUGOWANIA

Konsola serwera pokazuje teraz:
```
📞 API PUT /api/rezerwacje - aktualizacja rezerwacji
🔍 ID type: Reservation (REZ-1759576455350-766)
📝 Aktualizuję rezerwację: REZ-1759576455350-766
📝 Dane do aktualizacji: { status: 'confirmed', ... }
✅ Rezerwacja zaktualizowana: REZ-1759576455350-766
```
