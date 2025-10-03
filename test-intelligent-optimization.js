// Test script dla inteligentnej optymalizacji tras
// Uruchom: node test-intelligent-optimization.js

const testIntelligentOptimization = async () => {
  try {
    console.log('🧠 Testowanie inteligentnej optymalizacji tras...\n');
    
    const testData = {
      servicemanId: 'USER_001',
      timeframe: 'week',
      preferences: {
        priorityMode: 'balanced',
        maxDailyOrders: 5,
        preferredStartTime: '08:00',
        maxDailyDistance: 200
      }
    };
    
    console.log('📤 Wysyłanie żądania optymalizacji...');
    console.log('Dane:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/intelligent-route-optimization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('\n📡 Status odpowiedzi:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log('\n✅ Optymalizacja zakońzona sukcesem!');
        console.log('\n📊 ANALIZA KOSZTÓW:');
        console.log(`💰 Oszczędności: ${result.data.costAnalysis.savings}zł (${result.data.costAnalysis.savingsPercentage}%)`);
        console.log(`🛣️  Całkowity dystans: ${result.data.costAnalysis.optimized.totalDistance}km`);
        console.log(`⛽ Koszty paliwa: ${result.data.costAnalysis.optimized.totalFuelCost}zł`);
        console.log(`💵 Przychód: ${result.data.costAnalysis.optimized.totalRevenue}zł`);
        console.log(`📈 Zysk: ${result.data.costAnalysis.optimized.profit}zł`);
        console.log(`🎯 Efektywność: ${result.data.costAnalysis.efficiency}%`);
        
        console.log('\n📅 PLAN TYGODNIOWY:');
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const dayNames = {
          monday: 'Poniedziałek',
          tuesday: 'Wtorek',
          wednesday: 'Środa', 
          thursday: 'Czwartek',
          friday: 'Piątek'
        };
        
        days.forEach(day => {
          const dayPlan = result.data.weeklyPlan[day];
          const orders = dayPlan.orders || [];
          
          console.log(`\n📌 ${dayNames[day]} (${orders.length} zleceń):`);
          
          if (orders.length > 0) {
            orders.forEach((order, idx) => {
              console.log(`  ${idx + 1}. ${order.clientName} - ${order.description}`);
              console.log(`     📍 ${order.address.split(',')[0]}`);
              console.log(`     ⏱️  ${order.estimatedDuration}min | 💰 ${order.serviceCost}zł | 🚨 ${order.priority}`);
              
              if (order.preferredTimeSlots && order.preferredTimeSlots.length > 0) {
                const slots = order.preferredTimeSlots.map(slot => 
                  `${slot.day.slice(0,3)} ${slot.start}-${slot.end}`
                ).join(', ');
                console.log(`     🕐 Dostępny: ${slots}`);
              }
              
              if (order.unavailableDates && order.unavailableDates.length > 0) {
                console.log(`     ❌ Niedostępny: ${order.unavailableDates.join(', ')}`);
              }
            });
            
            if (dayPlan.stats) {
              console.log(`\n     📊 Statystyki dnia:`);
              console.log(`     💰 Przychód: ${dayPlan.stats.totalRevenue}zł`);
              console.log(`     ⏱️  Czas serwisu: ${Math.round(dayPlan.stats.totalServiceTime/60)}h`);
              console.log(`     🚗 Czas dojazdu: ${Math.round(dayPlan.stats.totalTravelTime/60)}h`);
              console.log(`     🎯 Efektywność: ${dayPlan.stats.efficiency?.toFixed(1)}zł/min`);
              console.log(`     🗺️  Regiony: ${dayPlan.stats.regions?.join(', ')}`);
            }
          } else {
            console.log('     🔄 Dzień wolny');
          }
        });
        
        if (result.data.recommendations && result.data.recommendations.length > 0) {
          console.log('\n💡 REKOMENDACJE SYSTEMU:');
          result.data.recommendations.forEach((rec, idx) => {
            const icon = rec.type === 'warning' ? '⚠️' : 
                        rec.type === 'optimization' ? '📈' : '✅';
            const priority = rec.priority === 'high' ? '🔴' :
                           rec.priority === 'medium' ? '🟡' : '🔵';
            console.log(`  ${icon} ${priority} ${rec.message}`);
          });
        }
        
        if (result.data.alternatives && result.data.alternatives.length > 0) {
          console.log('\n🔄 ALTERNATYWNE STRATEGIE:');
          result.data.alternatives.forEach((alt, idx) => {
            console.log(`  ${idx + 1}. ${alt.name}`);
            console.log(`     📝 ${alt.description}`);
            console.log(`     💰 Potencjalne oszczędności: ${alt.estimatedSavings}`);
          });
        }
        
        console.log('\n🎉 Test zakończony pomyślnie!');
        console.log('🌐 Otwórz http://localhost:3000/intelligent-planner aby zobaczyć interfejs');
        
      } else {
        console.log('\n❌ Błąd API:', result.error);
        if (result.details) {
          console.log('Szczegóły:', result.details);
        }
      }
    } else {
      console.log('\n❌ Błąd HTTP:', response.status, response.statusText);
      try {
        const errorData = await response.text();
        console.log('Odpowiedź serwera:', errorData);
      } catch (e) {
        console.log('Nie można odczytać odpowiedzi serwera');
      }
    }
    
  } catch (error) {
    console.log('\n💥 Błąd sieci lub inny błąd:');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
  }
};

// Sprawdź czy serwer działa
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/health-check', {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ Serwer działa na porcie 3000');
      return true;
    } else {
      console.log('⚠️ Serwer odpowiada ale może mieć problemy');
      return true; // Kontynuuj mimo tego
    }
  } catch (error) {
    console.log('❌ Serwer nie odpowiada na porcie 3000');
    console.log('Upewnij się że uruchomiłeś: npm run dev');
    return false;
  }
};

// Główna funkcja testowa
const main = async () => {
  console.log('🚀 Rozpoczynam test inteligentnej optymalizacji tras\n');
  
  const serverOk = await checkServer();
  
  if (serverOk) {
    await testIntelligentOptimization();
  } else {
    console.log('\n📝 Instrukcje:');
    console.log('1. Uruchom serwer: npm run dev');
    console.log('2. Uruchom ponownie test: node test-intelligent-optimization.js');
  }
};

// Import fetch dla Node.js (jeśli potrzebne)
if (typeof fetch === 'undefined') {
  console.log('📦 Importuję fetch dla Node.js...');
  global.fetch = require('node-fetch');
}

// Uruchom test
main();