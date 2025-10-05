// fix-client-ids.js
// Skrypt do poprawienia ID klientów na właściwy format

const fs = require('fs');
const path = require('path');

// Import funkcji z id-generator
const { generateClientId } = require('./utils/id-generator');

async function fixClientIds() {
  console.log('🔧 Poprawianie ID klientów...\n');

  const clientsPath = path.join(__dirname, 'data', 'clients.json');
  const rezervacjePath = path.join(__dirname, 'data', 'rezervacje.json');

  // Backup
  const backupSuffix = `-backup-fix-ids-${Date.now()}.json`;
  console.log('💾 Tworzenie backupów...');
  
  try {
    fs.copyFileSync(clientsPath, clientsPath.replace('.json', backupSuffix));
    console.log('✅ Backup: clients.json');
    fs.copyFileSync(rezervacjePath, rezervacjePath.replace('.json', backupSuffix));
    console.log('✅ Backup: rezervacje.json');
  } catch (error) {
    console.error('❌ Błąd backupu:', error);
    return;
  }

  // Wczytaj dane
  let clients = JSON.parse(fs.readFileSync(clientsPath, 'utf8'));
  let rezervacje = JSON.parse(fs.readFileSync(rezervacjePath, 'utf8'));

  console.log(`\n📝 Znaleziono ${clients.length} klientów do poprawy\n`);

  // Mapa starych ID → nowych ID
  const idMap = {};
  
  // Przygotuj tablicę dla istniejących ID (na razie pusta, bo generujemy od nowa)
  const newClientsWithIds = [];

  // Popraw ID klientów
  clients = clients.map((client, index) => {
    const oldId = client.id;
    
    // Generuj nowe ID w formacie CLIA252770001
    // CLI = prefix, A = admin-panel, 25 = rok, 277 = dzień roku, 0001 = numer
    // generateClientId(existingClients, date, source)
    const newId = generateClientId(newClientsWithIds, new Date(), 'admin-panel');
    
    idMap[oldId] = newId;
    
    // Dodaj do listy istniejących (dla kolejnych iteracji)
    newClientsWithIds.push({ id: newId });
    
    console.log(`${index + 1}. ${client.name}`);
    console.log(`   Stare ID: ${oldId}`);
    console.log(`   Nowe ID:  ${newId}`);
    console.log('');
    
    return {
      ...client,
      id: newId
    };
  });

  // Zaktualizuj clientId w rezerwacjach
  console.log('🔗 Aktualizacja ID w rezerwacjach...\n');
  
  rezervacje = rezervacje.map(rez => {
    const oldClientId = rez.clientId;
    const newClientId = idMap[oldClientId];
    
    if (newClientId) {
      console.log(`   REZ ${rez.id}: ${oldClientId} → ${newClientId}`);
      return {
        ...rez,
        clientId: newClientId
      };
    }
    
    return rez;
  });

  // Zapisz poprawione dane
  try {
    fs.writeFileSync(clientsPath, JSON.stringify(clients, null, 2), 'utf8');
    console.log('\n✅ Zapisano poprawione ID klientów');
    
    fs.writeFileSync(rezervacjePath, JSON.stringify(rezervacje, null, 2), 'utf8');
    console.log('✅ Zapisano zaktualizowane rezerwacje');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUKCES! ID zostały poprawione\n');
    
    console.log('📋 MAPA ZMIAN ID:');
    console.log('='.repeat(60));
    
    Object.entries(idMap).forEach(([oldId, newId], index) => {
      const client = clients.find(c => c.id === newId);
      console.log(`${index + 1}. ${client.name}`);
      console.log(`   ${oldId}`);
      console.log(`   → ${newId}`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('\n💡 Format nowych ID: CLIA252770001');
    console.log('   CLI = Client');
    console.log('   A   = Admin-panel (źródło)');
    console.log('   25  = Rok 2025');
    console.log('   277 = Dzień roku (dzisiaj)');
    console.log('   0001 = Numer sekwencyjny\n');
    
  } catch (error) {
    console.error('❌ Błąd zapisu:', error);
  }
}

// Uruchom
fixClientIds().catch(console.error);
