// public/offline-sync-worker.js
// 🔄 Service Worker for offline visit completion sync

const CACHE_NAME = 'technik-visits-v1';
const OFFLINE_QUEUE_NAME = 'offline-queue';

// Install event
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(clients.claim());
});

// Online event - sync offline queue
self.addEventListener('online', async () => {
  console.log('🌐 Back online! Syncing offline data...');
  await syncOfflineQueue();
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-visits') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Sync offline queue
async function syncOfflineQueue() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(OFFLINE_QUEUE_NAME, 'readonly');
    const store = tx.objectStore(OFFLINE_QUEUE_NAME);
    const allRequests = await store.getAll();

    console.log(`📤 Found ${allRequests.length} offline submissions to sync`);

    for (const request of allRequests) {
      try {
        await syncSingleVisit(request);
        
        // Remove from queue after successful sync
        const deleteTx = db.transaction(OFFLINE_QUEUE_NAME, 'readwrite');
        const deleteStore = deleteTx.objectStore(OFFLINE_QUEUE_NAME);
        await deleteStore.delete(request.visitId);
        
        console.log(`✅ Synced visit ${request.visitId}`);

        // Notify clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_SUCCESS',
            visitId: request.visitId
          });
        });

      } catch (error) {
        console.error(`❌ Failed to sync visit ${request.visitId}:`, error);
        
        // Notify clients of failure
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_ERROR',
            visitId: request.visitId,
            error: error.message
          });
        });
      }
    }

  } catch (error) {
    console.error('Sync queue error:', error);
  }
}

// Sync single visit
async function syncSingleVisit(request) {
  const formData = new FormData();

  // Add photos
  request.photos.forEach((base64, idx) => {
    const blob = base64ToBlob(base64);
    formData.append(`photo${idx}`, blob, `photo${idx}.jpg`);
  });

  // Add metadata
  formData.append('visitId', request.visitId);
  formData.append('completionType', request.completionType);
  formData.append('notes', request.notes);
  formData.append('detectedModels', JSON.stringify(request.detectedModels || []));
  formData.append('selectedParts', JSON.stringify(request.selectedParts || []));
  formData.append('timestamp', request.timestamp);
  formData.append('syncedFromOffline', 'true');

  const token = await getStoredToken();

  const response = await fetch('/api/technician/complete-visit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Sync failed');
  }

  return await response.json();
}

// Helper: base64 to Blob
function base64ToBlob(base64) {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

// Helper: Open IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TechnikVisits', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('visit-photos')) {
        db.createObjectStore('visit-photos', { keyPath: 'visitId' });
      }
      
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_NAME)) {
        db.createObjectStore(OFFLINE_QUEUE_NAME, { keyPath: 'visitId' });
      }
    };
  });
}

// Helper: Get stored token from localStorage (via message)
async function getStoredToken() {
  const clients = await self.clients.matchAll();
  if (clients.length === 0) return null;

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    clients[0].postMessage(
      { type: 'GET_TOKEN' },
      [channel.port2]
    );
  });
}

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});

// Message event - handle token requests
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
