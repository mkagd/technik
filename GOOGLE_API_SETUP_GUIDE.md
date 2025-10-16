# 🚨 GOOGLE API REQUEST_DENIED - Jak Naprawić

**Problem:** Geocoding zwraca błąd `REQUEST_DENIED` i używa fallbacku (Kraków dla wszystkich adresów)

**Status:** ✅ FALLBACK USUNIĘTY - Teraz system pokaże prawdziwy błąd Google API

---

## 🔍 Dlaczego REQUEST_DENIED?

Google Geocoding API **wymaga**:
1. ✅ Poprawnego API Key
2. ✅ Włączonej usługi "Geocoding API" w Google Cloud Console
3. ❌ **BILLING (karta kredytowa)** - nawet dla darmowego limitu!
4. ✅ Brak ograniczeń domenowych (lub localhost dodany do whitelist)

---

## ⚙️ Jak Skonfigurować Google API (Krok po Kroku)

### Krok 1: Google Cloud Console

1. Idź do: https://console.cloud.google.com/
2. Zaloguj się na konto Google
3. Wybierz projekt lub stwórz nowy

### Krok 2: Włącz Geocoding API

1. Menu → **APIs & Services** → **Library**
2. Szukaj: "Geocoding API"
3. Kliknij → **ENABLE** (włącz)

### Krok 3: ⚠️ KLUCZOWE - Skonfiguruj Billing

**To jest główna przyczyna REQUEST_DENIED!**

1. Menu → **Billing** → **Link a billing account**
2. Dodaj kartę kredytową
3. **NIE MARTW SIĘ** - Google daje:
   - ✅ $200 darmowych kredytów na start
   - ✅ 40,000 darmowych requestów miesięcznie
   - ✅ Płacisz TYLKO powyżej limitu

**Bez billingu API nie działa WCALE - nawet z darmowym limitem!**

### Krok 4: Sprawdź/Utwórz API Key

1. Menu → **APIs & Services** → **Credentials**
2. **CREATE CREDENTIALS** → API Key
3. Skopiuj klucz (np. `AIzaSyDu...`)

### Krok 5: Usuń Ograniczenia API Key (dla testów)

1. Kliknij na swój API Key w liście
2. **Application restrictions:**
   - Wybierz: **None** (brak ograniczeń)
   - LUB dodaj: `http://localhost:3000/*` do whitelist
3. **API restrictions:**
   - Wybierz: **Restrict key**
   - Zaznacz tylko: **Geocoding API**
4. **SAVE**

### Krok 6: Sprawdź w .env.local

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDuTTA-1AtXyeHd6r-uu8CFWT6UUpxGByo
```

Upewnij się że:
- ✅ Klucz jest poprawny
- ✅ Zaczyna się od `AIza`
- ✅ Brak spacji przed/po

---

## 🧪 Test API Key (Prosty Test)

Otwórz terminal i uruchom:

```bash
$apiKey = "AIzaSyDuTTA-1AtXyeHd6r-uu8CFWT6UUpxGByo"
$address = "Słupia 114, 28-133 Pacanów"
$url = "https://maps.googleapis.com/maps/api/geocode/json?address=$([uri]::EscapeDataString($address))&key=$apiKey"
Invoke-RestMethod -Uri $url | ConvertTo-Json -Depth 5
```

**Oczekiwane wyniki:**

### ✅ SUKCES (Billing włączony):
```json
{
  "status": "OK",
  "results": [
    {
      "formatted_address": "Słupia 114, 28-133 Pacanów, Polska",
      "geometry": {
        "location": {
          "lat": 50.40xxxx,
          "lng": 20.85xxxx
        }
      }
    }
  ]
}
```

### ❌ BŁĄD (Brak billingu):
```json
{
  "status": "REQUEST_DENIED",
  "error_message": "This API project is not authorized to use this API. Please ensure this API is activated in the Google Developers Console..."
}
```

**Rozwiązanie:** Włącz billing w Google Cloud Console!

---

## 🔧 Co Zrobiłem w Kodzie

### 1. Usunięty Fallback

**PRZED:**
```javascript
if (data.status === 'REQUEST_DENIED') {
  // Używaj fallbacku (lokalna baza - zwraca Kraków!)
  const fallbackResult = this.fallbackGeocode(address);
  return { success: true, data: fallbackResult };
}
```

**TERAZ:**
```javascript
if (data.status === 'REQUEST_DENIED') {
  // Pokaż prawdziwy błąd!
  console.error('❌ Google API REQUEST_DENIED');
  throw new Error(`Google API odrzuciło żądanie: ${data.error_message}`);
}
```

### 2. Usunięta Metoda fallbackGeocode()

Całkowicie usunięta metoda która zwracała fałszywe współrzędne Krakowa.

---

## 📊 Diagnoza Problemu "Pacanów → Kraków"

### Co Się Działo:

1. User dodaje adres: "Słupia 114, 28-133 Pacanów"
2. System próbuje geocodować przez Google API
3. Google zwraca: `REQUEST_DENIED` (brak billingu)
4. **Stary kod:** Używał fallbacku → szukał "pacanow" w lokalnej bazie → nie znalazł → zwrócił Kraków (50.0647, 19.945) ❌
5. UI pokazało: współrzędne Krakowa dla adresu Pacanowa ❌

### Co Jest Teraz:

1. User dodaje adres: "Słupia 114, 28-133 Pacanów"
2. System próbuje geocodować przez Google API
3. Google zwraca: `REQUEST_DENIED`
4. **Nowy kod:** Wyrzuca błąd! ✅
5. UI pokazuje: "❌ Błąd geocodingu: Google API odrzuciło żądanie"
6. User wie że musi skonfigurować billing! ✅

---

## 🚀 Po Skonfigurowaniu Billingu

### Krok 1: Sprawdź Terminal Test

```bash
node -e "fetch('https://maps.googleapis.com/maps/api/geocode/json?address=Pacanów&key=AIzaSyDuTTA-1AtXyeHd6r-uu8CFWT6UUpxGByo').then(r=>r.json()).then(d=>console.log(d.status, d.results?.[0]?.formatted_address))"
```

Powinno pokazać:
```
OK Pacanów, Polska
```

### Krok 2: Test w Aplikacji

1. Otwórz: `http://localhost:3000/admin/rezerwacje/nowa`
2. Dodaj adres: "Słupia 114, 28-133 Pacanów"
3. Otwórz DevTools Console (F12)
4. Kliknij "Zapisz"

