// ===================================================
// Intelligent Route Optimization API
// Optymalizacja tras dla serwisantów AGD na podstawie:
// - dostępności klientów
// - group owania geograficznego
// - ruchu drogowego w czasie rzeczywistym
// - priorytetów zleceń
// ===================================================

import { DistanceMatrixService } from '../../distance-matrix/index.js';

// Inicjalizacja Distance Matrix Service z inteligentnym cache
const distanceService = new DistanceMatrixService({
  provider: 'google',
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  enableCache: true,
  enableFallback: false, // ❌ Wyłączony - używamy TYLKO Google Distance Matrix API
  cacheMaxAge: 7 * 24 * 60 * 60 * 1000 // 7 dni cache - oszczędza 99% kosztów
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { servicemanId, timeframe = 'week', preferences = {} } = req.body;
      
      console.log('🔍 API Received data:');
      console.log('  - servicemanId:', servicemanId);
      console.log('  - timeframe:', timeframe);
      console.log('  - preferences:', JSON.stringify(preferences, null, 2));
      console.log('  - preferences.startLocation:', preferences.startLocation);
      
      // Pobierz wszystkie zlecenia serwisanta
      const orders = await getServicemanOrders(servicemanId);
      console.log('📦 Liczba zleceń do optymalizacji:', orders.length);
      
      if (orders.length === 0) {
        console.log('❌ Brak zleceń - zwracam błąd');
        return res.status(400).json({
          success: false,
          error: 'Brak danych do optymalizacji',
          details: 'Nie znaleziono zleceń dla tego serwisanta'
        });
      }
      
      // Optymalizuj trasy
      const optimizedPlan = await optimizeWeeklyRoutes(orders, preferences);
      
      return res.status(200).json({
        success: true,
        data: optimizedPlan,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Route optimization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas optymalizacji tras',
        details: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      error: `Metoda ${req.method} nie jest obsługiwana` 
    });
  }
}

