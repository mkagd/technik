// pages/api/ocr/history.js
// API dla historii rozpoznanych tabliczek znamionowych

import path from 'path';
import fs from 'fs/promises';

const OCR_FILE = path.join(process.cwd(), 'data', 'device-plate-ocr.json');

export default async function handler(req, res) {
  const { method, query } = req;

  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Wczytaj dane OCR
    const data = await fs.readFile(OCR_FILE, 'utf-8');
    let ocrData = JSON.parse(data);

    // GET /api/ocr/history - wszystkie OCR
    // GET /api/ocr/history?employeeId=EMP001 - OCR dla serwisanta
    // GET /api/ocr/history?orderId=ORD1024 - OCR dla zlecenia
    // GET /api/ocr/history?id=OCR-2025-10-001 - konkretny OCR

    // Filtrowanie po ID
    if (query.id) {
      const ocr = ocrData.find(o => o.id === query.id);
      if (!ocr) {
        return res.status(404).json({
          success: false,
          error: 'OCR nie znaleziony'
        });
      }
      return res.status(200).json({ success: true, ocr });
    }

    // Filtrowanie po employeeId
    if (query.employeeId) {
      ocrData = ocrData.filter(o => o.employeeId === query.employeeId);
    }

    // Filtrowanie po orderId
    if (query.orderId) {
      ocrData = ocrData.filter(o => o.orderId === query.orderId);
    }

    // Sortuj od najnowszych
    ocrData.sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));

    // Limit
    const limit = parseInt(query.limit) || 50;
    ocrData = ocrData.slice(0, limit);

    return res.status(200).json({
      success: true,
      history: ocrData,
      count: ocrData.length
    });

  } catch (error) {
    console.error('❌ Błąd API /api/ocr/history:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera',
      details: error.message
    });
  }
}
