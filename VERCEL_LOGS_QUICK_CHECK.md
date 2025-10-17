# 🔍 Szybkie sprawdzenie logów Vercel - Login Error

## Krok po kroku:

### 1. Otwórz Vercel Dashboard
https://vercel.com/dashboard

### 2. Kliknij na projekt (nazwa: technik lub podobna)

### 3. Przejdź do zakładki "Logs" (w górnym menu)
- Nie "Deployments" - tylko "Logs"!

### 4. Filtruj po funkcji:
- W search box wpisz: `/api/auth/login`
- Lub kliknij "Filter by function" → wybierz `api/auth/login`

### 5. Odśwież stronę logowania i zaloguj się ponownie
- Otwórz: https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/admin/login
- Spróbuj się zalogować: admin@technik.pl / admin123

### 6. Wróć do Vercel Logs i odśwież
- Kliknij "Refresh" lub poczekaj 5 sekund
- Powinny pojawić się nowe logi

### 7. Szukaj logów z emotką 🔐
W kodzie dodałem logi z 🔐, więc szukaj:
```
🔐 Login handler started - method: POST
🔐 Parsing request body...
🔐 Email: admin@technik.pl
🔐 Has Supabase: true/false
🔐 Has JWT Secret: true/false
🔐 Querying Supabase...
🔐 Supabase query error: ...
🔐 Creating token for env admin...
🔐 Login error - DETAILED: ...
```

### 8. Skopiuj WSZYSTKIE logi z 🔐

Będą wyglądać mniej więcej tak:
```
2024-01-17 10:30:45 🔐 Login handler started - method: POST
2024-01-17 10:30:45 🔐 Parsing request body...
2024-01-17 10:30:45 🔐 Email: admin@technik.pl
2024-01-17 10:30:45 🔐 Has Supabase: true
2024-01-17 10:30:45 🔐 Has JWT Secret: false ❌ <-- TO JEST PROBLEM!
2024-01-17 10:30:45 🔐 Login error - DETAILED: { message: "JWT_SECRET is not defined" }
```

### 9. Prześlij mi te logi

---

## Najprawdopodobniejszy problem:

### ❌ Brakuje JWT_SECRET w Vercel Environment Variables

**Jak naprawić:**

1. Vercel Dashboard → Twój projekt → Settings → Environment Variables
2. Kliknij "Add New"
3. Name: `JWT_SECRET`
4. Value: `super-secret-jwt-key-change-in-production-2024`
5. Zaznacz: Production, Preview, Development
6. Save
7. Wróć do Deployments → Ostatni deployment → ... (3 kropki) → **Redeploy**

### ❌ Lub brakuje SUPABASE_SERVICE_ROLE_KEY

**Jak naprawić:**

1. Wejdź na: https://supabase.com/dashboard
2. Projekt: ibwllqynynxcflpqlaeh
3. Settings → API
4. Skopiuj "service_role" key (UWAGA: NIE "anon" key!)
5. Wróć do Vercel → Settings → Environment Variables
6. Add New:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [skopiowany service_role key]
   - Zaznacz wszystkie środowiska
   - Save
7. Redeploy

---

## Alternatywa: Sprawdź bez logowania do Vercel

Otwórz Developer Tools w przeglądarce (F12):

1. Otwórz: https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/admin/login
2. Naciśnij F12 → zakładka "Network"
3. Zaloguj się: admin@technik.pl / admin123
4. Kliknij na request `/api/auth/login` w Network tab
5. Zakładka "Response" - pokaż mi co jest w response
6. Zakładka "Preview" - pokaż mi JSON

Powinno być coś jak:
```json
{
  "error": "JWT_SECRET is not defined"
}
```

Lub:
```json
{
  "error": "SUPABASE_SERVICE_ROLE_KEY is not set"
}
```

---

**Czekam na logi!** 🔍
