# 📊 ANALIZA: Formularz Rezerwacji - Wysyłanie Podczas Rozmowy

## 🎯 CEL
Umożliwić wysyłanie zgłoszenia serwisowego **podczas rozmowy telefonicznej z klientem** przez pracownika biura.

---

## 🔍 OBECNA ARCHITEKTURA

### **1. Formularz: `pages/rezerwacja.js`**

#### **Struktura wieloetapowa (5 kroków):**

```
KROK 1: Urządzenie (Multi-device support)
  ├─ Wybór typu urządzenia (checkbox - można wybrać kilka)
  ├─ Dla każdego urządzenia:
  │   ├─ Marka (autocomplete z sugestiami)
  │   ├─ Model (text input + AI Scanner)
  │   ├─ Opis problemu (autocomplete z typowymi usterkami)
  │   └─ Zabudowa (checkbox: w zabudowie, trudna zabudowa)
  └─ AI Scanner: Skanowanie tabliczki znamionowej

KROK 2: Lokalizacja
  ├─ Kod pocztowy
  ├─ Miasto
  ├─ Ulica i numer
  └─ Geocoding (GPS coordinates) - automatyczny

KROK 3: Dane kontaktowe
  ├─ Imię i nazwisko *
  ├─ Telefon *
  └─ Email (opcjonalnie)

KROK 4: Dostępność
  ├─ Wybór przedziału czasowego (6 opcji)
  │   ├─ Cały dzień (24h - najszybsza realizacja)
  │   ├─ 8:00-12:00 (2 dni)
  │   ├─ 12:00-16:00 (2 dni)
  │   ├─ 16:00-20:00 (3 dni)
  │   ├─ Weekend (4 dni)
  │   └─ Po 15:00 (5 dni - najdłużej)
  ├─ Real-time availability check (API /api/availability)
  ├─ Wizualizacja obłożenia (progress bar)
  └─ Dodatkowe uwagi (textarea)

KROK 5: Podsumowanie
  ├─ Przegląd wszystkich danych
  ├─ Przyciski "Edytuj" dla każdej sekcji
  └─ Przycisk "Wyślij zgłoszenie" (finalizacja)
```

#### **Kluczowe funkcje formularza:**

1. **Multi-device support:**
   - Możliwość wyboru kilku urządzeń jednocześnie
   - Każde urządzenie ma własne: markę, model, problem, zabudowę

2. **AI Scanner:**
   - `ModelAIScanner.js` - skanowanie tabliczki znamionowej
   - Automatyczne rozpoznawanie marki i modelu
   - Wypełnianie pól na podstawie zdjęcia

3. **Geocoding:**
   - Automatyczne pobieranie współrzędnych GPS dla adresu
   - GoogleGeocoder - konwersja adresu na lat/lng
   - Przechowywanie w `clientLocation.coordinates`

4. **Real-time availability:**
   - `/api/availability` - sprawdzanie dostępności w czasie rzeczywistym
   - Obliczanie czasu oczekiwania na podstawie lokalizacji
   - Wizualizacja obłożenia dla każdego przedziału

5. **Walidacja wielopoziomowa:**
   ```javascript
   isStepValid(step) {
     switch (step) {
       case 1: return categories.length > 0 && all problems filled
       case 2: return postalCode && city && street
       case 3: return name && phone
       case 4: return timeSlot
       case 5: return true (podsumowanie)
     }
   }
   ```

6. **Ochrona przed duplikacją:**
   ```javascript
   // Blokada wielokrotnego wysyłania
   if (isSubmitting) return;
   if (currentStep !== 5) return;
   ```

---

### **2. Backend API: `pages/api/rezerwacje.js`**

#### **Endpoint POST /api/rezerwacje:**

**Flow wykonania:**

