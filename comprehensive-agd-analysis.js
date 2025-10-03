// BARDZO WNIKLIWA ANALIZA SYSTEMU AGD - SPRAWDZENIE KOMPLETNOŚCI
console.log('🔬 BARDZO WNIKLIWA ANALIZA SYSTEMU AGD');
console.log('=' + '='.repeat(60));

const fs = require('fs');
const path = require('path');

// Wczytaj wszystkie dane
const clients = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'clients.json'), 'utf8'));
const orders = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'orders.json'), 'utf8'));
const employees = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'employees.json'), 'utf8'));

console.log('\n📊 PODSTAWOWE STATYSTYKI:');
console.log(`   Klienci: ${clients.length}`);
console.log(`   Zamówienia: ${orders.length}`);
console.log(`   Pracownicy: ${employees.length}`);

// ===============================================
// 1. ANALIZA KLIENTÓW - SZCZEGÓŁOWA
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('👥 ANALIZA KLIENTÓW - BARDZO SZCZEGÓŁOWA');
console.log('='.repeat(60));

let clientAnalysis = {
  individual: 0,
  business: 0,
  withNIP: 0,
  withCompany: 0,
  emailsValid: 0,
  phonesValid: 0,
  addressesComplete: 0,
  activeClients: 0,
  notificationAllowed: 0,
  smsAllowed: 0
};

clients.forEach((client, index) => {
  console.log(`\n${index + 1}. ${client.id} - ${client.firstName} ${client.lastName}`);
  console.log(`   📧 Email: ${client.email}`);
  console.log(`   📱 Telefon: ${client.phone}`);
  console.log(`   🏠 Adres: ${client.address}, ${client.city} ${client.postalCode}`);
  console.log(`   👤 Typ: ${client.customerType}`);
  
  if (client.customerType === 'individual') clientAnalysis.individual++;
  if (client.customerType === 'business') clientAnalysis.business++;
  if (client.nip) clientAnalysis.withNIP++;
  if (client.company) clientAnalysis.withCompany++;
  if (client.email && client.email.includes('@')) clientAnalysis.emailsValid++;
  if (client.phone && client.phone.length >= 9) clientAnalysis.phonesValid++;
  if (client.address && client.city && client.postalCode) clientAnalysis.addressesComplete++;
  if (client.isActive) clientAnalysis.activeClients++;
  if (client.allowNotifications) clientAnalysis.notificationAllowed++;
  if (client.allowSMS) clientAnalysis.smsAllowed++;
  
  if (client.company) console.log(`   🏢 Firma: ${client.company}`);
  if (client.nip) console.log(`   🏛️ NIP: ${client.nip}`);
  
  console.log(`   📈 Statystyki:`);
  console.log(`      • Zamówienia: ${client.stats.totalOrders} (ukończone: ${client.stats.completedOrders})`);
  console.log(`      • Średnia wartość: ${client.stats.averageOrderValue} zł`);
  console.log(`      • Ostatnie zamówienie: ${client.stats.lastOrderDate}`);
  console.log(`      • Klient od: ${client.stats.customerSince}`);
  
  console.log(`   ⚙️ Status: ${client.isActive ? '✅ Aktywny' : '❌ Nieaktywny'}`);
  console.log(`   🔔 Powiadomienia: ${client.allowNotifications ? '✅' : '❌'} | SMS: ${client.allowSMS ? '✅' : '❌'}`);
  
  if (client.notes) console.log(`   📝 Notatki: ${client.notes}`);
});

