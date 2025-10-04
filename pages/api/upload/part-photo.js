import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB max
      keepExtensions: true,
      multiples: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const requestId = Array.isArray(fields.requestId) ? fields.requestId[0] : fields.requestId;
    
    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }

    // Create directory for this request if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'parts', requestId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Handle single or multiple files
    const uploadedFiles = Array.isArray(files.photo) ? files.photo : [files.photo];
    const savedPhotos = [];

    for (const file of uploadedFiles) {
      if (!file) continue;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' 
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalFilename || file.newFilename);
      const filename = `photo-${timestamp}${ext}`;
      const targetPath = path.join(uploadDir, filename);

      // Move file to target directory
      fs.renameSync(file.filepath, targetPath);

      // Store relative path for database
      const relativePath = `/uploads/parts/${requestId}/${filename}`;
      savedPhotos.push({
        url: relativePath,
        filename: filename,
        originalName: file.originalFilename,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      photos: savedPhotos,
      message: `Successfully uploaded ${savedPhotos.length} photo(s)`,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
}
