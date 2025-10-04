# 💰 SYSTEM ROZLICZEŃ I ZABEZPIECZEŃ PŁATNOŚCI

## 📋 Spis treści

1. [Przegląd systemu](#przegląd-systemu)
2. [Architektura](#architektura)
3. [Zabezpieczenia antyfraudowe](#zabezpieczenia-antyfraudowe)
4. [Workflow dla technika](#workflow-dla-technika)
5. [Panel admina](#panel-admina)
6. [API Endpoints](#api-endpoints)
7. [Struktura danych](#struktura-danych)
8. [Instrukcja użytkowania](#instrukcja-użytkowania)

---

## 🎯 Przegląd systemu

System zarządzania płatnościami i rozliczeń pracowników z zaawansowanymi zabezpieczeniami antyfraudowymi.

### ✨ Kluczowe funkcje:

✅ **Podpis cyfrowy klienta** - wymagany dla płatności gotówką  
✅ **Weryfikacja GPS** - lokalizacja przy każdej płatności  
✅ **Zdjęcie dowodu** - dla płatności bezgotówkowych  
✅ **Niemutowalne logi** - pełny audyt transakcji  
✅ **Rozliczenia gotówkowo-kartowe** - bilans per pracownik  
✅ **Alerty bezpieczeństwa** - wykrywanie nieprawidłowości  
✅ **Raport podatkowy** - eksport CSV dla księgowości  

---

## 🏗️ Architektura

### Pliki danych:

```
data/
├── orders.json           # Zlecenia z paymentInfo w wizytach
├── payment-logs.json     # Niemutowalne logi transakcji
├── settlements.json      # Historia rozliczeń
├── alert-actions.json    # Historia akcji alertów (rozwiązane, kontakt)
└── employees.json        # Dane pracowników
```

### Pliki kodu:

```
pages/
├── technician/
│   └── payment.js                    # Ekran przyjmowania płatności
├── admin/
│   ├── rozliczenia.js                # Panel rozliczeń
│   ├── alerty.js                     # Dashboard alertów
│   └── audit-logs.js                 # Logi audytu
└── api/
    ├── technician/
    │   └── payment.js                # API zapisu płatności
    └── admin/
        ├── employee-settlements.js   # API rozliczeń
        ├── settlement-actions.js     # API zatwierdzania
        ├── security-alerts.js        # API alertów
        ├── alert-actions.js          # API akcji alertów
        ├── audit-logs.js             # API logów
        └── tax-report.js             # API raportów
```

---

## 🔒 Zabezpieczenia antyfraudowe

### 1. **Podpis cyfrowy klienta**

**Dla płatności gotówką:**
- Klient podpisuje palcem na ekranie
- Podpis jest zapisywany jako obraz base64
- Hash podpisu w logach (SHA-256)
- Brak podpisu = brak możliwości zapisania płatności

**Implementacja:**
```javascript
// Canvas do podpisu
<canvas
  ref={canvasRef}
  width={800}
  height={200}
  onMouseDown={startDrawing}
  onMouseMove={draw}
  onMouseUp={stopDrawing}
/>
```

### 2. **Weryfikacja GPS**

**Automatyczna weryfikacja:**
- GPS pobierany przy otwarciu strony płatności
- Wymagana dokładność ≤100m
- Porównanie z adresem klienta (jeśli dostępny)
- Alert jeśli odległość >100m

**Walidacja:**
```javascript
if (gpsLocation.accuracy > 100) {
  return error('⚠️ Dokładność GPS zbyt niska');
}

const distance = calculateDistance(
  gpsLocation.lat, gpsLocation.lng,
  clientAddress.lat, clientAddress.lng
);

if (distance > 100) {
  // Zapisz alert do systemu
}
```

### 3. **Zdjęcie dowodu płatności**

**Dla płatności bezgotówkowych:**
- Wymagane zdjęcie potwierdzenia z terminala POS
- Maksymalny rozmiar: 5MB
- Format: base64
- Hash zdjęcia w logach

### 4. **Niemutowalne logi**

**Każda transakcja:**
```json
{
  "id": "LOG-1696345200-abc123",
  "timestamp": "2024-10-03T14:30:00.000Z",
  "action": "PAYMENT_RECEIVED",
  "employeeId": "EMP-001",
  "orderId": "ORD-2024-001",
  "visitId": "V-2024-001-01",
  "amount": 450,
  "method": "cash",
  "cashAmount": 450,
  "cardAmount": 0,
  "blikAmount": 0,
  "gps": {
    "lat": 52.2297,
    "lng": 21.0122,
    "accuracy": 15
  },
  "signatureHash": "sha256_hash_of_signature",
  "photoHash": "sha256_hash_of_photo",
  "deviceInfo": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  "immutable": true  // NIE MOŻNA EDYTOWAĆ ANI USUNĄĆ
}
```

### 5. **System alertów**

**Automatyczne wykrywanie:**

🚨 **KRYTYCZNE:**
- Brak podpisu cyfrowego dla gotówki
- Płatność >100m od adresu klienta

⚠️ **WYSOKIE:**
- Brak zdjęcia dla karty/BLIK
- Edycja płatności po >1 godzinie
- >3 płatności bez dowodów

⚡ **ŚREDNIE:**
- Wysoki % gotówki (>70%)
- Niska dokładność GPS (>50m)

ℹ️ **NISKIE:**
- Nietypowe wzorce płatności
- Statystyki informacyjne

---

## 👨‍🔧 Workflow dla technika

### Krok 1: Zakończenie wizyty

Technik kończy wizytę i przechodzi do ekranu płatności:

```
/technician/payment?orderId=ORD-001&visitId=V-001-01
```

### Krok 2: Weryfikacja GPS

System automatycznie:
1. Pobiera lokalizację GPS
2. Sprawdza dokładność (≤100m wymagane)
3. Wyświetla status GPS na ekranie

### Krok 3: Wybór metody płatności

Technik wybiera:
- 💵 Gotówka
- 💳 Karta
- 📱 BLIK
- Lub kombinacja (płatność mieszana)

### Krok 4: Wprowadzenie kwot

```
Gotówka:  [___] PLN
Karta:    [___] PLN
BLIK:     [___] PLN
-------------------
RAZEM:    450,00 PLN
```

### Krok 5: Podpis cyfrowy (dla gotówki)

Jeśli płatność zawiera gotówkę:
1. Technik podaje telefon klientowi
2. Klient podpisuje palcem na ekranie
3. System zapisuje podpis

### Krok 6: Zdjęcie dowodu (dla karty/BLIK)

Jeśli płatność bezgotówkowa:
1. Technik robi zdjęcie potwierdzenia z terminala
2. System weryfikuje zdjęcie
3. Podgląd przed zapisaniem

### Krok 7: Walidacja i zapis

System sprawdza:
- ✅ GPS jest dostępny
- ✅ Dokładność GPS ≤100m
- ✅ Podpis dla gotówki
- ✅ Zdjęcie dla karty/BLIK
- ✅ Kwota >0

**Jeśli wszystko OK:**
- Płatność zapisana w `orders.json`
- Log dodany do `payment-logs.json`
- Przekierowanie do listy wizyt

---

## 👨‍💼 Panel admina

### 1. Rozliczenia pracowników

**Adres:** `/admin/rozliczenia`

**Funkcje:**
- Tabela pracowników z bilansem
- Gotówka/Karta/BLIK per pracownik
- Bilans: DO WPŁATY / DO WYPŁATY
- Zatwierdzanie rozliczeń
- Eksport CSV

**Przykład:**

```
┌────────────────────────────────────────────────────────┐
│ Jan Kowalski                                           │
├────────────────────────────────────────────────────────┤
│ Gotówka zebrana:      2,450 PLN (40%)                 │
│ Karta zebrana:        1,200 PLN (20%)                 │
│ BLIK zebrany:         2,600 PLN (40%)                 │
│ Suma zebrana:         6,250 PLN                       │
│ Wypłata należna:      1,800 PLN                       │
│ ──────────────────────────────────────                │
│ ⚠️ BILANS: +650 PLN DO WPŁATY                        │
│                                                        │
│ [Rozlicz pracownika]                                   │
└────────────────────────────────────────────────────────┘
```

**Modal rozliczenia:**
```
Metoda rozliczenia:
○ 🏧 Wpłatomat
○ 💵 Gotówka do ręki
○ 💳 Przelew bankowy

Kwota: [650.00] PLN
Notatki: [Wpłacone w wpłatomacie PKO BP, ul. Główna]

[Anuluj] [✅ Potwierdź]
```

### 2. Alerty bezpieczeństwa

**Adres:** `/admin/alerty`

**Typy alertów:**

🚨 **Krytyczne (3):**
- Jan Kowalski - 3 płatności bez podpisu

⚠️ **Wysokie (2):**
- Anna W. - Płatność 250m od klienta

⚡ **Średnie (1):**
- Piotr N. - 85% płatności gotówką

**Akcje:**
- 🔍 **Sprawdź szczegóły** - Otwiera logi audytu dla pracownika
- ✅ **Rozwiązano** - Oznacza alert jako rozwiązany (znika z listy)
- 📞 **Skontaktuj się** - Otwiera formularz kontaktu/email do pracownika

**Funkcje:**
- Checkbox "Pokaż rozwiązane" - Zobacz historię rozwiązanych alertów
- Rozwiązane alerty są oznaczone ✅ i są przygaszone
- Historia wszystkich akcji zapisana w `alert-actions.json`

### 3. Logi audytu

**Adres:** `/admin/audit-logs`

**Funkcje:**
- Lista wszystkich transakcji (niemutowalne)
- Filtry: pracownik, metoda, data
- Szczegóły: GPS, dowody, IP
- Eksport CSV dla księgowości

**Kolumny:**
- ID logu
- Data/czas
- Pracownik
- Akcja
- Kwota (cash/card/blik)
- Metoda
- GPS (lat, lng, accuracy)
- Dowody (podpis, zdjęcie)
- IP urządzenia

### 4. Raport podatkowy

**Endpoint:** `/api/admin/tax-report?period=2024-10&format=csv`

**Eksport CSV:**
```csv
Pracownik,ID Pracownika,Gotówka (PLN),Karta (PLN),BLIK (PLN),Bezgotówkowe razem (PLN),Suma całkowita (PLN),Liczba transakcji,% Gotówka,% Bezgotówkowe
Jan Kowalski,EMP-001,2450.00,1200.00,2600.00,3800.00,6250.00,15,39.2%,60.8%
Anna Wiśniewska,EMP-002,800.00,3400.00,1100.00,4500.00,5300.00,12,15.1%,84.9%
RAZEM,,3250.00,4600.00,3700.00,8300.00,11550.00,27,28.1%,71.9%
```

---

## 🔌 API Endpoints

### Technik:

**POST** `/api/technician/payment`

Request:
```json
{
  "orderId": "ORD-2024-001",
  "visitId": "V-2024-001-01",
  "paymentMethod": "cash",
  "cashAmount": 450,
  "cardAmount": 0,
  "blikAmount": 0,
  "totalAmount": 450,
  "digitalSignature": "data:image/png;base64,...",
  "photoProof": null,
  "gpsLocation": {
    "lat": 52.2297,
    "lng": 21.0122,
    "accuracy": 15
  },
  "employeeId": "EMP-001",
  "timestamp": "2024-10-03T14:30:00.000Z"
}
```

Response:
```json
{
  "success": true,
  "message": "✅ Płatność została zapisana pomyślnie",
  "paymentInfo": { ... },
  "logId": "LOG-1696345200-abc123"
}
```

### Admin:

**GET** `/api/admin/employee-settlements?period=2024-10`

Response:
```json
{
  "success": true,
  "settlements": [
    {
      "employeeId": "EMP-001",
      "employeeName": "Jan Kowalski",
      "period": "2024-10",
      "cashCollected": 2450,
      "cardCollected": 1200,
      "blikCollected": 2600,
      "totalCollected": 6250,
      "salaryDue": 1800,
      "balance": 650,
      "balanceType": "to_deposit",
      "status": "pending"
    }
  ],
  "totals": { ... }
}
```

**POST** `/api/admin/settlement-actions`

Request:
```json
{
  "employeeId": "EMP-001",
  "period": "2024-10",
  "amount": 650,
  "settlementMethod": "atm",
  "notes": "Wpłacone w wpłatomacie PKO BP"
}
```

**GET** `/api/admin/security-alerts`

Response:
```json
{
  "success": true,
  "alerts": [
    {
      "id": 1,
      "severity": "critical",
      "type": "missing_signature",
      "title": "Brak podpisu cyfrowego",
      "description": "Jan Kowalski - 3 płatności gotówką bez podpisu",
      "details": { ... }
    }
  ],
  "criticalCount": 1
}
```

**GET** `/api/admin/audit-logs`

**GET** `/api/admin/tax-report?period=2024-10&format=csv`

---

## 📊 Struktura danych

### orders.json - paymentInfo w wizycie:

```json
{
  "visitId": "V-2024-001-01",
  "paymentInfo": {
    "totalAmount": 450,
    "paymentMethod": "cash",
    "cashAmount": 450,
    "cardAmount": 0,
    "blikAmount": 0,
    "digitalSignature": "data:image/png;base64,...",
    "photoProof": null,
    "gpsLocation": {
      "lat": 52.2297,
      "lng": 21.0122,
      "accuracy": 15
    },
    "paidAt": "2024-10-03T14:30:00.000Z",
    "collectedBy": "EMP-001",
    "verified": true
  }
}
```

### payment-logs.json:

```json
[
  {
    "id": "LOG-1696345200-abc123",
    "timestamp": "2024-10-03T14:30:00.000Z",
    "action": "PAYMENT_RECEIVED",
    "employeeId": "EMP-001",
    "orderId": "ORD-2024-001",
    "visitId": "V-2024-001-01",
    "amount": 450,
    "method": "cash",
    "cashAmount": 450,
    "cardAmount": 0,
    "blikAmount": 0,
    "gps": {
      "lat": 52.2297,
      "lng": 21.0122,
      "accuracy": 15
    },
    "signatureHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "photoHash": null,
    "deviceInfo": {
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    },
    "immutable": true
  }
]
```

### settlements.json:

```json
[
  {
    "id": "STL-1696345200-xyz789",
    "employeeId": "EMP-001",
    "period": "2024-10",
    "amount": 650,
    "settlementMethod": "atm",
    "notes": "Wpłacone w wpłatomacie PKO BP",
    "status": "settled",
    "settledAt": "2024-10-03T16:00:00.000Z",
    "settledBy": "ADMIN-001",
    "createdAt": "2024-10-03T16:00:00.000Z"
  }
]
```

---

## 📖 Instrukcja użytkowania

### Dla technika:

1. **Zakończ wizytę** w aplikacji mobilnej
2. **Kliknij "Przyjmij płatność"**
3. **Upewnij się, że GPS jest włączony** (zielony status)
4. **Wybierz metodę płatności** (gotówka/karta/BLIK)
5. **Wprowadź kwoty**
6. **DLA GOTÓWKI:** Poproś klienta o podpis na ekranie
7. **DLA KARTY/BLIK:** Zrób zdjęcie potwierdzenia z terminala
8. **Kliknij "Potwierdź płatność"**
9. **System zweryfikuje** wszystkie dane
10. **Gotowe!** Płatność zapisana

### Dla admina:

#### Sprawdzenie rozliczeń:

1. Wejdź na `/admin/rozliczenia`
2. Wybierz okres (miesiąc)
3. Zobacz tabelę pracowników z bilansem
4. Pracownik ma **DO WPŁATY** (+ kwota) → musi wpłacić kasę
5. Pracownik ma **DO WYPŁATY** (- kwota) → wypłać mu pensję
6. Kliknij **"Rozlicz"** przy pracowniku
7. Wybierz metodę rozliczenia (wpłatomat/gotówka/przelew)
8. Dodaj notatki
9. **Potwierdź**
10. Rozliczenie zapisane w historii

#### Monitorowanie alertów:

1. Wejdź na `/admin/alerty`
2. Zobacz alerty posortowane po ważności
3. **Krytyczne** (czerwone) → natychmiastowa reakcja
4. **Wysokie** (pomarańczowe) → sprawdź dziś
5. **Średnie** (żółte) → monitoruj
6. Kliknij **"Sprawdź szczegóły"** aby zobaczyć więcej
7. Skontaktuj się z pracownikiem jeśli potrzeba
8. Oznacz jako **"Rozwiązano"**

#### Eksport raportów:

**Rozliczenia CSV:**
- `/admin/rozliczenia` → **"Eksportuj CSV"**

**Logi audytu:**
- `/admin/audit-logs` → ustaw filtry → **"Eksportuj CSV"**

**Raport podatkowy:**
- `/api/admin/tax-report?period=2024-10&format=csv`

---

## ⚠️ WAŻNE INFORMACJE

### Bezpieczeństwo:

🔒 **Logi są NIEMUTOWALNE** - nie można ich edytować ani usunąć  
🔐 **Każdy wpis ma hash** zapewniający integralność  
📊 **Służą do audytu** i kontroli skarbowej  
⏰ **Timestamp z serwera** - nie można go sfałszować  

### Prywatność:

- Podpisy cyfrowe są szyfrowane
- Zdjęcia dowodów są zabezpieczone
- GPS tylko przy transakcjach
- IP logowane dla bezpieczeństwa

### Zgodność prawna:

✅ Zgodne z RODO (zgoda klienta na podpis)  
✅ Zgodne z przepisami podatkowymi  
✅ Pełna dokumentacja transakcji  
✅ Możliwość eksportu dla US/ZUS  

---

## 🆘 Rozwiązywanie problemów

### Problem: Brak lokalizacji GPS

**Rozwiązanie:**
1. Sprawdź, czy lokalizacja jest włączona w telefonie
2. Odśwież stronę
3. Wyjdź na otwartą przestrzeń (nie w budynku)
4. Poczekaj 10-30 sekund na GPS

### Problem: Niska dokładność GPS (>100m)

**Rozwiązanie:**
1. Przejdź na otwartą przestrzeń
2. Poczekaj na lepszy sygnał
3. Restart telefonu
4. Sprawdź ustawienia GPS (tryb wysokiej dokładności)

### Problem: Nie można zapisać płatności

**Błąd: "Brak podpisu klienta"**
- Upewnij się, że klient podpisał w polu podpisu
- Sprawdź czy podpis jest widoczny (zielony tekst "✅ Podpis wprowadzony")

**Błąd: "Brak zdjęcia dowodu"**
- Dodaj zdjęcie potwierdzenia płatności
- Sprawdź czy zdjęcie jest <5MB

**Błąd: "Dokładność GPS zbyt niska"**
- Zobacz sekcję "Brak lokalizacji GPS" powyżej

### Problem: Rozliczenie się nie zgadza

1. Wejdź na `/admin/audit-logs`
2. Ustaw filtr na pracownika
3. Sprawdź wszystkie transakcje
4. Porównaj z rozliczeniem
5. Jeśli niezgodność - skontaktuj się z supportem

---

## 📞 Support

W razie problemów skontaktuj się z administratorem systemu.

**Pamiętaj:**
- System jest monitorowany 24/7
- Wszystkie transakcje są logowane
- Nieprawidłowości są wykrywane automatycznie
- Przestrzeganie procedur chroni Cię i firmę

---

**Ostatnia aktualizacja:** 2024-10-03  
**Wersja:** 1.0.0  
**Status:** ✅ System kompletny i gotowy do użycia
