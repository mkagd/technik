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
    console.log('📸 Starting photo upload...');
    
    // Parse form data
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB max
      keepExtensions: true,
      multiples: true,
      uploadDir: path.join(process.cwd(), 'public', 'uploads', 'parts'),
      filename: (name, ext, part, form) => {
        return `temp-${Date.now()}${ext}`;
      }
    });

    // Ensure upload directory exists
    const baseUploadDir = path.join(process.cwd(), 'public', 'uploads', 'parts');
    if (!fs.existsSync(baseUploadDir)) {
      fs.mkdirSync(baseUploadDir, { recursive: true });
    }

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ Formidable parse error:', err);
          reject(err);
        }
        console.log('✅ Form parsed successfully');
        console.log('Fields:', fields);
        console.log('Files:', Object.keys(files));
        resolve([fields, files]);
      });
    });

    const requestId = Array.isArray(fields.requestId) ? fields.requestId[0] : fields.requestId;
    console.log('📦 Request ID:', requestId);
    
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

    console.log('📁 Processing files:', uploadedFiles.length);

    for (const file of uploadedFiles) {
      if (!file) {
        console.log('⚠️ Skipping empty file');
        continue;
      }

      console.log('📄 Processing file:', {
        originalFilename: file.originalFilename,
        newFilename: file.newFilename,
        mimetype: file.mimetype,
        size: file.size,
        filepath: file.filepath
      });

      // Validate file type (formidable v3 uses mimetype)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const mimeType = file.mimetype || file.type;
      
      if (!allowedTypes.includes(mimeType)) {
        console.error('❌ Invalid file type:', mimeType);
        return res.status(400).json({ 
          error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.',
          receivedType: mimeType
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalFilename || file.newFilename || '.jpg');
      const filename = `photo-${timestamp}${ext}`;
      const targetPath = path.join(uploadDir, filename);

      console.log('💾 Moving file from:', file.filepath);
      console.log('💾 Moving file to:', targetPath);

      // Move file to target directory
      try {
        fs.renameSync(file.filepath, targetPath);
        console.log('✅ File moved successfully');
      } catch (moveError) {
        console.error('❌ Error moving file:', moveError);
        throw moveError;
      }

      // Store relative path for database
      const relativePath = `/uploads/parts/${requestId}/${filename}`;
      savedPhotos.push({
        url: relativePath,
        filename: filename,
        originalName: file.originalFilename || file.newFilename,
        size: file.size,
        mimeType: mimeType,
        uploadedAt: new Date().toISOString(),
      });
    }

    console.log('✅ Saved photos:', savedPhotos.length);

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