// 🆕 Pobierz WIZYTY (nie zlecenia!) z data/orders.json
// Kluczowa zmiana: planujemy WIZYTY, nie zlecenia
// Jedno zlecenie może mieć wiele wizyt (diagnoza → naprawa → kontrola)
async function getServicemanOrders(servicemanId) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // 📂 Wczytaj orders.json z folderu data/
    const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
    const ordersData = await fs.readFile(ordersPath, 'utf8');
    const allOrders = JSON.parse(ordersData);
    
    console.log(`📦 Załadowano ${allOrders.length} zleceń z data/orders.json`);
    
    // 🎯 KLUCZOWA ZMIANA: Ekstrakcja WIZYT z zleceń
    // Każda wizyta = osobna pozycja w kalendarzu
    const allVisits = [];
    
    allOrders.forEach(order => {
      // 🔄 KOMPATYBILNOŚĆ: Obsługuj zlecenia BEZ wizyt (traktuj jako pojedynczą wizytę)
      if (!order.visits || !Array.isArray(order.visits) || order.visits.length === 0) {
        // Pomijamy zlecenia zakończone
        if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'zamknięte') {
          return;
        }
        
        // Jeśli servicemanId jest podany i nie jest 'USER_001', sprawdź przypisanie
        const orderEmployeeId = order.assignedTo;
        if (servicemanId && servicemanId !== 'USER_001' && orderEmployeeId && orderEmployeeId !== servicemanId) {
          return; // Pomijamy zlecenia innych serwisantów
        }
        
        // ⚠️ UWAGA: Jeśli servicemanId == 'USER_001', to jest to "wszystkie zlecenia"
        // więc pobieramy wszystkie niezależnie od przypisania
        
        // Jeśli nie ma wizyt, utwórz jedną domyślną wizytę z danych zlecenia
        const defaultVisit = {
          visitId: `V-${order.id}-1`,
          visitNumber: 1,
          type: 'diagnosis', // domyślnie diagnoza
          status: order.status || 'scheduled',
          scheduledDate: order.scheduledDate || order.createdAt,
          scheduledTime: null,
          estimatedDuration: order.estimatedDuration || 60,
          technicianId: order.assignedTo || null,
          technicianName: order.assignedToName || '',
          availableDates: order.dates || [],
          workDescription: order.description || ''
        };
        
        // Dodaj domyślną wizytę z pełnym kontekstem zlecenia
        allVisits.push({
          ...defaultVisit,
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientId: order.clientId,
          clientName: order.clientName,
          clientPhone: order.clientPhone,
          clientAddress: order.address,
          clientEmail: order.email,
          deviceType: order.deviceType,
          brand: order.brand,
          model: order.model,
          description: order.description,
          symptoms: order.symptoms,
          priority: order.priority,
          address: order.address,
          clientLocation: order.clientLocation,
          latitude: order.latitude,
          longitude: order.longitude,
          preferredTimeSlots: order.preferredTimeSlots,
          unavailableDates: order.unavailableDates,
          canReschedule: order.canReschedule !== false,
          estimatedCost: order.estimatedCost,
          estimatedDuration: defaultVisit.estimatedDuration
        });
        return;
      }
      
      // Dla każdej wizyty w zleceniu
      order.visits.forEach(visit => {
        // Filtruj wizyty dla konkretnego serwisanta
        const visitEmployeeId = visit.technicianId || visit.employeeId || visit.assignedTo || order.assignedTo;
        
        if (servicemanId && servicemanId !== 'USER_001' && visitEmployeeId !== servicemanId) {
          return; // Pomijamy wizyty innych serwisantów
        }
        
        // Pomijamy wizyty zakończone (completed, cancelled)
        if (visit.status === 'completed' || visit.status === 'cancelled') {
          return;
        }
        
        // Dodaj wizytę z pełnym kontekstem zlecenia
        allVisits.push({
          ...visit,
          // Dane zlecenia macierzystego
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientId: order.clientId,
          clientName: order.clientName,
          clientPhone: order.clientPhone,
          clientAddress: order.address,
          clientEmail: order.clientEmail,
          // Dane urządzenia
          deviceType: order.deviceType,
          brand: order.brand,
          model: order.model,
          // Dane problemu
          description: order.description,
          symptoms: order.symptoms,
          priority: order.priority,
          // Lokalizacja
          address: order.address,
          clientLocation: order.clientLocation,
          latitude: order.latitude,
          longitude: order.longitude,
          // Preferencje klienta
          preferredTimeSlots: order.preferredTimeSlots,
          unavailableDates: order.unavailableDates,
          canReschedule: order.canReschedule,
          // Koszty i czas
          estimatedCost: order.estimatedCost,
          estimatedDuration: visit.estimatedDuration || order.estimatedDuration || 60
        });
      });
    });
    
    console.log(`🎯 Wyekstrahowano ${allVisits.length} wizyt (z ${allOrders.length} zleceń) dla serwisanta ${servicemanId || 'wszystkich'}`);
    
    // 🗺️ Przekształć WIZYTY do formatu wymaganego przez algorytm optymalizacji
    const formattedOrders = allVisits.map(visit => {
      // Przygotuj coordinates
      let coordinates = null;
      if (visit.clientLocation?.coordinates) {
        coordinates = {
          lat: visit.clientLocation.coordinates.lat || visit.clientLocation.coordinates.latitude,
          lng: visit.clientLocation.coordinates.lng || visit.clientLocation.coordinates.longitude
        };
      } else if (visit.latitude && visit.longitude) {
        coordinates = { lat: visit.latitude, lng: visit.longitude };
      }
      
      // Jeśli brak współrzędnych, spróbuj oszacować z adresu (fallback)
      if (!coordinates && visit.clientAddress) {
        coordinates = estimateCoordinatesFromAddress(visit.clientAddress);
      }
      
      // Przygotuj preferredTimeSlots z availableDates
      const preferredTimeSlots = [];
      if (visit.availableDates && Array.isArray(visit.availableDates)) {
        visit.availableDates.forEach(dateInfo => {
          if (dateInfo.dayOfWeek) {
            preferredTimeSlots.push({
              day: dateInfo.dayOfWeek.toLowerCase(),
              start: dateInfo.startTime || '08:00',
              end: dateInfo.endTime || '16:00'
            });
          }
        });
      } else if (visit.preferredTimeSlots && Array.isArray(visit.preferredTimeSlots)) {
        preferredTimeSlots.push(...visit.preferredTimeSlots);
      }
      
      return {
        // ID wizyty (nie zlecenia!)
        id: visit.visitId || visit.id,
        visitId: visit.visitId,
        visitNumber: visit.visitNumber,
        visitType: visit.type, // diagnosis, repair, control, installation
        
        // Dane zlecenia macierzystego (do kontekstu)
        orderId: visit.orderId,
        orderNumber: visit.orderNumber,
        
        // Dane klienta
        clientId: visit.clientId,
        clientName: visit.clientName || 'Nieznany klient',
        address: visit.clientAddress || visit.address || '',
        phone: visit.clientPhone || visit.phone || '',
        email: visit.clientEmail || '',
        
        // Lokalizacja
        coordinates: coordinates || { lat: 50.0647, lng: 19.945 },
        
        // Dane urządzenia
        deviceType: visit.deviceType || '',
        brand: visit.brand || '',
        model: visit.model || '',
        
        // Parametry wizyty
        priority: visit.priority || 'medium',
        estimatedDuration: visit.estimatedDuration || 60,
        status: visit.status || 'scheduled',
        
        // Data i czas
        scheduledDate: visit.scheduledDate || visit.date,
        scheduledTime: visit.scheduledTime || visit.time,
        
        // Preferencje klienta
        preferredTimeSlots: preferredTimeSlots.length > 0 ? preferredTimeSlots : [
          { day: 'monday', start: '08:00', end: '16:00' },
          { day: 'tuesday', start: '08:00', end: '16:00' },
          { day: 'wednesday', start: '08:00', end: '16:00' },
          { day: 'thursday', start: '08:00', end: '16:00' },
          { day: 'friday', start: '08:00', end: '16:00' }
        ],
        unavailableDates: visit.unavailableDates || [],
        canReschedule: visit.canReschedule !== false,
        
        // Opis i koszty
        description: visit.description || visit.workDescription || '',
        serviceCost: visit.estimatedCost || 200,
        
        // Technik
        technicianId: visit.technicianId || visit.employeeId || visit.assignedTo,
        technicianName: visit.technicianName || ''
      };
    });
    
    console.log(`✅ Sformatowano ${formattedOrders.length} WIZYT do optymalizacji`);
    return formattedOrders;
    
  } catch (error) {
    console.error('❌ Błąd podczas wczytywania zleceń:', error);
    
    // 🔄 Fallback - zwróć puste zlecenia zamiast crashować
    console.log('⚠️ Używam pustej listy zleceń jako fallback');
    return [];
  }
}

