# 🏢 System Klienci Firmowi + Poprawki Wyświetlania - Dokumentacja

## 🎯 Cel

1. **Formularz rezerwacji**: Dodanie wyboru Firma/Prywatny + integracja z GUS API
2. **Lista klientów**: Poprawa wyświetlania - wszystkie telefony/adresy, dane firmy, dodatkowe statusy

---

## ✅ Zmiany w Formularzu Rezerwacji

### **Lokalizacja:** `pages/admin/rezerwacje/nowa.js`

### **1. Nowy State**

```javascript
const [formData, setFormData] = useState({
  // ... inne pola
  clientType: 'private' // 'private' (domyślny) lub 'company'
});

const [companyData, setCompanyData] = useState({
  nip: '',
  name: '',
  address: '',
  city: '',
  postalCode: '',
  regon: '',
  krs: ''
});

const [fetchingGUS, setFetchingGUS] = useState(false);
```

### **2. UI - Wybór Typ Klienta**

**Radio buttons:** Prywatny / Firma

```jsx
<div className="flex gap-4">
  <label className={`flex-1 px-4 py-3 border-2 rounded-lg cursor-pointer ${
    formData.clientType === 'private' 
      ? 'border-blue-500 bg-blue-50' 
      : 'border-gray-300'
  }`}>
    <input type="radio" name="clientType" value="private" />
    <span>👤 Klient prywatny</span>
  </label>
  
  <label className={`flex-1 px-4 py-3 border-2 rounded-lg cursor-pointer ${
    formData.clientType === 'company' 
      ? 'border-purple-500 bg-purple-50' 
      : 'border-gray-300'
  }`}>
    <input type="radio" name="clientType" value="company" />
    <span>🏢 Firma</span>
  </label>
</div>
```

**Domyślny wybór:** Prywatny ✅

### **3. Sekcja Dane Firmy (conditional)**

Pokazuje się **tylko gdy `clientType === 'company'`**:

```jsx
{formData.clientType === 'company' && (
  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
    <h3 className="text-sm font-semibold text-purple-900 mb-3">
      🏢 Dane firmowe
    </h3>
    
    {/* NIP + przycisk GUS */}
    <div className="flex gap-2">
      <input
        type="text"
        value={companyData.nip}
        onChange={(e) => setCompanyData({ 
          ...companyData, 
          nip: e.target.value.replace(/\D/g, '') 
        })}
        maxLength="10"
        placeholder="1234567890"
      />
      <button
        type="button"
        onClick={fetchCompanyFromGUS}
        disabled={fetchingGUS || !companyData.nip || companyData.nip.length < 10}
      >
        {fetchingGUS ? '⏳ Pobieranie...' : '🔍 Pobierz z GUS'}
      </button>
    </div>
    
    {/* Nazwa firmy */}
    <input
      type="text"
      value={companyData.name}
      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
      placeholder="Nazwa Sp. z o.o."
    />
    
    {/* REGON, KRS */}
    <input type="text" placeholder="REGON" value={companyData.regon} />
    <input type="text" placeholder="KRS" value={companyData.krs} />
  </div>
)}
```

### **4. Funkcja Pobierania z GUS**

```javascript
const fetchCompanyFromGUS = async () => {
  if (!companyData.nip || companyData.nip.length < 10) {
    alert('❌ Podaj poprawny NIP (10 cyfr)');
    return;
  }

  setFetchingGUS(true);
  try {
    const response = await fetch(`/api/gus?nip=${companyData.nip}`);
    const data = await response.json();

    if (data.success && data.company) {
      // Wypełnij dane firmy
      setCompanyData({
        ...companyData,
        name: data.company.name || '',
        address: data.company.address || '',
        city: data.company.city || '',
        postalCode: data.company.postalCode || '',
        regon: data.company.regon || '',
        krs: data.company.krs || ''
      });

      // Opcjonalnie: wypełnij też główny adres w formularzu
      const updated = [...addresses];
      const primaryIdx = updated.findIndex(a => a.isPrimary);
      if (primaryIdx >= 0) {
        updated[primaryIdx] = {
          ...updated[primaryIdx],
          street: data.company.address,
          city: data.company.city,
          postalCode: data.company.postalCode || ''
        };
        setAddresses(updated);
      }

      alert('✅ Dane firmy pobrane z GUS');
    } else {
      alert(`❌ Nie znaleziono firmy o NIP: ${companyData.nip}`);
    }
  } catch (error) {
    console.error('Error fetching GUS:', error);
    alert('❌ Błąd połączenia z API GUS');
  } finally {
    setFetchingGUS(false);
  }
};
```

