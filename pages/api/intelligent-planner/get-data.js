// pages/api/intelligent-planner/get-data.js
// 📊 API endpoint do pobierania danych dla Intelligent Planner
// Pobiera zlecenia, serwisantów i wizyty z istniejącej struktury data/

import fs from 'fs';
import path from 'path';
import { logger } from '../../../utils/logger';

// Helper do logowania
const log = (message, data) => {
  logger.debug(`[Intelligent Planner API] ${message}`, data || '');
};

// Pomocnicze funkcje do ładowania danych z plików JSON
const loadJSONFile = (filename) => {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileData);
    }
    logger.warn(`⚠️ File not found: ${filename}`);
    return [];
  } catch (error) {
    logger.error(`❌ Error loading ${filename}:`, error);
    return [];
  }
};

// Funkcja do obliczania współrzędnych z adresu (fallback)
const estimateCoordinatesFromAddress = (address) => {
  if (!address) {
    return { lat: 50.0647, lng: 19.9450 }; // Kraków fallback
  }
  
  // Proste mapowanie miast do współrzędnych (rozszerz w razie potrzeby)
  const cityCoordinates = {
    'kraków': { lat: 50.0647, lng: 19.9450 },
    'krakow': { lat: 50.0647, lng: 19.9450 },
    'warszawa': { lat: 52.2297, lng: 21.0122 },
    'warsaw': { lat: 52.2297, lng: 21.0122 },
    'gdańsk': { lat: 54.3520, lng: 18.6466 },
    'gdansk': { lat: 54.3520, lng: 18.6466 },
    'wrocław': { lat: 51.1079, lng: 17.0385 },
    'wroclaw': { lat: 51.1079, lng: 17.0385 },
    'poznań': { lat: 52.4064, lng: 16.9252 },
    'poznan': { lat: 52.4064, lng: 16.9252 },
    'łódź': { lat: 51.7592, lng: 19.4560 },
    'lodz': { lat: 51.7592, lng: 19.4560 },
    'rzeszów': { lat: 50.0413, lng: 21.9991 },
    'rzeszow': { lat: 50.0413, lng: 21.9991 }
  };
  
  const addressLower = address.toLowerCase();
  for (const [cityName, coords] of Object.entries(cityCoordinates)) {
    if (addressLower.includes(cityName)) {
      // Dodaj małe losowe odchylenie żeby nie były dokładnie takie same
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.01,
        lng: coords.lng + (Math.random() - 0.5) * 0.01
      };
    }
  }
  
  // Fallback do Krakowa z losowym offsetem
  return {
    lat: 50.0647 + (Math.random() - 0.5) * 0.1,
    lng: 19.9450 + (Math.random() - 0.5) * 0.1
  };
};

// Formatowanie zlecenia dla plannera
const formatOrderForPlanner = (order) => {
  // Sprawdź czy zlecenie ma współrzędne
  let coordinates = null;
  
  if (order.coordinates) {
    coordinates = order.coordinates;
  } else if (order.latitude && order.longitude) {
    coordinates = { lat: order.latitude, lng: order.longitude };
  } else if (order.lat && order.lng) {
    coordinates = { lat: order.lat, lng: order.lng };
  } else {
    // Spróbuj oszacować z adresu
    const address = order.address || order.clientAddress || order.city;
    coordinates = estimateCoordinatesFromAddress(address);
    logger.debug(`📍 Estimated coordinates for ${order.clientName || order.id}: ${address} -> ${coordinates.lat}, ${coordinates.lng}`);
  }
  
  return {
    id: order.id || order.orderId || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    clientName: order.clientName || order.client?.name || 'Nieznany klient',
    description: order.description || order.problemDescription || order.symptoms?.join(', ') || 'Brak opisu',
    address: order.address || order.clientAddress || 'Brak adresu',
    coordinates: coordinates,
    priority: order.priority || 'medium',
    estimatedDuration: order.estimatedDuration || order.estimatedRepairTime || 60,
    serviceCost: order.serviceCost || order.estimatedCost || 150,
    preferredTimeSlots: order.preferredTimeSlots || [],
    unavailableDates: order.unavailableDates || [],
    deviceType: order.deviceType || order.category || 'AGD',
    brand: order.brand || '',
    model: order.model || '',
    status: order.status || 'pending',
    createdAt: order.createdAt || order.receivedAt || new Date().toISOString(),
    
    // 🆕 KRYTYCZNE: scheduledDate i assignedTo dla intelligent plannera
    scheduledDate: order.scheduledDate || null,
    assignedTo: order.assignedTo || null,
    
    // Dodatkowe pola dla optymalizacji
    isVIP: order.isVIP || false,
    regionPriority: order.regionPriority || 1,
    customerRating: order.customerRating || 5
  };
};

// Formatowanie serwisanta dla plannera
const formatServicemanForPlanner = (serviceman) => {
  return {
    id: serviceman.id || `EMP_${Date.now()}`,
    name: serviceman.name || 'Nieznany serwisant',
    phone: serviceman.phone || '+48 000 000 000',
    email: serviceman.email || 'brak@email.pl',
    specializations: serviceman.specializations || serviceman.specialization || [],
    maxDailyOrders: serviceman.maxVisitsPerWeek || serviceman.maxOrders || 12,
    workingHours: {
      start: serviceman.workingHours?.split('-')[0] || '08:00',
      end: serviceman.workingHours?.split('-')[1] || '18:00'
    },
    isActive: serviceman.isActive !== false,
    region: serviceman.address || serviceman.serviceArea?.primaryCity || 'Kraków',
    
    // Dodatkowe dane
    rating: serviceman.rating || 4.5,
    experience: serviceman.experience || '2 lata',
    completedJobs: serviceman.completedJobs || 50,
    vehicleType: serviceman.vehicleType || 'Van'
  };
};

