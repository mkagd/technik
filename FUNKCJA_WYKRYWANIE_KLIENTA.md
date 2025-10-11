# 🔍 Funkcja: Automatyczne wykrywanie istniejącego klienta

## 📋 Opis

System automatycznie wykrywa istniejących klientów podczas tworzenia nowego zgłoszenia, aby zapobiec duplikacji danych. Wyszukiwanie odbywa się na dwa sposoby:

1. **Po adresie** - po wprowadzeniu adresu w kroku 1 (główna metoda)
2. **Po telefonie** - podczas wpisywania numeru telefonu w kroku 2 (metoda pomocnicza)

## 🎯 Cel funkcji

**Scenariusz użytkowania:**
> Klient dzwoni telefonicznie, podaje adres i mówi że się zepsuła pralka. Admin wpisuje adres i natychmiast widzi, że ten klient jest już w bazie - może zobaczyć całą historię napraw i dodać nowe zlecenie do tego samego klienta.

**Korzyści:**
- ✅ Brak duplikatów klientów w bazie
- ✅ Historia napraw zawsze przypisana do właściwego klienta
- ✅ Szybsze wprowadzanie zleceń (auto-wypełnianie danych)
- ✅ Obsługa przypadku "żona/mąż dzwoni z innego numeru"

## 🏗️ Architektura

### Backend API

#### 1. `/api/clients/search-by-address.js`
**POST** - Wyszukuje klientów po adresie

**Request:**
```json
{
  "street": "Chotowa 54",
  "city": "Kraków",
  "postalCode": "31-000"
}
```

**Response:**
```json
{
  "success": true,
  "matches": [
    {
      "clientId": "CLI252810003",
      "name": "Jan Kowalski",
      "phone": "123-456-789",
      "email": "jan@example.com",
      "address": "Chotowa 54, 31-000 Kraków",
      "orderCount": 3,
      "lastOrderDate": "2025-09-15T10:00:00.000Z",
      "orders": [
        {
          "orderId": "ORD123",
          "orderNumber": "25/09/001",
          "date": "2025-09-15",
          "deviceType": "Pralka",
          "deviceBrand": "Samsung",
          "problem": "Nie wiruje",
          "status": "completed"
        }
      ],
      "matchScore": 1.0,
      "matchReason": "Exact address match"
    }
  ],
  "totalMatches": 1
}
```

**Algorytm dopasowania:**
- Normalizacja adresu (usunięcie "ul.", "ul ", lowercase, trim)
- Porównanie ulicy i miasta
- Opcjonalnie kod pocztowy
- Zwraca score 0-1 (fuzzy matching)
- Filtruje wyniki z score < 0.7

**Funkcje:**
- `normalizeAddress(address)` - czyści adres do porównania
- `calculateAddressScore(addr1, addr2)` - oblicza podobieństwo 0-1
- `extractClientsFromOrders(orders)` - ekstrahuje unikalne dane klientów

#### 2. `/api/clients/search-by-phone.js`
**POST** - Wyszukuje klientów po numerze telefonu

**Request:**
```json
{
  "phone": "123456789"
}
```

**Response:**
- Identyczna struktura jak search-by-address
- Exact match po normalizacji numeru

**Algorytm normalizacji:**
```
"123-456-789" → "123456789"
"+48 123 456 789" → "123456789"
"0048123456789" → "123456789"
"0123456789" → "123456789"
```

**Funkcje:**
- `normalizePhone(phone)` - usuwa +48, +, spacje, myślniki, wiodące 0
- `extractClientsFromOrders(orders)` - j.w.

### Frontend

#### Komponent: `ClientMatchModal.js`

**Props:**
```javascript
{
  isOpen: boolean,
  matches: Array<Client>,
  onSelectClient: (client) => void,
  onCreateNew: () => void,
  searchType: 'address' | 'phone'
}
```

**Funkcjonalność:**
- Wyświetla listę znalezionych klientów
- Dla 1 klienta - pokazuje od razu dane
- Dla 2-3 klientów - radio buttons do wyboru
- Pełna historia zleceń z statusami
- Kolorowe badge'e statusów (✅ zakończone, 🕐 w trakcie, ❌ anulowane)
- Przyciski akcji:
  - ✅ "Tak, dodaj zlecenie do tego klienta"
  - 🆕 "To nowy klient"

