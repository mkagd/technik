# 📧 TEST EMAIL REZERWACJI - KOMPLETNA INSTRUKCJA

**Data:** 2025-10-06  
**Status:** ✅ Gotowe do testowania  
**API:** `/api/rezerwacje`

---

## ✅ Co Jest Już Zrobione

Email jest **w pełni zaimplementowany** w `/pages/api/rezerwacje.js`:

- ✅ Piękny szablon HTML (responsive design)
- ✅ Lista urządzeń z ikonkami SVG
- ✅ Informacje o klientcie (imię, adres, telefon, email)
- ✅ Opis problemu dla każdego urządzenia
- ✅ Sekcja "Co dalej?" (następne kroki)
- ✅ Informacje o zabudowie (jeśli dotyczy)
- ✅ Obsługa błędów (email wysyła się nawet jeśli Resend nie działa)

---

## 🧪 JAK PRZETESTOWAĆ

### Krok 1: Otwórz Stronę Rezerwacji

```
http://localhost:3000/client/new-order
```

### Krok 2: Wypełnij Formularz

**KROK 1 - Dane kontaktowe:**
```
Imię i nazwisko: Jan Testowy
Email: twoj-email@gmail.com    ← PODAJ SWÓJ PRAWDZIWY EMAIL!
Telefon: 123456789
```

**KROK 2 - Adres:**
```
Miasto: Warszawa
Ulica: Testowa
Numer budynku: 1
Kod pocztowy: 00-001
```

**KROK 3 - Dostępność:**
```
Dodaj slot dostępności (opcjonalnie)
np. "Cały tydzień 9-17"
```

**KROK 4 - Urządzenia:**
```
Kliknij: "Dodaj urządzenie"

Typ urządzenia: Pralka
Marka: Samsung (opcjonalnie)
Model: WW90 (opcjonalnie)
Opis problemu: Nie wiruje, dziwne dźwięki podczas prania

(Opcjonalnie) Zaznacz:
☑️ Urządzenie w zabudowie
```

### Krok 3: Wyślij Zgłoszenie

Kliknij: **"Wyślij zgłoszenie"**

### Krok 4: Sprawdź Email

📧 **Sprawdź swoją skrzynkę pocztową!**

**Szukaj:**
- 📤 **Od:** Serwis z Dojazdem <biuro@serwiszdojazdem.pl>
- 📧 **Temat:** ✅ Potwierdzenie rezerwacji serwisu AGD

**Sprawdź też:**
- 📁 Folder SPAM
- 📁 Folder Promocje (Gmail)
- 📁 Folder Social (Gmail)

---

## 📧 Przykład Emaila

### Wygląd Emaila:

```
═══════════════════════════════════════
          ✅ Potwierdzenie rezerwacji
     Twoje zgłoszenie zostało pomyślnie przyjęte
═══════════════════════════════════════

Witaj Jan Testowy,

Dziękujemy za złożenie zgłoszenia serwisowego. 
Twoje zgłoszenie zostało zarejestrowane i zostanie 
obsłużone tak szybko jak to możliwe.

┌─────────────────────────────────────┐
│  📦 Zgłoszone urządzenia:           │
├─────────────────────────────────────┤
│  [🌀] Pralka                        │
│      Nie wiruje, dziwne dźwięki     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📋 Szczegóły zgłoszenia:           │
├─────────────────────────────────────┤
│  📍 Adres:    Warszawa, Testowa 1   │
│  📞 Telefon:  123456789              │
│  📧 Email:    jan@example.com        │
│  📅 Data:     06.10.2025 14:30       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🚀 Co dalej?                        │
├─────────────────────────────────────┤
│  • Nasz zespół skontaktuje się      │
│    z Tobą w ciągu 24 godzin         │
│  • Ustalimy dogodny termin wizyty   │
│  • Otrzymasz SMS z przypomnieniem   │
│    dzień przed wizytą               │
└─────────────────────────────────────┘

─────────────────────────────────────────
Jeśli masz pytania, skontaktuj się z nami
odpowiadając na tego maila lub dzwoniąc
pod numer podany na naszej stronie.

© 2025 Serwis AGD
═══════════════════════════════════════
```

---

## 🔍 DEBUGGING

### Console Serwera (Terminal)

Po wysłaniu formularza sprawdź terminal z `npm run dev`:

**Sukces:**
```
📧 Sending email to: jan@example.com
✅ Email sent successfully to: jan@example.com
📧 Resend response: { id: 're_abc123...', from: 'biuro@...' }
```

**Błąd:**
```
❌ Email error: [szczegóły błędu]
📧 Email error details: Validation error: ...
```

### Dashboard Resend

1. Otwórz: **https://resend.com/emails**
2. Zaloguj się swoim kontem
3. Zobacz listę wysłanych emaili
4. Sprawdź status:
   - ✅ **Delivered** - Email dostarczony
   - ⏳ **Sending** - W trakcie wysyłki
   - ❌ **Bounced** - Odrzucony (błędny adres)
   - ❌ **Failed** - Błąd wysyłki

---

## ⚠️ TYPOWE PROBLEMY

### Problem 1: Email Nie Przychodzi

**Przyczyna:** Domena `biuro@serwiszdojazdem.pl` niezweryfikowana

