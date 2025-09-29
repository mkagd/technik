// pages/api/save-order.js - Zapisywanie zamówień serwisu

import fs from 'fs';
import path from 'path';

// GENERATOR ZAAWANSOWANYCH ID ZLECEŃ
function generateAdvancedOrderId(orderData) {
  // 1. DZIAŁ (2 znaki)
  const device = orderData.device?.toLowerCase() || '';
  let departmentCode = 'AG'; // Domyślnie AGD
  
  if (device.includes('pralka') || device.includes('suszarka')) departmentCode = 'PR'; // PRanie
  else if (device.includes('lodów') || device.includes('zamrażarka')) departmentCode = 'CH'; // CHłodnictwo
  else if (device.includes('zmywark')) departmentCode = 'ZM'; // ZMywarka
  else if (device.includes('piekarnik') || device.includes('kuchenk')) departmentCode = 'KU'; // KUchnia
  else if (device.includes('mikrofaló')) departmentCode = 'MI'; // MIkrofalówka
  else if (device.includes('ekspres')) departmentCode = 'KA'; // KAwiarki
  
  // 2. ŹRÓDŁO (1 znak)
  let sourceCode = 'W'; // Domyślnie Web
  
  if (orderData.source === 'chat') sourceCode = 'C'; // Chat AI
  else if (orderData.source === 'phone') sourceCode = 'T'; // Telefon
  else if (orderData.source === 'mobile') sourceCode = 'M'; // Mobilna
  else if (orderData.source === 'admin') sourceCode = 'A'; // Admin panel
  else if (orderData.source === 'form') sourceCode = 'F'; // Formularz
  
  // 3. PRACOWNIK (2 znaki - inicjały lub kod)
  let employeeCode = 'SY'; // Domyślnie SYstem
  
  if (orderData.employeeId === 'emp001') employeeCode = 'MB'; // Mariusz Bielaszka
  else if (orderData.employeeId === 'emp002') employeeCode = 'AK'; // Anna Kowalska
  else if (orderData.employeeId === 'emp003') employeeCode = 'PN'; // Piotr Nowak
  else if (orderData.employeeCode) employeeCode = orderData.employeeCode.toUpperCase();
  
  // 4. DATA I GODZINA + BEZPIECZNY KOD (11 znaków)
  const now = new Date();
  
  // CZYTELNA DATA: YYMMDD (6 znaków)
  const dateCode = now.getFullYear().toString().slice(-2) + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
  
  // GODZINA: HHMM (4 znaki)
  const timeCode = now.getHours().toString().padStart(2, '0') + 
                  now.getMinutes().toString().padStart(2, '0');
  
  // BEZPIECZNY RANDOM (1 znak) - żeby nie można było przewidzieć kolejnego
  const securityCode = Math.random().toString(36).toUpperCase().slice(-1);
  
  // FINALNE ID: DZIAŁ-ŹRÓDŁO-PRACOWNIK-DATA-GODZINA-RANDOM
  return `${departmentCode}${sourceCode}${employeeCode}${dateCode}${timeCode}${securityCode}`;
}

// DEKODER ID - wyjaśnia co oznacza ID z datą i godziną
function decodeOrderId(orderId) {
  if (orderId.length < 16) return { error: 'Nieprawidłowy format ID' };
  
  const department = orderId.slice(0, 2);
  const source = orderId.slice(2, 3);
  const employee = orderId.slice(3, 5);
  const dateCode = orderId.slice(5, 11);    // YYMMDD
  const timeCode = orderId.slice(11, 15);   // HHMM
  const securityCode = orderId.slice(15);   // Random
  
  const departmentNames = {
    'PR': 'Pralnictwo', 'CH': 'Chłodnictwo', 'ZM': 'Zmywarki', 
    'KU': 'Kuchnia', 'MI': 'Mikrofalówki', 'KA': 'Kawiarki', 'AG': 'AGD Ogólne'
  };
  
  const sourceNames = {
    'C': 'Chat AI', 'T': 'Telefon', 'W': 'Strona Web', 
    'M': 'Aplikacja Mobilna', 'A': 'Panel Admin', 'F': 'Formularz'
  };
  
  const employeeNames = {
    'AI': 'AI Assistant', 'SY': 'System', 'MB': 'Mariusz Bielaszka',
    'AK': 'Anna Kowalska', 'PN': 'Piotr Nowak'
  };
  
  // Dekodowanie daty i godziny
  let decodedDateTime = 'Błąd formatu';
  try {
    const year = '20' + dateCode.slice(0, 2);
    const month = dateCode.slice(2, 4);
    const day = dateCode.slice(4, 6);
    const hour = timeCode.slice(0, 2);
    const minute = timeCode.slice(2, 4);
    
    decodedDateTime = `${day}.${month}.${year} ${hour}:${minute}`;
  } catch (e) {
    decodedDateTime = 'Błąd dekodowania';
  }
  
  return {
    orderId,
    department: departmentNames[department] || 'Nieznany',
    source: sourceNames[source] || 'Nieznane',
    employee: employeeNames[employee] || employee,
    date: dateCode,
    time: timeCode,
    dateTime: decodedDateTime,
    securityCode: securityCode
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tylko POST dozwolone' });
  }

  try {
    const orderData = req.body;
    
    // NOWY SYSTEM ID Z PRZEDROSTKAMI
    const orderId = generateAdvancedOrderId(orderData);
    
    // Struktura zamówienia
    const order = {
      id: orderId,
      timestamp: orderData.timestamp,
      status: 'new',
      customer: {
        name: orderData.userInfo?.name || '',
        email: orderData.userInfo?.email || '',
        phone: orderData.phone || orderData.userInfo?.phone || '',
        company: orderData.userInfo?.company || ''
      },
      service: {
        device: orderData.device,
        brand: orderData.brand,
        model: orderData.model || '',
        problem: orderData.problem,
        urgency: orderData.urgency || 'normal'
      },
      address: {
        street: orderData.address,
        city: orderData.city
      },
      scheduling: {
        preferredTime: orderData.preferredTime,
        assignedTechnician: null,
        scheduledDate: null
      },
      pricing: {
        estimated: null,
        final: null,
        travelCost: orderData.city?.toLowerCase() === 'rzeszów' ? 0 : 50
      }
    };

    // Zapisz do pliku JSON (w prawdziwej aplikacji byłaby to baza danych)
    const ordersFile = path.join(process.cwd(), 'data', 'service-orders.json');
    
    let orders = [];
    try {
      if (fs.existsSync(ordersFile)) {
        const data = fs.readFileSync(ordersFile, 'utf8');
        orders = JSON.parse(data);
      }
    } catch (error) {
      console.log('Tworzenie nowego pliku zamówień');
    }

    orders.push(order);
    
    // Zapisz zaktualizowaną listę
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    // Wyślij powiadomienie email (symulacja)
    const decodedId = decodeOrderId(orderId);
    console.log('📧 NOWE ZAMÓWIENIE SERWISU:', {
      id: orderId,
      decoded: `${decodedId.department} | ${decodedId.source} | ${decodedId.employee}`,
      customer: order.customer.name,
      device: order.service.device,
      problem: order.service.problem,
      city: order.address.city
    });

    return res.status(200).json({
      success: true,
      orderId: orderId,
      message: 'Zamówienie zostało zapisane'
    });

  } catch (error) {
    console.error('Błąd zapisywania zamówienia:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera'
    });
  }
}