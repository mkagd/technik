// test-openai-api.js - Test połączenia z OpenAI API

const testOpenAI = async () => {
  try {
    console.log('🔧 Testowanie OpenAI API...');
    
    // Przykładowy mały obraz w base64 (1x1 pixel PNG)
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const response = await fetch('http://localhost:3000/api/openai-vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: testImage,
        prompt: 'Test analizy obrazu'
      })
    });

    console.log('📊 Response status:', response.status);
    
    const result = await response.json();
    console.log('📊 Response:', result);
    
    if (result.success) {
      console.log('✅ OpenAI API działa poprawnie!');
    } else {
      console.log('❌ Problem z OpenAI API:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Błąd testu:', error);
  }
};

testOpenAI();