**Oczekiwane logi:**
```
🔍 Geocoding:
  📥 Original: Słupia 114, 28-133 Pacanów
  ✨ Enhanced: Słupia 114, 28-133 Pacanów, Polska
  📍 Google zwrócił 1 wyników:
    1. Słupia 114, 28-133 Pacanów, Polska
       Dokładność: ROOFTOP
       Coords: 50.40xxx, 20.85xxx
  ✅ Wybrano: Słupia 114, 28-133 Pacanów, Polska
```

### Krok 3: Sprawdź Współrzędne

Otwórz szczegóły zlecenia → sekcja GPS:
- ✅ Szerokość: ~50.40° (NIE 50.06°!)
- ✅ Długość: ~20.85° (NIE 19.94°!)
- ✅ "Otwórz w mapach" → pokazuje Pacanów, nie Kraków!

---

## 💰 Koszty Google Geocoding API

### Darmowy Limit:
- ✅ **$200** kredytów na start (wystarczy na rok!)
- ✅ **40,000** requestów miesięcznie gratis
- ✅ $5 za 1000 requestów powyżej limitu

### Przykładowe Zużycie:
- 10 zleceń dziennie = 300/miesiąc = **$0** (poniżej limitu)
- 100 zleceń dziennie = 3000/miesiąc = **$0** (poniżej limitu)
- 200 zleceń dziennie = 6000/miesiąc = **$0** (poniżej limitu)
- 1500 zleceń dziennie = 45,000/miesiąc = **$0.25** (5000 nad limitem)

**Wniosek:** Dla małej/średniej firmy serwisowej = praktycznie darmowe! 💰

---

## ✅ Checklist Konfiguracji

- [ ] Google Cloud Console → Projekt utworzony
- [ ] Geocoding API → Włączone
- [ ] **Billing → Karta kredytowa dodana** ⚠️ KLUCZOWE!
- [ ] API Key → Utworzony i skopiowany
- [ ] API Key → Ograniczenia usunięte (lub localhost dodany)
- [ ] .env.local → Klucz wklejony
- [ ] Restart dev server: `npm run dev`
- [ ] Test terminala → status "OK"
- [ ] Test w aplikacji → współrzędne poprawne

---

## 🐛 Najczęstsze Problemy

### "REQUEST_DENIED" mimo poprawnego klucza
❌ **Przyczyna:** Brak billingu  
✅ **Rozwiązanie:** Dodaj kartę w Google Cloud Console → Billing

### "API not activated"
❌ **Przyczyna:** Geocoding API nie włączone  
✅ **Rozwiązanie:** Google Cloud Console → APIs → Library → Geocoding API → Enable

### "This IP, site or mobile application is not authorized"
❌ **Przyczyna:** Ograniczenia domenowe  
✅ **Rozwiązanie:** API Key settings → Application restrictions → None

### Współrzędne dla localhost nie działają
❌ **Przyczyna:** Fetch z przeglądarki ma ograniczenia CORS  
✅ **Rozwiązanie:** To jest OK - geocoding działa po stronie serwera (nie z przeglądarki)

---

## 📚 Dokumentacja Google

- **Geocoding API Docs:** https://developers.google.com/maps/documentation/geocoding
- **Pricing:** https://cloud.google.com/maps-platform/pricing
- **Setup Guide:** https://developers.google.com/maps/documentation/geocoding/get-api-key

---

## ✅ Status: Gotowe do Konfiguracji!

**Co zostało zrobione:**
- ✅ Usunięty fallback (fałszywe współrzędne Krakowa)
- ✅ Kod pokazuje prawdziwe błędy Google API
- ✅ Dokumentacja konfiguracji gotowa

**Co musisz zrobić:**
1. Włącz **Billing** w Google Cloud Console (dodaj kartę)
2. Sprawdź czy **Geocoding API** jest włączone
3. Restart dev server
4. Test z "Pacanów" - powinno działać! ✅

**Po konfiguracji:**
- ✅ Pacanów → ~50.40°, 20.85° (poprawne!)
- ✅ Mielec → ~50.28°, 21.42° (poprawne!)
- ✅ Kraków → ~50.06°, 19.94° (poprawne!)
- ❌ Brak fałszywych współrzędnych!

🎉 **System jest gotowy - czeka tylko na skonfigurowanie billingu w Google!**
