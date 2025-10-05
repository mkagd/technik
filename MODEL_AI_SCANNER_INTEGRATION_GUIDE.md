# 📸 Przewodnik Integracji ModelAIScanner - Analizator Tabliczek AGD

## 🎯 Cel
Dodanie **ModelAIScanner** (analizator tabliczek znamionowych z wykrywaniem AMICA kuchenka/piekarnik/indukcja) do wszystkich kluczowych miejsc w aplikacji.

## ✨ Funkcje ModelAIScanner

- 📷 **Skanowanie z kamery** - bezpośrednie zdjęcie tabliczki
- 📁 **Upload z galerii** - wybór zdjęcia z pliku
- 🤖 **GPT-4o Mini Vision API** - rozpoznawanie tekstu i wykrywanie modelu
- 🏭 **Inteligentne wykrywanie AMICA**:
  - `PI...` lub "indukcyj" → **Płyta indukcyjna**
  - `PC...` lub "ceramiczn" → **Płyta ceramiczna**  
  - `PG...` lub "gazow" → **Płyta gazowa**
  - "piekarnik" lub "oven" → **Piekarnik**
  - "kuchenka" → **Kuchenka**
  - `OKA/OKC` lub "okap" → **Okap kuchenny**
- 💾 **Zapis zdjęć** - lokalne (localStorage) + serwer
- 📊 **Dopasowanie do bazy** - sprawdzanie modelu w `modelsDatabase.json`

---

## 📍 Miejsca do Implementacji

### 1. ✅ **GOTOWE** - `/admin/wizyty/index.js`
Już zaimplementowane przez `ModelManagerModal`.

### 2. 🔄 **PRIORYTET 1** - `/technician/visit/[visitId].js`
**Panel technika - szczegóły wizyty**

### 3. 🔄 **PRIORYTET 2** - `/zlecenie-szczegoly.js`
**Szczegóły zlecenia - admin/technik**

### 4. 🔄 **PRIORYTET 3** - `/rezerwacja-nowa.js`
**Formularz rezerwacji klienta**

### 5. 🔄 **PRIORYTET 4** - `/mapa.js`
**Dodawanie klienta z mapy**

---

## 🔧 Implementacja - Panel Technika

### Krok 1: Dodaj import

```javascript
// pages/technician/visit/[visitId].js
import ModelAIScanner from '../../../components/ModelAIScanner';
```

### Krok 2: Dodaj state dla modalu

```javascript
export default function VisitDetailsPage() {
  // ... inne state
  const [showModelScanner, setShowModelScanner] = useState(false);
```

### Krok 3: Dodaj handler dla wykrytego modelu

```javascript
  // Handler dla ModelAIScanner - wykryty model z tabliczki
  const handleModelDetected = async (models) => {
    if (!models || models.length === 0) {
      alert('❌ Nie wykryto modelu na tabliczce');
      return;
    }
    
    const detectedModel = models[0];
    console.log('🔍 Wykryto model z tabliczki:', detectedModel);
    
    try {
      const token = localStorage.getItem('technicianToken');
      
      // Aktualizuj dane urządzenia w wizycie
      const response = await fetch(`/api/technician/visits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visitId: visit.id,
          device: {
            type: detectedModel.type || detectedModel.finalType || 'Nieznany',
            brand: detectedModel.brand || 'Nieznana',
            model: detectedModel.model || detectedModel.finalModel || 'Nieznany',
            serialNumber: detectedModel.serialNumber || ''
          }
        })
      });

      if (response.ok) {
        await loadVisitDetails(); // Odśwież dane wizyty
        
        const deviceInfo = `${detectedModel.brand} ${detectedModel.model || detectedModel.finalModel}`;
        const typeInfo = detectedModel.type || detectedModel.finalType;
        alert(`✅ Rozpoznano urządzenie:\n${deviceInfo}\nTyp: ${typeInfo}`);
      } else {
        throw new Error('Błąd aktualizacji');
      }
    } catch (error) {
      console.error('❌ Error updating device from scanner:', error);
      alert('❌ Błąd zapisu danych urządzenia');
    }
    
    setShowModelScanner(false);
  };
```

### Krok 4: Dodaj przycisk w sekcji Urządzenie

```javascript
{/* Device card */}
<div className="bg-white rounded-lg shadow-sm p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      Urządzenie
    </h2>
    
    {/* PRZYCISK SKANOWANIA */}
    <button
      onClick={() => setShowModelScanner(true)}
      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Zeskanuj tabliczkę
    </button>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
    {/* ... existing device fields ... */}
  </div>