console.log(`\n📊 PODSUMOWANIE KLIENTÓW:`);
console.log(`   Klienci indywidualni: ${clientAnalysis.individual}/${clients.length}`);
console.log(`   Klienci biznesowi: ${clientAnalysis.business}/${clients.length}`);
console.log(`   Z NIP: ${clientAnalysis.withNIP}/${clients.length}`);
console.log(`   Z nazwą firmy: ${clientAnalysis.withCompany}/${clients.length}`);
console.log(`   Ważne emaile: ${clientAnalysis.emailsValid}/${clients.length}`);
console.log(`   Ważne telefony: ${clientAnalysis.phonesValid}/${clients.length}`);
console.log(`   Kompletne adresy: ${clientAnalysis.addressesComplete}/${clients.length}`);
console.log(`   Aktywni: ${clientAnalysis.activeClients}/${clients.length}`);
console.log(`   Zgoda na powiadomienia: ${clientAnalysis.notificationAllowed}/${clients.length}`);
console.log(`   Zgoda na SMS: ${clientAnalysis.smsAllowed}/${clients.length}`);

// ===============================================
// 2. ANALIZA ZAMÓWIEŃ - BARDZO SZCZEGÓŁOWA
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('📋 ANALIZA ZAMÓWIEŃ - BARDZO SZCZEGÓŁOWA');
console.log('='.repeat(60));

let orderAnalysis = {
  completed: 0,
  assigned: 0,
  pending: 0,
  inProgress: 0,
  withVisits: 0,
  withoutVisits: 0,
  withPhotos: 0,
  withParts: 0,
  withCosts: 0,
  withWarranty: 0,
  withFeedback: 0,
  totalRevenue: 0,
  avgOrderValue: 0
};

const deviceTypes = {};
const brands = {};
const statuses = {};

