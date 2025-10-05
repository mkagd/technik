# 🔒 BLOKADA KONTA - DOKUMENTACJA

**Data:** 2025-10-04  
**Status:** ✅ ZAIMPLEMENTOWANO

---

## 🎯 CO ZOSTAŁO DODANE

### **Ręczna blokada konta przez admina**

Admin może teraz **ręcznie zablokować** konto pracownika bezpośrednio z panelu.

**Przypadki użycia:**
- 👤 Pracownik odszedł z firmy
- 🔐 Podejrzenie włamania na konto
- ⚠️ Tymczasowe zawieszenie dostępu
- 🚨 Naruszenie polityki bezpieczeństwa

---

## 📋 JAK TO DZIAŁA

### **1. Automatyczna blokada (już działała) ✅**

**Trigger:** 5 nieudanych prób logowania

```javascript
// W technician/auth.js
if (employee.failedLoginAttempts >= 5) {
  employee.isLocked = true;
  employee.lockReason = 'automatic'; // 5 failed attempts
}
```

**Co się dzieje:**
- ❌ Pracownik próbuje się zalogować ze złym hasłem 5 razy
- 🔒 System automatycznie ustawia `isLocked: true`
- ⛔ Kolejne próby logowania są odrzucane z błędem: "Account locked"
- 👨‍💼 Admin widzi w panelu: **Status konta: ZABLOKOWANE**
- ✅ Admin może odblokować konto przyciskiem "Odblokuj konto"

---

### **2. Ręczna blokada (nowe!) 🆕**

**Trigger:** Admin klika przycisk "Zablokuj konto"

```javascript
// API: POST /api/admin/employee-password
{
  "action": "lock",
  "employeeId": "EMP25189001",
  "adminId": "ADMIN001"
}
```

**Co się dzieje:**
- 🔒 System ustawia `isLocked: true`
- 📝 Zapisuje: `lockedBy`, `lockedAt`, `lockReason: 'manual'`
- ⛔ Pracownik nie może się zalogować
- 👨‍💼 Admin widzi w panelu: **Status konta: ZABLOKOWANE** (czerwony)
- ✅ Admin może odblokować konto przyciskiem "Odblokuj konto"

---

## 🖥️ INTERFEJS UŻYTKOWNIKA

### **Panel Admina - Zakładka Bezpieczeństwo**

**Lokalizacja:**  
Panel admin → Pracownicy → [Edytuj pracownika] → 🔐 Bezpieczeństwo

**Widoczne elementy:**

#### **Status konta:**
```
┌─────────────────────────────────────┐
│ Status konta:                       │
│ 🔓 AKTYWNE (zielony)                │
│ lub                                 │
│ 🔒 ZABLOKOWANE (czerwony)           │
└─────────────────────────────────────┘
```

#### **Przyciski akcji:**

**Gdy konto AKTYWNE:**
```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ Wygeneruj tymczasowe │  │ Wymaga zmiany        │  │ 🔒 Zablokuj konto   │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
   (fioletowy)               (pomarańczowy)            (CZERWONY)
```

**Gdy konto ZABLOKOWANE:**
```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ Wygeneruj tymczasowe │  │ Wymaga zmiany        │  │ 🔓 Odblokuj konto   │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
   (fioletowy)               (pomarańczowy)            (ZIELONY)
```

#### **Ostrzeżenie o nieudanych próbach:**

