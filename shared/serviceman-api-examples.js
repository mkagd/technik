/**
 * API ENDPOINTS DLA SYSTEMU SERWISANTÓW
 * 
 * Przykładowe endpointy REST API do obsługi:
 * - Serwisantów 
 * - Wizyt
 * - Zleceń w wizytach
 * - Harmonogramów
 * - Raportów
 */

// ========== ENDPOINTY SERWISANTÓW ==========

/**
 * GET /api/servicemen
 * Pobiera listę wszystkich serwisantów
 */
async function getServicemen(req, res) {
  try {
    const { active = true, clientId } = req.query;
    
    let query = `SELECT * FROM servicemen WHERE 1=1`;
    const params = [];
    
    if (active !== 'all') {
      query += ` AND isActive = ?`;
      params.push(active === 'true');
    }
    
    if (clientId) {
      query += ` AND primaryClientId = ?`;
      params.push(clientId);
    }
    
    query += ` ORDER BY lastName, firstName`;
    
    const servicemen = await db.query(query, params);
    
    res.json({
      success: true,
      data: servicemen,
      count: servicemen.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Błąd pobierania serwisantów',
      error: error.message
    });
  }
}

/**
 * GET /api/servicemen/:id
 * Pobiera szczegóły serwisanta
 */
async function getServiceman(req, res) {
  try {
    const { id } = req.params;
    
    const serviceman = await db.queryOne(
      `SELECT s.*, c.company as clientCompany, c.firstName as clientFirstName, c.lastName as clientLastName
       FROM servicemen s 
       LEFT JOIN clients c ON s.primaryClientId = c.id 
       WHERE s.id = ?`, 
      [id]
    );
    
    if (!serviceman) {
      return res.status(404).json({
        success: false,
        message: 'Serwisant nie został znaleziony'
      });
    }
    
    // Pobierz statystyki
    const stats = await db.queryOne(`
      SELECT 
        COUNT(DISTINCT v.id) as totalVisits,
        COUNT(DISTINCT o.id) as totalOrders,
        SUM(v.actualDuration) as totalMinutes,
        SUM(v.totalCost) as totalRevenue,
        AVG(v.clientRating) as avgRating
      FROM serviceman_visits v
      LEFT JOIN visit_orders o ON v.id = o.visitId
      WHERE v.servicemanId = ? AND v.status = 'completed'
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...serviceman,
        stats: {
          ...stats,
          totalHours: stats.totalMinutes ? (stats.totalMinutes / 60).toFixed(1) : 0,
          avgRating: stats.avgRating ? parseFloat(stats.avgRating).toFixed(1) : null
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Błąd pobierania serwisanta',
      error: error.message
    });
  }
}

// ========== ENDPOINTY WIZYT ==========

/**
 * GET /api/servicemen/:servicemanId/visits
 * Pobiera wizyty serwisanta
 */
async function getServicemanVisits(req, res) {
  try {
    const { servicemanId } = req.params;
    const { 
      status, 
      dateFrom, 
      dateTo, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT v.*, c.company, c.firstName, c.lastName,
             COUNT(o.id) as ordersCount,
             SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completedOrdersCount
      FROM serviceman_visits v
      LEFT JOIN clients c ON v.clientId = c.id
      LEFT JOIN visit_orders o ON v.id = o.visitId
      WHERE v.servicemanId = ?
    `;
    
    const params = [servicemanId];
    
    if (status) {
      query += ` AND v.status = ?`;
      params.push(status);
    }
    
    if (dateFrom) {
      query += ` AND v.scheduledDate >= ?`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND v.scheduledDate <= ?`;
      params.push(dateTo);
    }
    
    query += ` GROUP BY v.id ORDER BY v.scheduledDate DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const visits = await db.query(query, params);
    
    // Przygotuj dane dla aplikacji mobilnej
    const mobileFriendlyVisits = visits.map(visit => 
      ServicemanHelpers.prepareVisitForMobile(visit, {
        firstName: visit.firstName,
        lastName: visit.lastName,
        company: visit.company
      })
    );
    
    res.json({
      success: true,
      data: mobileFriendlyVisits,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: visits.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Błąd pobierania wizyt',
      error: error.message
    });
  }
}

/**
 * POST /api/servicemen/:servicemanId/visits/:visitId/start
 * Rozpoczęcie wizyty przez serwisanta (aplikacja mobilna)
 */
async function startVisit(req, res) {
  try {
    const { servicemanId, visitId } = req.params;
    const { location } = req.body; // { lat, lng }
    
    // Sprawdź czy wizyta istnieje i należy do serwisanta
    const visit = await db.queryOne(
      `SELECT * FROM serviceman_visits WHERE id = ? AND servicemanId = ? AND status = 'scheduled'`,
      [visitId, servicemanId]
    );
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Wizyta nie została znaleziona lub już została rozpoczęta'
      });
    }
    
    // Sprawdź odległość (opcjonalnie)
    if (location && visit.coordinates) {
      const distance = ServicemanHelpers.calculateDistance(
        location.lat, location.lng,
        visit.coordinates.lat, visit.coordinates.lng
      );
      
      if (distance > 0.5) { // 500m
        return res.status(400).json({
          success: false,
          message: `Jesteś za daleko od miejsca wizyty (${distance.toFixed(1)}km). Zbliż się do klienta.`,
          distance: distance
        });
      }
    }
    
    // Rozpocznij wizytę
    const startTime = new Date().toISOString();
    
    await db.query(
      `UPDATE serviceman_visits 
       SET status = 'in_transit', actualStartTime = ?, updatedAt = NOW()
       WHERE id = ?`,
      [startTime, visitId]
    );
    
    // Zaktualizuj lokalizację serwisanta
    if (location) {
      await db.query(
        `UPDATE servicemen 
         SET lastKnownLocation = ?, updatedAt = NOW()
         WHERE id = ?`,
        [JSON.stringify({...location, timestamp: startTime}), servicemanId]
      );
    }
    
    // Wyślij powiadomienie do klienta
    await sendPushNotification(visit.clientId, {
      type: 'visit_starting',
      title: 'Serwisant w drodze',
      message: 'Serwisant rozpoczął wizytę i jest w drodze do Państwa',
      data: { visitId, servicemanId }
    });
    
    res.json({
      success: true,
      message: 'Wizyta została rozpoczęta',
      data: {
        visitId,
        status: 'in_transit',
        startTime,
        location
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Błąd rozpoczynania wizyty',
      error: error.message
    });
  }
}

