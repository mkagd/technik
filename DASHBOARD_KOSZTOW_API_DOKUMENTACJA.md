# 💰 Dashboard Kosztów API - Dokumentacja

## ✅ Zrealizowane Funkcjonalności

### 1️⃣ UI Dashboard (Wizualny przycisk)
**Lokalizacja:** `components/IntelligentWeekPlanner.js`

✅ **Przycisk "💰 Koszty API"**
- Umieszczony w toolbar obok przycisku "Zapisz Plan"
- Żółty kolor (bg-yellow-600) dla wyróżnienia
- Ikona DollarSign z lucide-react
- onClick otwiera modal z pełnym dashboardem

✅ **Modal Dashboard**
- **Podsumowanie kosztów:**
  - Koszt dzienny: $X.XX / $100
  - Miesięczna prognoza: $X.XX / $200
  
- **Progress bary:**
  - Budżet dzienny (zielony → żółty → pomarańczowy → czerwony)
  - Zapytania dzienne
  - Kolorowanie dynamiczne wg % wykorzystania
  
- **Statystyki szczegółowe:**
  - Zapytania API (płatne)
  - Cache hits (FREE)
  - Nieudane zapytania
  
- **Cache Hit Rate:**
  - Wyświetlany jako % z zieloną ikoną TrendingUp
  - Info o oszczędnościach dzięki cache
  
- **Rate Limiting:**
  - Limit: 60 zapytań/minutę
  - Ostatnie zapytanie: timestamp
  
- **Alerty:**
  - Wyświetlane gdy budżet/zapytania przekraczają 80% lub 90%
  - Czerwona ramka z ikoną AlertTriangle

- **Akcje:**
  - 🗑️ Wyczyść statystyki
  - 📊 Pokaż w konsoli (wywołuje printStats())
  - Zamknij modal

---

### 2️⃣ Email Alerts (Automatyczne powiadomienia)
**Lokalizacja:** 
- Endpoint: `pages/api/send-cost-alert.js`
- Monitor: `utils/apiCostMonitor.js`

✅ **Endpoint /api/send-cost-alert**
- Metoda: POST
- Body: `{ alertType, percentage, stats }`
- Używa Resend API do wysyłania emaili
- Wymaga konfiguracji:
  - `RESEND_API_KEY` - klucz API z resend.com
  - `COST_ALERT_EMAIL` - email docelowy do alertów

✅ **Email Template**
- **Header:**
  - Tytuł: "⚠️ Alert kosztów API"
  - Poziom krytyczności: 🟢 INFO / 🟡 OSTRZEŻENIE / 🔴 KRYTYCZNY
  - Kolorowanie dynamiczne (zielony/żółty/czerwony)

- **Alert Level Box:**
  - Główny komunikat o przekroczeniu progu
  - Duża, wyróżniona informacja

- **Statystyki:**
  - Progress bar budżetu dziennego
  - Progress bar zapytań
  - Grid z podziałem: API / Cache / Nieudane

- **Miesięczna prognoza:**
  - Szacowany koszt miesięczny
  - Info o limicie $200 (kredyt Google)

- **Cache Hit Rate:**
  - Procentowy wskaźnik skuteczności cache
  - Liczba zaoszczędzonych zapytań

- **Zalecane działania:**
  - Dynamiczne rekomendacje w zależności od progu (80% vs 90%)
  - Linki do konsoli i dashboardu
  - Instrukcje troubleshootingu

- **Footer:**
  - Timestamp wysłania
  - Nazwa systemu

✅ **Integracja w apiCostMonitor.js**
- **Metoda `sendAlert(alertType, percentage)`:**
  - Wywoływana automatycznie przy przekroczeniu progów
  - Cooldown: 1 alert tego samego typu na godzinę
  - Zapisuje timestamp ostatniego wysłania
  - Resetuje się o północy razem z innymi statystykami

- **Progi wywołania:**
  - 80% budżetu dziennego → email "OSTRZEŻENIE"
  - 90% budżetu dziennego → email "KRYTYCZNY"
  - 80% limitu zapytań → email "OSTRZEŻENIE"
  - 90% limitu zapytań → email "KRYTYCZNY"

