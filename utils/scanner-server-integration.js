// utils/scanner-server-integration.js
// 🎯 INTEGRACJA SKANERÓW Z SYSTEMEM SERWERA
//
// Funkcje do zapisywania zdjęć ze skanerów na serwerze

// Upload zdjęcia na serwer z metadanymi skanera
export const uploadScannerImage = async (imageData, metadata = {}) => {
  try {
    // Konwertuj base64 na Blob
    const base64Data = imageData.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    
    // Przygotuj FormData
    const formData = new FormData();
    formData.append('photo', blob, `scanner_${Date.now()}.jpg`);
    formData.append('orderId', metadata.orderId || 'TEMP');
    formData.append('category', metadata.category || 'model');
    formData.append('userId', metadata.userId || 'SCANNER');
    formData.append('description', metadata.description || 'Zdjęcie ze skanera tabliczki znamionowej');
    
    // Wyślij na serwer
    const response = await fetch('/api/upload-photo', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Zdjęcie zapisane na serwerze:', result.data.url);
      return {
        success: true,
        serverUrl: result.data.url,
        thumbnailUrl: result.data.thumbnailUrl,
        filename: result.data.filename,
        id: result.data.id
      };
    } else {
      console.error('❌ Błąd zapisywania na serwerze:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error) {
    console.error('❌ Błąd upload:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Migrate localStorage images to server
export const migrateLocalStorageToServer = async (userId = 'SCANNER') => {
  try {
    const existingImages = JSON.parse(localStorage.getItem('scannerImages') || '[]');
    
    if (existingImages.length === 0) {
      return {
        success: true,
        message: 'Brak zdjęć do migracji',
        migrated: 0
      };
    }
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const imageInfo of existingImages) {
      const uploadResult = await uploadScannerImage(imageInfo.imageData, {
        orderId: 'MIGRATED',
        category: 'model',
        userId: userId,
        description: `Migracja z localStorage - ${imageInfo.metadata?.source || 'unknown'}`
      });
      
      if (uploadResult.success) {
        successCount++;
        results.push({
          localId: imageInfo.id,
          serverId: uploadResult.id,
          serverUrl: uploadResult.serverUrl
        });
      } else {
        errorCount++;
        console.error(`❌ Błąd migracji zdjęcia ${imageInfo.id}:`, uploadResult.error);
      }
    }
    
    // Wyczyść localStorage po udanej migracji
    if (successCount > 0) {
      localStorage.removeItem('scannerImages');
      console.log(`✅ Migracja zakończona: ${successCount} sukces, ${errorCount} błędów`);
    }
    
    return {
      success: true,
      migrated: successCount,
      errors: errorCount,
      results: results
    };
    
  } catch (error) {
    console.error('❌ Błąd migracji:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Zapisz zdjęcie zarówno lokalnie jak i na serwerze
export const saveDualStorage = async (imageData, metadata = {}) => {
  const results = {
    localStorage: { success: false },
    server: { success: false }
  };
  
  // 1. Zapisz lokalnie (backup)
  try {
    const imageInfo = {
      id: Date.now(),
      imageData: imageData,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        size: Math.round(imageData.length / 1024) + ' KB',
        savedOnServer: false
      }
    };
    
    const existingImages = JSON.parse(localStorage.getItem('scannerImages') || '[]');
    const updatedImages = [imageInfo, ...existingImages.slice(0, 9)]; // Max 10
    localStorage.setItem('scannerImages', JSON.stringify(updatedImages));
    
    results.localStorage = { success: true, id: imageInfo.id };
    
  } catch (error) {
    console.error('❌ Błąd localStorage:', error);
    results.localStorage = { success: false, error: error.message };
  }
  
  // 2. Zapisz na serwerze
  try {
    const serverResult = await uploadScannerImage(imageData, metadata);
    results.server = serverResult;
    
    // Jeśli serwer OK, zaktualizuj localStorage
    if (serverResult.success && results.localStorage.success) {
      const existingImages = JSON.parse(localStorage.getItem('scannerImages') || '[]');
      const imageIndex = existingImages.findIndex(img => img.id === results.localStorage.id);
      
      if (imageIndex !== -1) {
        existingImages[imageIndex].metadata.savedOnServer = true;
        existingImages[imageIndex].metadata.serverUrl = serverResult.serverUrl;
        existingImages[imageIndex].metadata.serverId = serverResult.id;
        localStorage.setItem('scannerImages', JSON.stringify(existingImages));
      }
    }
    
  } catch (error) {
    console.error('❌ Błąd serwera:', error);
    results.server = { success: false, error: error.message };
  }
  
  return results;
};

// Sprawdź stan synchronizacji localStorage z serwerem
export const checkSyncStatus = () => {
  try {
    const existingImages = JSON.parse(localStorage.getItem('scannerImages') || '[]');
    
    const syncStatus = {
      total: existingImages.length,
      syncedToServer: 0,
      localOnly: 0,
      needsMigration: 0
    };
    
    existingImages.forEach(img => {
      if (img.metadata?.savedOnServer) {
        syncStatus.syncedToServer++;
      } else {
        syncStatus.localOnly++;
        syncStatus.needsMigration++;
      }
    });
    
    return syncStatus;
    
  } catch (error) {
    console.error('❌ Błąd sprawdzania sync:', error);
    return null;
  }
};