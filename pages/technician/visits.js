import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import TechnicianLayout from '../../components/TechnicianLayout';
import { getDeviceCode, getDeviceBadgeProps } from '../../utils/deviceCodes';

export default function VisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    date: 'all', // all, today, week, month, custom
    status: 'all', // all, scheduled, on_way, in_progress, paused, completed
    type: 'all', // all, diagnosis, repair, control, installation
    includeCompleted: false,
    search: '',
    customDateFrom: '',
    customDateTo: ''
  });

  // Statistics from API
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    byStatus: {},
    byType: {}
  });

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    const employeeData = localStorage.getItem('technicianEmployee');
    
    if (!token || !employeeData) {
      router.push('/technician/login');
      return;
    }

    try {
      setEmployee(JSON.parse(employeeData));
      loadVisits(token);
    } catch (err) {
      console.error('Error parsing employee data:', err);
      router.push('/technician/login');
    }
  }, []);

  // Reload visits when filters change
  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    if (token && employee) {
      loadVisits(token);
    }
  }, [filters.date, filters.status, filters.type, filters.includeCompleted]);

  const loadVisits = async (token) => {
    setLoading(true);
    setError('');

    try {
      // Build query params
      const params = new URLSearchParams();
      
      if (filters.date !== 'all') {
        params.append('date', filters.date);
      }
      
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      if (filters.type !== 'all') {
        params.append('type', filters.type);
      }
      
      if (filters.includeCompleted) {
        params.append('includeCompleted', 'true');
      }

      const response = await fetch(`/api/technician/visits?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd pobierania wizyt');
      }

      setVisits(data.visits || []);
      setStats(data.statistics || {});
      
    } catch (err) {
      console.error('Error loading visits:', err);
      setError(err.message || 'Błąd ładowania wizyt');
      
      // If unauthorized, redirect to login
      if (err.message.includes('token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('technicianToken');
        localStorage.removeItem('technicianEmployee');
        router.push('/technician/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('technicianToken');
    
    try {
      await fetch('/api/technician/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'logout',
          token
        })
      });
    } catch (err) {
      console.error('Logout error:', err);
    }

    localStorage.removeItem('technicianToken');
    localStorage.removeItem('technicianEmployee');
    router.push('/technician/login');
  };

  // Filter visits by search term (client-side)
  const filteredVisits = visits.filter(visit => {
    if (!filters.search) return true;
    
    const searchLower = filters.search.toLowerCase();
    return (
      visit.clientName?.toLowerCase().includes(searchLower) ||
      visit.address?.toLowerCase().includes(searchLower) ||
      visit.city?.toLowerCase().includes(searchLower) ||
      visit.deviceType?.toLowerCase().includes(searchLower) ||
      visit.device?.toLowerCase().includes(searchLower) ||
      visit.brand?.toLowerCase().includes(searchLower) ||
      visit.visitId?.toLowerCase().includes(searchLower) ||
      visit.orderNumber?.toLowerCase().includes(searchLower)
    );
  });

  // Status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border border-amber-300', // Dodano: pending
      scheduled: 'bg-blue-100 text-blue-800',
      on_way: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      rescheduled: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Status label (Polish)
  const getStatusLabel = (status) => {
    const labels = {
      pending: '⏳ Do zaplanowania', // Dodano: pending
      scheduled: 'Zaplanowana',
      on_way: 'W drodze',
      in_progress: 'W trakcie',
      paused: 'Wstrzymana',
      completed: 'Zakończona',
      cancelled: 'Anulowana',
      rescheduled: 'Przełożona'
    };
    return labels[status] || status;
  };

  // Visit type label
  const getTypeLabel = (type) => {
    const labels = {
      diagnosis: 'Diagnoza',
      repair: 'Naprawa',
      control: 'Kontrola',
      installation: 'Instalacja',
      warranty: 'Gwarancja'
    };
    return labels[type] || type;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // HH:MM
  };

  return (
    <TechnicianLayout employee={employee} currentPage="visits">
      <Head>
        <title>Moje Wizyty - Panel Pracownika | TechSerwis AGD</title>
      </Head>

      {/* Main content */}
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Moje Wizyty</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                <p className="text-xs text-gray-500">Wszystkie</p>
                <p className="text-lg font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                <p className="text-xs text-gray-500">Dzisiaj</p>
                <p className="text-lg font-bold text-blue-600">{stats.today || 0}</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                <p className="text-xs text-gray-500">W trakcie</p>
                <p className="text-lg font-bold text-green-600">{stats.byStatus?.in_progress || 0}</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                <p className="text-xs text-gray-500">Zaplanowane</p>
                <p className="text-lg font-bold text-orange-600">{stats.byStatus?.scheduled || 0}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-4 bg-white border-t border-gray-200">
            {/* Search */}
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Szukaj po kliencie, adresie, urządzeniu..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Date filter */}
              <select
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Wszystkie</option>
                <option value="today">Dzisiaj</option>
                <option value="week">Ten tydzień</option>
                <option value="month">Ten miesiąc</option>
              </select>

              {/* Status filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Wszystkie statusy</option>
                <option value="pending">⏳ Do zaplanowania</option>
                <option value="scheduled">Zaplanowane</option>
                <option value="on_way">W drodze</option>
                <option value="in_progress">W trakcie</option>
                <option value="paused">Wstrzymane</option>
                <option value="completed">Zakończone</option>
              </select>

              {/* Type filter */}
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Wszystkie typy</option>
                <option value="diagnosis">Diagnoza</option>
                <option value="repair">Naprawa</option>
                <option value="control">Kontrola</option>
                <option value="installation">Instalacja</option>
              </select>

              {/* Include completed checkbox */}
              <label className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={filters.includeCompleted}
                  onChange={(e) => handleFilterChange('includeCompleted', e.target.checked)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Z zakończonymi</span>
              </label>
            </div>
          </div>
        </div>

        {/* Visits list */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Brak wizyt</h3>
              <p className="text-gray-500">
                {filters.search || filters.status !== 'all' || filters.type !== 'all' 
                  ? 'Nie znaleziono wizyt spełniających kryteria' 
                  : 'Nie masz jeszcze żadnych wizyt'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVisits.map((visit) => {
                const deviceBadge = getDeviceBadgeProps(visit.deviceType || visit.device);
                const borderColor = visit.status === 'pending' ? 'border-amber-500' : 'border-blue-500';
                
                return (
                <Link key={visit.visitId} href={`/technician/visit/${visit.visitId}`} className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 ${borderColor}`}>
                    {/* 🎯 PRIORYTET #1: Adres + Kod urządzenia (największa czcionka) */}
                    <div className="px-4 pt-4 pb-2">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {/* Kod urządzenia - DUŻY BADGE */}
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-lg border-2 ${deviceBadge.className}`}>
                              [{deviceBadge.code}]
                            </span>
                            <span className="text-xs font-medium text-gray-600">
                              {deviceBadge.label}
                            </span>
                          </div>
                          
                          {/* ADRES - największa czcionka, pogrubiona */}
                          <div className="flex items-start space-x-2 mb-1">
                            <svg className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-lg font-bold text-gray-900 leading-tight">
                                {visit.address || visit.street || 'Brak adresu'}
                              </p>
                              {visit.city && (
                                <p className="text-base font-semibold text-gray-700">
                                  {visit.postalCode && `${visit.postalCode} `}{visit.city}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Status badge - mniejszy, w rogu */}
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(visit.status)}`}>
                            {getStatusLabel(visit.status)}
                          </span>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-white">
                      {/* Numer zlecenia + Typ wizyty - kompaktowo */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-semibold text-gray-700">
                            {visit.orderNumber || visit.visitId}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 font-medium bg-blue-100 text-blue-700 rounded">
                            {getTypeLabel(visit.type)}
                          </span>
                        </div>
                        
                        {/* Data i godzina - kompaktowo (lub "Do zaplanowania" dla pending) */}
                        <div className="flex items-center space-x-2 text-gray-600">
                          {visit.status === 'pending' ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium text-amber-700">
                                Ustal termin wizyty
                              </span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">
                                {formatDate(visit.scheduledDate)}
                              </span>
                              {visit.scheduledTime && (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">
                                    {formatTime(visit.scheduledTime)}
                                  </span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sekcja dodatkowych informacji - zwinięta */}
                    <div className="px-4 py-3 border-t border-gray-100">
                      {/* Klient - mniejszy, drugorzędny */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium text-gray-700">
                            {visit.clientName || 'Brak nazwy'}
                          </span>
                        </div>
                        
                        {/* Telefon - klikalny */}
                        {visit.clientPhone && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `tel:${visit.clientPhone}`;
                            }}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {visit.clientPhone}
                          </button>
                        )}
                      </div>

                      {/* Szczegóły urządzenia - kompaktowo */}
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">
                          {visit.brand || 'Nieznana marka'}
                        </span>
                        {visit.model && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{visit.model}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Problem */}
                    {visit.problemDescription && (
                      <div className="mb-3 bg-red-50 border border-red-100 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-red-700 mb-1">Zgłoszony problem:</p>
                            <p className="text-sm text-gray-700">
                              {visit.problemDescription}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data i godzina */}
                    <div className="flex items-center justify-between py-2 mb-2 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{formatDate(visit.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{formatTime(visit.time)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Zamówione części (jeśli są) */}
                    {visit.orderedParts && visit.orderedParts.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-1 text-xs text-green-600 mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span className="font-medium">Zamówione części: {visit.orderedParts.length}</span>
                        </div>
                      </div>
                    )}

                    {/* Akcje */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/technician/visit/${visit.visitId}`);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Zobacz szczegóły zlecenia
                      </button>
                    </div>
                </Link>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </TechnicianLayout>
  );
}