### **5. Submit - Dodanie Danych Firmy**

```javascript
const submitData = {
  ...formData,
  // ... inne pola
  clientType: formData.clientType,
  companyData: formData.clientType === 'company' ? companyData : null,
};
```

---

## 🔍 API GUS

### **Lokalizacja:** `pages/api/gus.js`

### **Endpoint:**
```
GET /api/gus?nip={nip}
```

### **Przykład użycia:**
```javascript
fetch('/api/gus?nip=1234567890')
```

### **Response (SUCCESS):**
```json
{
  "success": true,
  "company": {
    "nip": "1234567890",
    "name": "TECHNIK SERWIS SP. Z O.O.",
    "regon": "123456789",
    "krs": "0000123456",
    "address": "ul. Testowa 15/3",
    "city": "Warszawa",
    "postalCode": "00-001",
    "status": "active",
    "type": "sp. z o.o."
  },
  "message": "Pobrano dane firmy: TECHNIK SERWIS SP. Z O.O.",
  "source": "mock"
}
```

### **Response (ERROR - Not Found):**
```json
{
  "success": false,
  "message": "Nie znaleziono firmy o podanym NIP: 9999999999",
  "hint": "Sprawdź czy NIP jest poprawny lub dodaj dane ręcznie.",
  "source": "mock"
}
```

### **Mock Data:**

API zawiera 3 przykładowe firmy do testów:

| NIP | Nazwa | Miasto |
|-----|-------|--------|
| `1234567890` | TECHNIK SERWIS SP. Z O.O. | Warszawa |
| `9876543210` | AGD-FIX SP. J. | Kraków |
| `5555555555` | NAPRAWA 24H JAN KOWALSKI | Wrocław |

### **TODO: Integracja z Prawdziwym API**

Instrukcja w pliku `pages/api/gus.js`:

**Opcja 1:** API Ministerstwa Finansów (polecane)
```
https://wl-api.mf.gov.pl/api/search/nip/{nip}?date=YYYY-MM-DD
```
- ✅ Bezpłatne
- ✅ Bez rejestracji
- ✅ Aktualne dane z białej listy VAT

**Opcja 2:** CEIDG (dla JDG)
```
https://datastore.ceidg.gov.pl/api/companies/{nip}
```
- ⚠️ Wymaga rejestracji i klucza API

**Opcja 3:** GUS REGON API
```
https://api.stat.gov.pl/Home/RegonApi
```
- ⚠️ Wymaga klucza i logowania

---

## 📋 Zmiany w Liście Klientów

### **Lokalizacja:** `pages/admin/klienci/index.js`

### **1. Wyświetlanie Wszystkich Telefonów**

**PRZED:**
```jsx
<div>
  {klient.phone}
</div>
```

**PO:**
```jsx
{klient.phones && klient.phones.length > 0 ? (
  klient.phones.map((phone, idx) => (
    <div key={idx}>
      <FiPhone /> {phone.number}
      {phone.isPrimary && <span className="badge">Główny</span>}
      {phone.label && <span>({phone.label})</span>}
    </div>
  ))
) : klient.phone ? (
  <div>
    <FiPhone /> {klient.phone}
  </div>
) : null}
```

**Efekt:**
- ✅ Pokazuje wszystkie numery z tablicy `phones[]`
- ✅ Badge "Główny" dla `isPrimary: true`
- ✅ Labele typu "(Służbowy)", "(Domowy)"
- ✅ Backward compatible (jeśli klient ma tylko `phone`, też wyświetli)

### **2. Wyświetlanie Wszystkich Adresów**

**PRZED:**
```jsx
<div>
  <FiMapPin /> {klient.city}
</div>
```

