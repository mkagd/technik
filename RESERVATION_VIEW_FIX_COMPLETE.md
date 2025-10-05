# 🔧 Naprawa wyświetlania danych rezerwacji - Podsumowanie

## Data: 2025-10-04

## Zgłoszone problemy

### 1. ❌ Lista rezerwacji pokazuje "Invalid Date"
**Przyczyna:** Rezerwacje z zakresem dat (availability) bez konkretnej daty powodowały błąd `new Date(undefined)`

**Rozwiązanie:** 
- Dodano sprawdzenie `rezerwacja.date` przed parsowaniem
- Dodano wyświetlanie `availability` jeśli brak `time`
- Fallback: "Nie ustalono" gdy brak obu wartości

**Plik:** `pages/admin/rezerwacje/index.js` (linia ~648)

```javascript
<div className="text-sm font-medium text-gray-900">
  {rezerwacja.date ? new Date(rezerwacja.date).toLocaleDateString('pl-PL') : 'Nie ustalono'}
</div>
{rezerwacja.time && (
  <div className="text-xs text-gray-500">{rezerwacja.time}</div>
)}
{rezerwacja.availability && !rezerwacja.time && (
  <div className="text-xs text-gray-500">{rezerwacja.availability}</div>
)}
```

---

### 2. ❌ Podgląd rezerwacji nie pokazuje nowych danych
**Brakujące dane:**
- Typ klienta (firma/prywatny)
- Dane firmowe z GUS (NIP, REGON, KRS)
- Wszystkie telefony (phones[])
- Wszystkie adresy (addresses[])
- Wszystkie urządzenia z modelami (devices[])
- Dostępność (availability)

**Rozwiązanie:** 
Przekształcono stronę `/admin/rezerwacje/[id]` na **READ-ONLY** (tylko podgląd)

**Dodane sekcje:**

#### A) Typ klienta
```javascript
{rezerwacja.clientType && (
  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <span className="text-sm font-medium text-blue-900">
      {rezerwacja.clientType === 'company' ? '🏢 Firma' : '👤 Klient prywatny'}
    </span>
  </div>
)}
```

#### B) Dane firmowe (GUS)
```javascript
{rezerwacja.clientType === 'company' && rezerwacja.companyData && (
  <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
    <h4 className="text-sm font-semibold text-purple-900 mb-3">🏢 Dane firmowe</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {/* Nazwa, NIP, REGON, KRS */}
    </div>
  </div>
)}
```

#### C) Lista telefonów
```javascript
{rezerwacja.phones && rezerwacja.phones.length > 0 ? (
  <div className="space-y-2">
    {rezerwacja.phones.map((phone, index) => (
      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
        <FiPhone className="h-4 w-4 text-gray-500 mr-3" />
        <span className="font-medium">{phone.number}</span>
        {phone.label && <span className="ml-2 text-sm">({phone.label})</span>}
        {phone.isPrimary && (
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
            Główny
          </span>
        )}
      </div>
    ))}
  </div>
) : (
  // Fallback: pojedynczy telefon
)}
```

#### D) Lista adresów
```javascript
{rezerwacja.addresses && rezerwacja.addresses.length > 0 ? (
  <div className="space-y-2">
    {rezerwacja.addresses.map((addr, index) => (
      <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
        <FiMapPin className="h-4 w-4 text-gray-500 mr-3 mt-0.5" />
        <div className="flex-1">
          <div className="font-medium">
            {addr.street}, {addr.postalCode} {addr.city}
          </div>
          {addr.label && <div className="text-sm text-gray-600">({addr.label})</div>}
        </div>
        {addr.isPrimary && (
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
            Główny
          </span>
        )}
      </div>
    ))}
  </div>
) : (
  // Fallback: pojedynczy adres
)}
```