/**
 * POST /api/visits/:visitId/arrive
 * Serwisant dotarł na miejsce
 */
async function arriveAtVisit(req, res) {
  try {
    const { visitId } = req.params;
    const { location } = req.body;
    
    const arrivalTime = new Date().toISOString();
    
    await db.query(
      `UPDATE serviceman_visits 
       SET status = 'on_site', updatedAt = NOW()
       WHERE id = ? AND status = 'in_transit'`,
      [visitId]
    );
    
    const visit = await db.queryOne(
      `SELECT clientId FROM serviceman_visits WHERE id = ?`,
      [visitId]
    );
    
    // Powiadomienie do klienta
    await sendPushNotification(visit.clientId, {
      type: 'visit_arrived',
      title: 'Serwisant na miejscu',
      message: 'Serwisant dotarł i rozpoczyna pracę',
      data: { visitId }
    });
    
    res.json({
      success: true,
      message: 'Potwierdzono przybycie na miejsce wizyty',
      data: {
        visitId,
        status: 'on_site',
        arrivalTime
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Błąd potwierdzania przybycia',
      error: error.message
    });
  }
}

// ========== ENDPOINTY ZLECEŃ ==========

/**
 * GET /api/visits/:visitId/orders
 * Pobiera zlecenia dla wizyty
 */
async function getVisitOrders(req, res) {
  try {
    const { visitId } = req.params;
    
    const orders = await db.query(
      `SELECT * FROM visit_orders 
       WHERE visitId = ? 
       ORDER BY priority DESC, createdAt ASC`,
      [visitId]
    );
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Błąd pobierania zleceń',
      error: error.message
    });
  }
}

/**
 * PUT /api/orders/:orderId/start
 * Rozpoczęcie pracy nad zleceniem
 */
