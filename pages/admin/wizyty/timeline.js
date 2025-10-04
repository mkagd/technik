import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import {
  FiCalendar, FiClock, FiUser, FiFilter, FiList, FiGrid,
  FiChevronLeft, FiChevronRight, FiMapPin
} from 'react-icons/fi';

/**
 * Timeline View for Visits
 * Hourly timeline (8:00-20:00) with horizontal bars
 */
export default function VisitsTimeline() {
  const router = useRouter();

  // State
  const [visits, setVisits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTechnician, setSelectedTechnician] = useState('all');

  // Get date string
  const dateStr = selectedDate.toISOString().split('T')[0];
  const dateLabel = selectedDate.toLocaleDateString('pl-PL', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Timeline hours (8:00-20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8-20

  // Load data
  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadVisits();
  }, [selectedDate, selectedTechnician]);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const loadVisits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dateFrom: dateStr,
        dateTo: dateStr,
        sortBy: 'time',
        sortOrder: 'asc',
        limit: '1000'
      });

      if (selectedTechnician !== 'all') {
        params.append('technicianId', selectedTechnician);
      }

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

  // Date navigation
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Time calculations
  const getTimePosition = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = (hours - 8) * 60 + minutes;
    const maxMinutes = 12 * 60; // 8:00-20:00 = 12 hours
    return (totalMinutes / maxMinutes) * 100;
  };

  const getVisitDuration = (visit) => {
    // Default 60 minutes if no end time
    return 60;
  };

  const getDurationWidth = (minutes) => {
    const maxMinutes = 12 * 60;
    return (minutes / maxMinutes) * 100;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500 border-blue-600';
      case 'in_progress': return 'bg-yellow-500 border-yellow-600';
      case 'completed': return 'bg-green-500 border-green-600';
      case 'cancelled': return 'bg-red-500 border-red-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  // Group visits by technician
  const groupedVisits = () => {
    if (selectedTechnician !== 'all') {
      return [{ 
        technicianId: selectedTechnician,
        technicianName: employees.find(e => e.id === selectedTechnician)?.name + ' ' + 
                        employees.find(e => e.id === selectedTechnician)?.surname || 'Nieznany',
        visits: visits 
      }];
    }

    const groups = {};
    visits.forEach(visit => {
      const techId = visit.technicianId || 'unassigned';
      if (!groups[techId]) {
        groups[techId] = {
          technicianId: techId,
          technicianName: visit.technicianName || 'Nieprzydzielony',
          visits: []
        };
      }
      groups[techId].visits.push(visit);
    });

    return Object.values(groups);
  };

  return (
    <AdminLayout>
      <Head>
        <title>Timeline wizyt - System AGD</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Timeline wizyt</h1>
              <p className="text-gray-600 mt-1">Widok godzinowy harmonogramu</p>
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
                onClick={() => router.push('/admin/wizyty/kalendarz')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <FiCalendar className="w-4 h-4" />
                Kalendarz
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-2">
                <FiCalendar className="w-5 h-5 text-gray-600" />
                <span className="text-lg font-semibold text-gray-900 capitalize min-w-[300px] text-center">
                  {dateLabel}
                </span>
              </div>

              <button
                onClick={handleNextDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronRight className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition ml-2"
              >
                Dziś
              </button>
            </div>

            {/* Technician Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-gray-600" />
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Wszyscy technicy</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.surname}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Ładowanie timeline...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Time Header */}
              <div className="relative border-b border-gray-200 pb-2">
                <div className="flex">
                  <div className="w-32 flex-shrink-0"></div>
                  <div className="flex-1 relative">
                    <div className="flex justify-between text-xs text-gray-500">
                      {hours.map((hour) => (
                        <div key={hour} className="flex-1 text-center">
                          {String(hour).padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technician Rows */}
              {groupedVisits().length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Brak wizyt w wybranym dniu
                </div>
              ) : (
                groupedVisits().map((group) => (
                  <div key={group.technicianId} className="relative">
                    <div className="flex">
                      {/* Technician Name */}
                      <div className="w-32 flex-shrink-0 pr-4">
                        <div className="flex items-center gap-2">
                          <FiUser className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {group.technicianName}
                          </span>
                        </div>
                      </div>

                      {/* Timeline Track */}
                      <div className="flex-1 relative h-16 border-l border-gray-200">
                        {/* Hour Grid Lines */}
                        {hours.map((hour, idx) => (
                          <div
                            key={hour}
                            className="absolute top-0 bottom-0 border-l border-gray-100"
                            style={{ left: `${(idx / 12) * 100}%` }}
                          ></div>
                        ))}

                        {/* Visit Bars */}
                        {group.visits
                          .filter(v => v.scheduledTime && v.scheduledTime >= '08:00' && v.scheduledTime <= '20:00')
                          .map((visit, idx) => {
                            const left = getTimePosition(visit.scheduledTime);
                            const width = getDurationWidth(getVisitDuration(visit));
                            
                            return (
                              <div
                                key={idx}
                                className={`absolute top-2 bottom-2 ${getStatusColor(visit.status)} rounded-lg border-2 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden`}
                                style={{ 
                                  left: `${left}%`, 
                                  width: `${width}%`,
                                  minWidth: '80px'
                                }}
                                onClick={() => router.push(`/admin/wizyty?visitId=${visit.visitId}`)}
                                title={`${visit.clientName} - ${visit.scheduledTime}\n${visit.address}`}
                              >
                                <div className="px-2 py-1 text-white text-xs font-medium truncate">
                                  <div className="flex items-center gap-1">
                                    <FiClock className="w-3 h-3" />
                                    {visit.scheduledTime}
                                  </div>
                                  <div className="truncate">{visit.clientName}</div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-600 font-medium">Status wizyt:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded border-2 border-blue-600"></div>
              <span className="text-gray-700">Zaplanowana</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded border-2 border-yellow-600"></div>
              <span className="text-gray-700">W trakcie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-600"></div>
              <span className="text-gray-700">Zakończona</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded border-2 border-red-600"></div>
              <span className="text-gray-700">Anulowana</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
