# 📧 INSTRUKCJA KONFIGURACJI RESEND API

## 🎯 Krok po kroku - zajmie 3 minuty!

### 1️⃣ Załóż darmowe konto Resend

1. Otwórz: **https://resend.com/signup**
2. Zarejestruj się przez:
   - Email + hasło, LUB
   - GitHub account (szybsze)
3. Potwierdź email (sprawdź skrzynkę)

---

### 2️⃣ Wygeneruj API Key

1. Po zalogowaniu, przejdź do: **Dashboard → API Keys**
   - Lub bezpośredni link: https://resend.com/api-keys
2. Kliknij **"Create API Key"**
3. Nazwij klucz np. `Technik App Dev`
4. Wybierz uprawnienia: **Full Access** lub **Sending access**
5. Kliknij **Create**
6. **SKOPIUJ klucz** (zaczyna się od `re_...`)
   ⚠️ Klucz wyświetli się tylko raz! Zapisz go bezpiecznie

---

### 3️⃣ Wklej API Key do projektu

1. Otwórz plik: **`.env.local`** (w głównym folderze projektu)
2. Znajdź linię: `RESEND_API_KEY=twoj_resend_api_key`
3. Zamień `twoj_resend_api_key` na skopiowany klucz:
   ```bash
   RESEND_API_KEY=re_twoj_prawdziwy_klucz_tutaj
   ```

---

### 4️⃣ Zrestartuj serwer dev

**WAŻNE:** Next.js musi zostać zrestartowany żeby wczytać nowe zmienne!

W terminalu:
```bash
# 1. Zatrzymaj serwer (naciśnij Ctrl+C)
Ctrl+C

# 2. Uruchom ponownie
npm run dev
```

---

### 5️⃣ Testuj wysyłanie emaili

1. Otwórz formularz: **http://localhost:3000/rezerwacja-nowa**
2. Wypełnij wszystkie kroki
3. **WAŻNE:** W Step 3 wypełnij pole **Email** (jest opcjonalne ale potrzebne do testu)
4. Wyślij formularz
5. Sprawdź skrzynkę email - powinieneś otrzymać potwierdzenie z linkiem!

---

## 📊 Status wysyłania emaili

### ✅ Email zostanie wysłany jeśli:
- ✅ `RESEND_API_KEY` jest poprawny (w `.env.local`)
- ✅ Serwer dev został zrestartowany
- ✅ User wypełnił pole "Email" w formularzu
- ✅ Email "from": `onboarding@resend.dev` (domena testowa Resend)

### ❌ Email NIE zostanie wysłany jeśli:
- ❌ `RESEND_API_KEY` zawiera placeholder `twoj_resend_api_key`
- ❌ Brak restartu serwera po zmianach w `.env.local`
- ❌ Pole email jest puste w formularzu
- ❌ Nieprawidłowy API key (błąd 401)

---

## 🔍 Jak sprawdzić czy działa?

### W terminalu (konsola dev):
Po wysłaniu formularza zobaczysz:
```bash
✅ Order created: ORDW252750001
📧 Email sent successfully to: jan@example.com
✅ POST /api/rezerwacje 200 in 1234ms
```

### W Dashboard Resend:
1. Przejdź do: **https://resend.com/emails**
2. Zobaczysz listę wysłanych emaili
3. Status: **Delivered**, **Bounced**, itp.
4. Możesz kliknąć i zobaczyć treść emaila

---

## 📝 Co zawiera email?

- ✅ **Profesjonalny design** (gradient header, ikonki)
- ✅ **Numer zamówienia** (np. ORDW252750001)
- ✅ **Link do śledzenia** → `Sprawdź Status Zamówienia`
- ✅ **Data wizyty**
- ✅ **Informacje kontaktowe**
- ✅ **Responsywny** (działa na mobile)

Przykładowy link w emailu:
```
http://localhost:3000/moje-zamowienie?order=ORDW252750001
```

---

## 🚀 Dla produkcji (deploy na żywo)

### Zmień `RESEND_EMAIL_FROM`:

Zamiast `onboarding@resend.dev` użyj własnej domeny:

1. W Resend Dashboard → **Domains** → **Add Domain**
2. Dodaj swoją domenę (np. `twojadomena.pl`)
3. Dodaj DNS records (Resend pokaże które)
4. Po weryfikacji zmień w `.env.local`:
   ```bash
   RESEND_EMAIL_FROM=noreply@twojadomena.pl
   ```

### Zmień `NEXT_PUBLIC_BASE_URL`:

Na produkcji zmień na faktyczny adres:
```bash
NEXT_PUBLIC_BASE_URL=https://twojadomena.pl
```

---

## 🎁 Plan darmowy (FREE)

- ✅ **3,000 emaili/miesiąc** - za darmo na zawsze
- ✅ Bez karty kredytowej
- ✅ Wszystkie funkcje API
- ✅ Dashboard + Analytics
- ✅ Wystarczy dla małego/średniego serwisu

---

## 🆘 Problemy?

### Email się nie wysyła:
1. Sprawdź konsolę - czy są błędy?
2. Czy zrestartowałeś serwer po zmianie `.env.local`?
3. Czy API key jest poprawny? (sprawdź na resend.com/api-keys)
4. Czy wypełniłeś pole email w formularzu?

### Błąd 401 (Unauthorized):
- API key jest nieprawidłowy lub wygasł
- Wygeneruj nowy klucz na resend.com

### Email nie dochodzi:
- Sprawdź SPAM folder
- Sprawdź Dashboard Resend czy email został wysłany
- Użyj `onboarding@resend.dev` jako sender (na start)

---

## ✅ Gotowe!

Po wykonaniu kroków 1-4, system emaili będzie działał! 🎉

Każda rezerwacja będzie wysyłała email z:
- Potwierdzeniem zamówienia
- Numerem ORDW...
- Linkiem do sprawdzenia statusu

**Miłego testowania!** 🚀