```
1. WALIDACJA PODSTAWOWA
   ├─ Sprawdź: name, phone, address
   └─ Zwróć 400 jeśli brak wymaganych pól

2. TWORZENIE REKORDU REZERWACJI
   ├─ Generuj ID: Date.now()
   ├─ Zbierz dane z req.body:
   │   ├─ Dane klienta (name, phone, email, address)
   │   ├─ Urządzenia (categories[], brands[], devices[], problems[])
   │   ├─ Lokalizacja (clientLocation, postalCode, city, street)
   │   ├─ Dostępność (timeSlot, availabilitySlots[])
   │   └─ Zabudowa (hasBuiltIn[], hasDemontaz[], hasMontaz[])
   └─ Status: 'pending'

3. KONWERSJA NA KLIENT + ZAMÓWIENIE
   ├─ convertReservationToClientOrder(reservationData)
   ├─ Sprawdź czy klient istnieje (po userId lub phone)
   │   ├─ Jeśli TAK → Użyj existingClient
   │   └─ Jeśli NIE → addClient(clientData)
   └─ addOrder(orderData)
       ├─ Generuj orderNumber: ORD2025XXXXXX
       ├─ Link do klienta: order.clientId = client.id
       └─ Status: 'pending'

4. ZAPIS DO STORAGE
   ├─ addReservation(newReservation) → data/rezerwacje.json
   ├─ addClient(clientData) → data/clients.json (jeśli nowy)
   └─ addOrder(orderData) → data/orders.json

5. WYSYŁKA EMAIL (jeśli skonfigurowane)
   ├─ Sprawdź: RESEND_API_KEY
   ├─ Przygotuj HTML template:
   │   ├─ Header z potwierdzeniem
   │   ├─ Lista urządzeń (z ikonami SVG)
   │   ├─ Szczegóły zgłoszenia (adres, telefon, dostępność)
   │   ├─ Info o zabudowie (jeśli hasBuiltIn)
   │   └─ Footer z kontaktem
   ├─ POST https://api.resend.com/emails
   └─ Zwróć status: emailSent: true/false

6. NOTYFIKACJE
   ├─ createNotification(newClient)
   ├─ createNotification(newOrder)
   └─ createNotification(newReservation)

7. RESPONSE
   └─ Return 200 JSON:
       {
         message: 'Rezerwacja przyjęta',
         data: newReservation,
         order: { orderNumber, id },
         client: { id, name },
         emailSent: true/false,
         emailError: null/message
       }
```

#### **Kluczowe elementy API:**

1. **Duplikacja klientów - ZAPOBIEGANIE:**
   ```javascript
   // Priorytet 1: Szukaj po userId (zalogowany)
   if (isLoggedIn && userId) {
     existingClient = clients.find(c => c.userId === userId);
   }
   
   // Priorytet 2: Szukaj po telefonie
   if (!existingClient && clientPhone) {
     const normalized = phone.replace(/\s+/g, '').replace(/\+48/, '');
     existingClient = clients.find(c => 
       c.phone.normalized === normalized ||
       c.phones?.some(p => p.number.normalized === normalized)
     );
   }
   ```

2. **Multi-device handling:**
   - Konwersja `categories[]`, `brands[]`, `devices[]`, `problems[]`
   - Każde urządzenie jako osobny obiekt w `order.devices[]`
   - Każde urządzenie ma własne `hasBuiltIn`, `builtInParams`

3. **Geocoding storage:**
   ```javascript
   clientLocation: {
     address: "ul. Główna 123, 00-001 Warszawa",
     coordinates: { lat: 52.2297, lng: 21.0122 },
     accuracy: "ROOFTOP",
     confidence: 0.95
   }
   ```

4. **Email template - Dynamic:**
   - Ikony SVG dla każdego typu urządzenia
   - Dynamiczne generowanie listy urządzeń
   - Conditional rendering dla zabudowy
   - Responsive design

---

### **3. Konwersja: `utils/clientOrderStorage.js`**

#### **convertReservationToClientOrder(reservationData):**

**Transformacja danych:**

