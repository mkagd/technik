# 🔒 FLOW BLOKADY KONTA - WIZUALIZACJA

## 📊 POPRZEDNI FLOW (ŹLE)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Pracownik próbuje się zalogować                              │
│    Email: jan.kowalski@techserwis.pl                            │
│    Password: zlehaslo123                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. API sprawdza email → ✅ OK                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. API sprawdza hasło z bcrypt                                  │
│    bcrypt.compare("zlehaslo123", passwordHash) → ❌ FALSE       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Zwiększ failedLoginAttempts                                  │
│    employee.failedLoginAttempts++ → 1                           │
│    saveEmployees(employees) → zapisane                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ❌ BŁĄD: Reset licznika (ZA WCZEŚNIE!)                       │
│    employee.failedLoginAttempts = 0 ← ŹLE!                     │
│    saveEmployees(employees)                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Sprawdź isLocked (ZA PÓŹNO!)                                 │
│    if (employee.isLocked) → FALSE                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Return error                                                 │
│    { message: "Nieprawidłowe hasło. Pozostało prób: 5" }       │
│    ← POKAZUJE 5, BO LICZNIK ZOSTAŁ ZRESETOWANY!                 │
└─────────────────────────────────────────────────────────────────┘

❌ PROBLEM: Licznik zawsze = 0, więc admin panel pokazuje "0 / 5"
```

---

## ✅ NOWY FLOW (DOBRZE)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Pracownik próbuje się zalogować                              │
│    Email: jan.kowalski@techserwis.pl                            │
│    Password: zlehaslo123                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. API sprawdza email → ✅ OK                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. ✅ NAJPIERW: Sprawdź czy konto zablokowane                   │
│    if (employee.isLocked) → FALSE (nie zablokowane)             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Sprawdź hasło z bcrypt                                       │
│    bcrypt.compare("zlehaslo123", passwordHash) → ❌ FALSE       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Zwiększ failedLoginAttempts                                  │
│    employee.failedLoginAttempts++ → 1                           │
│    employee.lastLoginAttempt = "2025-10-04T10:30:00.000Z"      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Sprawdź czy osiągnięto limit (5 prób)                        │
│    if (failedLoginAttempts >= 5) → FALSE (dopiero 1)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Zapisz stan                                                  │
│    saveEmployees(employees) → zapisane z failedLoginAttempts=1  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Return error                                                 │
│    { message: "❌ Nieprawidłowe hasło. Pozostało prób: 4." }   │
│    ← PRAWIDŁOWO POKAZUJE 4 (5 - 1 = 4)                          │
└─────────────────────────────────────────────────────────────────┘

✅ DZIAŁA: Admin panel pokazuje "1 / 5"
```

---

## 🔴 FLOW: 5 NIEUDANYCH PRÓB (AUTOMATYCZNA BLOKADA)

