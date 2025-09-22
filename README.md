# Rezerwacja Serwis - System Rezerwacji Online

System rezerwacji serwisu technicznego z kalendarzem, mapą lokalizacji i panelem administracyjnym.

## 🚀 Funkcje

- 📅 **Kalendarz rezerwacji** - Interaktywny system rezerwowania terminów
- 🗺️ **Mapa lokalizacji** - Integracja z Google Maps dla lokalizacji serwisu  
- 👤 **Panel klienta** - Zarządzanie własnymi zamówieniami
- 🔧 **Panel pracownika** - Harmonogram pracy i zarządzanie zleceniami
- 🎛️ **Panel administratora** - Pełne zarządzanie systemem
- 🔐 **Logowanie Google** - Bezpieczna autentyfikacja
- 📱 **PWA** - Aplikacja działa jak natywna na urządzeniach mobilnych

## 📋 Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth
- **Maps**: Google Maps API
- **UI/UX**: Framer Motion, Lucide Icons
- **PWA**: next-pwa

## 🔧 Instalacja i uruchomienie

### Wymagania
- Node.js 18+
- npm lub yarn

### Kroki

1. **Klonuj repozytorium**
   ```bash
   git clone [URL_REPOZYTORIUM]
   cd rezerwacja-serwis
   ```

2. **Zainstaluj zależności**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Skonfiguruj zmienne środowiskowe**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Wypełnij plik `.env.local` własnymi danymi:
   ```
   SUPABASE_URL=twoj_supabase_url
   SUPABASE_ANON_KEY=twoj_supabase_anon_key
   RESEND_API_KEY=twoj_resend_api_key
   RESEND_EMAIL_FROM=twoj@email.com
   NEXT_PUBLIC_ADMIN_PASS=twoje_haslo_admin
   ```

4. **Uruchom serwer deweloperski**
   ```bash
   npm run dev
   ```

5. **Otwórz w przeglądarce**
   ```
   http://localhost:3000
   ```

## 📱 Dostęp z innych urządzeń (sieć lokalna)

Aby udostępnić aplikację w sieci lokalnej:

```bash
npm run dev  # Serwer dostępny pod adresem IP komputera na porcie 3000
```

## 🌐 Wdrożenie na Vercel

### Automatyczne wdrożenie:

1. **Fork/Push do GitHub**
2. **Połącz z Vercel**:
   - Wejdź na [vercel.com](https://vercel.com)
   - Zaimportuj projekt z GitHub
   - Ustaw zmienne środowiskowe w panelu Vercel
3. **Deploy** - Vercel automatycznie zbuduje i wdroży aplikację

### Zmienne środowiskowe dla Vercel:
Ustaw w panelu Vercel → Settings → Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `RESEND_API_KEY`
- `RESEND_EMAIL_FROM`
- `NEXT_PUBLIC_ADMIN_PASS`

## 🏗️ Struktura Projektu

```
├── components/          # Komponenty React
├── pages/              # Strony Next.js i API routes
├── data/               # Pliki JSON z danymi
├── utils/              # Funkcje pomocnicze
├── styles/             # Style CSS
├── public/             # Pliki statyczne
└── android/            # Konfiguracja dla aplikacji mobilnej
```

## 🔐 Domyślne dane dostępowe

- **Admin**: hasło ustawione w `NEXT_PUBLIC_ADMIN_PASS`
- **Demo**: System zawiera przykładowe dane do testowania

## 📞 Wsparcie

W razie problemów sprawdź:
1. Czy wszystkie zmienne środowiskowe są ustawione
2. Czy Supabase jest skonfigurowany poprawnie  
3. Czy Google Maps API jest aktywne
4. Logi w konsoli przeglądarki i terminalu

---

**Made with ❤️ for efficient service management**