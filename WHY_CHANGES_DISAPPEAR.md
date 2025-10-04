# ⚠️ WAŻNE: Dlaczego zmiany czasami "znikają"?

## 🔴 PROBLEM: Zmiany w plikach JSON znikają po restarcie serwera

### Co się dzieje?

Twoja aplikacja używa **plików JSON jako bazy danych**:
- `data/technician-sessions.json`
- `data/orders.json`
- `data/clients.json`
- `data/employees.json`
- `data/accounts.json`
- itd...

**KLUCZOWY PROBLEM:**

1. ✅ Edytujesz plik ręcznie w VS Code
2. ✅ Zapisujesz (Ctrl+S)
3. ✅ Widzisz zmiany w pliku
4. ❌ Uruchamiasz serwer (`npm run dev`)
5. ❌ API **NADPISUJE** plik swoimi zmianami
6. ❌ Twoje ręczne edycje **ZNIKAJĄ**

---

## 🔍 Dlaczego to się dzieje?

### Przykład z `technician-sessions.json`:

```javascript
// pages/api/technician/auth.js - LINIA 40

fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
```

**Co to robi:**
- Kiedy ktoś się loguje → API **czyta** sessions
- Dodaje nową sesję
- **ZAPISUJE CAŁY PLIK** z powrotem

**Problem:**
- Jeśli edytowałeś plik ręcznie PRZED logowaniem
- API czyta STARĄ wersję z pamięci/cache
- Zapisuje STARĄ wersję + nową sesję
- Twoje ręczne edycje → **PRZEPADAJĄ**

---

## 📊 Jak działa synchronizacja?

### Scenariusz 1: Wszystko działa ✅

```
1. Wyłączasz serwer
2. Edytujesz data/technician-sessions.json
3. Zapisujesz (Ctrl+S)
4. Uruchamiasz serwer
5. Logujesz się → API czyta plik z dysku
6. Widzisz swoje zmiany + nową sesję
```

### Scenariusz 2: Zmiany znikają ❌

```
1. Serwer DZIAŁA w tle
2. Edytujesz data/technician-sessions.json
3. Zapisujesz (Ctrl+S)
4. Logujesz się → API ma STARĄ wersję w pamięci
5. API zapisuje STARĄ wersję + nową sesję
6. Twoje zmiany → PRZEPADAJĄ
```

---

## 🚨 Rzeczywisty przykład z Twojego kodu

### `pages/api/technician/auth.js`

```javascript
export default async function handler(req, res) {
  // ... walidacja ...
  
  try {
    // 1. CZYTA plik (może być stara wersja w cache Node.js)
    const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
    const sessions = data ? JSON.parse(data) : [];
    
    // 2. DODAJE nową sesję
    sessions.push(newSession);
    
    // 3. ZAPISUJE CAŁY PLIK (nadpisuje Twoje ręczne edycje!)
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    
    return res.status(200).json({ success: true });
  } catch (error) {
    // ...
  }
}
```

**Problem:**
- `readFileSync` może czytać z **cache systemu plików**
- Nie wie że zmieniłeś plik ręcznie
- Zapisuje starą wersję

---

## ✅ ROZWIĄZANIA

### 1. **Zawsze zatrzymuj serwer przed ręczną edycją** (NAJLEPSZE)

```powershell
# 1. Zatrzymaj serwer
Ctrl + C  # w terminalu gdzie działa npm run dev

# 2. Edytuj pliki JSON

# 3. Zapisz (Ctrl+S)

# 4. Uruchom serwer
npm run dev
```

**Dlaczego to działa?**
- Serwer czyta pliki przy starcie
- Nie ma starych wersji w pamięci
- Twoje zmiany są uwzględnione

---

### 2. **Używaj Git do trackowania zmian** (POLECANE!)

```powershell
# Inicjalizuj git (jeśli jeszcze nie masz)
git init

# Dodaj wszystkie pliki
git add .

# Pierwszy commit
git commit -m "Initial commit"

# Po każdej zmianie:
git add data/*.json
git commit -m "Updated sessions"
git push
```

**Zalety:**
- ✅ Historia wszystkich zmian
- ✅ Możesz cofnąć zmiany
- ✅ Widzisz co się zmieniło
- ✅ Backup na GitHub

---

### 3. **Edytuj przez API (nie ręcznie)** (NAJLEPIEJ)

Zamiast edytować `technician-sessions.json` ręcznie:

```javascript
// Stwórz endpoint do usuwania sesji
// pages/api/technician/logout-all.js

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SESSIONS_FILE = path.join(process.cwd(), 'data', 'technician-sessions.json');
  
  // Wyczyść wszystkie sesje
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2));
  
  return res.status(200).json({ success: true, message: 'All sessions cleared' });
}
```

Teraz w przeglądarce:
```javascript
fetch('/api/technician/logout-all', { method: 'POST' });
```

**Zalety:**
- ✅ Serwer zawsze ma aktualną wersję
- ✅ Brak konfliktów
- ✅ Można dodać walidację

---

### 4. **Hot Module Replacement może pomóc**

Next.js ma HMR (Hot Module Replacement), ale:
- ❌ Nie działa dla plików JSON w `/data`
- ✅ Działa dla komponentów React
- ✅ Działa dla stron `/pages`

**Rozwiązanie:** Przenieś dane do bazy danych

---

## 🗄️ Długoterminowe rozwiązanie: Prawdziwa baza danych

### Dlaczego pliki JSON to zły pomysł?

❌ **Problemy:**
- Race conditions (wiele requestów jednocześnie)
- Brak transakcji
- Brak relacji
- Wolne przy dużych danych
- Łatwo uszkodzić plik
- Brak kopii zapasowych
- Konflikt przy edycji ręcznej

