# Plan rozbudowy zarządzania zarejestrowanymi użytkownikami

## 📋 Status implementacji

**Data**: 2025-10-12  
**System**: Technik - Panel administracyjny  
**Cel**: Dodanie kompleksowego zarządzania zarejestrowanymi użytkownikami

---

## ✅ Co już mamy (zaimplementowane)

### 1. API Bezpieczeństwa (`/api/admin/client-accounts.js`)
- ✅ Reset hasła
- ✅ Blokada/odblokowanie konta
- ✅ Unieważnianie sesji
- ✅ Pobieranie informacji bezpieczeństwa
- ✅ Logi bezpieczeństwa (security audit trail)

### 2. UI Szczegółów Klienta (`/admin/klienci/[id].js`)
- ✅ Sekcja "Bezpieczeństwo konta" z 6 kafelkami statusu
- ✅ Przyciski akcji (reset, lock/unlock, logout all)
- ✅ Modalne okna dla akcji bezpieczeństwa
- ✅ Wyświetlanie aktywnych sesji

### 3. Lista Klientów (`/admin/klienci/index.js`)
- ✅ Status badges (🔐 Zarejestrowany, 👤 Gość, 🔒 Zablokowany, 🏢 Firma)
- ✅ Filtr "Status konta" z 4 opcjami
- ✅ Sortowanie i eksport do CSV

---

## 🎯 Co należy dodać

### 1. Dashboard Statystyk (Priority: HIGH)

**Lokalizacja**: `pages/admin/klienci/index.js` - na górze strony

```jsx
<div className="mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
  {/* Kafelek 1: Wszyscy klienci */}
  {/* Kafelek 2: Zarejestrowani + procent */}
  {/* Kafelek 3: Goście + procent */}
  {/* Kafelek 4: Zablokowani + link "Zobacz" */}
  {/* Kafelek 5: Aktywni ostatnio (30 dni) */}
  {/* Kafelek 6: Nowi w tym miesiącu */}
</div>
```

**Ikony**: FiUsers, FiShield, FiUser, FiLock, FiActivity, FiTrendingUp

**Obliczenia statystyk**:
```javascript
const stats = {
  total: klienci.length,
  registered: klienci.filter(k => k.passwordHash).length,
  guests: klienci.filter(k => !k.passwordHash).length,
  locked: klienci.filter(k => k.isLocked).length,
  activeLastMonth: klienci.filter(k => {
    // lastLogin >= 30 dni wstecz
  }).length,
  newThisMonth: klienci.filter(k => {
    // createdAt >= początek miesiąca
  }).length
};
```

---

### 2. Panel Zarządzania Użytkownikami (Priority: HIGH)

**Lokalizacja**: `pages/admin/klienci/index.js` - pod statistykami

**Funkcje**:
- ☐ Checkboxy do zaznaczania wielu użytkowników
- ☐ "Zaznacz wszystkich" checkbox
- ☐ Dropdown z bulk actions:
  - 🔒 Zablokuj konta
  - 🔓 Odblokuj konta
  - 🚪 Wyloguj ze wszystkich urządzeń
  - 📥 Eksportuj dane
- ☐ Przycisk "Wykonaj" z loading state
- ☐ Licznik wybranych użytkowników

**Szybkie filtry**:
- ☐ "Pokaż zarejestrowanych"
- ☐ "Pokaż zablokowanych (N)"
- ☐ "Aktywni użytkownicy" (auto-select)
- ☐ "Eksportuj użytkowników"

**Stan komponentu**:
```javascript
const [selectedClients, setSelectedClients] = useState([]);
const [bulkAction, setBulkAction] = useState('');
const [showUserManagement, setShowUserManagement] = useState(false);
const [processingBulk, setProcessingBulk] = useState(false);
```

