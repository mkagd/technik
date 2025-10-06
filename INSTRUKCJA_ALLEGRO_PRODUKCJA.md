# 🚀 Instrukcja: Przejście na Produkcyjne Allegro API

## Obecny stan: SANDBOX (testowe środowisko)

Obecnie Twoja aplikacja używa **Allegro Sandbox** - testowego środowiska z ograniczonymi danymi.

---

## Krok 1: Załóż Konto Deweloperskie na Allegro (Produkcja)

### 1.1 Przejdź do panelu deweloperskiego
```
https://apps.developer.allegro.pl/
```

### 1.2 Zaloguj się na swoje prawdziwe konto Allegro
- Użyj konta firmowego/głównego
- To konto będzie właścicielem aplikacji

### 1.3 Utwórz nową aplikację
1. Kliknij **"Nowa aplikacja"**
2. Wypełnij formularz:
   - **Nazwa aplikacji**: "TechSerwis - System Zarządzania"
   - **Opis**: "System zarządzania serwisem AGD z integracją wyszukiwania części na Allegro"
   - **Redirect URI**: `http://localhost:3000/api/allegro/callback` (jeśli będziesz używać OAuth User)
   - **Typ aplikacji**: "Backend API" lub "Web Application"

### 1.4 Wybierz uprawnienia (Scopes)
Dla wyszukiwania części potrzebujesz **MINIMALNYCH** uprawnień:
- ✅ `allegro:api:listing:read` - czytanie ofert
- ✅ `allegro:api:categories:read` - czytanie kategorii

❌ NIE potrzebujesz:
- `allegro:api:orders` - zarządzanie zamówieniami
- `allegro:api:profile` - profil użytkownika
- `allegro:api:sale` - sprzedaż

### 1.5 Poczekaj na akceptację
⏱️ **Allegro może sprawdzić aplikację (2-7 dni)**
- Sprawdzą czy aplikacja jest legalna
- Mogą poprosić o więcej informacji
- Po akceptacji otrzymasz kredencjały produkcyjne

---

## Krok 2: Otrzymasz Nowe Kredencjały

Po akceptacji aplikacji otrzymasz:

```
Client ID (produkcja): XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Client Secret (produkcja): YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

⚠️ **UWAGA:** To będą **INNE** niż Sandbox!

---

## Krok 3: Skonfiguruj Aplikację na Produkcję

### Opcja A: Przez Panel Webowy (ŁATWIEJSZE)

1. Przejdź do: `http://localhost:3000/admin/allegro/settings`

2. Zmień ustawienia:
   - **Client ID**: (wklej nowy produkcyjny Client ID)
   - **Client Secret**: (wklej nowy produkcyjny Client Secret)
   - **Tryb Sandbox**: ❌ ODZNACZ (wyłącz)
   
3. Kliknij **"Zapisz konfigurację"**

4. Kliknij **"Testuj połączenie"** - powinno pokazać:
   ```
   ✅ Połączenie udane! (Tryb: Produkcja)
   ```

### Opcja B: Ręcznie w Pliku

Edytuj plik: `data/allegro-config.json`

```json
{
  "clientId": "TWÓJ_NOWY_PRODUKCYJNY_CLIENT_ID",
  "clientSecret": "TWÓJ_NOWY_PRODUKCYJNY_CLIENT_SECRET",
  "sandbox": false
}
```

⚠️ **WAŻNE:** Zmień `"sandbox": false` ← to przełącza na produkcję!

---

## Krok 4: Wyczyść Cache i Przetestuj

### 4.1 Wyczyść stary token Sandbox
```powershell
# W PowerShell (w folderze projektu):
Remove-Item "data/allegro-token.json" -ErrorAction SilentlyContinue
```

### 4.2 Zrestartuj serwer
```powershell
# Zatrzymaj serwer (Ctrl+C w terminalu)
# Uruchom ponownie:
npm run dev
```

### 4.3 Przetestuj wyszukiwanie
1. Przejdź do: `http://localhost:3000/admin/magazyn/czesci`
2. Kliknij 🛒 przy dowolnej części
3. Sprawdź czy wyniki są **prawdziwe** (więcej ofert, aktualne ceny)

