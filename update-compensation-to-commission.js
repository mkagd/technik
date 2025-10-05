// update-compensation-to-commission.js
// Aktualizacja struktury wynagrodzeń - prowizja od wizyt zamiast stawki godzinowej

const fs = require('fs');
const path = require('path');

const employeesPath = path.join(__dirname, 'data', 'employees.json');

// Wczytaj pracowników
const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));

console.log(`📋 Znaleziono ${employees.length} pracowników\n`);

// Zaktualizuj strukturę wynagrodzeń
employees.forEach((emp, index) => {
  if (emp.compensation) {
    console.log(`🔄 Aktualizuję: ${emp.name}`);
    
    // Nowa struktura - prowizja od wizyt
    emp.compensation = {
      // Model prowizyjny - zarabianie za wizyty
      commissionModel: {
        enabled: true,
        type: 'per-visit', // per-visit (za wizytę) lub percentage (% od wartości)
        
        // Prowizja za typ wizyty
        visitRates: {
          diagnosis: 50,      // Diagnoza - 50 PLN
          repair: 100,        // Naprawa - 100 PLN
          installation: 80,   // Instalacja - 80 PLN
          control: 40         // Kontrola - 40 PLN
        },
        
        // Procent od wartości zlecenia (jeśli type = 'percentage')
        percentageRate: 20,   // 20% od wartości zlecenia
        
        // Premia za trudność
        difficultyBonus: {
          standard: 0,        // Standardowa wizyta - 0 PLN
          complex: 50,        // Skomplikowana - +50 PLN
          veryComplex: 100    // Bardzo skomplikowana - +100 PLN
        },
        
        // Premia za odległość (za każde 10km powyżej 20km)
        distanceBonus: {
          threshold: 20,      // Powyżej 20km
          perExtraKm: 2       // 2 PLN za każdy dodatkowy km
        }
      },
      
      // Metody płatności (jakie przyjmuje od klienta)
      paymentMethods: {
        cash: true,           // Gotówka
        card: true,           // Terminal kart
        transfer: true,       // Przelew (klient wpłaci później)
        blik: true            // BLIK
      },
      
      // Premie dodatkowe
      bonuses: {
        qualityScore: {
          enabled: true,
          minRating: 4.5,     // Minimalny rating do premii
          amount: 500         // 500 PLN miesięcznie za rating >4.5
        },
        punctuality: {
          enabled: true,
          threshold: 90,      // 90% wizyt na czas
          amount: 300         // 300 PLN miesięcznie
        },
        monthlyTarget: {
          enabled: true,
          visitsRequired: 60, // 60 wizyt miesięcznie
          amount: 1000        // 1000 PLN premii za osiągnięcie
        }
      },
      
      // Statystyki zarobków
      earnings: {
        total: emp.compensation.earnings?.total || 0,
        thisMonth: emp.compensation.earnings?.thisMonth || 0,
        lastMonth: emp.compensation.earnings?.lastMonth || 0,
        unpaid: emp.compensation.earnings?.unpaid || 0,
        
        // Nowe statystyki
        thisMonthVisits: 0,
        thisMonthDistance: 0,
        avgEarningPerVisit: 0
      },
      
      // Historia wypłat
      paymentHistory: emp.compensation.paymentHistory || [],
      
      // Ustawienia
      settings: {
        autoCalculate: true,        // Automatyczne liczenie z wizyt
        taxRate: 0,                 // Podatek (%)
        socialContributions: 0,     // ZUS (%)
        accountNumber: '',          // Numer konta do przelewów
        preferredPaymentDay: 5      // Dzień wypłaty (5-ty dzień miesiąca)
      }
    };
    
    console.log(`   ✅ Zaktualizowano model prowizyjny`);
    console.log(`   💰 Diagnoza: ${emp.compensation.commissionModel.visitRates.diagnosis} PLN`);
    console.log(`   🔧 Naprawa: ${emp.compensation.commissionModel.visitRates.repair} PLN\n`);
  }
});

// Zapisz zaktualizowany plik
fs.writeFileSync(employeesPath, JSON.stringify(employees, null, 2), 'utf8');

console.log('✅ Struktura wynagrodzeń została zaktualizowana!');
console.log('📊 Model prowizyjny (za wizytę) jest teraz aktywny\n');
console.log('Przykładowe zarobki:');
console.log('  - 1 diagnoza = 50 PLN');
console.log('  - 1 naprawa = 100 PLN');
console.log('  - 1 naprawa skomplikowana = 150 PLN');
console.log('  - 60 wizyt/miesiąc = bonus 1000 PLN');
