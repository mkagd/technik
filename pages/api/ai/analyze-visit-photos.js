// pages/api/ai/analyze-visit-photos.js
// 🤖 AI analysis endpoint - UPGRADED to use existing OpenAI Vision system

import fs from 'fs';
import path from 'path';

// Helper: Convert image file to base64 for OpenAI Vision API
const imageToBase64 = (filePath) => {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('❌ Error reading image file:', error);
    throw new Error(`Failed to read image: ${filePath}`);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { visitId, photoIds, photoUrls } = req.body;

    if (!visitId || !photoUrls || photoUrls.length === 0) {
      return res.status(400).json({ error: 'Brak danych: visitId, photoUrls' });
    }

    console.log(`🤖 AI Analysis started for visit ${visitId}, ${photoUrls.length} photos`);
    console.log(`🎯 Using existing OpenAI Vision system (GPT-4o Mini) - PREMIUM INTELLIGENCE`);

    // Run OpenAI Vision analysis on all photos in parallel
    const analysisResults = await Promise.all(
      photoUrls.map(async (photoUrl, index) => {
        try {
          // Convert relative URL to absolute file path
          const publicPath = path.join(process.cwd(), 'public');
          const filePath = photoUrl.startsWith('/') 
            ? path.join(publicPath, photoUrl)
            : photoUrl;

          if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
          }

          // Convert image to base64 for OpenAI Vision API
          const base64Image = imageToBase64(filePath);

          // Call existing OpenAI Vision API (your premium system!)
          const visionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/openai-vision`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Image,
              prompt: 'Analyze appliance nameplate'
            })
          });

          if (!visionResponse.ok) {
            throw new Error(`OpenAI Vision API error: ${visionResponse.status}`);
          }

          const visionData = await visionResponse.json();

          if (!visionData.success) {
            console.warn(`⚠️ AI analysis failed for ${photoUrl}:`, visionData.error);
            return {
              photoUrl,
              photoId: photoIds?.[index],
              text: '',
              models: [],
              confidence: 0,
              error: visionData.error || 'AI analysis failed'
            };
          }

          // Parse OpenAI Vision response (it returns JSON string in analysis field)
          let parsedAnalysis;
          try {
            parsedAnalysis = JSON.parse(visionData.analysis);
          } catch (e) {
            console.error('Failed to parse AI response:', visionData.analysis);
            return {
              photoUrl,
              photoId: photoIds?.[index],
              text: visionData.analysis || '',
              models: [],
              confidence: 0,
              error: 'Failed to parse AI response'
            };
          }

          // Convert OpenAI Vision format to our model format
          const detectedModel = {
            brand: parsedAnalysis.brand || 'Unknown',
            model: parsedAnalysis.model || 'Unknown',
            type: parsedAnalysis.type || '',
            name: `${parsedAnalysis.brand} ${parsedAnalysis.model}`,
            serialNumber: parsedAnalysis.serialNumber || '',
            capacity: parsedAnalysis.capacity || '',
            energyClass: parsedAnalysis.energyClass || '',
            features: parsedAnalysis.features || [],
            additionalInfo: parsedAnalysis.additionalInfo || '',
            confidence: visionData.confidence || 0.5,
            source: 'OpenAI Vision (GPT-4o Mini)'
          };

          console.log(`✅ Photo ${index + 1}: Detected ${detectedModel.brand} ${detectedModel.model} (confidence: ${(detectedModel.confidence * 100).toFixed(0)}%)`);

          return {
            photoUrl,
            photoId: photoIds?.[index],
            text: parsedAnalysis.additionalInfo || JSON.stringify(parsedAnalysis),
            models: [detectedModel],
            confidence: visionData.confidence || 0.5
          };

        } catch (error) {
          console.error(`❌ Error analyzing ${photoUrl}:`, error);
          return {
            photoUrl,
            photoId: photoIds?.[index],
            text: '',
            models: [],
            confidence: 0,
            error: error.message
          };
        }
      })
    );

    // Aggregate detected models
    const allModels = analysisResults
      .flatMap(result => result.models)
      .filter((model, index, self) => 
        index === self.findIndex(m => m.brand === model.brand && m.model === model.model)
      )
      .sort((a, b) => b.confidence - a.confidence);

    console.log(`✅ AI Analysis complete: ${allModels.length} unique models detected`);

    res.status(200).json({
      success: true,
      visitId,
      models: allModels,
      details: analysisResults
    });

  } catch (error) {
    console.error('❌ AI Analysis error:', error);
    res.status(500).json({ 
      error: 'Błąd analizy AI',
      message: error.message 
    });
  }
}

/**
 * 🎯 UPGRADE COMPLETE!
 * 
 * This API now uses your existing OpenAI Vision (GPT-4o Mini) system
 * instead of basic Tesseract.js OCR.
 * 
 * Benefits:
 * - ✅ Superior accuracy (GPT-4o Mini vs basic OCR)
 * - ✅ Understands context (not just text extraction)
 * - ✅ Extracts ALL information (brand, model, type, capacity, features, etc.)
 * - ✅ Works with blurry/angled photos
 * - ✅ Multilingual support (Polish + English)
 * - ✅ Already tested and proven in your system!
 * 
 * The old Tesseract.js code has been removed.
 * Now using: /api/openai-vision for premium nameplate recognition.
 */