✅ **Zalety prawdziwej bazy:**
- Transakcje ACID
- Indeksy (szybkie wyszukiwanie)
- Relacje między tabelami
- Backup i recovery
- Concurrent access
- Migrations

### Rekomendowane bazy danych:

#### 1. **SQLite** (najłatwiejsze)
```bash
npm install better-sqlite3
```

**Zalety:**
- ✅ Jeden plik `.db`
- ✅ Brak instalacji serwera
- ✅ Bardzo szybkie
- ✅ Dobre do < 100k rekordów

#### 2. **PostgreSQL** (produkcja)
```bash
npm install pg
```

**Zalety:**
- ✅ Najbardziej zaawansowana
- ✅ Świetna dla produkcji
- ✅ Darmowa
- ✅ JSON support

#### 3. **MongoDB** (NoSQL)
```bash
npm install mongodb
```

**Zalety:**
- ✅ Łatwe schemy
- ✅ Dobre dla JSON
- ✅ Skalowalne

---

## 📋 Plan migracji do bazy danych

### Krok 1: Wybierz bazę (polecam SQLite na start)

```bash
npm install better-sqlite3
```

### Krok 2: Stwórz schemat

```sql
-- schema.sql

CREATE TABLE technician_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  employee_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_activity TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT 1,
  remember_me BOOLEAN DEFAULT 0,
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX idx_sessions_token ON technician_sessions(token);
CREATE INDEX idx_sessions_employee ON technician_sessions(employee_id);
```

### Krok 3: Migruj dane

```javascript
// scripts/migrate-sessions.js
const fs = require('fs');
const Database = require('better-sqlite3');

const db = new Database('data/database.db');
const sessions = JSON.parse(fs.readFileSync('data/technician-sessions.json', 'utf8'));

const insert = db.prepare(`
  INSERT INTO technician_sessions 
  (token, employee_id, email, created_at, last_activity, is_valid, remember_me, ip, user_agent)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const session of sessions) {
  insert.run(
    session.token,
    session.employeeId,
    session.email,
    session.createdAt,
    session.lastActivity,
    session.isValid ? 1 : 0,
    session.rememberMe ? 1 : 0,
    session.ip,
    session.userAgent
  );
}

console.log(`✅ Migrated ${sessions.length} sessions`);
```

### Krok 4: Zaktualizuj API

```javascript
// pages/api/technician/auth.js (z bazą danych)
import Database from 'better-sqlite3';

const db = new Database('data/database.db');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;
    
    // Walidacja...
    
    const insert = db.prepare(`
      INSERT INTO technician_sessions 
      (token, employee_id, email, created_at, last_activity, is_valid, remember_me, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insert.run(
      token,
      employeeId,
      email,
      new Date().toISOString(),
      new Date().toISOString(),
      1,
      rememberMe ? 1 : 0,
      req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      req.headers['user-agent']
    );
    
    return res.status(200).json({ success: true, token });
  }
}
```

---

## 🎯 Co zrobić TERAZ?

### Krótkoterminowo (do końca tygodnia):

1. **Zatrzymuj serwer przed edycją plików JSON**
   ```
   Ctrl+C → edytuj → npm run dev
   ```

2. **Commituj często do Git**
   ```bash
   git add data/*.json
   git commit -m "Session cleanup"
   git push
   ```

3. **Stwórz endpoints do zarządzania danymi**
   - `/api/admin/clear-sessions`
   - `/api/admin/cleanup-old-sessions`

### Długoterminowo (następny miesiąc):

1. **Zaplanuj migrację do SQLite**
   - Przetestuj na kopii projektu
   - Migruj tabela po tabeli

2. **Dodaj proper backup system**
   ```bash
   # Cron job co godzinę
   cp data/database.db backups/database-$(date +%Y%m%d-%H%M%S).db
   ```

3. **Implementuj migrations**
   - Używaj narzędzi jak `knex.js` lub `prisma`

---

## 🔧 Debugowanie problemów

### Sprawdź czy serwer nadpisuję pliki:

```powershell
# Terminal 1: Uruchom serwer
npm run dev

# Terminal 2: Monitoruj zmiany w plikach
Get-FileHash data\technician-sessions.json -Algorithm MD5
```

Po każdym API call sprawdź hash ponownie. Jeśli się zmienia - to API zapisuje.

### Sprawdź co zapisuje API:

Dodaj logi:
```javascript
fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
console.log('📝 Zapisano sessions:', sessions.length, 'wpisów');
console.log('🕒 Czas:', new Date().toISOString());
```

---

## ✅ Podsumowanie

### **GŁÓWNA ZASADA:**

```
🔴 NIGDY nie edytuj plików JSON gdy serwer działa!
```

### **BEZPIECZNY WORKFLOW:**

```
1. Ctrl+C (zatrzymaj serwer)
2. Edytuj pliki JSON
3. git add . && git commit -m "changes"
4. npm run dev
5. git push (backup)
```

### **PRZYSZŁOŚĆ:**

```
Migracja do SQLite/PostgreSQL w ciągu 1-2 miesięcy
```

---

## 📚 Dodatkowe materiały

- [SQLite + Next.js tutorial](https://github.com/vercel/next.js/tree/canary/examples/with-sqlite)
- [Prisma ORM](https://www.prisma.io/) - recommended for database management
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3) - fastest SQLite for Node.js

---

**Masz pytania?** Zobacz również:
- `GIT_WORKFLOW.md` - jak używać Git
- `DATABASE_MIGRATION_GUIDE.md` - przewodnik po migracji
- `API_BEST_PRACTICES.md` - dobre praktyki API
