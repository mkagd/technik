// pages/api/enhanced-employee-todos.js
import fs from 'fs';
import path from 'path';

const TODOS_FILE = path.join(process.cwd(), 'data', 'enhanced_employee_todos.json');
const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');

// Funkcja do odczytu pliku JSON
const readJSONFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Błąd odczytu pliku ${filePath}:`, error);
    return [];
  }
};

// Funkcja do zapisu pliku JSON
const writeJSONFile = (filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Błąd zapisu pliku ${filePath}:`, error);
    return false;
  }
};

// Funkcja do znajdowania klienta po ID
const findClientById = (clientId) => {
  const clients = readJSONFile(CLIENTS_FILE);
  return clients.find(client => client.id === clientId);
};

// Funkcja do wyliczania odległości (prosta aproksymacja)
const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return null;
  
  const R = 6371; // Promień Ziemi w km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10;
};

// Funkcja do szacowania czasu podróży
const estimateTravelTime = (distance) => {
  if (!distance) return null;
  // Założenie: średnia prędkość 50 km/h w mieście
  return Math.round(distance * 60 / 50);
};

// Funkcja do wzbogacania TODO o dane klienta
const enhanceTodoWithClientData = (todo) => {
  if (!todo.clientId) return todo;
  
  const client = findClientById(todo.clientId);
  if (!client) return todo;
  
  const enhanced = { ...todo };
  
  // Aktualizuj dane klienta
  enhanced.clientData = {
    name: client.name,
    phone: client.phone,
    email: client.email,
    preferredContactTime: client.preferredContactTime,
    isCompany: client.isCompany || false,
    tags: client.tags || [],
    city: client.city
  };
  
  // Aktualizuj lokalizację
  if (client.address) {
    enhanced.location = {
      address: client.address,
      city: client.city,
      coordinates: client.coordinates || null,
      estimatedTravelTime: client.coordinates ? estimateTravelTime(
        calculateDistance(
          { lat: 50.8661, lng: 20.6286 }, // Przykładowa lokalizacja bazy
          client.coordinates
        )
      ) : null,
      distanceFromBase: client.coordinates ? calculateDistance(
        { lat: 50.8661, lng: 20.6286 },
        client.coordinates
      ) : null,
      region: client.region || 'świętokrzyskie'
    };
  }
  
  return enhanced;
};

// Funkcja do generowania statystyk
const generateStatistics = (todos, employeeId = null) => {
  const filteredTodos = employeeId 
    ? todos.filter(todo => todo.employeeId === employeeId)
    : todos;
  
  const completed = filteredTodos.filter(todo => todo.completed);
  const pending = filteredTodos.filter(todo => !todo.completed);
  const overdue = pending.filter(todo => new Date(todo.dueDate) < new Date());
  
  const priorities = {
    high: filteredTodos.filter(todo => todo.priority === 'high').length,
    medium: filteredTodos.filter(todo => todo.priority === 'medium').length,
    low: filteredTodos.filter(todo => todo.priority === 'low').length
  };
  
  const categories = {};
  filteredTodos.forEach(todo => {
    categories[todo.category] = (categories[todo.category] || 0) + 1;
  });
  
  const cities = {};
  filteredTodos.forEach(todo => {
    if (todo.location?.city) {
      cities[todo.location.city] = (cities[todo.location.city] || 0) + 1;
    }
  });
  
  const averageCompletionTime = completed.length > 0 
    ? completed.reduce((sum, todo) => sum + (todo.actualHours || todo.estimatedHours || 0), 0) / completed.length
    : 0;
  
  const totalDistance = filteredTodos.reduce((sum, todo) => 
    sum + (todo.location?.distanceFromBase || 0), 0);
  
  const totalTravelTime = filteredTodos.reduce((sum, todo) => 
    sum + (todo.location?.estimatedTravelTime || 0), 0);
  
  return {
    total: filteredTodos.length,
    completed: completed.length,
    pending: pending.length,
    overdue: overdue.length,
    completionRate: filteredTodos.length > 0 ? Math.round((completed.length / filteredTodos.length) * 100) : 0,
    priorities,
    categories,
    cities,
    averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalTravelTime: Math.round(totalTravelTime),
    clientsServed: [...new Set(filteredTodos.map(todo => todo.clientId).filter(Boolean))].length
  };
};

// Funkcja do optymalizacji harmonogramu
const optimizeSchedule = (todos, date) => {
  const dayTodos = todos.filter(todo => {
    if (todo.completed) return false;
    const todoDate = todo.scheduling?.suggestedDate || todo.dueDate;
    return todoDate === date;
  });
  
  if (dayTodos.length === 0) return [];
  
  // Sortowanie według priorytetu i odległości
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  
  return dayTodos.sort((a, b) => {
    const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    
    const distanceA = a.location?.distanceFromBase || Infinity;
    const distanceB = b.location?.distanceFromBase || Infinity;
    return distanceA - distanceB;
  });
};

