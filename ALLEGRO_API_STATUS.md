# Status Integracji Allegro API

## 📊 Obecny Stan: ✅ FULL OAuth 2.0 + SANDBOX SUPPORT

### 🎉 Co jest gotowe
- ✅ **Full OAuth 2.0** - kompletna implementacja
- ✅ **Sandbox Mode** - środowisko testowe
- ✅ **Production Mode** - prawdziwe API
- ✅ **Auto token management** - cache 12h + refresh
- ✅ **UI konfiguracji** - łatwa zmiana trybu
- ✅ **Demo mode** - fallback gdy nie skonfigurowane

## 🎯 Jak Włączyć Prawdziwe API (KROK PO KROKU)

### ✅ OAuth już zaimplementowane! Masz 2 opcje:

---

## 🧪 OPCJA A: SANDBOX (Testowanie) - ZALECANE NA START

**Najlepsze dla:** Nauki, testów, prototypów

**Krok 1: Zarejestruj aplikację Sandbox (10 min)**

1. Przejdź na: **https://apps.developer.allegro.pl.allegrosandbox.pl/**
2. Zaloguj się (możesz stworzyć testowe konto)
3. Kliknij **"Dodaj nową aplikację"**
4. Wypełnij:
   - Nazwa: `Test AGD` (dowolna)
   - Redirect URI: `http://localhost:3000/api/allegro/callback`
   - Zakres: zaznacz wszystko do testów
5. **Skopiuj Client ID i Client Secret**

**Krok 2: Skonfiguruj w aplikacji (2 min)**

1. Otwórz: **Admin → Allegro → ⚙️ Ustawienia**
2. ✅ **Zaznacz** checkbox **"🧪 Używaj Sandbox"**
3. Wklej **Client ID** i **Client Secret** z Sandbox
4. Kliknij **"💾 Zapisz"**
5. Kliknij **"🔍 Testuj"** - powinno być ✅
6. Gotowe! Zobacz badge **"🧪 SANDBOX"** w prawym rogu

**Czas:** ~15 minut | **Koszt:** DARMOWE

📖 **Szczegółowy przewodnik:** `ALLEGRO_SANDBOX_GUIDE.md`

---

## 🚀 OPCJA B: PRODUKCJA (Prawdziwe oferty)

**Najlepsze dla:** Wdrożenia, prawdziwe wyszukiwanie

**Krok 1: Zarejestruj aplikację Production (15-30 min)**

1. Przejdź na: **https://apps.developer.allegro.pl/**
2. Zaloguj się na swoje konto Allegro
3. Kliknij **"Utwórz nową aplikację"**
4. Wybierz typ: **"REST API"**
5. Podaj nazwę: `Serwis AGD Manager` (lub dowolną)
6. W polu **Redirect URI** wpisz: `http://localhost:3000/api/allegro/callback`
7. Zaakceptuj regulamin i zapisz
8. **Skopiuj Client ID i Client Secret**

**UWAGA:** Produkcja może wymagać weryfikacji biznesowej!

**Krok 2: Skonfiguruj w aplikacji (2 min)**

1. Otwórz: **Admin → Allegro → ⚙️ Ustawienia**
2. ❌ **Odznacz** checkbox **"🧪 Używaj Sandbox"**
3. Wklej **Client ID** i **Client Secret** z Production
4. Kliknij **"💾 Zapisz"**
5. Kliknij **"🔍 Testuj"** - powinno być ✅
6. Badge **"🧪 SANDBOX"** powinien zniknąć - jesteś LIVE!

**Czas:** ~20-40 minut | **Koszt:** DARMOWE

---

## 🔄 Przełączanie między Sandbox a Production

**To proste!** W ustawieniach:
- ✅ Checkbox zaznaczony = **Sandbox** (testowe dane)
- ❌ Checkbox odznaczony = **Production** (prawdziwe oferty)

System automatycznie przełącza URL-e i używa odpowiednich credentials!

---

## 📁 Zaimplementowane Pliki

```
✅ lib/allegro-oauth.js              - Token manager (cache, refresh, dual-mode)
✅ pages/api/allegro/search.js       - Wyszukiwanie z OAuth (Sandbox/Production)
✅ pages/api/allegro/config.js       - Zapisz/odczytaj konfigurację + sandbox flag
✅ pages/api/allegro/test.js         - Test połączenia
✅ pages/api/allegro/clear-cache.js  - Wyczyść cache tokenów
✅ pages/admin/allegro/settings.js   - UI konfiguracji + checkbox Sandbox
✅ pages/admin/allegro/search.js     - Wyszukiwarka + badge "🧪 SANDBOX"
✅ .env.local                        - Template z Sandbox config
```

