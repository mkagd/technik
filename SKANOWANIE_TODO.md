# 🔧 Ulepszenia Systemu Skanowania - TODO

## ✅ Zrobione (2025-10-13):
- [x] Przycisk "Skanuj tabliczkę" zawsze widoczny
- [x] Ładowanie istniejących urządzeń przed otwarciem modala
- [x] Automatyczne zapisanie do serwera po zamknięciu modala
- [x] Przeładowanie zamówienia po zapisie
- [x] Obsługa pustych modeli (devices: [])
- [x] Lepsze logowanie (console.log)
- [x] Dokumentacja testowa (TEST_SKANOWANIE_TABLICZKI.md)
- [x] Instrukcja tworzenia nowych zleceń (NOWE_ZLECENIE_DLA_KLIENTA.md)

---

## 🚀 Wysokie priorytety:

### 1. Podgląd zdjęć tabliczek
**Cel**: Zobacz jakie zdjęcie zostało zeskanowane dla każdego urządzenia

**Do zrobienia**:
- [ ] Zapisuj `photoUrl` w `devices[].photo`
- [ ] Wyświetl miniaturę zdjęcia obok każdego urządzenia
- [ ] Lightbox do powiększenia zdjęcia

**Lokalizacja**:
- `components/ModelManagerModal.js` - dodaj pole `photoUrl`
- `pages/admin/zamowienia/[id].js` - wyświetl miniaturę w liście urządzeń

---

### 2. Historia skanowania
**Cel**: Zobacz kiedy i przez kogo została zeskanowana tabliczka

**Do zrobienia**:
- [ ] Dodaj pole `scannedBy` (nazwa użytkownika/technika)
- [ ] Zapisuj timestamp `scannedAt`
- [ ] Wyświetl "Zeskanowano: 2025-10-13 11:15 przez Jan Kowalski"

**Lokalizacja**:
- `pages/admin/zamowienia/[id].js` - w callback `onSave` dodaj:
  ```javascript
  scannedBy: getUserName(), // TODO: get from session
  scannedAt: new Date().toISOString()
  ```

---

### 3. Walidacja duplikatów
**Cel**: Ostrzeż jeśli to samo urządzenie (ten sam numer seryjny) już istnieje

**Do zrobienia**:
- [ ] Sprawdź `serialNumber` w `devices[]`
- [ ] Jeśli duplikat, pokaż ostrzeżenie: "⚠️ Urządzenie o tym numerze seryjnym już istnieje w zleceniu"
- [ ] Pozwól na nadpisanie lub anulowanie

**Lokalizacja**:
- `components/ModelManagerModal.js` - w funkcji `handleManualAdd()`:
  ```javascript
  const duplicate = models.find(m => m.serialNumber === manualModel.serialNumber);
  if (duplicate) {
    const confirm = window.confirm('To urządzenie już istnieje. Nadpisać?');
    if (!confirm) return;
  }
  ```

---

### 4. Export do PDF
**Cel**: Wygeneruj protokół z listą zeskanowanych urządzeń

**Do zrobienia**:
- [ ] Przycisk "📄 Generuj raport PDF"
- [ ] Zawiera: dane klienta, lista urządzeń z zdjęciami tabliczek
- [ ] Format: A4, logo firmy, data wizyty

**Lokalizacja**:
- Nowy komponent `components/DeviceReportGenerator.js`
- Użyj biblioteki `jspdf` lub `react-pdf`

---

## 🎯 Średnie priorytety:

### 5. Automatyczne wyszukiwanie części
**Cel**: Po zeskanowaniu tabliczki, zaproponuj części zamienne

**Do zrobienia**:
- [ ] Integracja z bazą danych części
- [ ] Dopasuj części po `brand` + `model`
- [ ] Wyświetl listę "Często używane części dla tego modelu"

**Lokalizacja**:
- `components/ModelManagerModal.js` - tab "Części" już istnieje
- API: `/api/parts/search?brand=Samsung&model=WW90K6414QW`

---

### 6. Grupowanie urządzeń
**Cel**: Grupuj urządzenia po typie (np. wszystkie pralki razem)