```
┌─────────────────────────────────────────────────────────────────┐
│ Próba #1: zlehaslo → failedLoginAttempts = 1                   │
│           ❌ "Nieprawidłowe hasło. Pozostało prób: 4."         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Próba #2: zlehaslo → failedLoginAttempts = 2                   │
│           ❌ "Nieprawidłowe hasło. Pozostało prób: 3."         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Próba #3: zlehaslo → failedLoginAttempts = 3                   │
│           ❌ "Nieprawidłowe hasło. Pozostało prób: 2."         │
│           ⚠️ Admin panel pokazuje: "3 / 5" (OSTRZEŻENIE!)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Próba #4: zlehaslo → failedLoginAttempts = 4                   │
│           ❌ "Nieprawidłowe hasło. Pozostało prób: 1."         │
│           ⚠️ Admin panel pokazuje: "4 / 5" (OSTATNIA SZANSA!)  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Próba #5: zlehaslo → failedLoginAttempts = 5                   │
│           if (failedLoginAttempts >= 5) → TRUE                  │
│           employee.isLocked = true                              │
│           employee.lockedAt = "2025-10-04T10:35:00.000Z"       │
│           employee.lockReason = 'automatic'                     │
│           saveEmployees(employees)                              │
│           ❌ "🔒 Twoje konto zostało zablokowane z powodu zbyt │
│               wielu nieudanych prób logowania. Skontaktuj się   │
│               z administratorem."                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Admin panel (SecurityTab):                                      │
│   - Status konta: 🔒 ZABLOKOWANE                                │
│   - Nieudane próby: 5 / 5                                       │
│   - Zablokowane przez: System (automatic)                       │
│   - Zablokowane o: 2025-10-04 10:35                             │
│   - Przycisk: "Odblokuj konto" (zielony)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔓 FLOW: PRÓBA LOGOWANIA PO ZABLOKOWANIU

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Zablokowany pracownik próbuje się zalogować                  │
│    Email: jan.kowalski@techserwis.pl                            │
│    Password: PRAWIDLOWE_HASLO (nawet dobre hasło!)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. API sprawdza email → ✅ OK                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. ✅ KROK 1: Sprawdź czy konto zablokowane (PRZED hasłem!)    │
│    if (employee.isLocked) → TRUE                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ❌ KONIEC - Return error (NIE SPRAWDZA HASŁA!)               │
│    {                                                            │
│      success: false,                                            │
│      message: "🔒 Twoje konto zostało zablokowane/zawieszone.  │
│                Skontaktuj się z administratorem, aby je         │
│                odblokować.",                                    │
│      isLocked: true                                             │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘

✅ BEZPIECZEŃSTWO: Hasło NIE jest sprawdzane, bo konto jest zablokowane!
   To zapobiega atakom brute-force na zablokowane konta.
```

---

## 🔓 FLOW: ODBLOKOWANIE PRZEZ ADMINA

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Admin otwiera panel: Pracownicy → Jan Kowalski → Security   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Admin widzi:                                                 │
│    - Status konta: 🔒 ZABLOKOWANE (czerwone)                    │
│    - Nieudane próby: 5 / 5                                      │
│    - Przycisk: "Odblokuj konto" (zielony)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Admin klika "Odblokuj konto"                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Frontend wysyła request:                                     │
│    POST /api/admin/employee-password                            │
│    {                                                            │
│      action: 'unlock',                                          │
│      employeeId: 'EMP25189001',                                 │
│      adminId: 'ADMIN001'                                        │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. API resetuje:                                                │
│    employee.isLocked = false                                    │
│    employee.failedLoginAttempts = 0                             │
│    employee.unlockedBy = 'ADMIN001'                             │
│    employee.unlockedAt = '2025-10-04T10:40:00.000Z'            │
│    saveEmployees(employees)                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Admin widzi:                                                 │
│    ✅ "Konto zostało odblokowane"                               │
│    - Status konta: ✅ AKTYWNE (zielone)                         │
│    - Nieudane próby: 0 / 5                                      │
│    - Przycisk: "Zablokuj konto" (czerwony)                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Pracownik może się teraz zalogować normalnie:                │
│    Email: jan.kowalski@techserwis.pl                            │
│    Password: PRAWIDLOWE_HASLO                                   │
│    → ✅ "Zalogowano pomyślnie"                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 KLUCZOWE ZMIANY

| Co | Przed | Po |
|----|-------|-----|
| **Kolejność sprawdzania** | 1. Hasło<br>2. isLocked | 1. isLocked<br>2. Hasło |
| **Reset licznika** | Po sprawdzeniu hasła (zawsze) | Tylko przy udanym logowaniu |
| **Zapis licznika** | Przed return (ale po resecie) | Natychmiast po zwiększeniu |
| **Komunikat dla pracownika** | "Konto jest zablokowane" | "🔒 Twoje konto zostało zablokowane/zawieszone" |
| **Dane przy blokadzie** | `isLocked = true` | `isLocked = true`<br>`lockedAt = timestamp`<br>`lockReason = 'automatic'` |

---

✅ **WSZYSTKO DZIAŁA PRAWIDŁOWO!**

