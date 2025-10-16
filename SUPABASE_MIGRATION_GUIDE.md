# 🗄️ Migracja do Supabase - Przewodnik

## Krok 1: Utworzenie projektu Supabase

1. **Otwórz:** https://supabase.com
2. **Zaloguj się** (GitHub/Google/Email)
3. **Kliknij:** "New Project"
4. **Wypełnij:**
   - **Name:** `technik`
   - **Database Password:** (wygeneruj silne hasło - ZAPISZ!)
   - **Region:** `Central EU (Frankfurt)` (najbliżej Polski)
   - **Plan:** Free
5. **Kliknij:** "Create new project"
6. **Czekaj 2-3 minuty** aż projekt się utworzy

---

## Krok 2: Pobierz dane połączenia

Po utworzeniu projektu:

1. W lewym menu kliknij **"Settings"** (ikonka koła zębatego)
2. Kliknij **"API"**
3. **Skopiuj te wartości:**

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (SECRET!)
```

---

## Krok 3: Struktura bazy danych

### Tabele do utworzenia:

1. **orders** - Zlecenia
2. **clients** - Klienci  
3. **employees** - Pracownicy
4. **parts** - Części
5. **part_requests** - Zamówienia części
6. **visits** - Wizyty
7. **sessions** - Sesje logowania
8. **accounts** - Konta użytkowników
9. **settings** - Ustawienia systemu

---

## Krok 4: Migracja danych

Użyj skryptu `migrate-to-supabase.js` aby przenieść dane z JSON do Supabase.

---

## Krok 5: Aktualizacja zmiennych środowiskowych

Dodaj do Vercel:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (tylko server-side!)
```

---

## Krok 6: Deploy

```bash
git add .
git commit -m "feat: migrate to Supabase"
git push
```

Vercel automatycznie zrobi redeploy!

---

## ✅ Gotowe!

Aplikacja będzie działać 24/7 bez Twojego komputera!
