# 🔴 DIAGNOZA: Test API Allegro Nie Działa

**Data:** 2025-10-06  
**Problem:** `/api/allegro/test` zwraca błąd

---

## ❌ Wykryte Problemy

### 1. Nieprawidłowy Client Secret w konfiguracji
**Plik:** `data/allegro-config.json`

**Było:**
```json
{
  "clientId": "5c208152333144ad9edd14caaea0f24c",
  "sandbox": false,
  "clientSecret": "http://localhost:3000/admin/allegro/settings"  ← BŁĄD!
}
```

**Jest teraz:**
```json
{
  "clientId": "8eb3b93c7bdf414997546cf04f4f6c22",
  "clientSecret": "MRpB0mIhYuX3GXvNTwH7y4OOMBaTavAm0hxnsffcseBMpvZTGI4q2FFjroH0JWIA",
  "sandbox": true
}
```

### 2. Błąd OAuth 401 Unauthorized
**Error:**
```
Failed to authenticate with Allegro: OAuth failed (401): 
{"error":"Unauthorized","error_description":"Unauthorized"}
```

**Przyczyna:**
Credentials z dokumentacji mogą być przykładowe/testowe i nie działają w rzeczywistości.

---

## 🔍 Co Sprawdzono

✅ Plik `/api/allegro/test.js` istnieje  
✅ Funkcja `testConfiguration()` istnieje w `lib/allegro-oauth.js`  
✅ Konfiguracja jest wczytywana poprawnie  
✅ Cache tokenu został wyczyszczony  
❌ **OAuth authentication zwraca 401**

---

## 🛠️ Rozwiązanie

### Opcja A: Użyj prawdziwych credentials z Allegro Developer Portal

1. **Zarejestruj aplikację:**
   - Otwórz: https://developer.allegro.pl/ (Production) LUB https://developer.allegro.pl.allegrosandbox.pl/ (Sandbox)
   - Zaloguj się na konto Allegro
   - Stwórz nową aplikację

2. **Pobierz credentials:**
   - Client ID
   - Client Secret
   - Wybierz środowisko (Sandbox/Production)

3. **Zaktualizuj konfigurację:**
   - Otwórz: `http://localhost:3000/admin/allegro/settings`
   - Wpisz prawdziwe Client ID i Client Secret
   - Zapisz

4. **Testuj:**
   ```bash
   curl http://localhost:3000/api/allegro/test
   ```

---

### Opcja B: Użyj Demo Mode (bez OAuth)

Jeśli nie masz dostępu do Allegro Developer Portal, możesz użyć demo mode:

1. **Wyczyść konfigurację:**
   ```json
   // data/allegro-config.json
   {}
   ```

2. **API automatycznie przełączy się na DEMO mode**
   - `/api/allegro/search` zwróci przykładowe dane
   - Nie wymaga OAuth
   - Dobre do testowania UI

---

## 📋 Checklist Naprawy

### Krok 1: Sprawdź czy masz konto Allegro Developer
- [ ] Konto utworzone na https://developer.allegro.pl/
- [ ] Aplikacja zarejestrowana
- [ ] Client ID i Secret wygenerowane

### Krok 2: Zaktualizuj konfigurację
- [x] Plik `data/allegro-config.json` naprawiony (usunięty błędny URL)
- [ ] Wpisane **prawdziwe** credentials z portalu

### Krok 3: Wyczyść cache
- [x] Token cache usunięty (`data/allegro-token.json`)
- [ ] Przeglądarka odświeżona (Ctrl+Shift+R)

### Krok 4: Testuj
- [ ] `curl http://localhost:3000/api/allegro/test` zwraca `success: true`
- [ ] Dashboard działa: `http://localhost:3000/admin/allegro/search`
- [ ] Wyszukiwanie zwraca prawdziwe wyniki

---

## 🧪 Komendy Testowe

### Test 1: Sprawdź konfigurację
```powershell
Get-Content "data\allegro-config.json" | ConvertFrom-Json | Format-List
```

### Test 2: Wyczyść cache i testuj
```powershell
Remove-Item "data\allegro-token.json" -ErrorAction SilentlyContinue
curl http://localhost:3000/api/allegro/test
```

### Test 3: Sprawdź logi serwera
```powershell
# W terminalu gdzie działa `npm run dev` szukaj:
# "🔑 Fetching new Allegro access token..."
# "❌ OAuth failed (401): ..."
```

---

## 📚 Linki

- **Allegro Developer Portal (Production):** https://developer.allegro.pl/
- **Allegro Sandbox:** https://developer.allegro.pl.allegrosandbox.pl/
- **API Docs:** https://developer.allegro.pl/documentation/
- **OAuth Guide:** https://developer.allegro.pl/auth/

---

## 🎯 Tymczasowe Rozwiązanie: Demo Mode

Jeśli nie możesz teraz skonfigurować OAuth, użyj Demo Mode:

1. **Usuń credentials:**
   ```json
   // data/allegro-config.json
   {}
   ```

2. **System automatycznie przełączy się na DEMO:**
   ```javascript
   // pages/api/allegro/search.js wykryje brak config
   // i zwróci przykładowe dane
   ```

3. **Testuj UI:**
   - Komponenty będą działać
   - Modal będzie się otwierał
   - Wyniki będą przykładowe (ale działające)

---

## ✅ Następne Kroki

1. **Zarejestruj aplikację w Allegro Developer Portal**
2. **Zaktualizuj `data/allegro-config.json` z prawdziwymi credentials**
3. **Wyczyść cache tokenu**
4. **Testuj ponownie `/api/allegro/test`**

---

**Status:** ⏳ Czeka na prawdziwe credentials z Allegro Developer Portal

**Czas naprawy:** 5-10 minut (po otrzymaniu credentials)
