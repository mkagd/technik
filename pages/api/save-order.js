// pages/api/save-order.js - Zapisywanie zamówień serwisu

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tylko POST dozwolone' });
  }

  try {
    const orderData = req.body;
    const orderId = `ORD${Date.now()}`;
    
    // Struktura zamówienia
    const order = {
      id: orderId,
      timestamp: orderData.timestamp,
      status: 'new',
      customer: {
        name: orderData.userInfo?.name || '',
        email: orderData.userInfo?.email || '',
        phone: orderData.phone || orderData.userInfo?.phone || '',
        company: orderData.userInfo?.company || ''
      },
      service: {
        device: orderData.device,
        brand: orderData.brand,
        model: orderData.model || '',
        problem: orderData.problem,
        urgency: orderData.urgency || 'normal'
      },
      address: {
        street: orderData.address,
        city: orderData.city
      },
      scheduling: {
        preferredTime: orderData.preferredTime,
        assignedTechnician: null,
        scheduledDate: null
      },
      pricing: {
        estimated: null,
        final: null,
        travelCost: orderData.city?.toLowerCase() === 'rzeszów' ? 0 : 50
      }
    };

    // Zapisz do pliku JSON (w prawdziwej aplikacji byłaby to baza danych)
    const ordersFile = path.join(process.cwd(), 'data', 'service-orders.json');
    
    let orders = [];
    try {
      if (fs.existsSync(ordersFile)) {
        const data = fs.readFileSync(ordersFile, 'utf8');
        orders = JSON.parse(data);
      }
    } catch (error) {
      console.log('Tworzenie nowego pliku zamówień');
    }

    orders.push(order);
    
    // Zapisz zaktualizowaną listę
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    // Wyślij powiadomienie email (symulacja)
    console.log('📧 NOWE ZAMÓWIENIE SERWISU:', {
      id: orderId,
      customer: order.customer.name,
      device: order.service.device,
      problem: order.service.problem,
      city: order.address.city
    });

    return res.status(200).json({
      success: true,
      orderId: orderId,
      message: 'Zamówienie zostało zapisane'
    });

  } catch (error) {
    console.error('Błąd zapisywania zamówienia:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd serwera'
    });
  }
}