#### E) Lista urządzeń z modelami
```javascript
{rezerwacja.devices && rezerwacja.devices.length > 0 && (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      <FiFileText className="inline mr-2 h-5 w-5" />
      Zgłoszone urządzenia ({rezerwacja.devices.length})
    </h3>
    <div className="space-y-4">
      {rezerwacja.devices.map((device, index) => (
        <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
              #{index + 1}
            </span>
            <h4 className="text-lg font-semibold ml-3">
              {device.name || 'Urządzenie AGD'}
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {/* Marka, Model, Nr seryjny, Rok zakupu */}
          </div>

          {device.description && (
            <div className="mt-3 p-3 bg-white rounded border">
              <div className="text-sm text-gray-600">Opis problemu:</div>
              <div className="text-sm text-gray-900">{device.description}</div>
            </div>
          )}

          {device.warrantyStatus && (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              device.warrantyStatus === 'warranty' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {/* Gwarancja / Pogwarancyjne / Nieznane */}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

#### F) Dostępność klienta
```javascript
{rezerwacja.availability && (
  <div className="md:col-span-2">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Dostępność klienta
    </label>
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
      <FiClock className="inline h-4 w-4 text-blue-600 mr-2" />
      <span className="font-medium text-blue-900">{rezerwacja.availability}</span>
    </div>
  </div>
)}
```

---

### 3. ❌ Edycja rezerwacji - brak nowych funkcjonalności

**Problem:** 
Stara strona `[id].js` była hybrydą podglądu i edycji, ale nie miała:
- Wyboru firma/prywatny
- Integracji z GUS
- Dodawania wielu telefonów/adresów
- Autocomplete modeli urządzeń
- Dodawania wielu urządzeń

**Rozwiązanie:**
1. ✅ Strona `[id].js` → przekształcona na **READ-ONLY** (tylko podgląd)
2. ⏳ Nowa strona `/admin/rezerwacje/edytuj/[id]` → kopia `nowa.js` z ładowaniem danych

---

## Zmiany w plikach

### `pages/admin/rezerwacje/index.js`
**Linia ~648:** Naprawiono wyświetlanie daty
- Dodano sprawdzenie `rezerwacja.date` przed parsowaniem
- Dodano fallback "Nie ustalono"
- Dodano wyświetlanie `availability`

### `pages/admin/rezerwacje/[id].js`
**Główne zmiany:**
1. **Usunięto funkcjonalność edycji:**
   - Usunięto state: `saving`, `hasChanges`, `errors`
   - Usunięto funkcje: `updateField()`, `validate()`, `handleSave()`
   - Zmieniono `handleCancel()` na `handleBack()`

2. **Przekształcono inputy na read-only:**
   - `<input>` → `<div>` z tłem szarym
   - `<select>` → `<span>` z badge statusu
   - `<textarea>` → `<p>` z `whitespace-pre-wrap`

3. **Dodano wyświetlanie nowych danych:**
   - Typ klienta (firma/prywatny) - linia ~265
   - Dane firmowe (GUS) - linia ~273
   - Lista telefonów - linia ~310
   - Lista adresów - linia ~330
   - Lista urządzeń - linia ~360
   - Dostępność - linia ~450

4. **Dodano przycisk "Edytuj rezerwację":**
   - Przekierowuje do `/admin/rezerwacje/edytuj/${id}`

**Ikony:**
- Usunięto: `FiSave`, `FiX`, `FiAlertCircle`
- Dodano: `FiEdit`

---

## TODO - Do dokończenia

### ⏳ Strona edycji `/admin/rezerwacje/edytuj/[id].js`

**Plan implementacji:**

1. **Skopiować `nowa.js` jako bazę**
2. **Dodać ładowanie danych:**
   ```javascript
   useEffect(() => {
     if (id) {
       loadRezerwacja();
     }
   }, [id]);

   const loadRezerwacja = async () => {
     const response = await fetch(`/api/rezerwacje?id=${id}`);
     const data = await response.json();
     // Załaduj dane do state
     setFormData(data);
   };
   ```

3. **Zmienić endpoint z POST na PUT:**
   ```javascript
   const response = await fetch('/api/rezerwacje', {
     method: 'PUT',
     body: JSON.stringify({
       id: id,
       ...formData
     })
   });
   ```

4. **Zmienić tytuł i breadcrumbs:**
   ```javascript
   <AdminLayout 
     title={`Edycja rezerwacji #${id}`}
     breadcrumbs={[
       { label: 'Rezerwacje', path: '/admin/rezerwacje' },
       { label: `#${id}`, path: `/admin/rezerwacje/${id}` },
       { label: 'Edycja' }
     ]}
   >
   ```

5. **Dodać przycisk "Anuluj" kierujący do podglądu:**
   ```javascript
   <button onClick={() => router.push(`/admin/rezerwacje/${id}`)}>
     Anuluj
   </button>
   ```

**Funkcjonalności które muszą działać:**
- ✅ Wybór firma/prywatny
- ✅ Pobieranie danych z GUS
- ✅ Dodawanie/edycja/usuwanie telefonów
- ✅ Dodawanie/edycja/usuwanie adresów
- ✅ Dodawanie/edycja/usuwanie urządzeń
- ✅ Autocomplete modeli urządzeń
- ✅ Wybór marki (19 marek)
- ✅ Kalendarz dostępności
- ✅ Zakres dat

---

## Testowanie

### Test 1: Lista rezerwacji - daty
1. ✅ Otwórz `/admin/rezerwacje`
2. ✅ Sprawdź kolumnę "Data wizyty"
3. ✅ Rezerwacje z datą: wyświetlają datę w formacie pl-PL
4. ✅ Rezerwacje z availability: wyświetlają zakres (np. "po 15")
5. ✅ Rezerwacje bez daty: wyświetlają "Nie ustalono"
6. ✅ Brak "Invalid Date"

### Test 2: Podgląd rezerwacji - nowe dane
1. ✅ Otwórz `/admin/rezerwacje/1759610021868`
2. ✅ **Typ klienta:** Badge "🏢 Firma" lub "👤 Klient prywatny"
3. ✅ **Dane firmowe:** Sekcja z NIP, REGON, KRS (jeśli firma)
4. ✅ **Telefony:** Lista wszystkich telefonów z etykietami
5. ✅ **Adresy:** Lista wszystkich adresów z etykietami
6. ✅ **Urządzenia:** Karty z marką, modelem, opisem, statusem gwarancji
7. ✅ **Dostępność:** Badge z zakresem godzin
8. ✅ **Przycisk "Edytuj rezerwację":** Widoczny u góry

### Test 3: Edycja rezerwacji (po implementacji)
1. ⏳ Kliknij "Edytuj rezerwację"
2. ⏳ Przekierowanie do `/admin/rezerwacje/edytuj/[id]`
3. ⏳ Formularz załadowany z danymi rezerwacji
4. ⏳ Możliwość edycji wszystkich pól
5. ⏳ Dodawanie/usuwanie telefonów, adresów, urządzeń
6. ⏳ Autocomplete modeli działa
7. ⏳ GUS API działa
8. ⏳ Przycisk "Zapisz" → PUT do API
9. ⏳ Po zapisie → przekierowanie do podglądu

---

## Status

### ✅ UKOŃCZONE (3/4)
1. ✅ Naprawa wyświetlania dat w liście
2. ✅ Dodanie nowych pól do podglądu
3. ✅ Przekształcenie [id].js na read-only

### ⏳ W TRAKCIE (1/4)
4. ⏳ Implementacja strony edycji `/admin/rezerwacje/edytuj/[id].js`

---

## Struktura danych rezerwacji

### Nowy format (z wszystkimi funkcjonalnościami)
```json
{
  "id": 1759610021868,
  "name": "Jan Kowalski",
  "email": "jan@example.com",
  "clientType": "company",
  "companyData": {
    "name": "TECHNIK SERWIS SP. Z O.O.",
    "nip": "1234567890",
    "regon": "123456789",
    "krs": "0000123456"
  },
  "phones": [
    {
      "number": "123456789",
      "label": "Główny",
      "isPrimary": true
    },
    {
      "number": "987654321",
      "label": "Służbowy",
      "isPrimary": false
    }
  ],
  "addresses": [
    {
      "street": "Gliniana 17/30",
      "city": "Kraków",
      "postalCode": "30-732",
      "label": "Główny",
      "isPrimary": true
    }
  ],
  "devices": [
    {
      "name": "Pralki",
      "brand": "BOSCH",
      "model": "WAG28461BY",
      "serialNumber": "FD9876543210",
      "purchaseYear": "2020",
      "warrantyStatus": "post-warranty",
      "description": "Nie działa wirowanie"
    }
  ],
  "category": "Pralki",
  "date": "2025-10-05",
  "time": "14:00",
  "availability": "po 14:00",
  "status": "pending",
  "description": "Nie działa wirowanie",
  "notes": "Klient prosi o kontakt po 15:00",
  "created_at": "2025-10-04T10:00:00.000Z"
}
```

### Backward compatibility (stare rezerwacje)
```json
{
  "id": 1759598648030,
  "name": "Anna Nowak",
  "phone": "555123456",
  "email": "anna@example.com",
  "city": "Warszawa",
  "street": "Marszałkowska 1",
  "address": "Marszałkowska 1, Warszawa",
  "category": "Lodówki",
  "device": "Samsung",
  "problem": "Nie chłodzi",
  "date": "2025-10-06",
  "status": "pending",
  "created_at": "2025-10-04T09:00:00.000Z"
}
```

Strona podglądu obsługuje oba formaty dzięki fallbackom.

---

## Powiązane pliki

- ✅ `pages/admin/rezerwacje/index.js` - Lista (naprawiona)
- ✅ `pages/admin/rezerwacje/[id].js` - Podgląd (naprawiony, read-only)
- ⏳ `pages/admin/rezerwacje/edytuj/[id].js` - Edycja (do zrobienia)
- ✅ `pages/admin/rezerwacje/nowa.js` - Formularz tworzenia (jako wzór)
- ✅ `pages/api/rezerwacje.js` - API endpoint (PUT działa)

---

## Następne kroki

1. **Skopiować `nowa.js` do `edytuj/[id].js`**
2. **Dodać ładowanie danych z API**
3. **Zmienić POST na PUT**
4. **Przetestować pełny flow:**
   - Lista → Podgląd → Edycja → Zapisz → Podgląd
5. **Dodać walidację:**
   - Sprawdzić czy rezerwacja istnieje
   - Obsłużyć błędy 404
6. **Dodać toast notifications:**
   - "Rezerwacja została zaktualizowana"
   - "Błąd podczas zapisywania"

---

## Notatki techniczne

### Parsowanie daty
```javascript
// ❌ Stary kod - błąd dla undefined
new Date(rezerwacja.date).toLocaleDateString('pl-PL')

// ✅ Nowy kod - bezpieczny
rezerwacja.date 
  ? new Date(rezerwacja.date).toLocaleDateString('pl-PL') 
  : 'Nie ustalono'
```

### Wyświetlanie tablic
```javascript
// ✅ Z fallbackiem na stary format
{rezerwacja.phones && rezerwacja.phones.length > 0 ? (
  // Nowy format: tablica
  rezerwacja.phones.map(...)
) : (
  // Stary format: pojedyncze pole
  rezerwacja.phone
)}
```

### Badge statusu
```javascript
// ✅ Z dynamicznym kolorem
const statusInfo = bookingStatuses.find(s => s.value === rezerwacja.status) || bookingStatuses[0];

<span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}>
  {statusInfo.label}
</span>
```

