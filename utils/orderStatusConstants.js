/**
 * 📋 Order Status Constants
 * 
 * Centralne miejsce dla wszystkich statusów zamówień.
 * Używaj tych stałych zamiast hardkodowanych stringów!
 * 
 * Szczegóły: ORDER_STATUS_DOCUMENTATION.md
 */

// Dostępne statusy zamówień
export const ORDER_STATUS = {
  PENDING: 'pending',           // Oczekujące - nowa rezerwacja
  CONTACTED: 'contacted',       // Skontaktowano się - wstępny kontakt z klientem
  UNSCHEDULED: 'unscheduled',   // Nieprzypisane - zlecenie bez przypisania do technika/daty
  SCHEDULED: 'scheduled',       // Zaplanowane - przydzielony serwisant i termin
  CONFIRMED: 'confirmed',       // Potwierdzona - klient potwierdził wizytę
  IN_PROGRESS: 'in_progress',   // W trakcie - serwisant pracuje
  WAITING_PARTS: 'waiting_parts', // Oczekuje na części - czeka na dostawę części
  READY: 'ready',               // Gotowe do odbioru - naprawa zakończona, czeka na odbiór
  COMPLETED: 'completed',       // Ukończone - naprawa zakończona i odebrana
  CANCELLED: 'cancelled',       // Anulowane
  NO_SHOW: 'no_show'            // Nie stawił się - klient nie przyszedł na wizytę
};

// Statusy aktywne (liczą się do obłożenia w API availability)
export const ACTIVE_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONTACTED,
  ORDER_STATUS.UNSCHEDULED,
  ORDER_STATUS.SCHEDULED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.WAITING_PARTS
];

// Statusy nieaktywne (nie liczą się do obłożenia)
export const INACTIVE_STATUSES = [
  ORDER_STATUS.READY,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.NO_SHOW
];

// Wszystkie dostępne statusy (do walidacji)
export const ALL_STATUSES = Object.values(ORDER_STATUS);

// Opis statusów (dla UI)
export const STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Oczekuje na kontakt',
  [ORDER_STATUS.CONTACTED]: 'Skontaktowano się',
  [ORDER_STATUS.UNSCHEDULED]: 'Nieprzypisane',
  [ORDER_STATUS.SCHEDULED]: 'Umówiona wizyta',
  [ORDER_STATUS.CONFIRMED]: 'Potwierdzona',
  [ORDER_STATUS.IN_PROGRESS]: 'W trakcie realizacji',
  [ORDER_STATUS.WAITING_PARTS]: 'Oczekuje na części',
  [ORDER_STATUS.READY]: 'Gotowe do odbioru',
  [ORDER_STATUS.COMPLETED]: 'Zakończone',
  [ORDER_STATUS.CANCELLED]: 'Anulowane',
  [ORDER_STATUS.NO_SHOW]: 'Nie stawił się'
};

// Kolory statusów (dla UI)
export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ORDER_STATUS.CONTACTED]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUS.UNSCHEDULED]: 'bg-orange-100 text-orange-800',
  [ORDER_STATUS.SCHEDULED]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUS.CONFIRMED]: 'bg-green-100 text-green-800',
  [ORDER_STATUS.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800',
  [ORDER_STATUS.WAITING_PARTS]: 'bg-orange-100 text-orange-800',
  [ORDER_STATUS.READY]: 'bg-teal-100 text-teal-800',
  [ORDER_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [ORDER_STATUS.NO_SHOW]: 'bg-gray-100 text-gray-800'
};

// Ikony dla statusów (emoji)
export const STATUS_ICONS = {
  [ORDER_STATUS.PENDING]: '⏳',
  [ORDER_STATUS.CONTACTED]: '📞',
  [ORDER_STATUS.UNSCHEDULED]: '📦',
  [ORDER_STATUS.SCHEDULED]: '📅',
  [ORDER_STATUS.CONFIRMED]: '✅',
  [ORDER_STATUS.IN_PROGRESS]: '🔧',
  [ORDER_STATUS.WAITING_PARTS]: '🔩',
  [ORDER_STATUS.READY]: '🎉',
  [ORDER_STATUS.COMPLETED]: '✔️',
  [ORDER_STATUS.CANCELLED]: '❌',
  [ORDER_STATUS.NO_SHOW]: '👻'
};

// Funkcja walidująca status
export function isValidStatus(status) {
  return ALL_STATUSES.includes(status);
}

// Funkcja sprawdzająca czy status jest aktywny
export function isActiveStatus(status) {
  return ACTIVE_STATUSES.includes(status);
}

// Funkcja zwracająca następny możliwy status
export function getNextStatuses(currentStatus) {
  const transitions = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONTACTED, ORDER_STATUS.UNSCHEDULED, ORDER_STATUS.SCHEDULED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONTACTED]: [ORDER_STATUS.SCHEDULED, ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.UNSCHEDULED]: [ORDER_STATUS.SCHEDULED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SCHEDULED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.UNSCHEDULED, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.NO_SHOW, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.NO_SHOW, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.WAITING_PARTS, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.WAITING_PARTS]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.READY]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.COMPLETED]: [], // Koniec procesu
    [ORDER_STATUS.CANCELLED]: [], // Koniec procesu
    [ORDER_STATUS.NO_SHOW]: [ORDER_STATUS.SCHEDULED, ORDER_STATUS.CANCELLED] // Można umówić ponownie
  };
  
  return transitions[currentStatus] || [];
}

// Funkcja sprawdzająca czy można zmienić status
export function canTransitionTo(fromStatus, toStatus) {
  const allowedTransitions = getNextStatuses(fromStatus);
  return allowedTransitions.includes(toStatus);
}

// Export default dla wygody
export default {
  ORDER_STATUS,
  ACTIVE_STATUSES,
  INACTIVE_STATUSES,
  ALL_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ICONS,
  isValidStatus,
  isActiveStatus,
  getNextStatuses,
  canTransitionTo
};
