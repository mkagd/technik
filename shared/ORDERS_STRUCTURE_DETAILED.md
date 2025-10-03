# 📋 STRUKTURA ORDERS - DOKŁADNY OPIS KAŻDEGO POLA

## 🎯 GŁÓWNA STRUKTURA ZAMÓWIENIA

```javascript
// ZAMÓWIENIE = OBIEKT JSON z następującymi polami:
{
  // === 🔑 IDENTYFIKACJA ===
  "id": "ORD2025093000001",           // STRING - Unikalny identyfikator zamówienia
                                      // Format: ORD + ROK + MIESIĄC + DZIEŃ + NUMER (5 cyfr)
                                      // Przykład: ORD2025093000001 = 1 października 2025, zamówienie nr 1
  
  "status": "new",                    // STRING - Aktualny status zamówienia
                                      // Możliwe wartości: "new" | "assigned" | "in-progress" | "completed" | "cancelled" | "on-hold"
  
  "clientId": "CLI25186001",          // STRING - 🔗 KLUCZ OBCY do tabeli clients
                                      // Łączy zamówienie z konkretnym klientem
  
  // === 📝 OPIS USŁUGI ===
  "service": {
    "category": "Serwis AGD",         // STRING - Główna kategoria usługi
                                      // Wartości: "Serwis AGD" | "Serwis elektroniki" | "Instalacje"
    
    "type": "Naprawa pralki",         // STRING - Konkretny typ usługi
                                      // Przykłady: "Naprawa pralki", "Montaż klimatyzacji", "Przegląd techniczny"
    
    "description": "Pralka Samsung nie wiruje, słychać dziwne dźwięki podczas prania",
                                      // STRING - Szczegółowy opis problemu od klienta
    
    "priority": "normal",             // STRING - Priorytet zamówienia
                                      // Wartości: "low" | "normal" | "high" | "urgent"
    
    "urgency": "normalny",            // STRING - Pilność w języku polskim
                                      // Wartości: "normalny" | "pilny" | "bardzo pilny"
    
    "complexity": "medium"            // STRING - Złożoność techniczna (obliczana automatycznie)
                                      // Wartości: "low" | "medium" | "high"
  },
  
  // === 🔧 URZĄDZENIA DO NAPRAWY ===
  "devices": [                       // ARRAY - Lista urządzeń (może być więcej niż jedno!)
    {
      "name": "Pralka Samsung",       // STRING - Nazwa urządzenia (podana przez klienta)
      "brand": "Samsung",             // STRING - Marka/producent
      "model": "WW90T4540AE",         // STRING - Model urządzenia
      "description": "Nie wiruje, hałasuje podczas wirowania",
                                      // STRING - Opis problemu konkretnego urządzenia
      
      "category": "AGD",              // STRING - Kategoria techniczna
                                      // Wartości: "AGD" | "Elektronika" | "Instalacje"
      
      "type": "Pralka",               // STRING - Standaryzowany typ urządzenia
      
      // CHARAKTERYSTYKI TECHNICZNE URZĄDZENIA
      "characteristics": {
        "installationType": "freestanding",  // STRING - Typ instalacji
                                            // Wartości: "built-in" | "freestanding" | "countertop"
        
        "accessLevel": "easy",        // STRING - Poziom dostępu do urządzenia
                                      // Wartości: "easy" | "standard" | "difficult"
        
        "serviceComplexity": "medium", // STRING - Złożoność serwisowa
                                      // Wartości: "low" | "medium" | "high"
        
        "requiresDisassembly": true,  // BOOLEAN - Czy wymaga demontażu
        "requiresAssembly": true,     // BOOLEAN - Czy wymaga montażu po naprawie
        "powerSource": "electric"     // STRING - Źródło zasilania
                                      // Wartości: "electric" | "gas" | "mixed"
      },
      
      // INFORMACJE SERWISOWE (generowane automatycznie)
      "serviceInfo": {
        "estimatedDuration": 120,     // NUMBER - Szacowany czas naprawy w minutach
        
        "requiredTools": [            // ARRAY - Lista wymaganych narzędzi
          "podstawowy zestaw narzędzi",
          "klucze do AGD",
          "multimetr"
        ],
        
        "safetyRequirements": [       // ARRAY - Wymagania bezpieczeństwa
          "wyłączenie zasilania",
          "sprawdzenie braku napięcia"
        ]
      }
    }
    // Mogą być kolejne urządzenia w tablicy...
  ],
  
  // === 📍 ADRES WYKONANIA USŁUGI ===
  "address": {
    "street": "ul. Kowalska 123",     // STRING - Ulica z numerem domu
    "city": "Warszawa",               // STRING - Miasto
    "zipCode": "00-001",              // STRING - Kod pocztowy
    "notes": "II piętro, drzwi po lewej stronie"
                                      // STRING - Dodatkowe uwagi o lokalizacji
  },
  
  // === 📅 HARMONOGRAM I PRZYPISANIE ===
  "scheduling": {
    "preferredTime": "po południu",   // STRING - Preferowany czas (tekst od klienta)
    "preferredDate": "2025-10-02",    // STRING - Preferowana data (YYYY-MM-DD)
    
    "scheduledDate": null,            // STRING/NULL - Ustalona data i godzina (ISO format)
                                      // Przykład: "2025-10-02T14:00:00Z" lub null jeśli nie ustalono
    
    "assignedEmployeeId": null,       // STRING/NULL - 🔗 KLUCZ OBCY do tabeli employees
                                      // ID przypisanego technika lub null jeśli nie przypisano
    
    "estimatedDuration": 120,         // NUMBER - Szacowany czas wykonania (minuty)
    "actualDuration": null,           // NUMBER/NULL - Rzeczywisty czas wykonania (po ukończeniu)
    
    "assignedAt": null,               // STRING/NULL - Kiedy przypisano technika (ISO format)
    "assignmentReason": null          // STRING/NULL - Powód przypisania konkretnego technika
  },
  
  // === 💰 WYCENA I ROZLICZENIE ===
  "pricing": {
    "estimatedCost": 200,             // NUMBER - Szacowany koszt usługi (PLN)
    "finalCost": null,                // NUMBER/NULL - Końcowy koszt (po wykonaniu)
    "travelCost": 50,                 // NUMBER - Koszt dojazdu (PLN)
    "laborHours": 2,                  // NUMBER - Szacowane godziny pracy
    
    "partsUsed": []                   // ARRAY - Użyte części (wypełniane po naprawie)
                                      // Struktura elementu:
                                      // {
                                      //   "name": "Łożysko bębna",
                                      //   "quantity": 1,
                                      //   "unitPrice": 80,
                                      //   "totalPrice": 80
                                      // }
  },
  
  // === ⏰ HISTORIA I ŚLEDZENIE ===
  "timeline": {
    "createdAt": "2025-09-30T09:00:00Z",  // STRING - Kiedy utworzono zamówienie (ISO format)
    "updatedAt": "2025-09-30T09:00:00Z",  // STRING - Ostatnia aktualizacja (ISO format)
    "completedAt": null,                  // STRING/NULL - Kiedy ukończono (ISO format)
    
    "statusHistory": [                    // ARRAY - Pełna historia zmian statusów
      {
        "status": "new",                  // STRING - Status w tym momencie
        "timestamp": "2025-09-30T09:00:00Z", // STRING - Kiedy nastąpiła zmiana
        "employeeId": "system",           // STRING - Kto dokonał zmiany (ID pracownika lub "system")
        "notes": "Zamówienie utworzone przez klienta online"
                                          // STRING - Opis zmiany
      }
      // Kolejne wpisy dodawane przy każdej zmianie statusu...
    ]
  },
  
  // === 📝 NOTATKI ===
  "notes": {
    "internal": "Nowy klient, sprawdzić dostępność części",
                                      // STRING - Notatka wewnętrzna (tylko dla zespołu)
    
    "customer": "Skontaktujemy się w sprawie terminu",
                                      // STRING - Notatka dla klienta (widoczna dla klienta)
    
    "technical": "Sprawdzić amortyzatory i łożyska bębna"
                                      // STRING - Notatka techniczna (dla technika)
  },
  
  // === ℹ️ INFORMACJE O STATUSIE ===
  "statusInfo": {
    "current": "new",                 // STRING - Aktualny status (duplikat z głównego "status")
    "label": "Nowe",                  // STRING - Nazwa statusu po polsku
    "description": "Nowe zamówienie oczekuje na przypisanie",
                                      // STRING - Opis statusu
    
    "priority": 1,                    // NUMBER - Priorytet numeryczny (1=najwyższy)
    "isFinal": false,                 // BOOLEAN - Czy to status końcowy
    
    "possibleTransitions": ["assigned", "cancelled"]
                                      // ARRAY - Możliwe następne statusy
  }
}
```

