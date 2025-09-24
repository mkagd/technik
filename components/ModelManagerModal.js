// components/ModelManagerModal.js

import { useState, useEffect } from 'react';
import {
  FiX,
  FiPlus,
  FiSearch,
  FiCamera,
  FiEdit,
  FiPackage,
  FiCheck,
  FiShoppingCart,
  FiUser,
  FiCalendar,
  FiClock
} from 'react-icons/fi';
import ModelOCRScanner from './ModelOCRScanner';
import modelsDatabase from '../data/modelsDatabase.json';

export default function ModelManagerModal({ 
  isOpen, 
  onClose, 
  visitId, 
  currentModels = [], 
  onModelsUpdate 
}) {
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'list', 'parts'
  const [showOCRScanner, setShowOCRScanner] = useState(false);
  const [models, setModels] = useState(currentModels);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualModel, setManualModel] = useState({
    brand: '',
    model: '',
    name: '',
    type: '',
    serialNumber: '',
    notes: ''
  });
  const [selectedModelForParts, setSelectedModelForParts] = useState(null);
  const [cart, setCart] = useState([]);
  const [showPartsModal, setShowPartsModal] = useState(false);

  // Wyszukiwanie modeli w bazie danych
  const searchModels = () => {
    if (!searchTerm) return [];
    
    const results = [];
    const term = searchTerm.toLowerCase();
    
    Object.entries(modelsDatabase.brands).forEach(([brandName, brandData]) => {
      Object.entries(brandData).forEach(([categoryName, categoryData]) => {
        Object.entries(categoryData).forEach(([modelNumber, modelInfo]) => {
          if (
            modelNumber.toLowerCase().includes(term) ||
            modelInfo.name.toLowerCase().includes(term) ||
            brandName.toLowerCase().includes(term)
          ) {
            results.push({
              brand: brandName,
              category: categoryName,
              model: modelNumber,
              ...modelInfo
            });
          }
        });
      });
    });
    
    return results.slice(0, 10); // Limit to 10 results
  };

  // Dodanie modelu z OCR
  const handleOCRModelDetected = (detectedModel) => {
    const newModel = {
      id: Date.now(),
      brand: detectedModel.brand || detectedModel.clean.substring(0, 3),
      model: detectedModel.clean,
      name: detectedModel.name || 'Model rozpoznany z OCR',
      type: detectedModel.type || 'Nieznany typ',
      serialNumber: '',
      dateAdded: new Date().toISOString(),
      source: 'ocr',
      notes: `Automatycznie rozpoznany z tabliczki znamionowej. Wykryty tekst: "${detectedModel.detected}"`,
      confidence: detectedModel.confidence,
      parts: detectedModel.common_parts || []
    };
    
    setModels(prev => [...prev, newModel]);
    setShowOCRScanner(false);
  };

  // Dodanie modelu ręczne
  const handleManualAdd = () => {
    if (!manualModel.brand || !manualModel.model) return;
    
    const newModel = {
      id: Date.now(),
      ...manualModel,
      dateAdded: new Date().toISOString(),
      source: 'manual',
      parts: []
    };
    
    setModels(prev => [...prev, newModel]);
    setManualModel({
      brand: '',
      model: '',
      name: '',
      type: '',
      serialNumber: '',
      notes: ''
    });
  };

  // Dodanie modelu z wyszukiwania
  const handleAddFromSearch = (searchResult) => {
    const newModel = {
      id: Date.now(),
      ...searchResult,
      serialNumber: '',
      dateAdded: new Date().toISOString(),
      source: 'database',
      notes: '',
      parts: searchResult.common_parts || []
    };
    
    setModels(prev => [...prev, newModel]);
  };

  // Usunięcie modelu
  const handleRemoveModel = (modelId) => {
    setModels(prev => prev.filter(m => m.id !== modelId));
  };

  // Dodanie części do koszyka
  const addToCart = (part, modelInfo) => {
    const cartItem = {
      id: Date.now(),
      ...part,
      modelBrand: modelInfo.brand,
      modelNumber: modelInfo.model,
      quantity: 1,
      totalPrice: part.price
    };
    
    setCart(prev => [...prev, cartItem]);
  };

  // Usunięcie z koszyka
  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Aktualizacja ilości w koszyku
  const updateCartQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity, totalPrice: item.price * quantity }
        : item
    ));
  };

  // Złożenie zamówienia
  const handleOrderParts = () => {
    const orderData = {
      visitId,
      items: cart,
      totalValue: cart.reduce((sum, item) => sum + item.totalPrice, 0),
      orderDate: new Date().toISOString(),
      status: 'pending'
    };
    
    // Zapisz zamówienie (w prawdziwej aplikacji wysłanie do API)
    console.log('Zamówienie części:', orderData);
    
    // Wyczyść koszyk
    setCart([]);
    setShowPartsModal(false);
    
    alert('Zamówienie zostało złożone! Sprawdź panel administracyjny.');
  };

  // Zapisz zmiany
  const handleSave = () => {
    onModelsUpdate(models, cart);
    onClose();
  };

  useEffect(() => {
    setModels(currentModels);
  }, [currentModels]);

  if (!isOpen) return null;

  const searchResults = searchModels();
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              <FiPackage className="inline mr-3" />
              Zarządzanie modelami urządzeń
            </h2>
            <div className="flex items-center space-x-2">
              {cart.length > 0 && (
                <button
                  onClick={() => setShowPartsModal(true)}
                  className="relative px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FiShoppingCart className="inline mr-2" />
                  Koszyk ({cart.length})
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('add')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'add'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiPlus className="inline mr-2" />
                Dodaj model
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiPackage className="inline mr-2" />
                Lista modeli ({models.length})
              </button>
              <button
                onClick={() => setActiveTab('parts')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'parts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiShoppingCart className="inline mr-2" />
                Części zamienne
              </button>
            </nav>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Tab: Dodaj model */}
            {activeTab === 'add' && (
              <div className="space-y-6">
                {/* Opcje dodawania */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowOCRScanner(true)}
                    className="p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                  >
                    <FiCamera className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                    <h3 className="font-semibold text-gray-800 mb-2">Skanuj tabliczkę</h3>
                    <p className="text-sm text-gray-600">Automatyczne rozpoznawanie OCR</p>
                  </button>
                  
                  <div className="p-6 border-2 border-gray-200 rounded-lg">
                    <FiSearch className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 mb-2">Wyszukaj w bazie</h3>
                    <input
                      type="text"
                      placeholder="Wpisz model..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  
                  <div className="p-6 border-2 border-gray-200 rounded-lg">
                    <FiEdit className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 mb-2">Dodaj ręcznie</h3>
                    <p className="text-sm text-gray-600">Wprowadź dane modelu</p>
                  </div>
                </div>

                {/* Wyniki wyszukiwania */}
                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800">Znalezione modele:</h3>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-semibold">{result.brand} {result.model}</div>
                          <div className="text-sm text-gray-600">{result.name}</div>
                          <div className="text-xs text-gray-500">{result.type}</div>
                        </div>
                        <button
                          onClick={() => handleAddFromSearch(result)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                        >
                          <FiPlus className="inline mr-1" />
                          Dodaj
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formularz ręczny */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marka</label>
                    <input
                      type="text"
                      value={manualModel.brand}
                      onChange={(e) => setManualModel(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="np. BOSCH"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={manualModel.model}
                      onChange={(e) => setManualModel(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="np. WAG28461BY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa</label>
                    <input
                      type="text"
                      value={manualModel.name}
                      onChange={(e) => setManualModel(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="np. Serie 6 WAG28461BY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                    <input
                      type="text"
                      value={manualModel.type}
                      onChange={(e) => setManualModel(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="np. Pralka ładowana od przodu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numer seryjny</label>
                    <input
                      type="text"
                      value={manualModel.serialNumber}
                      onChange={(e) => setManualModel(prev => ({ ...prev, serialNumber: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Opcjonalnie"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notatki</label>
                    <input
                      type="text"
                      value={manualModel.notes}
                      onChange={(e) => setManualModel(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Dodatkowe informacje"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      onClick={handleManualAdd}
                      disabled={!manualModel.brand || !manualModel.model}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                    >
                      <FiPlus className="inline mr-2" />
                      Dodaj model
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Lista modeli */}
            {activeTab === 'list' && (
              <div className="space-y-4">
                {models.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FiPackage className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Brak dodanych modeli</p>
                    <p className="text-sm">Przejdź do zakładki "Dodaj model" aby rozpocząć</p>
                  </div>
                ) : (
                  models.map((model) => (
                    <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-bold text-lg">{model.brand} {model.model}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              model.source === 'ocr' ? 'bg-blue-100 text-blue-800' :
                              model.source === 'database' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {model.source === 'ocr' ? 'OCR' :
                               model.source === 'database' ? 'Baza' : 'Ręczny'}
                            </span>
                          </div>
                          <p className="text-gray-600">{model.name}</p>
                          <p className="text-sm text-gray-500">{model.type}</p>
                          {model.serialNumber && (
                            <p className="text-sm text-gray-500">S/N: {model.serialNumber}</p>
                          )}
                          {model.notes && (
                            <p className="text-sm text-gray-600 mt-2">{model.notes}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span>
                              <FiCalendar className="inline mr-1" />
                              {new Date(model.dateAdded).toLocaleDateString()}
                            </span>
                            {model.parts && model.parts.length > 0 && (
                              <span>
                                <FiPackage className="inline mr-1" />
                                {model.parts.length} części dostępnych
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {model.parts && model.parts.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedModelForParts(model);
                                setActiveTab('parts');
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                            >
                              <FiShoppingCart className="inline mr-1" />
                              Części
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveModel(model.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                          >
                            <FiX className="inline mr-1" />
                            Usuń
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Części zamienne */}
            {activeTab === 'parts' && (
              <div className="space-y-6">
                {selectedModelForParts ? (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Części dla: {selectedModelForParts.brand} {selectedModelForParts.model}
                      </h3>
                      <p className="text-blue-700 text-sm">{selectedModelForParts.name}</p>
                    </div>

                    {selectedModelForParts.parts && selectedModelForParts.parts.length > 0 ? (
                      <div className="grid gap-4">
                        {selectedModelForParts.parts.map((part, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{part.name}</h4>
                                <p className="text-sm text-gray-600 mb-2">Nr części: {part.part_number}</p>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="font-medium text-green-600">
                                    {part.price.toFixed(2)} zł
                                  </span>
                                  <span className="text-gray-500">
                                    {part.supplier}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    part.availability === 'Na stanie' 
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {part.availability}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => addToCart(part, selectedModelForParts)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                              >
                                <FiShoppingCart className="inline mr-1" />
                                Do koszyka
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FiPackage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Brak dostępnych części dla tego modelu</p>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedModelForParts(null)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                    >
                      ← Powrót do listy modeli
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Wybierz model aby zobaczyć dostępne części:</h3>
                    {models.filter(m => m.parts && m.parts.length > 0).map((model) => (
                      <div
                        key={model.id}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedModelForParts(model)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{model.brand} {model.model}</div>
                            <div className="text-sm text-gray-600">{model.name}</div>
                            <div className="text-xs text-gray-500">
                              {model.parts.length} części dostępnych
                            </div>
                          </div>
                          <FiPackage className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                    ))}
                    
                    {models.filter(m => m.parts && m.parts.length > 0).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FiPackage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Brak modeli z dostępnymi częściami</p>
                        <p className="text-sm">Dodaj modele z bazy danych lub przez OCR</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {models.length} modeli | {cart.length} pozycji w koszyku
              {cart.length > 0 && (
                <span className="ml-2 font-medium">
                  | Wartość: {cartTotal.toFixed(2)} zł
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                <FiCheck className="inline mr-2" />
                Zapisz zmiany
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Koszyk Modal */}
      {showPartsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                <FiShoppingCart className="inline mr-2" />
                Koszyk części ({cart.length})
              </h2>
              <button
                onClick={() => setShowPartsModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Koszyk jest pusty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.modelBrand} {item.modelNumber} | {item.part_number}
                        </p>
                        <p className="text-sm text-gray-500">{item.supplier}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{item.totalPrice.toFixed(2)} zł</div>
                          <div className="text-sm text-gray-500">{item.price.toFixed(2)} zł/szt</div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Łączna wartość:</span>
                  <span className="text-xl font-bold text-green-600">
                    {cartTotal.toFixed(2)} zł
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPartsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Kontynuuj zakupy
                  </button>
                  <button
                    onClick={handleOrderParts}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    <FiCheck className="inline mr-2" />
                    Złóż zamówienie
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OCR Scanner Modal */}
      <ModelOCRScanner
        isOpen={showOCRScanner}
        onClose={() => setShowOCRScanner(false)}
        onModelDetected={handleOCRModelDetected}
      />
    </>
  );
}