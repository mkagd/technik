# 🚀 Vercel - Szybki Start (5 minut)

## ⚡ Najszybsza droga do wdrożenia

### Opcja 1: Przez GitHub (ZALECANE - 5 minut) ✅

#### Krok 1: Przygotuj repozytorium
```bash
# Jeśli jeszcze nie masz repo na GitHub:
git init
git add .
git commit -m "Initial commit - ready for Vercel"
git branch -M main
git remote add origin https://github.com/mkagd/technik.git
git push -u origin main
```

#### Krok 2: Połącz z Vercel
1. Otwórz: https://vercel.com/new
2. Zaloguj się przez GitHub
3. Wybierz repozytorium **`mkagd/technik`**
4. Kliknij **"Import"**

#### Krok 3: Konfiguracja (NIE ZMIENIAJ NICZEGO)
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build  (auto-detect)
Output Directory: .next        (auto-detect)
Install Command: npm install   (auto-detect)
```

#### Krok 4: Dodaj zmienne środowiskowe
Kliknij **"Environment Variables"** i dodaj:

```plaintext
NEXT_PUBLIC_ADMIN_PASS = admin123
OPENAI_API_KEY = sk-proj-...  (jeśli masz)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIza...  (jeśli masz)
```

**Minimum wymagane:**
- `NEXT_PUBLIC_ADMIN_PASS` - hasło do panelu admin

#### Krok 5: Deploy!
Kliknij **"Deploy"** → Poczekaj 2-3 minuty → GOTOWE! 🎉

**Twoja aplikacja będzie dostępna pod:**
```
https://technik-xxx.vercel.app
```

---

### Opcja 2: Przez Vercel CLI (10 minut) ⚡

#### Krok 1: Instalacja Vercel CLI
```bash
npm install -g vercel
```

#### Krok 2: Logowanie
```bash
vercel login
```
(Otwórz link w przeglądarce i potwierdź)

#### Krok 3: Deploy
```bash
cd d:\Projekty\Technik\Technik
vercel
```

**Vercel zapyta:**
```
? Set up and deploy? [Y/n] Y
? Which scope? (wybierz swoje konto)
? Link to existing project? [y/N] N
? What's your project's name? technik-agd
? In which directory is your code? ./
```

**Poczekaj 2-3 minuty...**

#### Krok 4: Dodaj zmienne środowiskowe
```bash
# Hasło admin (WYMAGANE)
vercel env add NEXT_PUBLIC_ADMIN_PASS production
# Wpisz: admin123

# OpenAI (opcjonalne - dla AI Scanner)
vercel env add OPENAI_API_KEY production
# Wpisz swój klucz lub pomiń

# Google Maps (opcjonalne)
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
# Wpisz swój klucz lub pomiń
```

#### Krok 5: Rebuild z nowymi zmiennymi
```bash
vercel --prod
```

**GOTOWE!** 🎉

---

## ⚠️ WAŻNE OSTRZEŻENIA

### 1. ❌ Pliki JSON NIE DZIAŁAJĄ w produkcji!

**Problem:**
```
data/clients.json     ← Zniknie po każdym deploy
data/orders.json      ← Zniknie po każdym deploy
data/employees.json   ← Zniknie po każdym deploy
```

**Dlaczego?**
Vercel jest serverless - każde wdrożenie tworzy nowy kontener bez stałego dysku.

**Rozwiązania:**

#### A) Szybkie (2h pracy) - Vercel KV Store
```bash
npm install @vercel/kv
```

**Koszt:** FREE tier - 30,000 commands/day

#### B) Zalecane (4h pracy) - Supabase
```
Darmowa baza PostgreSQL
500MB storage
50K active users/month
```

**Kroki:**
1. Utwórz projekt: https://supabase.com/dashboard
2. Stwórz tabele (SQL w `VERCEL_DEPLOYMENT_GUIDE.md`)
3. Zmień API routes na Supabase
4. Dodaj zmienne: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

#### C) Testowe (5 min) - Hardcoded dane
Tymczasowo załaduj dane podczas buildu:

```javascript
// pages/api/clients.js
const DEMO_CLIENTS = [
  { id: 'CLI1', name: 'Jan Kowalski', ... },
  // ... reszta z JSON
];

