// pages/api/upload-photo.js
// 🎯 GŁÓWNY ENDPOINT DO UPLOADOWANIA ZDJĘĆ
// 
// Funkcjonalności:
// ✅ Walidacja plików (MIME, rozmiar, format)
// ✅ Bezpieczne nazwy plików
// ✅ Automatyczna kompresja obrazów
// ✅ Organizacja w hierarchię folderów
// ✅ Pełny error handling
// ✅ Metadane i logging

import formidable from 'formidable';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Konfiguracja
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  compressionQuality: 80,
  maxWidth: 1920,
  maxHeight: 1080,
  thumbnailSize: 150
};

// Wyłączenie body parsera Next.js dla multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Pomocnicze funkcje
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
};

const generateUniqueFilename = (originalName, orderId, category, userId) => {
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '');
  
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const sanitizedBase = sanitizeFilename(baseName);
  
  return `${orderId}_${category}_${timestamp}_${userId}_${sanitizedBase}${ext}`;
};

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fsPromises.access(dirPath);
  } catch {
    await fsPromises.mkdir(dirPath, { recursive: true });
  }
};

const validateFile = (file) => {
  const errors = [];
  
  // Sprawdź rozmiar
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    errors.push(`Plik za duży. Maksymalny rozmiar: ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB`);
  }
  
  // Sprawdź typ MIME
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    errors.push(`Nieobsługiwany format. Dozwolone: ${UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`);
  }
  
  // Sprawdź rozszerzenie
  const ext = path.extname(file.originalFilename).toLowerCase();
  if (!UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
    errors.push(`Nieobsługiwane rozszerzenie. Dozwolone: ${UPLOAD_CONFIG.allowedExtensions.join(', ')}`);
  }
  
  return errors;
};

const compressImage = async (inputPath, outputPath, quality = UPLOAD_CONFIG.compressionQuality) => {
  try {
    const metadata = await sharp(inputPath).metadata();
    
    let pipeline = sharp(inputPath)
      .jpeg({ quality })
      .png({ compressionLevel: 6 })
      .webp({ quality });
    
    // Resize jeśli za duży
    if (metadata.width > UPLOAD_CONFIG.maxWidth || metadata.height > UPLOAD_CONFIG.maxHeight) {
      pipeline = pipeline.resize(UPLOAD_CONFIG.maxWidth, UPLOAD_CONFIG.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    await pipeline.toFile(outputPath);
    
    return {
      success: true,
      originalSize: metadata.width + 'x' + metadata.height,
      compressedSize: await sharp(outputPath).metadata().then(m => m.width + 'x' + m.height)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const createThumbnail = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .resize(UPLOAD_CONFIG.thumbnailSize, UPLOAD_CONFIG.thumbnailSize, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 70 })
      .toFile(outputPath);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const logUpload = async (uploadData) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...uploadData
  };
  
  const logFile = path.join(process.cwd(), 'logs', 'uploads.log');
  const logDir = path.dirname(logFile);
  
  await ensureDirectoryExists(logDir);
  await fsPromises.appendFile(logFile, JSON.stringify(logEntry) + '\n');
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Tylko metoda POST jest dozwolona' 
    });
  }

  let tempFilePath = null;

  try {
    // Parsowanie formularza multipart
    const form = formidable({
      maxFileSize: UPLOAD_CONFIG.maxFileSize,
      keepExtensions: true,
      multiples: false
    });

    const [fields, files] = await form.parse(req);

    // Wyciągnij parametry
    const orderId = Array.isArray(fields.orderId) ? fields.orderId[0] : fields.orderId || 'TEMP';
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category || 'general';
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId || 'SYSTEM';
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description || '';
    
    // Sprawdź czy przesłano plik
    const fileArray = Array.isArray(files.photo) ? files.photo : [files.photo];
    const uploadedFile = fileArray[0];
    
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: 'Nie przesłano żadnego pliku'
      });
    }

    tempFilePath = uploadedFile.filepath;

    // Walidacja pliku
    const validationErrors = validateFile(uploadedFile);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Błędy walidacji',
        details: validationErrors
      });
    }

    // Przygotuj ścieżki
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    let targetDir;
    
    if (orderId !== 'TEMP') {
      targetDir = path.join(uploadsDir, 'orders', orderId, category);
    } else {
      targetDir = path.join(uploadsDir, 'temp', 'unassigned');
    }

    await ensureDirectoryExists(targetDir);

    // Generuj unikalne nazwy
    const filename = generateUniqueFilename(
      uploadedFile.originalFilename, 
      orderId, 
      category, 
      userId
    );
    
    const finalPath = path.join(targetDir, filename);
    const thumbnailPath = path.join(targetDir, 'thumb_' + filename);

    // Kompresja i optymalizacja
    const compressionResult = await compressImage(tempFilePath, finalPath);
    
    if (!compressionResult.success) {
      throw new Error(`Błąd kompresji: ${compressionResult.error}`);
    }

    // Tworzenie miniatury
    const thumbnailResult = await createThumbnail(finalPath, thumbnailPath);

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

    // Przygotuj odpowiedź
    const responseData = {
      success: true,
      message: 'Zdjęcie zostało pomyślnie przesłane',
      data: {
        id: Date.now().toString(),
        filename: filename,
        originalFilename: uploadedFile.originalFilename,
        url: '/' + relativeUrl,
        thumbnailUrl: thumbnailResult.success ? '/' + thumbnailUrl : null,
        orderId: orderId,
        category: category,
        description: description,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        metadata: {
          size: finalStats.size,
          originalSize: uploadedFile.size,
          dimensions: `${finalMetadata.width}x${finalMetadata.height}`,
          format: finalMetadata.format,
          compressionRatio: ((uploadedFile.size - finalStats.size) / uploadedFile.size * 100).toFixed(1) + '%'
        }
      }
    };

    // Logowanie
    await logUpload({
      action: 'upload',
      orderId,
      category,
      userId,
      filename,
      originalSize: uploadedFile.size,
      finalSize: finalStats.size,
      success: true
    });

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Upload error:', error);

    // Logowanie błędu
    try {
      await logUpload({
        action: 'upload',
        error: error.message,
        success: false
      });
    } catch (logError) {
      console.error('❌ Logging error:', logError);
    }

    return res.status(500).json({
      success: false,
      error: 'Błąd serwera podczas przesyłania pliku',
      details: error.message
    });

  } finally {
    // Usuń tymczasowy plik
    if (tempFilePath) {
      try {
        await fsPromises.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('⚠️ Cleanup error:', cleanupError);
      }
    }
  }
}