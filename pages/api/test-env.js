// pages/api/test-env.js
// API endpoint do testowania zmiennych środowiskowych

export default function handler(req, res) {
  console.log('🔧 Test zmiennych środowiskowych');
  
  const openAiKey = process.env.OPENAI_API_KEY;
  
  console.log('🔑 OPENAI_API_KEY check:', openAiKey ? 'FOUND' : 'NOT FOUND');
  console.log('🔑 Key length:', openAiKey ? openAiKey.length : 0);
  console.log('🔑 Key starts with:', openAiKey ? openAiKey.substring(0, 10) + '...' : 'N/A');
  console.log('🔑 Key ends with:', openAiKey ? '...' + openAiKey.substring(openAiKey.length - 10) : 'N/A');
  
  // Lista wszystkich zmiennych środowiskowych Next.js
  const nextEnvVars = Object.keys(process.env).filter(key => 
    key.startsWith('NEXT_') || 
    key.startsWith('OPENAI_') || 
    key.startsWith('GOOGLE_') ||
    key.startsWith('OCR_')
  );
  
  console.log('📋 Dostępne zmienne env:', nextEnvVars);
  
  res.status(200).json({
    success: true,
    openAiKeyPresent: !!openAiKey,
    openAiKeyLength: openAiKey ? openAiKey.length : 0,
    openAiKeyPreview: openAiKey ? openAiKey.substring(0, 10) + '...' + openAiKey.substring(openAiKey.length - 10) : null,
    availableEnvVars: nextEnvVars,
    nodeEnv: process.env.NODE_ENV
  });
}