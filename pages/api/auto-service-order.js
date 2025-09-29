// pages/api/auto-service-order.js - Auto-rezerwacja serwisu z AI i zaawansowanym ID

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// GENERATOR ZAAWANSOWANYCH ID ZLECEŃ z AI info
function generateAdvancedOrderId(orderData) {
  // 1. DZIAŁ (3 znaki) - bardziej szczegółowy
  const device = orderData.device?.toLowerCase() || '';
  let departmentCode = 'AGD'; // Domyślnie AGD
  
  if (device.includes('pralka')) departmentCode = 'PRL'; 
  else if (device.includes('suszarka')) departmentCode = 'SUS';
  else if (device.includes('lodów') || device.includes('zamrażarka')) departmentCode = 'CHD'; 
  else if (device.includes('zmywark')) departmentCode = 'ZMY'; 
  else if (device.includes('piekarnik')) departmentCode = 'PIE';
  else if (device.includes('kuchenk') || device.includes('płyta')) departmentCode = 'KUC';
  else if (device.includes('mikrofaló')) departmentCode = 'MIC'; 
  else if (device.includes('ekspres')) departmentCode = 'KAW';
  else if (device.includes('okap')) departmentCode = 'OKP';
  
  // 2. ŹRÓDŁO (1 znak)
  let sourceCode = 'A'; // A = Auto-reservation with AI
  
  // 3. PRACOWNIK/AI (2 znaki)
  let handlerCode = 'AI'; // AI Assistant
  
  if (orderData.handlerType === 'human') handlerCode = 'HU';
  else if (orderData.employeeCode) handlerCode = orderData.employeeCode.toUpperCase();
  
  // 4. PRIORYTET (1 znak)
  let priorityCode = 'N'; // Normal
  if (orderData.priority === 'critical') priorityCode = 'C';
  else if (orderData.priority === 'high') priorityCode = 'H'; 
  else if (orderData.priority === 'low') priorityCode = 'L';
  
  // 5. DATA I GODZINA (10 znaków)
  const now = new Date();
  const dateCode = now.getFullYear().toString().slice(-2) + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
  const timeCode = now.getHours().toString().padStart(2, '0') + 
                  now.getMinutes().toString().padStart(2, '0');
  
  // 6. BEZPIECZNY HASH (2 znaki)
  const hashInput = `${departmentCode}${sourceCode}${handlerCode}${Date.now()}${Math.random()}`;
  const hash = crypto.createHash('md5').update(hashInput).digest('hex').slice(0, 2).toUpperCase();
  
  // FINALNE ID: DZIAŁ-ŹRÓDŁO-HANDLER-PRIORYTET-DATA-GODZINA-HASH
  return `${departmentCode}${sourceCode}${handlerCode}${priorityCode}${dateCode}${timeCode}${hash}`;
}

