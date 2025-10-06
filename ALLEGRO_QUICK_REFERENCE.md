# 🚀 Allegro Integration - Quick Reference

> Szybki przewodnik po integracji Allegro w systemie AGD

---

## 📍 Gdzie Co Jest

### 🔍 Wyszukiwanie Części

| Gdzie | Co | Jak Użyć |
|-------|------|----------|
| `/admin/magazyn/czesci` | 🛒 przy każdej części | Kliknij ikonę → Zobacz oferty |
| `/logistyka/allegro/suggestions` | Dashboard sugestii | Odśwież ceny → Filtruj → Kup |
| `/technician/visit/[visitId]` | Zakładka "🔧 Części" | Sprawdź sugestie → Szukaj części |

---

## 👤 Co Może Kto

### 👔 Logistyk

**Codziennie rano:**
```
1. Otwórz /logistyka/magazyn
2. Kliknij "🛒 Allegro - Sugestie zakupów"
3. Kliknij "🔄 Odśwież ceny" (jeśli nie dzisiaj)
4. Zobacz części BRAK NA STANIE (czerwone)
5. Kliknij "Zobacz ofertę" → Kup
```

**Szybkie sprawdzenie ceny:**
```
1. Otwórz /admin/magazyn/czesci
2. Znajdź część w tabeli
3. Kliknij 🛒 w kolumnie "Allegro"
4. Zobacz ceny i sprzedawców
```

---

### 🔧 Technik

**Podczas wizyty:**
```
1. Otwórz wizytę /technician/visit/[visitId]
2. Kliknij zakładkę "🔧 Części"
3. Zobacz sugerowane części (jeśli zeskanowano model)
4. Kliknij 🛒 aby sprawdzić ceny na Allegro
5. Skopiuj link i wyślij do logistyka
```

**Pilne zamówienie:**
```
1. Zakładka "🔧 Części"
2. Wpisz nazwę części w polu tekstowym
3. Kliknij "Sprawdź na Allegro"
4. Wybierz ofertę z dostawą na jutro
5. Zamów sam lub wyślij link
6. Zaplanuj wizytę powrotną
```

---

### 👨‍💼 Admin

**Sprawdzanie pojedynczej części:**
```
1. /admin/magazyn/czesci
2. Kliknij 🛒 przy części
3. Porównaj ceny
4. Wybierz najlepszą ofertę
```

**Konfiguracja (raz):**
```
1. /admin/allegro/settings
2. Wklej Client ID i Secret
3. Wybierz tryb (Sandbox/Production)
4. Testuj połączenie
```

---

## 🎯 Quick Actions

### Najczęstsze operacje (1 klik):

| Akcja | Gdzie | Shortcut |
|-------|-------|----------|
| **Sugestie zakupów** | `/logistyka/magazyn` → Pierwszy kafelek | - |
| **Sprawdź część** | Magazyn → Kliknij 🛒 | - |
| **Odśwież ceny** | Dashboard → Button "🔄" | Poczekaj ~1 min |
| **Filtruj krytyczne** | Dashboard → Button "🔴 Krytyczne" | - |
| **Filtruj oszczędności** | Dashboard → Button "💰 Oszczędności" | - |
| **Zobacz alternatywy** | Karta części → "Alternatywne oferty" | - |
| **Skopiuj link** | Modal → Button "📋 Kopiuj link" | - |

---

## 📊 Dashboard Logistyka - Objaśnienia