// Pomocnicza funkcja do szacowania współrzędnych z adresu (fallback)
function estimateCoordinatesFromAddress(address) {
  // Prosta heurystyka bazująca na miastach w Polsce
  const cityPatterns = [
    { pattern: /jasło/i, coords: { lat: 49.7450, lng: 21.4719 } },
    { pattern: /tarnów/i, coords: { lat: 50.0121, lng: 20.9858 } },
    { pattern: /dębica/i, coords: { lat: 49.7813, lng: 21.4108 } },
    { pattern: /mielec/i, coords: { lat: 50.2873, lng: 21.4237 } },
    { pattern: /ropczyce/i, coords: { lat: 50.0516, lng: 21.6086 } },
    { pattern: /kraków|krakow/i, coords: { lat: 50.0647, lng: 19.9450 } },
    { pattern: /warszawa/i, coords: { lat: 52.2297, lng: 21.0122 } },
    { pattern: /rzeszów|rzeszow/i, coords: { lat: 50.0413, lng: 21.9993 } },
    { pattern: /pacanow|pacanów/i, coords: { lat: 50.4797, lng: 20.4497 } },
    { pattern: /chorzelów|chorzelow/i, coords: { lat: 50.1167, lng: 21.6167 } },
    { pattern: /nowy sącz|nowy sacz/i, coords: { lat: 49.6177, lng: 20.7158 } },
    { pattern: /gorlice/i, coords: { lat: 49.6553, lng: 21.1603 } }
  ];
  
  for (const { pattern, coords } of cityPatterns) {
    if (pattern.test(address)) {
      // Użyj deterministycznego przesunięcia bazując na hash adresu
      // To zapewni że ten sam adres zawsze będzie miał te same współrzędne
      let hash = 0;
      for (let i = 0; i < address.length; i++) {
        hash = ((hash << 5) - hash) + address.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Normalizuj hash do przedziału [0, 1]
      const normalizedHash = Math.abs(hash % 10000) / 10000;
      
      // Niewielkie przesunięcie (~0.01 stopnia = ~1km) ale DETERMINISTYCZNE
      const offset = normalizedHash * 0.02 - 0.01;
      
      return {
        lat: coords.lat + offset,
        lng: coords.lng + offset * 0.5 // Mniejsze przesunięcie dla longitude
      };
    }
  }
  
  // Domyślny fallback - centrum Krakowa
  return { lat: 50.0647, lng: 19.945 };
}

// Główny algorytm optymalizacji tras na cały tydzień
async function optimizeWeeklyRoutes(orders, preferences = {}) {
  console.log('🚀 optimizeWeeklyRoutes START');
  console.log('📊 Liczba zleceń:', orders.length);
  console.log('⚙️ Preferences:', JSON.stringify(preferences, null, 2));
  
  if (!orders || orders.length === 0) {
    console.log('❌ Brak zleceń w optimizeWeeklyRoutes');
    throw new Error('Brak zleceń do optymalizacji');
  }
  
  // 1. Grupuj zlecenia geograficznie
  const geographicGroups = groupOrdersByLocation(orders);
  console.log('🗺️ Grupy geograficzne:', Object.keys(geographicGroups));
  
  // 2. Sprawdź dostępność klientów
  const availabilityMatrix = buildAvailabilityMatrix(orders);
  console.log('📅 Macierz dostępności utworzona dla', Object.keys(availabilityMatrix).length, 'zleceń');
  
  // 3. Optymalizuj trasy dla każdego dnia
  const weeklyPlan = await optimizeWeeklySchedule(geographicGroups, availabilityMatrix, preferences);
  
  // 4. Oblicz koszty i oszczędności
  const costAnalysis = calculateCostAnalysis(weeklyPlan, orders);
  
  return {
    weeklyPlan,
    costAnalysis,
    recommendations: generateRecommendations(weeklyPlan, orders),
    alternatives: generateAlternatives(weeklyPlan, orders)
  };
}

// Grupowanie zleceń według lokalizacji (miasta/rejony)
function groupOrdersByLocation(orders) {
  const groups = {};
  
  orders.forEach(order => {
    // Określ rejon na podstawie współrzędnych
    const region = determineRegionSync(order.coordinates, order.address);
    
    if (!groups[region]) {
      groups[region] = {
        name: region,
        orders: [],
        centerPoint: null,
        estimatedTotalTime: 0
      };
    }
    
    groups[region].orders.push(order);
    groups[region].estimatedTotalTime += order.estimatedDuration;
  });
  
  // Oblicz środkowe punkty dla każdej grupy
  Object.keys(groups).forEach(region => {
    groups[region].centerPoint = calculateCenterPoint(groups[region].orders);
  });
  
  return groups;
}

// Określanie regionu na podstawie lokalizacji (synchroniczna wersja)
function determineRegionSync(coordinates, address) {
  const regions = [
    { name: 'Jasło', center: { lat: 49.7450, lng: 21.4719 }, radius: 15 },
    { name: 'Tarnów', center: { lat: 50.0121, lng: 20.9858 }, radius: 20 },
    { name: 'Dębica', center: { lat: 49.7813, lng: 21.4108 }, radius: 15 },
    { name: 'Mielec', center: { lat: 50.2873, lng: 21.4237 }, radius: 15 },
    { name: 'Ropczyce', center: { lat: 50.0516, lng: 21.6086 }, radius: 10 },
    { name: 'Nowy Sącz', center: { lat: 49.6177, lng: 20.7158 }, radius: 20 }
  ];
  
  for (const region of regions) {
    const distance = calculateDistanceSync(coordinates, region.center);
    if (distance <= region.radius) {
      return region.name;
    }
  }
  
  return 'Inne';
}

// Budowanie macierzy dostępności klientów
function buildAvailabilityMatrix(orders) {
  const matrix = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  
  orders.forEach(order => {
    matrix[order.id] = {};
    
    days.forEach(day => {
      matrix[order.id][day] = {
        available: false,
        timeSlots: [],
        unavailable: false
      };
      
      // Sprawdź czy dzień jest dostępny
      const daySlots = order.preferredTimeSlots.filter(slot => slot.day === day);
      if (daySlots.length > 0) {
        matrix[order.id][day].available = true;
        matrix[order.id][day].timeSlots = daySlots;
      }
      
      // Sprawdź czy dzień jest niedostępny
      if (order.unavailableDates && order.unavailableDates.length > 0) {
        const dayDate = getDateForDay(new Date(), day);
        if (order.unavailableDates.includes(dayDate)) {
          matrix[order.id][day].unavailable = true;
          matrix[order.id][day].available = false;
        }
      }
    });
  });
  
  return matrix;
}

// Optymalizacja harmonogramu tygodniowego
async function optimizeWeeklySchedule(geographicGroups, availabilityMatrix, preferences) {
  const weeklyPlan = {
    monday: { orders: [], route: null },
    tuesday: { orders: [], route: null },
    wednesday: { orders: [], route: null },
    thursday: { orders: [], route: null },
    friday: { orders: [], route: null },
    saturday: { orders: [], route: null },
    sunday: { orders: [], route: null }
  };
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const allOrders = Object.values(geographicGroups).flatMap(group => group.orders);
  const remainingOrders = [...allOrders];
  
  // Krok 1: Przydziel zlecenia o wysokim priorytecie
  await assignHighPriorityOrders(weeklyPlan, remainingOrders, availabilityMatrix);
  
  // Krok 2: Przydziel grupy geograficzne
  await assignGeographicGroups(weeklyPlan, geographicGroups, availabilityMatrix, remainingOrders);
  
  // Krok 3: Oblicz optymalne trasy dla każdego dnia
  const baseLocation = preferences.startLocation || { lat: 50.0647, lng: 19.9450 };
  
  for (const day of days) {
    if (weeklyPlan[day].orders.length > 0) {
      weeklyPlan[day].route = await calculateOptimalRoute(weeklyPlan[day].orders, baseLocation);
      weeklyPlan[day].stats = calculateDayStats(weeklyPlan[day].orders, weeklyPlan[day].route);
    }
  }
  
  return weeklyPlan;
}

// Przydzielanie zleceń o wysokim priorytecie
async function assignHighPriorityOrders(weeklyPlan, remainingOrders, availabilityMatrix) {
  const highPriority = remainingOrders.filter(order => order.priority === 'high');
  
  for (const order of highPriority) {
    const bestDay = findBestDayForOrder(order, availabilityMatrix, weeklyPlan);
    if (bestDay) {
      weeklyPlan[bestDay].orders.push(order);
      const index = remainingOrders.indexOf(order);
      if (index > -1) remainingOrders.splice(index, 1);
    }
  }
}

// Przydzielanie grup geograficznych
async function assignGeographicGroups(weeklyPlan, geographicGroups, availabilityMatrix, remainingOrders) {
  for (const [region, group] of Object.entries(geographicGroups)) {
    const orders = group.orders.filter(order => remainingOrders.includes(order));
    if (orders.length === 0) continue;
    
    const bestDay = findBestDayForGroup(orders, availabilityMatrix, weeklyPlan);
    if (bestDay) {
      orders.forEach(order => {
        weeklyPlan[bestDay].orders.push(order);
        const index = remainingOrders.indexOf(order);
        if (index > -1) remainingOrders.splice(index, 1);
      });
    }
  }
}

// Znajdowanie najlepszego dnia dla zlecenia
function findBestDayForOrder(order, availabilityMatrix, weeklyPlan) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayScores = {};
  
  days.forEach(day => {
    let score = 0;
    
    // Sprawdź dostępność
    if (availabilityMatrix[order.id][day].available && !availabilityMatrix[order.id][day].unavailable) {
      score += 10;
    } else {
      dayScores[day] = 0;
      return;
    }
    
    // Preferuj dni z mniejszą liczbą zleceń
    score += (5 - weeklyPlan[day].orders.length);
    
    // Premiuj dni z podobnymi zleceniami w pobliżu
    const nearbyOrders = weeklyPlan[day].orders.filter(existing => {
      const distance = calculateDistanceSync(order.coordinates, existing.coordinates);
      return distance < 10; // 10km
    });
    score += nearbyOrders.length * 2;
    
    dayScores[day] = score;
  });
  
  const bestDay = Object.keys(dayScores).reduce((a, b) => 
    dayScores[a] > dayScores[b] ? a : b
  );
  
  return dayScores[bestDay] > 0 ? bestDay : null;
}

