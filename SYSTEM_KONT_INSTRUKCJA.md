# 🎯 SYSTEM ZUNIFIKOWANEGO KONTA - INSTRUKCJA TESTOWANIA

## 📋 Przegląd Systemu

System automatycznie wykrywa rolę użytkownika i przekierowuje do odpowiedniego panelu:

- **👨‍💼 ADMINISTRATOR** → `/admin` - Panel zarządzania systemu
- **🔧 PRACOWNIK** → `/pracownik-panel` - Panel serwisanta  
- **👤 KLIENT** → `/moje-zamowienie` - Panel śledzenia zamówień
- **🏠 GOŚĆ** → `/logowanie` - Strona logowania

## 🧪 Jak Testować System

### 1. **Uruchom Aplikację**
```bash
npm run dev
```
Przejdź do: `http://localhost:3000`

### 2. **Panel Testowania (Development)**
W prawym dolnym rogu znajdziesz żółty panel testowania z przyciskami:

- **👨‍💼 Symuluj Admina** - loguje jako administrator
- **🔧 Symuluj Pracownika** - loguje jako pracownik serwisu
- **👤 Symuluj Klienta** - loguje jako zwykły klient
- **🌐 Symuluj Google Client** - loguje jako klient Google
- **🧹 Wyczyść wszystkie sesje** - wylogowuje ze wszystkich kont
- **🔄 Odśwież rolę** - aktualizuje wykrytą rolę

### 3. **Scenariusze Testowe**

#### A) **Test Administratora**
1. Kliknij "Symuluj Admina"
2. Sprawdź przycisk w prawym górnym rogu - powinien pokazać "👨‍💼 Administrator"
3. Kliknij na przycisk → przekierowanie do `/admin`
4. Sprawdź dropdown menu - powinien mieć opcje admin, harmonogram, zgłoszenia

#### B) **Test Pracownika**
1. Kliknij "Symuluj Pracownika" 
2. Przycisk powinien pokazać "🔧 Jan Serwisant"
3. Kliknij → przekierowanie do `/pracownik-panel`
4. Sprawdź dropdown - opcje: panel pracownika, kalendarz

#### C) **Test Klienta**
1. Kliknij "Symuluj Klienta"
2. Przycisk powinien pokazać "👤 Anna Kowalska"
3. Kliknij → przekierowanie do `/moje-zamowienie`

#### D) **Test Google Client**
1. Kliknij "Symuluj Google Client"
2. Przycisk powinien pokazać "👤 Piotr Testowy"
3. Kliknij → przekierowanie do `/moje-zamowienie`

#### E) **Test Gościa**
1. Kliknij "Wyczyść wszystkie sesje"
2. Przycisk powinien pokazać "Logowanie"
3. Kliknij → przekierowanie do `/logowanie`

### 4. **Test Rzeczywistego Logowania**

#### **Administrator:**
1. Przejdź do `/admin`
2. Wprowadź hasło: `admin123`
3. Po zalogowaniu wróć na stronę główną - przycisk powinien automatycznie wykryć administratora

#### **Pracownik:**
1. Przejdź do `/pracownik-logowanie`
2. Zaloguj się jako pracownik
3. Wróć na stronę główną - przycisk powinien wykryć pracownika

#### **Klient:**
1. Przejdź do `/logowanie`
2. Zaloguj się przez Google
3. Wróć na stronę główną - przycisk powinien wykryć klienta

## 🔍 Weryfikacja Poprawności

### **Sprawdź czy:**
- ✅ Przycisk zmienia się dynamicznie w zależności od roli
- ✅ Ikony i kolory są odpowiednie dla każdej roli
- ✅ Przekierowania działają poprawnie
- ✅ Dropdown menu ma właściwe opcje dla każdej roli
- ✅ Wylogowanie czyści sesję i resetuje przycisk
- ✅ System działa po odświeżeniu strony

### **Lokalizacje Plików:**
- `utils/roleDetector.js` - logika wykrywania ról
- `components/AccountButton.js` - zunifikowany przycisk
- `components/RoleTester.js` - panel testowania
- `pages/admin.js` - panel administratora
- `pages/pracownik-panel.js` - panel pracownika
- `pages/moje-zamowienie.js` - panel klienta

## 🚨 Rozwiązywanie Problemów

### **Problem: Przycisk nie aktualizuje się**
- Odśwież stronę lub kliknij "🔄 Odśwież rolę"

### **Problem: Nieprawidłowe wykrywanie roli**
- Sprawdź localStorage/sessionStorage w Developer Tools
- Wyczyść wszystkie sesje i spróbuj ponownie

### **Problem: Przekierowanie nie działa**
- Sprawdź console na błędy
- Upewnij się, że strona docelowa istnieje

## ✅ Checklist Przed Wdrożeniem

- [ ] Wszystkie role są prawidłowo wykrywane
- [ ] Przekierowania działają dla wszystkich ról
- [ ] Wylogowanie czyści wszystkie dane
- [ ] System jest responsywny na mobile
- [ ] Panel testowania jest ukryty w produkcji
- [ ] Nie ma błędów w console
- [ ] Działa po odświeżeniu strony