export default function handler(req, res) {
  res.json(DEMO_CLIENTS);
}
```

---

## 🎯 Quick Checklist

### Przed deploymentem:
- [ ] Kod jest na GitHubie
- [ ] `.gitignore` ignoruje `.env.local`
- [ ] `vercel.json` istnieje
- [ ] `package.json` ma wszystkie dependencies

### Po deploymencie:
- [ ] Aplikacja działa: `https://xxx.vercel.app`
- [ ] Dodane zmienne środowiskowe
- [ ] Panel admin działa: `/panel-przydzial-zlecen`
- [ ] Zdecyduj co z plikami JSON (baza danych!)

---

## 🔍 Testowanie po deploy

### 1. Strona główna
```
https://twoj-projekt.vercel.app/
```
Powinna się załadować bez błędów

### 2. Strona rezerwacji
```
https://twoj-projekt.vercel.app/rezerwacja
```
Formularz powinien działać

### 3. Panel administratora
```
https://twoj-projekt.vercel.app/panel-przydzial-zlecen
Hasło: admin123
```

### 4. API Endpoints
```
https://twoj-projekt.vercel.app/api/clients
https://twoj-projekt.vercel.app/api/orders
```

**Jeśli zwracają puste tablice [] - to OK (brak danych w bazie)**  
**Jeśli zwracają błąd 500 - problem z backendem**

---

## 🚨 Częste błędy i szybkie naprawy

### Błąd: "Cannot find module 'xxx'"
**Naprawa:**
```bash
npm install xxx
git add .
git commit -m "Add missing dependency"
git push
```
(Vercel automatycznie zrobi redeploy)

### Błąd: "fs module not found"
**Naprawa:** Używasz `fs` w komponencie React (nie działa w przeglądarce)
- Przenieś logikę z `fs` do API route (`pages/api/`)

### Błąd: "Cannot read property 'xxx' of undefined"
**Naprawa:** Brakuje zmiennej środowiskowej
- Dashboard Vercel → Settings → Environment Variables → Dodaj zmienną

### Błąd: "Build timeout"
**Naprawa:** Build trwa >30 sekund
- Dashboard Vercel → Settings → Functions → Max Duration: 60s

---

## 💡 Pro Tips

### 1. Automatyczny redeploy
```bash
# Każdy push do main = automatyczny deploy
git push origin main
```

### 2. Preview deployments
```bash
# Każdy push do feature branch = preview URL
git checkout -b feature/new-feature
git push origin feature/new-feature
# Dostaniesz URL: https://technik-xxx-git-feature-new-feature.vercel.app
```

### 3. Rollback do poprzedniej wersji
Dashboard Vercel → Deployments → Wybierz starą wersję → Promote to Production

### 4. Logi w czasie rzeczywistym
```bash
vercel logs --follow
```

---

## 📞 Wsparcie

**Pełna dokumentacja:**
→ `VERCEL_DEPLOYMENT_GUIDE.md`

**Vercel Docs:**
→ https://vercel.com/docs

**Next.js Deployment:**
→ https://nextjs.org/docs/deployment

**Problem z deploymentem?**
→ Dashboard Vercel → Build Logs (szczegółowe błędy)

---

## 🎉 Gratulacje!

Jeśli widzisz swoją aplikację pod URL Vercel - **UDAŁO SIĘ!** 🚀

**Następne kroki:**
1. Skonfiguruj własną domenę (opcjonalne)
2. Migruj dane na Supabase (WYMAGANE dla produkcji)
3. Dodaj Analytics
4. Optymalizuj performance

---

**Czas wdrożenia:** 5-10 minut  
**Gotowe do użycia:** TAK ✅  
**Production ready:** NIE (wymaga bazy danych)