**Do zrobienia**:
- [ ] Sortuj `devices[]` po `deviceType`
- [ ] Wyświetl nagłówki grup: "Pralki (2)", "Zmywarki (1)"
- [ ] Kolorowe ikony per typ urządzenia

**Lokalizacja**:
- `pages/admin/zamowienia/[id].js` - sekcja "Urządzenia"
- Grupuj przez:
  ```javascript
  const grouped = devices.reduce((acc, device) => {
    const type = device.deviceType || 'Inne';
    if (!acc[type]) acc[type] = [];
    acc[type].push(device);
    return acc;
  }, {});
  ```

---

### 7. Szybkie kopiowanie danych
**Cel**: Skopiuj dane urządzenia do schowka jednym kliknięciem

**Do zrobienia**:
- [ ] Przycisk "📋 Kopiuj dane" obok każdego urządzenia
- [ ] Format: `Samsung WW90K6414QW | SN: 769991583591`
- [ ] Toast: "Skopiowano do schowka"

**Lokalizacja**:
- `pages/admin/zamowienia/[id].js` - dodaj przycisk:
  ```javascript
  <button onClick={() => {
    navigator.clipboard.writeText(`${device.brand} ${device.model} | SN: ${device.serialNumber}`);
    toast.success('Skopiowano!');
  }}>
    📋 Kopiuj
  </button>
  ```

---

### 8. Statystyki skanowania
**Cel**: Dashboard z statystykami AI Scanner

**Do zrobienia**:
- [ ] Panel Admin → "Statystyki Skanera"
- [ ] Metryki:
  - Liczba zeskanowanych tabliczek (dziś/tydzień/miesiąc)
  - Dokładność rozpoznawania (success rate)
  - Najpopularniejsze marki
  - Średni czas skanowania
- [ ] Wykresy

**Lokalizacja**:
- Nowa strona: `pages/admin/stats/scanner.js`
- API: `/api/stats/scanner`

---

## 🌟 Niskie priorytety (nice to have):

### 9. Bulk scan
**Cel**: Zeskanuj wiele tabliczek naraz (np. w magazynie)

**Do zrobienia**:
- [ ] Tryb "Masowe skanowanie"
- [ ] Kolejka zdjęć do przetworzenia
- [ ] Progress bar
- [ ] Export do CSV/Excel

---

### 10. OCR offline
**Cel**: Skanuj bez internetu (dla techników w terenie)

**Do zrobienia**:
- [ ] Użyj Tesseract.js (już zainstalowany!)
- [ ] Fallback: jeśli brak internetu → offline OCR
- [ ] Synchronizuj po powrocie do sieci

---

### 11. Rozpoznawanie QR kodów
**Cel**: Skanuj kody QR na urządzeniach

**Do zrobienia**:
- [ ] Dodaj detekcję QR w AI Scanner
- [ ] Jeśli QR → szybkie uzupełnienie modelu
- [ ] Integracja z bazą producenta (jeśli dostępne API)

---

### 12. Historia modyfikacji urządzenia
**Cel**: Zobacz kto i kiedy edytował dane urządzenia

**Do zrobienia**:
- [ ] Pole `devices[].history[]`
- [ ] Log zmian: kto, kiedy, co zmienił
- [ ] Przywracanie poprzedniej wersji

---

## 🐛 Bugfixy:

### 13. Validacja numeru seryjnego
**Cel**: Sprawdź czy numer seryjny jest prawidłowy

**Do zrobienia**:
- [ ] Regex validation per marka (Samsung: 15 cyfr, Bosch: alfanumeryczne)
- [ ] Ostrzeżenie jeśli nieprawidłowy format
- [ ] Tooltip z przykładem

---

### 14. Responsywność na mobile
**Cel**: Modal skanera dobrze wygląda na telefonie

**Do zrobienia**:
- [ ] Test na urządzeniach mobilnych
- [ ] Popraw layout dla małych ekranów
- [ ] Większe przyciski dla palców

---

### 15. Timeout dla skanowania
**Cel**: Nie czekaj w nieskończoność na wynik skanowania

**Do zrobienia**:
- [ ] Timeout: 30 sekund
- [ ] Po przekroczeniu: "Nie udało się rozpoznać. Spróbuj ponownie lub wpisz ręcznie"
- [ ] Możliwość anulowania w trakcie

