// Warstwa abstrakcji dla bazy danych
// Łatwe przełączanie między plikami JSON a prawdziwą bazą danych

const fs = require('fs');
const path = require('path');

// Konfiguracja - tutaj zmieniasz źródło danych
const CONFIG = {
  // 'file' dla plików JSON, 'mysql', 'postgresql', 'mongodb' dla baz danych
  dataSource: 'file',
  
  // Ścieżka do plików JSON
  dataPath: path.join(process.cwd(), 'data'),
  
  // Konfiguracja bazy danych (dla przyszłości)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'technik_db'
  }
};

class DatabaseManager {
  constructor() {
    this.dataSource = CONFIG.dataSource;
    // Upewnij się, że folder data istnieje
    if (!fs.existsSync(CONFIG.dataPath)) {
      fs.mkdirSync(CONFIG.dataPath, { recursive: true });
    }
  }

  // Uniwersalny interfejs do odczytu danych
  async getData(tableName) {
    switch (this.dataSource) {
      case 'file':
        return this.getFileData(tableName);
      case 'mysql':
        return this.getMySQLData(tableName);
      case 'postgresql':
        return this.getPostgreSQLData(tableName);
      case 'mongodb':
        return this.getMongoData(tableName);
      default:
        throw new Error(`Nieobsługiwane źródło danych: ${this.dataSource}`);
    }
  }

  // Uniwersalny interfejs do zapisu danych
  async saveData(tableName, data) {
    switch (this.dataSource) {
      case 'file':
        return this.saveFileData(tableName, data);
      case 'mysql':
        return this.saveMySQLData(tableName, data);
      case 'postgresql':
        return this.savePostgreSQLData(tableName, data);
      case 'mongodb':
        return this.saveMongoData(tableName, data);
      default:
        throw new Error(`Nieobsługiwane źródło danych: ${this.dataSource}`);
    }
  }

