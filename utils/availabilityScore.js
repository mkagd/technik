// utils/availabilityScore.js
// 🎯 System scoringu dostępności fizycznej klienta w domu
// Pomaga technikom planować wizyty i unikać pustych przejazdów

/**
 * Oblicza czas w minutach między dwiema godzinami
 * @param {string} timeFrom - "08:00"
 * @param {string} timeTo - "20:00"
 * @returns {number} - liczba minut
 */
function calculateMinutes(timeFrom, timeTo) {
  const [fromH, fromM] = timeFrom.split(':').map(Number);
  const [toH, toM] = timeTo.split(':').map(Number);
  
  const fromMinutes = fromH * 60 + fromM;
  const toMinutes = toH * 60 + toM;
  
  return toMinutes - fromMinutes;
}

/**
 * Główna funkcja wyliczająca score dostępności 0-100
 * 
 * @param {Object} physicalAvailability - Obiekt dostępności klienta
 * @returns {number} Score 0-100
 */
export function calculateAvailabilityScore(physicalAvailability) {
  if (!physicalAvailability || !physicalAvailability.timeWindows || physicalAvailability.timeWindows.length === 0) {
    return 0; // Brak informacji = 0 pkt
  }

  let score = 0;
  const { timeWindows, presenceHistory, preferences } = physicalAvailability;

  // ========== 1. SZEROKOŚĆ OKIEN CZASOWYCH (60 pkt) ==========
  let totalMinutesPerWeek = 0;
  
  timeWindows.forEach(window => {
    const minutes = calculateMinutes(window.timeFrom, window.timeTo);
    const daysCount = window.days.length;
    totalMinutesPerWeek += minutes * daysCount;
  });
  
  // Max możliwość: 7 dni × 12h (8:00-20:00) = 84h = 5040 minut
  // Każda minuta = 60/5040 = 0.0119 pkt
  const widthScore = Math.min(60, (totalMinutesPerWeek / 5040) * 60);
  score += widthScore;

  // ========== 2. HISTORIA OBECNOŚCI (30 pkt) ==========
  if (presenceHistory && presenceHistory.length > 0) {
    const successfulVisits = presenceHistory.filter(v => v.wasHome).length;
    const successRate = (successfulVisits / presenceHistory.length) * 100;
    score += (successRate / 100) * 30;
  } else {
    // Brak historii = przyznaj 20 pkt (benefit of doubt)
    score += 20;
  }

  // ========== 3. ELASTYCZNOŚĆ (10 pkt) ==========
  if (preferences) {
    if (preferences.flexibleSchedule) {
      score += 10; // Elastyczny harmonogram = full punkty
    } else if (!preferences.requiresAdvanceNotice) {
      score += 5; // Nie wymaga powiadomienia = połowa punktów
    }
  }

  // ========== 4. BONUS ZA DOSTĘPNOŚĆ W DNI ROBOCZE (+10) ==========
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const hasWeekdayAvailability = timeWindows.some(window =>
    window.days.some(day => weekdays.includes(day))
  );
  
  if (hasWeekdayAvailability) {
    score += 10;
  }

  // ========== 5. BONUS ZA DŁUGIE OKNA (+5) ==========
  const hasLongWindow = timeWindows.some(window => {
    const minutes = calculateMinutes(window.timeFrom, window.timeTo);
    return minutes >= 360; // 6+ godzin
  });
  
  if (hasLongWindow) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Określa kategorię klienta na podstawie score
 * 
 * @param {number} score - Score 0-100
 * @returns {Object} { category, label, color, emoji, description }
 */
export function getAvailabilityCategory(score) {
  if (score >= 90) {
    return {
      category: 'full-day',
      label: 'Cały dzień',
      color: 'green',
      emoji: '🏠',
      description: 'Zawsze w domu - łatwo zaplanować',
      badgeClass: 'bg-green-100 text-green-800'
    };
  } else if (score >= 70) {
    return {
      category: 'after-work',
      label: 'Po pracy',
      color: 'blue',
      emoji: '🕐',
      description: 'Dostępny po godzinach pracy',
      badgeClass: 'bg-blue-100 text-blue-800'
    };
  } else if (score >= 50) {
    return {
      category: 'evening-only',
      label: 'Tylko wieczory',
      color: 'yellow',
      emoji: '🌙',
      description: 'Wąskie okno czasowe',
      badgeClass: 'bg-yellow-100 text-yellow-800'
    };
  } else if (score >= 30) {
    return {
      category: 'weekends-only',
      label: 'Tylko weekendy',
      color: 'orange',
      emoji: '📅',
      description: 'Dostępny głównie w weekendy',
      badgeClass: 'bg-orange-100 text-orange-800'
    };
  } else {
    return {
      category: 'very-limited',
      label: 'Trudno dostępny',
      color: 'red',
      emoji: '⚠️',
      description: 'Bardzo ograniczona dostępność',
      badgeClass: 'bg-red-100 text-red-800'
    };
  }
}

/**
 * Sprawdza czy klient jest dostępny w danym dniu i godzinie
 * 
 * @param {Object} physicalAvailability - Obiekt dostępności
 * @param {Date} dateTime - Data i godzina wizyty
 * @returns {Object} { available, reason, suggestion }
 */
export function checkAvailability(physicalAvailability, dateTime) {
  if (!physicalAvailability || !physicalAvailability.timeWindows) {
    return { 
      available: null, 
      reason: 'Brak informacji o dostępności',
      suggestion: 'Skontaktuj się z klientem w celu ustalenia dostępności'
    };
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dateTime.getDay()];
  const timeString = dateTime.toTimeString().slice(0, 5); // "HH:MM"
  const [hours, minutes] = timeString.split(':').map(Number);
  const targetMinutes = hours * 60 + minutes;

  // Sprawdź wszystkie okna
  for (const window of physicalAvailability.timeWindows) {
    if (window.days.includes(dayName)) {
      const [fromH, fromM] = window.timeFrom.split(':').map(Number);
      const [toH, toM] = window.timeTo.split(':').map(Number);
      const fromMinutes = fromH * 60 + fromM;
      const toMinutes = toH * 60 + toM;

      if (targetMinutes >= fromMinutes && targetMinutes <= toMinutes) {
        return {
          available: true,
          reason: `Klient dostępny w tym czasie (${window.label || window.timeFrom + '-' + window.timeTo})`,
          suggestion: null
        };
      }
    }
  }

  // Nie znaleziono okna - poszukaj sugestii
  const availableWindows = physicalAvailability.timeWindows
    .filter(w => w.days.includes(dayName))
    .map(w => `${w.timeFrom}-${w.timeTo}`)
    .join(', ');

  if (availableWindows) {
    return {
      available: false,
      reason: `Klient niedostępny o tej godzinie`,
      suggestion: `W tym dniu klient dostępny: ${availableWindows}`
    };
  }

  // Sprawdź inne dni
  const otherDays = physicalAvailability.timeWindows
    .flatMap(w => w.days)
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  const dayLabels = {
    monday: 'Poniedziałek',
    tuesday: 'Wtorek',
    wednesday: 'Środa',
    thursday: 'Czwartek',
    friday: 'Piątek',
    saturday: 'Sobota',
    sunday: 'Niedziela'
  };

  return {
    available: false,
    reason: `Klient niedostępny w ${dayLabels[dayName]}`,
    suggestion: `Klient dostępny w: ${otherDays.map(d => dayLabels[d]).join(', ')}`
  };
}

/**
 * Generuje rekomendacje najlepszych terminów
 * 
 * @param {Object} physicalAvailability - Obiekt dostępności
 * @param {number} daysAhead - Ile dni naprzód szukać (default 7)
 * @returns {Array} - Lista rekomendowanych slotów [{date, time, score, reason}]
 */
export function getBestTimeSlots(physicalAvailability, daysAhead = 7) {
  if (!physicalAvailability || !physicalAvailability.timeWindows) {
    return [];
  }

  const slots = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];

    // Znajdź okna dla tego dnia
    const windowsForDay = physicalAvailability.timeWindows.filter(w => 
      w.days.includes(dayName)
    );

    windowsForDay.forEach(window => {
      const windowMinutes = calculateMinutes(window.timeFrom, window.timeTo);
      let slotScore = 50;

      // Punktacja
      if (windowMinutes >= 360) slotScore += 20; // 6+ godzin
      if (windowMinutes >= 240) slotScore += 10; // 4+ godzin
      if (['saturday', 'sunday'].includes(dayName)) slotScore += 15; // Weekend
      if (window.timeFrom <= '10:00') slotScore += 10; // Rano dostępny

      slots.push({
        date: date.toISOString().split('T')[0],
        dayName: dayName,
        timeFrom: window.timeFrom,
        timeTo: window.timeTo,
        score: Math.min(100, slotScore),
        reason: `${window.label || 'Dostępny'} (${windowMinutes / 60}h okno)`,
        isWeekend: ['saturday', 'sunday'].includes(dayName)
      });
    });
  }

  // Sortuj po score
  return slots.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Aktualizuje historię obecności po wizycie
 * 
 * @param {Object} physicalAvailability - Obiekt dostępności
 * @param {Object} visitData - { visitDate, scheduledTime, wasHome, arrivedOnTime, notes }
 * @returns {Object} - Zaktualizowany obiekt physicalAvailability
 */
