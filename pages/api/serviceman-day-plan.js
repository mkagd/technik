// API endpoint dla planu dnia serwisanta
// pages/api/serviceman-day-plan.js

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { servicemanId, date } = req.query;
      const planDate = date || new Date().toISOString().split('T')[0];
      
      // Różne plany dla różnych serwisantów
      const dayPlans = {
        'USER_001': {
          serviceman: {
            id: 'USER_001',
            name: 'Jan Kowalski',
            phone: '+48 123 456 789',
            currentLocation: { lat: 50.8661, lng: 20.6286, address: 'ul. Warszawska 1, Kielce (Baza)' }
          },
          date: planDate,
          workingHours: { start: '08:00', end: '16:00' },
          appointments: [
            {
              id: 'APP_001',
              orderId: 'ORD25272001',
              time: '08:30',
              duration: 120,
              status: 'completed',
              client: {
                name: 'Maria Kowalczyk',
                phone: '+48 501 234 567',
                address: 'ul. Paderewskiego 12, Kielce',
                coordinates: { lat: 50.8720, lng: 20.6350 }
              },
              device: {
                type: 'Lodówka',
                brand: 'Bosch',
                model: 'KGN39VLEB',
                issue: 'Nie chłodzi - wymiana termostatu',
                serialNumber: 'BSH123456789'
              },
              estimatedCost: 280,
              actualStartTime: '08:35',
              actualEndTime: '10:25',
              actualCost: 280,
              notes: 'Wymieniono termostat główny. Sprawdzono uszczelki drzwi - w dobrym stanie. Klient zadowolony z szybkości naprawy.',
              partsUsed: ['Termostat główny', 'Pasta termoprzewodząca'],
              workDescription: 'Demontaż tylnej ścianki, wymiana termostatu, test poprawności działania'
            },
            {
              id: 'APP_002',
              orderId: 'ORD25272002',
              time: '11:00',
              duration: 90,
              status: 'completed',
              client: {
                name: 'Andrzej Nowak',
                phone: '+48 602 345 678',
                address: 'ul. Sienkiewicza 45, Kielce',
                coordinates: { lat: 50.8661, lng: 20.6286 }
              },
              device: {
                type: 'Pralka',
                brand: 'Samsung',
                model: 'WF80F5E5W4W',
                issue: 'Głośna praca - wymiana łożysk bębna',
                serialNumber: 'SAM987654321'
              },
              estimatedCost: 420,
              actualStartTime: '11:15',
              actualEndTime: '12:30',
              actualCost: 420,
              notes: 'Wymieniono oba łożyska bębna. Wyważono bęben. Test pracy w różnych programach - wszystko OK.',
              partsUsed: ['Łożysko przednie 6205ZZ', 'Łożysko tylne 6206ZZ', 'Smar łożyskowy'],
              workDescription: 'Demontaż bębna, wymiana łożysk, wyważenie, test wszystkich programów'
            },
            {
              id: 'APP_003',
              orderId: 'ORD25272003',
              time: '13:30',
              duration: 75,
              status: 'in_progress',
              client: {
                name: 'Małgorzata Wiśniewska',
                phone: '+48 703 456 789',
                address: 'ul. Krakowska 88, Kielce',
                coordinates: { lat: 50.8847, lng: 20.6492 }
              },
              device: {
                type: 'Zmywarka',
                brand: 'Whirlpool',
                model: 'WFC 3C26',
                issue: 'Nie odpompowuje wody - czyszczenie pompy',
                serialNumber: 'WHP456789123'
              },
              estimatedCost: 180,
              actualStartTime: '13:40',
              notes: 'W trakcie czyszczenia pompy odpływowej. Znaleziono dużo osadów i resztek jedzenia...',
              partsUsed: ['Środek czyszczący', 'Nowa uszczelka pompy'],
              workDescription: 'Demontaż pompy odpływowej, czyszczenie wirnika i obudowy'
            },
            {
              id: 'APP_004',
              orderId: 'ORD25272004',
              time: '15:00',
              duration: 60,
              status: 'planned',
              client: {
                name: 'Tomasz Mazur',
                phone: '+48 804 567 890',
                address: 'ul. Słowackiego 33, Kielce',
                coordinates: { lat: 50.8590, lng: 20.6180 }
              },
              device: {
                type: 'Mikrofalówka',
                brand: 'LG',
                model: 'MH6535GPS',
                issue: 'Nie grzeje - prawdopodobnie magnetron',
                serialNumber: 'LG789123456'
              },
              estimatedCost: 320,
              notes: 'Klient będzie dostępny od 15:00. Przygotować magnetron na wymianę. Sprawdzić także bezpiecznik HV.',
              partsUsed: ['Magnetron (w razie potrzeby)', 'Bezpiecznik HV'],
              workDescription: 'Diagnostyka systemu grzewczego, wymiana magnetronu jeśli uszkodzony'
            },
            {
              id: 'APP_005',
              orderId: 'ORD25272005',
              time: '16:00',
              duration: 45,
              status: 'planned',
              client: {
                name: 'Anna Kowalska',
                phone: '+48 905 678 901',
                address: 'ul. Jagiellońska 67, Kielce',
                coordinates: { lat: 50.8520, lng: 20.5980 }
              },
              device: {
                type: 'Odkurzacz',
                brand: 'Dyson',
                model: 'V11 Absolute',
                issue: 'Słaba moc ssania - czyszczenie filtrów',
                serialNumber: 'DYS654321789'
              },
              estimatedCost: 120,
              notes: 'Szybka wizyta - wymiana i czyszczenie filtrów HEPA. Sprawdzić stan szczotek.',
              partsUsed: ['Filtr HEPA (w razie potrzeby)', 'Środek czyszczący'],
              workDescription: 'Czyszczenie wszystkich filtrów, sprawdzenie drożności przewodów ssących'
            }
          ]
        },
        'USER_002': {
          serviceman: {
            id: 'USER_002',
            name: 'Michał Nowak',
            phone: '+48 987 654 321',
            currentLocation: { lat: 50.8661, lng: 20.6286, address: 'ul. Warszawska 1, Kielce (Baza)' }
          },
          date: planDate,
          workingHours: { start: '09:00', end: '17:00' },
          appointments: [
            {
              id: 'APP_101',
              orderId: 'ORD25272101',
              time: '09:30',
              duration: 180,
              status: 'completed',
              client: {
                name: 'Robert Zieliński',
                phone: '+48 511 222 333',
                address: 'ul. Warszawska 156, Kielce',
                coordinates: { lat: 50.8580, lng: 20.6240 }
              },
              device: {
                type: 'Klimatyzacja',
                brand: 'Daikin',
                model: 'FTXS35K',
                issue: 'Serwis kompleksowy - czyszczenie, uzupełnienie freonu',
                serialNumber: 'DAI111222333'
              },
              estimatedCost: 450,
              actualStartTime: '09:30',
              actualEndTime: '12:30',
              actualCost: 480,
              notes: 'Pełny serwis: czyszczenie jednostki wewnętrznej i zewnętrznej, uzupełnienie freonu R32, wymiana filtrów.',
              partsUsed: ['Freon R32 - 0.8kg', 'Filtry węglowe x2', 'Środek do czyszczenia parownika'],
              workDescription: 'Demontaż, czyszczenie chemiczne, test szczelności, uzupełnienie czynnika'
            },
            {
              id: 'APP_102',
              orderId: 'ORD25272102',
              time: '14:00',
              duration: 120,
              status: 'planned',
              client: {
                name: 'Elżbieta Nowacka',
                phone: '+48 622 333 444',
                address: 'ul. Czarnowska 23, Kielce',
                coordinates: { lat: 50.8720, lng: 20.6450 }
              },
              device: {
                type: 'Piekarnik',
                brand: 'Electrolux',
                model: 'EOB3400AOX',
                issue: 'Nie nagrzewa do wysokich temperatur - grzałka górna',
                serialNumber: 'ELX444555666'
              },
              estimatedCost: 280,
              notes: 'Sprawdzić grzałkę górną i termostat. Klient zgłasza że piekarnik nie osiąga temp. powyżej 180°C.',
              partsUsed: ['Grzałka górna (w razie potrzeby)', 'Termostat piekarnika'],
              workDescription: 'Diagnostyka systemu grzewczego, pomiar rezystancji grzałek, test termostatu'
            },
            {
              id: 'APP_103',
              orderId: 'ORD25272103',
              time: '16:30',
              duration: 90,
              status: 'planned',
              client: {
                name: 'Paweł Kowalczyk',
                phone: '+48 733 444 555',
                address: 'ul. Pakowa 12, Kielce',
                coordinates: { lat: 50.8640, lng: 20.6320 }
              },
              device: {
                type: 'Suszarka',
                brand: 'Beko',
                model: 'DRX722W',
                issue: 'Nie suszy - prawdopodobnie grzałka lub czujnik wilgotności',
                serialNumber: 'BEK777888999'
              },
              estimatedCost: 350,
              notes: 'Ostatnia wizyta dnia. Sprawdzić grzałkę, filtr oczek i czujnik wilgotności.',
              partsUsed: ['Grzałka suszarki', 'Filtr oczek', 'Czujnik wilgotności'],
              workDescription: 'Diagnostyka systemu suszenia, sprawdzenie drożności przewodów wentylacyjnych'
            }
          ]
        }
      };

      const plan = dayPlans[servicemanId] || dayPlans['USER_001'];
      
      // Oblicz podsumowanie
      const summary = {
        totalAppointments: plan.appointments.length,
        completedAppointments: plan.appointments.filter(a => a.status === 'completed').length,
        inProgressAppointments: plan.appointments.filter(a => a.status === 'in_progress').length,
        plannedAppointments: plan.appointments.filter(a => a.status === 'planned').length,
        totalPlannedTime: plan.appointments.reduce((sum, a) => sum + a.duration, 0),
        totalDistance: calculateTotalDistance(plan),
        estimatedRevenue: plan.appointments.reduce((sum, a) => sum + a.estimatedCost, 0),
        actualRevenue: plan.appointments.reduce((sum, a) => sum + (a.actualCost || 0), 0)
      };

      plan.summary = summary;

      res.status(200).json({
        success: true,
        data: plan,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Serviceman Day Plan API Error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Błąd podczas pobierania planu dnia',
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Metoda ${req.method} nie jest obsługiwana` });
  }
}

function calculateTotalDistance(plan) {
  let totalDistance = 0;
  let currentLocation = plan.serviceman.currentLocation;
  
  plan.appointments.forEach(appointment => {
    const distance = calculateDistance(
      currentLocation.lat, 
      currentLocation.lng,
      appointment.client.coordinates.lat,
      appointment.client.coordinates.lng
    );
    totalDistance += distance;
    currentLocation = appointment.client.coordinates;
  });
  
  // Dodaj powrót do bazy (opcjonalnie)
  const returnDistance = calculateDistance(
    currentLocation.lat,
    currentLocation.lng,
    plan.serviceman.currentLocation.lat,
    plan.serviceman.currentLocation.lng
  );
  totalDistance += returnDistance;
  
  return Math.round(totalDistance * 10) / 10;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Promień Ziemi w km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}