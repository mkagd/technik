// Test strony głównej Vercel
const fetch = require('node-fetch');

async function testVercelMainPage() {
    try {
        console.log('🧪 Testing Vercel main page...');
        
        const response = await fetch('https://technik-iqupuky5v-mariuszs-projects-34d64520.vercel.app/');
        const result = await response.text();
        
        console.log('Response status:', response.status);
        console.log('Response length:', result.length);
        
        if (response.ok) {
            console.log('✅ Main page is working on Vercel!');
            console.log('Page preview:', result.substring(0, 200) + '...');
        } else {
            console.log('❌ Main page error on Vercel');
        }
        
    } catch (error) {
        console.error('❌ Error testing Vercel main page:', error.message);
    }
}

testVercelMainPage();