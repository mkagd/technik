// components/NorthDeviceSearch.js
// Dedykowany komponent do wyszukiwania urządzeń na North.pl (pralki, lodówki, etc.)

import NorthQuickSearch from './NorthQuickSearch';

export default function NorthDeviceSearch({ 
  brand,           // Marka (Samsung, Bosch, etc.)
  deviceType,      // Typ (Pralka, Lodówka, etc.)
  model = null,    // Model (opcjonalnie)
  compact = false 
}) {
  // Normalizuj typ urządzenia
  const normalizedType = deviceType?.toLowerCase().replace(/[ąćęłńóśźż]/g, (m) => {
    const map = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z' };
    return map[m] || m;
  });

  // Jeśli mamy model, używaj go jako część nazwy
  const searchName = model ? `${brand} ${deviceType} ${model}` : `${brand} ${deviceType}`;

  return (
    <NorthQuickSearch
      partName={searchName}
      partNumber={null}
      compact={compact}
      maxResults={30}
      isDevice={true}
      deviceType={normalizedType}
      brand={brand}
    />
  );
}
