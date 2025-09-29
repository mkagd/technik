# 🗄️ Strategia migracji danych - od plików JSON do bazy danych

## 📋 Przegląd

Ta dokumentacja opisuje strategię łatwego przenoszenia danych z plików JSON na prawdziwą bazę danych bez przerywania działania aplikacji.

## 🎯 Cele

- ✅ **Łatwa migracja** - jeden skrypt, automatyczny proces
- ✅ **Zero downtime** - możliwość migracji bez zatrzymywania aplikacji
- ✅ **Kompatybilność wsteczna** - stary kod nadal działa
- ✅ **Skalowalna architektura** - gotowa na MySQL, PostgreSQL, MongoDB
- ✅ **Bezpieczna migracja** - automatyczne backupy

## 📁 Struktura plików

```
├── utils/
│   ├── database.js          # Warstwa abstrakcji danych
│   └── models.js           # Definicje modeli/tabel
├── scripts/
│   ├── migrate-data.js     # Skrypt migracji danych
│   └── setup-database.js   # Skrypt setupu bazy danych (auto-generowany)
├── data/
│   ├── orders.json         # Zamówienia (znormalizowane)
│   ├── clients.json        # Klienci (znormalizowane)
│   ├── employees.json      # Pracownicy
│   └── migration-backup/   # Backup przed migracją
└── database/
    └── migrations/         # Skrypty SQL
```

## 🚀 Proces migracji krok po kroku

### Krok 1: Przygotowanie (bez przerywania aplikacji)

```bash
# Uruchom analizę i normalizację danych
node scripts/migrate-data.js
```

Co się dzieje:
- ✅ Tworzy backup obecnych danych
- ✅ Analizuje strukturę plików JSON
- ✅ Normalizuje dane zgodnie z nowymi modelami
- ✅ Generuje skrypty SQL
- ✅ Aplikacja nadal działa na plikach JSON

### Krok 2: Setup bazy danych (w tle)

```bash
# Zainstaluj driver bazy danych
npm install mysql2
# lub: npm install pg (PostgreSQL)
# lub: npm install mongodb

# Skonfiguruj bazę danych
node scripts/setup-database.js
```

### Krok 3: Przełączenie na bazę danych

```javascript
// W utils/database.js zmień:
const CONFIG = {
  dataSource: 'mysql', // było: 'file'
  // ...
};
```

### Krok 4: Restart aplikacji

```bash
npm restart
```

## 🔧 Konfiguracja baz danych

### MySQL
```env
# .env.local
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=technik_db
```

### PostgreSQL
```env
# .env.local
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=technik_db
```

## 📊 Modele danych

### Orders (Zamówienia)
```javascript
{
  id: 1,
  clientId: 123,
  employeeId: 456,
  serviceType: 'naprawa',
  deviceType: 'laptop',
  brand: 'Dell',
  model: 'Inspiron 15',
  description: 'Nie włącza się',
  status: 'pending', // 'pending', 'in_progress', 'completed', 'cancelled'
  priority: 'medium', // 'low', 'medium', 'high', 'urgent'
  estimatedCost: 150.00,
  createdAt: '2024-01-01T10:00:00Z'
}
```

### Clients (Klienci)
```javascript
{
  id: 1,
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan@example.com',
  phone: '+48123456789',
  address: 'ul. Główna 1, Warszawa',
  company: null,
  preferredContact: 'phone'
}
```

## 🛠️ Przykłady użycia API

### Stary sposób (bezpośrednio z plików)
```javascript
const fs = require('fs');
const orders = JSON.parse(fs.readFileSync('data/orders.json'));
```

### Nowy sposób (przez warstwę abstrakcji)
```javascript
const db = require('../utils/database');
const orders = await db.getData('orders');
```

## 🔄 Testowanie migracji

### 1. Test z plikami JSON
```bash
# Upewnij się że aplikacja działa
curl http://localhost:3000/api/orders-new
```

### 2. Test po migracji do bazy danych
```bash
# Po zmianie konfiguracji na bazę danych
curl http://localhost:3000/api/orders-new
```

Odpowiedzi powinny być identyczne!

## 🚨 Plan awaryjny

### Jeśli coś pójdzie nie tak:

1. **Przywróć konfigurację:**
   ```javascript
   // utils/database.js
   dataSource: 'file' // z powrotem na pliki
   ```

2. **Przywróć backup:**
   ```bash
   cp data/migration-backup/* data/
   ```

3. **Restart aplikacji:**
   ```bash
   npm restart
   ```

## 📈 Korzyści po migracji

### Wydajność
- ⚡ Szybsze zapytania z indeksami
- ⚡ Równoczesny dostęp wielu użytkowników
- ⚡ Transakcje ACID

### Funkcjonalność
- 🔍 Zaawansowane wyszukiwanie i filtrowanie
- 📊 Analityka i raporty
- 🔐 Bezpieczeństwo na poziomie bazy danych
- 🔄 Relacje między tabelami

### Skalowalność
- 📈 Obsługa tysięcy rekordów
- 👥 Wielu użytkowników jednocześnie
- 🌐 Łatwe backup i replikacja

## 🎯 Następne kroki po migracji

1. **Optymalizacja:**
   - Dodaj indeksy dla często używanych zapytań
   - Skonfiguruj connection pooling
   - Ustaw automatyczne backupy

2. **Monitoring:**
   - Logi zapytań
   - Metryki wydajności
   - Alerty przy problemach

3. **Rozszerzenia:**
   - Full-text search
   - Audit log (historia zmian)
   - Cache (Redis)

## 💡 Wskazówki

- 🔄 **Testuj na kopii danych** przed produkcją
- 📊 **Monitoruj wydajność** po migracji
- 🔐 **Zabezpiecz dane** - hasła, backupy
- 📝 **Dokumentuj zmiany** dla zespołu