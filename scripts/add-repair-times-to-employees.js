const fs = require('fs');
const path = require('path');

console.log('🔧 Dodawanie czasów napraw do pracowników...\n');

const employeesPath = path.join(__dirname, '..', 'data', 'employees.json');
const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));

// Domyślne czasy napraw w minutach
const defaultRepairTimes = {
  pralka: 30,
  lodówka: 40,
  zmywarka: 35,
  piekarnik: 45,
  kuchenka: 40,
  'płyta indukcyjna': 35,
  suszarka: 35,
  'pralko-suszarka': 45,
  zamrażarka: 40,
  'ekspres do kawy': 25,
  'robot kuchenny': 30,
  blender: 20,
  sokowirówka: 20,
  mikrofalówka: 25,
  okap: 30,
  'inne AGD': 30
};

// Dodaj repairTimes do każdego pracownika
employees.forEach(employee => {
  // Jeśli pracownik już ma repairTimes, pomiń
  if (employee.repairTimes) {
    console.log(`⚠️  ${employee.name} - już ma repairTimes, pomijam`);
    return;
  }

  // Stwórz obiekt repairTimes dla pracownika
  const repairTimes = { ...defaultRepairTimes };

  // Jeśli pracownik ma agdSpecializations, dostosuj czasy bazując na doświadczeniu
  if (employee.agdSpecializations && employee.agdSpecializations.devices) {
    employee.agdSpecializations.devices.forEach(device => {
      const deviceType = device.type;
      const level = device.level;
      const experienceYears = device.experienceYears;

      // Expert = -5 min, Advanced = -2 min, Intermediate = 0, Beginner = +3 min
      let adjustment = 0;
      if (level === 'expert') {
        adjustment = -5;
      } else if (level === 'advanced') {
        adjustment = -2;
      } else if (level === 'beginner') {
        adjustment = +3;
      }

      // Dodatkowa redukcja za doświadczenie (1 min mniej co 2 lata)
      adjustment -= Math.floor(experienceYears / 2);

      // Minimalna wartość to 15 minut
      const baseTime = defaultRepairTimes[deviceType] || 30;
      repairTimes[deviceType] = Math.max(15, baseTime + adjustment);
    });
  }

  employee.repairTimes = repairTimes;
  
  console.log(`✅ ${employee.name} - dodano repairTimes`);
  
  // Pokaż czasy dla specjalizacji
  if (employee.agdSpecializations && employee.agdSpecializations.devices) {
    employee.agdSpecializations.devices.forEach(device => {
      console.log(`   ${device.type}: ${repairTimes[device.type]} min (${device.level}, ${device.experienceYears} lat)`);
    });
  }
});

// Zapisz zaktualizowane dane
fs.writeFileSync(employeesPath, JSON.stringify(employees, null, 2), 'utf8');

console.log('\n✅ Zaktualizowano plik employees.json');
console.log(`📊 Pracowników zaktualizowanych: ${employees.length}`);
