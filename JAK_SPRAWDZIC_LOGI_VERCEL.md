# 🔍 JAK SPRAWDZIĆ LOGI W VERCEL - INSTRUKCJA KROK PO KROKU

## 🎯 Deployment #15 z rozszerzonym logowaniem jest gotowy!

---

## 📋 KROK 1: Otwórz Vercel Dashboard

1. **Przejdź do**: https://vercel.com/dashboard
2. **Zaloguj się** (jeśli nie jesteś zalogowany)
3. **Znajdź projekt** "technik" lub "Technik"
4. **Kliknij** na projekt

---

## 📋 KROK 2: Zobacz ostatni deployment

1. W dashboardzie projektu zobaczysz **"Latest Deployments"**
2. **Kliknij** na najnowszy deployment (powinien być z przed kilku minut)
3. **Lub** kliknij zakładkę **"Deployments"** na górze

---

## 📋 KROK 3: Otwórz Function Logs

1. W szczegółach deploymentu znajdź sekcję **"Functions"**
2. **Kliknij** na funkcję `/api/auth/login`
3. **Lub** kliknij **"View Function Logs"** / **"Runtime Logs"**

---

## 📋 KROK 4: Spróbuj się zalogować

1. **Otwórz aplikację** w nowej karcie:
   ```
   https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/admin/login
   ```

2. **Wprowadź dane**:
   - Email: `admin@technik.pl`
   - Hasło: `admin123`

3. **Kliknij** "Zaloguj"

---

## 📋 KROK 5: Zobacz szczegółowe logi

Wrócić do Vercel Dashboard → Runtime Logs

Powinieneś zobaczyć coś takiego:

```
✅ JEŚLI DZIAŁA:
🔐 Login handler started - method: POST
🔐 Parsing request body...
🔐 Login attempt: { receivedEmail: 'admin@technik.pl', ... }
🔐 Querying Supabase...
🔐 Supabase client created
🔐 Supabase query result: { hasAccount: false, hasError: true }
🔐 Account not found in database: admin@technik.pl
🔐 Using env fallback for admin
🔐 Creating token for env admin...
🔐 Login success (env fallback): admin@technik.pl
```

```
❌ JEŚLI BŁĄD:
🔐 Login handler started - method: POST
🔐 Parsing request body...
🔐 Login error - DETAILED: {
  message: "Cannot find module 'jsonwebtoken'",  ← PRZYKŁAD BŁĘDU
  stack: "Error: Cannot find module...",
  name: "Error",
  code: "MODULE_NOT_FOUND"
}
```

---

## 📋 KROK 6: Skopiuj dokładny błąd

1. **Znajdź** linię z `🔐 Login error - DETAILED:`
2. **Skopiuj** cały obiekt błędu (message, stack, name, code)
3. **Wyślij mi** skopiowany błąd

---

## 🆘 Jeśli nie widzisz logów:

### Opcja A: Real-time Logs
1. Vercel Dashboard → Project
2. **Zakładka "Logs"** (na górze)
3. Wybierz **"All Functions"**
4. Spróbuj się zalogować ponownie
5. Logi powinny pojawić się w czasie rzeczywistym

### Opcja B: Deployment Logs
1. Vercel Dashboard → Deployments
2. Kliknij najnowszy deployment (c5728a2)
3. Scroll w dół do **"Function Logs"** lub **"Runtime Logs"**
4. Kliknij **"View More"** jeśli dostępne

### Opcja C: Via URL
1. Otwórz:
   ```
   https://vercel.com/[twoj-username]/technik/deployments
   ```
2. Kliknij najnowszy
3. Szukaj sekcji "Logs"

---

## 🎯 Co szukamy w logach:

### Kluczowe informacje:

1. **Czy handler startuje?**
   ```
   🔐 Login handler started - method: POST
   ```

2. **Czy Supabase działa?**
   ```
   🔐 Supabase client created
   🔐 Supabase query result: ...
   ```

3. **Dokładny błąd:**
   ```
   message: "..."  ← CO TO MÓWI?
   name: "..."     ← JAKI TYP BŁĘDU?
   code: "..."     ← KOD BŁĘDU?
   ```

---

## 📝 Przykłady możliwych błędów:

### 1. Module not found
```json
{
  "message": "Cannot find module 'jsonwebtoken'",
  "code": "MODULE_NOT_FOUND"
}
```
**Fix**: Dodać jsonwebtoken do package.json

### 2. Supabase connection error
```json
{
  "message": "supabase_url is required",
  "code": "SUPABASE_ERROR"
}
```
**Fix**: Dodać zmienne środowiskowe

### 3. JWT sign error
```json
{
  "message": "secretOrPrivateKey must have a value",
  "code": "JWT_ERROR"
}
```
**Fix**: Ustawić JWT_SECRET

---

## ⚡ SZYBKA AKCJA:

### Teraz (za 1 minutę gdy deployment zakończy):

1. ✅ Otwórz https://vercel.com/dashboard
2. ✅ Znajdź projekt "technik"
3. ✅ Kliknij "Logs" lub najnowszy deployment
4. ✅ Spróbuj się zalogować: https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/admin/login
5. ✅ **SKOPIUJ** cały obiekt błędu z logów
6. ✅ **WYŚLIJ MI** skopiowany błąd

---

## 📊 Screenshots pomocy:

Jeśli nie możesz znaleźć logów, zrób screenshot:
- Dashboard projektu
- Listy deploymentów
- Jakiejkolwiek sekcji gdzie jesteś

Wyślę dokładną instrukcję gdzie kliknąć!

---

**Status**: ⏳ Deployment #15 w toku (1-2 min)  
**ETA**: Powinien być gotowy za ~1 minutę  
**Action**: Sprawdź logi i wyślij mi błąd!

---

## 🎯 ALTERNATYWA - Test przez Terminal:

Jeśli masz problemy z Vercel Dashboard, możesz przetestować przez curl:

```bash
curl -X POST https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@technik.pl","password":"admin123"}' \
  -v
```

To pokaże odpowiedź serwera w terminalu.

---

**NAJWAŻNIEJSZE**: Potrzebuję zobaczyć **dokładny błąd** z logów Vercel!  
Wtedy będę wiedział co naprawić! 🔧