export function updatePresenceHistory(physicalAvailability, visitData) {
  if (!physicalAvailability) {
    physicalAvailability = {
      timeWindows: [],
      presenceHistory: [],
      stats: {
        totalVisits: 0,
        successfulVisits: 0,
        successRate: 0
      }
    };
  }

  if (!physicalAvailability.presenceHistory) {
    physicalAvailability.presenceHistory = [];
  }

  // Dodaj do historii
  physicalAvailability.presenceHistory.push({
    visitDate: visitData.visitDate,
    scheduledTime: visitData.scheduledTime,
    wasHome: visitData.wasHome,
    arrivedOnTime: visitData.arrivedOnTime || false,
    notes: visitData.notes || '',
    recordedAt: new Date().toISOString()
  });

  // Ogranicz historię do ostatnich 20 wizyt
  if (physicalAvailability.presenceHistory.length > 20) {
    physicalAvailability.presenceHistory = physicalAvailability.presenceHistory.slice(-20);
  }

  // Przelicz statystyki
  const total = physicalAvailability.presenceHistory.length;
  const successful = physicalAvailability.presenceHistory.filter(v => v.wasHome).length;

  physicalAvailability.stats = {
    totalVisits: total,
    successfulVisits: successful,
    successRate: Math.round((successful / total) * 100),
    lastVisitDate: visitData.visitDate
  };

  // Przelicz score
  physicalAvailability.score = calculateAvailabilityScore(physicalAvailability);

  return physicalAvailability;
}

