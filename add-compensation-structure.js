// add-compensation-structure.js
// Skrypt dodający strukturę wynagrodzeń do pracowników

const fs = require('fs');
const path = require('path');

const employeesPath = path.join(__dirname, 'data', 'employees.json');

// Wczytaj pracowników
const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));

console.log(`📋 Znaleziono ${employees.length} pracowników`);

// Dodaj strukturę wynagrodzeń do każdego pracownika
employees.forEach((emp, index) => {
  if (!emp.compensation) {
    emp.compensation = {
      // Stawka bazowa
      baseRate: {
        type: 'hourly', // hourly, daily, monthly
        amount: 0, // do uzupełnienia przez admina
        currency: 'PLN'
      },
      
      // Dostępne metody płatności
      paymentMethods: {
        cash: true,        // Gotówka
        card: true,        // Karta
        transfer: true     // Przelew bankowy
      },
      
      // Struktura premii
      bonusStructure: {
        perRepair: 0,           // Premia za naprawę
        perDiagnosis: 0,        // Premia za diagnozę
        qualityBonus: 0,        // Premia jakościowa (miesięcznie)
        overtimeRate: 1.5       // Mnożnik dla nadgodzin
      },
      
      // Statystyki zarobków
      earnings: {
        total: 0,               // Łączne zarobki
        thisMonth: 0,           // Zarobki w bieżącym miesiącu
        lastMonth: 0,           // Zarobki w poprzednim miesiącu
        unpaid: 0               // Nieopłacone zarobki
      },
      
      // Historia wypłat
      paymentHistory: [
        // {
        //   id: 'PAY_123',
        //   amount: 5000,
        //   period: '2025-09',
        //   paidAt: '2025-10-05T10:00:00.000Z',
        //   method: 'transfer',
        //   note: 'Wypłata za wrzesień 2025'
        // }
      ],
      
      // Ustawienia
      settings: {
        autoCalculate: true,    // Automatyczne liczenie zarobków z wizyt
        taxRate: 0,             // Stawka podatku (%)
        socialContributions: 0  // Składki ZUS (%)
      }
    };
    
    console.log(`✅ Dodano strukturę wynagrodzeń dla: ${emp.name}`);
  } else {
    console.log(`⏭️  ${emp.name} już ma strukturę wynagrodzeń`);
  }
});

// Zapisz zaktualizowany plik
fs.writeFileSync(employeesPath, JSON.stringify(employees, null, 2), 'utf8');

console.log('\n✅ Struktura wynagrodzeń została dodana do wszystkich pracowników!');
console.log('📝 Teraz możesz edytować stawki w panelu administracyjnym.');
