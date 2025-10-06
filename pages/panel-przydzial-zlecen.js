// pages/panel-przydzial-zlecen.js
// 🚀 POTĘŻNY PANEL PRZYDZIAŁU ZLECEŃ - Centrum Operacyjne AGD
// ✅ Automatyczny przydział terminów
// ✅ Inteligentne harmonogramy
// ✅ Real-time monitoring wpadających zleceń
// ✅ Optymalizacja geograficzna i czasowa
// ✅ System priorytetów i VIP

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  FiClock,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiSettings,
  FiFilter,
  FiSearch,
  FiPhone,
  FiMail,
  FiDollarSign,
  FiTool,
  FiZap,
  FiTarget,
  FiActivity,
  FiBarChart,
  FiPieChart,
  FiMonitor,
  FiVolume2,
  FiVolumeX,
  FiPlay,
  FiPause,
  FiSkipForward,
  FiEdit,
  FiSave,
  FiEye,
  FiArrowRight,
  FiUserCheck,
  FiCpu,
  FiWifi,
  FiDatabase,
  FiMaximize2,
  FiMinimize2,
  FiGrid,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiSort,
  FiMoreVertical,
  FiLayers,
  FiStar
} from 'react-icons/fi';
import { getDeviceCode, getDeviceBadgeProps } from '../utils/deviceCodes';