```javascript
INPUT (reservationData):
{
  name: "Jan Kowalski",
  phone: "123456789",
  email: "jan@example.com",
  address: "ul. Główna 123, 00-001 Warszawa",
  city: "Warszawa",
  street: "ul. Główna 123",
  postalCode: "00-001",
  
  categories: ["Pralka", "Zmywarka"],
  brands: ["Samsung", "Bosch"],
  devices: ["WW80T4020EE", "SMV46KX01E"],
  problems: ["Nie wiruje", "Nie myje naczyń"],
  
  hasBuiltIn: [false, true],
  hasDemontaz: [false, true],
  hasMontaz: [false, true],
  hasTrudnaZabudowa: [false, false],
  
  timeSlot: "Cały dzień",
  additionalNotes: "Najlepiej rano",
  
  clientLocation: {
    coordinates: { lat: 52.2297, lng: 21.0122 },
    accuracy: "ROOFTOP"
  },
  
  userId: null,
  isAuthenticated: false
}

OUTPUT ({ client, order }):
{
  client: {
    name: "Jan Kowalski",
    phone: "123456789",
    email: "jan@example.com",
    address: "ul. Główna 123, 00-001 Warszawa",
    city: "Warszawa",
    street: "ul. Główna 123",
    postalCode: "00-001",
    phones: [],
    addresses: [],
    userId: null,
    isAuthenticated: false,
    dateAdded: "2025-10-06T12:00:00.000Z",
    history: []
  },
  
  order: {
    clientId: null, // wypełnione po addClient()
    clientName: "Jan Kowalski",
    clientPhone: "123456789",
    email: "jan@example.com",
    address: "ul. Główna 123, 00-001 Warszawa",
    
    clientLocation: {
      coordinates: { lat: 52.2297, lng: 21.0122 }
    },
    latitude: 52.2297,
    longitude: 21.0122,
    
    deviceType: "Pralka", // pierwszy z categories
    brand: "Samsung", // pierwszy z brands
    model: "WW80T4020EE", // pierwszy z devices
    description: "Nie wiruje", // pierwszy z problems
    
    devices: [
      {
        name: "Pralka",
        brand: "Samsung",
        model: "WW80T4020EE",
        serialNumber: "",
        description: "Nie wiruje",
        hasBuiltIn: false,
        builtInParams: { demontaz: false, montaz: false, ... }
      },
      {
        name: "Zmywarka",
        brand: "Bosch",
        model: "SMV46KX01E",
        serialNumber: "",
        description: "Nie myje naczyń",
        hasBuiltIn: true,
        builtInParams: { demontaz: true, montaz: true, trudna: false }
      }
    ],
    
    availability: "Cały dzień",
    scheduledDate: null,
    scheduledTime: null,
    
    status: "pending",
    priority: "medium",
    visits: [],
    dates: [],
    hours: null
  }
}
```

---

## ⚠️ PROBLEMY Z OBECNYM ROZWIĄZANIEM

### **Problem 1: Za długi proces (5 kroków)**

**Obecna sytuacja:**
- Pracownik biura rozmawia z klientem przez telefon
- Musi wypełnić 5 osobnych ekranów
- Musi klikać "Dalej" 4 razy
- Musi przejść przez podsumowanie

**Konsekwencje:**
- ⏱️ Długi czas rozmowy (5-10 minut)
- 😓 Frustracja klienta (długie oczekiwanie)
- ❌ Większe ryzyko błędów (pośpiech)
- 📞 Klient może się rozłączyć przed końcem

---

### **Problem 2: Brak możliwości szybkiego wpisywania**

**Obecna sytuacja:**
- Marka: autocomplete wymaga kliknięcia
- Problem: autocomplete wymaga kliknięcia
- Dostępność: przyciski checkbox (nie można wpisać tekstem)

**Konsekwencje:**
- 🖱️ Wymaga używania myszki (wolniejsze niż klawiatura)
- ⏱️ Dodatkowy czas na klikanie sugestii
- 😤 Brak flow "szybkiego wpisywania"

---

### **Problem 3: AI Scanner niepotrzebny podczas rozmowy**

**Obecna sytuacja:**
- Przycisk "Zeskanuj tabliczkę AI" widoczny
- Wymaga zdjęcia tabliczki
- Klient nie ma zdjęcia podczas rozmowy

**Konsekwencje:**
- 🤷 Funkcja nieużywana w tym kontekście
- 📱 Mylący interfejs (sugeruje że potrzebne zdjęcie)
- ⏱️ Zajmuje miejsce na ekranie

---

### **Problem 4: Real-time availability niepotrzebne**

**Obecna sytuacja:**
- Fetch `/api/availability` przy przejściu do kroku 4
- Obliczanie czasu oczekiwania
- Progress bary z obłożeniem

**Konsekwencje:**
- ⏱️ Dodatkowe opóźnienie (ładowanie danych)
- 🌐 Zbędne wywołanie API
- 📊 Klient i tak poda swoją dostępność ustnie