**System automatycznie:**
- ✅ Pobiera token OAuth przy pierwszym użyciu
- ✅ Cachuje token na 12 godzin
- ✅ Automatycznie odświeża gdy wygasa
- ✅ Przełącza się między DEMO / Sandbox / Production
- ✅ Używa właściwych URL-i w zależności od trybu:
  - **Sandbox:** `api.allegro.pl.allegrosandbox.pl`
  - **Production:** `api.allegro.pl`
- ✅ Pokazuje badge gdy Sandbox aktywny
- ✅ Loguje tryb w konsoli

### ✅ Co Działa
- ✅ Pełny interfejs użytkownika
- ✅ System filtrów (cena, darmowa dostawa, sortowanie)
- ✅ Multi-select z checkboxami
- ✅ Porównanie z lokalnymi częściami
- ✅ Generator listy zakupów
- ✅ **DEMO MODE z przykładowymi danymi**

### 🎯 Demo Mode
Obecnie system działa w trybie DEMO z przykładowymi danymi. Pokazuje jak będzie działał interfejs, ale wyniki są statyczne.

**Przykładowe części w demo:**
- Paski napędowe (HTD, klinowe, 1192 J5)
- Filtry HEPA Dyson
- Pompy odpływowe
- Termostaty do lodówek
- Grzałki do zmywarek
- Elektrozawory

System inteligentnie dopasowuje wyniki do zapytania wyszukiwania i filtrów cenowych.

---

## 🔧 Opcje Implementacji Prawdziwego API

### Opcja A: OAuth 2.0 (Oficjalna) ⭐ ZALECANE
**Opis:** Pełna integracja z Allegro REST API używając OAuth 2.0

**Kroki:**
1. **Rejestracja aplikacji**
   - Przejdź na: https://apps.developer.allegro.pl/
   - Utwórz nową aplikację
   - Pobierz: `Client ID` i `Client Secret`

2. **Implementacja OAuth Flow**
   ```javascript
   // /api/allegro/auth/token.js
   const getAccessToken = async () => {
     const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
     
     const response = await fetch('https://allegro.pl/auth/oauth/token', {
       method: 'POST',
       headers: {
         'Authorization': `Basic ${auth}`,
         'Content-Type': 'application/x-www-form-urlencoded',
       },
       body: 'grant_type=client_credentials',
     });
     
     const data = await response.json();
     return data.access_token;
   };
   ```

3. **Użycie tokenu w wyszukiwaniu**
   ```javascript
   const token = await getAccessToken();
   
   const response = await axios.get('https://api.allegro.pl/offers/listing', {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Accept': 'application/vnd.allegro.public.v1+json',
     },
     params: searchParams,
   });
   ```

4. **Cache tokenu**
   - Token OAuth ważny jest przez 12 godzin
   - Przechowuj w bazie danych lub Redis
   - Automatyczne odświeżanie przed wygaśnięciem

**Czas implementacji:** 2-3 godziny

**Plusy:**
- ✅ Oficjalne API - stabilne i wspierane
- ✅ Pełen dostęp do wszystkich funkcji
- ✅ Prawidłowe dane produktów
- ✅ Zgodne z regulaminem Allegro
- ✅ Dostęp do cen, zdjęć, opisów
- ✅ Możliwość rozbudowy (składanie zamówień w przyszłości)

**Minusy:**
- ❌ Wymaga rejestracji aplikacji (weryfikacja biznesowa)
- ❌ Trochę więcej kodu do napisania
- ❌ Trzeba zarządzać tokenami

---

### Opcja B: Web Scraping ⚠️ RYZYKOWNE
**Opis:** Pobieranie danych bezpośrednio ze strony allegro.pl

