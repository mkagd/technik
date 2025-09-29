// API endpoint dla TODO pracowników
// pages/api/employee-todos.js

const db = require('../../utils/database');

export default async function handler(req, res) {
  const { method } = req;
  
  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res);
        break;
      case 'PUT':
        await handlePut(req, res);
        break;
      case 'DELETE':
        await handleDelete(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Employee TODO API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Wewnętrzny błąd serwera',
      details: error.message 
    });
  }
}

// GET - Pobierz TODO pracownika
async function handleGet(req, res) {
  const { employeeId, action, days } = req.query;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      error: 'Employee ID jest wymagane'
    });
  }

  try {
    switch (action) {
      case 'stats':
        const stats = await db.getEmployeeTodoStats(employeeId);
        return res.status(200).json({
          success: true,
          data: stats
        });

      case 'upcoming':
        const upcomingTodos = await db.getUpcomingTodos(employeeId, parseInt(days) || 7);
        return res.status(200).json({
          success: true,
          data: upcomingTodos
        });

      default:
        const todos = await db.getEmployeeTodos(employeeId);
        return res.status(200).json({
          success: true,
          data: todos
        });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// POST - Dodaj nowe TODO
async function handlePost(req, res) {
  const { employeeId, todoData, fromOrderId } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      error: 'Employee ID jest wymagane'
    });
  }

  if (!todoData || !todoData.title) {
    return res.status(400).json({
      success: false,
      error: 'Dane TODO i tytuł są wymagane'
    });
  }

  try {
    let newTodo;

    if (fromOrderId) {
      // Utwórz TODO z istniejącego zlecenia
      newTodo = await db.createTodoFromOrder(fromOrderId, employeeId, todoData);
    } else {
      // Utwórz zwykłe TODO
      newTodo = await db.addEmployeeTodo(employeeId, todoData);
    }

    return res.status(201).json({
      success: true,
      data: newTodo,
      message: 'TODO zostało utworzone pomyślnie'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// PUT - Aktualizuj TODO
async function handlePut(req, res) {
  const { todoId, updates } = req.body;

  if (!todoId) {
    return res.status(400).json({
      success: false,
      error: 'TODO ID jest wymagane'
    });
  }

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Dane do aktualizacji są wymagane'
    });
  }

  try {
    const updatedTodo = await db.updateEmployeeTodo(todoId, updates);
    
    return res.status(200).json({
      success: true,
      data: updatedTodo,
      message: 'TODO zostało zaktualizowane pomyślnie'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// DELETE - Usuń TODO
async function handleDelete(req, res) {
  const { todoId } = req.body;

  if (!todoId) {
    return res.status(400).json({
      success: false,
      error: 'TODO ID jest wymagane'
    });
  }

  try {
    const result = await db.deleteEmployeeTodo(todoId);
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'TODO zostało usunięte pomyślnie'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}