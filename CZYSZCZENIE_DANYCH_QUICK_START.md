# 🗑️ Czyszczenie danych - Szybki start

## Jak wyczyścić dane?

### Krok 1: Przejdź do ustawień
```
Panel Admin → Ustawienia → Baza danych
```

Lub otwórz bezpośrednio:
```
http://localhost:3000/admin/ustawienia/dane
```

### Krok 2: Wybierz kategorię
Kliknij "Wyczyść dane" przy wybranej kategorii:

**Przykłady:**
- 🛒 **Zamówienia części** - jeśli chcesz wyczyścić zamówienia magazynowe
- 📦 **Cały magazyn** - jeśli chcesz zresetować wszystko związane z magazynem
- 🔥 **WSZYSTKIE DANE** - reset całego systemu (zachowuje pracowników)

### Krok 3: Potwierdź operację
1. Pojawi się okno potwierdzenia
2. Wprowadź hasło: **`CLEAR_DATA_2025`**
3. Kliknij **"Usuń dane"**

### Krok 4: Gotowe! ✅
System wyświetli komunikat o sukcesie.

---

## 🎯 Najczęstsze scenariusze

### Scenariusz 1: Czyścisz zamówienia testowe
```
Kategoria: "Zamówienia i wizyty"
Hasło: CLEAR_DATA_2025
Rezultat: Wszystkie zlecenia i wizyty usunięte
```

### Scenariusz 2: Resetujesz magazyn
```
Kategoria: "🏭 Cały magazyn"
Hasło: CLEAR_DATA_2025
Rezultat: Zamówienia części + stany + katalog wyczyszczone
```

### Scenariusz 3: Chcesz zacząć od zera
```
Kategoria: "⚠️ WSZYSTKIE DANE"
Hasło: CLEAR_DATA_2025
⚠️ UWAGA: To usuwa prawie wszystko!
Zachowane: Pracownicy, ustawienia
```

---

## ⚠️ WAŻNE!

### Przed czyszczeniem:
- ✅ Zrób backup danych
- ✅ Upewnij się, co chcesz usunąć
- ✅ Poinformuj zespół

### Po czyszczeniu:
- ❌ **Nie można cofnąć operacji!**
- ❌ **Dane są trwale usunięte!**

---

## 🔒 Bezpieczeństwo

**Hasło:** `CLEAR_DATA_2025`

⚠️ Nie udostępniaj hasła osobom nieuprawnionym!

---

## 💡 Wskazówki

1. **Testuj lokalnie**: Najpierw przetestuj na danych testowych
2. **Backup**: Zawsze rób backup przed czyszczeniem
3. **Krok po kroku**: Nie czyść wszystkiego naraz - idź po kolei
4. **Dokumentuj**: Zapisz, co i kiedy czyścisz

---

## 📞 Pomoc

Masz problem? Zobacz pełną dokumentację: `DATA_MANAGEMENT_DOCS.md`
