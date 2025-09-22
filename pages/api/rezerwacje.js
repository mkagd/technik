
import { createClient } from '@supabase/supabase-js';
import { readReservations, addReservation } from '../../utils/dataStorage';
import {
  addClient,
  addOrder,
  convertReservationToClientOrder,
  readClients,
  readOrders
} from '../../utils/clientOrderStorage';

// Tymczasowe przechowywanie danych w pamięci do testów (fallback)
let tempStorage = [];

// Spróbuj skonfigurować Supabase
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY &&
    !process.env.SUPABASE_URL.includes('twoj-projekt') &&
    !process.env.SUPABASE_ANON_KEY.includes('wtetrtvtblzkguoxfumx')) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
} catch (error) {
  console.log('Supabase not configured, using in-memory storage');
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('📞 API POST /api/rezerwacje - otrzymane dane:', req.body);

    const { name, phone, email, city, street, fullAddress, address, category, device, problem, date, availability } = req.body;

    // Podstawowa walidacja - tylko name i phone są wymagane
    if (!name || !phone) {
      console.log('❌ Brak wymaganych danych (name, phone)');
      return res.status(400).json({ message: 'Brak wymaganych danych: nazwa i telefon' });
    }

    // Sprawdź czy mamy adres w jakiejkolwiek formie
    const finalAddress = address || fullAddress || (street && city ? `${street}, ${city}` : null);
    if (!finalAddress) {
      console.log('❌ Brak adresu');
      return res.status(400).json({ message: 'Brak adresu - podaj pełny adres lub miasto i ulicę' });
    }

    console.log('✅ Walidacja przeszła, tworzenie rekordu...');

    const newReservation = {
      id: Date.now(),
      name,
      phone,
      email,
      city: city || 'Nie podano',
      street: street || 'Nie podano',
      address: finalAddress,
      category,
      device,
      problem: problem || 'Brak opisu',
      availability: availability || 'Nie określono', // New availability field
      date: date || new Date().toISOString(), // Keep date for backward compatibility
      created_at: new Date().toISOString()
    };

    console.log('🔄 Converting reservation to client+order format...');

    // Konwertuj na format klient + zamówienie
    const { client: clientData, order: orderData } = convertReservationToClientOrder({
      ...newReservation,
      clientName: name,
      clientPhone: phone,
      serviceType: device,
      description: problem,
      scheduledDate: date,
      availability: availability // Pass availability to conversion
    });

    // Dodaj klienta
    const newClient = addClient(clientData);
    if (newClient) {
      console.log(`✅ Client created: ${newClient.id} - ${newClient.name}`);

      // Dodaj zamówienie z ID klienta
      const newOrder = addOrder({
        ...orderData,
        clientId: newClient.id
      });

      if (newOrder) {
        console.log(`✅ Order created: ${newOrder.id} for client ${newClient.id}`);
      }
    }

    if (supabase) {
      // Użyj Supabase jeśli skonfigurowane
      const { data: insertData, error } = await supabase.from('rezerwacje').insert([newReservation]);
      if (error) {
        console.error('Supabase error:', error);
        // Fallback do pliku JSON
        const savedReservation = addReservation(newReservation);
        if (!savedReservation) {
          // Ostateczny fallback do pamięci
          tempStorage.push(newReservation);
        }
      }
    } else {
      // Użyj trwałego przechowywania w pliku JSON
      const savedReservation = addReservation(newReservation);
      if (savedReservation) {
        console.log('✅ Saved to file:', savedReservation);
      } else {
        // Fallback do pamięci
        tempStorage.push(newReservation);
        console.log('⚠️ Fallback to memory:', newReservation);
      }
    }

    // Wyślij email jeśli skonfigurowane
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('twoj_resend_api_key')) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_EMAIL_FROM,
            to: email,
            subject: 'Potwierdzenie rezerwacji',
            html: `<strong>Twoja rezerwacja została przyjęta.</strong><br/>Termin: ${new Date(date).toLocaleString()}<br/>Dziękujemy!`
          })
        });
      } catch (emailError) {
        console.log('Email sending failed:', emailError);
      }
    }

    return res.status(200).json({ message: 'Rezerwacja przyjęta', data: newReservation });

  }

  if (req.method === 'GET') {
    console.log('📞 API GET request - pobieranie listy rezerwacji');

    if (supabase) {
      try {
        console.log('🔗 Próba pobrania danych z Supabase...');
        const { data, error } = await supabase.from('rezerwacje').select('*').order('date', { ascending: true });
        if (!error) {
          console.log('✅ Supabase data retrieved:', data);
          return res.status(200).json({ rezerwacje: data });
        } else {
          console.log('❌ Supabase error:', error);
        }
      } catch (error) {
        console.error('❌ Supabase fetch error:', error);
      }
    }

    // Próbuj odczytać z pliku JSON (legacy format)
    try {
      const fileReservations = readReservations();
      console.log('📁 Legacy reservations from file:', fileReservations.length);
    } catch (error) {
      console.error('❌ File read error:', error);
    }

    // Główne źródło danych: klienci + zamówienia
    try {
      const clients = readClients();
      const orders = readOrders();

      console.log(`📊 Data summary: ${clients.length} clients, ${orders.length} orders`);

      // Konwertuj na format zgodny z mapą
      const combinedReservations = clients.map(client => {
        const clientOrders = orders.filter(order => order.clientId === client.id);
        const mainOrder = clientOrders[0]; // Użyj pierwszego zamówienia

        return {
          id: client.id,
          clientName: client.name,
          clientPhone: client.phone,
          email: client.email,
          address: client.address,
          city: client.city,
          street: client.street,
          serviceType: mainOrder?.category || mainOrder?.serviceType || 'Nie określono',
          device: mainOrder?.devices?.[0]?.name || 'Nie określono',
          problem: mainOrder?.description || 'Brak opisu',
          description: mainOrder?.description || 'Brak opisu',
          scheduledDate: mainOrder?.scheduledDate || mainOrder?.dates?.[0],
          scheduledTime: mainOrder?.scheduledTime,
          status: mainOrder?.status || 'pending',
          priority: mainOrder?.priority || 'normal',
          created_at: client.dateAdded,
          date: mainOrder?.scheduledDate || client.dateAdded,
          // Dodatkowe pola dla kompatybilności z mapą
          category: mainOrder?.category || 'serwis',
          ordersCount: clientOrders.length
        };
      });

      if (combinedReservations.length > 0) {
        console.log('✅ Returning combined client+order data:', combinedReservations.length, 'items');
        return res.status(200).json({ rezerwacje: combinedReservations });
      }
    } catch (error) {
      console.error('❌ Error reading clients/orders:', error);
    }

    // Fallback do pamięci
    console.log('📤 Fallback to memory storage:', tempStorage.length, 'items');
    console.log(`📊 Zwracam ${tempStorage.length} rezerwacji z pamięci`);
    return res.status(200).json({ rezerwacje: tempStorage });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
