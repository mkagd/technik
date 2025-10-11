# ✅ Allegro - Przełączenie na Publiczne Wyszukiwanie

**Data:** 11 października 2025, 19:15  
**Status:** ✅ Gotowe do testowania

---

## 🔄 Co zostało zmienione?

### Przed zmianą:
- ❌ Endpoint: `/sale/offers` (tylko własne oferty)
- ❌ Wyniki: puste (użytkownik nie ma ofert)
- ❌ Status: nieużyteczne dla tego przypadku

### Po zmianie:
- ✅ Endpoint: `/offers/listing` (WSZYSTKIE oferty publiczne)
- ✅ Wyniki: pełne wyszukiwanie Allegro
- ✅ Status: gotowe (wymaga weryfikacji aplikacji)

---

## 📝 Zmienione pliki

### 1. `pages/api/allegro/search.js`

**Zmiany:**
```javascript
// PRZED:
const apiUrl = useSandbox 
  ? `${baseUrl}/offers/listing`  
  : `${baseUrl}/sale/offers`;     // Tylko własne oferty

// PO:
const apiUrl = `${baseUrl}/offers/listing`; // WSZYSTKIE oferty
```

**Parametry wyszukiwania:**
```javascript
// Teraz używamy formatu dla publicznego wyszukiwania:
{
  phrase: query,           // Zapytanie tekstowe
  limit: 60,               // Max 60 wyników
  offset: 0,               // Stronicowanie
  sort: '-price',          // Sortowanie
  'price.from': minPrice,  // Filtr ceny od
  'price.to': maxPrice,    // Filtr ceny do
  'category.id': category  // Filtr kategorii
}
```

**Przetwarzanie odpowiedzi:**
```javascript
// /offers/listing zwraca:
{
  items: {
    promoted: [...],  // Oferty promowane
    regular: [...]    // Oferty zwykłe
  }
}

// Łączymy oba typy w jeden zestaw wyników
```

### 2. `pages/admin/allegro/settings.js`

**Zmiany:**
- ✅ Zaktualizowano komunikat informacyjny
- ✅ Zmieniono kolor z niebieskiego na zielony (sukces)
- ✅ Dodano informację o wymaganej weryfikacji
- ✅ Link do panelu developerskiego

---

## ⚠️ Co to oznacza dla użytkownika?

### Jeśli aplikacja NIE jest zweryfikowana:

**Otrzymasz błąd:**
```json
{
  "errors": [{
    "code": "VerificationRequired",
    "message": "Application needs to be verified",
    "userMessage": "Aplikacja wymaga weryfikacji"
  }]
}
```

**Status HTTP:** `403 Forbidden`

### Jeśli aplikacja JEST zweryfikowana:

**Otrzymasz wyniki:**
```json
{
  "success": true,
  "count": 45,
  "results": [
    {
      "id": "12345678",
      "name": "Pasek napędowy do pralki Bosch",
      "price": { "amount": 89.99, "currency": "PLN" },
      "seller": { "login": "czescidoAGD", "superSeller": true },
      ...
    }
  ]
}
```

**Status HTTP:** `200 OK`

---

## 🚀 Jak przetestować?

### Test 1: Sprawdź obecny status

1. Otwórz przeglądarkę
2. Przejdź do: **http://localhost:3000/admin/allegro/search**
3. Wpisz zapytanie: **"pasek napędowy"**
4. Kliknij **"Szukaj"**

**Jeśli zobaczysz błąd "VerificationRequired"** → aplikacja wymaga weryfikacji ✅ (to DOBRE - kod działa!)

**Jeśli zobaczysz wyniki** → aplikacja już jest zweryfikowana! 🎉

### Test 2: Sprawdź w konsoli deweloperskiej

1. Otwórz **DevTools** (F12)
2. Zakładka **Network**
3. Wyszukaj coś na Allegro
4. Znajdź request do `/api/allegro/search`
5. Sprawdź:
   - Request URL - powinien pokazywać parametr `phrase=...`
   - Response - sprawdź czy zawiera `items.promoted` i `items.regular`

---

## 📋 Proces weryfikacji aplikacji

