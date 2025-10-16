// components/NorthPartsBrowserPopup.js
// 🪟 Otwiera North.pl w osobnym oknie + modal do dodawania części

import { useState, useEffect } from 'react';

export default function NorthPartsBrowserPopup({ 
  deviceType, 
  deviceBrand,
  deviceModel, 
  onAddPart, 
  onClose 
}) {
  const [northUrl, setNorthUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [northWindow, setNorthWindow] = useState(null);
  
  // Formularz dodawania części
  const [partData, setPartData] = useState({
    name: '',
    partNumber: '',
    price: '',
    quantity: 1,
    notes: '',
    northUrl: '',
    images: []
  });
  
  // Stan dla auto-wypełniania
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productLoadError, setProductLoadError] = useState('');

  useEffect(() => {
    const url = generateNorthUrl(deviceType, deviceBrand, deviceModel);
    console.log('🔗 North URL:', url);
    setNorthUrl(url);
    
    // Otwórz okno automatycznie
    openNorthWindow(url);
    
    return () => {
      // Zamknij okno przy unmount
      if (northWindow && !northWindow.closed) {
        northWindow.close();
      }
    };
  }, [deviceType, deviceBrand, deviceModel]);

  const generateNorthUrl = (type, brand, model) => {
    const baseUrl = 'https://north.pl';
    
    // ✅ UPROSZCZONA WERSJA - tylko główne kategorie (North.pl ma różne ID-ki dla podkategorii)
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
      'płyta ceramiczna': 'czesci-do-plyt-ceramicznych',
      'okap': 'czesci-do-okapow',
      'mikrofala': 'czesci-do-mikrofalowek',
      'mikrofalówka': 'czesci-do-mikrofalowek',
      'mikrofalowka': 'czesci-do-mikrofalowek',
      'kuchenka mikrofalowa': 'czesci-do-mikrofalowek',
      'suszarka': 'czesci-do-suszarek',
      'suszarka do ubran': 'czesci-do-suszarek',
      'suszarka bębnowa': 'czesci-do-suszarek',
      'ekspres do kawy': 'czesci-do-ekspresow-do-kawy',
      'ekspres': 'czesci-do-ekspresow-do-kawy'
    };

    // ✅ Prawdziwe ID kategorii z North.pl (zweryfikowane!)
    const categoryIds = {
      'czesci-do-pralek': 'g1178',
      'czesci-do-zmywarek': 'g1173',
      'czesci-do-lodowek': 'g1177',
      'czesci-do-zamrazarek': 'g1182',
      'czesci-do-kuchenek': 'g1198',
      'czesci-do-piekarnikow': 'g1215',
      'czesci-do-plyt-indukcyjnych': 'g1213',
      'czesci-do-plyt-gazowych': 'g1214',
      'czesci-do-plyt-ceramicznych': 'g1212',
      'czesci-do-okapow': 'g1216',
      'czesci-do-mikrofalowek': 'g1195',
      'czesci-do-suszarek': 'g1184',
      'czesci-do-ekspresow-do-kawy': 'g1079'
    };

    const normalizedType = type?.toLowerCase() || '';
    const category = deviceCategories[normalizedType] || 'czesci-do-pralek';
    const categoryId = categoryIds[category] || 'g1178';
    
    // URL format: https://north.pl/czesci-agd/{category},{categoryId}.html
    const url = `${baseUrl}/czesci-agd/${category},${categoryId}.html`;
    
    console.log('� North URL:', {
      type: normalizedType,
      brand: brand,
      category: category,
      categoryId: categoryId,
      url: url
    });
    
    return url;
  };

  const openNorthWindow = (url) => {
    // Otwórz w nowym oknie (popup)
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=yes,status=yes`;
    
    const newWindow = window.open(url, 'NorthParts', features);
    setNorthWindow(newWindow);
    
    // Monitor czy okno zostało zamknięte
    const interval = setInterval(() => {
      if (newWindow && newWindow.closed) {
        clearInterval(interval);
        console.log('🪟 North.pl window closed');
      }
    }, 1000);
  };

  // Funkcja do automatycznego pobierania danych z North.pl
  const handleLoadProductFromUrl = async (url) => {
    if (!url || !url.includes('north.pl')) {
      setProductLoadError('Podaj prawidłowy link do produktu North.pl');
      return;
    }

    setIsLoadingProduct(true);
    setProductLoadError('');

    try {
      console.log('🔍 Pobieranie danych produktu z:', url);
      
      const response = await fetch('/api/scrape/north-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się pobrać danych');
      }

      if (data.success && data.product) {
        console.log('✅ Pobrano dane produktu:', data.product);
        
        // Konwertuj zdjęcia z array stringów (URLi) na format obiektu { url, type }
        const formattedImages = (data.product.images || []).map((imgUrl, index) => ({
          url: imgUrl,
          type: 'product', // typ zdjęcia
          id: `north-${Date.now()}-${index}`, // unikalny ID
          isFromNorth: true // oznaczenie że pochodzi z North
        }));
        
        console.log('📸 Sformatowane zdjęcia:', formattedImages.length, 'szt.');
        
        // Automatycznie wypełnij formularz
        setPartData({
          ...partData,
          name: data.product.name || partData.name,
          partNumber: data.product.partNumber || partData.partNumber,
          price: data.product.price || partData.price,
          northUrl: url,
          images: formattedImages,
          notes: data.product.description ? 
            `${data.product.description}\n\nDostępność: ${data.product.availability}` : 
            partData.notes
        });

        setProductLoadError('');
      }
    } catch (error) {
      console.error('❌ Błąd pobierania produktu:', error);
      setProductLoadError(error.message || 'Nie udało się pobrać danych produktu');
    } finally {
      setIsLoadingProduct(false);
    }
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
      sourceUrl: partData.northUrl || '',
      images: partData.images || [],
      notes: partData.notes
    };

    onAddPart(part);
    setShowAddModal(false);
    setPartData({ 
      name: '', 
      partNumber: '', 
      price: '', 
      quantity: 1, 
      notes: '',
      northUrl: '',
      images: []
    });
    setProductLoadError('');
  };

  const handleClose = () => {
    if (northWindow && !northWindow.closed) {
      northWindow.close();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              🛒 Przeglądaj North.pl
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {deviceModel ? (
                <>
                  <span className="font-semibold">{deviceBrand}</span> {deviceType} • Model: <span className="font-semibold">{deviceModel}</span>
                </>
              ) : deviceType && deviceBrand ? (
                <>
                  <span className="font-semibold">{deviceBrand}</span> {deviceType}
                </>
              ) : (
                'Katalog części zamiennych AGD'
              )}
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instrukcje */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Jak to działa?
          </h3>
          <ol className="text-sm text-orange-700 space-y-1 ml-5 list-decimal">
            <li>Otwarte okno North.pl - przeglądaj katalog części</li>
            <li>Znajdź odpowiednią część i zanotuj dane (nazwa, nr katalogowy, cena)</li>
            <li>Kliknij <strong>"Dodaj część"</strong> poniżej i wypełnij formularz</li>
            <li>Część zostanie dodana do zamówienia</li>
          </ol>
        </div>

        {/* Informacja o oknie + zmiana modelu */}
        <div className="space-y-3 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  North.pl otworzy się w osobnym oknie
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Jeśli nie widzisz okna, sprawdź czy przeglądarka nie zablokowała popup'u
                </p>
              </div>
            </div>
          </div>

          {/* Parametry wyszukiwania */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              🔧 Wybierz typ urządzenia
            </h3>
            
            {/* Typ urządzenia */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Kategoria części
              </label>
              <select
                defaultValue={deviceType?.toLowerCase() || 'pralka'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium"
                id="device-type-select"
              >
                <option value="pralka">🔄 Pralka</option>
                <option value="zmywarka">🍽️ Zmywarka</option>
                <option value="lodówka">❄️ Lodówka</option>
                <option value="zamrażarka">🧊 Zamrażarka</option>
                <option value="kuchnia">🔥 Kuchnia</option>
                <option value="piekarnik">🍞 Piekarnik</option>
                <option value="płyta indukcyjna">⚡ Płyta indukcyjna</option>
                <option value="płyta gazowa">🔥 Płyta gazowa</option>
                <option value="płyta ceramiczna">⚫ Płyta ceramiczna</option>
                <option value="okap">💨 Okap</option>
                <option value="mikrofalówka">📻 Mikrofalówka</option>
                <option value="suszarka">🌀 Suszarka</option>
                <option value="ekspres do kawy">☕ Ekspres do kawy</option>
              </select>
            </div>

            {/* Informacja o producencie i modelu */}
            {(deviceBrand || deviceModel) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-xs font-semibold text-blue-800 mb-1">
                  📋 Twoje urządzenie:
                </p>
                {deviceBrand && (
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Marka:</span> {deviceBrand}
                  </p>
                )}
                {deviceModel && (
                  <div>
                    <p className="text-sm text-blue-700 mb-1">
                      <span className="font-semibold">Model:</span>
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 px-2 py-1.5 bg-white border border-blue-300 rounded text-xs text-gray-800 font-mono">
                        {deviceModel}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(deviceModel);
                          const btn = event.target.closest('button');
                          const originalHTML = btn.innerHTML;
                          btn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
                          btn.classList.add('bg-green-500', 'border-green-500');
                          btn.classList.remove('bg-blue-500', 'border-blue-500');
                          setTimeout(() => {
                            btn.innerHTML = originalHTML;
                            btn.classList.remove('bg-green-500', 'border-green-500');
                            btn.classList.add('bg-blue-500', 'border-blue-500');
                          }, 1500);
                        }}
                        className="px-2 py-1.5 bg-blue-500 border border-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center text-xs"
                        title="Skopiuj model"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Użyj Ctrl+F na stronie North.pl aby znaleźć model
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Przyciski */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 font-semibold shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dodaj część do zamówienia
          </button>
          
          <button
            onClick={() => openNorthWindow(northUrl)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            🔄 Otwórz ponownie
          </button>
          
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>

      {/* Modal dodawania części */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"/>
              </svg>
              Dodaj część z North.pl
            </h3>
            
            {/* KROK 1: Link do produktu */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                🔗 Wklej link do produktu z North.pl
              </h4>
              <p className="text-xs text-blue-700 mb-3">
                System automatycznie pobierze nazwę, numer katalogowy, cenę i zdjęcia!
              </p>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  value={partData.northUrl}
                  onChange={(e) => setPartData({...partData, northUrl: e.target.value})}
                  onPaste={(e) => {
                    // Po wklejeniu automatycznie pobierz dane
                    setTimeout(() => {
                      const url = e.target.value;
                      if (url && url.includes('north.pl')) {
                        handleLoadProductFromUrl(url);
                      }
                    }, 100);
                  }}
                  className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://north.pl/karta/nazwa-czesci,123-ABC-0456.html"
                  disabled={isLoadingProduct}
                />
                <button
                  onClick={() => handleLoadProductFromUrl(partData.northUrl)}
                  disabled={isLoadingProduct || !partData.northUrl}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingProduct ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Pobieranie...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Pobierz dane
                    </>
                  )}
                </button>
              </div>
              
              {productLoadError && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {productLoadError}
                </p>
              )}
            </div>

            {/* Separator */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-sm text-gray-500 font-medium">lub wypełnij ręcznie</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            
            {/* KROK 2: Dane części */}
            <div className="space-y-4">
              {/* Podgląd zdjęć */}
              {partData.images && partData.images.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📸 Zdjęcia produktu ({partData.images.length})
                  </label>
                  <div className="flex gap-2 overflow-x-auto">
                    {partData.images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={typeof img === 'string' ? img : img.url} 
                        alt={`Zdjęcie ${idx + 1}`}
                        className="h-20 w-20 object-cover rounded border border-gray-300"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa części *
                </label>
                <input
                  type="text"
                  value={partData.name}
                  onChange={(e) => setPartData({...partData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="np. Uszczelka drzwi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numer katalogowy / Indeks
                </label>
                <input
                  type="text"
                  value={partData.partNumber}
                  onChange={(e) => setPartData({...partData, partNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="np. 481010"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cena (zł) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={partData.price}
                    onChange={(e) => setPartData({...partData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Dodatkowe informacje..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddPart}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-md"
              >
                ✓ Dodaj do zamówienia
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setProductLoadError('');
                }}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
