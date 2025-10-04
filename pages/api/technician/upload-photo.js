// pages/api/technician/upload-photo.js
// 📸 API do uploadowania zdjęć z wizyty

import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'technician-sessions.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'visits');

// Upewnij się że folder uploads istnieje
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ===========================
// HELPER FUNCTIONS
// ===========================

const readOrders = () => {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading orders.json:', error);
    return [];
  }
};

const writeOrders = (orders) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Error writing orders.json:', error);
    return false;
  }
};

const readSessions = () => {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('❌ Error reading sessions:', error);
    return [];
  }
};

const validateToken = (token) => {
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (!session) return null;
  
  const expirationTime = 7 * 24 * 60 * 60 * 1000;
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  
  if (sessionAge > expirationTime) {
    return null;
  }
  
  return { employeeId: session.employeeId, employeeName: session.name || session.email };
};

// Typy zdjęć
const PHOTO_TYPES = {
  BEFORE: 'before',           // Przed pracą
  DURING: 'during',           // W trakcie pracy
  AFTER: 'after',             // Po pracy
  PROBLEM: 'problem',         // Zdjęcie problemu
  COMPLETION: 'completion',   // Zdjęcie ukończenia
  PART: 'part',               // Zdjęcie części
  SERIAL: 'serial',           // Numer seryjny
  DAMAGE: 'damage'            // Uszkodzenie
};