---

## Krok 5: Weryfikacja że Działa na Produkcji

### Sprawdź w konsoli przeglądarki (F12):
```
🔍 Searching Allegro with OAuth (PRODUCTION): {...}
✅ Found XX results from Allegro
```

⚠️ Jeśli widzisz `(SANDBOX)` zamiast `(PRODUCTION)` - sprawdź krok 3!

### Sprawdź w terminalu serwera:
```
🔑 Fetching new Allegro access token... (PRODUCTION)
✅ New access token obtained successfully
```

---

## ⚠️ Najczęstsze Problemy

### Problem 1: "OAuth failed (401)"
**Przyczyna:** Złe kredencjały lub nie zaakceptowana aplikacja

**Rozwiązanie:**
1. Sprawdź czy Client ID i Secret są poprawne
2. Sprawdź w panelu Allegro czy aplikacja jest **"Aktywna"**
3. Poczekaj na akceptację (jeśli dopiero założyłeś)

### Problem 2: "Forbidden (403)"
**Przyczyna:** Brak wymaganych uprawnień (scopes)

**Rozwiązanie:**
1. Wróć do panelu Allegro
2. Edytuj aplikację
3. Dodaj scope: `allegro:api:listing:read`

### Problem 3: Nadal pokazuje Sandbox
**Przyczyna:** Cache lub niepoprawna konfiguracja

**Rozwiązanie:**
```powershell
# Usuń cache
Remove-Item "data/allegro-token.json" -Force
Remove-Item ".next" -Recurse -Force

# Zrestartuj
npm run dev
```

---

## 🎯 Zalecenia

### Dla Bezpieczeństwa:
1. ✅ **NIE** commituj `data/allegro-config.json` do Git
2. ✅ Dodaj do `.gitignore`:
   ```
   data/allegro-config.json
   data/allegro-token.json
   ```
3. ✅ Trzymaj Client Secret w tajemnicy

### Dla Stabilności:
1. ✅ Zostaw Sandbox na okres testów (2-3 tygodnie)
2. ✅ Przełącz na produkcję gdy będziesz pewny że wszystko działa
3. ✅ Monitoruj limity API Allegro:
   - Sandbox: **10,000 requestów/dzień**
   - Produkcja: **Zależy od umowy** (zwykle 50,000+)

### Dla Wydajności:
1. ✅ Token cache działa 12h - nie martw się o limity
2. ✅ Każde wyszukiwanie = 1 request do Allegro
3. ✅ Rozważ cache wyników dla popularnych części (przyszłość)

---

## 📊 Porównanie Limitów

| Funkcja | Sandbox | Produkcja |
|---------|---------|-----------|
| Requesty/dzień | 10,000 | 50,000+ |
| Wyniki na zapytanie | Max 100 | Max 1000 |
| Aktualizacje cen | Co 1h | Real-time |
| Wszystkie kategorie | ❌ Ograniczone | ✅ Wszystkie |
| Prawdziwe aukcje | ❌ Testowe | ✅ Tak |

---

## 🚀 Gotowe!

Po wykonaniu tych kroków Twoja aplikacja będzie:
- ✅ Wyszukiwać prawdziwe aukcje Allegro
- ✅ Pokazywać aktualne ceny rynkowe
- ✅ Mieć dostęp do pełnej bazy ofert

---

## 📞 Potrzebujesz Pomocy?

### Allegro Support
- Panel deweloperski: https://apps.developer.allegro.pl/
- Dokumentacja: https://developer.allegro.pl/documentation/
- Forum: https://allegro.pl/dla-sprzedajacych/forum

### Sprawdź Status Aplikacji
```powershell
# Test API (w PowerShell):
Invoke-RestMethod -Uri "http://localhost:3000/api/allegro/test"
```

---

**Data utworzenia:** 2025-10-05  
**Wersja systemu:** TechSerwis v1.0  
**Moduł:** Allegro Integration

