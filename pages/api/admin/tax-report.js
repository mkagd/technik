import fs from 'fs';
import path from 'path';

const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication
    // const isAdmin = checkAdminAuth(req);
    // if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { period, format = 'json' } = req.query; // period: '2024-10' or '2024'

    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));

    // Create employee map
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.id] = {
        id: emp.id,
        name: emp.name,
        cashTotal: 0,
        cardTotal: 0,
        blikTotal: 0,
        cashlessTotal: 0,
        grandTotal: 0,
        transactionCount: 0,
        transactions: []
      };
    });

    // Aggregate payments
    for (const order of orders) {
      for (const visit of order.visits) {
        if (visit.paymentInfo && visit.paymentInfo.collectedBy) {
          const paymentInfo = visit.paymentInfo;
          const paidAt = new Date(paymentInfo.paidAt);
          
          // Filter by period
          if (period) {
            const [year, month] = period.split('-');
            const yearMatch = paidAt.getFullYear() === parseInt(year);
            const monthMatch = month ? (paidAt.getMonth() + 1) === parseInt(month) : true;
            
            if (!yearMatch || !monthMatch) {
              continue;
            }
          }

          const employeeId = paymentInfo.collectedBy;
          if (employeeMap[employeeId]) {
            const emp = employeeMap[employeeId];
            
            emp.cashTotal += paymentInfo.cashAmount || 0;
            emp.cardTotal += paymentInfo.cardAmount || 0;
            emp.blikTotal += paymentInfo.blikAmount || 0;
            emp.cashlessTotal += (paymentInfo.cardAmount || 0) + (paymentInfo.blikAmount || 0);
            emp.grandTotal += paymentInfo.totalAmount || 0;
            emp.transactionCount++;
            
            emp.transactions.push({
              date: paymentInfo.paidAt,
              visitId: visit.visitId,
              orderId: order.clientId,
              cashAmount: paymentInfo.cashAmount || 0,
              cardAmount: paymentInfo.cardAmount || 0,
              blikAmount: paymentInfo.blikAmount || 0,
              totalAmount: paymentInfo.totalAmount || 0
            });
          }
        }
      }
    }

    // Convert to array and sort
    const report = Object.values(employeeMap)
      .filter(emp => emp.transactionCount > 0)
      .sort((a, b) => b.grandTotal - a.grandTotal);

    // Calculate totals
    const totals = {
      cashTotal: report.reduce((sum, e) => sum + e.cashTotal, 0),
      cardTotal: report.reduce((sum, e) => sum + e.cardTotal, 0),
      blikTotal: report.reduce((sum, e) => sum + e.blikTotal, 0),
      cashlessTotal: report.reduce((sum, e) => sum + e.cashlessTotal, 0),
      grandTotal: report.reduce((sum, e) => sum + e.grandTotal, 0),
      transactionCount: report.reduce((sum, e) => sum + e.transactionCount, 0),
      employeeCount: report.length
    };

    // If CSV format requested
    if (format === 'csv') {
      const headers = [
        'Pracownik',
        'ID Pracownika',
        'Gotówka (PLN)',
        'Karta (PLN)',
        'BLIK (PLN)',
        'Bezgotówkowe razem (PLN)',
        'Suma całkowita (PLN)',
        'Liczba transakcji',
        '% Gotówka',
        '% Bezgotówkowe'
      ];

      const rows = report.map(emp => [
        emp.name,
        emp.id,
        emp.cashTotal.toFixed(2),
        emp.cardTotal.toFixed(2),
        emp.blikTotal.toFixed(2),
        emp.cashlessTotal.toFixed(2),
        emp.grandTotal.toFixed(2),
        emp.transactionCount,
        ((emp.cashTotal / emp.grandTotal) * 100).toFixed(1) + '%',
        ((emp.cashlessTotal / emp.grandTotal) * 100).toFixed(1) + '%'
      ]);

      // Add totals row
      rows.push([
        'RAZEM',
        '',
        totals.cashTotal.toFixed(2),
        totals.cardTotal.toFixed(2),
        totals.blikTotal.toFixed(2),
        totals.cashlessTotal.toFixed(2),
        totals.grandTotal.toFixed(2),
        totals.transactionCount,
        ((totals.cashTotal / totals.grandTotal) * 100).toFixed(1) + '%',
        ((totals.cashlessTotal / totals.grandTotal) * 100).toFixed(1) + '%'
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=raport-podatkowy-${period || 'all'}.csv`);
      return res.status(200).send('\ufeff' + csv); // BOM for Excel
    }

    // JSON response
    return res.status(200).json({
      success: true,
      period: period || 'all-time',
      report,
      totals,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating tax report:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas generowania raportu'
    });
  }
}
