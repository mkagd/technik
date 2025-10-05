// utils/fieldMapping.js
// 🔧 Uniwersalne funkcje mapowania pól dla kompatybilności wstecznej

/**
 * Pobiera technicianId ze starych i nowych formatów
 * Wspiera: technicianId, assignedTo, employeeId, servicemanId
 */
export function getTechnicianId(obj) {
  return obj?.technicianId || obj?.assignedTo || obj?.employeeId || obj?.servicemanId || null;
}

/**
 * Pobiera technicianName ze starych i nowych formatów
 */
export function getTechnicianName(obj) {
  return obj?.technicianName || obj?.assignedToName || obj?.employeeName || null;
}

/**
 * Normalizuje obiekt do nowego formatu (tylko technicianId)
 * Usuwa stare pola: assignedTo, employeeId, servicemanId
 */
export function normalizeTechnicianFields(obj) {
  if (!obj) return obj;
  
  const technicianId = getTechnicianId(obj);
  const technicianName = getTechnicianName(obj);
  
  // Usuń stare pola
  const { assignedTo, assignedToName, employeeId, employeeName, servicemanId, ...rest } = obj;
  
  // Dodaj tylko nowe
  return {
    ...rest,
    technicianId,
    technicianName
  };
}

/**
 * Mapowanie statusów: Polski → Angielski (backend)
 */
export const STATUS_PL_TO_EN = {
  'oczekujące': 'pending',
  'oczekuje': 'pending',
  'zaplanowane': 'scheduled',
  'zaplanowana': 'scheduled',
  'w-trakcie': 'in-progress',
  'w trakcie': 'in-progress',
  'zakończone': 'completed',
  'zakończona': 'completed',
  'anulowane': 'cancelled',
  'anulowana': 'cancelled',
  'oczekuje-na-czesci': 'waiting-parts',
  'oczekuje na części': 'waiting-parts'
};

/**
 * Mapowanie statusów: Angielski → Polski (UI)
 */
export const STATUS_EN_TO_PL = {
  'pending': 'Oczekujące',
  'scheduled': 'Zaplanowane',
  'in-progress': 'W trakcie',
  'completed': 'Zakończone',
  'cancelled': 'Anulowane',
  'waiting-parts': 'Oczekuje na części',
  'on-hold': 'Wstrzymane',
  'ready': 'Gotowe'
};

/**
 * Konwertuje status polski na angielski (dla backend)
 */
export function statusToBackend(status) {
  if (!status) return null;
  const lowerStatus = status.toLowerCase();
  return STATUS_PL_TO_EN[lowerStatus] || status;
}

/**
 * Konwertuje status angielski na polski (dla UI)
 */
export function statusToUI(status) {
  if (!status) return 'Nieznany';
  return STATUS_EN_TO_PL[status] || status;
}

/**
 * Normalizuje status w obiekcie (zmienia polski na angielski)
 */
export function normalizeStatus(obj) {
  if (!obj) return obj;
  
  return {
    ...obj,
    status: statusToBackend(obj.status)
  };
}

/**
 * Uniwersalna funkcja normalizująca cały obiekt
 * Używaj przy zapisie do bazy
 */
export function normalizeObject(obj) {
  if (!obj) return obj;
  
  let normalized = normalizeTechnicianFields(obj);
  normalized = normalizeStatus(normalized);
  
  return normalized;
}
