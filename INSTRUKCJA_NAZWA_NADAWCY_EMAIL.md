# 📧 JAK ZMIENIĆ NAZWĘ NADAWCY EMAILA

## Obecnie email wygląda tak:
```
From: onboarding@resend.dev
Subject: ✅ Potwierdzenie rezerwacji - Technik
```

## Chcesz aby wyglądał tak:
```
From: Technik Serwis AGD <onboarding@resend.dev>
Subject: ✅ Potwierdzenie rezerwacji - Technik Serwis
```

---

## ✅ JAK TO ZMIENIĆ:

### Krok 1: Otwórz plik `.env.local`

### Krok 2: Znajdź linię (już jest dodana):
```bash
RESEND_EMAIL_FROM_NAME=Technik Serwis AGD
```

### Krok 3: Zmień na swoją nazwę:
```bash
# Przykłady:
RESEND_EMAIL_FROM_NAME=Twoja Firma Serwis
RESEND_EMAIL_FROM_NAME=AGD Naprawa 24/7
RESEND_EMAIL_FROM_NAME=Serwis Domowy
RESEND_EMAIL_FROM_NAME=Jan Kowalski - Technik
```

### Krok 4: Zrestartuj serwer
```bash
Ctrl+C  # Zatrzymaj
npm run dev  # Uruchom ponownie
```

---

## 📊 Jak to będzie wyglądać w różnych klientach email:

### Gmail:
```
Technik Serwis AGD
onboarding@resend.dev
✅ Potwierdzenie rezerwacji - Technik Serwis
```

### Outlook:
```
Technik Serwis AGD <onboarding@resend.dev>
✅ Potwierdzenie rezerwacji - Technik Serwis
```

### Apple Mail:
```
Technik Serwis AGD
✅ Potwierdzenie rezerwacji - Technik Serwis
```

---

## 🎨 Przykłady nazw:

### Dla firmy serwisowej:
```bash
RESEND_EMAIL_FROM_NAME=Technik Serwis AGD
RESEND_EMAIL_FROM_NAME=AGD Expert - Naprawy
RESEND_EMAIL_FROM_NAME=Serwis 24h
```

### Dla osoby prywatnej:
```bash
RESEND_EMAIL_FROM_NAME=Jan Kowalski
RESEND_EMAIL_FROM_NAME=Michał - Technik AGD
```

### Dla marki:
```bash
RESEND_EMAIL_FROM_NAME=TECHNIK - Twój Serwis
RESEND_EMAIL_FROM_NAME=AGD-MASTER Serwis
```

---

## ⚙️ Zaawansowane: Różne nazwy dla różnych emaili

Jeśli chcesz różne nazwy dla różnych typów emaili:

### W `.env.local`:
```bash
RESEND_EMAIL_FROM_NAME=Technik Serwis AGD
```

### W kodzie (pages/api/rezerwacje.js) możesz zmienić:
```javascript
from: `Twoja Firma <${process.env.RESEND_EMAIL_FROM}>`
```

Na przykład:
- Rezerwacje: "Technik - Nowe Zgłoszenie"
- Potwierdzenia: "Technik - Potwierdzenie"
- Faktury: "Technik - Księgowość"

---

## 🧪 Test:

### 1. Zmień nazwę w `.env.local`:
```bash
RESEND_EMAIL_FROM_NAME=TEST Nazwa Firmy
```

### 2. Zrestartuj serwer:
```bash
Ctrl+C
npm run dev
```

### 3. Wyślij test (z emailem technik24dev@gmail.com)

### 4. Sprawdź skrzynkę - zobaczysz:
```
From: TEST Nazwa Firmy <onboarding@resend.dev>
```

---

## 📝 Co można zmieniać:

| Element | Gdzie zmienić | Przykład |
|---------|---------------|----------|
| **Nazwa nadawcy** | `.env.local` → `RESEND_EMAIL_FROM_NAME` | Technik Serwis |
| **Email nadawcy** | `.env.local` → `RESEND_EMAIL_FROM` | noreply@domena.pl |
| **Temat emaila** | `pages/api/rezerwacje.js` → `subject` | Potwierdzenie |

---

## 🎯 Zalecenia:

### ✅ DOBRE nazwy:
- Krótkie (max 30 znaków)
- Czytelne
- Profesjonalne
- Z nazwą firmy/marki

### ❌ UNIKAJ:
- Zbyt długich nazw (>40 znaków)
- Dziwnych znaków (!@#$%)
- Samych wielkich liter (KRZYK)
- Spamerskich słów (PROMOCJA!!!, WYGRAJ!!!)

---

## Gotowe! 🎉

Teraz Twoje emaile mają profesjonalną nazwę nadawcy!
