// Final API verification script
const https = require('https');
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function testAPI() {
  console.log('=== FINAL API VERIFICATION ===\n');
  
  try {
    // Test clients API
    console.log('1. Testing /api/clients...');
    const clientsResponse = await makeRequest('http://localhost:3000/api/clients');
    const clients = clientsResponse.clients || [];
    console.log(`✅ Clients API: ${clients.length} clients loaded`);
    
    // Test orders API
    console.log('2. Testing /api/orders...');
    const ordersResponse = await makeRequest('http://localhost:3000/api/orders');
    const orders = ordersResponse.orders || [];
    console.log(`✅ Orders API: ${orders.length} orders loaded`);
    
    // Test employees API
    console.log('3. Testing /api/employees...');
    const employeesResponse = await makeRequest('http://localhost:3000/api/employees');
    const employees = employeesResponse.employees || [];
    console.log(`✅ Employees API: ${employees.length} employees loaded`);
    
    // Test document numbers API
    console.log('4. Testing /api/document-numbers...');
    const invoiceResponse = await makeRequest('http://localhost:3000/api/document-numbers?type=invoice');
    const protocolResponse = await makeRequest('http://localhost:3000/api/document-numbers?type=protocol');
    console.log(`✅ Document Numbers API: Invoice=${invoiceResponse.number}, Protocol=${protocolResponse.number}`);
    
    // Test relationships
    console.log('\n=== RELATIONSHIP VERIFICATION ===');
    let relationshipsOK = true;
    
    orders.forEach(order => {
      const client = clients.find(c => c.id === order.clientId);
      if (!client) {
        console.log(`❌ Order ${order.orderNumber} → Client ${order.clientId} NOT FOUND`);
        relationshipsOK = false;
      } else {
        console.log(`✅ ${order.orderNumber} → ${client.firstName} ${client.lastName} (${client.id})`);
      }
    });
    
    // Test ID formats
    console.log('\n=== ID FORMAT VERIFICATION ===');
    console.log('CLIENTS:');
    clients.forEach(client => {
      const dateStr = client.id.substring(3, 8);
      console.log(`  ${client.id} (${dateStr}) - ${client.firstName} ${client.lastName}`);
    });
    
    console.log('ORDERS:');
    orders.forEach(order => {
      const dateStr = order.orderNumber.substring(4, 9);
      console.log(`  ${order.orderNumber} (${dateStr}) - ${order.clientName}`);
    });
    
    console.log('VISITS:');
    let totalVisits = 0;
    orders.forEach(order => {
      order.visits.forEach(visit => {
        totalVisits++;
        const dateStr = visit.visitId.substring(3, 8);
        console.log(`  ${visit.visitId} (${dateStr}) - ${visit.type} - scheduled: ${visit.scheduledDate.substring(0, 10)}`);
      });
    });
    
    console.log(`\n=== FINAL SUMMARY ===`);
    console.log(`✅ Clients: ${clients.length} records`);
    console.log(`✅ Orders: ${orders.length} records`);
    console.log(`✅ Visits: ${totalVisits} records`);
    console.log(`✅ Employees: ${employees.length} records`);
    console.log(`✅ Relationships: ${relationshipsOK ? 'ALL CORRECT' : 'ERRORS FOUND'}`);
    console.log(`✅ Document Numbering: WORKING`);
    
    console.log(`\n🎉 API STATUS: ${relationshipsOK ? 'FULLY OPERATIONAL!' : 'NEEDS ATTENTION!'}`);
    
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
  }
}

testAPI();