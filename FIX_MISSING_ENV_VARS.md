# 🚨 KRYTYCZNE: Brak zmiennych środowiskowych w Vercel

## Problem
**WSZYSTKIE zmienne środowiskowe są puste w Vercel!**

Endpoint `/api/test-env` pokazuje:
```json
{
  "availableEnvVars": ["NEXT_DEPLOYMENT_ID"]
}
```

To oznacza że **ZERO** zmiennych aplikacji jest dostępnych.

## Rozwiązanie - Dodaj zmienne w Vercel

### Krok 1: Otwórz Vercel Dashboard
https://vercel.com/dashboard

### Krok 2: Kliknij na swój projekt

### Krok 3: Settings → Environment Variables

### Krok 4: Dodaj następujące zmienne:

#### 🔑 JWT_SECRET (WYMAGANE dla logowania)
- Name: `JWT_SECRET`
- Value: `super-secret-jwt-key-change-in-production-2024-technik-app`
- Environments: ✅ Production, ✅ Preview, ✅ Development
- **Save**

#### 🗄️ NEXT_PUBLIC_SUPABASE_URL (WYMAGANE)
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://ibwllqynynxcflpqlaeh.supabase.co`
- Environments: ✅ Production, ✅ Preview, ✅ Development
- **Save**

#### 🔓 NEXT_PUBLIC_SUPABASE_ANON_KEY (WYMAGANE)
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2xscXlueW54Y2ZscHFsYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjY4OTIsImV4cCI6MjA2MjkwMjg5Mn0.wPbvRr7rWMJM7p8n7sRUqk7k0o6qMUVNNm2Zg6z5k1I`
- Environments: ✅ Production, ✅ Preview, ✅ Development
- **Save**

#### 🔐 SUPABASE_SERVICE_ROLE_KEY (KRYTYCZNE - potrzebne do logowania!)

**JAK UZYSKAĆ:**

1. Otwórz: https://supabase.com/dashboard
2. Wybierz projekt: **ibwllqynynxcflpqlaeh**
3. Settings (ikona koła zębatego) → API
4. Znajdź sekcję **"Project API keys"**
5. Skopiuj klucz **"service_role"** (NIE "anon"!)
   - Będzie długi (~200+ znaków)
   - Zaczyna się od: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
6. Wróć do Vercel Environment Variables
7. Add New:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [wklej skopiowany service_role key]
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - **Save**

### Krok 5: REDEPLOY! (WAŻNE!)

Po dodaniu zmiennych środowiskowych **MUSISZ** zrobić redeploy:

1. Wróć do Vercel Dashboard → Deployments
2. Znajdź najnowszy deployment (zielony ✅)
3. Kliknij ... (3 kropki po prawej)
4. Kliknij **"Redeploy"**
5. Potwierdź: "Redeploy"
6. Poczekaj ~1 minutę

### Krok 6: Sprawdź czy działa

Po redeploy otwórz:
```
https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/api/test-env
```

Powinno pokazać:
```json
{
  "success": true,
  "environment": {
    "JWT_SECRET": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": true
  },
  "missing": [],
  "allSet": true,
  "message": "✅ All required environment variables are set!"
}
```

### Krok 7: Przetestuj logowanie

Otwórz:
```
https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/admin/login
```

Zaloguj się:
- Email: `admin@technik.pl`
- Password: `admin123`

Powinno zadziałać! ✅

---

## Dlaczego zmienne zniknęły?

Prawdopodobnie:
1. Projekt został utworzony na nowo w Vercel
2. Zmienne nie zostały skopiowane z poprzedniego projektu
3. Lub projekt używa innego "Vercel Account" niż poprzednio

## Podsumowanie kroków:

1. ✅ Dodaj `JWT_SECRET`
2. ✅ Dodaj `NEXT_PUBLIC_SUPABASE_URL`
3. ✅ Dodaj `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. ✅ Dodaj `SUPABASE_SERVICE_ROLE_KEY` (z Supabase Dashboard)
5. ✅ Redeploy w Vercel
6. ✅ Sprawdź `/api/test-env`
7. ✅ Przetestuj login

---

**To napraw login! Zmienne środowiskowe są absolutnie wymagane.** 🔐
