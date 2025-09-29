const fs = require('fs');
const path = require('path');

// Skrypt standaryzacji statusów zamówień i dodania systemu śledzenia
// Stworzony: 2025-09-29

class StatusStandardizationScript {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.orders = [];
    this.visits = [];
    this.standardizationStats = {
      ordersProcessed: 0,
      visitsProcessed: 0,
      statusChanges: 0,
      timelineEntriesAdded: 0
    };
  }

  // Definicje statusów i ich mapowanie
  getStatusDefinitions() {
    return {
      // Zamówienia (Orders)
      orders: {
        'new': {
          label: 'Nowe',
          description: 'Nowo utworzone zamówienie, oczekuje na weryfikację',
          nextStates: ['assigned', 'cancelled'],
          priority: 1
        },
        'assigned': {
          label: 'Przypisane',
          description: 'Zamówienie przypisane do technika',
          nextStates: ['in-progress', 'on-hold', 'cancelled'],
          priority: 2
        },
        'in-progress': {
          label: 'W realizacji',
          description: 'Zamówienie jest obecnie realizowane',
          nextStates: ['completed', 'on-hold', 'cancelled'],
          priority: 3
        },
        'on-hold': {
          label: 'Wstrzymane',
          description: 'Zamówienie tymczasowo wstrzymane',
          nextStates: ['assigned', 'in-progress', 'cancelled'],
          priority: 2
        },
        'completed': {
          label: 'Ukończone',
          description: 'Zamówienie zostało ukończone',
          nextStates: [],
          priority: 5,
          final: true
        },
        'cancelled': {
          label: 'Anulowane',
          description: 'Zamówienie zostało anulowane',
          nextStates: [],
          priority: 0,
          final: true
        }
      },
      
      // Wizyty (Visits)
      visits: {
        'scheduled': {
          label: 'Zaplanowane',
          description: 'Wizyta została zaplanowana',
          nextStates: ['confirmed', 'rescheduled', 'cancelled'],
          priority: 1
        },
        'confirmed': {
          label: 'Potwierdzone',
          description: 'Wizyta potwierdzona przez klienta',
          nextStates: ['in-progress', 'rescheduled', 'cancelled'],
          priority: 2
        },
        'in-progress': {
          label: 'W trakcie',
          description: 'Wizyta trwa',
          nextStates: ['completed', 'postponed'],
          priority: 3
        },
        'completed': {
          label: 'Ukończone',
          description: 'Wizyta została ukończona',
          nextStates: [],
          priority: 5,
          final: true
        },
        'rescheduled': {
          label: 'Przełożone',
          description: 'Wizyta została przełożona',
          nextStates: ['scheduled', 'cancelled'],
          priority: 1
        },
        'postponed': {
          label: 'Odroczone',
          description: 'Wizyta została odroczona w trakcie realizacji',
          nextStates: ['scheduled', 'cancelled'],
          priority: 1
        },
        'cancelled': {
          label: 'Anulowane',
          description: 'Wizyta została anulowana',
          nextStates: [],
          priority: 0,
          final: true
        }
      }
    };
  }

  // Mapowanie starych statusów na nowe
  getStatusMapping() {
    return {
      // Mapowanie dla zamówień
      orders: {
        'pending': 'new',
        'new': 'new',
        'assigned': 'assigned',
        'in-progress': 'in-progress',
        'in_progress': 'in-progress',
        'on-hold': 'on-hold',
        'on_hold': 'on-hold',
        'hold': 'on-hold',
        'completed': 'completed',
        'done': 'completed',
        'finished': 'completed',
        'cancelled': 'cancelled',
        'canceled': 'cancelled'
      },
      
      // Mapowanie dla wizyt
      visits: {
        'scheduled': 'scheduled',
        'planned': 'scheduled',
        'confirmed': 'confirmed',
        'in-progress': 'in-progress',
        'in_progress': 'in-progress',
        'active': 'in-progress',
        'completed': 'completed',
        'done': 'completed',
        'finished': 'completed',
        'rescheduled': 'rescheduled',
        'postponed': 'postponed',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',
        // Mapowanie z zamówień które trafiły do wizyt
        'pending': 'scheduled',
        'new': 'scheduled'
      }
    };
  }

  // Wczytaj dane
  loadData() {
    console.log('📂 Wczytywanie danych...');
    
    try {
      // Wczytaj zamówienia (najnowsza wersja)
      const ordersPath = path.join(this.dataDir, 'improved-orders.json');
      if (fs.existsSync(ordersPath)) {
        this.orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      }
      console.log(`📋 Wczytano ${this.orders.length} zamówień`);
      
      // Wczytaj wizyty (najnowsza wersja)
      const visitsPath = path.join(this.dataDir, 'improved-visits.json');
      if (fs.existsSync(visitsPath)) {
        this.visits = JSON.parse(fs.readFileSync(visitsPath, 'utf8'));
      }
      console.log(`📅 Wczytano ${this.visits.length} wizyt`);
      
    } catch (error) {
      console.error('❌ Błąd podczas wczytywania danych:', error.message);
      throw error;
    }
  }

  // Określ inteligentny status na podstawie danych
  determineIntelligentStatus(item, type = 'orders') {
    const mapping = this.getStatusMapping()[type];
    const currentStatus = item.status?.toLowerCase();
    
    // Sprawdź czy już ma poprawny status
    if (mapping[currentStatus]) {
      return mapping[currentStatus];
    }
    
    // Logika inteligentnego określania statusu
    const now = new Date();
    const assignedEmployee = type === 'orders' ? item.scheduling?.assignedEmployeeId : item.assignedEmployeeId;
    const scheduledDate = type === 'orders' ? item.scheduling?.scheduledDate : item.scheduledDate;
    
    // Jeśli ma przypisanego pracownika
    if (assignedEmployee) {
      // Jeśli data jest w przyszłości
      if (scheduledDate && new Date(scheduledDate) > now) {
        return type === 'orders' ? 'assigned' : 'confirmed';
      }
      
      // Jeśli data jest dzisiaj lub w przeszłości
      if (scheduledDate && new Date(scheduledDate) <= now) {
        // Sprawdź czy nie jest za stare (prawdopodobnie ukończone)
        const daysDiff = (now - new Date(scheduledDate)) / (1000 * 60 * 60 * 24);
        if (daysDiff > 7) {
          return 'completed';
        }
        return 'in-progress';
      }
      
      return type === 'orders' ? 'assigned' : 'confirmed';
    }
    
    // Jeśli nie ma przypisanego pracownika
    return type === 'orders' ? 'new' : 'scheduled';
  }

  // Standaryzuj statusy zamówień
  standardizeOrderStatuses() {
    console.log('🔄 Standaryzacja statusów zamówień...');
    
    const statusDefinitions = this.getStatusDefinitions().orders;
    let changed = 0;
    
    this.orders = this.orders.map(order => {
      const oldStatus = order.status;
      const newStatus = this.determineIntelligentStatus(order, 'orders');
      
      if (oldStatus !== newStatus) {
        changed++;
        this.standardizationStats.statusChanges++;
        
        console.log(`  📝 ${order.id}: ${oldStatus} → ${newStatus}`);
      }
      
      // Aktualizuj zamówienie
      const updatedOrder = {
        ...order,
        status: newStatus,
        statusInfo: {
          current: newStatus,
          label: statusDefinitions[newStatus]?.label || newStatus,
          description: statusDefinitions[newStatus]?.description || '',
          priority: statusDefinitions[newStatus]?.priority || 0,
          isFinal: statusDefinitions[newStatus]?.final || false,
          possibleTransitions: statusDefinitions[newStatus]?.nextStates || []
        }
      };
      
      // Dodaj/aktualizuj timeline
      if (!updatedOrder.timeline) {
        updatedOrder.timeline = {
          createdAt: order.timeline?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
          statusHistory: []
        };
      }
      
      // Dodaj wpis do historii statusów
      const lastHistoryEntry = updatedOrder.timeline.statusHistory?.slice(-1)[0];
      if (!lastHistoryEntry || lastHistoryEntry.status !== newStatus) {
        updatedOrder.timeline.statusHistory = updatedOrder.timeline.statusHistory || [];
        updatedOrder.timeline.statusHistory.push({
          status: newStatus,
          timestamp: new Date().toISOString(),
          employeeId: order.scheduling?.assignedEmployeeId || null,
          notes: oldStatus !== newStatus ? `Status zmieniony z '${oldStatus}' na '${newStatus}' (automatyczna standaryzacja)` : 'Status standaryzowany',
          source: 'status-standardization'
        });
        
        this.standardizationStats.timelineEntriesAdded++;
      }
      
      // Aktualizuj znacznik czasu
      updatedOrder.timeline.updatedAt = new Date().toISOString();
      
      // Dodaj completedAt jeśli status to completed
      if (newStatus === 'completed' && !updatedOrder.timeline.completedAt) {
        updatedOrder.timeline.completedAt = new Date().toISOString();
      }
      
      this.standardizationStats.ordersProcessed++;
      return updatedOrder;
    });
    
    console.log(`📊 Zmieniono statusy w ${changed} zamówieniach`);
  }

  // Standaryzuj statusy wizyt
  standardizeVisitStatuses() {
    console.log('🔄 Standaryzacja statusów wizyt...');
    
    const statusDefinitions = this.getStatusDefinitions().visits;
    let changed = 0;
    
    this.visits = this.visits.map(visit => {
      const oldStatus = visit.status;
      const newStatus = this.determineIntelligentStatus(visit, 'visits');
      
      if (oldStatus !== newStatus) {
        changed++;
        this.standardizationStats.statusChanges++;
        
        console.log(`  📝 ${visit.id}: ${oldStatus} → ${newStatus}`);
      }
      
      // Aktualizuj wizytę
      const updatedVisit = {
        ...visit,
        status: newStatus,
        statusInfo: {
          current: newStatus,
          label: statusDefinitions[newStatus]?.label || newStatus,
          description: statusDefinitions[newStatus]?.description || '',
          priority: statusDefinitions[newStatus]?.priority || 0,
          isFinal: statusDefinitions[newStatus]?.final || false,
          possibleTransitions: statusDefinitions[newStatus]?.nextStates || []
        }
      };
      
      // Dodaj tracking jeśli nie istnieje
      if (!updatedVisit.tracking) {
        updatedVisit.tracking = {
          createdAt: visit.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: []
        };
      }
      
      // Dodaj wpis do historii statusów
      const lastHistoryEntry = updatedVisit.tracking.statusHistory?.slice(-1)[0];
      if (!lastHistoryEntry || lastHistoryEntry.status !== newStatus) {
        updatedVisit.tracking.statusHistory = updatedVisit.tracking.statusHistory || [];
        updatedVisit.tracking.statusHistory.push({
          status: newStatus,
          timestamp: new Date().toISOString(),
          employeeId: visit.assignedEmployeeId || null,
          notes: oldStatus !== newStatus ? `Status zmieniony z '${oldStatus}' na '${newStatus}' (automatyczna standaryzacja)` : 'Status standaryzowany',
          source: 'status-standardization'
        });
        
        this.standardizationStats.timelineEntriesAdded++;
      }
      
      // Aktualizuj znacznik czasu
      updatedVisit.tracking.updatedAt = new Date().toISOString();
      
      // Dodaj completedAt jeśli status to completed
      if (newStatus === 'completed' && !updatedVisit.tracking.completedAt) {
        updatedVisit.tracking.completedAt = new Date().toISOString();
      }
      
      this.standardizationStats.visitsProcessed++;
      return updatedVisit;
    });
    
    console.log(`📊 Zmieniono statusy w ${changed} wizytach`);
  }

  // Zapisz standaryzowane dane
  async saveStandardizedData() {
    console.log('💾 Zapisywanie standaryzowanych danych...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.dataDir, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    try {
      // Zapisz standaryzowane zamówienia
      const standardizedOrdersPath = path.join(this.dataDir, 'standardized-orders.json');
      fs.writeFileSync(standardizedOrdersPath, JSON.stringify(this.orders, null, 2));
      
      // Zapisz standaryzowane wizyty
      const standardizedVisitsPath = path.join(this.dataDir, 'standardized-visits.json');
      fs.writeFileSync(standardizedVisitsPath, JSON.stringify(this.visits, null, 2));
      
      // Zapisz definicje statusów dla przyszłego użytku
      const statusDefinitionsPath = path.join(this.dataDir, 'status-definitions.json');
      fs.writeFileSync(statusDefinitionsPath, JSON.stringify(this.getStatusDefinitions(), null, 2));
      
      console.log('✅ Zapisano standaryzowane dane:');
      console.log(`  - standardized-orders.json (${this.orders.length} zamówień)`);
      console.log(`  - standardized-visits.json (${this.visits.length} wizyt)`);
      console.log(`  - status-definitions.json (definicje statusów)`);
      
    } catch (error) {
      console.error('❌ Błąd podczas zapisywania:', error.message);
      throw error;
    }
  }

  // Główna funkcja standaryzacji
  async standardizeStatuses() {
    console.log('🚀 Rozpoczynam standaryzację statusów...');
    
    this.loadData();
    this.standardizeOrderStatuses();
    this.standardizeVisitStatuses();
    await this.saveStandardizedData();
    
    this.showStandardizationStatistics();
    
    console.log('✅ Standaryzacja statusów zakończona!');
  }

  // Wyświetl statystyki standaryzacji
  showStandardizationStatistics() {
    console.log('\n📊 STATYSTYKI STANDARYZACJI:');
    console.log(`Zamówienia przetworzone: ${this.standardizationStats.ordersProcessed}`);
    console.log(`Wizyty przetworzone: ${this.standardizationStats.visitsProcessed}`);
    console.log(`Łączna liczba zmian statusów: ${this.standardizationStats.statusChanges}`);
    console.log(`Dodanych wpisów do timeline: ${this.standardizationStats.timelineEntriesAdded}`);
    
    // Analiza statusów
    const orderStatusCounts = {};
    const visitStatusCounts = {};
    
    this.orders.forEach(order => {
      orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1;
    });
    
    this.visits.forEach(visit => {
      visitStatusCounts[visit.status] = (visitStatusCounts[visit.status] || 0) + 1;
    });
    
    console.log('\nRozkład statusów zamówień:');
    Object.entries(orderStatusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\nRozkład statusów wizyt:');
    Object.entries(visitStatusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  }
}

// Uruchom jeśli wywołany bezpośrednio
if (require.main === module) {
  const script = new StatusStandardizationScript();
  script.standardizeStatuses().catch(console.error);
}

module.exports = StatusStandardizationScript;