// Dodaj zdjęcie do wizyty
const addPhotoToVisit = (visitId, photoData, employeeId) => {
  const orders = readOrders();

  for (const order of orders) {
    if (!order.visits || !Array.isArray(order.visits)) continue;

    const visit = order.visits.find(v => v.visitId === visitId);
    
    if (visit) {
      // Sprawdź przypisanie
      if (visit.assignedTo !== employeeId && visit.technicianId !== employeeId) {
        return { 
          success: false, 
          error: 'NOT_ASSIGNED',
          message: 'This visit is not assigned to you' 
        };
      }
      
      const now = new Date().toISOString();
      
      // Stwórz obiekt zdjęcia
      const photo = {
        id: `PHOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: photoData.type || PHOTO_TYPES.DURING,
        url: photoData.url,
        filename: photoData.filename,
        originalName: photoData.originalName,
        mimeType: photoData.mimeType,
        size: photoData.size,
        
        // Metadata
        caption: photoData.caption || '',
        description: photoData.description || '',
        tags: photoData.tags || [],
        
        // Geo
        location: photoData.location || null,
        
        // Kto dodał
        uploadedBy: employeeId,
        uploadedAt: now,
        
        // Dodatkowe
        relatedTo: photoData.relatedTo || null, // np. note ID, part ID
        isPrivate: photoData.isPrivate || false
      };
      
      // Dodaj do odpowiedniej tablicy
      switch (photo.type) {
        case PHOTO_TYPES.BEFORE:
          if (!visit.beforePhotos) visit.beforePhotos = [];
          visit.beforePhotos.push(photo);
          break;
          
        case PHOTO_TYPES.DURING:
          if (!visit.duringPhotos) visit.duringPhotos = [];
          visit.duringPhotos.push(photo);
          break;
          
        case PHOTO_TYPES.AFTER:
          if (!visit.afterPhotos) visit.afterPhotos = [];
          visit.afterPhotos.push(photo);
          break;
          
        case PHOTO_TYPES.PROBLEM:
          if (!visit.problemPhotos) visit.problemPhotos = [];
          visit.problemPhotos.push(photo);
          break;
          
        case PHOTO_TYPES.COMPLETION:
          if (!visit.completionPhotos) visit.completionPhotos = [];
          visit.completionPhotos.push(photo);
          break;
          
        case PHOTO_TYPES.PART:
          if (!visit.partPhotos) visit.partPhotos = [];
          visit.partPhotos.push(photo);
          break;
          
        case PHOTO_TYPES.SERIAL:
          if (!visit.serialPhotos) visit.serialPhotos = [];
          visit.serialPhotos.push(photo);
          break;
          
        case PHOTO_TYPES.DAMAGE:
          if (!visit.damagePhotos) visit.damagePhotos = [];
          visit.damagePhotos.push(photo);
          break;
          
        default:
          if (!visit.photos) visit.photos = [];
          visit.photos.push(photo);
      }
      
      // Dodaj też do ogólnej tablicy photos
      if (!visit.allPhotos) visit.allPhotos = [];
      visit.allPhotos.push(photo);
      
      // Update timestamp
      visit.updatedAt = now;
      visit.photoCount = (visit.photoCount || 0) + 1;
      
      // Zapisz
      if (writeOrders(orders)) {
        return {
          success: true,
          message: 'Photo added successfully',
          photo: photo,
          visitId: visitId
        };
      } else {
        return {
          success: false,
          error: 'WRITE_ERROR',
          message: 'Failed to save photo metadata'
        };
      }
    }
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: `Visit ${visitId} not found`
  };
};

// Usuń zdjęcie
const deletePhoto = (visitId, photoId, employeeId) => {
  const orders = readOrders();

  for (const order of orders) {
    if (!order.visits || !Array.isArray(order.visits)) continue;

    const visit = order.visits.find(v => v.visitId === visitId);
    
    if (visit) {
      // Sprawdź przypisanie
      if (visit.assignedTo !== employeeId && visit.technicianId !== employeeId) {
        return { 
          success: false, 
          error: 'NOT_ASSIGNED',
          message: 'This visit is not assigned to you' 
        };
      }
      
      let photoFound = false;
      let photoFilename = null;
      
      // Szukaj zdjęcia we wszystkich tablicach
      const photoArrays = [
        'beforePhotos', 'duringPhotos', 'afterPhotos', 
        'problemPhotos', 'completionPhotos', 'partPhotos',
        'serialPhotos', 'damagePhotos', 'photos', 'allPhotos'
      ];
      
      for (const arrayName of photoArrays) {
        if (visit[arrayName] && Array.isArray(visit[arrayName])) {
          const photoIndex = visit[arrayName].findIndex(p => p.id === photoId);
          
          if (photoIndex !== -1) {
            const photo = visit[arrayName][photoIndex];
            
            // Sprawdź czy pracownik może usunąć
            if (photo.uploadedBy !== employeeId) {
              return {
                success: false,
                error: 'FORBIDDEN',
                message: 'You can only delete photos you uploaded'
              };
            }
            
            photoFilename = photo.filename;
            visit[arrayName].splice(photoIndex, 1);
            photoFound = true;
          }
        }
      }
      
      if (!photoFound) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: `Photo ${photoId} not found`
        };
      }
      
      // Usuń plik fizyczny
      if (photoFilename) {
        const photoPath = path.join(UPLOADS_DIR, photoFilename);
        if (fs.existsSync(photoPath)) {
          try {
            fs.unlinkSync(photoPath);
          } catch (error) {
            console.error('❌ Error deleting photo file:', error);
          }
        }
      }
      
      visit.updatedAt = new Date().toISOString();
      visit.photoCount = Math.max(0, (visit.photoCount || 0) - 1);
      
      if (writeOrders(orders)) {
        return {
          success: true,
          message: 'Photo deleted successfully',
          photoId: photoId
        };
      } else {
        return {
          success: false,
          error: 'WRITE_ERROR',
          message: 'Failed to update visit'
        };
      }
    }
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: `Visit ${visitId} not found`
  };
};

// Pobierz zdjęcia wizyty
const getVisitPhotos = (visitId, employeeId) => {
  const orders = readOrders();

  for (const order of orders) {
    if (!order.visits || !Array.isArray(order.visits)) continue;

    const visit = order.visits.find(v => v.visitId === visitId);
    
    if (visit) {
      // Sprawdź przypisanie
      if (visit.assignedTo !== employeeId && visit.technicianId !== employeeId) {
        return { 
          success: false, 
          error: 'NOT_ASSIGNED',
          message: 'This visit is not assigned to you' 
        };
      }
      
      return {
        success: true,
        visitId: visitId,
        photos: {
          before: visit.beforePhotos || [],
          during: visit.duringPhotos || [],
          after: visit.afterPhotos || [],
          problem: visit.problemPhotos || [],
          completion: visit.completionPhotos || [],
          part: visit.partPhotos || [],
          serial: visit.serialPhotos || [],
          damage: visit.damagePhotos || [],
          all: visit.allPhotos || []
        },
        totalCount: visit.photoCount || 0
      };
    }
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: `Visit ${visitId} not found`
  };
};

// ===========================
// MAIN API HANDLER
// ===========================

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Waliduj token
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required'
    });
  }

  const employee = validateToken(token);
  
  if (!employee) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  try {
    // GET - Pobierz zdjęcia
    if (req.method === 'GET') {
      const { visitId } = req.query;

      if (!visitId) {
        return res.status(400).json({
          success: false,
          message: 'visitId parameter is required'
        });
      }

      const result = getVisitPhotos(visitId, employee.employeeId);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                           result.error === 'NOT_ASSIGNED' ? 403 : 500;
        return res.status(statusCode).json(result);
      }
    }

    // POST - Upload zdjęcia (z prawdziwym plikiem przez FormData)
    if (req.method === 'POST') {
      return new Promise((resolve) => {
        const form = new IncomingForm({
          uploadDir: UPLOADS_DIR,
          keepExtensions: true,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          filename: (name, ext, part) => {
            return `visit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
          }
        });

        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error('❌ Form parse error:', err);
            res.status(500).json({
              success: false,
              message: 'Error parsing upload form',
              error: err.message
            });
            return resolve();
          }

          try {
            const visitId = Array.isArray(fields.visitId) ? fields.visitId[0] : fields.visitId;
            const type = Array.isArray(fields.type) ? fields.type[0] : (fields.type || PHOTO_TYPES.DURING);
            const caption = Array.isArray(fields.caption) ? fields.caption[0] : (fields.caption || '');
            const description = Array.isArray(fields.description) ? fields.description[0] : (fields.description || '');
            
            if (!visitId) {
              res.status(400).json({
                success: false,
                message: 'visitId is required'
              });
              return resolve();
            }

            const photo = files.photo;
            if (!photo) {
              res.status(400).json({
                success: false,
                message: 'No photo file uploaded'
              });
              return resolve();
            }

            // Pobierz pierwszy plik jeśli to array
            const photoFile = Array.isArray(photo) ? photo[0] : photo;
            
            if (!photoFile.mimetype.startsWith('image/')) {
              res.status(400).json({
                success: false,
                message: 'File must be an image'
              });
              return resolve();
            }

            const filename = path.basename(photoFile.filepath);
            const photoUrl = `/uploads/visits/${filename}`;

            const photoData = {
              type: type,
              url: photoUrl,
              filename: filename,
              originalName: photoFile.originalFilename || 'photo.jpg',
              mimeType: photoFile.mimetype,
              size: photoFile.size,
              caption: caption,
              description: description,
              tags: [],
              location: null
            };

            console.log(`📸 Dodawanie zdjęcia do wizyty ${visitId} (typ: ${photoData.type})`);

            const result = addPhotoToVisit(visitId, photoData, employee.employeeId);

            if (result.success) {
              console.log(`✅ Zdjęcie dodane: ${result.photo.id}`);
              res.status(201).json(result);
            } else {
              // Usuń plik jeśli nie udało się dodać do bazy
              try {
                fs.unlinkSync(photoFile.filepath);
              } catch (e) {
                console.error('Error deleting file:', e);
              }
              
              const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                                 result.error === 'NOT_ASSIGNED' ? 403 : 500;
              console.log(`❌ Błąd: ${result.message}`);
              res.status(statusCode).json(result);
            }
            resolve();
          } catch (error) {
            console.error('❌ Error processing upload:', error);
            res.status(500).json({
              success: false,
              message: 'Error processing upload',
              error: error.message
            });
            resolve();
          }
        });
      });
    }

    // DELETE - Usuń zdjęcie
    if (req.method === 'DELETE') {
      const { photoId } = req.query;

      if (!photoId) {
        return res.status(400).json({
          success: false,
          message: 'photoId parameter is required'
        });
      }

      // Znajdź wizytę która ma to zdjęcie
      const orders = readOrders();
      let visitId = null;
      
      outerLoop: for (const order of orders) {
        if (!order.visits) continue;
        for (const visit of order.visits) {
          if (visit.allPhotos && visit.allPhotos.find(p => p.id === photoId)) {
            visitId = visit.visitId;
            break outerLoop;
          }
        }
      }

      if (!visitId) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      const result = deletePhoto(visitId, photoId, employee.employeeId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                           result.error === 'NOT_ASSIGNED' ? 403 :
                           result.error === 'FORBIDDEN' ? 403 : 500;
        return res.status(statusCode).json(result);
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Error handling photos:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// Disable body parsing for formidable to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false  // Must be false to allow formidable to parse
  },
};
