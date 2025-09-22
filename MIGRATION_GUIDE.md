# 🚀 Przewodnik migracji na serwer

## 📋 Przegląd systemu

Aplikacja została przygotowana do **łatwej migracji z localStorage na serwer** z zachowaniem pełnej kompatybilności danych.

## 🏗️ Architektura danych

### 1. **Struktura danych gotowa na bazę danych**
```javascript
// Pracownik (tabela: employees)
{
  id: "emp_001",
  firstName: "Jan",
  lastName: "Kowalski", 
  email: "jan@technik.pl",
  specialization: ["Mechanika", "Elektryka"],
  role: "employee",
  isActive: true,
  createdAt: "2025-06-29T...",
  updatedAt: "2025-06-29T..."
}

// Harmonogram (tabela: schedules)
{
  id: "sch_001",
  employeeId: "emp_001",
  type: "weekly",
  data: { quickSchedule: {...} },
  validFrom: "2025-06-29",
  validTo: null,
  version: 1
}

// Rezerwacja (tabela: bookings)
{
  id: "book_001", 
  employeeId: "emp_001",
  clientName: "Anna Nowak",
  serviceType: "Przegląd",
  scheduledDate: "2025-07-01",
  status: "scheduled"
}
```

## 🔄 Proces migracji

### **Etap 1: Przygotowanie serwera**

1. **Baza danych**
   ```bash
   # Uruchom skrypt SQL
   mysql -u root -p < database/schema.sql
   ```

2. **Serwer Node.js/Express**
   ```bash
   npm install express mysql2 cors helmet
   # Skopiuj api/server-endpoints.js
   # Skonfiguruj połączenie z bazą
   ```

### **Etap 2: Konfiguracja środowiska**

1. **Zmienne środowiskowe (.env)**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   DATABASE_HOST=localhost
   DATABASE_NAME=technik_db
   JWT_SECRET=your-secret-key
   ```

2. **Włączenie trybu API**
   ```javascript
   // W aplikacji frontend
   dataManager.setApiMode(true);
   ```

### **Etap 3: Migracja danych**

1. **Eksport z localStorage**
   ```javascript
   const exportData = await dataManager.exportAllData();
   // Pobierz plik JSON
   ```

2. **Import na serwer**
   ```javascript
   // POST /api/sync z danymi
   const result = await dataManager.syncWithServer();
   ```

## 🔧 Komponenty gotowe na serwer

### **DataManager** - Centralny system zarządzania
- ✅ **Abstrakcja storage** (localStorage ↔ API)
- ✅ **Automatyczna synchronizacja**
- ✅ **Obsługa błędów**
- ✅ **Wersjonowanie danych**

### **Struktura API** - RESTful endpoints
- ✅ **GET /api/employees** - Lista pracowników
- ✅ **POST /api/schedules** - Zapis harmonogramu
- ✅ **GET /api/bookings** - Rezerwacje
- ✅ **POST /api/sync** - Synchronizacja

### **Baza danych** - Optymalizowana struktura
- ✅ **Normalizowane tabele**
- ✅ **Indeksy wydajnościowe**
- ✅ **Triggery audytu**
- ✅ **Funkcje pomocnicze**

## 📱 Jak używać

### **Tryb lokalny** (obecny)
```javascript
dataManager.setApiMode(false); // localStorage
```

### **Tryb serwera** (po migracji)
```javascript
dataManager.setApiMode(true);  // API calls
```

### **Synchronizacja**
```javascript
// Automatycznie przy zapisie lub manualnie:
await dataManager.syncWithServer();
```

## 🚦 Kroki wdrożenia

### **1. Przygotowanie serwera** (1-2 dni)
- [ ] Skonfiguruj bazę danych MySQL/PostgreSQL
- [ ] Wdróż serwer Express.js z API
- [ ] Skonfiguruj middleware (CORS, autoryzacja)
- [ ] Przetestuj endpointy

### **2. Migracja danych** (pół dnia)
- [ ] Wyeksportuj dane z aplikacji (przycisk "📁 Eksportuj")
- [ ] Zaimportuj dane na serwer
- [ ] Sprawdź integralność danych

### **3. Przełączenie na serwer** (15 minut)
- [ ] Ustaw zmienną `NEXT_PUBLIC_API_URL`
- [ ] Włącz tryb API w aplikacji
- [ ] Przetestuj funkcjonalność

## 🔍 Monitorowanie

### **Dashboard aplikacji**
- 📊 Status połączenia z serwerem
- 💾 Statystyki danych (lokalnych/serwerowych)
- 🔄 Historia synchronizacji
- ⚠️ Alerty błędów

### **Logi systemowe**
- 📝 Audyt operacji (tabela: activity_logs)
- 🔄 Śledzenie synchronizacji (tabela: sync_tracking)
- 📈 Metryki wydajności

## 🛠️ Gotowe komponenty

### **Frontend** (React/Next.js)
- ✅ **DataManager** - obsługa localStorage + API
- ✅ **UI dla zarządzania danymi**
- ✅ **Export/Import** danych
- ✅ **Indykatory statusu** połączenia

### **Backend** (Node.js/Express)
- ✅ **API endpoints** w `api/server-endpoints.js`
- ✅ **Schemat bazy** w `database/schema.sql`
- ✅ **Middleware** autoryzacji i logowania

### **Database** (MySQL/PostgreSQL)
- ✅ **Tabele** zoptymalizowane pod aplikację
- ✅ **Indeksy** dla wydajności
- ✅ **Triggery** audytu
- ✅ **Widoki** raportowe

## 🎯 Korzyści po migracji

### **Dla użytkowników:**
- 🔄 **Synchronizacja** między urządzeniami
- 🛡️ **Backup** danych na serwerze
- 👥 **Współdzielenie** harmonogramów
- 📱 **Dostęp** z różnych lokalizacji

### **Dla administratorów:**
- 📊 **Centralne zarządzanie** danymi
- 🔍 **Monitoring** aktywności
- 📈 **Raporty** i statystyki
- 🛡️ **Bezpieczeństwo** i kontrola dostępu

## 🚨 Ważne notatki

1. **Kompatybilność wsteczna**: Aplikacja działa lokalnie nawet bez serwera
2. **Stopniowa migracja**: Można przełączać tryby w runtime
3. **Zero downtime**: Przełączenie nie wymaga restartu aplikacji
4. **Rollback**: Łatwy powrót do trybu lokalnego w razie problemów

---

**System jest gotowy na produkcję!** 🚀