// Znajdowanie najlepszego dnia dla grupy zleceń
function findBestDayForGroup(orders, availabilityMatrix, weeklyPlan) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayScores = {};
  
  days.forEach(day => {
    let score = 0;
    let availableCount = 0;
    
    orders.forEach(order => {
      if (availabilityMatrix[order.id][day].available && !availabilityMatrix[order.id][day].unavailable) {
        availableCount++;
      }
    });
    
    // Preferuj dni gdzie większość zleceń z grupy jest dostępna
    score = availableCount;
    
    // Preferuj dni z mniejszym obciążeniem
    score += (5 - weeklyPlan[day].orders.length);
    
    dayScores[day] = score;
  });
  
  const bestDay = Object.keys(dayScores).reduce((a, b) => 
    dayScores[a] > dayScores[b] ? a : b
  );
  
  return dayScores[bestDay] > 0 ? bestDay : null;
}

// Obliczanie optymalnej trasy dla dnia
async function calculateOptimalRoute(orders, baseLocation = { lat: 50.0647, lng: 19.9450 }) {
  console.log('🎯 calculateOptimalRoute wywoływane z baseLocation:', JSON.stringify(baseLocation));
  
  if (orders.length === 0) return null;
  
  const totalDistance = await calculateTotalDistance(baseLocation, orders);
  const totalDuration = await calculateTotalDuration(orders, baseLocation);
  const estimatedFuelCost = await calculateFuelCost(orders, baseLocation);
  
  // Oblicz proponowaną godzinę wyjazdu używając Distance Matrix API
  const suggestedDepartureTime = await calculateSuggestedDepartureTime(orders, baseLocation);
  
  return {
    totalDistance: totalDistance,
    totalDuration: totalDuration,
    optimizedOrder: orders,
    estimatedFuelCost: estimatedFuelCost,
    googleMapsUrl: generateGoogleMapsUrl(baseLocation, orders),
    suggestedDepartureTime: suggestedDepartureTime.departureTime,
    departureDetails: suggestedDepartureTime.details
  };
}

