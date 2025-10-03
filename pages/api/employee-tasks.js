// pages/api/employee-tasks.js
// 🔧 API dla zadań/zleceń pracownika
// Pobiera prawdziwe zlecenia z data/orders.json przypisane do danego pracownika

import fs from 'fs';
import path from 'path';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');
const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');

const readOrders = () => {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Błąd odczytu orders.json:', error);
    return [];
  }
};

const readEmployees = () => {
  try {
    const data = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Błąd odczytu employees.json:', error);
    return [];
  }
};

const updateOrderStatus = (orderId, newStatus) => {
  try {
    const orders = readOrders();
    const orderIndex = orders.findIndex(order => order.orderNumber === orderId || order.id === orderId);
    
    if (orderIndex === -1) {
      return { success: false, message: 'Zlecenie nie znalezione' };
    }
    
    orders[orderIndex].status = newStatus;
    orders[orderIndex].lastModified = new Date().toISOString();
    
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return { success: true, message: 'Status zaktualizowany' };
  } catch (error) {
    console.error('❌ Błąd aktualizacji statusu:', error);
    return { success: false, message: 'Błąd zapisu' };
  }
};

export default function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetTasks(req, res);
  } else if (req.method === 'POST') {
    return handleUpdateTask(req, res);
  } else {
    return res.status(405).json({ 
      success: false, 
      message: 'Metoda nieobsługiwana' 
    });
  }
}

const handleGetTasks = (req, res) => {
  const { employeeId, date, status } = req.query;
  
  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: 'employeeId jest wymagane'
    });
  }

  try {
    const orders = readOrders();
    const employees = readEmployees();
    
    // Znajdź pracownika
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Pracownik nie znaleziony'
      });
    }

    // Filtruj zlecenia przypisane do pracownika
    let employeeTasks = orders.filter(order => {
      // Sprawdź różne możliwe sposoby przypisania pracownika
      const isAssigned = 
        order.assignedTo === employeeId ||
        order.assignedEmployee === employeeId ||
        order.technicianId === employeeId ||
        (order.visits && order.visits.some(visit => 
          visit.assignedTo === employeeId || 
          visit.technicianId === employeeId
        ));
      
      return isAssigned;
    });

    // Filtruj po dacie jeśli podana
    if (date) {
      const targetDate = new Date(date);
      const dateString = targetDate.toISOString().split('T')[0];
      
      employeeTasks = employeeTasks.filter(order => {
        // Sprawdź datę wizyty lub planowaną datę
        const orderDate = order.visitDate || order.plannedDate || order.createdDate;
        if (orderDate) {
          return orderDate.startsWith(dateString);
        }
        
        // Sprawdź daty w wizytach
        if (order.visits) {
          return order.visits.some(visit => 
            visit.date && visit.date.startsWith(dateString)
          );
        }
        
        return false;
      });
    }

    // Filtruj po statusie jeśli podany
    if (status) {
      employeeTasks = employeeTasks.filter(order => order.status === status);
    }

    // Przekształć na format dla panelu pracownika
    const formattedTasks = employeeTasks.map(order => ({
      id: order.orderNumber || order.id,
      orderNumber: order.orderNumber,
      time: extractTimeFromOrder(order),
      customerName: order.clientName || order.customerName || 'Nieznany klient',
      address: order.clientAddress || order.address || 'Adres nieznany',
      phone: order.clientPhone || order.phone || '',
      description: order.description || order.problemDescription || '',
      device: `${order.brand || ''} ${order.model || ''}`.trim() || order.device,
      deviceType: order.deviceType || order.category,
      status: mapOrderStatus(order.status),
      estimatedDuration: order.estimatedDuration || order.duration || 120,
      priority: order.priority || 'medium',
      serviceType: order.serviceType || 'serwis',
      symptoms: order.symptoms || [],
      diagnosis: order.diagnosis || '',
      parts: order.parts || [],
      totalCost: order.totalCost || 0,
      visitDate: order.visitDate || order.plannedDate,
      createdDate: order.createdDate,
      lastModified: order.lastModified
    }));

    // Statystyki dla pracownika
    const stats = {
      totalTasks: formattedTasks.length,
      completedTasks: formattedTasks.filter(t => t.status === 'completed').length,
      pendingTasks: formattedTasks.filter(t => t.status === 'pending').length,
      inProgressTasks: formattedTasks.filter(t => t.status === 'in_progress').length,
      todayTasks: formattedTasks.filter(t => isToday(t.visitDate)).length
    };

    return res.status(200).json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        specializations: employee.specializations
      },
      tasks: formattedTasks,
      stats: stats,
      message: `Znaleziono ${formattedTasks.length} zadań dla pracownika`
    });

  } catch (error) {
    console.error('❌ Błąd pobierania zadań pracownika:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera'
    });
  }
};

const handleUpdateTask = (req, res) => {
  const { action, taskId, status, notes, completionTime } = req.body;

  if (action === 'update-status') {
    const result = updateOrderStatus(taskId, status);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Status zlecenia ${taskId} zaktualizowany na: ${status}`
      });
    } else {
      return res.status(400).json(result);
    }
  }

  return res.status(400).json({
    success: false,
    message: 'Nieznana akcja'
  });
};

// Helper functions
const extractTimeFromOrder = (order) => {
  // Próbuj wyciągnąć godzinę z różnych pól
  if (order.visitTime) return order.visitTime;
  if (order.time) return order.time;
  if (order.plannedTime) return order.plannedTime;
  
  // Sprawdź wizyty
  if (order.visits && order.visits.length > 0) {
    const firstVisit = order.visits[0];
    if (firstVisit.time) return firstVisit.time;
  }
  
  return '09:00'; // domyślna godzina
};

const mapOrderStatus = (status) => {
  // Mapowanie statusów z systemu zleceń na format panelu
  const statusMap = {
    'new': 'pending',
    'assigned': 'pending', 
    'in_progress': 'in_progress',
    'in-progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'on_hold': 'pending'
  };
  
  return statusMap[status] || 'pending';
};

const isToday = (dateString) => {
  if (!dateString) return false;
  
  const today = new Date();
  const compareDate = new Date(dateString);
  
  return today.toDateString() === compareDate.toDateString();
};