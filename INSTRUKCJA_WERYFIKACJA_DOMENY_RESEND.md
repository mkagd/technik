# 🚀 JAK WYSYŁAĆ EMAIL NA DOWOLNE ADRESY - INSTRUKCJA

## Problem:
Resend w trybie testowym pozwala wysyłać TYLKO na email właściciela konta (technik24dev@gmail.com).

## ✅ ROZWIĄZANIE 1: Weryfikacja własnej domeny (ZALECANE)

### Wymagania:
- Posiadasz domenę (np. twoja-firma.pl, serwis-agd.pl)
- Dostęp do panelu DNS domeny

### Kroki:

#### 1. Przejdź do Resend Dashboard
```
https://resend.com/domains
```

#### 2. Dodaj domenę
- Kliknij: **"Add Domain"**
- Wpisz: **twoja-domena.pl** (bez www, bez http)
- Kliknij: **"Add"**

#### 3. Skopiuj DNS records
Resend pokaże Ci rekordy DNS do dodania (przykład):

```
TXT  @  resend-verify=abc123xyz789
TXT  @  v=spf1 include:_spf.resend.com ~all
TXT  resend._domainkey  v=DKIM1; k=rsa; p=MIGfMA0G...
```

#### 4. Dodaj DNS records w panelu domeny
Gdzie dodać rekordy DNS:
- **nazwa.pl**: Panel Klienta → Zarządzanie DNS
- **OVH**: Panel klienta → Domeny → Strefa DNS
- **home.pl**: Panel → Usługi → Domeny → DNS
- **Cloudflare**: Dashboard → DNS → Records

Dodaj WSZYSTKIE rekordy które pokazał Resend!

#### 5. Zaczekaj na propagację (5-30 minut)
```bash
# Sprawdź czy rekordy są widoczne:
nslookup -type=TXT twoja-domena.pl
```

#### 6. Wróć do Resend i kliknij "Verify"
Jeśli rekordy są poprawne, zobaczysz: ✅ **Verified**

#### 7. Zmień `.env.local`
```bash
# Otwórz plik: .env.local
# Zmień linię:
RESEND_EMAIL_FROM=onboarding@resend.dev

# Na:
RESEND_EMAIL_FROM=noreply@twoja-domena.pl
```

#### 8. Zrestartuj serwer
```bash
Ctrl+C  # Zatrzymaj serwer
npm run dev  # Uruchom ponownie
```

#### 9. Testuj!
Teraz możesz wysyłać na **DOWOLNE emaile**! 🎉

---

## ✅ ROZWIĄZANIE 2: Użyj testowej subdomeny Resend

Jeśli NIE masz własnej domeny, Resend może dać Ci subdomenę testową:

#### 1. Przejdź do Dashboard
```
https://resend.com/domains
```

#### 2. Sprawdź czy masz subdomenę
Niektóre konta dostają automatycznie subdomenę typu:
```
twoj-username.resend.dev
```

#### 3. Jeśli masz, użyj jej:
```bash
# W .env.local:
RESEND_EMAIL_FROM=noreply@twoj-username.resend.dev
```

**Ograniczenia subdomeny:**
- ⚠️ Może być limit wysyłek
- ⚠️ Może nie działać na wszystkich serwerach email
- ⚠️ Nie dla produkcji

---

## ✅ ROZWIĄZANIE 3: Kup tanią domenę

Jeśli nie masz domeny, możesz kupić za ~20-50 zł/rok:

### Polecane rejestry:
1. **nazwa.pl** - 25 zł/rok (.pl)
2. **OVH** - 35 zł/rok (.pl)
3. **home.pl** - 29 zł/rok (.pl)

### Po zakupie:
1. Postępuj według **ROZWIĄZANIA 1** powyżej
2. Dodaj DNS records
3. Zweryfikuj w Resend
4. Gotowe! 🎉

---

## 🧪 Jak sprawdzić czy działa?

### Test 1: Przed weryfikacją
```
Email w formularzu: jakikolwiek@gmail.com
Wynik: ❌ Email nie został wysłany - tryb testowy
```

### Test 2: Po weryfikacji domeny
```
Email w formularzu: jakikolwiek@gmail.com
Wynik: ✅ Potwierdzenie wysłane na: jakikolwiek@gmail.com
```

---

## 📊 Porównanie opcji:

| Opcja | Koszt | Czas | Elastyczność |
|-------|-------|------|--------------|
| Własna domena | ~25 zł/rok | 30 min setup | ✅ Pełna |
| Subdomena Resend | Darmowe | 5 min | ⚠️ Ograniczona |
| Tylko testowy email | Darmowe | 0 min | ❌ Brak |

---

## 🎯 ZALECENIE:

Jeśli to projekt **produkcyjny** → Kup domenę i zweryfikuj (25 zł/rok)  
Jeśli to tylko **testy** → Używaj technik24dev@gmail.com na razie

---

## 🆘 Problemy?

### "DNS records not found"
- Zaczekaj dłużej (do 24h w rzadkich przypadkach)
- Sprawdź czy rekordy dodane poprawnie (bez spacji, dokładne wartości)

### "Domain already verified by another account"
- Domena jest już używana na innym koncie Resend
- Użyj innej domeny lub skontaktuj się z supportem Resend

### "Email still not sending"
- Sprawdź czy zmieniłeś `RESEND_EMAIL_FROM` w `.env.local`
- Zrestartowałeś serwer? (Ctrl+C → npm run dev)
- Sprawdź logi serwera - czy są błędy?

---

**Powodzenia z weryfikacją domeny!** 🚀
