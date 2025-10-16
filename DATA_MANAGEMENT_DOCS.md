# Zarządzanie danymi - Dokumentacja

## 📋 Przegląd

Dodano kompletny system zarządzania danymi w panelu administracyjnym, umożliwiający czyszczenie różnych kategorii danych z systemu.

## 🎯 Lokalizacja

**Panel Admin → Ustawienia → Baza danych**

Lub bezpośrednio: `/admin/ustawienia/dane`

## 🗑️ Dostępne kategorie czyszczenia

### 1. **Zamówienia i wizyty**
- Usuwa wszystkie zamówienia serwisowe wraz z wizytami
- Poziom ryzyka: **WYSOKI**
- Dane: `data/orders.json`

### 2. **Zamówienia części z magazynu**
- Usuwa zamówienia części składane przez techników
- Poziom ryzyka: **ŚREDNI**
- Dane: `data/part-requests.json`

### 3. **Stany magazynowe techników**
- Zeruje osobiste magazyny wszystkich techników
- Poziom ryzyka: **ŚREDNI**
- Dane: `data/personal-inventories.json`

### 4. **Katalog części magazynu głównego**
- Usuwa katalog części (nie wpływa na stany)
- Poziom ryzyka: **NISKI**
- Dane: `data/parts-inventory.json`

### 5. **Rezerwacje wizyt**
- Usuwa wszystkie rezerwacje (pending, contacted)
- Poziom ryzyka: **ŚREDNI**
- Dane: `data/reservations.json`

### 6. **Baza klientów**
- Usuwa wszystkich klientów
- Poziom ryzyka: **WYSOKI**
- Dane: `data/clients.json`

### 7. **Logi audytowe**
- Usuwa historię zmian i logi
- Poziom ryzyka: **NISKI**
- Dane: `data/audit-logs.json`

### 8. **🏭 Cały magazyn**
- Kombinacja: zamówienia części + stany magazynowe + katalog
- Poziom ryzyka: **WYSOKI**

### 9. **⚠️ WSZYSTKIE DANE**
- Usuwa WSZYSTKO poza pracownikami i ustawieniami
- Poziom ryzyka: **KRYTYCZNY**
- **NIEBEZPIECZNE - używaj ostrożnie!**

## 🔐 Zabezpieczenia

### Hasło potwierdzenia
Wszystkie operacje wymagają hasła: **`CLEAR_DATA_2025`**

### Ostrzeżenia
- 🚨 Operacje są **nieodwracalne**
- ⚠️ Usunięte dane **nie mogą być przywrócone**
- 💾 Zaleca się backup przed czyszczeniem

## 🛠️ Implementacja

### API Endpoint
**POST** `/api/admin/clear-data`

```javascript
{
  "category": "orders",           // ID kategorii
  "confirmPassword": "CLEAR_DATA_2025"  // Hasło
}
```

**Odpowiedź sukcesu:**
```javascript
{
  "success": true,
  "cleared": ["Zamówienia"],
  "message": "✅ Pomyślnie wyczyszczono: Zamówienia",
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

**Odpowiedź błędu:**
```javascript
{
  "success": false,
  "cleared": [],
  "errors": ["Zamówienia"],
  "message": "Błąd czyszczenia"
}
```

### Struktura plików

```
pages/
├── api/
│   └── admin/
│       └── clear-data.js          # API endpoint
└── admin/
    └── ustawienia/
        ├── index.js                # Menu ustawień (dodano link)
        └── dane.js                 # Strona zarządzania danymi
```

## 🎨 UI/UX

### Kodowanie kolorami
- 🔴 **Czerwony**: Krytyczne / Wysokie ryzyko
- 🟠 **Pomarańczowy**: Średnie ryzyko
- 🟡 **Żółty**: Niskie ryzyko
- 🔵 **Niebieski**: Bezpieczne operacje

### Modal potwierdzenia
- Wymaga wprowadzenia hasła
- Pokazuje szczegóły operacji
- Ostrzeżenie o nieodwracalności
- Przycisk "Usuń" aktywny tylko z hasłem

## 📊 Przykłady użycia

### Czyszczenie zamówień testowych
```
1. Wejdź w Ustawienia → Baza danych
2. Wybierz "Zamówienia i wizyty"
3. Wprowadź hasło: CLEAR_DATA_2025
4. Kliknij "Usuń dane"
```

### Resetowanie magazynu przed testami
```
1. Wybierz "🏭 Cały magazyn"
2. Potwierdź hasłem
3. Wszystkie dane magazynowe zostaną wyczyszczone
```

### Kompletny reset systemu
```
⚠️ UWAGA: Użyj tylko w środowisku deweloperskim!

1. Wybierz "⚠️ WSZYSTKIE DANE"
2. Przeczytaj ostrzeżenia
3. Potwierdź hasłem CLEAR_DATA_2025
4. Dane pracowników i ustawienia pozostaną nienaruszone
```

## 🔮 Przyszłe rozszerzenia

### Planowane funkcje
- [ ] Eksport danych do JSON
- [ ] Eksport zamówień do CSV
- [ ] Harmonogramy automatycznego czyszczenia
- [ ] Kopie zapasowe przed czyszczeniem
- [ ] Historia operacji czyszczenia
- [ ] Selektywne czyszczenie (np. starsze niż 6 miesięcy)
- [ ] Archiwizacja zamiast usuwania

### Potencjalne ulepszenia
- Integracja z systemem backupów
- Logi czyszczenia w audit logs
- Email powiadomienia po czyszczeniu
- Rolowanie hasła potwierdzenia
- Dwuetapowe potwierdzenie (2FA)

## ⚠️ Uwagi bezpieczeństwa

1. **Hasło w kodzie**: Obecnie hasło jest hardcoded. W produkcji:
   - Użyj zmiennej środowiskowej
   - Implementuj sesje administratora
   - Dodaj rate limiting

2. **Backup**: Zawsze rób backup przed czyszczeniem produkcyjnych danych

3. **Testy**: Przetestuj na środowisku deweloperskim przed użyciem w produkcji

4. **Logi**: Rozważ logowanie wszystkich operacji czyszczenia

## 📝 Changelog

**2025-10-15**
- ✅ Utworzono API endpoint `/api/admin/clear-data`
- ✅ Dodano stronę zarządzania danymi
- ✅ Zintegrowano z menu ustawień
- ✅ Dodano 9 kategorii czyszczenia
- ✅ Implementowano zabezpieczenia hasłem
- ✅ Utworzono dokumentację

## 🎓 Szkolenie zespołu

Przed udostępnieniem zespołowi:
1. Przeszkolić adminy z używania systemu
2. Wyjaśnić nieodwracalność operacji
3. Ustalić politykę backupów
4. Określić, kto ma dostęp do hasła

---

**Autor**: System AI  
**Data**: 15 października 2025  
**Status**: ✅ Gotowe do użycia
