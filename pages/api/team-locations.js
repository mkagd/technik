// API endpoint dla lokalizacji zespołu
// pages/api/team-locations.js

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Symulacja danych lokalizacji zespołu z rzeczywistymi zleceniami
      const teamLocations = [
        {
          id: 'USER_001',
          name: 'Jan Kowalski',
          role: 'Technik Senior',
          phone: '+48 123 456 789',
          status: 'online',
          currentLocation: {
            lat: 50.8661,
            lng: 20.6286,
            address: 'ul. Sienkiewicza 45, Kielce',
            accuracy: 8,
            lastUpdate: new Date().toISOString()
          },
          destination: {
            lat: 50.8700,
            lng: 20.6350,
            address: 'ul. Wesoła 15, Kielce',
            estimatedArrival: new Date(Date.now() + 900000).toISOString(),
            client: 'Andrzej Nowak',
            orderId: 'ORD25272001'
          },
          currentTask: {
            id: 'TOD76062628085',
            title: 'Naprawa pralki Samsung WF80F5E5W4W',
            priority: 'high',
            estimatedDuration: 180,
            description: 'Wymiana pompy odpływowej, czyszczenie filtra',
            clientName: 'Andrzej Nowak',
            deviceType: 'Pralka',
            deviceBrand: 'Samsung',
            deviceModel: 'WF80F5E5W4W'
          },
          todayStats: {
            tasksCompleted: 3,
            tasksRemaining: 2,
            totalDistance: 65.2,
            totalTime: 7.5,
            efficiency: 94
          },
          route: [
            {
              time: '08:00',
              task: '🏠 Rozpoczęcie pracy - Baza',
              location: 'ul. Warszawska 1, Kielce',
              status: 'completed'
            },
            {
              time: '08:30',
              task: 'UKOŃCZONE: Naprawa lodówki Bosch',
              location: 'ul. Paderewskiego 12, Kielce',
              status: 'completed',
              duration: 90,
              client: 'Maria Kowalczyk'
            },
            {
              time: '10:30',
              task: 'UKOŃCZONE: Przegląd klimatyzacji',
              location: 'ul. Krakowska 45, Kielce',
              status: 'completed',
              duration: 60,
              client: 'Firma ABC Sp. z o.o.'
            },
            {
              time: '12:00',
              task: 'UKOŃCZONE: Wymiana filtra w odkurzaczu',
              location: 'ul. Żółkiewskiego 8, Kielce',
              status: 'completed',
              duration: 45,
              client: 'Jan Nowacki'
            },
            {
              time: '14:00',
              task: 'W TRAKCIE: Naprawa pralki Samsung',
              location: 'ul. Wesoła 15, Kielce',
              status: 'in_progress',
              estimatedDuration: 180,
              client: 'Andrzej Nowak'
            },
            {
              time: '16:30',
              task: 'PLANOWANE: Diagnostyka zmywarki',
              location: 'ul. Słowackiego 22, Kielce',
              status: 'planned',
              estimatedDuration: 120,
              client: 'Anna Wiśniewska'
            }
          ]
        },
        {
          id: 'USER_002',
          name: 'Michał Nowak',
          role: 'Technik',
          phone: '+48 987 654 321',
          status: 'busy',
          currentLocation: {
            lat: 50.8847,
            lng: 20.6492,
            address: 'ul. Krakowska 123, Kielce',
            accuracy: 12,
            lastUpdate: new Date(Date.now() - 300000).toISOString() // 5 min temu
          },
          destination: {
            lat: 50.8720,
            lng: 20.6280,
            address: 'ul. Mickiewicza 67, Kielce',
            estimatedArrival: new Date(Date.now() + 1200000).toISOString(),
            client: 'Małgorzata Kowalska',
            orderId: 'ORD25272002'
          },
          currentTask: {
            id: 'TOD76062628086',
            title: 'Wymiana termostatu w lodówce Whirlpool',
            priority: 'medium',
            estimatedDuration: 120,
            description: 'Diagnostyka i wymiana uszkodzonego termostatu',
            clientName: 'Małgorzata Kowalska',
            deviceType: 'Lodówka',
            deviceBrand: 'Whirlpool',
            deviceModel: 'WBE3325 NFX'
          },
          todayStats: {
            tasksCompleted: 2,
            tasksRemaining: 3,
            totalDistance: 42.8,
            totalTime: 6.0,
            efficiency: 87
          },
          route: [
            {
              time: '08:00',
              task: '🏠 Rozpoczęcie pracy - Baza',
              location: 'ul. Warszawska 1, Kielce',
              status: 'completed'
            },
            {
              time: '09:00',
              task: 'UKOŃCZONE: Czyszczenie klimatyzacji',
              location: 'ul. Sportowa 34, Kielce',
              status: 'completed',
              duration: 75,
              client: 'Hotel Ibis'
            },
            {
              time: '11:00',
              task: 'UKOŃCZONE: Naprawa mikrofalówki',
              location: 'ul. Planty 15, Kielce',
              status: 'completed',
              duration: 90,
              client: 'Krzysztof Zieliński'
            },
            {
              time: '13:30',
              task: 'W DRODZE: Do klienta Kowalska',
              location: 'ul. Mickiewicza 67, Kielce',
              status: 'traveling',
              client: 'Małgorzata Kowalska'
            },
            {
              time: '14:00',
              task: 'PLANOWANE: Wymiana termostatu lodówki',
              location: 'ul. Mickiewicza 67, Kielce',
              status: 'planned',
              estimatedDuration: 120,
              client: 'Małgorzata Kowalska'
            },
            {
              time: '16:00',
              task: 'PLANOWANE: Przegląd piekarnika',
              location: 'ul. Źródłowa 9, Kielce',
              status: 'planned',
              estimatedDuration: 90,
              client: 'Paweł Mazur'
            }
          ]
        },
        {
          id: 'USER_003',
          name: 'Anna Kowalczyk',
          role: 'Specjalista AGD',
          phone: '+48 555 123 456',
          status: 'online',
          currentLocation: {
            lat: 50.8520,
            lng: 20.5980,
            address: 'ul. Targowa 88, Kielce',
            accuracy: 5,
            lastUpdate: new Date(Date.now() - 120000).toISOString() // 2 min temu
          },
          destination: {
            lat: 50.8590,
            lng: 20.6180,
            address: 'ul. Jagiellońska 45, Kielce',
            estimatedArrival: new Date(Date.now() + 600000).toISOString(),
            client: 'Tomasz Wiśniewski',
            orderId: 'ORD25272003'
          },
          currentTask: {
            id: 'TOD76062628087',
            title: 'Instalacja nowej zmywarki Bosch',
            priority: 'high',
            estimatedDuration: 150,
            description: 'Podłączenie, konfiguracja i test nowej zmywarki',
            clientName: 'Tomasz Wiśniewski',
            deviceType: 'Zmywarka',
            deviceBrand: 'Bosch',
            deviceModel: 'SMS6ZCI42E'
          },
          todayStats: {
            tasksCompleted: 4,
            tasksRemaining: 1,
            totalDistance: 78.3,
            totalTime: 8.2,
            efficiency: 96
          },
          route: [
            {
              time: '07:30',
              task: '🏠 Rozpoczęcie pracy - Baza',
              location: 'ul. Warszawska 1, Kielce',
              status: 'completed'
            },
            {
              time: '08:00',
              task: 'UKOŃCZONE: Naprawa pralki Electrolux',
              location: 'ul. Warszawska 156, Kielce',
              status: 'completed',
              duration: 105,
              client: 'Barbara Nowak'
            },
            {
              time: '10:00',
              task: 'UKOŃCZONE: Wymiana uszczelki lodówki',
              location: 'ul. Czarnowska 23, Kielce',
              status: 'completed',
              duration: 60,
              client: 'Marek Kowalski'
            },
            {
              time: '11:30',
              task: 'UKOŃCZONE: Czyszczenie odkurzacza',
              location: 'ul. Pakowa 12, Kielce',
              status: 'completed',
              duration: 45,
              client: 'Elżbieta Mazur'
            },
            {
              time: '13:00',
              task: 'UKOŃCZONE: Przegląd klimatyzacji',
              location: 'ul. Targowa 88, Kielce',
              status: 'completed',
              duration: 90,
              client: 'Biuro Rachunkowe XYZ'
            },
            {
              time: '15:00',
              task: 'PLANOWANE: Instalacja zmywarki Bosch',
              location: 'ul. Jagiellońska 45, Kielce',
              status: 'planned',
              estimatedDuration: 150,
              client: 'Tomasz Wiśniewski'
            }
          ]
        },
        {
          id: 'USER_004',
          name: 'Piotr Zieliński',
          role: 'Technik Junior',
          phone: '+48 666 789 012',
          status: 'offline',
          currentLocation: {
            lat: 50.8580,
            lng: 20.6240,
            address: 'ul. Warszawska 1, Kielce (Baza)',
            accuracy: 3,
            lastUpdate: new Date(Date.now() - 1800000).toISOString() // 30 min temu
          },
          destination: null,
          currentTask: null, // Zakończył pracę
          todayStats: {
            tasksCompleted: 5,
            tasksRemaining: 0,
            totalDistance: 89.7,
            totalTime: 8.0,
            efficiency: 92
          },
          route: [
            {
              time: '08:00',
              task: '🏠 Rozpoczęcie pracy - Baza',
              location: 'ul. Warszawska 1, Kielce',
              status: 'completed'
            },
            {
              time: '08:30',
              task: 'UKOŃCZONE: Naprawa suszarki Beko',
              location: 'ul. Seminaryjska 33, Kielce',
              status: 'completed',
              duration: 120,
              client: 'Józef Kowalczyk'
            },
            {
              time: '11:00',
              task: 'UKOŃCZONE: Wymiana węży pralki',
              location: 'ul. Kościuszki 78, Kielce',
              status: 'completed',
              duration: 75,
              client: 'Agnieszka Nowacka'
            },
            {
              time: '13:00',
              task: 'UKOŃCZONE: Czyszczenie piekarnika',
              location: 'ul. Słoneczna 19, Kielce',
              status: 'completed',
              duration: 90,
              client: 'Robert Mazur'
            },
            {
              time: '14:30',
              task: 'UKOŃCZONE: Przegląd lodówki Samsung',
              location: 'ul. Ogrodowa 44, Kielce',
              status: 'completed',
              duration: 60,
              client: 'Katarzyna Wiśniewska'
            },
            {
              time: '15:45',
              task: 'UKOŃCZONE: Naprawa mikrofalówki',
              location: 'ul. Złota 7, Kielce',
              status: 'completed',
              duration: 45,
              client: 'Andrzej Kowalski'
            },
            {
              time: '16:30',
              task: '🏠 Powrót do bazy - Koniec pracy',
              location: 'ul. Warszawska 1, Kielce',
              status: 'completed'
            }
          ]
        }
      ];

      // Filtrowanie po parametrach
      const { status, activeOnly } = req.query;
      
      let filteredTeam = teamLocations;
      
      if (status) {
        filteredTeam = filteredTeam.filter(member => member.status === status);
      }
      
      if (activeOnly === 'true') {
        filteredTeam = filteredTeam.filter(member => member.status !== 'offline');
      }

      // Dodanie statystyk zespołu
      const teamStats = {
        totalMembers: teamLocations.length,
        activeMembers: teamLocations.filter(m => m.status !== 'offline').length,
        onlineMembers: teamLocations.filter(m => m.status === 'online').length,
        busyMembers: teamLocations.filter(m => m.status === 'busy').length,
        offlineMembers: teamLocations.filter(m => m.status === 'offline').length,
        totalTasksToday: teamLocations.reduce((sum, m) => sum + m.todayStats.tasksCompleted + m.todayStats.tasksRemaining, 0),
        completedTasksToday: teamLocations.reduce((sum, m) => sum + m.todayStats.tasksCompleted, 0),
        totalDistanceToday: Math.round(teamLocations.reduce((sum, m) => sum + m.todayStats.totalDistance, 0) * 10) / 10,
        averageEfficiency: Math.round(teamLocations.reduce((sum, m) => sum + m.todayStats.efficiency, 0) / teamLocations.length),
        lastUpdate: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: {
          teamMembers: filteredTeam,
          stats: teamStats,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Team Locations API Error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Błąd podczas pobierania lokalizacji zespołu',
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Metoda ${req.method} nie jest obsługiwana` });
  }
}