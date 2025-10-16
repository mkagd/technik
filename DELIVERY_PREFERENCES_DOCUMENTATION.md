# 🚚 System Preferencji Dostaw i Płatności

## 📋 Przegląd

System automatycznie stosuje preferencje dostaw ustawione przez administratora dla każdego pracownika podczas składania zamówień części.

---

## 🎯 Jak to działa?

### 1️⃣ **Administrator ustawia preferencje** (`/admin/pracownicy/[id]`)

W zakładce "Podstawowe dane" jest sekcja **"🚚 Preferencje dostaw i płatności"**:

#### Dostępne opcje dostawy:
- 🏢 **Biuro firmowe** - domyślny adres z profilu pracownika
- 📮 **Paczkomat InPost** - z możliwością ustawienia domyślnego numeru
- 📍 **Pytaj za każdym razem** - pracownik wybiera przy każdym zamówieniu

#### Dostępne formy płatności:
- ✅ **Przedpłata** (przelew) - firma płaci z góry
- 📦 **Pobranie** - płatność przy odbiorze (+~5 zł opłaty)

#### Dodatkowa kontrola:
- ⚠️ **Checkbox "Zezwól na pobranie"** - administrator może wyłączyć możliwość używania pobrania

---

### 2️⃣ **Formularz zamówienia automatycznie używa preferencji** (`/technician/magazyn/zamow`)

Gdy pracownik otwiera formularz zamówienia:

1. **System pobiera dane pracownika** z API `/api/employees`
2. **Automatycznie wypełnia formularz** preferencjami:
   - Ustawia domyślną metodę dostawy
   - Wypełnia numer paczkomatu (jeśli ustawiony)
   - Ustawia domyślną formę płatności
   - Blokuje pobranie (jeśli wyłączone przez admina)

#### Przykładowy log konsoli:
```javascript
✅ Załadowano preferencje pracownika: {
  delivery: 'paczkomat',
  paczkomat: 'KRA01M',
  payment: 'prepaid',
  allowCOD: true
}
```

---

### 3️⃣ **Walidacja przy wysyłaniu zamówienia**

System sprawdza:
- ✅ Czy podano numer paczkomatu (jeśli wybrano paczkomat)
- ✅ Czy podano adres (jeśli wybrano "inny adres")
- ✅ Czy pracownik ma uprawnienia do pobrania (jeśli wybrał COD)

#### Komunikaty błędów:
```
⛔ Nie masz uprawnień do używania płatności pobraniowej. 
   Skontaktuj się z administratorem.
```

---

## 📊 Struktura danych

### W `employees.json`:
```json
{
  "id": "EMPA252780002",
  "name": "Mariusz Bielaszka",
  "deliveryPreferences": {
    "preferredDeliveryMethod": "office|paczkomat|custom",
    "defaultPaczkomatId": "KRA01M",
    "preferredPaymentMethod": "prepaid|cod",
    "allowCOD": true,
    "notes": "Dodatkowe uwagi"
  }
}
```

### W `part-requests.json` (zamówienia):
```json
{
  "requestId": "ZC-2510151001-019",
  "preferredDelivery": "office|paczkomat|custom",
  "paczkomatId": "KRA01M",
  "alternativeAddress": "ul. Przykładowa 12, 00-001 Warszawa",
  "paymentMethod": "prepaid|cod"
}
```

---

## 🎨 UI/UX

### Formularz zamówienia:

#### ✅ Gdy wszystko OK (domyślne ustawienia):
```
📦 Miejsce dostawy
   ⦿ 🏢 Biuro firmowe (domyślnie)
   ○ 📮 Paczkomat InPost
   ○ 📍 Inny adres

💳 Forma płatności za przesyłkę
   ⦿ ✅ Przedpłata (przelew)
   ○ 📦 Pobranie (przy odbiorze)
```

#### ⛔ Gdy pobranie wyłączone:
```
💳 Forma płatności za przesyłkę
   ⦿ ✅ Przedpłata (przelew)
   ○ 📦 Pobranie (płatność przy odbiorze) ⛔ Niedostępne
      Administrator wyłączył możliwość pobrania dla Twojego konta
```

#### ℹ️ Informacja o niestandardowych ustawieniach:
```
ℹ️ Używasz niestandardowych ustawień dostawy. 
   Możesz zmienić swoje preferencje w panelu pracownika.
```

---

## 🔧 Implementacja techniczna

### Kluczowe pliki:

1. **`pages/admin/pracownicy/[id].js`**
   - UI dla ustawień preferencji (linie ~640-750)
   - Sekcja "🚚 Preferencje dostaw i płatności"

