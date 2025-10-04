import fs from 'fs';
import path from 'path';

const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
const logsPath = path.join(process.cwd(), 'data', 'payment-logs.json');
const settlementsPath = path.join(process.cwd(), 'data', 'settlements.json');

// Calculate employee settlements
function calculateSettlements(period = null, employeeId = null) {
  try {
    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));
    const settlements = JSON.parse(fs.readFileSync(settlementsPath, 'utf8'));

    const results = [];

    // Filter employees
    const employeeList = employeeId 
      ? employees.filter(e => e.id === employeeId)
      : employees;

    for (const employee of employeeList) {
      let cashCollected = 0;
      let cardCollected = 0;
      let blikCollected = 0;
      let totalCollected = 0;
      let visitCount = 0;
      let paymentsWithoutSignature = 0;
      let paymentsWithoutPhoto = 0;
      let suspiciousGPS = 0;

      // Iterate through all orders and visits
      for (const order of orders) {
        for (const visit of order.visits) {
          // Check if this visit has payment from this employee
          if (visit.paymentInfo?.collectedBy === employee.id) {
            const paymentInfo = visit.paymentInfo;
            const paidAt = new Date(paymentInfo.paidAt);

            // Filter by period if specified
            if (period) {
              const [year, month] = period.split('-');
              if (paidAt.getFullYear() !== parseInt(year) || 
                  (paidAt.getMonth() + 1) !== parseInt(month)) {
                continue;
              }
            }

            // Aggregate payment amounts
            cashCollected += paymentInfo.cashAmount || 0;
            cardCollected += paymentInfo.cardAmount || 0;
            blikCollected += paymentInfo.blikAmount || 0;
            totalCollected += paymentInfo.totalAmount || 0;
            visitCount++;

            // Check for security issues
            if (paymentInfo.cashAmount > 0 && !paymentInfo.digitalSignature) {
              paymentsWithoutSignature++;
            }
            if ((paymentInfo.cardAmount > 0 || paymentInfo.blikAmount > 0) && !paymentInfo.photoProof) {
              paymentsWithoutPhoto++;
            }
            if (paymentInfo.gpsLocation?.accuracy > 100) {
              suspiciousGPS++;
            }
          }
        }
      }

      // Calculate salary due (example: fixed rate + commission)
      // TODO: This should be configurable per employee
      const baseSalary = employee.baseSalary || 0;
      const commissionRate = employee.commissionRate || 0.10; // 10% commission
      const commission = totalCollected * commissionRate;
      const salaryDue = baseSalary + commission;

      // Calculate balance
      const balance = cashCollected - salaryDue;
      const balanceType = balance >= 0 ? 'to_deposit' : 'to_pay';
      const balanceAbs = Math.abs(balance);

      // Check if already settled for this period
      const existingSettlement = settlements.find(
        s => s.employeeId === employee.id && 
             s.period === period && 
             s.status === 'settled'
      );

      // Calculate percentages
      const cashPercentage = totalCollected > 0 ? (cashCollected / totalCollected * 100) : 0;
      const cardPercentage = totalCollected > 0 ? (cardCollected / totalCollected * 100) : 0;
      const blikPercentage = totalCollected > 0 ? (blikCollected / totalCollected * 100) : 0;

      results.push({
        employeeId: employee.id,
        employeeName: employee.name,
        period: period || 'all-time',
        cashCollected,
        cardCollected,
        blikCollected,
        totalCollected,
        visitCount,
        baseSalary,
        commission,
        salaryDue,
        balance,
        balanceType,
        balanceAbs,
        status: existingSettlement ? 'settled' : 'pending',
        settlementDate: existingSettlement?.settledAt || null,
        percentages: {
          cash: Math.round(cashPercentage),
          card: Math.round(cardPercentage),
          blik: Math.round(blikPercentage)
        },
        alerts: {
          paymentsWithoutSignature,
          paymentsWithoutPhoto,
          suspiciousGPS,
          highCashPercentage: cashPercentage > 70 // Alert if >70% cash
        }
      });
    }

    return results;
  } catch (error) {
    console.error('Error calculating settlements:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication check here
    // const isAdmin = checkAdminAuth(req);
    // if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { period, employeeId } = req.query;

    // Calculate settlements
    const settlements = calculateSettlements(period, employeeId);

    // Sort by balance (highest to deposit first)
    settlements.sort((a, b) => {
      if (a.balanceType === 'to_deposit' && b.balanceType === 'to_pay') return -1;
      if (a.balanceType === 'to_pay' && b.balanceType === 'to_deposit') return 1;
      return b.balanceAbs - a.balanceAbs;
    });

    // Calculate totals
    const totals = {
      totalCashCollected: settlements.reduce((sum, s) => sum + s.cashCollected, 0),
      totalCardCollected: settlements.reduce((sum, s) => sum + s.cardCollected, 0),
      totalBlikCollected: settlements.reduce((sum, s) => sum + s.blikCollected, 0),
      totalCollected: settlements.reduce((sum, s) => sum + s.totalCollected, 0),
      totalSalaryDue: settlements.reduce((sum, s) => sum + s.salaryDue, 0),
      totalToDeposit: settlements.filter(s => s.balanceType === 'to_deposit').reduce((sum, s) => sum + s.balanceAbs, 0),
      totalToPay: settlements.filter(s => s.balanceType === 'to_pay').reduce((sum, s) => sum + s.balanceAbs, 0),
      employeeCount: settlements.length,
      pendingCount: settlements.filter(s => s.status === 'pending').length,
      settledCount: settlements.filter(s => s.status === 'settled').length
    };

    return res.status(200).json({
      success: true,
      settlements,
      totals,
      period: period || 'all-time'
    });

  } catch (error) {
    console.error('Error in settlements API:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas pobierania rozliczeń'
    });
  }
}
