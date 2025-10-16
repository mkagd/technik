# 🔄 Jak Wymusić Przeładowanie Zmian w Przeglądarce

## Problem
Nie widzisz nowych zmian w aplikacji mimo że kod został zaktualizowany.

## Rozwiązanie: Wymuś Hard Refresh

### ⌨️ Metoda 1: Skróty klawiaturowe

**Windows / Linux:**
- **Chrome / Edge**: `Ctrl + Shift + R` lub `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` lub `Ctrl + F5`

**macOS:**
- **Chrome / Safari**: `Cmd + Shift + R`
- **Firefox**: `Cmd + Shift + R`

### 🧹 Metoda 2: Wyczyść Cache Przeglądarki

**Chrome / Edge:**
1. Otwórz DevTools: `F12`
2. Kliknij prawym na ikonę odświeżania (🔄)
3. Wybierz: **"Empty Cache and Hard Reload"** (Wyczyść pamięć podręczną i wymuś ponowne załadowanie)

**Firefox:**
1. `Ctrl + Shift + Delete`
2. Zaznacz: "Cache"
3. Zakres: "Ostatnia godzina"
4. Kliknij: "Wyczyść teraz"

### 🛠️ Metoda 3: Tryb Incognito / Prywatny

- **Chrome**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`
- **Edge**: `Ctrl + Shift + N`

Otwórz aplikację w trybie incognito - nie używa cache.

### 🔍 Metoda 4: Sprawdź Console (Logi Debug)

1. Otwórz DevTools: `F12`
2. Przejdź do zakładki **Console**
3. Odśwież stronę: `F5`
4. Szukaj logów:

**Dla dropdownu techników:**
```
🔍 DEBUG Dropdown: { availableServicemen: 4, ... }
👷 Available servicemen set: ["Oliwia Kowalczyk (EMP25189001)", ...]
```

**Dla kart zleceń:**
```
📋 Rendering order card: { orderNumber: "ORD-...", clientId: "CLI...", ... }
```

### ✅ Jak Sprawdzić Czy Zmiany Działają?

#### 1. **Nagłówki Kart Zleceń**
Powinny być widoczne 3 kolorowe badge'y:
- 🔢 `Numer zlecenia` (niebieski)
- 👤 `ID klienta` (fioletowy)
- 📅 `X wiz.` (zielony, jeśli są wizyty)

#### 2. **Dropdown Zmiany Technika**
Obok przycisku ↩️ powinien być:
- **Select/Dropdown** z napisem "👤 Zmień..."
- Po kliknięciu: lista wszystkich techników
- Po wyborze: zlecenie się przenosi

#### 3. **Console Logi**
Po otwarciu strony w konsoli powinny być:
```
✅ Loaded 4 employees
👷 Available servicemen set: [...]
✅ Default serviceman set: Oliwia Kowalczyk
📋 Rendering order card: { orderNumber: "ORD-2025-006", ... }
🔍 DEBUG Dropdown: { availableServicemen: 4, shouldShow: true }
```

### 🚨 Jeśli Nadal Nie Działa

#### Problem 1: Serwer nie przeładował zmian
```powershell
# W terminalu (d:\Projekty\Technik\Technik):
# Zatrzymaj serwer: Ctrl+C
# Uruchom ponownie:
npm run dev
```

#### Problem 2: Błąd kompilacji
1. Sprawdź terminal gdzie działa `npm run dev`
2. Szukaj czerwonych błędów kompilacji
3. Jeśli są - zgłoś błąd z całym komunikatem

#### Problem 3: Stare zmiany w pliku
```powershell
# Sprawdź czy plik jest poprawnie zapisany:
Get-Content "d:\Projekty\Technik\Technik\components\IntelligentWeekPlanner.js" | Select-String "DEBUG Dropdown" -Context 2
```

Powinno zwrócić fragment kodu z console.log.

### 📊 Sprawdź Status Serwera

```powershell
# W PowerShell:
Invoke-WebRequest -Uri "http://localhost:3000/api/employees" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Powinno zwrócić JSON z 4 pracownikami.

### 🎯 Quick Checklist

- [ ] Hard Refresh: `Ctrl + Shift + R`
- [ ] Sprawdź Console (F12)
- [ ] Szukaj logów: `🔍 DEBUG Dropdown`
- [ ] Sprawdź czy dropdown jest widoczny obok ↩️
- [ ] Sprawdź czy badge'y z numerami są widoczne
- [ ] Jeśli nie działa → Restart serwera (`Ctrl+C` → `npm run dev`)
- [ ] Jeśli nadal nie działa → Tryb Incognito

---

**Ostatnia aktualizacja**: 2025-01-11  
**Dodane logi debug**: Tak ✅
