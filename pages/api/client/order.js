import fs from 'fs';
import path from 'path';

const ordersFile = path.join(process.cwd(), 'data', 'orders.json');
const sessionsFile = path.join(process.cwd(), 'data', 'client-sessions.json');

// Read JSON file
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return filePath.includes('orders') ? [] : [];
  }
}

// Validate session
function validateSession(token) {
  if (!token || !token.startsWith('Bearer ')) {
    return null;
  }

  const tokenValue = token.substring(7);
  const sessions = readJSON(sessionsFile);
  const session = sessions.find((s) => s.token === tokenValue);

  if (!session) {
    return null;
  }

  // Check if session is expired (30 days)
  const sessionDate = new Date(session.createdAt);
  const now = new Date();
  const diffDays = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));

  if (diffDays > 30) {
    return null;
  }

  return session;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Metoda niedozwolona' });
  }

  try {
    // Validate session
    const authHeader = req.headers.authorization;
    const session = validateSession(authHeader);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Sesja wygasła. Zaloguj się ponownie.',
      });
    }

    // Get orderId from query
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Brak ID zamówienia',
      });
    }

    // Read orders
    const orders = readJSON(ordersFile);

    // Find order
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Zamówienie nie zostało znalezione',
      });
    }

    // Check if order belongs to client
    if (order.clientId !== session.clientId) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do tego zamówienia',
      });
    }

    // Return order
    return res.status(200).json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas pobierania zamówienia',
    });
  }
}
