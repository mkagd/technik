/**
 * 📊 SZYBKI RAPORT STATYSTYK SYSTEMU
 * Sprawdza ile mamy klientów, zleceń, pracowników
 */

const fs = require('fs');
const path = require('path');

console.log('📊 ===== RAPORT STATYSTYK SYSTEMU =====');
console.log('');

// Funkcja do czytania JSON
function readJSONFile(filename) {
  try {
    const filePath = path.join(__dirname, 'data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(`❌ Błąd odczytu ${filename}:`, error.message);
    return null;
  }
}

// KLIENCI
console.log('👥 ===== KLIENCI =====');
const clients = readJSONFile('clients.json');
if (clients) {
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.metadata?.isActive !== false).length;
  const companies = clients.filter(c => c.companyInfo?.isCompany === true).length;
  const individuals = totalClients - companies;
  
  // Statystyki geograficzne
  const cities = {};
  clients.forEach(client => {
    const city = client.city || 'Nie podano';
    cities[city] = (cities[city] || 0) + 1;
  });
  
  console.log(`📈 Łącznie klientów: ${totalClients}`);
  console.log(`✅ Aktywnych: ${activeClients}`);
  console.log(`🏢 Firm: ${companies}`);
  console.log(`👤 Osób prywatnych: ${individuals}`);
  console.log('');
  
  console.log('🗺️ TOP 5 MIAST:');
  Object.entries(cities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([city, count]) => {
      console.log(`   ${city}: ${count} klientów`);
    });
  console.log('');
  
  // Statystyki zleceń z klientów
  const clientsWithOrders = clients.filter(c => (c.stats?.totalOrders || 0) > 0).length;
  const totalOrdersFromClients = clients.reduce((sum, c) => sum + (c.stats?.totalOrders || 0), 0);
  const totalRevenue = clients.reduce((sum, c) => sum + (c.stats?.totalSpent || c.serviceInfo?.totalSpent || 0), 0);
  
  console.log(`📋 Klienci z zamówieniami: ${clientsWithOrders}/${totalClients}`);
  console.log(`💰 Łączny przychód z klientów: ${totalRevenue.toLocaleString()} zł`);
  
  if (clientsWithOrders > 0) {
    console.log(`📊 Średnia wartość na klienta: ${Math.round(totalRevenue / clientsWithOrders)} zł`);
  }
} else {
  console.log('❌ Nie można odczytać danych klientów');
}

console.log('');

// ZLECENIA
console.log('📋 ===== ZLECENIA =====');
const orders = readJSONFile('orders.json');
if (orders) {
  const totalOrders = orders.length;
  
  // Statystyki statusów
  const statusStats = {};
  orders.forEach(order => {
    const status = order.status || order.statusInfo?.current || 'nieznany';
    statusStats[status] = (statusStats[status] || 0) + 1;
  });
  
  // Statystyki kategorii
  const categoryStats = {};
  orders.forEach(order => {
    const category = order.service?.category || order.category || 'Nie podano';
    categoryStats[category] = (categoryStats[category] || 0) + 1;
  });
  
  // Statystyki czasowe - ostatnie 30 dni
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentOrders = orders.filter(order => {
    const createdAt = order.timeline?.createdAt || order.createdAt || order.dateAdded;
    if (!createdAt) return false;
    return new Date(createdAt) > thirtyDaysAgo;
  }).length;
  
  console.log(`📈 Łącznie zleceń: ${totalOrders}`);
  console.log(`🕐 Nowych w ostatnich 30 dniach: ${recentOrders}`);
  console.log('');
  
  console.log('📊 STATUSY ZLECEŃ:');
  Object.entries(statusStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const percentage = ((count / totalOrders) * 100).toFixed(1);
      console.log(`   ${status}: ${count} (${percentage}%)`);
    });
  console.log('');
  
  console.log('🔧 KATEGORIE SERWISU:');
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([category, count]) => {
      const percentage = ((count / totalOrders) * 100).toFixed(1);
      console.log(`   ${category}: ${count} (${percentage}%)`);
    });
  
  // Szacunkowe przychody
  const estimatedRevenue = orders.reduce((sum, order) => {
    return sum + (order.pricing?.estimatedCost || order.pricing?.finalCost || 0);
  }, 0);
  
  if (estimatedRevenue > 0) {
    console.log('');
    console.log(`💰 Szacunkowy przychód ze zleceń: ${estimatedRevenue.toLocaleString()} zł`);
    console.log(`📊 Średnia wartość zlecenia: ${Math.round(estimatedRevenue / totalOrders)} zł`);
  }
  
} else {
  console.log('❌ Nie można odczytać danych zleceń');
}

console.log('');

// PRACOWNICY
console.log('👷 ===== PRACOWNICY =====');
const employees = readJSONFile('employees.json');
if (employees) {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.isActive === true).length;
  
  // Statystyki specjalizacji
  const specializationStats = {};
  employees.forEach(emp => {
    if (emp.specializations && emp.specializations.length > 0) {
      emp.specializations.forEach(spec => {
        specializationStats[spec] = (specializationStats[spec] || 0) + 1;
      });
    }
  });
  
  console.log(`📈 Łącznie pracowników: ${totalEmployees}`);
  console.log(`✅ Aktywnych: ${activeEmployees}`);
  console.log(`❌ Nieaktywnych: ${totalEmployees - activeEmployees}`);
  console.log('');
  
  if (Object.keys(specializationStats).length > 0) {
    console.log('🔧 SPECJALIZACJE:');
    Object.entries(specializationStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([spec, count]) => {
        console.log(`   ${spec}: ${count} pracowników`);
      });
  }
} else {
  console.log('❌ Nie można odczytać danych pracowników');
}

console.log('');

// PODSUMOWANIE
console.log('🎯 ===== PODSUMOWANIE BIZNESOWE =====');
if (clients && orders && employees) {
  const klientNaZlecenie = orders.length > 0 ? (clients.length / orders.length).toFixed(2) : 0;
  const zlecenieNaPracownika = employees.filter(e => e.isActive).length > 0 ? 
    (orders.length / employees.filter(e => e.isActive).length).toFixed(2) : 0;
  
  console.log(`📊 Stosunek klienci/zlecenia: ${klientNaZlecenie}`);
  console.log(`📊 Stosunek zlecenia/pracownik: ${zlecenieNaPracownika}`);
  console.log('');
  
  console.log('💡 WNIOSKI:');
  if (clients.length > orders.length * 2) {
    console.log('   • Dużo klientów w bazie - potencjał na więcej zleceń');
  }
  if (orders.length > employees.filter(e => e.isActive).length * 10) {
    console.log('   • Dużo zleceń na pracownika - rozważ zatrudnienie');
  }
  
  // Oblicz recentOrders tutaj dla podsumowania
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentOrdersCount = orders.filter(order => {
    const createdAt = order.timeline?.createdAt || order.createdAt || order.dateAdded;
    if (!createdAt) return false;
    return new Date(createdAt) > thirtyDaysAgo;
  }).length;
  
  if (recentOrdersCount < orders.length * 0.1) {
    console.log('   • Mało nowych zleceń ostatnio - kampania marketingowa?');
  }
}

console.log('');
console.log('✅ Raport zakończony!');
console.log(`📅 Data generowania: ${new Date().toLocaleString()}`);