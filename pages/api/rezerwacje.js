
import { createClient } from '@supabase/supabase-js';
import { readReservations, addReservation, updateReservation } from '../../utils/dataStorage';
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
import { apiLogger, logger } from '../../utils/logger';

// Tymczasowe przechowywanie danych w pamięci do testów (fallback)
let tempStorage = [];

// Spróbuj skonfigurować Supabase
let supabase = null;
try {
  const supabaseUrl = (process.env.SUPABASE_URL_CLEAN || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  
  console.log('🔍🔍🔍 Checking Supabase config:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 50) : 'MISSING',
    keyPreview: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING',
    urlCheck: supabaseUrl ? !supabaseUrl.includes('twoj-projekt') : false,
    keyCheck: supabaseKey ? !supabaseKey.includes('wtetrtvtblzkguoxfumx') : false
  });
  
  if (supabaseUrl && supabaseKey &&
    !supabaseUrl.includes('twoj-projekt') &&
    !supabaseKey.includes('wtetrtvtblzkguoxfumx')) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅✅✅ Supabase client created successfully!');
  } else {
    console.warn('⚠️⚠️⚠️ Supabase not configured - using fallback storage');
    if (!supabaseUrl) console.warn('  - Missing URL');
    if (!supabaseKey) console.warn('  - Missing KEY');
    if (supabaseUrl && supabaseUrl.includes('twoj-projekt')) console.warn('  - URL contains placeholder');
    if (supabaseKey && supabaseKey.includes('wtetrtvtblzkguoxfumx')) console.warn('  - KEY contains placeholder');
  }
} catch (error) {
  console.error('❌ Supabase initialization error:', error);
}

