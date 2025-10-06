// Quick test of Allegro Production API
const https = require('https');
const fs = require('fs');

// Load config
const config = JSON.parse(fs.readFileSync('data/allegro-config.json', 'utf8'));
const tokenData = JSON.parse(fs.readFileSync('data/allegro-token.json', 'utf8'));

console.log('🧪 Testing Allegro Production API\n');
console.log('Client ID:', config.clientId);
console.log('Sandbox:', config.sandbox);
console.log('Token expires:', tokenData.expiresAt);
console.log('Token (first 20 chars):', tokenData.accessToken.substring(0, 20) + '...\n');

// Test 1: Categories (should work)
console.log('📂 Test 1: Getting categories...');
const categoriesOptions = {
  hostname: 'api.allegro.pl',
  path: '/sale/categories',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${tokenData.accessToken}`,
    'Accept': 'application/vnd.allegro.public.v1+json'
  }
};

const req1 = https.request(categoriesOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      const json = JSON.parse(data);
      console.log(`✅ Categories loaded: ${json.categories?.length || 0} categories\n`);
      
      // Test 2: Search listings
      console.log('🔍 Test 2: Searching listings...');
      const searchOptions = {
        hostname: 'api.allegro.pl',
        path: '/offers/listing?phrase=pompa&limit=5',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.accessToken}`,
          'Accept': 'application/vnd.allegro.public.v1+json'
        }
      };
      
      const req2 = https.request(searchOptions, (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          console.log(`Status: ${res2.statusCode}`);
          if (res2.statusCode === 200) {
            const json2 = JSON.parse(data2);
            console.log(`✅ Search SUCCESS!`);
            console.log(`✅ Results: ${json2.items?.promoted?.length + json2.items?.regular?.length || 0}`);
            if (json2.items?.regular?.[0]) {
              console.log(`\nFirst result: ${json2.items.regular[0].name}`);
            }
          } else {
            console.log(`❌ Search FAILED`);
            console.log('Response:', data2);
          }
        });
      });
      
      req2.on('error', (e) => {
        console.error('❌ Request error:', e.message);
      });
      
      req2.end();
      
    } else {
      console.log('❌ Failed to load categories');
      console.log('Response:', data);
    }
  });
});

req1.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req1.end();