- **Cooldown mechanism:**
  - Klucze: `budget_80`, `budget_90`, `requests_80`, `requests_90`
  - Zapisywane w localStorage
  - Auto-reset o północy

✅ **Enhanced getStats() method**
Zwraca kompletny obiekt z:
- `requests.total` - suma wszystkich zapytań
- `requests.api` - płatne zapytania
- `requests.cache` - darmowe (cache)
- `requests.failed` - nieudane
- `estimatedCost` - koszt dzienny
- `estimatedMonthlyCost` - prognoza miesięczna
- `dailyBudgetLimit` - limit budżetu ($100)
- `dailyRequestLimit` - limit zapytań (20,000)
- `perMinuteLimit` - limit per-minute (60)
- `costPerRequest` - cena za zapytanie ($0.005)
- `cacheHitRate` - skuteczność cache (%)
- `lastRequestAt` - timestamp ostatniego zapytania
- `alerts` - tablica aktywnych ostrzeżeń

---

## 🔧 Konfiguracja

### Krok 1: Skonfiguruj email docelowy
Edytuj plik `.env.local` i dodaj swój email:

```bash
# 💰 Cost Alert Email - dodaj swój email do alertów o przekroczeniu limitów API
COST_ALERT_EMAIL=twoj-email@example.com
```

### Krok 2: Zweryfikuj Resend API Key
Upewnij się że masz poprawny klucz w `.env.local`:

```bash
RESEND_API_KEY=re_twoj_klucz_tutaj
```

### Krok 3: Restart serwera
```bash
# Zatrzymaj serwer (Ctrl+C)
# Uruchom ponownie:
npm run dev
```

---

## 📊 Jak używać

### Otwórz Dashboard
1. Przejdź do "Intelligent Week Planner"
2. Kliknij przycisk **"💰 Koszty API"** w toolbarze
3. Zobacz statystyki w czasie rzeczywistym

### Wyczyść statystyki
W modalu kliknij **"🗑️ Wyczyść statystyki"** aby zresetować liczniki.

### Sprawdź szczegółowe logi
W modalu kliknij **"📊 Pokaż w konsoli"** aby wyświetlić ASCII art summary w konsoli przeglądarki.

### Otrzymuj alerty
Gdy budżet lub zapytania przekroczą:
- **80%** → Dostaniesz email z ostrzeżeniem
- **90%** → Dostaniesz email z alertem krytycznym

**Cooldown:** Max 1 email tego samego typu na godzinę (zapobiega spamowi).

---

## 🎯 Limity i Progi

### Hard Limity (blokują API calls)
- **Budżet dzienny:** $100/dzień
- **Zapytania dzienne:** 20,000/dzień
- **Rate limit:** 60 zapytań/minutę

### Email Alert Thresholds
- **80%** → 🟡 Ostrzeżenie (czas na sprawdzenie)
- **90%** → 🔴 Krytyczne (natychmiastowa akcja!)

### Google API Pricing
- **Koszt:** $5 za 1,000 zapytań ($0.005 per request)
- **Darmowy limit:** Pierwsze 10,000 zapytań/miesiąc = FREE
- **Kredyt miesięczny:** $200 (40,000 zapytań)

### Oczekiwane Wykorzystanie
Z cache (85-95% hit rate):
- **3,000-5,000 zapytań/miesiąc** → **$0.00** (w ramach darmowego limitu)
- **10,000 zapytań/miesiąc** → **$0.00** (w ramach darmowego limitu)
- **20,000 zapytań/miesiąc** → **~$50** (w ramach kredytu $200)

---

## 🧪 Testowanie Email Alertów

### Testowanie ręczne
Możesz przetestować wysyłanie emaila przez konsolę przeglądarki:

```javascript
// Symuluj alert 80% budżetu
fetch('/api/send-cost-alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    alertType: 'budget',
    percentage: 80,
    stats: {
      requests: { total: 8000, api: 1600, cache: 6300, failed: 100 },
      estimatedCost: 80.00,
      estimatedMonthlyCost: 2400.00,
      dailyBudgetLimit: 100,
      dailyRequestLimit: 20000,
      perMinuteLimit: 60,
      costPerRequest: 0.005,
      cacheHitRate: 78.75,
      lastRequestAt: Date.now(),
      alerts: ['🟡 OSTRZEŻENIE: Budżet dzienny na poziomie 80.0%']
    }
  })
}).then(res => res.json()).then(console.log);
```