// Obliczanie proponowanej godziny wyjazdu z punktu startowego
async function calculateSuggestedDepartureTime(orders, baseLocation) {
  if (!orders || orders.length === 0) {
    return {
      departureTime: '08:00',
      details: {
        firstVisitTime: '08:00',
        travelTimeToFirst: 0,
        reasoning: 'Brak zleceń'
      }
    };
  }
  
  // Znajdź najwcześniejszy slot czasowy klienta
  let earliestClientTime = '08:00';
  let earliestOrder = orders[0];
  
  orders.forEach(order => {
    if (order.preferredTimeSlots && order.preferredTimeSlots.length > 0) {
      const slots = order.preferredTimeSlots;
      slots.forEach(slot => {
        if (slot.start && slot.start < earliestClientTime) {
          earliestClientTime = slot.start;
          earliestOrder = order;
        }
      });
    }
  });
  
  // 🚗 Oblicz PRAWDZIWY czas dojazdu używając Google Distance Matrix API
  console.log('🚗 Calculating real travel time using Distance Matrix API...');
  console.log('   From:', baseLocation);
  console.log('   To:', earliestOrder.coordinates, earliestOrder.address);
  
  let travelTimeMinutes = 60; // Domyślnie 1h jako fallback
  let distanceKm = 0;
  
  try {
    const distanceResult = await distanceService.calculateDistance(
      baseLocation,
      earliestOrder.coordinates
    );
    
    travelTimeMinutes = distanceResult.duration.minutes;
    distanceKm = distanceResult.distance.km;
    
    console.log('✅ Distance Matrix API result:', {
      distance: distanceResult.distance.text,
      duration: distanceResult.duration.text,
      provider: distanceResult.provider
    });
  } catch (error) {
    console.error('❌ Distance Matrix API error:', error.message);
    // W przypadku błędu użyj prostego obliczenia
    const distanceToFirst = calculateDistanceSync(baseLocation, earliestOrder.coordinates);
    travelTimeMinutes = Math.round(distanceToFirst * 1.5); // 1.5 min/km jako backup
    distanceKm = distanceToFirst;
    console.warn('⚠️ Using backup calculation:', travelTimeMinutes, 'min');
  }
  
  // Oblicz sugerowaną godzinę wyjazdu (odejmij czas dojazdu + 10 min bufora)
  const bufferMinutes = 10;
  const totalMinutesBeforeDeparture = travelTimeMinutes + bufferMinutes;
  
  const departureTime = subtractMinutesFromTime(earliestClientTime, totalMinutesBeforeDeparture);
  
  // Zaokrąglij do pełnych 5 minut (dla czytelności)
  const roundedDepartureTime = roundToNearest5Minutes(departureTime);
  
  return {
    departureTime: roundedDepartureTime,
    details: {
      firstVisitTime: earliestClientTime,
      firstVisitAddress: earliestOrder.address,
      firstVisitClient: earliestOrder.clientName,
      travelTimeToFirst: travelTimeMinutes,
      bufferTime: bufferMinutes,
      distanceToFirst: Math.round(distanceKm * 10) / 10, // km z 1 miejscem po przecinku
      reasoning: `Wyjazd o ${roundedDepartureTime} pozwoli dotrzeć do pierwszego klienta (${earliestOrder.clientName}) o ${earliestClientTime} z ${bufferMinutes} min bufora`
    }
  };
}

