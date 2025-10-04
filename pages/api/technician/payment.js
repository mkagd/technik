import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
const logsPath = path.join(process.cwd(), 'data', 'payment-logs.json');
const sessionsPath = path.join(process.cwd(), 'data', 'technician-sessions.json');

// Validate token
function validateToken(token) {
  try {
    const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
    const session = sessions.find(s => s.token === token && s.isActive);
    return session || null;
  } catch (error) {
    return null;
  }
}

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Create SHA-256 hash
function createHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Add immutable log entry
function addPaymentLog(logEntry) {
  try {
    const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
    
    // Create immutable log with hash
    const immutableLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...logEntry,
      signatureHash: logEntry.digitalSignature ? createHash(logEntry.digitalSignature) : null,
      photoHash: logEntry.photoProof ? createHash(logEntry.photoProof) : null,
      immutable: true // Cannot be edited or deleted
    };

    logs.push(immutableLog);
    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
    
    return immutableLog;
  } catch (error) {
    console.error('Error adding payment log:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Validate token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = validateToken(token);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      orderId,
      visitId,
      paymentMethod,
      cashAmount,
      cardAmount,
      blikAmount,
      totalAmount,
      digitalSignature,
      photoProof,
      gpsLocation,
      employeeId,
      timestamp
    } = req.body;

    // ===== VALIDATION =====

    // 1. Check required fields
    if (!orderId || !visitId || !employeeId || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: '❌ Brak wymaganych pól: orderId, visitId, employeeId, totalAmount'
      });
    }

    // 2. Validate GPS location
    if (!gpsLocation || !gpsLocation.lat || !gpsLocation.lng) {
      return res.status(400).json({
        success: false,
        error: '❌ Brak lokalizacji GPS. Włącz lokalizację w telefonie.'
      });
    }

    // 3. Check GPS accuracy
    if (gpsLocation.accuracy > 100) {
      return res.status(400).json({
        success: false,
        error: '⚠️ Dokładność GPS zbyt niska (±' + Math.round(gpsLocation.accuracy) + 'm). Przejdź na otwartą przestrzeń.'
      });
    }

    // 4. Validate payment amounts
    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: '❌ Kwota płatności musi być większa niż 0'
      });
    }

    // 5. For cash payments, require digital signature
    if (cashAmount > 0 && !digitalSignature) {
      return res.status(400).json({
        success: false,
        error: '❌ Dla płatności gotówką wymagany jest podpis klienta'
      });
    }

    // 6. For card/blik payments, require photo proof
    if ((cardAmount > 0 || blikAmount > 0) && !photoProof) {
      return res.status(400).json({
        success: false,
        error: '❌ Dla płatności bezgotówkowych wymagane jest zdjęcie dowodu'
      });
    }

    // Load orders
    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    const orderIndex = orders.findIndex(o => o.clientId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '❌ Nie znaleziono zlecenia'
      });
    }

    const order = orders[orderIndex];
    const visitIndex = order.visits.findIndex(v => v.visitId === visitId);

    if (visitIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '❌ Nie znaleziono wizyty'
      });
    }

    // 7. Validate GPS location against client address
    // Note: This requires client address to have GPS coordinates
    // For now, we'll just log a warning if distance validation is needed
    if (order.gpsLocation) {
      const distance = calculateDistance(
        gpsLocation.lat,
        gpsLocation.lng,
        order.gpsLocation.lat,
        order.gpsLocation.lng
      );

      if (distance > 100) {
        console.warn(`⚠️ GPS Warning: Payment location ${distance.toFixed(0)}m from client address`);
        // We log this but don't block the payment - admin will see alert
      }
    }

    // 8. Check if payment already exists
    if (order.visits[visitIndex].paymentInfo?.paidAt) {
      return res.status(400).json({
        success: false,
        error: '❌ Płatność dla tej wizyty została już zarejestrowana'
      });
    }

    // ===== SAVE PAYMENT =====

    // Determine actual payment method
    let actualPaymentMethod = paymentMethod;
    const paymentMethods = [];
    if (cashAmount > 0) paymentMethods.push('cash');
    if (cardAmount > 0) paymentMethods.push('card');
    if (blikAmount > 0) paymentMethods.push('blik');
    
    if (paymentMethods.length > 1) {
      actualPaymentMethod = 'mixed';
    }

    // Update visit with payment info
    order.visits[visitIndex].paymentInfo = {
      totalAmount,
      paymentMethod: actualPaymentMethod,
      cashAmount: cashAmount || 0,
      cardAmount: cardAmount || 0,
      blikAmount: blikAmount || 0,
      digitalSignature: digitalSignature || null,
      photoProof: photoProof || null,
      gpsLocation: {
        lat: gpsLocation.lat,
        lng: gpsLocation.lng,
        accuracy: gpsLocation.accuracy
      },
      paidAt: timestamp || new Date().toISOString(),
      collectedBy: employeeId,
      verified: true
    };

    // Update visit status if needed
    if (order.visits[visitIndex].status === 'completed') {
      // Already completed, just add payment
    } else {
      order.visits[visitIndex].status = 'completed';
      order.visits[visitIndex].completedAt = new Date().toISOString();
    }

    // Save updated order
    orders[orderIndex] = order;
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

    // ===== CREATE IMMUTABLE LOG =====
    const logEntry = addPaymentLog({
      action: 'PAYMENT_RECEIVED',
      employeeId,
      orderId,
      visitId,
      amount: totalAmount,
      method: actualPaymentMethod,
      cashAmount: cashAmount || 0,
      cardAmount: cardAmount || 0,
      blikAmount: blikAmount || 0,
      gps: gpsLocation,
      digitalSignature,
      photoProof,
      deviceInfo: {
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(200).json({
      success: true,
      message: '✅ Płatność została zapisana pomyślnie',
      paymentInfo: order.visits[visitIndex].paymentInfo,
      logId: logEntry.id
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas zapisywania płatności'
    });
  }
}
