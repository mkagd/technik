// pages/api/migrate-scanner-images.js  
// 🎯 API DO MIGRACJI ZDJĘĆ Z LOCALSTORAGE NA SERWER
//
// POST /api/migrate-scanner-images - przenosi wszystkie zdjęcia z localStorage na serwer

import { uploadScannerImage } from '../../utils/scanner-server-integration';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Tylko metoda POST jest dozwolona' 
    });
  }

  try {
    const { images, userId = 'MIGRATED_USER' } = req.body;
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        error: 'Brak danych zdjęć do migracji'
      });
    }

    if (images.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Brak zdjęć do migracji',
        migrated: 0,
        errors: 0,
        results: []
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Migruj każde zdjęcie
    for (let i = 0; i < images.length; i++) {
      const imageInfo = images[i];
      
      try {
        console.log(`📤 Migruję zdjęcie ${i + 1}/${images.length}...`);
        
        // Konwertuj base64 na Blob
        const base64Data = imageInfo.imageData.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        
        // Przygotuj FormData
        const formData = new FormData();
        formData.append('photo', blob, `migrated_${imageInfo.id || Date.now()}.jpg`);
        formData.append('orderId', 'MIGRATED');
        formData.append('category', 'model');
        formData.append('userId', userId);
        formData.append('description', 
          `Migracja z localStorage - ${imageInfo.metadata?.source || 'Scanner'} - ${new Date(imageInfo.timestamp).toLocaleString()}`
        );
        
        // Upload przez wewnętrzne API
        const uploadResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/upload-photo`, {
          method: 'POST',
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success) {
          successCount++;
          results.push({
            localId: imageInfo.id,
            serverId: uploadResult.data.id,
            serverUrl: uploadResult.data.url,
            thumbnailUrl: uploadResult.data.thumbnailUrl,
            success: true
          });
          
          console.log(`✅ Zdjęcie ${i + 1} zmigrowane: ${uploadResult.data.url}`);
          
        } else {
          errorCount++;
          results.push({
            localId: imageInfo.id,
            success: false,
            error: uploadResult.error
          });
          
          console.error(`❌ Błąd migracji zdjęcia ${i + 1}:`, uploadResult.error);
        }
        
      } catch (error) {
        errorCount++;
        results.push({
          localId: imageInfo.id,
          success: false,
          error: error.message
        });
        
        console.error(`❌ Błąd przetwarzania zdjęcia ${i + 1}:`, error);
      }
    }

    // Loguj wyniki migracji
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'migration',
      userId: userId,
      totalImages: images.length,
      successCount: successCount,
      errorCount: errorCount,
      success: successCount > 0
    };

    // Zapisz log migracji
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(process.cwd(), 'logs', 'migration.log');
    const logDir = path.dirname(logFile);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    return res.status(200).json({
      success: true,
      message: `Migracja zakończona: ${successCount} sukces, ${errorCount} błędów`,
      migrated: successCount,
      errors: errorCount,
      results: results,
      summary: {
        total: images.length,
        successful: successCount,
        failed: errorCount,
        successRate: images.length > 0 ? ((successCount / images.length) * 100).toFixed(1) + '%' : '0%'
      }
    });

  } catch (error) {
    console.error('❌ Migration API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas migracji',
      details: error.message
    });
  }
}