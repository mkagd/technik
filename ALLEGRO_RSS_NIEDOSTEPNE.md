# 🚨 Allegro RSS - Niedostępne

**Data:** 11 października 2025  
**Status:** ❌ Nie działa

## Problem

Allegro **wyłączyło publiczny dostęp do RSS**. Wcześniej dostępny endpoint:

```
https://allegro.pl/rss.php/search?string=ZAPYTANIE
```

Teraz zwraca **404 Not Found** lub **403 Forbidden**.

## Co to oznacza?

**Nie ma obejścia.** Allegro wymaga teraz:

1. ✅ **Rejestracji aplikacji** na https://apps.developer.allegro.pl/
2. ✅ **OAuth 2.0 Authorization** - użytkownik musi zalogować się i autoryzować aplikację
3. ✅ **Używania API REST** zamiast RSS

## Dostępne rozwiązania

### ✅ 1. OAuth API (ZALECANE)

**Status:** ✅ **Zaimplementowane i działające**

**Co działa:**
- OAuth 2.0 Authorization Code Flow ✅
- Wyszukiwanie własnych ofert (`/sale/offers`) ✅
- Token management (12h ważności) ✅
- Automatyczne odświeżanie tokenów ✅

**Co NIE działa bez weryfikacji:**
- ❌ Wyszukiwanie WSZYSTKICH ofert (`/offers/listing`)
- ❌ Publiczne przeglądanie ofert
- ❌ Filtrowanie po cenach w publicznym wyszukiwaniu

**Jak używać:**
1. Przejdź do https://apps.developer.allegro.pl/
2. Zarejestruj aplikację
3. Pobierz **Client ID** i **Client Secret**
4. W aplikacji: `/admin/allegro/settings` → wprowadź dane
5. Kliknij "Połącz z Allegro" → autoryzuj
6. Gotowe! (ale tylko własne oferty, chyba że zweryfikujesz aplikację)

### ⚠️ 2. Weryfikacja aplikacji (dla pełnego dostępu)

**Czas:** 1-3 dni robocze  
**Wymóg:** Aplikacja musi mieć prawdziwą funkcjonalność

**Co daje:**
- ✅ Dostęp do `/offers/listing` - WSZYSTKIE oferty
- ✅ Publiczne wyszukiwanie
- ✅ Filtry cenowe
- ✅ Sortowanie wyników
- ✅ Pełne API Allegro

**Proces weryfikacji:**
1. Zaloguj się na https://apps.developer.allegro.pl/
2. Znajdź swoją aplikację
3. Wypełnij formularz:
   - **Nazwa:** Technik - System Zarządzania
   - **Opis:** System zarządzania warsztatem serwisowym z funkcją wyszukiwania części zamiennych na Allegro dla klientów.
   - **Cel:** Umożliwienie serwisantom szybkiego znajdowania i porównywania cen części podczas obsługi zleceń klientów.
   - **Funkcje:** Wyszukiwanie ofert, filtrowanie po cenie, integracja z systemem zarządzania zleceniami.
4. Prześlij formularz
5. Czekaj 1-3 dni na odpowiedź
6. Po zatwierdzeniu - kod automatycznie zacznie działać!

### ❌ 3. Web Scraping

**Status:** ❌ **NIE ZALECANE**

**Dlaczego NIE:**
- 🚫 Łamie regulamin Allegro
- 🚫 Aplikacja może zostać zablokowana
- 🚫 Allegro używa zabezpieczeń anty-scraping (CAPTCHA, rate limiting)
- 🚫 Kod HTML często się zmienia
- 🚫 Wydajność bardzo niska

**Jeśli musisz:**
- Użyj Puppeteer/Playwright
- Dodaj losowe opóźnienia (2-5 sekund między requestami)
- Rotacja User-Agent
- Proxy rotation
- Maksymalnie 1 request na 3 sekundy
- Ryzyko blokady IP

## Obecny stan kodu

### ✅ Co działa

**Plik: `pages/api/allegro/search.js`**
- OAuth API z tokenem
- Endpoint: `/sale/offers` (własne oferty)
- Zwraca dane w formacie JSON
- Obsługa błędów 403/404

**Plik: `lib/allegro-oauth.js`**
- 5 funkcji OAuth 2.0
- Token cache
- Auto-refresh
- Error handling

**Plik: `pages/admin/allegro/settings.js`**
- UI konfiguracji
- Przyciski autoryzacji
- Test połączenia
- Instrukcje setup

### ❌ Co zostało wyłączone

**Plik: `pages/api/allegro/search-rss.js`**
- RSS parsing - NIEAKTYWNY
- Zwraca błąd 503 z komunikatem
- Kod zachowany jako komentarz (na wypadek gdyby Allegro przywróciło RSS)

## Dla użytkownika końcowego

### Ty (użytkownik bez ofert do sprzedaży):

**Problem:**
> "ja nie mam nci do sprzedazy w allegro"

Endpoint `/sale/offers` zwraca **puste wyniki**, bo:
- Ten endpoint pokazuje TYLKO Twoje własne oferty
- Ty nie masz ofert na Allegro
- Chcesz wyszukiwać oferty INNYCH sprzedawców

**Rozwiązanie:**
1. **Zweryfikuj aplikację** (1-3 dni) - JEDYNA OPCJA
2. Po weryfikacji kod automatycznie zacznie pokazywać WSZYSTKIE oferty
3. Nie trzeba nic zmieniać w kodzie

**Alternatywa (tymczasowa):**
- Używaj wyszukiwarki Allegro ręcznie w przeglądarce
- Kopiuj linki do ofert
- Czekaj na weryfikację

## Podsumowanie

| Metoda | Status | Wymóg | Czas | Dostęp |
|--------|--------|-------|------|--------|
| **RSS** | ❌ Wyłączone | Brak | - | - |
| **OAuth + weryfikacja** | ✅ DZIAŁA | Formularz | 1-3 dni | WSZYSTKIE oferty |
| **OAuth bez weryfikacji** | ⚠️ Ograniczone | Rejestracja | 10 min | TYLKO własne oferty |
| **Web scraping** | 🚫 Ryzykowne | Proxy + delays | 2 godz | Niestabilny |

## Zalecenie

✅ **ZWERYFIKUJ APLIKACJĘ**

To jedyne stabilne i zgodne z regulaminem rozwiązanie, które da Ci dostęp do wszystkich ofert Allegro.

---

**Pytania?**
- Email: developer@allegro.pl
- Dokumentacja: https://developer.allegro.pl/tutorials/
- FAQ: https://developer.allegro.pl/faq
