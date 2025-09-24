// pages/api/ocr-space.js
// DARMOWE API: 25,000 requests/miesiąc!

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    
    // OCR.space API - DARMOWE!
    const ocrSpaceKey = process.env.OCR_SPACE_API_KEY || 'demo'; // demo key dla testów
    
    if (!process.env.OCR_SPACE_API_KEY) {
      console.log('OCR.space API key not found, using enhanced mock response');
      
      // Enhanced mock responses (lepsze niż podstawowe OCR)
      const mockResponses = [
        {
          success: true,
          model: "SAMSUNG WW90T4540AE",
          confidence: 0.82,
          analysis: `Model: SAMSUNG WW90T4540AE
AddWash 9kg 1400rpm
EcoBubble Technology
A+++ Energy Class
Serial: SW2024001`,
          source: "OCR.space (Mock - Free)"
        },
        {
          success: true,
          model: "BOSCH WAW28560EU",
          confidence: 0.79,
          analysis: `Model: BOSCH WAW28560EU
Serie 8 - 9kg Washing Machine
i-DOS automatic dosing
1400 rpm, A+++ Energy
S/N: BSH987654`,
          source: "OCR.space (Mock - Free)"
        },
        {
          success: true,
          model: "ELECTROLUX EW6F528WU",
          confidence: 0.76,
          analysis: `ELECTROLUX EW6F528WU
SteamCare 8kg Front Load
1200 rpm, A+++ Energy
Model: EW6F528WU
Serial: EL123456789`,
          source: "OCR.space (Mock - Free)"
        }
      ];
      
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      return res.status(200).json(randomResponse);
    }

    // Real OCR.space API call
    const payload = {
      apikey: ocrSpaceKey,
      base64Image: `data:image/jpeg;base64,${image}`,
      language: 'pol', // Polish + English
      isOverlayRequired: false,
      detectOrientation: true,
      scale: true,
      isTable: false,
      OCREngine: 2 // Latest engine
    };

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`OCR.space API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage || 'OCR processing failed');
    }

    const extractedText = data.ParsedResults?.[0]?.ParsedText || 'No text detected';
    
    // Parse extracted text to find appliance model
    const modelMatch = extractedText.match(/Model[:\s]*([A-Z0-9\-]{6,15})/i);
    const detectedModel = modelMatch ? modelMatch[1] : 'Unknown Model';

    const response_data = {
      success: true,
      model: detectedModel,
      confidence: data.ParsedResults?.[0]?.TextOverlay ? 0.85 : 0.70,
      analysis: extractedText,
      source: "OCR.space API (Free)"
    };

    res.status(200).json(response_data);
    
  } catch (error) {
    console.error('OCR.space API error:', error);
    
    // Fallback response
    res.status(200).json({
      success: false,
      error: error.message,
      model: "FALLBACK_MODEL",
      confidence: 0.3,
      analysis: "OCR.space API error - using fallback",
      source: "OCR.space Error Fallback"
    });
  }
}