/**
 * Tworzy domyślny obiekt dostępności
 * 
 * @param {string} type - 'full-day' | 'after-work' | 'weekends' | 'custom'
 * @returns {Object} - Obiekt physicalAvailability
 */
export function createDefaultAvailability(type = 'full-day') {
  const templates = {
    'full-day': {
      timeWindows: [
        {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          timeFrom: '08:00',
          timeTo: '20:00',
          label: 'Cały dzień'
        }
      ],
      preferences: {
        flexibleSchedule: true,
        requiresAdvanceNotice: false,
        advanceNoticeHours: 0
      }
    },
    'after-work': {
      timeWindows: [
        {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeFrom: '16:00',
          timeTo: '20:00',
          label: 'Po pracy'
        },
        {
          days: ['saturday', 'sunday'],
          timeFrom: '08:00',
          timeTo: '20:00',
          label: 'Weekend'
        }
      ],
      preferences: {
        flexibleSchedule: false,
        requiresAdvanceNotice: true,
        advanceNoticeHours: 24
      }
    },
    'weekends': {
      timeWindows: [
        {
          days: ['saturday', 'sunday'],
          timeFrom: '10:00',
          timeTo: '18:00',
          label: 'Weekendy'
        }
      ],
      preferences: {
        flexibleSchedule: false,
        requiresAdvanceNotice: true,
        advanceNoticeHours: 48
      }
    },
    'custom': {
      timeWindows: [],
      preferences: {
        flexibleSchedule: false,
        requiresAdvanceNotice: false,
        advanceNoticeHours: 0
      }
    }
  };

  const template = templates[type] || templates['custom'];

  return {
    score: 0,
    timeWindows: template.timeWindows,
    preferences: template.preferences,
    notes: [],
    presenceHistory: [],
    stats: {
      totalVisits: 0,
      successfulVisits: 0,
      successRate: 0
    },
    category: type,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  };
}

// Export wszystkich funkcji
export default {
  calculateAvailabilityScore,
  getAvailabilityCategory,
  checkAvailability,
  getBestTimeSlots,
  updatePresenceHistory,
  createDefaultAvailability
};