**Rozwiązanie:**

1. Otwórz `.env.local`
2. Zmień linię:
   ```bash
   RESEND_EMAIL_FROM=biuro@serwiszdojazdem.pl
   ```
   Na:
   ```bash
   RESEND_EMAIL_FROM=onboarding@resend.dev
   ```
3. Restart serwera: `Ctrl+C` → `npm run dev`
4. Testuj ponownie

**Domena testowa `onboarding@resend.dev`:**
- ✅ Działa **od razu** bez weryfikacji
- ✅ Wysyła na dowolne adresy email
- ⚠️ Tylko do testów (nie do produkcji)

---

### Problem 2: 403 Forbidden

**Error w console:**
```
❌ Email error: Resend API error: Forbidden
```

**Przyczyna:** API Key niepoprawny lub wygasł

**Rozwiązanie:**

1. Otwórz: https://resend.com/api-keys
2. Skopiuj swój API Key (zaczyna się od `re_`)
3. Otwórz `.env.local`
4. Zaktualizuj:
   ```bash
   RESEND_API_KEY=re_twoj_nowy_klucz
   ```
5. Restart serwera

---

### Problem 3: Email w Spamie

**Przyczyna:** Niezweryfikowana domena lub brak SPF/DKIM

**Rozwiązanie:**

**Krótkoterminowe:**
- Oznacz email jako "nie spam"
- Dodaj `biuro@serwiszdojazdem.pl` do kontaktów

**Długoterminowe:**
- Zweryfikuj domenę w Resend
- Dodaj DNS records (SPF, DKIM, DMARC)
- Instrukcja: `INSTRUKCJA_WERYFIKACJA_DOMENY_RESEND.md`

---

### Problem 4: Invalid Recipient

**Error w console:**
```
❌ Email error: Validation error: Invalid recipient
```

**Przyczyna:** Błędny format emaila w formularzu

**Rozwiązanie:**
- Sprawdź czy email ma format: `nazwa@domena.pl`
- Usuń spacje przed/po emailu
- Sprawdź czy pole email jest wypełnione

---

## 📊 CO SPRAWDZA API

### Walidacja przed wysłaniem:

```javascript
// API sprawdza:
1. ✅ RESEND_API_KEY jest skonfigurowany
2. ✅ Nie zawiera placeholder 'twoj_resend_api_key'
3. ✅ Email odbiorcy jest podany
4. ✅ Email nadawcy jest skonfigurowany

// Jeśli wszystko OK:
→ Wysyła email przez Resend

// Jeśli błąd:
→ Zapisuje rezerwację
→ Zwraca emailSent: false, emailError: "szczegóły"
→ Rezerwacja DZIAŁA nawet bez emaila
```

---

## 🎨 Funkcje Specjalne Emaila

### Ikony Urządzeń

Email automatycznie dobiera ikonkę na podstawie typu:

```javascript
Pralka      → /icons/agd/pralka.svg
Lodówka     → /icons/agd/lodowka.svg
Zmywarka    → /icons/agd/zmywarka.svg
Piekarnik   → /icons/agd/piekarnik.svg
Mikrofalówka → /icons/agd/mikrofalowka.svg
Suszarka    → /icons/agd/suszarka.svg
Okap        → /icons/agd/okap.svg
Inne        → /icons/agd/inne.svg
```

### Sekcja Zabudowy

Jeśli zaznaczysz **"Urządzenie w zabudowie"**:

```
┌──────────────────────────────────────┐
│  🔧 Informacje o zabudowie:          │
├──────────────────────────────────────┤
│  ⚠️ Urządzenie w zabudowie           │
│  • Urządzenie wbudowane w meble      │
│  • Wymaga demontażu i montażu        │
│  • Trudna zabudowa (jeśli zaznaczone)│
└──────────────────────────────────────┘
```

---

## 🚀 Co Dalej?

Po udanym teście możesz:

### 1. **Zweryfikować Domenę**
- Dashboard Resend → Domains → Add Domain
- Dodaj DNS records
- Wysyłaj z `biuro@serwiszdojazdem.pl`

### 2. **Dodać Email dla Admina**
- Admin dostaje email o nowej rezerwacji
- Zawiera link do przydzielenia wizyty

### 3. **Email Potwierdzenia Wizyty**
- Klient dostaje email z terminem
- Link autologin do śledzenia statusu

### 4. **Email Zmiany Statusu**
- Technik zmienia status → email do klienta
- "Naprawa ukończona", "W trakcie", itp.

---

## 📋 Checklist Testowania

```
□ Otworzono /client/new-order
□ Wypełniono formularz (wszystkie kroki)
□ Podano WŁASNY email
□ Wysłano zgłoszenie
□ Sprawdzono console serwera
□ Email przyszedł (lub sprawdzono spam)
□ Email wygląda poprawnie (obrazki, tekst)
□ Sprawdzono Resend Dashboard
□ Status: Delivered
```

---

## 🎯 READY TO TEST!

**Otwórz teraz:**
```
http://localhost:3000/client/new-order
```

**I wypełnij formularz używając SWOJEGO emaila!**

---

**Powodzenia! 🚀📧**

Jeśli napotkasz problemy, sprawdź sekcję **DEBUGGING** powyżej.
