const fs = require('fs');
const path = require('path');

// Skrypt poprawy relacji między danymi - dodanie brakujących employeeId
// Stworzony: 2025-09-29

class DataRelationshipScript {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.employees = [];
    this.orders = [];
    this.visits = [];
    this.relationshipStats = {
      ordersWithEmployees: 0,
      visitsWithEmployees: 0,
      employeesAssigned: 0,
      relationshipsCreated: 0
    };
  }

  // Wczytaj wszystkie dane
  loadData() {
    console.log('📂 Wczytywanie danych...');
    
    try {
      // Wczytaj pracowników
      const employeesPath = path.join(this.dataDir, 'cleaned-employees.json');
      if (fs.existsSync(employeesPath)) {
        this.employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));
      } else if (fs.existsSync(path.join(this.dataDir, 'employees.json'))) {
        this.employees = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'employees.json'), 'utf8'));
      }
      console.log(`👥 Wczytano ${this.employees.length} pracowników`);
      
      // Wczytaj zamówienia (ujednolicone)
      const ordersPath = path.join(this.dataDir, 'cleaned-unified-orders.json');
      if (fs.existsSync(ordersPath)) {
        this.orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      } else if (fs.existsSync(path.join(this.dataDir, 'unified-orders.json'))) {
        this.orders = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'unified-orders.json'), 'utf8'));
      }
      console.log(`📋 Wczytano ${this.orders.length} zamówień`);
      
      // Wczytaj wizyty (zoptymalizowane)
      const visitsPath = path.join(this.dataDir, 'cleaned-optimized-visits.json');
      if (fs.existsSync(visitsPath)) {
        this.visits = JSON.parse(fs.readFileSync(visitsPath, 'utf8'));
      } else if (fs.existsSync(path.join(this.dataDir, 'optimized-visits.json'))) {
        this.visits = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'optimized-visits.json'), 'utf8'));
      }
      console.log(`📅 Wczytano ${this.visits.length} wizyt`);
      
    } catch (error) {
      console.error('❌ Błąd podczas wczytywania danych:', error.message);
      throw error;
    }
  }

  // Znajdź najlepszego pracownika dla zamówienia/wizyty
  findBestEmployee(service, location = null) {
    if (this.employees.length === 0) return null;
    
    // Mapowanie kategorii usług na specjalizacje
    const serviceSpecializationMap = {
      'Naprawa laptopa': ['Informatyka', 'Elektronika'],
      'Naprawa laptopów': ['Informatyka', 'Elektronika'],
      'Naprawa komputerów': ['Informatyka', 'Elektronika'],
      'Naprawa telefonu': ['Elektronika', 'Telefonów'],
      'Naprawa piekarników': ['AGD', 'Piekarniki'],
      'Naprawa lodówek': ['AGD', 'Lodówki'],
      'Naprawa pralek': ['AGD', 'Pralki'],
      'Naprawa zmywarek': ['AGD', 'Zmywarki'],
      'Serwis AGD': ['AGD'],
      'instalacja': ['Instalacje', 'AGD'],
      'konsultacja': ['Konsultacje']
    };
    
    const serviceCategory = service?.category || service?.type || 'Inne';
    const requiredSpecializations = serviceSpecializationMap[serviceCategory] || ['Ogólne'];
    
    // Znajdź pracowników z odpowiednimi specjalizacjami
    const eligibleEmployees = this.employees.filter(employee => {
      if (!employee.specializations || employee.specializations.length === 0) {
        return true; // Pracownik bez specjalizacji może wykonywać wszystkie usługi
      }
      
      return requiredSpecializations.some(required => 
        employee.specializations.some(spec => 
          spec.name?.toLowerCase().includes(required.toLowerCase()) ||
          spec.toLowerCase().includes(required.toLowerCase())
        )
      );
    });
    
    if (eligibleEmployees.length === 0) {
      // Jeśli nie ma specjalistów, wybierz dowolnego dostępnego
      return this.employees[Math.floor(Math.random() * this.employees.length)];
    }
    
    // Wybierz pracownika z najwyższą oceną lub najmniejszym obciążeniem
    const bestEmployee = eligibleEmployees.reduce((best, current) => {
      const currentRating = current.rating || 0;
      const bestRating = best.rating || 0;
      
      // Preferuj wyższą ocenę
      if (currentRating > bestRating) return current;
      if (currentRating < bestRating) return best;
      
      // Jeśli oceny równe, preferuj mniejsze obciążenie
      const currentWorkload = current.completedJobs || 0;
      const bestWorkload = best.completedJobs || 0;
      
      return currentWorkload < bestWorkload ? current : best;
    });
    
    return bestEmployee;
  }

  // Dodaj employeeId do zamówień
  assignEmployeesToOrders() {
    console.log('🔄 Przypisywanie pracowników do zamówień...');
    
    let assigned = 0;
    
    this.orders = this.orders.map(order => {
      // Sprawdź czy już ma przypisanego pracownika
      if (order.scheduling?.assignedEmployeeId) {
        this.relationshipStats.ordersWithEmployees++;
        return order;
      }
      
      // Znajdź najlepszego pracownika
      const bestEmployee = this.findBestEmployee(order.service, order.address);
      
      if (bestEmployee) {
        // Dodaj przypisanie pracownika
        const updatedOrder = {
          ...order,
          scheduling: {
            ...order.scheduling,
            assignedEmployeeId: bestEmployee.id,
            assignedAt: new Date().toISOString(),
            assignmentReason: 'auto-assigned based on specialization'
          }
        };
        
        // Dodaj do historii statusów
        if (updatedOrder.timeline?.statusHistory) {
          updatedOrder.timeline.statusHistory.push({
            status: order.status,
            timestamp: new Date().toISOString(),
            employeeId: bestEmployee.id,
            notes: `Automatycznie przypisano pracownika: ${bestEmployee.name}`
          });
        }
        
        assigned++;
        this.relationshipStats.ordersWithEmployees++;
        this.relationshipStats.relationshipsCreated++;
        
        console.log(`  ✅ ${order.id} → ${bestEmployee.name} (${order.service?.category || 'Inne'})`);
        
        return updatedOrder;
      }
      
      return order;
    });
    
    console.log(`📊 Przypisano pracowników do ${assigned} zamówień`);
  }

  // Dodaj employeeId do wizyt
  assignEmployeesToVisits() {
    console.log('🔄 Przypisywanie pracowników do wizyt...');
    
    let assigned = 0;
    
    this.visits = this.visits.map(visit => {
      // Sprawdź czy już ma przypisanego pracownika
      if (visit.assignedEmployeeId) {
        this.relationshipStats.visitsWithEmployees++;
        return visit;
      }
      
      // Znajdź najlepszego pracownika
      const bestEmployee = this.findBestEmployee(visit.service);
      
      if (bestEmployee) {
        const updatedVisit = {
          ...visit,
          assignedEmployeeId: bestEmployee.id,
          assignedAt: new Date().toISOString(),
          assignmentDetails: {
            reason: 'auto-assigned based on service category',
            assignedBy: 'system',
            specialization: visit.service?.category || 'Inne'
          }
        };
        
        assigned++;
        this.relationshipStats.visitsWithEmployees++;
        this.relationshipStats.relationshipsCreated++;
        
        console.log(`  ✅ ${visit.id} → ${bestEmployee.name} (${visit.service?.category || 'Inne'})`);
        
        return updatedVisit;
      }
      
      return visit;
    });
    
    console.log(`📊 Przypisano pracowników do ${assigned} wizyt`);
  }

  // Aktualizuj statystyki pracowników
  updateEmployeeStatistics() {
    console.log('🔄 Aktualizacja statystyk pracowników...');
    
    // Policz przypisania dla każdego pracownika
    const employeeAssignments = {};
    
    // Zlicz z zamówień
    this.orders.forEach(order => {
      const employeeId = order.scheduling?.assignedEmployeeId;
      if (employeeId) {
        employeeAssignments[employeeId] = (employeeAssignments[employeeId] || 0) + 1;
      }
    });
    
    // Zlicz z wizyt
    this.visits.forEach(visit => {
      const employeeId = visit.assignedEmployeeId;
      if (employeeId) {
        employeeAssignments[employeeId] = (employeeAssignments[employeeId] || 0) + 1;
      }
    });
    
    // Aktualizuj statystyki pracowników
    this.employees = this.employees.map(employee => {
      const assignmentCount = employeeAssignments[employee.id] || 0;
      
      if (assignmentCount > 0) {
        const updatedEmployee = {
          ...employee,
          statistics: {
            ...employee.statistics,
            currentAssignments: assignmentCount,
            totalAssignments: (employee.statistics?.totalAssignments || 0) + assignmentCount,
            lastAssignedAt: new Date().toISOString()
          }
        };
        
        this.relationshipStats.employeesAssigned++;
        console.log(`  📊 ${employee.name}: ${assignmentCount} nowych przypisań`);
        
        return updatedEmployee;
      }
      
      return employee;
    });
  }

  // Sprawdź integralność referencji
  validateReferences() {
    console.log('🔍 Sprawdzanie integralności referencji...');
    
    const issues = [];
    
    // Sprawdź referencje employeeId w zamówieniach
    this.orders.forEach(order => {
      const employeeId = order.scheduling?.assignedEmployeeId;
      if (employeeId) {
        const employeeExists = this.employees.some(emp => emp.id === employeeId);
        if (!employeeExists) {
          issues.push({
            type: 'missing-employee',
            orderId: order.id,
            employeeId: employeeId
          });
        }
      }
    });
    
    // Sprawdź referencje employeeId w wizytach
    this.visits.forEach(visit => {
      const employeeId = visit.assignedEmployeeId;
      if (employeeId) {
        const employeeExists = this.employees.some(emp => emp.id === employeeId);
        if (!employeeExists) {
          issues.push({
            type: 'missing-employee',
            visitId: visit.id,
            employeeId: employeeId
          });
        }
      }
    });
    
    if (issues.length > 0) {
      console.log(`⚠️  Znaleziono ${issues.length} problemów z referencjami:`);
      issues.forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.orderId || issue.visitId} → ${issue.employeeId}`);
      });
    } else {
      console.log('✅ Wszystkie referencje są prawidłowe');
    }
    
    return issues;
  }

  // Zapisz poprawione dane
  async saveImprovedData() {
    console.log('💾 Zapisywanie poprawionych danych...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.dataDir, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    try {
      // Zapisz poprawione zamówienia
      const improvedOrdersPath = path.join(this.dataDir, 'improved-orders.json');
      fs.writeFileSync(improvedOrdersPath, JSON.stringify(this.orders, null, 2));
      
      // Zapisz poprawione wizyty
      const improvedVisitsPath = path.join(this.dataDir, 'improved-visits.json');
      fs.writeFileSync(improvedVisitsPath, JSON.stringify(this.visits, null, 2));
      
      // Zapisz zaktualizowanych pracowników
      const improvedEmployeesPath = path.join(this.dataDir, 'improved-employees.json');
      fs.writeFileSync(improvedEmployeesPath, JSON.stringify(this.employees, null, 2));
      
      console.log('✅ Zapisano poprawione dane:');
      console.log(`  - improved-orders.json (${this.orders.length} zamówień)`);
      console.log(`  - improved-visits.json (${this.visits.length} wizyt)`);
      console.log(`  - improved-employees.json (${this.employees.length} pracowników)`);
      
    } catch (error) {
      console.error('❌ Błąd podczas zapisywania:', error.message);
      throw error;
    }
  }

  // Główna funkcja poprawy relacji
  async improveDataRelationships() {
    console.log('🚀 Rozpoczynam poprawę relacji między danymi...');
    
    this.loadData();
    this.assignEmployeesToOrders();
    this.assignEmployeesToVisits();
    this.updateEmployeeStatistics();
    this.validateReferences();
    await this.saveImprovedData();
    
    this.showRelationshipStatistics();
    
    console.log('✅ Poprawa relacji między danymi zakończona!');
  }

  // Wyświetl statystyki relacji
  showRelationshipStatistics() {
    console.log('\n📊 STATYSTYKI RELACJI:');
    console.log(`Zamówienia z przypisanymi pracownikami: ${this.relationshipStats.ordersWithEmployees}/${this.orders.length}`);
    console.log(`Wizyty z przypisanymi pracownikami: ${this.relationshipStats.visitsWithEmployees}/${this.visits.length}`);
    console.log(`Pracownicy z przypisaniami: ${this.relationshipStats.employeesAssigned}/${this.employees.length}`);
    console.log(`Nowych relacji utworzonych: ${this.relationshipStats.relationshipsCreated}`);
    
    // Analiza pokrycia
    const orderCoverage = ((this.relationshipStats.ordersWithEmployees / this.orders.length) * 100).toFixed(1);
    const visitCoverage = ((this.relationshipStats.visitsWithEmployees / this.visits.length) * 100).toFixed(1);
    
    console.log(`\nPokrycie przypisaniami:`);
    console.log(`  Zamówienia: ${orderCoverage}%`);
    console.log(`  Wizyty: ${visitCoverage}%`);
  }
}

// Uruchom jeśli wywołany bezpośrednio
if (require.main === module) {
  const script = new DataRelationshipScript();
  script.improveDataRelationships().catch(console.error);
}

module.exports = DataRelationshipScript;