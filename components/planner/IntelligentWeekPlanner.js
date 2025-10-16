import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
// USUNIÄTO: GeocodingService i DistanceMatrixService importy
// PowĂłd: CORS - uĹĽywamy API endpoints zamiast bezpoĹ›rednich wywoĹ‚aĹ„
import GoogleGeocoder from '../../geocoding/simple/GoogleGeocoder.js';
import { suggestVisitDuration } from '../../utils/repairTimeCalculator';
import { getApiCostMonitor } from '../../utils/apiCostMonitor';
import { logger } from '../../utils/logger';
import { calculateEstimatedDuration, updateOrderEstimatedDuration } from './utils/timeCalculations';
import { 
  AlertTriangle,
  Bot,
  Calendar,
  Car, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock, 
  DollarSign,
  Home,
  MapPin, 
  MessageCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  Truck, 
  Users,
  Save
} from 'lucide-react';

const IntelligentWeekPlanner = () => {
  logger.debug('đźš€đźš€đźš€ IntelligentWeekPlanner COMPONENT RENDERING đźš€đźš€đźš€');
  
  const router = useRouter();
  
  // USUNIÄTO: BezpoĹ›rednie inicjalizacje GeocodingService i DistanceMatrixService
  // PowĂłd: CORS - frontend nie moĹĽe bezpoĹ›rednio wywoĹ‚ywaÄ‡ Google API
  // RozwiÄ…zanie: Wszystkie wywoĹ‚ania przechodzÄ… przez API endpoints (/api/geocoding, /api/distance-matrix)

  // Stan przechowuje plany dla wszystkich serwisantĂłw
  const [weeklyPlans, setWeeklyPlans] = useState({}); // { servicemanId: weeklyPlan }
  const [weeklyPlan, setWeeklyPlan] = useState(null); // Aktualnie wyĹ›wietlany plan
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  
  // đź†• Stan dla modalu ze szczegĂłĹ‚ami zlecenia
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  
  //  Stan dla harmonogramĂłw serwisantĂłw (dostÄ™pnoĹ›Ä‡ godzinowa)
  const [servicemanSchedules, setServicemanSchedules] = useState({});
  const [dragOverInfo, setDragOverInfo] = useState(null); // PodglÄ…d pozycji podczas przeciÄ…gania na timeline
  
  // ďż˝ Stan dla linii aktualnej godziny
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Aktualizuj czas co minutÄ™
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Co 60 sekund
    
    return () => clearInterval(timer);
  }, []);
  
  // ďż˝đź’ľ Pomocnicze funkcje do localStorage
  const loadFromLocalStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(`weekPlanner_${key}`);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const saveToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(`weekPlanner_${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  };

  // âŹ° Stan dla zakresu godzin timeline (z localStorage)
  const [timeRange, setTimeRange] = useState(() => loadFromLocalStorage('timeRange', { start: 6, end: 23 }));
  const [hideUnusedHours, setHideUnusedHours] = useState(() => loadFromLocalStorage('hideUnusedHours', false));
  
  // đźŹ·ď¸Ź Stan dla wyboru nagĹ‚Ăłwka karty zlecenia (z localStorage)
  const [cardHeaderField, setCardHeaderField] = useState(() => loadFromLocalStorage('cardHeaderField', 'clientName'));

  // Zapisuj zmiany do localStorage
  useEffect(() => {
    saveToLocalStorage('timeRange', timeRange);
  }, [timeRange]);

  useEffect(() => {
    saveToLocalStorage('hideUnusedHours', hideUnusedHours);
  }, [hideUnusedHours]);

  useEffect(() => {
    saveToLocalStorage('cardHeaderField', cardHeaderField);
  }, [cardHeaderField]);

  // đź†• Handler dla klikniÄ™cia w zlecenie - otwiera modal ze szczegĂłĹ‚ami
  // đź†• Funkcja pomocnicza do obsĹ‚ugi obu struktur danych (stara i nowa)
  const getWeeklyPlanData = useCallback((plan) => {
    if (!plan) return null;
    
    // Nowa struktura: { monday: {...}, tuesday: {...}, ..., unscheduledOrders: [...] }
    // Stara struktura: { weeklyPlan: { monday: {...}, ... }, unscheduledOrders: [...] }
    
    // SprawdĹş czy to nowa struktura (ma bezpoĹ›rednio dni tygodnia)
    if (plan.monday || plan.tuesday || plan.wednesday) {
      return plan; // Nowa struktura
    }
    
    // SprawdĹş czy to stara struktura (ma zagnieĹĽdĹĽony weeklyPlan)
    if (plan.weeklyPlan) {
      return plan.weeklyPlan; // ZwrĂłÄ‡ zagnieĹĽdĹĽony plan
    }
    
    return null;
  }, []);

  const handleOrderClick = useCallback((order) => {
    logger.success('đź“‹ KlikniÄ™to zlecenie:', order);
    setSelectedOrderModal(order);
    setShowOrderDetailsModal(true);
  }, []);

  // Initialize Google Geocoder
  const geocoder = useRef(null);
  
  useEffect(() => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        geocoder.current = new GoogleGeocoder(apiKey);
        logger.success('đźŚŤ Google Geocoder initialized successfully');
      } else {
        console.error('âťŚ Google Maps API key not found');
      }
    } catch (error) {
      console.error('âťŚ Failed to initialize Google Geocoder:', error);
    }
  }, []);

  const [optimizationPreferences, setOptimizationPreferences] = useState({
    priorityMode: 'balanced', // balanced, revenue, priority, time, vip
    maxDailyOrders: 12, // ZwiÄ™kszone do realistycznej liczby
    preferredStartTime: '08:00',
    startLocation: null, // BÄ™dzie ustawione dynamicznie
    workingHours: {
      start: '06:00', // NajwczeĹ›niejszy moĹĽliwy wyjazd
      end: '22:00', // NajpĂłĹşniejszy moĹĽliwy powrĂłt
      maxWorkingHours: 12 // Maksymalne godziny pracy dziennie
    }
  });

  // Stan dla lokalizacji startu
  const [startLocation, setStartLocation] = useState(null);

  // Dodajmy stan dla zaawansowanych opcji optymalizacji
  const [selectedOptimizationStrategy, setSelectedOptimizationStrategy] = useState('balanced');
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [completedOrders, setCompletedOrders] = useState(new Set());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // ZnajdĹş poniedziaĹ‚ek obecnego tygodnia
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = niedziela, 1 = poniedziaĹ‚ek...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Stan dla systemu serwisantĂłw (z localStorage)
  const [availableServicemen, setAvailableServicemen] = useState([]);
  const [currentServiceman, setCurrentServiceman] = useState(() => loadFromLocalStorage('currentServiceman', null));
  const [showServicemanSelector, setShowServicemanSelector] = useState(false);
  
  // Zapisuj wybranego serwisanta do localStorage
  useEffect(() => {
    if (currentServiceman) {
      saveToLocalStorage('currentServiceman', currentServiceman);
    }
  }, [currentServiceman]);
  
  // đź”Ť Stan dla zoom timeline
  const [timelineZoom, setTimelineZoom] = useState(1); // 1x = normalna, 2x = 2x wiÄ™ksza, 0.5x = zmniejszona
  
  const recalculateTimerRef = useRef({});

  // DostÄ™pne strategie optymalizacji
  const optimizationStrategies = {
    balanced: {
      name: 'âš–ď¸Ź Zbalansowana',
      description: 'Optymalne poĹ‚Ä…czenie priorytetu i przychodu',
      color: 'blue',
      focus: 'Uniwersalna strategia dla wiÄ™kszoĹ›ci przypadkĂłw'
    },
    time: {
      name: 'âŹ° NajkrĂłtszy DzieĹ„',
      description: 'Minimalizacja caĹ‚kowitego czasu pracy',
      color: 'purple',
      focus: 'Maksymalna efektywnoĹ›Ä‡ czasowa'
    },
    revenue: {
      name: 'đź’° Maksymalny PrzychĂłd',
      description: 'Priorytet dla najdroĹĽszych zleceĹ„',
      color: 'yellow',
      focus: 'Optymalizacja zysku dziennego'
    },
    priority: {
      name: 'đźš¨ Pilne Najpierw',
      description: 'ObsĹ‚uga pilnych zleceĹ„ w pierwszej kolejnoĹ›ci',
      color: 'red',
      focus: 'ZarzÄ…dzanie kryzysowe i awarie'
    },
    vip: {
      name: 'đź‘‘ Klienci VIP',
      description: 'Preferencyjne traktowanie waĹĽnych klientĂłw',
      color: 'indigo',
      focus: 'ObsĹ‚uga strategicznych partnerĂłw'
    },
    windows: {
      name: 'đź• Okna Czasowe',
      description: 'Respektowanie preferencji klientĂłw co do godzin',
      color: 'orange',
      focus: 'Dostosowanie do dostÄ™pnoĹ›ci klientĂłw'
    }
  };

  // Funkcja do formatowania dnia z datÄ…
  const formatDayWithDate = (dayKey, weekStart) => {
    const dayNames = {
      monday: 'PoniedziaĹ‚ek',
      tuesday: 'Wtorek', 
      wednesday: 'Ĺšroda',
      thursday: 'Czwartek',
      friday: 'PiÄ…tek',
      saturday: 'Sobota',
      sunday: 'Niedziela'
    };
    
    const dayOffsets = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6
    };
    
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayOffsets[dayKey]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    
    const isToday = dayDate.getTime() === today.getTime();
    const isPast = dayDate.getTime() < today.getTime();
    
    const dateStr = dayDate.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    return {
      name: dayNames[dayKey],
      date: dateStr,
      fullDate: dayDate,
      isToday,
      isPast
    };
  };

  const dayNames = {
    monday: 'PoniedziaĹ‚ek',
    tuesday: 'Wtorek', 
    wednesday: 'Ĺšroda',
    thursday: 'Czwartek',
    friday: 'PiÄ…tek',
    saturday: 'Sobota',
    sunday: 'Niedziela'
  };

  const priorityColors = {
    high: 'bg-red-100 border-red-300 text-red-800',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    low: 'bg-green-100 border-green-300 text-green-800'
  };

  // đź†• FUNKCJA: Ĺadowanie pracownikĂłw z API
  const loadEmployeesFromAPI = useCallback(async () => {
    logger.success('đź‘·đź‘·đź‘· loadEmployeesFromAPI CALLED đź‘·đź‘·đź‘·');
    logger.success('đź‘· Loading employees from /api/employees...');
    
    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.employees && Array.isArray(result.employees)) {
        logger.success(`âś… Loaded ${result.employees.length} employees`);
        
        // đź”Ť DEBUG: Co przyszĹ‚o z API?
        logger.success('đź”Ť SUROWE DANE z API - pierwsi 2 pracownicy:', result.employees.slice(0, 2));
        result.employees.forEach(emp => {
          if (emp.role === 'Serwisant') {
            logger.success(`đź”Ť API Serwisant ${emp.name}:`, {
              id: emp.id,
              hasRepairTimes: !!emp.repairTimes,
              repairTimesKeys: emp.repairTimes ? Object.keys(emp.repairTimes) : 'BRAK'
            });
          }
        });
        
        // Kolory dla pracownikĂłw
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899'];
        
        // PrzeksztaĹ‚Ä‡ pracownikĂłw na format uĹĽywany przez planer
        // đź”§ TYLKO SERWISANCI - filtrujemy logistics/admin
        const servicemen = result.employees
          .filter(emp => emp.isActive && emp.role === 'Serwisant')
          .map((emp, index) => ({
            id: emp.id,
            name: emp.name,
            isActive: index === 0, // Pierwszy aktywny domyĹ›lnie
            color: colors[index % colors.length],
            email: emp.email,
            phone: emp.phone,
            specializations: emp.specializations || [],
            repairTimes: emp.repairTimes || {}, // đź¤– Czasy naprawy dla auto-kalkulacji
            builtInWorkTimes: emp.builtInWorkTimes || {}, // đźŹ—ď¸Ź Czasy montaĹĽu/demontaĹĽu zabudowy
            agdSpecializations: emp.agdSpecializations // đź”§ Specjalizacje AGD
          }));
        
        setAvailableServicemen(servicemen);
        logger.success('đź‘· Available servicemen set:', servicemen.map(s => `${s.name} (${s.id})`));
        
        // đź”Ť DEBUG: SprawdĹş czy repairTimes sÄ… w danych
        servicemen.forEach(s => {
          logger.success(`đź”Ť ${s.name}: repairTimes keys =`, s.repairTimes ? Object.keys(s.repairTimes) : 'BRAK');
          logger.success(`đź”Ť ${s.name} FULL OBJECT (JSON):`, JSON.stringify(s, null, 2));
        });
        
        // Ustaw pierwszego pracownika jako domyĹ›lnego
        if (servicemen.length > 0 && !currentServiceman) {
          setCurrentServiceman(servicemen[0].id);
          logger.success('âś… Default serviceman set:', servicemen[0].name);
        }
        
        return { success: true, servicemen };
      } else {
        console.error('âťŚ Invalid response format');
        return { success: false, error: 'Invalid response format' };
      }
    } catch (error) {
      console.error('âťŚ Error loading employees:', error);
      showNotification('BĹ‚Ä…d Ĺ‚adowania pracownikĂłw', 'error');
      return { success: false, error: error.message };
    }
  }, [currentServiceman]);

  // đź†• NOWA FUNKCJA: Ĺadowanie rzeczywistych danych z bazy (data/)
  const loadRealDataFromAPI = useCallback(async () => {
    logger.success('đź“¦ Loading real data from data/ folder...');
    logger.success('đź”Ť Current serviceman:', currentServiceman);
    
    try {
      const response = await fetch(`/api/intelligent-planner/get-data?servicemanId=${currentServiceman || 'all'}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        logger.success('âś… Loaded real data:', result.data.metadata);
        logger.success(`   đź“¦ Orders: ${result.data.orders.length}`);
        logger.success(`   đź‘· Servicemen: ${result.data.servicemen.length}`);
        logger.success(`   đź“… Existing visits: ${result.data.visits.length}`);
        
        // Loguj przykĹ‚adowe zlecenia
        if (result.data.orders.length > 0) {
          logger.success('   đź“ť PrzykĹ‚adowe zlecenia:');
          result.data.orders.slice(0, 3).forEach(order => {
            logger.success(`      - ${order.id}: ${order.clientName} (status: ${order.status}, scheduledDate: ${order.scheduledDate}, assignedTo: ${order.assignedTo})`);
          });
        }
        
        // Loguj wizyty
        if (result.data.visits.length > 0) {
          logger.success('   đź“… PrzykĹ‚adowe wizyty:');
          result.data.visits.slice(0, 5).forEach(visit => {
            logger.success(`      - ${visit.id || visit.visitId}: Zlecenie ${visit.orderId}, technik ${visit.technicianId || visit.servicemanId}, data ${visit.scheduledDate}, status ${visit.status}`);
          });
        }
        
        // Tutaj moĹĽesz zapisaÄ‡ dane do lokalnego stanu jeĹ›li potrzebujesz
        // Na razie API intelligent-route-optimization sam je pobierze
        
        return {
          success: true,
          orders: result.data.orders,
          servicemen: result.data.servicemen,
          visits: result.data.visits
        };
      } else {
        console.error('âťŚ Failed to load real data:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('âťŚ Error loading real data:', error);
      showNotification('BĹ‚Ä…d Ĺ‚adowania danych z bazy', 'error');
      return { success: false, error: error.message };
    }
  }, [currentServiceman]);

  // đź†• NOWA FUNKCJA: Zapisywanie planu do bazy danych
  const savePlanToDatabase = useCallback(async () => {
    const planData = getWeeklyPlanData(weeklyPlan);
    if (!weeklyPlan || !planData) {
      showNotification('âťŚ Brak planu do zapisania', 'error');
      return;
    }
    
    logger.success('đź’ľ Saving plan to database...');
    setIsLoading(true);
    
    try {
      const currentServicemanData = availableServicemen.find(s => s.id === currentServiceman);
      
      const response = await fetch('/api/intelligent-planner/save-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          servicemanId: currentServiceman,
          servicemanName: currentServicemanData?.name || 'Serwisant',
          weeklyPlan: planData,
          weekStart: currentWeekStart.toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        logger.success('âś… Plan saved successfully:', result.data);
        showNotification(
          `âś… Plan zapisany! Utworzono ${result.data.createdVisitsCount} wizyt dla ${result.data.updatedOrdersCount} zleceĹ„`,
          'success'
        );
        
        // đź”” EMIT EVENT - Powiadom inne komponenty (np. kalendarz technika) o zmianie wizyt
        logger.success('đź”” Emitting visitsChanged event...');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('visitsChanged', {
            detail: {
              source: 'intelligent-planner',
              action: 'plan-saved',
              servicemanId: currentServiceman,
              createdVisitsCount: result.data.createdVisitsCount,
              updatedOrdersCount: result.data.updatedOrdersCount
            }
          }));
        }
        
        // OdĹ›wieĹĽ dane po zapisaniu
        setTimeout(() => {
          loadRealDataFromAPI();
        }, 1000);
        
        return true;
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('âťŚ Error saving plan:', error);
      showNotification(`âťŚ BĹ‚Ä…d zapisywania planu: ${error.message}`, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [weeklyPlan, currentServiceman, availableServicemen, currentWeekStart, loadRealDataFromAPI]);

  // Helper function: Walidacja i normalizacja wspĂłĹ‚rzÄ™dnych
  const validateAndNormalizeCoordinates = useCallback((location) => {
    if (!location) return null;
    
    // JeĹ›li to obiekt z coordinates
    if (location.coordinates) {
      const { lat, lng } = location.coordinates;
      if (typeof lat === 'number' && typeof lng === 'number' && 
          !isNaN(lat) && !isNaN(lng) && 
          lat >= -90 && lat <= 90 && 
          lng >= -180 && lng <= 180) {
        return {
          lat,
          lng,
          address: location.address || `${lat}, ${lng}`
        };
      }
    }
    
    // JeĹ›li to bezpoĹ›rednio wspĂłĹ‚rzÄ™dne
    if (location.lat && location.lng) {
      const { lat, lng } = location;
      if (typeof lat === 'number' && typeof lng === 'number' && 
          !isNaN(lat) && !isNaN(lng) && 
          lat >= -90 && lat <= 90 && 
          lng >= -180 && lng <= 180) {
        return {
          lat,
          lng,
          address: location.address || `${lat}, ${lng}`
        };
      }
    }
    
    return null;
  }, []);

  // Ĺadowanie inteligentnego planu tygodniowego
  const loadIntelligentPlan = useCallback(async () => {
    logger.success('đźš€ loadIntelligentPlan WYWOĹANE');
    
    // Prevent multiple concurrent executions
    if (loadIntelligentPlanMutexRef.current) {
      logger.success('đź”’ loadIntelligentPlan already in progress, skipping...');
      return;
    }
    
    loadIntelligentPlanMutexRef.current = true;
    logger.success('đź”’ Acquired mutex for loadIntelligentPlan');
    
    setIsLoading(true);
    try {
      // đź†• KROK 1: Najpierw zaĹ‚aduj rzeczywiste dane z bazy
      logger.success('đź“Š STEP 1: Loading real data from database...');
      const realData = await loadRealDataFromAPI();
      
      // đź“… KROK 1.5: ZaĹ‚aduj harmonogramy serwisantĂłw (dostÄ™pnoĹ›Ä‡ godzinowa)
      if (currentServiceman) {
        try {
          // đź“… ZaĹ‚aduj harmonogramy dla wszystkich 7 dni tygodnia
          const allSchedulesMap = {};
          const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          
          for (let i = 0; i < 7; i++) {
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + i);
            // đź”§ FIX: UĹĽyj lokalnej daty zamiast UTC
            const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
            
            const scheduleResponse = await fetch(`/api/employee-calendar?action=get-all-schedules&date=${dateStr}`);
            const scheduleData = await scheduleResponse.json();
            
            if (scheduleData.success && scheduleData.schedules) {
              // Dla kaĹĽdego pracownika, dodaj jego schedule tego dnia
              Object.keys(scheduleData.schedules).forEach(employeeId => {
                if (!allSchedulesMap[employeeId]) {
                  allSchedulesMap[employeeId] = {
                    workSlots: [],
                    breaks: []
                  };
                }
                
                const schedule = scheduleData.schedules[employeeId];
                const dayOfWeek = dayDate.getDay() || 7; // 0=Ndâ†’7, 1=Pon, ..., 6=Sob
                
                // Konwertuj timeSlots na workSlots (zakresy czasowe)
                if (schedule.timeSlots && schedule.timeSlots.length > 0) {
                  let currentSlot = null;
                  
                  schedule.timeSlots.forEach((slot) => {
                    if (slot.status === 'available' || slot.status === 'busy') {
                      if (!currentSlot) {
                        currentSlot = { startTime: slot.time, endTime: slot.time, dayOfWeek, type: 'work' };
                      }
                      currentSlot.endTime = slot.time;
                    } else if (slot.status === 'break') {
                      if (currentSlot) {
                        allSchedulesMap[employeeId].workSlots.push({...currentSlot});
                        currentSlot = null;
                      }
                    }
                  });
                  
                  if (currentSlot) {
                    allSchedulesMap[employeeId].workSlots.push({...currentSlot});
                  }
                }
              });
            }
          }
          
          setServicemanSchedules(allSchedulesMap);
          logger.success('đź“… ZaĹ‚adowano harmonogramy dla caĹ‚ego tygodnia:', Object.keys(allSchedulesMap).length, 'serwisantĂłw');
          if (allSchedulesMap[currentServiceman]) {
            logger.success(`  âś… ${currentServiceman}: ${allSchedulesMap[currentServiceman].workSlots.length} workSlots`);
          }
        } catch (error) {
          console.warn('âš ď¸Ź Nie udaĹ‚o siÄ™ zaĹ‚adowaÄ‡ harmonogramĂłw:', error);
        }
      }
      
      if (!realData.success) {
        showNotification('âš ď¸Ź Nie udaĹ‚o siÄ™ zaĹ‚adowaÄ‡ danych. UĹĽywam danych testowych.', 'warning');
        // Kontynuuj mimo to - API ma swoje fallbacki
      } else {
        logger.success('âś… Real data loaded successfully');
        showNotification(`đź“¦ ZaĹ‚adowano ${realData.orders.length} zleceĹ„ z bazy danych`, 'success');
      }
      const preferences = { ...optimizationPreferences };
      
      // đź†• UPROSZCZONE ĹADOWANIE: Pomijamy API optymalizacji (wymaga przypisanych zleceĹ„)
      // Zamiast tego uĹĽywamy juĹĽ zaĹ‚adowanych danych z realData
      logger.success('đź“¦ Pomijam API optymalizacji - uĹĽywam juĹĽ zaĹ‚adowanych danych');
      
      // SprawdĹş czy realData ma orders
      if (!realData || !realData.orders) {
        console.error('âťŚ realData.orders jest undefined!', realData);
        showNotification('âš ď¸Ź Nie udaĹ‚o siÄ™ zaĹ‚adowaÄ‡ zleceĹ„', 'error');
        setWeeklyPlan({
          monday: { orders: [], stats: {} },
          tuesday: { orders: [], stats: {} },
          wednesday: { orders: [], stats: {} },
          thursday: { orders: [], stats: {} },
          friday: { orders: [], stats: {} },
          saturday: { orders: [], stats: {} },
          sunday: { orders: [], stats: {} },
          unscheduledOrders: [],
          recommendations: [],
          costAnalysis: {}
        });
        return;
      }
      
      // âś… NOWA LOGIKA: Wszystkie zlecenia trafiajÄ… do "niezaplanowanych"
      // scheduledDate w bazie NIE MA ZNACZENIA - administrator przypisuje rÄ™cznie w plannerze
      logger.success('đź”Ť ĹadujÄ™ zlecenia do plannera...');
      logger.success(`   Wszystkich zleceĹ„ z API: ${realData.orders.length}`);
      
      // âś… POPRAWKA: Pokazuj wszystkie zlecenia OPRĂ“CZ zakoĹ„czonych/anulowanych
      // DziÄ™ki temu zmiana statusu nie spowoduje znikniÄ™cia zlecenia z widoku
      let unscheduledOrders = realData.orders.filter(order => {
        // Wyklucz tylko zlecenia zakoĹ„czone, anulowane i te ktĂłre nie stawili siÄ™
        const isExcludedStatus = order.status === 'completed' || 
                                 order.status === 'cancelled' || 
                                 order.status === 'no-show';
        
        // SprawdĹş czy zlecenie ma podstawowe dane (eliminuj uszkodzone rekordy)
        const hasValidData = order.clientName && (order.address || order.city);
        
        if (!hasValidData) {
          console.warn(`âš ď¸Ź Pomijam zlecenie ${order.id} - brak danych (clientName: ${order.clientName}, address: ${order.address})`);
        }
        
        // PokaĹĽ zlecenie jeĹ›li NIE jest wykluczone i MA dane
        return !isExcludedStatus && hasValidData;
      });
      
      // đź†• AUTOMATYCZNE OBLICZANIE CZASU dla zleceĹ„ z przypisanym pracownikiem
      unscheduledOrders = unscheduledOrders.map(order => {
        if (order.assignedTo && (!order.estimatedDuration || order.estimatedDuration === 60)) {
          // đź”’ UĹĽywamy TYLKO serwisantĂłw (z filtrowanej listy), nie logistykĂłw
          const employee = servicemen.find(emp => emp.id === order.assignedTo);
          if (employee && employee.repairTimes) {
            const calculatedTime = calculateEstimatedDuration(order, employee);
            logger.success(`âŹ±ď¸Ź Auto-obliczam czas dla ${order.clientName}: ${calculatedTime}min (${order.deviceType})`);
            return { ...order, estimatedDuration: calculatedTime };
          } else if (!employee && order.assignedTo) {
            // đź”§ Zlecenie przypisane do pracownika logistyki lub nieaktywnego - resetuj przypisanie
            logger.success(`đź”§ ResetujÄ™ przypisanie zlecenia ${order.clientName} (byĹ‚ przypisany do nieaktywnego/logistyka: ${order.assignedTo})`);
            return { ...order, assignedTo: null };
          }
        }
        return order;
      });
      
      // Nie uĹĽywamy juĹĽ scheduledOrders z bazy - wszystko idzie do unscheduled
      const scheduledOrders = [];
      
      logger.success(`đź“Š Zlecenia do zaplanowania: ${unscheduledOrders.length}`);
      logger.success(`đź“Š PominiÄ™to zleceĹ„: ${realData.orders.length - unscheduledOrders.length}`);
      
      // Loguj wszystkie statusy zleceĹ„
      const statusCounts = {};
      realData.orders.forEach(order => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      logger.success(`đź“Š Statusy zleceĹ„ (wszystkie):`, statusCounts);
      logger.success(`   âś… Zaakceptowane statusy: pending, unscheduled, new, contacted, scheduled, confirmed, in-progress, waiting-parts, ready`);
      logger.success(`   âťŚ Wykluczone statusy: completed, cancelled, no-show`);
      
      // Loguj pominiÄ™te zlecenia z powodu statusu
      const excludedOrders = realData.orders.filter(o => 
        o.status === 'completed' || o.status === 'cancelled' || o.status === 'no-show'
      );
      if (excludedOrders.length > 0) {
        logger.success(`đźš« PominiÄ™to ${excludedOrders.length} zleceĹ„ (completed/cancelled/no-show):`, 
          excludedOrders.map(o => ({ id: o.id, status: o.status, client: o.clientName }))
        );
      }
      
      // Loguj zlecenia z brakujÄ…cymi danymi
      const ordersWithMissingData = realData.orders.filter(o => 
        !o.clientName || (!o.address && !o.city)
      );
      if (ordersWithMissingData.length > 0) {
        console.warn(`âš ď¸Ź Znaleziono ${ordersWithMissingData.length} zleceĹ„ z brakujÄ…cymi danymi:`, 
          ordersWithMissingData.map(o => ({ 
            id: o.id, 
            status: o.status,
            hasClient: !!o.clientName, 
            hasAddress: !!(o.address || o.city),
            data: o
          }))
        );
      }
      
      // PokaĹĽ przykĹ‚adowe zlecenie
      if (unscheduledOrders.length > 0) {
        logger.success(`  đź“ť PrzykĹ‚ad zlecenia do zaplanowania:`, {
          id: unscheduledOrders[0].id,
          client: unscheduledOrders[0].clientName,
          address: unscheduledOrders[0].address,
          status: unscheduledOrders[0].status,
          hasCoordinates: !!unscheduledOrders[0].coordinates
        });
      }
      
      // âś… ROZDZIEL ZLECENIA: Zaplanowane trafiajÄ… do dni, reszta do unscheduled
      const weekPlan = {
        monday: { orders: [], stats: {} },
        tuesday: { orders: [], stats: {} },
        wednesday: { orders: [], stats: {} },
        thursday: { orders: [], stats: {} },
        friday: { orders: [], stats: {} },
        saturday: { orders: [], stats: {} },
        sunday: { orders: [], stats: {} },
        unscheduledOrders: [],
        recommendations: [],
        costAnalysis: {}
      };
      
      // Mapowanie dat na dni tygodnia wzglÄ™dem currentWeekStart
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      logger.success(`đź“… currentWeekStart: ${currentWeekStart.toISOString().split('T')[0]}`);
      logger.success(`đź“… Dzisiaj: ${new Date().toISOString().split('T')[0]}`);
      
      unscheduledOrders.forEach(order => {
        // đź“… JeĹ›li zlecenie ma assignedTo + scheduledDate â†’ przypisz do dnia
        // âś… POPRAWKA: UsuniÄ™to warunek order.status === 'scheduled', bo:
        //    - Zlecenie moĹĽe mieÄ‡ status 'unscheduled' (jako zamĂłwienie)
        //    - ALE mieÄ‡ wizytÄ™ z scheduledDate (zaplanowanÄ…)
        //    - Sprawdzamy tylko czy MA datÄ™ i przypisanie, nie patrzymy na status
        if (order.assignedTo && order.scheduledDate) {
          const orderDate = new Date(order.scheduledDate + 'T00:00:00'); // Force local timezone
          const weekStart = new Date(currentWeekStart);
          weekStart.setHours(0, 0, 0, 0);
          
          // SprawdĹş czy data naleĹĽy do obecnego tygodnia
          const daysDiff = Math.floor((orderDate - weekStart) / (1000 * 60 * 60 * 24));
          
          logger.success(`đź”Ť Zlecenie ${order.clientName}: data=${order.scheduledDate}, daysDiff=${daysDiff}, dayOfWeek=${orderDate.getDay()}, status=${order.status}`);
          
          if (daysDiff >= 0 && daysDiff < 7) {
            const dayName = dayNames[orderDate.getDay()];
            weekPlan[dayName].orders.push(order);
            logger.success(`  âś… Przypisano do ${dayName} (status: ${order.status})`);
          } else {
            // Data poza obecnym tygodniem - do unscheduled
            weekPlan.unscheduledOrders.push(order);
            logger.success(`  âš ď¸Ź Poza tygodniem (oczekiwano 0-6, otrzymano ${daysDiff})`);
          }
        } else {
          // Brak przypisania lub scheduledDate â†’ do unscheduled
          weekPlan.unscheduledOrders.push(order);
          if (!order.assignedTo) {
            logger.success(`  â„ąď¸Ź ${order.clientName}: Brak assignedTo`);
          } else if (!order.scheduledDate) {
            logger.success(`  â„ąď¸Ź ${order.clientName}: Brak scheduledDate`);
          }
        }
      });
      
      logger.success(`đź“Š Rozdzielono zlecenia:`);
      logger.success(`   - Nieprzypisane: ${weekPlan.unscheduledOrders.length}`);
      Object.keys(dayNames).forEach(day => {
        const dayKey = dayNames[day];
        if (weekPlan[dayKey] && weekPlan[dayKey].orders.length > 0) {
          logger.success(`   - ${dayKey}: ${weekPlan[dayKey].orders.length} zleceĹ„`);
        }
      });
      
      setWeeklyPlan(weekPlan);
      
      showNotification(`âś… ZaĹ‚adowano ${realData.orders.length} zleceĹ„`, 'success');
    } catch (error) {
      console.error('Network error:', error);
      showNotification(`BĹ‚Ä…d sieci: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      // Release mutex lock
      loadIntelligentPlanMutexRef.current = false;
      logger.success('đź”“ Released mutex for loadIntelligentPlan');
    }
  }, [startLocation, optimizationPreferences, currentServiceman]); // âś… Dodano currentServiceman!

  // Ĺadowanie pracownikĂłw przy montowaniu komponentu
  useEffect(() => {
    logger.success('đź”Ąđź”Ąđź”Ą useEffect EMPLOYEES FIRED đź”Ąđź”Ąđź”Ą');
    
    // WywoĹ‚aj funkcjÄ™ bezpoĹ›rednio
    const loadEmployees = async () => {
      logger.success('đź‘·đź‘·đź‘· Loading employees INLINE đź‘·đź‘·đź‘·');
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        logger.success('âś…âś…âś… GOT EMPLOYEES:', result.employees?.length);
        
        if (result.employees && Array.isArray(result.employees)) {
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899'];
          
          // đź”§ TYLKO SERWISANCI - filtrujemy logistics/admin
          const servicemen = result.employees
            .filter(emp => emp.isActive && emp.role === 'Serwisant')
            .map((emp, index) => ({
              id: emp.id,
              name: emp.name,
              isActive: index === 0,
              color: colors[index % colors.length],
              email: emp.email,
              phone: emp.phone,
              specializations: emp.specializations || [],
              repairTimes: emp.repairTimes || {}, // đź¤– Czasy naprawy dla auto-kalkulacji
              builtInWorkTimes: emp.builtInWorkTimes || {}, // đźŹ—ď¸Ź Czasy montaĹĽu/demontaĹĽu zabudowy
              agdSpecializations: emp.agdSpecializations, // đź”§ Specjalizacje AGD
              address: emp.address || null,
              city: emp.city || null
            }));
          
          logger.success('đź‘· Setting availableServicemen:', servicemen.length);
          logger.success('đź”Ť Servicemen with repairTimes:', servicemen.map(s => `${s.name}: ${s.repairTimes ? Object.keys(s.repairTimes).length : 0} devices`));
          setAvailableServicemen(servicemen);
          
          if (servicemen.length > 0 && !currentServiceman) {
            logger.success('âś… Setting default serviceman:', servicemen[0].name);
            setCurrentServiceman(servicemen[0].id);
          }
        }
      } catch (error) {
        console.error('âťŚâťŚâťŚ Error loading employees:', error);
      }
    };
    
    loadEmployees();
  }, []); // Tylko raz przy montowaniu

  // Ustaw lokalizacjÄ™ startu na podstawie wybranego pracownika
  useEffect(() => {
    if (!currentServiceman || !availableServicemen.length) return;

    const serviceman = availableServicemen.find(s => s.id === currentServiceman);
    if (!serviceman) return;

    // Ustaw domyĹ›lnÄ… lokalizacjÄ™ startu - KrakĂłw centrum jako fallback
    if (!startLocation) {
      setStartLocation({
        address: serviceman.address || serviceman.city || 'KrakĂłw, Polska',
        coordinates: {
          lat: 50.0647,
          lng: 19.9450
        }
      });
      logger.success('đźŹ  Ustawiono domyĹ›lnÄ… lokalizacjÄ™ startu:', serviceman.address || 'KrakĂłw, Polska');
    }
  }, [currentServiceman, availableServicemen, startLocation]);

  // Ĺadowanie danych przy pierwszym renderowaniu - tylko raz!
  useEffect(() => {
    // Tylko przy pierwszym mount
    if (!isInitialMountRef.current) return;
    
    // Poczekaj aĹĽ lokalizacja bÄ™dzie gotowa, lub uĹĽyj domyĹ›lnej po 2 sekundach
    initialLoadTimerRef.current = setTimeout(() => {
      if (isInitialMountRef.current) {
        logger.success('âŹ° Inicjalne Ĺ‚adowanie planu - startLocation:', startLocation);
        loadIntelligentPlan();
        isInitialMountRef.current = false;
      }
    }, 2000);
    
    // JeĹ›li startLocation siÄ™ juĹĽ pojawi wczeĹ›niej, zaĹ‚aduj od razu
    if (startLocation?.coordinates && isInitialMountRef.current) {
      clearTimeout(initialLoadTimerRef.current);
      logger.success('đźŽŻ RychĹ‚e Ĺ‚adowanie - startLocation dostÄ™pne:', startLocation.coordinates);
      loadIntelligentPlan();
      isInitialMountRef.current = false;
    }
    
    return () => {
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current);
      }
      isInitialMountRef.current = false;
    };
  }, []); // TYLKO przy mount, bez dependencies na functions

  // PrzeĹ‚Ä…czanie planĂłw gdy zmieni siÄ™ serwisant - TYLKO na zmianÄ™ serwisanta!
  useEffect(() => {
    // SprawdĹş czy rzeczywiĹ›cie zmieniĹ‚ siÄ™ serwisant
    if (prevServicemanRef.current === currentServiceman) {
      return;
    }
    
    // Zapisz aktualny plan przed przeĹ‚Ä…czeniem
    if (weeklyPlan && prevServicemanRef.current) {
      setWeeklyPlans(prev => ({
        ...prev,
        [prevServicemanRef.current]: weeklyPlan
      }));
    }

    // ZaĹ‚aduj plan dla nowego serwisanta
    // âš ď¸Ź POPRAWKA: Nie uĹĽywaj weeklyPlans w dependencies! To powoduje nieskoĹ„czonÄ… pÄ™tlÄ™
    // Zamiast tego uĹĽyj functional update w callback
    setWeeklyPlans(prevPlans => {
      if (prevPlans[currentServiceman]) {
        setWeeklyPlan(prevPlans[currentServiceman]);
      } else {
        // JeĹ›li nie ma planu dla tego serwisanta, zaĹ‚aduj nowy
        const loadTimer = setTimeout(() => {
          loadIntelligentPlan();
        }, 100);
      }
      return prevPlans;
    });
    
    // Zaktualizuj poprzedni serwisant
    prevServicemanRef.current = currentServiceman;
  }, [currentServiceman]); // âś… TYLKO currentServiceman - bez weeklyPlans!

  // PrzeĹ‚aduj plan gdy zmieni siÄ™ lokalizacja startu - ZAWSZE reaguj na zmiany
  useEffect(() => {
    // SprawdĹş czy rzeczywiĹ›cie zmieniĹ‚ siÄ™ updatedAt
    if (!startLocation?.updatedAt || !startLocation?.coordinates) return;
    if (prevUpdatedAtRef.current === startLocation.updatedAt) return;
    
    logger.success('đź—şď¸Ź PrzeĹ‚adowujÄ™ plan z nowÄ… lokalizacjÄ… startu:', startLocation.address);
    logger.success('đź“Ť Nowa lokalizacja wspĂłĹ‚rzÄ™dne:', startLocation.coordinates);
    
    // WyczyĹ›Ä‡ poprzedni debounce timer
    if (planReloadDebounceRef.current) {
      clearTimeout(planReloadDebounceRef.current);
    }
    
    // Debounce ĹĽeby uniknÄ…Ä‡ wielokrotnych wywoĹ‚aĹ„
    planReloadDebounceRef.current = setTimeout(() => {
      logger.success('đź”„ WykonujÄ™ przeĹ‚adowanie planu po zmianie lokalizacji');
      loadIntelligentPlan();
      prevUpdatedAtRef.current = startLocation.updatedAt;
    }, 1000); // ZwiÄ™kszono do 1 sekundy dla stabilnoĹ›ci
    
    return () => {
      if (planReloadDebounceRef.current) {
        clearTimeout(planReloadDebounceRef.current);
      }
    };
  }, [startLocation?.updatedAt]); // Reaguj na updatedAt ale z zabezpieczeniami

  // Comprehensive cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear all notification timeouts
      if (notificationTimeouts.current) {
        notificationTimeouts.current.forEach((timeoutId) => {
          clearTimeout(timeoutId);
        });
        notificationTimeouts.current.clear();
      }
      
      // Clear all calculation debounce timers
      if (calculationDebounceRef.current) {
        calculationDebounceRef.current.forEach((timerId) => clearTimeout(timerId));
        calculationDebounceRef.current.clear();
      }
      
      // Clear location change debounce
      if (locationChangeDebounceRef.current) {
        clearTimeout(locationChangeDebounceRef.current);
      }
      
      // Clear plan reload debounce
      if (planReloadDebounceRef.current) {
        clearTimeout(planReloadDebounceRef.current);
      }
      
      // Clear initial load timer
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current);
      }
      
      // Reset mutex
      if (loadIntelligentPlanMutexRef.current) {
        loadIntelligentPlanMutexRef.current = false;
      }
      
      logger.success('đź§ą Component cleanup completed - all timers cleared');
    };
  }, []);

  // Funkcja pomocnicza do pobierania tekstu nagĹ‚Ăłwka karty
  const getCardHeaderText = (order) => {
    switch (cardHeaderField) {
      case 'clientName':
        return order.clientName || 'Nieznany klient';
      case 'address':
        return order.address || 'Brak adresu';
      case 'deviceType':
        return order.deviceType || order.device?.type || 'Brak urzÄ…dzenia';
      case 'description':
        return order.description || 'Brak opisu';
      default:
        return order.clientName || 'Nieznany klient';
    }
  };

  // Renderowanie karty zlecenia z obsĹ‚ugÄ… drag & drop
  const renderOrderCard = (order, currentDay, orderIndex) => {
    // Przygotuj numery do wyĹ›wietlenia
    const orderNumber = order.orderNumber || order.visitId || `ORD-${order.id}`;
    const clientId = order.clientId || order.customerId || 'BRAK';
    const visitNumbers = order.visits && order.visits.length > 0 
      ? order.visits.map(v => v.visitId || v.id).join(', ')
      : 'Brak wizyt';
    
    logger.success('đź“‹ Rendering order card:', { 
      orderNumber, 
      clientId, 
      visitCount: order.visits?.length || 0,
      orderData: order 
    });
    
    const isCompleted = completedOrders.has(order.id);
    
    return (
      <div 
        key={`${currentDay}-${order.id}-${orderIndex}`} 
        className={`p-3 rounded-lg border-2 mb-2 transition-all hover:shadow-md relative ${
          isCompleted 
            ? 'bg-green-50 border-green-300 opacity-75' 
            : priorityColors[order.priority]
        } ${isDragging && draggedOrder?.order.id === order.id ? 'opacity-50 scale-95' : ''}`}
        draggable={!isCompleted}
        onDragStart={(e) => handleDragStart(e, order, currentDay)}
        onDragEnd={handleDragEnd}
        title="PrzeciÄ…gnij aby przenieĹ›Ä‡ zlecenie do innego dnia"
        style={isCompleted ? { cursor: 'default' } : { cursor: 'move' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* NagĹ‚Ăłwek z nazwÄ… klienta i statusem */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 
                className={`font-semibold text-sm truncate max-w-[200px] ${isCompleted ? 'line-through text-gray-500' : ''}`}
                title={getCardHeaderText(order)}
              >
                {getCardHeaderText(order)}
              </h4>
              <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">đź“‹ PrzeciÄ…gnij</span>
              {isCompleted && <span className="text-xs text-green-600 whitespace-nowrap">âś… Wykonane</span>}
            </div>
            
            {/* Numery: Zlecenie, Klient, Wizyty */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded" title="Numer zlecenia">
                đź”˘ {orderNumber}
              </span>
              <span className="text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded" title="ID klienta">
                ďż˝ {clientId}
              </span>
              {order.visits && order.visits.length > 0 && (
                <span className="text-green-700 font-mono bg-green-50 px-2 py-0.5 rounded" title={`Wizyty: ${visitNumbers}`}>
                  đź“… {order.visits.length} wiz.
                </span>
              )}
            </div>
          <p className="text-xs opacity-75 mb-1 truncate" title={order.description}>{order.description}</p>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1 truncate max-w-[150px]" title={order.address}>
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{order.address.split(',')[0]}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {order.estimatedDuration || 60}min
              {order.assignedTo && order.estimatedDuration && (
                <span 
                  className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium" 
                  title="Czas automatycznie obliczony na podstawie typu urzÄ…dzenia i pracownika"
                >
                  đź¤– Auto
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {order.serviceCost}zĹ‚
            </span>
          </div>
          {/* Rzeczywisty czas dojazdu */}
          <div className="mt-1">
            <TravelTimeInfo 
              order={order}
              previousLocation={orderIndex === 0 ? null : weeklyPlan?.weeklyPlan?.[currentDay]?.orders?.[orderIndex-1]?.coordinates}
              className="text-blue-600"
            />
          </div>
        </div>
        <div className="flex items-start gap-2">
          {/* Przycisk do oznaczania jako wykonane */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOrderCompletion(order.id);
            }}
            className={`px-2 py-1 rounded-full text-xs font-bold transition-colors ${
              isCompleted 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-200 text-gray-600 hover:bg-green-500 hover:text-white'
            }`}
            title={isCompleted ? "Oznacz jako niewykonane" : "Oznacz jako wykonane"}
          >
            {isCompleted ? 'âś“' : 'â—‹'}
          </button>
          
          {/* Przycisk do przeniesienia z powrotem do nieprzypisanych */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveOrderToUnscheduled(order, currentDay);
            }}
            className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors"
            title="PrzenieĹ› z powrotem do nieprzypisanych"
          >
            â†©ď¸Ź
          </button>
          
          {/* Przycisk do zmiany technika */}
          {(() => {
            logger.success('đź”Ť DEBUG Dropdown:', { 
              availableServicemen: availableServicemen.length, 
              currentServiceman,
              shouldShow: availableServicemen.length > 1 
            });
            return availableServicemen.length > 1;
          })() && (
            <select
              onClick={(e) => e.stopPropagation()}
              onChange={async (e) => {
                e.stopPropagation();
                const newTechnicianId = e.target.value;
                if (newTechnicianId && newTechnicianId !== currentServiceman) {
                  // Oblicz datÄ™ z currentDay (format: "2025-01-13")
                  const scheduledDate = order.scheduledDate || currentDay;
                  
                  logger.success(`đź”„ Zmiana technika: ${currentServiceman} â†’ ${newTechnicianId}`, {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    scheduledDate: scheduledDate,
                    currentDay: currentDay
                  });
                  
                  try {
                    // đź†• Oblicz nowy estimatedDuration na podstawie pracownika
                    const newEmployee = availableServicemen.find(emp => emp.id === newTechnicianId);
                    let newEstimatedDuration = order.estimatedDuration || 60;
                    
                    if (newEmployee) {
                      newEstimatedDuration = calculateEstimatedDuration(order, newEmployee);
                      logger.success(`âŹ±ď¸Ź Obliczony nowy czas: ${newEstimatedDuration} min (poprzednio: ${order.estimatedDuration} min)`);
                    }
                    
                    const response = await fetch(`/api/orders/${order.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        assignedTo: newTechnicianId,
                        scheduledDate: scheduledDate, // Zachowaj datÄ™ planowania!
                        estimatedDuration: newEstimatedDuration // đź†• Zaktualizowany czas
                      })
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      logger.success('âś… Zmiana technika zapisana:', result);
                      showNotification(`âś… Zlecenie przypisane do innego technika (czas: ${newEstimatedDuration}min)`, 'success');
                      
                      // PrzeĹ‚aduj dane po zapisie
                      setTimeout(() => {
                        loadIntelligentPlan();
                      }, 500);
                    } else {
                      const error = await response.json();
                      console.error('âťŚ BĹ‚Ä…d odpowiedzi API:', error);
                      showNotification(`âťŚ BĹ‚Ä…d zmiany technika: ${error.message}`, 'error');
                    }
                  } catch (error) {
                    console.error('âťŚ BĹ‚Ä…d zmiany technika:', error);
                    showNotification(`âťŚ BĹ‚Ä…d zmiany technika`, 'error');
                  }
                }
              }}
              className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
              title="ZmieĹ„ technika"
              value={currentServiceman}
            >
              <option value="">đź‘¤ ZmieĹ„...</option>
              {availableServicemen.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          )}
          
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            order.priority === 'high' ? 'bg-red-200 text-red-800' :
            order.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
            'bg-green-200 text-green-800'
          }`}>
            {order.priority === 'high' ? 'Pilne' : 
             order.priority === 'medium' ? 'Ĺšrednie' : 'Niskie'}
          </span>
        </div>
      </div>
      
      {/* DostÄ™pnoĹ›Ä‡ klienta */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <strong>DostÄ™pny:</strong>
          {order.preferredTimeSlots?.map((slot, idx) => (
            <span key={idx} className="ml-1">
              {slot.day === 'monday' ? 'Pon' :
               slot.day === 'tuesday' ? 'Wt' :
               slot.day === 'wednesday' ? 'Ĺšr' :
               slot.day === 'thursday' ? 'Czw' :
               slot.day === 'friday' ? 'Pt' :
               slot.day === 'saturday' ? 'Sob' :
               slot.day === 'sunday' ? 'Nd' : slot.day} 
              ({slot.start}-{slot.end})
              {idx < order.preferredTimeSlots.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
        {order.unavailableDates?.length > 0 && (
          <div className="text-xs text-red-600 mt-1">
            <strong>NiedostÄ™pny:</strong> {order.unavailableDates.join(', ')}
          </div>
        )}
        {order.assignedTimeSlot && (
          <div className="text-xs text-blue-600 mt-1 font-medium">
            <strong>Przydzielone:</strong> {order.assignedTimeSlot.start}-{order.assignedTimeSlot.end}
            {order.assignedTimeSlot.autoAssigned && (
              <span className="ml-1 text-blue-500">âšˇ (auto)</span>
            )}
          </div>
        )}
      </div>
    </div>
    );
  };

  // đź†• Pobierz zlecenia dla konkretnego dnia w aktualnym tygodniu
  const getOrdersForWeekDay = (day) => {
    // âś… POPRAWIONA LOGIKA: Filtruj zlecenia po KONKRETNEJ DACIE, nie po dniu tygodnia!
    // Oblicz datÄ™ dla tego dnia w bieĹĽÄ…cym tygodniu
    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day);
    if (dayIndex === -1) {
      console.warn(`âš ď¸Ź NieprawidĹ‚owy dzieĹ„: ${day}`);
      return [];
    }
    
    // Oblicz konkretnÄ… datÄ™ (np. Ĺ›roda 9 paĹşdziernika 2025)
    const targetDate = new Date(currentWeekStart);
    targetDate.setDate(currentWeekStart.getDate() + dayIndex);
    // đź”§ FIX: UĹĽyj lokalnej daty zamiast UTC
    const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`; // YYYY-MM-DD
    
    logger.success(`đź“… getOrdersForWeekDay(${day}) - szukam zleceĹ„ dla daty: ${targetDateStr}`);
    
    // Pobierz wszystkie zlecenia z weeklyPlan[day].orders
    const allDayOrders = (weeklyPlan[day] && weeklyPlan[day].orders) || [];
    
    // Filtruj tylko te, ktĂłre majÄ… scheduledDate pasujÄ…cÄ… do targetDateStr
    const filteredOrders = allDayOrders.filter(order => {
      const orderDate = order.scheduledDate;
      if (!orderDate) return false;
      
      // PorĂłwnaj daty (bez czasu)
      const orderDateStr = orderDate.split('T')[0];
      const matches = orderDateStr === targetDateStr;
      
      if (!matches) {
        logger.success(`  âŹ­ď¸Ź Pomijam zlecenie ${order.id} - ma datÄ™ ${orderDateStr}, a szukam ${targetDateStr}`);
      }
      
      return matches;
    });
    
    logger.success(`  âś… Zwracam ${filteredOrders.length} zleceĹ„ dla ${day} (${targetDateStr})`);
    
    return filteredOrders;
  };

  // đź“… Pobierz harmonogram serwisanta dla danego dnia
  const getServicemanScheduleForDay = useCallback((day, servicemanId) => {
    if (!servicemanId) {
      return null;
    }
    
    if (!servicemanSchedules[servicemanId]) {
      return null;
    }
    
    // dayOfWeek: 1=Pon, 2=Wt, ..., 7=Nd
    const dayOfWeekMap = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };
    
    const dayOfWeek = dayOfWeekMap[day];
    const schedule = servicemanSchedules[servicemanId];
    
    // ZnajdĹş workSlots dla tego dnia
    const workSlots = (schedule.workSlots || []).filter(slot => slot.dayOfWeek === dayOfWeek);
    const breaks = (schedule.breaks || []).filter(br => br.dayOfWeek === dayOfWeek);
    
    logger.success(`  âś… Zwracam: ${workSlots.length} workSlots, ${breaks.length} breaks`);
    
    return { workSlots, breaks };
  }, [servicemanSchedules]);

  // Renderowanie harmonogramu dnia z rekomendacjami czasu
  const renderDaySchedule = (day, dayPlan) => {
    // đź†• Zamiast uĹĽywaÄ‡ dayPlan.orders, pobierz rzeczywiste zlecenia z bazy filtrowane po dacie
    const orders = getOrdersForWeekDay(day);
    
    if (!orders || orders.length === 0) return null;
    
    // UsuniÄ™to kod rzeczywistych harmonogramĂłw (Distance Matrix API)
    const realSchedule = null;
    
    // JeĹ›li mamy rzeczywisty harmonogram, uĹĽyj go
    if (realSchedule && realSchedule.schedule) {
      const schedule = realSchedule.schedule;
      const departure = schedule.find(s => s.type === 'departure');
      const visits = schedule.filter(s => s.type === 'visit');
      const arrivalHome = schedule.find(s => s.type === 'arrival_home');
      
      return (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-800">
            <Clock className="h-4 w-4" />
            Harmonogram z Rzeczywistymi Czasami
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              đźŚ Real-time
            </span>
          </h4>
          
          {/* Czas wyjazdu */}
          <div className="mb-3 p-2 bg-green-100 rounded border border-green-300">
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-800">đźš— Wyjazd z domu:</span>
              <span className="font-bold text-green-800">
                {departure.time.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
              </span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              đź“Ť {startLocation.address}
            </div>
          </div>
          
          {/* Harmonogram wizyt */}
          <div className="space-y-2">
            {visits.map((visit, idx) => {
              const visitTypeLabels = {
                diagnosis: 'đź”Ť Diagnoza',
                repair: 'đź”§ Naprawa',
                control: 'âś… Kontrola',
                installation: 'đź“¦ MontaĹĽ'
              };
              const visitTypeLabel = visitTypeLabels[visit.order.visitType] || 'đź“‹ Wizyta';
              
              return (
                <div 
                  key={visit.order.visitId || `order-${visit.order.id}-${idx}`} 
                  onClick={() => handleOrderClick(visit.order)}
                  className="p-2 bg-white rounded border border-gray-200 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm hover:text-blue-600">
                        {visit.order.clientName}
                      </span>
                      {/* Typ wizyty */}
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {visitTypeLabel}
                      </span>
                      {/* Numer wizyty w zleceniu */}
                      {visit.order.visitNumber && (
                        <span className="text-xs text-gray-500">
                          (wizyta {visit.order.visitNumber})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">#{idx + 1}</span>
                  </div>
                  
                  {/* Numer zlecenia */}
                  {visit.order.orderNumber && (
                    <div className="text-xs text-gray-500 mb-2">
                      đź“‹ Zlecenie: <span className="font-mono">{visit.order.orderNumber}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-green-600">đź“Ť Przyjazd:</span>
                      <span className="font-medium ml-1">
                        {visit.arrivalTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
                      </span>
                    </div>
                    <div>
                      <span className="text-red-600">đźŹ Wyjazd:</span>
                      <span className="font-medium ml-1">
                        {visit.departureTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
                      </span>
                    </div>
                    <div className="col-span-2 text-gray-600">
                    đź”§ {visit.order.description || visit.order.issueDescription} ({visit.duration}min, {visit.order.serviceCost}zĹ‚)
                  </div>
                  <div className="col-span-2 text-gray-500 text-xs">
                    đź“Ť {visit.order.address}
                  </div>
                  <div className="col-span-2">
                    <TravelTimeInfo 
                      order={visit.order}
                      previousLocation={idx === 0 ? null : visits[idx-1]?.order?.coordinates}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600 hover:text-blue-800">
                  đź‘† Kliknij aby zobaczyÄ‡ szczegĂłĹ‚y
                </div>
              </div>
              );
            })}
          </div>
          
          {/* Czas powrotu */}
          <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-300">
            <div className="flex items-center justify-between">
              <span className="font-medium text-purple-800">đźŹ  PowrĂłt do domu:</span>
              <span className="font-bold text-purple-800">
                {arrivalHome.time.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
              </span>
            </div>
            <div className="text-xs text-purple-600 mt-1">
              âŹ±ď¸Ź CaĹ‚kowity czas pracy: {(realSchedule.totalDuration / (1000 * 60 * 60)).toFixed(1)}h
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback do starego systemu jeĹ›li jeszcze nie obliczono rzeczywistego harmonogramu
    const startTime = optimizationPreferences.preferredStartTime;
    const firstOrder = orders[0];
    
    // UĹĽyj symulowanego czasu jako fallback
    const travelToFirst = 30; // Fallback 30 minut
    const firstVisitTime = new Date(`2025-10-01T${startTime}:00`);
    const departureTime = new Date(firstVisitTime.getTime() - travelToFirst * 60000);
    
    const minDepartureHour = parseTime(optimizationPreferences.workingHours.start);
    if (departureTime.getHours() * 60 + departureTime.getMinutes() < minDepartureHour) {
      departureTime.setHours(Math.floor(minDepartureHour / 60), minDepartureHour % 60, 0, 0);
      firstVisitTime.setTime(departureTime.getTime() + travelToFirst * 60000);
    }
    
    let currentTime = new Date(firstVisitTime);

    return (
      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-yellow-800">
          <Clock className="h-4 w-4" />
          Harmonogram (obliczanie czasu rzeczywistego...)
          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            đź“ˇ Loading...
          </span>
        </h4>
        
        {/* Czas wyjazdu */}
        <div className="mb-3 p-2 bg-green-100 rounded border border-green-300">
          <div className="flex items-center justify-between">
            <span className="font-medium text-green-800">đźš— Wyjazd z domu:</span>
            <span className="font-bold text-green-800">
              {departureTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
            </span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            đź“Ť {startLocation.address}
          </div>
        </div>
        
        {/* Harmonogram wizyt */}
        <div className="space-y-2">
          {orders.map((order, idx) => {
            // JeĹ›li to nie pierwsza wizyta, dodaj symulowany czas dojazdu
            if (idx > 0) {
              currentTime = new Date(currentTime.getTime() + 20 * 60000); // 20 min fallback
            }
            
            const arrivalTime = new Date(currentTime);
            const orderDepartureTime = new Date(currentTime.getTime() + order.estimatedDuration * 60000);
            currentTime = orderDepartureTime;
            
            return (
              <div 
                key={`unassigned-${order.id}-${idx}`} 
                onClick={() => handleOrderClick(order)}
                className="p-2 bg-white rounded border border-gray-200 opacity-75 cursor-pointer hover:shadow-lg hover:border-blue-400 hover:opacity-100 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm hover:text-blue-600">{order.clientName}</span>
                  <span className="text-xs text-gray-500">#{idx + 1}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-green-600">đź“Ť Przyjazd:</span>
                    <span className="font-medium ml-1">
                      {arrivalTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-600">đźŹ Wyjazd:</span>
                    <span className="font-medium ml-1">
                      {orderDepartureTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </div>
                  <div className="col-span-2 text-gray-600">
                    đź”§ {order.description} ({order.estimatedDuration}min, {order.serviceCost}zĹ‚)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Czas powrotu */}
        <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-300">
          <div className="flex items-center justify-between">
            <span className="font-medium text-purple-800">đźŹ  PowrĂłt do domu:</span>
            <span className="font-bold text-purple-800">
              {new Date(currentTime.getTime() + 30 * 60000).toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
            </span>
          </div>
          <div className="text-xs text-purple-600 mt-1">
            âŹ±ď¸Ź Szacowany czas pracy (dokĹ‚adne za chwilÄ™)
          </div>
        </div>
      </div>
    );
  };  

  // Individual calculation mutex per day to prevent race conditions
  const dayCalculationMutexRef = useRef(new Map());
  const loadIntelligentPlanMutexRef = useRef(false);
  const calculationDebounceRef = useRef(new Map()); // Debounce timers for calculations
  const apiCallQueueRef = useRef([]); // Queue for API calls to prevent rate limiting
  const lastApiCallRef = useRef(0); // Timestamp of last API call
  
  // Additional refs for preventing infinite loops and memory leaks
  const isInitialMountRef = useRef(true);
  const initialLoadTimerRef = useRef(null);
  const prevServicemanRef = useRef(currentServiceman);
  const planVersionRef = useRef(0);
  const prevLocationRef = useRef(null);
  const locationChangeDebounceRef = useRef(null);
  const prevUpdatedAtRef = useRef(null);
  const planReloadDebounceRef = useRef(null);

  // Rate limited API call function
  const makeRateLimitedApiCall = useCallback(async (url, options) => {
    const minInterval = 100; // Minimum 100ms between API calls
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallRef.current;
    
    if (timeSinceLastCall < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastCall));
    }
    
    lastApiCallRef.current = Date.now();
    return fetch(url, options);
  }, []);

  // Funkcja do zapisywania zlecenia do kalendarza (przypisywanie do konkretnego dnia)
  const saveOrderToSchedule = async (order, targetDay) => {
    try {
      logger.success('đź“Ś Zapisywanie zlecenia', order.id, 'na dzieĹ„', targetDay);
      
      const updatedPlan = { ...weeklyPlan };
      const unscheduledOrders = [...(updatedPlan.unscheduledOrders || [])];
      
      // UsuĹ„ z unscheduledOrders jeĹ›li tam jest
      updatedPlan.unscheduledOrders = unscheduledOrders.filter(o => o.id !== order.id);
      
      // âś… NOWA STRUKTURA: Dodaj zlecenie bezpoĹ›rednio do weeklyPlan[day].orders
      // Najpierw sprawdĹş ktĂłry dzieĹ„ tygodnia odpowiada tej dacie
      const dayMap = {
        monday: updatedPlan.monday,
        tuesday: updatedPlan.tuesday,
        wednesday: updatedPlan.wednesday,
        thursday: updatedPlan.thursday,
        friday: updatedPlan.friday,
        saturday: updatedPlan.saturday,
        sunday: updatedPlan.sunday
      };
      
      // ZnajdĹş dzieĹ„ ktĂłry odpowiada targetDay (nazwa dnia, np. 'monday')
      const dayKey = Object.keys(dayMap).find(key => key === targetDay);
      
      if (dayKey && updatedPlan[dayKey]) {
        const updatedOrder = { ...order, scheduledDate: targetDay, assignedTo: currentServiceman };
        const currentOrders = [...(updatedPlan[dayKey].orders || [])];
        
        // UsuĹ„ jeĹ›li juĹĽ istnieje i dodaj zaktualizowanÄ… wersjÄ™
        const filteredOrders = currentOrders.filter(o => o.id !== order.id);
        updatedPlan[dayKey].orders = [...filteredOrders, updatedOrder];
        
        logger.success(`âś… Dodano zlecenie ${order.id} do weeklyPlan.${dayKey}.orders (${updatedPlan[dayKey].orders.length} zleceĹ„)`);
      } else {
        console.error(`âťŚ Nie znaleziono dnia: ${targetDay}`);
      }
      
      setWeeklyPlan(updatedPlan);
      
      // Zapisz do API
      const saveResponse = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduledDate: targetDay,
          assignedTo: currentServiceman
        })
      });
      
      if (saveResponse.ok) {
        logger.success(`âś… Zapisano zlecenie ${order.id} na dzieĹ„ ${targetDay}`);
        showNotification(`âś… Zlecenie "${getCardHeaderText(order)}" zapisane na ${targetDay}`, 'success');
      } else {
        console.warn(`âš ď¸Ź Nie udaĹ‚o siÄ™ zapisaÄ‡ zmian:`, await saveResponse.text());
        loadIntelligentPlan();
        showNotification(`âťŚ BĹ‚Ä…d zapisywania zmian`, 'error');
      }
    } catch (error) {
      console.error('âťŚ BĹ‚Ä…d zapisywania zlecenia:', error);
      showNotification(`âťŚ BĹ‚Ä…d: ${error.message}`, 'error');
      loadIntelligentPlan();
    }
  };

  // Funkcja do usuwania zlecenia z kalendarza (przywracanie do nieprzypisanych)
  const moveOrderToUnscheduled = async (order, sourceDay) => {
    try {
      logger.success(`đź“¤ Przenoszenie zlecenia ${order.id} z ${sourceDay} do nieprzypisanych`);
      
      const updatedPlan = { ...weeklyPlan };
      const unscheduledOrders = [...(updatedPlan.unscheduledOrders || [])];
      
      // âś… NOWA STRUKTURA: UsuĹ„ z weeklyPlan[sourceDay].orders
      let orderToMove = null;
      
      if (sourceDay && updatedPlan[sourceDay]) {
        const dayOrders = [...(updatedPlan[sourceDay].orders || [])];
        orderToMove = dayOrders.find(o => o.id === order.id);
        
        if (orderToMove) {
          // UsuĹ„ z dnia
          updatedPlan[sourceDay].orders = dayOrders.filter(o => o.id !== order.id);
          logger.success(`âś… UsuniÄ™to zlecenie ${order.id} z weeklyPlan.${sourceDay}.orders`);
        }
      }
      
      // Dodaj do unscheduledOrders
      if (orderToMove) {
        updatedPlan.unscheduledOrders = [...unscheduledOrders, { ...orderToMove, scheduledDate: null, assignedTo: null }];
        logger.success(`âś… Dodano zlecenie ${order.id} do unscheduledOrders (${updatedPlan.unscheduledOrders.length} zleceĹ„)`);
        
        setWeeklyPlan(updatedPlan);
        
        // Zapisz do API - usuĹ„ scheduledDate i zmieĹ„ status na 'unscheduled'
        const saveResponse = await fetch(`/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            scheduledDate: null,
            scheduledTime: null,
            assignedTo: null,
            status: 'unscheduled' // đź”„ ZmieĹ„ status na 'nieprzypisane'
          })
        });
        
        if (saveResponse.ok) {
          logger.success(`âś… Przeniesiono zlecenie ${order.id} do nieprzypisanych`);
          showNotification(`âś… Zlecenie "${getCardHeaderText(order)}" przeniesione do nieprzypisanych`, 'success');
          
          // đź”” EMIT EVENT - Powiadom kalendarz technika o usuniÄ™ciu wizyty
          logger.success('đź”” Emitting visitsChanged event (visit removed)...');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('visitsChanged', {
              detail: {
                source: 'intelligent-planner',
                action: 'visit-removed',
                orderId: order.id,
                previousServiceman: currentServiceman
              }
            }));
          }
        } else {
          console.warn(`âš ď¸Ź Nie udaĹ‚o siÄ™ zapisaÄ‡ zmian:`, await saveResponse.text());
          // Wycofaj zmiany
          loadIntelligentPlan();
          showNotification(`âťŚ BĹ‚Ä…d zapisywania zmian`, 'error');
        }
      }
    } catch (error) {
      console.error('âťŚ BĹ‚Ä…d przenoszenia zlecenia:', error);
      showNotification(`âťŚ BĹ‚Ä…d: ${error.message}`, 'error');
      loadIntelligentPlan();
    }
  };

  // Funkcje drag & drop dla zleceĹ„
  const handleDragStart = (e, order, sourceDay) => {
    // Nie pozwalaj przeciÄ…gaÄ‡ wykonanych zleceĹ„
    if (completedOrders.has(order.id)) {
      e.preventDefault();
      logger.success('âťŚ Cannot drag completed order:', order.clientName);
      return;
    }
    
    logger.success('đź”µ Drag start:', order.clientName, 'from', sourceDay);
    setDraggedOrder({ order, sourceDay, sourceServiceman: currentServiceman });
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Potrzebne dla niektĂłrych przeglÄ…darek
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    logger.success('đź”´ Drag end');
    e.target.style.opacity = '1';
    setIsDragging(false);
    setDraggedOrder(null);
  };

  const handleDragOver = (e, targetDay) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // logger.success('đźźˇ Drag over:', targetDay); // Zakomentowane ĹĽeby nie spamowaÄ‡
  };

  const handleDrop = async (e, targetDay, insertIndex = null, targetServiceman = null) => {
    e.preventDefault();
    logger.success('đźź˘ Drop:', targetDay, 'insertIndex:', insertIndex, 'targetServiceman:', targetServiceman);
    
    if (!draggedOrder) {
      logger.success('âťŚ No dragged order found');
      return;
    }

    const { order, sourceDay, sourceServiceman } = draggedOrder;
    const actualTargetServiceman = targetServiceman || currentServiceman;
    logger.success('đź“¦ Moving:', order.clientName, 'from', sourceDay, 'to', targetDay, 
                'from serviceman', sourceServiceman, 'to serviceman', actualTargetServiceman);
    
    // Przenoszenie miÄ™dzy serwisantami
    if (sourceServiceman !== actualTargetServiceman) {
      await handleServicemanTransfer(order, sourceDay, targetDay, sourceServiceman, actualTargetServiceman);
      return;
    }
    
    // JeĹ›li to ten sam dzieĹ„ i ten sam serwisant - zmiana kolejnoĹ›ci
    if (sourceDay === targetDay) {
      if (insertIndex !== null) {
        // TODO: Implementacja zmiany kolejnoĹ›ci dla nowej struktury
        // Obecnie nie modyfikujemy scheduledOrders - kolejnoĹ›Ä‡ bÄ™dzie sortowana przez getOrdersForWeekDay
        logger.success('â„ąď¸Ź Zmiana kolejnoĹ›ci w tym samym dniu - pomijam (wymaga osobnej implementacji)');
        
        showNotification(`âś… Zmieniono kolejnoĹ›Ä‡ zlecenia "${order.clientName}" w ${getDayName(targetDay)}`);
      }
      return;
    }

    // Walidacja przeniesienia miÄ™dzy dniami
    const validation = validateOrderMove(order, sourceDay, targetDay);
    if (!validation.isValid) {
      showNotification(`âťŚ Nie moĹĽna przenieĹ›Ä‡ zlecenia: ${validation.reason}`, 'error');
      return;
    }

    // SprawdĹş ostrzeĹĽenia
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        showNotification(`âš ď¸Ź ${warning}`, 'warning');
      });
    }

    // âś… Aktualizuj plan tygodniowy - NOWA STRUKTURA
    const updatedPlan = { ...weeklyPlan };
    const unscheduledOrders = [...(updatedPlan.unscheduledOrders || [])];
    
    // Oblicz docelowÄ… datÄ™
    const targetDate = getDateForDay(targetDay);
    // đź”§ FIX: UĹĽyj lokalnej daty zamiast UTC
    const scheduledDate = targetDate ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}` : targetDay;
    
    // đź¤– AUTO-KALKULACJA: Oblicz czas gdy przypisujemy pracownika
    const assignedEmployee = actualTargetServiceman || currentServiceman;
    let autoCalculatedTime = null;
    
    if (assignedEmployee && order.deviceType) {
      const employee = availableServicemen.find(e => e.id === assignedEmployee);
      if (employee) {
        autoCalculatedTime = calculateEstimatedDuration(order, employee);
        if (autoCalculatedTime) {
          logger.success(`âŹ±ď¸Ź Auto-obliczono czas dla "${order.clientName}": ${autoCalculatedTime}min (pracownik: ${employee.name})`);
        }
      }
    }
    
    const updatedOrder = { 
      ...order, 
      scheduledDate: scheduledDate,
      assignedTo: assignedEmployee,
      estimatedDuration: autoCalculatedTime || order.estimatedDuration
    };
    
    if (sourceDay === 'unscheduled') {
      // PrzenieĹ› z unscheduled do konkretnego dnia
      updatedPlan.unscheduledOrders = unscheduledOrders.filter(o => o.id !== order.id);
      logger.success(`đź“¤ UsuniÄ™to z unscheduled (pozostaĹ‚o: ${updatedPlan.unscheduledOrders.length})`);
      
      // Dodaj do weeklyPlan[targetDay].orders
      if (updatedPlan[targetDay]) {
        const dayOrders = [...(updatedPlan[targetDay].orders || [])];
        updatedPlan[targetDay].orders = [...dayOrders, updatedOrder];
        logger.success(`đź“Ą Dodano do weeklyPlan.${targetDay}.orders (teraz: ${updatedPlan[targetDay].orders.length})`);
      }
    } else {
      // Przenoszenie miÄ™dzy dniami
      // UsuĹ„ z dnia ĹşrĂłdĹ‚owego
      if (updatedPlan[sourceDay]) {
        const sourceOrders = [...(updatedPlan[sourceDay].orders || [])];
        updatedPlan[sourceDay].orders = sourceOrders.filter(o => o.id !== order.id);
        logger.success(`đź“¤ UsuniÄ™to z ${sourceDay} (pozostaĹ‚o: ${updatedPlan[sourceDay].orders.length})`);
      }
      
      // Dodaj do dnia docelowego
      if (updatedPlan[targetDay]) {
        const targetOrders = [...(updatedPlan[targetDay].orders || [])];
        updatedPlan[targetDay].orders = [...targetOrders, updatedOrder];
        logger.success(`đź“Ą Dodano do ${targetDay} (teraz: ${updatedPlan[targetDay].orders.length})`);
      }
    }
    
    setWeeklyPlan(updatedPlan);
    
    // đź†• Zapisz scheduledDate do bazy danych (w tle)
    try {
      logger.success(`đź’ľ ZapisujÄ™ scheduledDate dla zlecenia ${order.id}: ${scheduledDate}`);
      
      // đź“‹ Loguj dokĹ‚adnie co zapisujemy
      const assignmentData = {
        orderId: order.id,
        scheduledDate: scheduledDate,
        scheduledTime: updatedOrder.scheduledTime || '09:00',
        assignedTo: assignedEmployee,
        assignedEmployeeName: availableServicemen.find(e => e.id === assignedEmployee)?.name,
        estimatedDuration: autoCalculatedTime || order.estimatedDuration,
        status: 'scheduled'
      };
      logger.success('đź’ľ WysyĹ‚am do API /orders/[id] PATCH:', assignmentData);

      const saveResponse = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduledDate: assignmentData.scheduledDate,
          scheduledTime: assignmentData.scheduledTime,
          assignedTo: assignmentData.assignedTo, // âś… UĹĽyj assignedEmployee
          estimatedDuration: assignmentData.estimatedDuration,
          status: assignmentData.status // âś… Automatycznie zmieĹ„ status
        })
      });
      
      if (saveResponse.ok) {
        logger.success(`âś… Zapisano scheduledDate dla ${order.id}`);
        
        // đź”” EMIT EVENT - Powiadom kalendarz technika o zmianie wizyty
        logger.success('đź”” Emitting visitsChanged event (visit moved)...');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('visitsChanged', {
            detail: {
              source: 'intelligent-planner',
              action: 'visit-moved',
              orderId: order.id,
              newDate: scheduledDate,
              servicemanId: assignedEmployee
            }
          }));
        }
        
        // đź†• Zapisz caĹ‚y plan do bazy, ĹĽeby utworzyÄ‡ wizytÄ™
        logger.success('đź’ľ Zapisywanie caĹ‚ego planu do stworzenia wizyty...');
        setTimeout(() => {
          savePlanToDatabase();
        }, 500);
      } else {
        console.warn(`âš ď¸Ź Nie udaĹ‚o siÄ™ zapisaÄ‡ scheduledDate:`, await saveResponse.text());
        // Wycofaj optymistycznÄ… aktualizacjÄ™ w przypadku bĹ‚Ä™du
        loadIntelligentPlan(); // PrzeĹ‚aduj dane z serwera
      }
    } catch (error) {
      console.error('âťŚ BĹ‚Ä…d zapisywania scheduledDate:', error);
    }
    
    // PokaĹĽ powiadomienie o sukcesie
    const sourceLabel = sourceDay === 'unscheduled' ? 'puli niezaplanowanych' : getDayName(sourceDay);
    showNotification(`âś… Zlecenie "${order.clientName}" przeniesione z ${sourceLabel} na ${getDayName(targetDay)}`);
  };

  // Walidacja przeniesienia zlecenia
  const validateOrderMove = (order, sourceDay, targetDay) => {
    const planData = getWeeklyPlanData(weeklyPlan) || {};
    const targetDayOrders = planData[targetDay]?.orders || [];
    const warnings = [];
    
    // SprawdĹş limit zleceĹ„ dziennych
    if (targetDayOrders.length >= optimizationPreferences.maxDailyOrders) {
      return {
        isValid: false,
        reason: `DzieĹ„ ${getDayName(targetDay)} ma juĹĽ maksymalnÄ… liczbÄ™ zleceĹ„ (${optimizationPreferences.maxDailyOrders})`
      };
    }
    
    // SprawdĹş dostÄ™pnoĹ›Ä‡ klienta w nowej dacie
    const targetDate = getDateForDay(targetDay);
    if (order.unavailableDates && order.unavailableDates.some(date => 
      new Date(date).toDateString() === targetDate.toDateString()
    )) {
      return {
        isValid: false,
        reason: `Klient ${order.clientName} nie jest dostÄ™pny w dniu ${targetDate.toLocaleDateString('pl-PL')}`
      };
    }
    
    // SprawdĹş godziny pracy - oblicz szacowany czas zakoĹ„czenia dnia
    const newOrdersList = [...targetDayOrders, order];
    
    // Dla walidacji uĹĽywamy szybkiej symulacji, dokĹ‚adne obliczenia bÄ™dÄ… pĂłĹşniej
    let estimatedWorkingTime = 0;
    estimatedWorkingTime += newOrdersList.reduce((sum, ord) => sum + (ord.estimatedDuration || 60), 0);
    estimatedWorkingTime += (newOrdersList.length - 1) * 15; // PrzybliĹĽone dojazdy miÄ™dzy
    estimatedWorkingTime += 60; // Z domu i z powrotem
    
    const workStart = parseTime(optimizationPreferences.workingHours.start);
    const workEnd = parseTime(optimizationPreferences.workingHours.end);
    const maxWorkingHours = optimizationPreferences.workingHours.maxWorkingHours;
    
    if (estimatedWorkingTime > maxWorkingHours * 60) { // Konwersja na minuty
      return {
        isValid: false,
        reason: `DzieĹ„ pracy przekroczyĹ‚by maksymalny czas (${maxWorkingHours}h). Szacowany czas: ${Math.round(estimatedWorkingTime/60)}h`
      };
    }
    
    // SprawdĹş czy dzieĹ„ zmieĹ›ci siÄ™ w godzinach pracy (6:00-22:00)
    const estimatedEndTime = workStart + estimatedWorkingTime;
    if (estimatedEndTime > workEnd) {
      const endHour = Math.floor(estimatedEndTime / 60);
      const endMinute = estimatedEndTime % 60;
      return {
        isValid: false,
        reason: `Praca zakoĹ„czyĹ‚aby siÄ™ o ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')} (po dozwolonych godzinach pracy)`
      };
    }
    
    // SprawdĹş konflikty czasowe - bardziej elastyczne podejĹ›cie
    const timeConflicts = [];
    targetDayOrders.forEach(existingOrder => {
      if (order.preferredTimeSlots && existingOrder.preferredTimeSlots) {
        const conflicts = order.preferredTimeSlots.filter(orderSlot => 
          existingOrder.preferredTimeSlots.some(existingSlot => 
            doTimeSlotsOverlap(orderSlot, existingSlot)
          )
        );
        if (conflicts.length > 0) {
          timeConflicts.push({
            conflictingOrder: existingOrder,
            conflictingSlots: conflicts
          });
        }
      }
    });
    
    if (timeConflicts.length > 0) {
      // SprawdĹş czy moĹĽna automatycznie rozwiÄ…zaÄ‡ konflikty
      const canResolveAutomatically = timeConflicts.every(conflict => 
        order.preferredTimeSlots && order.preferredTimeSlots.length > 1
      );
      
      if (canResolveAutomatically) {
        warnings.push(`Wykryto ${timeConflicts.length} konflikt(Ăłw) czasowych - zostanÄ… automatycznie rozwiÄ…zane`);
      } else {
        // Tylko blokuj jeĹ›li nie moĹĽna automatycznie rozwiÄ…zaÄ‡
        const conflictDetails = timeConflicts.map(c => 
          `${c.conflictingOrder.clientName} (${c.conflictingSlots[0].start}-${c.conflictingSlots[0].end})`
        ).join(', ');
        warnings.push(`Konflikty czasowe z: ${conflictDetails} - sprawdĹş harmonogram po przeniesieniu`);
      }
    }
    
    // SprawdĹş ostrzeĹĽenia (ale nie blokuj przeniesienia)
    
    // OstrzeĹĽenie o przekroczeniu optymalnej liczby zleceĹ„
    if (targetDayOrders.length >= 10) {
      warnings.push(`DzieĹ„ ${getDayName(targetDay)} bÄ™dzie miaĹ‚ juĹĽ ${targetDayOrders.length + 1} zleceĹ„ - moĹĽe byÄ‡ przeciÄ…ĹĽony`);
    }
    
    // OstrzeĹĽenie o priorytecie
    if (order.priority === 'high' && targetDay !== 'monday') {
      warnings.push(`Pilne zlecenie zostanie przesuniÄ™te na ${getDayName(targetDay)} - rozwaĹĽ obsĹ‚ugÄ™ wczeĹ›niej`);
    }
    
    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : null 
    };
  };

  // Funkcje pomocnicze do obsĹ‚ugi czasu i dat
  const parseTime = (timeString) => {
    // Konwertuje czas "HH:MM" na minuty od pĂłĹ‚nocy
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getDateForDay = (dayName) => {
    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(dayName);
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + dayIndex);
    return date;
  };

  const getISODateForDay = (dayName) => {
    const date = getDateForDay(dayName);
    // đź”§ FIX: UĹĽyj lokalnej daty zamiast UTC
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; // YYYY-MM-DD
  };

  const calculateDayWorkingTime = async (orders, departureTime = null) => {
    // Szacuje caĹ‚kowity czas pracy dla listy zleceĹ„ (w minutach)
    if (!orders || orders.length === 0) return 0;
    
    let totalTime = 0;
    
    // Czas na kaĹĽde zlecenie
    totalTime += orders.reduce((sum, order) => sum + (order.estimatedDuration || 60), 0);
    
    // Rzeczywisty czas dojazdĂłw
    try {
      const travelTime = await calculateTotalTravelTime(orders, departureTime);
      totalTime += travelTime;
    } catch (error) {
      console.warn('âš ď¸Ź BĹ‚Ä…d obliczania czasu dojazdu, uĹĽywam fallback:', error);
      // Fallback do starych obliczeĹ„
      totalTime += (orders.length - 1) * 15; // MiÄ™dzy zleceniami
      totalTime += 60; // Z domu i z powrotem
    }
    
    return totalTime;
  };

  const doTimeSlotsOverlap = (slot1, slot2) => {
    // Sprawdza czy dwa okna czasowe siÄ™ pokrywajÄ…
    if (!slot1 || !slot2) return false;
    
    const start1 = parseTime(slot1.start);
    const end1 = parseTime(slot1.end);
    const start2 = parseTime(slot2.start);
    const end2 = parseTime(slot2.end);
    
    return (start1 < end2 && start2 < end1);
  };

  // ObsĹ‚uga przenoszenia zlecenia miÄ™dzy serwisantami
  const handleServicemanTransfer = async (order, sourceDay, targetDay, sourceServiceman, targetServiceman) => {
    // Pobierz plany obu serwisantĂłw
    const sourcePlan = sourceServiceman === currentServiceman ? weeklyPlan : weeklyPlans[sourceServiceman];
    const targetPlan = targetServiceman === currentServiceman ? weeklyPlan : weeklyPlans[targetServiceman];

    if (!sourcePlan || !targetPlan) {
      showNotification('âťŚ Nie moĹĽna przenieĹ›Ä‡ zlecenia - brak dostÄ™pu do planu serwisanta', 'error');
      return;
    }

    // Walidacja przeniesienia dla docelowego serwisanta
    const validation = validateOrderMoveForServiceman(order, targetDay, targetPlan);
    if (!validation.isValid) {
      const targetServicemanName = availableServicemen.find(s => s.id === targetServiceman)?.name;
      showNotification(`âťŚ Nie moĹĽna przenieĹ›Ä‡ do ${targetServicemanName}: ${validation.reason}`, 'error');
      return;
    }

    // Wykonaj transfer
    const updatedSourcePlan = { ...sourcePlan };
    const updatedTargetPlan = { ...targetPlan };

    // UsuĹ„ z planu ĹşrĂłdĹ‚owego
    updatedSourcePlan.weeklyPlan[sourceDay].orders = updatedSourcePlan.weeklyPlan[sourceDay].orders.filter(
      o => o.id !== order.id
    );

    // đź¤– AUTO-KALKULACJA: Oblicz czas dla nowego pracownika
    let autoCalculatedTime = null;
    if (targetServiceman && order.deviceType) {
      const employee = availableServicemen.find(e => e.id === targetServiceman);
      if (employee) {
        autoCalculatedTime = calculateEstimatedDuration(order, employee);
        if (autoCalculatedTime) {
          logger.success(`âŹ±ď¸Ź Auto-obliczono czas dla "${order.clientName}": ${autoCalculatedTime}min (nowy pracownik: ${employee.name})`);
        }
      }
    }

    const updatedOrder = {
      ...order,
      assignedTo: targetServiceman,
      estimatedDuration: autoCalculatedTime || order.estimatedDuration
    };

    // Dodaj do planu docelowego
    if (!updatedTargetPlan.weeklyPlan[targetDay].orders) {
      updatedTargetPlan.weeklyPlan[targetDay].orders = [];
    }
    updatedTargetPlan.weeklyPlan[targetDay].orders.push(updatedOrder);

    // đź’ľ Zapisz do bazy danych
    try {
      const scheduledDate = getISODateForDay(targetDay);
      logger.success('đź’ľ ZapisujÄ™ transfer do bazy:', {
        orderId: order.id,
        assignedTo: targetServiceman,
        scheduledDate,
        estimatedDuration: updatedOrder.estimatedDuration
      });

      const saveResponse = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduledDate: scheduledDate,
          scheduledTime: updatedOrder.scheduledTime || '09:00',
          assignedTo: targetServiceman, // âś… Przypisz do nowego serwisanta
          estimatedDuration: updatedOrder.estimatedDuration,
          status: 'scheduled'
        })
      });

      if (!saveResponse.ok) {
        throw new Error(`BĹ‚Ä…d zapisywania: ${saveResponse.status}`);
      }

      logger.success('âś… Transfer zapisany w bazie danych');
    } catch (error) {
      console.error('âťŚ BĹ‚Ä…d podczas zapisywania transferu:', error);
      showNotification('âš ď¸Ź Zlecenie przeniesione lokalnie, ale wystÄ…piĹ‚ problem z zapisem do bazy', 'warning');
    }

    // Przelicz statystyki
    await recalculateDayStats(updatedSourcePlan, sourceDay);
    await recalculateDayStats(updatedTargetPlan, targetDay);

    // Zaktualizuj stany
    if (sourceServiceman === currentServiceman) {
      setWeeklyPlan(updatedSourcePlan);
    } else {
      setWeeklyPlans(prev => ({ ...prev, [sourceServiceman]: updatedSourcePlan }));
    }

    if (targetServiceman === currentServiceman) {
      setWeeklyPlan(updatedTargetPlan);
    } else {
      setWeeklyPlans(prev => ({ ...prev, [targetServiceman]: updatedTargetPlan }));
    }

    // Powiadomienie
    const sourceServicemanName = availableServicemen.find(s => s.id === sourceServiceman)?.name;
    const targetServicemanName = availableServicemen.find(s => s.id === targetServiceman)?.name;
    showNotification(
      `âś… Zlecenie "${order.clientName}" przeniesione z ${sourceServicemanName} (${getDayName(sourceDay)}) do ${targetServicemanName} (${getDayName(targetDay)})`,
      'success'
    );
  };

  // Walidacja przeniesienia dla konkretnego serwisanta
  const validateOrderMoveForServiceman = (order, targetDay, targetPlan) => {
    const targetDayOrders = targetPlan.weeklyPlan[targetDay]?.orders || [];
    
    // SprawdĹş limit zleceĹ„ dziennych
    if (targetDayOrders.length >= optimizationPreferences.maxDailyOrders) {
      return {
        isValid: false,
        reason: `DzieĹ„ ${getDayName(targetDay)} ma juĹĽ maksymalnÄ… liczbÄ™ zleceĹ„ (${optimizationPreferences.maxDailyOrders})`
      };
    }

    // SprawdĹş godziny pracy - szybka walidacja
    const newOrdersList = [...targetDayOrders, order];
    let estimatedWorkingTime = 0;
    estimatedWorkingTime += newOrdersList.reduce((sum, ord) => sum + (ord.estimatedDuration || 60), 0);
    estimatedWorkingTime += (newOrdersList.length - 1) * 15; // PrzybliĹĽone dojazdy
    estimatedWorkingTime += 60; // Z domu i z powrotem
    
    const maxWorkingHours = optimizationPreferences.workingHours.maxWorkingHours;
    
    if (estimatedWorkingTime > maxWorkingHours * 60) {
      return {
        isValid: false,
        reason: `DzieĹ„ pracy przekroczyĹ‚by maksymalny czas (${maxWorkingHours}h)`
      };
    }

    return { isValid: true };
  };

  // Automatyczne rozwiÄ…zywanie konfliktĂłw czasowych
  const resolveTimeConflicts = (dayOrders) => {
    const resolvedOrders = [...dayOrders];
    const workStart = parseTime(optimizationPreferences.workingHours.start);
    const workEnd = parseTime(optimizationPreferences.workingHours.end);
    
    // Sortuj zlecenia wedĹ‚ug priorytetu: pilne -> Ĺ›rednie -> niskie
    resolvedOrders.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Przydziel automatycznie sloty czasowe
    let currentTime = workStart;
    const slotDuration = 90; // 1.5 godziny na zlecenie + dojazd
    
    resolvedOrders.forEach(order => {
      if (currentTime + slotDuration > workEnd) {
        // JeĹ›li nie mieĹ›ci siÄ™ w dniu pracy, przydziel na poczÄ…tek nastÄ™pnego dostÄ™pnego czasu
        currentTime = workStart;
      }
      
      // StwĂłrz nowy slot czasowy
      const startHour = Math.floor(currentTime / 60);
      const startMinute = currentTime % 60;
      const endTime = currentTime + slotDuration;
      const endHour = Math.floor(endTime / 60);
      const endMinute = endTime % 60;
      
      order.assignedTimeSlot = {
        start: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
        end: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
        autoAssigned: true
      };
      
      currentTime = endTime;
    });
    
    return resolvedOrders;
  };

  // Przelicz statystyki dnia po zmianie
  const recalculateDayStats = async (plan, day) => {
    // đź”Ą OPTYMALIZACJA: Debounce 2s - nie przeliczaj przy kaĹĽdym drag!
    if (recalculateTimerRef.current[day]) {
      clearTimeout(recalculateTimerRef.current[day]);
    }
    
    return new Promise((resolve) => {
      recalculateTimerRef.current[day] = setTimeout(async () => {
        logger.success(`đź’° Recalculating stats for ${day} (debounced)...`);
        
        // âś… NOWA STRUKTURA: Pobierz zlecenia bezpoĹ›rednio z plan[day].orders
        let dayOrders = [];
        
        if (plan[day] && plan[day].orders) {
          dayOrders = [...plan[day].orders];
          logger.success(`đź“¦ Znaleziono ${dayOrders.length} zleceĹ„ w plan.${day}.orders`);
        } else {
          console.warn(`âš ď¸Ź Brak zleceĹ„ dla ${day}`);
          resolve();
          return;
        }
        
        // Automatycznie rozwiÄ…ĹĽ konflikty czasowe
        if (dayOrders.length > 1) {
          dayOrders = resolveTimeConflicts(dayOrders);
          // Zaktualizuj orders w dniu
          plan[day].orders = dayOrders;
        }
        
        // ObsĹ‚uga obu struktur dla zapisania stats
        const isOldStructure = plan.weeklyPlan !== undefined;
        const dayData = isOldStructure ? plan.weeklyPlan[day] : plan[day];
        
        if (!dayData) {
          console.warn(`âš ď¸Ź recalculateDayStats: brak struktury dnia dla ${day}`);
          resolve();
          return;
        }
        
        if (dayOrders.length === 0) {
          dayData.stats = {
            totalRevenue: 0,
            totalTime: 0,
            efficiency: 0
          };
          resolve();
          return;
        }
        
        const totalRevenue = dayOrders.reduce((sum, order) => sum + (order.serviceCost || 0), 0);
        const totalWorkTime = dayOrders.reduce((sum, order) => sum + (order.estimatedDuration || 60), 0);
        
        // Oblicz rzeczywisty czas dojazdu
        let totalTravelTime = 0;
        try {
          totalTravelTime = await calculateTotalTravelTime(dayOrders);
        } catch (error) {
          console.warn('âš ď¸Ź BĹ‚Ä…d obliczania dojazdu w recalculateDayStats:', error);
          // Fallback
          totalTravelTime = dayOrders.length > 0 ? (dayOrders.length - 1) * 15 + 60 : 0;
        }
        
        const totalTime = totalTravelTime + totalWorkTime;
        
        // Zapisz statystyki do wĹ‚aĹ›ciwej struktury
        dayData.stats = {
          totalRevenue,
          totalTime,
          efficiency: totalRevenue / (totalTime / 60) // zĹ‚/godzinÄ™
        };
        
        resolve();
      }, 2000); // 2 sekundy debounce - czekaj aĹĽ uĹĽytkownik skoĹ„czy przeciÄ…gaÄ‡
    });
  };

  // Pomocnicza funkcja do nazw dni
  const getDayName = (day) => {
    const dayNames = {
      monday: 'PoniedziaĹ‚ek',
      tuesday: 'Wtorek',
      wednesday: 'Ĺšroda',
      thursday: 'Czwartek',
      friday: 'PiÄ…tek',
      saturday: 'Sobota',
      sunday: 'Niedziela'
    };
    
    // JeĹ›li mamy dostÄ™p do currentWeekStart, pokazuj datÄ™
    if (currentWeekStart) {
      const dayInfo = formatDayWithDate(day, currentWeekStart);
      return `${dayNames[day] || day} (${dayInfo.date})`;
    }
    
    return dayNames[day] || day;
  };

  // System powiadomieĹ„
  const [notifications, setNotifications] = useState([]);
  const notificationTimeouts = useRef(new Map()); // Track timeout IDs to prevent memory leaks
  // Nowe funkcje UI - rozwijanie, sortowanie, filtrowanie (z localStorage)
  const [expandedDay, setExpandedDay] = useState(null); // RozwiniÄ™ty dzieĹ„ na peĹ‚ny ekran
  const [viewMode, setViewMode] = useState(() => loadFromLocalStorage('viewMode', 7)); // 1-7 kolumn (caĹ‚y tydzieĹ„)
  const [sortBy, setSortBy] = useState(() => loadFromLocalStorage('sortBy', 'default')); // default, priority, time, revenue, client
  const [filterBy, setFilterBy] = useState(() => loadFromLocalStorage('filterBy', 'all')); // all, pending, contacted, unscheduled, scheduled, confirmed, in_progress, waiting_parts
  const [ordersPerPage, setOrdersPerPage] = useState(10); // Paginacja
  const [currentPage, setCurrentPage] = useState(1);

  // Reset paginacji gdy zmienia siÄ™ dzieĹ„, sortowanie lub filtrowanie
  useEffect(() => {
    setCurrentPage(1);
  }, [expandedDay, sortBy, filterBy]);

  // Zapisuj ustawienia UI do localStorage
  useEffect(() => {
    saveToLocalStorage('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    saveToLocalStorage('sortBy', sortBy);
  }, [sortBy]);

  useEffect(() => {
    saveToLocalStorage('filterBy', filterBy);
  }, [filterBy]);

  // Funkcje sortowania i filtrowania zleceĹ„
  const sortOrders = (orders, sortType) => {
    if (!orders || orders.length === 0) return orders;
    
    const sorted = [...orders];
    switch (sortType) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return sorted.sort((a, b) => (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1));
      case 'time':
        return sorted.sort((a, b) => (a.estimatedDuration || 60) - (b.estimatedDuration || 60));
      case 'revenue':
        return sorted.sort((a, b) => (b.serviceCost || 0) - (a.serviceCost || 0));
      case 'client':
        return sorted.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''));
      default:
        return sorted;
    }
  };

  const filterOrders = (orders, filterType) => {
    if (!orders || orders.length === 0) return orders;
    
    // đź”„ Filtruj po statusie zlecenia (zamiast priorytetu)
    switch (filterType) {
      case 'pending':
        return orders.filter(order => order.status === 'pending');
      case 'contacted':
        return orders.filter(order => order.status === 'contacted');
      case 'unscheduled':
        return orders.filter(order => order.status === 'unscheduled');
      case 'scheduled':
        return orders.filter(order => order.status === 'scheduled');
      case 'confirmed':
        return orders.filter(order => order.status === 'confirmed');
      case 'in_progress':
        return orders.filter(order => order.status === 'in_progress');
      case 'waiting_parts':
        return orders.filter(order => order.status === 'waiting_parts');
      case 'all':
      default:
        return orders; // Wszystkie zlecenia
    }
  };

  const getProcessedOrders = (dayOrders) => {
    let processed = [...(dayOrders || [])];
    processed = filterOrders(processed, filterBy);
    processed = sortOrders(processed, sortBy);
    return processed;
  };

  // Funkcja do oznaczania zlecenia jako wykonane/niewykonane
  const toggleOrderCompletion = (orderId) => {
    setCompletedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
        showNotification('đź“ť Zlecenie oznaczone jako niewykonane', 'info');
      } else {
        newSet.add(orderId);
        showNotification('âś… Zlecenie oznaczone jako wykonane!', 'success');
      }
      return newSet;
    });
  };

  const showNotification = (message, type = 'success') => {
    const notification = {
      id: Date.now(),
      message,
      type, // success, warning, error, info
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Automatycznie usuĹ„ powiadomienie po 5 sekundach z proper cleanup
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      notificationTimeouts.current.delete(notification.id);
    }, 5000);
    
    // Store timeout ID for cleanup
    notificationTimeouts.current.set(notification.id, timeoutId);
  };

  const removeNotification = (id) => {
    // Clear timeout if exists
    const timeoutId = notificationTimeouts.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      notificationTimeouts.current.delete(id);
    }
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Optymalizacja pojedynczego dnia lub wszystkich dni
  const optimizeSingleDay = async (day) => {
    if (!weeklyPlan) return;

    setIsLoading(true);
    
    try {
      if (day === 'all') {
        // Optymalizuj wszystkie dni
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const updatedPlan = { ...weeklyPlan };
        
        for (const singleDay of days) {
          if (updatedPlan.weeklyPlan[singleDay]?.orders?.length > 0) {
            const dayOrders = [...updatedPlan.weeklyPlan[singleDay].orders];
            const optimizedOrders = applyOptimizationStrategy(dayOrders);
            updatedPlan.weeklyPlan[singleDay].orders = optimizedOrders;
            await recalculateDayStats(updatedPlan, singleDay);
          }
        }
        
        setWeeklyPlan(updatedPlan);
        showNotification(`âś… Wszystkie dni zostaĹ‚y zoptymalizowane przy uĹĽyciu strategii: ${optimizationStrategies[selectedOptimizationStrategy].name}`, 'success');
        return;
      }

      // Optymalizuj pojedynczy dzieĹ„
      const planData = getWeeklyPlanData(weeklyPlan);
      if (!planData || !planData[day] || !planData[day].orders) {
        return;
      }

      const dayOrders = [...planData[day].orders];
      let optimizedOrders = applyOptimizationStrategy(dayOrders);

      // Aktualizuj plan
      const updatedPlan = { ...weeklyPlan };
      if (updatedPlan.weeklyPlan) {
        // Stara struktura
        updatedPlan.weeklyPlan[day].orders = optimizedOrders;
      } else {
        // Nowa struktura
        updatedPlan[day].orders = optimizedOrders;
      }
      
      // Przelicz statystyki
      await recalculateDayStats(updatedPlan, day);
      
      setWeeklyPlan(updatedPlan);
      showNotification(`âś… ${getDayName(day)} zostaĹ‚ zoptymalizowany przy uĹĽyciu strategii: ${optimizationStrategies[selectedOptimizationStrategy].name}`, 'success');
      
    } catch (error) {
      console.error('BĹ‚Ä…d optymalizacji dnia:', error);
      showNotification(`âťŚ Nie udaĹ‚o siÄ™ zoptymalizowaÄ‡ dnia ${getDayName(day)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Zastosuj wybranÄ… strategiÄ™ optymalizacji
  const applyOptimizationStrategy = (dayOrders) => {
    switch (selectedOptimizationStrategy) {
      case 'time':
        return optimizeByTime(dayOrders);
      case 'revenue':
        return optimizeByRevenue(dayOrders);
      case 'priority':
        return optimizeByPriority(dayOrders);
      case 'vip':
        return optimizeByVIP(dayOrders);
      case 'windows':
        return optimizeByTimeWindows(dayOrders);
      default:
        return optimizeBalanced(dayOrders);
    }
  };

  // Strategie optymalizacji pojedynczego dnia
  const optimizeByTime = (orders) => {
    // Sortuj po czasie realizacji (najkrĂłtsze najpierw)
    return orders.sort((a, b) => (a.estimatedDuration || 60) - (b.estimatedDuration || 60));
  };

  const optimizeByRevenue = (orders) => {
    // Sortuj po przychodzie (najdroĹĽsze najpierw)
    return orders.sort((a, b) => (b.serviceCost || 0) - (a.serviceCost || 0));
  };

  const optimizeByPriority = (orders) => {
    // Sortuj po priorytecie
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return orders.sort((a, b) => (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1));
  };

  const optimizeByVIP = (orders) => {
    // Priorytet dla klientĂłw VIP/premium
    return orders.sort((a, b) => {
      const isVipA = a.clientType === 'premium' || a.priority === 'high';
      const isVipB = b.clientType === 'premium' || b.priority === 'high';
      if (isVipA && !isVipB) return -1;
      if (!isVipA && isVipB) return 1;
      return (b.serviceCost || 0) - (a.serviceCost || 0);
    });
  };

  const optimizeByTimeWindows = (orders) => {
    // Sortuj po preferowanych oknach czasowych klientĂłw
    return orders.sort((a, b) => {
      const timeA = a.preferredTimeSlots?.[0]?.start || '08:00';
      const timeB = b.preferredTimeSlots?.[0]?.start || '08:00';
      return timeA.localeCompare(timeB);
    });
  };

  const optimizeBalanced = (orders) => {
    // Strategia zbalansowana - kombinacja wszystkich czynnikĂłw (priorytet + przychĂłd)
    return orders.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      
      const scoreA = (priorityOrder[a.priority] || 1) * 0.4 + 
                    ((a.serviceCost || 0) / 1000) * 0.6;
      const scoreB = (priorityOrder[b.priority] || 1) * 0.4 + 
                    ((b.serviceCost || 0) / 1000) * 0.6;
      return scoreB - scoreA;
    });
  };

  // Renderowanie szczegĂłĹ‚owych statystyk dnia z zarobkami
  const renderDayStats = (day, stats) => {
    if (!stats) return null;
    
    const planData = getWeeklyPlanData(weeklyPlan) || {};
    const dayOrders = planData[day]?.orders || [];
    
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          SzczegĂłĹ‚owe statystyki dnia
        </h4>
        
        {/* GĹ‚Ăłwne statystyki */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div>
            <span className="font-medium">Zlecenia:</span> {stats.totalOrders}
          </div>
          <div className="font-semibold text-green-600">
            <span className="font-medium">ĹÄ…cznie zarobiÄ™:</span> {stats.totalRevenue}zĹ‚
          </div>
          <div>
            <span className="font-medium">Czas serwisu:</span> {Math.round(stats.totalServiceTime/60)}h
          </div>
          <div>
            <span className="font-medium">Czas dojazdu:</span> {Math.round(stats.totalTravelTime/60)}h
          </div>
          <div className="col-span-2">
            <span className="font-medium">Regiony:</span> {stats.regions?.join(', ')}
          </div>
          <div className="col-span-2">
            <span className="font-medium">EfektywnoĹ›Ä‡:</span> 
            <span className={`ml-1 ${stats.efficiency > 15 ? 'text-green-600' : 
                             stats.efficiency > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {stats.efficiency?.toFixed(1)}zĹ‚/min
            </span>
          </div>
        </div>

        {/* SzczegĂłĹ‚owy breakdown zarobkĂłw */}
        {dayOrders.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <h5 className="font-medium text-xs mb-2 text-gray-700">đź’° Detale zarobkĂłw:</h5>
            <div className="space-y-1">
              {dayOrders.map((order, index) => (
                <div key={`earnings-${order.id}-${index}`} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">
                    {index + 1}. {order.clientName}
                  </span>
                  <span className="font-medium text-green-600">{order.serviceCost}zĹ‚</span>
                </div>
              ))}
              <div className="border-t border-gray-300 pt-1 flex justify-between items-center text-xs font-bold">
                <span>Razem dziennie:</span>
                <span className="text-green-600 text-sm">{dayOrders.reduce((sum, order) => sum + order.serviceCost, 0)}zĹ‚</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Ĺšrednio na zlecenie: {dayOrders.length > 0 ? Math.round(dayOrders.reduce((sum, order) => sum + order.serviceCost, 0) / dayOrders.length) : 0}zĹ‚
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Komponent do wyĹ›wietlania informacji o czasie dojazdu
  const TravelTimeInfo = ({ order, previousLocation = null, className = "" }) => {
    const fromLocation = previousLocation || startLocation?.coordinates;
    if (!fromLocation || !order.coordinates) return null;

    const key = `${fromLocation.lat},${fromLocation.lng}->${order.coordinates.lat},${order.coordinates.lng}`;
    const travelInfo = realTravelTimes.get(key);
    const isLoading = loadingTravelTimes.has(key);

    if (isLoading) {
      return (
        <div className={`flex items-center gap-1 text-xs text-gray-500 ${className}`}>
          <Clock className="h-3 w-3 animate-pulse" />
          <span>Obliczam...</span>
        </div>
      );
    }

    if (!travelInfo) {
      return (
        <div className={`flex items-center gap-1 text-xs text-gray-400 ${className}`}>
          <Clock className="h-3 w-3" />
          <span>~15min</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-1 text-xs ${className}`}>
        <Car className="h-3 w-3" />
        <span className={travelInfo.hasTraffic ? 'text-orange-600' : 'text-blue-600'}>
          {travelInfo.distance}km, {travelInfo.duration}min
        </span>
        {travelInfo.trafficDelay > 0 && (
          <span className="text-red-500" title={`OpĂłĹşnienie z powodu ruchu: +${travelInfo.trafficDelay}min`}>
            (+{travelInfo.trafficDelay})
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-semibold">OptymalizujÄ™ trasy tygodniowe...</p>
          <p className="text-sm text-gray-600 mt-2">AnalizujÄ™ dostÄ™pnoĹ›Ä‡ klientĂłw i grupujÄ™ geograficznie</p>
        </div>
      </div>
    );
  }

  if (!weeklyPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
          <h2 className="text-xl font-bold mb-2">Brak danych do optymalizacji</h2>
          <p className="text-gray-600 mb-4">Nie udaĹ‚o siÄ™ zaĹ‚adowaÄ‡ planu tygodniowego.</p>
          <button 
            onClick={loadIntelligentPlan}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            SprĂłbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // đź†• Komponent modalu ze szczegĂłĹ‚ami zlecenia
  const OrderDetailsModal = () => {
    if (!showOrderDetailsModal || !selectedOrderModal) return null;

    const order = selectedOrderModal;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {order.clientName || 'Nieznany klient'}
                </h3>
                <p className="text-blue-100 text-sm">
                  ID: {order.id}
                </p>
              </div>
              <button
                onClick={() => setShowOrderDetailsModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                âś•
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Podstawowe informacje */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adres
                </h4>
                <p className="text-gray-800">{order.address || 'Brak adresu'}</p>
                {order.coordinates && (
                  <p className="text-xs text-gray-500 mt-1">
                    đź“Ť {order.coordinates.lat?.toFixed(4)}, {order.coordinates.lng?.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="col-span-2 md:col-span-1">
                <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kontakt
                </h4>
                <p className="text-gray-800">{order.phone || 'Brak telefonu'}</p>
              </div>
            </div>

            {/* Opis problemu */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">
                đź”§ Opis problemu
              </h4>
              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                {order.description || order.issueDescription || 'Brak opisu'}
              </p>
            </div>

            {/* SzczegĂłĹ‚y serwisowe */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Priorytet</p>
                <p className={`font-bold text-lg ${
                  order.priority === 'high' ? 'text-red-600' :
                  order.priority === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {order.priority === 'high' ? 'đź”´ Wysoki' :
                   order.priority === 'medium' ? 'đźźˇ Ĺšredni' :
                   'đźź˘ Niski'}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Szacowany czas</p>
                <p className="font-bold text-lg text-gray-800">
                  âŹ±ď¸Ź {order.estimatedDuration || 60} min
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Koszt usĹ‚ugi</p>
                <p className="font-bold text-lg text-gray-800">
                  đź’° {order.serviceCost || 0} zĹ‚
                </p>
              </div>
            </div>

            {/* Preferowane terminy */}
            {order.preferredTimeSlots && order.preferredTimeSlots.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3">
                  đź“… DostÄ™pnoĹ›Ä‡ klienta
                </h4>
                <div className="space-y-2">
                  {order.preferredTimeSlots.map((slot, idx) => (
                    <div key={idx} className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {slot.day === 'monday' ? 'PoniedziaĹ‚ek' :
                         slot.day === 'tuesday' ? 'Wtorek' :
                         slot.day === 'wednesday' ? 'Ĺšroda' :
                         slot.day === 'thursday' ? 'Czwartek' :
                         slot.day === 'friday' ? 'PiÄ…tek' :
                         slot.day === 'saturday' ? 'Sobota' :
                         'Niedziela'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {slot.start} - {slot.end}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NiedostÄ™pne daty */}
            {order.unavailableDates && order.unavailableDates.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">
                  âťŚ NiedostÄ™pne daty
                </h4>
                <div className="flex flex-wrap gap-2">
                  {order.unavailableDates.map((date, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {date}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Czy moĹĽna przeĹ‚oĹĽyÄ‡ */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${order.canReschedule ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-700">
                {order.canReschedule ? 
                  'âś… Zlecenie moĹĽna przeĹ‚oĹĽyÄ‡ na inny termin' : 
                  'đź”’ Zlecenie ma sztywny termin'}
              </span>
            </div>

            {/* đź†• SEKCJA WIZYT - Timeline wizyt w zleceniu */}
            {order.orderNumber && (
              <div className="border-t-2 border-blue-200 pt-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  đź“‹ Historia wizyt w zleceniu {order.orderNumber}
                </h4>
                
                {/* Informacja o aktualnej wizycie */}
                {order.visitNumber && (
                  <div className="mb-4 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Obecnie wyĹ›wietlasz:</strong> Wizyta #{order.visitNumber} 
                      {order.visitType && ` - ${
                        order.visitType === 'diagnosis' ? 'đź”Ť Diagnoza' :
                        order.visitType === 'repair' ? 'đź”§ Naprawa' :
                        order.visitType === 'control' ? 'âś… Kontrola' :
                        order.visitType === 'installation' ? 'đź“¦ MontaĹĽ' :
                        order.visitType
                      }`}
                    </p>
                  </div>
                )}

                {/* PrzykĹ‚adowa timeline - w prawdziwej implementacji pobierzesz to z API */}
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 italic mb-3">
                    đź’ˇ PoniĹĽej zobaczysz wszystkie wizyty powiÄ…zane z tym zleceniem
                  </div>
                  
                  {/* Wizyta obecna (przykĹ‚ad) */}
                  <div className={`p-4 rounded-lg border-2 ${
                    order.visitNumber === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">
                        {order.visitType === 'diagnosis' ? 'đź”Ť Diagnoza' : 
                         order.visitType === 'repair' ? 'đź”§ Naprawa' :
                         order.visitType === 'control' ? 'âś… Kontrola' :
                         'đź“‹ Wizyta'} #{order.visitNumber || 1}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'completed' ? 'âś… ZakoĹ„czona' :
                         order.status === 'scheduled' ? 'đź“… Zaplanowana' :
                         order.status === 'in_progress' ? 'đź”„ W trakcie' :
                         order.status}
                      </span>
                    </div>
                    
                    {order.scheduledDate && (
                      <p className="text-sm text-gray-600 mb-1">
                        đź“… {new Date(order.scheduledDate).toLocaleDateString('pl-PL')}
                        {order.scheduledTime && ` o ${order.scheduledTime}`}
                      </p>
                    )}
                    
                    {order.technicianName && (
                      <p className="text-sm text-gray-600">
                        đź‘¤ Technik: {order.technicianName}
                      </p>
                    )}

                    {order.visitNumber === 1 && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-xs text-blue-700">
                          đźŽŻ <strong>To jest wizyta, ktĂłrÄ… obecnie przeglÄ…dasz</strong>
                        </p>
                      </div>
                    )}

                    {/* Szybka akcja - Edytuj wizytÄ™ */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          const orderId = order.orderId || order.id;
                          router.push(`/zlecenie-szczegoly?id=${orderId}`);
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edytuj
                      </button>
                      {order.status !== 'completed' && (
                        <button
                          onClick={() => {
                            alert('Funkcja oznaczania wizyty jako zakoĹ„czonej - wkrĂłtce!');
                          }}
                          className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          ZakoĹ„cz
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Placeholder dla przyszĹ‚ych wizyt */}
                  <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-600">
                        âž• Dodaj kolejnÄ… wizytÄ™
                      </span>
                      <button 
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                        onClick={() => {
                          // OtwĂłrz stronÄ™ edycji zlecenia, gdzie moĹĽna dodaÄ‡ wizytÄ™
                          const orderId = order.orderId || order.id;
                          router.push(`/zlecenie-szczegoly?id=${orderId}&action=add-visit`);
                        }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Dodaj wizytÄ™
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      MoĹĽesz zaplanowaÄ‡ np. naprawÄ™ po diagnozie lub wizytÄ™ kontrolnÄ…
                    </p>
                  </div>
                </div>

                {/* Info box */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>â„ąď¸Ź Jak to dziaĹ‚a:</strong> Jedno zlecenie moĹĽe mieÄ‡ wiele wizyt. 
                    Klient dzwoni â†’ tworzymy zlecenie â†’ planujemy wizyty (diagnoza, naprawa, kontrola). 
                    Inteligentny planer optymalizuje WIZYTY, nie zlecenia.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-lg border-t flex justify-end gap-3">
            <button
              onClick={() => setShowOrderDetailsModal(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Zamknij
            </button>
            <button
              onClick={() => {
                logger.success('đź”§ Przekierowanie do edycji zlecenia:', order.orderId || order.id);
                // Przekieruj do strony szczegĂłĹ‚Ăłw/edycji zlecenia
                const orderId = order.orderId || order.id;
                router.push(`/zlecenie-szczegoly?id=${orderId}`);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edytuj zlecenie
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* đź†• Modal ze szczegĂłĹ‚ami zlecenia */}
      <OrderDetailsModal />
      {/* Powiadomienia */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg border max-w-sm transition-all duration-300 ${
                notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleTimeString('pl-PL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  âś•
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                Inteligentny Planer Tygodniowy
              </h1>
              <p className="text-gray-600 mt-1">
                Planowanie wizyt z uwzglÄ™dnieniem dostÄ™pnoĹ›ci klientĂłw i priorytetĂłw
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Przycisk wyboru serwisanta przeniesiony do sekcji nieprzypisanych zleceĹ„ */}
            </div>
          </div>
          
          {/* Aktualna lokalizacja startowa */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Punkt startowy:</span>
                <span className="text-sm text-gray-900">{startLocation.address}</span>
                {startLocation.isDetected && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    đź“Ť Wykryto automatycznie
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Panel ustawieĹ„ godzin pracy */}
          <div className="mt-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Godziny Pracy - {availableServicemen.find(s => s.id === currentServiceman)?.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RozpoczÄ™cie pracy
                </label>
                <input
                  type="time"
                  value={optimizationPreferences.workingHours.start}
                  onChange={(e) => setOptimizationPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZakoĹ„czenie pracy
                </label>
                <input
                  type="time"
                  value={optimizationPreferences.workingHours.end}
                  onChange={(e) => setOptimizationPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max godzin dziennie
                </label>
                <select
                  value={optimizationPreferences.workingHours.maxWorkingHours}
                  onChange={(e) => setOptimizationPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, maxWorkingHours: parseInt(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value={8}>8 godzin</option>
                  <option value={10}>10 godzin</option>
                  <option value={12}>12 godzin</option>
                  <option value={14}>14 godzin</option>
                </select>
              </div>
            </div>
            <div className="mt-3 text-xs text-orange-600">
              âš ď¸Ź System zapewni, ĹĽe harmonogram nie przekroczy tych limitĂłw podczas przenoszenia zleceĹ„
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Analiza kosztĂłw */}
        {weeklyPlan.costAnalysis && weeklyPlan.costAnalysis.optimized && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Analiza KosztĂłw i OszczÄ™dnoĹ›ci
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {weeklyPlan.costAnalysis.savings}zĹ‚
                </div>
                <div className="text-sm text-gray-600">OszczÄ™dnoĹ›ci</div>
                <div className="text-xs text-green-600 font-medium">
                  {weeklyPlan.costAnalysis.savingsPercentage}% taniej
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {weeklyPlan.costAnalysis.optimized.totalDistance}km
                </div>
                <div className="text-sm text-gray-600">CaĹ‚kowity dystans</div>
                <div className="text-xs text-blue-600 font-medium">
                  {weeklyPlan.costAnalysis.optimized.totalFuelCost}zĹ‚ paliwa
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {weeklyPlan.costAnalysis.optimized.totalRevenue}zĹ‚
                </div>
                <div className="text-sm text-gray-600">PrzychĂłd</div>
                <div className="text-xs text-purple-600 font-medium">
                  {weeklyPlan.costAnalysis.optimized.profit}zĹ‚ zysku
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {weeklyPlan.costAnalysis.efficiency}%
                </div>
                <div className="text-sm text-gray-600">EfektywnoĹ›Ä‡</div>
                <div className="text-xs text-orange-600 font-medium">
                  MarĹĽa zysku
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rekomendacje */}
        {weeklyPlan.recommendations && weeklyPlan.recommendations.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Rekomendacje Systemu
            </h2>
            <div className="space-y-3">
              {weeklyPlan.recommendations.map((rec, idx) => (
                <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-400' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${
                      rec.type === 'warning' ? 'text-yellow-600' :
                      rec.type === 'optimization' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {rec.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                       rec.type === 'optimization' ? <TrendingUp className="h-4 w-4" /> :
                       <CheckCircle className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nawigacja tygodniowa */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const newWeekStart = new Date(currentWeekStart);
                newWeekStart.setDate(currentWeekStart.getDate() - 7);
                setCurrentWeekStart(newWeekStart);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Poprzedni tydzieĹ„
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                TydzieĹ„ {currentWeekStart.toLocaleDateString('pl-PL', { 
                  day: '2-digit', 
                  month: '2-digit',
                  year: 'numeric'
                })} - {(() => {
                  const weekEnd = new Date(currentWeekStart);
                  weekEnd.setDate(currentWeekStart.getDate() + 6);
                  return weekEnd.toLocaleDateString('pl-PL', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: 'numeric'
                  });
                })()}
              </h2>
              <p className="text-sm text-gray-600">
                {(() => {
                  const today = new Date();
                  const weekStart = new Date(currentWeekStart);
                  weekStart.setHours(0, 0, 0, 0);
                  today.setHours(0, 0, 0, 0);
                  
                  if (weekStart.getTime() === today.getTime() - (today.getDay() === 0 ? 6 : today.getDay() - 1) * 24 * 60 * 60 * 1000) {
                    return "Obecny tydzieĹ„";
                  } else if (weekStart.getTime() > today.getTime()) {
                    return "PrzyszĹ‚y tydzieĹ„";
                  } else {
                    return "Miniony tydzieĹ„";
                  }
                })()}
              </p>
            </div>
            
            <button
              onClick={() => {
                const newWeekStart = new Date(currentWeekStart);
                newWeekStart.setDate(currentWeekStart.getDate() + 7);
                setCurrentWeekStart(newWeekStart);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              NastÄ™pny tydzieĹ„
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Toolbar z opcjami widoku */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col gap-4">
            {/* Pierwsza linia: Widok i podstawowe opcje */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Widok:</span>
                <div className="flex border rounded-lg overflow-hidden">
                  {[1, 2, 3, 4, 5, 7].map(cols => (
                    <button
                      key={cols}
                      onClick={() => setViewMode(cols)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        viewMode === cols 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      title={`${cols} ${cols === 1 ? 'kolumna' : cols < 5 ? 'kolumny' : 'kolumn'}`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zakres godzin timeline */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Godziny:</span>
                <select
                  value={`${timeRange.start}-${timeRange.end}`}
                  onChange={(e) => {
                    const [start, end] = e.target.value.split('-').map(Number);
                    setTimeRange({ start, end });
                  }}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Wybierz zakres godzin wyĹ›wietlanych na osi czasu"
                >
                  <option value="0-24">00:00 - 24:00 (caĹ‚Ä… dobÄ™)</option>
                  <option value="6-23">06:00 - 23:00 (domyĹ›lnie)</option>
                  <option value="7-22">07:00 - 22:00 (godziny pracy)</option>
                  <option value="8-20">08:00 - 20:00 (standard)</option>
                  <option value="8-18">08:00 - 18:00 (biznesowe)</option>
                  <option value="9-17">09:00 - 17:00 (biurowe)</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={hideUnusedHours}
                    onChange={(e) => setHideUnusedHours(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    title="Ukryj godziny poza wybranym zakresem (zwiĹ„ timeline)"
                  />
                  <span className="whitespace-nowrap">Ukryj niewykorzystane</span>
                </label>
              </div>
            </div>

            {/* đź”Ť DRUGA LINIA: Zoom Timeline - bardziej widoczny */}
            <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-blue-900">đź”Ť PowiÄ™kszenie osi czasu:</span>
                <button
                  onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
                  className="px-3 py-2 text-sm font-medium bg-white hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors shadow-sm"
                  title="Zmniejsz zoom (pokaĹĽ wiÄ™cej)"
                >
                  â’ Zmniejsz
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.25"
                  value={timelineZoom}
                  onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
                  className="w-32 h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  title="Dostosuj skalÄ™ timeline"
                />
                <button
                  onClick={() => setTimelineZoom(Math.min(3, timelineZoom + 0.25))}
                  className="px-3 py-2 text-sm font-medium bg-white hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors shadow-sm"
                  title="ZwiÄ™ksz zoom (pokaĹĽ szczegĂłĹ‚y)"
                >
                  + PowiÄ™ksz
                </button>
                <span className="text-sm font-bold text-blue-900 min-w-[60px] text-center bg-white px-3 py-2 rounded-lg border border-blue-300 shadow-sm">
                  {timelineZoom.toFixed(2)}x
                </span>
                {timelineZoom !== 1 && (
                  <button
                    onClick={() => setTimelineZoom(1)}
                    className="px-3 py-2 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-100 transition-colors rounded-lg border border-blue-300 bg-white shadow-sm"
                    title="Resetuj zoom do 1x"
                  >
                    â†ş Reset
                  </button>
                )}
              </div>
            </div>

            {/* TRZECIA LINIA: PozostaĹ‚e opcje */}
            <div className="flex flex-wrap items-center gap-4">
              {/* NagĹ‚Ăłwek karty */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">NagĹ‚Ăłwek:</span>
                <select
                  value={cardHeaderField}
                  onChange={(e) => setCardHeaderField(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Wybierz, co ma byÄ‡ wyĹ›wietlane jako nagĹ‚Ăłwek karty zlecenia"
                >
                  <option value="clientName">ImiÄ™ i nazwisko</option>
                  <option value="address">Adres</option>
                  <option value="deviceType">Typ sprzÄ™tu</option>
                  <option value="description">Problem/Opis</option>
                </select>
              </div>

              {/* Sortowanie */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sortuj:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">DomyĹ›lnie</option>
                  <option value="priority">Priorytet</option>
                  <option value="time">Czas realizacji</option>
                  <option value="revenue">WartoĹ›Ä‡ zlecenia</option>
                  <option value="client">Nazwa klienta</option>
                </select>
              </div>

              {/* Filtrowanie */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filtruj:</span>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Wszystkie statusy</option>
                  <option value="pending">âŹł Oczekuje na kontakt</option>
                  <option value="contacted">đź“ž Skontaktowano siÄ™</option>
                  <option value="unscheduled">đź“¦ Nieprzypisane</option>
                  <option value="scheduled">đź“… UmĂłwiona wizyta</option>
                  <option value="confirmed">âś… Potwierdzona</option>
                  <option value="in_progress">đź”§ W trakcie</option>
                  <option value="waiting_parts">đź”© Oczekuje na czÄ™Ĺ›ci</option>
                </select>
              </div>
            </div>

            {/* Statystyki i dodatkowe opcje */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                đź“Š {Object.values(getWeeklyPlanData(weeklyPlan) || {}).reduce((sum, day) => sum + (day?.orders?.length || 0), 0)} zleceĹ„
              </span>
              <span className="flex items-center gap-1">
                đź’° {Object.values(getWeeklyPlanData(weeklyPlan) || {}).reduce((sum, day) => 
                  sum + (day?.orders?.reduce((daySum, order) => daySum + (order.serviceCost || 0), 0) || 0), 0
                )} zĹ‚
              </span>
              {expandedDay && (
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm font-medium">Widok:</span>
                  <select
                    value={ordersPerPage}
                    onChange={(e) => setOrdersPerPage(Number(e.target.value))}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 na stronÄ™</option>
                    <option value={10}>10 na stronÄ™</option>
                    <option value={20}>20 na stronÄ™</option>
                    <option value={50}>50 na stronÄ™</option>
                  </select>
                </div>
              )}
              {expandedDay && (
                <button
                  onClick={() => setExpandedDay(null)}
                  className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                  title="Zamknij rozwiniÄ™ty widok"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Zamknij
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Backdrop dla rozwiniÄ™tego widoku */}
        {expandedDay && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setExpandedDay(null)}
          />
        )}

        {/* Pula niezapisanych zleceĹ„ */}
        {(() => {
          // ZnajdĹş wszystkie zlecenia bez przypisanego dnia (scheduledDate === null)
          const unscheduledOrders = weeklyPlan.unscheduledOrders || [];
          
          // âś… ZAWSZE POKAZUJ SEKCJÄ - nawet gdy pusta (ĹĽeby moĹĽna byĹ‚o przeciÄ…gaÄ‡ zlecenia z powrotem)
          return (
            <div 
              className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow-sm border-2 border-orange-200 h-[300px] flex flex-col"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={async (e) => {
                e.preventDefault();
                if (draggedOrder && draggedOrder.sourceDay !== 'unscheduled') {
                  await moveOrderToUnscheduled(draggedOrder.order, draggedOrder.sourceDay);
                }
              }}
            >
              <div className="flex items-center justify-between p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 text-white rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-orange-900">
                      đź“¦ Niezaplanowane zlecenia ({unscheduledOrders.length})
                    </h2>
                    <p className="text-sm text-orange-700">
                      PrzeciÄ…gnij zlecenie na wybrany dzieĹ„ tygodnia, aby je zaplanowaÄ‡
                    </p>
                  </div>
                </div>
                {/* Selector serwisanta */}
                <div className="relative">
                  <button
                    onClick={() => setShowServicemanSelector(!showServicemanSelector)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Wybierz serwisanta"
                  >
                    <Users className="h-4 w-4" />
                    {availableServicemen.find(s => s.id === currentServiceman)?.name || 'Serwisant'}
                  </button>
                  
                  {showServicemanSelector && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                      <div className="p-3 border-b">
                        <h3 className="font-semibold text-gray-900">Wybierz serwisanta</h3>
                        <p className="text-xs text-gray-600 mt-1">KaĹĽdy serwisant ma osobny planner</p>
                      </div>
                      <div className="p-2">
                        {availableServicemen.map(serviceman => (
                          <button
                            key={serviceman.id}
                            onClick={() => {
                              logger.success('đź”„ Zmieniono serwisanta na:', serviceman.id, serviceman.name);
                              setCurrentServiceman(serviceman.id);
                              setShowServicemanSelector(false);
                              // Oznacz serwisanta jako aktywnego
                              setAvailableServicemen(prev => prev.map(s => ({
                                ...s,
                                isActive: s.id === serviceman.id
                              })));
                              // âś… PrzeĹ‚aduj plan dla nowego serwisanta
                              setTimeout(() => loadIntelligentPlan(), 100);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 ${
                              currentServiceman === serviceman.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: serviceman.color }}
                            ></div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{serviceman.name}</div>
                              <div className="text-xs text-gray-500">
                                {serviceman.isActive ? 'Aktywny' : 'DostÄ™pny'}
                              </div>
                            </div>
                            {currentServiceman === serviceman.id && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    // Automatycznie zaplanuj wszystkie zlecenia
                    showNotification('đź¤– Automatyczne planowanie...', 'info');
                    loadIntelligentPlan();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  title="Automatycznie rozplanuj wszystkie zlecenia"
                >
                  <Bot className="h-4 w-4" />
                  Auto-plan
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto px-4 pb-4 flex-1">
                {unscheduledOrders.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center h-full text-gray-500">
                    <Calendar className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Wszystkie zlecenia zostaĹ‚y zaplanowane! đźŽ‰</p>
                    <p className="text-sm mt-2">PrzeciÄ…gnij zlecenie tutaj aby cofnÄ…Ä‡ planowanie</p>
                  </div>
                ) : (
                  unscheduledOrders.map((order, idx) => (
                  <div
                    key={`grid-unscheduled-${order.id}-${idx}`}
                    className={`p-4 bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all cursor-move ${
                      priorityColors[order.priority] || 'border-gray-300'
                    }`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, order, 'unscheduled')}
                    onDragEnd={handleDragEnd}
                    title="PrzeciÄ…gnij to zlecenie na wybrany dzieĹ„"
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-semibold text-gray-900 text-sm truncate"
                          title={getCardHeaderText(order)}
                        >
                          {getCardHeaderText(order)}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {order.deviceType} {order.brand && `- ${order.brand}`}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                        order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.priority === 'urgent' ? 'đź”Ą Pilne' :
                         order.priority === 'high' ? 'âšˇ Wysokie' :
                         order.priority === 'medium' ? 'đź“Ś Ĺšrednie' :
                         'âś… Niskie'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {order.description || order.problemDescription || 'Brak opisu'}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {order.estimatedDuration || 60} min
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {order.serviceCost || 150} zĹ‚
                      </span>
                    </div>
                    
                    {order.address && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600 truncate" title={order.address}>
                          đź“Ť {order.address}
                        </p>
                      </div>
                    )}
                    
                    {order.preferredDate && (
                      <div className="mt-2 text-xs text-blue-600 font-medium">
                        Preferowana: {new Date(order.preferredDate).toLocaleDateString('pl-PL')}
                      </div>
                    )}
                  </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* Plan tygodniowy z datami */}
        <div className={`grid gap-6 h-[calc(100vh-500px)] ${
          expandedDay ? 'grid-cols-1' : 
          viewMode === 1 ? 'grid-cols-1' :
          viewMode === 2 ? 'grid-cols-1 md:grid-cols-2' :
          viewMode === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          viewMode === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
          viewMode === 5 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-7'
        }`}>
          {Object.keys(dayNames).map(day => {
            const dayPlan = weeklyPlan[day] || { orders: [], stats: {} };
            const dayOrders = getOrdersForWeekDay(day); // đź†• UĹĽyj funkcji filtrujÄ…cej zamiast dayPlan.orders
            const dayInfo = formatDayWithDate(day, currentWeekStart);
            
            return (
              <div key={day} className={`bg-white rounded-lg shadow-sm flex flex-col ${
                dayInfo.isToday ? 'ring-2 ring-blue-400 bg-blue-50' : 
                dayInfo.isPast ? 'opacity-75' : ''
              }`}>
                <div className="p-4 border-b border-gray-200 h-[140px] flex-shrink-0 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-semibold text-lg ${dayInfo.isToday ? 'text-blue-700' : ''}`}>
                        {dayInfo.name}
                      </h3>
                      <p className={`text-sm ${dayInfo.isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        {dayInfo.date}
                        {dayInfo.isToday && <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">DziĹ›</span>}
                        {dayInfo.isPast && <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">PrzeszĹ‚oĹ›Ä‡</span>}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {dayOrders.length} {dayOrders.length === 1 ? 'zlecenie' : 'zleceĹ„'}
                    </span>
                  </div>
                  
                  {dayOrders.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={() => optimizeSingleDay(day)}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-[10px] rounded hover:bg-purple-700 transition-colors whitespace-nowrap"
                        title="Optymalizuj tylko ten dzieĹ„"
                      >
                        <TrendingUp className="h-3 w-3" />
                        <span className="hidden lg:inline">Opt.</span>
                      </button>
                      <button
                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-[10px] rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
                      >
                        <Settings className="h-3 w-3" />
                        <span className="hidden md:inline">{selectedDay === day ? 'Ukryj' : 'Szczeg.'}</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* đź“… Timeline z osiÄ… czasu i zleceniami */}
                {(() => {
                  const schedule = getServicemanScheduleForDay(day, currentServiceman);
                  
                  // Konwersja czasu na procent wysokoĹ›ci (0-100%)
                  const timeToPixels = (time) => {
                    const [h, m] = time.split(':').map(Number);
                    const totalMinutes = h * 60 + m;
                    
                    if (hideUnusedHours) {
                      // Tryb zwiniÄ™ty - mapuj tylko zakres timeRange.start do timeRange.end na 0-100%
                      const rangeMinutes = (timeRange.end - timeRange.start) * 60;
                      const offsetMinutes = totalMinutes - (timeRange.start * 60);
                      return (offsetMinutes / rangeMinutes) * 100;
                    } else {
                      // Tryb peĹ‚ny - mapuj 0-24h na 0-100%
                      return (totalMinutes / (24 * 60)) * 100;
                    }
                  };
                  
                  // Pobierz czas rozpoczÄ™cia wizyty z zlecenia
                  const getOrderStartTime = (order) => {
                    // SprawdĹş czy zlecenie ma zapisany czas wizyty
                    if (order.scheduledTime) return order.scheduledTime;
                    if (order.preferredTime) return order.preferredTime;
                    // JeĹ›li brak - uĹĽyj domyĹ›lnego (8:00)
                    return '08:00';
                  };
                  
                  const getOrderDuration = (order) => {
                    return order.estimatedDuration || 60; // minuty
                  };
                  
                  // Oblicz czas zakoĹ„czenia
                  const getOrderEndTime = (order) => {
                    const startTime = getOrderStartTime(order);
                    const duration = getOrderDuration(order);
                    const [h, m] = startTime.split(':').map(Number);
                    const totalMinutes = h * 60 + m + duration;
                    const endH = Math.floor(totalMinutes / 60);
                    const endM = totalMinutes % 60;
                    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                  };
                  
                  // Funkcja do obsĹ‚ugi upuszczenia zlecenia na timeline (zmiana godziny/dnia)
                  const handleTimelineDrop = async (e, targetDay, mouseY) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!draggedOrder) return;
                    
                    // Oblicz godzinÄ™ na podstawie pozycji Y myszy
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relativeY = mouseY - rect.top;
                    const percentY = (relativeY / rect.height) * 100;
                    
                    let totalMinutes;
                    if (hideUnusedHours) {
                      // Tryb zwiniÄ™ty - mapuj 0-100% na zakres timeRange
                      const rangeMinutes = (timeRange.end - timeRange.start) * 60;
                      totalMinutes = (timeRange.start * 60) + (percentY / 100) * rangeMinutes;
                    } else {
                      // Tryb peĹ‚ny - mapuj 0-100% na 0-24h
                      totalMinutes = (percentY / 100) * 24 * 60;
                    }
                    
                    const hour = Math.floor(totalMinutes / 60);
                    const minute = Math.floor((totalMinutes % 60) / 15) * 15; // ZaokrÄ…glij do 15 min
                    const newTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    
                    logger.success(`đź“Ť Upuszczono zlecenie na ${targetDay} o godzinie ${newTime}`);
                    
                    // Aktualizuj zlecenie z nowÄ… datÄ… i godzinÄ…
                    const targetDate = getDateForDay(targetDay);
                    // đź”§ FIX: UĹĽyj lokalnej daty zamiast UTC
                    const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
                    
                    // đź¤– AUTO-KALKULACJA: Oblicz czas gdy upuszczamy zlecenie na timeline
                    let autoCalculatedTime = null;
                    let employee = null; // đź‘· Deklaracja na wyĹĽszym poziomie ĹĽeby byĹ‚a dostÄ™pna w try-catch
                    
                    if (currentServiceman && draggedOrder.order.deviceType) {
                      logger.success('đź”Ť DEBUG availableServicemen count:', availableServicemen.length);
                      logger.success('đź”Ť DEBUG currentServiceman ID:', currentServiceman);
                      employee = availableServicemen.find(e => e.id === currentServiceman);
                      logger.success('đź”Ť DEBUG znaleziony employee (JSON):', JSON.stringify(employee, null, 2));
                      if (employee) {
                        logger.success('đź”Ť DEBUG employee.repairTimes:', employee.repairTimes);
                        logger.success('đź”Ť DEBUG typeof repairTimes:', typeof employee.repairTimes);
                        logger.success('đź”Ť DEBUG keys repairTimes:', employee.repairTimes ? Object.keys(employee.repairTimes) : 'BRAK');
                        autoCalculatedTime = calculateEstimatedDuration(draggedOrder.order, employee);
                        if (autoCalculatedTime) {
                          logger.success(`âŹ±ď¸Ź Auto-obliczono czas dla "${draggedOrder.order.clientName}": ${autoCalculatedTime}min (pracownik: ${employee.name})`);
                        }
                      } else {
                        console.warn(`âš ď¸Ź NIE ZNALEZIONO pracownika o ID: ${currentServiceman}`);
                      }
                    }
                    
                    // âś… OPTYMISTYCZNA AKTUALIZACJA STANU (przed zapisem do API)
                    const updatedOrder = {
                      ...draggedOrder.order,
                      scheduledDate: dateStr,
                      scheduledTime: newTime,
                      assignedTo: currentServiceman,
                      estimatedDuration: autoCalculatedTime || draggedOrder.order.estimatedDuration
                    };
                    
                    // âś… Aktualizuj stan lokalny natychmiast - NOWA STRUKTURA
                    setWeeklyPlan(prevPlan => {
                      const newPlan = { ...prevPlan };
                      
                      // UsuĹ„ ze starego miejsca
                      if (draggedOrder.sourceDay === 'unscheduled') {
                        newPlan.unscheduledOrders = newPlan.unscheduledOrders.filter(o => o.id !== draggedOrder.order.id);
                      } else if (draggedOrder.sourceDay && newPlan[draggedOrder.sourceDay]) {
                        // UsuĹ„ z dnia ĹşrĂłdĹ‚owego
                        const sourceOrders = [...(newPlan[draggedOrder.sourceDay].orders || [])];
                        newPlan[draggedOrder.sourceDay].orders = sourceOrders.filter(o => o.id !== draggedOrder.order.id);
                      }
                      
                      // Dodaj do docelowego dnia w weeklyPlan[targetDay].orders
                      if (newPlan[targetDay]) {
                        const targetOrders = [...(newPlan[targetDay].orders || [])];
                        newPlan[targetDay].orders = [...targetOrders, updatedOrder];
                      }
                      
                      return newPlan;
                    });
                    
                    try {
                      logger.success(`đź’ľ ZapisujÄ™ zlecenie do bazy:`, {
                        orderId: draggedOrder.order.id,
                        scheduledDate: dateStr,
                        scheduledTime: newTime,
                        assignedTo: currentServiceman,
                        estimatedDuration: autoCalculatedTime || draggedOrder.order.estimatedDuration
                      });
                      
                      const response = await fetch(`/api/orders/${draggedOrder.order.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          scheduledDate: dateStr,
                          scheduledTime: newTime,
                          assignedTo: currentServiceman, // đź‘· Przypisz do serwisanta
                          estimatedDuration: autoCalculatedTime || draggedOrder.order.estimatedDuration, // âŹ±ď¸Ź Zapisz obliczony czas
                          status: 'scheduled' // đź“… Ustaw status na "zaplanowane"
                        })
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        logger.success(`âś… Zlecenie zapisane w bazie:`, result);
                        showNotification(`âś… Zlecenie przypisane do ${employee?.name || 'serwisanta'} na ${targetDay} o ${newTime}`, 'success');
                        // Nie Ĺ‚aduj ponownie caĹ‚ego planu - juĹĽ zaktualizowaliĹ›my lokalnie
                      } else {
                        const errorText = await response.text();
                        console.error(`âťŚ BĹ‚Ä…d API (${response.status}):`, errorText);
                        // JeĹ›li API zwrĂłciĹ‚o bĹ‚Ä…d, cofnij zmiany
                        showNotification('âťŚ Nie udaĹ‚o siÄ™ zapisaÄ‡ zmian', 'error');
                        await loadIntelligentPlan(); // PrzywrĂłÄ‡ z API
                      }
                    } catch (error) {
                      console.error('âťŚ BĹ‚Ä…d aktualizacji zlecenia:', error);
                      showNotification('âťŚ Nie udaĹ‚o siÄ™ przenieĹ›Ä‡ zlecenia', 'error');
                      await loadIntelligentPlan(); // PrzywrĂłÄ‡ z API
                    }
                    
                    setDraggedOrder(null);
                    setIsDragging(false);
                    setDragOverInfo(null);
                  };
                  
                  return (
                    <div 
                      className="flex-1 bg-gray-50 border-b border-gray-200 overflow-y-auto"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // PokaĹĽ podglÄ…d gdzie zlecenie zostanie upuszczone
                        if (isDragging) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const relativeY = e.clientY - rect.top;
                          const percentY = (relativeY / rect.height) * 100;
                          
                          let totalMinutes;
                          if (hideUnusedHours) {
                            // Tryb zwiniÄ™ty
                            const rangeMinutes = (timeRange.end - timeRange.start) * 60;
                            totalMinutes = (timeRange.start * 60) + (percentY / 100) * rangeMinutes;
                          } else {
                            // Tryb peĹ‚ny
                            totalMinutes = (percentY / 100) * 24 * 60;
                          }
                          
                          const hour = Math.floor(totalMinutes / 60);
                          const minute = Math.floor((totalMinutes % 60) / 15) * 15;
                          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                          
                          setDragOverInfo({ y: percentY, time, day });
                        }
                      }}
                      onDragLeave={() => setDragOverInfo(null)}
                      onDrop={(e) => {
                        handleTimelineDrop(e, day, e.clientY);
                        setDragOverInfo(null);
                      }}
                    >
                      {/* WewnÄ™trzny kontener z peĹ‚nÄ… wysokoĹ›ciÄ… dla pozycjonowania absolute */}
                      <div 
                        className="relative w-full"
                        style={{ height: `${1600 * timelineZoom}px` }}
                      >
                      {/* Linia podglÄ…du podczas przeciÄ…gania */}
                      {dragOverInfo && dragOverInfo.day === day && (
                        <div
                          className="absolute w-full border-t-2 border-dashed border-purple-500 z-30 pointer-events-none"
                          style={{ top: `${dragOverInfo.y}%` }}
                        >
                          <span className="absolute right-2 -top-3 text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded shadow-sm">
                            đź“Ť {dragOverInfo.time}
                          </span>
                        </div>
                      )}
                      {/* Siatka godzin - dynamiczny zakres z liniami co 30 min */}
                      {Array.from({ length: (timeRange.end - timeRange.start) * 2 }, (_, i) => {
                        const totalMinutes = (timeRange.start * 60) + (i * 30); // Start at selected hour, increment by 30 min
                        const h = Math.floor(totalMinutes / 60);
                        const m = totalMinutes % 60;
                        const isFullHour = m === 0;
                        
                        // Oblicz pozycjÄ™ - w trybie zwiniÄ™tym mapuj na 0-100%, w peĹ‚nym na pozycjÄ™ w dobie
                        let positionPercent;
                        if (hideUnusedHours) {
                          // Tryb zwiniÄ™ty - linie rĂłwnomiernie rozĹ‚oĹĽone 0-100%
                          positionPercent = (i / ((timeRange.end - timeRange.start) * 2)) * 100;
                        } else {
                          // Tryb peĹ‚ny - pozycja wzglÄ™dem caĹ‚ej doby (0-24h)
                          positionPercent = (totalMinutes / (24 * 60)) * 100;
                        }
                        
                        return (
                          <div
                            key={`grid-${h}-${m}`}
                            className={`absolute w-full pointer-events-none ${
                              isFullHour ? 'border-t-2 border-gray-300' : 'border-t border-gray-200 border-dashed'
                            }`}
                            style={{ top: `${positionPercent}%` }}
                          >
                            {isFullHour && (
                              <span className="text-[11px] text-gray-600 ml-1 bg-gray-50 px-1.5 py-0.5 font-semibold rounded shadow-sm">
                                {h.toString().padStart(2, '0')}:00
                              </span>
                            )}
                            {!isFullHour && (
                              <span className="text-[9px] text-gray-400 ml-1 bg-gray-50/80 px-1">
                                {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Przyciemnienie godzin poza zakresem - tylko w trybie peĹ‚nym */}
                      {!hideUnusedHours && timeRange.start > 0 && (
                        <div 
                          className="absolute w-full bg-gray-900 opacity-10 pointer-events-none z-10"
                          style={{
                            top: 0,
                            height: `${(timeRange.start / 24) * 100}%`
                          }}
                          title={`Ukryto godziny: 00:00 - ${timeRange.start.toString().padStart(2, '0')}:00`}
                        />
                      )}
                      {!hideUnusedHours && timeRange.end < 24 && (
                        <div 
                          className="absolute w-full bg-gray-900 opacity-10 pointer-events-none z-10"
                          style={{
                            top: `${(timeRange.end / 24) * 100}%`,
                            height: `${((24 - timeRange.end) / 24) * 100}%`
                          }}
                          title={`Ukryto godziny: ${timeRange.end.toString().padStart(2, '0')}:00 - 24:00`}
                        />
                      )}
                      
                      {/* TĹ‚o dostÄ™pnoĹ›ci serwisanta (pĂłĹ‚przezroczyste zielone) */}
                      {schedule && schedule.workSlots && schedule.workSlots.map((slot, idx) => (
                        <div
                          key={`work-${day}-${idx}`}
                          className="absolute w-full bg-green-100 opacity-30 pointer-events-none"
                          style={{
                            top: `${timeToPixels(slot.startTime)}%`,
                            height: `${timeToPixels(slot.endTime) - timeToPixels(slot.startTime)}%`
                          }}
                        />
                      ))}
                      
                      {/* Przerwy serwisanta (pĂłĹ‚przezroczyste pomaraĹ„czowe) */}
                      {schedule && schedule.breaks && schedule.breaks.map((breakSlot, idx) => (
                        <div
                          key={`break-${day}-${idx}`}
                          className="absolute w-full bg-orange-200 opacity-40 pointer-events-none"
                          style={{
                            top: `${timeToPixels(breakSlot.startTime)}%`,
                            height: `${timeToPixels(breakSlot.endTime) - timeToPixels(breakSlot.startTime)}%`
                          }}
                        />
                      ))}
                      
                      {/* đź• LINIA AKTUALNEJ GODZINY */}
                      {(() => {
                        const now = currentTime;
                        const currentHour = now.getHours();
                        const currentMinute = now.getMinutes();
                        const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                        
                        // SprawdĹş czy aktualna godzina jest w zakresie wyĹ›wietlanym
                        const isInRange = currentHour >= timeRange.start && currentHour < timeRange.end;
                        
                        if (!isInRange && hideUnusedHours) {
                          return null; // Nie pokazuj linii jeĹ›li jest poza zakresem w trybie zwiniÄ™tym
                        }
                        
                        const currentPosition = timeToPixels(currentTimeString);
                        
                        return (
                          <div
                            key={`current-time-${day}`}
                            className="absolute w-full pointer-events-none z-30"
                            style={{ top: `${currentPosition}%` }}
                          >
                            {/* Czerwona linia */}
                            <div className="absolute w-full h-0.5 bg-red-500 shadow-lg"></div>
                            {/* Czerwony kĂłĹ‚ko po lewej */}
                            <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                            {/* Etykieta z czasem */}
                            <div className="absolute left-4 -top-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">
                              TERAZ {currentTimeString}
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* ZLECENIA na timeline - PRZECIÄ„GALNE */}
                      {dayOrders.map((order) => {
                        const startTime = getOrderStartTime(order);
                        const endTime = getOrderEndTime(order);
                        const duration = getOrderDuration(order);
                        const heightPercent = timeToPixels(endTime) - timeToPixels(startTime);
                        
                        // đź”§ FIX: UĹĽyj pikseli zamiast procentĂłw, ĹĽeby przewijaĹ‚y siÄ™ razem z siatkÄ…
                        const containerHeight = 1600 * timelineZoom; // CaĹ‚kowita wysokoĹ›Ä‡ kontenera
                        const topPx = (timeToPixels(startTime) / 100) * containerHeight;
                        const heightPx = Math.max(50, (heightPercent / 100) * containerHeight);
                        
                        return (
                          <div
                            key={`timeline-${day}-${order.id}`}
                            className="absolute w-full px-2 z-20 cursor-move group"
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              minHeight: '50px' // Minimum dla czytelnoĹ›ci
                            }}
                            title={`${startTime} - ${endTime} (${duration} min)\nPrzeciÄ…gnij aby zmieniÄ‡ godzinÄ™ lub dzieĹ„`}
                            draggable={true}
                            onDragStart={(e) => {
                              handleDragStart(e, order, day);
                              e.currentTarget.style.opacity = '0.5';
                            }}
                            onDragEnd={(e) => {
                              handleDragEnd(e);
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            <div className={`h-full rounded-lg shadow-lg border-4 p-2 bg-white group-hover:shadow-xl transition-all overflow-hidden cursor-move ${
                              order.priority === 'urgent' ? 'border-red-500 bg-red-200' :
                              order.priority === 'high' ? 'border-orange-500 bg-orange-200' :
                              order.priority === 'medium' ? 'border-yellow-500 bg-yellow-200' :
                              'border-blue-500 bg-blue-200'
                            }`}>
                              {/* Ikona przeciÄ…gania */}
                              <div className="absolute top-1 right-1 text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                â‹®â‹®
                              </div>
                              
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex-1 min-w-0">
                                  <h4 
                                    className="font-semibold text-xs truncate" 
                                    title={getCardHeaderText(order)}
                                  >
                                    {getCardHeaderText(order)}
                                  </h4>
                                  
                                  {/* Badge'y z numerami */}
                                  <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                    <span className="text-[8px] font-mono bg-blue-100 text-blue-700 px-1 rounded" title="Numer zlecenia">
                                      đź”˘ {order.orderNumber || order.visitId || `ORD-${order.id}`}
                                    </span>
                                    <span className="text-[8px] font-mono bg-purple-100 text-purple-700 px-1 rounded" title="ID klienta">
                                      đź‘¤ {order.clientId || order.customerId || 'BRAK'}
                                    </span>
                                    {order.visits && order.visits.length > 0 && (
                                      <span className="text-[8px] font-mono bg-green-100 text-green-700 px-1 rounded" title={`Wizyty: ${order.visits.map(v => v.visitId || v.id).join(', ')}`}>
                                        đź“… {order.visits.length}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Przyciski akcji */}
                                  {heightPercent > 5 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      {/* Dropdown zmiany technika */}
                                      {availableServicemen.length > 1 && (
                                        <select
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={async (e) => {
                                            e.stopPropagation();
                                            const newTechnicianId = e.target.value;
                                            if (newTechnicianId && newTechnicianId !== currentServiceman) {
                                              const scheduledDate = order.scheduledDate || day;
                                              try {
                                                const response = await fetch(`/api/orders/${order.id}`, {
                                                  method: 'PATCH',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ 
                                                    assignedTo: newTechnicianId,
                                                    scheduledDate: scheduledDate
                                                  })
                                                });
                                                if (response.ok) {
                                                  showNotification(`âś… Przeniesiono do innego technika`, 'success');
                                                  setTimeout(() => loadIntelligentPlan(), 500);
                                                }
                                              } catch (error) {
                                                console.error('BĹ‚Ä…d:', error);
                                                showNotification(`âťŚ BĹ‚Ä…d zmiany technika`, 'error');
                                              }
                                            }
                                          }}
                                          className="text-[8px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer border-0"
                                          value={currentServiceman}
                                        >
                                          <option value="">đź‘¤ ZmieĹ„...</option>
                                          {availableServicemen.map(tech => (
                                            <option key={tech.id} value={tech.id}>{tech.name}</option>
                                          ))}
                                        </select>
                                      )}
                                      
                                      {/* Przycisk przeniesienia do nieprzypisanych */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveOrderToUnscheduled(order, day);
                                        }}
                                        className="text-[8px] px-1 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700"
                                        title="PrzenieĹ› do nieprzypisanych"
                                      >
                                        â†©ď¸Ź
                                      </button>
                                    </div>
                                  )}
                                  
                                  <p 
                                    className="text-[10px] text-gray-600 truncate mt-0.5"
                                    title={order.deviceType}
                                  >
                                    {order.deviceType}
                                  </p>
                                </div>
                                <span className="text-sm font-bold ml-1">
                                  {order.priority === 'urgent' ? 'đź”Ą' :
                                   order.priority === 'high' ? 'âšˇ' :
                                   order.priority === 'medium' ? 'đź“Ś' : 'âś…'}
                                </span>
                              </div>
                              
                              <div className="text-[10px] text-gray-700 font-bold bg-white/50 rounded px-1 py-0.5 inline-block">
                                đź•’ {startTime} - {endTime}
                              </div>
                              
                              <div className="text-[9px] text-gray-600 mt-1">
                                âŹ±ď¸Ź {duration} min
                              </div>
                              
                              {order.address && heightPercent > 4 && (
                                <div className="text-[8px] text-gray-500 mt-1 truncate" title={order.address}>
                                  đź“Ť {order.address}
                                </div>
                              )}
                              
                              {/* WskazĂłwka przy hover */}
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white/80 px-1 rounded">
                                PrzeciÄ…gnij â†•ď¸Ź lub â†”ď¸Ź
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                      {/* ZamkniÄ™cie wewnÄ™trznego kontenera z relative */}
                    </div>
                  );
                })()}
                
                {/* Statystyki dnia (pod timeline) */}
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  {dayOrders.length === 0 ? (
                    <div className="text-center text-xs text-gray-500">
                      {isDragging 
                        ? `đź“¦ PrzeciÄ…gnij "${draggedOrder?.order?.clientName}" na timeline` 
                        : 'Brak zleceĹ„ - przeciÄ…gnij zlecenie z puli nieprzypisanych'
                      }
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>đź“¦ Zlecenia: <strong>{dayOrders.length}</strong></div>
                      <div>âŹ±ď¸Ź ĹÄ…czny czas: <strong>{dayOrders.reduce((sum, o) => sum + (o.estimatedDuration || 60), 0)} min</strong></div>
                      <div>đź’° PrzychĂłd: <strong>{dayOrders.reduce((sum, o) => sum + (o.serviceCost || 150), 0)} zĹ‚</strong></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IntelligentWeekPlanner;

