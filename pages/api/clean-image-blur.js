// pages/api/clean-image-blur.js
// 🧹 Alternatywna metoda: Rozmazanie zamiast białej nakładki

import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Brak URL zdjęcia' });
  }

  console.log('🧹 Czyszczenie zdjęcia (metoda: rozmazanie):', imageUrl);

  try {
    // 1. Pobierz zdjęcie z North.pl
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const imageBuffer = Buffer.from(response.data);

    // 2. Przeanalizuj zdjęcie
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    console.log('📐 Wymiary zdjęcia:', metadata.width, 'x', metadata.height);

    // 3. METODA: Przycięcie dolnej części (NAJPROSTSZA I NAJSKUTECZNIEJSZA)
    let cleanedImage;
    
    if (metadata.width > 300 && metadata.height > 300) {
      // Logo North.pl jest ZAWSZE na dolnym pasku ~60-80px wysokości
      // Najskuteczniejsza metoda: po prostu OBETNIJ dolne 12% obrazu
      
      const cropPercentage = 0.12; // Obetnij dolne 12%
      const newHeight = Math.floor(metadata.height * (1 - cropPercentage));
      
      // Przytnij obraz - usuń dolne 12%
      cleanedImage = await image
        .extract({
          left: 0,
          top: 0,
          width: metadata.width,
          height: newHeight
        })
        .jpeg({ quality: 92 })
        .toBuffer();
      
      console.log(`✂️ Przycięto dolne ${Math.floor(cropPercentage * 100)}% obrazu (${metadata.height - newHeight}px) - usunięto znak wodny`);
    } else {
      // Dla małych zdjęć: pozostaw bez zmian
      cleanedImage = await image
        .jpeg({ quality: 90 })
        .toBuffer();
      
      console.log('⚠️ Zdjęcie za małe do czyszczenia, pozostawiam bez zmian');
    }

    // 4. Zapisz wyczyszczone zdjęcie
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'parts');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `north_${timestamp}_${random}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, cleanedImage);

    const publicUrl = `/uploads/parts/${filename}`;
    
    console.log('✅ Zapisano wyczyszczone zdjęcie:', publicUrl);

    return res.status(200).json({
      success: true,
      cleanedImageUrl: publicUrl,
      originalUrl: imageUrl
    });

  } catch (error) {
    console.error('❌ Błąd czyszczenia zdjęcia:', error.message);
    
    return res.status(500).json({
      error: 'Nie udało się wyczyścić zdjęcia: ' + error.message
    });
  }
}
