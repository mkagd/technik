/**
 * MAPOWANIE CLIENTID - NAPRAWA BŁĘDNYCH PRZYPISAŃ
 * 
 * PROBLEM: W orders.json mamy "clientId": "OLD0001"
 * ROZWIĄZANIE: Powinno być "clientId": "CLI25186001" (prawdziwe ID)
 * 
 * Ten skrypt naprawia błędne mapowanie clientId w zleceniach
 */

const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(__dirname, '../data/clients.json');
const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

// Mapa błędnych ID na prawdziwe
const CLIENT_ID_MAPPING = {
  "OLD0001": "CLI25186001", // Mariusz Bielaszka
  "OLD0002": "CLI25186002", // Kręgielnia Laguna  
  "OLD0003": "CLI25186003", // Marisz
  "OLD0004": "CLI25186004", // 123
  "OLD0005": "CLI25186005", // Mariusz
  "OLD0006": "CLI25186006", // acsasc
  "OLD0007": "CLI25186007", // ada
  "OLD0008": "CLI25186008", // qwe
  "OLD0009": "CLI25186009", // Mariusz Bielaszka
  "OLD0010": "CLI25187010", // 124
  "OLD0011": "CLI25187011", // Mariusz Bielaszka
  "OLD0012": "CLI25265012", // ad
  "OLD0013": "CLI25266013", // MAriusz Bielaszka
  "OLD0014": "CLI25266014"  // MAriusz Bielaszka
};

function fixClientIds() {
  try {
    // Wczytaj obecne zlecenia
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    
    // Wczytaj klientów dla weryfikacji
    const clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));
    
    console.log('🔧 Naprawiam clientId w zleceniach...');
    console.log(`📊 Znaleziono ${orders.length} zleceń do sprawdzenia`);
    
    let fixedCount = 0;
    let errors = [];
    
    const fixedOrders = orders.map((order, index) => {
      const oldClientId = order.clientId;
      
      // Sprawdź czy clientId wymaga naprawy
      if (CLIENT_ID_MAPPING[oldClientId]) {
        const newClientId = CLIENT_ID_MAPPING[oldClientId];
        
        // Znajdź klienta żeby pobrać nazwę
        const client = clients.find(c => c.id === newClientId);
        
        if (client) {
          const updatedOrder = {
            ...order,
            clientId: newClientId,
            clientName: client.name, // Dodaj cache nazwy klienta
            
            // Dodaj informacje o naprawie
            clientIdFixed: true,
            clientIdFixDate: new Date().toISOString(),
            oldClientId: oldClientId
          };
          
          console.log(`✅ Zlecenie ${order.id}: ${oldClientId} → ${newClientId} (${client.name})`);
          fixedCount++;
          
          return updatedOrder;
        } else {
          errors.push(`❌ Nie znaleziono klienta ${newClientId} dla zlecenia ${order.id}`);
          return order;
        }
      }
      
      // Sprawdź czy clientId już jest poprawne
      const existingClient = clients.find(c => c.id === oldClientId);
      if (existingClient) {
        console.log(`✓ Zlecenie ${order.id}: clientId już poprawne (${existingClient.name})`);
        
        // Dodaj cache nazwy klienta jeśli brak
        if (!order.clientName) {
          return {
            ...order,
            clientName: existingClient.name
          };
        }
        
        return order;
      }
      
      errors.push(`⚠️ Nieznane clientId: ${oldClientId} w zleceniu ${order.id}`);
      return order;
    });
    
    // Zapisz naprawione zlecenia
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(fixedOrders, null, 2));
    
    console.log('\n📈 PODSUMOWANIE:');
    console.log(`✅ Naprawiono clientId w ${fixedCount} zleceniach`);
    console.log(`📄 Zapisano do: ${ORDERS_FILE}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️ BŁĘDY:');
      errors.forEach(error => console.log(error));
    }
    
    // Pokaż statystyki
    console.log('\n📊 STATYSTYKI KLIENTÓW:');
    const clientStats = {};
    fixedOrders.forEach(order => {
      const clientId = order.clientId;
      const client = clients.find(c => c.id === clientId);
      const clientName = client?.name || 'Nieznany';
      
      if (!clientStats[clientId]) {
        clientStats[clientId] = {
          name: clientName,
          count: 0
        };
      }
      clientStats[clientId].count++;
    });
    
    Object.entries(clientStats)
      .sort(([,a], [,b]) => b.count - a.count)
      .forEach(([clientId, stats]) => {
        console.log(`  ${clientId}: ${stats.name} (${stats.count} zleceń)`);
      });
    
    return {
      success: true,
      fixedCount,
      totalOrders: orders.length,
      errors
    };
    
  } catch (error) {
    console.error('❌ Błąd podczas naprawy clientId:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Uruchom naprawa jeśli wywołane bezpośrednio
if (require.main === module) {
  const result = fixClientIds();
  
  if (result.success) {
    console.log('\n🎉 Naprawa clientId zakończona pomyślnie!');
    process.exit(0);
  } else {
    console.log('\n💥 Naprawa nieudana:', result.error);
    process.exit(1);
  }
}

module.exports = {
  fixClientIds,
  CLIENT_ID_MAPPING
};