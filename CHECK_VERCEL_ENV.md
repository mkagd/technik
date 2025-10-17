# ✅ Sprawdzenie Environment Variables w Vercel

## Problem
Build może failować jeśli brakuje wymaganych zmiennych środowiskowych.

## Wymagane Environment Variables

Wejdź na Vercel Dashboard → Project Settings → Environment Variables i upewnij się że są ustawione:

### 1. Supabase (WYMAGANE)
```
NEXT_PUBLIC_SUPABASE_URL=https://ibwllqynynxcflpqlaeh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2xscXlueW54Y2ZscHFsYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjY4OTIsImV4cCI6MjA2MjkwMjg5Mn0.wPbvRr7rWMJM7p8n7sRUqk7k0o6qMUVNNm2Zg6z5k1I
SUPABASE_SERVICE_ROLE_KEY=[TWÓJ SERVICE ROLE KEY]
```

### 2. JWT Secret (WYMAGANE)
```
JWT_SECRET=[TWÓJ JWT SECRET - np. long-random-string-here]
```

### 3. Google Maps (opcjonalne)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[TWÓJ API KEY]
```

## Jak sprawdzić?

1. Wejdź na: https://vercel.com/dashboard
2. Kliknij na projekt
3. Settings → Environment Variables
4. Sprawdź czy wszystkie są ustawione
5. Upewnij się że są ustawione dla **Production**, **Preview** i **Development**

## Jeśli brakuje którejś zmiennej:

1. Kliknij "Add New"
2. Wpisz nazwę zmiennej (np. `JWT_SECRET`)
3. Wpisz wartość
4. Zaznacz wszystkie środowiska (Production, Preview, Development)
5. Save
6. **WAŻNE**: Po dodaniu zmiennych trzeba **REDEPLOY**
   - Deployments → Najnowszy deployment → ... (3 kropki) → Redeploy

## Jak uzyskać SUPABASE_SERVICE_ROLE_KEY?

1. Wejdź na: https://supabase.com/dashboard
2. Wybierz projekt: `ibwllqynynxcflpqlaeh`
3. Settings → API
4. Skopiuj "service_role" secret key
5. **UWAGA**: NIE używaj "anon" key! To musi być "service_role"!

## Jak wygenerować JWT_SECRET?

W terminalu (PowerShell):
```powershell
# Wygeneruj losowy string
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

Lub użyj dowolnego długiego ciągu znaków (min. 32 znaki).

## Po dodaniu zmiennych:

1. Wróć do Deployments
2. Kliknij na ostatni (failed) deployment
3. Kliknij ... (3 kropki) → Redeploy
4. Poczekaj na build

---

**Jeśli po tym nadal nie działa, skopiuj dokładny błąd z Build Logs.**
