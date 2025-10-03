
import { createClient } from '@supabase/supabase-js';
import { readReservations, addReservation } from '../../utils/dataStorage';
import {
  addClient,
  addOrder,
  convertReservationToClientOrder,
  readClients,
  readOrders,
  updateClient,
  updateOrder,
  deleteClient,
  deleteOrder
} from '../../utils/clientOrderStorage';
import { createNotification, NotificationTemplates } from '../../utils/notificationHelper';

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
      created_at: new Date().toISOString(),
      // 🌍 WSPÓŁRZĘDNE GPS z geocodingu
      clientLocation: req.body.clientLocation || null,
      postalCode: req.body.postalCode || '',
      // Przekaż wszystkie dodatkowe pola z formularza
      ...req.body
    };

    console.log('🔄 Converting reservation to client+order format...');

    // Deklaruj zmienne na wyższym poziomie (dostępne w całym handlerze)
    let newClient = null;
    let newOrder = null;
    let clientData = null;
    let orderData = null;

    try {
      // Konwertuj na format klient + zamówienie
      const converted = await convertReservationToClientOrder({
        ...newReservation,
        clientName: name,
        clientPhone: phone,
        serviceType: device,
        description: problem,
        scheduledDate: date,
        availability: availability // Pass availability to conversion
      });

      clientData = converted.client;
      orderData = converted.order;

      console.log('📦 Converted client data:', clientData);
      console.log('📦 Converted order data:', orderData);

      // Dodaj klienta
      newClient = await addClient(clientData);
      if (newClient) {
        console.log(`✅ Client created: ${newClient.id} - ${newClient.name} (source: ${newClient.source})`);
        
        // Utwórz notyfikację o nowym kliencie
        await createNotification(NotificationTemplates.newClient(newClient.name));

        // Dodaj zamówienie z ID klienta
        newOrder = await addOrder({
          ...orderData,
          clientId: newClient.id
        });

        if (newOrder) {
          console.log(`✅ Order created: ${newOrder.orderNumber} (ID: ${newOrder.id}) for client ${newClient.id}`);
          
          // Utwórz notyfikację o nowym zamówieniu
          await createNotification(NotificationTemplates.newOrder(
            newOrder.orderNumber, 
            newOrder.deviceType || 'AGD'
          ));
        }
      }
    } catch (clientOrderError) {
      console.error('❌ Error creating client/order:', clientOrderError);
      // Kontynuuj - newClient i newOrder pozostaną null
    }

    // Utwórz notyfikację o nowej rezerwacji
    await createNotification(NotificationTemplates.newReservation(
      name,
      category || 'AGD'
    ));

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
        console.log('📧 Sending email to:', email);

        // Przygotuj dane dla emaila
        const emailDevices = orderData?.devices || [];
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // Funkcja do mapowania kategorii na nazwę ikony SVG
        const getDeviceIconName = (deviceName) => {
          const name = (deviceName || '').toLowerCase();
          if (name.includes('pral')) return 'pralka';
          if (name.includes('lodów') || name.includes('zamraż')) return 'lodowka';
          if (name.includes('zmywar')) return 'zmywarka';
          if (name.includes('piekar')) return 'piekarnik';
          if (name.includes('kuchenk')) return 'kuchenka';
          if (name.includes('mikrof')) return 'mikrofalowka';
          if (name.includes('suszar')) return 'suszarka';
          if (name.includes('okap')) return 'okap';
          return 'inne';
        };

        // Generuj listę urządzeń dla emaila
        const devicesHtml = emailDevices.length > 0 ? `
          <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">📦 Zgłoszone urządzenia:</h3>
            ${emailDevices.map(device => {
              const deviceName = device.name || orderData.deviceType || category || 'Urządzenie AGD';
              const deviceIconName = getDeviceIconName(deviceName);
              const deviceDescription = device.description || problem || 'Brak opisu';
              
              return `
                <div style="margin: 10px 0; padding: 12px; background: white; border-radius: 6px; border-left: 4px solid #3b82f6;">
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <img src="${baseUrl}/icons/agd/${deviceIconName}.svg" alt="${deviceName}" style="width: 32px; height: 32px;" />
                    <strong style="color: #1e40af; font-size: 16px;">${deviceName}</strong>
                  </div>
                  <div style="color: #666; font-size: 14px; padding-left: 42px;">
                    ${deviceDescription}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : '';

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6;">
                <h1 style="color: #1e40af; margin: 0; font-size: 28px;">✅ Potwierdzenie rezerwacji</h1>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Twoje zgłoszenie zostało pomyślnie przyjęte</p>
              </div>

              <!-- Main Content -->
              <div style="margin-bottom: 25px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Witaj <strong>${name}</strong>,<br/><br/>
                  Dziękujemy za złożenie zgłoszenia serwisowego. Twoje zgłoszenie zostało zarejestrowane i zostanie obsłużone tak szybko jak to możliwe.
                </p>
              </div>

              ${devicesHtml}

              <!-- Details Section -->
              <div style="margin: 20px 0; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">📋 Szczegóły zgłoszenia:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 Adres:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500; font-size: 14px;">${finalAddress}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">📞 Telefon:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500; font-size: 14px;">${phone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">📧 Email:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500; font-size: 14px;">${email}</td>
                  </tr>
                  ${availability ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">🕒 Dostępność:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500; font-size: 14px;">${availability}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">📅 Data zgłoszenia:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500; font-size: 14px;">${new Date(date || Date.now()).toLocaleString('pl-PL')}</td>
                  </tr>
                </table>
              </div>

              <!-- Installation and Built-in Info -->
              ${orderData?.hasBuiltIn ? `
              <div style="margin: 20px 0; padding: 15px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">🔧 Informacje o zabudowie:</h3>
                <div style="color: #666; font-size: 14px; line-height: 1.8;">
                  <p style="margin: 0 0 8px 0;"><strong style="color: #92400e;">⚠️ Urządzenie w zabudowie</strong></p>
                  <p style="margin: 0 0 4px 0; padding-left: 20px;">• Urządzenie jest wbudowane w meble kuchenne</p>
                  <p style="margin: 0 0 4px 0; padding-left: 20px;">• Wymaga demontażu i montażu</p>
                  ${orderData.hasTrudnaZabudowa ? '<p style="margin: 0; padding-left: 20px; color: #dc2626;"><strong>• Trudna zabudowa - ograniczony dostęp</strong></p>' : ''}
                </div>
              </div>
              ` : ''}

              <!-- Next Steps -->
              <div style="margin: 25px 0; padding: 15px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
                <h3 style="margin: 0 0 10px 0; color: #15803d; font-size: 16px;">🚀 Co dalej?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
                  <li>Nasz zespół skontaktuje się z Tobą w ciągu <strong>24 godzin</strong></li>
                  <li>Ustalimy dogodny termin wizyty serwisanta</li>
                  <li>Otrzymasz SMS z przypomnieniem dzień przed wizytą</li>
                </ul>
              </div>

              <!-- Footer -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
                <p style="color: #999; font-size: 13px; margin: 0;">
                  Jeśli masz pytania, skontaktuj się z nami odpowiadając na tego maila<br/>
                  lub dzwoniąc pod numer podany na naszej stronie.
                </p>
                <p style="color: #bbb; font-size: 12px; margin: 15px 0 0 0;">
                  © ${new Date().getFullYear()} Serwis AGD - Profesjonalne naprawy sprzętu AGD
                </p>
              </div>

            </div>
          </body>
          </html>
        `;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_EMAIL_FROM,
            to: email,
            subject: '✅ Potwierdzenie rezerwacji serwisu AGD',
            html: emailHtml
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(`Resend API error: ${errorData.message || emailResponse.statusText}`);
        }

        const emailResult = await emailResponse.json();
        console.log('✅ Email sent successfully to:', email);
        console.log('📧 Resend response:', emailResult);
        
        return res.status(200).json({ 
          message: 'Rezerwacja przyjęta', 
          data: newReservation,
          order: newOrder || { orderNumber: 'Będzie przydzielony wkrótce', id: null },
          client: newClient,
          emailSent: true,
          emailError: null
        });
      } catch (emailError) {
        console.error('❌ Email error:', emailError);
        const errorMessage = emailError.message || 'Nieznany błąd podczas wysyłania emaila';
        console.error('📧 Email error details:', errorMessage);
        
        return res.status(200).json({ 
          message: 'Rezerwacja przyjęta', 
          data: newReservation,
          order: newOrder || { orderNumber: 'Będzie przydzielony wkrótce', id: null },
          client: newClient,
          emailSent: false,
          emailError: errorMessage
        });
      }
    } else {
      // Email nie skonfigurowany lub wyłączony
      console.log('⚠️ Email service not configured');
      return res.status(200).json({ 
        message: 'Rezerwacja przyjęta', 
        data: newReservation,
        order: newOrder || { orderNumber: 'Będzie przydzielony wkrótce', id: null },
        client: newClient,
        emailSent: false,
        emailError: 'Email nie został wysłany - system emailowy nie jest skonfigurowany'
      });
    }

  }

  if (req.method === 'GET') {
    console.log('📞 API GET request - pobieranie listy rezerwacji');
    const { id } = req.query;

    if (supabase) {
      try {
        console.log('🔗 Próba pobrania danych z Supabase...');
        
        // Jeśli podano ID, pobierz pojedynczą rezerwację
        if (id) {
          const { data, error } = await supabase.from('rezerwacje').select('*').eq('id', id).single();
          if (!error && data) {
            console.log('✅ Single reservation retrieved:', data);
            return res.status(200).json(data);
          } else if (error) {
            console.log('❌ Supabase error:', error);
          }
        } else {
          // Pobierz wszystkie rezerwacje
          const { data, error } = await supabase.from('rezerwacje').select('*').order('date', { ascending: true });
          if (!error) {
            console.log('✅ Supabase data retrieved:', data);
            return res.status(200).json({ rezerwacje: data });
          } else {
            console.log('❌ Supabase error:', error);
          }
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
      const clients = await readClients();
      const orders = await readOrders();

      console.log(`📊 Data summary: ${clients.length} clients, ${orders.length} orders`);

      // Konwertuj na format zgodny z mapą i stroną /admin/rezerwacje
      const combinedReservations = clients.map(client => {
        const clientOrders = orders.filter(order => order.clientId === client.id);
        const mainOrder = clientOrders[0]; // Użyj pierwszego zamówienia

        return {
          id: client.id,
          // Dla kompatybilności z różnymi widokami - oba formaty
          name: client.name,
          clientName: client.name,
          phone: client.phone,
          clientPhone: client.phone,
          email: client.email,
          address: client.address,
          city: client.city,
          street: client.street,
          postalCode: client.postalCode || '',
          serviceType: mainOrder?.category || mainOrder?.serviceType || 'Nie określono',
          device: mainOrder?.devices?.[0]?.name || 'Nie określono',
          problem: mainOrder?.description || 'Brak opisu',
          description: mainOrder?.description || 'Brak opisu',
          scheduledDate: mainOrder?.scheduledDate || mainOrder?.dates?.[0],
          scheduledTime: mainOrder?.scheduledTime,
          time: mainOrder?.scheduledTime || mainOrder?.availability, // Dodaj pole 'time' dla tabeli
          status: mainOrder?.status || 'pending',
          priority: mainOrder?.priority || 'normal',
          created_at: client.dateAdded,
          createdAt: client.createdAt || client.dateAdded,
          date: mainOrder?.scheduledDate || mainOrder?.dates?.[0] || client.dateAdded,
          notes: mainOrder?.notes || '',
          // Dodatkowe pola dla kompatybilności z mapą
          category: mainOrder?.category || 'serwis',
          ordersCount: clientOrders.length,
          // Dane zamówienia dla edycji
          orderId: mainOrder?.id,
          orderNumber: mainOrder?.orderNumber
        };
      });

      // Jeśli szukamy konkretnej rezerwacji po ID
      if (id) {
        const singleReservation = combinedReservations.find(r => r.id === id);
        if (singleReservation) {
          console.log('✅ Single reservation found:', id);
          return res.status(200).json(singleReservation);
        } else {
          console.log('❌ Reservation not found:', id);
          return res.status(404).json({ message: 'Rezerwacja nie znaleziona' });
        }
      }

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

  if (req.method === 'PUT') {
    console.log('📞 API PUT /api/rezerwacje - aktualizacja rezerwacji');
    const { id, orderId, orderNumber, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Brak ID rezerwacji' });
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('rezerwacje')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          console.log('✅ Rezerwacja zaktualizowana w Supabase:', data);
          return res.status(200).json({ message: 'Rezerwacja zaktualizowana', data });
        } else {
          console.log('❌ Supabase update error:', error);
        }
      } catch (error) {
        console.error('❌ Supabase update error:', error);
      }
    }

    // Główne źródło danych: klienci + zamówienia
    try {
      const clients = await readClients();
      const orders = await readOrders();

      // Znajdź klienta
      const client = clients.find(c => c.id === id);
      if (!client) {
        console.log('❌ Client not found:', id);
        return res.status(404).json({ message: 'Klient nie znaleziony' });
      }

      // Znajdź zamówienie dla tego klienta
      const clientOrders = orders.filter(o => o.clientId === id);
      const mainOrder = clientOrders[0];

      // Aktualizuj dane klienta
      const updatedClient = {
        ...client,
        name: updateData.name || client.name,
        phone: updateData.phone || client.phone,
        email: updateData.email || client.email,
        address: updateData.address || client.address,
        city: updateData.city || client.city,
        street: updateData.street || client.street,
        postalCode: updateData.postalCode || client.postalCode,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      };

      await updateClient(updatedClient);
      console.log('✅ Client updated:', id);

      // Jeśli istnieje zamówienie, aktualizuj je
      if (mainOrder) {
        const updatedOrder = {
          ...mainOrder,
          category: updateData.category || mainOrder.category,
          description: updateData.description || mainOrder.description,
          status: updateData.status || mainOrder.status,
          scheduledDate: updateData.date || mainOrder.scheduledDate,
          scheduledTime: updateData.time || mainOrder.scheduledTime,
          notes: updateData.notes || mainOrder.notes,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin'
        };

        await updateOrder(updatedOrder);
        console.log('✅ Order updated:', mainOrder.orderNumber);
      }

      return res.status(200).json({ 
        message: 'Rezerwacja zaktualizowana', 
        data: { ...updatedClient, ...updateData } 
      });

    } catch (error) {
      console.error('❌ Error updating client/order:', error);
      return res.status(500).json({ message: 'Błąd aktualizacji danych' });
    }
  }

  if (req.method === 'DELETE') {
    console.log('📞 API DELETE /api/rezerwacje - usuwanie rezerwacji');
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Brak ID rezerwacji' });
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('rezerwacje')
          .delete()
          .eq('id', id);

        if (!error) {
          console.log('✅ Rezerwacja usunięta z Supabase');
          return res.status(200).json({ message: 'Rezerwacja usunięta' });
        } else {
          console.log('❌ Supabase delete error:', error);
        }
      } catch (error) {
        console.error('❌ Supabase delete error:', error);
      }
    }

    // Główne źródło danych: klienci + zamówienia
    try {
      const clients = await readClients();
      const orders = await readOrders();

      // Znajdź klienta
      const client = clients.find(c => c.id === id);
      if (!client) {
        console.log('❌ Client not found:', id);
        return res.status(404).json({ message: 'Klient nie znaleziony' });
      }

      // Znajdź wszystkie zamówienia dla tego klienta
      const clientOrders = orders.filter(o => o.clientId === id);

      // Usuń wszystkie zamówienia
      for (const order of clientOrders) {
        await deleteOrder(order.id);
        console.log('✅ Order deleted:', order.orderNumber);
      }

      // Usuń klienta
      await deleteClient(id);
      console.log('✅ Client deleted:', id);

      return res.status(200).json({ message: 'Rezerwacja usunięta' });

    } catch (error) {
      console.error('❌ Error deleting client/orders:', error);
      return res.status(500).json({ message: 'Błąd usuwania danych' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