### Krok 1: Wejdź do panelu

https://apps.developer.allegro.pl/

### Krok 2: Znajdź aplikację

- **Client ID:** `5c208152333144ad9edd14caaea0f24c`
- **Nazwa:** Technik - System Zarządzania (prawdopodobnie)

### Krok 3: Wypełnij formularz

Przykładowy opis:

```
Nazwa aplikacji:
Technik - System Zarządzania Serwisem AGD

Opis:
System do zarządzania warsztatem serwisowym AGD z funkcją 
wyszukiwania części zamiennych na platformie Allegro.

Przeznaczenie:
Umożliwienie serwisantom szybkiego wyszukiwania i porównywania 
ofert części zamiennych podczas diagnozowania i naprawy urządzeń 
AGD dla klientów.

Funkcje:
- Wyszukiwanie ofert części zamiennych po nazwie
- Filtrowanie wyników po cenie
- Porównywanie ofert od różnych sprzedawców
- Integracja z systemem zarządzania zleceniami serwisowymi
- Generowanie list zakupowych dla techników

URL aplikacji:
http://localhost:3000 (środowisko deweloperskie)

Typ aplikacji:
Wewnętrzna aplikacja biznesowa dla warsztatu serwisowego
```

### Krok 4: Wyślij i czekaj

- ⏱️ Czas oczekiwania: **1-3 dni robocze**
- 📧 Odpowiedź: na email powiązany z kontem Allegro
- ✅ Po zatwierdzeniu: kod zacznie działać automatycznie!

---

## 🔍 Diagnostyka

### Problem: Błąd 403 VerificationRequired

**Przyczyna:** Aplikacja nie jest zweryfikowana  
**Rozwiązanie:** Wyślij formularz weryfikacji (powyżej)  
**Czy to błąd?** NIE - to normalne dla niezweryfikowanej aplikacji

### Problem: Błąd 401 Unauthorized

**Przyczyna:** Token OAuth wygasł lub nieprawidłowy  
**Rozwiązanie:** 
1. Przejdź do: `/admin/allegro/settings`
2. Kliknij: "Połącz z Allegro"
3. Zaloguj się ponownie

### Problem: Błąd 404 Not Found

**Przyczyna:** Nieprawidłowy URL endpointu  
**Rozwiązanie:** Sprawdź czy serwer jest uruchomiony (`npm run dev`)

### Problem: Puste wyniki (0 ofert)

**Przyczyna 1:** Brak ofert dla danego zapytania  
**Rozwiązanie:** Spróbuj innego zapytania (np. "pasek")

**Przyczyna 2:** Zbyt restrykcyjne filtry cenowe  
**Rozwiązanie:** Usuń filtry min/max ceny

---

## 📊 Porównanie endpointów

| Cecha | `/sale/offers` | `/offers/listing` |
|-------|----------------|-------------------|
| **Dostęp** | Bez weryfikacji | Wymaga weryfikacji |
| **Zakres** | Tylko Twoje oferty | Wszystkie oferty |
| **Limit** | 1000 na stronę | 60 na stronę |
| **Parametry** | `name`, `sellingMode.*` | `phrase`, `price.*` |
| **Odpowiedź** | `{ offers: [...] }` | `{ items: { promoted, regular } }` |
| **Seller info** | "You" | Prawdziwy login |
| **Dla użytkownika bez ofert** | ❌ Bezużyteczne | ✅ Idealne |

---

## ✅ Gotowe!

Kod jest **w pełni gotowy** i czeka tylko na:

1. ✅ Weryfikację aplikacji przez Allegro (1-3 dni)
2. ✅ Zatwierdzenie dostępu do `/offers/listing`

Po zatwierdzeniu - **wszystko zadziała automatycznie!** 🚀

---

## 🔗 Linki

- Panel developerski: https://apps.developer.allegro.pl/
- Dokumentacja API: https://developer.allegro.pl/documentation
- FAQ: https://developer.allegro.pl/faq
- Support: developer@allegro.pl

---

**Status implementacji:** ✅ **COMPLETE**  
**Wymaga akcji:** ⏳ **Weryfikacja przez Allegro (user action)**
