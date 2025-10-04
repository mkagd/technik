import fs from 'fs';
import path from 'path';

const settlementsPath = path.join(process.cwd(), 'data', 'settlements.json');

export default async function handler(req, res) {
  try {
    // TODO: Add admin authentication
    // const isAdmin = checkAdminAuth(req);
    // if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    if (req.method === 'POST') {
      // Mark settlement as settled
      const {
        employeeId,
        period,
        amount,
        settlementMethod, // 'atm', 'cash', 'transfer'
        notes
      } = req.body;

      if (!employeeId || !period || !amount || !settlementMethod) {
        return res.status(400).json({
          success: false,
          error: 'Brak wymaganych pól: employeeId, period, amount, settlementMethod'
        });
      }

      const settlements = JSON.parse(fs.readFileSync(settlementsPath, 'utf8'));

      // Create new settlement record
      const newSettlement = {
        id: `STL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employeeId,
        period,
        amount: parseFloat(amount),
        settlementMethod,
        notes: notes || '',
        status: 'settled',
        settledAt: new Date().toISOString(),
        settledBy: 'ADMIN-001', // TODO: Get from auth session
        createdAt: new Date().toISOString()
      };

      settlements.push(newSettlement);
      fs.writeFileSync(settlementsPath, JSON.stringify(settlements, null, 2));

      return res.status(200).json({
        success: true,
        message: '✅ Rozliczenie zostało zatwierdzone',
        settlement: newSettlement
      });
    }

    if (req.method === 'GET') {
      // Get settlement history
      const { employeeId, period } = req.query;

      const settlements = JSON.parse(fs.readFileSync(settlementsPath, 'utf8'));

      let filtered = settlements;

      if (employeeId) {
        filtered = filtered.filter(s => s.employeeId === employeeId);
      }

      if (period) {
        filtered = filtered.filter(s => s.period === period);
      }

      // Sort by date (newest first)
      filtered.sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt));

      return res.status(200).json({
        success: true,
        settlements: filtered,
        count: filtered.length
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in settlement actions API:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas przetwarzania rozliczenia'
    });
  }
}