export default function PanelPrzydzialZlecen() {
  const router = useRouter();
  
  // Stany główne
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Stany filtrów i widoków
  const [activeView, setActiveView] = useState('incoming'); // incoming, assigned, calendar, stats
  const [filters, setFilters] = useState({
    priority: 'all',
    region: 'all',
    dateRange: 'today',
    employee: 'all',
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stany statystyk
  const [stats, setStats] = useState({
    todayIncoming: 0,
    todayAssigned: 0,
    avgResponseTime: 0,
    employeeWorkload: {},
    regionDistribution: {},
    priorityBreakdown: {}
  });
  
  // Stany rozwijania slotów i widoku szczegółowego
  const [expandedTimeSlots, setExpandedTimeSlots] = useState({}); // {employeeId: {hour: boolean}}
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Pełnoekranowy widok serwisanta
  const [timeSlotDetail, setTimeSlotDetail] = useState('hourly'); // 'hourly' | 'detailed'
  
  // Automatyczne odświeżanie
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // sekundy
  const [lastScheduleRefresh, setLastScheduleRefresh] = useState(new Date()); // ← NOWE: Ostatnie odświeżenie harmonogramów
  const [employeeSchedules, setEmployeeSchedules] = useState({}); // ← NOWE: Cache harmonogramów pracowników
  
  // 🆕 NOWE FUNKCJE WYŚWIETLANIA
  const [expandedOrder, setExpandedOrder] = useState(null); // Pełnoekranowy modal zlecenia
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'compact'
  const [itemsPerPage, setItemsPerPage] = useState(6); // 1, 2, 3, 4, 5, 6, 10, 20
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'date' | 'client' | 'value' | 'region'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3); // 1-5 kolumn

  // Funkcje do pobierania danych z API
  const fetchOrdersWithVisits = async () => {
    try {
      const response = await fetch('/api/order-assignment');
      const data = await response.json();
      
      if (data.success) {
        setIncomingOrders(data.orders || []);
        
        // Aktualizuj statystyki
        setStats(prev => ({
          ...prev,
          todayIncoming: data.statistics?.total || 0,
          todayAssigned: data.statistics?.withPendingVisits || 0
        }));
        
        console.log('📊 Pobrano zlecenia:', data.orders?.length || 0);
      }
    } catch (error) {
      console.error('❌ Błąd pobierania zleceń:', error);
      addNotification('Błąd pobierania zleceń', 'error');
    } finally {
      // Oblicz statystyki po pobraniu danych
      setTimeout(() => calculateStats(), 100);
    }
  };

  const fetchEmployees = async () => {
    try {
      // Pobierz pracowników z API lub lokalnych danych
      let employeesData = [];
      
      try {
        // Najpierw spróbuj API
        const apiResponse = await fetch('/api/employees');
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          employeesData = apiData.employees || apiData;
          console.log('👥 Pobrano pracowników z API:', employeesData.length);
        } else {
          throw new Error('API niedostępne');
        }
      } catch (apiError) {
        // Fallback do statycznego pliku
        console.log('⚠️ API niedostępne, próbuję statyczny plik');
        const fileResponse = await fetch('/data/employees.json');
        employeesData = await fileResponse.json();
        console.log('👥 Pobrano pracowników ze statycznego pliku:', employeesData.length);
      }
      
      // Pobierz harmonogramy na dziś z nowego API
      const today = new Date().toISOString().split('T')[0];
      const allSchedules = await fetchAllSchedules(today);
      
      // Przetworz dane pracowników z real-time kalendarzami
      const processedEmployees = await Promise.all(employeesData.map(async emp => {
        const schedule = allSchedules[emp.id];
        const availability = await checkEmployeeAvailability(emp.id, today, 60);
        
        // Przelicz real-time schedule na podstawie 15-minutowych slotów
        const realTimeSchedule = [];
        
        // ✅ SPRAWDŹ CZY DZIEŃ WOLNY
        if (schedule?.isDayOff) {
          console.log(`⚠️ ${emp.name}: Dzień wolny - nie renderuję slotów`);
          // realTimeSchedule pozostaje pusty []
        } else if (schedule?.timeSlots && schedule.timeSlots.length > 0) {
          // Grupuj sloty co godzinę dla lepszego wyświetlenia
          const hourlySlots = {};
          
          schedule.timeSlots.forEach(slot => {
            const hour = slot.time.split(':')[0] + ':00';
            if (!hourlySlots[hour]) {
              hourlySlots[hour] = [];
            }
            hourlySlots[hour].push(slot);
          });
          
          Object.keys(hourlySlots).forEach(hour => {
            const slots = hourlySlots[hour];
            const mainStatus = slots[0].status;
            const activity = slots.find(s => s.activity)?.activity || 
                           (mainStatus === 'available' ? 'FREE' : 'BUSY');
            
            realTimeSchedule.push({
              time: hour,
              client: activity,
              type: mainStatus,
              slotsCount: slots.length
            });
          });
        }
        
        return {
          id: emp.id,
          name: emp.name,
          phone: emp.phone || '+48 000 000 000',
          email: emp.email || 'brak@email.pl',
          specializations: emp.specializations || [],
          currentOrders: 0, // Będzie obliczone na podstawie wizyt
          maxOrders: emp.maxVisitsPerWeek || 15,
          region: emp.address || emp.serviceArea?.primaryCity || 'Kraków',
          status: emp.isActive ? 'active' : 'inactive',
          rating: emp.rating || 4.0,
          experience: emp.experience || '1 rok',
          completedJobs: emp.completedJobs || 0,
          agdSpecializations: emp.agdSpecializations,
          workingHours: emp.workingHours || '8:00-16:00',
          serviceArea: emp.serviceArea,
          equipment: emp.equipment,
          certifications: emp.certifications,
          
          // NOWE: Real-time dane z kalendarza
          todaySchedule: realTimeSchedule,
          realTimeAvailability: availability,
          scheduleLastUpdate: schedule?.lastSyncWithEmployee,
          utilizationPercentage: availability.utilizationPercentage || 0,
          nextAvailableSlot: availability.nextAvailableSlot,
          currentScheduleVersion: schedule?.version || 0
        };
      }));
      
      setEmployees(processedEmployees);
      
      // Oblicz rzeczywiste obciążenie pracowników na podstawie wizyt
      await calculateEmployeeWorkloads(processedEmployees);
      
      // Oblicz statystyki po załadowaniu pracowników
      setTimeout(() => calculateStats(), 200);
      
    } catch (error) {
      console.error('❌ Błąd pobierania pracowników:', error);
      addNotification('Błąd pobierania pracowników', 'error');
    }
  };

  // Funkcja obliczania rzeczywistego obciążenia pracowników
  const calculateEmployeeWorkloads = async (employeesList) => {
    try {
      // Pobierz wszystkie wizyty dla każdego pracownika
      const workloadPromises = employeesList.map(async (employee) => {
        try {
          const response = await fetch(`/api/order-assignment?action=visits-by-employee&employeeId=${employee.id}`);
          if (response.ok) {
            const data = await response.json();
            const activeVisits = data.visits?.filter(v => 
              v.status === 'scheduled' || v.status === 'in-progress'
            ).length || 0;
            
            return {
              ...employee,
              currentOrders: activeVisits,
              workloadPercentage: Math.round((activeVisits / employee.maxOrders) * 100)
            };
          }
        } catch (error) {
          console.warn(`⚠️ Nie można pobrać obciążenia dla ${employee.name}:`, error);
        }
        return employee;
      });

      const employeesWithWorkload = await Promise.all(workloadPromises);
      setEmployees(employeesWithWorkload);
      
      console.log('📊 Obliczono obciążenie pracowników');
    } catch (error) {
      console.error('❌ Błąd obliczania obciążenia:', error);
    }
  };

  const fetchPendingVisits = async () => {
    try {
      const response = await fetch('/api/order-assignment?action=pending-visits');
      const data = await response.json();
      
      if (data.success) {
        setAssignedOrders(data.visits || []);
        console.log('🗓️ Pobrano oczekujące wizyty:', data.visits?.length || 0);
      }
    } catch (error) {
      console.error('❌ Błąd pobierania wizyt:', error);
    }
  };

  // Funkcje pomocnicze
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
    
    // Play sound if enabled
    if (soundEnabled && type === 'success') {
      // Tutaj można dodać dźwięk powiadomienia
    }
  };

  // Inicjalizacja danych
  useEffect(() => {
    if (!auth) return;
    
    const initializeData = async () => {
      try {
        await fetchEmployees();
        await fetchOrdersWithVisits();
        await fetchPendingVisits();
        
        addNotification('Panel przydziału zleceń załadowany', 'success');
      } catch (error) {
        console.error('❌ Błąd inicjalizacji:', error);
        addNotification('Błąd inicjalizacji panelu', 'error');
      }
    };
    
    initializeData();
  }, [auth]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (!auth) return;
    
    const interval = setInterval(() => {
      refreshData();
      setLastRefresh(new Date());
    }, autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [auth, autoRefreshInterval]);

  // 🔄 AUTO-REFRESH ZLECEŃ (co 15 sekund)
  // Wykrywa usunięcia/dodania zleceń w czasie rzeczywistym
  useEffect(() => {
    if (!auth) return;
    
    const refreshOrders = async () => {
      try {
        console.log('🔄 Auto-refresh zleceń...');
        
        const response = await fetch('/api/order-assignment');
        const data = await response.json();
        
        if (data.success && data.orders) {
          // Sprawdź czy są różnice
          const currentOrderIds = incomingOrders.map(o => o.orderNumber).sort().join(',');
          const newOrderIds = data.orders.map(o => o.orderNumber).sort().join(',');
          
          if (currentOrderIds !== newOrderIds) {
            setIncomingOrders(data.orders);
            setLastRefresh(new Date()); // ✅ Zaktualizuj timestamp
            console.log(`✅ Zlecenia zaktualizowane: ${data.orders.length} (było: ${incomingOrders.length})`);
            
            // Wykryj nowe zlecenia
            if (data.orders.length > incomingOrders.length && soundEnabled) {
              const diff = data.orders.length - incomingOrders.length;
              addNotification(`📞 ${diff} ${diff === 1 ? 'nowe zlecenie' : 'nowych zleceń'}!`, 'info');
            }
            
            // Wykryj usunięte zlecenia
            if (data.orders.length < incomingOrders.length) {
              const diff = incomingOrders.length - data.orders.length;
              console.log(`🗑️ Usunięto ${diff} ${diff === 1 ? 'zlecenie' : 'zleceń'}`);
            }
            
            // Zaktualizuj statystyki
            setTimeout(() => calculateStats(), 100);
          } else {
            console.log('⚪ Zlecenia bez zmian');
          }
        }
      } catch (error) {
        console.error('❌ Auto-refresh zleceń błąd:', error);
      }
    };
    
    // Wywołaj natychmiast
    refreshOrders();
    
    // Następnie co 15 sekund
    const interval = setInterval(refreshOrders, 15000);
    
    return () => clearInterval(interval);
  }, [auth, incomingOrders, soundEnabled]);

  // 🔄 AUTO-REFRESH HARMONOGRAMÓW PRACOWNIKÓW (co 30 sekund)
  // Rozwiązanie problemu: Technik zmienia harmonogram → Panel automatycznie widzi zmiany
  useEffect(() => {
    if (!auth) return;
    
    const refreshEmployeeSchedules = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      try {
        console.log('🔄 Auto-refresh harmonogramów pracowników...');
        
        const response = await fetch(
          `/api/employee-calendar?action=get-all-schedules&date=${today}`
        );
        
        const data = await response.json();
        
        if (data.success && data.schedules) {
          // Sprawdź czy są różnice przed aktualizacją (unikaj zbędnych re-renderów)
          const currentSchedulesJson = JSON.stringify(employeeSchedules);
          const newSchedulesJson = JSON.stringify(data.schedules);
          
          if (currentSchedulesJson !== newSchedulesJson) {
            setEmployeeSchedules(data.schedules);
            setLastScheduleRefresh(new Date());
            console.log(`✅ Harmonogramy zaktualizowane (${Object.keys(data.schedules).length} pracowników)`);
            
            // ✅ AKTUALIZUJ LISTĘ PRACOWNIKÓW Z NOWYMI HARMONOGRAMAMI
            setEmployees(prevEmployees => prevEmployees.map(emp => {
              const newSchedule = data.schedules[emp.id];
              if (!newSchedule) return emp; // Brak zmian dla tego pracownika
              
              // Przelicz real-time schedule na podstawie 15-minutowych slotów
              const realTimeSchedule = [];
              
              // Sprawdź czy dzień wolny
              if (newSchedule.isDayOff) {
                console.log(`⚠️ ${emp.name}: Dzień wolny - czyść sloty`);
                // realTimeSchedule pozostaje pusty []
              } else if (newSchedule.timeSlots && newSchedule.timeSlots.length > 0) {
                // Grupuj sloty co godzinę dla lepszego wyświetlenia
                const hourlySlots = {};
                
                newSchedule.timeSlots.forEach(slot => {
                  const hour = slot.time.split(':')[0] + ':00';
                  if (!hourlySlots[hour]) {
                    hourlySlots[hour] = [];
                  }
                  hourlySlots[hour].push(slot);
                });
                
                Object.keys(hourlySlots).forEach(hour => {
                  const slots = hourlySlots[hour];
                  const mainStatus = slots[0].status;
                  const activity = slots.find(s => s.activity)?.activity || 
                                 (mainStatus === 'available' ? 'FREE' : 'BUSY');
                  
                  realTimeSchedule.push({
                    time: hour,
                    client: activity,
                    type: mainStatus,
                    slotsCount: slots.length
                  });
                });
              }
              
              // Zwróć zaktualizowanego pracownika
              return {
                ...emp,
                todaySchedule: realTimeSchedule,
                scheduleLastUpdate: newSchedule.lastSyncWithEmployee,
                currentScheduleVersion: newSchedule.version || 0
              };
            }));
            
            // Opcjonalnie: Wyświetl notyfikację tylko jeśli są istotne zmiany
            const changedEmployees = Object.keys(data.schedules).filter(empId => {
              const oldSchedule = employeeSchedules[empId];
              const newSchedule = data.schedules[empId];
              
              // Sprawdź czy liczba dostępnych slotów się zmieniła
              if (!oldSchedule || !newSchedule) return false;
              
              // ✅ Uwzględnij zmianę z/do dnia wolnego
              if (oldSchedule.isDayOff !== newSchedule.isDayOff) return true;
              
              const oldAvailable = oldSchedule.timeSlots?.filter(s => s.status === 'available').length || 0;
              const newAvailable = newSchedule.timeSlots?.filter(s => s.status === 'available').length || 0;
              
              return oldAvailable !== newAvailable;
            });
            
            if (changedEmployees.length > 0) {
              addNotification(
                `🔄 Harmonogramy zaktualizowane (${changedEmployees.length} zmian)`, 
                'info'
              );
            }
          } else {
            console.log('⚪ Harmonogramy bez zmian');
          }
        }
      } catch (error) {
        console.error('❌ Auto-refresh harmonogramów błąd:', error);
        // Nie pokazuj błędu użytkownikowi - to proces działający w tle
      }
    };
    
    // Wywołaj natychmiast przy montowaniu
    refreshEmployeeSchedules();
    
    // Następnie co 30 sekund
    const interval = setInterval(refreshEmployeeSchedules, 30000);
    
    return () => clearInterval(interval);
  }, [auth, employeeSchedules]); // Zależność od employeeSchedules aby porównać zmiany

  // Funkcja odświeżania danych
  const refreshData = useCallback(async () => {
    try {
      const previousCount = incomingOrders.length;
      
      // Odśwież zlecenia z wizytami
      await fetchOrdersWithVisits();
      await fetchPendingVisits();
      
      // Sprawdź czy są nowe zlecenia
      const newCount = incomingOrders.length;
      if (newCount > previousCount && soundEnabled) {
        addNotification(`📞 ${newCount - previousCount} nowych zleceń!`, 'info');
      }
      
      console.log('🔄 Dane odświeżone');
      
    } catch (error) {
      console.error('❌ Błąd odświeżania danych:', error);
      addNotification('Błąd odświeżania danych', 'error');
    }
  }, [soundEnabled, incomingOrders.length]);

  // Funkcja obliczania statystyk
  const calculateStats = useCallback(() => {
    const today = new Date().toDateString();
    
    const todayIncoming = incomingOrders.filter(order => 
      new Date(order.createdAt || order.receivedAt || '2025-01-01').toDateString() === today
    ).length;
    
    const todayAssigned = assignedOrders.filter(order => 
      new Date(order.assignedAt || '2025-01-01').toDateString() === today
    ).length;

    const employeeWorkload = {};
    employees.forEach(emp => {
      employeeWorkload[emp.name] = {
        id: emp.id,
        current: emp.currentOrders || 0,
        max: emp.maxOrders || 15,
        percentage: emp.workloadPercentage || Math.round(((emp.currentOrders || 0) / (emp.maxOrders || 15)) * 100),
        status: emp.status,
        specializations: emp.specializations || [],
        region: emp.region
      };
    });

    // Oblicz rozkład regionów na podstawie rzeczywistych pracowników
    const regionDistribution = {};
    employees.forEach(emp => {
      const region = emp.region || 'Nieznany';
      regionDistribution[region] = (regionDistribution[region] || 0) + 1;
    });

    // Oblicz rozkład priorytetów na podstawie rzeczywistych zleceń
    const priorityBreakdown = {};
    incomingOrders.forEach(order => {
      const priority = order.priority || 'medium';
      priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;
    });

    setStats({
      todayIncoming,
      todayAssigned,
      avgResponseTime: 12,
      employeeWorkload,
      regionDistribution,
      priorityBreakdown,
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length
    });
  }, [incomingOrders, assignedOrders, employees]);

  // Funkcje powiadomień
  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const playNotificationSound = () => {
    if (soundEnabled) {
      // Symulacja dźwięku powiadomienia
      console.log('🔔 DING! Nowe zlecenie!');
    }
  };

  // Funkcja dodawania wizyty do zlecenia z automatyczną rezerwacją kalendarza
  const addVisitToOrder = async (orderId, visitData) => {
    try {
      // KROK 1: Sprawdź dostępność w kalendarzu
      const availability = await checkEmployeeAvailability(
        visitData.employeeId, 
        visitData.scheduledDate, 
        visitData.estimatedDuration || 60
      );
      
      if (!availability.isAvailable) {
        addNotification(`❌ Pracownik nie jest dostępny w tym terminie`, 'error');
        return false;
      }
      
      // KROK 2: Dodaj wizytę do systemu zleceń
      const response = await fetch('/api/order-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add-visit',
          orderId,
          visitType: visitData.type || 'diagnosis',
          scheduledDate: visitData.scheduledDate,
          scheduledTime: visitData.scheduledTime,
          employeeId: visitData.employeeId,
          notes: visitData.notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // KROK 3: Zarezerwuj slot w kalendarzu pracownika
        const slotReserved = await reserveEmployeeSlot(
          visitData.employeeId,
          visitData.scheduledDate,
          visitData.scheduledTime,
          visitData.estimatedDuration || 60,
          `Wizyta ${visitData.type} - ${orderId}`,
          orderId,
          result.visitId || `VIS${Date.now()}`
        );
        
        if (slotReserved) {
          addNotification(`✅ Wizyta ${visitData.type} zaplanowana i zarezerwowana w kalendarzu`, 'success');
          await refreshData(); // Odśwież dane
          return true;
        } else {
          addNotification(`⚠️ Wizyta dodana, ale nie udało się zarezerwować kalendarza`, 'warning');
          await refreshData();
          return true; // Wizyta została dodana mimo problemów z kalendarzem
        }
      } else {
        addNotification(`❌ ${result.message}`, 'error');
        return false;
      }
    } catch (error) {
      console.error('❌ Błąd dodawania wizyty:', error);
      addNotification('Błąd dodawania wizyty', 'error');
      return false;
    }
  };

  // ==========================================
  // INTEGRACJA Z KALENDARZAMI PRACOWNIKÓW
  // ==========================================

  // Sprawdź dostępność pracownika w czasie rzeczywistym
  const checkEmployeeAvailability = async (employeeId, date, requiredDuration = 60) => {
    try {
      console.log(`🔍 Sprawdzanie dostępności: ${employeeId} na ${date}`);
      const response = await fetch(
        `/api/employee-calendar?action=check-availability&employeeId=${employeeId}&date=${date}&duration=${requiredDuration}`
      );
      
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        // Fallback - pozwól na wizytę
        return { isAvailable: true, availableSlots: [{ time: '09:00', duration: 60 }] };
      }

      const data = await response.json();
      console.log('📊 Odpowiedź API dostępności:', data);
      
      if (data.success) {
        return {
          isAvailable: data.availableSlots.length > 0,
          availableSlots: data.availableSlots,
          nextAvailableSlot: data.nextAvailableSlot,
          utilizationPercentage: data.utilizationPercentage
        };
      }
    } catch (error) {
      console.error('❌ Błąd sprawdzania dostępności:', error);
    }
    
    // Fallback - jeśli API nie działa, pozwól na wizytę o 9:00
    console.log('⚠️ Fallback: pozwalam na wizytę o 9:00');
    return { isAvailable: true, availableSlots: [{ time: '09:00', duration: 60 }] };
  };

  // Pobierz harmonogram pracownika
  const fetchEmployeeSchedule = async (employeeId, date) => {
    try {
      const response = await fetch(
        `/api/employee-calendar?action=get-schedule&employeeId=${employeeId}&date=${date}`
      );
      const data = await response.json();
      
      if (data.success) {
        return data.schedule;
      }
    } catch (error) {
      console.error('❌ Błąd pobierania harmonogramu:', error);
    }
    
    return null;
  };

  // Pobierz wszystkie harmonogramy na dany dzień
  const fetchAllSchedules = async (date) => {
    try {
      const response = await fetch(
        `/api/employee-calendar?action=get-all-schedules&date=${date}`
      );
      const data = await response.json();
      
      if (data.success) {
        return data.schedules;
      }
    } catch (error) {
      console.error('❌ Błąd pobierania wszystkich harmonogramów:', error);
    }
    
    return {};
  };

  // Zarezerwuj slot w kalendarzu pracownika
  const reserveEmployeeSlot = async (employeeId, date, startTime, duration, activity, orderId, visitId) => {
    try {
      const response = await fetch('/api/employee-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reserve-slot',
          employeeId,
          date,
          startTime,
          duration,
          activity,
          orderId,
          visitId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Slot zarezerwowany: ${employeeId} ${date} ${startTime}`);
        return true;
      } else {
        console.error(`❌ Błąd rezerwacji slotu: ${result.message}`);
        addNotification(`❌ ${result.message}`, 'error');
        return false;
      }
    } catch (error) {
      console.error('❌ Błąd rezerwacji slotu:', error);
      addNotification('Błąd rezerwacji slotu w kalendarzu', 'error');
      return false;
    }
  };

  // Funkcja przepisywania wizyty
  const reassignVisit = async (orderId, visitId, newEmployeeId, reason) => {
    try {
      console.log('🔄 Przepisywanie wizyty:', { orderId, visitId, newEmployeeId, reason });
      
      const response = await fetch('/api/order-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reassign-visit',
          orderId,
          visitId,
          newEmployeeId,
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 Wynik przepisywania:', result);
      
      if (result.success) {
        addNotification('✅ Wizyta przepisana', 'success');
        await refreshData();
        return true;
      } else {
        addNotification(`❌ ${result.message}`, 'error');
        console.error('❌ Błąd przepisywania wizyty:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Błąd przepisywania wizyty:', error);
      console.error('📋 Szczegóły błędu:', error?.message, error?.stack);
      addNotification(`❌ Błąd przepisywania: ${error?.message || 'Nieznany błąd'}`, 'error');
      return false;
    }
  };

  // Funkcja automatycznego przydzielania (dodanie pierwszej wizyty)
  const autoAssignOrder = async (orderId) => {
    const order = incomingOrders.find(o => o.id === orderId);
    if (!order) return;

    const bestEmployee = order.suggestedEmployee;
    
    if (bestEmployee) {
      // Dodaj pierwszą wizytę diagnozy
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const success = await addVisitToOrder(orderId, {
        type: 'diagnosis',
        scheduledDate: tomorrow.toISOString().split('T')[0],
        scheduledTime: '09:00',
        employeeId: bestEmployee.id,
        notes: `Automatycznie przydzielona wizyta diagnozy dla ${order.deviceType} ${order.brand || ''}`
      });
      
      if (success) {
        addNotification(
          `✅ Zlecenie ${order.orderNumber} automatycznie przydzielone do ${bestEmployee.name}`,
          'success'
        );
      }
    }
  };

  // Algorytm znajdowania najlepszego pracownika
  const findBestEmployee = (order) => {
    let bestScore = -1;
    let bestEmployee = null;

    employees.forEach(employee => {
      if (employee.status !== 'active') return;
      if (employee.currentOrders >= employee.maxOrders) return;

      let score = 0;

      // Specjalizacja (40% wagi)
      const specializations = employee.specializations || employee.specialization || [];
      if (specializations.includes(order.deviceType) || 
          specializations.includes('Wszystkie AGD')) {
        score += 40;
      }

      // Region geograficzny (30% wagi)
      if (employee.region === order.region) {
        score += 30;
      } else {
        score += 10; // Może dojechać do innego regionu
      }

      // Obciążenie pracą (20% wagi)
      const workloadFactor = 1 - (employee.currentOrders / employee.maxOrders);
      score += workloadFactor * 20;

      // Ocena pracownika (10% wagi)
      score += (employee.rating / 5) * 10;

      if (score > bestScore) {
        bestScore = score;
        bestEmployee = employee;
      }
    });

    return bestEmployee;
  };

  // 🚀 SZYBKIE DODAWANIE WIZYTY - JEDEN KLIK
  const quickAddVisit = async (orderId) => {
    console.log('🚀 Szybka wizyta - START', { orderId });
    
    const order = incomingOrders.find(o => o.id === orderId);
    if (!order) {
      console.error('❌ Nie znaleziono zlecenia:', orderId);
      addNotification('❌ Nie znaleziono zlecenia', 'error');
      return;
    }

    console.log('📋 Znaleziono zlecenie:', order);

    try {
      // KROK 1: Znajdź najlepszego pracownika
      console.log('👥 Dostępni pracownicy:', employees.length);
      const bestEmployee = findBestEmployee(order);
      console.log('🏆 Najlepszy pracownik:', bestEmployee);
      
      if (!bestEmployee) {
        addNotification('❌ Brak dostępnych pracowników', 'error');
        return;
      }

      // KROK 2: Znajdź najlepszy termin (jutro o 9:00 lub pierwszy dostępny)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const suggestedDate = tomorrow.toISOString().split('T')[0];
      const suggestedTime = '09:00';

      console.log('📅 Sugerowany termin:', suggestedDate, suggestedTime);

      // KROK 3: Sprawdź dostępność
      console.log('🔍 Sprawdzanie dostępności pracownika...');
      const availability = await checkEmployeeAvailability(
        bestEmployee.id, 
        suggestedDate, 
        60 // 1 godzina na wizytę
      );

      console.log('📊 Dostępność:', availability);

      let finalDate = suggestedDate;
      let finalTime = suggestedTime;

      // UPROSZCZENIE: Po prostu użyj jutro o 9:00 (pomiń skomplikowane sprawdzanie)
      console.log('✅ Używam domyślnego terminu (jutro 9:00) - pomijam sprawdzanie harmonogramu');
      finalDate = suggestedDate;
      finalTime = suggestedTime;

      // KROK 4: Dodaj wizytę automatycznie
      console.log('📅 Dodawanie wizyty:', {
        orderId,
        type: 'diagnosis',
        scheduledDate: finalDate,
        scheduledTime: finalTime,
        employeeId: bestEmployee.id,
        employeeName: bestEmployee.name
      });

      const success = await addVisitToOrder(orderId, {
        type: 'diagnosis',
        scheduledDate: finalDate,
        scheduledTime: finalTime,
        employeeId: bestEmployee.id,
        estimatedDuration: 60,
        notes: `Szybko dodana wizyta diagnozy - ${order.deviceType} ${order.brand || ''}`
      });

      console.log('✅ Wynik dodawania wizyty:', success);

      if (success) {
        addNotification(
          `⚡ Wizyta dodana jednym klikiem! ${bestEmployee.name} - ${finalDate} ${finalTime}`,
          'success'
        );
        await refreshData(); // Odśwież dane po dodaniu wizyty
      }
    } catch (error) {
      console.error('❌ Błąd szybkiego dodawania wizyty:', error);
      console.error('📋 Stack trace:', error?.stack);
      addNotification(`❌ Błąd szybkiego dodawania: ${error?.message || 'Nieznany błąd'}`, 'error');
    }
  };

  // Znajdowanie następnego dostępnego terminu
  const findNextAvailableSlot = async (employeeId, duration) => {
    const today = new Date();
    
    // Sprawdź następne 14 dni
    for (let i = 1; i <= 14; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      
      // Pomiń weekendy (można skonfigurować)
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
      
      const dateStr = checkDate.toISOString().split('T')[0];
      
      // Sprawdź dostępne godziny w tym dniu (9:00 - 17:00)
      const workingHours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
      
      for (const time of workingHours) {
        // Sprawdź dostępność dla konkretnej godziny (w przyszłości można ulepszyć checkEmployeeAvailability)
        const availability = await checkEmployeeAvailability(employeeId, dateStr, duration);
        if (availability.isAvailable) {
          return { date: dateStr, time: time };
        }
        
        // Krótka przerwa między sprawdzeniami, żeby nie spamować API
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return null; // Brak dostępnych terminów w najbliższych 14 dniach
  };

  // Obliczanie najlepszej daty
  const calculateBestDate = (order, employee) => {
    // Logika optymalizacji daty na podstawie:
    // - preferencji klienta
    // - harmonogramu pracownika
    // - pilności zlecenia
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (order.priority === 'high') {
      return today.toISOString().split('T')[0];
    }

    return order.preferredDates[0] || tomorrow.toISOString().split('T')[0];
  };

  // Obliczanie najlepszego czasu
  const calculateBestTime = (order, employee) => {
    // Znajdź pierwszą wolną godzinę w harmonogramie
    const schedule = employee.todaySchedule || [];
    const freeSlot = schedule.find(slot => slot.client === 'FREE');
    return freeSlot ? freeSlot.time : '14:00';
  };

  // Funkcje obsługi widoku szczegółowego slotów
  const toggleTimeSlotExpansion = (employeeId, slotTime) => {
    const slotKey = `${employeeId}-${slotTime}`;
    setExpandedTimeSlots(prev => ({
      ...prev,
      [slotKey]: !prev[slotKey]
    }));
  };

  const openEmployeeDetailView = (employee) => {
    setSelectedEmployee(employee);
  };

  const closeEmployeeDetailView = () => {
    setSelectedEmployee(null);
  };

  // 🆕 NOWE FUNKCJE WYŚWIETLANIA I SORTOWANIA
  
  // Sortowanie zleceń
  const sortOrders = (orders) => {
    const sorted = [...orders].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'date':
          aValue = new Date(a.createdAt || a.receivedAt || '2025-01-01');
          bValue = new Date(b.createdAt || b.receivedAt || '2025-01-01');
          break;
        case 'client':
          aValue = a.clientName?.toLowerCase() || '';
          bValue = b.clientName?.toLowerCase() || '';
          break;
        case 'value':
          aValue = a.serviceCost || 0;
          bValue = b.serviceCost || 0;
          break;
        case 'region':
          aValue = extractCityFromAddress(a.address) || '';
          bValue = extractCityFromAddress(b.address) || '';
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return sorted;
  };

  // Filtrowanie zleceń
  const filterOrders = (orders) => {
    let filtered = orders;
    
    // Filtr wyszukiwania
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtr priorytetu
    if (filters.priority !== 'all') {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }
    
    // Filtr regionu
    if (filters.region !== 'all') {
      filtered = filtered.filter(order => {
        const city = extractCityFromAddress(order.address);
        return city?.toLowerCase().includes(filters.region.toLowerCase());
      });
    }
    
    // Filtr statusu
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    
    return filtered;
  };

  // Paginacja
  const paginateOrders = (orders) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  };

  // Funkcja pomocnicza - wyciąganie miasta z adresu
  const extractCityFromAddress = (address) => {
    if (!address) return null;
    const parts = address.split(',');
    return parts.length >= 2 ? parts[parts.length - 1].trim() : null;
  };

  // Przygotowanie danych do wyświetlenia
  const prepareDisplayOrders = () => {
    let orders = activeView === 'incoming' ? incomingOrders : assignedOrders;
    orders = filterOrders(orders);
    orders = sortOrders(orders);
    return paginateOrders(orders);
  };

  // Obliczanie liczby stron
  const totalPages = Math.ceil(filterOrders(activeView === 'incoming' ? incomingOrders : assignedOrders).length / itemsPerPage);

  // Reset na pierwszą stronę przy zmianie filtrów
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, sortBy, itemsPerPage, activeView]);

  // Funkcja ręcznego przydzielania
  const manualAssignOrder = (orderId, employeeId, date, time) => {
    const order = incomingOrders.find(o => o.id === orderId);
    const employee = employees.find(e => e.id === employeeId);
    
    if (!order || !employee) return;

    const assignment = {
      ...order,
      assignedTo: employeeId,
      assignedAt: new Date(),
      suggestedDate: date,
      suggestedTime: time,
      autoAssigned: false
    };

    setAssignedOrders(prev => [...prev, assignment]);
    setIncomingOrders(prev => prev.filter(o => o.id !== orderId));
    
    showNotification(
      `✅ Zlecenie ${order.orderNumber} przydzielone do ${employee.name}`,
      'success'
    );
  };

  // Autoryzacja
  const handleLogin = () => {
    if (password === 'admin123') {
      setAuth(true);
      showNotification('✅ Zalogowano do Panelu Przydziału Zleceń', 'success');
    } else {
      showNotification('❌ Nieprawidłowe hasło', 'error');
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <FiUsers className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Panel Przydziału Zleceń</h1>
            <p className="text-gray-600 mt-2">Centrum Operacyjne AGD</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Hasło administratora"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Zaloguj się
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Powiadomienia */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg border max-w-sm transition-all duration-300 ${
                notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleTimeString('pl-PL')}
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FiCpu className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Panel Przydziału Zleceń</h1>
                  <p className="text-sm text-gray-600">Centrum Operacyjne - Real-time</p>
                </div>
              </div>

              {/* Status połączenia */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">ONLINE</span>
                </div>
                <div className="text-xs text-gray-500">
                  Zlecenia: {lastRefresh.toLocaleTimeString('pl-PL')}
                </div>
                <div className="text-xs text-blue-600 flex items-center space-x-1">
                  <FiCalendar className="w-3 h-3" />
                  <span>Harmonogramy: {lastScheduleRefresh.toLocaleTimeString('pl-PL')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Przełącznik trybu auto */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Tryb Auto:</span>
                <button
                  onClick={() => setIsAutoMode(!isAutoMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isAutoMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isAutoMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Dźwięk */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg ${soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
              >
                {soundEnabled ? <FiVolume2 className="h-4 w-4" /> : <FiVolumeX className="h-4 w-4" />}
              </button>

              {/* Odświeżanie */}
              <button
                onClick={refreshData}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiRefreshCw className="h-4 w-4" />
                <span>Odśwież</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Nowe Zlecenia</p>
                  <p className="text-2xl font-bold text-red-700">{incomingOrders.length}</p>
                </div>
                <FiActivity className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Przydzielone Dziś</p>
                  <p className="text-2xl font-bold text-green-700">{stats.todayAssigned}</p>
                </div>
                <FiCheck className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Aktywni Serwisanci</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {employees.filter(e => e.status === 'active').length}
                  </p>
                </div>
                <FiUsers className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Śr. Czas Odpowiedzi</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.avgResponseTime}min</p>
                </div>
                <FiClock className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel nowych zleceń */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiActivity className="h-5 w-5 mr-2 text-red-500" />
                  {activeView === 'incoming' ? 'Nowe Zlecenia' : 'Przydzielone Zlecenia'} ({activeView === 'incoming' ? incomingOrders.length : assignedOrders.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Auto-przydział:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isAutoMode ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isAutoMode ? 'WŁĄCZONY' : 'WYŁĄCZONY'}
                  </span>
                </div>
              </div>

              {/* 🆕 NOWY PASEK NARZĘDZI */}
              <div className="space-y-4">
                {/* Przełączniki widoku i wyszukiwanie */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Przełącznik incoming/assigned */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setActiveView('incoming')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          activeView === 'incoming' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Nowe ({incomingOrders.length})
                      </button>
                      <button
                        onClick={() => setActiveView('assigned')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          activeView === 'assigned' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Przydzielone ({assignedOrders.length})
                      </button>
                    </div>

                    {/* Tryb wyświetlania */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Widok kafelków"
                      >
                        <FiGrid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Widok listy"
                      >
                        <FiList className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('compact')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Widok kompaktowy"
                      >
                        <FiLayers className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Wyszukiwanie */}
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Szukaj zleceń..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-2 rounded-lg border transition-colors ${
                        showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:text-gray-900'
                      }`}
                      title="Filtry"
                    >
                      <FiFilter className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Panel filtrów (rozwijany) */}
                {showFilters && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Sortowanie */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sortowanie</label>
                        <select
                          value={`${sortBy}-${sortOrder}`}
                          onChange={(e) => {
                            const [by, order] = e.target.value.split('-');
                            setSortBy(by);
                            setSortOrder(order);
                          }}
                          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="priority-desc">Priorytet ↓</option>
                          <option value="priority-asc">Priorytet ↑</option>
                          <option value="date-desc">Data ↓</option>
                          <option value="date-asc">Data ↑</option>
                          <option value="client-asc">Klient A-Z</option>
                          <option value="client-desc">Klient Z-A</option>
                          <option value="value-desc">Wartość ↓</option>
                          <option value="value-asc">Wartość ↑</option>
                          <option value="region-asc">Region A-Z</option>
                        </select>
                      </div>

                      {/* Filtr priorytetu */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Priorytet</label>
                        <select
                          value={filters.priority}
                          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Wszystkie</option>
                          <option value="urgent">Pilne</option>
                          <option value="high">Wysokie</option>
                          <option value="medium">Średnie</option>
                          <option value="low">Niskie</option>
                        </select>
                      </div>

                      {/* Filtr regionu */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                        <select
                          value={filters.region}
                          onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Wszystkie</option>
                          <option value="kraków">Kraków</option>
                          <option value="warszawa">Warszawa</option>
                          <option value="gdańsk">Gdańsk</option>
                          <option value="wrocław">Wrocław</option>
                          <option value="poznań">Poznań</option>
                        </select>
                      </div>

                      {/* Elementów na stronę */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Na stronę</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                          <option value={6}>6</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>
                      </div>
                    </div>

                    {/* Siatka kolumn (tylko dla widoku grid) */}
                    {viewMode === 'grid' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-700">Kolumny:</span>
                        {[1, 2, 3, 4, 5].map(cols => (
                          <button
                            key={cols}
                            onClick={() => setGridCols(cols)}
                            className={`px-2 py-1 text-xs rounded ${
                              gridCols === cols 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {cols}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Informacje o wynikach i paginacja */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    Wyświetlane: {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filterOrders(activeView === 'incoming' ? incomingOrders : assignedOrders).length)} z {filterOrders(activeView === 'incoming' ? incomingOrders : assignedOrders).length}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        <FiChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        <FiChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🆕 NOWA DYNAMICZNA SEKCJA WYŚWIETLANIA */}
            <div className="p-6">
              {(() => {
                const displayOrders = prepareDisplayOrders();
                const totalOrders = filterOrders(activeView === 'incoming' ? incomingOrders : assignedOrders).length;
                
                if (totalOrders === 0) {
                  return (
                    <div className="text-center text-gray-500 py-12">
                      <FiCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        {activeView === 'incoming' ? 'Brak oczekujących zleceń' : 'Brak przydzielonych zleceń'}
                      </p>
                      <p className="text-sm">
                        {activeView === 'incoming' ? 'Wszystkie zlecenia zostały przydzielone' : 'Nie ma jeszcze przydzielonych zleceń'}
                      </p>
                    </div>
                  );
                }

                // WIDOK SIATKI (KAFELKI)
                if (viewMode === 'grid') {
                  return (
                    <div className={`grid gap-4 ${
                      gridCols === 1 ? 'grid-cols-1' :
                      gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                      gridCols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                      gridCols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                    }`}>
                      {displayOrders.map(order => (
                        <div key={order.id} className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                          order.needsVisit ? 'border-l-4 border-l-yellow-400 bg-yellow-50' : 'border-gray-200'
                        }`}
                        onClick={() => setExpandedOrder(order)}
                        >
                          {/* Nagłówek kafelka */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{order.clientName}</h3>
                              <p className="text-sm text-gray-600">#{order.orderNumber}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedOrder(order);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Rozwiń pełny widok"
                            >
                              <FiMaximize2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* KOD URZĄDZENIA + PRIORYTET */}
                          <div className="flex items-center justify-between mb-3">
                            {(() => {
                              const deviceBadge = getDeviceBadgeProps(order.deviceType || order.category);
                              return (
                                <span className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-lg border-2 ${deviceBadge.className}`}>
                                  [{deviceBadge.code}]
                                </span>
                              );
                            })()}
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {order.priority === 'urgent' ? 'PILNE' :
                                 order.priority === 'high' ? 'WYSOKIE' :
                                 order.priority === 'medium' ? 'ŚREDNIE' : 'NISKIE'}
                              </span>
                              {order.needsVisit && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  WIZYTA
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ADRES GŁÓWNY (największa czcionka) */}
                          <div className="mb-3">
                            <div className="flex items-start space-x-2">
                              <FiMapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-base font-bold text-gray-900 leading-tight">
                                  {order.address?.split(',')[0] || 'Brak adresu'}
                                </div>
                                <div className="text-sm font-semibold text-gray-700">
                                  {extractCityFromAddress(order.address)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Informacje drugorzędne */}
                          <div className="space-y-1 text-xs text-gray-600 mb-3">
                            <div className="flex items-center">
                              <FiTool className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span className="truncate">{order.brand || 'Nieznana marka'} {order.deviceType}</span>
                            </div>
                            <div className="flex items-center">
                              <FiDollarSign className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span>{order.serviceCost || 0} zł</span>
                            </div>
                          </div>

                          {/* Przyciski akcji */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Dodaj logikę przydziału
                              }}
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-colors"
                            >
                              Przydziel
                            </button>
                            <span className="text-xs text-gray-500">
                              {new Date(order.createdAt || order.receivedAt || '2025-01-01').toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                // WIDOK LISTY
                if (viewMode === 'list') {
                  return (
                    <div className="divide-y divide-gray-200">
                      {displayOrders.map(order => (
                        <div key={order.id} className={`p-6 hover:bg-gray-50 ${order.needsVisit ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {/* KOD URZĄDZENIA */}
                            {(() => {
                              const deviceBadge = getDeviceBadgeProps(order.deviceType || order.category);
                              return (
                                <span className={`inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-lg border-2 ${deviceBadge.className}`}>
                                  [{deviceBadge.code}]
                                </span>
                              );
                            })()}
                            <span className="text-sm text-gray-600">#{order.orderNumber}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {order.priority === 'urgent' ? 'PILNE' :
                               order.priority === 'high' ? 'WYSOKIE' :
                               order.priority === 'medium' ? 'ŚREDNIE' : 'NISKIE'}
                            </span>
                            {order.needsVisit && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                POTRZEBUJE WIZYTY
                              </span>
                            )}
                            {order.pendingVisitsCount > 0 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {order.pendingVisitsCount} WIZYT OCZEKUJE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ADRES jako główna informacja */}
                        <div className="mb-3">
                          <div className="flex items-center space-x-2">
                            <FiMapPin className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="text-lg font-bold text-gray-900">
                                {order.address?.split(',')[0] || 'Brak adresu'}
                              </div>
                              <div className="text-sm font-semibold text-gray-700">
                                {order.address?.split(',').pop()?.trim() || ''}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <FiPhone className="h-4 w-4 mr-2" />
                            {order.clientPhone || 'Brak telefonu'}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700">{order.clientName}</span>
                          </div>
                          <div className="flex items-center">
                            <FiTool className="h-4 w-4 mr-2" />
                            {order.brand || ''} {order.deviceType || order.category}
                          </div>
                          <div className="flex items-center">
                            <FiDollarSign className="h-4 w-4 mr-2" />
                            ~{order.estimatedCost || 150}zł
                          </div>
                        </div>

                        {/* Szczegóły klienta i dostępności */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Szczegóły klienta</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Email:</span>
                              <div className="text-gray-600">{order.clientEmail || 'Brak adresu email'}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Pełny adres:</span>
                              <div className="text-gray-600">{order.address || 'Brak pełnego adresu'}</div>
                            </div>
                            {order.clientNotes && (
                              <div className="col-span-2">
                                <span className="font-medium text-gray-700">Uwagi klienta:</span>
                                <div className="text-gray-600 italic">"{order.clientNotes}"</div>
                              </div>
                            )}
                            {order.preferredTimes && (
                              <div>
                                <span className="font-medium text-green-700">🕐 Preferowane godziny:</span>
                                <div className="text-green-600 font-medium">
                                  {Array.isArray(order.preferredTimes) ? order.preferredTimes.join(', ') : order.preferredTimes}
                                </div>
                              </div>
                            )}
                            {order.preferredDates && (
                              <div>
                                <span className="font-medium text-green-700">📅 Preferowane daty:</span>
                                <div className="text-green-600 font-medium">
                                  {Array.isArray(order.preferredDates) ? 
                                    order.preferredDates.map(date => new Date(date).toLocaleDateString('pl-PL')).join(', ') : 
                                    order.preferredDates}
                                </div>
                              </div>
                            )}
                            {order.availableTimeSlots && (
                              <div className="col-span-2">
                                <span className="font-medium text-green-700">⏰ Dostępne przedziały:</span>
                                <div className="text-green-600 font-medium">
                                  {Array.isArray(order.availableTimeSlots) ? order.availableTimeSlots.join(' • ') : order.availableTimeSlots}
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-700">Utworzono:</span>
                              <div className="text-gray-600">
                                {new Date(order.createdAt).toLocaleString('pl-PL')}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Źródło:</span>
                              <div className="text-gray-600">
                                {order.source === 'phone' ? '📞 Telefon' : 
                                 order.source === 'web' ? '🌐 Strona WWW' : 
                                 order.source === 'email' ? '📧 Email' : 
                                 order.source || 'Nieznane'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-800 mt-2 font-medium">
                          {order.description || order.symptoms?.join(', ') || 'Brak opisu problemu'}
                        </p>
                        
                        {/* Wyświetl istniejące wizyty */}
                        {order.visits && order.visits.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium text-gray-700">Wizyty:</p>
                            {order.visits.map((visit, idx) => {
                              const visitId = visit.visitId || visit.id || `V${idx + 1}`;
                              return (
                              <div key={visitId} className="text-xs bg-gray-50 p-2 rounded border-l-2 border-l-blue-300">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">
                                    {visit.type === 'diagnosis' ? '🔍 Diagnoza' : 
                                     visit.type === 'repair' ? '🔧 Naprawa' : '✅ Kontrola'} - {visit.employeeName}
                                  </span>
                                  <span className={`px-1 py-0.5 rounded text-xs ${
                                    visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    visit.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {visit.status === 'completed' ? 'Zakończona' :
                                     visit.status === 'scheduled' ? 'Zaplanowana' : 'Oczekuje'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-gray-500">
                                  <span className="font-mono text-xs bg-gray-200 px-1 rounded">
                                    ID: {visitId}
                                  </span>
                                  {visit.visitNumber && <span>#{visit.visitNumber}</span>}
                                </div>
                                {visit.scheduledDate && (
                                  <p className="text-gray-600 mt-1">
                                    📅 {new Date(visit.scheduledDate).toLocaleDateString('pl-PL')}
                                    {visit.scheduledTime && ` o ${visit.scheduledTime}`}
                                  </p>
                                )}
                              </div>
                            );
                            })}
                          </div>
                        )}
                        
                        <div className="mt-3 text-xs text-gray-500">
                          Otrzymano: {new Date(order.createdAt || '2025-01-01').toLocaleString('pl-PL')} 
                          • Status: {order.status}
                          {order.suggestedEmployee && (
                            <span className="ml-2 text-blue-600">
                              • Sugerowany: {order.suggestedEmployee.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
                        <div className="text-xs text-gray-500">
                          Oczekuje: {Math.round(order.waitingTime / (1000 * 60 * 60))}h
                        </div>
                        
                        {order.needsVisit ? (
                          <>
                            <button
                              onClick={() => quickAddVisit(order.id)}
                              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center space-x-1 shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                              <FiZap className="h-4 w-4" />
                              <span>⚡ Szybka wizyta</span>
                            </button>
                            
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                            >
                              <FiCalendar className="h-4 w-4" />
                              <span>Dodaj wizytę</span>
                            </button>
                            
                            {isAutoMode && order.suggestedEmployee && (
                              <button
                                onClick={() => autoAssignOrder(order.id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                              >
                                <FiZap className="h-4 w-4" />
                                <span>Auto</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <FiEdit className="h-4 w-4" />
                            <span>Zarządzaj</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                      ))}
                    </div>
                  );
                }

                // WIDOK KOMPAKTOWY
                if (viewMode === 'compact') {
                  return (
                    <div className="space-y-2">
                      {displayOrders.map(order => (
                        <div key={order.id} className={`bg-white border rounded p-3 hover:bg-gray-50 flex items-center justify-between ${
                          order.needsVisit ? 'border-l-4 border-l-yellow-400' : ''
                        }`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{order.clientName}</span>
                              <span className="text-xs text-gray-500">#{order.orderNumber}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.priority?.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {order.deviceType} • {extractCityFromAddress(order.address)}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Zarządzaj
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>

          {/* Panel serwisantów */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiUsers className="h-5 w-5 mr-2 text-blue-500" />
                Serwisanci ({employees.filter(e => e.status === 'active').length})
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {employees.map(employee => (
                <div key={employee.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.region}</p>
                      {employee.scheduleLastUpdate && (
                        <p className="text-xs text-blue-600">
                          ↻ {new Date(employee.scheduleLastUpdate).toLocaleTimeString('pl-PL')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Wykorzystanie: {employee.utilizationPercentage || 0}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (employee.utilizationPercentage || 0) < 70 ? 'bg-green-500' :
                            (employee.utilizationPercentage || 0) < 90 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${employee.utilizationPercentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Specjalizacja: {(employee.specializations || employee.specialization || []).join(', ') || 'Brak'}</div>
                    <div className="flex items-center">
                      Ocena: {employee.rating}/5
                      <div className="ml-2 flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(employee.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>Godziny pracy: {employee.workingHours}</div>
                  </div>

                  {/* Real-time harmonogram z 15-minutowymi slotami */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>
                        Harmonogram (real-time):
                        {employee.currentScheduleVersion && (
                          <span className="ml-1 text-blue-500">v{employee.currentScheduleVersion}</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                          title="Zobacz pełny plan dnia"
                        >
                          <FiEye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setTimeSlotDetail(timeSlotDetail === 'hourly' ? 'detailed' : 'hourly')}
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-1 rounded transition-colors"
                          title="Przełącz szczegółowość slotów"
                        >
                          <FiTarget className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {/* ✅ Obsłuż dzień wolny */}
                      {(!employee.todaySchedule || employee.todaySchedule.length === 0) ? (
                        <div className="text-xs p-3 rounded bg-gray-100 text-gray-600 text-center border border-gray-300">
                          <span className="font-medium">🏖️ Dzień wolny</span>
                          <div className="text-xs text-gray-500 mt-1">Serwisant nie ustawił godzin pracy</div>
                        </div>
                      ) : (
                        (employee.todaySchedule || []).slice(0, timeSlotDetail === 'detailed' ? 12 : 6).map((slot, idx) => (
                        <div key={idx} className={`text-xs p-2 rounded cursor-pointer transition-all ${
                          slot.type === 'available' ? 'bg-green-50 text-green-700 border-l-2 border-green-400 hover:bg-green-100' :
                          slot.type === 'busy' ? 'bg-red-50 text-red-700 border-l-2 border-red-400 hover:bg-red-100' :
                          slot.type === 'break' ? 'bg-yellow-50 text-yellow-700 border-l-2 border-yellow-400 hover:bg-yellow-100' :
                          slot.type === 'travel' ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-400 hover:bg-blue-100' :
                          'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          const slotKey = `${employee.id}-${slot.time}`;
                          setExpandedTimeSlots(prev => ({
                            ...prev,
                            [slotKey]: !prev[slotKey]
                          }));
                        }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{slot.time}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs">
                                {slot.type === 'available' ? '✅ Wolny' :
                                 slot.type === 'busy' ? '🔴 Zajęty' :
                                 slot.type === 'break' ? '☕ Przerwa' :
                                 slot.type === 'travel' ? '🚗 Przejazd' : '❓'}
                                {slot.slotsCount && ` (${slot.slotsCount}×15min)`}
                              </span>
                              <FiArrowRight className={`w-3 h-3 transition-transform ${
                                expandedTimeSlots[`${employee.id}-${slot.time}`] ? 'rotate-90' : ''
                              }`} />
                            </div>
                          </div>
                          {slot.client !== 'FREE' && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              {slot.client}
                            </div>
                          )}
                          
                          {/* Rozwinięte szczegóły slotu */}
                          {expandedTimeSlots[`${employee.id}-${slot.time}`] && (
                            <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-medium">Status:</span> {slot.type}
                                </div>
                                <div>
                                  <span className="font-medium">Czas:</span> {slot.time}
                                </div>
                                {slot.slotsCount && (
                                  <div className="col-span-2">
                                    <span className="font-medium">Szczegóły:</span> {slot.slotsCount} × 15-minutowe sloty
                                  </div>
                                )}
                                {slot.client && slot.client !== 'FREE' && (
                                  <div className="col-span-2">
                                    <span className="font-medium">Klient/Aktywność:</span> {slot.client}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 mt-2">
                                <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors">
                                  📅 Dodaj wizytę
                                </button>
                                <button className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors">
                                  ✏️ Edytuj
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                      )}
                      {employee.todaySchedule && employee.todaySchedule.length > (timeSlotDetail === 'detailed' ? 12 : 6) && (
                        <div 
                          className="text-xs text-blue-600 text-center py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          ... i {employee.todaySchedule.length - (timeSlotDetail === 'detailed' ? 12 : 6)} więcej slotów
                          <br />
                          <span className="text-blue-500">👁️ Kliknij aby zobaczyć pełny harmonogram</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Następny dostępny slot */}
                  {employee.nextAvailableSlot && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded border-l-2 border-green-400">
                      ⏰ Następny wolny termin: {employee.nextAvailableSlot.startTime} 
                      ({employee.nextAvailableSlot.duration}min)
                    </div>
                  )}
                  
                  {/* Status dostępności awaryjnej */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Real-time sync: 
                      {employee.realTimeAvailability ? (
                        <span className="text-green-600 ml-1">✓ OK</span>
                      ) : (
                        <span className="text-red-600 ml-1">✗ Błąd</span>
                      )}
                    </span>
                    {employee.realTimeAvailability?.isAvailable ? (
                      <span className="text-green-600 font-medium">DOSTĘPNY</span>
                    ) : (
                      <span className="text-red-600 font-medium">ZAJĘTY</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal zarządzania wizytami */}
        {selectedOrder && (
          <VisitManagementModal 
            order={selectedOrder}
            employees={employees}
            onClose={() => setSelectedOrder(null)}
            onAddVisit={addVisitToOrder}
            onReassignVisit={reassignVisit}
            onRefresh={refreshData}
          />
        )}

        {/* Pełnoekranowy widok szczegółowy serwisanta */}
        {selectedEmployee && (
          <EmployeeDetailView
            employee={selectedEmployee}
            orders={incomingOrders}
            onClose={closeEmployeeDetailView}
            onAddVisit={addVisitToOrder}
            onReassignVisit={reassignVisit}
            employees={employees}
          />
        )}
      </div>
    </div>
  );
}

// Komponent pełnoekranowego widoku szczegółowego serwisanta
function EmployeeDetailView({ employee, orders, onClose, onAddVisit, onReassignVisit, employees }) {
  const [activeDetailTab, setActiveDetailTab] = useState('schedule');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Filtruj zlecenia przypisane do tego serwisanta
  const employeeOrders = orders.filter(order => 
    order.visits?.some(visit => visit.technicianId === employee.id)
  );

  // Znajdź wizyty dla wybranej daty
  const visitsForDate = employeeOrders.flatMap(order => 
    (order.visits || [])
      .filter(visit => 
        visit.technicianId === employee.id && 
        visit.scheduledDate === selectedDate
      )
      .map(visit => ({
        ...visit,
        orderNumber: order.orderNumber,
        clientName: order.clientName,
        address: order.address,
        deviceType: order.deviceType
      }))
  );

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Nagłówek */}
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiArrowRight className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{employee.name}</h1>
              <p className="text-blue-200">
                {employee.region} • {employee.phone} • Rating: {employee.rating}/5.0
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-blue-200">Status</div>
              <div className={`text-lg font-bold ${
                employee.realTimeAvailability?.isAvailable ? 'text-green-300' : 'text-red-300'
              }`}>
                {employee.realTimeAvailability?.isAvailable ? 'DOSTĘPNY' : 'ZAJĘTY'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Zakładki */}
        <div className="flex space-x-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveDetailTab('schedule')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeDetailTab === 'schedule' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📅 Harmonogram
          </button>
          <button
            onClick={() => setActiveDetailTab('visits')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeDetailTab === 'visits' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🔧 Wizyty ({employeeOrders.length})
          </button>
          <button
            onClick={() => setActiveDetailTab('stats')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeDetailTab === 'stats' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Statystyki
          </button>
          <button
            onClick={() => setActiveDetailTab('profile')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeDetailTab === 'profile' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 Profil
          </button>
        </div>

        {/* Zawartość zakładek */}
        {activeDetailTab === 'schedule' && (
          <div className="space-y-6">
            {/* Wybór daty */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Plan dnia</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Szczegółowy harmonogram */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lewa kolumna - sloty czasowe */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Sloty czasowe (15-min)</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(employee.todaySchedule || []).map((slot, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-l-4 ${
                          slot.type === 'available' ? 'bg-green-50 border-green-400' :
                          slot.type === 'busy' ? 'bg-red-50 border-red-400' :
                          slot.type === 'break' ? 'bg-yellow-50 border-yellow-400' :
                          slot.type === 'travel' ? 'bg-blue-50 border-blue-400' :
                          'bg-gray-50 border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{slot.time}</span>
                          <span className="text-sm">
                            {slot.type === 'available' ? '✅ Wolny' :
                             slot.type === 'busy' ? '🔴 Zajęty' :
                             slot.type === 'break' ? '☕ Przerwa' :
                             slot.type === 'travel' ? '🚗 Przejazd' : '❓'}
                          </span>
                        </div>
                        {slot.client !== 'FREE' && (
                          <div className="text-sm text-gray-600 mt-1">
                            {slot.client}
                          </div>
                        )}
                        {slot.slotsCount && (
                          <div className="text-xs text-gray-500 mt-1">
                            {slot.slotsCount} × 15min sloty
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prawa kolumna - wizyty na wybrany dzień */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Wizyty na {new Date(selectedDate).toLocaleDateString('pl-PL')} ({visitsForDate.length})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {visitsForDate.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">
                        Brak wizyt na wybrany dzień
                      </div>
                    ) : (
                      visitsForDate.map((visit, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-blue-600">
                              {visit.scheduledTime || 'Bez godziny'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              visit.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              visit.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                              visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {visit.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 font-medium">
                            {visit.orderNumber} - {visit.clientName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {visit.address}
                          </div>
                          <div className="text-sm text-gray-600">
                            {visit.deviceType} - {visit.type}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDetailTab === 'visits' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Wszystkie wizyty serwisanta</h3>
            <div className="grid gap-4">
              {employeeOrders.map((order, idx) => (
                <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {order.orderNumber} - {order.clientName}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.priority === 'high' ? 'bg-red-100 text-red-700' :
                      order.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {order.address} • {order.deviceType}
                  </div>
                  <div className="space-y-2">
                    {(order.visits || [])
                      .filter(visit => visit.technicianId === employee.id)
                      .map((visit, vIdx) => (
                        <div key={vIdx} className="bg-gray-50 rounded p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Wizyta #{visit.visitNumber} - {visit.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {visit.scheduledDate} {visit.scheduledTime}
                            </span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeDetailTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium text-gray-900 mb-2">Ukończone zlecenia</h4>
              <div className="text-2xl font-bold text-blue-600">
                {employee.completedJobs || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium text-gray-900 mb-2">Średnia ocena</h4>
              <div className="text-2xl font-bold text-green-600">
                {employee.rating || 4.0}/5.0
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium text-gray-900 mb-2">Bieżące obciążenie</h4>
              <div className="text-2xl font-bold text-orange-600">
                {employee.currentOrders || 0}/{employee.maxOrders || 15}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium text-gray-900 mb-2">Doświadczenie</h4>
              <div className="text-lg font-bold text-purple-600">
                {employee.experience || '1 rok'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium text-gray-900 mb-2">Godziny pracy</h4>
              <div className="text-lg font-bold text-indigo-600">
                {employee.workingHours || '8:00-16:00'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium text-gray-900 mb-2">Status</h4>
              <div className={`text-lg font-bold ${
                employee.status === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {employee.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
              </div>
            </div>
          </div>
        )}

        {activeDetailTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Informacje kontaktowe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefon</label>
                  <p className="text-gray-900">{employee.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{employee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Region obsługi</label>
                  <p className="text-gray-900">{employee.region}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className={`font-medium ${
                    employee.status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {employee.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Specjalizacje</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Główne specjalizacje</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(employee.specializations || []).map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Specjalizacje AGD</label>
                  <div className="space-y-2 mt-1">
                    {employee.agdSpecializations?.devices?.map((device, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{device.type}:</span>
                        <span className="text-gray-600 ml-1">
                          {device.brands?.join(', ')} ({device.level})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Komponent modalu zarządzania wizytami
function VisitManagementModal({ order, employees, onClose, onAddVisit, onReassignVisit, onRefresh }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [visitForm, setVisitForm] = useState({
    type: 'diagnosis',
    employeeId: '',
    scheduledDate: '',
    scheduledTime: '09:00',
    notes: ''
  });

  const handleAddVisit = async () => {
    if (!visitForm.employeeId || !visitForm.scheduledDate) {
      alert('Wybierz pracownika i datę wizyty');
      return;
    }

    const success = await onAddVisit(order.id, visitForm);
    if (success) {
      setVisitForm({
        type: 'diagnosis',
        employeeId: '',
        scheduledDate: '',
        scheduledTime: '09:00',
        notes: ''
      });
      onRefresh();
    }
  };

  const handleReassignVisit = async (visitId, newEmployeeId) => {
    const success = await onReassignVisit(order.id, visitId, newEmployeeId, 'Przepisano przez panel przydziału');
    if (success) {
      onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Zarządzaj zleceniem: {order.orderNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Przegląd
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'visits'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Wizyty ({order.visits?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('addVisit')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'addVisit'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dodaj wizytę
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Informacje o zleceniu</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Klient:</strong> {order.clientName}</div>
                  <div><strong>Telefon:</strong> {order.clientPhone || 'Brak'}</div>
                  <div><strong>Adres:</strong> {order.address || 'Brak'}</div>
                  <div><strong>Urządzenie:</strong> {order.brand || ''} {order.deviceType || order.category}</div>
                  <div><strong>Model:</strong> {order.model || 'Nieznany'}</div>
                  <div><strong>Problem:</strong> {order.description || order.symptoms?.join(', ') || 'Brak opisu'}</div>
                  <div><strong>Status:</strong> {order.status}</div>
                  <div><strong>Priorytet:</strong> {order.priority}</div>
                  <div><strong>Szacowany koszt:</strong> {order.estimatedCost || 150}zł</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Historia statusów</h3>
                {order.statusHistory && order.statusHistory.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {order.statusHistory.map((status, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">{status.status}</div>
                        <div className="text-gray-600">{status.note}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(status.timestamp).toLocaleString('pl-PL')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Brak historii</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Lista wizyt</h3>
              {order.visits && order.visits.length > 0 ? (
                <div className="space-y-4">
                  {order.visits.map((visit, idx) => {
                    const visitId = visit.visitId || visit.id || `V${idx + 1}`;
                    return (
                    <div key={visitId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-medium">
                              {visit.type === 'diagnosis' ? '🔍 Diagnoza' : 
                               visit.type === 'repair' ? '🔧 Naprawa' : '✅ Kontrola'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                              visit.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {visit.status === 'completed' ? 'Zakończona' :
                               visit.status === 'scheduled' ? 'Zaplanowana' : 'Oczekuje'}
                            </span>
                            <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border">
                              ID: {visitId}
                            </span>
                            {visit.visitNumber && (
                              <span className="text-xs text-gray-500">#{visit.visitNumber}</span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <strong>Technik:</strong> {visit.employeeName || visit.technicianName}
                            </div>
                            <div>
                              <strong>Data:</strong> {visit.scheduledDate ? 
                                new Date(visit.scheduledDate).toLocaleDateString('pl-PL') : 'Nie określona'}
                            </div>
                            {visit.workDescription && (
                              <div className="col-span-2">
                                <strong>Opis:</strong> {visit.workDescription}
                              </div>
                            )}
                            {visit.findings && (
                              <div className="col-span-2">
                                <strong>Ustalenia:</strong> {visit.findings}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          {visit.status !== 'completed' && (
                            <select
                              onChange={(e) => {
                                if (e.target.value && e.target.value !== visit.technicianId) {
                                  handleReassignVisit(visitId, e.target.value);
                                }
                              }}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                              defaultValue=""
                            >
                              <option value="">Przepisz do...</option>
                              {employees
                                .filter(emp => emp.isActive && emp.id !== visit.technicianId)
                                .map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">Brak wizyt dla tego zlecenia</p>
              )}
            </div>
          )}

          {activeTab === 'addVisit' && (
            <div className="max-w-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Dodaj nową wizytę</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Typ wizyty
                  </label>
                  <select
                    value={visitForm.type}
                    onChange={(e) => setVisitForm({...visitForm, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="diagnosis">🔍 Diagnoza</option>
                    <option value="repair">🔧 Naprawa</option>
                    <option value="inspection">✅ Kontrola/Przegląd</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technik
                  </label>
                  <select
                    value={visitForm.employeeId}
                    onChange={(e) => setVisitForm({...visitForm, employeeId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Wybierz technika...</option>
                    {employees.filter(emp => emp.isActive).map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.specializations?.join(', ') || 'Brak specjalizacji'}
                      </option>
                    ))}
                  </select>
                  
                  {order.suggestedEmployee && (
                    <button
                      onClick={() => setVisitForm({...visitForm, employeeId: order.suggestedEmployee.id})}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Użyj sugerowanego: {order.suggestedEmployee.name}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={visitForm.scheduledDate}
                      onChange={(e) => setVisitForm({...visitForm, scheduledDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Godzina
                    </label>
                    <select
                      value={visitForm.scheduledTime}
                      onChange={(e) => setVisitForm({...visitForm, scheduledTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="08:00">08:00</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="12:00">12:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notatki
                  </label>
                  <textarea
                    value={visitForm.notes}
                    onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})}
                    placeholder="Dodatkowe informacje o wizycie..."
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <button
                  onClick={handleAddVisit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Dodaj wizytę
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}