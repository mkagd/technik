// pages/api/ai-suggestions.js - AI Inteligentne sugestie diagnozowania problemów AGD

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tylko POST dozwolone' });
  }

  const { device, problem, brand, model, userInfo } = req.body;

  if (!device || !problem) {
    return res.status(400).json({ error: 'Urządzenie i problem są wymagane' });
  }

  try {
    const suggestions = generateAISuggestions(device, problem, brand, model);
    
    return res.status(200).json({
      success: true,
      suggestions,
      confidence: suggestions.confidence,
      estimatedCost: suggestions.estimatedCost,
      timeEstimate: suggestions.timeEstimate,
      priority: suggestions.priority
    });

  } catch (error) {
    console.error('Błąd AI suggestions:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd analizy AI'
    });
  }
}

// SYSTEM INTELIGENTNEJ DIAGNOZY PROBLEMÓW AGD
function generateAISuggestions(device, problem, brand = '', model = '') {
  const deviceLower = device.toLowerCase();
  const problemLower = problem.toLowerCase();
  const brandLower = brand.toLowerCase();
  
  // BAZA WIEDZY O PROBLEMACH AGD Z PRAWDOPODOBIEŃSTWAMI
  const knowledgeBase = {
    'pralka': {
      'nie włącza się': {
        causes: [
          { cause: 'Brak zasilania/wyłączony bezpiecznik', probability: 35, cost: '0-50zł', time: '15min' },
          { cause: 'Uszkodzona wtyczka/przewód zasilający', probability: 25, cost: '30-80zł', time: '30min' },
          { cause: 'Uszkodzony włącznik', probability: 20, cost: '60-120zł', time: '45min' },
          { cause: 'Uszkodzony moduł sterowania', probability: 15, cost: '200-400zł', time: '90min' },
          { cause: 'Uszkodzona blokada drzwi', probability: 5, cost: '80-150zł', time: '60min' }
        ],
        priority: 'medium',
        urgency: 'normalny',
        tips: ['Sprawdź czy jest prąd w gniazdku', 'Upewnij się że drzwi są dobrze zamknięte', 'Sprawdź bezpieczniki w skrzynce']
      },
      'nie wiruje': {
        causes: [
          { cause: 'Zablokowany filtr pompy', probability: 40, cost: '50-100zł', time: '30min' },
          { cause: 'Uszkodzona pompa odpływowa', probability: 25, cost: '150-250zł', time: '90min' },
          { cause: 'Zerwany pasek napędowy', probability: 20, cost: '80-150zł', time: '60min' },
          { cause: 'Uszkodzony silnik', probability: 10, cost: '300-500zł', time: '120min' },
          { cause: 'Problem z modułem sterowania', probability: 5, cost: '200-400zł', time: '90min' }
        ],
        priority: 'high',
        urgency: 'pilny',
        tips: ['Sprawdź czy w filtrze nie ma monet/spinaczy', 'Nie używaj pralki do momentu naprawy', 'Może być problem z odpompowaniem wody']
      },
      'wycieka woda': {
        causes: [
          { cause: 'Uszkodzona uszczelka drzwi', probability: 35, cost: '80-150zł', time: '45min' },
          { cause: 'Poluzowane połączenia węży', probability: 30, cost: '30-80zł', time: '30min' },
          { cause: 'Uszkodzony wąż doprowadzający', probability: 20, cost: '50-120zł', time: '45min' },
          { cause: 'Uszkodzona pompa', probability: 10, cost: '150-250zł', time: '90min' },
          { cause: 'Pęknięty bęben', probability: 5, cost: '400-800zł', time: '180min' }
        ],
        priority: 'high',
        urgency: 'pilny',
        tips: ['Wyłącz pralkę natychmiast', 'Zamknij dopływ wody', 'Usuń wodę spod pralki żeby uniknąć szkód']
      },
      'nie grzeje wody': {
        causes: [
          { cause: 'Uszkodzona grzałka', probability: 50, cost: '150-250zł', time: '90min' },
          { cause: 'Uszkodzony termostat', probability: 25, cost: '80-150zł', time: '60min' },
          { cause: 'Problem z modułem sterowania', probability: 15, cost: '200-400zł', time: '90min' },
          { cause: 'Uszkodzone okablowanie', probability: 10, cost: '100-200zł', time: '75min' }
        ],
        priority: 'medium',
        urgency: 'normalny',
        tips: ['Sprawdź czy jest ustawiona właściwa temperatura', 'Można używać programów zimnych do momentu naprawy']
      }
    },
    'zmywarka': {
      'nie myje dobrze': {
        causes: [
          { cause: 'Zablokowane ramiona spryskujące', probability: 40, cost: '50-100zł', time: '30min' },
          { cause: 'Brudne filtry', probability: 30, cost: '30-80zł', time: '30min' },
          { cause: 'Za mała ilość detergentu', probability: 15, cost: '0zł', time: '0min' },
          { cause: 'Uszkodzona pompa cyrkulacyjna', probability: 10, cost: '200-350zł', time: '120min' },
          { cause: 'Problem z czujnikiem mętności', probability: 5, cost: '150-250zł', time: '90min' }
        ],
        priority: 'medium',
        urgency: 'normalny',
        tips: ['Sprawdź czy ramiona spryskujące obracają się swobodnie', 'Oczyść filtry w dolnej części', 'Użyj profesjonalnego detergentu']
      },
      'zostaje woda na dnie': {
        causes: [
          { cause: 'Zablokowany filtr odpływowy', probability: 50, cost: '50-100zł', time: '30min' },
          { cause: 'Uszkodzona pompa odpływowa', probability: 30, cost: '150-300zł', time: '90min' },
          { cause: 'Zatkany syfon/odpływ', probability: 15, cost: '80-150zł', time: '45min' },
          { cause: 'Uszkodzony wąż odpływowy', probability: 5, cost: '60-120zł', time: '45min' }
        ],
        priority: 'high',
        urgency: 'pilny',
        tips: ['Nie używaj zmywarki dopóki woda stoi', 'Sprawdź czy syfon pod zlewem nie jest zatkany', 'Usuń wodę ręcznie przed wizytą serwisanta']
      }
    },
    'lodówka': {
      'nie chłodzi': {
        causes: [
          { cause: 'Uszkodzony termostat', probability: 35, cost: '120-200zł', time: '60min' },
          { cause: 'Uszkodzony kompresor', probability: 25, cost: '300-600zł', time: '120min' },
          { cause: 'Wyciek płynu chłodniczego', probability: 20, cost: '200-400zł', time: '90min' },
          { cause: 'Uszkodzona uszczelka drzwi', probability: 15, cost: '80-150zł', time: '45min' },
          { cause: 'Zabrudzone skraplacz', probability: 5, cost: '50-100zł', time: '30min' }
        ],
        priority: 'critical',
        urgency: 'krytyczny',
        tips: ['To pilne - jedzenie się psuje!', 'Przenieś produkty do innej lodówki/torby termicznej', 'Nie otwieraj drzwi często']
      },
      'głośno pracuje': {
        causes: [
          { cause: 'Zużyte łożyska kompresora', probability: 40, cost: '200-350zł', time: '90min' },
          { cause: 'Uszkodzony wentylator', probability: 30, cost: '100-200zł', time: '60min' },
          { cause: 'Niedostateczne wypoziomowanie', probability: 20, cost: '0-50zł', time: '15min' },
          { cause: 'Oblodzenie parownika', probability: 10, cost: '80-150zł', time: '120min' }
        ],
        priority: 'low',
        urgency: 'normalny',
        tips: ['Sprawdź czy lodówka stoi równo', 'Normalnie może pracować do momentu naprawy']
      }
    },
    'piekarnik': {
      'nie grzeje': {
        causes: [
          { cause: 'Uszkodzona grzałka dolna', probability: 40, cost: '150-250zł', time: '75min' },
          { cause: 'Uszkodzona grzałka górna', probability: 30, cost: '150-250zł', time: '75min' },
          { cause: 'Uszkodzony termostat', probability: 20, cost: '100-180zł', time: '60min' },
          { cause: 'Problem z modułem sterowania', probability: 10, cost: '200-400zł', time: '90min' }
        ],
        priority: 'medium',
        urgency: 'normalny',
        tips: ['Sprawdź czy świeci się lampka w piekarniku', 'Upewnij się że jest ustawiona właściwa temperatura']
      }
    },
    'mikrofalówka': {
      'nie grzeje': {
        causes: [
          { cause: 'Uszkodzony magnetron', probability: 50, cost: '200-400zł', time: '90min' },
          { cause: 'Uszkodzony transformator wysokiego napięcia', probability: 25, cost: '150-300zł', time: '75min' },
          { cause: 'Uszkodzona dioda wysokiego napięcia', probability: 15, cost: '80-150zł', time: '45min' },
          { cause: 'Problem z panelem sterowania', probability: 10, cost: '100-200zł', time: '60min' }
        ],
        priority: 'medium',
        urgency: 'normalny',
        tips: ['Sprawdź czy talerz obraca się', 'Sprawdź czy oświetlenie działa', 'Nie używaj jeśli iskrzy w środku']
      }
    }
  };

  // ZNAJDŹ NAJLEPSZE DOPASOWANIE PROBLEMU
  let bestMatch = findBestProblemMatch(deviceLower, problemLower, knowledgeBase);
  
  if (!bestMatch) {
    // FALLBACK - ogólna diagnoza
    bestMatch = {
      causes: [
        { cause: 'Ogólna usterka wymagająca diagnozy', probability: 100, cost: '80-300zł', time: '60-120min' }
      ],
      priority: 'medium',
      urgency: 'normalny',
      tips: ['Opisz problem dokładniej podczas wizyty serwisanta']
    };
  }

  // OBLICZ KOŃCOWE STATYSTYKI
  const primaryCause = bestMatch.causes[0];
  const totalCost = calculateTotalCost(bestMatch.causes, brand);
  const confidence = calculateConfidence(problemLower, bestMatch);
  
  return {
    device: device,
    problem: problem,
    diagnosis: {
      primaryCause: primaryCause.cause,
      probability: primaryCause.probability,
      allCauses: bestMatch.causes
    },
    estimatedCost: {
      min: totalCost.min,
      max: totalCost.max,
      display: `${totalCost.min}-${totalCost.max}zł`,
      breakdown: {
        parts: `${Math.round(totalCost.min * 0.6)}-${Math.round(totalCost.max * 0.6)}zł`,
        labor: `${Math.round(totalCost.min * 0.4)}-${Math.round(totalCost.max * 0.4)}zł`,
        travel: getTravelCost()
      }
    },
    timeEstimate: {
      min: parseInt(primaryCause.time),
      max: parseInt(primaryCause.time) + 30,
      display: primaryCause.time
    },
    priority: bestMatch.priority,
    urgency: bestMatch.urgency,
    confidence: confidence,
    tips: bestMatch.tips,
    brandSpecific: getBrandSpecificInfo(brand, device),
    nextSteps: generateNextSteps(bestMatch.priority, bestMatch.urgency),
    aiInsights: generateAIInsights(device, problem, brand, bestMatch)
  };
}

