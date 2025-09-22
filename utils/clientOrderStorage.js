// utils/clientOrderStorage.js
// System przechowywania danych zgodny z aplikacją mobilną (ClientsContext + OrdersContext)

import fs from 'fs';
import path from 'path';

const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');
const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

// Upewnij się, że folder data istnieje
const ensureDataDir = () => {
    const dataDir = path.dirname(CLIENTS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

// === KLIENCI ===

// Odczytaj klientów z pliku
export const readClients = () => {
    try {
        ensureDataDir();
        if (!fs.existsSync(CLIENTS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Błąd odczytu klientów:', error);
        return [];
    }
};

// Zapisz klientów do pliku
export const writeClients = (clients) => {
    try {
        ensureDataDir();
        fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
        return true;
    } catch (error) {
        console.error('Błąd zapisu klientów:', error);
        return false;
    }
};

// Dodaj nowego klienta (zgodnie z ClientsContext.addClient)
export const addClient = (clientData) => {
    try {
        const clients = readClients();
        const newId = `#${(clients.length + 1).toString().padStart(4, '0')}`;
        const now = new Date().toISOString();

        const newClient = {
            ...clientData,
            id: newId,
            dateAdded: now,
            history: clientData.history || []
        };

        clients.push(newClient);
        writeClients(clients);

        console.log('✅ Client added:', { id: newClient.id, name: newClient.name });
        return newClient;
    } catch (error) {
        console.error('Błąd dodawania klienta:', error);
        return null;
    }
};

// Aktualizuj klienta
export const updateClient = (updatedClient) => {
    try {
        const clients = readClients();
        const index = clients.findIndex(c => c.id === updatedClient.id);
        if (index !== -1) {
            clients[index] = updatedClient;
            writeClients(clients);
            return updatedClient;
        }
        return null;
    } catch (error) {
        console.error('Błąd aktualizacji klienta:', error);
        return null;
    }
};

// Usuń klienta
export const deleteClient = (clientId) => {
    try {
        const clients = readClients();
        const filteredClients = clients.filter(c => c.id !== clientId);
        writeClients(filteredClients);
        return true;
    } catch (error) {
        console.error('Błąd usuwania klienta:', error);
        return false;
    }
};

// Dodaj kontakt z klientem do historii
export const logClientContact = (clientId, type, source = 'WebApp') => {
    try {
        const clients = readClients();
        const clientIndex = clients.findIndex(c => c.id === clientId);
        if (clientIndex === -1) return null;

        const icons = {
            call: '📞',
            sms: '✉️',
            email: '📧',
        };

        const newEntry = {
            date: new Date().toISOString(),
            note: `${icons[type] || '📍'} ${type.toUpperCase()} z ekranu ${source}`,
        };

        clients[clientIndex].history = [...(clients[clientIndex].history || []), newEntry];
        writeClients(clients);

        return clients[clientIndex];
    } catch (error) {
        console.error('Błąd dodawania kontaktu do historii:', error);
        return null;
    }
};

// === ZAMÓWIENIA ===

const DEFAULT_BUILTIN_OPTIONS = {
    demontaz: false,
    montaz: false,
    trudna: false,
    wolnostojacy: false,
    ograniczony: false,
    front: false,
    czas: false,
};

// Odczytaj zamówienia z pliku
export const readOrders = () => {
    try {
        ensureDataDir();
        if (!fs.existsSync(ORDERS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(ORDERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Błąd odczytu zamówień:', error);
        return [];
    }
};

// Zapisz zamówienia do pliku
export const writeOrders = (orders) => {
    try {
        ensureDataDir();
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        return true;
    } catch (error) {
        console.error('Błąd zapisu zamówień:', error);
        return false;
    }
};

// Dodaj nowe zamówienie (zgodnie z OrdersContext.addOrder)
export const addOrder = (newOrder) => {
    try {
        const orders = readOrders();

        // Zapewnij spójność devices i builtInParams
        const devices = Array.isArray(newOrder.devices)
            ? newOrder.devices.map(d => ({
                ...d,
                builtInParams: {
                    ...DEFAULT_BUILTIN_OPTIONS,
                    ...(d.builtInParams || {}),
                },
                builtInParamsNotes: d.builtInParamsNotes || {},
            }))
            : [];

        const orderToAdd = {
            ...newOrder,
            id: newOrder.id || Date.now(),
            devices,
            builtInParams: devices[0]?.builtInParams || { ...DEFAULT_BUILTIN_OPTIONS },
            dateAdded: new Date().toISOString()
        };

        orders.push(orderToAdd);
        writeOrders(orders);

        console.log('✅ Order added:', { id: orderToAdd.id, devicesCount: devices.length });
        return orderToAdd;
    } catch (error) {
        console.error('Błąd dodawania zamówienia:', error);
        return null;
    }
};

// Patch zamówienia (zgodnie z OrdersContext.patchOrder)
export const patchOrder = (id, patch) => {
    try {
        const orders = readOrders();
        const orderIndex = orders.findIndex(order => String(order.id) === String(id));

        if (orderIndex === -1) return null;

        const merged = {
            ...orders[orderIndex],
            ...patch,
            dates: patch.dates ? patch.dates : orders[orderIndex].dates,
            hours: patch.hours !== undefined ? patch.hours : orders[orderIndex].hours,
            end: patch.end !== undefined ? patch.end : orders[orderIndex].end,
        };

        if (patch.dates) merged.dates = [...patch.dates];

        orders[orderIndex] = merged;
        writeOrders(orders);

        console.log('✅ Order patched:', { id: merged.id });
        return merged;
    } catch (error) {
        console.error('Błąd aktualizacji zamówienia:', error);
        return null;
    }
};

// Aktualizuj zamówienie
export const updateOrder = (updatedOrder) => {
    try {
        const orders = readOrders();
        const index = orders.findIndex(order => order.id === updatedOrder.id);
        if (index !== -1) {
            orders[index] = updatedOrder;
            writeOrders(orders);
            return updatedOrder;
        }
        return null;
    } catch (error) {
        console.error('Błąd aktualizacji zamówienia:', error);
        return null;
    }
};

// Usuń zamówienie
export const deleteOrder = (orderId) => {
    try {
        const orders = readOrders();
        const filteredOrders = orders.filter(order => order.id !== orderId);
        writeOrders(filteredOrders);
        return true;
    } catch (error) {
        console.error('Błąd usuwania zamówienia:', error);
        return false;
    }
};

// === KONWERSJA DANYCH ===

// Konwertuj dane z formularza rezerwacji na format klienta + zamówienia
export const convertReservationToClientOrder = (reservationData) => {
    const now = new Date().toISOString();

    // Stwórz klienta
    const client = {
        name: reservationData.name || reservationData.clientName,
        phone: reservationData.phone || reservationData.clientPhone,
        email: reservationData.email,
        address: reservationData.address || reservationData.fullAddress,
        city: reservationData.city,
        street: reservationData.street,
        dateAdded: now,
        history: []
    };

    // Stwórz zamówienie
    const order = {
        clientId: null, // zostanie ustawione po dodaniu klienta
        category: reservationData.category,
        serviceType: reservationData.serviceType || reservationData.device,
        description: reservationData.problem || reservationData.description,
        scheduledDate: reservationData.date || reservationData.scheduledDate,
        scheduledTime: reservationData.scheduledTime,
        availability: reservationData.availability || 'Nie określono', // Client availability info
        status: reservationData.status || 'pending',
        priority: reservationData.priority || 'normal',
        devices: [{
            name: reservationData.device || reservationData.serviceType,
            description: reservationData.problem || reservationData.description,
            builtInParams: { ...DEFAULT_BUILTIN_OPTIONS },
            builtInParamsNotes: {}
        }],
        builtInParams: { ...DEFAULT_BUILTIN_OPTIONS },
        dates: reservationData.scheduledDate ? [reservationData.scheduledDate] : [],
        hours: null,
        end: null
    };

    return { client, order };
};
