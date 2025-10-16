# 🚀 QUICK START - Zarządzanie Kontami Klientów

## 📋 Szybki Start (5 minut)

### 1. **Upewnij się że serwer działa**
```bash
npm run dev
```

### 2. **Otwórz panel administracyjny**
```
http://localhost:3000/admin/klienci
```

### 3. **Zobacz nowe funkcje**

✅ **Na liście klientów:**
- Badge'e statusu (🔐 Zarejestrowany, 👤 Gość, 🔒 Zablokowany, 🏢 Firma)
- Nowy filtr "Status konta"

✅ **Kliknij na klienta z hasłem** (ma badge 🔐 Zarejestrowany):
- Zobaczysz nową sekcję "🔐 Bezpieczeństwo konta"
- Przyciski: Reset hasła, Zablokuj/Odblokuj, Wyloguj

### 4. **Przetestuj funkcje**

#### 🔑 Reset hasła:
1. Kliknij "Resetuj hasło"
2. Wpisz nowe hasło (min. 6 znaków)
3. Kliknij "Resetuj hasło"
4. ✅ Sprawdź komunikat sukcesu

#### 🔒 Blokada konta:
1. Kliknij "Zablokuj konto"
2. Wpisz powód: "Test"
3. Kliknij "Zablokuj konto"
4. ✅ Status zmieni się na "🔒 Zablokowane"

#### 🔓 Odblokowanie:
1. Kliknij "Odblokuj konto"
2. Potwierdź
3. ✅ Status wraca do "✓ Aktywne"

---

## 🧪 Testowanie API (Opcjonalne)

### Metoda 1: Automatyczny test
```bash
node test-client-security-api.js
```

**UWAGA:** Najpierw zmień `TEST_CLIENT_ID` w pliku na prawidłowy ID klienta z Twojej bazy!

### Metoda 2: Ręczny test (Postman/curl)

#### Reset hasła:
```bash
curl -X POST http://localhost:3000/api/admin/client-accounts \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"resetPassword\",
    \"clientId\": \"CLI2025000001\",
    \"newPassword\": \"noweHaslo123\",
    \"adminId\": \"admin\",
    \"adminName\": \"Administrator\"
  }"
```

#### Pobierz info bezpieczeństwa:
```bash
curl "http://localhost:3000/api/admin/client-accounts?action=getSecurityInfo&clientId=CLI2025000001"
```

---

## 📁 Sprawdź pliki

### 1. **clients.json**
```bash
# Windows
type data\clients.json

# Linux/Mac
cat data/clients.json
```

Sprawdź czy klient ma nowe pola:
```json
{
  "isLocked": false,
  "failedLoginAttempts": 0,
  "passwordResetAt": "2025-10-12T...",
  "passwordResetBy": "admin"
}
```

### 2. **client-security-log.json** (nowy plik)
```bash
# Windows
type data\client-security-log.json

# Linux/Mac
cat data/client-security-log.json
```

Powinny być logi:
```json
[
  {
    "type": "PASSWORD_RESET",
    "clientId": "CLI2025000001",
    "adminName": "Administrator",
    "timestamp": "2025-10-12T..."
  }
]
```

---

## 🎨 Co zobaczysz?

### Lista klientów:
```
┌─────────────────────────────────────────────┐
│ Jan Kowalski                                │
│ [🔐 Zarejestrowany] [🏢 Firma]             │
│ ✉️ jan@example.com  📱 +48 123 456 789     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Anna Nowak                                  │
│ [👤 Gość]                                   │
│ ✉️ anna@example.com  📱 +48 987 654 321    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Piotr Kowalczyk                             │
│ [🔐 Zarejestrowany] [🔒 Zablokowany]       │
│ ✉️ piotr@example.com  📱 +48 555 666 777   │
└─────────────────────────────────────────────┘
```

### Szczegóły klienta - Sekcja Bezpieczeństwo:
```
╔════════════════════════════════════════╗
║  🔐 BEZPIECZEŃSTWO KONTA              ║
╚════════════════════════════════════════╝

┌──────────────┬──────────────┬──────────────┐
│ Status konta │ Hasło        │ Próby log.   │
│ 🔓 Aktywne   │ ✓ Ustawione  │ 0 / 5        │
└──────────────┴──────────────┴──────────────┘

┌──────────────┬──────────────┬──────────────┐
│ Ostatnie log.│ Aktywne sesje│              │
│ 12.10.2025   │ 1 sesja      │              │
│ 10:30        │ [Zobacz →]   │              │
└──────────────┴──────────────┴──────────────┘

[🔑 Resetuj hasło]  [🔒 Zablokuj konto]  [🚪 Wyloguj]
```

---

## ✅ Checklist pierwszego testu

- [ ] Serwer działa (npm run dev)
- [ ] Strona /admin/klienci się otwiera
- [ ] Widzę badge'e na listach klientów
- [ ] Filtr "Status konta" działa
- [ ] Klikam na klienta → widzę sekcję "Bezpieczeństwo"
- [ ] Resetuję hasło → działa
- [ ] Blokuję konto → status zmienia się
- [ ] Odblokuję konto → status wraca
- [ ] Sprawdzam pliki JSON → zmiany są zapisane

---

## 🐛 Problemy?

### Nie widzę sekcji "Bezpieczeństwo"?
➡️ Klient musi mieć `passwordHash` w pliku `clients.json`
➡️ Jeśli nie ma, użyj funkcji rejestracji lub dodaj ręcznie

### API zwraca błąd 404?
➡️ Sprawdź czy plik `/pages/api/admin/client-accounts.js` istnieje
➡️ Restart serwera (`npm run dev`)

### Badge'e się nie wyświetlają?
➡️ Sprawdź czy masz najnowszą wersję `/pages/admin/klienci/index.js`
➡️ Wyczyść cache przeglądarki (Ctrl+F5)

### Nie działa import ikon?
➡️ Sprawdź czy masz zainstalowane `react-icons`:
```bash
npm install react-icons
```

---

## 📚 Pełna dokumentacja

Przeczytaj: **ADMIN_CLIENT_MANAGEMENT_COMPLETE.md**

---

## 🎉 Gotowe!

Jeśli wszystkie testy przeszły - system działa! 🚀

**Następne kroki:**
1. ✅ Dodaj autoryzację admina w API
2. ✅ Zaimplementuj email notifications (opcjonalnie)
3. ✅ Dodaj dashboard ze statystykami (opcjonalnie)

---

**Pytania? Problemy?** Sprawdź dokumentację lub logi konsoli.