---

## 🎨 UX Improvements:

### 16. Animacje
**Cel**: Płynne przejścia przy dodawaniu/usuwaniu urządzeń

**Do zrobienia**:
- [ ] Framer Motion dla animacji wejścia/wyjścia
- [ ] Slide in/out dla listy urządzeń
- [ ] Fade dla alertów sukcesu

---

### 17. Tooltips
**Cel**: Wyjaśnij co robi każdy przycisk

**Do zrobienia**:
- [ ] Tooltip na "📷 Skanuj tabliczkę": "Zeskanuj zdjęcie tabliczki znamionowej urządzenia"
- [ ] Tooltip na "Dodaj ręcznie": "Wpisz dane urządzenia bez skanowania"
- [ ] Użyj biblioteki `react-tooltip`

---

### 18. Keyboard shortcuts
**Cel**: Szybsze dodawanie urządzeń z klawiatury

**Do zrobienia**:
- [ ] `Ctrl+S` → Zapisz zmiany w modalu
- [ ] `Ctrl+N` → Otwórz modal skanera
- [ ] `ESC` → Zamknij modal

---

## 🔒 Security:

### 19. Rate limiting dla AI Scanner
**Cel**: Zapobiegaj nadużyciom API (np. spam skanowań)

**Do zrobienia**:
- [ ] Limit: 50 skanowań/godzinę per użytkownik
- [ ] Po przekroczeniu: "Przekroczono limit. Spróbuj za 1h"
- [ ] Admin ma unlimited

---

### 20. Watermark na zdjęciach
**Cel**: Zabezpiecz zdjęcia tabliczek przed kopiowaniem

**Do zrobienia**:
- [ ] Dodaj watermark: "© Firma XYZ | [data]"
- [ ] Półprzeźroczyste logo w rogu
- [ ] Opcja wyłączenia dla adminów

---

## 📚 Dokumentacja:

### 21. Video tutorial
**Cel**: Pokaż jak używać skanera tabliczek

**Do zrobienia**:
- [ ] Nagraj screencast (2-3 minuty)
- [ ] Pokaż: otwarcie modala → skanowanie → zapisanie
- [ ] Upload na YouTube/Vimeo
- [ ] Link w aplikacji: "❓ Jak używać skanera?"

---

### 22. FAQ
**Cel**: Odpowiedz na częste pytania

**Do zrobienia**:
- [ ] Sekcja FAQ w aplikacji
- [ ] Pytania:
  - "Co zrobić jeśli skanowanie się nie udało?"
  - "Czy mogę edytować zeskanowane dane?"
  - "Jak dodać kolejne urządzenie?"
- [ ] Search w FAQ

---

## 🧪 Testing:

### 23. Unit tests
**Cel**: Automatyczne testy funkcji krytycznych

**Do zrobienia**:
- [ ] Test: `updateOrder` zapisuje devices[]
- [ ] Test: Ładowanie modeli z zamówienia
- [ ] Test: Walidacja duplikatów
- [ ] Framework: Jest + React Testing Library

---

### 24. E2E tests
**Cel**: Test całego flow skanowania

**Do zrobienia**:
- [ ] Scenario: Otwórz zamówienie → Skanuj → Zapisz → Odśwież → Sprawdź
- [ ] Framework: Playwright lub Cypress
- [ ] CI/CD: Automatyczne testy przy push

---

## 🎓 Priorytety (podsumowanie):

| Priorytet | Feature | Czas realizacji | Impact |
|-----------|---------|-----------------|--------|
| 🔴 HIGH | 1. Podgląd zdjęć | 2-3h | Wysoki |
| 🔴 HIGH | 2. Historia skanowania | 1-2h | Średni |
| 🔴 HIGH | 3. Walidacja duplikatów | 1h | Wysoki |
| 🟡 MED | 4. Export PDF | 3-4h | Średni |
| 🟡 MED | 5. Wyszukiwanie części | 4-5h | Wysoki |
| 🟡 MED | 6. Grupowanie urządzeń | 2h | Niski |
| 🟢 LOW | 7-12 | Różnie | Różny |

**Zalecenie**: Zacznij od 1, 2, 3 (łącznie ~4-6h pracy)