async function startOrder(req, res) {
  try {
    const { orderId } = req.params;
    
    const startTime = new Date().toISOString();
    
    await db.query(
      `UPDATE visit_orders 
       SET status = 'in_progress', startTime = ?, updatedAt = NOW()
       WHERE id = ? AND status = 'pending'`,
      [startTime, orderId]
    );
    
    res.json({
      success: true,
      message: 'Rozpoczęto pracę nad zleceniem',
      data: { orderId, status: 'in_progress', startTime }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Błąd rozpoczynania zlecenia',
      error: error.message
    });
  }
}

/**
 * PUT /api/orders/:orderId/complete
 * Zakończenie zlecenia
 */
async function completeOrder(req, res) {
  try {
    const { orderId } = req.params;
    const {
      solutionDescription,
      partsUsed = [],
      laborCost = 0,
      partsCost = 0,
      afterPhotos = [],
      recommendations = '',
      warrantyMonths = 3
    } = req.body;
    
    const endTime = new Date().toISOString();
    const totalCost = parseFloat(laborCost) + parseFloat(partsCost);
    
    // Pobierz czas rozpoczęcia żeby obliczyć czas pracy
    const order = await db.queryOne(
      `SELECT startTime FROM visit_orders WHERE id = ?`,
      [orderId]
    );
    
    let timeSpentMinutes = null;
    if (order.startTime) {
      const startTime = new Date(order.startTime);
      const endTimeDate = new Date(endTime);
      timeSpentMinutes = Math.round((endTimeDate - startTime) / (1000 * 60));
    }
    
    await db.query(`
      UPDATE visit_orders SET
        status = 'completed',
        endTime = ?,
        timeSpentMinutes = ?,
        solutionDescription = ?,
        partsUsed = ?,
        laborCost = ?,
        partsCost = ?,
        totalCost = ?,
        afterPhotos = ?,
        recommendations = ?,
        warrantyMonths = ?,
        updatedAt = NOW()
      WHERE id = ?
    `, [
      endTime, timeSpentMinutes, solutionDescription,
      JSON.stringify(partsUsed), laborCost, partsCost, totalCost,
      JSON.stringify(afterPhotos), recommendations, warrantyMonths,
      orderId
    ]);
    
    res.json({
      success: true,
      message: 'Zlecenie zostało zakończone',
      data: {
        orderId,
        status: 'completed',
        endTime,
        timeSpentMinutes,
        totalCost
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Błąd kończenia zlecenia',
      error: error.message
    });
  }
}

// ========== POMOCNICZE ==========

/**
 * Wysyłanie powiadomień push
 */
async function sendPushNotification(clientId, notification) {
  try {
    // Tu będzie integracja z Firebase/OneSignal
    console.log(`Push notification dla klienta ${clientId}:`, notification);
    
    // Zapisz w bazie dla historii
    await db.query(`
      INSERT INTO notifications (clientId, type, title, message, data, createdAt)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      clientId,
      notification.type,
      notification.title,
      notification.message,
      JSON.stringify(notification.data || {})
    ]);
    
  } catch (error) {
    console.error('Błąd wysyłania powiadomienia push:', error);
  }
}

// ========== EXPORT ENDPOINTÓW ==========
module.exports = {
  // Serwisanci
  getServicemen,
  getServiceman,
  
  // Wizyty
  getServicemanVisits,
  startVisit,
  arriveAtVisit,
  
  // Zlecenia
  getVisitOrders,
  startOrder,
  completeOrder,
  
  // Pomocnicze
  sendPushNotification
};

// ========== PRZYKŁADOWE ROUTING ==========
/*
// W głównym pliku serwera (express.js)

const servicemanAPI = require('./api/serviceman-endpoints');

// Serwisanci
app.get('/api/servicemen', servicemanAPI.getServicemen);
app.get('/api/servicemen/:id', servicemanAPI.getServiceman);

// Wizyty
app.get('/api/servicemen/:servicemanId/visits', servicemanAPI.getServicemanVisits);
app.post('/api/servicemen/:servicemanId/visits/:visitId/start', servicemanAPI.startVisit);
app.post('/api/visits/:visitId/arrive', servicemanAPI.arriveAtVisit);

// Zlecenia 
app.get('/api/visits/:visitId/orders', servicemanAPI.getVisitOrders);
app.put('/api/orders/:orderId/start', servicemanAPI.startOrder);
app.put('/api/orders/:orderId/complete', servicemanAPI.completeOrder);
*/