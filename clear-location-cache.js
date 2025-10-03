// Skrypt do czyszczenia zapamiętanych lokalizacji z localStorage
// Uruchom go w konsoli przeglądarki

console.log('🧹 Czyszczenie cache\'u lokalizacji...');

// Usuń wszystkie klucze związane z lokalizacją
const keysToRemove = [
  'startLocation',
  'userLocation', 
  'lastKnownLocation',
  'savedLocation',
  'currentLocation',
  'preferredLocation'
];

let removed = 0;
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`✅ Usunięto klucz: ${key}`);
    removed++;
  }
});

// Wyświetl wszystkie klucze localStorage dla sprawdzenia
console.log('\n📋 Pozostałe klucze w localStorage:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`- ${key}: ${localStorage.getItem(key)?.substring(0, 100)}${localStorage.getItem(key)?.length > 100 ? '...' : ''}`);
}

console.log(`\n🎉 Usunięto ${removed} kluczy z cache'u lokalizacji`);
console.log('💡 Odśwież stronę aby załadować nową domyślną lokalizację: Gliniana 17, Kraków (50.0641, 19.9520)');