</div>
```

### Krok 5: Dodaj modal na końcu return()

```javascript
      {/* ModelAIScanner Modal */}
      {showModelScanner && (
        <ModelAIScanner
          isOpen={showModelScanner}
          onClose={() => setShowModelScanner(false)}
          onModelDetected={handleModelDetected}
        />
      )}
    </div>
  );
}
```

---

## 🔧 Implementacja - Zlecenie Szczegóły

### Kod dla `/zlecenie-szczegoly.js`

```javascript
// 1. Import
import ModelAIScanner from '../components/ModelAIScanner';

// 2. State
const [showModelScanner, setShowModelScanner] = useState(false);

// 3. Handler
const handleModelDetected = async (models) => {
  if (!models || models.length === 0) return;
  
  const detectedModel = models[0];
  
  // Aktualizuj dane zlecenia
  setOrderDetails(prev => ({
    ...prev,
    device: {
      ...prev.device,
      type: detectedModel.type || detectedModel.finalType,
      brand: detectedModel.brand,
      model: detectedModel.model || detectedModel.finalModel,
      serialNumber: detectedModel.serialNumber
    }
  }));
  
  alert(`✅ Rozpoznano: ${detectedModel.brand} ${detectedModel.model}`);
  setShowModelScanner(false);
};

// 4. Przycisk przy urządzeniu
<button
  onClick={() => setShowModelScanner(true)}
  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
>
  📷 Zeskanuj tabliczkę
</button>

// 5. Modal
{showModelScanner && (
  <ModelAIScanner
    isOpen={showModelScanner}
    onClose={() => setShowModelScanner(false)}
    onModelDetected={handleModelDetected}
  />
)}
```

---

## 🔧 Implementacja - Rezerwacja Nowa

### Kod dla `/rezerwacja-nowa.js`

```javascript
// 1. Import
import ModelAIScanner from '../components/ModelAIScanner';

// 2. State
const [showModelScanner, setShowModelScanner] = useState(false);
const [scanningDeviceIndex, setScanningDeviceIndex] = useState(null);

// 3. Handler
const handleModelDetected = (models) => {
  if (!models || models.length === 0 || scanningDeviceIndex === null) return;
  
  const detectedModel = models[0];
  
  // Auto-fill brand i model dla wybranego urządzenia
  const newBrands = [...formData.brands];
  const newDevices = [...formData.devices];
  
  newBrands[scanningDeviceIndex] = detectedModel.brand;
  newDevices[scanningDeviceIndex] = detectedModel.model || detectedModel.finalModel;
  
  setFormData(prev => ({
    ...prev,
    brands: newBrands,
    devices: newDevices
  }));
  
  alert(`✅ Wypełniono: ${detectedModel.brand} ${detectedModel.model}`);
  setShowModelScanner(false);
  setScanningDeviceIndex(null);
};

// 4. Przycisk przy każdym urządzeniu (w pętli categories)
<button
  onClick={() => {
    setScanningDeviceIndex(index);
    setShowModelScanner(true);
  }}
  className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200"
>
  📷 Skanuj
</button>

// 5. Modal
{showModelScanner && (
  <ModelAIScanner
    isOpen={showModelScanner}
    onClose={() => {
      setShowModelScanner(false);
      setScanningDeviceIndex(null);
    }}
    onModelDetected={handleModelDetected}
  />
)}
```

---

## 🔧 Implementacja - Mapa

### Kod dla `/mapa.js`

```javascript
// 1. Import
import ModelAIScanner from '../components/ModelAIScanner';

// 2. State
const [showModelScanner, setShowModelScanner] = useState(false);

// 3. Handler
const handleModelDetected = (models) => {
  if (!models || models.length === 0) return;
  
  const detectedModel = models[0];
  
  // Auto-fill device field
  const deviceInfo = `${detectedModel.brand} ${detectedModel.model || detectedModel.finalModel} (${detectedModel.type || detectedModel.finalType})`;
  
  setNewClientForm(prev => ({
    ...prev,
    device: deviceInfo,
    // Opcjonalnie dodaj do serviceType jeśli jest type
    serviceType: prev.serviceType || detectedModel.type || detectedModel.finalType
  }));
  
  alert(`✅ Rozpoznano urządzenie: ${deviceInfo}`);
  setShowModelScanner(false);
};

// 4. Przycisk w formularzu nowego klienta
<div className="flex gap-2">
  <input
    type="text"
    value={newClientForm.device}
    onChange={(e) => handleNewClientChange('device', e.target.value)}
    placeholder="Urządzenie"
    className="flex-1 px-3 py-2 border rounded"
  />
  <button
    onClick={() => setShowModelScanner(true)}
    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    title="Zeskanuj tabliczkę"
  >
    📷
  </button>
