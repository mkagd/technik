# ✅ Vercel Deployment Checklist

## 📋 Przed wdrożeniem

### Kod i konfiguracja
- [ ] `vercel.json` istnieje i jest poprawnie skonfigurowany
- [ ] `package.json` zawiera wszystkie zależności
- [ ] `.gitignore` ignoruje `.env.local`, `node_modules/`, `.next/`
- [ ] `.env.local.example` jest zaktualizowany
- [ ] Kod jest zacommitowany i wpushowany na GitHub
- [ ] Brak błędów kompilacji: `npm run build` działa lokalnie
- [ ] Aplikacja działa lokalnie: `npm run dev` działa bez błędów

### Zmienne środowiskowe
- [ ] `NEXT_PUBLIC_ADMIN_PASS` - hasło do panelu admin (WYMAGANE)
- [ ] `OPENAI_API_KEY` - klucz OpenAI (opcjonalne, dla AI Scanner)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - klucz Google Maps (opcjonalne)
- [ ] `SUPABASE_URL` - URL Supabase (jeśli używasz)
- [ ] `SUPABASE_ANON_KEY` - klucz Supabase (jeśli używasz)

### Dane
- [ ] ⚠️ **DECYZJA:** Co z plikami JSON w `data/`?
  - [ ] Opcja A: Migracja na Supabase (zalecane)
  - [ ] Opcja B: Vercel KV Store
  - [ ] Opcja C: Testowe dane hardcoded (tylko dev)
- [ ] Backup obecnych danych (skopiuj folder `data/` na bezpieczne miejsce)

### Bezpieczeństwo
- [ ] Brak hardcoded secrets w kodzie
- [ ] Brak console.log z wrażliwymi danymi
- [ ] `.env.local` NIE jest w repozytorium (sprawdź `.gitignore`)
- [ ] Hasła są silne (nie "admin123" w produkcji!)

---

## 🚀 Wdrożenie

### Metoda GitHub (zalecane)
- [ ] Zaloguj się na https://vercel.com
- [ ] Kliknij "Add New..." → "Project"
- [ ] Wybierz repozytorium `mkagd/technik`
- [ ] Kliknij "Import"
- [ ] Framework: Next.js (auto-detect)
- [ ] Dodaj zmienne środowiskowe
- [ ] Kliknij "Deploy"
- [ ] Poczekaj 2-5 minut

### LUB Metoda CLI
- [ ] Zainstaluj: `npm install -g vercel`
- [ ] Zaloguj: `vercel login`
- [ ] Deploy: `vercel`
- [ ] Dodaj zmienne: `vercel env add NEXT_PUBLIC_ADMIN_PASS`
- [ ] Deploy produkcyjny: `vercel --prod`

---

## 🧪 Po wdrożeniu - Testowanie

### Podstawowe testy
- [ ] Strona główna działa: `https://xxx.vercel.app/`
- [ ] Formularz rezerwacji: `https://xxx.vercel.app/rezerwacja`
- [ ] Panel admin: `https://xxx.vercel.app/panel-przydzial-zlecen`
- [ ] Panel serwisanta: `https://xxx.vercel.app/technician/visits`
- [ ] Logowanie działa (hasło admin)

### API Endpoints
- [ ] `/api/clients` zwraca dane lub pustą tablicę
- [ ] `/api/orders` zwraca dane lub pustą tablicę
- [ ] `/api/employees` zwraca dane lub pustą tablicę
- [ ] Brak błędów 500 w konsoli przeglądarki

### Funkcjonalność
- [ ] Tworzenie nowej rezerwacji działa
- [ ] Przydzielanie zleceń działa (jeśli są dane)
- [ ] Logowanie do paneli działa
- [ ] Responsywność (mobile, tablet, desktop)
- [ ] PWA offline działa (jeśli skonfigurowane)

