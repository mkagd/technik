# System ujednoliconych numerów zgłoszeń

## Podsumowanie zmian

System został zaktualizowany, aby ujednolicić generowanie i przechowywanie numerów zgłoszeń serwisowych. Wszystkie zgłoszenia otrzymują teraz czytelne, unikalne numery w formacie PREFIX-YYYY-NNNN (np. ZG-2025-0001, US-2025-0002, RZ-2025-0001).

## Nowe pliki

### 1. `utils/reportManager.js`
Główny manager zgłoszeń z funkcjami:
- **Generowanie numerów**: `generateReportNumber(type)` - tworzy numery ZG-YYYY-NNNN, US-YYYY-NNNN, RZ-YYYY-NNNN
- **Ujednolicona struktura**: `createReport(data, type)` - tworzy zgłoszenie z pełną strukturą danych
- **Zarządzanie statusami**: `updateReportStatus()`, `addComment()`
- **Synchronizacja**: `prepareForSync()`, `markAsSynced()`, `getPendingSync()`
- **Kompatybilność**: automatyczne dodawanie do starego systemu (`quickReports`)

### 2. `utils/migrationManager.js`
Manager migracji danych ze starych systemów:
- **Automatyczna migracja**: `runMigration()` - przekonwertowuje stare dane na nowy format
- **Status migracji**: `getMigrationStatus()` - sprawdza postęp migracji
- **Wymuszona migracja**: `forceMigration()` - ponowna migracja w razie potrzeby

### 3. `utils/testReportManager.js`
Narzędzia testowe:
- **Test systemu**: `testReportManager()` - sprawdza wszystkie funkcje
- **Czyszczenie**: `clearTestData()` - usuwa dane testowe
- **Status**: `showCurrentState()` - pokazuje obecny stan systemu

### 4. `components/ReportManagerPanel.js`
Panel administracyjny do zarządzania:
- **Statystyki** zgłoszeń i synchronizacji
- **Kontrola migracji** danych
- **Synchronizacja** z serwerem
- **Narzędzia testowe**

## Zmodyfikowane pliki

### 1. `components/QuickReportForm.js`
- **Import**: `reportManager` zamiast lokalnego generowania ID
- **Typ zgłoszenia**: 'ZG' dla naprawa, 'US' dla usterka
- **Zapis**: używa `reportManager.createReport()` i `reportManager.saveReport()`
- **Wyświetlanie**: pokazuje nowy numer zgłoszenia

### 2. `components/SimpleBookingForm.js`
- **Import**: `reportManager` dla rezerwacji
- **Typ zgłoszenia**: 'RZ' dla rezerwacji
- **Struktura**: ujednolicona z pozostałymi zgłoszeniami

### 3. `pages/zgloszenia-admin.js`
- **Migracja**: automatyczne uruchamianie przy pierwszym użyciu
- **Wyświetlanie**: obsługuje nową strukturę danych
- **Filtrowanie**: działa z nowymi i starymi zgłoszeniami
- **Panel zarządzania**: nowy przycisk "Zarządzaj"

## Typy zgłoszeń

| Typ | Prefiks | Opis |
|-----|---------|------|
| ZG | ZG-YYYY-NNNN | Zgłoszenie serwisowe (naprawa) |
| US | US-YYYY-NNNN | Usterka (pilne) |
| RZ | RZ-YYYY-NNNN | Rezerwacja terminu |

## Struktura zgłoszenia

```javascript
{
  id: "ZG-2025-0001",              // Numer zgłoszenia jako ID
  reportNumber: "ZG-2025-0001",    // Numer zgłoszenia
  internalId: "1672531200000abc",  // Wewnętrzny ID
  type: "ZG",                      // Typ zgłoszenia
  status: "new",                   // Status
  timestamp: "2025-01-01T10:00:00Z",
  
  contactInfo: {                   // Dane kontaktowe
    phone: "123456789",
    email: "test@example.com",
    address: "ul. Testowa 1"
  },
  
  reportDetails: {                 // Szczegóły zgłoszenia
    equipmentType: "Drukarka",
    description: "Nie drukuje",
    availability: "Po 16:00"
  },
  
  statusHistory: [...],            // Historia zmian statusu
  syncStatus: "pending",           // Status synchronizacji
  originalFormData: {...}          // Oryginalne dane formularza
}
```

