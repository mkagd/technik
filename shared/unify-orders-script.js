const fs = require('fs');
const path = require('path');

// Skrypt konwersji danych do ujednoliconej struktury zamówień
// Stworzony: 2025-09-29

class OrderUnificationScript {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.backupDir = path.join(__dirname, '..', 'data', 'backups');
    this.unifiedOrders = [];
  }

  // Stwórz backup istniejących danych
  async createBackups() {
    console.log('🔄 Tworzenie kopii zapasowych...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Backup orders.json
    if (fs.existsSync(path.join(this.dataDir, 'orders.json'))) {
      fs.copyFileSync(
        path.join(this.dataDir, 'orders.json'),
        path.join(this.backupDir, `orders-backup-${timestamp}.json`)
      );
      console.log('✅ Backup orders.json utworzony');
    }

    // Backup service-orders.json
    if (fs.existsSync(path.join(this.dataDir, 'service-orders.json'))) {
      fs.copyFileSync(
        path.join(this.dataDir, 'service-orders.json'),
        path.join(this.backupDir, `service-orders-backup-${timestamp}.json`)
      );
      console.log('✅ Backup service-orders.json utworzony');
    }
  }

  // Wczytaj istniejące dane
  loadExistingData() {
    console.log('📂 Wczytywanie istniejących danych...');
    
    let orders = [];
    let serviceOrders = [];
    
    try {
      if (fs.existsSync(path.join(this.dataDir, 'orders.json'))) {
        orders = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'orders.json'), 'utf8'));
        console.log(`📋 Wczytano ${orders.length} zamówień z orders.json`);
      }
      
      if (fs.existsSync(path.join(this.dataDir, 'service-orders.json'))) {
        serviceOrders = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'service-orders.json'), 'utf8'));
        console.log(`📋 Wczytano ${serviceOrders.length} zamówień z service-orders.json`);
      }
    } catch (error) {
      console.error('❌ Błąd podczas wczytywania danych:', error.message);
      return { orders: [], serviceOrders: [] };
    }

    return { orders, serviceOrders };
  }

  // Konwertuj orders.json do nowej struktury
  convertLegacyOrders(orders) {
    console.log('🔄 Konwersja orders.json...');
    
    return orders.map((order, index) => {
      const id = `ORD${Date.now()}${String(index).padStart(3, '0')}`;
      
      return {
        id,
        status: order.status === 'pending' ? 'new' : order.status,
        clientId: order.clientId,
        
        service: {
          category: order.category || 'Inne usługi',
          type: order.serviceType || 'Niespecyfikowane',
          description: order.description || '',
          priority: order.priority || 'normal',
          urgency: order.priority === 'high' ? 'pilny' : 'normalny'
        },
        
        devices: order.devices ? order.devices.map(device => ({
          name: device.name || 'Nieznane urządzenie',
          brand: device.brand || '',
          model: device.model || '',
          description: device.description || '',
          characteristics: {
            type: device.builtInParams?.wolnostojacy ? 'freestanding' : 'built-in',
            access: device.builtInParams?.ograniczony ? 'restricted' : 'easy',
            requiresDisassembly: device.builtInParams?.demontaz || false,
            requiresAssembly: device.builtInParams?.montaz || false
          }
        })) : [],
        
        address: {
          street: order.address?.street || '',
          city: order.address?.city || '',
          zipCode: order.address?.zipCode || '',
          notes: order.address?.notes || ''
        },
        
        scheduling: {
          preferredTime: order.preferredTime || '',
          preferredDate: null,
          scheduledDate: order.scheduledDate || null,
          assignedEmployeeId: order.employeeId || null,
          estimatedDuration: 120,
          actualDuration: null
        },
        
        pricing: {
          estimatedCost: order.estimatedCost || null,
          finalCost: order.finalCost || null,
          travelCost: order.travelCost || 50,
          partsUsed: [],
          laborHours: 0
        },
        
        timeline: {
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          statusHistory: [{
            status: order.status === 'pending' ? 'new' : order.status,
            timestamp: order.createdAt || new Date().toISOString(),
            employeeId: null,
            notes: 'Zamówienie zmigrowane z orders.json'
          }]
        },
        
        notes: {
          internal: order.internalNotes || '',
          customer: order.customerNotes || '',
          technical: order.technicalNotes || ''
        },
        
        // Zachowaj informacje o migracji jeśli są potrzebne
        ...(order.migrated && {
          migrationInfo: {
            source: 'orders.json',
            originalId: order.id,
            migrated: order.migrated,
            clientIdFixed: order.clientIdFixed,
            idUpdated: order.idUpdated
          }
        })
      };
    });
  }

  // Konwertuj service-orders.json do nowej struktury
  convertServiceOrders(serviceOrders) {
    console.log('🔄 Konwersja service-orders.json...');
    
    return serviceOrders.map(order => {
      // Użyj istniejące ID jeśli jest w dobrym formacie
      const id = order.id && order.id.startsWith('SRV') ? order.id : `SRV${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      return {
        id,
        status: order.status || 'new',
        clientId: this.findOrCreateClientId(order.customer), // Funkcja do znalezienia/utworzenia clientId
        
        service: {
          category: this.mapDeviceToCategory(order.service?.device),
          type: order.service?.device || 'Niespecyfikowane',
          description: order.service?.description || '',
          priority: order.service?.urgency === 'pilny' ? 'high' : 'normal',
          urgency: order.service?.urgency || 'normalny'
        },
        
        devices: [{
          name: `${order.service?.brand || ''} ${order.service?.device || 'Urządzenie'}`.trim(),
          brand: order.service?.brand || '',
          model: order.service?.model || '',
          description: order.service?.description || '',
          characteristics: {
            type: 'unknown',
            access: 'easy',
            requiresDisassembly: false,
            requiresAssembly: false
          }
        }],
        
        address: {
          street: order.address?.street || '',
          city: order.address?.city || '',
          zipCode: '',
          notes: ''
        },
        
        scheduling: {
          preferredTime: order.scheduling?.preferredTime || '',
          preferredDate: null,
          scheduledDate: order.scheduling?.scheduledDate,
          assignedEmployeeId: order.scheduling?.assignedTechnician,
          estimatedDuration: 120,
          actualDuration: null
        },
        
        pricing: {
          estimatedCost: order.pricing?.estimated,
          finalCost: order.pricing?.final,
          travelCost: order.pricing?.travelCost || 50,
          partsUsed: [],
          laborHours: 0
        },
        
        timeline: {
          createdAt: order.migrationDate || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          statusHistory: [{
            status: order.status || 'new',
            timestamp: order.migrationDate || new Date().toISOString(),
            employeeId: null,
            notes: 'Zamówienie zmigrowane z service-orders.json'
          }]
        },
        
        notes: {
          internal: '',
          customer: '',
          technical: ''
        },
        
        // Zachowaj informacje o migracji
        migrationInfo: {
          source: 'service-orders.json',
          originalId: order.oldId || order.id,
          migrationDate: order.migrationDate,
          migrationSource: order.migrationSource
        }
      };
    });
  }

  // Mapowanie urządzeń na kategorie
  mapDeviceToCategory(device) {
    const deviceMap = {
      'piekarnik': 'Naprawa piekarników',
      'lodówka': 'Naprawa lodówek',
      'pralka': 'Naprawa pralek',
      'zmywarka': 'Naprawa zmywarek',
      'laptop': 'Naprawa laptopów',
      'komputer': 'Naprawa komputerów'
    };
    
    return deviceMap[device?.toLowerCase()] || 'Inne usługi';
  }

  // Znajdź lub utwórz clientId (placeholder - wymaga implementacji)
  findOrCreateClientId(customer) {
    // TODO: Implementować logikę dopasowania do clients.json
    // Na razie zwróć placeholder
    return `CLI_TEMP_${Math.floor(Math.random() * 100000)}`;
  }

  // Połącz i zapisz ujednolicone zamówienia
  async unifyAndSave() {
    console.log('🚀 Rozpoczynam ujednolicenie zamówień...');
    
    // Stwórz backupy
    await this.createBackups();
    
    // Wczytaj dane
    const { orders, serviceOrders } = this.loadExistingData();
    
    // Konwertuj dane
    const convertedOrders = this.convertLegacyOrders(orders);
    const convertedServiceOrders = this.convertServiceOrders(serviceOrders);
    
    // Połącz wszystkie zamówienia
    this.unifiedOrders = [...convertedOrders, ...convertedServiceOrders];
    
    console.log(`🎯 Ujednolicono łącznie ${this.unifiedOrders.length} zamówień`);
    
    // Zapisz ujednolicone zamówienia
    const unifiedPath = path.join(this.dataDir, 'unified-orders.json');
    fs.writeFileSync(unifiedPath, JSON.stringify(this.unifiedOrders, null, 2));
    
    console.log('✅ Ujednolicone zamówienia zapisane w unified-orders.json');
    
    // Wyświetl statystyki
    this.showStatistics();
    
    return this.unifiedOrders;
  }

  // Wyświetl statystyki konwersji
  showStatistics() {
    console.log('\n📊 STATYSTYKI KONWERSJI:');
    console.log(`Łączna liczba zamówień: ${this.unifiedOrders.length}`);
    
    const statusCounts = {};
    const categoryCounts = {};
    
    this.unifiedOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      categoryCounts[order.service.category] = (categoryCounts[order.service.category] || 0) + 1;
    });
    
    console.log('\nStatusy zamówień:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\nKategorie usług:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
  }
}

// Uruchom jeśli wywołany bezpośrednio
if (require.main === module) {
  const script = new OrderUnificationScript();
  script.unifyAndSave().catch(console.error);
}

module.exports = OrderUnificationScript;