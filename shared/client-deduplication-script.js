const fs = require('fs');
const path = require('path');

// Skrypt eliminacji duplikacji danych klientów w rezervacje.json
// Stworzony: 2025-09-29

class ClientDeduplicationScript {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.clients = [];
    this.visits = [];
    this.optimizedVisits = [];
  }

  // Wczytaj dane
  loadData() {
    console.log('📂 Wczytywanie danych...');
    
    try {
      // Wczytaj klientów
      const clientsPath = path.join(this.dataDir, 'clients.json');
      if (fs.existsSync(clientsPath)) {
        this.clients = JSON.parse(fs.readFileSync(clientsPath, 'utf8'));
        console.log(`👥 Wczytano ${this.clients.length} klientów`);
      }
      
      // Wczytaj wizyty
      const visitsPath = path.join(this.dataDir, 'rezervacje.json');
      if (fs.existsSync(visitsPath)) {
        this.visits = JSON.parse(fs.readFileSync(visitsPath, 'utf8'));
        console.log(`📅 Wczytano ${this.visits.length} wizyt`);
      }
    } catch (error) {
      console.error('❌ Błąd podczas wczytywania:', error.message);
      throw error;
    }
  }

  // Znajdź klienta na podstawie danych z wizyty
  findMatchingClient(visit) {
    // Najpierw szukaj po numerze telefonu (najważniejszy identyfikator)
    if (visit.phone) {
      const phoneMatch = this.clients.find(client => {
        // Sprawdź główny telefon
        if (client.phone === visit.phone) return true;
        
        // Sprawdź dodatkowe telefony
        if (client.phones && client.phones.includes(visit.phone)) return true;
        
        return false;
      });
      
      if (phoneMatch) return phoneMatch.id;
    }
    
    // Następnie szukaj po emailu
    if (visit.email) {
      const emailMatch = this.clients.find(client => client.email === visit.email);
      if (emailMatch) return emailMatch.id;
    }
    
    // Na końcu szukaj po nazwie + adresie (mniej pewne)
    if (visit.name && visit.address) {
      const nameAddressMatch = this.clients.find(client => 
        client.name === visit.name && 
        (client.address === visit.address || 
         client.addresses?.some(addr => addr.full === visit.address))
      );
      
      if (nameAddressMatch) return nameAddressMatch.id;
    }
    
    return null;
  }

  // Utwórz nowego klienta na podstawie danych z wizyty
  createClientFromVisit(visit) {
    const newClientId = `CLI${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const newClient = {
      id: newClientId,
      name: visit.name || 'Nieznany klient',
      email: visit.email || '',
      phone: visit.phone || '',
      phones: visit.phone ? [visit.phone] : [],
      
      address: visit.address || '',
      addresses: visit.address ? [{
        type: 'primary',
        street: visit.street !== 'Nie podano' ? visit.street : '',
        city: visit.city || '',
        zipCode: '',
        full: visit.address,
        isDefault: true
      }] : [],
      
      // Podstawowe pola z clients.json
      company: '',
      notes: `Utworzony automatycznie z wizyty ${visit.id}`,
      tags: ['auto-created'],
      
      // Rozszerzone pola
      extended: {
        preferredContact: visit.phone ? 'phone' : 'email',
        availability: {
          weekdays: { start: '08:00', end: '17:00' },
          weekends: { start: '09:00', end: '15:00' }
        },
        serviceHistory: [],
        preferences: {
          technician: null,
          timeSlots: [],
          notifications: true
        }
      },
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'visit-migration'
    };
    
    // Dodaj do listy klientów
    this.clients.push(newClient);
    console.log(`➕ Utworzony nowy klient: ${newClient.name} (${newClientId})`);
    
    return newClientId;
  }

  // Optymalizuj strukturę wizyt
  optimizeVisits() {
    console.log('🔄 Optymalizacja wizyt...');
    
    let newClientsCreated = 0;
    let existingClientsMatched = 0;
    
    this.optimizedVisits = this.visits.map((visit, index) => {
      let clientId = this.findMatchingClient(visit);
      
      if (!clientId) {
        // Utwórz nowego klienta
        clientId = this.createClientFromVisit(visit);
        newClientsCreated++;
      } else {
        existingClientsMatched++;
      }
      
      // Zwróć zoptymalizowaną wizytę
      const optimizedVisit = {
        id: visit.id,
        clientId: clientId, // Główna referencja
        
        // Szczegóły wizyty
        service: {
          category: visit.category || 'Inne usługi',
          device: visit.device || 'Niespecyfikowane',
          problem: visit.problem || ''
        },
        
        // Harmonogram
        scheduledDate: visit.date,
        createdAt: visit.created_at || new Date().toISOString(),
        
        // Status i tracking
        status: 'scheduled', // domyślny status dla wizyt
        
        // Zachowaj informacje o migracji
        migrationInfo: {
          originalId: visit.oldId || visit.id,
          migrationDate: visit.migrationDate,
          migrationSource: visit.migrationSource || 'visit-optimization',
          
          // Zachowaj oryginalne dane klienta dla celów auditowych
          originalClientData: {
            name: visit.name,
            phone: visit.phone,
            email: visit.email,
            address: visit.address,
            city: visit.city,
            street: visit.street
          }
        }
      };
      
      return optimizedVisit;
    });
    
    console.log(`✅ Zoptymalizowano ${this.optimizedVisits.length} wizyt`);
    console.log(`📊 Statystyki:`);
    console.log(`  - Dopasowano do istniejących klientów: ${existingClientsMatched}`);
    console.log(`  - Utworzono nowych klientów: ${newClientsCreated}`);
    
    return this.optimizedVisits;
  }

  // Stwórz backup i zapisz zoptymalizowane dane
  async saveOptimizedData() {
    console.log('💾 Zapisywanie zoptymalizowanych danych...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.dataDir, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    try {
      // Backup oryginalnych danych
      const originalVisitsPath = path.join(this.dataDir, 'rezervacje.json');
      const backupVisitsPath = path.join(backupDir, `rezervacje-pre-optimization-${timestamp}.json`);
      fs.copyFileSync(originalVisitsPath, backupVisitsPath);
      
      const originalClientsPath = path.join(this.dataDir, 'clients.json');
      const backupClientsPath = path.join(backupDir, `clients-pre-optimization-${timestamp}.json`);
      fs.copyFileSync(originalClientsPath, backupClientsPath);
      
      console.log('✅ Utworzono backupy oryginalnych danych');
      
      // Zapisz zoptymalizowane wizyty
      const optimizedVisitsPath = path.join(this.dataDir, 'optimized-visits.json');
      fs.writeFileSync(optimizedVisitsPath, JSON.stringify(this.optimizedVisits, null, 2));
      
      // Zapisz zaktualizowaną listę klientów
      const updatedClientsPath = path.join(this.dataDir, 'updated-clients.json');
      fs.writeFileSync(updatedClientsPath, JSON.stringify(this.clients, null, 2));
      
      console.log('✅ Zapisano zoptymalizowane dane:');
      console.log(`  - optimized-visits.json (${this.optimizedVisits.length} wizyt)`);
      console.log(`  - updated-clients.json (${this.clients.length} klientów)`);
      
    } catch (error) {
      console.error('❌ Błąd podczas zapisywania:', error.message);
      throw error;
    }
  }

  // Główna funkcja optymalizacji
  async optimize() {
    console.log('🚀 Rozpoczynam optymalizację danych klientów...');
    
    this.loadData();
    this.optimizeVisits();
    await this.saveOptimizedData();
    
    console.log('✅ Optymalizacja zakończona pomyślnie!');
    
    // Pokaż statystyki
    this.showStatistics();
  }

  // Wyświetl statystyki
  showStatistics() {
    console.log('\n📊 STATYSTYKI OPTYMALIZACJI:');
    console.log(`Oryginalnie wizyt: ${this.visits.length}`);
    console.log(`Zoptymalizowanych wizyt: ${this.optimizedVisits.length}`);
    console.log(`Łączna liczba klientów: ${this.clients.length}`);
    
    // Analiza źródeł klientów
    const sources = {};
    this.clients.forEach(client => {
      const source = client.source || 'original';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    console.log('\nŹródła klientów:');
    Object.entries(sources).forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });
    
    // Oszczędności przestrzeni
    const originalSize = JSON.stringify(this.visits).length;
    const optimizedSize = JSON.stringify(this.optimizedVisits).length;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`\nOszczędności przestrzeni: ${savings}% (${originalSize} → ${optimizedSize} znaków)`);
  }
}

// Uruchom jeśli wywołany bezpośrednio
if (require.main === module) {
  const script = new ClientDeduplicationScript();
  script.optimize().catch(console.error);
}

module.exports = ClientDeduplicationScript;