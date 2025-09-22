# 🗺️ Ulepszone wyszukiwanie adresów - Dokumentacja

## 📝 Opis zmian

Ulepszono system wyszukiwania adresów w formularzu "Szybkie zgłoszenie", aby był bardziej przyjazny dla polskich użytkowników i priorytetowo pokazywał lokalne adresy.

## ✨ Nowe funkcjonalności

### 🎯 Inteligentne wyszukiwanie
- **Lokalne rezultaty**: Priorytet dla adresów z Polski, szczególnie województwa małopolskiego
- **Normalizacja polskich znaków**: Automatyczna konwersja ą, ć, ę, ł, ń, ó, ś, ź, ż
- **Skrócony próg wyszukiwania**: Wyniki pojawiają się już po wpisaniu 2 znaków
- **Filtrowanie zagranicznych adresów**: Wyświetlane są tylko polskie lokalizacje

### 🏠 Lepsze formatowanie adresów
- **Intuicyjny format**: Ulica + numer domu, miasto, kod pocztowy
- **Automatyczne uzupełnianie**: Wybór adresu automatycznie dodaje brakujące informacje
- **Czytelne wyświetlanie**: Ikony, kolory i lepszy podział informacji

### 💡 Pomoc dla użytkownika
- **Przyjazny placeholder**: "np. Dębica, ul. Krakowska 15 lub wpisz miasto..."
- **Wskazówki**: Podpowiedzi jak prawidłowo wpisywać adresy
- **Komunikaty o braku wyników**: Informacja gdy nie znaleziono adresów

## 🛠️ Szczegóły techniczne

### Algorytm wyszukiwania
```javascript
// 1. Normalizacja polskich znaków
const normalizedQuery = query.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c')
    // ... inne polskie znaki

// 2. Zapytania z priorytetem
searchQueries = [
    // Priorytet: województwo małopolskie
    `${query}&countrycodes=pl&viewbox=19.0,49.0,22.0,51.0&bounded=1`,
    // Backup: cała Polska
    `${query}&countrycodes=pl`
]

// 3. Filtrowanie tylko polskich adresów
.filter(item => item.address?.country_code === 'pl')
```

### Formatowanie wyników
- **Adres główny**: Ulica + numer lub nazwa miasta
- **Informacje dodatkowe**: Miasto, kod pocztowy, powiat
- **Ikony**: 📍 dla lokalizacji, 🗺️ dla adresów

### Walidacja i UX
- **Automatyczne usuwanie błędów** po wyborze adresu
- **Wskaźnik ładowania** podczas wyszukiwania
- **Responsive design** na urządzeniach mobilnych

## 🎮 Instrukcja użytkowania

### Dla użytkowników
1. **Wpisz miasto**: np. "Dębica"
2. **Lub wpisz ulicę**: np. "Krakowska"
3. **Lub pełny adres**: np. "Krakowska 15, Dębica"
4. **Wybierz z listy**: Kliknij na odpowiedni adres

### Przykłady wyszukiwania
- ✅ "Dębica" → pokaże miasto i ulice w Dębicy
- ✅ "Krakowska" → pokaże ulice Krakowskie w okolicy
- ✅ "Rzeszów Centrum" → pokaże centrum Rzeszowa
- ✅ "Tarnów 33-100" → pokaże adresy z tym kodem pocztowym

## 🚀 Korzyści

### Dla użytkowników
- **Szybsze wyszukiwanie**: Wyniki już po 2 znakach
- **Lokalne rezultaty**: Brak zagranicznych adresów
- **Intuicyjność**: Czytelny format polskich adresów
- **Pomoc**: Wskazówki i podpowiedzi

### Dla administratorów
- **Lepsza jakość danych**: Standaryzowane adresy polskie
- **Mniej błędów**: Automatyczna walidacja i formatowanie
- **Analytics**: Możliwość śledzenia popularnych lokalizacji

## 🔧 Konfiguracja

### Zmienne konfiguracyjne
```javascript
// Próg uruchamiania wyszukiwania
const MIN_QUERY_LENGTH = 2;

// Limity wyników
const MAX_RESULTS = 6;

// Obszar priorytetowy (województwo małopolskie)
const PRIORITY_VIEWBOX = "19.0,49.0,22.0,51.0";
```

### API endpoints
- **Nominatim OpenStreetMap**: `https://nominatim.openstreetmap.org/search`
- **Parametry**: `countrycodes=pl`, `addressdetails=1`, `bounded=1`

## 🐛 Rozwiązywanie problemów

### Brak wyników wyszukiwania
- Sprawdź połączenie internetowe
- Upewnij się, że wpisujesz polskie nazwy miejscowości
- Spróbuj skrócić zapytanie (np. "Dęb" zamiast "Dębica")

### Wolne wyszukiwanie
- API ma limity zapytań
- Wyniki są cache'owane po stronie przeglądarki
- Użyj bardziej konkretnych zapytań

## 📈 Metryki i monitoring

### KPI do śledzenia
- **Czas odpowiedzi API**: < 2 sekundy
- **Skuteczność wyszukiwania**: % zapytań z wynikami
- **Wybory użytkowników**: Które sugestie są najczęściej wybierane

### Logi
Wszystkie błędy API są logowane w konsoli przeglądarki dla debugowania.

---

## 🎯 Następne kroki

### Planowane ulepszenia
- [ ] Cache'owanie popularnych wyszukiwań
- [ ] Integracja z polskimi bazami adresowymi
- [ ] Geolokalizacja użytkownika
- [ ] Historia ostatnich adresów
- [ ] Walidacja kodów pocztowych

### Opcjonalne rozszerzenia
- [ ] Mapa podglądu wybranego adresu
- [ ] Szacowanie odległości od serwisu
- [ ] Integracja z Google Maps lub MapBox

---

*Dokumentacja aktualna na dzień: 30.06.2025*
*Wersja: 2.0 - Ulepszone wyszukiwanie PL*
