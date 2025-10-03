# ⚠️ RESEND - TRYB TESTOWY

## Problem: Błąd 403 przy wysyłaniu emaili

```
❌ Email sending failed: {
  statusCode: 403,
  message: 'You can only send testing emails to your own email address (technik24dev@gmail.com). 
  To send emails to other recipients, please verify a domain at resend.com/domains'
}
```

---

## 🔍 Co się dzieje?

Resend w **trybie testowym** (bez zweryfikowanej domeny) pozwala wysyłać emaile **TYLKO** na adres email, którym zarejestrowałeś się na resend.com.

**Twój email rejestracyjny:** `technik24dev@gmail.com`

---

## ✅ ROZWIĄZANIE 1: Test z emailem właściciela (SZYBKIE)

### Wypełnij formularz i wpisz email:
```
technik24dev@gmail.com
```

Email zostanie wysłany i zobaczysz go w skrzynce! 📧

---

## ✅ ROZWIĄZANIE 2: Weryfikacja domeny (PRODUKCJA)

Jeśli chcesz wysyłać na DOWOLNE emaile:

### Krok 1: Przejdź do Resend Dashboard
```
https://resend.com/domains
```

### Krok 2: Dodaj swoją domenę
```
Kliknij: Add Domain
Wpisz: twojadomena.pl (jeśli masz)
```

### Krok 3: Dodaj DNS records
Resend pokaże CI 3-4 rekordy DNS do dodania:
- TXT record (weryfikacja)
- MX records (odbieranie)
- SPF/DKIM (bezpieczeństwo)

### Krok 4: Zmień `.env.local`
```bash
RESEND_EMAIL_FROM=noreply@twojadomena.pl
```

### Krok 5: Restart serwera
```bash
Ctrl+C
npm run dev
```

Po weryfikacji będziesz mógł wysyłać na DOWOLNE adresy! 🎉

---

## 🧪 OBECNIE (Tryb Testowy):

✅ **Działa:** Email na `technik24dev@gmail.com`
❌ **NIE działa:** Email na inne adresy (np. `bielaszkam2@gmail.com`)

---

## 📋 Quick Test:

1. Otwórz: http://localhost:3000/rezerwacja-nowa
2. Wypełnij formularz
3. W Step 3 wpisz email: **technik24dev@gmail.com**
4. Wyślij
5. Sprawdź skrzynkę technik24dev@gmail.com 📧

---

## 💡 Alternatywa bez domeny:

Jeśli nie masz własnej domeny, możesz:
1. Kupić tanią domenę (np. na nazwa.pl za ~20 zł/rok)
2. Użyć bezpłatnej domeny z Freenom
3. Lub testować tylko z emailem technik24dev@gmail.com

---

**Status:** ✅ Kod działa poprawnie, Resend wymaga weryfikacji domeny dla produkcji!
