# 🔧 NAPRAWA SYSTEMU BLOKADY KONTA

**Data:** 2025-10-04  
**Status:** ✅ NAPRAWIONO

---

## 🐛 WYKRYTE PROBLEMY

### **Problem 1: Licznik nieudanych prób nie działał**
- **Objaw:** Admin panel nie pokazywał liczby nieudanych prób logowania
- **Przyczyna:** SecurityTab.js pobierał dane z API, ale API zwracało `failedLoginAttempts` = 0
- **Dlaczego:** Logika w auth.js **resetowała licznik ZA WCZEŚNIE** (przed sprawdzeniem hasła)

### **Problem 2: Sprawdzanie `isLocked` w złej kolejności**
- **Objaw:** Zablokowane konto nadal mogło próbować logować się (i dostawało "złe hasło" zamiast "konto zablokowane")
- **Przyczyna:** Sprawdzanie `employee.isLocked` było **PO** sprawdzeniu hasła (linia 221)
- **Prawidłowo:** Powinno być **PRZED** sprawdzeniem hasła

### **Problem 3: Niejasny komunikat dla zablokowanego konta**
- **Objaw:** Pracownik widział: "Konto jest zablokowane. Skontaktuj się z administratorem."
- **Lepiej:** "🔒 Twoje konto zostało zablokowane/zawieszone. Skontaktuj się z administratorem."

---

## ✅ ROZWIĄZANIA

### **Zmiana 1: Przesunięcie sprawdzania `isLocked` na początek**

**PRZED (ŹLE):**
```javascript
// 1. Sprawdź hasło
const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);

if (!isPasswordValid) {
  employee.failedLoginAttempts++;
  // ... zwiększ licznik
}

// 2. Reset licznika (ZA WCZEŚNIE!)
employee.failedLoginAttempts = 0;

// 3. Sprawdź isLocked (ZA PÓŹNO!)
if (employee.isLocked) {
  return res.status(403).json({ ... });
}
```

**PO (DOBRZE):**
```javascript
// 1. NAJPIERW sprawdź isLocked (PRZED hasłem!)
if (employee.isLocked) {
  return res.status(403).json({
    success: false,
    message: '🔒 Twoje konto zostało zablokowane/zawieszone. Skontaktuj się z administratorem.',
    isLocked: true
  });
}

// 2. Sprawdź hasło
const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);

if (!isPasswordValid) {
  employee.failedLoginAttempts++;
  employee.lastLoginAttempt = new Date().toISOString();
  
  if (employee.failedLoginAttempts >= 5) {
    employee.isLocked = true;
    employee.lockedAt = new Date().toISOString();
    employee.lockReason = 'automatic';
    saveEmployees(employees);
    
    return res.status(403).json({
      success: false,
      message: '🔒 Twoje konto zostało zablokowane z powodu zbyt wielu nieudanych prób logowania.',
      isLocked: true
    });
  }
  
  saveEmployees(employees);
  
  return res.status(401).json({
    success: false,
    message: `❌ Nieprawidłowe hasło. Pozostało prób: ${5 - employee.failedLoginAttempts}.`,
    attemptsLeft: 5 - employee.failedLoginAttempts
  });
}

// 3. ✅ Hasło prawidłowe - DOPIERO TERAZ reset licznika
employee.failedLoginAttempts = 0;
employee.lastLogin = new Date().toISOString();
saveEmployees(employees);
```

---

### **Zmiana 2: Dodanie `lockedAt` i `lockReason` przy automatycznej blokadzie**

Teraz przy 5 nieudanych próbach system zapisuje:
```javascript
employee.isLocked = true;
employee.lockedAt = new Date().toISOString();
employee.lockReason = 'automatic'; // 5 failed attempts
```

To pozwala odróżnić:
- **Automatyczna blokada** (5 failed attempts) → `lockReason: 'automatic'`
- **Ręczna blokada** (admin) → `lockReason: 'manual'`

---

### **Zmiana 3: Lepsze komunikaty dla pracownika**

| Sytuacja | Stary komunikat | Nowy komunikat |
|----------|----------------|----------------|
| Konto zablokowane (próba logowania) | "Konto jest zablokowane. Skontaktuj się z administratorem." | "🔒 Twoje konto zostało zablokowane/zawieszone. Skontaktuj się z administratorem, aby je odblokować." |
| 5 nieudanych prób | "Konto zablokowane z powodu zbyt wielu nieudanych prób logowania. Skontaktuj się z administratorem." | "🔒 Twoje konto zostało zablokowane z powodu zbyt wielu nieudanych prób logowania. Skontaktuj się z administratorem." |
| Złe hasło (próba 1-4) | "Nieprawidłowe hasło. X prób pozostało." | "❌ Nieprawidłowe hasło. Pozostało prób: X." |
| Wymaga zmiany hasła | "Wymagana zmiana hasła. Skontaktuj się z administratorem." | "⚠️ Wymagana zmiana hasła. Skontaktuj się z administratorem." |