---

### **Problem 5: Brak kontekstu "pracownik biura"**

**Obecna sytuacja:**
- Formularz zakłada że wypełnia go klient
- Teksty: "Twoje dane", "Twój adres"
- Brak pól admin: "Źródło", "Priorytet", "Notatki wewnętrzne"

**Konsekwencje:**
- 🤔 Mylący dla pracownika (to nie są "moje" dane)
- 📝 Brak miejsca na notatki z rozmowy
- 🏷️ Brak możliwości oznaczenia źródła ("telefon", "email", "chat")

---

## ✅ PROPOZYCJA ROZWIĄZANIA

### **OPCJA 1: Nowy formularz "Express" (Rekomendowane)**

#### **Architektura:**

```
POJEDYNCZY EKRAN - wszystkie pola widoczne jednocześnie

┌─────────────────────────────────────────────────────────┐
│  📞 Nowe Zgłoszenie Telefoniczne                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  👤 DANE KLIENTA                                         │
│  ├─ Imię i nazwisko: [________________] *               │
│  ├─ Telefon:        [________________] *               │
│  └─ Email:          [________________] (opcjonalnie)   │
│                                                          │
│  📍 LOKALIZACJA                                          │
│  ├─ Kod pocztowy:   [______]                            │
│  ├─ Miasto:         [________________] *               │
│  └─ Ulica i numer:  [________________] *               │
│                                                          │
│  🔧 URZĄDZENIE (możesz dodać więcej)                     │
│  ╔═════════════════════════════════════════════╗        │
│  ║ Urządzenie #1                              ║        │
│  ║ ├─ Typ:     [Dropdown▼] *                  ║        │
│  ║ ├─ Marka:   [________________]             ║        │
│  ║ ├─ Model:   [________________]             ║        │
│  ║ ├─ Problem: [____________________________] ║        │
│  ║ └─ ☑ W zabudowie  ☐ Trudna zabudowa       ║        │
│  ╚═════════════════════════════════════════════╝        │
│  [+ Dodaj kolejne urządzenie]                           │
│                                                          │
│  🕒 DOSTĘPNOŚĆ                                           │
│  ├─ Preferowany termin: [Dropdown▼]                     │
│  └─ Dodatkowe uwagi:    [____________________________]  │
│                                                          │
│  📝 NOTATKI WEWNĘTRZNE (widoczne tylko dla zespołu)     │
│  └─ [____________________________________________]       │
│                                                          │
│  ⚙️ OPCJE ZAAWANSOWANE                                  │
│  ├─ Priorytet:   ( ) Niski  (•) Normalny  ( ) Wysoki  │
│  └─ Źródło:      (•) Telefon  ( ) Email  ( ) Wizyta    │
│                                                          │
│  [Anuluj]            [Wyślij zgłoszenie] 🚀            │
└─────────────────────────────────────────────────────────┘
```

#### **Kluczowe zmiany:**

1. **Jeden ekran - wszystkie pola:**
   - Żadnych "kroków"
   - Żadnych "Dalej", "Wstecz"
   - Wszystko widoczne od razu

2. **Uproszczone pola:**
   - Typ urządzenia: dropdown (nie checkbox grid)
   - Dostępność: dropdown (nie fancy karty)
   - Brak AI Scanner
   - Brak real-time availability

3. **Nowe pola admin:**
   - Priorytet (radio buttons)
   - Źródło zgłoszenia (radio buttons)
   - Notatki wewnętrzne (textarea)

4. **Multi-device simplified:**
   - Domyślnie jedno urządzenie
   - Przycisk "+ Dodaj kolejne" jeśli potrzeba
   - Możliwość usunięcia

5. **Walidacja on-the-fly:**
   - Real-time sprawdzanie wymaganych pól
   - Czerwone obramowanie jeśli błąd
   - Przycisk "Wyślij" aktywny tylko gdy valid

#### **Implementacja:**

**Nowy plik:** `pages/admin/nowe-zgloszenie.js`