### Karty statystyk (górne):

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ 📦 Znaleziono   │ 🔴 Części       │ 💰 Potencjalne  │ ✅ Części       │
│    ofert        │    krytyczne    │    oszczędności │    tańsze       │
│                 │                 │                 │                 │
│    12           │    3            │    340.00 zł    │    9            │
├─────────────────┴─────────────────┴─────────────────┴─────────────────┤
│ Znaleziono ofert = Ile części ma oferty na Allegro                    │
│ Części krytyczne = Ile części ma stan = 0 (BRAK NA STANIE)            │
│ Oszczędności = Suma (Twoja cena - Cena Allegro) dla wszystkich części│
│ Części tańsze = Ile części jest tańszych na Allegro niż u dostawcy    │
└────────────────────────────────────────────────────────────────────────┘
```

### Filtry (przyciski):

- **Wszystkie** - Pokazuje wszystkie sugestie
- **🔴 Krytyczne** - Tylko części ze stanem = 0 (PRIORYTET!)
- **💰 Oszczędności** - Tylko części z oszczędnościami ≥ 10 zł

### Karta części:

```
┌────────────────────────────────────────────────────────────┐
│ [Obraz]  Pompa odpływowa Bosch WAE20                       │
│          Kategoria: Pumps | SKU: ABC123                    │
│                                                            │
│ ┌─────────────┬─────────────┬─────────────────┐          │
│ │ Stan: 0/2   │ Min: 2      │ Zamów: 3        │          │
│ └─────────────┴─────────────┴─────────────────┘          │
│                                                            │
│ Twoja cena: 150.00 zł                                     │
│ Allegro: 120.00 zł    [Super Seller ⭐]                   │
│ Oszczędność: 30.00 zł ✅                                   │
│ Dostawa: Darmowa 🚚                                        │
│                                                            │
│ [🛒 Zobacz ofertę] [📋 Kopiuj link] [📦 Zobacz w mag.]   │
│                                                            │
│ 📦 Alternatywne oferty (3)    [∨]                         │
└────────────────────────────────────────────────────────────┘
```

**Ikony:**
- ⭐ **Super Seller** - Zweryfikowany sprzedawca z wysoką oceną
- 🚚 **Darmowa dostawa** - Bez kosztów wysyłki
- ✅ **Zielony savings** - Taniej na Allegro
- ❌ **Czerwony savings** - Drożej na Allegro (nie pokazujemy)

---

## 🔧 Aplikacja Technika - Zakładka "Części"

### Layout:

```
┌────────────────────────────────────────────────────────────┐
│ [📝 Notatki] [📷 Zdjęcia] [🔧 Części] [⏰ Czas] [📜 Historia] │
└────────────────────────────────────────────────────────────┘

Sekcja 1: Wyszukiwanie (fioletowy gradient)
┌────────────────────────────────────────────────────────────┐
│ Urządzenie: Bosch WAE20490PL                               │
│                                                            │
│ Sugerowane części dla tego modelu:                        │
│ • Pompa odpływowa [🛒]                                     │
│ • Uszczelka drzwi [🛒]                                     │
│ • Filtr [🛒]                                               │
│                                                            │
│ Lub wpisz własną część:                                   │
│ [_____________________] [🛒 Sprawdź na Allegro]           │
└────────────────────────────────────────────────────────────┘

Sekcja 2: Info (niebieski)
┌────────────────────────────────────────────────────────────┐
│ 💡 Sprawdź najpierw swój magazyn                           │
│ [📦 Przejdź do mojego magazynu]                           │
└────────────────────────────────────────────────────────────┘

Sekcja 3: Instrukcje (szary)
┌────────────────────────────────────────────────────────────┐
│ 📋 Jak zamówić część?                                      │
│ 1. Sprawdź magazyn osobisty                               │
│ 2. Sprawdź magazyn główny                                 │
│ 3. Jeśli brak - użyj przycisku "Sprawdź na Allegro"      │
│ 4. Skopiuj link i wyślij do logistyka lub kup sam        │
│ 5. Zaplanuj wizytę powrotną gdy część przyjdzie          │
└────────────────────────────────────────────────────────────┘
```

### Kiedy coś się pokazuje:

| Element | Warunek |
|---------|---------|
| Info urządzenia | `visit.device` istnieje |
| Sugerowane części | `visitModels[0].commonParts` istnieje (po zeskanowaniu) |
| Custom search | Zawsze |

---

## 🎨 AllegroQuickSearch Component

### Props:

| Prop | Typ | Wymagany | Opis |
|------|-----|----------|------|
| `partName` | string | Tak | Nazwa części do wyszukania |
| `partNumber` | string | Nie | Numer katalogowy (pomaga w wyszukiwaniu) |
| `compact` | boolean | Nie | true = ikona 🛒, false = pełny przycisk |
| `showPrices` | boolean | Nie | Czy pokazywać ceny w modalu (default: true) |
| `onResultsFound` | function | Nie | Callback z wynikami `(results) => {...}` |

### Przykłady użycia:

**Compact mode (ikona):**
```jsx
<AllegroQuickSearch 
  partName="Pompa odpływowa Bosch"
  partNumber="ABC123"
  compact={true}
