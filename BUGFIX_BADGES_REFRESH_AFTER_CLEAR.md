# Naprawa odświeżania badge'ów po wyczyszczeniu danych

## 🐛 Problem
Po wyczyszczeniu danych w panelu "Zarządzanie danymi" (np. zamówień części z magazynu), badge'e z liczbą powiadomień na przyciskach w menu (Magazyn, Logistyka) nadal pokazywały stare wartości.

## 🔍 Przyczyna
Badge'e są pobierane z API przy montowaniu komponentu `AdminLayout` i odświeżane co 30 sekund. Po wyczyszczeniu danych w ustawieniach, strona nie wywołuje funkcji odświeżającej badge'e.

## ✅ Rozwiązanie

### 1. Wykorzystano istniejącą funkcję `refreshBadges`
W `AdminLayout.js` już istnieje funkcja `refreshBadges()`, która:
- Jest eksportowana globalnie jako `window.refreshAdminBadges`
- Pobiera aktualne dane z API
- Aktualizuje wszystkie badge'e

### 2. Dodano wywołanie po wyczyszczeniu danych
W `pages/admin/ustawienia/dane.js` (linia ~137):

```javascript
if (response.ok) {
  toast.success(`✅ ${data.message}`);
  setShowConfirmModal(false);
  setConfirmPassword('');
  
  // 🔄 Odśwież badge'e w menu po wyczyszczeniu danych
  if (typeof window !== 'undefined' && window.refreshAdminBadges) {
    console.log('🔄 Refreshing admin badges after data clear...');
    setTimeout(() => {
      window.refreshAdminBadges();
    }, 500); // Małe opóźnienie aby API zdążyło zapisać zmiany
  }
}
```

### 3. Jak to działa

**Krok po kroku:**
1. Użytkownik wycza dane (np. zamówienia części z magazynu)
2. API usuwa dane z `part-requests.json`
3. Strona ustawień otrzymuje sukces
4. Po 500ms wywoływana jest funkcja `window.refreshAdminBadges()`
5. Funkcja pobiera świeże dane z API:
   - `/api/rezerwacje` → aktualizuje badge rezerwacji
   - `/api/orders` → aktualizuje badge zleceń
   - `/api/part-requests?status=pending` → aktualizuje badge magazynu
6. Badge'e są aktualizowane z nowymi wartościami (prawdopodobnie 0)

## 📊 Badge'e które są odświeżane

### 🎯 Rezerwacje
- **Źródło:** `/api/rezerwacje`
- **Warunek:** `status === 'pending' && !orderId && !convertedToOrder`
- **Kolor:** niebieski (info) gdy > 0

### 📦 Zlecenia
- **Źródło:** `/api/orders`
- **Warunek:** `!reservationId && status !== 'completed' && status !== 'cancelled'`
- **Kolor:** niebieski (info) gdy > 0

### 🏭 Magazyn
- **Źródło:** `/api/part-requests?status=pending`
- **Warunek:** wszystkie z status=pending
- **Kolor:** **czerwony (error)** gdy > 0 - najwyższy priorytet!

### 🚚 Logistyka
- **Źródło:** notyfikacje
- **Warunek:** notyfikacje z linkiem `/admin/logistyk`
- **Kolor:** zależny od typu notyfikacji

## 🧪 Testowanie

### Test 1: Czyszczenie zamówień części
1. Przejdź do Magazyn → Zamówienia
2. Zapamiętaj liczbę na badge (np. 19)
3. Przejdź do Ustawienia → Baza danych
4. Wyczyść "Zamówienia części z magazynu"
5. ✅ Badge na "Magazyn" powinien pokazać 0

### Test 2: Czyszczenie rezerwacji
1. Zapamiętaj badge na "Rezerwacje"
2. Wyczyść "Rezerwacje wizyt"
3. ✅ Badge powinien pokazać 0

### Test 3: Czyszczenie zleceń
1. Zapamiętaj badge na "Zamówienia"
2. Wyczyść "Zamówienia i wizyty"
3. ✅ Badge powinien pokazać 0

## 🔄 Automatyczne odświeżanie

Badge'e są automatycznie odświeżane:
- ✅ Co 30 sekund (timer w `AdminLayout`)
- ✅ Po wyczyszczeniu danych
- ✅ Po zalogowaniu (podczas montowania komponentu)

## 📝 Pliki zmodyfikowane

```
pages/admin/ustawienia/dane.js
  - Dodano wywołanie window.refreshAdminBadges() po sukcesie (linia ~137)
```

## 💡 Dodatkowe usprawnienia (opcjonalne)

### 1. Uniwersalna funkcja odświeżania
Można dodać w innych miejscach:
- Po zaakceptowaniu zamówienia części
- Po konwersji rezerwacji na zlecenie
- Po zakończeniu wizyty

### 2. Real-time odświeżanie
W przyszłości można dodać WebSocket dla real-time aktualizacji:
```javascript
// Przykład z WebSocket
socket.on('data-changed', (category) => {
  window.refreshAdminBadges();
});
```

## ✅ Status
**NAPRAWIONE** - Badge'e odświeżają się automatycznie po wyczyszczeniu danych.

---

**Data:** 15 października 2025  
**Fix:** Wywołanie `window.refreshAdminBadges()` po operacji czyszczenia
