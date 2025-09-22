// test-api-direct.js
// Bezpośredni test nowego systemu klient+zamówienie

const { readClients, readOrders, addClient, addOrder, convertReservationToClientOrder } = require('./utils/clientOrderStorage');

console.log('🧪 Test bezpośredniego zapisu klienta');

// Test danych 
const testClientData = {
    name: 'Test Klient',
    phone: '123-456-789',
    email: 'test@example.com',
    address: 'ul. Testowa 123, Warszawa',
    city: 'Warszawa',
    street: 'ul. Testowa 123'
};

console.log('📝 Dodawanie testowego klienta...');
const newClient = addClient(testClientData);

if (newClient) {
    console.log('✅ Klient dodany:', newClient.id, '-', newClient.name);

    // Dodaj zamówienie dla tego klienta
    const orderData = {
        clientId: newClient.id,
        category: 'naprawa',
        serviceType: 'laptop',
        description: 'Test naprawy',
        status: 'pending',
        priority: 'normal'
    };

    const newOrder = addOrder(orderData);

    if (newOrder) {
        console.log('✅ Zamówienie dodane:', newOrder.id, 'dla klienta', newClient.id);
    }

    // Sprawdź co mamy w plikach
    const allClients = readClients();
    const allOrders = readOrders();

    console.log('📊 Podsumowanie:');
    console.log('   Klienci:', allClients.length);
    console.log('   Zamówienia:', allOrders.length);

    console.log('\n🧪 Test konwersji z formularza rezerwacji...');

    const formData = {
        name: 'Klient z formularza',
        phone: '987-654-321',
        email: 'forma@example.com',
        address: 'ul. Formularzowa 456, Kraków',
        category: 'serwis',
        device: 'telefon',
        problem: 'Nie działa ekran'
    };

    const { client, order } = convertReservationToClientOrder(formData);
    console.log('✅ Konwersja zakończona:');
    console.log('   Klient:', client.name, client.phone);
    console.log('   Zamówienie:', order.serviceType, order.description);

} else {
    console.log('❌ Błąd dodawania klienta');
}