### Symuluj alert 90%
```javascript
fetch('/api/send-cost-alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    alertType: 'budget',
    percentage: 90,
    stats: {
      requests: { total: 9000, api: 1800, cache: 7100, failed: 100 },
      estimatedCost: 90.00,
      estimatedMonthlyCost: 2700.00,
      dailyBudgetLimit: 100,
      dailyRequestLimit: 20000,
      perMinuteLimit: 60,
      costPerRequest: 0.005,
      cacheHitRate: 78.89,
      lastRequestAt: Date.now(),
      alerts: ['🔴 KRYTYCZNE: Budżet dzienny na poziomie 90.0%']
    }
  })
}).then(res => res.json()).then(console.log);
```

---

## 🔍 Troubleshooting

### Email nie przychodzą
1. **Sprawdź konfigurację:**
   ```bash
   # W konsoli przeglądarki:
   console.log(process.env.COST_ALERT_EMAIL)
   ```
   - Jeśli `undefined` → nie zrestartowałeś serwera po dodaniu do .env.local
   - Jeśli zawiera "your-email@example.com" → nie zmieniłeś na swój email

2. **Sprawdź RESEND_API_KEY:**
   - Musi zaczynać się od `re_`
   - Nie może zawierać `twoj_resend_api_key`

3. **Sprawdź cooldown:**
   - Możesz dostać max 1 email tego samego typu na godzinę
   - Sprawdź localStorage: `api_cost_monitor` → `lastAlertSent`

4. **Sprawdź console:**
   - `📧 Sending budget alert (80%)...` → alert wysyłany
   - `✅ Alert email sent successfully` → sukces
   - `⏳ Alert cooldown active` → czekasz na cooldown
   - `❌ Failed to send alert email` → błąd (sprawdź szczegóły)

### Dashboard nie wyświetla danych
1. **Sprawdź localStorage:**
   ```javascript
   // W konsoli przeglądarki:
   console.log(localStorage.getItem('api_cost_monitor'))
   ```

2. **Zresetuj statystyki:**
   - Otwórz dashboard
   - Kliknij "🗑️ Wyczyść statystyki"
   - Wykonaj kilka obliczeń tras

3. **Wymusz reload:**
   - Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### Limity API się nie resetują
- **Auto-reset o północy:**
  - Statystyki resetują się automatycznie na podstawie `new Date().toDateString()`
  - Cooldown alertów również się resetuje

- **Manual reset:**
  ```javascript
  // W konsoli przeglądarki:
  const monitor = require('./utils/apiCostMonitor').getApiCostMonitor();
  monitor.resetStats();
  ```

---

## 📝 Changelog

### v1.0.0 - Dashboard Kosztów API (2024)
✅ Dodano przycisk "💰 Koszty API" w toolbar
✅ Stworzono modal z pełnym dashboardem statystyk
✅ Zaimplementowano email alerts z Resend
✅ Dodano cooldown (1h) dla alertów
✅ Rozszerzono getStats() o kompletne dane
✅ Dodano getActiveAlerts() dla dynamicznych ostrzeżeń
✅ Zaktualizowano dokumentację

---

## 🎯 Podsumowanie

System Dashboard Kosztów API jest **gotowy do produkcji** i oferuje:

✅ **Real-time monitoring** - przycisk w UI z dostępem do statystyk
✅ **Visual dashboard** - progress bary, kolorowanie, ikony
✅ **Email alerts** - automatyczne powiadomienia przy 80%/90%
✅ **Cooldown protection** - zapobiega spamowi (1 email/h)
✅ **Auto-reset** - dzienny reset o północy
✅ **Hard limits** - $100/dzień max (zapobiega katastrofie jak wczoraj)
✅ **Cache transparency** - widoczność oszczędności
✅ **Monthly projection** - prognoza kosztów miesięcznych

**Oczekiwany koszt z cache:** $0/miesiąc (w ramach 10k darmowych zapytań)
**Worst case scenario:** $100/dzień (vs wczorajszy $400/dzień)

**📧 Pamiętaj:** Zmień `COST_ALERT_EMAIL` w `.env.local` na swój email!
