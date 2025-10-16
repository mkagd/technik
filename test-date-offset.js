// Test obliczania offsetu dat w harmonogramie
console.log('\n🧪 TEST OBLICZANIA PONIEDZIAŁKU TYGODNIA:\n');

// Symuluj różne dni tygodnia - tydzień 13-19 października
const testDates = [
  { date: new Date('2025-10-13T10:00:00'), expected: '2025-10-13' }, // Poniedziałek
  { date: new Date('2025-10-14T10:00:00'), expected: '2025-10-13' }, // Wtorek
  { date: new Date('2025-10-15T10:00:00'), expected: '2025-10-13' }, // Środa
  { date: new Date('2025-10-16T10:00:00'), expected: '2025-10-13' }, // Czwartek
  { date: new Date('2025-10-17T10:00:00'), expected: '2025-10-13' }, // Piątek
  { date: new Date('2025-10-18T10:00:00'), expected: '2025-10-13' }, // Sobota
  { date: new Date('2025-10-19T10:00:00'), expected: '2025-10-13' }, // Niedziela (koniec tygodnia)
];

const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

testDates.forEach(({ date: now, expected }) => {
  const dayOfWeek = now.getDay();
  // NOWY ALGORYTM
  const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  const result = monday.toISOString().split('T')[0];
  const status = result === expected ? '✅' : '❌';
  
  console.log(`${status} ${dayNames[dayOfWeek]} ${now.toISOString().split('T')[0]} → ${result} (expected: ${expected})`);
});

console.log('\n✅ Wszystkie powinny zwracać: 2025-10-13');
