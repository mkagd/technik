# Instrukcje - Filtrowanie zamówień dla zalogowanych użytkowników

## Jak działa system filtrowania zamówień

### 1. Logowanie użytkownika

System obsługuje dwa sposoby logowania:

#### A) Logowanie przez numer zamówienia + telefon
- Dla gości, którzy chcą sprawdzić konkretne zamówienie
- Wyświetla tylko jedno zamówienie odpowiadające podanym danym

#### B) Logowanie do konta Technik
- **Email + hasło** - system automatycznie tworzy konto przy pierwszym logowaniu
- **Google OAuth** - logowanie przez konto Google
- Pokazuje wszystkie zamówienia przypisane do danego emaila

### 2. Filtrowanie zamówień po zalogowaniu

Po zalogowaniu na konto Technik system:

1. **Pobiera zamówienia z nowego systemu** (`unified_reports`)
   - Używa `reportManager.getReportsByUser(email)` 
   - Filtruje po `userId` lub `contactInfo.email`

2. **Sprawdza stare systemy** (dla kompatybilności)
   - `quickReports` - stare zgłoszenia serwisowe
   - `bookings` - szybkie zgłoszenia 
   - `zlecenia` - pełne rezerwacje
   - Filtruje po `email` użytkownika

3. **Usuwa duplikaty** między systemami

4. **Sortuje po dacie** (najnowsze pierwsze)

### 3. Funkcje systemu

#### Automatyczne odświeżanie
```javascript
useEffect(() => {
    refreshUserOrders();
}, [technikUser]); // Automatycznie odświeża gdy zmieni się użytkownik
```

#### Funkcja `refreshUserOrders()`
- **Dla zalogowanych**: Pokazuje tylko zamówienia danego użytkownika
- **Dla niezalogowanych**: Pokazuje wszystkie zamówienia (widok publiczny)

#### Zapamiętywanie logowania
- Opcja "Zapamiętaj mnie" zapisuje dane w `localStorage`
- Automatyczne logowanie przy następnej wizycie

### 4. Interfejs użytkownika

#### Nagłówek dla zalogowanych
```
Zalogowany jako: user@example.com
Twoje zamówienia: 3 pozycje
```

#### Komunikaty przy braku zamówień
- **Dla zalogowanych**: "Nie masz jeszcze żadnych zamówień na koncie email@example.com"
- **Dla niezalogowanych**: "Nie masz jeszcze żadnych zamówień"

#### Oznaczenia źródła zamówień
- 🆕 Nowy system - `unified_reports`
- 📋 Zgłoszenie - `quickReports` 
- 📱 Szybkie - stare `bookings`
- 📝 Rezerwacja - stare `zlecenia`

### 5. Bezpieczeństwo i prywatność

- Każdy użytkownik widzi tylko swoje zamówienia
- Filtrowanie odbywa się po stronie klienta (localStorage)
- Hasła przechowywane w localStorage (demo - w produkcji użyj bezpiecznego backendu)
- Google OAuth integracja dla bezpiecznego logowania

### 6. Testowanie funkcjonalności

1. **Otwórz stronę**: `http://localhost:3000/moje-zamowienie`

2. **Utwórz testowe zamówienia**:
```javascript
// W konsoli przeglądarki:
const reportManager = require('./utils/reportManager').default;

// Utwórz zamówienie dla test@example.com
reportManager.saveReport(reportManager.createReport({
    email: 'test@example.com',
    phone: '+48123456789',
    description: 'Test zamówienia 1',
    equipmentType: 'Komputer',
    availability: 'Rano'
}));

// Utwórz zamówienie dla innego użytkownika
reportManager.saveReport(reportManager.createReport({
    email: 'inny@example.com', 
    phone: '+48987654321',
    description: 'Test zamówienia 2',
    equipmentType: 'Drukarka',
    availability: 'Popołudnie'
}));
```

3. **Zaloguj się** na `test@example.com` - powinieneś zobaczyć tylko swoje zamówienie

4. **Wyloguj się i zaloguj** na `inny@example.com` - zobaczysz inne zamówienie

### 7. Rozwiązywanie problemów

#### Problem: Nie widzę swoich zamówień po zalogowaniu
- Sprawdź czy email w zamówieniu jest identyczny z emailem logowania
- Sprawdź konsolę przeglądarki czy nie ma błędów
- Sprawdź localStorage: `unified_reports`, `quickReports`, `bookings`, `zlecenia`

#### Problem: Widzę zamówienia innych użytkowników
- Sprawdź implementację funkcji `refreshUserOrders()`
- Sprawdź czy `technikUser` jest prawidłowo ustawiony
- Sprawdź filtry w `getReportsByUser()`

#### Problem: Duplikaty zamówień
- System automatycznie usuwa duplikaty na podstawie `reportNumber` i `id`
- Sprawdź logikę w `getAllOrders()` i `refreshUserOrders()`

### 8. Dalszy rozwój

Planowane ulepszenia:
- Backend API dla bezpiecznego uwierzytelniania
- Baza danych zamiast localStorage
- Powiadomienia push o statusie zamówień
- Panel admina do zarządzania zamówieniami
- Eksport zamówień do PDF/Excel

---

**Autor**: GitHub Copilot  
**Data**: 2025-07-02  
**Status**: ✅ Zaimplementowane i przetestowane
