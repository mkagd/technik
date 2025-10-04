import fs from 'fs';
import path from 'path';

const alertActionsPath = path.join(process.cwd(), 'data', 'alert-actions.json');

// Initialize alert actions file if doesn't exist
function initAlertActions() {
  try {
    if (!fs.existsSync(alertActionsPath)) {
      fs.writeFileSync(alertActionsPath, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error initializing alert actions:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication
    // const isAdmin = checkAdminAuth(req);
    // if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { alertId, action } = req.body;

    if (!alertId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Brak wymaganych pól: alertId, action'
      });
    }

    initAlertActions();

    // Load existing actions
    const actions = JSON.parse(fs.readFileSync(alertActionsPath, 'utf8'));

    // Create new action record
    const newAction = {
      id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      alertId,
      action, // 'resolve', 'view', 'contact', 'dismiss'
      timestamp: new Date().toISOString(),
      performedBy: 'ADMIN-001', // TODO: Get from auth session
      notes: ''
    };

    actions.push(newAction);
    fs.writeFileSync(alertActionsPath, JSON.stringify(actions, null, 2));

    let message = '';
    switch (action) {
      case 'resolve':
        message = '✅ Alert oznaczony jako rozwiązany';
        break;
      case 'view':
        message = '🔍 Szczegóły alertu wyświetlone';
        break;
      case 'contact':
        message = '📞 Rozpoczęto kontakt z pracownikiem';
        break;
      case 'dismiss':
        message = '❌ Alert odrzucony';
        break;
      default:
        message = 'Akcja wykonana';
    }

    return res.status(200).json({
      success: true,
      message,
      action: newAction
    });

  } catch (error) {
    console.error('Error in alert actions API:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas przetwarzania akcji'
    });
  }
}