// DEKODER ROZSZERZONEGO ID
function decodeAdvancedOrderId(orderId) {
  if (orderId.length < 19) return { error: 'Nieprawidłowy format ID' };
  
  const department = orderId.slice(0, 3);
  const source = orderId.slice(3, 4);
  const handler = orderId.slice(4, 6);
  const priority = orderId.slice(6, 7);
  const dateCode = orderId.slice(7, 13);
  const timeCode = orderId.slice(13, 17);
  const hash = orderId.slice(17, 19);
  
  const departmentNames = {
    'PRL': 'Pralki', 'SUS': 'Suszarki', 'CHD': 'Chłodnictwo', 'ZMY': 'Zmywarki', 
    'PIE': 'Piekarniki', 'KUC': 'Kuchenki', 'MIC': 'Mikrofalówki', 'KAW': 'Ekspresy', 
    'OKP': 'Okapy', 'AGD': 'AGD Ogólne'
  };
  
  const sourceNames = {
    'A': 'Auto-rezerwacja z AI', 'C': 'Chat AI', 'W': 'Strona Web', 
    'T': 'Telefon', 'M': 'Mobilna', 'F': 'Formularz'
  };
  
  const handlerNames = {
    'AI': 'Asystent AI', 'HU': 'Operator', 'SY': 'System'
  };
  
  const priorityNames = {
    'C': 'Krytyczny', 'H': 'Wysoki', 'N': 'Normalny', 'L': 'Niski'
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
    department: departmentNames[department] || department,
    source: sourceNames[source] || source,
    handler: handlerNames[handler] || handler,
    priority: priorityNames[priority] || priority,
    dateTime: decodedDateTime,
    securityHash: hash,
    isAI: handler === 'AI'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tylko POST dozwolone' });
  }

  try {
    const { 
      device, 
      brand, 
      model, 
      problem, 
      address, 
      city, 
      phone, 
      name, 
      email, 
      preferredTime, 
      aiSuggestions,
      userInfo,
      accountInfo
    } = req.body;
    
    // PODSTAWOWA WALIDACJA
    if (!device || !problem || !address || !phone || !name) {
      return res.status(400).json({ 
        error: 'Brak wymaganych danych',
        required: ['device', 'problem', 'address', 'phone', 'name']
      });
    }
    
    // OKREŚL PRIORYTET NA PODSTAWIE AI SUGESTII
    let priority = 'normal';
    let urgency = 'standard';
    
    if (aiSuggestions) {
      priority = aiSuggestions.priority || 'normal';
      urgency = aiSuggestions.urgency || 'standard';
    }
    
    // WYGENERUJ ZAAWANSOWANE ID
    const orderId = generateAdvancedOrderId({
      device,
      priority,
      handlerType: 'ai'
    });
    
    // OBLICZ KOSZT DOJAZDU
    const cityLower = city?.toLowerCase() || '';
    let travelCost = 50; // Domyślny
    let travelTime = 60; // minuty
    
    if (cityLower.includes('rzeszów')) {
      travelCost = 0;
      travelTime = 30;
    } else if (cityLower.includes('jasło')) {
      travelCost = 30;
      travelTime = 45;
    } else if (cityLower.includes('krosno')) {
      travelCost = 40;
      travelTime = 60;
    } else if (cityLower.includes('stalowa') || cityLower.includes('tarnobrzeg')) {
      travelCost = 50;
      travelTime = 90;
    }
    
    // STRUKTURA ZAMÓWIENIA Z AI
    const order = {
      id: orderId,
      timestamp: new Date().toISOString(),
      status: 'pending',
      source: 'auto-reservation-ai',
      
      // INFORMACJE O KLIENCIE
      customer: {
        name: name,
        email: email || '',
        phone: phone,
        isLoggedIn: !!accountInfo,
        accountId: accountInfo?.id || null
      },
      
      // SZCZEGÓŁY SERWISU
      service: {
        device: device,
        brand: brand || '',
        model: model || '',
        problem: problem,
        category: determineServiceCategory(device),
        urgency: urgency,
        priority: priority
      },
      
      // LOKALIZACJA
      location: {
        address: address,
        city: city || '',
        travelCost: travelCost,
        travelTime: travelTime
      },
      
      // PLANOWANIE
      scheduling: {
        preferredTime: preferredTime || '',
        requestedDate: null,
        assignedTechnician: null,
        estimatedDuration: aiSuggestions?.timeEstimate?.max || 90
      },
      
      // ANALIZA AI
      aiAnalysis: {
        hasSuggestions: !!aiSuggestions,
        confidence: aiSuggestions?.confidence || 0,
        estimatedCost: aiSuggestions?.estimatedCost || null,
        primaryCause: aiSuggestions?.diagnosis?.primaryCause || null,
        tips: aiSuggestions?.tips || [],
        nextSteps: aiSuggestions?.nextSteps || []
      },
      
      // WYCENA
      pricing: {
        estimated: aiSuggestions?.estimatedCost || {
          min: 80,
          max: 300,
          display: '80-300zł'
        },
        travel: travelCost,
        diagnosis: 0, // GRATIS
        total: null // Będzie obliczone po diagnozie
      },
      
      // METADANE
      metadata: {
        createdBy: 'ai-assistant',
        userAgent: req.headers['user-agent'] || '',
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        decodedId: decodeAdvancedOrderId(orderId)
      }
    };
    
    // ZAPISZ DO PLIKU AUTO-ORDERS
    const ordersFile = path.join(process.cwd(), 'data', 'auto-service-orders.json');
    
    // Upewnij się że folder data istnieje
    const dataDir = path.dirname(ordersFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    let orders = [];
    try {
      if (fs.existsSync(ordersFile)) {
        const data = fs.readFileSync(ordersFile, 'utf8');
        orders = JSON.parse(data);
      }
    } catch (error) {
      console.log('Tworzenie nowego pliku auto-zamówień');
      orders = [];
    }
    
    orders.push(order);
    
    // Zapisz zaktualizowaną listę
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
    
    // ZAPISZ TAKŻE DO GŁÓWNEGO SYSTEMU REZERWACJI (kompatybilność)
    try {
      const mainReservation = {
        id: Date.now(),
        name: name,
        phone: phone,
        email: email,
        city: city,
        address: address,
        category: device,
        device: `${brand} ${model}`.trim(),
        problem: problem,
        availability: preferredTime,
        date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        source: 'auto-ai',
        priority: priority,
        ai_analysis: true
      };
      
      const mainFile = path.join(process.cwd(), 'data', 'rezervace.json');
      let mainOrders = [];
      
      if (fs.existsSync(mainFile)) {
        try {
          const mainData = fs.readFileSync(mainFile, 'utf8');
          mainOrders = JSON.parse(mainData);
        } catch (e) {
          mainOrders = [];
        }
      }
      
      mainOrders.push(mainReservation);
      fs.writeFileSync(mainFile, JSON.stringify(mainOrders, null, 2));
      
    } catch (compatError) {
      console.warn('Błąd zapisu kompatybilności:', compatError);
    }
    
    // WYGENERUJ POTWIERDZENIE
    const confirmation = generateConfirmationMessage(order, aiSuggestions);
    
    // LOG SUKCESU
    console.log('✅ AUTO-REZERWACJA UTWORZONA:', {
      id: orderId,
      decoded: order.metadata.decodedId,
      customer: order.customer.name,
      device: `${order.service.device} ${order.service.brand}`,
      problem: order.service.problem.substring(0, 50) + '...',
      city: order.location.city,
      priority: order.service.priority,
      aiConfidence: order.aiAnalysis.confidence + '%'
    });
    
    return res.status(200).json({
      success: true,
      orderId: orderId,
      order: order,
      confirmation: confirmation,
      nextSteps: order.aiAnalysis.nextSteps,
      estimatedCost: order.pricing.estimated,
      decodedId: order.metadata.decodedId
    });

  } catch (error) {
    console.error('Błąd auto-rezerwacji:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas tworzenia auto-rezerwacji',
      details: error.message
    });
  }
}

