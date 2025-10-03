// utils/photo-integration.js
// 🎯 INTEGRACJA ZDJĘĆ Z SYSTEMEM ZLECEŃ
//
// Funkcje do zarządzania zdjęciami w ramach zleceń

const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

// Struktura danych dla zdjęć w zleceniu
const createPhotoStructure = (photoData) => ({
  id: photoData.id || `IMG_${Date.now()}`,
  url: photoData.url,
  thumbnailUrl: photoData.thumbnailUrl || null,
  description: photoData.description || '',
  timestamp: photoData.uploadedAt || new Date().toISOString(),
  uploadedBy: photoData.uploadedBy || 'system',
  category: photoData.category || 'general',
  metadata: {
    filename: photoData.filename,
    originalFilename: photoData.originalFilename,
    size: photoData.metadata?.size || 0,
    dimensions: photoData.metadata?.dimensions || '',
    format: photoData.metadata?.format || '',
    camera: photoData.metadata?.camera || 'unknown',
    flashlight: photoData.metadata?.flashlight || false,
    compressionRatio: photoData.metadata?.compressionRatio || '0%'
  }
});

// Dodaj pola na zdjęcia do istniejących zleceń
const addPhotoFieldsToOrders = () => {
  try {
    const ordersData = fs.readFileSync(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(ordersData);
    
    const updatedOrders = orders.map(order => {
      // Dodaj pola na zdjęcia jeśli nie istnieją
      if (!order.photos) {
        order.photos = {
          beforePhotos: [],
          afterPhotos: [],
          problemPhotos: [],
          solutionPhotos: [],
          modelPhotos: [],
          generalPhotos: []
        };
      }
      
      // Aktualizuj metadata
      if (!order.metadata) {
        order.metadata = {};
      }
      
      order.metadata.lastModifiedBy = 'photo-integration-system';
      order.metadata.photoIntegrationDate = new Date().toISOString();
      order.metadata.hasPhotoSupport = true;
      
      return order;
    });
    
    // Zapisz zaktualizowane dane
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(updatedOrders, null, 2));
    
    console.log(`✅ Dodano pola na zdjęcia do ${updatedOrders.length} zleceń`);
    return { success: true, count: updatedOrders.length };
    
  } catch (error) {
    console.error('❌ Błąd aktualizacji zleceń:', error);
    return { success: false, error: error.message };
  }
};

// Dodaj zdjęcie do konkretnego zlecenia
const addPhotoToOrder = (orderId, photoData, category = 'general') => {
  try {
    const ordersData = fs.readFileSync(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(ordersData);
    
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return { success: false, error: 'Zlecenie nie zostało znalezione' };
    }
    
    const order = orders[orderIndex];
    
    // Upewnij się, że struktura photos istnieje
    if (!order.photos) {
      order.photos = {
        beforePhotos: [],
        afterPhotos: [],
        problemPhotos: [],
        solutionPhotos: [],
        modelPhotos: [],
        generalPhotos: []
      };
    }
    
    // Mapuj kategorię na odpowiednie pole
    const categoryMap = {
      'before': 'beforePhotos',
      'after': 'afterPhotos', 
      'problem': 'problemPhotos',
      'solution': 'solutionPhotos',
      'model': 'modelPhotos',
      'general': 'generalPhotos'
    };
    
    const photoField = categoryMap[category] || 'generalPhotos';
    const photoStructure = createPhotoStructure(photoData);
    
    // Dodaj zdjęcie
    order.photos[photoField].push(photoStructure);
    
    // Aktualizuj metadata zlecenia
    order.metadata = {
      ...order.metadata,
      lastModifiedBy: 'photo-integration-system',
      updatedAt: new Date().toISOString(),
      photoCount: Object.values(order.photos).flat().length
    };
    
    // Zapisz zmiany
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    
    console.log(`✅ Dodano zdjęcie ${photoData.filename} do zlecenia ${orderId} w kategorii ${category}`);
    
    return { 
      success: true, 
      photoId: photoStructure.id,
      orderId: orderId,
      category: category
    };
    
  } catch (error) {
    console.error('❌ Błąd dodawania zdjęcia:', error);
    return { success: false, error: error.message };
  }
};

// Pobierz zdjęcia zlecenia
const getOrderPhotos = (orderId, category = null) => {
  try {
    const ordersData = fs.readFileSync(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(ordersData);
    
    const order = orders.find(order => order.id === orderId);
    
    if (!order) {
      return { success: false, error: 'Zlecenie nie zostało znalezione' };
    }
    
    if (!order.photos) {
      return { success: true, photos: [] };
    }
    
    if (category) {
      const categoryMap = {
        'before': 'beforePhotos',
        'after': 'afterPhotos',
        'problem': 'problemPhotos', 
        'solution': 'solutionPhotos',
        'model': 'modelPhotos',
        'general': 'generalPhotos'
      };
      
      const photoField = categoryMap[category];
      return { 
        success: true, 
        photos: order.photos[photoField] || [] 
      };
    }
    
    // Zwróć wszystkie zdjęcia
    const allPhotos = Object.values(order.photos).flat();
    return { success: true, photos: allPhotos };
    
  } catch (error) {
    console.error('❌ Błąd pobierania zdjęć:', error);
    return { success: false, error: error.message };
  }
};

// Usuń zdjęcie ze zlecenia
const removePhotoFromOrder = (orderId, photoId) => {
  try {
    const ordersData = fs.readFileSync(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(ordersData);
    
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return { success: false, error: 'Zlecenie nie zostało znalezione' };
    }
    
    const order = orders[orderIndex];
    
    if (!order.photos) {
      return { success: false, error: 'Zlecenie nie ma zdjęć' };
    }
    
    // Znajdź i usuń zdjęcie z odpowiedniej kategorii
    let photoRemoved = false;
    let removedFromCategory = null;
    
    for (const [categoryKey, photos] of Object.entries(order.photos)) {
      const photoIndex = photos.findIndex(photo => photo.id === photoId);
      if (photoIndex !== -1) {
        photos.splice(photoIndex, 1);
        photoRemoved = true;
        removedFromCategory = categoryKey;
        break;
      }
    }
    
    if (!photoRemoved) {
      return { success: false, error: 'Zdjęcie nie zostało znalezione' };
    }
    
    // Aktualizuj metadata
    order.metadata = {
      ...order.metadata,
      lastModifiedBy: 'photo-integration-system',
      updatedAt: new Date().toISOString(),
      photoCount: Object.values(order.photos).flat().length
    };
    
    // Zapisz zmiany
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    
    console.log(`✅ Usunięto zdjęcie ${photoId} ze zlecenia ${orderId} z kategorii ${removedFromCategory}`);
    
    return { 
      success: true, 
      photoId: photoId,
      orderId: orderId,
      removedFromCategory: removedFromCategory
    };
    
  } catch (error) {
    console.error('❌ Błąd usuwania zdjęcia:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  addPhotoFieldsToOrders,
  addPhotoToOrder,
  getOrderPhotos,
  removePhotoFromOrder,
  createPhotoStructure
};