import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import DarkModeToggle from '../../../components/DarkModeToggle';
import PhotoUploadZone from '../../../components/PhotoUploadZone';
import PartCard from '../../../components/PartCard';
import SmartSearchAutocomplete from '../../../components/SmartSearchAutocomplete';
import PartNameplateScanner from '../../../components/PartNameplateScanner';
import AllegroQuickSearch from '../../../components/AllegroQuickSearch';
import NorthQuickSearch from '../../../components/NorthQuickSearch';

export default function AdminMagazynCzesci() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState('all'); // all, low, out
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPart, setEditingPart] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // New Part State
  const [newPart, setNewPart] = useState({
    name: '',
    partNumber: '',
    category: 'AGD',
    subcategory: '',
    compatibleBrands: [],
    compatibleModels: [],
    description: '',
    images: [],
    pricing: { retailPrice: 0, wholesalePrice: 0, currency: 'PLN', taxIncluded: true },
    availability: { inStock: 0, minStock: 3, maxStock: 20, reserved: 0 },
    specifications: {},
    supplier: { name: '', deliveryTime: '48h' },
    installation: { difficulty: 'medium', estimatedTime: 60 }
  });
  const [brandInput, setBrandInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showOCRScanner, setShowOCRScanner] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('partsViewMode');
    if (savedViewMode) setViewMode(savedViewMode);
  }, []);

  // Save view mode to localStorage
  const toggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('partsViewMode', mode);
  };

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [parts, searchQuery, filterStock, filterCategory, filterSubcategory, filterBrand]);

  const loadParts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/parts');
      const data = await res.json();
      setParts(data.parts || []);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = [...parts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(part =>
        part.partName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.partId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.partNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.subcategory?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Stock filter
    if (filterStock === 'low') {
      filtered = filtered.filter(p => (p.stockQuantity || p.availability?.inStock || 0) > 0 && (p.stockQuantity || p.availability?.inStock || 0) < 5);
    } else if (filterStock === 'out') {
      filtered = filtered.filter(p => (p.stockQuantity || p.availability?.inStock || 0) === 0);
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    // Subcategory filter
    if (filterSubcategory) {
      filtered = filtered.filter(p => p.subcategory === filterSubcategory);
    }

    // Brand filter
    if (filterBrand) {
      filtered = filtered.filter(p => 
        p.compatibleBrands?.some(b => b.toLowerCase().includes(filterBrand.toLowerCase()))
      );
    }

    setFilteredParts(filtered);
  };

  const handleAddPart = async () => {
    // Validation
    if (!newPart.name || !newPart.partNumber) {
      setErrorMessage('Wypełnij wymagane pola: nazwa i numer katalogowy');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    try {
      // Prepare data for API
      const partData = {
        name: newPart.name,
        partNumber: newPart.partNumber,
        category: newPart.category,
        subcategory: newPart.subcategory,
        compatibleBrands: newPart.compatibleBrands,
        compatibleModels: newPart.compatibleModels,
        description: newPart.description,
        images: newPart.images,
        imageUrl: newPart.images.length > 0 ? newPart.images[0].url : null, // Backward compatibility
        pricing: newPart.pricing,
        availability: {
          ...newPart.availability,
          available: newPart.availability.inStock - newPart.availability.reserved
        },
        specifications: newPart.specifications,
        supplier: newPart.supplier,
        installation: newPart.installation
      };

      const res = await fetch('/api/inventory/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Część została pomyślnie dodana!');
        setShowAddModal(false);
        
        // Reset form
        setNewPart({
          name: '',
          partNumber: '',
          category: 'AGD',
          subcategory: '',
          compatibleBrands: [],
          compatibleModels: [],
          description: '',
          images: [],
          pricing: { retailPrice: 0, wholesalePrice: 0, currency: 'PLN', taxIncluded: true },
          availability: { inStock: 0, minStock: 3, maxStock: 20, reserved: 0 },
          specifications: {},
          supplier: { name: '', deliveryTime: '48h' },
          installation: { difficulty: 'medium', estimatedTime: 60 }
        });
        setBrandInput('');
        setModelInput('');
        
        loadParts();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Błąd podczas dodawania części');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error adding part:', error);
      setErrorMessage('Błąd połączenia: ' + error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleEdit = (part) => {
    setEditingPart({ ...part });
  };

  const handleSaveEdit = async () => {
    try {
      // Używamy ID z editingPart (może być 'id' lub 'partId')
      const partId = editingPart.id || editingPart.partId;
      
      const res = await fetch(`/api/inventory/parts?id=${partId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPart)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Część została pomyślnie zaktualizowana!');
        setEditingPart(null);
        loadParts();
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Błąd podczas aktualizacji części');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error updating part:', error);
      setErrorMessage('Błąd połączenia: ' + error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleAddByModel = (model) => {
    // Funkcja dodająca części do filtrów na podstawie wybranego modelu
    setSelectedModel(model);
    setShowModelModal(false);
    
    // Filtruj części kompatybilne z tym modelem
    const compatibleParts = parts.filter(part => {
      const models = part.compatibleModels || [];
      return models.some(m => m.toLowerCase().includes(model.toLowerCase()));
    });

    if (compatibleParts.length > 0) {
      // Ustaw filtr na pierwszy brand z listy części
      const firstBrand = compatibleParts[0].compatibleBrands?.[0] || '';
      setFilterBrand(firstBrand);
      setSearchQuery(model);
      setSuccessMessage(`✅ Znaleziono ${compatibleParts.length} części dla modelu "${model}"`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setErrorMessage(`❌ Nie znaleziono części dla modelu "${model}"`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const getUniqueModels = () => {
    const modelsSet = new Set();
    parts.forEach(part => {
      if (part.compatibleModels && Array.isArray(part.compatibleModels)) {
        part.compatibleModels.forEach(model => modelsSet.add(model));
      }
    });
    return Array.from(modelsSet).sort();
  };

  const getFilteredModels = () => {
    const allModels = getUniqueModels();
    if (!modelSearchQuery.trim()) return allModels;
    
    const query = modelSearchQuery.toLowerCase();
    return allModels.filter(model => model.toLowerCase().includes(query));
  };

  const handleDelete = async (partId) => {
    if (!confirm('Czy na pewno usunąć tę część? Ta akcja jest nieodwracalna!')) return;

    try {
      const res = await fetch(`/api/inventory/parts?id=${partId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Część została pomyślnie usunięta!');
        loadParts();
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Błąd podczas usuwania części');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error deleting part:', error);
      setErrorMessage('Błąd połączenia: ' + error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const getStockBadge = (quantity) => {
    if (quantity === 0) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    if (quantity < 5) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  };

  const getStockLabel = (quantity) => {
    if (quantity === 0) return 'BRAK';
    if (quantity < 5) return 'NISKI';
    return 'OK';
  };

  // Get unique values for filters
  const uniqueCategories = [...new Set(parts.map(p => p.category).filter(Boolean))];
  const uniqueSubcategories = [...new Set(parts.map(p => p.subcategory).filter(Boolean))];
  const uniqueBrands = [...new Set(parts.flatMap(p => p.compatibleBrands || []))];

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStock('all');
    setFilterCategory('');
    setFilterSubcategory('');
    setFilterBrand('');
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Toast Notifications */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-md">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{successMessage}</span>
              <button 
                onClick={() => setSuccessMessage('')}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-md">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium">{errorMessage}</span>
              <button 
                onClick={() => setErrorMessage('')}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zarządzanie częściami</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Edytuj, dodawaj i usuwaj części z systemu
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <DarkModeToggle />
                <button
                  onClick={() => router.push('/admin/magazyn')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  ← Wróć do magazynu
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              {/* Smart Search with Autocomplete + OCR Scanner */}
              <div className="flex-1 max-w-2xl flex gap-2">
                <div className="flex-1">
                  <SmartSearchAutocomplete
                    items={parts}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onSearch={setSearchQuery}
                    onSelect={(selectedPart) => {
                      // Scroll do części w tabeli/grid
                      const element = document.getElementById(`part-${selectedPart.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('ring-4', 'ring-blue-500');
                        setTimeout(() => {
                          element.classList.remove('ring-4', 'ring-blue-500');
                        }, 2000);
                      }
                    }}
                    placeholder="Szukaj po nazwie, numerze, marce, modelu..."
                  />
                </div>
                
                {/* OCR Scanner Button */}
                <button
                  onClick={() => setShowOCRScanner(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all flex-shrink-0"
                  title="Skanuj tabliczkę znamionową (GPT-4o Mini)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden sm:inline">Skanuj OCR</span>
                  <span className="inline sm:hidden">OCR</span>
                  <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">AI</span>
                </button>

                {/* Add by Model Button */}
                <button
                  onClick={() => setShowModelModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all flex-shrink-0"
                  title="Znajdź części według modelu urządzenia"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <span className="hidden sm:inline">Dodaj wg modelu</span>
                  <span className="inline sm:hidden">Model</span>
                </button>

                {/* ASWO Order Button - Direct Link */}
                <a
                  href="http://sklep.aswo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all flex-shrink-0"
                  title="Zamów części w sklepie ASWO (Koszalin) - otwiera w nowej karcie"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="hidden sm:inline">Zamów ASWO</span>
                  <span className="inline sm:hidden">ASWO</span>
                  <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">24h</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtry
                {(filterCategory || filterSubcategory || filterBrand) && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {[filterCategory, filterSubcategory, filterBrand].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Stock Filter */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilterStock('all')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filterStock === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Wszystkie ({parts.length})
                </button>
                <button
                  onClick={() => setFilterStock('low')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filterStock === 'low'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Niski stan ({parts.filter(p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 5).length})
                </button>
                <button
                  onClick={() => setFilterStock('out')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filterStock === 'out'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Brak ({parts.filter(p => (p.stockQuantity || 0) === 0).length})
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => toggleViewMode('table')}
                  className={`px-3 py-2 rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Widok tabeli"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => toggleViewMode('grid')}
                  className={`px-3 py-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Widok siatki"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Dodaj część
              </button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Zaawansowane filtry
                  </h3>
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Wyczyść wszystkie
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Kategoria
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Wszystkie</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Subcategoria / Typ urządzenia
                    </label>
                    <select
                      value={filterSubcategory}
                      onChange={(e) => setFilterSubcategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Wszystkie</option>
                      {uniqueSubcategories.map(subcat => (
                        <option key={subcat} value={subcat}>
                          {subcat === 'Pralka' && '🌀 '}
                          {subcat === 'Lodówka' && '🧊 '}
                          {subcat === 'Zmywarka' && '💧 '}
                          {subcat === 'Piekarnik' && '🔥 '}
                          {subcat === 'Kuchenka' && '🍳 '}
                          {subcat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Marka / Kompatybilność
                    </label>
                    <select
                      value={filterBrand}
                      onChange={(e) => setFilterBrand(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Wszystkie</option>
                      {uniqueBrands.sort().map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(filterCategory || filterSubcategory || filterBrand) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Aktywne filtry:</span>
                    {filterCategory && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded">
                        Kategoria: {filterCategory}
                        <button onClick={() => setFilterCategory('')} className="hover:text-blue-600">×</button>
                      </span>
                    )}
                    {filterSubcategory && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded">
                        {filterSubcategory}
                        <button onClick={() => setFilterSubcategory('')} className="hover:text-purple-600">×</button>
                      </span>
                    )}
                    {filterBrand && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded">
                        Marka: {filterBrand}
                        <button onClick={() => setFilterBrand('')} className="hover:text-green-600">×</button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Brak części</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Nie znaleziono części pasujących do kryteriów.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParts.map((part) => (
                <div key={part.partId || part.id} id={`part-${part.id}`} className="transition-all duration-300">
                  <PartCard
                    part={part}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Zdjęcie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Część
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kategoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Stan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cena
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sklepy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredParts.map((part, index) => (
                    <tr key={part.partId || part.id || `part-${index}`} id={`part-${part.id || index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
                      {/* Photo Cell */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {part.images && part.images.length > 0 ? (
                          <div className="relative group">
                            <img
                              src={part.images[0].url}
                              alt={part.partName || part.name}
                              className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600"
                            />
                            {part.images.length > 1 && (
                              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {part.images.length}
                              </div>
                            )}
                          </div>
                        ) : part.imageUrl ? (
                          <img
                            src={part.imageUrl}
                            alt={part.partName || part.name}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleEdit(part)}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {part.name || part.partName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {part.id || part.partId} • {part.partNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {part.category || 'Brak'}
                          </span>
                          {part.subcategory && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {part.subcategory}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockBadge(part.availability?.inStock || part.stockQuantity || 0)}`}>
                            {getStockLabel(part.availability?.inStock || part.stockQuantity || 0)}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {part.availability?.inStock || part.stockQuantity || 0} szt
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {(part.pricing?.retailPrice || part.unitPrice || 0).toFixed(2)} zł
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <AllegroQuickSearch
                            partName={part.name || part.partName}
                            partNumber={part.partNumber}
                            compact={true}
                            maxResults={100}
                          />
                          <NorthQuickSearch
                            partName={part.name || part.partName}
                            partNumber={part.partNumber}
                            compact={true}
                            maxResults={20}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(part)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          Edytuj
                        </button>
                        <button
                          onClick={() => handleDelete(part.partId)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  💡 Zarządzanie częściami
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• <strong>Edytuj</strong> - zmień cenę, stan magazynowy, dane części</li>
                  <li>• <strong>Usuń</strong> - usuń część z systemu (nieodwracalne!)</li>
                  <li>• <strong>Dodaj</strong> - wprowadź nową część do katalogu</li>
                  <li>• Niski stan = mniej niż 5 sztuk</li>
                  <li>• Brak = 0 sztuk dostępnych</li>
                </ul>
              </div>
            </div>
          </div>
        </main>

        {/* Add Part Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
              <div className="p-6 max-h-[85vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  📦 Dodaj nową część do magazynu
                </h3>
                
                {/* Photos Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    📸 Zdjęcia części (do 8 zdjęć)
                  </label>
                  <PhotoUploadZone
                    images={newPart.images}
                    onChange={(images) => setNewPart({ ...newPart, images })}
                    maxImages={8}
                    uploadCategory="parts"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nazwa części *
                      </label>
                      <input
                        type="text"
                        value={newPart.name}
                        onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                        placeholder="np. Łożysko bębna Samsung"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Numer katalogowy *
                      </label>
                      <input
                        type="text"
                        value={newPart.partNumber}
                        onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                        placeholder="np. DC97-16151A"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Kategoria
                      </label>
                      <select
                        value={newPart.category}
                        onChange={(e) => setNewPart({ ...newPart, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="AGD">AGD</option>
                        <option value="Electronics">Elektronika</option>
                        <option value="Heating">Ogrzewanie</option>
                        <option value="Other">Inne</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subcategoria
                      </label>
                      <select
                        value={newPart.subcategory}
                        onChange={(e) => setNewPart({ ...newPart, subcategory: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Wybierz...</option>
                        <option value="Pralka">🌀 Pralka</option>
                        <option value="Lodówka">🧊 Lodówka</option>
                        <option value="Zmywarka">💧 Zmywarka</option>
                        <option value="Piekarnik">🔥 Piekarnik</option>
                        <option value="Kuchenka">🍳 Kuchenka</option>
                        <option value="Mikrofalówka">📻 Mikrofalówka</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing & Stock */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cena detaliczna (zł)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newPart.pricing.retailPrice}
                        onChange={(e) => setNewPart({ 
                          ...newPart, 
                          pricing: { ...newPart.pricing, retailPrice: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cena hurtowa (zł)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newPart.pricing.wholesalePrice}
                        onChange={(e) => setNewPart({ 
                          ...newPart, 
                          pricing: { ...newPart.pricing, wholesalePrice: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stan magazynowy (szt)
                      </label>
                      <input
                        type="number"
                        value={newPart.availability.inStock}
                        onChange={(e) => setNewPart({ 
                          ...newPart, 
                          availability: { ...newPart.availability, inStock: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min stan
                      </label>
                      <input
                        type="number"
                        value={newPart.availability.minStock}
                        onChange={(e) => setNewPart({ 
                          ...newPart, 
                          availability: { ...newPart.availability, minStock: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Compatible Brands */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kompatybilne marki
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={brandInput}
                      onChange={(e) => setBrandInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && brandInput.trim()) {
                          setNewPart({ 
                            ...newPart, 
                            compatibleBrands: [...newPart.compatibleBrands, brandInput.trim()] 
                          });
                          setBrandInput('');
                        }
                      }}
                      placeholder="np. Samsung (Enter aby dodać)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (brandInput.trim()) {
                          setNewPart({ 
                            ...newPart, 
                            compatibleBrands: [...newPart.compatibleBrands, brandInput.trim()] 
                          });
                          setBrandInput('');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Dodaj
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newPart.compatibleBrands.map((brand, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                      >
                        {brand}
                        <button
                          type="button"
                          onClick={() => setNewPart({
                            ...newPart,
                            compatibleBrands: newPart.compatibleBrands.filter((_, i) => i !== idx)
                          })}
                          className="hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Compatible Models */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kompatybilne modele
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={modelInput}
                      onChange={(e) => setModelInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && modelInput.trim()) {
                          setNewPart({ 
                            ...newPart, 
                            compatibleModels: [...newPart.compatibleModels, modelInput.trim()] 
                          });
                          setModelInput('');
                        }
                      }}
                      placeholder="np. WW90T4540AE (Enter aby dodać)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (modelInput.trim()) {
                          setNewPart({ 
                            ...newPart, 
                            compatibleModels: [...newPart.compatibleModels, modelInput.trim()] 
                          });
                          setModelInput('');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Dodaj
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newPart.compatibleModels.map((model, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm"
                      >
                        {model}
                        <button
                          type="button"
                          onClick={() => setNewPart({
                            ...newPart,
                            compatibleModels: newPart.compatibleModels.filter((_, i) => i !== idx)
                          })}
                          className="hover:text-green-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opis
                  </label>
                  <textarea
                    value={newPart.description}
                    onChange={(e) => setNewPart({ ...newPart, description: e.target.value })}
                    rows={3}
                    placeholder="Dodatkowe informacje o części..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={handleAddPart}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg"
                  >
                    ✅ Dodaj część
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      // Reset form
                      setNewPart({
                        name: '',
                        partNumber: '',
                        category: 'AGD',
                        subcategory: '',
                        compatibleBrands: [],
                        compatibleModels: [],
                        description: '',
                        images: [],
                        pricing: { retailPrice: 0, wholesalePrice: 0, currency: 'PLN', taxIncluded: true },
                        availability: { inStock: 0, minStock: 3, maxStock: 20, reserved: 0 },
                        specifications: {},
                        supplier: { name: '', deliveryTime: '48h' },
                        installation: { difficulty: 'medium', estimatedTime: 60 }
                      });
                      setBrandInput('');
                      setModelInput('');
                    }}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-lg"
                  >
                    ❌ Anuluj
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingPart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Edytuj część: {editingPart.partId}
                </h3>

                {/* Photo Gallery Editor */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    📸 Zdjęcia części
                  </label>
                  <PhotoUploadZone
                    images={editingPart.images || []}
                    onChange={(images) => {
                      setEditingPart({ 
                        ...editingPart, 
                        images,
                        imageUrl: images.length > 0 ? images[0].url : editingPart.imageUrl
                      });
                    }}
                    maxImages={8}
                    uploadCategory="parts"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nazwa części
                    </label>
                    <input
                      type="text"
                      value={editingPart.partName || ''}
                      onChange={(e) => setEditingPart({ ...editingPart, partName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Numer katalogowy
                    </label>
                    <input
                      type="text"
                      value={editingPart.partNumber || ''}
                      onChange={(e) => setEditingPart({ ...editingPart, partNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kategoria
                    </label>
                    <input
                      type="text"
                      value={editingPart.category || ''}
                      onChange={(e) => setEditingPart({ ...editingPart, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stan magazynowy
                      </label>
                      <input
                        type="number"
                        value={editingPart.stockQuantity || 0}
                        onChange={(e) => setEditingPart({ ...editingPart, stockQuantity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cena jednostkowa (zł)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPart.unitPrice || 0}
                        onChange={(e) => setEditingPart({ ...editingPart, unitPrice: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Zapisz zmiany
                  </button>
                  <button
                    onClick={() => setEditingPart(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Model Selection Modal */}
      {showModelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    🔍 Wybierz model urządzenia
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    System wyświetli części kompatybilne z wybranym modelem
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModelModal(false);
                    setModelSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  placeholder="🔍 Wpisz model (np. WW90T4540AE, SGS4HCW48E)..."
                  className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Znaleziono: {getFilteredModels().length} modeli
              </div>
            </div>

            {/* Models List */}
            <div className="flex-1 overflow-y-auto p-6">
              {getFilteredModels().length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">Nie znaleziono modeli</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Spróbuj wpisać inną nazwę modelu
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getFilteredModels().map((model, index) => {
                    const partsCount = parts.filter(p => 
                      p.compatibleModels?.some(m => m.toLowerCase() === model.toLowerCase())
                    ).length;

                    return (
                      <button
                        key={index}
                        onClick={() => handleAddByModel(model)}
                        className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {model}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {partsCount} {partsCount === 1 ? 'część' : partsCount < 5 ? 'części' : 'części'}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Wybierz model aby zobaczyć kompatybilne części</span>
                </div>
                <button
                  onClick={() => {
                    setShowModelModal(false);
                    setModelSearchQuery('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCR Scanner Modal */}
      <PartNameplateScanner
        isOpen={showOCRScanner}
        onClose={() => setShowOCRScanner(false)}
        parts={parts}
        onPartDetected={(detectedPart) => {
          // Scroll do wykrytej części
          const element = document.getElementById(`part-${detectedPart.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-green-500', 'animate-pulse');
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-green-500', 'animate-pulse');
            }, 3000);
          }
          
          // Pokaż toast
          setSuccessMessage(`✅ Znaleziono część: ${detectedPart.name} (${detectedPart.partNumber})`);
          setTimeout(() => setSuccessMessage(''), 5000);
        }}
      />

      </div>
    </AdminLayout>
  );
}
