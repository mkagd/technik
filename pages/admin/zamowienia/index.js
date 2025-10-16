// pages/admin/zamowienia/index.js
// Lista zamówień z filtrowaniem

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useToast } from '../../../contexts/ToastContext';
import { statusToUI } from '../../../utils/fieldMapping';
import { getSmartDistanceService } from '../../../distance-matrix/SmartDistanceService';
import { STATUS_LABELS, STATUS_COLORS, STATUS_ICONS } from '../../../utils/orderStatusConstants';
import { 
  FiEye, FiTrash2, FiEdit, FiSearch, FiFilter, FiX, FiPhone, 
  FiMapPin, FiShoppingBag, FiDownload, FiRefreshCw, FiCalendar, FiTool, FiPlus,
  FiGrid, FiList, FiColumns, FiCheckSquare, FiSquare, FiNavigation, FiHome, FiClock, FiRepeat
} from 'react-icons/fi';

export default function AdminZamowienia() {
  const router = useRouter();
  const toast = useToast();
  
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [sortingByDistance, setSortingByDistance] = useState(false);
  
  // 🚗 SERWIS MOBILNY: Lokalizacja startowa do obliczania tras
  const [startLocation, setStartLocation] = useState({
    type: 'company', // 'company' | 'current' | 'lastClient' | 'custom'
    lat: null,
    lng: null,
    name: 'Siedziba firmy'
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  
  // 🏠 Punkt końcowy (powrót)
  const [endLocation, setEndLocation] = useState({
    type: 'none', // 'none' | 'same-as-start' | 'custom'
    lat: null,
    lng: null,
    name: ''
  });
  const [endCustomAddress, setEndCustomAddress] = useState('');
  const [geocodingEnd, setGeocodingEnd] = useState(false);
  
  // ✅ NOWE: Tryby widoku + bulk actions
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ordersViewMode') || 'cards';
    }
    return 'cards';
  });
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // 🗺️ Optymalizacja trasy dla wielu zleceń
  const [optimizingRoute, setOptimizingRoute] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeOptimizationMode, setRouteOptimizationMode] = useState('shortest'); // 'shortest' | 'fastest'

  const [filters, setFilters] = useState({
    search: '',
    deviceType: '',
    status: '__all__',  // 🔧 Domyślnie pokazuj wszystkie statusy
    dateFrom: '',
    dateTo: '',
    sortBy: 'date-desc'
  });

  // Angielskie wartości w backend, polskie etykiety w UI
  // Statusy z centralnego pliku orderStatusConstants.js
  const orderStatuses = Object.keys(STATUS_LABELS).map(statusKey => ({
    value: statusKey,
    label: STATUS_LABELS[statusKey],
    color: STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-800',
    icon: STATUS_ICONS[statusKey] || '�'
  }));

  // 🛡️ Zabezpieczenie: zawsze upewnij się że orders jest tablicą
  const safeOrders = useMemo(() => {
    return Array.isArray(orders) ? orders : [];
  }, [orders]);

  useEffect(() => {
    loadOrders();
  }, []);

  // Initialize search filter from URL query parameter
  useEffect(() => {
    if (router.isReady && router.query.search) {
      setFilters(prev => ({
        ...prev,
        search: router.query.search
      }));
    }
  }, [router.isReady, router.query.search]);

  useEffect(() => {
    applyFilters();
  }, [safeOrders, filters]);

  useEffect(() => {
    if (showDeleteModal && orderToDelete) {
      console.log('🔴 Delete modal opened for:', {
        id: orderToDelete.id,
        orderNumber: orderToDelete.orderNumber,
        clientName: orderToDelete.clientName
      });
    }
  }, [showDeleteModal, orderToDelete]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('📞 Fetching orders from API...');
      // Dodaj timestamp aby wymusić świeże dane (bez cache)
      const response = await fetch(`/api/orders?_t=${Date.now()}`);
      const data = await response.json();
      
      console.log('📦 API Response:', { 
        ok: response.ok, 
        status: response.status,
        dataType: Array.isArray(data) ? 'array' : 'object',
        hasOrders: !!data.orders,
        count: Array.isArray(data) ? data.length : (data.orders?.length || 0)
      });
      
      if (response.ok) {
        // API może zwrócić tablicę lub obiekt z polem orders/data
        const ordersArray = Array.isArray(data) ? data : (data.orders || data.data || []);
        console.log(`✅ Loaded ${ordersArray.length} orders`);
        console.log('📋 First order:', ordersArray[0]);
        setOrders(ordersArray);
      } else {
        console.error('❌ Błąd pobierania zamówień:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Używamy safeOrders który jest zawsze tablicą
    let filtered = [...safeOrders];

    // 🆕 WORKFLOW: Zamówienia pokazują tylko statusy od 'contacted' wzwyż (bez pending)
    // pending = w rezerwacjach, contacted+ = w zamówieniach
    // '__all__' = wszystkie statusy (też pending)
    // konkretny status = tylko ten status
    if (filters.status === '__all__') {
      // Pokazuj wszystkie statusy włącznie z pending
    } else if (filters.status) {
      // User wybrał konkretny status - pokaż tylko ten
      filtered = filtered.filter(o => o.status === filters.status);
    } else {
      // Brak wyboru = domyślnie ukryj pending (pending są w rezerwacjach)
      filtered = filtered.filter(o => o.status !== 'pending');
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(o => 
        o.clientName?.toLowerCase().includes(searchLower) ||
        o.clientPhone?.includes(filters.search) ||
        o.orderNumber?.toLowerCase().includes(searchLower) ||
        o.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.deviceType) {
      filtered = filtered.filter(o => o.deviceType === filters.deviceType);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(o => o.createdAt >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(o => o.createdAt <= filters.dateTo);
    }

    // Sortowanie po odległości wymaga async - obsługujemy osobno
    if (filters.sortBy === 'distance') {
      sortOrdersByDistance(filtered);
      return;
    }

    // 🗺️ Sortowanie z optymalizacją trasy (nearest neighbor)
    if (filters.sortBy === 'route-optimized') {
      sortOrdersByRouteOptimization(filtered);
      return;
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-asc':
          // Porównanie dat jako timestamp
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'date-desc':
          // Porównanie dat jako timestamp (od najnowszej)
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'client':
          return (a.clientName || '').localeCompare(b.clientName || '');
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  // 🏢 Pobierz lokalizację firmy z API
  const fetchCompanyLocation = async () => {
    try {
      const response = await fetch('/api/settings/company-location');
      if (response.ok) {
        const data = await response.json();
        return {
          lat: data.lat,
          lng: data.lng,
          name: data.name || 'Siedziba firmy'
        };
      }
    } catch (error) {
      console.error('❌ Błąd pobierania lokalizacji firmy:', error);
    }
    // Fallback do Krakowa jeśli nie udało się pobrać
    return { lat: 50.0647, lng: 19.945, name: 'Kraków (domyślnie)' };
  };

  // 🚗 Sortowanie po odległości (async)
  const sortOrdersByDistance = async (ordersToSort, customOrigin = null) => {
    if (sortingByDistance) return; // Prevent double execution
    
    try {
      setSortingByDistance(true);
      console.log('🧭 Sortowanie po odległości...');
      
      const distanceService = getSmartDistanceService();
      
      // 🚗 SERWIS MOBILNY: Użyj customOrigin jeśli podano
      let sorted;
      if (customOrigin) {
        console.log('🚗 Sortowanie z lokalizacji:', customOrigin);
        sorted = await distanceService.sortOrdersByDistance(ordersToSort, customOrigin);
      } else {
        sorted = await distanceService.sortOrdersByDistance(ordersToSort);
      }
      
      console.log('✅ Posortowano zlecenia po odległości');
      setFilteredOrders(sorted);
    } catch (error) {
      console.error('❌ Błąd sortowania po odległości:', error);
      toast?.error('Błąd sortowania po odległości');
      // Fallback do sortowania po dacie
      const fallback = [...ordersToSort].sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setFilteredOrders(fallback);
    } finally {
      setSortingByDistance(false);
    }
  };

  // �️ Sortowanie z optymalizacją trasy (nearest neighbor)
  const sortOrdersByRouteOptimization = async (ordersToSort) => {
    if (sortingByDistance) return; // Prevent double execution
    
    try {
      setSortingByDistance(true);
      console.log('🗺️ Optymalizacja kolejności trasy (nearest neighbor)...');
      
      const distanceService = getSmartDistanceService();
      
      // Pobierz punkt startowy
      const origin = startLocation.lat && startLocation.lng 
        ? { lat: startLocation.lat, lng: startLocation.lng, name: startLocation.name }
        : await fetchCompanyLocation();
      
      // Filtruj tylko zlecenia z GPS
      const ordersWithGPS = ordersToSort.filter(o => 
        o.clientLocation?.coordinates || (o.latitude && o.longitude)
      );
      
      const ordersWithoutGPS = ordersToSort.filter(o => 
        !o.clientLocation?.coordinates && !(o.latitude && o.longitude)
      );
      
      if (ordersWithGPS.length === 0) {
        toast?.warning('Brak zleceń z współrzędnymi GPS');
        setFilteredOrders(ordersToSort);
        return;
      }
      
      // Użyj algorytmu greedy do sortowania (zawsze wybieraj najbliższe)
      const optimized = [];
      const remaining = [...ordersWithGPS];
      let currentPoint = origin;
      
      console.log(`📍 Start: ${origin.name || 'Punkt startowy'}`);
      
      while (remaining.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        
        // Znajdź najbliższe zlecenie z pozostałych
        for (let i = 0; i < remaining.length; i++) {
          const order = remaining[i];
          const destination = order.clientLocation?.coordinates || {
            lat: order.latitude,
            lng: order.longitude
          };
          
          const result = await distanceService.calculateDistance(currentPoint, destination);
          
          if (result.distance.km < nearestDistance) {
            nearestDistance = result.distance.km;
            nearestIndex = i;
          }
        }
        
        // Dodaj najbliższe zlecenie do wyniku
        const nearestOrder = remaining[nearestIndex];
        optimized.push(nearestOrder);
        
        // Ustaw aktualny punkt na to zlecenie
        currentPoint = nearestOrder.clientLocation?.coordinates || {
          lat: nearestOrder.latitude,
          lng: nearestOrder.longitude
        };
        
        // Usuń z pozostałych
        remaining.splice(nearestIndex, 1);
        
        console.log(`  ✅ ${optimized.length}. ${nearestOrder.clientName || nearestOrder.city} (${nearestDistance.toFixed(1)} km)`);
      }
      
      // Dodaj odległości do posortowanych zleceń (od punktu startowego)
      const enriched = [];
      for (const order of optimized) {
        const destination = order.clientLocation?.coordinates || {
          lat: order.latitude,
          lng: order.longitude
        };
        
        const result = await distanceService.calculateDistance(origin, destination);
        
        enriched.push({
          ...order,
          _distance: result.distance.km,
          _distanceText: result.distance.text,
          _duration: result.duration.minutes,
          _durationText: result.duration.text,
          _alternatives: result.alternatives || 1,
          _routeProvider: result.source || 'osrm'
        });
      }
      
      // Zlecenia bez GPS na końcu
      const final = [...enriched, ...ordersWithoutGPS];
      
      console.log(`✅ Posortowano ${ordersWithGPS.length} zleceń w optymalnej kolejności`);
      toast?.success(`✅ Trasa zoptymalizowana dla ${ordersWithGPS.length} zleceń`);
      
      setFilteredOrders(final);
    } catch (error) {
      console.error('❌ Błąd optymalizacji trasy:', error);
      toast?.error('Błąd optymalizacji trasy');
      // Fallback do sortowania po dacie
      const fallback = [...ordersToSort].sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setFilteredOrders(fallback);
    } finally {
      setSortingByDistance(false);
    }
  };

  // �🚗 SERWIS MOBILNY: Zmiana lokalizacji startowej
  const handleLocationChange = async (type) => {
    try {
      setLoadingLocation(true);
      
      if (type === 'company') {
        // Pobierz lokalizację firmy z API
        const response = await fetch('/api/settings/company-location');
        if (response.ok) {
          const data = await response.json();
          setStartLocation({
            type: 'company',
            lat: data.lat,
            lng: data.lng,
            name: data.name || 'Siedziba firmy'
          });
          toast?.success('📍 Lokalizacja: Siedziba firmy');
        }
      } else if (type === 'current') {
        // Pobierz aktualną lokalizację GPS
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setStartLocation({
                type: 'current',
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                name: 'Moja lokalizacja'
              });
              toast?.success('📍 Używam Twojej aktualnej lokalizacji');
              setLoadingLocation(false);
              
              // Automatycznie przelicz odległości jeśli jest sortowanie GPS
              if (filters.sortBy === 'distance') {
                const origin = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                sortOrdersByDistance(filteredOrders, origin);
              } else if (filters.sortBy === 'route-optimized') {
                applyFilters(); // Przelicz optymalizację trasy
              }
            },
            (error) => {
              console.error('❌ Błąd geolokalizacji:', error);
              toast?.error('Nie można pobrać lokalizacji');
              setLoadingLocation(false);
            }
          );
          return; // Czekaj na callback
        } else {
          toast?.error('Przeglądarka nie obsługuje geolokalizacji');
        }
      } else if (type === 'lastClient') {
        // Znajdź ostatnie zlecenie z GPS
        const lastOrderWithGPS = [...orders]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .find(o => o.latitude && o.longitude);
        
        if (lastOrderWithGPS) {
          setStartLocation({
            type: 'lastClient',
            lat: lastOrderWithGPS.latitude,
            lng: lastOrderWithGPS.longitude,
            name: `Ostatni klient: ${lastOrderWithGPS.clientName || 'Brak nazwy'}`
          });
          toast?.success('📍 Lokalizacja: Ostatni klient');
          
          // Automatycznie przelicz
          if (filters.sortBy === 'distance') {
            const origin = {
              lat: lastOrderWithGPS.latitude,
              lng: lastOrderWithGPS.longitude
            };
            sortOrdersByDistance(filteredOrders, origin);
          } else if (filters.sortBy === 'route-optimized') {
            applyFilters(); // Przelicz optymalizację trasy
          }
        } else {
          toast?.error('Brak zlecenia z GPS');
        }
      }
      
      setLoadingLocation(false);
    } catch (error) {
      console.error('❌ Błąd zmiany lokalizacji:', error);
      toast?.error('Błąd zmiany lokalizacji');
      setLoadingLocation(false);
    }
  };

  // 🚗 Geocoding adresu niestandardowego
  const handleGeocodeCustomAddress = async () => {
    if (!customAddress.trim()) {
      toast?.warning('Wpisz adres');
      return;
    }

    try {
      setGeocoding(true);
      console.log('🔍 Geocoding adresu:', customAddress);

      // Użyj Nominatim (OpenStreetMap) - darmowy
      const encodedAddress = encodeURIComponent(customAddress);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'AGD-Serwis-Mobilny/1.0'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // Lepsze wyciągnięcie nazwy z display_name
        // Nominatim zwraca: "17, Gliniana, Rogatka, Płaszów, Podgórze, Kraków, ..."
        // Strategia: Weź ulicę + miasto (jeśli jest ulica)
        const parts = result.display_name.split(',').map(p => p.trim());
        
        let shortName;
        if (parts.length >= 2) {
          // Jeśli pierwsza część to numer, weź numer + ulicę
          const firstPart = parts[0];
          const secondPart = parts[1];
          
          if (!isNaN(firstPart) && secondPart) {
            // Format: "17, Gliniana" → "Gliniana 17"
            shortName = `${secondPart} ${firstPart}`;
          } else {
            // Format normalny: weź pierwsze 2 części
            shortName = parts.slice(0, 2).join(', ');
          }
          
          // Dodaj miasto jeśli nie ma go w krótkiej nazwie
          const cityPart = parts.find(p => 
            p.includes('Kraków') || 
            p.includes('Tarnów') || 
            p.includes('Mielec') ||
            p.includes('Rzeszów')
          );
          
          if (cityPart && !shortName.includes(cityPart)) {
            shortName = `${shortName}, ${cityPart}`;
          }
        } else {
          shortName = customAddress;
        }

        setStartLocation({
          type: 'custom',
          lat: lat,
          lng: lng,
          name: shortName
        });

        toast?.success(`📍 Znaleziono: ${result.display_name}`);

        // Automatycznie przelicz odległości
        if (filters.sortBy === 'distance') {
          const origin = { lat, lng };
          sortOrdersByDistance(filteredOrders, origin);
        } else if (filters.sortBy === 'route-optimized') {
          applyFilters(); // Przelicz optymalizację trasy
        }
      } else {
        toast?.error('Nie znaleziono adresu');
      }
    } catch (error) {
      console.error('❌ Błąd geocodingu:', error);
      toast?.error('Błąd wyszukiwania adresu');
    } finally {
      setGeocoding(false);
    }
  };

  // 🏠 Geocoding adresu końcowego (powrót)
  const handleGeocodeEndAddress = async () => {
    if (!endCustomAddress.trim()) {
      toast?.warning('Wpisz adres końcowy');
      return;
    }

    try {
      setGeocodingEnd(true);
      console.log('🔍 Geocoding adresu końcowego:', endCustomAddress);

      const encodedAddress = encodeURIComponent(endCustomAddress);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'AGD-Serwis-Mobilny/1.0'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        const parts = result.display_name.split(',').map(p => p.trim());
        let shortName;
        
        if (parts.length >= 2) {
          const firstPart = parts[0];
          const secondPart = parts[1];
          
          if (!isNaN(firstPart) && secondPart) {
            shortName = `${secondPart} ${firstPart}`;
          } else {
            shortName = parts.slice(0, 2).join(', ');
          }
          
          const cityPart = parts.find(p => 
            p.includes('Kraków') || 
            p.includes('Tarnów') || 
            p.includes('Mielec') ||
            p.includes('Rzeszów')
          );
          
          if (cityPart && !shortName.includes(cityPart)) {
            shortName = `${shortName}, ${cityPart}`;
          }
        } else {
          shortName = endCustomAddress;
        }

        setEndLocation({
          type: 'custom',
          lat: lat,
          lng: lng,
          name: shortName
        });

        toast?.success(`🏠 Punkt końcowy: ${result.display_name}`);

        // Przelicz trasę jeśli używamy route-optimized
        if (filters.sortBy === 'route-optimized') {
          applyFilters();
        }
      } else {
        toast?.error('Nie znaleziono adresu końcowego');
      }
    } catch (error) {
      console.error('❌ Błąd geocodingu punktu końcowego:', error);
      toast?.error('Błąd wyszukiwania adresu końcowego');
    } finally {
      setGeocodingEnd(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      deviceType: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date-desc'
    });
  };

  // 🗺️ Optymalizacja trasy dla zaznaczonych zleceń
  const handleOptimizeRoute = async () => {
    if (selectedOrders.size < 2) {
      toast?.warning('Zaznacz minimum 2 zlecenia');
      return;
    }
    
    try {
      setOptimizingRoute(true);
      console.log('🗺️ Optymalizacja trasy dla', selectedOrders.size, 'zleceń');
      
      // Pobierz zaznaczone zlecenia
      const selectedOrdersList = safeOrders.filter(o => selectedOrders.has(o.id));
      
      // Sprawdź czy wszystkie mają GPS
      const ordersWithoutGPS = selectedOrdersList.filter(o => 
        !o.clientLocation?.coordinates && !(o.latitude && o.longitude)
      );
      
      if (ordersWithoutGPS.length > 0) {
        toast?.error(`${ordersWithoutGPS.length} zleceń nie ma współrzędnych GPS`);
        setOptimizingRoute(false);
        return;
      }
      
      // Użyj aktualnej lokalizacji startowej
      const origin = startLocation.lat && startLocation.lng 
        ? startLocation 
        : await (async () => {
            // Pobierz lokalizację firmy jeśli nie ma startLocation
            const response = await fetch('/api/settings/company-location');
            if (response.ok) {
              const data = await response.json();
              return { lat: data.lat, lng: data.lng, name: data.name || 'Siedziba firmy' };
            }
            return { lat: 50.0647, lng: 19.9450, name: 'Siedziba firmy' }; // Fallback
          })();
      
      // Optymalizuj trasę
      const distanceService = getSmartDistanceService();
      
      // 🏠 Sprawdź czy użytkownik wybrał punkt końcowy
      let destination = null;
      let shouldReturnToStart = false;
      
      if (endLocation.type === 'same-as-start') {
        destination = origin;
        shouldReturnToStart = true;
        console.log('🏠 Punkt końcowy: Powrót do punktu startowego');
      } else if (endLocation.type === 'custom' && endLocation.lat && endLocation.lng) {
        destination = endLocation;
        shouldReturnToStart = true;
        console.log('🏠 Punkt końcowy:', endLocation.name);
      } else {
        console.log('➡️ Bez powrotu (tylko w jedną stronę)');
      }
      
      const result = await distanceService.optimizeRoute(
        selectedOrdersList,
        origin,
        {
          mode: routeOptimizationMode, // 'shortest' lub 'fastest'
          returnToStart: shouldReturnToStart,
          destination: destination // Dodaj punkt końcowy
        }
      );
      
      setOptimizedRoute(result);
      setShowRouteModal(true);
      
      toast?.success(`✅ Znaleziono optymalną trasę: ${result.totalDistanceText}, ${result.totalDurationText}`);
      
    } catch (error) {
      console.error('❌ Błąd optymalizacji trasy:', error);
      toast?.error('Błąd optymalizacji trasy: ' + error.message);
    } finally {
      setOptimizingRoute(false);
    }
  };

  const handleView = (id) => {
    router.push(`/admin/zamowienia/${id}`);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const order = safeOrders.find(o => o.id === orderId);
      if (!order) return;

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          reservationId: order.reservationId, // Potrzebne do reverse workflow
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // 🔄 Sprawdź czy zlecenie zostało przeniesione z powrotem do rezerwacji
        if (data.revertedToReservation) {
          toast.success('🔄 Zlecenie przeniesione do Zgłoszeń! Status: Oczekuje na kontakt', 5000);
          await loadOrders();
          
          // Odśwież badge rezerwacji
          if (typeof window !== 'undefined' && window.refreshAdminBadges) {
            await window.refreshAdminBadges();
          }
        } else {
          await loadOrders();
          toast.success('Status zamówienia został zaktualizowany', 3000);
        }
      } else {
        toast.error('Błąd podczas aktualizacji statusu');
      }
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd połączenia z serwerem');
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log(`🗑️ Attempting to delete order:`, { id, type: typeof id });
      const url = `/api/orders?id=${id}`;
      console.log(`📍 DELETE URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      console.log(`📦 Response data:`, data);

      if (response.ok) {
        console.log(`✅ Order ${id} deleted successfully`);
        await loadOrders();
        setShowDeleteModal(false);
        setOrderToDelete(null);
        toast.success('Zamówienie zostało usunięte');
      } else {
        console.error('❌ Delete failed:', data);
        toast.error(data.message || 'Błąd podczas usuwania zamówienia');
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      toast.error('Błąd połączenia z serwerem');
    }
  };

  // ✅ NOWE: Bulk actions
  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleSelectOrder = (id) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedOrders).map(id =>
        fetch(`/api/orders?id=${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      await loadOrders();
      setSelectedOrders(new Set());
      setShowBulkDeleteModal(false);
      toast.success(`Usunięto ${deletePromises.length} zamówień`);
    } catch (error) {
      console.error('Błąd podczas masowego usuwania:', error);
      toast.error('Błąd podczas usuwania zamówień');
    }
  };

  const getStatusInfo = (status) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  // Używamy safeOrders zdefiniowanego wyżej przez useMemo
  const deviceTypes = [...new Set(safeOrders.map(o => o.deviceType).filter(Boolean))];

  return (
    <AdminLayout 
      title="Zamówienia"
      breadcrumbs={[
        { label: 'Zamówienia' }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <p className="text-gray-600 text-sm lg:text-base">
          Zarządzaj zamówieniami serwisowymi - przeglądaj, edytuj i aktualizuj statusy
        </p>
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          {/* ✅ Przełącznik widoku */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white">
            <button
              onClick={() => {
                setViewMode('cards');
                localStorage.setItem('ordersViewMode', 'cards');
              }}
              className={`inline-flex items-center px-2 lg:px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title="Widok kafelków"
            >
              <FiGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('list');
                localStorage.setItem('ordersViewMode', 'list');
              }}
              className={`inline-flex items-center px-2 lg:px-3 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title="Widok listy"
            >
              <FiList className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('table');
                localStorage.setItem('ordersViewMode', 'table');
              }}
              className={`inline-flex items-center px-2 lg:px-3 py-2 text-sm font-medium rounded-r-lg border-l border-gray-300 transition-colors ${
                viewMode === 'table' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title="Widok tabeli"
            >
              <FiColumns className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => router.push('/admin/zamowienia/nowe')}
            className="inline-flex items-center px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <FiPlus className="mr-1 lg:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nowe zlecenie</span>
            <span className="sm:hidden">Nowe</span>
          </button>
          
          <button
            onClick={loadOrders}
            className="inline-flex items-center px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <FiRefreshCw className="mr-1 lg:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Odśwież</span>
          </button>
        </div>
      </div>

      {/* Workflow Info Banner */}
      {filters.status === '' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-green-800">
                <strong>💡 Workflow:</strong> Pokazujesz tylko aktywne zlecenia (status <strong>"Skontaktowano się"</strong> i dalej). 
                Nowe zgłoszenia ze statusem "Oczekuje na kontakt" znajdują się w widoku <strong>Rezerwacje</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj po kliencie, telefonie, nr zamówienia..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            Filtry
            {showFilters ? <FiX className="ml-2 h-4 w-4" /> : null}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urządzenie</label>
              <select
                value={filters.deviceType}
                onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Wszystkie</option>
                {deviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">📞 Aktywne (bez pending)</option>
                <option value="__all__">📋 Wszystkie statusy</option>
                <option disabled>──────────</option>
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.icon} {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data od</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sortuj</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">Najnowsze</option>
                <option value="date-asc">Najstarsze</option>
                <option value="client">Klient A-Z</option>
                <option value="distance">🧭 Od najbliższych (GPS)</option>
                <option value="route-optimized">🗺️ Kolejność trasy (optymalna)</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Wyczyść filtry
              </button>
            </div>

            {/* 🚗 SERWIS MOBILNY: Szybki wybór lokalizacji startowej */}
            {(filters.sortBy === 'distance' || filters.sortBy === 'route-optimized') && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {filters.sortBy === 'route-optimized' ? (
                    <FiNavigation className="h-5 w-5 text-blue-600" />
                  ) : (
                    <FiMapPin className="h-5 w-5 text-blue-600" />
                  )}
                  <span className="text-sm font-semibold text-gray-900">
                    {filters.sortBy === 'route-optimized' 
                      ? 'Optymalizacja trasy - punkt startowy:' 
                      : 'Serwis mobilny - wybierz punkt startowy:'}
                  </span>
                </div>
                <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded">
                  {startLocation.name}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleLocationChange('company')}
                  disabled={loadingLocation}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    startLocation.type === 'company'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FiHome className="h-4 w-4" />
                  Siedziba firmy
                </button>

                <button
                  onClick={() => handleLocationChange('current')}
                  disabled={loadingLocation}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    startLocation.type === 'current'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-green-400 hover:bg-green-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FiNavigation className="h-4 w-4" />
                  {loadingLocation && startLocation.type === 'current' ? 'Pobieram GPS...' : 'Moja lokalizacja'}
                </button>

                <button
                  onClick={() => handleLocationChange('lastClient')}
                  disabled={loadingLocation}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    startLocation.type === 'lastClient'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FiMapPin className="h-4 w-4" />
                  Ostatni klient
                </button>
              </div>

              {/* 🆕 Input do wpisania adresu */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  📍 Lub wpisz adres:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleGeocodeCustomAddress();
                      }
                    }}
                    placeholder="np. Tarnów, ul. Krakowska 10"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={geocoding}
                  />
                  <button
                    onClick={handleGeocodeCustomAddress}
                    disabled={geocoding || !customAddress.trim()}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2 disabled:cursor-not-allowed"
                  >
                    {geocoding ? (
                      <>
                        <div className="animate-spin">⏳</div>
                        Szukam...
                      </>
                    ) : (
                      <>
                        <FiSearch className="h-4 w-4" />
                        Znajdź
                      </>
                    )}
                  </button>
                </div>
                {startLocation.type === 'custom' && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded">
                    ✅ Używam: {startLocation.name}
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-600">
                💡 <strong>Serwis mobilny:</strong> Ustaw punkt startowy, aby zobaczyć najbliższe zlecenia od miejsca, w którym się znajdujesz
              </p>
            </div>
            )}

            {/* 🏠 PUNKT KOŃCOWY (tylko dla route-optimized) */}
            {filters.sortBy === 'route-optimized' && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FiHome className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Punkt końcowy (powrót):
                  </span>
                </div>
                {endLocation.type !== 'none' && (
                  <span className="text-xs text-green-600 bg-white px-2 py-1 rounded">
                    {endLocation.name || 'Ten sam co start'}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEndLocation({ type: 'none', lat: null, lng: null, name: '' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    endLocation.type === 'none'
                      ? 'bg-gray-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <FiX className="h-4 w-4" />
                  Brak (tylko w jedną stronę)
                </button>

                <button
                  onClick={() => {
                    setEndLocation({
                      type: 'same-as-start',
                      lat: startLocation.lat,
                      lng: startLocation.lng,
                      name: startLocation.name
                    });
                    if (filters.sortBy === 'route-optimized') {
                      applyFilters();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    endLocation.type === 'same-as-start'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <FiRepeat className="h-4 w-4" />
                  Taki sam jak start
                </button>
              </div>

              {/* Input do wpisania niestandardowego adresu końcowego */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  🏠 Lub wpisz inny adres powrotu:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={endCustomAddress}
                    onChange={(e) => setEndCustomAddress(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleGeocodeEndAddress();
                      }
                    }}
                    placeholder="np. Kraków, ul. Długa 5"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    disabled={geocodingEnd}
                  />
                  <button
                    onClick={handleGeocodeEndAddress}
                    disabled={geocodingEnd || !endCustomAddress.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2 disabled:cursor-not-allowed"
                  >
                    {geocodingEnd ? (
                      <>
                        <div className="animate-spin">⏳</div>
                        Szukam...
                      </>
                    ) : (
                      <>
                        <FiSearch className="h-4 w-4" />
                        Znajdź
                      </>
                    )}
                  </button>
                </div>
                {endLocation.type === 'custom' && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded">
                    ✅ Powrót do: {endLocation.name}
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-600">
                💡 <strong>Planowanie powrotu:</strong> Jeśli chcesz uwzględnić drogę powrotną w optymalizacji trasy, wybierz punkt końcowy
              </p>
            </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Znaleziono: <span className="font-semibold">{filteredOrders.length}</span> zamówień
            </span>
            {/* 🧭 Sortowanie po odległości - wskaźnik */}
            {sortingByDistance && (
              <span className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded">
                <div className="animate-spin">⏳</div>
                Obliczam odległości...
              </span>
            )}
            {/* ✅ NOWE: Zaznacz wszystko */}
            {filteredOrders.length > 0 && !sortingByDistance && (
              <button
                onClick={handleSelectAll}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              >
                {selectedOrders.size === filteredOrders.length ? (
                  <FiCheckSquare className="h-4 w-4" />
                ) : (
                  <FiSquare className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Zaznacz wszystko</span>
                <span className="sm:hidden">Zaznacz</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs sm:text-sm">
            <span className="whitespace-nowrap">
              Oczekuje: <span className="font-semibold text-yellow-600">
                {safeOrders.filter(o => o.status === 'pending').length}
              </span>
            </span>
            <span className="whitespace-nowrap">
              W trakcie: <span className="font-semibold text-indigo-600">
                {safeOrders.filter(o => o.status === 'in-progress').length}
              </span>
            </span>
            <span className="whitespace-nowrap">
              Zakończone: <span className="font-semibold text-green-600">
                {safeOrders.filter(o => o.status === 'completed').length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ✅ NOWE: Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiCheckSquare className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Zaznaczono: {selectedOrders.size} {selectedOrders.size === 1 ? 'zamówienie' : 'zamówień'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
              >
                Odznacz wszystko
              </button>
              <button
                onClick={handleOptimizeRoute}
                disabled={optimizingRoute || selectedOrders.size < 2}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                title={selectedOrders.size < 2 ? 'Zaznacz minimum 2 zlecenia' : 'Optymalizuj trasę'}
              >
                {optimizingRoute ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Optymalizuję...
                  </>
                ) : (
                  <>
                    <FiNavigation className="h-4 w-4" />
                    Optymalizuj trasę
                  </>
                )}
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <FiTrash2 className="h-4 w-4" />
                Usuń zaznaczone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Ładowanie zamówień...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Brak zamówień</h3>
          <p className="mt-1 text-sm text-gray-500">Nie znaleziono zamówień spełniających kryteria.</p>
        </div>
      ) : viewMode === 'cards' ? (
        // ✅ WIDOK KAFELKÓW
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isSelected = selectedOrders.has(order.id);
            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-all ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
              >
                {/* Checkbox + nagłówek */}
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOrder(order.id)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{order.clientName}</h3>
                    <p className="text-xs text-gray-500">{order.orderNumber}</p>
                  </div>
                  <div className="relative inline-block">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1.5 ${statusInfo.color}`}>
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      title="Kliknij aby zmienić status"
                    >
                      {orderStatuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.icon} {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiTool className="h-4 w-4 mr-2 text-gray-400" />
                    {order.deviceType}
                  </div>
                  <a 
                    href={`tel:${order.clientPhone}`}
                    className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors cursor-pointer"
                  >
                    <FiPhone className="h-4 w-4 mr-2 text-green-500" />
                    {order.clientPhone}
                  </a>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address || order.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors cursor-pointer"
                      title="Pokaż na mapie"
                    >
                      <FiMapPin className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                      <span className="truncate">
                        {order.address || `${order.street || ''}, ${order.city}`.replace(/^,\s*/, '')}
                      </span>
                      {(order.latitude || order.clientLocation) && (
                        <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium flex-shrink-0">
                          GPS
                        </span>
                      )}
                    </a>
                    
                    {/* 🚗 Nawigacja z odległością i czasem */}
                    {order._distanceText && (filters.sortBy === 'distance' || filters.sortBy === 'route-optimized') && (
                      <a
                        href={(() => {
                          // Buduj URL do Google Maps z nawigacją
                          const destination = order.address || `${order.street}, ${order.city}` || order.city;
                          
                          // Jeśli mamy lokalizację startową (nie domyślną firmę), użyj jej jako origin
                          if (startLocation.type !== 'company' || (startLocation.lat && startLocation.lng)) {
                            const origin = `${startLocation.lat},${startLocation.lng}`;
                            return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
                          }
                          
                          // Jeśli nie ma startLocation, użyj "current location" (lokalizacja użytkownika)
                          return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium inline-flex items-center gap-1.5 hover:bg-blue-200 transition-colors cursor-pointer"
                        title="Otwórz nawigację w Google Maps"
                      >
                        <FiNavigation className="h-3 w-3" />
                        <span className="flex items-center gap-1">
                          {order._distanceText}
                          {order._durationText && (
                            <>
                              <span className="text-blue-400">•</span>
                              <FiClock className="h-3 w-3" />
                              {order._durationText}
                            </>
                          )}
                        </span>
                        {order._alternatives > 1 && (
                          <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold" title={`OSRM znalazł ${order._alternatives} trasy, wybrano najkrótszą`}>
                            {order._alternatives}↗
                          </span>
                        )}
                      </a>
                    )}
                  </div>
                  {order.createdAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiCalendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">
                        {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                      <span className="ml-2 text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {order.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{order.description}</p>
                )}

                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleView(order.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <FiEye className="mr-1.5 h-4 w-4" />
                    Zobacz
                  </button>
                  <button
                    onClick={() => handleView(order.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                  >
                    <FiEdit className="mr-1.5 h-4 w-4" />
                    Edytuj
                  </button>
                  <button
                    onClick={() => {
                      setOrderToDelete(order);
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                    title="Usuń zamówienie"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        // ✅ WIDOK LISTY (kompaktowy)
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isSelected = selectedOrders.has(order.id);
            return (
              <div 
                key={order.id}
                className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOrder(order.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  
                  {/* Dane - 4 kolumny */}
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    {/* Kolumna 1: Klient + numer */}
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.clientName}</h3>
                      <p className="text-xs text-gray-500">{order.orderNumber}</p>
                    </div>
                    
                    {/* Kolumna 2: Urządzenie + data */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiTool className="h-3 w-3 text-gray-400" />
                        <span>{order.deviceType}</span>
                      </div>
                      {order.createdAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                        </div>
                      )}
                    </div>
                    
                    {/* Kolumna 3: Kontakt + lokalizacja */}
                    <div className="text-sm">
                      <a href={`tel:${order.clientPhone}`} className="flex items-center gap-1 text-green-600 hover:text-green-700">
                        <FiPhone className="h-3 w-3" />
                        <span>{order.clientPhone}</span>
                      </a>
                      <div className="flex items-center gap-1 text-gray-500 mt-1">
                        <FiMapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate text-xs">
                          {order.address || `${order.street || ''}, ${order.city}`.replace(/^,\s*/, '')}
                        </span>
                      </div>
                      {/* 🚗 Odległość i czas */}
                      {order._distanceText && (filters.sortBy === 'distance' || filters.sortBy === 'route-optimized') && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-600">
                          <FiNavigation className="h-3 w-3" />
                          <span>{order._distanceText}</span>
                          {order._durationText && (
                            <>
                              <span className="text-blue-400">•</span>
                              <FiClock className="h-3 w-3" />
                              <span>{order._durationText}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Kolumna 4: Status */}
                    <div className="relative inline-block">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1.5 ${statusInfo.color}`}>
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.label}</span>
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        title="Kliknij aby zmienić status"
                      >
                        {orderStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.icon} {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Akcje - tylko ikony */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(order.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Zobacz"
                    >
                      <FiEye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleView(order.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Edytuj"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setOrderToDelete(order);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Usuń"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // ✅ WIDOK TABELI
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === filteredOrders.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numer / Klient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urządzenie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokalizacja</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const isSelected = selectedOrders.has(order.id);
                  return (
                    <tr 
                      key={order.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOrder(order.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{order.clientName}</div>
                        <div className="text-xs text-gray-500">{order.orderNumber}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiTool className="h-4 w-4 mr-2 text-gray-400" />
                          {order.deviceType}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a href={`tel:${order.clientPhone}`} className="flex items-center text-sm text-green-600 hover:text-green-700">
                          <FiPhone className="h-4 w-4 mr-2" />
                          {order.clientPhone}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address || order.city)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-purple-600 hover:text-purple-700"
                          title="Pokaż na mapie"
                        >
                          <FiMapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate max-w-xs">
                            {order.address || `${order.street || ''}, ${order.city}`.replace(/^,\s*/, '')}
                          </span>
                        </a>
                        {/* 🚗 Odległość i czas */}
                        {order._distanceText && (filters.sortBy === 'distance' || filters.sortBy === 'route-optimized') && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-600">
                            <FiNavigation className="h-3 w-3" />
                            <span>{order._distanceText}</span>
                            {order._durationText && (
                              <>
                                <span className="text-blue-400">•</span>
                                <FiClock className="h-3 w-3" />
                                <span>{order._durationText}</span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="relative inline-block">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1.5 ${statusInfo.color}`}>
                            <span>{statusInfo.icon}</span>
                            <span>{statusInfo.label}</span>
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            title="Kliknij aby zmienić status"
                          >
                            {orderStatuses.map(status => (
                              <option key={status.value} value={status.value}>
                                {status.icon} {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {order.createdAt && (
                          <>
                            <div className="font-medium">
                              {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(order.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Zobacz"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleView(order.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Edytuj"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setOrderToDelete(order);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Usuń"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🗺️ Route Optimization Modal */}
      {showRouteModal && optimizedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <FiNavigation className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Zoptymalizowana Trasa
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {optimizedRoute.orders.length} {optimizedRoute.orders.length === 1 ? 'punkt' : optimizedRoute.orders.length < 5 ? 'punkty' : 'punktów'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRouteModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {optimizedRoute.totalDistanceText}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Całkowita odległość</div>
                </div>
                <div className="text-center border-x border-blue-200">
                  <div className="text-3xl font-bold text-green-600">
                    {optimizedRoute.totalDurationText}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Całkowity czas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {optimizedRoute.segments.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Przystanki</div>
                </div>
              </div>
            </div>

            {/* Route Segments */}
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FiMapPin className="h-4 w-4" />
                Kolejność przystanków:
              </h4>
              
              <div className="space-y-3">
                {/* Start Point */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FiHome className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-900">🏁 Start</div>
                    <div className="text-sm text-green-700">{startLocation.name}</div>
                  </div>
                </div>

                {/* Route Segments */}
                {optimizedRoute.segments.map((segment, index) => (
                  <div key={index}>
                    {/* Arrow */}
                    <div className="flex items-center gap-3 pl-4 py-1">
                      <div className={`text-sm ${segment.isReturn ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                        {segment.isReturn ? '🏠 ' : '↓ '}{segment.distanceText} • {segment.durationText}
                      </div>
                    </div>
                    
                    {/* Destination */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        segment.isReturn 
                          ? 'bg-green-100' 
                          : 'bg-blue-100'
                      }`}>
                        {segment.isReturn ? (
                          <FiHome className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        )}
                      </div>
                      <div className={`flex-1 rounded-lg p-3 ${
                        segment.isReturn 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-white border border-gray-200 hover:shadow-md'
                      } transition-shadow`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={`font-medium ${segment.isReturn ? 'text-green-900' : 'text-gray-900'}`}>
                              {segment.isReturn && '↩️ '}
                              {segment.to}
                            </div>
                            {segment.order && (
                              <div className="text-sm text-gray-600 mt-1">
                                {segment.order.address || segment.order.city}
                              </div>
                            )}
                            {segment.isReturn && (
                              <div className="text-xs text-green-600 mt-1">
                                Powrót do punktu końcowego
                              </div>
                            )}
                          </div>
                          {segment.order && (
                            <button
                              onClick={() => handleView(segment.order.id)}
                              className="ml-2 px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            >
                              Zobacz
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Tryb optymalizacji:</label>
                  <select
                    value={routeOptimizationMode}
                    onChange={(e) => setRouteOptimizationMode(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="shortest">🏁 Najkrótsza (km)</option>
                    <option value="fastest">⚡ Najszybsza (czas)</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRouteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Zamknij
                  </button>
                  <a
                    href={(() => {
                      // Generuj URL do Google Maps z kolejnymi waypoints
                      const origin = `${startLocation.lat},${startLocation.lng}`;
                      const waypoints = optimizedRoute.orders
                        .map(o => {
                          const lat = o.clientLocation?.coordinates?.lat || o.latitude;
                          const lng = o.clientLocation?.coordinates?.lng || o.longitude;
                          return `${lat},${lng}`;
                        })
                        .join('|');
                      
                      // 🏠 Sprawdź czy jest segment powrotu
                      const returnSegment = optimizedRoute.segments.find(s => s.isReturn);
                      let destination;
                      
                      if (returnSegment && endLocation.type !== 'none') {
                        // Jest powrót - użyj punktu końcowego jako destination
                        destination = `${endLocation.lat},${endLocation.lng}`;
                      } else {
                        // Brak powrotu - użyj ostatniego klienta
                        destination = waypoints.split('|').pop();
                      }
                      
                      const allWaypoints = waypoints.split('|').slice(0, -1).join('|');
                      
                      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${allWaypoints}&travelmode=driving`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <FiMapPin className="h-4 w-4" />
                    Otwórz w Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Potwierdź usunięcie zamówień
                </h3>
                <p className="text-sm text-gray-600">
                  Czy na pewno chcesz usunąć <strong>{selectedOrders.size}</strong> {selectedOrders.size === 1 ? 'zamówienie' : 'zamówień'}? 
                  Ta operacja jest <strong>nieodwracalna</strong>.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <FiTrash2 className="inline-block mr-1.5 h-4 w-4" />
                Usuń {selectedOrders.size} {selectedOrders.size === 1 ? 'zamówienie' : 'zamówień'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Potwierdź usunięcie zamówienia
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Czy na pewno chcesz usunąć to zamówienie? Ta operacja jest <strong>nieodwracalna</strong>.
                </p>
                
                {/* Szczegóły zamówienia */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Numer zamówienia:</span>
                    <span className="text-sm font-semibold text-gray-900">{orderToDelete.orderNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Klient:</span>
                    <span className="text-sm font-medium text-gray-900">{orderToDelete.clientName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Urządzenie:</span>
                    <span className="text-sm text-gray-700">{orderToDelete.deviceType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Status:</span>
                    <span className={`text-xs font-medium rounded-full px-2 py-1 ${getStatusInfo(orderToDelete.status).color}`}>
                      {getStatusInfo(orderToDelete.status).icon} {getStatusInfo(orderToDelete.status).label}
                    </span>
                  </div>
                  {orderToDelete.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Data utworzenia:</span>
                      <span className="text-sm text-gray-700">
                        {new Date(orderToDelete.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(orderToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <FiTrash2 className="inline-block mr-1.5 h-4 w-4" />
                Usuń zamówienie
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
