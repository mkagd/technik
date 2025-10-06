# System Badge'ów Notyfikacji - Dokumentacja

## 📊 Przegląd systemu

System rozróżnia notyfikacje na podstawie **linku** w notyfikacji i przypisuje je do odpowiednich przycisków w menu.

## 🎯 Kategorie Badge'ów

### 1. **Dzwonek (🔔) - notificationCount**
- **Pokazuje:** WSZYSTKIE nieprzeczytane notyfikacje
- **Lokalizacja:** Ikona dzwonka w headerze (góra strony)
- **Źródło danych:** `/api/notifications?read=false`

### 2. **Zgłoszenia - reservationsCount**
- **Pokazuje:** Notyfikacje o rezerwacjach
- **Filtr:** `link.startsWith('/admin/rezerwacje')`
- **Przykłady linków:**
  - `/admin/rezerwacje`
  - `/admin/rezerwacje?id=XXX`

### 3. **Zlecenia - ordersCount**
- **Pokazuje:** Notyfikacje o zleceniach serwisowych
- **Filtr:** `link.startsWith('/admin/zamowienia')`
- **Przykłady linków:**
  - `/admin/zamowienia`
  - `/admin/zamowienia?id=ORDS252780001`

### 4. **Magazyn - magazynCount**
- **Pokazuje:** Notyfikacje o zamówieniach części
- **Filtr:** `link.startsWith('/admin/magazyn')`
- **Przykłady linków:**
  - `/admin/magazyn/zamowienia`
  - `/admin/magazyn/zamowienia?id=ZC-2510051412-001`

### 5. **Logistyka - logistykaCount**
- **Pokazuje:** Notyfikacje dla działu logistyki
- **Filtr:** `link.startsWith('/admin/logistyk')`
- **Przykłady linków:**
  - `/admin/logistyk/zamowienia`
  - `/admin/logistyk/zamowienia?id=ZC-2510051412-001`

## 🔄 Jak to działa

### Algorytm kategoryzacji (AdminLayout.js):

```javascript
const notifRes = await fetch('/api/notifications?read=false');
if (notifRes.ok) {
  const data = await notifRes.json();
  
  // Kategoryzacja na podstawie linku
  const total = data.length;
  const reservations = data.filter(n => n.link && n.link.startsWith('/admin/rezerwacje')).length;
  const orders = data.filter(n => n.link && n.link.startsWith('/admin/zamowienia')).length;
  const magazyn = data.filter(n => n.link && n.link.startsWith('/admin/magazyn')).length;
  const logistyka = data.filter(n => n.link && n.link.startsWith('/admin/logistyk')).length;
  
  // Ustawienie stanów
  setNotificationCount(total);
  setReservationsCount(reservations);
  setOrdersCount(orders);
  setMagazynCount(magazyn);
  setLogistykaCount(logistyka);
}
```

## 📝 Przykłady Notyfikacji

### Rezerwacja (Zgłoszenie):
```json
{
  "id": 1759642076885,
  "title": "Nowa rezerwacja",
  "message": "Mariusz Bielaszka zgłosił rezerwację: Pralka",
  "type": "info",
  "link": "/admin/rezerwacje",
  "userId": null,
  "read": false
}
```
➡️ **Badge:** Zgłoszenia +1

### Zlecenie Serwisowe:
```json
{
  "id": 1759642077191,
  "title": "Nowe zamówienie",
  "message": "Utworzono zamówienie ORDS252780006 - Pralka",
  "type": "success",
  "link": "/admin/zamowienia",
  "userId": null,
  "read": false
}
```
➡️ **Badge:** Zlecenia +1

### Zamówienie Części (Magazyn):
```json
{
  "id": 1759697383682,
  "title": "🔔 Nowe zamówienie części",
  "message": "Mariusz Bielaszka zamówił 1 części",
  "type": "info",
  "link": "/admin/magazyn/zamowienia",
  "userId": null,
  "read": false
}
```
➡️ **Badge:** Magazyn +1

### Zamówienie Części (Logistyka):
```json
{
  "id": 1759697383680,
  "title": " Nowe zamówienie części",
  "message": "Mariusz Bielaszka zamówił 1 części",
  "type": "info",
  "link": "/admin/logistyk/zamowienia?id=ZC-2510052249-007",
  "userId": null,
  "read": false
}
```
➡️ **Badge:** Logistyka +1

## 🔧 Implementacja w Kodzie

### Stan komponentu:
```javascript
const [notificationCount, setNotificationCount] = useState(0); // Dzwonek - WSZYSTKIE
const [reservationsCount, setReservationsCount] = useState(0); // Zgłoszenia
const [ordersCount, setOrdersCount] = useState(0); // Zlecenia
const [magazynCount, setMagazynCount] = useState(0); // Magazyn
const [logistykaCount, setLogistykaCount] = useState(0); // Logistyka
```

### NavItems z badge'ami:
```javascript
{ 
  icon: FiFileText, 
  label: 'Zgłoszenia', 
  badge: reservationsCount,  // ← Tylko rezerwacje
},
{ 
  icon: FiTool, 
  label: 'Zlecenia', 
  badge: ordersCount,  // ← Tylko zlecenia
},
{ 
  icon: FiPackage, 
  label: 'Magazyn', 
  badge: magazynCount,  // ← Tylko magazyn
},
{ 
  icon: FiTool, 
  label: 'Logistyka', 
  badge: logistykaCount,  // ← Tylko logistyka
}
```

## ⚡ Odświeżanie

- **Częstotliwość:** Co 30 sekund
- **Metoda:** `setInterval` w `useEffect`
- **Endpoint:** `/api/notifications?read=false`

## 🎨 Wyświetlanie Badge'a

Badge pojawia się jako czerwony kółko z liczbą na przycisku menu:

```jsx
{item.badge > 0 && (
  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
    {item.badge}
  </span>
)}
```

## 📊 Matematyka

**Suma wszystkich badge'ów = notificationCount (dzwonek)**

```
notificationCount = reservationsCount + ordersCount + magazynCount + logistykaCount + (inne)
```

## ✅ Zalety tego rozwiązania

1. ✅ **Precyzyjne** - każdy badge pokazuje tylko swoje notyfikacje
2. ✅ **Skalowalne** - łatwo dodać nowe kategorie
3. ✅ **Wydajne** - jeden fetch, wiele filtrów
4. ✅ **Intuicyjne** - użytkownik widzi gdzie są nowe informacje
5. ✅ **Konsekwentne** - bazuje na linkach w notyfikacjach

## 🐛 Możliwe Problemy

### Problem: Badge pokazuje złą liczbę
**Rozwiązanie:** Sprawdź czy link w notyfikacji jest poprawny i zaczyna się od właściwego prefixu

### Problem: Badge nie znika po przeczytaniu
**Rozwiązanie:** Upewnij się, że endpoint `/api/notifications PUT` ustawia `read: true`

### Problem: Notyfikacje nie należą do żadnej kategorii
**Rozwiązanie:** Sprawdź czy link zaczyna się od któregoś z prefiksów: `/admin/rezerwacje`, `/admin/zamowienia`, `/admin/magazyn`, `/admin/logistyk`

## 📅 Historia Zmian

- **2025-10-05:** Wprowadzono system kategoryzacji badge'ów na podstawie linków
- **Przed:** Wszystkie badge'y pokazywały `notificationCount` (suma)
- **Po:** Każdy badge pokazuje tylko swoje notyfikacje

---

**Autor:** System Technik  
**Ostatnia aktualizacja:** 2025-10-05
