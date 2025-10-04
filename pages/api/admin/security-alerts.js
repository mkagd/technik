import fs from 'fs';
import path from 'path';

const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
const logsPath = path.join(process.cwd(), 'data', 'payment-logs.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
const alertActionsPath = path.join(process.cwd(), 'data', 'alert-actions.json');

// Calculate distance between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function generateAlerts() {
  try {
    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));
    const alerts = [];

    // Create employee map
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.id] = {
        name: emp.name,
        cashPayments: 0,
        cardPayments: 0,
        blikPayments: 0,
        totalPayments: 0,
        paymentsWithoutSignature: [],
        paymentsWithoutPhoto: [],
        suspiciousGPS: [],
        lowAccuracyGPS: []
      };
    });

    // Analyze all payments
    for (const order of orders) {
      for (const visit of order.visits) {
        if (visit.paymentInfo && visit.paymentInfo.collectedBy) {
          const employeeId = visit.paymentInfo.collectedBy;
          const paymentInfo = visit.paymentInfo;
          const employee = employeeMap[employeeId];

          if (!employee) continue;

          // Count payments by method
          employee.totalPayments++;
          if (paymentInfo.cashAmount > 0) employee.cashPayments++;
          if (paymentInfo.cardAmount > 0) employee.cardPayments++;
          if (paymentInfo.blikAmount > 0) employee.blikPayments++;

          // Check for missing signature (cash payments)
          if (paymentInfo.cashAmount > 0 && !paymentInfo.digitalSignature) {
            employee.paymentsWithoutSignature.push({
              visitId: visit.visitId,
              orderId: order.clientId,
              amount: paymentInfo.cashAmount,
              date: paymentInfo.paidAt
            });
          }

          // Check for missing photo (card/blik payments)
          if ((paymentInfo.cardAmount > 0 || paymentInfo.blikAmount > 0) && !paymentInfo.photoProof) {
            employee.paymentsWithoutPhoto.push({
              visitId: visit.visitId,
              orderId: order.clientId,
              amount: paymentInfo.cardAmount + paymentInfo.blikAmount,
              method: paymentInfo.cardAmount > 0 ? 'card' : 'blik',
              date: paymentInfo.paidAt
            });
          }

          // Check GPS location
          if (paymentInfo.gpsLocation) {
            // Check accuracy
            if (paymentInfo.gpsLocation.accuracy > 100) {
              employee.lowAccuracyGPS.push({
                visitId: visit.visitId,
                orderId: order.clientId,
                accuracy: paymentInfo.gpsLocation.accuracy,
                date: paymentInfo.paidAt
              });
            }

            // Check distance from client address (if available)
            if (order.gpsLocation) {
              const distance = calculateDistance(
                paymentInfo.gpsLocation.lat,
                paymentInfo.gpsLocation.lng,
                order.gpsLocation.lat,
                order.gpsLocation.lng
              );

              if (distance > 100) {
                employee.suspiciousGPS.push({
                  visitId: visit.visitId,
                  orderId: order.clientId,
                  distance: Math.round(distance),
                  date: paymentInfo.paidAt
                });
              }
            }
          }
        }
      }
    }

    // Generate alerts from collected data
    let alertId = 1;

    for (const [employeeId, data] of Object.entries(employeeMap)) {
      // Alert: Missing signatures
      if (data.paymentsWithoutSignature.length > 0) {
        alerts.push({
          id: alertId++,
          severity: data.paymentsWithoutSignature.length >= 3 ? 'critical' : 'high',
          type: 'missing_signature',
          title: 'Brak podpisu cyfrowego',
          description: `${data.name} - ${data.paymentsWithoutSignature.length} płatności gotówką bez podpisu klienta`,
          employeeId,
          employeeName: data.name,
          timestamp: data.paymentsWithoutSignature[0].date,
          details: {
            count: data.paymentsWithoutSignature.length,
            totalAmount: data.paymentsWithoutSignature.reduce((sum, p) => sum + p.amount, 0),
            payments: data.paymentsWithoutSignature
          }
        });
      }

      // Alert: Missing photos
      if (data.paymentsWithoutPhoto.length > 0) {
        alerts.push({
          id: alertId++,
          severity: data.paymentsWithoutPhoto.length >= 3 ? 'high' : 'medium',
          type: 'missing_photo',
          title: 'Brak zdjęcia dowodu płatności',
          description: `${data.name} - ${data.paymentsWithoutPhoto.length} płatności bezgotówkowych bez zdjęcia`,
          employeeId,
          employeeName: data.name,
          timestamp: data.paymentsWithoutPhoto[0].date,
          details: {
            count: data.paymentsWithoutPhoto.length,
            totalAmount: data.paymentsWithoutPhoto.reduce((sum, p) => sum + p.amount, 0),
            payments: data.paymentsWithoutPhoto
          }
        });
      }

      // Alert: Suspicious GPS
      if (data.suspiciousGPS.length > 0) {
        alerts.push({
          id: alertId++,
          severity: 'high',
          type: 'gps_suspicious',
          title: 'Podejrzana lokalizacja GPS',
          description: `${data.name} - ${data.suspiciousGPS.length} płatności z podejrzanej lokalizacji`,
          employeeId,
          employeeName: data.name,
          timestamp: data.suspiciousGPS[0].date,
          details: {
            count: data.suspiciousGPS.length,
            payments: data.suspiciousGPS
          }
        });
      }

      // Alert: Low GPS accuracy
      if (data.lowAccuracyGPS.length > 0) {
        alerts.push({
          id: alertId++,
          severity: 'low',
          type: 'low_gps_accuracy',
          title: 'Niska dokładność GPS',
          description: `${data.name} - ${data.lowAccuracyGPS.length} płatności z niską dokładnością GPS`,
          employeeId,
          employeeName: data.name,
          timestamp: data.lowAccuracyGPS[0].date,
          details: {
            count: data.lowAccuracyGPS.length,
            payments: data.lowAccuracyGPS
          }
        });
      }

      // Alert: High cash percentage
      if (data.totalPayments > 0) {
        const cashPercentage = (data.cashPayments / data.totalPayments) * 100;
        if (cashPercentage > 70 && data.totalPayments >= 5) {
          alerts.push({
            id: alertId++,
            severity: cashPercentage > 85 ? 'high' : 'medium',
            type: 'high_cash_percentage',
            title: 'Wysoki % płatności gotówką',
            description: `${data.name} - ${Math.round(cashPercentage)}% płatności gotówką`,
            employeeId,
            employeeName: data.name,
            timestamp: new Date().toISOString(),
            details: {
              percentage: Math.round(cashPercentage),
              cashPayments: data.cashPayments,
              totalPayments: data.totalPayments
            }
          });
        }
      }
    }

    // Sort alerts by severity and timestamp
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return alerts;
  } catch (error) {
    console.error('Error generating alerts:', error);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication
    // const isAdmin = checkAdminAuth(req);
    // if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { includeResolved = 'false' } = req.query;

    let alerts = generateAlerts();

    // Load resolved alerts
    let resolvedAlertIds = [];
    try {
      if (fs.existsSync(alertActionsPath)) {
        const actions = JSON.parse(fs.readFileSync(alertActionsPath, 'utf8'));
        resolvedAlertIds = actions
          .filter(a => a.action === 'resolve')
          .map(a => a.alertId);
      }
    } catch (error) {
      console.error('Error loading alert actions:', error);
    }

    // Mark resolved alerts
    alerts = alerts.map(alert => ({
      ...alert,
      resolved: resolvedAlertIds.includes(alert.id),
      status: resolvedAlertIds.includes(alert.id) ? 'resolved' : 'active'
    }));

    // Filter out resolved alerts if not requested
    if (includeResolved !== 'true') {
      alerts = alerts.filter(a => !a.resolved);
    }

    return res.status(200).json({
      success: true,
      alerts,
      count: alerts.length,
      activeCount: alerts.filter(a => a.status === 'active').length,
      resolvedCount: alerts.filter(a => a.status === 'resolved').length,
      criticalCount: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
      highCount: alerts.filter(a => a.severity === 'high' && a.status === 'active').length,
      mediumCount: alerts.filter(a => a.severity === 'medium' && a.status === 'active').length,
      lowCount: alerts.filter(a => a.severity === 'low' && a.status === 'active').length
    });

  } catch (error) {
    console.error('Error in security alerts API:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas pobierania alertów'
    });
  }
}
