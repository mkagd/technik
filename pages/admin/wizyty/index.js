import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import VisitAuditTimeline from '../../../components/VisitAuditTimeline';
import ModelManagerModal from '../../../components/ModelManagerModal';
import { useToast } from '../../../contexts/ToastContext';
import {
  FiCalendar, FiClock, FiUser, FiMapPin, FiTool, FiCheckCircle,
  FiXCircle, FiAlertCircle, FiMoreVertical, FiSearch, FiFilter,
  FiDownload, FiRefreshCw, FiEye, FiEdit, FiTrash2, FiPhone,
  FiMail, FiNavigation, FiImage, FiList, FiGrid, FiBarChart2,
  FiChevronLeft, FiChevronRight, FiX, FiPackage
} from 'react-icons/fi';

/**
 * Admin Visits List Page
 * Complete visit management system with filters, sorting, and bulk actions
 */
export default function AdminVisitsList() {
  const router = useRouter();
  const toast = useToast();
  
  // State management
  const [visits, setVisits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state - ENHANCED for WEEK 3
  const [filters, setFilters] = useState({
    search: '',
    status: '', // Deprecated - use selectedStatuses instead
    selectedStatuses: [], // NEW: Multiple selection
    technicianId: '', // Deprecated - use selectedTechnicianIds instead
    selectedTechnicianIds: [], // NEW: Multiple selection
    type: '',
    dateFrom: '',
    dateTo: '',
    today: false,
    priority: '',
    // NEW Week 3 filters:
    costMin: 0,
    costMax: 1000,
    withParts: null, // null = all, true = only with parts, false = without parts
    withPhotos: null, // null = all, true = only with photos, false = without photos
    urgentOnly: false
  });
  
  // Advanced filter UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
  
  // UI state
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewMode, setViewMode] = useState('table'); // table, grid, calendar
  const [selectedVisits, setSelectedVisits] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Bulk operations modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // 🆕 Modal usuwania
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [bulkOperationError, setBulkOperationError] = useState(null);
  const [bulkOperationSuccess, setBulkOperationSuccess] = useState(null);

  // Photo lightbox
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [photoGallery, setPhotoGallery] = useState([]);

  // Actions menu
  const [actionMenuVisitId, setActionMenuVisitId] = useState(null);

  // Click-outside refs for dropdowns
  const statusDropdownRef = useRef(null);
  const technicianDropdownRef = useRef(null);

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedVisit, setEditedVisit] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Device Models Manager Modal
  const [showModelManager, setShowModelManager] = useState(false);
  const [visitModels, setVisitModels] = useState([]);

  // WEEK 3 PHASE 5: Saved Filter Presets
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetAction, setPresetAction] = useState('save'); // 'save' or 'load'

  // Load saved presets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('visitFilterPresets');
    if (stored) {
      try {
        setSavedPresets(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load presets:', e);
      }
    }
  }, []);

  // Load data
  useEffect(() => {
    loadVisits();
    loadEmployees();
  }, [filters, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Close action menu when clicking outside
  useEffect(() => {
    if (!actionMenuVisitId) return;

    const handleClickOutside = () => {
      setActionMenuVisitId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionMenuVisitId]);

  // Close filter dropdowns when clicking outside - WEEK 3
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (technicianDropdownRef.current && !technicianDropdownRef.current.contains(event.target)) {
        setShowTechnicianDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!showLightbox) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLightbox(false);
      } else if (e.key === 'ArrowLeft' && currentPhoto > 0) {
        setCurrentPhoto(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentPhoto < photoGallery.length - 1) {
        setCurrentPhoto(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, currentPhoto, photoGallery.length]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add basic filters
      params.append('today', filters.today ? 'true' : 'false');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      params.append('includeStats', 'true');
      
      // Add search
      if (filters.search) params.append('search', filters.search);
      
      // WEEK 3: Handle multiple selection arrays for status
      if (filters.selectedStatuses && filters.selectedStatuses.length > 0) {
        params.append('selectedStatuses', filters.selectedStatuses.join(','));
      } else if (filters.status) {
        // Legacy fallback
        params.append('status', filters.status);
      }
      
      // WEEK 3: Handle multiple selection arrays for technicians
      if (filters.selectedTechnicianIds && filters.selectedTechnicianIds.length > 0) {
        params.append('selectedTechnicianIds', filters.selectedTechnicianIds.join(','));
      } else if (filters.technicianId) {
        // Legacy fallback
        params.append('technicianId', filters.technicianId);
      }
      
      // Add other simple filters
      if (filters.type) params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.priority) params.append('priority', filters.priority);

      // WEEK 3 PHASE 2: Add cost range filters
      if (filters.costMin !== undefined && filters.costMin !== 0) {
        params.append('costMin', filters.costMin.toString());
      }
      if (filters.costMax !== undefined && filters.costMax !== 5000) {
        params.append('costMax', filters.costMax.toString());
      }

      // WEEK 3 PHASE 3: Add toggle filters
      if (filters.withParts === true) {
        params.append('withParts', 'true');
      }
      if (filters.withPhotos === true) {
        params.append('withPhotos', 'true');
      }
      if (filters.urgentOnly === true) {
        params.append('urgentOnly', 'true');
      }

      const response = await fetch(`/api/visits?${params}`);
      if (!response.ok) throw new Error('Failed to fetch visits');
      
      const data = await response.json();
      setVisits(data.visits || []);
      setStats(data.stats || null);
      setError(null);
    } catch (err) {
      console.error('Error loading visits:', err);
      setError('Nie udało się pobrać wizyt');
      toast.error('❌ Błąd ładowania wizyt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || data || []);
      } else {
        toast.error('❌ Błąd ładowania techników');
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      toast.error('❌ Nie udało się pobrać listy techników');
    }
  };

  // Bulk operations handlers
  const handleBulkAssign = async (technicianId, technicianName) => {
    setBulkOperationLoading(true);
    setBulkOperationError(null);
    try {
      const response = await fetch('/api/visits/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'assign',
          visitIds: selectedVisits,
          data: {
            technicianId,
            technicianName,
            modifiedBy: 'admin'
          }
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to assign technician');
      
      setBulkOperationSuccess(`Przydzielono technika do ${result.updatedCount} wizyt`);
      toast.success(`✅ Przydzielono ${technicianName} do ${result.updatedCount} wizyt`);
      setShowAssignModal(false);
      setSelectedVisits([]);
      await loadVisits(); // Reload data
      
      setTimeout(() => setBulkOperationSuccess(null), 5000);
    } catch (err) {
      console.error('Bulk assign error:', err);
      setBulkOperationError(err.message);
      toast.error('❌ Błąd przydzielania technika: ' + err.message);
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkReschedule = async (newDate, newTime, reason) => {
    setBulkOperationLoading(true);
    setBulkOperationError(null);
    try {
      const response = await fetch('/api/visits/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'reschedule',
          visitIds: selectedVisits,
          data: {
            newDate,
            newTime,
            reason,
            modifiedBy: 'admin'
          }
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to reschedule visits');
      
      setBulkOperationSuccess(`Przełożono ${result.updatedCount} wizyt`);
      toast.success(`✅ Przełożono ${result.updatedCount} wizyt na ${newDate} ${newTime}`);
      setShowRescheduleModal(false);
      setSelectedVisits([]);
      await loadVisits();
      
      setTimeout(() => setBulkOperationSuccess(null), 5000);
    } catch (err) {
      console.error('Bulk reschedule error:', err);
      setBulkOperationError(err.message);
      toast.error('❌ Błąd przełożenia wizyt: ' + err.message);
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkCancel = async (reason) => {
    setBulkOperationLoading(true);
    setBulkOperationError(null);
    try {
      const response = await fetch('/api/visits/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'cancel',
          visitIds: selectedVisits,
          data: {
            reason,
            cancelledBy: 'admin',
            modifiedBy: 'admin'
          }
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to cancel visits');
      
      setBulkOperationSuccess(`Anulowano ${result.updatedCount} wizyt`);
      toast.success(`✅ Anulowano ${result.updatedCount} wizyt. Powód: ${reason}`);
      setShowCancelModal(false);
      setSelectedVisits([]);
      await loadVisits();
      
      setTimeout(() => setBulkOperationSuccess(null), 5000);
    } catch (err) {
      console.error('Bulk cancel error:', err);
      setBulkOperationError(err.message);
      toast.error('❌ Błąd anulowania wizyt: ' + err.message);
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // 🆕 Bulk delete visits (permanently remove from orders)
  const handleBulkDelete = async (reason) => {
    console.log('🗑️ handleBulkDelete started', { reason, selectedVisits });
    setBulkOperationLoading(true);
    setBulkOperationError(null);
    try {
      console.log('📤 Sending DELETE request to API...');
      const response = await fetch('/api/visits/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'delete',
          visitIds: selectedVisits,
          data: {
            reason,
            deletedBy: 'admin',
            modifiedBy: 'admin'
          }
        })
      });

      console.log('📥 Response received:', response.status, response.ok);
      const result = await response.json();
      console.log('📦 Result:', result);
      
      if (!response.ok) throw new Error(result.error || 'Failed to delete visits');
      
      setBulkOperationSuccess(`Usunięto ${result.deletedCount} wizyt`);
      toast.success(`✅ Usunięto ${result.deletedCount} wizyt z bazy danych`);
      setShowDeleteModal(false);
      setSelectedVisits([]);
      await loadVisits();
      
      setTimeout(() => setBulkOperationSuccess(null), 5000);
    } catch (err) {
      console.error('❌ Bulk delete error:', err);
      setBulkOperationError(err.message);
      toast.error('❌ Błąd usuwania wizyt: ' + err.message);
    } finally {
      console.log('✅ handleBulkDelete finished');
      setBulkOperationLoading(false);
    }
  };

  // Edit mode handlers
  const handleEditMode = () => {
    setIsEditMode(true);
    setEditedVisit({ ...selectedVisit });
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedVisit(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSaveEdit = async () => {
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/visits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: editedVisit.visitId,
          orderId: editedVisit.orderId,
          updates: {
            status: editedVisit.status,
            scheduledDate: editedVisit.scheduledDate,
            scheduledTime: editedVisit.scheduledTime,
            technicianId: editedVisit.technicianId,
            technicianName: editedVisit.technicianName,
            technicianNotes: editedVisit.technicianNotes
          },
          userId: 'admin', // TODO: Get from session
          userName: 'Administrator',
          reason: `Edycja wizyty przez panel administracyjny`,
          modifiedBy: 'admin'
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update visit');

      setSaveSuccess(true);
      toast.success(`✅ Wizyta ${editedVisit.visitId} zaktualizowana pomyślnie!`);
      setIsEditMode(false);
      await loadVisits();

      // Update selectedVisit with new data
      const updatedVisit = visits.find(v => v.visitId === editedVisit.visitId);
      if (updatedVisit) {
        setSelectedVisit(updatedVisit);
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save edit error:', err);
      setSaveError(err.message);
      toast.error('❌ Błąd zapisywania zmian: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Cancel visit handler
  const handleCancelVisit = async (visit) => {
    if (!confirm(`Czy na pewno chcesz anulować wizytę ${visit.visitId}?\n\nKlient: ${visit.clientName}\nData: ${visit.scheduledDate} ${visit.scheduledTime}\n\nTa operacja może być cofnięta z historii zmian.`)) {
      return;
    }

    try {
      const response = await fetch('/api/visits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: visit.visitId,
          orderId: visit.orderId,
          updates: {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelledBy: 'admin', // TODO: Get from session
            cancelReason: 'Anulowano z panelu administracyjnego'
          },
          userId: 'admin', // TODO: Get from session
          userName: 'Administrator',
          reason: `Anulowano wizytę ${visit.visitId} dla klienta ${visit.clientName}`,
          modifiedBy: 'admin'
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to cancel visit');

      toast.success(`✅ Wizyta ${visit.visitId} została anulowana`);
      await loadVisits(); // Reload visits list

      // Close modal if it's the currently displayed visit
      if (selectedVisit?.visitId === visit.visitId) {
        setShowDetailModal(false);
        setSelectedVisit(null);
      }
    } catch (err) {
      console.error('Cancel visit error:', err);
      toast.error('❌ Błąd anulowania wizyty: ' + err.message);
    }
  };

  // Model Manager handler
  const handleModelsUpdate = async (models, cart) => {
    console.log('🔍 Aktualizacja modeli dla wizyty:', selectedVisit.visitId);
    console.log('📦 Modele:', models);
    console.log('🛒 Koszyk części:', cart);
    
    try {
      // Zapisz modele do wizyty
      const response = await fetch('/api/visits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: selectedVisit.visitId,
          orderId: selectedVisit.orderId,
          updates: {
            models: models,
            partsCart: cart
          },
          userId: 'admin',
          userName: 'Administrator',
          reason: `Zaktualizowano modele urządzeń (${models.length} modeli)`,
          modifiedBy: 'admin'
        })
      });

      if (response.ok) {
        toast.success(`✅ Zapisano ${models.length} modeli dla wizyty ${selectedVisit.visitId}`);
        setVisitModels(models);
        await loadVisits(); // Odśwież listę wizyt
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Błąd zapisu modeli');
      }
    } catch (err) {
      console.error('Error saving models:', err);
      toast.error('❌ Błąd zapisu modeli: ' + err.message);
    }
  };

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      technicianId: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      today: false,
      priority: '',
      // WEEK 3: Clear new filter arrays
      selectedStatuses: [],
      selectedTechnicianIds: [],
      costMin: 0,
      costMax: 1000,
      withParts: null,
      withPhotos: null,
      urgentOnly: false
    });
    setCurrentPage(1);
  };

  const handleQuickFilter = (filterType) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    switch (filterType) {
      case 'today':
        setFilters(prev => ({ ...prev, today: true, dateFrom: '', dateTo: '' }));
        break;
      case 'tomorrow':
        setFilters(prev => ({ ...prev, today: false, dateFrom: tomorrow, dateTo: tomorrow }));
        break;
      case 'scheduled':
        // WEEK 3: Toggle status in array instead of single value
        setFilters(prev => ({
          ...prev,
          selectedStatuses: prev.selectedStatuses.includes('scheduled')
            ? prev.selectedStatuses.filter(s => s !== 'scheduled')
            : [...prev.selectedStatuses, 'scheduled'],
          status: '' // Clear legacy
        }));
        break;
      case 'in_progress':
        // WEEK 3: Toggle status in array
        setFilters(prev => ({
          ...prev,
          selectedStatuses: prev.selectedStatuses.includes('in_progress')
            ? prev.selectedStatuses.filter(s => s !== 'in_progress')
            : [...prev.selectedStatuses, 'in_progress'],
          status: '' // Clear legacy
        }));
        break;
      case 'completed':
        // WEEK 3: Toggle status in array
        setFilters(prev => ({
          ...prev,
          selectedStatuses: prev.selectedStatuses.includes('completed')
            ? prev.selectedStatuses.filter(s => s !== 'completed')
            : [...prev.selectedStatuses, 'completed'],
          status: '' // Clear legacy
        }));
        break;
    }
    setCurrentPage(1);
  };

  // WEEK 3 PHASE 5: Preset management functions
  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('❌ Podaj nazwę presetu');
      return;
    }

    const preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...filters },
      sortBy,
      sortOrder,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    localStorage.setItem('visitFilterPresets', JSON.stringify(updated));
    
    setPresetName('');
    setShowPresetModal(false);
    toast.success(`✅ Preset "${preset.name}" zapisany`);
  };

  const loadPreset = (preset) => {
    setFilters(preset.filters);
    setSortBy(preset.sortBy);
    setSortOrder(preset.sortOrder);
    setCurrentPage(1);
    setShowPresetModal(false);
    toast.success(`✅ Załadowano preset "${preset.name}"`);
  };

  const deletePreset = (presetId) => {
    const updated = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updated);
    localStorage.setItem('visitFilterPresets', JSON.stringify(updated));
    toast.success('✅ Preset usunięty');
  };

  // Selection handlers
  const handleSelectVisit = (visitId) => {
    setSelectedVisits(prev => 
      prev.includes(visitId)
        ? prev.filter(id => id !== visitId)
        : [...prev, visitId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVisits.length === visits.length) {
      setSelectedVisits([]);
    } else {
      setSelectedVisits(visits.map(v => v.visitId));
    }
  };

  // WEEK 3 PHASE 4: Generate active filter chips
  const getActiveFiltersChips = () => {
    const chips = [];

    // Search query
    if (filters.search) {
      chips.push({
        id: 'search',
        label: `🔍 "${filters.search}"`,
        onRemove: () => setFilters({ ...filters, search: '' })
      });
    }

    // Selected statuses
    if (filters.selectedStatuses && filters.selectedStatuses.length > 0) {
      const statusLabels = {
        scheduled: 'Zaplanowane',
        in_progress: 'W trakcie',
        completed: 'Zakończone',
        cancelled: 'Anulowane',
        rescheduled: 'Przełożone'
      };
      chips.push({
        id: 'statuses',
        label: `📊 Statusy: ${filters.selectedStatuses.map(s => statusLabels[s]).join(', ')}`,
        onRemove: () => setFilters({ ...filters, selectedStatuses: [] })
      });
    }

    // Selected technicians
    if (filters.selectedTechnicianIds && filters.selectedTechnicianIds.length > 0) {
      const techNames = filters.selectedTechnicianIds
        .map(id => employees.find(e => e.id === id)?.name || id)
        .join(', ');
      chips.push({
        id: 'technicians',
        label: `👤 Technicy: ${techNames}`,
        onRemove: () => setFilters({ ...filters, selectedTechnicianIds: [] })
      });
    }

    // Visit type
    if (filters.type) {
      const typeLabels = {
        diagnosis: 'Diagnoza',
        repair: 'Naprawa',
        followup: 'Kontrola',
        installation: 'Instalacja',
        maintenance: 'Konserwacja'
      };
      chips.push({
        id: 'type',
        label: `🔧 ${typeLabels[filters.type] || filters.type}`,
        onRemove: () => setFilters({ ...filters, type: '' })
      });
    }

    // Date range
    if (filters.dateFrom || filters.dateTo) {
      const dateLabel = filters.dateFrom && filters.dateTo
        ? `${filters.dateFrom} - ${filters.dateTo}`
        : filters.dateFrom
        ? `Od ${filters.dateFrom}`
        : `Do ${filters.dateTo}`;
      chips.push({
        id: 'dateRange',
        label: `📅 ${dateLabel}`,
        onRemove: () => setFilters({ ...filters, dateFrom: '', dateTo: '' })
      });
    }

    // Today filter
    if (filters.today) {
      chips.push({
        id: 'today',
        label: '📅 Dzisiaj',
        onRemove: () => setFilters({ ...filters, today: false })
      });
    }

    // Cost range (only if different from default)
    if (filters.costMin > 0 || filters.costMax < 5000) {
      chips.push({
        id: 'costRange',
        label: `💰 ${filters.costMin} zł - ${filters.costMax} zł`,
        onRemove: () => setFilters({ ...filters, costMin: 0, costMax: 5000 })
      });
    }

    // With parts toggle
    if (filters.withParts === true) {
      chips.push({
        id: 'withParts',
        label: '📦 Z częściami',
        onRemove: () => setFilters({ ...filters, withParts: null })
      });
    }

    // With photos toggle
    if (filters.withPhotos === true) {
      chips.push({
        id: 'withPhotos',
        label: '🖼️ Ze zdjęciami',
        onRemove: () => setFilters({ ...filters, withPhotos: null })
      });
    }

    // Urgent only toggle
    if (filters.urgentOnly) {
      chips.push({
        id: 'urgentOnly',
        label: '🔥 Tylko pilne',
        onRemove: () => setFilters({ ...filters, urgentOnly: false })
      });
    }

    return chips;
  };

  // Status helpers
  const getStatusConfig = (status) => {
    const configs = {
      scheduled: {
        label: 'Zaplanowane',
        icon: FiCalendar,
        color: 'text-yellow-700 bg-yellow-100 border-yellow-300'
      },
      in_progress: {
        label: 'W trakcie',
        icon: FiClock,
        color: 'text-blue-700 bg-blue-100 border-blue-300'
      },
      completed: {
        label: 'Zakończone',
        icon: FiCheckCircle,
        color: 'text-green-700 bg-green-100 border-green-300'
      },
      cancelled: {
        label: 'Anulowane',
        icon: FiXCircle,
        color: 'text-red-700 bg-red-100 border-red-300'
      },
      rescheduled: {
        label: 'Przełożone',
        icon: FiAlertCircle,
        color: 'text-orange-700 bg-orange-100 border-orange-300'
      }
    };
    return configs[status] || configs.scheduled;
  };

  const getTypeLabel = (type) => {
    const labels = {
      diagnosis: '🔍 Diagnoza',
      repair: '🔧 Naprawa',
      followup: '🔄 Kontrola',
      installation: '📦 Instalacja',
      maintenance: '🛠️ Konserwacja'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // HH:MM
  };

  // Export handler
  const handleExportCSV = () => {
    try {
      const csvRows = [];
      const headers = ['ID', 'Data', 'Godzina', 'Status', 'Klient', 'Telefon', 'Adres', 'Urządzenie', 'Technik', 'Typ', 'Koszt'];
      csvRows.push(headers.join(','));

      visits.forEach(visit => {
        const row = [
          visit.visitId,
          formatDate(visit.scheduledDate || visit.date),
          formatTime(visit.scheduledTime || visit.time),
          getStatusConfig(visit.status).label,
          visit.clientName,
          visit.clientPhone,
          visit.address,
          `${visit.deviceType} ${visit.deviceBrand}`,
          visit.technicianName,
          getTypeLabel(visit.type),
          visit.totalCost || 0
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `wizyty_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success(`✅ Wyeksportowano ${visits.length} wizyt do CSV`);
    } catch (err) {
      console.error('CSV export error:', err);
      toast.error('❌ Błąd eksportu CSV: ' + err.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFontSize(20);
      doc.setTextColor(31, 41, 55); // gray-900
      doc.text('Raport wizyt serwisowych', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // gray-600
      doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 14, 22);
      
      // Stats summary
      let yPos = 30;
      if (stats) {
        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.text('Podsumowanie:', 14, yPos);
        
        doc.setFontSize(10);
        doc.setTextColor(75, 85, 99);
        yPos += 7;
        doc.text(`• Wszystkie wizyty: ${stats.total}`, 20, yPos);
        yPos += 5;
        doc.text(`• Dziś: ${stats.today}`, 20, yPos);
        yPos += 5;
        doc.text(`• Ten tydzień: ${stats.thisWeek}`, 20, yPos);
        yPos += 5;
        doc.text(`• Zakończone: ${stats.completed}`, 20, yPos);
        yPos += 10;
      }

      // Table data
      const tableData = visits.map(visit => [
        visit.visitId,
        formatDate(visit.scheduledDate || visit.date),
        formatTime(visit.scheduledTime || visit.time),
        getStatusConfig(visit.status).label,
        visit.clientName,
        visit.address.substring(0, 30) + '...',
        `${visit.deviceType} ${visit.deviceBrand}`.substring(0, 25),
        visit.technicianName,
        `${visit.totalCost || 0} zł`
      ]);

      // @ts-ignore - jspdf-autotable adds autoTable to jsPDF
      doc.autoTable({
        startY: yPos,
        head: [['ID', 'Data', 'Godz.', 'Status', 'Klient', 'Adres', 'Urządzenie', 'Technik', 'Koszt']],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [59, 130, 246], // blue-500
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // gray-50
        },
        margin: { top: yPos, left: 14, right: 14 }
      });

      // Footer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `Strona ${i} z ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      doc.save(`raport_wizyt_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`✅ Wygenerowano raport PDF z ${visits.length} wizytami`);
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('❌ Błąd generowania PDF: ' + err.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const XLSX = await import('xlsx');

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Main Visits Data
      const visitsData = visits.map(visit => ({
        'ID': visit.visitId,
        'Data': formatDate(visit.scheduledDate || visit.date),
        'Godzina': formatTime(visit.scheduledTime || visit.time),
        'Status': getStatusConfig(visit.status).label,
        'Klient': visit.clientName,
        'Telefon': visit.clientPhone,
        'Adres': visit.address,
        'Typ urządzenia': visit.deviceType,
        'Marka': visit.deviceBrand,
        'Model': visit.deviceModel,
        'Technik': visit.technicianName,
        'Typ wizyty': getTypeLabel(visit.type),
        'Koszt (zł)': visit.totalCost || 0,
        'Koszt części (zł)': visit.partsCost || 0,
        'Liczba części': visit.partsUsed?.length || 0,
        'Liczba zdjęć': visit.totalPhotos || 0
      }));

      const ws1 = XLSX.utils.json_to_sheet(visitsData);
      
      // Set column widths
      ws1['!cols'] = [
        { wch: 10 }, // ID
        { wch: 12 }, // Data
        { wch: 8 },  // Godzina
        { wch: 12 }, // Status
        { wch: 20 }, // Klient
        { wch: 15 }, // Telefon
        { wch: 30 }, // Adres
        { wch: 15 }, // Typ urządzenia
        { wch: 15 }, // Marka
        { wch: 15 }, // Model
        { wch: 20 }, // Technik
        { wch: 12 }, // Typ wizyty
        { wch: 12 }, // Koszt
        { wch: 12 }, // Koszt części
        { wch: 12 }, // Liczba części
        { wch: 12 }  // Liczba zdjęć
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'Wizyty');

      // Sheet 2: Statistics Summary
      if (stats) {
        const statsData = [
          { 'Metryka': 'Wszystkie wizyty', 'Wartość': stats.total },
          { 'Metryka': 'Wizyty dziś', 'Wartość': stats.today },
          { 'Metryka': 'Wizyty ten tydzień', 'Wartość': stats.thisWeek },
          { 'Metryka': 'Zakończone', 'Wartość': stats.completed },
          { 'Metryka': 'Zaplanowane', 'Wartość': stats.scheduled || 0 },
          { 'Metryka': 'W trakcie', 'Wartość': stats.inProgress || 0 },
          { 'Metryka': 'Anulowane', 'Wartość': stats.cancelled || 0 },
          { 'Metryka': 'Łączny koszt (zł)', 'Wartość': stats.totalCost || 0 },
          { 'Metryka': 'Koszt części (zł)', 'Wartość': stats.totalPartsCost || 0 }
        ];

        const ws2 = XLSX.utils.json_to_sheet(statsData);
        ws2['!cols'] = [{ wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Statystyki');
      }

      // Sheet 3: Visits by Technician
      const technicianStats = {};
      visits.forEach(visit => {
        const techName = visit.technicianName || 'Nieprzydzielony';
        if (!technicianStats[techName]) {
          technicianStats[techName] = {
            'Technik': techName,
            'Liczba wizyt': 0,
            'Zakończone': 0,
            'W trakcie': 0,
            'Zaplanowane': 0,
            'Anulowane': 0,
            'Łączny koszt (zł)': 0
          };
        }
        technicianStats[techName]['Liczba wizyt']++;
        technicianStats[techName]['Łączny koszt (zł)'] += visit.totalCost || 0;
        
        if (visit.status === 'completed') technicianStats[techName]['Zakończone']++;
        if (visit.status === 'in_progress') technicianStats[techName]['W trakcie']++;
        if (visit.status === 'scheduled') technicianStats[techName]['Zaplanowane']++;
        if (visit.status === 'cancelled') technicianStats[techName]['Anulowane']++;
      });

      const ws3 = XLSX.utils.json_to_sheet(Object.values(technicianStats));
      ws3['!cols'] = [
        { wch: 25 }, // Technik
        { wch: 12 }, // Liczba wizyt
        { wch: 12 }, // Zakończone
        { wch: 12 }, // W trakcie
        { wch: 12 }, // Zaplanowane
        { wch: 12 }, // Anulowane
        { wch: 15 }  // Łączny koszt
      ];
      XLSX.utils.book_append_sheet(wb, ws3, 'Według technika');

      // Sheet 4: Visits by Status
      const statusStats = [
        { 'Status': 'Zaplanowana', 'Liczba': visits.filter(v => v.status === 'scheduled').length },
        { 'Status': 'W trakcie', 'Liczba': visits.filter(v => v.status === 'in_progress').length },
        { 'Status': 'Zakończona', 'Liczba': visits.filter(v => v.status === 'completed').length },
        { 'Status': 'Anulowana', 'Liczba': visits.filter(v => v.status === 'cancelled').length }
      ];

      const ws4 = XLSX.utils.json_to_sheet(statusStats);
      ws4['!cols'] = [{ wch: 20 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws4, 'Według statusu');

      // Save file
      XLSX.writeFile(wb, `raport_wizyt_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`✅ Wygenerowano raport Excel z ${visits.length} wizytami (4 arkusze)`);
    } catch (err) {
      console.error('Excel export error:', err);
      toast.error('❌ Błąd generowania Excel: ' + err.message);
    }
  };

  if (loading && visits.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FiCalendar className="w-16 h-16 text-blue-600 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Ładowanie wizyt...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Lista wizyt - Admin Panel</title>
        <meta name="description" content="Zarządzanie wizytami serwisowymi" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FiCalendar className="w-7 h-7 text-blue-600" />
                  Lista wizyt
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Zarządzaj wszystkimi wizytami serwisowymi
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* View mode toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
                    title="Widok tabeli"
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    title="Widok siatki"
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.push('/admin/wizyty/kalendarz')}
                    className="p-2 rounded hover:bg-white"
                    title="Widok kalendarza"
                  >
                    <FiCalendar className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FiDownload className="w-4 h-4" />
                  CSV
                </button>

                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  <FiDownload className="w-4 h-4" />
                  Excel
                </button>

                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <FiDownload className="w-4 h-4" />
                  PDF
                </button>

                <button
                  onClick={loadVisits}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  disabled={loading}
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Odśwież
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Wszystkie wizyty</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <FiCalendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Dzisiaj</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                  </div>
                  <FiClock className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ten tydzień</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                  </div>
                  <FiBarChart2 className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Zakończone</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus.completed}</p>
                  </div>
                  <FiCheckCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiFilter className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Filtry</h3>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showFilters ? 'Ukryj' : 'Pokaż'}
              </button>
            </div>

            {showFilters && (
              <div className="space-y-4">
                {/* WEEK 3 PHASE 5: Saved Presets Quick Access */}
                {savedPresets.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase">💾 Zapisane Presety</span>
                      <button
                        onClick={() => {
                          setPresetAction('load');
                          setShowPresetModal(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Zarządzaj
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {savedPresets.slice(0, 5).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => loadPreset(preset)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick filters */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setPresetAction('save');
                      setShowPresetModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition flex items-center gap-1"
                  >
                    <FiPackage className="w-4 h-4" />
                    Zapisz obecne filtry
                  </button>
                  
                  <button
                    onClick={() => handleQuickFilter('today')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filters.today
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Dzisiaj
                  </button>
                  <button
                    onClick={() => handleQuickFilter('tomorrow')}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    Jutro
                  </button>
                  <button
                    onClick={() => handleQuickFilter('scheduled')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filters.selectedStatuses.includes('scheduled')
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Zaplanowane
                  </button>
                  <button
                    onClick={() => handleQuickFilter('in_progress')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filters.selectedStatuses.includes('in_progress')
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    W trakcie
                  </button>
                  <button
                    onClick={() => handleQuickFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filters.selectedStatuses.includes('completed')
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Zakończone
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                  >
                    Wyczyść filtry
                  </button>
                </div>

                {/* Advanced filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Szukaj..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Status filter - ENHANCED: Multiple selection */}
                  <div className="relative" ref={statusDropdownRef}>
                    <button
                      onClick={() => {
                        setShowStatusDropdown(!showStatusDropdown);
                        setShowTechnicianDropdown(false);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between bg-white hover:bg-gray-50 transition"
                    >
                      <span className="font-medium">
                        {filters.selectedStatuses.length === 0 
                          ? 'Wszystkie statusy'
                          : `Statusy (${filters.selectedStatuses.length})`}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showStatusDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                        <div className="space-y-2">
                          {['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'].map(status => (
                            <label key={status} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.selectedStatuses.includes(status)}
                                onChange={(e) => {
                                  const newStatuses = e.target.checked
                                    ? [...filters.selectedStatuses, status]
                                    : filters.selectedStatuses.filter(s => s !== status);
                                  setFilters({ ...filters, selectedStatuses: newStatuses, status: '' });
                                  setCurrentPage(1);
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium">
                                {status === 'scheduled' && '📅 Zaplanowane'}
                                {status === 'in_progress' && '⚙️ W trakcie'}
                                {status === 'completed' && '✅ Zakończone'}
                                {status === 'cancelled' && '❌ Anulowane'}
                                {status === 'rescheduled' && '🔄 Przełożone'}
                              </span>
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() => setFilters({ ...filters, selectedStatuses: [] })}
                          className="mt-2 w-full py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Wyczyść zaznaczenie
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Technician filter - ENHANCED: Multiple selection */}
                  <div className="relative" ref={technicianDropdownRef}>
                    <button
                      onClick={() => {
                        setShowTechnicianDropdown(!showTechnicianDropdown);
                        setShowStatusDropdown(false);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between bg-white hover:bg-gray-50 transition"
                    >
                      <span className="font-medium">
                        {filters.selectedTechnicianIds.length === 0 
                          ? 'Wszyscy technicy'
                          : `Technicy (${filters.selectedTechnicianIds.length})`}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showTechnicianDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {employees.map(emp => (
                            <label key={emp.id} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.selectedTechnicianIds.includes(emp.id)}
                                onChange={(e) => {
                                  const newTechIds = e.target.checked
                                    ? [...filters.selectedTechnicianIds, emp.id]
                                    : filters.selectedTechnicianIds.filter(id => id !== emp.id);
                                  setFilters({ ...filters, selectedTechnicianIds: newTechIds, technicianId: '' });
                                  setCurrentPage(1);
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium">{emp.name}</span>
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() => setFilters({ ...filters, selectedTechnicianIds: [] })}
                          className="mt-2 w-full py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Wyczyść zaznaczenie
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Type filter */}
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wszystkie typy</option>
                    <option value="diagnosis">Diagnoza</option>
                    <option value="repair">Naprawa</option>
                    <option value="followup">Kontrola</option>
                    <option value="installation">Instalacja</option>
                    <option value="maintenance">Konserwacja</option>
                  </select>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data od
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data do
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* WEEK 3 PHASE 2: Cost Range Slider */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    💰 Zakres kosztów: <span className="text-blue-600 font-semibold">{filters.costMin} zł - {filters.costMax} zł</span>
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="50"
                          value={filters.costMin}
                          onChange={(e) => {
                            const newMin = parseInt(e.target.value);
                            if (newMin <= filters.costMax) {
                              setFilters({ ...filters, costMin: newMin });
                              setCurrentPage(1);
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="text-xs text-gray-500 mt-1">{filters.costMin} zł</div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="50"
                          value={filters.costMax}
                          onChange={(e) => {
                            const newMax = parseInt(e.target.value);
                            if (newMax >= filters.costMin) {
                              setFilters({ ...filters, costMax: newMax });
                              setCurrentPage(1);
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="text-xs text-gray-500 mt-1">{filters.costMax} zł</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setFilters({ ...filters, costMin: 0, costMax: 500 });
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                      >
                        0-500 zł
                      </button>
                      <button
                        onClick={() => {
                          setFilters({ ...filters, costMin: 500, costMax: 1500 });
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                      >
                        500-1500 zł
                      </button>
                      <button
                        onClick={() => {
                          setFilters({ ...filters, costMin: 1500, costMax: 5000 });
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                      >
                        1500+ zł
                      </button>
                      <button
                        onClick={() => {
                          setFilters({ ...filters, costMin: 0, costMax: 5000 });
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* WEEK 3 PHASE 3: Toggle Switches */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    🔧 Dodatkowe filtry
                  </label>
                  <div className="space-y-3">
                    {/* With Parts Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center gap-2">
                        <FiPackage className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Tylko z użytymi częściami</span>
                      </div>
                      <button
                        onClick={() => {
                          setFilters({ 
                            ...filters, 
                            withParts: filters.withParts === true ? null : true 
                          });
                          setCurrentPage(1);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          filters.withParts === true ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            filters.withParts === true ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* With Photos Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center gap-2">
                        <FiImage className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Tylko ze zdjęciami</span>
                      </div>
                      <button
                        onClick={() => {
                          setFilters({ 
                            ...filters, 
                            withPhotos: filters.withPhotos === true ? null : true 
                          });
                          setCurrentPage(1);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          filters.withPhotos === true ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            filters.withPhotos === true ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Urgent Only Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center gap-2">
                        <FiAlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-700">Tylko pilne</span>
                      </div>
                      <button
                        onClick={() => {
                          setFilters({ 
                            ...filters, 
                            urgentOnly: !filters.urgentOnly 
                          });
                          setCurrentPage(1);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          filters.urgentOnly ? 'bg-red-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            filters.urgentOnly ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk actions */}
          {selectedVisits.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Zaznaczono {selectedVisits.length} {selectedVisits.length === 1 ? 'wizytę' : 'wizyt'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                >
                  Przydziel technika
                </button>
                <button 
                  onClick={() => setShowRescheduleModal(true)}
                  className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                >
                  Zmień datę
                </button>
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition text-sm font-medium"
                >
                  Anuluj
                </button>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                >
                  Usuń trwale
                </button>
              </div>
            </div>
          )}

          {/* Visits Table */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && visits.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Brak wizyt
              </h3>
              <p className="text-gray-600 mb-4">
                Nie znaleziono wizyt spełniających kryteria filtrowania
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Wyczyść filtry
              </button>
            </div>
          ) : (
            <>
              {/* WEEK 3 PHASE 4: Active Filter Chips */}
              {(() => {
                const activeChips = getActiveFiltersChips();
                return activeChips.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">
                        🎯 Aktywne filtry ({activeChips.length})
                      </span>
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition"
                      >
                        <FiX className="w-3 h-3" />
                        Wyczyść wszystkie
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeChips.map((chip) => (
                        <div
                          key={chip.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 rounded-full text-sm font-medium text-gray-700 shadow-sm hover:shadow-md transition group"
                        >
                          <span>{chip.label}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              chip.onRemove();
                            }}
                            className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white transition-colors group-hover:bg-gray-300"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Sorting Controls - WEEK 3 ENHANCEMENT */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sortuj:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSortBy('date');
                        setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                        sortBy === 'date'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📅 Data
                      {sortBy === 'date' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSortBy('waitTime');
                        setSortOrder(sortBy === 'waitTime' && sortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                        sortBy === 'waitTime'
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ⏰ Najdłużej czekające
                      {sortBy === 'waitTime' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSortBy('priority');
                        setSortOrder(sortBy === 'priority' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                        sortBy === 'priority'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🔥 Priorytet
                      {sortBy === 'priority' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSortBy('client');
                        setSortOrder(sortBy === 'client' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                        sortBy === 'client'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      👤 Klient
                      {sortBy === 'client' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSortBy('cost');
                        setSortOrder(sortBy === 'cost' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                        sortBy === 'cost'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      💰 Koszt
                      {sortBy === 'cost' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  Wyników: <span className="font-semibold text-gray-900">{visits.length}</span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedVisits.length === visits.length && visits.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Data & Czas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Klient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Urządzenie
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Technik
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Typ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Koszt
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visits.map((visit) => {
                      const statusConfig = getStatusConfig(visit.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr
                          key={visit.visitId}
                          className="hover:bg-gray-50 transition cursor-pointer"
                          onClick={() => {
                            setSelectedVisit(visit);
                            setShowDetailModal(true);
                          }}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedVisits.includes(visit.visitId)}
                              onChange={() => handleSelectVisit(visit.visitId)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(visit.scheduledDate || visit.date)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatTime(visit.scheduledTime || visit.time)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {visit.clientName}
                            </div>
                            <div className="text-sm text-gray-600 truncate max-w-xs">
                              {visit.address}
                            </div>
                            <div className="text-xs text-gray-500">
                              {visit.clientPhone}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {visit.deviceType}
                            </div>
                            <div className="text-sm text-gray-600">
                              {visit.deviceBrand} {visit.deviceModel}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <FiUser className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {visit.technicianName}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">
                              {getTypeLabel(visit.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {visit.totalCost ? `${visit.totalCost} zł` : '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <button
                                onClick={() => setActionMenuVisitId(actionMenuVisitId === visit.visitId ? null : visit.visitId)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                              >
                                <FiMoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                              
                              {/* Dropdown menu */}
                              {actionMenuVisitId === visit.visitId && (
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVisit(visit);
                                        setShowDetailModal(true);
                                        setActionMenuVisitId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <FiEye className="w-4 h-4" />
                                      Zobacz szczegóły
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVisit(visit);
                                        setEditedVisit({ ...visit });
                                        setIsEditMode(true);
                                        setShowDetailModal(true);
                                        setActionMenuVisitId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <FiEdit className="w-4 h-4" />
                                      Edytuj wizytę
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/admin/zamowienia/${visit.orderId}`);
                                        setActionMenuVisitId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <FiPackage className="w-4 h-4" />
                                      Zobacz zamówienie
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVisit(visit);
                                        setVisitModels(visit.models || []);
                                        setShowModelManager(true);
                                        setActionMenuVisitId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                                    >
                                      <FiTool className="w-4 h-4" />
                                      Zarządzaj modelami
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionMenuVisitId(null);
                                        handleCancelVisit(visit);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                      disabled={visit.status === 'cancelled'}
                                    >
                                      <FiXCircle className="w-4 h-4" />
                                      {visit.status === 'cancelled' ? 'Już anulowana' : 'Anuluj wizytę'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {visits.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Pokaż</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-sm text-gray-600">wizyt</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Poprzednia
                    </button>
                    <span className="text-sm text-gray-600">
                      Strona {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={visits.length < itemsPerPage}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Następna
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Detail Modal */}
      {showDetailModal && selectedVisit && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Wizyta #{selectedVisit.visitId}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Zamówienie #{selectedVisit.orderId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditMode && (
                    <button
                      onClick={handleEditMode}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                    >
                      <FiEdit className="w-4 h-4" />
                      Edytuj
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setIsEditMode(false);
                      setEditedVisit(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <FiXCircle className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Status Badge / Edit */}
              <div className="mb-6">
                {isEditMode ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status wizyty
                    </label>
                    <select
                      value={editedVisit.status}
                      onChange={(e) => setEditedVisit({ ...editedVisit, status: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="scheduled">Zaplanowana</option>
                      <option value="in_progress">W trakcie</option>
                      <option value="completed">Zakończona</option>
                      <option value="cancelled">Anulowana</option>
                    </select>
                  </div>
                ) : (
                  <>
                    {selectedVisit.status === 'scheduled' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        <FiClock className="w-4 h-4" />
                        Zaplanowana
                      </span>
                    )}
                    {selectedVisit.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        <FiAlertCircle className="w-4 h-4" />
                        W trakcie
                      </span>
                    )}
                    {selectedVisit.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <FiCheckCircle className="w-4 h-4" />
                        Zakończona
                      </span>
                    )}
                    {selectedVisit.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        <FiXCircle className="w-4 h-4" />
                        Anulowana
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left Column - Client & Device */}
                <div className="space-y-4">
                  {/* Client Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      Klient
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-900 font-medium">{selectedVisit.clientName}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <FiMapPin className="w-4 h-4" />
                        {selectedVisit.address}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <FiPhone className="w-4 h-4" />
                        {selectedVisit.clientPhone}
                      </p>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FiTool className="w-4 h-4" />
                        Urządzenie
                      </h3>
                      <button
                        onClick={() => setShowModelManager(true)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        <FiPackage className="w-3 h-3" />
                        Zarządzaj modelami
                      </button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-900 font-medium">
                        {selectedVisit.deviceType}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedVisit.deviceBrand} {selectedVisit.deviceModel}
                      </p>
                      {selectedVisit.deviceSerialNumber && (
                        <p className="text-xs text-gray-500">
                          S/N: {selectedVisit.deviceSerialNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Visit Details */}
                <div className="space-y-4">
                  {/* Visit Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Szczegóły wizyty
                    </h3>
                    {isEditMode ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Data:</label>
                          <input
                            type="date"
                            value={editedVisit.scheduledDate}
                            onChange={(e) => setEditedVisit({ ...editedVisit, scheduledDate: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Godzina:</label>
                          <input
                            type="time"
                            value={editedVisit.scheduledTime || ''}
                            onChange={(e) => setEditedVisit({ ...editedVisit, scheduledTime: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Typ:</label>
                          <div className="text-sm text-gray-900 font-medium">
                            {selectedVisit.type === 'diagnostic' && 'Diagnostyka'}
                            {selectedVisit.type === 'repair' && 'Naprawa'}
                            {selectedVisit.type === 'installation' && 'Instalacja'}
                            {selectedVisit.type === 'maintenance' && 'Konserwacja'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Technik:</label>
                          <select
                            value={editedVisit.technicianId || ''}
                            onChange={(e) => {
                              const tech = employees.find(emp => emp.id === e.target.value);
                              setEditedVisit({
                                ...editedVisit,
                                technicianId: e.target.value,
                                technicianName: tech ? `${tech.name} ${tech.surname}` : ''
                              });
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Wybierz technika...</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} {emp.surname}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedVisit.totalCost && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Koszt:</span>
                              <span className="text-gray-900 font-bold">{selectedVisit.totalCost} zł</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Data:</span>
                          <span className="text-gray-900 font-medium">{selectedVisit.scheduledDate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Godzina:</span>
                          <span className="text-gray-900 font-medium">{selectedVisit.scheduledTime || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Typ:</span>
                          <span className="text-gray-900 font-medium">
                            {selectedVisit.type === 'diagnostic' && 'Diagnostyka'}
                            {selectedVisit.type === 'repair' && 'Naprawa'}
                            {selectedVisit.type === 'installation' && 'Instalacja'}
                            {selectedVisit.type === 'maintenance' && 'Konserwacja'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Technik:</span>
                          <span className="text-gray-900 font-medium">{selectedVisit.technicianName}</span>
                        </div>
                        {selectedVisit.totalCost && (
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Koszt:</span>
                            <span className="text-gray-900 font-bold">{selectedVisit.totalCost} zł</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo Gallery */}
              {(selectedVisit.beforePhotos?.length > 0 || selectedVisit.afterPhotos?.length > 0) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FiImage className="w-4 h-4" />
                    Zdjęcia ({selectedVisit.totalPhotos || 0})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Before Photos */}
                    {selectedVisit.beforePhotos?.map((photo, idx) => {
                      const imageUrl = typeof photo === 'string' 
                        ? (photo.startsWith('http') || photo.startsWith('/api/') ? photo : (photo.startsWith('/') ? photo : `/${photo}`))
                        : (photo?.data?.url || photo?.url || photo);
                      
                      return (
                        <div
                          key={`before-${idx}`}
                          className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition group"
                          onClick={() => {
                            const getPhotoUrl = (p) => typeof p === 'string' 
                              ? (p.startsWith('http') || p.startsWith('/api/') ? p : (p.startsWith('/') ? p : `/${p}`))
                              : (p?.data?.url || p?.url || p);
                            const allPhotos = [
                              ...selectedVisit.beforePhotos.map(p => ({ url: getPhotoUrl(p), type: 'before' })),
                              ...selectedVisit.afterPhotos.map(p => ({ url: getPhotoUrl(p), type: 'after' }))
                            ];
                            setPhotoGallery(allPhotos);
                            setCurrentPhoto(idx);
                            setShowLightbox(true);
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`Przed serwisem ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image load error:', imageUrl);
                              e.target.src = '/api/placeholder-image?text=Błąd';
                            }}
                          />
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                            Przed
                          </div>
                        </div>
                      );
                    })}
                    {/* After Photos */}
                    {selectedVisit.afterPhotos?.map((photo, idx) => {
                      const imageUrl = typeof photo === 'string' 
                        ? (photo.startsWith('http') || photo.startsWith('/api/') ? photo : (photo.startsWith('/') ? photo : `/${photo}`))
                        : (photo?.data?.url || photo?.url || photo);
                      
                      return (
                        <div
                          key={`after-${idx}`}
                          className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition group"
                          onClick={() => {
                            const getPhotoUrl = (p) => typeof p === 'string' 
                              ? (p.startsWith('http') || p.startsWith('/api/') ? p : (p.startsWith('/') ? p : `/${p}`))
                              : (p?.data?.url || p?.url || p);
                            const allPhotos = [
                              ...selectedVisit.beforePhotos.map(p => ({ url: getPhotoUrl(p), type: 'before' })),
                              ...selectedVisit.afterPhotos.map(p => ({ url: getPhotoUrl(p), type: 'after' }))
                            ];
                            setPhotoGallery(allPhotos);
                            setCurrentPhoto(selectedVisit.beforePhotos.length + idx);
                            setShowLightbox(true);
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`Po serwisie ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image load error:', imageUrl);
                              e.target.src = '/api/placeholder-image?text=Błąd';
                            }}
                          />
                          <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                            Po
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Parts Used */}
              {selectedVisit.partsUsed && selectedVisit.partsUsed.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FiPackage className="w-4 h-4" />
                    Użyte części ({selectedVisit.partsUsed.length})
                  </h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700 font-medium">Nazwa części</th>
                          <th className="px-4 py-2 text-center text-gray-700 font-medium">Kod</th>
                          <th className="px-4 py-2 text-center text-gray-700 font-medium">Ilość</th>
                          <th className="px-4 py-2 text-right text-gray-700 font-medium">Cena jedn.</th>
                          <th className="px-4 py-2 text-right text-gray-700 font-medium">Suma</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVisit.partsUsed.map((part, idx) => (
                          <tr key={idx} className="border-b border-gray-200 last:border-0 hover:bg-white transition">
                            <td className="px-4 py-2">
                              <div className="font-medium text-gray-900">{part.name}</div>
                              {part.description && (
                                <div className="text-xs text-gray-500 mt-0.5">{part.description}</div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <code className="text-xs bg-gray-200 px-2 py-0.5 rounded">{part.code || '-'}</code>
                            </td>
                            <td className="px-4 py-2 text-center font-medium">{part.quantity || 1}</td>
                            <td className="px-4 py-2 text-right">{(part.price || 0).toFixed(2)} zł</td>
                            <td className="px-4 py-2 text-right font-bold text-gray-900">
                              {((part.quantity || 1) * (part.price || 0)).toFixed(2)} zł
                            </td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan="4" className="px-4 py-3 text-right text-gray-700">
                            Łącznie części:
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {selectedVisit.partsCost?.toFixed(2) || '0.00'} zł
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Historia aktywności</h3>
                <div className="relative pl-6">
                  {/* Timeline line */}
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {/* Timeline items */}
                  <div className="space-y-4">
                    {/* Created */}
                    {selectedVisit.createdAt && (
                      <div className="relative">
                        <div className="absolute left-[-22px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">Wizyta utworzona</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(selectedVisit.createdAt).toLocaleString('pl-PL')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Scheduled */}
                    <div className="relative">
                      <div className={`absolute left-[-22px] w-4 h-4 rounded-full border-2 border-white ${
                        selectedVisit.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}></div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Wizyta zaplanowana</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {selectedVisit.scheduledDate} {selectedVisit.scheduledTime && `o ${selectedVisit.scheduledTime}`}
                        </p>
                      </div>
                    </div>

                    {/* In Progress */}
                    {(selectedVisit.status === 'in_progress' || selectedVisit.status === 'completed') && (
                      <div className="relative">
                        <div className={`absolute left-[-22px] w-4 h-4 rounded-full border-2 border-white ${
                          selectedVisit.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}></div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">Rozpoczęto serwis</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Technik: {selectedVisit.technicianName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Completed */}
                    {selectedVisit.status === 'completed' && (
                      <div className="relative">
                        <div className="absolute left-[-22px] w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">Wizyta zakończona</p>
                          {selectedVisit.updatedAt && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(selectedVisit.updatedAt).toLocaleString('pl-PL')}
                            </p>
                          )}
                          {selectedVisit.totalCost && (
                            <p className="text-xs text-gray-600 mt-1">
                              Całkowity koszt: <span className="font-bold">{selectedVisit.totalCost} zł</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cancelled */}
                    {selectedVisit.status === 'cancelled' && (
                      <div className="relative">
                        <div className="absolute left-[-22px] w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">Wizyta anulowana</p>
                          {selectedVisit.updatedAt && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(selectedVisit.updatedAt).toLocaleString('pl-PL')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedVisit.technicianNotes || isEditMode) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Notatki technika</h3>
                  {isEditMode ? (
                    <textarea
                      value={editedVisit.technicianNotes || ''}
                      onChange={(e) => setEditedVisit({ ...editedVisit, technicianNotes: e.target.value })}
                      rows="4"
                      placeholder="Dodaj notatki dotyczące wizyty..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">
                        {selectedVisit.technicianNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Audit Log Timeline - Historia zmian */}
              {!isEditMode && (
                <div className="mb-6 border-t border-gray-200 pt-6">
                  <VisitAuditTimeline 
                    visitId={selectedVisit.visitId}
                    orderId={selectedVisit.orderId}
                    onRollback={(updatedVisit) => {
                      // Reload visits after rollback
                      loadVisits();
                      // Update selected visit
                      setSelectedVisit(updatedVisit);
                    }}
                  />
                </div>
              )}

              {/* Save/Cancel or Action Buttons */}
              {isEditMode ? (
                <>
                  {/* Save Error/Success Messages */}
                  {saveError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{saveError}</p>
                    </div>
                  )}
                  {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-600">✓ Zmiany zostały zapisane</p>
                    </div>
                  )}

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saveLoading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saveLoading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anuluj
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  {/* Models Info Banner */}
                  {selectedVisit.models && selectedVisit.models.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FiPackage className="h-5 w-5 text-purple-600" />
                          <div>
                            <span className="text-sm font-medium text-purple-800">
                              {selectedVisit.models.length} {selectedVisit.models.length === 1 ? 'model urządzenia' : 'modele urządzeń'}
                            </span>
                            <p className="text-xs text-purple-600">
                              {selectedVisit.models.map(m => `${m.brand} ${m.model}`).join(', ')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setVisitModels(selectedVisit.models || []);
                            setShowModelManager(true);
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
                        >
                          Edytuj
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setVisitModels(selectedVisit.models || []);
                        setShowModelManager(true);
                      }}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <FiTool className="w-4 h-4" />
                      {selectedVisit.models && selectedVisit.models.length > 0 ? 'Zarządzaj modelami' : 'Dodaj modele urządzeń'}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/zamowienia/${selectedVisit.orderId}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Zobacz zamówienie
                    </button>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Zamknij
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showAssignModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Przydziel technika
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiXCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Wybrano wizyt: {selectedVisits.length}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz technika
                </label>
                <select
                  id="bulkTechnicianSelect"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Wybierz technika...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.surname}
                    </option>
                  ))}
                </select>
              </div>

              {bulkOperationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{bulkOperationError}</p>
                </div>
              )}

              {bulkOperationSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{bulkOperationSuccess}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const select = document.getElementById('bulkTechnicianSelect');
                    const technicianId = select.value;
                    const technicianName = select.options[select.selectedIndex].text;
                    if (technicianId) {
                      handleBulkAssign(technicianId, technicianName);
                    }
                  }}
                  disabled={bulkOperationLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkOperationLoading ? 'Przydzielanie...' : 'Przydziel'}
                </button>
                <button
                  onClick={() => setShowAssignModal(false)}
                  disabled={bulkOperationLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reschedule Modal */}
      {showRescheduleModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRescheduleModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Przełóż wizyty
                </h2>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiXCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Wybrano wizyt: {selectedVisits.length}
              </p>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nowa data
                  </label>
                  <input
                    type="date"
                    id="bulkNewDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nowa godzina
                  </label>
                  <input
                    type="time"
                    id="bulkNewTime"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Powód przełożenia
                  </label>
                  <textarea
                    id="bulkRescheduleReason"
                    rows="3"
                    placeholder="Opcjonalnie: podaj powód przełożenia wizyt..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {bulkOperationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{bulkOperationError}</p>
                </div>
              )}

              {bulkOperationSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{bulkOperationSuccess}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newDate = document.getElementById('bulkNewDate').value;
                    const newTime = document.getElementById('bulkNewTime').value;
                    const reason = document.getElementById('bulkRescheduleReason').value;
                    if (newDate && newTime) {
                      handleBulkReschedule(newDate, newTime, reason);
                    } else {
                      setBulkOperationError('Wybierz datę i godzinę');
                      setTimeout(() => setBulkOperationError(''), 5000);
                    }
                  }}
                  disabled={bulkOperationLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkOperationLoading ? 'Przełożenie...' : 'Przełóż'}
                </button>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  disabled={bulkOperationLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {showLightbox && photoGallery.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-[60] flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg transition z-10"
          >
            <FiX className="w-6 h-6 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white bg-opacity-10 rounded-lg z-10">
            <span className="text-white text-sm font-medium">
              {currentPhoto + 1} / {photoGallery.length}
            </span>
          </div>

          {/* Previous Button */}
          {currentPhoto > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPhoto(prev => prev - 1);
              }}
              className="absolute left-4 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg transition z-10"
            >
              <FiChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Next Button */}
          {currentPhoto < photoGallery.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPhoto(prev => prev + 1);
              }}
              className="absolute right-4 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg transition z-10"
            >
              <FiChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-7xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={photoGallery[currentPhoto].url}
                alt={`Zdjęcie ${currentPhoto + 1}`}
                className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg shadow-2xl"
              />
              {/* Photo Type Badge */}
              <div className="absolute bottom-4 left-4">
                {photoGallery[currentPhoto].type === 'before' ? (
                  <span className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-lg">
                    Przed serwisem
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow-lg">
                    Po serwisie
                  </span>
                )}
              </div>
            </div>

            {/* Keyboard Hint */}
            <div className="text-center mt-4">
              <p className="text-white text-xs opacity-60">
                Użyj strzałek ← → aby przeglądać | ESC aby zamknąć
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Cancel Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Anuluj wizyty
                </h2>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiXCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Zamierzasz anulować <strong>{selectedVisits.length}</strong> {selectedVisits.length === 1 ? 'wizytę' : 'wizyt'}. Ta operacja jest nieodwracalna.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Powód anulowania <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bulkCancelReason"
                  rows="4"
                  placeholder="Podaj powód anulowania wizyt (wymagane)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {bulkOperationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{bulkOperationError}</p>
                </div>
              )}

              {bulkOperationSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{bulkOperationSuccess}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const reason = document.getElementById('bulkCancelReason').value.trim();
                    if (reason) {
                      handleBulkCancel(reason);
                    } else {
                      setBulkOperationError('Powód anulowania jest wymagany');
                      setTimeout(() => setBulkOperationError(''), 5000);
                    }
                  }}
                  disabled={bulkOperationLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkOperationLoading ? 'Anulowanie...' : 'Anuluj wizyty'}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={bulkOperationLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Bulk Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  🗑️ Usuń wizyty trwale
                </h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiXCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-sm text-red-900 font-semibold mb-2">
                  ⚠️ OSTRZEŻENIE - Ta operacja jest NIEODWRACALNA!
                </p>
                <p className="text-sm text-red-800">
                  Zamierzasz <strong>całkowicie usunąć</strong> {selectedVisits.length} {selectedVisits.length === 1 ? 'wizytę' : 'wizyt'} z bazy danych. 
                  Wszystkie powiązane dane (zdjęcia, notatki, historia) zostaną utracone.
                </p>
                <p className="text-sm text-red-800 mt-2">
                  💡 Jeśli chcesz tylko anulować wizyty (zachowując historię), użyj opcji <strong>"Anuluj"</strong> zamiast "Usuń".
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Powód usunięcia <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bulkDeleteReason"
                  rows="4"
                  placeholder="Podaj powód trwałego usunięcia wizyt (wymagane)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confirmDelete"
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    Potwierdzam, że rozumiem konsekwencje trwałego usunięcia
                  </span>
                </label>
              </div>

              {bulkOperationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{bulkOperationError}</p>
                </div>
              )}

              {bulkOperationSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{bulkOperationSuccess}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const reason = document.getElementById('bulkDeleteReason').value.trim();
                    const confirmed = document.getElementById('confirmDelete').checked;
                    
                    if (!confirmed) {
                      setBulkOperationError('Musisz potwierdzić checkbox, aby kontynuować');
                      setTimeout(() => setBulkOperationError(''), 5000);
                      return;
                    }
                    
                    if (!reason) {
                      setBulkOperationError('Powód usunięcia jest wymagany');
                      setTimeout(() => setBulkOperationError(''), 5000);
                      return;
                    }
                    
                    handleBulkDelete(reason);
                  }}
                  disabled={bulkOperationLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {bulkOperationLoading ? 'Usuwanie...' : '🗑️ Usuń trwale'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={bulkOperationLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Models Manager Modal - Updated to ModelManagerModal */}
      <ModelManagerModal
        isOpen={showModelManager}
        onClose={() => setShowModelManager(false)}
        visitId={selectedVisit?.visitId}
        initialModels={visitModels}
        onSave={(updatedModels) => {
          // Update visit with models
          setVisitModels(updatedModels);
          if (selectedVisit && updatedModels.length > 0) {
            const mainModel = updatedModels[0];
            const updatedVisit = {
              ...selectedVisit,
              deviceBrand: mainModel.brand,
              deviceModel: mainModel.model,
              deviceType: mainModel.type,
              deviceSerialNumber: mainModel.serialNumber,
              models: updatedModels
            };
            setSelectedVisit(updatedVisit);
            toast.success(`✅ Zaktualizowano modele urządzeń (${updatedModels.length})`);
          }
          setShowModelManager(false);
        }}
        context="admin"
      />

      {/* WEEK 3 PHASE 5: Saved Presets Modal */}
      {showPresetModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPresetModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {presetAction === 'save' ? '💾 Zapisz Preset Filtrów' : '📋 Zarządzaj Presetami'}
                </h2>
                <button
                  onClick={() => setShowPresetModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Save Preset Form */}
              {presetAction === 'save' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nazwa presetu
                    </label>
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="np. Pilne dzisiaj, Zaległe drogie..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') savePreset();
                      }}
                    />
                  </div>

                  {/* Preview aktywnych filtrów */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Aktywne filtry do zapisania:
                    </p>
                    <div className="space-y-1 text-sm text-gray-600">
                      {getActiveFiltersChips().length > 0 ? (
                        getActiveFiltersChips().map((chip) => (
                          <div key={chip.id}>• {chip.label}</div>
                        ))
                      ) : (
                        <p className="text-gray-400 italic">Brak aktywnych filtrów</p>
                      )}
                      <div>• Sortowanie: {sortBy} ({sortOrder})</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={savePreset}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      Zapisz Preset
                    </button>
                    <button
                      onClick={() => setShowPresetModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}

              {/* Load/Manage Presets */}
              {presetAction === 'load' && (
                <div className="space-y-3">
                  {savedPresets.length === 0 ? (
                    <div className="text-center py-8">
                      <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">Brak zapisanych presetów</p>
                      <button
                        onClick={() => {
                          setPresetAction('save');
                        }}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Zapisz pierwszy preset
                      </button>
                    </div>
                  ) : (
                    savedPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {preset.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2">
                              Utworzono: {new Date(preset.createdAt).toLocaleDateString('pl-PL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                const chips = [];
                                if (preset.filters.selectedStatuses?.length > 0) {
                                  chips.push(`Statusy: ${preset.filters.selectedStatuses.length}`);
                                }
                                if (preset.filters.selectedTechnicianIds?.length > 0) {
                                  chips.push(`Technicy: ${preset.filters.selectedTechnicianIds.length}`);
                                }
                                if (preset.filters.costMin > 0 || preset.filters.costMax < 5000) {
                                  chips.push(`Koszt: ${preset.filters.costMin}-${preset.filters.costMax} zł`);
                                }
                                if (preset.filters.withParts) chips.push('Z częściami');
                                if (preset.filters.withPhotos) chips.push('Ze zdjęciami');
                                if (preset.filters.urgentOnly) chips.push('Tylko pilne');
                                
                                return chips.map((chip, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                    {chip}
                                  </span>
                                ));
                              })()}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => loadPreset(preset)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                            >
                              Załaduj
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Czy na pewno usunąć preset "${preset.name}"?`)) {
                                  deletePreset(preset.id);
                                }
                              }}
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
