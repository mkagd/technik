// Przykład API endpoint używającego nowej warstwy abstrakcji danych
// pages/api/orders-new.js

const db = require('../../utils/database');

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await getOrders(req, res);
      case 'POST':
        return await createOrder(req, res);
      case 'PUT':
        return await updateOrder(req, res);
      case 'DELETE':
        return await deleteOrder(req, res);
      default:
        return res.status(405).json({ error: 'Metoda nie obsługiwana' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
}

// GET - pobierz zamówienia
async function getOrders(req, res) {
  const { page = 1, limit = 10, status, clientId } = req.query;
  
  // Pobierz wszystkie zamówienia
  let orders = await db.getData('orders');
  
  // Filtrowanie
  if (status) {
    orders = orders.filter(order => order.status === status);
  }
  
  if (clientId) {
    orders = orders.filter(order => order.clientId === parseInt(clientId));
  }
  
  // Sortowanie (najnowsze pierwsze)
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Paginacja
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedOrders = orders.slice(startIndex, endIndex);
  
  // Dodaj informacje o kliencie do każdego zamówienia
  const clients = await db.getData('clients');
  const enrichedOrders = paginatedOrders.map(order => {
    const client = clients.find(c => c.id === order.clientId);
    return {
      ...order,
      client: client ? {
        name: `${client.firstName} ${client.lastName}`,
        phone: client.phone,
        email: client.email
      } : null
    };
  });
  
  return res.status(200).json({
    orders: enrichedOrders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: orders.length,
      pages: Math.ceil(orders.length / limit)
    }
  });
}

// POST - utwórz nowe zamówienie
async function createOrder(req, res) {
  const {
    clientId,
    serviceType,
    deviceType,
    brand,
    model,
    description,
    problemDescription,
    priority = 'medium',
    estimatedCost
  } = req.body;
  
  // Walidacja
  if (!clientId || !deviceType || !description) {
    return res.status(400).json({
      error: 'Wymagane pola: clientId, deviceType, description'
    });
  }
  
  // Sprawdź czy klient istnieje
  const clients = await db.getData('clients');
  const client = clients.find(c => c.id === parseInt(clientId));
  if (!client) {
    return res.status(404).json({ error: 'Klient nie został znaleziony' });
  }
  
  // Utwórz zamówienie
  const newOrder = await db.addRecord('orders', {
    clientId: parseInt(clientId),
    serviceType: serviceType || 'naprawa',
    deviceType,
    brand: brand || '',
    model: model || '',
    description,
    problemDescription: problemDescription || description,
    status: 'pending',
    priority,
    estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0
  });
  
  return res.status(201).json({
    message: 'Zamówienie utworzone pomyślnie',
    order: newOrder
  });
}

// PUT - aktualizuj zamówienie
async function updateOrder(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'ID zamówienia jest wymagane' });
  }
  
  try {
    const updatedOrder = await db.updateRecord('orders', parseInt(id), req.body);
    
    return res.status(200).json({
      message: 'Zamówienie zaktualizowane pomyślnie',
      order: updatedOrder
    });
  } catch (error) {
    if (error.message.includes('nie został znaleziony')) {
      return res.status(404).json({ error: 'Zamówienie nie zostało znalezione' });
    }
    throw error;
  }
}

// DELETE - usuń zamówienie
async function deleteOrder(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'ID zamówienia jest wymagane' });
  }
  
  try {
    await db.deleteRecord('orders', parseInt(id));
    
    return res.status(200).json({
      message: 'Zamówienie usunięte pomyślnie'
    });
  } catch (error) {
    if (error.message.includes('nie został znaleziony')) {
      return res.status(404).json({ error: 'Zamówienie nie zostało znalezione' });
    }
    throw error;
  }
}