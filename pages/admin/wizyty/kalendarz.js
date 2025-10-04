import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import {
  FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiUser,
  FiCheckCircle, FiAlertCircle, FiXCircle, FiList, FiGrid
} from 'react-icons/fi';

/**
 * Calendar View for Visits
 * Monthly calendar with color-coded visit cells
 */
export default function VisitsCalendar() {
  const router = useRouter();

  // State
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayVisits, setSelectedDayVisits] = useState([]);
  const [showDayModal, setShowDayModal] = useState(false);
  
  // Drag & Drop state
  const [draggedVisit, setDraggedVisit] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  // Get month data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = new Date(year, month, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

  // Load visits for current month
  useEffect(() => {
    loadMonthVisits();
  }, [currentDate]);

  const loadMonthVisits = async () => {
    setLoading(true);
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const params = new URLSearchParams({
        dateFrom: firstDay.toISOString().split('T')[0],
        dateTo: lastDay.toISOString().split('T')[0],
        sortBy: 'date',
        sortOrder: 'asc',
        limit: '1000'
      });

      const response = await fetch(`/api/visits?${params}`);
      if (!response.ok) throw new Error('Failed to fetch visits');
      
      const data = await response.json();
      setVisits(data.visits || []);
      setError(null);
    } catch (err) {
      console.error('Error loading visits:', err);
      setError('Nie udało się pobrać wizyt');
    } finally {
      setLoading(false);
    }
  };

  // Calendar generation
  const getDaysInMonth = () => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  };

  const getVisitsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return visits.filter(v => v.scheduledDate === dateStr);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDayClick = (day) => {
    const dayVisits = getVisitsForDay(day);
    if (dayVisits.length > 0) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setSelectedDate(dateStr);
      setSelectedDayVisits(dayVisits);
      setShowDayModal(true);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Drag & Drop handlers
  const handleDragStart = (e, visit) => {
    setDraggedVisit(visit);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, day) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = async (e, targetDay) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedVisit) return;

    const targetDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
    
    // Don't do anything if dropping on same day
    if (draggedVisit.scheduledDate === targetDate) {
      setDraggedVisit(null);
      setDragOverDay(null);
      return;
    }

    try {
      const response = await fetch('/api/visits/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'reschedule',
          visitIds: [draggedVisit.visitId],
          data: {
            newDate: targetDate,
            newTime: draggedVisit.scheduledTime,
            reason: 'Przesunięto w kalendarzu',
            modifiedBy: 'admin'
          }
        })
      });

      if (response.ok) {
        await loadMonthVisits();
      } else {
        throw new Error('Failed to reschedule visit');
      }
    } catch (err) {
      console.error('Error rescheduling visit:', err);
      alert('Nie udało się przenieść wizyty');
    } finally {
      setDraggedVisit(null);
      setDragOverDay(null);
    }
  };

  // Generate calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDayOffset = getFirstDayOfMonth();
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square bg-gray-50 rounded-lg"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayVisits = getVisitsForDay(day);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const isDragOver = dragOverDay === day;
      
      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          onDragOver={(e) => handleDragOver(e, day)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, day)}
          className={`aspect-square rounded-lg border-2 p-2 transition ${
            isToday ? 'border-blue-500 bg-blue-50' : 
            isDragOver ? 'border-green-500 bg-green-50' : 
            'border-gray-200 bg-white hover:border-gray-300'
          } ${dayVisits.length > 0 ? 'cursor-pointer hover:shadow-md' : ''}`}
        >
          <div className="flex flex-col h-full">
            {/* Day number */}
            <div className={`text-sm font-semibold mb-1 ${
              isToday ? 'text-blue-600' : 
              isDragOver ? 'text-green-600' : 
              'text-gray-700'
            }`}>
              {day}
            </div>

            {/* Visit indicators */}
            {dayVisits.length > 0 && (
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {dayVisits.slice(0, 3).map((visit, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, visit)}
                    onClick={(e) => e.stopPropagation()}
                    className={`${getStatusColor(visit.status)} text-white text-xs px-1.5 py-0.5 rounded truncate cursor-move hover:opacity-80`}
                    title={`${visit.clientName} - ${visit.technicianName} (przeciągnij aby przenieść)`}
                  >
                    {visit.scheduledTime || '00:00'} {visit.clientName}
                  </div>
                ))}
                {dayVisits.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayVisits.length - 3} więcej
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <AdminLayout>
      <Head>
        <title>Kalendarz wizyt - System AGD</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kalendarz wizyt</h1>
              <p className="text-gray-600 mt-1">Widok miesięczny wszystkich wizyt</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin/wizyty')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <FiList className="w-4 h-4" />
                Lista
              </button>
              <button
                onClick={() => router.push('/admin/wizyty/timeline')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <FiClock className="w-4 h-4" />
                Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900 capitalize">
                {monthName}
              </h2>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
              >
                Dziś
              </button>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-600 font-medium">Legenda:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-700">Zaplanowana</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-700">W trakcie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-700">Zakończona</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-700">Anulowana</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Ładowanie kalendarza...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Day Details Modal */}
      {showDayModal && selectedDayVisits.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDayModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Wizyty - {new Date(selectedDate).toLocaleDateString('pl-PL', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h2>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiXCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Visits List */}
              <div className="space-y-3">
                {selectedDayVisits.map((visit) => (
                  <div
                    key={visit.visitId}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => {
                      setShowDayModal(false);
                      router.push(`/admin/wizyty?visitId=${visit.visitId}`);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FiClock className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">
                            {visit.scheduledTime || '00:00'}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">{visit.clientName}</h3>
                        <p className="text-sm text-gray-600">{visit.address}</p>
                      </div>
                      <div>
                        {visit.status === 'scheduled' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            <FiClock className="w-3 h-3" />
                            Zaplanowana
                          </span>
                        )}
                        {visit.status === 'in_progress' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            <FiAlertCircle className="w-3 h-3" />
                            W trakcie
                          </span>
                        )}
                        {visit.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            <FiCheckCircle className="w-3 h-3" />
                            Zakończona
                          </span>
                        )}
                        {visit.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            <FiXCircle className="w-3 h-3" />
                            Anulowana
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiUser className="w-3 h-3" />
                        {visit.technicianName}
                      </div>
                      <div>
                        {visit.deviceType} {visit.deviceBrand}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => setShowDayModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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
