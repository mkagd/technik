# 🚀 Wdrożenie na Vercel - Instrukcja Krok po Kroku

## ✅ Przygotowanie (zrobione!)

- ✅ `package.json` ma skrypty `build` i `start`
- ✅ `vercel.json` skonfigurowany z geolokalizacją
- ✅ `.vercelignore` utworzony
- ✅ Multi-city system gotowy

---

## 📋 Przed wdrożeniem

### 1. Sprawdź czy masz konto na Vercel
Wejdź na: https://vercel.com/
- Jeśli masz - zaloguj się
- Jeśli nie - załóż konto (możesz przez GitHub)

### 2. Zainstaluj Vercel CLI (opcjonalnie)
```bash
npm install -g vercel
```

---

## 🎯 Metoda 1: Deploy przez GUI (najłatwiejsza)

### Krok 1: Pushuj kod na GitHub

**Jeśli jeszcze nie masz repozytorium:**

```bash
# W terminalu PowerShell (D:\Projekty\Technik\Technik):
git init
git add .
git commit -m "feat: multi-city landing pages with geolocation"
```

**Stwórz repo na GitHub:**
1. Idź na: https://github.com/new
2. Nazwa: `technik-serwis-agd`
3. Prywatne lub publiczne (twój wybór)
4. **NIE** twórz README, .gitignore (masz już)
5. Kliknij "Create repository"

**Połącz i wypchnij:**
```bash
git remote add origin https://github.com/TWOJA_NAZWA/technik-serwis-agd.git
git branch -M main
git push -u origin main
```

---

### Krok 2: Podłącz repo do Vercel

1. **Zaloguj się na Vercel:** https://vercel.com/dashboard
2. Kliknij **"Add New..."** → **"Project"**
3. Kliknij **"Import Git Repository"**
4. Wybierz **swoje repo** z listy (`technik-serwis-agd`)
5. Kliknij **"Import"**

---

### Krok 3: Konfiguracja projektu

Vercel wykryje Next.js automatycznie. Ustaw:

**Framework Preset:** `Next.js` (auto-detect ✅)

**Build Command:** 
```
npm run build
```

**Output Directory:**
```
.next
```

**Install Command:**
```
npm install --legacy-peer-deps
```

---

### Krok 4: Zmienne środowiskowe

⚠️ **WAŻNE!** Musisz dodać zmienne środowiskowe:

1. Kliknij **"Environment Variables"**
2. Dodaj każdą zmienną osobno:

**Dla OpenAI:**
```
OPENAI_API_KEY = sk-twoj_klucz_tutaj
```

**Dla Supabase:**
```
SUPABASE_URL = https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY = twoj_anon_key
```

**Dla Email (Resend):**
```
RESEND_API_KEY = re_twoj_klucz
RESEND_EMAIL_FROM = noreply@twojadomena.pl
```

**Admin Panel:**
```
NEXT_PUBLIC_ADMIN_PASS = twoje_haslo_admina
```

**Google Maps (jeśli używasz):**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = twoj_klucz
```

3. Dla każdej zmiennej ustaw scope: **Production, Preview, Development**

---

### Krok 5: Deploy!

1. Kliknij **"Deploy"** 🚀
2. Vercel zbuduje projekt (2-5 minut)
3. Po zakończeniu zobaczysz: **"Your project is ready!"**
4. Dostaniesz URL: `https://technik-serwis-agd.vercel.app`

---

## 🧪 Testowanie na produkcji

### Sprawdź geolokalizację:

1. **Otwórz na telefonie:** `https://technik-serwis-agd.vercel.app/index-serwis-agd`
2. **Przeglądarka zapyta:** "Zezwolić na dostęp do lokalizacji?" ✅
3. **Kliknij "Zezwól"**
4. **Modal się pojawi** z wykrytym miastem
5. **Automatyczne przekierowanie** po 1.5s! 🎯

### Sprawdź strony miast:

- `https://technik-serwis-agd.vercel.app/serwis` - lista miast
- `https://technik-serwis-agd.vercel.app/serwis/debica` - Dębica
- `https://technik-serwis-agd.vercel.app/serwis/rzeszow` - Rzeszów
- `https://technik-serwis-agd.vercel.app/serwis/tarnow` - Tarnów
- `https://technik-serwis-agd.vercel.app/serwis/krakow` - Kraków
- `https://technik-serwis-agd.vercel.app/serwis/jaslo` - Jasło

---

## 🎯 Metoda 2: Deploy przez CLI (szybsza)

**Jeśli zainstalowałeś Vercel CLI:**

```bash
# Zaloguj się
vercel login

# Deploy (w folderze projektu)
vercel

# Odpowiedz na pytania:
# - Set up and deploy? → Y
# - Scope? → Wybierz swoje konto
# - Link to existing project? → N
# - Project name? → technik-serwis-agd
# - Directory? → ./ (domyślnie)
# - Override settings? → N

# Vercel deployuje...
```

Po deployment dostaniesz URL produkcyjny!

---

## 🌐 Podłączenie własnej domeny (opcjonalnie)

### Jeśli masz domenę (np. serwis-agd-debica.pl):

