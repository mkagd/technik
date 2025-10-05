/**
 * ✅ GOTOWY DO WKLEJENIA - Panel Technika z ModelAIScanner
 * 
 * Ten plik zawiera wszystkie modyfikacje potrzebne do dodania ModelAIScanner
 * do pages/technician/visit/[visitId].js
 * 
 * INSTRUKCJA:
 * 1. Otwórz pages/technician/visit/[visitId].js
 * 2. Dodaj import (LINIA 8)
 * 3. Dodaj state (LINIA 24)
 * 4. Dodaj handler (po funkcji formatDateTime, ~LINIA 150)
 * 5. Zmień nagłówek "Urządzenie" (LINIA ~330)
 * 6. Dodaj modal na końcu return() (przed zamknięciem </div>)
 */

// ============================================
// 1. DODAJ IMPORT (po innych importach, linia ~8)
// ============================================

import ModelAIScanner from '../../../components/ModelAIScanner';


// ============================================
// 2. DODAJ STATE (po innych state, linia ~24)
// ============================================

const [showModelScanner, setShowModelScanner] = useState(false);


// ============================================
// 3. DODAJ HANDLER (po formatDateTime, linia ~150)
// ============================================

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


// ============================================
// 4. ZMIEŃ NAGŁÓWEK "Urządzenie" (linia ~330)
// ============================================

// ZASTĄP TO:
/*
{/* Device card *\/}
<div className="bg-white rounded-lg shadow-sm p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
    Urządzenie
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
*/

// NA TO:

{/* Device card */}
<div className="bg-white rounded-lg shadow-sm p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      Urządzenie
    </h2>
    
    {/* ✨ NOWY PRZYCISK SKANOWANIA */}
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
    {/* ... reszta bez zmian ... */}


// ============================================
// 5. DODAJ MODAL (na końcu return(), przed </div>)
// ============================================

// Znajdź koniec funkcji VisitDetailsPage, przed zamknięciem głównego </div>
// Dodaj to tuż przed ostatnim </div>:

      {/* ModelAIScanner Modal - Skanowanie tabliczek AGD */}
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


// ============================================
// PRZYKŁAD UŻYCIA
// ============================================

/*
1. Technik otwiera wizytę
2. Widzi przycisk "Zeskanuj tabliczkę" 
3. Klika przycisk
4. Robi zdjęcie tabliczki AMICA PIC5512B3
5. AI rozpoznaje:
   - Marka: AMICA
   - Model: PIC5512B3  
   - Typ: Płyta indukcyjna
6. Dane zapisują się do wizyty
7. Odświeża się widok z nowymi danymi
*/


// ============================================
// TESTOWANIE
// ============================================

/*
Test 1: Kuchenka AMICA
- Zrób zdjęcie tabliczki z "TYPE: PIC5512B3"
- Powinno wykryć: AMICA PIC5512B3 - Płyta indukcyjna

Test 2: Piekarnik
- Zrób zdjęcie z napisem "oven" lub "piekarnik"
- Powinno wykryć typ: Piekarnik

Test 3: Pralka Samsung
- Zrób zdjęcie tabliczki Samsung WW90T4540AE
- Powinno wykryć: Samsung WW90T4540AE - Pralka
*/


// ============================================
// API ENDPOINT - /api/technician/visits (PUT)
// ============================================

/*
Upewnij się że endpoint akceptuje:

PUT /api/technician/visits
{
  "visitId": "123",
  "device": {
    "type": "Płyta indukcyjna",
    "brand": "AMICA",
    "model": "PIC5512B3",
    "serialNumber": "ABC123"
  }
}

Jeśli nie ma tego endpointa, dodaj w pages/api/technician/visits.js:

if (req.method === 'PUT') {
  const { visitId, device } = req.body;
  
  // Znajdź wizytę
  const visitIndex = visits.findIndex(v => v.id === visitId);
  if (visitIndex === -1) {
    return res.status(404).json({ error: 'Wizyta nie znaleziona' });
  }
  
  // Aktualizuj device
  visits[visitIndex].device = {
    ...visits[visitIndex].device,
    ...device
  };
  
  // Zapisz
  fs.writeFileSync(visitsPath, JSON.stringify(visits, null, 2));
  
  return res.status(200).json({ 
    success: true, 
    visit: visits[visitIndex] 
  });
}
*/
