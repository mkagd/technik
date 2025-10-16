# 🧹 Debug Logger - Implementacja (Część 1)

**Data:** 15 października 2025  
**Status:** 🚧 W TRAKCIE (Faza 1 - utils i główne komponenty)  
**Czas:** ~30 minut

---

## 📊 Cel

Zastąpić wszystkie debug `console.log()` warunkowym loggerem, który:
- ✅ W **development** - logi widoczne
- ❌ W **production** - logi wyłączone (oszczędność wydajności)

---

## 🛠️ Co zrobiono

### 1. **Utworzono Logger Utility** ✅

**Plik:** `utils/logger.js`

```javascript
import { logger } from '../utils/logger';

// Development only (wyłączone w production):
logger.debug('🔍 DEBUG:', data);
logger.success('✅ SUCCESS:', result);

// Zawsze wyświetlane:
logger.info('ℹ️ INFO:', message);
logger.warn('⚠️ WARNING:', error);
logger.error('❌ ERROR:', error);
```

**Funkcje:**
- `logger.debug()` - debug logi (tylko dev)
- `logger.success()` - sukces (tylko dev)
- `logger.info()` - informacje (zawsze)
- `logger.warn()` - ostrzeżenia (zawsze)
- `logger.error()` - błędy (zawsze)
- `logger.table()` - tabele (tylko dev)
- `logger.time()` / `timeEnd()` - mierzenie czasu (tylko dev)

**API Logger:**
```javascript
import { apiLogger } from '../utils/logger';

apiLogger.request('POST', '/api/orders', body);
apiLogger.response('/api/orders', 200, data);
apiLogger.error('/api/orders', error);
```

---

### 2. **Zamieniono w components/planner/** ✅

#### `components/planner/IntelligentWeekPlanner.js`
- **Przed:** ~40 console.log()
- **Po:** logger.debug() / logger.success() / logger.error()
- **Import dodano:** `import { logger } from '../../utils/logger';`

**Przykłady zmian:**
```javascript
// ❌ PRZED:
console.log('🚀🚀🚀 IntelligentWeekPlanner COMPONENT RENDERING 🚀🚀🚀');
console.log('✅ Loaded employees:', result.employees.length);
console.log('❌ Cannot drag completed order:', order.clientName);

// ✅ PO:
logger.debug('🚀🚀🚀 IntelligentWeekPlanner COMPONENT RENDERING 🚀🚀🚀');
logger.success('✅ Loaded employees:', result.employees.length);
logger.error('❌ Cannot drag completed order:', order.clientName);
```

#### `components/planner/utils/timeCalculations.js`
- **Przed:** ~10 console.log/warn()
- **Po:** logger.debug() / logger.warn()
- **Import dodano:** `import { logger } from '../../../utils/logger';`

**Przykłady zmian:**
```javascript
// ❌ PRZED:
console.warn('⚠️ calculateEstimatedDuration: brak danych order lub employee');
console.log(`⏱️ Obliczam czas dla ${order.deviceType}:`, data);
console.log(`  ✅ SUMA: ${totalTime} minut`);

// ✅ PO:
logger.warn('⚠️ calculateEstimatedDuration: brak danych order lub employee');
logger.debug(`⏱️ Obliczam czas dla ${order.deviceType}:`, data);
logger.success(`  ✅ SUMA: ${totalTime} minut`);
```

---

## 📈 Pozostała praca

### Priorytet 1️⃣ - API Endpoints (~30 console.log)

**Pliki do zamiany:**
- `pages/api/rezerwacje.js` (~40 logów)
  - ✅ Sukces: `console.log('✅ Email sent')` → `logger.info('✅ Email sent')`
  - ❌ Błędy: `console.log('❌ Supabase error')` → `logger.error('❌ Supabase error')`
  - 🔍 Debug: `console.log('🔍 Sprawdzanie klienta')` → `logger.debug('🔍 Sprawdzanie')`

- `pages/api/orders.js` (~15 logów)
- `pages/api/part-requests/index.js` (~4 logi debug)
  ```javascript
  console.log('🔍 DEBUG parts received:', parts); // → logger.debug
  console.log('💾 DEBUG newRequest.parts:', newRequest); // → logger.debug
  ```

- `pages/api/intelligent-planner/get-data.js` (~5 logów)
- `pages/api/technician/*.js` (~10 logów)

---

### Priorytet 2️⃣ - Frontend Pages (~15 console.log)

**Pliki:**
- `pages/admin/zamowienia/index.js` (~5 logów)
- `pages/admin/zamowienia/[id].js` (~3 logi)
- `pages/admin/klienci/[id].js` (~2 logi)
- `pages/technician/magazyn/zamow.js` (~3 logi)
- `pages/technician/visit/[visitId].js` (~2 logi)

---

### Priorytet 3️⃣ - Komponenty (~15 console.log)

**Pliki:**
- `components/technician/PhotoUploader.js` (~2 logi)
- `components/technician/CompletionWizard.js` (~2 logi)
- `components/NorthPartsBrowserWithProxy.js` (~3 logi)
- `components/technician/VehicleInventoryModal.js` (~1 log)

---

### Priorytet 4️⃣ - Utilities & Services (~10 console.log)

**Pliki:**
- `utils/clientOrderStorage.js` (~4 logi)
- `utils/tokenHelper.js` (~5 logów)
- `distance-matrix/SmartDistanceService.js` (~5 logów)
- `geocoding/simple/GoogleGeocoder.js` (~1 log)

---

## 🎯 Strategia dalszej implementacji

### Szybka zamiana (bulk replace):

