# 🚨 PILNE: Napraw token TERAZ!

## Problem
```
POST /api/technician/complete-visit 401 (Unauthorized)
```

## ✅ Rozwiązanie (Wykonaj w Console - F12):

### Krok 1: Otwórz Console (F12)

### Krok 2: Wklej i uruchom (Enter):
```javascript
const employeeToken = localStorage.getItem('employeeToken');
if (employeeToken) {
  localStorage.setItem('technicianToken', employeeToken);
  console.log('✅ TOKEN SKOPIOWANY! Odświeżam stronę...');
  setTimeout(() => location.reload(), 1000);
} else {
  console.error('❌ BRAK employeeToken!');
  console.log('📋 Sprawdzam co jest w localStorage:');
  console.log('employeeToken:', localStorage.getItem('employeeToken'));
  console.log('technicianToken:', localStorage.getItem('technicianToken'));
  console.log('employeeSession:', localStorage.getItem('employeeSession'));
}
```

### Krok 3: Jeśli pokazało "❌ BRAK employeeToken":

**Zaloguj się ponownie:**
```
http://localhost:3000/pracownik-logowanie
Email: mariusz.bielaszka@techserwis.pl
Hasło: haslo123
```

Potem wróć do Kroku 2.

---

## ✅ Po wykonaniu powinieneś zobaczyć:

```
Console:
✅ TOKEN SKOPIOWANY! Odświeżam stronę...
```

Strona się odświeży automatycznie.

---

## 🧪 Test czy działa:

Po odświeżeniu:
1. Otwórz wizytę VIS251013001
2. Zakończ wizytę
3. Submit

**NIE powinno być 401!** ✅

---

**WYKONAJ TERAZ KROK 2!** 🚀
