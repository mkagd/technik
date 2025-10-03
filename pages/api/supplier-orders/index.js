import fs from 'fs';
import path from 'path';

const supplierOrdersPath = path.join(process.cwd(), 'data', 'supplier-orders.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
  
  const { 
    orderId, 
    supplierId,
    status,
    employeeId,       // Zamówienia dla konkretnego serwisanta
    dateFrom,
    dateTo,
    limit 
  } = req.query;
  
  // Odczytaj zamówienia
  let orders = readJSON(supplierOrdersPath);
  if (!orders) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można odczytać zamówień' 
    });
  }
  
  // Filtrowanie
  if (orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Zamówienie nie znalezione' 
      });
    }
    return res.status(200).json({ success: true, order });
  }
  
  if (supplierId) {
    orders = orders.filter(o => o.supplierId === supplierId);
  }
  
  if (status) {
    const statuses = status.split(',');
    orders = orders.filter(o => statuses.includes(o.status));
  }
  
  if (employeeId) {
    // Zamówienia zawierające części dla tego serwisanta
    orders = orders.filter(o => 
      o.deliveryAddresses.some(addr => 
        addr.employeeIds.includes(employeeId)
      )
    );
  }
  
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    orders = orders.filter(o => new Date(o.orderDate) >= fromDate);
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    orders = orders.filter(o => new Date(o.orderDate) <= toDate);
  }
  
  // Sortowanie: najnowsze pierwsze
  orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  
  // Limit
  if (limit) {
    const limitNum = parseInt(limit);
    orders = orders.slice(0, limitNum);
  }
  
  // Statystyki
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + o.pricing.total, 0);
  const totalSavings = orders.reduce((sum, o) => sum + (o.pricing.savings || 0), 0);
  const consolidatedOrders = orders.filter(o => o.deliveryMethod === 'consolidated').length;
  
  return res.status(200).json({ 
    success: true, 
    orders,
    statistics: {
      totalOrders,
      totalValue,
      totalSavings,
      consolidatedOrders,
      consolidationRate: totalOrders > 0 ? (consolidatedOrders / totalOrders * 100).toFixed(1) + '%' : '0%'
    },
    count: orders.length
  });
}