**PO:**
```jsx
{klient.addresses && klient.addresses.length > 0 ? (
  klient.addresses.map((address, idx) => (
    <div key={idx}>
      <FiMapPin />
      <div>
        <div>{address.street}</div>
        <div className="text-xs">{address.postalCode} {address.city}</div>
        {address.isPrimary && <span className="badge">Główny</span>}
        {address.label && <span>({address.label})</span>}
      </div>
    </div>
  ))
) : klient.city ? (
  <div>
    <FiMapPin /> {klient.city}
  </div>
) : null}
```

**Efekt:**
- ✅ Pokazuje pełny adres: ulica + kod + miasto
- ✅ Badge "Główny" dla głównego adresu
- ✅ Labele "(Praca)", "(Dom)"
- ✅ Backward compatible

### **3. Wyświetlanie Danych Firmy**

**Dodano przed nagłówkiem:**
```jsx
<div className="flex items-center gap-2 mb-1">
  <h3>{klient.name}</h3>
  {klient.clientType === 'company' && (
    <span className="badge bg-purple-100">Firma</span>
  )}
</div>

{klient.companyData && (
  <div className="mt-1 mb-2">
    <div className="font-medium">{klient.companyData.name}</div>
    {klient.companyData.nip && (
      <div className="text-xs">NIP: {klient.companyData.nip}</div>
    )}
  </div>
)}
```

**Efekt:**
- ✅ Badge "Firma" dla `clientType === 'company'`
- ✅ Nazwa firmy nad imieniem osoby kontaktowej
- ✅ NIP w małej czcionce

### **4. Dodatkowe Badge'y**

```jsx
{/* Typ klienta */}
{klient.clientType && (
  <span className={`badge ${
    klient.clientType === 'company' ? 'bg-purple-100' : 'bg-gray-100'
  }`}>
    {klient.clientType === 'company' ? '🏢 Firma' : '👤 Prywatny'}
  </span>
)}

{/* Status */}
{klient.status && (
  <span className={`badge ${
    klient.status === 'active' ? 'bg-green-100' :
    klient.status === 'inactive' ? 'bg-gray-100' :
    'bg-yellow-100'
  }`}>
    {klient.status === 'active' ? '✓ Aktywny' :
     klient.status === 'inactive' ? '○ Nieaktywny' :
     klient.status}
  </span>
)}

{/* Ilość telefonów/adresów */}
{klient.phones && klient.phones.length > 1 && (
  <span className="badge bg-indigo-100">
    📞 {klient.phones.length} tel.
  </span>
)}
{klient.addresses && klient.addresses.length > 1 && (
  <span className="badge bg-teal-100">
    📍 {klient.addresses.length} adr.
  </span>
)}
```

**Efekt:**
- ✅ Badge typu klienta (Firma/Prywatny)
- ✅ Badge statusu (Aktywny/Nieaktywny)
- ✅ Badge ilości telefonów jeśli >1
- ✅ Badge ilości adresów jeśli >1

### **5. Score Dostępności (już było)**

```jsx
{klient.physicalAvailability && klient.physicalAvailability.score !== undefined && (() => {
  const category = getAvailabilityCategory(klient.physicalAvailability.score);
  return (
    <span className={`badge ${category.badgeClass}`}>
      <span>{category.emoji}</span>
      <span>{klient.physicalAvailability.score}</span>
    </span>
  );
})()}
```

---

## 🎬 User Flow

### **Scenariusz 1: Klient Prywatny (domyślny)**

```
1. User otwiera: /admin/rezerwacje/nowa
2. Typ klienta: "👤 Klient prywatny" (ZAZNACZONE domyślnie) ✅
3. Pole "Imię i nazwisko" widoczne
4. Brak sekcji "Dane firmowe"
5. Submit → zapisuje jako clientType: 'private'
```

### **Scenariusz 2: Firma z GUS**

```
1. User wybiera: "🏢 Firma"
2. Pokazuje się sekcja "Dane firmowe" (fioletowe tło)
3. User wpisuje NIP: "1234567890"
4. User klika: "🔍 Pobierz z GUS"
5. Loading: "⏳ Pobieranie..."
6. API zwraca dane:
   ✅ Nazwa firmy: TECHNIK SERWIS SP. Z O.O.
   ✅ Adres: ul. Testowa 15/3
   ✅ Miasto: Warszawa
   ✅ Kod: 00-001
   ✅ REGON: 123456789
   ✅ KRS: 0000123456
7. Formularz automatycznie wypełniony
8. Alert: "✅ Dane firmy pobrane z GUS"
9. Submit → zapisuje companyData
```