---

## 🔄 PRZEPŁYW STATUSÓW ZAMÓWIENIA

### 📊 **Możliwe stany:**
1. **`"new"`** → Nowe zamówienie
   - Utworzone, czeka na przypisanie
   - `possibleTransitions: ["assigned", "cancelled"]`

2. **`"assigned"`** → Przypisane
   - Przypisane do technika
   - `possibleTransitions: ["in-progress", "on-hold", "cancelled"]`

3. **`"in-progress"`** → W trakcie
   - Technik rozpoczął pracę
   - `possibleTransitions: ["completed", "on-hold", "cancelled"]`

4. **`"on-hold"`** → Wstrzymane
   - Brak części, oczekiwanie na klienta
   - `possibleTransitions: ["in-progress", "cancelled"]`

5. **`"completed"`** → Ukończone ✅
   - Status końcowy
   - `possibleTransitions: []`

6. **`"cancelled"`** → Anulowane ❌
   - Status końcowy
   - `possibleTransitions: []`

---

## 🔗 POWIĄZANIA Z INNYMI TABELAMI

### **clientId** → `clients.json`
```javascript
// Znajdź klienta dla zamówienia
const client = clients.find(c => c.id === order.clientId);
```

### **assignedEmployeeId** → `employees.json`
```javascript
// Znajdź przypisanego technika
const employee = employees.find(e => e.id === order.scheduling.assignedEmployeeId);
```

---

## 📈 AUTOMATYCZNE OBLICZENIA

### **Złożoność (complexity):**
- Obliczana na podstawie typu urządzenia i opisu problemu
- `"low"` - proste naprawy (wymiana filtra)
- `"medium"` - średnie naprawy (wymiana łożysk)
- `"high"` - złożone naprawy (wymiana silnika)

### **Szacowany czas (estimatedDuration):**
- Bazuje na typie urządzenia i złożoności
- Wartość w minutach

### **Wymagane narzędzia:**
- Automatycznie dobierane na podstawie kategorii urządzenia

---

## ✅ MINIMALNE WYMAGANE POLA DO UTWORZENIA

```json
{
  "clientId": "CLI25186001",          // ✅ WYMAGANE
  "service": {
    "description": "Opis problemu"    // ✅ WYMAGANE
  }
  // Reszta pól może być null/pusta i uzupełniana później
}
```

**🎯 Ta struktura pozwala na kompletne zarządzanie zamówieniami serwisowymi - od przyjęcia zgłoszenia do rozliczenia!**