orders.forEach((order, index) => {
  console.log(`\n${index + 1}. ${order.orderNumber}`);
  console.log(`   👤 Klient: ${order.clientName} (${order.clientId})`);
  console.log(`   📧 Email: ${order.clientEmail}`);
  console.log(`   📱 Telefon: ${order.clientPhone}`);
  console.log(`   🏠 Adres: ${order.address}`);
  
  console.log(`   🔧 Urządzenie:`);
  console.log(`      • Typ: ${order.deviceType}`);
  console.log(`      • Marka: ${order.brand}`);
  console.log(`      • Model: ${order.model}`);
  console.log(`      • S/N: ${order.serialNumber}`);
  
  console.log(`   📝 Opis problemu: ${order.description}`);
  
  if (order.symptoms && order.symptoms.length > 0) {
    console.log(`   🚨 Objawy: ${order.symptoms.join(', ')}`);
  }
  
  console.log(`   📊 Status: ${order.status} (priorytet: ${order.priority})`);
  
  // Wizyty
  if (order.visits && order.visits.length > 0) {
    console.log(`   📅 Wizyty (${order.visits.length}):`);
    order.visits.forEach(visit => {
      console.log(`      • ${visit.visitId}: ${visit.type} - ${visit.status}`);
      console.log(`        Technik: ${visit.technicianName} (${visit.technicianId})`);
      console.log(`        Zaplanowane: ${visit.scheduledDate}`);
      if (visit.actualStartTime) console.log(`        Rozpoczęto: ${visit.actualStartTime}`);
      if (visit.actualEndTime) console.log(`        Zakończono: ${visit.actualEndTime}`);
      if (visit.duration) console.log(`        Czas trwania: ${visit.duration} min`);
      if (visit.findings) console.log(`        Ustalenia: ${visit.findings}`);
      if (visit.photos && visit.photos.length > 0) {
        console.log(`        Zdjęcia: ${visit.photos.join(', ')}`);
      }
    });
    orderAnalysis.withVisits++;
  } else {
    console.log(`   ❌ BRAK WIZYT!`);
    orderAnalysis.withoutVisits++;
  }
  
  // Koszty i części
  console.log(`   💰 Koszty:`);
  console.log(`      • Szacowany: ${order.estimatedCost} zł`);
  console.log(`      • Części: ${order.partsCost} zł`);
  console.log(`      • Robocizna: ${order.laborCost} zł`);
  console.log(`      • TOTAL: ${order.totalCost} zł`);
  
  if (order.partsUsed && order.partsUsed.length > 0) {
    console.log(`   🔧 Użyte części (${order.partsUsed.length}):`);
    order.partsUsed.forEach(part => {
      console.log(`      • ${part.name} (${part.partNumber}): ${part.quantity}x ${part.unitPrice}zł = ${part.totalPrice}zł`);
    });
    orderAnalysis.withParts++;
  }
  
  // Gwarancja
  if (order.warrantyMonths) {
    console.log(`   🛡️ Gwarancja: ${order.warrantyMonths} miesięcy`);
    if (order.warrantyNotes) console.log(`      Notatki: ${order.warrantyNotes}`);
    orderAnalysis.withWarranty++;
  }
  
  // Zdjęcia
  if (order.photos && order.photos.length > 0) {
    console.log(`   📸 Zdjęcia główne (${order.photos.length}):`);
    order.photos.forEach(photo => {
      console.log(`      • ${photo.type}: ${photo.description} (${photo.timestamp})`);
    });
    orderAnalysis.withPhotos++;
  }
  
  // Historia statusów
  if (order.statusHistory && order.statusHistory.length > 0) {
    console.log(`   📜 Historia statusów (${order.statusHistory.length}):`);
    order.statusHistory.forEach(status => {
      console.log(`      • ${status.status}: ${status.note} (${status.timestamp})`);
    });
  }
  
  // Feedback klienta
  if (order.clientFeedback) {
    console.log(`   ⭐ Ocena klienta: ${order.clientFeedback.rating}/5`);
    console.log(`      Komentarz: ${order.clientFeedback.comment}`);
    orderAnalysis.withFeedback++;
  }
  
  // Daty
  console.log(`   📅 Daty:`);
  console.log(`      • Utworzono: ${order.createdAt}`);
  console.log(`      • Zaktualizowano: ${order.updatedAt}`);
  if (order.completedAt) console.log(`      • Ukończono: ${order.completedAt}`);
  
  // Notatki
  if (order.clientNotes) console.log(`   📝 Notatki klienta: ${order.clientNotes}`);
  if (order.internalNotes) console.log(`   📝 Notatki wewnętrzne: ${order.internalNotes}`);
  if (order.workNotes) console.log(`   📝 Notatki robocze: ${order.workNotes}`);
  
  // Statystyki
  if (order.status === 'completed') orderAnalysis.completed++;
  if (order.status === 'assigned') orderAnalysis.assigned++;
  if (order.status === 'pending') orderAnalysis.pending++;
  if (order.status === 'in_progress') orderAnalysis.inProgress++;
  if (order.totalCost > 0) {
    orderAnalysis.withCosts++;
    orderAnalysis.totalRevenue += order.totalCost;
  }
  
  // Zliczanie typów urządzeń i marek
  deviceTypes[order.deviceType] = (deviceTypes[order.deviceType] || 0) + 1;
  brands[order.brand] = (brands[order.brand] || 0) + 1;
  statuses[order.status] = (statuses[order.status] || 0) + 1;
});

orderAnalysis.avgOrderValue = orderAnalysis.totalRevenue / orderAnalysis.withCosts;

console.log(`\n📊 PODSUMOWANIE ZAMÓWIEŃ:`);
console.log(`   Ukończone: ${orderAnalysis.completed}/${orders.length}`);
console.log(`   Przypisane: ${orderAnalysis.assigned}/${orders.length}`);
console.log(`   Oczekujące: ${orderAnalysis.pending}/${orders.length}`);
console.log(`   W trakcie: ${orderAnalysis.inProgress}/${orders.length}`);
console.log(`   Z wizytami: ${orderAnalysis.withVisits}/${orders.length}`);
console.log(`   Bez wizyt: ${orderAnalysis.withoutVisits}/${orders.length}`);
console.log(`   Ze zdjęciami: ${orderAnalysis.withPhotos}/${orders.length}`);
console.log(`   Z częściami: ${orderAnalysis.withParts}/${orders.length}`);
console.log(`   Z kosztami: ${orderAnalysis.withCosts}/${orders.length}`);
console.log(`   Z gwarancją: ${orderAnalysis.withWarranty}/${orders.length}`);
console.log(`   Z opinią klienta: ${orderAnalysis.withFeedback}/${orders.length}`);
console.log(`   Łączny przychód: ${orderAnalysis.totalRevenue} zł`);
console.log(`   Średnia wartość zamówienia: ${Math.round(orderAnalysis.avgOrderValue)} zł`);