```javascript
import { useState } from 'react';

export default function NoweZgloszenie() {
  const [formData, setFormData] = useState({
    // Klient
    name: '',
    phone: '',
    email: '',
    
    // Lokalizacja
    postalCode: '',
    city: '',
    street: '',
    
    // Urządzenia (array)
    devices: [{
      type: '',
      brand: '',
      model: '',
      problem: '',
      hasBuiltIn: false,
      hasTrudnaZabudowa: false
    }],
    
    // Dostępność
    availability: '',
    notes: '',
    
    // Admin
    priority: 'normal',
    source: 'phone',
    internalNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Dodaj urządzenie
  const addDevice = () => {
    setFormData(prev => ({
      ...prev,
      devices: [...prev.devices, {
        type: '',
        brand: '',
        model: '',
        problem: '',
        hasBuiltIn: false,
        hasTrudnaZabudowa: false
      }]
    }));
  };

  // Usuń urządzenie
  const removeDevice = (index) => {
    setFormData(prev => ({
      ...prev,
      devices: prev.devices.filter((_, i) => i !== index)
    }));
  };

  // Update device field
  const updateDevice = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      devices: prev.devices.map((device, i) => 
        i === index ? { ...device, [field]: value } : device
      )
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/rezerwacje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Konwersja devices array na stary format dla API
          categories: formData.devices.map(d => d.type),
          brands: formData.devices.map(d => d.brand),
          devices: formData.devices.map(d => d.model),
          problems: formData.devices.map(d => d.problem),
          hasBuiltIn: formData.devices.map(d => d.hasBuiltIn),
          hasTrudnaZabudowa: formData.devices.map(d => d.hasTrudnaZabudowa),
          
          // Dodatkowe pola
          timeSlot: formData.availability,
          additionalNotes: formData.notes,
          
          // Admin fields
          priority: formData.priority,
          source: formData.source,
          createdBy: 'admin',
          createdVia: 'phone'
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ Zgłoszenie utworzone!\nNumer: ${result.order?.orderNumber}`);
        // Reset form
        // ...
      } else {
        setMessage(`❌ Błąd: ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Błąd: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📞 Nowe Zgłoszenie Telefoniczne</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DANE KLIENTA */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">👤 Dane Klienta</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Imię i nazwisko *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="tel"
              placeholder="Telefon *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-3 py-2 border rounded"
            />
          </div>
        </section>

        {/* LOKALIZACJA */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">📍 Lokalizacja</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Kod pocztowy"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Miasto *"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Ulica i numer *"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              required
              className="px-3 py-2 border rounded md:col-span-1"
            />
          </div>
        </section>

        {/* URZĄDZENIA */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">🔧 Urządzenia</h2>
          {formData.devices.map((device, index) => (
            <div key={index} className="border p-4 rounded mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Urządzenie #{index + 1}</span>
                {formData.devices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDevice(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Usuń
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={device.type}
                  onChange={(e) => updateDevice(index, 'type', e.target.value)}
                  required
                  className="px-3 py-2 border rounded"
                >
                  <option value="">Wybierz typ *</option>
                  <option value="Pralka">Pralka</option>
                  <option value="Zmywarka">Zmywarka</option>
                  <option value="Lodówka">Lodówka</option>
                  <option value="Piekarnik">Piekarnik</option>
                  <option value="Suszarka">Suszarka</option>
                  <option value="Kuchenka">Kuchenka</option>
                  <option value="Mikrofalówka">Mikrofalówka</option>
                  <option value="Okap">Okap</option>
                  <option value="Inne AGD">Inne AGD</option>
                </select>
                <input
                  type="text"
                  placeholder="Marka"
                  value={device.brand}
                  onChange={(e) => updateDevice(index, 'brand', e.target.value)}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Model"
                  value={device.model}
                  onChange={(e) => updateDevice(index, 'model', e.target.value)}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Opis problemu *"
                  value={device.problem}
                  onChange={(e) => updateDevice(index, 'problem', e.target.value)}
                  required
                  className="px-3 py-2 border rounded"
                />
              </div>
              <div className="mt-3 flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={device.hasBuiltIn}
                    onChange={(e) => updateDevice(index, 'hasBuiltIn', e.target.checked)}
                    className="mr-2"
                  />
                  W zabudowie
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={device.hasTrudnaZabudowa}
                    onChange={(e) => updateDevice(index, 'hasTrudnaZabudowa', e.target.checked)}
                    className="mr-2"
                  />
                  Trudna zabudowa
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addDevice}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            + Dodaj kolejne urządzenie
          </button>
        </section>

        {/* DOSTĘPNOŚĆ */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">🕒 Dostępność</h2>
          <div className="space-y-3">
            <select
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Wybierz dostępność *</option>
              <option value="Cały dzień">Cały dzień (8:00-20:00)</option>
              <option value="8:00-12:00">Rano (8:00-12:00)</option>
              <option value="12:00-16:00">Popołudnie (12:00-16:00)</option>
              <option value="16:00-20:00">Wieczór (16:00-20:00)</option>
              <option value="Weekend">Weekend</option>
              <option value="Po 15:00">Po 15:00</option>
            </select>
            <textarea
              placeholder="Dodatkowe uwagi (np. 'Najlepiej dzwonić wieczorem')"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </section>

        {/* NOTATKI WEWNĘTRZNE */}
        <section className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-lg font-semibold mb-4">📝 Notatki Wewnętrzne</h2>
          <textarea
            placeholder="Notatki z rozmowy (widoczne tylko dla zespołu)"
            value={formData.internalNotes}
            onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded"
          />
        </section>

        {/* OPCJE ADMIN */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">⚙️ Opcje Zaawansowane</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Priorytet:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="low"
                    checked={formData.priority === 'low'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mr-2"
                  />
                  Niski
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="normal"
                    checked={formData.priority === 'normal'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mr-2"
                  />
                  Normalny
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="high"
                    checked={formData.priority === 'high'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mr-2"
                  />
                  Wysoki
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Źródło:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="phone"
                    checked={formData.source === 'phone'}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="mr-2"
                  />
                  Telefon
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="email"
                    checked={formData.source === 'email'}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="mr-2"
                  />
                  Email
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="visit"
                    checked={formData.source === 'visit'}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="mr-2"
                  />
                  Wizyta
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* MESSAGE */}
        {message && (
          <div className={`p-4 rounded ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <pre className="whitespace-pre-wrap font-sans">{message}</pre>
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 rounded font-semibold ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Wysyłam...' : 'Wyślij zgłoszenie 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

### **OPCJA 2: Tryb "Express" w istniejącym formularzu**

#### **Modyfikacja `pages/rezerwacja.js`:**

Dodać parametr URL `?mode=express` który:

1. **Wyłącza wieloetapowość:**
   ```javascript
   const isExpressMode = router.query.mode === 'express';
   
   // Zawsze wyświetl wszystko na jednym ekranie
   const currentStep = isExpressMode ? 5 : normalStep;
   ```

2. **Ukrywa zbędne elementy:**
   ```javascript
   {!isExpressMode && <ProgressBar />}
   {!isExpressMode && <AIScanner />}
   {!isExpressMode && <RealTimeAvailability />}
   ```

3. **Upraszcza UI:**
   - Dropdown zamiast checkbox grid dla typu
   - Dropdown zamiast kart dla dostępności
   - Textarea zamiast autocomplete dla problemu

4. **Dodaje pola admin:**
   ```javascript
   {isExpressMode && (
     <>
       <InternalNotes />
       <PrioritySelector />
       <SourceSelector />
     </>
   )}
   ```

**Zalety:**
- ✅ Wykorzystuje istniejący backend
- ✅ Szybsze wdrożenie
- ✅ Brak duplikacji kodu

**Wady:**
- ❌ Komplikuje logikę formularza
- ❌ Trudniejszy maintainance
- ❌ Ryzyko regresji

---

## 🎯 REKOMENDACJA

**✅ OPCJA 1 - Nowy formularz "Express"**

### **Uzasadnienie:**

1. **Separation of concerns:**
   - Formularz klienta `/rezerwacja` - 5 kroków, fancy UI
   - Formularz admin `/admin/nowe-zgloszenie` - 1 ekran, szybki

2. **Optymalizacja dla przypadku użycia:**
   - Klient: ma czas, chce ładny interfejs
   - Admin: pośpiech, potrzebuje efektywności

3. **Łatwiejszy maintenance:**
   - Dwa osobne pliki = jasne zadania
   - Zmiana w jednym nie wpływa na drugi
   - Łatwiejsze testowanie

4. **Możliwość rozbudowy:**
   - Admin może mieć dodatkowe funkcje (szybki lookup klienta)
   - Można dodać keyboard shortcuts
   - Można dodać auto-save draft

---

## 📝 PLAN IMPLEMENTACJI

### **Krok 1: Utworzenie nowego formularza (1-2h)**

**Plik:** `pages/admin/nowe-zgloszenie.js`

**Tasks:**
- [ ] Skopiuj strukturę state z `/rezerwacja.js`
- [ ] Zmień layout na single-screen
- [ ] Dodaj pola admin (priority, source, internalNotes)
- [ ] Uprość UI (dropdowny zamiast fancy widgets)
- [ ] Usuń AI Scanner, availability check

---

### **Krok 2: Dodanie linku w nawigacji (15min)**

**Lokalizacja:** Menu admin (sidebar/topbar)

```javascript
<Link href="/admin/nowe-zgloszenie">
  <button className="...">
    📞 Nowe Zgłoszenie
  </button>
</Link>
```

---

### **Krok 3: Modyfikacja API (30min)**

**Plik:** `pages/api/rezerwacje.js`

**Zmiany:**
- Sprawdź obecność `source`, `priority`, `internalNotes`
- Zapisz w `order.metadata` lub `order.adminNotes`
- Nie wysy łaj emaila jeśli `source !== 'form'`

```javascript
if (req.body.source && req.body.source !== 'form') {
  // Skip email - to jest telefoniczne zgłoszenie
  console.log('⏭️ Skipping email - admin-created order');
}
```

---

### **Krok 4: Testowanie (30min)**

**Scenariusze:**
1. Wypełnij wszystkie pola → Wyślij → Sprawdź `orders.json`
2. Pomiń opcjonalne pola → Wyślij → Sprawdź czy zadziałało
3. Dodaj 3 urządzenia → Wyślij → Sprawdź `devices[]`
4. Wybierz "W zabudowie" → Wyślij → Sprawdź `hasBuiltIn`

---

### **Krok 5: Dokumentacja (15min)**

**Plik:** `INSTRUKCJA_ZGLOSZENIA_TELEFONICZNE.md`

**Treść:**
```markdown
# Jak przyjąć zgłoszenie telefoniczne

1. Przejdź do: `/admin/nowe-zgloszenie`
2. Wypełnij dane podczas rozmowy z klientem
3. Wszystkie pola są na jednym ekranie
4. Pola wymagane oznaczone gwiazdką (*)
5. Kliknij "Wyślij zgłoszenie"
6. Skopiuj numer zamówienia i podaj klientowi
```

---

## 🚀 CZAS WDROŻENIA

**Całkowity czas: 3-4 godziny**

- Krok 1: 1-2h (nowy formularz)
- Krok 2: 15min (link w menu)
- Krok 3: 30min (API changes)
- Krok 4: 30min (testing)
- Krok 5: 15min (docs)

---

## 📊 PORÓWNANIE CZASU OBSŁUGI

### **Przed (5-krokowy formularz):**
```
1. Dane urządzenia: 2 min (wybór typu, marka, model, problem)
2. Lokalizacja: 1 min (kod, miasto, ulica)
3. Dane kontaktowe: 1 min (imię, telefon, email)
4. Dostępność: 1 min (wybór przedziału + loading API)
5. Podsumowanie: 30s (przegląd + submit)
─────────────────────────────────────────────────────
TOTAL: ~5.5 minuty
```

### **Po (express formularz):**
```
Wszystko na jednym ekranie: 2-3 minuty
(równoległe wypełnianie podczas rozmowy)
─────────────────────────────────────────────────────
TOTAL: ~2.5 minuty

OSZCZĘDNOŚĆ: 3 minuty (54% szybciej!)
```

---

## ✅ GOTOWE DO IMPLEMENTACJI

Czy mogę rozpocząć tworzenie nowego formularza "Express"?

1. ✅ Stworzę `pages/admin/nowe-zgloszenie.js`
2. ✅ Dodam link w menu admin
3. ✅ Zmodyfikuję API aby obsługiwało admin fields
4. ✅ Stworzę dokumentację

**Potwierdź, a zacznę implementację! 🚀**