// OKREŚL KATEGORIĘ SERWISU
function determineServiceCategory(device) {
  const deviceLower = device.toLowerCase();
  
  if (deviceLower.includes('pralka')) return 'pralnictwo';
  if (deviceLower.includes('suszarka')) return 'suszenie';
  if (deviceLower.includes('lodów') || deviceLower.includes('zamrażarka')) return 'chlodnictwo';
  if (deviceLower.includes('zmywark')) return 'zmywarki';
  if (deviceLower.includes('piekarnik')) return 'pieczenie';
  if (deviceLower.includes('kuchenk') || deviceLower.includes('płyta')) return 'gotowanie';
  if (deviceLower.includes('mikrofaló')) return 'mikrofalowki';
  if (deviceLower.includes('ekspres')) return 'kawiarki';
  if (deviceLower.includes('okap')) return 'wentylacja';
  
  return 'agd-ogolne';
}

// WYGENERUJ WIADOMOŚĆ POTWIERDZAJĄCĄ
function generateConfirmationMessage(order, aiSuggestions) {
  const customerName = order.customer.name.split(' ')[0]; // Imię
  const deviceInfo = `${order.service.device} ${order.service.brand}`.trim();
  const costRange = order.pricing.estimated.display;
  const travelInfo = order.location.travelCost === 0 ? 'GRATIS 🎁' : `${order.location.travelCost}zł`;
  
  let urgencyEmoji = '⏰';
  let urgencyText = '';
  
  if (order.service.priority === 'critical') {
    urgencyEmoji = '🚨';
    urgencyText = ' (PILNE!)';
  } else if (order.service.priority === 'high') {
    urgencyEmoji = '⚡';
    urgencyText = ' (priorytet)';
  }
  
  let message = `🎉 **AUTO-REZERWACJA POTWIERDZONA!** ${urgencyEmoji}\n\n`;
  message += `✅ **${customerName}, Twoje zlecenie zostało przyjęte!**\n\n`;
  message += `📋 **SZCZEGÓŁY ZAMÓWIENIA:**\n`;
  message += `• **ID:** ${order.id}\n`;
  message += `• **Urządzenie:** ${deviceInfo}\n`;
  message += `• **Problem:** ${order.service.problem}\n`;
  message += `• **Adres:** ${order.location.address}\n`;
  message += `• **Termin:** ${order.scheduling.preferredTime}${urgencyText}\n`;
  message += `• **Dojazd:** ${travelInfo}\n`;
  message += `• **Diagnoza:** GRATIS ✅\n\n`;
  
  if (aiSuggestions && aiSuggestions.confidence > 70) {
    message += `🤖 **ANALIZA AI (${aiSuggestions.confidence}% pewności):**\n`;
    message += `• **Prawdopodobna przyczyna:** ${aiSuggestions.diagnosis.primaryCause}\n`;
    message += `• **Szacowany koszt:** ${costRange}\n`;
    message += `• **Czas naprawy:** ${aiSuggestions.timeEstimate.display}\n\n`;
  }
  
  message += `📞 **CO DALEJ:**\n`;
  message += `• Zadzwonimy w ciągu 2h (9:00-18:00)\n`;
  message += `• Potwierdzimy dokładny termin\n`;
  message += `• Serwisant przyjedzie punktualnie\n\n`;
  message += `**📱 PILNE:** +48 123 456 789\n`;
  message += `**💻 STATUS:** www.technik-serwis.pl/zamowienie/${order.id}`;
  
  return message;
}