# 🚀 DEPLOYMENT NA VERCEL - INSTRUKCJA

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. **Konfiguracja projektu**
- ✅ `vercel.json` skonfigurowany
- ✅ `package.json` z odpowiednimi scripts
- ✅ `.gitignore` zawiera `.env.local` i `node_modules`
- ✅ `.env.local.example` jako szablon

### 2. **Zmienne środowiskowe wymagane**
```bash
# KRYTYCZNE
NEXT_PUBLIC_ADMIN_PASS=twoje_haslo_admin

# OPCJONALNE (ale zalecane)
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
JWT_SECRET=wygenerowany_64_znakowy_hex
```

### 3. **⚠️ WAŻNE: BAZA DANYCH**
Pliki JSON w `data/` **NIE BĘDĄ DZIAŁAĆ** na Vercel (serverless = read-only filesystem)

**Opcje:**
1. **Supabase** (ZALECANE) - Darmowe 500MB PostgreSQL
2. **MongoDB Atlas** - Darmowe 512MB
3. **PlanetScale** - Darmowe MySQL
4. **Vercel KV/Postgres** - Integracja z Vercel

---

## 📋 KROKI DEPLOYMENTU

### Krok 1: Instalacja Vercel CLI
```powershell
npm install -g vercel
```

### Krok 2: Logowanie
```powershell
vercel login
```

### Krok 3: Commit zmian do Git
```powershell
git add .
git commit -m "feat: Added responsive forms and popular cities feature"
git push origin main
```

### Krok 4: Deploy na Vercel
```powershell
# Development preview
vercel

# Production deploy
vercel --prod
```

---

## 🔧 KONFIGURACJA W VERCEL DASHBOARD

### 1. Zmienne środowiskowe
Dashboard → Settings → Environment Variables

Dodaj wszystkie zmienne z `.env.local`:
- `NEXT_PUBLIC_ADMIN_PASS`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `JWT_SECRET`
- itd.

### 2. Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Domains
- Domyślnie: `technik.vercel.app`
- Custom domain: Settings → Domains

---

## ⚠️ CO NIE BĘDZIE DZIAŁAĆ BEZ BAZY DANYCH

Obecnie aplikacja używa plików JSON w `data/`:
- ❌ `data/clients.json` - klienci
- ❌ `data/orders.json` - zamówienia
- ❌ `data/rezerwacje.json` - rezerwacje
- ❌ `data/employees.json` - pracownicy
- ❌ `data/parts-inventory.json` - magazyn części
- ❌ `data/popular-cities.json` - popularne miasta
- ❌ `data/drafts.json` - drafty

**Rozwiązanie:**
Trzeba będzie zmigrować na prawdziwą bazę danych (Supabase).

---

## 🎯 QUICK START (Jeśli masz już konto Vercel)

```powershell
# 1. Zaloguj się
vercel login

# 2. Deploy na produkcję
vercel --prod

# 3. Ustaw zmienne środowiskowe w dashboardzie
# https://vercel.com/your-username/technik/settings/environment-variables

# 4. Gotowe! 🚀
```

---

## 📊 PO DEPLOYMENCIE

### Sprawdź:
1. ✅ Aplikacja się uruchamia
2. ✅ Panel admin działa (`/panel-przydzial-zlecen`)
3. ⚠️ Zapisywanie danych **NIE DZIAŁA** (potrzeba bazy)
4. ✅ UI jest responsywny
5. ✅ PWA działa (offline mode)

### Następne kroki:
1. Skonfiguruj Supabase
2. Zmigruj dane z JSON do Supabase
3. Zaktualizuj API endpoints do używania Supabase
4. Dodaj custom domain (opcjonalnie)

---

## 🆘 TROUBLESHOOTING

### Problem: Build fails
```
Error: Cannot find module 'xyz'
```
**Rozwiązanie:** Sprawdź `package.json` dependencies

### Problem: 500 Internal Server Error
**Rozwiązanie:** Sprawdź logi w Vercel Dashboard → Deployments → Logs

### Problem: Zmienne środowiskowe nie działają
**Rozwiązanie:** Muszą zaczynać się od `NEXT_PUBLIC_` dla frontendu

### Problem: Dane nie zapisują się
**Rozwiązanie:** To normalne - Vercel jest read-only. Potrzeba bazy danych.

---

## 📚 DOKUMENTACJA

- [Vercel Next.js Guide](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**Data utworzenia:** 6 października 2025  
**Status:** ✅ Gotowe do deploymentu (wymaga migracji bazy danych)
