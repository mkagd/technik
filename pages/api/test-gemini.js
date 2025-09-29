// pages/api/test-gemini.js - Test klucza Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Tylko GET' });
  }

  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    console.log('🔑 Test klucza Gemini:');
    console.log('- Klucz z env:', apiKey ? `${apiKey.substring(0, 10)}...` : 'BRAK');
    console.log('- Długość klucza:', apiKey ? apiKey.length : 0);
    console.log('- Zaczyna się od AIzaSy:', apiKey?.startsWith('AIzaSy') ? 'TAK' : 'NIE');

    if (!apiKey || apiKey === 'your-google-gemini-api-key-here') {
      return res.status(400).json({
        error: 'Brak klucza API',
        debug: {
          keyExists: !!apiKey,
          keyLength: apiKey ? apiKey.length : 0,
          keyStart: apiKey ? apiKey.substring(0, 10) : 'BRAK'
        }
      });
    }

    // Test połączenia z Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Spróbuj pobrać listę dostępnych modeli używając REST API
    try {
      console.log('🔍 Sprawdzam dostępne modele przez REST API...');
      
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (listResponse.ok) {
        const data = await listResponse.json();
        console.log('📋 Odpowiedź API modeli:', data);
        
        const models = data.models || [];
        const modelNames = models.map(model => model.name);
        
        console.log('📋 Dostępne modele:', modelNames);
        
        if (models.length === 0) {
          return res.status(400).json({
            error: 'Brak dostępnych modeli dla tego klucza API',
            debug: {
              keyLength: apiKey.length,
              keyStart: apiKey.substring(0, 10),
              modelsCount: 0,
              fullResponse: data
            }
          });
        }
        
        // Znajdź modele do generowania tekstu (pomijamy embedding)
        const textModels = models.filter(model => 
          model.supportedGenerationMethods?.includes('generateContent') &&
          !model.name.includes('embedding') &&
          !model.name.includes('gemma') // Pomijamy też modele Gemma na razie
        );
        
        console.log('📝 Modele do generowania tekstu:', textModels.map(m => m.name));
        
        if (textModels.length === 0) {
          return res.status(400).json({
            error: 'Brak modeli do generowania tekstu',
            availableModels: modelNames,
            debug: {
              keyLength: apiKey.length,
              keyStart: apiKey.substring(0, 10),
              totalModels: models.length,
              textModels: 0
            }
          });
        }
        
        // Spróbuj modele które mogą działać z darmowym API
        const preferredModels = [
          'gemini-1.5-flash',      // Bez prefixu models/
          'gemini-1.5-pro',        // Bez prefixu models/
          'gemini-pro',            // Stary klasyczny model
          'models/gemini-1.5-flash-8b', // Może lżejsza wersja działa
          'models/gemini-1.5-flash-8b-latest',
          'models/gemini-flash-latest',
          'models/gemini-pro-latest'
        ];
        
        let bestModel = null;
        for (const preferred of preferredModels) {
          bestModel = textModels.find(m => m.name === preferred);
          if (bestModel) break;
        }
        
        if (!bestModel) {
          bestModel = textModels[0]; // Pierwszy dostępny model do tekstu
        }
        
        console.log(`🎯 Testuję najlepszy dostępny model: ${bestModel.name}`);
        
        try {
          const model = genAI.getGenerativeModel({ model: bestModel.name });
          const result = await model.generateContent('Powiedz tylko "test"');
          const response = result.response.text();

          return res.status(200).json({
            success: true,
            message: `Klucz Gemini działa z modelem ${bestModel.displayName}!`,
            response: response,
            bestModel: {
              name: bestModel.name,
              displayName: bestModel.displayName,
              description: bestModel.description
            },
            availableTextModels: textModels.map(m => ({
              name: m.name,
              displayName: m.displayName,
              description: m.description
            })),
            debug: {
              keyLength: apiKey.length,
              keyStart: apiKey.substring(0, 10),
              model: bestModel.name
            }
          });
        } catch (testError) {
          console.log(`❌ Błąd testowania modelu ${bestModel.name}:`, testError.message);
          
          // Spróbuj wszystkie modele jeden po drugim
          console.log('🔄 Testuję wszystkie dostępne modele...');
          for (const model of textModels.slice(0, 5)) { // Testuj tylko pierwsze 5
            try {
              console.log(`🧪 Testuję: ${model.name}`);
              const testModel = genAI.getGenerativeModel({ model: model.name });
              const result = await testModel.generateContent('test');
              const response = result.response.text();
              
              console.log(`✅ SUKCES z modelem: ${model.name}`);
              return res.status(200).json({
                success: true,
                message: `Klucz Gemini działa z modelem ${model.displayName}!`,
                response: response,
                workingModel: {
                  name: model.name,
                  displayName: model.displayName,
                  description: model.description
                },
                debug: {
                  keyLength: apiKey.length,
                  keyStart: apiKey.substring(0, 10),
                  model: model.name,
                  testedModels: textModels.slice(0, 5).map(m => m.name)
                }
              });
              
            } catch (modelError) {
              console.log(`❌ ${model.name}: ${modelError.message.split('\n')[0]}`);
              continue;
            }
          }
          
          // Kontynuuj z fallback
        }
        
      } else {
        const errorText = await listResponse.text();
        console.log('❌ Błąd pobierania modeli:', listResponse.status, errorText);
      }

    } catch (listError) {
      console.log('❌ Błąd listowania modeli:', listError.message);
      // Fallback na stare podejście
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Powiedz tylko "test"');
      const response = result.response.text();

      return res.status(200).json({
        success: true,
        message: 'Klucz Gemini działa!',
        response: response,
        debug: {
          keyLength: apiKey.length,
          keyStart: apiKey.substring(0, 10),
          model: 'gemini-pro'
        }
      });

    } catch (modelError) {
      console.log('❌ Błąd modelu gemini-pro:', modelError.message);
      
      // Spróbuj alternatywne modele
      const alternativeModels = ['gemini-1.5-flash', 'models/gemini-pro'];
      
      for (const modelName of alternativeModels) {
        try {
          console.log(`🔄 Testuję model: ${modelName}`);
          const altModel = genAI.getGenerativeModel({ model: modelName });
          const result = await altModel.generateContent('Powiedz tylko "test"');
          const response = result.response.text();

          return res.status(200).json({
            success: true,
            message: `Klucz Gemini działa z modelem ${modelName}!`,
            response: response,
            debug: {
              keyLength: apiKey.length,
              keyStart: apiKey.substring(0, 10),
              model: modelName,
              fallback: true
            }
          });

        } catch (altError) {
          console.log(`❌ Błąd modelu ${modelName}:`, altError.message);
          continue;
        }
      }

      return res.status(400).json({
        error: 'Wszystkie modele Gemini niedostępne',
        debug: {
          keyLength: apiKey.length,
          keyStart: apiKey.substring(0, 10),
          originalError: modelError.message,
          testedModels: ['gemini-pro', ...alternativeModels]
        }
      });
    }

  } catch (error) {
    console.error('🚨 Błąd testowania Gemini:', error);
    
    return res.status(500).json({
      error: 'Błąd testowania API',
      debug: {
        message: error.message,
        type: error.constructor.name,
        stack: error.stack?.split('\n').slice(0, 3)
      }
    });
  }
}