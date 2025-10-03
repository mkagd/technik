// pages/api/orders/[id]/photos.js
// 🎯 API DO ZARZĄDZANIA ZDJĘCIAMI W ZLECENIACH
//
// GET /api/orders/[id]/photos - pobierz zdjęcia zlecenia
// POST /api/orders/[id]/photos - dodaj zdjęcie do zlecenia  
// DELETE /api/orders/[id]/photos/[photoId] - usuń zdjęcie

import { getOrderPhotos, addPhotoToOrder, removePhotoFromOrder } from '../../../../utils/photo-integration';
import formidable from 'formidable';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Wyłączenie body parsera Next.js dla multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { id: orderId, photoId } = req.query;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: 'Brak ID zlecenia'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetPhotos(req, res, orderId);
      
      case 'POST':
        return await handleAddPhoto(req, res, orderId);
      
      case 'DELETE':
        return await handleDeletePhoto(req, res, orderId, photoId);
      
      default:
        return res.status(405).json({
          success: false,
          error: 'Nieobsługiwana metoda HTTP'
        });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera',
      details: error.message
    });
  }
}

// Pobierz zdjęcia zlecenia
async function handleGetPhotos(req, res, orderId) {
  const { category } = req.query;
  
  const result = getOrderPhotos(orderId, category);
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  return res.status(200).json({
    success: true,
    orderId: orderId,
    category: category || 'all',
    photos: result.photos,
    count: result.photos.length
  });
}

// Dodaj zdjęcie do zlecenia (przez upload)
async function handleAddPhoto(req, res, orderId) {
  try {
    // Parsowanie formularza multipart
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
      multiples: false
    });

    const [fields, files] = await form.parse(req);

    // Wyciągnij parametry
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category || 'general';
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description || '';
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId || 'SYSTEM';
    
    // Sprawdź czy przesłano plik
    const fileArray = Array.isArray(files.photo) ? files.photo : [files.photo];
    const uploadedFile = fileArray[0];
    
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: 'Nie przesłano żadnego pliku'
      });
    }

    // Przygotuj ścieżki
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const targetDir = path.join(uploadsDir, 'orders', orderId, category);
    
    await fsPromises.mkdir(targetDir, { recursive: true });

    // Generuj unikalne nazwy
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '');
    
    const ext = path.extname(uploadedFile.originalFilename);
    const filename = `${orderId}_${category}_${timestamp}_${userId}${ext}`;
    
    const finalPath = path.join(targetDir, filename);
    const thumbnailPath = path.join(targetDir, 'thumb_' + filename);

    // Kompresja i optymalizacja
    await sharp(uploadedFile.filepath)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(finalPath);

    // Tworzenie miniatury
    await sharp(finalPath)
      .resize(150, 150, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    // Pobierz metadane końcowego pliku
    const finalStats = await fsPromises.stat(finalPath);
    const finalMetadata = await sharp(finalPath).metadata();

    // Przygotuj względny URL
    const relativeUrl = path.relative(
      path.join(process.cwd(), 'public'),
      finalPath
    ).replace(/\\/g, '/');

    const thumbnailUrl = path.relative(
      path.join(process.cwd(), 'public'),
      thumbnailPath
    ).replace(/\\/g, '/');

    // Dane zdjęcia do dodania do zlecenia
    const photoData = {
      id: `IMG_${Date.now()}`,
      filename: filename,
      originalFilename: uploadedFile.originalFilename,
      url: '/' + relativeUrl,
      thumbnailUrl: '/' + thumbnailUrl,
      description: description,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      category: category,
      metadata: {
        size: finalStats.size,
        dimensions: `${finalMetadata.width}x${finalMetadata.height}`,
        format: finalMetadata.format,
        compressionRatio: ((uploadedFile.size - finalStats.size) / uploadedFile.size * 100).toFixed(1) + '%'
      }
    };

    // Dodaj zdjęcie do zlecenia
    const result = addPhotoToOrder(orderId, photoData, category);
    
    // Usuń tymczasowy plik
    await fsPromises.unlink(uploadedFile.filepath);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Zdjęcie zostało dodane do zlecenia',
      data: photoData
    });

  } catch (error) {
    console.error('❌ Add photo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd podczas dodawania zdjęcia',
      details: error.message
    });
  }
}

// Usuń zdjęcie ze zlecenia
async function handleDeletePhoto(req, res, orderId, photoId) {
  if (!photoId) {
    return res.status(400).json({
      success: false,
      error: 'Brak ID zdjęcia'
    });
  }

  const result = removePhotoFromOrder(orderId, photoId);
  
  if (!result.success) {
    return res.status(404).json(result);
  }

  return res.status(200).json({
    success: true,
    message: 'Zdjęcie zostało usunięte ze zlecenia',
    data: result
  });
}