1. **W Vercel Dashboard:**
   - Idź do swojego projektu
   - Kliknij **"Settings"** → **"Domains"**
   - Kliknij **"Add"**
   - Wpisz: `serwis-agd-debica.pl`
   - Kliknij **"Add"**

2. **U dostawcy domeny (np. home.pl, OVH):**
   - Dodaj rekord **A**:
     - Host: `@`
     - Value: `76.76.21.21` (IP Vercel)
   - Dodaj rekord **CNAME**:
     - Host: `www`
     - Value: `cname.vercel-dns.com`

3. **Poczekaj 10-60 minut** na propagację DNS

4. **HTTPS automatycznie** - Vercel doda certyfikat SSL za darmo! 🔒

---

## 🔄 Automatyczne deploymenty

**Po pierwszym wdrożeniu:**

Każdy push na GitHub = automatyczny deploy! 🚀

```bash
# Zmiana w kodzie
git add .
git commit -m "feat: dodałem X"
git push

# Vercel automatycznie deployuje nową wersję!
```

---

## 📊 Monitoring

### W Vercel Dashboard zobaczysz:

- **Analytics** - statystyki odwiedzin
- **Speed Insights** - wydajność strony
- **Logs** - logi z serverless functions
- **Deployments** - historia wdrożeń

---

## 🐛 Rozwiązywanie problemów

### Problem 1: Build failed

**Sprawdź logi w Vercel Dashboard:**
- Kliknij na failed deployment
- Zobacz "Build Logs"
- Często problem z zależnościami

**Rozwiązanie:**
```bash
# Lokalnie:
rm -rf node_modules
rm package-lock.json
npm install --legacy-peer-deps
npm run build

# Jeśli działa lokalnie, pushuj na GitHub
git add .
git commit -m "fix: dependencies"
git push
```

---

### Problem 2: Zmienne środowiskowe nie działają

**Sprawdź:**
1. Vercel Dashboard → Settings → Environment Variables
2. Upewnij się że są ustawione dla **Production**
3. Po dodaniu nowej zmiennej - **Redeploy**:
   - Deployments → Kliknij na ostatni → **"Redeploy"**

---

### Problem 3: Geolokalizacja nie działa

**Sprawdź `vercel.json`:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Permissions-Policy",
          "value": "camera=*, microphone=*, geolocation=*"
        }
      ]
    }
  ]
}
```

**Jeśli OK - sprawdź w przeglądarce:**
- Chrome DevTools (F12) → Console
- Powinno być: `📍 Próba wykrycia lokalizacji...`

---

### Problem 4: Strony miast 404

**Sprawdź czy build przeszedł:**
- Vercel powinien wygenerować statyczne strony dla wszystkich miast
- W logach szukaj: `Generating static pages (5/5)`

**Jeśli problem:**
```bash
# Lokalnie przetestuj build:
npm run build
npm start

# Otwórz: http://localhost:3000/serwis/debica
# Jeśli działa - push na GitHub
```

---

## ✅ Checklist po wdrożeniu

- [ ] Projekt zdeployowany na Vercel
- [ ] Wszystkie zmienne środowiskowe ustawione
- [ ] Strona główna działa: `/index-serwis-agd`
- [ ] Lista miast działa: `/serwis`
- [ ] Wszystkie 5 stron miast działają: `/serwis/debica`, `/serwis/rzeszow`, etc.
- [ ] Geolokalizacja pyta o uprawnienia na telefonie
- [ ] Automatyczne przekierowanie działa (lub modal wyboru miast)
- [ ] Telefony i emaile wyświetlają się poprawnie
- [ ] Schema.org LocalBusiness markup działa (sprawdź w Google Rich Results Test)
- [ ] Domena podłączona (opcjonalnie)
- [ ] HTTPS działa (automatycznie przez Vercel)

---

## 🎉 Gotowe!

Twoja strona jest teraz na produkcji z:
- ✅ **HTTPS** - geolokalizacja działa!
- ✅ **Multi-city** - 5 dedykowanych stron
- ✅ **Auto-redirect** - wykrywa miasto użytkownika
- ✅ **SEO** - statyczne strony, Schema.org
- ✅ **Fast** - Vercel CDN na całym świecie
- ✅ **Auto-deploy** - każdy push = nowa wersja

---

## 📱 Test finalny

1. Otwórz na telefonie: `https://twoja-domena.vercel.app/index-serwis-agd`
2. Zezwól na lokalizację
3. Zobacz magię! 🎯✨

---

## 💰 Koszty

**Vercel Free Plan:**
- ✅ 100GB bandwidth/miesiąc
- ✅ Unlimited sites
- ✅ HTTPS automatycznie
- ✅ Wystarczy dla małych/średnich firm

**Jeśli przekroczysz:**
- Vercel Pro: $20/miesiąc
- Więcej bandwidth i funkcji

---

## 📞 Wsparcie

Jeśli coś nie działa:
1. Sprawdź Vercel Logs
2. Sprawdź Browser Console (F12)
3. Google: "vercel next.js [twój problem]"
4. Vercel Discord: https://vercel.com/discord

**Powodzenia z wdrożeniem!** 🚀
