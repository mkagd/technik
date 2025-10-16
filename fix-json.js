const fs = require('fs');
const order = {
  id: 1760255816583,
  orderNumber: 'ORDZ252850001',
  source: 'reservation_conversion',
  clientId: 'CLIS252780014',
  clientName: 'Klient #811875',
  clientPhone: '123123123',
  status: 'contacted',
  city: 'Tarnów',
  street: 'krakowska',
  deviceType: 'Pralki',
  createdAt: '2025-10-12T07:56:56.583Z'
};
fs.writeFileSync('./data/orders.json', JSON.stringify([order], null, 2), 'utf8');
console.log(' Zapisano poprawny JSON');
