# 📸 Test Skanowania Tabliczki Znamionowej

## Problem przed fixem:
- ❌ Zeskanowane modele znikały po odświeżeniu strony
- ❌ Przycisk "Skanuj tabliczkę" był tylko dla starych zamówień
- ❌ Brak zapisywania do bazy danych

## Rozwiązanie:
✅ Przycisk "Skanuj tabliczkę" zawsze widoczny w sekcji Urządzenia
✅ Ładowanie istniejących urządzeń przed otwarciem modala
✅ Automatyczne zapisanie do serwera po zamknięciu modala
✅ Przeładowanie zamówienia aby pobrać świeże dane

---

## 🧪 Scenariusze testowe:

### Test 1: Nowe zamówienie bez urządzeń
1. Otwórz zamówienie które NIE MA jeszcze urządzeń
2. Kliknij **"📷 Skanuj tabliczkę"** (fioletowy przycisk)
3. Zeskanuj tabliczkę znamionową
4. Kliknij **"Zapisz zmiany"** w modalu
5. ✅ **Powinno pokazać alert**: "✅ Zapisano 1 urządzeń z tabliczek znamionowych do zamówienia XXX!"
6. **Odśwież stronę (F5)**
7. ✅ **Powinno pokazać**: Urządzenie nadal widoczne w sekcji "Urządzenia"

---

### Test 2: Istniejące zamówienie z urządzeniami
1. Otwórz zamówienie które JUŻ MA urządzenia
2. Kliknij **"📷 Skanuj tabliczkę"**
3. ✅ **Powinno pokazać**: Istniejące urządzenia w liście
4. Dodaj kolejne urządzenie przez skanowanie
5. Kliknij **"Zapisz zmiany"**
6. ✅ **Powinno pokazać**: Alert z liczbą urządzeń (np. 2 urządzeń)
7. **Odśwież stronę (F5)**
8. ✅ **Powinno pokazać**: Wszystkie urządzenia (stare + nowe)

---

### Test 3: Edycja istniejącego urządzenia
1. Otwórz zamówienie z urządzeniem
2. Kliknij **"📷 Skanuj tabliczkę"**
3. Edytuj istniejące urządzenie (zmień model lub numer seryjny)
4. Kliknij **"Zapisz zmiany"**
5. ✅ **Powinno pokazać**: Zaktualizowane dane
6. **Odśwież stronę**
7. ✅ **Powinno pokazać**: Zmienione dane są zachowane

---

### Test 4: Usunięcie urządzenia
1. Otwórz zamówienie z 2+ urządzeniami
2. Kliknij **"📷 Skanuj tabliczkę"**
3. Usuń jedno z urządzeń
4. Kliknij **"Zapisz zmiany"**
5. ✅ **Powinno pokazać**: Alert z mniejszą liczbą urządzeń
6. **Odśwież stronę**
7. ✅ **Powinno pokazać**: Usunięte urządzenie zniknęło

---

### Test 5: Dodanie wielu urządzeń naraz
1. Otwórz zamówienie
2. Kliknij **"📷 Skanuj tabliczkę"**
3. Zeskanuj 3 tabliczki jedna po drugiej
4. Kliknij **"Zapisz zmiany"**
5. ✅ **Powinno pokazać**: "✅ Zapisano 3 urządzeń..."
6. **Odśwież stronę**
7. ✅ **Powinno pokazać**: Wszystkie 3 urządzenia w sekcji "Urządzenia"

---

## 🔍 Sprawdzenie w bazie danych

Po każdym teście, sprawdź plik:
```
data/orders.json
```

Znajdź swoje zamówienie i sprawdź pole `devices[]`:

```json
{
  "id": 1,
  "orderNumber": "ORDW...",
  "devices": [
    {
      "deviceIndex": 0,
      "deviceType": "Kuchenki",
      "brand": "Samsung",
      "model": "WW90K6414QW",
      "serialNumber": "769991583591",
      "notes": "Rozpoznane ze zdjęcia tabliczki...",
      "scannedAt": "2025-10-13T11:15:00.000Z"
    }
  ]
}
```

✅ Pole `devices[]` powinno zawierać wszystkie zeskanowane urządzenia
✅ Każde urządzenie powinno mieć: `brand`, `model`, `serialNumber`, `deviceType`
✅ Pole `scannedAt` powinno być obecne dla urządzeń ze skanera

---

## 🐛 Troubleshooting

### Problem: Alert pokazuje sukces, ale po odświeżeniu urządzenia znikają
**Rozwiązanie**: Sprawdź console.log w przeglądarce (F12):
- Szukaj: `💾 Zapisuję modele z tabliczek znamionowych:`
- Szukaj: `✅ Zapisano do serwera:`
- Szukaj błędów API (❌)

### Problem: Przycisk "Skanuj tabliczkę" nie jest widoczny
**Rozwiązanie**: 
- Sprawdź czy załadowałeś najnowszą wersję pliku `[id].js`
- Hard refresh: Ctrl+Shift+R lub Ctrl+F5

### Problem: Modal jest pusty mimo że zamówienie ma urządzenia
**Rozwiązanie**:
- Sprawdź console.log: `💾 Zapisuję modele z tabliczek znamionowych:`
- Sprawdź czy `order.devices` jest tablicą w `data/orders.json`

---

## 📊 Logi do monitorowania

W konsoli przeglądarki (F12 → Console) szukaj:

✅ **Przy otwarciu modala:**
```
💾 Zapisuję modele z tabliczek znamionowych: [{...}]
```

✅ **Przy zapisie:**
```
🔧 PUT Request body: {...}
✅ Order updated: 1
✅ Zapisano do serwera: {...}
```

✅ **Po zamknięciu modala:**
```
📞 API GET /api/orders
✅ Returning order: ORDW...
```

---

## ✅ Kryteria akceptacji

Test jest **ZDANY** gdy:
1. ✅ Przycisk "Skanuj tabliczkę" jest widoczny dla KAŻDEGO zamówienia
2. ✅ Zeskanowane urządzenia są widoczne w liście
3. ✅ Po kliknięciu "Zapisz zmiany" pokazuje się alert sukcesu
4. ✅ Po odświeżeniu strony (F5) urządzenia nadal są widoczne
5. ✅ W pliku `data/orders.json` pole `devices[]` zawiera zapisane dane
6. ✅ Można edytować, usuwać i dodawać kolejne urządzenia

---

## 🚀 Następne kroki (opcjonalne)

Po pozytywnym teście można dodać:
- 📸 Podgląd miniatur zdjęć tabliczek w liście urządzeń
- 🔍 Wyszukiwanie części zamiennych dla zeskanowanych modeli
- 📋 Automatyczne generowanie listy części do zamówienia
- 🤖 AI sugestie problemów na podstawie modelu urządzenia
