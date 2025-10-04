// scripts/add-test-visits.js
// 🔧 Skrypt dodający testowe wizyty do zleceń

const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const EMPLOYEES_FILE = path.join(__dirname, '..', 'data', 'employees.json');

// Wczytaj dane
const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
const employees = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf8'));

console.log(`📦 Znaleziono ${orders.length} zleceń`);
console.log(`👷 Znaleziono ${employees.length} pracowników`);

// Weź pierwszych 3 pracowników AGD
const agdTechnicians = employees.filter(emp => 
  emp.agdSpecializations && emp.agdSpecializations.devices
).slice(0, 3);

console.log(`\n🔧 Używam pracowników:`);
agdTechnicians.forEach(tech => {
  console.log(`  - ${tech.name} (${tech.id})`);
});

// Funkcja generująca visitId
const generateVisitId = (orderIndex, visitIndex) => {
  const timestamp = Date.now().toString().slice(-8);
  return `VIS${timestamp}${orderIndex.toString().padStart(3, '0')}${visitIndex}`;
};

// Typy wizyt
const visitTypes = ['diagnosis', 'repair', 'control'];
const visitStatuses = ['scheduled', 'in_progress', 'completed'];

// Dodaj wizyty do pierwszych 50 zleceń
let modifiedCount = 0;
let visitsAddedCount = 0;

orders.forEach((order, index) => {
  if (index >= 50) return; // Tylko 50 pierwszych
  
  // Losowy pracownik
  const randomTech = agdTechnicians[Math.floor(Math.random() * agdTechnicians.length)];
  
  // Dodaj podstawowe przypisanie do zlecenia
  order.assignedTo = randomTech.id;
  order.technicianId = randomTech.id;
  
  // Generuj 1-3 wizyty
  const visitCount = Math.floor(Math.random() * 2) + 1; // 1 lub 2 wizyty
  order.visits = order.visits || [];
  
  for (let v = 0; v < visitCount; v++) {
    const visitType = visitTypes[v % visitTypes.length];
    const visitStatus = v === 0 ? 'scheduled' : (Math.random() > 0.5 ? 'in_progress' : 'completed');
    
    // Data - dziś lub w przyszłości
    const daysOffset = Math.floor(Math.random() * 7) - 2; // -2 do +5 dni
    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() + daysOffset);
    const dateStr = visitDate.toISOString().split('T')[0];
    
    // Godzina
    const hours = 8 + Math.floor(Math.random() * 8); // 8-16
    const minutes = Math.random() > 0.5 ? '00' : '30';
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes}`;
    
    const visit = {
      visitId: generateVisitId(index, v + 1),
      type: visitType,
      status: visitStatus,
      date: dateStr,
      time: timeStr,
      scheduledDate: dateStr,
      scheduledTime: timeStr,
      assignedTo: randomTech.id,
      technicianId: randomTech.id,
      technicianName: randomTech.name,
      
      // Diagnoza (jeśli typ diagnosis)
      diagnosis: visitType === 'diagnosis' ? 'Wstępna diagnoza - wymaga części' : '',
      
      // Notatki
      technicianNotes: visitType === 'diagnosis' ? 'Sprawdzono urządzenie' : '',
      
      // Czas
      estimatedDuration: 90 + Math.floor(Math.random() * 60), // 90-150 min
      
      // Części (jeśli repair)
      partsUsed: visitType === 'repair' ? [
        {
          name: 'Pompa wody',
          partNumber: 'PUMP-123',
          quantity: 1,
          price: 150.00
        }
      ] : [],
      
      // Koszty
      estimatedCost: visitType === 'diagnosis' ? 80 : 250,
      totalCost: visitStatus === 'completed' ? (visitType === 'diagnosis' ? 80 : 250) : null,
      
      // Zdjęcia (jeśli completed)
      beforePhotos: visitStatus === 'completed' ? [
        '/api/placeholder-image?text=Przed'
      ] : [],
      afterPhotos: visitStatus === 'completed' ? [
        '/api/placeholder-image?text=Po'
      ] : [],
      
      // Tracking
      workSessions: visitStatus === 'completed' ? [
        {
          startTime: `${dateStr}T${timeStr}:00.000Z`,
          endTime: `${dateStr}T${hours + 2}:${minutes}:00.000Z`,
          duration: 120,
          pauseDuration: 0
        }
      ] : [],
      
      // Metadane
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: visitStatus === 'completed' ? `${dateStr}T${hours + 2}:${minutes}:00.000Z` : null,
      priority: order.priority || 'medium'
    };
    
    order.visits.push(visit);
    visitsAddedCount++;
  }
  
  modifiedCount++;
});

// Zapisz
fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');

console.log(`\n✅ Zmodyfikowano ${modifiedCount} zleceń`);
console.log(`✅ Dodano ${visitsAddedCount} wizyt`);
console.log(`\n📊 Rozkład wizyt po pracownikach:`);

// Policz wizyty na pracownika
const visitsByTech = {};
agdTechnicians.forEach(tech => {
  visitsByTech[tech.id] = 0;
});

orders.forEach(order => {
  if (order.visits && order.visits.length > 0) {
    order.visits.forEach(visit => {
      if (visitsByTech[visit.technicianId] !== undefined) {
        visitsByTech[visit.technicianId]++;
      }
    });
  }
});

Object.keys(visitsByTech).forEach(techId => {
  const tech = agdTechnicians.find(t => t.id === techId);
  console.log(`  ${tech.name}: ${visitsByTech[techId]} wizyt`);
});

console.log('\n🎉 Gotowe!');
