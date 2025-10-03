# 🚀 QUICK START - Resend Email w 3 minuty

## Jesteś tutaj bo chcesz żeby aplikacja wysyłała emaile z potwierdzeniem zamówienia!

---

## ✅ Co masz już GOTOWE:

1. ✅ Kod wysyłania emaili w `pages/api/rezerwacje.js`
2. ✅ Profesjonalny HTML template z linkiem
3. ✅ Plik `.env.local` z placeholderami
4. ✅ Test konfiguracji `test-resend-config.js`
5. ✅ Homepage z informacją o emailu

---

## 🎯 Co MUSISZ zrobić (3 KROKI):

### KROK 1: Załóż darmowe konto (1 min)
```
Otwórz: https://resend.com/signup
Zarejestruj się (email lub GitHub)
```

### KROK 2: Skopiuj API key (1 min)
```
1. Dashboard → API Keys
2. Create API Key → "Technik App"
3. SKOPIUJ klucz (re_...)
```

### KROK 3: Wklej do .env.local (1 min)
```bash
# Otwórz plik: .env.local
# Znajdź:
RESEND_API_KEY=twoj_resend_api_key

# Zamień na (przykład):
RESEND_API_KEY=re_abc123xyz789_twoj_prawdziwy_klucz
```

**Zrestartuj serwer:** `Ctrl+C`, potem `npm run dev`

---

## ✅ SPRAWDŹ czy działa:

```bash
node test-resend-config.js
```

Jeśli widzisz: **🎉 KONFIGURACJA KOMPLETNA!** - gotowe! 🚀

---

## 📧 Testuj:

1. Otwórz: http://localhost:3000/rezerwacja-nowa
2. Wypełnij formularz + **pole Email**
3. Wyślij
4. Sprawdź email → kliknij link

---

## 💰 Koszt: **DARMOWY**

- 3,000 emaili/miesiąc za darmo
- Wystarczy na 100 zamówień/dzień
- Bez karty kredytowej

---

## 🆘 Problem?

### Test pokazuje błąd:
```bash
node test-resend-config.js
# Pokaże co jest źle i jak naprawić
```

### Email nie wysyła:
- Czy wkleiłeś API key do `.env.local`?
- Czy zrestartowałeś serwer? (`Ctrl+C`, `npm run dev`)
- Czy wypełniłeś pole email w formularzu?

---

## 📚 Więcej info:

- `RESEND_SETUP_SUMMARY.md` - pełne podsumowanie
- `INSTRUKCJA_RESEND_EMAIL_SETUP.md` - szczegółowa instrukcja

---

**TO WSZYSTKO! 3 kroki i emaile działają! 🎉**
