# 📊 Intelligent Planner - Przepływ Danych

## Skąd pochodzą zlecenia w "Niezaplanowanych"?

### 🔍 Źródło Danych
Wszystkie zlecenia pochodzą z pliku: **`data/orders.json`**

❌ **NIE** są to rezerwacje z kalendarza  
✅ **TAK** to są zlecenia serwisowe z systemu głównego

### 📥 Filtrowanie przez API (`/api/intelligent-planner/get-data`)

#### 1. Filtrowanie po serwisancie
```javascript
// Jeśli wybrano serwisanta (np. Tomasz Urbaniak):
if (servicemanId && servicemanId !== 'all') {
  
  // PRZYPISANE DO SERWISANTA:
  const assignedOrders = orders.filter(order => {
    return order.assignedTo === servicemanId ||  // 🎯 Główne pole
           order.employeeId === servicemanId ||
           order.technicianId === servicemanId ||
           // Lub ma wizytę dla tego serwisanta:
           (order.visits && order.visits.some(v => 
             v.employeeId === servicemanId
           ));
  });
  
  // NIEZAPISANE (dostępne dla wszystkich):
  const unassignedOrders = orders.filter(order => {
    return !order.assignedTo && 
           !order.employeeId &&
           !order.technicianId &&
           (!order.visits || order.visits.length === 0);
  });
  
  // RAZEM = przypisane + niezapisane
  orders = [...assignedOrders, ...unassignedOrders];
}
```

#### 2. Filtrowanie po statusie
```javascript
orders = orders.filter(order => {
  const status = order.status?.toLowerCase();
  return status === 'pending' ||      // Oczekujące
         status === 'new' ||          // Nowe
         status === 'in_progress' ||  // W trakcie
         status === 'awaiting_diagnosis' || // Czeka na diagnozę
         !order.visits ||             // Bez wizyt
         order.visits.length === 0 || // Pusta lista wizyt
         order.visits.some(v =>       // Ma wizytę oczekującą
           v.status === 'pending' || 
           v.status === 'scheduled'
         );
});
```

### 📦 Podział na "Zaplanowane" vs "Niezaplanowane"

#### 🗓️ ZAPLANOWANE
Zlecenia trafiają do kalendarza gdy mają:
```javascript
order.scheduledDate !== null  // "2025-01-13"
order.scheduledDate !== undefined
order.status === 'pending' || order.status === 'new'
```

#### 📋 NIEZAPLANOWANE
Zlecenia trafiają do panelu "Niezaplanowane" gdy:
```javascript
!order.scheduledDate  // null lub undefined
order.status === 'pending' || order.status === 'new'
```

### 🔄 Jak zlecenie trafia z "Niezaplanowanych" do Kalendarza?

**Metoda 1: Przeciągnij & Upuść (Drag & Drop)**
1. Użytkownik przeciąga zlecenie na konkretny dzień
2. System wywołuje: `handleOrderDrop(order, targetDay)`
3. API PATCH: `/api/orders/${order.id}`
   ```json
   {
     "scheduledDate": "2025-01-13",
     "assignedTo": "EMP123456"
   }
   ```
4. Przeładowanie danych: `loadIntelligentPlan()`

**Metoda 2: Zmiana technika (dropdown)**
1. Użytkownik wybiera innego technika z listy
2. System wywołuje PATCH: `/api/orders/${order.id}`
   ```json
   {
     "assignedTo": "NEW_TECH_ID",
     "scheduledDate": "2025-01-13"  // Zachowuje datę!
   }
   ```
3. Przeładowanie danych po 500ms

**Metoda 3: Przeniesienie do nieprzypisanych (↩️)**
1. Użytkownik klika przycisk ↩️
2. System wywołuje: `moveOrderToUnscheduled(order, currentDay)`
3. API PATCH: `/api/orders/${order.id}`
   ```json
   {
     "scheduledDate": null,
     "assignedTo": null
   }
   ```
4. Zlecenie wraca do panelu "Niezaplanowane"

### 🛠️ Struktura Zlecenia w orders.json

```json
{
  "id": "ORD123",
  "orderNumber": "ORDW252750001",
  "clientName": "Jan Kowalski",
  "clientId": "CLI456",
  "address": "ul. Floriańska 10, Kraków",
  "deviceType": "Pralka",
  "status": "pending",
  
  // 🎯 KLUCZOWE POLA:
  "scheduledDate": "2025-01-13",  // null = niezaplanowane
  "assignedTo": "EMP123456",       // null = nieprzypisane
  
  // Opcjonalne:
  "visits": [
    {
      "visitId": "VIS789",
      "employeeId": "EMP123456",
      "scheduledDate": "2025-01-13",
      "status": "scheduled"
    }
  ]
}
```

### ⚠️ Częste problemy

#### Problem 1: Zlecenie nie pojawia się po zapisie
**Przyczyna**: PATCH nie zawiera `scheduledDate`  
**Rozwiązanie**: Zawsze wysyłaj zarówno `assignedTo` jak i `scheduledDate`

#### Problem 2: Zlecenie widoczne u dwóch techników
**Przyczyna**: Stare dane w cache lub nie przeładowano  
**Rozwiązanie**: Wywołaj `loadIntelligentPlan()` po zapisie

#### Problem 3: Niezaplanowane są puste mimo zleceń w orders.json
**Przyczyna**: Wszystkie zlecenia mają `scheduledDate` lub niewłaściwy `status`  
**Rozwiązanie**: Sprawdź filtry w get-data.js (linie 200-214)

### 📈 Statystyki

```javascript
// Niezaplanowane:
const unscheduledOrders = realData.orders.filter(order => {
  const hasNoScheduledDate = !order.scheduledDate;
  const isPending = order.status === 'pending' || order.status === 'new';
  return hasNoScheduledDate && isPending;
});

// Zaplanowane:
const scheduledOrders = realData.orders.filter(order => {
  return order.scheduledDate && 
         (order.status === 'pending' || order.status === 'new');
});

console.log(`📊 Niezaplanowane: ${unscheduledOrders.length}`);
console.log(`📊 Zaplanowane: ${scheduledOrders.length}`);
```

### 🔗 Powiązane Pliki

- **API Pobierania**: `pages/api/intelligent-planner/get-data.js`
- **API Aktualizacji**: `pages/api/orders/[id].js`
- **Komponent**: `components/IntelligentWeekPlanner.js`
- **Dane**: `data/orders.json`

---

**Ostatnia aktualizacja**: 2025-01-11  
**Status**: ✅ Aktywny system