### **Scenariusz 3: Firma - dane ręczne**

```
1. User wybiera: "🏢 Firma"
2. User wpisuje NIP: "9999999999"
3. User klika: "🔍 Pobierz z GUS"
4. API zwraca 404
5. Alert: "❌ Nie znaleziono firmy o NIP: 9999999999
          Sprawdź NIP lub dodaj dane ręcznie."
6. User wypełnia pola ręcznie:
   - Nazwa firmy: WŁASNA FIRMA
   - REGON, KRS (opcjonalne)
7. Submit → zapisuje companyData
```

### **Scenariusz 4: Lista klientów**

```
1. User otwiera: /admin/klienci
2. Widzi kartę klienta firmowego:
   
   ┌─────────────────────────────────┐
   │ Jan Kowalski         [🏢 Firma] │
   │ TECHNIK SERWIS SP. Z O.O.       │
   │ NIP: 1234567890                 │
   │ ID: CLI2025000123               │
   ├─────────────────────────────────┤
   │ 📞 123456789        [Główny]    │
   │ 📞 987654321        (Służbowy)  │
   │ ✉️ jan@technik.pl               │
   │ 📍 ul. Testowa 15/3             │
   │    00-001 Warszawa   [Główny]   │
   │ 📍 ul. Inna 5                   │
   │    50-001 Wrocław    (Magazyn)  │
   │ 📅 04.10.2025                   │
   ├─────────────────────────────────┤
   │ [🏢 Firma] [Aktywny] [⭐ 85]    │
   │ [📞 2 tel.] [📍 2 adr.]         │
   ├─────────────────────────────────┤
   │ [Zobacz] [Edytuj] [🗑️]          │
   └─────────────────────────────────┘
```

---

## 📊 Struktura Danych

### **Client Object (extended):**

```json
{
  "id": "1",
  "clientId": "CLI2025000123",
  "name": "Jan Kowalski",
  "email": "jan@technik.pl",
  "clientType": "company",
  "companyData": {
    "nip": "1234567890",
    "name": "TECHNIK SERWIS SP. Z O.O.",
    "regon": "123456789",
    "krs": "0000123456",
    "address": "ul. Testowa 15/3",
    "city": "Warszawa",
    "postalCode": "00-001"
  },
  "phones": [
    { "number": "123456789", "label": "Główny", "isPrimary": true },
    { "number": "987654321", "label": "Służbowy", "isPrimary": false }
  ],
  "addresses": [
    { 
      "street": "ul. Testowa 15/3", 
      "city": "Warszawa", 
      "postalCode": "00-001", 
      "label": "Główny", 
      "isPrimary": true 
    },
    { 
      "street": "ul. Inna 5", 
      "city": "Wrocław", 
      "postalCode": "50-001", 
      "label": "Magazyn", 
      "isPrimary": false 
    }
  ],
  "physicalAvailability": {
    "score": 85,
    "category": "high"
  },
  "status": "active",
  "source": "admin",
  "createdAt": "2025-10-04T12:00:00Z"
}
```

### **Backward Compatibility:**

Klienci bez nowej struktury (stare dane) nadal działają:
```json
{
  "id": "OLD123",
  "name": "Anna Nowak",
  "phone": "555666777",
  "email": "anna@email.pl",
  "city": "Kraków"
}
```

System wyświetli:
- `phone` jako jedyny telefon
- `city` jako jedyny adres
- Brak badge'y firmy (domyślnie prywatny)

---

## 🧪 Testowanie

### **Test 1: Formularz - Prywatny (domyślny)**
```
1. /admin/rezerwacje/nowa
2. ✅ Radio "Prywatny" zaznaczone domyślnie
3. ✅ Brak sekcji "Dane firmowe"
4. Wypełnij: Jan Kowalski, tel, adres
5. Submit
6. ✅ Zapisane: clientType: 'private', companyData: null
```

### **Test 2: Formularz - Firma z GUS**
```
1. Kliknij "🏢 Firma"
2. ✅ Pojawiła się fioletowa sekcja "Dane firmowe"
3. NIP: 1234567890
4. Kliknij "Pobierz z GUS"
5. ✅ Loading: "⏳ Pobieranie..."
6. ✅ Alert: "Dane firmy pobrane z GUS"
7. ✅ Pola wypełnione: TECHNIK SERWIS SP. Z O.O.
8. ✅ Adres w formularzu też wypełniony
9. Submit
10. ✅ Zapisane: clientType: 'company', companyData: {...}
```

