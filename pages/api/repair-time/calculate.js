/**
 * API endpoint for repair time calculations
 * Handles server-side calculations to avoid fs dependency in client components
 */

import fs from 'fs';
import path from 'path';

let repairTimeSettings = null;

// Load settings dynamically
const loadSettings = () => {
  if (!repairTimeSettings) {
    try {
      const settingsPath = path.join(process.cwd(), 'data', 'repair-time-settings.json');
      repairTimeSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (error) {
      console.error('Failed to load repair time settings:', error);
      repairTimeSettings = { additionalTimes: {}, deviceDefaults: {}, deviceTypes: [] };
    }
  }
  return repairTimeSettings;
};

/**
 * Pobiera czas bazowy naprawy dla pracownika i typu urządzenia
 */
function getBaseRepairTime(employee, deviceType) {
  if (!employee) {
    const settings = loadSettings();
    const device = settings.deviceTypes?.find(d => d.id === deviceType);
    return device ? device.defaultTime : 30;
  }

  if (employee.repairTimes && employee.repairTimes[deviceType]) {
    return employee.repairTimes[deviceType];
  }

  const device = loadSettings().deviceTypes?.find(d => d.id === deviceType);
  return device ? device.defaultTime : 30;
}

/**
 * Oblicza dodatkowy czas za czynności montażowe
 */
function calculateAdditionalTime(additionalWork = {}) {
  let additionalTime = 0;
  const settings = loadSettings();

  if (additionalWork.hasDemontaz) {
    additionalTime += settings.additionalTimes?.demontaż?.time || 0;
  }

  if (additionalWork.hasMontaz) {
    additionalTime += settings.additionalTimes?.montaż?.time || 0;
  }

  if (additionalWork.hasTrudnaZabudowa) {
    additionalTime += settings.additionalTimes?.trudnaZabudowa?.time || 0;
  }

  if (additionalWork.manualAdditionalTime && typeof additionalWork.manualAdditionalTime === 'number') {
    additionalTime += additionalWork.manualAdditionalTime;
  }

  return additionalTime;
}

/**
 * Oblicza sugerowany czas dla wizyty na podstawie zlecenia
 */
function suggestVisitDuration(order, employee) {
  if (!order) return 60;

  if (order.deviceDetails) {
    const baseTime = getBaseRepairTime(employee, order.deviceDetails.deviceType);
    const additionalTime = calculateAdditionalTime({
      hasDemontaz: order.deviceDetails.hasDemontaz,
      hasMontaz: order.deviceDetails.hasMontaz,
      hasTrudnaZabudowa: order.deviceDetails.hasTrudnaZabudowa,
      manualAdditionalTime: order.deviceDetails.manualAdditionalTime
    });
    return baseTime + additionalTime;
  }

  const description = (order.description || '').toLowerCase();
  const title = (order.title || '').toLowerCase();
  const text = `${description} ${title}`;
  const settings = loadSettings();

  for (const deviceType of settings.deviceTypes || []) {
    if (text.includes(deviceType.id) || text.includes(deviceType.label.toLowerCase())) {
      return getBaseRepairTime(employee, deviceType.id);
    }
  }

  return 60;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, order, employee } = req.body;

    switch (action) {
      case 'suggest-duration':
        const duration = suggestVisitDuration(order, employee);
        return res.status(200).json({ duration });

      case 'get-settings':
        const settings = loadSettings();
        return res.status(200).json({ settings });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Repair time calculation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
