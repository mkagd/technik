# 🚀 SZYBKA INSTRUKCJA - Dodanie zmiennych środowiskowych do Vercel

## Masz już WSZYSTKIE potrzebne wartości!

### SUPABASE_SERVICE_ROLE_KEY (już masz!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2xscXlueW54Y2ZscHFsYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTgzMjUsImV4cCI6MjA3NjEzNDMyNX0.jqcXHXry0ifO2wnE8EBSa1nzWX8F0XdK05e8XjnGqSs
```

---

## Krok po kroku (3 minuty):

### 1. Otwórz Vercel Dashboard
🔗 https://vercel.com/dashboard

### 2. Kliknij na swój projekt (technik)

### 3. Settings → Environment Variables

### 4. Dodaj 4 zmienne (jedna po drugiej):

#### Zmienna 1/4:
- Click "Add New"
- Name: `JWT_SECRET`
- Value: `super-secret-jwt-key-change-in-production-2024-technik-app`
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Save

#### Zmienna 2/4:
- Click "Add New"
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://ibwllqynynxcflpqlaeh.supabase.co`
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Save

#### Zmienna 3/4:
- Click "Add New"
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2xscXlueW54Y2ZscHFsYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjY4OTIsImV4cCI6MjA2MjkwMjg5Mn0.wPbvRr7rWMJM7p8n7sRUqk7k0o6qMUVNNm2Zg6z5k1I`
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Save

#### Zmienna 4/4:
- Click "Add New"  
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2xscXlueW54Y2ZscHFsYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTgzMjUsImV4cCI6MjA3NjEzNDMyNX0.jqcXHXry0ifO2wnE8EBSa1nzWX8F0XdK05e8XjnGqSs`
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Save

### 5. REDEPLOY!
- Wróć do: Deployments
- Znajdź najnowszy (zielony ✅)
- ... (3 kropki) → **Redeploy**
- Poczekaj ~1 minutę

### 6. SPRAWDŹ!
Otwórz: https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/api/test-env

Powinno pokazać:
```json
{
  "environment": {
    "JWT_SECRET": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    ...
  },
  "allSet": true
}
```

### 7. TESTUJ LOGIN!
🔗 https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/admin/login

Credentials:
- Email: `admin@technik.pl`
- Password: `admin123`

---

## TO WSZYSTKO! 🎉

Po dodaniu zmiennych i redeploy login POWINIEN DZIAŁAĆ!
