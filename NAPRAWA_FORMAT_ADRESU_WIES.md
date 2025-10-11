# 🏘️ Naprawa: Poprawne formatowanie adresu dla wsi

## 🐛 Problem

Użytkownik zgłosił, że przy wpisywaniu adresu w wiosce/wsi:
- **Wpisywał:** Numer domu "228J" w polu "Ulica i numer"
- **System pokazywał:** `228J, 39-200 Nagawczyna` ❌
- **Powinno być:** `Nagawczyna 228J, 39-200 Nagawczyna` ✅

## 🔧 Rozwiązanie

### 1. Zaktualizowany label i placeholder

**Przed:**
```jsx
<label>Ulica i numer *</label>
<input placeholder="ul. Główna 123" />
```

**Po:**
```jsx
<label>Ulica i numer / Miejscowość i numer *</label>
<input placeholder="np. Główna 123 lub Nagawczyna 228J" />
<p className="text-xs text-gray-500 mt-1">
    💡 Dla wsi wpisz: nazwa miejscowości + numer (np. "Nagawczyna 228J")
</p>
```

### 2. Inteligentne auto-uzupełnianie

Dodano logikę w `handleChange()`, która automatycznie dodaje nazwę miejscowości:

```javascript
// Jeśli użytkownik wpisze tylko "228J"
// A w polu "Miasto" jest już "Nagawczyna"
// System automatycznie zamieni na "Nagawczyna 228J"

if (name === 'street') {
    const isOnlyNumber = /^[\d\s\/-]+[a-zA-Z]?$/.test(value.trim());
    
    if (isOnlyNumber && formData.city && !value.includes(formData.city)) {
        finalValue = `${formData.city} ${value.trim()}`;
    }
}
```

### 3. Regex - co wykrywa jako "tylko numer"

Pattern: `/^[\d\s\/-]+[a-zA-Z]?$/`

**Wykrywa:**
- ✅ `228` - sam numer
- ✅ `228J` - numer z literą
- ✅ `17/30` - numer z ukośnikiem
- ✅ `123 A` - numer ze spacją i literą
- ✅ `45-12` - numer z myślnikiem

**NIE wykrywa (pozostawia bez zmian):**
- ❌ `ul. Główna 123` - już zawiera ulicę
- ❌ `Nagawczyna 228` - już zawiera miejscowość
- ❌ `Main Street 45` - już zawiera nazwę

## 📊 Przykłady działania

### Przykład 1: Wieś bez ulicy
**Input użytkownika:**
1. Miasto: `Nagawczyna`
2. Ulica i numer: `228J`

**System automatycznie:**
- Wykrywa że "228J" to tylko numer
- Dodaje nazwę miasta: `Nagawczyna 228J`

**Wynik:**
```
📍 Twój adres:
Nagawczyna 228J, 39-200 Nagawczyna
```

### Przykład 2: Miasto z ulicą
**Input użytkownika:**
1. Miasto: `Kraków`
2. Ulica i numer: `Chotowa 54`

**System:**
- Wykrywa że "Chotowa 54" to już pełny adres
- NIE dodaje "Kraków" na początku

**Wynik:**
```
📍 Twój adres:
Chotowa 54, 31-000 Kraków
```

### Przykład 3: Numer z ukośnikiem
**Input użytkownika:**
1. Miasto: `Kraków`
2. Ulica i numer: `17/30`

**System:**
- Wykrywa że "17/30" to tylko numer
- Dodaje nazwę: `Kraków 17/30`

**Wynik:**
```
📍 Twój adres:
Kraków 17/30, 39-300 Kraków
```

### Przykład 4: Już wpisana pełna nazwa
**Input użytkownika:**
1. Miasto: `Nagawczyna`
2. Ulica i numer: `Nagawczyna 228J` (ręcznie wpisane)

**System:**
- Wykrywa że już zawiera "Nagawczyna"
- NIE duplikuje: pozostawia `Nagawczyna 228J`

**Wynik:**
```
📍 Twój adres:
Nagawczyna 228J, 39-200 Nagawczyna
```

## 🎯 User Experience

### Przed naprawą:
```
Krok 1: Gdzie jesteś?
├── Kod pocztowy: [39-200]
├── Miasto: [Nagawczyna]
└── Ulica i numer: [228J]
    ❌ Wynik: "228J, 39-200 Nagawczyna" (błędny format)
```

### Po naprawie:
```
Krok 1: Gdzie jesteś?
├── Kod pocztowy: [39-200]
├── Miasto: [Nagawczyna]
└── Ulica i numer / Miejscowość i numer: [228J]
    💡 Dla wsi wpisz: nazwa miejscowości + numer
    ✅ Auto: "Nagawczyna 228J"
    ✅ Wynik: "Nagawczyna 228J, 39-200 Nagawczyna"
```

## 🔄 Kompatybilność z wyszukiwaniem klientów

System wyszukiwania (`search-by-address.js`) już posiada normalizację, więc:

**Oba formaty działają:**
- ✅ `Nagawczyna 228J` → normalizuje do `nagawczyna 228j`
- ✅ `228J` → też normalizuje do `228j`
- ✅ Fuzzy matching uwzględnia różne warianty

**Nie ma kolizji:**
- API dopasuje "Nagawczyna 228J" do "Nagawczyna 228J" (exact match)
- API dopasuje "228J, Nagawczyna" do "Nagawczyna 228J" (fuzzy match)

## 📝 Zmienione pliki

- ✅ `pages/rezerwacja.js`
  - Zaktualizowany label: "Ulica i numer / Miejscowość i numer"
  - Nowy placeholder: "np. Główna 123 lub Nagawczyna 228J"
  - Dodana podpowiedź dla wsi
  - Inteligentne auto-uzupełnianie w `handleChange()`
  - Regex do wykrywania "tylko numeru"

## ✅ Status

- ✅ Label zaktualizowany
- ✅ Placeholder rozszerzony
- ✅ Dodana podpowiedź tekstowa
- ✅ Auto-uzupełnianie działa
- ✅ Kompatybilne z API wyszukiwania
- ✅ Testowane dla wsi i miast

## 🧪 Jak przetestować

1. Otwórz `/rezerwacja`
2. Krok 1 - wprowadź dane:
   - Kod: `39-200`
   - Miasto: `Nagawczyna`
   - Ulica: wpisz tylko `228J`
3. Pole automatycznie uzupełni się do: `Nagawczyna 228J`
4. Zielony box pokaże: `Nagawczyna 228J, 39-200 Nagawczyna` ✅

---

**Fix Date:** 2025-10-08  
**Reported by:** User  
**Status:** ✅ FIXED and TESTED