console.log(`\n🔧 TYPY URZĄDZEŃ:`);
Object.entries(deviceTypes).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}`);
});

console.log(`\n🏷️ MARKI:`);
Object.entries(brands).forEach(([brand, count]) => {
  console.log(`   ${brand}: ${count}`);
});

console.log(`\n📊 STATUSY:`);
Object.entries(statuses).forEach(([status, count]) => {
  console.log(`   ${status}: ${count}`);
});

// ===============================================
// 3. ANALIZA PRACOWNIKÓW - BARDZO SZCZEGÓŁOWA
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('👨‍🔧 ANALIZA PRACOWNIKÓW - BARDZO SZCZEGÓŁOWA');
console.log('='.repeat(60));

let employeeAnalysis = {
  agdSpecialists: 0,
  withSpecializations: 0,
  withVehicles: 0,
  withCertifications: 0,
  activeEmployees: 0,
  totalJobs: 0,
  avgRating: 0
};

employees.forEach((emp, index) => {
  console.log(`\n${index + 1}. ${emp.name} (${emp.id})`);
  console.log(`   📧 Email: ${emp.email}`);
  console.log(`   📱 Telefon: ${emp.phone}`);
  console.log(`   🏠 Adres: ${emp.address}`);
  console.log(`   ⏰ Godziny pracy: ${emp.workingHours}`);
  console.log(`   🎓 Doświadczenie: ${emp.experience}`);
  console.log(`   ⭐ Ocena: ${emp.rating}/5`);
  console.log(`   📊 Ukończone prace: ${emp.completedJobs}`);
  console.log(`   ⚙️ Status: ${emp.isActive ? '✅ Aktywny' : '❌ Nieaktywny'}`);
  
  // Specjalizacje
  if (emp.specializations && emp.specializations.length > 0) {
    console.log(`   🔧 Specjalizacje: ${emp.specializations.join(', ')}`);
    employeeAnalysis.withSpecializations++;
    
    if (emp.specializations.some(spec => spec.toLowerCase().includes('agd'))) {
      employeeAnalysis.agdSpecialists++;
    }
  }
  
  // Szczegółowe specjalizacje AGD
  if (emp.agdSpecializations) {
    console.log(`   🏠 Specjalizacje AGD:`);
    console.log(`      Kategoria główna: ${emp.agdSpecializations.primaryCategory}`);
    
    if (emp.agdSpecializations.devices) {
      emp.agdSpecializations.devices.forEach(device => {
        console.log(`      • ${device.type}: ${device.brands.join(', ')} (${device.experienceYears} lat, poziom: ${device.level})`);
        if (device.certifications && device.certifications.length > 0) {
          console.log(`        Certyfikaty: ${device.certifications.join(', ')}`);
        }
      });
    }
    
    if (emp.agdSpecializations.specialSkills) {
      console.log(`      Specjalne umiejętności: ${emp.agdSpecializations.specialSkills.join(', ')}`);
    }
  }
  
  // Pojazd
  if (emp.vehicle) {
    console.log(`   🚐 Pojazd: ${emp.vehicle.make} ${emp.vehicle.model} (${emp.vehicle.year})`);
    console.log(`      Rejestracja: ${emp.vehicle.licensePlate}`);
    console.log(`      Paliwo: ${emp.vehicle.fuelType}`);
    console.log(`      Pojemność: ${emp.vehicle.capacity?.volume} / ${emp.vehicle.capacity?.weight}`);
    console.log(`      Przebieg: ${emp.vehicle.mileage} km`);
    console.log(`      Następny serwis: ${emp.vehicle.nextService}`);
    if (emp.vehicle.features) {
      console.log(`      Wyposażenie: ${emp.vehicle.features.join(', ')}`);
    }
    employeeAnalysis.withVehicles++;
  }
  
  // Narzędzia
  if (emp.equipment) {
    console.log(`   🔨 Wyposażenie:`);
    console.log(`      Warsztat mobilny: ${emp.equipment.mobileWorkshop ? '✅' : '❌'}`);
    console.log(`      Wartość narzędzi: ${emp.equipment.toolsValue} zł`);
    console.log(`      Ostatnia inwentaryzacja: ${emp.equipment.lastInventoryCheck}`);
    
    if (emp.equipment.personalTools && emp.equipment.personalTools.length > 0) {
      console.log(`      Narzędzia osobiste (${emp.equipment.personalTools.length}): ${emp.equipment.personalTools.slice(0, 3).join(', ')}${emp.equipment.personalTools.length > 3 ? '...' : ''}`);
    }
    
    if (emp.equipment.specializedEquipment && emp.equipment.specializedEquipment.length > 0) {
      console.log(`      Sprzęt specjalistyczny: ${emp.equipment.specializedEquipment.join(', ')}`);
    }
  }
  
  // Obszar serwisowy
  if (emp.serviceArea) {
    console.log(`   🗺️ Obszar serwisowy:`);
    console.log(`      Miasto główne: ${emp.serviceArea.primaryCity}`);
    console.log(`      Promień: ${emp.serviceArea.radius} km (max: ${emp.serviceArea.maxDistanceKm} km)`);
    if (emp.serviceArea.preferredDistricts) {
      console.log(`      Preferowane dzielnice: ${emp.serviceArea.preferredDistricts.join(', ')}`);
    }
    if (emp.serviceArea.avoidAreas && emp.serviceArea.avoidAreas.length > 0) {
      console.log(`      Unikane obszary: ${emp.serviceArea.avoidAreas.join(', ')}`);
    }
  }
  
  // Wydajność
  if (emp.performance) {
    console.log(`   📈 Wydajność miesięczna:`);
    if (emp.performance.monthlyStats) {
      const stats = emp.performance.monthlyStats;
      console.log(`      • Zamówienia: ${stats.completedOrders}`);
      console.log(`      • Średni czas: ${stats.averageTimePerOrder} min`);
      console.log(`      • Satysfakcja: ${stats.customerSatisfaction}/5`);
      console.log(`      • Punktualność: ${stats.onTimeArrival}%`);
      console.log(`      • Naprawa za 1 razem: ${stats.firstTimeFixRate}%`);
      console.log(`      • Stali klienci: ${stats.repeatCustomers}%`);
    }
    
    if (emp.performance.specialtyMetrics) {
      console.log(`   🎯 Metryki specjalistyczne:`);
      const metrics = emp.performance.specialtyMetrics;
      if (metrics.agdRepairSuccess) console.log(`      • Sukces napraw AGD: ${metrics.agdRepairSuccess}%`);
      if (metrics.complexRepairCapability) console.log(`      • Skomplikowane naprawy: ${metrics.complexRepairCapability}%`);
      if (metrics.partsOrderAccuracy) console.log(`      • Dokładność zamówień części: ${metrics.partsOrderAccuracy}%`);
      if (metrics.diagnosticAccuracy) console.log(`      • Dokładność diagnozy: ${metrics.diagnosticAccuracy}%`);
    }
  }
  
  // Certyfikaty
  if (emp.certifications && emp.certifications.current && emp.certifications.current.length > 0) {
    console.log(`   🏆 Certyfikaty aktualne:`);
    emp.certifications.current.forEach(cert => {
      console.log(`      • ${cert.name} (${cert.issuer}) - ważny do: ${cert.validUntil}`);
    });
    employeeAnalysis.withCertifications++;
  }
  
  // Dostępność
  if (emp.availability) {
    console.log(`   📅 Dostępność:`);
    if (emp.availability.vacationDays) {
      console.log(`      Urlop: ${emp.availability.vacationDays.used}/${emp.availability.vacationDays.total} dni`);
    }
    if (emp.availability.overtime) {
      console.log(`      Nadgodziny: ${emp.availability.overtime.currentWeekHours}/${emp.availability.overtime.maxHoursPerWeek}h/tydzień`);
    }
    console.log(`      Pogotowie: ${emp.availability.emergencyAvailability ? '✅' : '❌'}`);
  }
  
  // Metadane
  if (emp.metadata) {
    console.log(`   📊 Metadane:`);
    console.log(`      Kompletność profilu: ${emp.metadata.profileCompleteness}%`);
    console.log(`      Ostatnia aktualizacja: ${emp.metadata.updatedAt}`);
    console.log(`      Wersja danych: ${emp.metadata.version} (${emp.metadata.dataCompleteness})`);
  }
  
  // Statystyki
  if (emp.isActive) employeeAnalysis.activeEmployees++;
  if (emp.completedJobs) employeeAnalysis.totalJobs += emp.completedJobs;
  if (emp.rating) employeeAnalysis.avgRating += emp.rating;
});

employeeAnalysis.avgRating = employeeAnalysis.avgRating / employees.length;

console.log(`\n📊 PODSUMOWANIE PRACOWNIKÓW:`);
console.log(`   Aktywni: ${employeeAnalysis.activeEmployees}/${employees.length}`);
console.log(`   Specjaliści AGD: ${employeeAnalysis.agdSpecialists}/${employees.length}`);
console.log(`   Ze specjalizacjami: ${employeeAnalysis.withSpecializations}/${employees.length}`);
console.log(`   Z pojazdami: ${employeeAnalysis.withVehicles}/${employees.length}`);
console.log(`   Z certyfikatami: ${employeeAnalysis.withCertifications}/${employees.length}`);
console.log(`   Łącznie wykonane prace: ${employeeAnalysis.totalJobs}`);
console.log(`   Średnia ocena: ${employeeAnalysis.avgRating.toFixed(1)}/5`);

// ===============================================
// 4. ANALIZA SPÓJNOŚCI DANYCH
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('🔍 ANALIZA SPÓJNOŚCI DANYCH');
console.log('='.repeat(60));

console.log('\n📋 SPRAWDZENIE RELACJI CLIENT-ORDER:');
let relationErrors = 0;
orders.forEach(order => {
  const client = clients.find(c => c.id === order.clientId);
  if (!client) {
    console.log(`❌ Zamówienie ${order.orderNumber} ma nieprawidłowe clientId: ${order.clientId}`);
    relationErrors++;
  } else {
    console.log(`✅ ${order.orderNumber} → ${client.firstName} ${client.lastName} (${order.clientId})`);
    
    // Sprawdź zgodność danych
    if (order.clientName !== (client.firstName + ' ' + client.lastName) && 
        order.clientName !== client.company) {
      console.log(`   ⚠️ Niezgodność nazwy: zamówienie="${order.clientName}" vs klient="${client.firstName} ${client.lastName}"`);
    }
    
    if (order.clientEmail && client.email && order.clientEmail !== client.email) {
      console.log(`   ⚠️ Niezgodność email: zamówienie="${order.clientEmail}" vs klient="${client.email}"`);
    }
    
    if (order.clientPhone && client.phone && order.clientPhone !== client.phone) {
      console.log(`   ⚠️ Niezgodność telefon: zamówienie="${order.clientPhone}" vs klient="${client.phone}"`);
    }
  }
});

console.log('\n📋 SPRAWDZENIE RELACJI ORDER-EMPLOYEE:');
orders.forEach(order => {
  if (order.visits) {
    order.visits.forEach(visit => {
      const employee = employees.find(e => e.id === visit.technicianId);
      if (!employee) {
        console.log(`❌ Wizyta ${visit.visitId} ma nieprawidłowe technicianId: ${visit.technicianId}`);
        relationErrors++;
      } else {
        console.log(`✅ ${visit.visitId} → ${employee.name} (${visit.technicianId})`);
        
        if (visit.technicianName !== employee.name) {
          console.log(`   ⚠️ Niezgodność nazwy technika: wizyta="${visit.technicianName}" vs pracownik="${employee.name}"`);
        }
      }
    });
  }
});

console.log('\n📋 SPRAWDZENIE FORMATÓW ID:');
const idPatterns = {
  clients: /^CLI\d{8}$/,
  orders: /^ORDA\d{8}$/,
  visits: /^VIS\d{8}$/,
  employees: /^EMP\d{8}$/
};

console.log('   Klienci:');
clients.forEach(client => {
  const isValid = idPatterns.clients.test(client.id);
  console.log(`   ${isValid ? '✅' : '❌'} ${client.id}`);
});

console.log('   Zamówienia:');
orders.forEach(order => {
  const isValid = idPatterns.orders.test(order.orderNumber);
  console.log(`   ${isValid ? '✅' : '❌'} ${order.orderNumber}`);
});

console.log('   Wizyty:');
orders.forEach(order => {
  if (order.visits) {
    order.visits.forEach(visit => {
      const isValid = idPatterns.visits.test(visit.visitId);
      console.log(`   ${isValid ? '✅' : '❌'} ${visit.visitId}`);
    });
  }
});

console.log('   Pracownicy:');
employees.forEach(emp => {
  const isValid = idPatterns.employees.test(emp.id);
  console.log(`   ${isValid ? '✅' : '❌'} ${emp.id}`);
});

// ===============================================
// 5. KOŃCOWA OCENA SYSTEMU
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('🎯 KOŃCOWA OCENA GOTOWOŚCI SYSTEMU AGD');
console.log('='.repeat(60));

const systemScore = {
  dataCompleteness: 0,
  dataConsistency: 0,
  businessReadiness: 0,
  technicalReadiness: 0,
  overallScore: 0
};

// Kompletność danych (0-25 punktów)
let completenessScore = 0;
if (clientAnalysis.emailsValid === clients.length) completenessScore += 3;
if (clientAnalysis.phonesValid === clients.length) completenessScore += 3;
if (clientAnalysis.addressesComplete === clients.length) completenessScore += 3;
if (orderAnalysis.withVisits === orders.length) completenessScore += 4;
if (orderAnalysis.completed > 0) completenessScore += 3;
if (employeeAnalysis.agdSpecialists >= 3) completenessScore += 3;
if (employeeAnalysis.withVehicles >= 3) completenessScore += 3;
if (employeeAnalysis.withCertifications >= 2) completenessScore += 3;
systemScore.dataCompleteness = completenessScore;

// Spójność danych (0-25 punktów)
let consistencyScore = 25;
if (relationErrors > 0) consistencyScore -= relationErrors * 5;
if (consistencyScore < 0) consistencyScore = 0;
systemScore.dataConsistency = consistencyScore;

// Gotowość biznesowa (0-25 punktów)
let businessScore = 0;
if (orderAnalysis.completed >= 2) businessScore += 5;
if (orderAnalysis.totalRevenue > 500) businessScore += 5;
if (orderAnalysis.withFeedback > 0) businessScore += 3;
if (clientAnalysis.business > 0) businessScore += 3;
if (orderAnalysis.withWarranty >= 2) businessScore += 3;
if (orderAnalysis.withParts >= 2) businessScore += 3;
if (orderAnalysis.withPhotos >= 1) businessScore += 3;
systemScore.businessReadiness = businessScore;

// Gotowość techniczna (0-25 punktów)
let technicalScore = 0;
if (employees.length >= 5) technicalScore += 5;
if (employeeAnalysis.agdSpecialists >= 3) technicalScore += 5;
if (employeeAnalysis.withVehicles >= 3) technicalScore += 5;
if (employeeAnalysis.avgRating >= 4.5) technicalScore += 3;
if (employeeAnalysis.totalJobs >= 1000) technicalScore += 4;
if (employeeAnalysis.withCertifications >= 2) technicalScore += 3;
systemScore.technicalReadiness = technicalScore;

systemScore.overallScore = systemScore.dataCompleteness + systemScore.dataConsistency + 
                          systemScore.businessReadiness + systemScore.technicalReadiness;

console.log(`\n📊 OCENA PUNKTOWA (0-100):`);
console.log(`   📋 Kompletność danych: ${systemScore.dataCompleteness}/25`);
console.log(`   🔗 Spójność danych: ${systemScore.dataConsistency}/25`);
console.log(`   💼 Gotowość biznesowa: ${systemScore.businessReadiness}/25`);
console.log(`   🔧 Gotowość techniczna: ${systemScore.technicalReadiness}/25`);
console.log(`   🎯 WYNIK OGÓLNY: ${systemScore.overallScore}/100`);

let grade, recommendation;
if (systemScore.overallScore >= 90) {
  grade = "DOSKONAŁY";
  recommendation = "System w pełni gotowy do produkcji!";
} else if (systemScore.overallScore >= 80) {
  grade = "BARDZO DOBRY";
  recommendation = "System gotowy do wdrożenia z drobnymi usprawnieniami.";
} else if (systemScore.overallScore >= 70) {
  grade = "DOBRY";
  recommendation = "System wymaga kilku poprawek przed wdrożeniem.";
} else if (systemScore.overallScore >= 60) {
  grade = "DOSTATECZNY";
  recommendation = "System wymaga znaczących ulepszeń.";
} else {
  grade = "NIEDOSTATECZNY";
  recommendation = "System nie jest gotowy do wdrożenia.";
}

console.log(`\n🏆 OCENA KOŃCOWA: ${grade} (${systemScore.overallScore}/100)`);
console.log(`💡 REKOMENDACJA: ${recommendation}`);

// Szczegółowe zalecenia
console.log(`\n📝 SZCZEGÓŁOWE ZALECENIA:`);

if (systemScore.dataCompleteness < 20) {
  console.log(`   ❌ KRYTYCZNE - Uzupełnij brakujące dane klientów i zamówień`);
}
if (systemScore.dataConsistency < 20) {
  console.log(`   ❌ KRYTYCZNE - Napraw niespójności w relacjach danych`);
}
if (systemScore.businessReadiness < 15) {
  console.log(`   ⚠️ WAŻNE - Zwiększ liczbę ukończonych zamówień i opinii klientów`);
}
if (systemScore.technicalReadiness < 15) {
  console.log(`   ⚠️ WAŻNE - Uzupełnij zespół specjalistów AGD i ich certyfikaty`);
}

if (systemScore.overallScore >= 80) {
  console.log(`   ✅ System może obsługiwać profesjonalne zlecenia AGD`);
  console.log(`   ✅ Dokumentacja i faktury są gotowe`);
  console.log(`   ✅ Zespół posiada odpowiednie kompetencje`);
  console.log(`   ✅ Procesy biznesowe są zdefiniowane`);
}

console.log(`\n🎉 ANALIZA ZAKOŃCZONA!`);
console.log(`📊 System przeanalizowany w ${Object.keys(clients).length + Object.keys(orders).length + Object.keys(employees).length} aspektach`);
console.log(`🔍 Sprawdzono ${clients.length + orders.length + employees.length} rekordów danych`);
console.log(`⚡ Status: ${systemScore.overallScore >= 70 ? 'GOTOWY DO PRACY' : 'WYMAGA POPRAWEK'}`);