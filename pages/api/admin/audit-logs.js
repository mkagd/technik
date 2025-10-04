import fs from 'fs';
import path from 'path';

const logsPath = path.join(process.cwd(), 'data', 'payment-logs.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication
    // const isAdmin = checkAdminAuth(req);
    // if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({
      success: true,
      logs,
      count: logs.length
    });

  } catch (error) {
    console.error('Error in audit logs API:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas pobierania logów'
    });
  }
}