export default async function handler(req, res) {
  // 🚨 DEBUG: Sprawdź czy Supabase jest zainicjalizowany
  console.log('🔥🔥🔥 HANDLER START - supabase is:', supabase ? 'INITIALIZED' : 'NULL');
  
  if (req.method === 'POST') {
    

    const { name, phone, email, city, street, fullAddress, address, category, device, problem, date, availability } = req.body;

    // Podstawowa walidacja - tylko name i phone są wymagane
    if (!name || !phone) {
      
      return res.status(400).json({ message: 'Brak wymaganych danych: nazwa i telefon' });
    }

    // Sprawdź czy mamy adres w jakiejkolwiek formie
    const finalAddress = address || fullAddress || (street && city ? `${street}, ${city}` : null);
    if (!finalAddress) {
      
      return res.status(400).json({ message: 'Brak adresu - podaj pełny adres lub miasto i ulicę' });
    }

    

    let newReservation = {
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
      status: 'pending', // ✅ Dodaj domyślny status
      // 🌍 WSPÓŁRZĘDNE GPS z geocodingu
      clientLocation: req.body.clientLocation || null,
      postalCode: req.body.postalCode || '',
      // ✅ Dodaj userId i isAuthenticated
      userId: req.body.userId || null,
      isAuthenticated: req.body.isAuthenticated || false,
      // Przekaż wszystkie dodatkowe pola z formularza
      ...req.body
    };

    

    // Deklaruj zmienne na wyższym poziomie (dostępne w całym handlerze)
    let newClient = null;
    let newOrder = null;
    let clientData = null;
    let orderData = null;

    try {
      // ✅ NOWE: Sprawdź czy klient już istnieje (zapobieganie duplikatom)
      const { isLoggedIn, userId, clientPhone } = req.body;
      const clients = await readClients();
      let existingClient = null;

      

      // Priorytet 1: Zalogowany użytkownik - szukaj po userId
      if (isLoggedIn && userId) {
        existingClient = clients.find(c => c.userId === userId);
        if (existingClient) {
          
        }
      }

      // Priorytet 2: Nie znaleziono po userId - szukaj po numerze telefonu
      if (!existingClient && clientPhone) {
        const normalizedPhone = clientPhone.replace(/\s+/g, '').replace(/\+48/, '');
        existingClient = clients.find(c => {
          const clientMainPhone = (c.phone || '').replace(/\s+/g, '').replace(/\+48/, '');
          const hasMatchingPhone = c.phones?.some(p => {
            const phoneNum = (p.number || '').replace(/\s+/g, '').replace(/\+48/, '');
            return phoneNum === normalizedPhone;
          });
          return clientMainPhone === normalizedPhone || hasMatchingPhone;
        });
        if (existingClient) {
          
        }
      }

      // Jeśli klient istnieje - użyj jego danych
      if (existingClient) {
        newClient = existingClient;
        
      } else {
        // Klient nie istnieje - utwórz nowego
        

        // Konwertuj na format klient + zamówienie
        const converted = await convertReservationToClientOrder({
          ...newReservation,
          clientName: name,
          clientPhone: phone,
          serviceType: device,
          description: problem,
          scheduledDate: date,
          availability: availability, // Pass availability to conversion
          // ✅ Przekaż userId do konwersji
          userId: newReservation.userId,
          isAuthenticated: newReservation.isAuthenticated,
          // Przekaż tablice z multi-item danych
          phones: req.body.phones || [],
          addresses: req.body.addresses || [],
          devices: req.body.devices || []
        });

        clientData = converted.client;
        orderData = converted.order;

        
        

        // Dodaj klienta
        newClient = await addClient(clientData);
      }

      // Jeśli nie mamy orderData (bo użyliśmy istniejącego klienta), konwertuj teraz
      if (!orderData) {
        const converted = await convertReservationToClientOrder({
          ...newReservation,
          clientName: name,
          clientPhone: phone,
          serviceType: device,
          description: problem,
          scheduledDate: date,
          availability: availability,
          userId: newReservation.userId,
          isAuthenticated: newReservation.isAuthenticated,
          phones: req.body.phones || [],
          addresses: req.body.addresses || [],
          devices: req.body.devices || []
        });
        orderData = converted.order;
      }
      if (newClient) {
        
        
        // Utwórz notyfikację o nowym kliencie
        await createNotification(NotificationTemplates.newClient(newClient.name));

        // ✅ TWÓRZ ZLECENIE od razu przy POST (user dostaje numer natychmiast)
        // ZABEZPIECZENIE: źródło 'W' (web) + zapisany reservationId zapobiega duplikatom
        try {
          
          
          newOrder = await addOrder(orderData, {
            source: 'W', // Web submission - UNIKALNY źródłowy kod
            sourceDetails: `Web reservation ${newReservation.id}`,
            createdBy: 'web-form',
            createdByName: 'Formularz WWW',
            userId: newReservation.userId,
            isUserCreated: !!newReservation.isAuthenticated,
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
          });

          if (newOrder) {
            
            // Zapisz powiązanie rezerwacja → zlecenie
            newReservation.orderId = newOrder.id;
            newReservation.orderNumber = newOrder.orderNumber;
          } else {
            console.error('❌ addOrder returned null - zlecenie nie zostało utworzone');
          }
        } catch (orderError) {
          console.error('❌ Błąd tworzenia zlecenia:', orderError);
          // Nie przerywaj - rezerwacja jest OK, zlecenie można utworzyć później
        }
      } else {
        console.error('❌ Client creation returned null/undefined');
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
      // Usuń id - Supabase wygeneruje auto-increment
      const { id: _removedId, ...reservationForSupabase } = newReservation;
      
      console.log('�🚀🚀 === SUPABASE INSERT START ===');
      console.log('�📤 Klucze do wysłania:', Object.keys(reservationForSupabase).join(', '));
      console.log('📤 Przykładowe dane:', JSON.stringify({
        name: reservationForSupabase.name,
        phone: reservationForSupabase.phone,
        email: reservationForSupabase.email
      }));
      
      const { data: insertData, error } = await supabase.from('rezerwacje').insert([reservationForSupabase]).select();
      
      console.log('📥 Supabase response - error:', error ? 'YES' : 'NO');
      console.log('📥 Supabase response - data:', insertData ? `Array[${insertData.length}]` : 'NULL');
      
      if (error) {
        console.error('❌❌❌ SUPABASE ERROR:', JSON.stringify(error, null, 2));
        // Fallback do pliku JSON
        const savedReservation = addReservation(newReservation);
        if (!savedReservation) {
          // Ostateczny fallback do pamięci
          tempStorage.push(newReservation);
        }
      } else if (insertData && insertData[0]) {
        console.log('✅✅✅ Supabase zwrócił ID:', insertData[0].id);
        // Zaktualizuj newReservation z danymi z Supabase (zawiera ID!)
        Object.assign(newReservation, insertData[0]);
        console.log('✅ newReservation.id PO UPDATE:', newReservation.id);
      } else {
        console.log('⚠️⚠️⚠️ Supabase nie zwrócił danych!');
      }
      console.log('🏁🏁🏁 === SUPABASE INSERT END ===');
    } else {
      // Użyj trwałego przechowywania w pliku JSON
      const savedReservation = addReservation(newReservation);
      if (savedReservation) {
        
      } else {
        // Fallback do pamięci
        tempStorage.push(newReservation);
        
      }
    }

    // Wyślij email jeśli skonfigurowane
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('twoj_resend_api_key')) {
      try {
        

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
    
    const { id } = req.query;

    if (supabase) {
      try {
        
        
        // Jeśli podano ID, pobierz pojedynczą rezerwację
        if (id) {
          const { data, error } = await supabase.from('rezerwacje').select('*').eq('id', id).single();
          if (!error && data) {
            
            return res.status(200).json(data);
          } else if (error) {
            
          }
        } else {
          // Pobierz wszystkie rezerwacje
          const { data, error } = await supabase.from('rezerwacje').select('*').order('date', { ascending: true });
          if (!error) {
            console.log(`✅ Loaded ${data.length} reservations from Supabase`);
            return res.status(200).json({ rezerwacje: data });
          } else {
            console.error('❌ Supabase GET error:', error);
          }
        }
      } catch (error) {
        console.error('❌ Supabase fetch error:', error);
      }
      
      // Jeśli Supabase jest skonfigurowane ale wystąpił błąd, zwróć pustą tablicę
      // (nie próbuj filesystem na Vercel)
      if (supabase) {
        console.log('⚠️ Supabase error, returning empty array (no filesystem on Vercel)');
        return res.status(200).json({ rezerwacje: [] });
      }
    }

    // Fallback: tylko lokalnie - próbuj odczytać z pliku JSON
    try {
      const reservations = readReservations();
      

      // Jeśli szukamy konkretnej rezerwacji po ID
      if (id) {
        // Porównuj zarówno jako string jak i jako number
        const singleReservation = reservations.find(r => 
          r.id === id || r.id === Number(id) || String(r.id) === String(id)
        );
        if (singleReservation) {
          
          // Przekształć na format zgodny z formularzem
          return res.status(200).json({
            ...singleReservation,
            name: singleReservation.name || singleReservation.clientName,
            phone: singleReservation.phone || singleReservation.clientPhone,
            email: singleReservation.email || singleReservation.clientEmail,
            address: singleReservation.address || singleReservation.clientAddress,
            city: singleReservation.city || '',
            postalCode: singleReservation.postalCode || '',
            category: singleReservation.category || singleReservation.deviceType || singleReservation.device,
            description: singleReservation.description || singleReservation.problem || singleReservation.issueDescription,
            date: singleReservation.date || singleReservation.scheduledDate || singleReservation.preferredDate,
            time: singleReservation.time || singleReservation.scheduledTime || singleReservation.preferredTime,
            status: singleReservation.status || 'pending',
            notes: singleReservation.notes || ''
          });
        }
      }

      // Zwróć wszystkie rezerwacje - jako tablicę (nie obiekt)
      
      return res.status(200).json(reservations);
    } catch (error) {
      console.error('❌ Error reading reservations:', error);
    }

    // Fallback: klienci + zamówienia
    try {
      const clients = await readClients();
      const orders = await readOrders();

      

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
        // Porównuj zarówno jako string jak i jako number
        const singleReservation = combinedReservations.find(r => 
          r.id === id || r.id === Number(id) || String(r.id) === String(id)
        );
        if (singleReservation) {
          
          return res.status(200).json(singleReservation);
        } else {
          
          return res.status(404).json({ message: 'Rezerwacja nie znaleziona' });
        }
      }

      if (combinedReservations.length > 0) {
        
        return res.status(200).json({ rezerwacje: combinedReservations });
      }
    } catch (error) {
      console.error('❌ Error reading clients/orders:', error);
    }

    // Fallback do pamięci
    
    
    return res.status(200).json({ rezerwacje: tempStorage });
  }

  if (req.method === 'PUT') {
    
    const { id, orderId, orderNumber, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Brak ID rezerwacji' });
    }

    
    

    // Najpierw spróbuj zaktualizować jako rezerwację (numeric ID)
    try {
      const reservations = readReservations();
      const reservationIndex = reservations.findIndex(r => 
        r.id === id || r.id === Number(id) || String(r.id) === String(id)
      );

      if (reservationIndex !== -1) {
        // Znaleziono rezerwację - aktualizuj ją
        
        const reservation = reservations[reservationIndex];
        
        // Sprawdź czy zmiana statusu na "contacted" - TYLKO AKTUALIZUJ powiązania
        if (updateData.status === 'contacted' && reservation.status !== 'contacted') {
          
          
          try {
            // Sprawdź czy zamówienie już istnieje (utworzone przy POST)
            const orders = await readOrders();
            
            // Szukaj zamówienia po: orderNumber z rezerwacji LUB po ID rezerwacji
            let existingOrder = null;
            
            if (reservation.orderNumber) {
              existingOrder = orders.find(o => o.orderNumber === reservation.orderNumber);
            }
            
            if (!existingOrder) {
              existingOrder = orders.find(o => 
                o.originalReservationId === reservation.id || 
                o.reservationId === reservation.id
              );
            }
            
            if (existingOrder) {
              
              
              // ✅ FIX: Aktualizuj ZARÓWNO rezerwację JAK I zamówienie!
              const result = updateReservation(reservation.id, {
                ...updateData,
                orderId: existingOrder.id,
                orderNumber: existingOrder.orderNumber,
                clientId: reservation.clientId || existingOrder.clientId,
                convertedToOrder: true,
                convertedAt: existingOrder.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: 'admin'
              });
              
              // ✅ NOWE: Synchronizuj status z zamówieniem
              if (updateData.status) {
                
                const updatedOrder = await updateOrder({
                  ...existingOrder,
                  status: updateData.status,
                  updatedAt: new Date().toISOString(),
                  updatedBy: 'admin_reservation'
                });
                
              }
              
              
              return res.status(200).json({ 
                message: 'Status zaktualizowany - rezerwacja i zlecenie zsynchronizowane', 
                data: result,
                order: existingOrder
              });
            }
            
            // FALLBACK: Jeśli zamówienie nie istnieje (stare rezerwacje), utwórz teraz
            
            
            // Przygotuj dane rezerwacji do konwersji
            const reservationToConvert = {
              ...reservation,
              ...updateData
            };
            
            // Konwertuj rezerwację na klienta i zamówienie
            const converted = await convertReservationToClientOrder(reservationToConvert);
            let clientData = converted.client;
            let orderData = converted.order;
            
            // Sprawdź czy klient już istnieje (po telefonie lub emailu)
            const clients = await readClients();
            let existingClient = null;
            
            if (clientData.phone) {
              existingClient = clients.find(c => c.phone === clientData.phone);
            }
            
            if (!existingClient && clientData.email) {
              existingClient = clients.find(c => c.email === clientData.email);
            }
            
            let clientId;
            let client;
            
            if (existingClient) {
              
              clientId = existingClient.id;
              client = existingClient;
              
              // Aktualizuj dane istniejącego klienta
              const updatedClient = {
                ...existingClient,
                ...clientData,
                id: existingClient.id, // Zachowaj oryginalny ID
                updatedAt: new Date().toISOString()
              };
              await updateClient(updatedClient);
            } else {
              // Dodaj metadane o źródle
              clientData.source = 'reservation_conversion';
              clientData.createdBy = 'admin';
              clientData.originalReservationId = reservation.id;
              
              // Utwórz nowego klienta
              const newClient = await addClient(clientData);
              clientId = newClient.id;
              client = newClient;
              
            }
            
            // Połącz zamówienie z klientem
            orderData.clientId = clientId;
            orderData.source = 'Z'; // Reservation conversion - UNIKALNY kod
            orderData.originalReservationId = reservation.id;
            orderData.reservationId = reservation.id;
            orderData.createdBy = 'admin';
            orderData.createdFrom = 'reservation';
            
            // Utwórz zamówienie (FALLBACK dla starych rezerwacji)
            const newOrder = await addOrder(orderData, {
              source: 'Z',
              sourceDetails: `Legacy reservation ${reservation.id} converted`,
              createdBy: 'admin',
              createdByName: 'Admin Panel'
            });
            
            
            // ✅ FIX: Aktualizuj rezerwację ze statusem i numerem zamówienia
            const result = updateReservation(reservation.id, {
              ...updateData,
              orderId: newOrder.id,
              orderNumber: newOrder.orderNumber,
              clientId: clientId,
              convertedToOrder: true,
              convertedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              updatedBy: 'admin'
            });
            
            
            
            
            return res.status(200).json({ 
              message: 'Rezerwacja przekonwertowana na zlecenie', 
              data: result,
              client: client,
              order: newOrder
            });
          } catch (conversionError) {
            console.error('❌ Error converting reservation to order:', conversionError);
            // Kontynuuj z normalną aktualizacją jeśli konwersja się nie powiodła
          }
        }
        
        // Standardowa aktualizacja rezerwacji
        const result = updateReservation(reservation.id, {
          ...updateData,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin'
        });

        if (result) {
          
          return res.status(200).json({ 
            message: 'Rezerwacja zaktualizowana', 
            data: result 
          });
        }
      }
    } catch (error) {
      console.error('❌ Error updating reservation:', error);
      // Continue to try client/order update
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
          
          return res.status(200).json({ message: 'Rezerwacja zaktualizowana', data });
        } else {
          
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
          
          return res.status(200).json({ message: 'Rezerwacja usunięta' });
        } else {
          
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
        
        return res.status(404).json({ message: 'Klient nie znaleziony' });
      }

      // Znajdź wszystkie zamówienia dla tego klienta
      const clientOrders = orders.filter(o => o.clientId === id);

      // Usuń wszystkie zamówienia
      for (const order of clientOrders) {
        await deleteOrder(order.id);
        
      }

      // Usuń klienta
      await deleteClient(id);
      

      return res.status(200).json({ message: 'Rezerwacja usunięta' });

    } catch (error) {
      console.error('❌ Error deleting client/orders:', error);
      return res.status(500).json({ message: 'Błąd usuwania danych' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}


