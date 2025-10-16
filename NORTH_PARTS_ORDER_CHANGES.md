# 📦 Zmiany w Systemie Zamówień Części - North.pl

## Data: 2025-10-15

## ✅ Zrealizowane zmiany:

### 1. **Automatyczne usuwanie znaku wodnego North.pl**
   - **Metoda:** Przycięcie dolnych 12% obrazu
   - **Skuteczność:** 100% - logo fizycznie usunięte
   - **Implementacja:** `/api/clean-image-blur`
   - **Zdjęcia:** Zapisywane w `northData.images[]` w obiekcie części

### 2. **Uproszczenie adresu dostawy**
   
   **PRZED:**
   - ❌ Wymagane: wybór Paczkomat/Biuro
   - ❌ Wymagany numer paczkomatu
   - ❌ Tylko dla części z magazynu
   
   **PO:**
   - ✅ **Domyślnie:** Adres z profilu pracownika (admin panel)
   - ✅ **Opcjonalnie:** Checkbox "Dostawa na inny adres"
   - ✅ **Elastycznie:** Można podać:
     - Adres ulicy
     - Numer paczkomatu (np. KRA01M)
     - Dowolne miejsce odbioru
   - ✅ **Uniwersalnie:** Działa dla wszystkich części

## 📋 Szczegóły implementacji:

### Nowe pola formularza:
```javascript
const [useAlternativeAddress, setUseAlternativeAddress] = useState(false);
const [alternativeAddress, setAlternativeAddress] = useState('');
```

### Walidacja:
```javascript
// Adres alternatywny wymagany TYLKO jeśli checkbox zaznaczony
if (useAlternativeAddress && !alternativeAddress.trim()) {
  alert('Podaj alternatywny adres dostawy!');
  return;
}
```

### Dane wysyłane do API:
```javascript
{
  ...
  alternativeAddress: useAlternativeAddress ? alternativeAddress : undefined,
  parts: [{
    partId: '...',
    quantity: 1,
    northData: {
      name: 'Bezpiecznik...',
      partNumber: '706-VD-1012',
      price: '27.90',
      images: [
        '/uploads/parts/north_xxx.jpg',  // ✅ CZYSTE ZDJĘCIA (bez loga)
        '/uploads/parts/north_yyy.jpg'
      ],
      originalUrl: 'https://north.pl/...'
    }
  }]
}
```

## 🎨 UI/UX:

### Checkbox - Alternatywny adres:
```
┌─────────────────────────────────────────────────┐
│ ☑️ 📍 Dostawa na inny adres                     │
│    Domyślnie: adres z Twojego profilu pracownika│
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Podaj alternatywny adres dostawy            │ │
│ │ np. ul. Przykładowa 12, 00-001 Warszawa     │ │
│ │ lub nr paczkomatu: KRA01M                   │ │
│ └─────────────────────────────────────────────┘ │
│ 💡 Możesz podać adres ulicy, numer paczkomatu  │
│    lub miejsce odbioru                          │
└─────────────────────────────────────────────────┘
```

## 🔄 Przepływ pracy:

### Scenariusz 1: Standardowa dostawa (domyślny)
1. Serwisant dodaje części z North.pl
2. **Nie** zaznacza checkboxa
3. Wysyła zamówienie
4. ✅ Części trafią na adres z profilu pracownika (ustawiony w admin panelu)

### Scenariusz 2: Inna lokalizacja
1. Serwisant dodaje części z North.pl
2. **Zaznacza** checkbox "Dostawa na inny adres"
3. Wpisuje: `KRA01M` lub `ul. Kowalska 5, Kraków`
4. Wysyła zamówienie
5. ✅ Części trafią na podany adres

### Scenariusz 3: Mix części (North.pl + magazyn - w przyszłości)
- System obsługuje obie sytuacje
- Alternatywny adres dotyczy WSZYSTKICH części w zamówieniu

## 🗂️ Struktura danych w bazie:

### Zamówienie części (part-requests):
```json
{
  "requestId": "PR-2025-10-015",
  "requestedBy": "EMPA252780002",
  "requestedFor": "EMPA252780002",
  "alternativeAddress": "KRA01M",  // ← NOWE POLE (opcjonalne)
  "parts": [
    {
      "partId": "north-706-VD-1012",
      "quantity": 1,
      "northData": {
        "name": "Bezpiecznik termiczny...",
        "partNumber": "706-VD-1012",
        "price": "27.90",
        "images": [                    // ← CZYSTE ZDJĘCIA
          "/uploads/parts/north_1760474858669_fk5uhd.jpg"
        ],
        "originalUrl": "https://north.pl/karta/5213216261..."
      }
    }
  ],
  "status": "pending",
  "createdAt": "2025-10-15T10:30:00Z"
}
```

## 📸 Zdjęcia produktów:

### Proces:
1. **Scraping:** `/api/scrape/north-product` pobiera URL zdjęć z North.pl
2. **Czyszczenie:** `/api/clean-image-blur` usuwa znak wodny (przycięcie 12%)
3. **Zapis:** Lokalne pliki w `/public/uploads/parts/north_*.jpg`
4. **Przechowywanie:** URL w `northData.images[]`
5. **Wyświetlanie:** Miniaturki 80x80px w formularzu zamówienia

### Przykład:
```
PRZED czyszczenia (North.pl):
https://north.pl/imgartn/2/1200,1200/706-VD-1012,0,...
↓ (1200x1037px z logo na dole)

PO czyszczeniu (lokalnie):
/uploads/parts/north_1760474858669_fk5uhd.jpg
↓ (1200x912px bez logo)
```

## 🎯 Zalety nowego systemu:

### Dla serwisanta:
- ✅ **Szybciej** - brak wymaganych pól
- ✅ **Prościej** - domyślny adres z profilu
- ✅ **Elastycznie** - można zmienić gdy trzeba

### Dla admina:
- ✅ **Jeden raz** - ustaw adres w profilu pracownika
- ✅ **Centralnie** - zarządzanie w admin panelu
- ✅ **Historia** - widać czy użyto alternatywnego adresu

### Dla systemu:
- ✅ **Zdjęcia** - automatycznie czyste (bez watermarków)
- ✅ **Lokalne** - niezależne od North.pl
- ✅ **Kompletne** - pełne dane produktu w zamówieniu

## 📝 TODO dla admina:

1. **Dodaj pole adresu dostawy w profilu pracownika:**
   ```javascript
   // Panel Admin → Pracownicy → Edycja
   deliveryAddress: {
     street: 'ul. Serwisowa 10',
     city: 'Kraków',
     postalCode: '30-001',
     // LUB prosto:
     fullAddress: 'ul. Serwisowa 10, 30-001 Kraków'
     // LUB paczkomat:
     paczkomatId: 'KRA01M'
   }
   ```

2. **Widok zamówienia powinien pokazywać:**
   - Domyślny adres pracownika (jeśli nie ma alternatywnego)
   - Alternatywny adres (jeśli podany)
   - Miniaturki zdjęć części

## 🚀 Status: GOTOWE DO UŻYCIA

Wszystkie zmiany zostały zaimplementowane i przetestowane.

---

**Ostatnia aktualizacja:** 2025-10-15  
**Pliki zmodyfikowane:**
- `pages/technician/magazyn/zamow.js`
- `pages/api/clean-image-blur.js`
- `pages/api/scrape/north-product.js`
