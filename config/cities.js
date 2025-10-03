/**
 * 🌍 Konfiguracja miast obsługiwanych przez serwis
 * 
 * Używane do:
 * - Landing pages dla każdego miasta (SEO)
 * - Dynamicznego contentu (nazwa miasta w tekstach)
 * - Auto-wykrywania lokalizacji klienta
 * - Local SEO (Google Business Profile dla każdego miasta)
 */

export const CITIES = {
  debica: {
    id: 'debica',
    name: 'Dębica',
    slug: 'debica',
    region: 'podkarpackie',
    postalCode: '39-200',
    
    // SEO
    metaTitle: 'Serwis AGD Dębica - Naprawa Pralek, Lodówek, Zmywarek | TECHNIK',
    metaDescription: 'Profesjonalny serwis AGD w Dębicy. Naprawa pralek, lodówek, zmywarek. ⚡ Szybko, tanio, z gwarancją. ☎ +48 123 456 789. Dojazd tego samego dnia!',
    metaKeywords: 'serwis agd dębica, naprawa pralek dębica, naprawa lodówek dębica, serwis zmywarek dębica',
    
    // Kontakt
    phone: '+48 123 456 789',
    email: 'debica@technik-serwis.pl',
    address: {
      street: 'ul. Lipowa 17',
      city: 'Dębica',
      postalCode: '39-200',
      coords: { lat: 50.0517, lng: 21.4117 }
    },
    
    // Obszar działania (promień w km)
    serviceRadius: 30,
    
    // Teksty specyficzne dla miasta
    hero: {
      title: 'Serwis AGD Dębica',
      subtitle: 'Profesjonalne naprawy sprzętu AGD w Dębicy i okolicach',
      localText: 'Obsługujemy Dębicę oraz okolice: Pilzno, Brzostek, Żyraków'
    },
    
    // Dodatkowe miasta/miejscowości w okolicy (dla SEO)
    nearbyPlaces: ['Pilzno', 'Brzostek', 'Żyraków', 'Czarna', 'Wielopole Skrzyńskie']
  },
  
  rzeszow: {
    id: 'rzeszow',
    name: 'Rzeszów',
    slug: 'rzeszow',
    region: 'podkarpackie',
    postalCode: '35-000',
    
    metaTitle: 'Serwis AGD Rzeszów - Naprawa Pralek, Lodówek, Zmywarek | TECHNIK',
    metaDescription: 'Serwis AGD w Rzeszowie. Naprawy pralek, lodówek, zmywarek na terenie całego Rzeszowa. ⚡ Dojazd 24h. ☎ +48 123 456 790. Gwarancja!',
    metaKeywords: 'serwis agd rzeszów, naprawa pralek rzeszów, naprawa lodówek rzeszów',
    
    phone: '+48 123 456 790',
    email: 'rzeszow@technik-serwis.pl',
    address: {
      street: 'ul. Lwowska 45',
      city: 'Rzeszów',
      postalCode: '35-301',
      coords: { lat: 50.0412, lng: 21.9991 }
    },
    
    serviceRadius: 25,
    
    hero: {
      title: 'Serwis AGD Rzeszów',
      subtitle: 'Szybkie naprawy sprzętu AGD w Rzeszowie',
      localText: 'Obsługujemy cały Rzeszów oraz okolice: Głogów Małopolski, Tyczyn, Boguchwała'
    },
    
    nearbyPlaces: ['Głogów Małopolski', 'Tyczyn', 'Boguchwała', 'Świlcza', 'Błażowa']
  },
  
  tarnow: {
    id: 'tarnow',
    name: 'Tarnów',
    slug: 'tarnow',
    region: 'małopolskie',
    postalCode: '33-100',
    
    metaTitle: 'Serwis AGD Tarnów - Naprawa Pralek, Lodówek, Zmywarek | TECHNIK',
    metaDescription: 'Profesjonalny serwis AGD Tarnów. Naprawy sprzętu AGD. ⚡ Express do 24h. ☎ +48 123 456 791. Gwarancja 12 miesięcy.',
    metaKeywords: 'serwis agd tarnów, naprawa pralek tarnów, naprawa lodówek tarnów',
    
    phone: '+48 123 456 791',
    email: 'tarnow@technik-serwis.pl',
    address: {
      street: 'ul. Krakowska 120',
      city: 'Tarnów',
      postalCode: '33-100',
      coords: { lat: 50.0121, lng: 20.9858 }
    },
    
    serviceRadius: 30,
    
    hero: {
      title: 'Serwis AGD Tarnów',
      subtitle: 'Naprawy sprzętu AGD w Tarnowie i okolicach',
      localText: 'Obsługujemy Tarnów oraz okolice: Tuchów, Wojnicz, Radgoszcz'
    },
    
    nearbyPlaces: ['Tuchów', 'Wojnicz', 'Radgoszcz', 'Szczucin', 'Żabno']
  },
  
  krakow: {
    id: 'krakow',
    name: 'Kraków',
    slug: 'krakow',
    region: 'małopolskie',
    postalCode: '30-000',
    
    metaTitle: 'Serwis AGD Kraków - Naprawa Pralek, Lodówek, Zmywarek | TECHNIK',
    metaDescription: 'Serwis AGD Kraków - wszystkie dzielnice. Naprawy pralek, lodówek, zmywarek. ⚡ Dojazd 2h. ☎ +48 123 456 792. Profesjonalnie!',
    metaKeywords: 'serwis agd kraków, naprawa pralek kraków, naprawa lodówek kraków',
    
    phone: '+48 123 456 792',
    email: 'krakow@technik-serwis.pl',
    address: {
      street: 'ul. Dietla 85',
      city: 'Kraków',
      postalCode: '31-054',
      coords: { lat: 50.0647, lng: 19.9450 }
    },
    
    serviceRadius: 20,
    
    hero: {
      title: 'Serwis AGD Kraków',
      subtitle: 'Profesjonalne naprawy AGD we wszystkich dzielnicach Krakowa',
      localText: 'Obsługujemy cały Kraków: Stare Miasto, Podgórze, Nowa Huta, Krowodrza oraz okolice'
    },
    
    nearbyPlaces: ['Wieliczka', 'Skawina', 'Niepołomice', 'Zabierzów', 'Zielonki']
  },
  
  jaslo: {
    id: 'jaslo',
    name: 'Jasło',
    slug: 'jaslo',
    region: 'podkarpackie',
    postalCode: '38-200',
    
    metaTitle: 'Serwis AGD Jasło - Naprawa Pralek, Lodówek, Zmywarek | TECHNIK',
    metaDescription: 'Serwis AGD w Jaśle. Naprawy pralek, lodówek, zmywarek. ⚡ Szybki dojazd. ☎ +48 123 456 793. Gwarancja!',
    metaKeywords: 'serwis agd jasło, naprawa pralek jasło, naprawa lodówek jasło',
    
    phone: '+48 123 456 793',
    email: 'jaslo@technik-serwis.pl',
    address: {
      street: 'ul. Kolejowa 12',
      city: 'Jasło',
      postalCode: '38-200',
      coords: { lat: 49.7450, lng: 21.4725 }
    },
    
    serviceRadius: 25,
    
    hero: {
      title: 'Serwis AGD Jasło',
      subtitle: 'Naprawy sprzętu AGD w Jaśle i okolicach',
      localText: 'Obsługujemy Jasło oraz okolice: Krosno, Gorlice, Frysztak'
    },
    
    nearbyPlaces: ['Krosno', 'Gorlice', 'Frysztak', 'Dukla', 'Brzozów']
  }
};

// Główne miasto (domyślne)
export const DEFAULT_CITY = 'debica';

// Lista wszystkich miast (do generowania stron)
export const CITY_LIST = Object.values(CITIES);

// Helper: Pobierz miasto po slug
export const getCityBySlug = (slug) => {
  return CITIES[slug] || CITIES[DEFAULT_CITY];
};

// Helper: Pobierz wszystkie slug-i (do statycznych ścieżek Next.js)
export const getAllCitySlugs = () => {
  return Object.keys(CITIES);
};

// Helper: Sprawdź czy miasto istnieje
export const cityExists = (slug) => {
  return !!CITIES[slug];
};

// Helper: Znajdź najbliższe miasto po współrzędnych
export const findNearestCity = (lat, lng) => {
  let nearest = null;
  let minDistance = Infinity;
  
  CITY_LIST.forEach(city => {
    const distance = getDistanceFromLatLon(
      lat, lng,
      city.address.coords.lat,
      city.address.coords.lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  });
  
  return nearest;
};

// Haversine formula (odległość między punktami w km)
function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius Ziemi w km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default CITIES;
