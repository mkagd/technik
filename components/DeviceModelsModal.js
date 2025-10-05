import { useState, useEffect } from 'react';
import { FiX, FiCamera, FiSearch, FiPlus, FiEdit, FiTrash2, FiPackage, FiUpload } from 'react-icons/fi';
import { useToast } from '../contexts/ToastContext';

/**
 * Device Models Management Modal
 * Allows scanning nameplate, searching database, and adding models manually
 */
export default function DeviceModelsModal({ isOpen, onClose, onSelectModel, visitId }) {
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'search', 'add'
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Scan tab state
  const [scanning, setScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  
  // Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add tab state
  const [newModel, setNewModel] = useState({
    brand: '',
    model: '',
    name: '',
    type: 'Pralka ładowana od przodu',
    serialNumber: '',
    notes: ''
  });

  const deviceTypes = [
    'Pralka ładowana od przodu',
    'Pralka ładowana od góry',
    'Zmywarka',
    'Lodówka',
    'Zamrażarka',
    'Piekarnik',
    'Płyta indukcyjna',
    'Płyta gazowa',
    'Suszarka',
    'Okap',
    'Mikrofalówka',
    'Kuchenka mikrofalowa',
    'Robot kuchenny'
  ];

  // Load models from API
  useEffect(() => {
    if (isOpen && activeTab === 'search') {
      loadModels();
    }
  }, [isOpen, activeTab]);

  // Filter models based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = models.filter(m => 
        m.brand.toLowerCase().includes(query) ||
        m.model.toLowerCase().includes(query) ||
        m.name?.toLowerCase().includes(query) ||
        m.serialNumber?.toLowerCase().includes(query)
      );
      setFilteredModels(filtered);
    } else {
      setFilteredModels(models);
    }
  }, [searchQuery, models]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/device-models');
      const data = await response.json();
      
      if (data.success) {
        setModels(data.models);
        setFilteredModels(data.models);
      } else {
        toast.error('❌ Błąd wczytywania modeli');
      }
    } catch (error) {
      console.error('Load models error:', error);
      toast.error('❌ Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Scan nameplate with camera
  const handleScanPlate = async () => {
    // In real implementation, this would open camera
    // For now, show file upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setScanning(true);
      
      try {
        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          setCapturedImage(event.target.result);
        };
        reader.readAsDataURL(file);
        
        // Upload and OCR (simulate for now)
        // In production: upload to /api/upload, then call /api/ocr/device-plate
        
        // Simulated OCR result
        setTimeout(() => {
          const mockOcrResult = {
            brand: 'BOSCH',
            model: 'WAG28461BY',
            name: 'Serie 6 WAG28461BY',
            type: 'Pralka ładowana od przodu',
            serialNumber: 'FD9406012345',
            specs: {
              capacity: '9 kg',
              spinSpeed: '1400 rpm',
              energyClass: 'A+++'
            },
            confidence: 0.94
          };
          
          setOcrResult(mockOcrResult);
          setScanning(false);
          toast.success(`✅ Rozpoznano: ${mockOcrResult.brand} ${mockOcrResult.model}`);
        }, 2000);
        
      } catch (error) {
        console.error('OCR error:', error);
        toast.error('❌ Błąd rozpoznawania tabliczki');
        setScanning(false);
      }
    };
    
    input.click();
  };

  // Add model from OCR result
  const handleAddFromOcr = async () => {
    if (!ocrResult) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/device-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: ocrResult.brand,
          model: ocrResult.model,
          name: ocrResult.name,
          type: ocrResult.type,
          serialNumber: ocrResult.serialNumber,
          specs: ocrResult.specs,
          plateImageUrl: capturedImage,
          addedBy: 'technician', // TODO: Get from session
          addedByName: 'Technik'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('✅ Model dodany do bazy');
        
        // Select this model for the visit
        if (onSelectModel) {
          onSelectModel(data.model);
        }
        
        onClose();
      } else {
        toast.error('❌ Błąd zapisywania modelu');
      }
    } catch (error) {
      console.error('Save model error:', error);
      toast.error('❌ Błąd połączenia');
    } finally {
      setLoading(false);
    }
  };

  // Add model manually
  const handleAddManual = async () => {
    if (!newModel.brand || !newModel.model) {
      toast.error('❌ Wypełnij markę i model');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/device-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newModel,
          addedBy: 'technician', // TODO: Get from session
          addedByName: 'Technik'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('✅ Model dodany');
        
        // Select this model for the visit
        if (onSelectModel) {
          onSelectModel(data.model);
        }
        
        // Reset form
        setNewModel({
          brand: '',
          model: '',
          name: '',
          type: 'Pralka ładowana od przodu',
          serialNumber: '',
          notes: ''
        });
        
        onClose();
      } else {
        toast.error('❌ ' + data.error);
      }
    } catch (error) {
      console.error('Add model error:', error);
      toast.error('❌ Błąd dodawania modelu');
    } finally {
      setLoading(false);
    }
  };

  // Select existing model
  const handleSelectExisting = (model) => {
    if (onSelectModel) {
      onSelectModel(model);
    }
    toast.success(`✅ Wybrano: ${model.brand} ${model.model}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FiPackage className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Zarządzanie modelami urządzeń
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
              activeTab === 'scan'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiCamera className="w-4 h-4" />
            Skanuj tabliczkę
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
              activeTab === 'search'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiSearch className="w-4 h-4" />
            Wyszukaj w bazie
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
              activeTab === 'add'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiPlus className="w-4 h-4" />
            Dodaj ręcznie
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Scan Tab */}
          {activeTab === 'scan' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-6">
                  {capturedImage ? (
                    <img 
                      src={capturedImage} 
                      alt="Captured nameplate"
                      className="max-w-md mx-auto rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                      <FiCamera className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleScanPlate}
                  disabled={scanning}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center gap-2 mx-auto"
                >
                  <FiCamera className="w-5 h-5" />
                  {scanning ? 'Rozpoznawanie...' : 'Skanuj tabliczkę'}
                </button>

                <p className="mt-4 text-sm text-gray-600">
                  Inteligentne rozpoznawanie obrazu<br />
                  Automatyczne wykrycie marki, modelu i numeru seryjnego
                </p>
              </div>

              {/* OCR Result */}
              {ocrResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ✅ Rozpoznano urządzenie
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marka</label>
                      <p className="text-lg font-bold text-gray-900">{ocrResult.brand}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <p className="text-lg font-bold text-gray-900">{ocrResult.model}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                      <p className="text-gray-900">{ocrResult.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Numer seryjny</label>
                      <p className="text-gray-900">{ocrResult.serialNumber}</p>
                    </div>
                  </div>

                  {ocrResult.specs && (
                    <div className="border-t border-green-200 pt-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Specyfikacja</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {Object.entries(ocrResult.specs).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-600">{key}: </span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <span>Pewność rozpoznania:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${ocrResult.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{Math.round(ocrResult.confidence * 100)}%</span>
                  </div>

                  <button
                    onClick={handleAddFromOcr}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                  >
                    {loading ? 'Zapisywanie...' : 'Zapisz model'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Wpisz model..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <p className="text-sm text-gray-600">
                {filteredModels.length === 0 && models.length === 0 
                  ? '0 modeli | 0 pozycji w koszyku'
                  : `${models.length} modeli | 0 pozycji w koszyku`}
              </p>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Ładowanie modeli...</p>
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {models.length === 0 
                      ? 'Brak modeli w bazie. Dodaj pierwszy model!'
                      : 'Nie znaleziono modeli pasujących do wyszukiwania.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredModels.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => handleSelectExisting(model)}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{model.brand}</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-medium text-gray-900">{model.model}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{model.type}</span>
                          {model.serialNumber && (
                            <>
                              <span>•</span>
                              <span>S/N: {model.serialNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button className="p-2 hover:bg-white rounded-lg transition">
                        <FiPlus className="w-5 h-5 text-blue-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Manually Tab */}
          {activeTab === 'add' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marka
                  </label>
                  <input
                    type="text"
                    value={newModel.brand}
                    onChange={(e) => setNewModel({ ...newModel, brand: e.target.value })}
                    placeholder="np. BOSCH"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={newModel.model}
                    onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
                    placeholder="np. WAG28461BY"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa
                </label>
                <input
                  type="text"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  placeholder="np. Serie 6 WAG28461BY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ
                </label>
                <select
                  value={newModel.type}
                  onChange={(e) => setNewModel({ ...newModel, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {deviceTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numer seryjny
                </label>
                <input
                  type="text"
                  value={newModel.serialNumber}
                  onChange={(e) => setNewModel({ ...newModel, serialNumber: e.target.value })}
                  placeholder="Opcjonalnie"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notatki
                </label>
                <textarea
                  value={newModel.notes}
                  onChange={(e) => setNewModel({ ...newModel, notes: e.target.value })}
                  placeholder="Dodatkowe informacje"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {activeTab === 'add' && `${models.length} modeli | 0 pozycji w koszyku`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              Anuluj
            </button>
            {activeTab === 'add' && (
              <button
                onClick={handleAddManual}
                disabled={loading || !newModel.brand || !newModel.model}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center gap-2"
              >
                {loading ? 'Zapisywanie...' : '✓ Zapisz zmiany'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
