// pages/api/gus.js - Integracja z API Ministerstwa Finansów
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Metoda niedozwolona' });
  }

  const { nip } = req.query;
  
  if (!nip || !/^\d{10}$/.test(nip)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nieprawidlowy NIP. Wymagane 10 cyfr.' 
    });
  }

  console.log('API GUS - zapytanie o NIP:', nip);

  try {
    const today = new Date().toISOString().split('T')[0];
    const apiUrl = `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${today}`;
    
    console.log('Odpytuje API MF:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json', 
        'User-Agent': 'TechnikSerwis/1.0' 
      }
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        console.log(`NIP ${nip} nie znaleziony w API MF (status ${response.status})`);
        return res.status(404).json({ 
          success: false, 
          message: `Nie znaleziono firmy o NIP: ${nip}`, 
          hint: 'Firma może nie być zarejestrowana w VAT lub NIP jest nieprawidłowy. Dodaj dane ręcznie.' 
        });
      }
      throw new Error(`API MF zwrocilo status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.result || !data.result.subject) {
      throw new Error('Nieprawidlowa struktura odpowiedzi');
    }

    const subject = data.result.subject;
    const addressString = subject.residenceAddress || subject.workingAddress || '';
    const match = addressString.match(/^(.+?),\s*(\d{2}-\d{3})\s+(.+)$/);
    
    let address = '';
    let postalCode = '';
    let city = '';
    
    if (match) {
      address = match[1].trim();
      postalCode = match[2].trim();
      city = match[3].trim();
    } else {
      address = addressString;
    }

    const company = {
      nip: subject.nip || nip,
      name: subject.name || 'Brak nazwy',
      regon: subject.regon || null,
      krs: subject.krs || null,
      address: address,
      city: city,
      postalCode: postalCode,
      status: subject.statusVat || 'unknown',
      type: subject.hasVirtualAccounts ? 'VAT czynny' : 'VAT zwolniony'
    };

    console.log('Pobrano dane z API MF:', company.name);
    
    return res.status(200).json({ 
      success: true, 
      company: company, 
      message: `Pobrano dane firmy: ${company.name}`, 
      source: 'mf-api' 
    });

  } catch (error) {
    console.error('Blad API GUS:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Blad podczas pobierania danych z API', 
      error: error.message 
    });
  }
}
