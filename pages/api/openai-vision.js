// pages/api/openai-vision.js

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  console.log('🔥 OpenAI Vision API called:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, prompt } = req.body;
    console.log('📝 Request data:', { hasImage: !!image, prompt });
    
    // OpenAI API Key z environment variables
    const openAiKey = process.env.OPENAI_API_KEY;
    console.log('🔑 OpenAI API Key check:', openAiKey ? 'KEY FOUND' : 'KEY NOT FOUND');
    console.log('🔑 Key length:', openAiKey ? openAiKey.length : 0);
    console.log('🔑 Key starts with:', openAiKey ? openAiKey.substring(0, 10) + '...' : 'N/A');
    
    if (!openAiKey) {
      console.log('❌ OpenAI API key not found, using premium mock response');
      console.log('🔧 All env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
      
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

    console.log('🌐 Wysyłanie zapytania do OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Jesteś ekspertem w rozpoznawaniu sprzętu AGD na podstawie tabliczek znamionowych. Analizujesz zdjęcia bardzo dokładnie i wyciągasz wszystkie dostępne informacje. Używasz modelu GPT-4o Mini dla optymalnej wydajności i kosztów."
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
  "additionalInfo": "CAŁY_ORYGINALNY_TEKST_Z_TABLICZKI_WRAZ_Z_WSZYSTKIMI_OPISAMI"
}

BARDZO WAŻNE dla pola "additionalInfo":
- Umieść tam DOKŁADNIE cały tekst widoczny na tabliczce
- Zachowaj wszystkie napisy jak "Typ:", "Model:", "S/N:", "Made in:", etc.
- Jeśli widzisz "Typ: ABC123", wpisz to dokładnie w additionalInfo
- Nie interpretuj ani nie skracaj tego tekstu

Szukaj na tabliczce:
- Nazw marek (Samsung, Bosch, LG, Electrolux, Whirlpool, Siemens, Amica, etc.)
- Numerów modeli (często alfanumeryczne kody)
- Napisów "TYPE/TYP:", "Typ:", "Type:" wraz z wartością - BARDZO WAŻNE dla Amica!
- Numerów seryjnych (S/N, Serial, Nr seryjny)
- Klas energetycznych (A+++, A++, A+, A, B, C, D)
- Pojemności (kg, litrów)
- Informacji technicznych (obr/min, W, V, Hz)

SPECJALNA UWAGA dla marki AMICA:
- Jeśli widzisz "TYPE / TYP: xxxxx" - wpisz xxxxx w pole "type"
- Dla Amica, wartość po "TYPE/TYP:" to często właściwy numer modelu
- Zachowaj dokładną wartość po "TYPE/TYP:" bez zmian

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
      const errorText = await response.text().catch(() => 'No error details');
      console.error(`❌ OpenAI API error: ${response.status}`);
      console.error(`❌ Error details:`, errorText);
      
      // Sprawdź różne typy błędów
      if (response.status === 401) {
        console.error('🔑 Unauthorized - sprawdź klucz API OpenAI');
        throw new Error('GPT-4o Mini niedostępny. Sprawdź klucz API lub spróbuj ponownie.');
      }
      if (response.status === 413) {
        console.error('📦 Payload Too Large - obraz za duży');
        throw new Error('Obraz jest za duży. Spróbuj z mniejszym zdjęciem.');
      }
      if (response.status === 429) {
        console.error('⏰ Rate Limit - za dużo zapytań');
        throw new Error('Za dużo zapytań do API. Poczekaj chwilę i spróbuj ponownie.');
      }
      if (response.status >= 500) {
        console.error('🔥 Server Error - problem z serwerem OpenAI');
        throw new Error('Problem z serwerem OpenAI. Spróbuj ponownie za chwilę.');
      }
      
      throw new Error(`GPT-4o Mini niedostępny (${response.status}). Sprawdź klucz API lub spróbuj ponownie.`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content || 'No analysis available';

    // Clean the response - remove markdown formatting
    let cleanedAnalysis = analysis;
    if (analysis.includes('```json')) {
      const jsonMatch = analysis.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanedAnalysis = jsonMatch[1];
      }
    }

    // Validation of response
    try {
      const parsedAnalysis = JSON.parse(cleanedAnalysis);
      if (!parsedAnalysis.brand || !parsedAnalysis.model) {
        throw new Error('Incomplete analysis data');
      }
      
      res.status(200).json({ 
        success: true,
        analysis: cleanedAnalysis,
        confidence: parsedAnalysis.confidence === 'high' ? 0.9 : 
                   parsedAnalysis.confidence === 'medium' ? 0.7 : 0.5,
        source: "OpenAI GPT-4o Mini"
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Original response:', analysis);
      console.error('Cleaned response:', cleanedAnalysis);
      
      res.status(200).json({ 
        success: true,
        analysis: cleanedAnalysis,
        confidence: 0.6,
        source: "OpenAI GPT-4o Mini (Raw)"
      });
    }
    
  } catch (error) {
    console.error('❌ OpenAI Vision API error:', error.message);
    
    // Return actual error to help with debugging
    res.status(200).json({
      success: false,
      error: error.message || 'GPT-4o Mini niedostępny. Sprawdź klucz API lub spróbuj ponownie.',
      analysis: JSON.stringify({
        brand: "ERROR",
        model: "API_PROBLEM", 
        type: "Błąd połączenia",
        capacity: null,
        serialNumber: null,
        confidence: "low",
        additionalInfo: `Problem z API: ${error.message}`
      }),
      confidence: 0.0,
      source: "OpenAI GPT-4o Mini - Błąd połączenia"
    });
  }
}