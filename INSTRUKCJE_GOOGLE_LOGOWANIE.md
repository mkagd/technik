# Instrukcje konfiguracji logowania przez Google

## Problem
Logowanie przez Google nie działa - przycisk pojawia się, ale nie można się zalogować.

## Przyczyna
Brakuje skonfigurowanego Google Client ID w zmiennych środowiskowych.

## Rozwiązanie

### Krok 1: Skonfiguruj Google Cloud Console

1. **Przejdź do Google Cloud Console:**
   - Otwórz https://console.cloud.google.com/
   - Zaloguj się swoim kontem Google

2. **Utwórz nowy projekt lub wybierz istniejący:**
   - Kliknij na nazwę projektu w górnym pasku
   - Wybierz "New Project" lub wybierz istniejący projekt

3. **Włącz potrzebne API:**
   - Przejdź do "APIs & Services" > "Library"
   - Wyszukaj i włącz:
     - Google+ API (lub People API)
     - Google Identity Services

4. **Utwórz OAuth 2.0 Client ID:**
   - Przejdź do "APIs & Services" > "Credentials"
   - Kliknij "Create Credentials" > "OAuth 2.0 Client ID"
   - Wybierz "Web application"
   - Podaj nazwę (np. "Aplikacja Technik")

5. **Skonfiguruj domeny:**
   - W sekcji "Authorized JavaScript origins" dodaj:
     - `http://localhost:3000` (dla developmentu)
     - `http://localhost:3001` (jeśli używasz innego portu)
     - Domenę produkcyjną (jeśli masz)
   
6. **Skopiuj Client ID:**
   - Po utworzeniu credentials, skopiuj Client ID
   - Ma format: `1234567890-abcdefghijk.apps.googleusercontent.com`

### Krok 2: Zaktualizuj plik .env.local

1. **Otwórz plik `.env.local` w głównym folderze projektu**

2. **Zaktualizuj linię z Google Client ID:**
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=TUTAJ_WKLEJ_SWÓJ_CLIENT_ID
   ```

3. **Przykład gotowego pliku .env.local:**
   ```env
   SUPABASE_URL=https://twoj-projekt.supabase.co
   SUPABASE_ANON_KEY=wtetrtvtblzkguoxfumx
   
   RESEND_API_KEY=twoj_resend_api_key
   RESEND_EMAIL_FROM=noreply@twojadomena.pl
   
   PORT=3000
   
   NEXT_PUBLIC_ADMIN_PASS=admin123
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
   ```

### Krok 3: Restart aplikacji

1. **Zatrzymaj serwer deweloperski** (Ctrl+C w terminalu)

2. **Uruchom ponownie:**
   ```bash
   npm run dev
   ```

### Krok 4: Testowanie

1. **Przejdź do strony "Moje zamówienia"**
2. **Wybierz tab "Konto technik"**
3. **Kliknij "Zaloguj się przez Google"**
4. **Powinno otworzyć się okno logowania Google**

## Funkcje logowania Google

Po poprawnej konfiguracji, logowanie Google oferuje:

### W panelu "Moje zamówienia":
- ✅ Szybkie logowanie jednym klikiem
- ✅ Automatyczne wypełnienie danych kontaktowych
- ✅ Bezpieczna autoryzacja przez Google
- ✅ Pokazanie tylko zamówień powiązanych z emailem Google

### W formularzach zgłoszeń:
- ✅ Automatyczne wypełnienie imienia, nazwiska, emaila
- ✅ Synchronizacja z kontem użytkownika
- ✅ Powiązanie zgłoszeń z kontem Google

## Rozwiązywanie problemów

### Problem: "Google SDK nie jest gotowe"
**Rozwiązanie:** Sprawdź połączenie internetowe i poczekaj chwilę na załadowanie SDK.

### Problem: "Nieprawidłowy Client ID"
**Rozwiązanie:** Sprawdź czy Client ID w .env.local jest poprawny i czy ma format `*.apps.googleusercontent.com`

### Problem: "Domena nie jest autoryzowana"
**Rozwiązanie:** W Google Cloud Console dodaj domenę aplikacji do "Authorized JavaScript origins"

### Problem: Przycisk Google nie pojawia się
**Rozwiązanie:** 
1. Sprawdź czy plik .env.local zawiera NEXT_PUBLIC_GOOGLE_CLIENT_ID
2. Restart aplikacji
3. Sprawdź konsolę przeglądarki na błędy

## Wsparcie

Jeśli nadal masz problemy:
1. Sprawdź konsolę przeglądarki (F12 > Console) na błędy
2. Sprawdź czy wszystkie zmienne środowiskowe są ustawione
3. Upewnij się że Google Cloud Console jest poprawnie skonfigurowany

---

**Uwaga:** Po pierwszym zalogowaniu przez Google, kolejne logowania będą jeszcze szybsze i będą automatycznie pokazywać zamówienia powiązane z kontem Google.
