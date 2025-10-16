// components/NorthPartsBrowser.js
// 🛒 Komponent do przeglądania i zamawiania części z North.pl

import { useState, useEffect } from 'react';

export default function NorthPartsBrowser({ 
  deviceType, 
  deviceBrand, 
  onAddPart, 
  onClose 
}) {
  const [northUrl, setNorthUrl] = useState('');
  const [selectedPart, setSelectedPart] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Formularz dodawania części
  const [partData, setPartData] = useState({
    name: '',
    partNumber: '',
    price: '',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    // Generuj link do North.pl na podstawie urządzenia
    const url = generateNorthUrl(deviceType, deviceBrand);
    setNorthUrl(url);
  }, [deviceType, deviceBrand]);

  // 🔗 Generuj link do North.pl
  const generateNorthUrl = (type, brand) => {
    const baseUrl = 'https://north.pl/czesci-agd';
    
    // Mapowanie typów urządzeń na kategorie North.pl
    const deviceCategories = {
      'Pralka': 'czesci-do-pralek',
      'Pralka automatyczna': 'czesci-do-pralek',
      'Zmywarka': 'czesci-do-zmywarek',
      'Lodówka': 'czesci-do-lodowek',
      'Lodowka': 'czesci-do-lodowek',
      'Chłodziarka': 'czesci-do-lodowek',
      'Zamrażarka': 'czesci-do-zamrazarek',
      'Kuchenka': 'czesci-do-kuchenek',
      'Piekarnik': 'czesci-do-piekarnikow',
      'Płyta indukcyjna': 'czesci-do-plyt-indukcyjnych',
      'Płyta gazowa': 'czesci-do-plyt-gazowych',
      'Okap': 'czesci-do-okapow',
      'Mikrofala': 'czesci-do-mikrofalowek',
      'Mikrofalówka': 'czesci-do-mikrofalowek',
      'Suszarka': 'czesci-do-suszarek'
    };

    // Mapowanie marek na slug North.pl
    const brandSlugs = {
      'Bosch': 'bosch',
      'Siemens': 'siemens',
      'Samsung': 'samsung',
      'LG': 'lg',
      'Whirlpool': 'whirlpool',
      'Amica': 'amica',
      'Electrolux': 'electrolux',
      'Beko': 'beko',
      'Indesit': 'indesit',
      'Candy': 'candy',
      'Gorenje': 'gorenje',
      'Zanussi': 'zanussi',
      'AEG': 'aeg',
      'Hotpoint': 'hotpoint',
      'Miele': 'miele'
    };

    const category = deviceCategories[type] || 'czesci-do-pralek';
    const brandSlug = brandSlugs[brand] || brand?.toLowerCase();

    // Znajdź ID kategorii (z mapowania North.pl)
    const categoryIds = {
      'czesci-do-pralek/bosch': 'g55939',
      'czesci-do-pralek/samsung': 'g55943',
      'czesci-do-pralek/lg': 'g55941',
      'czesci-do-pralek/whirlpool': 'g55945',
      'czesci-do-pralek/amica': 'g55938',
      'czesci-do-zmywarek/bosch': 'g55949',
      'czesci-do-lodowek/samsung': 'g55963',
      'czesci-do-lodowek/lg': 'g55961',
      'czesci-do-plyt-indukcyjnych/bosch': 'g56010',
      'czesci-do-plyt-indukcyjnych/amica': 'g56009'
    };

    const categoryKey = `${category}/${brandSlug}`;
    const categoryId = categoryIds[categoryKey] || 'g55939';

    return `${baseUrl}/${category}/${category}-${brandSlug},${categoryId}.html`;
  };

  // 📝 Obsługa dodawania części
  const handleAddPart = () => {
    if (!partData.name || !partData.price) {
      alert('Podaj nazwę i cenę części!');
      return;
    }

    const part = {
      partId: `NORTH-${Date.now()}`, // Tymczasowe ID
      name: partData.name,
      partNumber: partData.partNumber || '',
      quantity: parseInt(partData.quantity) || 1,
      price: parseFloat(partData.price),
      source: 'north.pl',
      notes: partData.notes
    };

    onAddPart(part);
    setShowAddModal(false);
    setPartData({ name: '', partNumber: '', price: '', quantity: 1, notes: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              🛒 Przeglądaj części na North.pl
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {deviceType && deviceBrand ? (
                <>Szukam części dla: <span className="font-semibold">{deviceBrand} {deviceType}</span></>
              ) : (
                'Przeglądaj katalog części zamiennych'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Dodaj część do zamówienia
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕ Zamknij
            </button>
          </div>
        </div>

        {/* North.pl - Otwórz w nowej karcie */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto px-6">
            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Przeglądaj katalog North.pl
            </h3>
            
            <p className="text-gray-600 mb-6">
              Kliknij poniższy przycisk, aby otworzyć katalog części w nowej karcie przeglądarki
            </p>
            
            <a
              href={northUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Otwórz North.pl
            </a>
            
            <div className="mt-8 p-6 bg-white rounded-lg border border-orange-200 text-left">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Jak to działa?
              </h4>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-semibold text-orange-600 flex-shrink-0">1.</span>
                  <span>Otwórz katalog North.pl w nowej karcie</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-orange-600 flex-shrink-0">2.</span>
                  <span>Przeglądaj i znajdź odpowiednią część</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-orange-600 flex-shrink-0">3.</span>
                  <span>Skopiuj nazwę, numer katalogowy i cenę</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-orange-600 flex-shrink-0">4.</span>
                  <span>Wróć tutaj i kliknij "Dodaj część do zamówienia"</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-orange-600 flex-shrink-0">5.</span>
                  <span>Wklej dane części i zatwierdź</span>
                </li>
              </ol>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Link zostanie otwarty w nowej, bezpiecznej karcie
            </div>
          </div>
        </div>

        {/* Footer z instrukcją */}
        <div className="px-6 py-3 border-t bg-gray-50">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Jak to działa?</p>
              <p className="mt-1">
                1. Przeglądaj części w katalogu North.pl powyżej<br/>
                2. Znajdź odpowiednią część dla swojego urządzenia<br/>
                3. Kliknij <strong>"Dodaj część do zamówienia"</strong> i wypełnij dane części<br/>
                4. Część zostanie dodana do formularza zamówienia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal dodawania części */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                ➕ Dodaj część do zamówienia
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Wypełnij dane części z North.pl
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Nazwa części */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa części <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={partData.name}
                  onChange={(e) => setPartData({...partData, name: e.target.value})}
                  placeholder="np. Grzałka do pralki Bosch"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Numer katalogowy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numer katalogowy
                </label>
                <input
                  type="text"
                  value={partData.partNumber}
                  onChange={(e) => setPartData({...partData, partNumber: e.target.value})}
                  placeholder="np. 00264697"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Cena i ilość */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cena (zł) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={partData.price}
                    onChange={(e) => setPartData({...partData, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ilość
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={partData.quantity}
                    onChange={(e) => setPartData({...partData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notatki */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notatki
                </label>
                <textarea
                  value={partData.notes}
                  onChange={(e) => setPartData({...partData, notes: e.target.value})}
                  placeholder="Dodatkowe informacje o części..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setPartData({ name: '', partNumber: '', price: '', quantity: 1, notes: '' });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddPart}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✓ Dodaj część
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