**Funkcje**:
```javascript
const toggleClientSelection = (clientId) => { ... }
const toggleAllClients = () => { ... }
const handleBulkAction = async () => { 
  // Wywołuje API dla każdego zaznaczonego
  // Promise.allSettled dla równoległego wykonania
}
```

---

### 3. Checkboxy w kartach klientów (Priority: HIGH)

**Zmiany w mapowaniu klientów**:
```javascript
{filteredKlienci.map((klient) => {
  const isRegistered = !!klient.passwordHash;
  const isSelected = selectedClients.includes(klient.clientId || klient.id);
  
  return (
    <div 
      className={`bg-white border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
    >
      {/* Checkbox tylko dla zarejestrowanych */}
      {isRegistered && showUserManagement && (
        <input type="checkbox" ... />
      )}
      ...
    </div>
  );
})}
```

---

### 4. Sekcja Informacji o Rejestracji (Priority: MEDIUM)

**Lokalizacja**: `pages/admin/klienci/[id].js` - nowa sekcja po "Bezpieczeństwo konta"

```jsx
<div className="bg-white rounded-lg shadow-sm border p-6">
  <h3>📊 Informacje o rejestracji</h3>
  
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label>Data rejestracji</label>
      <p>{klient.createdAt}</p>
    </div>
    <div>
      <label>Metoda rejestracji</label>
      <p>{klient.registrationMethod || 'Panel klienta'}</p>
    </div>
    <div>
      <label>Email potwierdzony</label>
      <p>{klient.emailVerified ? '✓ Tak' : '✗ Nie'}</p>
    </div>
    <div>
      <label>Ostatnia aktywność</label>
      <p>{klient.lastActivity}</p>
    </div>
  </div>
  
  {/* Opcje zmiany danych */}
  <div className="mt-4 pt-4 border-t">
    <button>Zmień email</button>
    <button>Zmień telefon</button>
    <button>Wyślij email aktywacyjny</button>
  </div>
</div>
```

**Dodatkowe pola w clients.json**:
- `registrationMethod`: 'panel' | 'admin' | 'import'
- `emailVerified`: boolean
- `emailVerifiedAt`: timestamp
- `phoneVerified`: boolean
- `lastActivity`: timestamp
- `accountNotes`: string (notatki admina)

---

### 5. System Ról (Priority: LOW)

**Nowe pole**: `role` w clients.json

**Możliwe role**:
- `standard` - standardowy użytkownik
- `vip` - priorytetowa obsługa
- `blocked` - ograniczony dostęp
- `business` - klient biznesowy

**UI**:
```jsx
<div className="role-management">
  <label>Rola użytkownika</label>
  <select value={klient.role} onChange={handleRoleChange}>
    <option value="standard">👤 Standardowy</option>
    <option value="vip">⭐ VIP</option>
    <option value="blocked">🚫 Ograniczony</option>
    <option value="business">💼 Biznesowy</option>
  </select>
  
  {klient.role === 'vip' && (
    <div className="mt-2">
      <label>Data ważności VIP</label>
      <input type="date" value={klient.vipUntil} />
    </div>
  )}