---

## 🧪 JAK TESTOWAĆ

### **Test 1: Licznik nieudanych prób**

1. Odpal dev server: `npm run dev`
2. Otwórz: http://localhost:3000/technician/login
3. Email: `jan.kowalski@techserwis.pl`
4. Hasło: `zlehaslo123` (złe hasło)
5. Kliknij "Zaloguj"

**Oczekiwany wynik:**
```json
{
  "success": false,
  "message": "❌ Nieprawidłowe hasło. Pozostało prób: 4.",
  "attemptsLeft": 4
}
```

6. Sprawdź w admin panelu → Pracownicy → Jan Kowalski → Zakładka "Bezpieczeństwo"

**Oczekiwany wynik:**
- "Nieudane próby: **1 / 5**" (powinno pokazać 1, nie 0!)

---

### **Test 2: Automatyczna blokada po 5 próbach**

1. Spróbuj zalogować się **5 razy** ze złym hasłem
2. Po 5 próbie powinieneś zobaczyć:

```json
{
  "success": false,
  "message": "🔒 Twoje konto zostało zablokowane z powodu zbyt wielu nieudanych prób logowania. Skontaktuj się z administratorem.",
  "isLocked": true
}
```

3. Sprawdź w admin panelu:
   - "Status konta: 🔒 **ZABLOKOWANE**"
   - "Nieudane próby: **5 / 5**"

4. Spróbuj zalogować się ponownie (nawet z **dobrym** hasłem):

**Oczekiwany wynik:**
```json
{
  "success": false,
  "message": "🔒 Twoje konto zostało zablokowane/zawieszone. Skontaktuj się z administratorem, aby je odblokować.",
  "isLocked": true
}
```

Hasło **nie jest sprawdzane**, bo konto jest zablokowane!

---

### **Test 3: Odblokowanie przez admina**

1. Admin panel → Pracownicy → Jan Kowalski → Zakładka "Bezpieczeństwo"
2. Kliknij **"Odblokuj konto"** (zielony przycisk)
3. Sprawdź status:
   - "Status konta: ✅ **AKTYWNE**"
   - "Nieudane próby: **0 / 5**" (zresetowane)

4. Spróbuj zalogować się z **prawidłowym** hasłem:

**Oczekiwany wynik:**
```json
{
  "success": true,
  "message": "Zalogowano pomyślnie",
  "token": "...",
  "employee": { ... }
}
```

---

## 📊 ZMIENIONE PLIKI

| Plik | Zmiany |
|------|--------|
| `pages/api/technician/auth.js` | Przesunięcie sprawdzania `isLocked` na początek + lepsze komunikaty + dodanie `lockedAt` i `lockReason` |
| `scripts/test-account-locking.js` | Nowy skrypt testowy do sprawdzania stanu kont |
| `NAPRAWA_BLOKADY_KONTA.md` | Ta dokumentacja |

---

## 🎯 CO DZIAŁA TERAZ

✅ **Licznik nieudanych prób** - `failedLoginAttempts` jest prawidłowo zwiększany i zapisywany  
✅ **Admin panel pokazuje licznik** - SecurityTab wyświetla "Nieudane próby: X / 5"  
✅ **Automatyczna blokada po 5 próbach** - `isLocked = true` + `lockReason = 'automatic'`  
✅ **Zablokowane konto nie może się logować** - sprawdzanie `isLocked` **PRZED** hasłem  
✅ **Lepsze komunikaty dla pracownika** - emoji + czytelny tekst  
✅ **Odblokowanie przez admina** - resetuje `failedLoginAttempts` i `isLocked`  

---

## 💡 CO DALEJ (opcjonalnie)

- [ ] Dodać emaila/SMS do pracownika gdy konto zostanie zablokowane
- [ ] Logować wszystkie próby logowania (audit log)
- [ ] Dodać możliwość odblokowania konta przez pracownika (np. SMS z kodem)
- [ ] Dodać różne limity dla różnych ról (np. admin = 10 prób, pracownik = 5 prób)

---

✅ **NAPRAWIONO!** Wszystkie problemy zostały rozwiązane.

