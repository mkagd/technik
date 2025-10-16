# 📝 Uproszczenie formularza dla części z North.pl

## Przegląd

Formularz zamówienia części został zaktualizowany aby automatycznie ukrywać zbędne pola gdy zamawiane są tylko części z North.pl.

## Zmiany w formularzu

### 1. Warunkowo ukryta sekcja "Dostawa"

**Przed:**
- Sekcja dostawy (Paczkomat/Biuro) zawsze widoczna
- Paczkomat ID zawsze wymagany przy wyborze paczkomatu

**Po:**
```javascript
// Sekcja dostawy pokazuje się tylko gdy są części z magazynu
{selectedParts.some(p => !p.northData) && (
  <div className="mb-6">
    {/* Opcje dostawy: Paczkomat / Biuro */}
  </div>
)}
```

### 2. Informacja o dostawie North.pl

Gdy **wszystkie** części są z North.pl, pokazuje się pomarańczowy banner informacyjny:

```
🚚 Dostawa przez North.pl
Części zamawiane bezpośrednio z North.pl - dostawa według ich warunków
```

### 3. Zaktualizowana walidacja formularza

```javascript
const handleSubmit = async (e) => {
  // Sprawdź czy są części z magazynu
  const hasWarehouseParts = selectedParts.some(p => !p.northData);
  
  // Walidacja tylko dla części z magazynu
  if (hasWarehouseParts && selectedParts.some(p => !p.partId && !p.northData)) {
    alert('Wybierz wszystkie części!');
    return;
  }
  
  // Paczkomat wymagany tylko dla części z magazynu
  if (hasWarehouseParts && delivery === 'paczkomat' && !paczkomatId) {
    alert('Podaj ID Paczkomatu!');
    return;
  }
};
```

## Scenariusze użycia

### Scenariusz A: Tylko części z North.pl
1. Użytkownik klika "Szukaj na North.pl"
2. Wkleja link z North.pl
3. System automatycznie wypełnia dane
4. **Sekcja dostawy NIE jest widoczna** ✅
5. Pokazuje się banner: "Dostawa przez North.pl"
6. Formularz można od razu wysłać (bez wyboru paczkomatu)

### Scenariusz B: Tylko części z magazynu
1. Użytkownik wybiera część z dropdowna magazynowego
2. **Sekcja dostawy JEST widoczna** ✅
3. Trzeba wybrać Paczkomat lub Biuro
4. Przy Paczkomacie wymagany ID

### Scenariusz C: Mix - części z magazynu + North.pl
1. Użytkownik dodaje część z magazynu
2. Następnie dodaje część z North.pl
3. **Sekcja dostawy JEST widoczna** ✅ (bo są części magazynowe)
4. Paczkomat ID wymagany dla części magazynowych
5. Części z North.pl będą dostarczone osobno przez North.pl

## Logika wykrywania typu części

Część z North.pl rozpoznawana jest przez:
```javascript
part.northData !== undefined
// lub
part.source === 'north.pl'
```

Część z magazynu:
```javascript
!part.northData && part.partId
```

## Struktura danych North.pl

Części z North.pl mają strukturę:
```javascript
{
  northData: {
    name: "Zaczep grzebienia górnego kosza...",
    partNumber: "00611474",
    price: 51.90,
    quantity: 1,
    notes: "...",
    images: ["https://north.pl/thumb/...", ...],
    sourceUrl: "https://north.pl/karta/..."
  }
}
```

## Korzyści dla użytkownika

✅ **Szybsze składanie zamówień** - mniej pól do wypełnienia
✅ **Mniej błędów** - nie trzeba podawać paczkomatu dla North.pl
✅ **Jasność** - widać od razu skąd będzie dostawa
✅ **Elastyczność** - można mieszać części z obu źródeł

## Testy

### Test 1: Tylko North.pl
- [x] Sekcja dostawy ukryta
- [x] Banner North.pl widoczny
- [x] Formularz można wysłać bez ID paczkomatu
- [x] Brak błędów walidacji

### Test 2: Tylko magazyn
- [x] Sekcja dostawy widoczna
- [x] Paczkomat ID wymagany
- [x] Standardowa walidacja działa

### Test 3: Mix
- [x] Sekcja dostawy widoczna
- [x] Paczkomat ID wymagany
- [x] Oba typy części prawidłowo obsłużone

## Pliki zmienione

- `pages/technician/magazyn/zamow.js` - walidacja i warunkowe renderowanie

## Data aktualizacji
2024-01-XX (wygenerowano automatycznie)
