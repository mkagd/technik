// pages/api/technician/complete-visit.js
// ✅ Complete visit with photo IDs, AI models, and offline support

import fs from 'fs';
import path from 'path';
import { logger } from '../../../utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify technician token (multiple authentication methods)
    const token = req.headers.authorization?.replace('Bearer ', '');
    let employeeId = null;

    if (token) {
      // Try technician-sessions.json (primary)
      const sessionsPath = path.join(process.cwd(), 'data', 'technician-sessions.json');
      if (fs.existsSync(sessionsPath)) {
        const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
        // ✅ FIX: Check isValid instead of expiresAt (technician-sessions don't have expiresAt field!)
        const session = sessions.find(s => s.token === token && s.isValid);
        if (session) {
          employeeId = session.employeeId;
          logger.debug(`✅ Valid technician token for ${employeeId}`);
        }
      }

      // Try employee-sessions.json (fallback for pracownik-logowanie)
      if (!employeeId) {
        const employeeSessionsPath = path.join(process.cwd(), 'data', 'employee-sessions.json');
        if (fs.existsSync(employeeSessionsPath)) {
          const empSessions = JSON.parse(fs.readFileSync(employeeSessionsPath, 'utf-8'));
          const empSession = empSessions.find(s => s.token === token && s.isValid);
          if (empSession) {
            employeeId = empSession.employeeId;
            logger.debug(`✅ Valid employee token for ${employeeId}`);
          }
        }
      }
    }

    if (!employeeId) {
      return res.status(401).json({ 
        error: 'Nieprawidłowy lub wygasły token', 
        details: 'Zaloguj się ponownie jako technik' 
      });
    }

    // Parse JSON body (photos already uploaded via PhotoUploader)
    const {
      visitId,
      completionType,
      notes = '',
      detectedModels = [],
      selectedParts = [],
      photoIds = [],
      completionPhotoIds = [],
      payment = null // 💰 Rozliczenie finansowe z klientem
    } = req.body;

    // Validation
    if (!visitId || !completionType) {
      return res.status(400).json({ error: 'Brak wymaganych danych: visitId, completionType' });
    }

    // Validate minimum 2 completion photos
    if (completionPhotoIds.length < 2) {
      return res.status(400).json({ 
        error: 'Wymagane minimum 2 zdjęcia kategorii completion',
        details: `Znaleziono tylko ${completionPhotoIds.length} zdjęć`
      });
    }

    logger.debug(`✅ Completing visit ${visitId} - Type: ${completionType}`);
    logger.debug(`📸 Completion photos: ${completionPhotoIds.length} • Total photos: ${photoIds.length}`);

    // Load orders
    const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));

    // Find visit
    let targetOrder = null;
    let targetVisit = null;

    for (const order of orders) {
      if (order.visits) {
        const visit = order.visits.find(v => v.visitId === visitId);
        if (visit) {
          targetOrder = order;
          targetVisit = visit;
          break;
        }
      }
    }

    if (!targetVisit) {
      return res.status(404).json({ error: 'Nie znaleziono wizyty' });
    }

    // Photos are already uploaded via PhotoUploader
    // Just reference them by IDs
    logger.debug(`📸 Referenced ${photoIds.length} existing photos for visit ${visitId}`);

    // Update visit with completion data
    const now = new Date().toISOString();

    // Close active work session
    if (targetVisit.workSessions && targetVisit.workSessions.length > 0) {
      const lastSession = targetVisit.workSessions[targetVisit.workSessions.length - 1];
      if (!lastSession.endTime) {
        lastSession.endTime = now;
        lastSession.duration = Math.floor(
          (new Date(now) - new Date(lastSession.startTime)) / 60000
        );
      }
    }

    // Calculate total work time
    let totalMinutes = 0;
    if (targetVisit.workSessions) {
      totalMinutes = targetVisit.workSessions.reduce((sum, session) => {
        return sum + (session.duration || 0);
      }, 0);
    }

    // Update visit status based on completion type
    let newStatus = 'completed';
    let requiresFollowUp = false;

    switch (completionType) {
      case 'diagnosis_complete':
        newStatus = 'completed';
        break;
      case 'diagnosis_continue':
        newStatus = 'completed'; // This visit is done, but order needs repair
        requiresFollowUp = true;
        targetOrder.nextStepRequired = 'repair';
        break;
      case 'repair_complete':
        newStatus = 'completed';
        targetOrder.repairCompleted = true;
        break;
      case 'repair_continue':
        newStatus = 'completed';
        requiresFollowUp = true;
        targetOrder.nextStepRequired = 'repair_continuation';
        break;
      case 'no_access':
        newStatus = 'cancelled';
        targetVisit.cancellationReason = 'no_access';
        break;
    }

    // Update visit
    targetVisit.status = newStatus;
    targetVisit.completedAt = now;
    targetVisit.completedBy = employeeId;
    targetVisit.completionType = completionType;
    targetVisit.completionNotes = notes;
    targetVisit.actualDuration = totalMinutes;
    targetVisit.requiresFollowUp = requiresFollowUp;

    // Mark completion photo IDs (photos already in visit.photos from PhotoUploader)
    targetVisit.completionPhotoIds = completionPhotoIds;

    // 💰 Rozliczenie finansowe z klientem
    if (payment) {
      targetVisit.payment = payment;
      targetVisit.paymentStatus = payment.paymentStatus || 'unpaid';
      targetVisit.amountDue = payment.amountDue || 0;
      logger.debug(`💰 Payment recorded: ${payment.totalCost} PLN (due: ${payment.amountDue} PLN)`);
    }

    // Add detected models
    if (detectedModels.length > 0) {
      targetVisit.detectedModels = detectedModels;
      
      // Update order with detected model if not set
      if (!targetOrder.model && detectedModels[0]) {
        targetOrder.brand = detectedModels[0].brand;
        targetOrder.model = detectedModels[0].model;
        targetOrder.modelDetectedBy = 'ai';
        logger.debug(`🤖 AI updated order model: ${detectedModels[0].brand} ${detectedModels[0].model}`);
      }
    }

    // Add parts list
    if (selectedParts.length > 0) {
      targetVisit.usedParts = selectedParts;
    }

    // Update order status
    const activeVisits = targetOrder.visits.filter(
      v => v.status !== 'completed' && v.status !== 'cancelled'
    );

    if (activeVisits.length === 0 && !requiresFollowUp) {
      targetOrder.status = 'completed';
      targetOrder.completedAt = now;
    } else if (requiresFollowUp) {
      targetOrder.status = 'requires_follow_up';
    }

    // Add completion event to history
    if (!targetOrder.history) targetOrder.history = [];
    targetOrder.history.push({
      timestamp: now,
      action: 'visit_completed',
      details: {
        visitId,
        completionType,
        employeeId,
        duration: totalMinutes,
        photosCount: photoIds.length, // ✅ FIX: photoIds zamiast uploadedPhotos
        completionPhotosCount: completionPhotoIds.length,
        modelsDetected: detectedModels.length,
        requiresFollowUp
      }
    });

    // Save orders
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

    logger.success(`✅ Visit ${visitId} completed successfully`);

    res.status(200).json({
      success: true,
      visitId,
      status: newStatus,
      completionType,
      duration: totalMinutes,
      completionPhotos: completionPhotoIds.length,
      totalPhotos: photoIds.length,
      modelsDetected: detectedModels.length,
      requiresFollowUp,
      visit: targetVisit
    });

  } catch (error) {
    logger.error('Complete visit error:', error);
    res.status(500).json({
      error: 'Błąd podczas kończenia wizyty',
      message: error.message
    });
  }
}
