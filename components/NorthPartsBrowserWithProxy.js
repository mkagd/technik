// components/NorthPartsBrowserWithProxy.js
// 🛒 Komponent z PROXY - omija CSP North.pl

import { useState, useEffect } from 'react';

export default function NorthPartsBrowserWithProxy({ 
  deviceType, 
  deviceBrand, 
  onAddPart, 
  onClose 
}) {
  const [northUrl, setNorthUrl] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
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
    console.log('🔍 North Browser - deviceType:', deviceType);
    console.log('🔍 North Browser - deviceBrand:', deviceBrand);
    
    // Generuj link do North.pl
    const url = generateNorthUrl(deviceType, deviceBrand);
    console.log('🔗 Generated North URL:', url);
    
    setNorthUrl(url);
    
    // Utwórz proxy URL
    const proxy = `/api/proxy/north?url=${encodeURIComponent(url)}`;
    console.log('🔗 Proxy URL:', proxy);
    setProxyUrl(proxy);
  }, [deviceType, deviceBrand]);

  const generateNorthUrl = (type, brand) => {
    const baseUrl = 'https://north.pl/czesci-agd';
    
    const deviceCategories = {
      'pralka': 'czesci-do-pralek',
      'pralka automatyczna': 'czesci-do-pralek',
      'zmywarka': 'czesci-do-zmywarek',
      'lodówka': 'czesci-do-lodowek',
      'lodowka': 'czesci-do-lodowek',
      'chłodziarka': 'czesci-do-lodowek',
      'zamrażarka': 'czesci-do-zamrazarek',
      'kuchenka': 'czesci-do-kuchenek',
      'kuchnia': 'czesci-do-kuchenek',
      'kuchnia elektryczna': 'czesci-do-kuchenek',
      'kuchnia gazowa': 'czesci-do-kuchenek',
      'piekarnik': 'czesci-do-piekarnikow',
      'piekarnik elektryczny': 'czesci-do-piekarnikow',
      'płyta': 'czesci-do-plyt-indukcyjnych',
      'płyta indukcyjna': 'czesci-do-plyt-indukcyjnych',
      'plyta indukcyjna': 'czesci-do-plyt-indukcyjnych',
      'płyta gazowa': 'czesci-do-plyt-gazowych',
      'plyta gazowa': 'czesci-do-plyt-gazowych',
      'płyta ceramiczna': 'czesci-do-plyt-indukcyjnych',
      'okap': 'czesci-do-okapow',
      'mikrofala': 'czesci-do-mikrofalowek',
      'mikrofalówka': 'czesci-do-mikrofalowek',
      'mikrofalowka': 'czesci-do-mikrofalowek',
      'kuchenka mikrofalowa': 'czesci-do-mikrofalowek',
      'suszarka': 'czesci-do-suszarek',
      'suszarka do ubran': 'czesci-do-suszarek',
      'suszarka bębnowa': 'czesci-do-suszarek'
    };

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

    // Normalizuj typ (lowercase)
    const normalizedType = type?.toLowerCase() || '';
    const category = deviceCategories[normalizedType] || 'czesci-do-pralek';
    
    // Normalizuj brand
    const normalizedBrand = brand?.toUpperCase() || '';
    const brandSlug = brandSlugs[normalizedBrand] || brand?.toLowerCase() || 'bosch';
    
    const categoryKey = `${category}/${brandSlug}`;
    const categoryId = categoryIds[categoryKey] || 'g55939';

    console.log('🔍 Mapping:', { type, normalizedType, category, brand, normalizedBrand, brandSlug, categoryKey, categoryId });

    return `${baseUrl}/${category}/${category}-${brandSlug},${categoryId}.html`;
  };

  const handleAddPart = () => {
    if (!partData.name || !partData.price) {
      alert('Podaj nazwę i cenę części!');
      return;
    }

    const part = {
      partId: `NORTH-${Date.now()}`,
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
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-orange-500 to-orange-600">
          <div>
            <h2 className="text-xl font-bold text-white">
              🛒 North.pl - Katalog części AGD
            </h2>
            <p className="text-sm text-orange-100 mt-1">
              {deviceType && deviceBrand ? (
                <>Szukam dla: <span className="font-semibold">{deviceBrand} {deviceType}</span></>
              ) : (
                'Przeglądaj katalog części zamiennych'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2 font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Dodaj część
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white bg-opacity-20 text-white hover:bg-opacity-30 rounded-lg transition-colors"
            >
              ✕ Zamknij
            </button>
          </div>
        </div>

        {/* North.pl iframe przez PROXY */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={proxyUrl}
            className="w-full h-full border-0"
            title="North.pl - Katalog części"
          />
        </div>

        {/* Footer z instrukcją */}
        <div className="px-6 py-3 border-t bg-gray-50">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">💡 Przeglądasz North.pl przez proxy</p>
              <p className="mt-1">
                Znajdź część → Kliknij <strong>"Dodaj część"</strong> → Wypełnij dane → Gotowe!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal dodawania części - taki sam jak wcześniej */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                ➕ Dodaj część do zamówienia
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa części <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={partData.name}
                  onChange={(e) => setPartData({...partData, name: e.target.value})}
                  placeholder="np. Grzałka do pralki Bosch"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numer katalogowy
                </label>
                <input
                  type="text"
                  value={partData.partNumber}
                  onChange={(e) => setPartData({...partData, partNumber: e.target.value})}
                  placeholder="np. 00264697"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notatki
                </label>
                <textarea
                  value={partData.notes}
                  onChange={(e) => setPartData({...partData, notes: e.target.value})}
                  placeholder="Dodatkowe informacje..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
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
