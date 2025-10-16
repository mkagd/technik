// pages/api/clean-image.js
// 🧹 Endpoint do czyszczenia zdjęć z znaku wodnego North.pl

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

  console.log('🧹 Czyszczenie zdjęcia:', imageUrl);

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

    // 3. Usuń znak wodny North.pl (zazwyczaj w prawym dolnym rogu)
    // Znak wodny North.pl to białe/szare logo ~150x40px w prawym dolnym rogu
    
    let cleanedImage;
    
    if (metadata.width > 300 && metadata.height > 300) {
      // METODA: Rozmazanie/zakrycie obszaru ze znakiem wodnym
      // Zamiast obcinać, rozmazujemy prawy dolny róg
      
      // 1. Stwórz białą nakładkę dla obszaru znaku wodnego
      const watermarkWidth = Math.floor(metadata.width * 0.15); // 15% szerokości
      const watermarkHeight = Math.floor(metadata.height * 0.08); // 8% wysokości
      const watermarkLeft = metadata.width - watermarkWidth;
      const watermarkTop = metadata.height - watermarkHeight;
      
      // 2. Stwórz białą nakładkę (lub użyj rozmazania)
      const whiteOverlay = await sharp({
        create: {
          width: watermarkWidth,
          height: watermarkHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 } // Białe tło
        }
      })
      .png()
      .toBuffer();
      
      // 3. Nałóż białą nakładkę na obszar znaku wodnego
      cleanedImage = await image
        .composite([{
          input: whiteOverlay,
          left: watermarkLeft,
          top: watermarkTop,
          blend: 'over'
        }])
        .jpeg({ quality: 90 })
        .toBuffer();
      
      console.log(`🎨 Zakryto znak wodny białą nakładką (${watermarkWidth}x${watermarkHeight}px w prawym dolnym rogu)`);
    } else {
      // Dla małych zdjęć: pozostaw bez zmian
      cleanedImage = await image
        .jpeg({ quality: 90 })
        .toBuffer();
      
      console.log('⚠️ Zdjęcie za małe do czyszczenia, pozostawiam bez zmian');
    }

    // 4. Zapisz wyczyszczone zdjęcie
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'parts');
    
    // Utwórz katalog jeśli nie istnieje
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generuj unikalną nazwę pliku
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `north_${timestamp}_${random}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    // Zapisz plik
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