**Implementacja:**
```javascript
import puppeteer from 'puppeteer';

const scrapeAllegro = async (query) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(`https://allegro.pl/listing?string=${encodeURIComponent(query)}`);
  
  const results = await page.$$eval('.opbox-listing', (elements) => {
    return elements.map(el => ({
      name: el.querySelector('.m9qz_yp').textContent,
      price: el.querySelector('.mqu1_gl').textContent,
      url: el.querySelector('a').href,
      // ...
    }));
  });
  
  await browser.close();
  return results;
};
```

**Plusy:**
- ✅ Nie wymaga rejestracji
- ✅ Działa natychmiast
- ✅ Pełne dane produktów

**Minusy:**
- ❌ **Złamanie regulaminu Allegro**
- ❌ Ryzyko blokady IP
- ❌ Wolne (Puppeteer uruchamia przeglądarkę)
- ❌ Łamliwe - zmiana HTML łamie kod
- ❌ Zużywa dużo zasobów serwera

**Nie zalecane dla produkcji!**

---

### Opcja C: Proste Przekierowanie ✅ NAJPROSTSZE
**Opis:** Nie pobieraj danych - otwórz Allegro w nowej karcie

**Implementacja:**
```javascript
const searchOnAllegro = () => {
  const url = new URLSearchParams({
    string: searchQuery,
    'price_from': minPrice,
    'price_to': maxPrice,
    order: 'p', // sortowanie po cenie
  });
  
  window.open(`https://allegro.pl/listing?${url}`, '_blank');
};
```

**Plusy:**
- ✅ Zero konfiguracji
- ✅ Działa natychmiast
- ✅ Zgodne z regulaminem
- ✅ Użytkownik widzi aktualne oferty

**Minusy:**
- ❌ Użytkownik opuszcza aplikację
- ❌ Brak listy zakupów
- ❌ Brak porównania z lokalnym magazynem
- ❌ Mniej zintegrowane UX

---

### Opcja D: Alternatywne API
**Możliwe źródła:**

1. **Ceneo API**
   - Agregator cen z wielu sklepów
   - Sprawdź: https://www.ceneo.pl/Developers
   
2. **Google Shopping API**
   - Globalny zakres
   - Może mieć polskie oferty

3. **Własna baza dostawców**
   - Kontakt bezpośrednio z hurtowniami AGD
   - Negocjuj API dostęp lub pliki CSV

---

## 🎯 Rekomendacja

### Dla szybkiego prototypu:
**Opcja C (Przekierowanie)** - 5 minut implementacji

### Dla produkcji:
**Opcja A (OAuth 2.0)** - 2-3 godziny, ale profesjonalne rozwiązanie

---

## 📝 Następne Kroki

### Jeśli wybierzesz OAuth (Opcja A):

1. **Dzisiaj (30 min):**
   - Zarejestruj aplikację na https://apps.developer.allegro.pl/
   - Pobierz Client ID i Secret
   
2. **Jutro (2h):**
   - Implementuj `/api/allegro/auth/token.js`
   - Dodaj cache tokenu do bazy
   - Zmodyfikuj `/api/allegro/search.js` aby używał tokenu
   
3. **Testowanie (30 min):**
   - Sprawdź wyszukiwanie
   - Zweryfikuj dane produktów
   - Przetestuj filtry

**Całkowity czas:** ~3 godziny pracy

---

## 🔗 Przydatne Linki

- **Allegro Developer Portal:** https://developer.allegro.pl/
- **API Documentation:** https://developer.allegro.pl/documentation/
- **OAuth Guide:** https://developer.allegro.pl/auth/
- **REST API Reference:** https://developer.allegro.pl/en/rest-api/
- **Sandbox Environment:** https://developer.allegro.pl.allegrosandbox.pl/

---

## 💰 Koszty

### Allegro REST API:
- **Wyszukiwanie:** DARMOWE ✅
- **OAuth Client Credentials:** DARMOWE ✅
- **Limit zapytań:** 9000/min (bardzo wysoki) ✅
- **Składanie zamówień:** Tylko dla kont Business (wymaga weryfikacji)

**Podsumowanie:** Wyszukiwanie i przeglądanie ofert jest całkowicie darmowe!

---

## ❓ FAQ

**Q: Czy muszę płacić za API?**
A: NIE. Wyszukiwanie jest darmowe. Płacisz tylko gdy kupujesz produkty.

**Q: Ile czasu zajmie OAuth?**
A: Rejestracja: 30 min, Implementacja: 2h, Testowanie: 30 min = **3 godziny**

**Q: Czy demo mode wystarczy na prezentację?**
A: TAK! Demo pokazuje interfejs i wszystkie funkcje.

**Q: Czy mogę używać scrapingu?**
A: NIE zalecane - przeciwko regulaminowi Allegro.

**Q: Które rozwiązanie wybrać?**
A: Dla produkcji: **OAuth (Opcja A)**. Dla szybkiej prezentacji: **Demo mode**.

---

## 🚀 Status Obecny

```
┌──────────────────────────────────────────────┐
│  ✅ UI: 100% Gotowe                          │
│  ✅ Filtry: 100% Gotowe                      │
│  ✅ Multi-select: 100% Gotowe                │
│  ✅ Lista zakupów: 100% Gotowe               │
│  ✅ OAuth 2.0: 100% ZAIMPLEMENTOWANE         │
│  ✅ Sandbox Support: 100% GOTOWE             │
│  ✅ Production Support: 100% GOTOWE          │
│  ✅ Auto Token Management: DZIAŁA            │
│  ✅ Demo Mode Fallback: DZIAŁA               │
└──────────────────────────────────────────────┘
```

**System jest w pełni gotowy!**

**Użytkownik musi tylko:**
1. Zarejestrować aplikację (Sandbox lub Production)
2. Wkleić Client ID i Secret w ustawieniach
3. Kliknąć "Testuj połączenie"
4. Gotowe! 🎉

**Tryby działania:**
- 🧪 **Sandbox** - gdy zaznaczony checkbox (testowe dane Allegro)
- 🚀 **Production** - gdy odznaczony (prawdziwe oferty Allegro)
- 🎭 **Demo** - gdy nie skonfigurowane (przykładowe dane z kodu)
