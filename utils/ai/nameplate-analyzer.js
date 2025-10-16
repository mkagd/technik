// utils/ai/nameplate-analyzer.js
// 🤖 AI Analyzer dla tabliczek znamionowych

/**
 * Analizuje tabliczkę znamionową używając OpenAI Vision
 * @param {string} base64Image - Zdjęcie w base64
 * @returns {Promise<Object>} - Rozpoznane dane urządzenia
 */
export async function analyzeNameplateWithAI(base64Image) {
  const openAIKey = process.env.OPENAI_API_KEY;
  
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Analizuj tę tabliczkę znamionową urządzenia AGD. Znajdź i wyodrębnij:
          1. Markę urządzenia (BOSCH, SAMSUNG, WHIRLPOOL, ELECTROLUX, LG, AMICA, itp.)
          2. Model/numer katalogowy (np. WAG28461BY, WW90T4540AE)
          3. Typ urządzenia (pralka, zmywarka, lodówka, piekarnik, płyta indukcyjna itp.)
          4. Pojemność/rozmiar jeśli widoczny
          5. Numer seryjny jeśli widoczny
          6. Inne ważne informacje techniczne
          
          WAŻNE dla marki AMICA: 
          - Szukaj "TYPE/TYP:" - to jest prawdziwy MODEL
          - Pole "MODEL:" na tabliczce to często nazwa handlowa
          
          W polu "additionalInfo" umieść CAŁY ORYGINALNY TEKST z tabliczki.
          
          Odpowiedź w formacie JSON:
          {
            "brand": "MARKA",
            "model": "MODEL",
            "type": "TYP_URZADZENIA",
            "capacity": "POJEMNOSC",
            "serialNumber": "NUMER_SERYJNY",
            "confidence": "high/medium/low",
            "additionalInfo": "CAŁY_ORYGINALNY_TEKST_Z_TABLICZKI"
          }`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parsuj JSON z odpowiedzi
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Smart parsing dla Amica (zamień model ↔ type jeśli potrzeba)
    if (parsedData.brand?.toLowerCase() === 'amica') {
      const additionalText = (parsedData.model + ' ' + parsedData.type + ' ' + parsedData.additionalInfo).toLowerCase();
      
      // Sprawdź czy type zawiera wzorzec modelu (cyfry i kropki)
      const typeHasModelPattern = /\d{4,}[a-z0-9\.\-_:]+/i.test(parsedData.type);
      const modelIsDescriptive = parsedData.model?.length < 10 && !(/\d{4,}/.test(parsedData.model));
      
      if (typeHasModelPattern && (modelIsDescriptive || additionalText.includes('type') || additionalText.includes('typ'))) {
        const temp = parsedData.model;
        parsedData.model = parsedData.type;
        parsedData.type = temp;
        parsedData.finalModel = parsedData.model;
        parsedData.finalType = parsedData.type;
        console.log(`🔧 [AI] Amica: Zamieniono model ↔ type`);
      }
    }

    return parsedData;

  } catch (error) {
    console.error('❌ Error analyzing nameplate:', error);
    throw error;
  }
}
