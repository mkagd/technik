// simple-test.js
const http = require('http');

const testAPI = () => {
  const data = JSON.stringify({
    image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    prompt: 'Test'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test-env',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', responseData);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
};

console.log('Testing API...');
setTimeout(testAPI, 1000);