import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import VisitAuditTimeline from '../../../components/VisitAuditTimeline';
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
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    technicianId: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    today: false,
    priority: ''
  });
  
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
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [bulkOperationError, setBulkOperationError] = useState(null);
  const [bulkOperationSuccess, setBulkOperationSuccess] = useState(null);

  // Photo lightbox
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [photoGallery, setPhotoGallery] = useState([]);

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedVisit, setEditedVisit] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load data
  useEffect(() => {
    loadVisits();
    loadEmployees();
  }, [filters, sortBy, sortOrder, currentPage, itemsPerPage]);

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
      const params = new URLSearchParams({
        ...filters,
        today: filters.today ? 'true' : 'false',
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        includeStats: 'true'
      });

      // Remove empty params
      Array.from(params.keys()).forEach(key => {
        if (!params.get(key) || params.get(key) === 'false') {
          params.delete(key);
        }
      });

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
      priority: ''
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
        setFilters(prev => ({ ...prev, status: 'scheduled' }));
        break;
      case 'in_progress':
        setFilters(prev => ({ ...prev, status: 'in_progress' }));
        break;
      case 'completed':
        setFilters(prev => ({ ...prev, status: 'completed' }));
        break;
    }
    setCurrentPage(1);
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
                {/* Quick filters */}
                <div className="flex flex-wrap gap-2">
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
                      filters.status === 'scheduled'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Zaplanowane
                  </button>
                  <button
                    onClick={() => handleQuickFilter('in_progress')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filters.status === 'in_progress'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    W trakcie
                  </button>
                  <button
                    onClick={() => handleQuickFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filters.status === 'completed'
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

                  {/* Status filter */}
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wszystkie statusy</option>
                    <option value="scheduled">Zaplanowane</option>
                    <option value="in_progress">W trakcie</option>
                    <option value="completed">Zakończone</option>
                    <option value="cancelled">Anulowane</option>
                    <option value="rescheduled">Przełożone</option>
                  </select>

                  {/* Technician filter */}
                  <select
                    value={filters.technicianId}
                    onChange={(e) => handleFilterChange('technicianId', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wszyscy technicy</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>

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
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                >
                  Anuluj
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
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                              <FiMoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
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
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FiTool className="w-4 h-4" />
                      Urządzenie
                    </h3>
                    <div className="space-y-1">
                      <p className="text-gray-900 font-medium">
                        {selectedVisit.deviceType}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedVisit.deviceBrand} {selectedVisit.deviceModel}
                      </p>
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
                    {selectedVisit.beforePhotos?.map((photo, idx) => (
                      <div
                        key={`before-${idx}`}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition group"
                        onClick={() => {
                          const allPhotos = [
                            ...selectedVisit.beforePhotos.map(p => ({ url: p, type: 'before' })),
                            ...selectedVisit.afterPhotos.map(p => ({ url: p, type: 'after' }))
                          ];
                          setPhotoGallery(allPhotos);
                          setCurrentPhoto(idx);
                          setShowLightbox(true);
                        }}
                      >
                        <img
                          src={photo}
                          alt={`Przed serwisem ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                          Przed
                        </div>
                      </div>
                    ))}
                    {/* After Photos */}
                    {selectedVisit.afterPhotos?.map((photo, idx) => (
                      <div
                        key={`after-${idx}`}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition group"
                        onClick={() => {
                          const allPhotos = [
                            ...selectedVisit.beforePhotos.map(p => ({ url: p, type: 'before' })),
                            ...selectedVisit.afterPhotos.map(p => ({ url: p, type: 'after' }))
                          ];
                          setPhotoGallery(allPhotos);
                          setCurrentPhoto(selectedVisit.beforePhotos.length + idx);
                          setShowLightbox(true);
                        }}
                      >
                        <img
                          src={photo}
                          alt={`Po serwisie ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                          Po
                        </div>
                      </div>
                    ))}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/zamowienia/${selectedVisit.orderId}`)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Zobacz pełne zamówienie
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Zamknij
                  </button>
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
    </AdminLayout>
  );
}
