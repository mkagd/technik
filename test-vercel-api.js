// Test API na Vercel
const fetch = require('node-fetch');

async function testVercelAPI() {
    try {
        console.log('🧪 Testing Vercel API endpoint...');
        
        const response = await fetch('https://technik-iqupuky5v-mariuszs-projects-34d64520.vercel.app/api/test-env');
        const result = await response.text();
        
        console.log('Response status:', response.status);
        console.log('Response body:', result);
        
        if (response.ok) {
            console.log('✅ API endpoint is working on Vercel!');
        } else {
            console.log('❌ API endpoint error on Vercel');
        }
        
    } catch (error) {
        console.error('❌ Error testing Vercel API:', error.message);
    }
}

testVercelAPI();