export default function handler(req, res) {
  const { method, query } = req;
  
  try {
    switch (method) {
      case 'GET':
        const todos = readJSONFile(TODOS_FILE);
        const enhancedTodos = todos.map(enhanceTodoWithClientData);
        
        // Filtrowanie
        let filteredTodos = enhancedTodos;
        
        if (query.employeeId && query.employeeId !== 'all') {
          filteredTodos = filteredTodos.filter(todo => todo.employeeId === query.employeeId);
        }
        
        if (query.status) {
          if (query.status === 'completed') {
            filteredTodos = filteredTodos.filter(todo => todo.completed);
          } else if (query.status === 'pending') {
            filteredTodos = filteredTodos.filter(todo => !todo.completed);
          } else if (query.status === 'overdue') {
            filteredTodos = filteredTodos.filter(todo => 
              !todo.completed && new Date(todo.dueDate) < new Date()
            );
          }
        }
        
        if (query.priority) {
          filteredTodos = filteredTodos.filter(todo => todo.priority === query.priority);
        }
        
        if (query.city) {
          filteredTodos = filteredTodos.filter(todo => todo.location?.city === query.city);
        }
        
        if (query.clientId) {
          filteredTodos = filteredTodos.filter(todo => todo.clientId === query.clientId);
        }
        
        // Sortowanie
        if (query.sortBy) {
          filteredTodos.sort((a, b) => {
            switch (query.sortBy) {
              case 'dueDate':
                return new Date(a.dueDate) - new Date(b.dueDate);
              case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
              case 'distance':
                return (a.location?.distanceFromBase || 0) - (b.location?.distanceFromBase || 0);
              case 'clientRating':
                return (b.clientHistory?.averageRating || 0) - (a.clientHistory?.averageRating || 0);
              default:
                return 0;
            }
          });
        }
        
        // Opcje specjalne
        if (query.optimize && query.date) {
          filteredTodos = optimizeSchedule(filteredTodos, query.date);
        }
        
        if (query.stats === 'true') {
          const statistics = generateStatistics(enhancedTodos, query.employeeId);
          return res.status(200).json({
            todos: filteredTodos,
            statistics
          });
        }
        
        return res.status(200).json(filteredTodos);
        
      case 'POST':
        const newTodo = req.body;
        const todosForCreate = readJSONFile(TODOS_FILE);
        
        // Generuj ID jeśli nie ma
        if (!newTodo.id) {
          newTodo.id = `TOD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        }
        
        // Ustaw timestamps
        const now = new Date().toISOString();
        newTodo.createdAt = now;
        newTodo.updatedAt = now;
        
        // Wzbogać o dane klienta jeśli podano clientId
        const enhancedTodo = enhanceTodoWithClientData(newTodo);
        
        todosForCreate.push(enhancedTodo);
        
        if (writeJSONFile(TODOS_FILE, todosForCreate)) {
          return res.status(201).json(enhancedTodo);
        } else {
          return res.status(500).json({ error: 'Błąd zapisu TODO' });
        }
        
      case 'PUT':
        const todoId = query.id;
        if (!todoId) {
          return res.status(400).json({ error: 'Brak ID TODO' });
        }
        
        const updatedTodo = req.body;
        const todosToUpdate = readJSONFile(TODOS_FILE);
        const todoIndex = todosToUpdate.findIndex(todo => todo.id === todoId);
        
        if (todoIndex === -1) {
          return res.status(404).json({ error: 'TODO nie znalezione' });
        }
        
        // Zachowaj oryginalne timestamps
        updatedTodo.createdAt = todosToUpdate[todoIndex].createdAt;
        updatedTodo.updatedAt = new Date().toISOString();
        
        // Wzbogać o dane klienta
        const enhancedUpdatedTodo = enhanceTodoWithClientData(updatedTodo);
        
        todosToUpdate[todoIndex] = enhancedUpdatedTodo;
        
        if (writeJSONFile(TODOS_FILE, todosToUpdate)) {
          return res.status(200).json(enhancedUpdatedTodo);
        } else {
          return res.status(500).json({ error: 'Błąd aktualizacji TODO' });
        }
        
      case 'DELETE':
        const deleteId = query.id;
        if (!deleteId) {
          return res.status(400).json({ error: 'Brak ID TODO' });
        }
        
        const todosForDelete = readJSONFile(TODOS_FILE);
        const filteredTodosAfterDelete = todosForDelete.filter(todo => todo.id !== deleteId);
        
        if (filteredTodosAfterDelete.length === todosForDelete.length) {
          return res.status(404).json({ error: 'TODO nie znalezione' });
        }
        
        if (writeJSONFile(TODOS_FILE, filteredTodosAfterDelete)) {
          return res.status(200).json({ message: 'TODO usunięte pomyślnie' });
        } else {
          return res.status(500).json({ error: 'Błąd usuwania TODO' });
        }
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
}