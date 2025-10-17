// Popular cities endpoint - hardcoded (filesystem nie działa na Vercel)

const POPULAR_CITIES = [
  { name: 'Dębica', postalCode: '39-200' },
  { name: 'Mielec', postalCode: '39-300' },
  { name: 'Tarnów', postalCode: '33-100' },
  { name: 'Ropczyce', postalCode: '39-100' },
  { name: 'Rzeszów', postalCode: '35-001' }
];

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Pobierz listę miast
      return res.status(200).json({ 
        success: true, 
        cities: POPULAR_CITIES 
      });
    }

    // Inne metody (POST/DELETE) nie są obsługiwane w wersji hardcoded
    return res.status(405).json({ 
      success: false, 
      error: 'Metoda nie jest obsługiwana - lista miast jest hardcoded' 
    });

  } catch (error) {
    console.error('❌ Błąd w API popular-cities:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Błąd serwera' 
    });
  }
}