**UI Design:**
```
┌────────────────────────────────────────────────┐
│ 🔍 Znaleziono klienta pod tym adresem!   [×] │
├────────────────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 👤 Jan Kowalski                            ┃ │
│ ┃ 📞 123-456-789                             ┃ │
│ ┃ 📧 jan.kowalski@email.com                  ┃ │
│ ┃ 📍 Chotowa 54, 31-000 Kraków               ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│ 📋 Historia zleceń (3):                        │
│ • 2025-09-15: Naprawa pralki Samsung ✅       │
│ • 2025-07-10: Wymiana filtra lodówki ✅       │
│ • 2025-03-22: Czyszczenie zmywarki ✅         │
│ [✅ Tak, dodaj zlecenie do tego klienta]      │
│ [🆕 To nowy klient pod tym adresem]           │
└────────────────────────────────────────────────┘
```

#### Integracja w `rezerwacja.js`

**State:**
```javascript
const [showClientModal, setShowClientModal] = useState(false);
const [matchedClients, setMatchedClients] = useState([]);
const [selectedExistingClient, setSelectedExistingClient] = useState(null);
const [searchingClient, setSearchingClient] = useState(false);
const phoneSearchTimeoutRef = useRef(null);
```

**Funkcje:**

1. **`searchClientByAddress()`** - wywołana po kroku 1
   - Zbiera dane: street, city, postalCode
   - POST do `/api/clients/search-by-address`
   - Jeśli znaleziono → pokazuje modal
   - Jeśli nie → normalnie przechodzi dalej

2. **`searchClientByPhone(phone)`** - z debounce 500ms
   - Wywoływana przy onChange w polu telefonu
   - Tylko jeśli phone.length >= 9
   - POST do `/api/clients/search-by-phone`
   - Pokazuje modal jeśli znaleziono

3. **`handleSelectExistingClient(client)`**
   - Auto-wypełnia formularz:
     - name: client.name
     - phone: client.phone (można edytować!)
     - email: client.email
   - Zapisuje `selectedExistingClient` do state
   - Zamyka modal
   - **Przechodzi do kroku 2**

4. **`handleCreateNewClient()`**
   - Czyści `selectedExistingClient`
   - Zamyka modal
   - **Przechodzi do kroku 2**

**Modyfikacja `nextStep()`:**
```javascript
const nextStep = async () => {
    // NOWE: Sprawdź klienta po kroku 1
    if (currentStep === 1) {
        const foundClient = await searchClientByAddress();
        if (foundClient) {
            return; // Zatrzymaj, modal się pojawi
        }
    }
    
    // Normalny flow
    if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
    }
};
```

**Modyfikacja `handleChange()`:**
```javascript
if (name === 'phone' && value.length >= 9) {
    checkExistingAccount(value, 'phone');
    searchClientByPhone(value); // NOWE
}
```

## 🔄 Flow użytkownika

### Scenariusz 1: Znaleziono po adresie

1. Admin wypełnia krok 1 (adres):
   - Kod pocztowy: `31-000`
   - Miasto: `Kraków`
   - Ulica: `Chotowa 54`

2. Klikam "Dalej":
   - Pokazuje spinner: "Sprawdzam bazę..."
   - API szuka w orders.json

3. Znaleziono klienta:
   - Modal się otwiera
   - Pokazuje dane klienta + historię
   - **Opcja A**: Klikam "Tak" → formularz wypełniony, krok 2
   - **Opcja B**: Klikam "To nowy klient" → pusty formularz, krok 2

### Scenariusz 2: Żona/mąż z innym telefonem

1. Admin wpisuje adres → znaleziono Jana Kowalskiego
2. Wybiera "Tak, dodaj zlecenie"
3. W kroku 2 widzi:
   - Imię: `Jan Kowalski` (można zmienić!)
   - Telefon: `123-456-789` (można zmienić!)
   - Email: `jan@example.com` (można zmienić!)

4. Admin zmienia:
   - Imię: `Anna Kowalska`
   - Telefon: `987-654-321`
   - Email pozostaje

5. Zlecenie zostanie dodane do **tego samego klienta** (clientId), ale z nowymi danymi kontaktowymi

### Scenariusz 3: Wyszukiwanie po telefonie

1. Admin pomija krok 1 lub nie znaleziono po adresie
2. W kroku 2 zaczyna wpisywać telefon: `123...`
3. Po 500ms debounce → API sprawdza bazę
4. Znaleziono klienta → modal
5. Dalej jak scenariusz 1

## 📊 Dane techniczne

### Pliki zmienione/utworzone:

**Backend:**
- ✅ `pages/api/clients/search-by-address.js` (265 linii)
- ✅ `pages/api/clients/search-by-phone.js` (138 linii)

