# 🔄 MIGRACJA ID DLA PROJEKTU TECHNIK

## 📋 OBECNY STAN DANYCH

Twój projekt używa **starych formatów ID** i potrzebuje migracji:

### 🗄️ **AKTUALNE DANE:**
- **Orders:** 570+ zleceń z ID `#0001`, `#0002`...
- **Clients:** 156+ klientów z ID `#0001`, `#0002`...  
- **Employees:** 52+ pracowników z ID `#EMP001`, `#EMP002`...

### 🎯 **NOWE FORMATY ID:**
- **Orders:** `ORDW252710001` (Website), `ORDT252710001` (Telefon)
- **Clients:** `CLI252710001` 
- **Employees:** `EMP252710001`

---

## 🔄 PLAN MIGRACJI

### 1️⃣ **BACKUP ISTNIEJĄCYCH DANYCH**
```javascript
// Utwórz backup przed migracją
node id-system-library/backup/create-backup.js create

// Backup data files
cp data/orders.json data/orders_backup.json
cp data/clients.json data/clients_backup.json  
cp data/employees.json data/employees_backup.json
```

### 2️⃣ **IMPLEMENTUJ LEGACY SUPPORT**
```javascript
// pages/zlecenie-szczegoly.js
import { generateLegacyOrderId, decodeId, validateInput } from '../id-system-library';

// Obsługa starych i nowych ID
function handleOrderId(id) {
  if (id.startsWith('#')) {
    // Stary format: #0001 → OLD0001
    return generateLegacyOrderId(id.replace('#', ''));
  } else if (id.startsWith('ORD')) {
    // Nowy format: ORDW252710001
    return id;
  }
  return null;
}

// Dekodowanie informacji z ID
function getOrderInfo(id) {
  const decoded = decodeId(id);
  if (decoded.isValid) {
    return {
      type: decoded.entityType,
      source: decoded.sourceName || 'Legacy',
      date: decoded.date,
      number: decoded.number
    };
  }
  return { type: 'Unknown', source: 'Legacy' };
}
```

### 3️⃣ **AKTUALIZUJ STRUKTURY DANYCH**
```javascript
// Dodaj nowe ID do istniejących rekordów
const migrateOrders = async () => {
  const orders = JSON.parse(fs.readFileSync('data/orders.json'));
  
  const migratedOrders = orders.map(order => ({
    ...order,
    // Zachowaj stare ID dla kompatybilności
    legacyId: order.clientId, 
    // Dodaj nowe ID
    newId: generateLegacyOrderId(order.clientId.replace('#', '')),
    // Typ źródła zlecenia
    source: 'W', // Website (dla istniejących)
    migrated: true,
    migrationDate: new Date().toISOString()
  }));
  
  fs.writeFileSync('data/orders_migrated.json', JSON.stringify(migratedOrders, null, 2));
};
```

### 4️⃣ **DUAL ID SYSTEM**
```javascript
// Obsługa obu formatów w aplikacji
export default function ZlecenieSzczegoly() {
  const router = useRouter();
  const { id } = router.query;
  
  const [orderDetails, setOrderDetails] = useState(null);
  
  useEffect(() => {
    const loadOrder = async () => {
      let orderId = id;
      
      // Konwertuj stary format na nowy
      if (id.startsWith('#')) {
        orderId = generateLegacyOrderId(id.replace('#', ''));
      }
      
      // Dekoduj informacje o ID
      const idInfo = decodeId(orderId);
      
      // Załaduj dane zlecenia
      const order = await fetchOrderById(orderId);
      setOrderDetails({
        ...order,
        idInfo,
        displayId: orderId,
        originalId: id
      });
    };
    
    if (id) loadOrder();
  }, [id]);
  
  return (
    <div>
      <h1>Zlecenie: {orderDetails?.displayId}</h1>
      {orderDetails?.idInfo?.isValid && (
        <div className="id-info">
          <span>Źródło: {orderDetails.idInfo.sourceName}</span>
          <span>Data: {orderDetails.idInfo.date?.toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 CONTEXT DLA AI PROMPTÓW

### **PROMPT DLA MIGRACJI:**
```
Mam projekt Technik (Next.js) z istniejącymi danymi:

AKTUALNE ID:
- Orders: #0001, #0002... (570+ entries)
- Clients: #0001, #0002... (156+ entries)  
- Employees: #EMP001, #EMP002... (52+ entries)

NOWA BIBLIOTEKA ID:
- generateLegacyOrderId("#0001") → "OLD0001"
- generateOrderId('W') → "ORDW252710001"
- decodeId(id) → {type, source, date, number}

PLIKI DO AKTUALIZACJI:
- pages/zlecenie-szczegoly.js (używa router.query.id)
- data/orders.json, data/clients.json, data/employees.json

WYMAGANIA:
1. Dual ID system (stare + nowe)
2. Migracja bez utraty danych
3. Kompatybilność wsteczna
4. Stopniowe przejście na nowe ID

Pokaż kod migracji i aktualizacji zlecenie-szczegoly.js.
```

### **PROMPT DLA INTEGRACJI:**
```
Integruję id-system-library z aplikacją Technik:

STRUKTURA DANYCH:
- Orders (570+): clientId, category, status, devices
- Clients (156+): name, phone, email, address
- Employees (52+): name, specializations, isActive

ID SYSTEM FUNCTIONS:
- generateOrderId(source) → "ORD{S}{DATE}{NUM}"
- generateClientId() → "CLI{DATE}{NUM}"
- generateEmployeeId() → "EMP{DATE}{NUM}"

INTEGRACJA W:
- pages/zlecenie-szczegoly.js (szczegóły zlecenia)
- Formularze tworzenia nowych rekordów
- Listy i wyszukiwarki

Pokaż kompletną integrację z obsługą legacy ID.
```

---

## ✅ ODPOWIEDŹ NA TWOJE PYTANIE

**TAK, masz wszystkie potrzebne pliki context, ale potrzebujesz jeszcze:**

### 📋 **MASZ JUŻ:**
- ✅ System-context.json - formaty ID i konfiguracja
- ✅ AI_CONTEXT_GUIDE.md - instrukcje dla AI
- ✅ PROJECT_INTEGRATION_MAP.md - mapa integracji

### 📋 **DODAŁEM WŁAŚNIE:**
- ✅ **TECHNIK_PROJECT_CONTEXT.json** - specifyczny dla Twojej aplikacji
- ✅ **MIGRATION_GUIDE.md** - plan migracji Twoich danych

### 🎯 **KOMPLETNY CONTEXT OBEJMUJE:**
- **Zlecenia** (Orders) - 570+ z migracją `#0001` → `OLD0001`
- **Klientów** (Clients) - 156+ z migracją `#0001` → `OLD0001`  
- **Pracowników** (Employees) - 52+ z migracją `#EMP001` → `OLDEMP001`
- **Dual ID system** - obsługa starych i nowych formatów
- **Integrację z zlecenie-szczegoly.js** - kod gotowy do wdrożenia

**🚀 TERAZ MASZ KOMPLETNY SYSTEM DO OBSŁUGI WSZYSTKICH ENCJI W TWOJEJ APLIKACJI!**