Gdy pracownik ma 3+ nieudane próby (ale jeszcze nie 5):

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ Ostrzeżenie - Wielokrotne nieudane próby logowania      │
│                                                            │
│ Pracownik ma już 3 nieudane próby z 5 możliwych.          │
│ Po przekroczeniu limitu konto zostanie automatycznie       │
│ zablokowane.                                               │
│                                                            │
│ 💡 Rozważ reset hasła lub kontakt z pracownikiem.         │
└────────────────────────────────────────────────────────────┘
```

---

## 🔧 API ENDPOINT

### **POST /api/admin/employee-password**

#### **Action: `lock` (nowe!)**

**Request:**
```json
{
  "action": "lock",
  "employeeId": "EMP25189001",
  "adminId": "ADMIN001"
}
```

**Response (sukces):**
```json
{
  "success": true,
  "message": "Account locked successfully",
  "data": {
    "employeeId": "EMP25189001",
    "isLocked": true,
    "lockedBy": "ADMIN001",
    "lockedAt": "2025-10-04T14:30:00.000Z"
  }
}
```

**Response (błąd - już zablokowane):**
```json
{
  "success": false,
  "message": "Account is already locked"
}
```

#### **Action: `unlock` (zaktualizowane)**

**Request:**
```json
{
  "action": "unlock",
  "employeeId": "EMP25189001",
  "adminId": "ADMIN001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account unlocked successfully",
  "data": {
    "employeeId": "EMP25189001",
    "isLocked": false
  }
}
```

---

## 📊 STRUKTURA DANYCH

### **employees.json - Nowe pola:**

```json
{
  "id": "EMP25189001",
  "name": "Jan Kowalski",
  "email": "jan.kowalski@techserwis.pl",
  
  // === BLOKADA KONTA ===
  "isLocked": false,              // true = konto zablokowane
  "lockReason": "manual",         // "manual" | "automatic"
  "lockedBy": "ADMIN001",         // Kto zablokował (jeśli manual)
  "lockedAt": "2025-10-04T14:30:00.000Z",  // Kiedy zablokowano
  "unlockedBy": "ADMIN001",       // Kto odblokował
  "unlockedAt": "2025-10-04T15:00:00.000Z", // Kiedy odblokowano
  
  // === NIEUDANE PRÓBY ===
  "failedLoginAttempts": 0,       // Liczba nieudanych prób (0-5)
  "lastLoginAttempt": null        // Data ostatniej próby
}
```

---

## 🧪 SCENARIUSZE TESTOWE

### **Test 1: Ręczna blokada konta**

1. Otwórz: http://localhost:3000/admin/pracownicy
2. Wybierz pracownika → Edytuj → Bezpieczeństwo
3. Sprawdź status: **Status konta: 🔓 AKTYWNE**
4. Kliknij przycisk: **🔒 Zablokuj konto**
5. Potwierdź w oknie dialogowym
6. ✅ Status powinien zmienić się na: **Status konta: 🔒 ZABLOKOWANE**
7. ✅ Przycisk "Zablokuj konto" znika, pojawia się "Odblokuj konto"

### **Test 2: Próba logowania zablokowanego konta**

1. Po zablokowaniu konta w Teście 1
2. Otwórz: http://localhost:3000/technician/login
3. Zaloguj się danymi zablokowanego pracownika
4. ✅ Powinien pokazać błąd: **"Account locked"**
5. ❌ Nie powinno wpuścić do systemu

### **Test 3: Odblokowanie konta**

1. Wróć do: Admin → Pracownicy → [Edytuj] → Bezpieczeństwo
2. Status: **Status konta: 🔒 ZABLOKOWANE**
3. Kliknij: **🔓 Odblokuj konto**
4. ✅ Status zmienia się na: **Status konta: 🔓 AKTYWNE**
5. ✅ Licznik nieudanych prób: **0 / 5**
6. Teraz pracownik może się zalogować

### **Test 4: Automatyczna blokada (5 nieudanych prób)**

1. Otwórz: http://localhost:3000/technician/login
2. Spróbuj zalogować się 5 razy ze **złym hasłem**
3. ✅ Po 5 próbie: **"Account locked due to too many failed attempts"**
4. Wróć do panelu admina → Bezpieczeństwo
5. ✅ Status: **🔒 ZABLOKOWANE**
6. ✅ Nieudane próby: **5 / 5**
7. Kliknij "Odblokuj konto" → odblokuje i zresetuje licznik

### **Test 5: Ostrzeżenie o nieudanych próbach**

1. Odblokuj konto pracownika
2. Spróbuj zalogować się 3 razy ze **złym hasłem**
3. Wróć do panelu admina → Bezpieczeństwo
4. ✅ Powinien pokazać **OSTRZEŻENIE** (pomarańczowy box):
   ```
   ⚠️ Ostrzeżenie - Wielokrotne nieudane próby logowania
   Pracownik ma już 3 nieudane próby z 5 możliwych.
   ```

---

## 📝 FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────┐
│                    SYSTEM BLOKADY KONTA                      │
└──────────────────────────────────────────────────────────────┘

   ┌─────────────────┐
   │ Konto AKTYWNE   │
   └────────┬────────┘
            │
            ├──────────────────────────────────────┐
            │                                      │
            │ 5 nieudanych prób                    │ Admin klika
            │ logowania                            │ "Zablokuj konto"
            ↓                                      ↓
   ┌────────────────────┐              ┌─────────────────────┐
   │ AUTOMATYCZNA       │              │ RĘCZNA BLOKADA      │
   │ BLOKADA            │              │ (przez admina)      │
   │                    │              │                     │
   │ lockReason:        │              │ lockReason:         │
   │ "automatic"        │              │ "manual"            │
   │                    │              │ lockedBy: ADMIN001  │
   └────────┬───────────┘              └─────────┬───────────┘
            │                                    │
            └────────────────┬───────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Konto           │
                    │ ZABLOKOWANE     │
                    │ isLocked: true  │
                    └────────┬────────┘
                             │
                             │ Admin klika
                             │ "Odblokuj konto"
                             ↓
                    ┌─────────────────┐
                    │ Konto           │
                    │ ODBLOKOWANE     │
                    │ isLocked: false │
                    │ attempts: 0     │
                    └─────────────────┘
```

---

## 💡 PRZYPADKI UŻYCIA