</div>

// 5. Modal
{showModelScanner && (
  <ModelAIScanner
    isOpen={showModelScanner}
    onClose={() => setShowModelScanner(false)}
    onModelDetected={handleModelDetected}
  />
)}
```

---

## 📊 Struktura Danych Wykrytego Modelu

```javascript
{
  // Podstawowe dane
  brand: "AMICA",
  model: "PIC5512B3", // lub finalModel
  type: "Płyta indukcyjna", // lub finalType
  serialNumber: "ABC123456",
  
  // Dodatkowe informacje
  confidence: "high", // high/medium/low
  source: "ai_database", // ai_database/ai_new/similarity/ocr
  capacity: "9 kg",
  additionalInfo: "Cały tekst z tabliczki...",
  
  // Części (jeśli znaleziono w bazie)
  common_parts: [
    {
      name: "Pompa odpływowa",
      part_number: "00144978",
      price: 89.99,
      availability: "Na stanie"
    }
  ]
}
```

---

## 🎯 Scenariusze Użycia

### Scenariusz 1: Technik na wizycie
1. Otwiera `/technician/visit/123`
2. Klika "Zeskanuj tabliczkę"
3. Robi zdjęcie tabliczki kuchenki AMICA
4. AI rozpoznaje: **AMICA PIC5512B3 - Płyta indukcyjna**
5. Dane automatycznie zapisują się do wizyty
6. Technik widzi zaktualizowane informacje

### Scenariusz 2: Klient składa rezerwację
1. Wypełnia formularz `/rezerwacja-nowa`
2. Przy urządzeniu klika "Skanuj"
3. Uploaduje zdjęcie z galerii
4. AI rozpoznaje markę i model
5. Pola automatycznie się wypełniają

### Scenariusz 3: Admin dodaje zlecenie
1. Otwiera `/zlecenie-szczegoly`
2. Skanuje tabliczkę urządzenia
3. Wszystkie dane (marka/model/typ/SN) auto-fill
4. Oszczędność czasu na ręcznym wpisywaniu

---

## 🐛 Testowanie

### Test 1: Kuchenka AMICA
```
Tabliczka: "TYPE: PIC5512B3 AMICA Płyta indukcyjna"
Oczekiwany wynik:
- brand: "AMICA"
- model: "PIC5512B3"
- type: "Płyta indukcyjna"
```

### Test 2: Piekarnik AMICA
```
Tabliczka: "TYP: EB81005A AMICA"
Oczekiwany wynik:
- brand: "AMICA"
- model: "EB81005A"
- type: "Piekarnik"
```

### Test 3: Pralka Samsung
```
Tabliczka: "Samsung WW90T4540AE 9kg"
Oczekiwany wynik:
- brand: "SAMSUNG"
- model: "WW90T4540AE"
- type: "Pralka ładowana od przodu"
- capacity: "9 kg"
```

---

## 📝 TODO List

- [ ] Zaimplementować w `/technician/visit/[visitId].js`
- [ ] Zaimplementować w `/zlecenie-szczegoly.js`
- [ ] Zaimplementować w `/rezerwacja-nowa.js`
- [ ] Zaimplementować w `/mapa.js`
- [ ] Przetestować z prawdziwymi tabliczkami AMICA
- [ ] Dodać toast notifications zamiast alert()
- [ ] Stworzyć dokumentację użytkownika
- [ ] Nagrać video tutorial

---

## 🔗 Powiązane Pliki

- `components/ModelAIScanner.js` - Główny komponent skanera
- `components/ModelManagerModal.js` - Wrapper z ModelAIScanner
- `pages/api/openai-vision.js` - API endpoint GPT-4o Mini Vision
- `data/modelsDatabase.json` - Baza modeli AGD
- `utils/scanner-server-integration.js` - Zapis zdjęć na serwer

---

## ✅ Status Implementacji

| Miejsce | Status | Priorytet | Uwagi |
|---------|--------|-----------|-------|
| `/admin/wizyty` | ✅ GOTOWE | - | Przez ModelManagerModal |
| `/technician/visit` | 🔄 TODO | 🔴 HIGH | Najważniejsze dla techników |
| `/zlecenie-szczegoly` | 🔄 TODO | 🟡 MEDIUM | Admin + technik |
| `/rezerwacja-nowa` | 🔄 TODO | 🟢 LOW | Nice-to-have dla klientów |
| `/mapa` | 🔄 TODO | 🟢 LOW | Rzadko używane |

---

**Data utworzenia:** 2025-10-04  
**Autor:** AI Assistant (GitHub Copilot)  
**Wersja:** 1.0