**Frontend:**
- ✅ `components/ClientMatchModal.js` (265 linii)
- ✅ `pages/rezerwacja.js` (zmodyfikowany)
  - Import ClientMatchModal
  - 4 nowe state variables
  - 3 nowe funkcje
  - Modyfikacja nextStep()
  - Modyfikacja handleChange()
  - Dodano modal w JSX

### Statystyki:

- **Całkowita liczba linii kodu:** ~670 linii
- **Liczba nowych funkcji:** 7
- **Liczba API endpoints:** 2
- **Liczba komponentów:** 1 nowy

## 🎨 UI/UX Features

### Animacje i feedback:
- ✅ Spinner podczas wyszukiwania: "Sprawdzam bazę..."
- ✅ Modal z animacją fade-in
- ✅ Kolorowe statusy zleceń
- ✅ Hover effects na kartach klientów
- ✅ Radio buttons przy wyborze z listy (jeśli >1 klient)

### Accessibility:
- ✅ Escape zamyka modal
- ✅ Click poza modalem = "To nowy klient"
- ✅ Disabled button podczas wyszukiwania
- ✅ Clear visual hierarchy

### Responsive:
- ✅ Max-width 2xl dla modala
- ✅ Scroll dla długich list zleceń
- ✅ Mobile-friendly (flexbox)

## 🧪 Testowanie

### Test 1: Wyszukiwanie po dokładnym adresie
```
Input: "Chotowa 54", "Kraków", "31-000"
Expected: Znaleziono klienta (exact match, score=1.0)
```

### Test 2: Fuzzy matching adresu
```
Input: "chotowa 54", "krakow" (lowercase, bez kodów)
Expected: Znaleziono klienta (score ≥ 0.7)
```

### Test 3: Wyszukiwanie po telefonie
```
Input: "123-456-789" lub "+48 123 456 789" lub "123456789"
Expected: Znaleziono klienta (wszystkie normalizują się do "123456789")
```

### Test 4: Brak dopasowania
```
Input: Nowy adres "Testowa 999", "Warszawa"
Expected: Brak modala, normalnie przechodzi do kroku 2
```

### Test 5: Wybór z listy (2-3 klientów)
```
Input: Wspólny adres dla 2 klientów
Expected: Modal z radio buttons, można wybrać właściwego
```

### Test 6: Edycja telefonu
```
Action: Wybierz klienta → zmień telefon w kroku 2
Expected: Nowy telefon zapisany, ale clientId ten sam
```

## 🔮 Przyszłe rozszerzenia

### Google Contacts Integration (prepared)
- Endpoint `search-by-phone.js` już gotowy na integrację
- Funkcja `normalizePhone()` uniwersalna
- Można dodać sync z Google Contacts
- Plan: Klient dzwoni → system rozpoznaje z Google

### AI Smart Matching
- Rozpoznawanie podobnych nazw (Jan/Janusz)
- Wykrywanie literówek (Kowlaski/Kowalski)
- Machine learning dla score calculation

### History Analytics
- "Ten klient często dzwoni o tę porę"
- "Ostatnia naprawa < 30 dni - może gwarancja?"
- Sugestie problemów na podstawie historii

## 📝 Status implementacji

✅ **COMPLETED** - 2025-01-XX

**Co działa:**
- ✅ Backend API dla wyszukiwania po adresie
- ✅ Backend API dla wyszukiwania po telefonie
- ✅ Modal z wyborem klienta
- ✅ Auto-wypełnianie formularza
- ✅ Debounce dla telefonu
- ✅ Historia zleceń w modalzie
- ✅ Obsługa multiple matches
- ✅ Przejście do kroku 2 po wyborze

**Gotowe do testowania:**
- Admin może tworzyć nowe zgłoszenie
- System automatycznie wykrywa istniejących klientów
- Można wybrać klienta lub utworzyć nowego
- Dane auto-wypełniają się
- Telefon można edytować (scenariusz żona/mąż)

## 🐛 Known Issues

- Brak na chwilę obecną

## 💡 Tips for Admins

1. **Zawsze sprawdzaj modal** - jeśli się pojawi, to znaczy że klient już istnieje
2. **Możesz zmienić telefon** - system pamięta że to ten sam klient
3. **Historia jest ważna** - zobacz czy nie było podobnego problemu
4. **Kod pocztowy opcjonalny** - ale pomaga w dokładniejszym dopasowaniu

---

**Autor:** GitHub Copilot  
**Data:** 2025-01-XX  
**Wersja:** 1.0  