### **Test 3: API GUS**
```powershell
# Test 1: Sukces
curl "http://localhost:3000/api/gus?nip=1234567890" | ConvertFrom-Json
# ✅ success: true, company: {...}

# Test 2: Not found
curl "http://localhost:3000/api/gus?nip=9999999999" | ConvertFrom-Json
# ✅ success: false, message: "Nie znaleziono..."

# Test 3: Nieprawidłowy NIP
curl "http://localhost:3000/api/gus?nip=123" | ConvertFrom-Json
# ✅ 400: "Nieprawidłowy NIP"
```

### **Test 4: Lista klientów**
```
1. /admin/klienci
2. Znajdź klienta firmowego
3. ✅ Badge "🏢 Firma"
4. ✅ Nazwa firmy nad imieniem
5. ✅ NIP widoczny
6. ✅ Wszystkie telefony wyświetlone (nie tylko 1)
7. ✅ Wszystkie adresy wyświetlone
8. ✅ Badge "📞 2 tel." jeśli >1
9. ✅ Badge "📍 2 adr." jeśli >1
```

### **Test 5: Backward compatibility**
```
1. Otwórz starą kartę klienta (bez phones[], addresses[])
2. ✅ Wyświetla się phone jako jedyny telefon
3. ✅ Wyświetla się city jako jedyny adres
4. ✅ Brak błędów w konsoli
```

---

## 📝 Pliki Zmienione

### **Modified:**
1. `pages/admin/rezerwacje/nowa.js` - formularz z wyborem Firma/Prywatny
2. `pages/admin/klienci/index.js` - poprawione wyświetlanie telefonów/adresów/firmy

### **Created:**
3. `pages/api/gus.js` - mock API GUS (TODO: integracja z prawdziwym)

### **Documentation:**
4. `CLIENT_COMPANY_GUS_INTEGRATION.md` ← TEN PLIK

---

## 🚀 Przyszłe Rozszerzenia

### **Faza 2:**
1. **Prawdziwe API GUS** - zamień mock na https://wl-api.mf.gov.pl/
2. **Cache** - zapisuj odpowiedzi GUS w Redis/localStorage (rate limiting)
3. **REGON validator** - weryfikuj poprawność REGON
4. **KRS lookup** - pobieraj dodatkowe dane z KRS

### **Faza 3:**
5. **Faktury VAT** - generuj faktury dla klientów firmowych
6. **Raport firmowy** - statystyki: ile firm, jakie branże
7. **Ulgi dla firm** - różne ceny dla firm vs prywatni
8. **Historia zamówień firmy** - grupowanie po NIP

---

## ✅ Podsumowanie

### **Co zostało naprawione:**

**Formularz rezerwacji:**
- ✅ Dodano wybór Firma/Prywatny (domyślnie Prywatny)
- ✅ Sekcja "Dane firmowe" dla firm (NIP, nazwa, REGON, KRS)
- ✅ Przycisk "Pobierz z GUS" - automatyczne wypełnianie
- ✅ Mock API `/api/gus` (3 testowe firmy)
- ✅ Submit zapisuje `clientType` i `companyData`

**Lista klientów:**
- ✅ Wyświetlanie **wszystkich** telefonów z `phones[]`
- ✅ Wyświetlanie **wszystkich** adresów z `addresses[]`
- ✅ Badge "Główny" dla primary phone/address
- ✅ Labele telefon/adres "(Służbowy)", "(Magazyn)"
- ✅ Wyświetlanie danych firmy (nazwa, NIP)
- ✅ Badge "🏢 Firma" / "👤 Prywatny"
- ✅ Badge statusu (Aktywny/Nieaktywny)
- ✅ Badge ilości telefonów/adresów jeśli >1
- ✅ Score dostępności (już był)
- ✅ Backward compatible (stare dane działają)

**Status:** ✅ **GOTOWE do testowania!**

---

**Data:** 2025-10-04  
**Wersja:** 1.0  
**Autor:** AI + Developer
