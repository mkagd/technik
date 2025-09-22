// simple-test-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

// Import naszych funkcji
const { readClients, addClient } = require('./utils/clientOrderStorage');

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/test-clients' && req.method === 'GET') {
        // Test odczytu klientów
        try {
            const clients = readClients();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                clients: clients,
                count: clients.length
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
        return;
    }

    if (req.url === '/test-add-client' && req.method === 'POST') {
        // Test dodawania klienta
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const clientData = JSON.parse(body);
                console.log('📝 Otrzymane dane klienta:', clientData);

                const newClient = addClient(clientData);

                if (newClient) {
                    console.log('✅ Klient dodany:', newClient.id);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        client: newClient,
                        message: 'Klient dodany pomyślnie'
                    }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Nie udało się dodać klienta' }));
                }
            } catch (error) {
                console.error('❌ Błąd:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('   GET  /test-clients     - Lista klientów');
    console.log('   POST /test-add-client  - Dodaj klienta');
});