</div>
```

---

## 🔧 Kolejność implementacji

### Faza 1: Statystyki i bulk actions (1-2h)
1. ✅ Dodać obliczenia statystyk
2. ☐ Dodać dashboard 6 kafelków
3. ☐ Dodać panel zarządzania użytkownikami
4. ☐ Dodać checkboxy do kart
5. ☐ Implementować bulk actions

### Faza 2: Informacje o rejestracji (1h)
6. ☐ Dodać sekcję informacji o rejestracji
7. ☐ Dodać możliwość zmiany email/telefonu
8. ☐ Dodać wysyłanie email aktywacyjnego

### Faza 3: System ról (30min)
9. ☐ Dodać pole `role` do API
10. ☐ Dodać UI zarządzania rolą
11. ☐ Dodać filtry według ról

---

## 📊 Struktura danych

### Rozszerzone pole `clients.json`

```json
{
  "id": "CLI2025000001",
  "clientId": "CLI2025000001",
  "name": "Jan Kowalski",
  "email": "jan@example.com",
  "phone": "+48 123 456 789",
  "passwordHash": "$2b$10$...",
  
  // === Bezpieczeństwo (już jest) ===
  "isLocked": false,
  "lockedAt": null,
  "lockedBy": null,
  "lockedReason": null,
  "failedLoginAttempts": 0,
  "lastLogin": "2025-10-12T10:30:00Z",
  "lastLoginMethod": "email",
  
  // === Rejestracja (do dodania) ===
  "createdAt": "2025-10-01T12:00:00Z",
  "registrationMethod": "panel",
  "emailVerified": true,
  "emailVerifiedAt": "2025-10-01T12:05:00Z",
  "phoneVerified": false,
  "lastActivity": "2025-10-12T10:30:00Z",
  
  // === Role (do dodania) ===
  "role": "standard",
  "vipUntil": null,
  "accountNotes": "",
  
  // === Reszta ===
  "address": { ... },
  "history": [ ... ]
}
```

---

## 🎨 Przykładowy kod komponentu

### StatisticsCard Component

```jsx
const StatisticsCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400">{subtitle}</p>
        )}
        {onClick && (
          <button onClick={onClick} className="text-xs text-blue-600 hover:underline mt-1">
            Zobacz →
          </button>
        )}
      </div>
      <Icon className={`h-8 w-8 text-${color}-500`} />
    </div>
  </div>
);
```

---

## ✅ Checklist implementacji

- [ ] Dodać state dla bulk actions
- [ ] Dodać obliczenia statystyk
- [ ] Renderować dashboard 6 kafelków
- [ ] Dodać panel zarządzania użytkownikami (collapsible)
- [ ] Dodać checkbox do każdej karty klienta (tylko zarejestrowani)
- [ ] Implementować toggleClientSelection
- [ ] Implementować toggleAllClients
- [ ] Implementować handleBulkAction z Promise.allSettled
- [ ] Dodać toast notifications dla bulk actions
- [ ] Dodać sekcję "Informacje o rejestracji" w [id].js
- [ ] Dodać możliwość zmiany email/telefonu
- [ ] Dodać system ról
- [ ] Przetestować wszystkie funkcje

---

## 📖 Dokumentacja API

### Bulk Actions Endpoint

```javascript
POST /api/admin/client-accounts

// Bulk lock
{
  "action": "lockAccount",
  "clientId": "CLI2025000001",
  "reason": "Blokada grupowa przez administratora",
  "adminId": "admin",
  "adminName": "Administrator"
}

// Bulk unlock
{
  "action": "unlockAccount",
  "clientId": "CLI2025000001",
  "adminId": "admin",
  "adminName": "Administrator"
}

// Bulk logout
{
  "action": "invalidateAllSessions",
  "clientId": "CLI2025000001",
  "adminId": "admin",
  "adminName": "Administrator"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Konto zostało zablokowane"
}
```

---

## 🚀 Gotowe do użycia

Po implementacji Fazy 1 system będzie miał:
- ✅ Pełny dashboard statystyk
- ✅ Bulk operations dla wielu użytkowników
- ✅ Zaznaczanie użytkowników checkboxami
- ✅ Szybkie filtry i akcje grupowe
- ✅ Eksport wybranych użytkowników do CSV

**Czas implementacji**: ~2-3 godziny dla pełnej funkcjonalności

---

## 📝 Notatki

- API `/api/admin/client-accounts` jest już gotowe i obsługuje wszystkie operacje
- Trzeba tylko dodać UI w `pages/admin/klienci/index.js`
- Wszystkie style są już w projekcie (Tailwind CSS)
- Ikony są dostępne z `react-icons/fi`
- Toast notifications działają przez `useToast()` context

**Następny krok**: Implementacja dashboard statystyk i panelu zarządzania