  // Generowanie unikalnego ID
  generateId(type = '') {
    const prefix = type.substring(0, 3).toUpperCase() || 'GEN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Dodanie nowego rekordu
  async addRecord(tableName, record) {
    const data = await this.getData(tableName);
    const newId = record.id || this.generateId(tableName.toUpperCase());
    const newRecord = { id: newId, ...record, createdAt: new Date().toISOString() };
    
    data.push(newRecord);
    await this.saveData(tableName, data);
    return newRecord;
  }

  // Aktualizacja rekordu
  async updateRecord(tableName, id, updates) {
    const data = await this.getData(tableName);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Rekord o ID ${id} nie został znaleziony w ${tableName}`);
    }
    
    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
    await this.saveData(tableName, data);
    return data[index];
  }

  // Usunięcie rekordu
  async deleteRecord(tableName, id) {
    const data = await this.getData(tableName);
    const filteredData = data.filter(item => item.id !== id);
    
    if (data.length === filteredData.length) {
      throw new Error(`Rekord o ID ${id} nie został znaleziony w ${tableName}`);
    }
    
    await this.saveData(tableName, filteredData);
    return { success: true, deletedId: id };
  }

  // ========== IMPLEMENTACJE DLA PLIKÓW JSON ==========
  
  getFileData(tableName) {
    const filePath = path.join(CONFIG.dataPath, `${tableName}.json`);
    
    try {
      if (!fs.existsSync(filePath)) {
        // Utwórz pusty plik jeśli nie istnieje
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        return [];
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent) || [];
    } catch (error) {
      console.error(`Błąd odczytu pliku ${tableName}.json:`, error);
      return [];
    }
  }

  saveFileData(tableName, data) {
    const filePath = path.join(CONFIG.dataPath, `${tableName}.json`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Błąd zapisu pliku ${tableName}.json:`, error);
      throw error;
    }
  }

  // ========== FUNKCJE EMPLOYEE TODO ==========
  
  // Dodaj nowe TODO dla pracownika
  async addEmployeeTodo(employeeId, todoData) {
    const newTodo = {
      id: this.generateId('TODO'),
      employeeId,
      title: todoData.title,
      description: todoData.description || '',
      priority: todoData.priority || 'medium',
      category: todoData.category || 'general',
      dueDate: todoData.dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: todoData.tags || [],
      attachments: todoData.attachments || [],
      estimatedHours: todoData.estimatedHours || null,
      actualHours: todoData.actualHours || null,
      linkedOrderId: todoData.linkedOrderId || null
    };

    const todos = await this.getData('employee_todos');
    todos.push(newTodo);
    await this.saveData('employee_todos', todos);
    
    return newTodo;
  }

  // Pobierz TODO pracownika
  async getEmployeeTodos(employeeId, filters = {}) {
    const todos = await this.getData('employee_todos');
    let filtered = todos.filter(todo => todo.employeeId === employeeId);

    // Filtrowanie
    if (filters.completed !== undefined) {
      filtered = filtered.filter(todo => todo.completed === filters.completed);
    }
    
    if (filters.priority) {
      filtered = filtered.filter(todo => todo.priority === filters.priority);
    }
    
    if (filters.category) {
      filtered = filtered.filter(todo => todo.category === filters.category);
    }
    
    if (filters.dueDateFrom) {
      filtered = filtered.filter(todo => 
        todo.dueDate && new Date(todo.dueDate) >= new Date(filters.dueDateFrom)
      );
    }
    
    if (filters.dueDateTo) {
      filtered = filtered.filter(todo => 
        todo.dueDate && new Date(todo.dueDate) <= new Date(filters.dueDateTo)
      );
    }

    // Sortowanie
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // Nieukończone na górze
      }
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Wyższy priorytet na górze
      }
      
      // Sortuj po dacie utworzenia
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return filtered;
  }

  // Aktualizuj TODO pracownika
  async updateEmployeeTodo(todoId, updates) {
    const todos = await this.getData('employee_todos');
    const todoIndex = todos.findIndex(todo => todo.id === todoId);
    
    if (todoIndex === -1) {
      throw new Error('TODO nie zostało znalezione');
    }

    const updatedTodo = {
      ...todos[todoIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    todos[todoIndex] = updatedTodo;
    await this.saveData('employee_todos', todos);
    
    return updatedTodo;
  }

  // Usuń TODO pracownika
  async deleteEmployeeTodo(todoId) {
    const todos = await this.getData('employee_todos');
    const todoIndex = todos.findIndex(todo => todo.id === todoId);
    
    if (todoIndex === -1) {
      throw new Error('TODO nie zostało znalezione');
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0];
    await this.saveData('employee_todos', todos);
    
    return deletedTodo;
  }

  // Statystyki TODO pracownika
  async getEmployeeTodoStats(employeeId) {
    const todos = await this.getEmployeeTodos(employeeId);
    
    const stats = {
      total: todos.length,
      completed: todos.filter(todo => todo.completed).length,
      pending: todos.filter(todo => !todo.completed).length,
      overdue: todos.filter(todo => 
        !todo.completed && 
        todo.dueDate && 
        new Date(todo.dueDate) < new Date()
      ).length,
      highPriority: todos.filter(todo => 
        !todo.completed && todo.priority === 'high'
      ).length,
      categories: {},
      estimatedHoursTotal: 0,
      actualHoursTotal: 0
    };

    // Statystyki kategorii
    todos.forEach(todo => {
      if (!stats.categories[todo.category]) {
        stats.categories[todo.category] = {
          total: 0,
          completed: 0,
          pending: 0
        };
      }
      
      stats.categories[todo.category].total++;
      if (todo.completed) {
        stats.categories[todo.category].completed++;
      } else {
        stats.categories[todo.category].pending++;
      }
      
      if (todo.estimatedHours) {
        stats.estimatedHoursTotal += todo.estimatedHours;
      }
      
      if (todo.actualHours) {
        stats.actualHoursTotal += todo.actualHours;
      }
    });

    stats.completionRate = stats.total > 0 ? 
      Math.round((stats.completed / stats.total) * 100) : 0;

    return stats;
  }

  // Nadchodzące TODO
  async getUpcomingTodos(employeeId, days = 7) {
    const todos = await this.getEmployeeTodos(employeeId, { completed: false });
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    return todos.filter(todo => 
      todo.dueDate && 
      new Date(todo.dueDate) <= targetDate
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  // Utwórz TODO z zlecenia
  async createTodoFromOrder(orderId, employeeId, todoData = {}) {
    const orders = await this.getData('technician_orders');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error('Zlecenie nie zostało znalezione');
    }

    const defaultTodoData = {
      title: `Zlecenie: ${order.problemDescription?.substring(0, 50)}...` || 'Nowe zadanie z zlecenia',
      description: `Zlecenie ID: ${orderId}\n\nOpis problemu: ${order.problemDescription}\n\nAdres: ${order.address}`,
      priority: order.priority || 'medium',
      category: 'service',
      linkedOrderId: orderId,
      dueDate: order.preferredDate || null,
      tags: ['zlecenie', order.serviceType || 'naprawa']
    };

    const mergedTodoData = { ...defaultTodoData, ...todoData };
    return await this.addEmployeeTodo(employeeId, mergedTodoData);
  }

  // ========== FUNKCJE BACKUP ==========
  
  async backupData() {
    const backupDir = path.join(process.cwd(), 'backups', `backup_${new Date().toISOString().slice(0, 10)}`);
    
    if (!fs.existsSync(path.dirname(backupDir))) {
      fs.mkdirSync(path.dirname(backupDir), { recursive: true });
    }
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const files = fs.readdirSync(CONFIG.dataPath).filter(file => file.endsWith('.json'));
    
    for (const file of files) {
      const sourcePath = path.join(CONFIG.dataPath, file);
      const backupPath = path.join(backupDir, file);
      fs.copyFileSync(sourcePath, backupPath);
    }

    console.log(`Backup utworzony: ${backupDir}`);
    return backupDir;
  }

  // ========== STARSZE FUNKCJE KOMPATYBILNE ==========
  
  // Synchroniczne funkcje dla kompatybilności wstecznej
  loadData(tableName) {
    return this.getFileData(tableName);
  }

  saveDataSync(tableName, data) {
    return this.saveFileData(tableName, data);
  }

  // Placeholder functions for other database types
  getMySQLData(tableName) {
    throw new Error('MySQL integration not implemented yet');
  }

  saveMySQLData(tableName, data) {
    throw new Error('MySQL integration not implemented yet');
  }

  getPostgreSQLData(tableName) {
    throw new Error('PostgreSQL integration not implemented yet');
  }

  savePostgreSQLData(tableName, data) {
    throw new Error('PostgreSQL integration not implemented yet');
  }

  getMongoData(tableName) {
    throw new Error('MongoDB integration not implemented yet');
  }

  saveMongoData(tableName, data) {
    throw new Error('MongoDB integration not implemented yet');
  }
}

// Singleton instance
const db = new DatabaseManager();

module.exports = db;

// Przykłady użycia:
/*
// Employee TODO operations
await db.addEmployeeTodo('EMP123', {
  title: 'Napraw laptop',
  description: 'Wymień ekran w laptopie klienta',
  priority: 'high',
  category: 'hardware',
  dueDate: '2024-01-15',
  estimatedHours: 2
});

// Get employee todos
const todos = await db.getEmployeeTodos('EMP123');

// Get stats
const stats = await db.getEmployeeTodoStats('EMP123');

// Update todo
await db.updateEmployeeTodo('TODO123', { completed: true, actualHours: 1.5 });

// Delete todo
await db.deleteEmployeeTodo('TODO123');
*/