// ZNAJDŹ NAJLEPSZE DOPASOWANIE PROBLEMU
function findBestProblemMatch(device, problem, knowledgeBase) {
  if (!knowledgeBase[device]) return null;
  
  const deviceProblems = knowledgeBase[device];
  let bestScore = 0;
  let bestMatch = null;
  
  // SYSTEM PUNKTOWANIA DOPASOWANIA
  for (const [knownProblem, problemData] of Object.entries(deviceProblems)) {
    let score = 0;
    
    // Dokładne dopasowanie
    if (problem.includes(knownProblem)) {
      score += 100;
    }
    
    // Częściowe dopasowanie słów kluczowych
    const knownWords = knownProblem.split(' ');
    const problemWords = problem.split(' ');
    
    for (const knownWord of knownWords) {
      for (const problemWord of problemWords) {
        if (knownWord.includes(problemWord) || problemWord.includes(knownWord)) {
          score += 20;
        }
      }
    }
    
    // Synonymy i podobne problemy
    const synonyms = {
      'nie działa': ['nie włącza', 'nie pracuje', 'zepsute', 'nie funkcjonuje'],
      'głośno': ['hałas', 'dziwne dźwięki', 'brzęczy', 'stuka'],
      'woda': ['wilgoć', 'kapie', 'przecieka', 'mokro'],
      'nie myje': ['brudne naczynia', 'słabo myje', 'nie czyści']
    };
    
    for (const [key, syns] of Object.entries(synonyms)) {
      if (knownProblem.includes(key)) {
        for (const syn of syns) {
          if (problem.includes(syn)) {
            score += 15;
          }
        }
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = problemData;
    }
  }
  
  return bestMatch;
}

// OBLICZ CAŁKOWITY KOSZT Z UWZGLĘDNIENIEM MARKI
function calculateTotalCost(causes, brand) {
  const primaryCause = causes[0];
  let costRange = primaryCause.cost.match(/(\d+)-(\d+)/);
  
  if (!costRange) {
    return { min: 80, max: 300 };
  }
  
  let min = parseInt(costRange[1]);
  let max = parseInt(costRange[2]);
  
  // KOREKTA CENY WEDŁUG MARKI
  const premiumBrands = ['bosch', 'siemens', 'miele', 'aeg'];
  const budgetBrands = ['beko', 'candy', 'indesit', 'amica'];
  
  if (premiumBrands.includes(brand.toLowerCase())) {
    min *= 1.2;
    max *= 1.3;
  } else if (budgetBrands.includes(brand.toLowerCase())) {
    min *= 0.8;
    max *= 0.9;
  }
  
  // DODAJ KOSZT ROBOCIZNY
  min += 50; // Podstawowa robocizna
  max += 100;
  
  return {
    min: Math.round(min),
    max: Math.round(max)
  };
}

// OBLICZ PEWNOŚĆ DIAGNOZY
function calculateConfidence(problem, match) {
  let confidence = 70; // Bazowa pewność
  
  // Zwiększ pewność jeśli problem jest szczegółowy
  if (problem.length > 20) confidence += 10;
  if (problem.includes('błąd') || problem.includes('kod')) confidence += 15;
  if (problem.includes('dźwięk') || problem.includes('woda') || problem.includes('temperatura')) confidence += 10;
  
  // Zmniejsz pewność jeśli opis jest ogólny
  if (problem.length < 10) confidence -= 20;
  if (problem === 'nie działa' || problem === 'zepsute') confidence -= 30;
  
  return Math.min(Math.max(confidence, 30), 95); // Ograniczenie 30-95%
}

// INFORMACJE SPECYFICZNE DLA MARKI
function getBrandSpecificInfo(brand, device) {
  const brandLower = brand.toLowerCase();
  
  const brandInfo = {
    'bosch': {
      reputation: 'Premium',
      partsAvailability: 'Doskonała',
      commonIssues: 'Elektronika, wysokiej jakości części',
      warranty: 'Często przedłużona gwarancja',
      repairability: 'Wysoka - dobrze naprawialne'
    },
    'samsung': {
      reputation: 'Bardzo dobra',
      partsAvailability: 'Dobra',
      commonIssues: 'Nowoczesna elektronika, czasem skomplikowane',
      warranty: 'Standardowa gwarancja',
      repairability: 'Średnia - wymaga specjalisty'
    },
    'lg': {
      reputation: 'Dobra',
      partsAvailability: 'Dobra',
      commonIssues: 'Niezawodne, rzadko się psują',
      warranty: 'Dobra obsługa gwarancyjna',
      repairability: 'Dobra - przystępne części'
    },
    'beko': {
      reputation: 'Budżetowa',
      partsAvailability: 'Bardzo dobra',
      commonIssues: 'Tanie części, łatwe naprawy',
      warranty: 'Standardowa',
      repairability: 'Wysoka - tanie części'
    }
  };
  
  return brandInfo[brandLower] || {
    reputation: 'Standardowa',
    partsAvailability: 'Dostępne',
    commonIssues: 'Typowe dla marki',
    warranty: 'Według producenta',
    repairability: 'Możliwa do naprawy'
  };
}

// KOSZT DOJAZDU
function getTravelCost() {
  return {
    rzeszow: 'GRATIS 🎁',
    nearby: '30zł (do 30km)',
    far: '50zł (30-50km)',
    veryFar: '1zł/km (powyżej 50km)'
  };
}

// NASTĘPNE KROKI WEDŁUG PRIORYTETU
function generateNextSteps(priority, urgency) {
  const steps = {
    'critical': [
      '🚨 DZWOŃ NATYCHMIAST: +48 123 456 789',
      '⚡ Możliwa wizyta tego samego dnia',
      '🛡️ Wyłącz urządzenie z bezpieczeństwa',
      '📞 Zostaniesz poinformowany o dokładnym czasie przybycia'
    ],
    'high': [
      '📞 Zadzwoń dziś: +48 123 456 789',
      '⏰ Wizyta jutro lub pojutrze',
      '⚠️ Nie używaj urządzenia do naprawy',
      '🔧 Przygotuj dostęp do urządzenia'
    ],
    'medium': [
      '📅 Umów wizytę w ciągu 2-3 dni',
      '📞 Telefon: +48 123 456 789',
      '💡 Urządzenie można ostrożnie używać',
      '📋 Przygotuj dokumenty gwarancyjne'
    ],
    'low': [
      '📅 Wizyta w ciągu tygodnia',
      '📞 Umów telefonicznie: +48 123 456 789',
      '✅ Urządzenie może normalnie pracować',
      '💰 Rozważ czy naprawa jest opłacalna'
    ]
  };
  
  return steps[priority] || steps['medium'];
}

// INTELIGENTNE INSIGHTS AI
function generateAIInsights(device, problem, brand, match) {
  const insights = [];
  
  // ANALIZA WIEKU URZĄDZENIA WEDŁUG MARKI
  if (['bosch', 'siemens', 'miele'].includes(brand.toLowerCase())) {
    insights.push('💡 Urządzenia premium często są opłacalne w naprawie nawet po 8-10 latach');
  } else if (['beko', 'candy', 'indesit'].includes(brand.toLowerCase())) {
    insights.push('💰 Przy urządzeniach budżetowych rozważ koszt naprawy vs. koszt nowego');
  }
  
  // ANALIZA SEZONOWOŚCI
  const month = new Date().getMonth();
  if (device.includes('lodów') && [5, 6, 7, 8].includes(month)) {
    insights.push('🌡️ Lato to szczyt sezonu dla napraw lodówek - priorytet!');
  }
  
  // ANALIZA PROBLEMU
  if (problem.includes('woda') || problem.includes('przeciek')) {
    insights.push('💧 Problemy z wodą mogą prowadzić do szkód - szybka interwencja wskazana');
  }
  
  if (problem.includes('iskr') || problem.includes('dym')) {
    insights.push('⚡ Problemy elektryczne = bezpieczeństwo! Wyłącz z gniazdka');
  }
  
  // WSKAZÓWKI OSZCZĘDNOŚCIOWE
  if (match.priority === 'low') {
    insights.push('💡 Możesz spróbować restart (wyłącz na 30 min) - czasem pomaga');
  }
  
  return insights;
}