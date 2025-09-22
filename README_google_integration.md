# Integracja Google dla aplikacji Technik

## Opis funkcji

System integracji Google umożliwia:

1. **Automatyczne logowanie przez Google** - użytkownicy mogą zalogować się za pomocą konta Google
2. **Automatyczne wypełnianie danych** - po zalogowaniu dane kontaktowe są automatycznie pobierane z Google
3. **Synchronizacja danych pracowników** - jeśli zalogowany użytkownik Google jest również pracownikiem, jego dane kontaktowe są aktualizowane
4. **Synchronizacja między systemami** - dane użytkownika są spójne w formularzach zgłoszeń i profilach pracowników

## Konfiguracja Google OAuth

### 1. Utworzenie projektu w Google Cloud Console

1. Idź do [Google Cloud Console](https://console.cloud.google.com/)
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz Google+ API i People API

### 2. Konfiguracja OAuth 2.0

1. Idź do "Credentials" w Google Cloud Console
2. Kliknij "Create Credentials" > "OAuth 2.0 Client ID"
3. Wybierz "Web application"
4. Dodaj domenę aplikacji do "Authorized JavaScript origins"
   - Dla developmentu: `http://localhost:3000`
   - Dla produkcji: `https://twoja-domena.com`
5. Skopiuj **Client ID**

### 3. Konfiguracja w aplikacji

Utwórz plik `.env.local` w głównym folderze projektu:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=twoj-google-client-id.apps.googleusercontent.com
```

## Jak działa

### Dla użytkowników

1. **Pierwsza rejestracja przez Google:**
   - Użytkownik klika "Zarejestruj się przez Google"
   - System tworzy nowe konto z danymi z Google
   - Automatycznie loguje użytkownika

2. **Kolejne logowania:**
   - Użytkownik klika "Zaloguj się przez Google"
   - System aktualizuje dane z Google (zdjęcie, imię, nazwisko)
   - Loguje użytkownika

3. **W formularzu zgłoszenia:**
   - Dane kontaktowe są automatycznie wypełnione
   - Pokazuje się informacja o koncie Google
   - Użytkownik potwierdza poprawność danych

### Dla pracowników

1. **Synchronizacja danych:**
   - Jeśli pracownik zaloguje się przez Google na swój prywatny email
   - System automatycznie połączy konto Google z profilem pracownika
   - Zaktualizuje dane kontaktowe pracownika

2. **W panelu administratora:**
   - Widoczne są informacje o integracjach Google
   - Data ostatniej synchronizacji
   - Status połączenia z Google

## Pliki i komponenty

### Główne komponenty:
- `components/GoogleAuth.js` - komponent logowania Google
- `utils/googleConfig.js` - konfiguracja i funkcje Google API

### Zaktualizowane pliki:
- `components/QuickReportForm.js` - obsługa danych Google w formularzach
- `pages/logowanie.js` - dodano przycisk logowania Google
- `pages/rejestracja.js` - dodano przycisk rejestracji Google
- `pages/admin-new.js` - widok danych Google w panelu administratora

## Bezpieczeństwo

1. **Token weryfikacja:** Wszystkie tokeny Google są weryfikowane po stronie klienta
2. **Lokalne przechowywanie:** Dane są przechowywane lokalnie w localStorage
3. **Aktualizacje automatyczne:** Dane są automatycznie aktualizowane przy każdym logowaniu

## Testowanie

1. Skonfiguruj Google OAuth credentials
2. Uruchom aplikację: `npm run dev`
3. Spróbuj zalogować się przez Google
4. Sprawdź czy dane są automatycznie wypełniane w formularzu zgłoszenia
5. Sprawdź panel administratora czy pokazuje informacje Google

## Rozwiązywanie problemów

### Google SDK nie ładuje się
- Sprawdź połączenie internetowe
- Sprawdź czy CLIENT_ID jest poprawny
- Sprawdź konsole przeglądarki dla błędów

### Dane nie są synchronizowane
- Sprawdź localStorage w narzędziach deweloperskich
- Upewnij się że email w profilu pracownika odpowiada emailowi Google

### Błędy autoryzacji
- Sprawdź czy domena jest dodana do autoryzowanych domen w Google Cloud Console
- Sprawdź czy CLIENT_ID jest poprawny

## Przyszłe rozszerzenia

1. **Google Contacts API** - pobieranie dodatkowych danych kontaktowych
2. **Google Calendar API** - synchronizacja kalendarza pracowników
3. **Automatyczne wypełnianie adresu** - używanie Google Places API
4. **Backup do Google Drive** - automatyczne kopie zapasowe danych

## Wsparcie

W przypadku problemów:
1. Sprawdź logi w konsoli przeglądarki
2. Sprawdź konfigurację Google Cloud Console
3. Sprawdź czy wszystkie zmienne środowiskowe są ustawione