## Migracja danych

System automatycznie migruje dane podczas pierwszego uruchomienia:

1. **quickReports** → **unified_reports**
2. **simpleBookings** → **unified_reports** (jako typ RZ)
3. Zachowuje zgodność ze starym systemem
4. Dodaje numery zgłoszeń do starych rekordów

## Synchronizacja z serwerem

### Funkcje przygotowane:
- `prepareForSync(reportNumber)` - przygotowuje dane do wysłania
- `markAsSynced(reportNumber)` - oznacza jako zsynchronizowane
- `markSyncError(reportNumber, error)` - oznacza błąd synchronizacji
- `getPendingSync()` - pobiera oczekujące na synchronizację

### Status synchronizacji:
- **pending** - oczekuje na wysłanie
- **synced** - zsynchronizowane z serwerem
- **error** - błąd synchronizacji

## Użycie

### 1. Nowe zgłoszenie
```javascript
import reportManager from '../utils/reportManager';

const reportData = {
  phone: '123456789',
  email: 'test@example.com',
  description: 'Problem z drukarką'
};

const report = reportManager.createReport(reportData, 'ZG');
const saved = reportManager.saveReport(report);
console.log('Numer zgłoszenia:', saved.reportNumber);
```

### 2. Aktualizacja statusu
```javascript
const updated = reportManager.updateReportStatus(
  'ZG-2025-0001', 
  'in-progress', 
  'Rozpoczęto naprawę'
);
```

### 3. Dodanie komentarza
```javascript
reportManager.addComment(
  'ZG-2025-0001',
  'Wymieniono toner',
  'admin'
);
```

### 4. Synchronizacja
```javascript
const pendingReports = reportManager.getPendingSync();
const syncData = reportManager.prepareForSync('ZG-2025-0001');
// Wyślij na serwer...
reportManager.markAsSynced('ZG-2025-0001', serverResponse);
```

## Panel administracyjny

Dostępny w `/zgloszenia-admin` po kliknięciu "Zarządzaj":

- **Statystyki** - liczba zgłoszeń według statusu i synchronizacji
- **Migracja** - status i kontrola migracji danych
- **Synchronizacja** - wysyłanie oczekujących zgłoszeń
- **Testy** - weryfikacja systemu
- **Narzędzia** - czyszczenie danych testowych

## Kompatybilność

System zachowuje pełną kompatybilność:
- Stare zgłoszenia dalej działają
- `quickReports` jest aktualizowane
- `simpleBookings` jest aktualizowane
- Można stopniowo migrować kod

## Przyszłe rozszerzenia

### Planowane funkcje:
1. **Automatyczna synchronizacja** w tle
2. **Offline mode** z kolejką synchronizacji
3. **Powiadomienia** o zmianach statusu
4. **Historia działań** użytkowników
5. **Backup** i **restore** danych
6. **API integration** z systemem CRM
7. **Załączniki** do zgłoszeń
8. **Szablony** zgłoszeń
9. **SLA tracking** i **metryki**
10. **Integracja z kalendarzem** techników

## Testowanie

Użyj panelu administracyjnego lub:

```javascript
import { testReportManager } from '../utils/testReportManager';

// Uruchom pełny test
const result = testReportManager();

// Sprawdź obecny stan
showCurrentState();

// Wyczyść dane testowe
clearTestData();
```

---

**Status**: ✅ Zakończone  
**Wersja**: 1.0  
**Data**: 2025-01-02