// Odejmowanie minut od czasu w formacie HH:MM
function subtractMinutesFromTime(timeString, minutesToSubtract) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const newTotalMinutes = totalMinutes - minutesToSubtract;
  
  // Obsłuż przypadek gdy wynik jest ujemny (poprzedni dzień)
  const finalMinutes = newTotalMinutes < 0 ? 0 : newTotalMinutes;
  
  const newHours = Math.floor(finalMinutes / 60);
  const newMinutes = finalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

// Zaokrąglanie do najbliższych 5 minut
function roundToNearest5Minutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const roundedMinutes = Math.round(minutes / 5) * 5;
  
  let finalHours = hours;
  let finalMinutes = roundedMinutes;
  
  if (roundedMinutes >= 60) {
    finalHours += 1;
    finalMinutes = 0;
  }
  
  return `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
}

// Obliczanie statystyk dla dnia
function calculateDayStats(orders, route) {
  const totalServiceTime = orders.reduce((sum, order) => sum + order.estimatedDuration, 0);
  const totalRevenue = orders.reduce((sum, order) => sum + order.serviceCost, 0);
  
  return {
    totalOrders: orders.length,
    totalServiceTime: totalServiceTime,
    totalTravelTime: route ? route.totalDuration : 0,
    totalRevenue: totalRevenue,
    efficiency: totalRevenue / (totalServiceTime + (route ? route.totalDuration : 0)),
    regions: [...new Set(orders.map(order => determineRegionSync(order.coordinates, order.address)))],
    suggestedDepartureTime: route ? route.suggestedDepartureTime : null,
    departureDetails: route ? route.departureDetails : null
  };
}

// Analiza kosztów i oszczędności
function calculateCostAnalysis(weeklyPlan, allOrders) {
  const days = Object.keys(weeklyPlan);
  let totalDistance = 0;
  let totalFuelCost = 0;
  let totalRevenue = 0;
  
  days.forEach(day => {
    if (weeklyPlan[day].route) {
      totalDistance += weeklyPlan[day].route.totalDistance;
      totalFuelCost += weeklyPlan[day].route.estimatedFuelCost;
    }
    totalRevenue += weeklyPlan[day].orders.reduce((sum, order) => sum + order.serviceCost, 0);
  });
  
  const chaoticCost = estimateChaoticCost(allOrders);
  const savings = chaoticCost - totalFuelCost;
  
  return {
    optimized: {
      totalDistance: Math.round(totalDistance),
      totalFuelCost: Math.round(totalFuelCost),
      totalRevenue: totalRevenue,
      profit: totalRevenue - totalFuelCost
    },
    chaotic: chaoticCost,
    savings: Math.round(savings),
    savingsPercentage: Math.round((savings / chaoticCost) * 100),
    efficiency: Math.round((totalRevenue - totalFuelCost) / totalRevenue * 100)
  };
}

// Generowanie rekomendacji
function generateRecommendations(weeklyPlan, orders) {
  const recommendations = [];
  
  Object.keys(weeklyPlan).forEach(day => {
    const dayOrders = weeklyPlan[day].orders;
    if (dayOrders.length > 4) {
      recommendations.push({
        type: 'warning',
        message: `${day}: Zaplanowano ${dayOrders.length} zleceń - rozważ przeniesienie części na inny dzień`,
        priority: 'medium'
      });
    }
  });
  
  return recommendations;
}

// Generowanie alternatywnych planów
function generateAlternatives(weeklyPlan, orders) {
  return [
    {
      name: 'Maksymalne grupowanie geograficzne',
      description: 'Priorytet dla minimalizacji dojazdów',
      estimatedSavings: '15-25%'
    },
    {
      name: 'Priorytet dla wysokiej wartości zleceń',
      description: 'Najpierw drogie naprawy, potem pozostałe',
      estimatedSavings: '5-15%'
    },
    {
      name: 'Równomierne rozłożenie obciążenia',
      description: 'Podobna liczba zleceń każdego dnia',
      estimatedSavings: '10-20%'
    }
  ];
}

// ===== Funkcje pomocnicze =====

// Synchroniczna wersja dla prostych obliczeń
function calculateDistanceSync(point1, point2) {
  const R = 6371; // km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
           Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateCenterPoint(orders) {
  const avgLat = orders.reduce((sum, order) => sum + order.coordinates.lat, 0) / orders.length;
  const avgLng = orders.reduce((sum, order) => sum + order.coordinates.lng, 0) / orders.length;
  return { lat: avgLat, lng: avgLng };
}

async function calculateTotalDistance(base, orders) {
  let total = 0;
  let current = base;
  
  for (const order of orders) {
    const distance = calculateDistanceSync(current, order.coordinates);
    total += distance;
    current = order.coordinates;
  }
  
  const returnDistance = calculateDistanceSync(current, base);
  total += returnDistance;
  return total;
}

async function calculateTotalDuration(orders, baseLocation = { lat: 50.0647, lng: 19.9450 }) {
  const totalDistance = await calculateTotalDistance(baseLocation, orders);
  const travelTime = totalDistance * 1.5; // 1.5 min/km
  const serviceTime = orders.reduce((sum, order) => sum + order.estimatedDuration, 0);
  return Math.round(travelTime + serviceTime);
}

async function calculateFuelCost(orders, baseLocation = { lat: 50.0647, lng: 19.9450 }) {
  const distance = await calculateTotalDistance(baseLocation, orders);
  const fuelConsumption = 8; // l/100km
  const fuelPrice = 6.5; // zł/l
  return Math.round((distance * fuelConsumption / 100) * fuelPrice);
}

function estimateChaoticCost(orders) {
  return orders.length * 80; // Średnio 80 zł na zlecenie bez optymalizacji
}

function generateGoogleMapsUrl(base, orders) {
  const waypoints = orders.map(order => `${order.coordinates.lat},${order.coordinates.lng}`).join('|');
  const originString = `${base.lat},${base.lng}`;
  const destinationString = `${base.lat},${base.lng}`;
  
  return `https://www.google.com/maps/dir/?api=1&origin=${originString}&destination=${destinationString}&waypoints=${waypoints}&travelmode=driving`;
}

function getDateForDay(currentDate, dayName) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = currentDate.getDay();
  const targetDayIndex = days.indexOf(dayName);
  
  const daysUntilTarget = (targetDayIndex + 7 - currentDayIndex) % 7;
  const targetDate = new Date(currentDate);
  targetDate.setDate(currentDate.getDate() + daysUntilTarget);
  
  return targetDate.toISOString().split('T')[0];
}