2. **`pages/technician/magazyn/zamow.js`**
   - Funkcja `loadEmployeePreferences()` (linia ~95)
   - Automatyczne wypełnianie formularza
   - Walidacja przy wysyłaniu

3. **`pages/api/part-requests/index.js`**
   - Przyjmuje `preferredDelivery`, `paczkomatId`, `paymentMethod`
   - Zapisuje dane do part-requests.json

4. **`data/employees.json`**
   - Przechowuje preferencje pracowników
   - Pole `deliveryPreferences`

---

## 🧪 Testowanie

### Scenariusz 1: Domyślne ustawienia
1. Admin ustawia dla pracownika: Biuro + Przedpłata
2. Pracownik otwiera formularz zamówienia
3. ✅ Formularz automatycznie ma wybrane: Biuro + Przedpłata

### Scenariusz 2: Paczkomat z domyślnym numerem
1. Admin ustawia: Paczkomat + numer "KRA01M" + Przedpłata
2. Pracownik otwiera formularz
3. ✅ Formularz ma: Paczkomat + pole już wypełnione "KRA01M"

### Scenariusz 3: Blokada pobrania
1. Admin ODZNACZA checkbox "Zezwól na pobranie"
2. Pracownik otwiera formularz
3. ✅ Opcja "Pobranie" jest wyszarzona i niedostępna
4. Pracownik próbuje wysłać z pobraniem (programowo)
5. ✅ Błąd: "⛔ Nie masz uprawnień..."

### Scenariusz 4: "Pytaj za każdym razem"
1. Admin ustawia metodę: "Pytaj za każdym razem"
2. Pracownik otwiera formularz
3. ✅ Formularz ma domyślnie: Biuro (nie przejmuje ustawień)
4. Pracownik może wybrać dowolną opcję

---

## 📈 Korzyści

✅ **Automatyzacja** - pracownik nie musi za każdym razem wypełniać tych samych danych
✅ **Kontrola kosztów** - admin może wyłączyć pobranie (droższa opcja)
✅ **Spójność** - wszystkie zamówienia pracownika trafiają w to samo miejsce
✅ **Wygoda** - domyślny paczkomat już wpisany
✅ **Elastyczność** - pracownik może zmienić ustawienia dla konkretnego zamówienia

---

## 🔐 Bezpieczeństwo

- ✅ Walidacja po stronie serwera
- ✅ Sprawdzenie uprawnień przy zapisie
- ✅ Niemożność obejścia blokady pobrania
- ✅ Logi w konsoli dla debugowania

---

## 📝 Changelog

**2025-10-15:**
- ✅ Dodano sekcję preferencji w panelu admina
- ✅ Dodano automatyczne ładowanie preferencji w formularzu
- ✅ Dodano kontrolę dostępu do opcji pobrania
- ✅ Dodano walidację i komunikaty błędów
- ✅ Dodano wizualne oznaczenia zablokowanych opcji

---

## 🆘 Troubleshooting

**Problem:** Preferencje nie ładują się automatycznie
- ✅ Sprawdź konsolę: szukaj loga "✅ Załadowano preferencje pracownika"
- ✅ Upewnij się, że pracownik jest zalogowany (employeeId)
- ✅ Sprawdź czy API `/api/employees` zwraca dane

**Problem:** Pobranie jest dostępne mimo blokady
- ✅ Sprawdź w `employees.json` czy pole `allowCOD` jest `false`
- ✅ Wyczyść cache przeglądarki (Ctrl+F5)
- ✅ Sprawdź logi konsoli przy ładowaniu preferencji

**Problem:** Domyślny paczkomat się nie wypełnia
- ✅ Upewnij się, że `preferredDeliveryMethod` jest ustawione na `"paczkomat"`
- ✅ Sprawdź czy pole `defaultPaczkomatId` nie jest puste
- ✅ Zobacz logi: `paczkomat: 'KRA01M'`

---

## 🎓 Best Practices

1. **Zawsze ustawiaj preferencje dla nowych pracowników**
2. **Wyłączaj pobranie jeśli nie jest konieczne** (oszczędność kosztów)
3. **Używaj "Pytaj za każdym razem" tylko dla pracowników z różnymi lokalizacjami**
4. **Regularnie aktualizuj domyślne paczkomaty** (sprawdź czy są aktywne)

---

## 📚 Zobacz też:

- `NORTH_PARTS_ORDER_CHANGES.md` - Historia zmian w systemie zamówień
- `API_ENDPOINTS_MAP.md` - Dokumentacja endpointów API
- `pages/admin/pracownicy/[id].js` - Kod źródłowy panelu admina
- `pages/technician/magazyn/zamow.js` - Kod źródłowy formularza zamówienia