### **1. Pracownik odchodzi z firmy**

**Problem:** Pracownik kończy pracę, ale ma jeszcze dostęp do systemu.

**Rozwiązanie:**
1. Admin → Pracownicy → [Edytuj pracownika]
2. Zakładka "Bezpieczeństwo"
3. Kliknij **"Zablokuj konto"**
4. ✅ Pracownik nie może się już zalogować
5. Możesz też zmienić status na "Nieaktywny" w zakładce "Podstawowe dane"

---

### **2. Podejrzenie włamania**

**Problem:** Widzisz dziwne logowania lub pracownik zgłasza podejrzaną aktywność.

**Rozwiązanie:**
1. Natychmiast **zablokuj konto** (przycisk czerwony)
2. Sprawdź historię nieudanych prób logowania
3. Skontaktuj się z pracownikiem
4. Wygeneruj **nowe tymczasowe hasło**
5. Przekaż je pracownikowi bezpiecznie (telefon, SMS)
6. **Odblokuj konto**
7. Pracownik loguje się nowym hasłem i musi je zmienić

---

### **3. Pracownik zapomniał hasła (5 nieudanych prób)**

**Problem:** Konto automatycznie zablokowane po 5 próbach.

**Rozwiązanie:**
1. Admin widzi ostrzeżenie w panelu
2. Kliknij **"Wygeneruj tymczasowe hasło"**
3. Skopiuj hasło (pokazane tylko raz!)
4. Przekaż pracownikowi (telefon, email, SMS)
5. Kliknij **"Odblokuj konto"**
6. Pracownik loguje się tymczasowym hasłem
7. System wymusza zmianę hasła przy logowaniu

---

### **4. Tymczasowe zawieszenie dostępu**

**Problem:** Pracownik na urlopie, chcesz czasowo zablokować dostęp.

**Rozwiązanie:**
1. Przed urlopem: **Zablokuj konto**
2. Po powrocie: **Odblokuj konto**
3. Alternatywnie: Zmień status na "Nieaktywny" w zakładce podstawowej

---

## 🔐 BEZPIECZEŃSTWO

### **Różnica między blokadą manual vs automatic:**

| Cecha | Automatyczna | Ręczna (manual) |
|-------|--------------|-----------------|
| **Trigger** | 5 nieudanych prób logowania | Admin klika przycisk |
| **lockReason** | `"automatic"` | `"manual"` |
| **lockedBy** | `null` | ID admina (np. `ADMIN001`) |
| **Odblokowanie** | Tylko admin | Tylko admin |
| **Użycie** | Ochrona przed brute-force | Kontrola dostępu (pracownik odszedł, podejrzenie włamania) |

### **Audit trail:**

System zapisuje:
- ✅ Kto zablokował (`lockedBy`)
- ✅ Kiedy zablokował (`lockedAt`)
- ✅ Powód (`lockReason`)
- ✅ Kto odblokował (`unlockedBy`)
- ✅ Kiedy odblokował (`unlockedAt`)

---

## 📚 PODSUMOWANIE

### **Co zostało dodane:**

1. ✅ **API Endpoint:** `POST /api/admin/employee-password` action: `"lock"`
2. ✅ **Funkcja:** `handleLockAccount()` w API
3. ✅ **UI Button:** "Zablokuj konto" (czerwony) w SecurityTab
4. ✅ **UI Button:** Dynamiczny przycisk (zielony "Odblokuj" gdy zablokowane)
5. ✅ **Ostrzeżenie:** Pomarańczowy box przy 3+ nieudanych próbach
6. ✅ **Nowe pola:** `lockedBy`, `lockedAt`, `lockReason`, `unlockedBy`, `unlockedAt`
7. ✅ **Dokumentacja:** Ten plik + aktualizacja INSTRUKCJA_MIGRACJI.md

### **Co już było (nie zmienialiśmy):**

- ✅ Automatyczna blokada po 5 nieudanych próbach
- ✅ Odblokowanie konta przez admina
- ✅ Reset licznika nieudanych prób przy odblokowaniu
- ✅ Walidacja przy logowaniu (sprawdza `isLocked`)

---

## 🚀 GOTOWE!

System blokady konta jest **w pełni funkcjonalny**!

### **Testuj:**
1. **http://localhost:3000/admin/pracownicy** → [Edytuj] → 🔐 Bezpieczeństwo
2. Kliknij **"Zablokuj konto"** (czerwony przycisk)
3. Spróbuj zalogować się tym kontem → ❌ Powinno odrzucić
4. Odblokuj konto → ✅ Powinno działać

---

**Co dalej:**
- 📱 **PIN logowanie** dla aplikacji mobilnej (przyszłość)
- 📧 **Email/SMS** przy zablokowaniu konta (powiadomienia)
- 📊 **Historia logowań** (IP, User-Agent, czas)
- 🔔 **Alerty** dla admina (podejrzana aktywność)