### Performance
- [ ] Lighthouse Score > 80 (Performance)
- [ ] Lighthouse Score > 90 (Accessibility)
- [ ] Lighthouse Score > 90 (Best Practices)
- [ ] Lighthouse Score > 90 (SEO)
- [ ] Czas ładowania < 3s (First Contentful Paint)

---

## 🔧 Konfiguracja dodatkowa

### Domena (opcjonalne)
- [ ] Dodaj własną domenę w Vercel Dashboard
- [ ] Skonfiguruj rekordy DNS u rejestratora
- [ ] Poczekaj na propagację DNS (24-48h)
- [ ] Sprawdź SSL certificate (automatycznie)

### Analytics (opcjonalne)
- [ ] Zainstaluj: `npm install @vercel/analytics`
- [ ] Dodaj do `_app.js`: `<Analytics />`
- [ ] Włącz w Vercel Dashboard → Analytics

### Monitoring (opcjonalne)
- [ ] Włącz Vercel Logs
- [ ] Skonfiguruj alerty (błędy, timeouts)
- [ ] Dodaj Sentry lub podobne (error tracking)

---

## ⚠️ Najczęstsze problemy

### Problem: "Cannot find module 'xxx'"
**Fix:**
```bash
npm install xxx
git add .
git commit -m "Add missing dependency"
git push
```

### Problem: "Build timeout"
**Fix:** Vercel Dashboard → Settings → Functions → Max Duration: 60s

### Problem: "Dane znikają"
**Fix:** Pliki JSON nie działają - migruj na Supabase (zobacz `VERCEL_DEPLOYMENT_GUIDE.md`)

### Problem: "500 Internal Server Error"
**Fix:** 
1. Sprawdź logi: Vercel Dashboard → Deployments → View Function Logs
2. Sprawdź zmienne środowiskowe
3. Sprawdź czy wszystkie API routes mają `export default`

### Problem: "fs module not found"
**Fix:** Używasz `fs` w komponencie (client-side). Przenieś do API route (server-side).

---

## 📊 Metryki sukcesu

### Deploy OK jeśli:
- ✅ Build zakończył się sukcesem (zielony check)
- ✅ Wszystkie testy przechodzą
- ✅ Aplikacja ładuje się < 3s
- ✅ Brak błędów 500 w logach
- ✅ Lighthouse Score > 80

### Production Ready jeśli:
- ✅ Dane w bazie danych (nie pliki JSON)
- ✅ Wszystkie zmienne środowiskowe ustawione
- ✅ Własna domena skonfigurowana
- ✅ Analytics włączone
- ✅ Monitoring skonfigurowany
- ✅ Backup danych zrobiony

---

## 🎯 Następne kroki (po deploymencie)

### Krótkoterminowe (24h)
- [ ] Przetestuj wszystkie funkcje na produkcji
- [ ] Popraw znalezione błędy
- [ ] Skonfiguruj monitoring
- [ ] Zrób backup produkcyjnych danych

### Średnioterminowe (tydzień)
- [ ] Migruj całkowicie na bazę danych
- [ ] Dodaj Analytics
- [ ] Optymalizuj performance
- [ ] Dodaj testy automatyczne

### Długoterminowe (miesiąc)
- [ ] Implementuj CI/CD pipeline
- [ ] Dodaj feature flags
- [ ] Skonfiguruj staging environment
- [ ] Dokumentuj API

---

## 📞 Wsparcie

**Dokumentacja:**
- `VERCEL_QUICK_START.md` - Szybki start (5 min)
- `VERCEL_DEPLOYMENT_GUIDE.md` - Pełny przewodnik (wszystko)

**Linki:**
- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase Docs: https://supabase.com/docs

**Problem?**
- Vercel Dashboard → Build Logs (szczegółowe błędy)
- Vercel Community: https://github.com/vercel/vercel/discussions
- Next.js Discord: https://nextjs.org/discord

---

**Data utworzenia:** 2025-10-06  
**Status:** ✅ Gotowe do użycia  
**Następny krok:** Deploy na Vercel!