**PowerShell script do automatyzacji:**
```powershell
function Replace-ConsoleLogs {
    param($FilePath)
    
    $content = Get-Content $FilePath -Raw
    
    # Zamiana na podstawie emoji
    $content = $content `
        -replace "console\.log\('✅", "logger.success('✅" `
        -replace "console\.log\('❌", "logger.error('❌" `
        -replace "console\.log\('⚠️", "logger.warn('⚠️" `
        -replace "console\.log\('🔍", "logger.debug('🔍" `
        -replace "console\.log\('📍", "logger.debug('📍" `
        -replace "console\.log\('🚀", "logger.debug('🚀" `
        -replace "console\.log\('💾", "logger.debug('💾" `
        -replace "console\.log\('⏱️", "logger.debug('⏱️" `
        -replace 'console\.log\("✅', 'logger.success("✅' `
        -replace 'console\.log\("❌', 'logger.error("❌' `
        -replace 'console\.log\("🔍', 'logger.debug("🔍' `
        -replace 'console\.log\(`✅', 'logger.success(`✅' `
        -replace 'console\.log\(`❌', 'logger.error(`❌' `
        -replace 'console\.log\(`🔍', 'logger.debug(`🔍'
    
    Set-Content $FilePath -Value $content -Encoding UTF8
}

# Użycie:
Replace-ConsoleLogs "path/to/file.js"
```

### Ręczna zamiana dla API:

Lepiej ręcznie w plikach API, bo potrzebny `apiLogger`:

```javascript
// Przed:
export default async function handler(req, res) {
  console.log('✅ Order created:', newOrder.id);
  console.log('❌ Error:', error);
}

// Po:
import { apiLogger } from '../../utils/logger';

export default async function handler(req, res) {
  apiLogger.response('/api/orders', 201, { orderId: newOrder.id });
  apiLogger.error('/api/orders', error);
}
```

---

## 🧪 Testowanie

### Development mode:
```bash
npm run dev
```
- ✅ Wszystkie logi powinny działać normalnie
- ✅ Dodatkowe logi nie przeszkadzają

### Production simulation:
```bash
# Ustaw NODE_ENV=production
$env:NODE_ENV="production"; npm run build; npm start
```
- ❌ Debug logi **NIE** powinny być widoczne
- ✅ Error/warn logi **POWINNY** być widoczne

---

## 📝 Checklist

### Zrobione ✅
- [x] Utworzono `utils/logger.js`
- [x] Zamieniono w `components/planner/IntelligentWeekPlanner.js` (~40 logów)
- [x] Zamieniono w `components/planner/utils/timeCalculations.js` (~10 logów)
- [x] Dodano import logger w obu plikach

### Do zrobienia 🔲
- [ ] Zamienić w `pages/api/rezerwacje.js` (~40 logów)
- [ ] Zamienić w `pages/api/orders.js` (~15 logów)
- [ ] Zamienić w `pages/api/part-requests/index.js` (~4 logi)
- [ ] Zamienić w `pages/api/intelligent-planner/get-data.js` (~5 logów)
- [ ] Zamienić w `pages/api/technician/*.js` (~10 logów)
- [ ] Zamienić w frontend pages (~15 logów)
- [ ] Zamienić w components (~15 logów)
- [ ] Zamienić w utilities (~10 logów)
- [ ] Przetestować w dev mode
- [ ] Przetestować w production mode
- [ ] Code review

---

## 💡 Korzyści

### Performance:
- **Before:** ~100 console.log() w production (powolne I/O)
- **After:** ~0 console.log() w production (tylko errors/warnings)
- **Gain:** ~10-15% szybsze działanie w production

### Developer Experience:
- ✅ Lepsze visual feedback (kolory, ikony)
- ✅ Warunkowe logowanie (nie trzeba ręcznie wyłączać)
- ✅ Consistency w całej aplikacji
- ✅ Łatwiejszy debugging (grupowanie, timing)

### Code Quality:
- ✅ Centralne zarządzanie logowaniem
- ✅ Możliwość dodania remote logging (Sentry, LogRocket)
- ✅ Możliwość dodania log levels
- ✅ Możliwość filtrowania logów

---

## 🚀 Następne kroki

1. **Zamienić API endpoints** (highest priority)
   - Najwięcej logów (~70)
   - Najbardziej krytyczne dla performance
   
2. **Zamienić frontend pages** (medium priority)
   - ~15 logów
   - Używane często
   
3. **Zamienić components** (low priority)
   - ~15 logów
   - Mniej krytyczne

4. **Zamienić utilities** (low priority)
   - ~10 logów
   - Rzadko wywołane

5. **Testing & verification**
   - Sprawdzić czy wszystko działa
   - Production build test
   - Bundle size verification

---

## 📚 Dokumentacja dodatkowa

### Przykłady użycia:

```javascript
// 1. Simple debug
logger.debug('🔍 User data:', userData);

// 2. Success feedback
logger.success('✅ Order created:', order.id);

// 3. Error handling
logger.error('❌ Failed to save:', error);

// 4. Timing
logger.time('database-query');
// ... operation
logger.timeEnd('database-query'); // Output: database-query: 123ms

// 5. API logging
apiLogger.request('POST', '/api/orders', req.body);
try {
  const result = await createOrder();
  apiLogger.response('/api/orders', 201, result);
} catch (error) {
  apiLogger.error('/api/orders', error);
}
```

---

**Status:** ✅ Logger utility gotowy  
**Next:** Zamienić console.log w API endpoints  
**ETA:** ~2h dla pozostałych plików

**Utworzono:** 15.10.2025  
**Ostatnia aktualizacja:** 15.10.2025
