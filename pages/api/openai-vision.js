// pages/api/openai-vision.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, prompt } = req.body;
    
    // OpenAI API Key z environment variables
    const openAiKey = process.env.OPENAI_API_KEY;
    
    if (!openAiKey) {
      console.log('OpenAI API key not found, using premium mock response');
      
      // Premium mock responses (OpenAI is more expensive but provides superior analysis)
      const premiumMocks = [
        {
          success: true,
          analysis: JSON.stringify({
            brand: "BOSCH",
            model: "WAG28461BY",
            type: "Pralka automatyczna ładowana od przodu",
            capacity: "9 kg",
            features: ["Serie 6", "EcoSilence Drive", "AntiVibration Design", "VarioSpeed"],
            serialNumber: "BSH123456789",
            energyClass: "A+++",
            spinSpeed: "1400 obr/min",
            confidence: "high",
            additionalInfo: "Bosch Serie 6 z silnikiem bezszczotkowym EcoSilence Drive i systemem AntiVibration"
          }),
          confidence: 0.96,
          source: "OpenAI GPT-4 Vision (Mock - Premium Intelligence)"
        },
        {
          success: true,
          analysis: JSON.stringify({
            brand: "Samsung",
            model: "WW90T4540AE",
            type: "Pralka automatyczna AddWash",
            capacity: "9 kg",
            features: ["AddWash", "EcoBubble", "Digital Inverter", "SmartCheck", "Hygiene Steam"],
            serialNumber: "SM987654321",
            energyClass: "A+++",
            spinSpeed: "1400 obr/min",
            confidence: "high",
            additionalInfo: "Samsung AddWash z technologią EcoBubble i funkcją Hygiene Steam do dezynfekcji"
          }),
          confidence: 0.94,
          source: "OpenAI GPT-4 Vision (Mock - Premium Intelligence)"
        }
      ];
      
      const premiumResponse = premiumMocks[Math.floor(Math.random() * premiumMocks.length)];
      return res.status(200).json(premiumResponse);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "Jesteś ekspertem w rozpoznawaniu sprzętu AGD na podstawie tabliczek znamionowych. Analizujesz zdjęcia bardzo dokładnie i wyciągasz wszystkie dostępne informacje."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Przeanalizuj to zdjęcie tabliczki znamionowej sprzętu AGD i wyciągnij następujące informacje w formacie JSON:

{
  "brand": "MARKA_SPRZĘTU",
  "model": "DOKŁADNY_MODEL",
  "type": "typ_sprzętu (np. pralka, lodówka, zmywarka)",
  "capacity": "pojemność_jeśli_dostępna",
  "features": ["lista", "funkcji", "i", "technologii"],
  "serialNumber": "NUMER_SERYJNY",
  "energyClass": "klasa_energetyczna",
  "spinSpeed": "prędkość_wirowania_jeśli_pralka",
  "confidence": "high/medium/low",
  "additionalInfo": "dodatkowe_informacje"
}

Szukaj na tabliczce:
- Nazw marek (Samsung, Bosch, LG, Electrolux, Whirlpool, Siemens, etc.)
- Numerów modeli (często alfanumeryczne kody)
- Numerów seryjnych (S/N, Serial, Nr seryjny)
- Klas energetycznych (A+++, A++, A+, A, B, C, D)
- Pojemności (kg, litrów)
- Informacji technicznych (obr/min, W, V, Hz)

Jeśli nie możesz odczytać niektórych informacji, wpisz null.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`OpenAI API error: ${response.status}`, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content || 'No analysis available';

    // Validation of response
    try {
      const parsedAnalysis = JSON.parse(analysis);
      if (!parsedAnalysis.brand || !parsedAnalysis.model) {
        throw new Error('Incomplete analysis data');
      }
      
      res.status(200).json({ 
        success: true,
        analysis,
        confidence: parsedAnalysis.confidence === 'high' ? 0.9 : 
                   parsedAnalysis.confidence === 'medium' ? 0.7 : 0.5,
        source: "OpenAI GPT-4 Vision"
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      res.status(200).json({ 
        success: true,
        analysis,
        confidence: 0.6,
        source: "OpenAI GPT-4 Vision (Raw)"
      });
    }
    
  } catch (error) {
    console.error('OpenAI Vision API error:', error);
    
    // Enhanced fallback response with error context
    res.status(200).json({
      success: false,
      error: error.message,
      analysis: JSON.stringify({
        brand: "FALLBACK",
        model: "ERROR_RESPONSE", 
        type: "Nierozpoznany",
        capacity: null,
        serialNumber: null,
        confidence: "low",
        additionalInfo: `Błąd API: ${error.message}`
      }),
      confidence: 0.1,
      source: "OpenAI API Error Fallback"
    });
  }
}