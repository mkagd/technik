# 🚀 Quick Start: Auto-uzupełnianie miasta po kodzie pocztowym

**Dodaj do swojego formularza w 3 krokach!**

---

## Krok 1: Import hook'a

```javascript
import { usePostalCode } from '@/lib/postal-code/usePostalCode';
```

---

## Krok 2: Użyj w komponencie

```javascript
export default function MojFormularz() {
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  
  // ⬇️ DODAJ TO
  const { getCityFromPostalCode, isLoading } = usePostalCode();

  const handlePostalCodeChange = async (e) => {
    const value = e.target.value;
    setPostalCode(value);

    // ⬇️ DODAJ TO - auto-uzupełnianie miasta
    const cleanCode = value.replace(/\s/g, '');
    if (/^\d{2}-?\d{3}$/.test(cleanCode)) {
      const result = await getCityFromPostalCode(value);
      if (result?.city) {
        setCity(result.city); // ✅ Automatycznie uzupełnia miasto
      }
    }
  };

  return (
    <div>
      <input
        type="text"
        value={postalCode}
        onChange={handlePostalCodeChange}
        placeholder="00-000"
        maxLength={6}
      />
      {isLoading && <span>🔍 Szukam...</span>}
      
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
    </div>
  );
}
```

---

## Krok 3: Gotowe! 🎉

Teraz gdy użytkownik wpisze kod pocztowy (np. "00-001"), miasto automatycznie się uzupełni ("Warszawa").

---

## 💡 Bonus: Z debounce (jeszcze lepsze!)

```javascript
import debounce from 'lodash/debounce';
import { useCallback } from 'react';

const { getCityFromPostalCode } = usePostalCode();

// Czeka 500ms po przestaniu pisać
const debouncedLookup = useCallback(
  debounce(async (code) => {
    const result = await getCityFromPostalCode(code);
    if (result?.city) setCity(result.city);
  }, 500),
  []
);

const handlePostalCodeChange = (e) => {
  const value = e.target.value;
  setPostalCode(value);
  
  if (/^\d{2}-?\d{3}$/.test(value.replace(/\s/g, ''))) {
    debouncedLookup(value);
  }
};
```

---

## 🎯 Gdzie użyć?

✅ Formularz rezerwacji (`/rezerwacja`)  
✅ Panel admina (dodawanie klientów)  
✅ Panel pracownika (wizyty)  
✅ Wszędzie gdzie jest pole "kod pocztowy" + "miasto"

---

## 📊 Statystyki (opcjonalnie)

```javascript
const { stats } = usePostalCode();

console.log(stats.cacheSize);           // Ile kodów w cache
console.log(stats.googleRequests);      // Zapytania dzisiaj
console.log(stats.googleUsagePercent);  // % wykorzystania limitu
```

---

## ❓ Pytania?

- 📖 **Pełna dokumentacja:** `lib/postal-code/README.md`
- 💻 **Więcej przykładów:** `lib/postal-code/examples.js`
- 🧪 **Test:** `node test-postal-code-service.js`

---

**Strategia:**
1. 🆓 Najpierw próbuje OSM (darmowy)
2. 💰 Jeśli OSM nie znalazł → Google API (płatny)
3. 💾 Zapisuje do cache (drugi raz już z pamięci)

**Wynik:** ~99% zapytań darmowych!
