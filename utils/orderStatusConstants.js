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
  SCHEDULED: 'scheduled',       // Zaplanowane - przydzielony serwisant i termin
  IN_PROGRESS: 'in_progress',   // W trakcie - serwisant pracuje
  COMPLETED: 'completed',       // Ukończone - naprawa zakończona
  CANCELLED: 'cancelled'        // Anulowane
};

// Statusy aktywne (liczą się do obłożenia w API availability)
export const ACTIVE_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.SCHEDULED,
  ORDER_STATUS.IN_PROGRESS
];

// Statusy nieaktywne (nie liczą się do obłożenia)
export const INACTIVE_STATUSES = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED
];

// Wszystkie dostępne statusy (do walidacji)
export const ALL_STATUSES = Object.values(ORDER_STATUS);

// Opis statusów (dla UI)
export const STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Oczekujące',
  [ORDER_STATUS.SCHEDULED]: 'Zaplanowane',
  [ORDER_STATUS.IN_PROGRESS]: 'W trakcie',
  [ORDER_STATUS.COMPLETED]: 'Ukończone',
  [ORDER_STATUS.CANCELLED]: 'Anulowane'
};

// Kolory statusów (dla UI)
export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    badge: 'bg-yellow-500'
  },
  [ORDER_STATUS.SCHEDULED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    badge: 'bg-blue-500'
  },
  [ORDER_STATUS.IN_PROGRESS]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    badge: 'bg-purple-500'
  },
  [ORDER_STATUS.COMPLETED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    badge: 'bg-green-500'
  },
  [ORDER_STATUS.CANCELLED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    badge: 'bg-red-500'
  }
};

// Ikony dla statusów (emoji)
export const STATUS_ICONS = {
  [ORDER_STATUS.PENDING]: '⏳',
  [ORDER_STATUS.SCHEDULED]: '📅',
  [ORDER_STATUS.IN_PROGRESS]: '🔧',
  [ORDER_STATUS.COMPLETED]: '✅',
  [ORDER_STATUS.CANCELLED]: '❌'
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
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.SCHEDULED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SCHEDULED]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.COMPLETED]: [], // Koniec procesu
    [ORDER_STATUS.CANCELLED]: []  // Koniec procesu
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