/>
```

**Full mode (przycisk):**
```jsx
<AllegroQuickSearch 
  partName={partName}
  partNumber={partNumber}
  compact={false}
/>
```

**Z callback:**
```jsx
<AllegroQuickSearch 
  partName="Filtr HEPA"
  onResultsFound={(results) => {
    console.log(`Znaleziono ${results.length} ofert`);
  }}
/>
```

---

## 🐛 Troubleshooting - Szybkie Fix'y

### Problem: Nie znaleziono ofert

**Przyczyna:** Zbyt specyficzne query lub brak na Allegro

**Fix:**
1. Zmień query (usuń numer katalogowy)
2. Dodaj markę (np. "Bosch pompa")
3. Spróbuj synonimu (np. "pasek" zamiast "belt")

---

### Problem: Długie ładowanie sugestii

**Przyczyna:** Dużo części do sprawdzenia

**Fix:**
1. Poczekaj ~1-2 minuty (normal)
2. Następnym razem będzie szybko (cache)
3. Lub filtruj tylko krytyczne (🔴)

---

### Problem: Badge Sandbox nie znika

**Przyczyna:** Checkbox w ustawieniach nadal zaznaczony

**Fix:**
1. `/admin/allegro/settings`
2. **ODZNACZ** "🧪 Używaj Sandbox"
3. Zapisz
4. Odśwież stronę

---

### Problem: "Test nieudany"

**Fix:**
1. Sprawdź credentials (Client ID/Secret)
2. Sprawdź checkbox Sandbox (musi być zgodny z typem app)
3. Terminal: `Remove-Item data\allegro-token.json`
4. Spróbuj ponownie

---

## 💡 Pro Tips

### 1. Codzienne sprawdzanie
**TIP:** Kliknij "Odśwież ceny" raz dziennie rano. Cache jest ważny 24h.

### 2. Priorytetyzacja
**TIP:** Najpierw kup części 🔴 KRYTYCZNE (stan = 0), potem 💰 OSZCZĘDNOŚCI.

### 3. Alternatywne oferty
**TIP:** Zawsze sprawdź "Alternatywne oferty" - może być tańsza opcja!

### 4. Super Seller
**TIP:** Wybieraj sprzedawców z ⭐ Super Seller badge - pewniejsza dostawa.

### 5. Darmowa dostawa
**TIP:** Sortuj po 🚚 darmowej dostawie - oszczędzasz dodatkowe 10-20 zł.

### 6. Bulk ordering
**TIP:** Zamów kilka części od tego samego sprzedawcy - jedna dostawa!

### 7. Magazyn technika
**TIP:** Technik powinien sprawdzić swój magazyn PRZED szukaniem na Allegro.

### 8. Price tracking
**TIP:** Zapisz link do części w notatkach wizyty - później sprawdzisz czy cena spadła.

---

## 📱 Skróty Klawiszowe (Future)

> Obecnie brak, ale można dodać w przyszłości:

- `Ctrl + K` - Szybkie wyszukiwanie
- `Ctrl + R` - Odśwież sugestie
- `Ctrl + C` - Kopiuj link (gdy modal otwarty)
- `Esc` - Zamknij modal

---

## 🔗 Najważniejsze Linki

| Co | Gdzie |
|----|-------|
| **Dashboard sugestii** | `/logistyka/allegro/suggestions` |
| **Magazyn główny** | `/admin/magazyn/czesci` |
| **Wizyty technika** | `/technician/visit/[visitId]` |
| **Ustawienia Allegro** | `/admin/allegro/settings` |
| **Wyszukiwarka** | `/admin/allegro/search` |
| **Magazyn osobisty** | `/technician/magazyn/moj-magazyn` |

---

## 📖 Pełna Dokumentacja

| Dokument | Co Zawiera |
|----------|------------|
| `ALLEGRO_USER_DOCUMENTATION.md` | Pełny user guide (5000+ słów) |
| `ALLEGRO_INTEGRATION_PLAN.md` | Plan implementacji + use cases |
| `ALLEGRO_API_STATUS.md` | Status OAuth + Sandbox/Production |
| `ALLEGRO_INTEGRATION_COMPLETE.md` | Kompletne podsumowanie |
| `ALLEGRO_QUICK_REFERENCE.md` | Ten plik (szybki przewodnik) |

---

## ✅ Daily Checklist - Logistyk

### Poranna rutyna (15 minut):

- [ ] Otwórz `/logistyka/allegro/suggestions`
- [ ] Kliknij "🔄 Odśwież ceny" (jeśli nie dzisiaj)
- [ ] Poczekaj ~1 minutę
- [ ] Filtruj 🔴 Krytyczne
- [ ] Zamów części ze stanem = 0
- [ ] Filtruj 💰 Oszczędności
- [ ] Rozważ zakup części z oszczędnościami ≥ 20 zł
- [ ] Sprawdź email - czy są zamówienia od techników

### Po dostawie:

- [ ] Otwórz `/admin/magazyn/czesci`
- [ ] Kliknij "Dodaj część"
- [ ] Wypełnij dane (nazwa, cena, ilość)
- [ ] Zapisz
- [ ] Jeśli dla technika - przydziel do jego magazynu

---

## 🎯 KPI - Co Mierzyć

### Miesięczne:

1. **Ilość części kupionych przez Allegro:** _____ szt
2. **Oszczędności vs dostawca:** _____ zł
3. **Średni czas dostawy:** _____ dni
4. **Ilość wyszukiwań:** _____ (z `/api/inventory/allegro-history`)
5. **Części najtańsze na Allegro:** _____ % (z dashboardu)

### Target KPI:

- Oszczędności: ≥ 1000 zł/miesiąc
- Średni czas dostawy: ≤ 3 dni
- Części z Allegro: ≥ 30% wszystkich zakupów

---

## 🚀 Szybki Start (Nowy Użytkownik)

### Krok 1: Sprawdź czy działa (2 min)
```
1. Otwórz /admin/magazyn/czesci
2. Kliknij 🛒 przy dowolnej części
3. Jeśli widzisz oferty → DZIAŁA ✅
```

### Krok 2: Zobacz dashboard (5 min)
```
1. Otwórz /logistyka/magazyn
2. Kliknij "🛒 Allegro - Sugestie zakupów"
3. Kliknij "🔄 Odśwież ceny"
4. Poczekaj ~1 minutę
5. Zobacz sugestie → Eksploruj filtry
```

### Krok 3: Przetestuj w aplikacji technika (3 min)
```
1. Otwórz dowolną wizytę
2. Kliknij zakładkę "🔧 Części"
3. Wpisz "pompa" w pole tekstowe
4. Kliknij "Sprawdź na Allegro"
5. Zobacz wyniki → Skopiuj link
```

**Total: 10 minut - jesteś gotowy! 🎉**

---

*Quick Reference Guide v1.0*  
*Data: 5 października 2025*  
*Dla pełnej dokumentacji zobacz: `ALLEGRO_USER_DOCUMENTATION.md`*