// Formatowanie wizyty dla plannera
const formatVisitForPlanner = (visit) => {
  return {
    id: visit.id || visit.visitId || `VISIT_${Date.now()}`,
    orderId: visit.orderId || visit.orderNumber,
    servicemanId: visit.employeeId || visit.technicianId || visit.servicemanId,
    scheduledDate: visit.scheduledDate,
    scheduledTime: visit.scheduledTime || '09:00',
    status: visit.status || 'scheduled',
    estimatedDuration: visit.estimatedDuration || 60,
    type: visit.type || 'diagnosis',
    notes: visit.notes || ''
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  try {
    const { servicemanId, week } = req.query;
    
    logger.debug('📊 Intelligent Planner - fetching data:', { servicemanId, week });
    
    // Pobierz zlecenia z pliku JSON
    let orders = loadJSONFile('orders.json');
    
    // ✅ FILTROWANIE PO SERWISANCIE - jeśli podano servicemanId
    if (servicemanId && servicemanId !== 'all') {
      const assignedOrders = orders.filter(order => {
        // Sprawdź czy zlecenie jest przypisane do tego serwisanta
        return order.assignedTo === servicemanId || 
               order.employeeId === servicemanId ||
               order.technicianId === servicemanId ||
               // Lub sprawdź w wizytach
               (order.visits && order.visits.some(v => 
                 v.employeeId === servicemanId || 
                 v.technicianId === servicemanId ||
                 v.servicemanId === servicemanId
               ));
      });
      
      // Dodaj też niezapisane zlecenia (bez przypisania)
      const unassignedOrders = orders.filter(order => {
        return !order.assignedTo && 
               !order.employeeId &&
               !order.technicianId &&
               (!order.visits || order.visits.length === 0);
      });
      
      // Połącz: zlecenia przypisane + niezapisane
      orders = [...assignedOrders, ...unassignedOrders];
      
      logger.debug(`🔍 Filtered for serviceman ${servicemanId}: ${assignedOrders.length} assigned + ${unassignedOrders.length} unassigned = ${orders.length} total`);
    }
    
    // 🔄 Filtruj zlecenia - tylko aktywne (ACTIVE_STATUSES)
    // Akceptowane statusy: pending, contacted, unscheduled, scheduled, confirmed, in_progress, waiting_parts
    const ACTIVE_ORDER_STATUSES = ['pending', 'contacted', 'unscheduled', 'scheduled', 'confirmed', 'in_progress', 'waiting_parts'];
    
    orders = orders.filter(order => {
      const status = order.status?.toLowerCase();
      // Pokaż zlecenia z aktywnym statusem LUB bez wizyt
      return ACTIVE_ORDER_STATUSES.includes(status) || 
             !order.visits || 
             order.visits.length === 0 ||
             order.visits.some(v => v.status === 'pending' || v.status === 'scheduled');
    });
    
    // Pobierz serwisantów z pliku JSON
    let servicemen = loadJSONFile('employees.json');
    
    // Filtruj tylko aktywnych
    servicemen = servicemen.filter(emp => emp.isActive !== false);
    
    // Pobierz wizyty z pliku JSON (jeśli istnieje)
    let visits = [];
    try {
      const allOrders = loadJSONFile('orders.json');
      visits = allOrders.flatMap(order => 
        (order.visits || []).map(visit => ({
          ...visit,
          orderId: order.id,
          orderNumber: order.orderNumber
        }))
      );
      
      logger.debug(`📋 Wszystkich wizyt w systemie: ${visits.length}`);
      
      // Filtruj wizyty dla konkretnego serwisanta jeśli podano
      if (servicemanId && servicemanId !== 'all') {
        const beforeFilter = visits.length;
        visits = visits.filter(v => 
          v.employeeId === servicemanId || 
          v.technicianId === servicemanId ||
          v.servicemanId === servicemanId ||
          v.assignedTo === servicemanId
        );
        logger.debug(`🔍 Po filtrze serwisanta ${servicemanId}: ${visits.length} wizyt (było ${beforeFilter})`);
      }
      
      // 🔄 Filtruj tylko aktywne wizyty (nie pokazuj completed, cancelled, no_show)
      const ACTIVE_VISIT_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'pending'];
      visits = visits.filter(v => ACTIVE_VISIT_STATUSES.includes(v.status));
      
      logger.debug(`✅ Finalna liczba wizyt: ${visits.length} (statuses: ${ACTIVE_VISIT_STATUSES.join(', ')})`);
      
    } catch (error) {
      logger.warn('⚠️ No visits data available:', error.message);
    }
    
    // Formatuj dane
    const formattedOrders = orders.map(formatOrderForPlanner);
    const formattedServicemen = servicemen.map(formatServicemanForPlanner);
    const formattedVisits = visits.map(formatVisitForPlanner);
    
    logger.success(`✅ Loaded: ${formattedOrders.length} orders, ${formattedServicemen.length} servicemen, ${formattedVisits.length} visits`);
    
    return res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
        servicemen: formattedServicemen,
        visits: formattedVisits,
        metadata: {
          ordersCount: formattedOrders.length,
          servicemenCount: formattedServicemen.length,
          visitsCount: formattedVisits.length,
          week: week || 'current',
          timestamp: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    logger.error('❌ Error fetching planner data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch data',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
